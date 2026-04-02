<?php
if (!defined('ABSPATH')) {
    exit;
}

class ConexAI_Orchestrator {
    
    private $openai_key;
    private $gemini_key;

    public function __construct() {
        $this->openai_key = get_option('conex_ai_openai_key');
        $this->gemini_key = get_option('conex_ai_gemini_key');
    }

    /**
     * Entry point for cron job to generate the daily post
     */
    public function execute_daily_generation() {
        if (!$this->has_valid_keys()) {
            error_log('Conex AI Writer: Nenhuma chave de API configurada. Processo abortado.');
            return false;
        }

        // 1. Pesquisador: Busca as Pautas
        $researcher = new ConexAI_Agent_Researcher($this->get_active_provider());
        $topic_data = $researcher->gather_topics();

        if (!$topic_data) return false;

        // 2. Redator: Escreve o Texto
        $writer = new ConexAI_Agent_Writer($this->get_active_provider());
        $draft_content = $writer->draft_post($topic_data);

        // 3. Especialista SEO: Revisa e otimiza
        $seo_agent = new ConexAI_Agent_SEO($this->get_active_provider());
        $optimized_post = $seo_agent->optimize($draft_content);

        // 4. Visualist: Gera Imagem de Destaque
        $visualist = new ConexAI_Agent_Visualist($this->get_active_provider());
        $image_id = $visualist->generate_featured_image($topic_data['keywords']);

        // 5. Publicação Final via wp_insert_post
        return $this->publish_post($optimized_post, $image_id);
    }

    private function publish_post($post_data, $image_id) {
        $post_arr = array(
            'post_title'   => wp_strip_all_tags($post_data['title']),
            'post_content' => $post_data['content'],
            'post_status'  => 'publish',
            'post_author'  => 1,
        );

        $post_id = wp_insert_post($post_arr);

        if (!is_wp_error($post_id) && $image_id) {
            set_post_thumbnail($post_id, $image_id);
            
            // Yoast SEO Meta tags
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $post_data['focus_keyword']);
            update_post_meta($post_id, '_yoast_wpseo_title', $post_data['title']);
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $post_data['meta_desc']);
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
