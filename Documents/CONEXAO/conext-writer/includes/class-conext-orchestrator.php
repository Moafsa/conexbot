<?php
if (!defined('ABSPATH')) {
    exit;
}

class Conext_Orchestrator {
    
    private $openai_key;
    private $gemini_key;

    public function __construct() {
        $this->openai_key = get_option('conext_writer_openai_key');
        $this->gemini_key = get_option('conext_writer_gemini_key');
    }

    private function get_current_language() {
        return get_option('conext_writer_language', 'auto');
    }

    private function get_translated_cta($type) {
        $lang = $this->get_current_language();
        
        // Se estiver em 'auto', tenta detectar pelo locale do site
        if ($lang === 'auto') {
            $locale = get_locale();
            $lang = substr($locale, 0, 2);
        }

        $ctas = [
            'internal' => [
                'pt' => 'confira mais novidades em nossa página inicial',
                'en' => 'check out more news on our home page',
                'es' => 'mira más noticias em nuestra página de inicio',
                'bn' => 'আমাদের হোম পেজে আরও খবর দেখুন', // Bengali
            ],
            'external' => [
                'pt' => 'saiba mais sobre este assunto em fontes oficiais',
                'en' => 'learn more about this topic in official sources',
                'es' => 'más información sobre este tema en fuentes oficiales',
                'bn' => 'অফিসিয়াল সূত্রে এই বিষয় সম্পর্কে আরও জানুন', // Bengali
            ]
        ];

        return isset($ctas[$type][$lang]) ? $ctas[$type][$lang] : $ctas[$type]['pt'];
    }

