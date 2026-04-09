<?php
if (!defined('ABSPATH')) {
    exit;
}

class Conext_Licensing {

    private static $api_url = 'https://app.conext.click'; // URL da plataforma Conext

    /**
     * Busca os planos disponíveis diretamente no SaaS
     */
    public static function get_available_plans() {
        $response = wp_remote_get(self::$api_url . '/api/plans?type=WRITER_PLUGIN', [
            'timeout' => 15,
            'headers' => ['Content-Type' => 'application/json']
        ]);

        if (is_wp_error($response)) {
            return [];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return isset($body['plans']) ? $body['plans'] : [];
    }

    public static function get_tier_label() {
        return get_option('conext_writer_license_tier', 'Starter');
    }

    public static function get_credits_remaining() {
        $limit = (int) get_option('conext_writer_post_limit', 0);
        $used = (int) get_option('conext_writer_posts_used', 0);
        return $limit > 0 ? max(0, $limit - $used) : 0;
    }

    public static function get_credits_total() {
        return (int) get_option('conext_writer_post_limit', 0);
    }

    public static function is_valid() {
        $key = get_option('conext_writer_license_key');
        if (empty($key)) return false;
        
        // Em um sistema real, poderíamos validar o cache aqui ou forçar um sync
        return !empty(get_option('conext_writer_license_tier'));
    }

    /**
     * Sincroniza os limites do servidor com o plugin local
     */
    public static function sync_limits() {
        $key = get_option('conext_writer_license_key');
        if (empty($key)) return false;

        $response = wp_remote_post(self::$api_url . '/api/licensing/verify', [
            'body' => json_encode([
                'licenseKey' => $key,
                'siteUrl' => get_site_url()
            ]),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        if (is_wp_error($response)) return false;

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($body['success']) && $body['success']) {
            update_option('conext_writer_license_tier', $body['tier']);
            update_option('conext_writer_license_status', $body['status']); // Salva se é ACTIVE, TRIALING, PENDING, etc.
            update_option('conext_writer_post_limit', $body['postLimit']);
            update_option('conext_writer_word_limit', $body['wordLimit']);
            update_option('conext_writer_posts_used', $body['postsUsed']);
            update_option('conext_writer_words_used', $body['wordsUsed']);
            return true;
        }

        return false;
    }

    /**
     * Consome créditos no servidor central
     */
    public static function consume_credits($posts = 1, $words = 0) {
        $key = get_option('conext_writer_license_key');
        if (empty($key)) return false;

        $response = wp_remote_post(self::$api_url . '/api/licensing/consume', [
            'body' => json_encode([
                'licenseKey' => $key,
                'postsToConsume' => $posts,
                'wordsToConsume' => $words
            ]),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        if (is_wp_error($response)) return false;

        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        // Armazena a resposta para consulta posterior caso necessário
        update_option('conext_writer_last_api_response', $body);

        if (isset($body['success']) && $body['success']) {
            // Sincroniza localmente após consumo
            self::sync_limits();
            return true;
        }

        return $body; // Retorna o corpo do erro (contendo a chave 'error')
    }

    public static function activate_key($key) {
        $response = wp_remote_post(self::$api_url . '/api/licensing/verify', [
            'body' => json_encode([
                'licenseKey' => $key,
                'siteUrl' => get_site_url()
            ]),
            'headers' => ['Content-Type' => 'application/json']
        ]);

        if (is_wp_error($response)) return false;

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($body['success']) && $body['success']) {
            update_option('conext_writer_license_key', $key);
            update_option('conext_writer_license_tier', $body['tier']);
            update_option('conext_writer_post_limit', $body['postLimit']);
            update_option('conext_writer_word_limit', $body['wordLimit']);
            update_option('conext_writer_posts_used', $body['postsUsed']);
            update_option('conext_writer_words_used', $body['wordsUsed']);
            update_option('conext_writer_last_sync', time());
            return true;
        }

        return false;
    }
}
