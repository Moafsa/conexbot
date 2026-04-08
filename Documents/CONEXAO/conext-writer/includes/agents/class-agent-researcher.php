<?php

if (!defined('ABSPATH')) {
    exit;
}

class Conext_Agent_Researcher {
    
    private $provider;
    private $sources;

    public function __construct($provider_config) {
        $this->provider = $provider_config;
        $this->sources = get_option('conext_writer_news_source');
    }

    public function gather_topics() {
        $do_random = get_option('conext_writer_topic_random');
        $do_products = get_option('conext_writer_topic_products');
        $search_terms = get_option('conext_writer_search_terms', '');
        
        // Evitar artigos duplicados injetando o contexto recente
        $site_name = get_bloginfo('name');
        $site_desc = get_bloginfo('description');
        $site_context = "CONTEXTO DO SITE (APENAS PARA REFERÊNCIA DE NICHO): O portal se chama '{$site_name}' e fala sobre '{$site_desc}'.";

        $prompt = "Você é um Estrategista de Pautas SEO. \n" .
                  "{$site_context} \n\n" .
                  "PROIBIÇÃO ABSOLUTA: Você NÃO PODE gerar um post sobre o site em si, nem sobre promoções dele, nem bônus ou avaliações da marca '{$site_name}'. O seu dever é ser 'invisível'. \n" .
                  "MISSÃO: Basado no nicho acima, sugira um TEMA DE CAUDA LONGA que seja interessante para os leitores desse nicho. Se o usuário enviou termos de pesquisa, use um deles. Se não enviou, invente uma pauta profunda. \n" .
                  "Sua saída deve conter: 1 Título atraente, 1 Keyword principal e o resumo do que o post vai tratar (ESQUEÇA O SITE, FOQUE NO ASSUNTO).";
        if (!empty($search_terms)) {
            $terms_array = array_map('trim', preg_split('/[,;\n]+/', $search_terms));
            $terms_array = array_filter($terms_array); // remove empty
            if (!empty($terms_array)) {
                $chosen_term = $terms_array[array_rand($terms_array)];
                $prompt .= "ATUE COMO UM ESPECIALISTA EM SEO. O tema EXIGIDO para o post é: '" . $chosen_term . "'. " . 
                           "PESQUISE no seu banco de dados as 5 PALAVRAS OU FRASES DE CAUDA LONGA (Long-tail Keywords) com maior rankeamento e volume de busca de mercado relacionadas a '$chosen_term'. " .
                           "Construa a pauta e o título DO ARTIGO se baseando ESTRITAMENTE em alavancar essas palavras que você acabou de descobrir para dominar o Google! ";
            }
        }

        if (!empty($recent_titles)) {
            $prompt .= "AVISO ANTI-DUPLICAÇÃO: Os últimos posts foram: [" . implode(" | ", $recent_titles) . "]. Escolha abordagens INÉDITAS. Não repita esses assuntos. ";
        }

        $use_products = false;
        if ($do_random && $do_products) {
            $use_products = (rand(0, 1) === 1);
        } else if ($do_products) {
            $use_products = true;
        }

        $keywords_out = !empty($chosen_term) ? $chosen_term : "novidades do nicho";

        if ($use_products && class_exists('WooCommerce')) {
            $args = [
                'post_type' => 'product',
                'posts_per_page' => 1,
                'orderby' => 'rand',
                'meta_query' => [
                    [
                        'key' => '_conext_writer_posted',
                        'compare' => 'NOT EXISTS'
                    ]
                ]
            ];
            $q = new WP_Query($args);
            if ($q->have_posts()) {
                $p = $q->posts[0];
                $wc_p = wc_get_product($p->ID);
                $p_name = $wc_p->get_name();
                $p_desc = wp_strip_all_tags($wc_p->get_description());
                
                $prompt .= "Sua missão AGORA é planejar um artigo inteiro focado em atrair clientes para este produto: NOME: $p_name | SOBRE: $p_desc. Crie 1 Título clicável, 1 focus keyword e o resumo dos tópicos. ";
                $keywords_out = $p_name;
                update_post_meta($p->ID, '_conext_writer_posted', 1);
            } else {
                $prompt .= "Nenhum produto novo encontrado. Gere uma pauta vibrante sobre novidades, dicas ou estratégias 100% voltadas ao propósito e nicho original do nosso site. ";
            }
        } else {
            $prompt .= "Gere uma pauta sobre tendências, guias ou notícias inéditas para o nosso público. ";
            if (!empty($this->sources)) {
                $prompt .= "Inspire-se nestas fontes: " . $this->sources;
            }
        }

        $response = $this->call_llm_api($prompt);
        
        return [
            'raw_data' => $response,
            'keywords' => $keywords_out,
            'site_context' => $site_context
        ];
    }

    private function call_llm_api($prompt) {
        if (!$this->provider) return "Error: No provider";
        return Conext_API::call($prompt, $this->provider);
    }
}