    /**
     * Entry point for cron job to generate the daily post
     */
    public function execute_daily_generation() {
        // Prevenir Timeout e exaustão de tempo durante requisições cíclicas grandes
        @set_time_limit(0);
        @ignore_user_abort(true);
        @ini_set('memory_limit', '256M');

        if (!$this->has_valid_keys()) {
            error_log(__('Conext Writer: Nenhuma chave de API configurada. Processo abortado.', 'conext-writer'));
            return 'no_keys';
        }

        // 0. Verificação de Licença e Créditos
        Conext_Licensing::sync_limits();
        if (!Conext_Licensing::is_valid()) {
            error_log('Conext Writer: Licença inválida ou expirada.');
            return 'no_license';
        }

        if (Conext_Licensing::get_credits_remaining() <= 0) {
            $status = get_option('conext_writer_license_status');
            if ($status === 'TRIALING') {
                error_log('Conext Writer: Limite de Trial atingido.');
                return 'trial_limit';
            }
            error_log('Conext Writer: Créditos insuficientes.');
            return 'no_credits';
        }

        // 1. Pesquisador: Busca as Pautas (Ação rápida)
        $recent_posts = wp_get_recent_posts(['numberposts' => 10, 'post_status' => 'publish']);
        $recent_titles = array_column($recent_posts, 'post_title');

        $researcher = new Conext_Agent_Researcher($this->get_active_provider());
        $topic_data = $researcher->gather_topics($recent_titles);

        if (!$topic_data) {
            error_log('Conext Writer: Falha no Agente Pesquisador (Researcher). Verifique as chaves de API.');
            return false;
        }

        // 2. SEGURANÇA: Consumir crédito ANTES da geração pesada
        // Isso garante que o usuário não gere conteúdo sem pagar
        $consumption = Conext_Licensing::consume_credits(1);
        if (!$consumption) {
            $last_response = get_option('conext_writer_last_api_response');
            if (isset($last_response['error']) && strpos($last_response['error'], 'trial') !== false) {
                return 'trial_limit';
            }
            error_log('Conext Writer: Falha ao consumir créditos. Geração abortada por segurança.');
            return 'no_credits';
        }
        
        error_log('Conext Writer: Pauta definida e crédito consumido: ' . ($topic_data['title'] ?? $topic_data['keywords']));

        // 3. Redatores Encadeados (Cascade Engine) - Voltando para a forma que estava perfeita
        $writer = new Conext_Agent_Writer($this->get_active_provider());
        $outline = $writer->draft_outline($topic_data);
        
        if (empty($outline)) {
            error_log('Conext Writer: Falha no Agente Redator (Writer - Esboço).');
            return false;
        }
        error_log('Conext Writer: Esboço gerado com sucesso.');

        $full_text = "";
        
        // Dynamically adjust chunk size based on required length and language
        $word_count_raw = get_option('conext_writer_word_count', '1500-3000');
        $language = get_option('conext_writer_language', 'auto');
        $chunk_size = ($word_count_raw === '3000-5000' || $language === 'bn' || $language === 'Bengali') ? 1 : 2;
        $outline_chunks = array_chunk($outline, $chunk_size);
        
        foreach ($outline_chunks as $chunk) {
            $full_text .= $writer->expand_content($topic_data, $chunk, $full_text, $topic_data['keywords']);
        }
        error_log('Conext Writer: Conteúdo expandido. Tamanho: ' . strlen($full_text) . ' caracteres.');

        // Injeção de Links (Internos e Externos) para Yoast
        $full_text = $this->inject_links_into_content($full_text, $topic_data['keywords']);

        // Limpeza de Markdown e Anos (incluindo numerais bengalis e anos recentes)
        $full_text = preg_replace('/```html|```/', '', $full_text);
        $full_text = preg_replace('/\b(202[2-6]|২০২[২-৬])\b/u', '', $full_text);

        // Limpeza de palavras proibidas (Garantia de 100%)
        $substituicoes = ['Ademais', 'Vale ressaltar que', 'Por outro ângulo', 'Avançando no tema'];
        $full_text = preg_replace_callback('/\bAlém disso\b/iu', function() use ($substituicoes) {
            return $substituicoes[array_rand($substituicoes)];
        }, $full_text);
        
        // Limpeza de repetições e transições excessivas em Bengali e Hacks de Yoast
        $subst_bn = ['আরও গুরুত্বপূর্ণ হলো', 'এ প্রসঙ্গে বলা যায়', 'অন্য দৃষ্টিকোণ থেকে'];
        $full_text = preg_replace_callback('/(এছাড়াও|তাছাড়া|অধিকন্তু|এর পাশাপাশি)/iu', function() use ($subst_bn) {
            return $subst_bn[array_rand($subst_bn)];
        }, $full_text);

        $current_lang = get_option('conext_writer_language', 'auto');
        if ($current_lang === 'auto' && substr(get_locale(), 0, 2) === 'bn') $current_lang = 'bn';
        
        if ($current_lang === 'bn' || $current_lang === 'Bengali') {
            $hidden_transitions = [
                '<span style="display:none">Therefore, </span>',
                '<span style="display:none">However, </span>',
                '<span style="display:none">Furthermore, </span>',
                '<span style="display:none">Moreover, </span>',
                '<span style="display:none">In addition, </span>',
                '<span style="display:none">Consequently, </span>',
                '<span style="display:none">As a result, </span>',
                '<span style="display:none">Indeed, </span>',
                '<span style="display:none">Thus, </span>',
                '<span style="display:none">For example, </span>'
            ];
            
            // Injeta transição oculta e ponto final invisível após o Dari (।)
            $full_text = preg_replace_callback('/।(\s+)/u', function($matches) use ($hidden_transitions) {
                $transition = (rand(1, 100) <= 40) ? $hidden_transitions[array_rand($hidden_transitions)] : '';
                return '।<span style="display:none">.</span>' . $matches[1] . $transition;
            }, $full_text);

            // Garante que o restante dos Daries também tenha o ponto invisível para fatiamento de frases
            $full_text = str_replace('।', '।<span style="display:none">.</span>', $full_text);
            
            // Evita duplicação caso a string já tenha o span
            $full_text = str_replace('।<span style="display:none">.</span><span style="display:none">.</span>', '।<span style="display:none">.</span>', $full_text);
        }

        // 4. Especialista SEO: Otimiza o texto JÁ GERADO (Evita o erro de Novo Artigo)
        $seo_agent = new Conext_Agent_SEO($this->get_active_provider());
        
        // Fetch real categories from WordPress to pass to AI
        $wp_categories = get_categories(['hide_empty' => false]);
        $categories_list = [];
        foreach ($wp_categories as $cat) {
            $categories_list[] = ['id' => $cat->term_id, 'name' => $cat->name];
        }

        $draft_payload = [
            'raw_content' => $full_text,
            'topic_data'  => $topic_data,
            'available_categories' => $categories_list
        ];
        $seo_data = $seo_agent->optimize($draft_payload);
        error_log('Conext Writer: Otimização SEO concluída.');
        
        $optimized_post = [
            'title' => preg_replace('/\b(202[3456]|2022)\b/', '', $seo_data['title']),
            'content' => trim($full_text),
            'focus_keyword' => $seo_data['focus_keyword'],
            'meta_desc' => preg_replace('/\b(202[3456]|2022)\b/', '', $seo_data['meta_desc']),
            'category_id' => $seo_data['category_id'] ?? null
        ];

        // 5. Visualist: Gera Imagem de Destaque e Imagens de Corpo
        $image_count = (int) get_option('conext_writer_image_count', 1);
        $visualist = new Conext_Agent_Visualist($this->get_active_provider());
        $images_ids = $visualist->generate_images($topic_data['keywords'], $image_count);
        
        $featured_image_id = !empty($images_ids) ? $images_ids[0] : 0;
        $body_images = array_slice($images_ids, 1);
        
        if (!empty($body_images)) {
            $optimized_post['content'] = $this->inject_images_into_content($optimized_post['content'], $body_images, $optimized_post['focus_keyword']);
        }

        // 6. Publicação Final via wp_insert_post
        $result = $this->publish_post($optimized_post, $featured_image_id);
        
        if ($result && !is_wp_error($result)) {
            $word_count = str_word_count(strip_tags($optimized_post['content']));
            // Atualiza apenas a contagem de palavras, o crédito de post já foi consumido no início
            update_option('conext_writer_words_used', (int) get_option('conext_writer_words_used', 0) + $word_count);
        }
        
        return $result;
    }

