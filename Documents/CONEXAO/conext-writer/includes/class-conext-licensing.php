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
        
        // Se o limite for 0 mas houver um status especial (ex: TRIAL), permitimos saldo virtual
        $status = get_option('conext_writer_license_status');
        if ($limit <= 0 && $status === 'TRIALING') {
            return max(0, 5 - $used);
        }

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
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 20
        ]);

        if (is_wp_error($response)) {
            error_log('Conext Writer Error (Consume Connection): ' . $response->get_error_message());
            
            // Fallback para TRIAL: Se a API falhar, descontamos localmente para manter a segurança
            $status = get_option('conext_writer_license_status');
            if ($status === 'TRIALING') {
                $used = (int) get_option('conext_writer_posts_used', 0);
                update_option('conext_writer_posts_used', $used + $posts);
                return true; 
            }
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        update_option('conext_writer_last_api_response', $body);

        if (isset($body['success']) && $body['success']) {
            if (isset($body['postsUsed'])) {
                update_option('conext_writer_posts_used', (int) $body['postsUsed']);
            }
            if (isset($body['wordsUsed'])) {
                update_option('conext_writer_words_used', (int) $body['wordsUsed']);
            }
            return true;
        }

        // Se o servidor retornar erro de saldo, garantimos que o local reflita isso
        if (isset($body['error']) && strpos($body['error'], 'limit') !== false) {
             // Força sincronização para bloquear próximas tentativas
             self::sync_limits();
        }

        error_log('Conext Writer Error (Consume Response): ' . (isset($body['error']) ? $body['error'] : 'Erro desconhecido.'));
        return false; 
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