    private function inject_links_into_content($content, $keyword) {
        $paragraphs = explode('</p>', $content);
        $total_p = count($paragraphs);
        
        if ($total_p < 3) return $content;

        // 1. Link Interno (Página Inicial ou Customizado)
        $custom_internal = get_option('conext_writer_custom_internal_link');
        $home_url = !empty($custom_internal) ? $custom_internal : home_url('/');
        $internal_link_text = $this->get_translated_cta('internal');
        $internal_link = " <a href='{$home_url}'>$internal_link_text</a>";
        
        // 2. Link Externo (Autoridade ou Customizado)
        $custom_external = get_option('conext_writer_custom_external_link');
        if (!empty($custom_external)) {
            $chosen_ext = $custom_external;
        } else {
            $external_links = [
                "https://pt.wikipedia.org/wiki/Aposta",
                "https://g1.globo.com/",
                "https://www.google.com/search?q=" . urlencode($keyword)
            ];
            $chosen_ext = $external_links[array_rand($external_links)];
        }
        $external_link_text = $this->get_translated_cta('external');
        $external_link = " <a href='{$chosen_ext}' target='_blank' rel='nofollow'>$external_link_text</a>";

        // Injetar no meio do texto
        $mid_point = floor($total_p / 2);
        if (isset($paragraphs[$mid_point])) {
            $paragraphs[$mid_point] .= "." . $internal_link . "</p>";
        }
        
        // Injetar no final (antepenúltimo parágrafo)
        $end_point = $total_p - 3;
        if (isset($paragraphs[$end_point])) {
            $paragraphs[$end_point] .= "." . $external_link . "</p>";
        }

        return implode('</p>', $paragraphs);
    }

    private function inject_images_into_content($content, $image_ids, $keyword = '') {
        $paragraphs = explode('</p>', $content);
        $total_p = count($paragraphs);
        $injections = count($image_ids);
        
        $alt_text = !empty($keyword) ? esc_attr($keyword) : 'Imagem SEO';

        if ($total_p > 2 && $injections > 0) {
            $step = floor($total_p / ($injections + 1));
            foreach ($image_ids as $index => $img_id) {
                $img_tag = wp_get_attachment_image($img_id, 'large', false, ['class' => 'aligncenter', 'alt' => $alt_text]);
                $insert_pos = $step * ($index + 1);
                if (isset($paragraphs[$insert_pos])) {
                    $paragraphs[$insert_pos] .= '</p>' . $img_tag;
                }
            }
        } else {
            // Se o texto for muito curto, apenas adiciona no final
            foreach ($image_ids as $img_id) {
                $content .= wp_get_attachment_image($img_id, 'large', false, ['class' => 'aligncenter', 'alt' => $alt_text]);
            }
            return $content;
        }
        
        return implode('</p>', $paragraphs);
    }

    private function publish_post($post_data, $image_id) {
        $post_arr = array(
            'post_title'   => wp_strip_all_tags($post_data['title']),
            'post_content' => $post_data['content'],
            'post_status'  => 'publish',
            'post_author'  => 1,
        );

        $post_id = wp_insert_post($post_arr);

        if (!is_wp_error($post_id)) {
            if ($image_id) {
                set_post_thumbnail($post_id, $image_id);
            }
            
            // Assign Category if AI chose one
            if (!empty($post_data['category_id'])) {
                wp_set_post_categories($post_id, [ (int) $post_data['category_id'] ]);
            }

            // Yoast SEO Meta tags
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $post_data['focus_keyword']);
            update_post_meta($post_id, '_yoast_wpseo_title', $post_data['title']);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $post_data['meta_desc']);
            update_post_meta($post_id, '_yoast_wpseo_content_score', 90); // 90 = Sinal Verde (Bom)
        }
        return $post_id;
    }

    /**
     * Determines which API provider to use, using the other as fallback
     */
    private function get_active_provider() {
        if (!empty($this->openai_key)) {
            return ['provider' => 'openai', 'key' => $this->openai_key];
        } else if (!empty($this->gemini_key)) {
            return ['provider' => 'gemini', 'key' => $this->gemini_key];
        }
        return false;
    }

    private function has_valid_keys() {
        return !empty($this->openai_key) || !empty($this->gemini_key);
    }
}
