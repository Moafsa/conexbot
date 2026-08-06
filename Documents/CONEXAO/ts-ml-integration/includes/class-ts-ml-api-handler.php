<?php
/**
 * API Handler for Mercado Livre
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * API Handler class
 */
class TS_ML_API_Handler
{

    /**
     * Instance
     *
     * @var TS_ML_API_Handler
     */
    private static $instance = null;

    /**
     * API Base URL
     *
     * @var string
     */
    private $api_base_url = 'https://api.mercadolibre.com';

    /**
     * OAuth URL
     *
     * @var string
     */
    private $oauth_url = 'https://auth.mercadolivre.com.br';

    /**
     * Get instance
     *
     * @return TS_ML_API_Handler
     */
    public static function instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct()
    {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks()
    {
        // OAuth callback handler
        add_action('admin_init', array($this, 'handle_oauth_callback'));
    }

    /**
     * Force HTTPS for URLs when not localhost
     *
     * @param string $url
     * @return string
     */
    private function force_https_if_needed($url)
    {
        // Se já for HTTPS, retorna como está
        if (strpos($url, 'https://') === 0) {
            return $url;
        }

        // Se for localhost, mantém HTTP
        if (strpos($url, 'http://localhost') === 0 || strpos($url, 'http://127.0.0.1') === 0) {
            return $url;
        }

        // Para produção, força HTTPS
        return str_replace('http://', 'https://', $url);
    }

    /**
     * Get OAuth domain by country
     *
     * @param string $country Country code
     * @return string
     */
    private function get_oauth_domain($country = 'BR')
    {
        $domains = array(
            'BR' => 'https://auth.mercadolivre.com.br',
            'AR' => 'https://auth.mercadolibre.com.ar',
            'MX' => 'https://auth.mercadolibre.com.mx',
            'CL' => 'https://auth.mercadolibre.cl',
            'CO' => 'https://auth.mercadolibre.com.co',
            'UY' => 'https://auth.mercadolibre.com.uy',
        );

        return isset($domains[$country]) ? $domains[$country] : 'https://auth.mercadolibre.com';
    }

    /**
     * Get OAuth authorization URL
     *
     * @param int $account_id Account ID
     * @param string $country Country code
     * @return string|WP_Error
     */
    /**
     * Get OAuth authorization URL
     *
     * @param int $account_id Account ID
     * @param string $country Country code
     * @return string|WP_Error
     */
    public function get_oauth_url($account_id, $country = 'BR')
    {
        $app_secret = get_option('ts_ml_app_secret_' . $country);
        // No fallback here on purpose: the hardcoded default app_id below belongs to Conextbot's
        // shared SaaS app, which is registered on Mercado Livre with app.conext.click as its
        // redirect_uri. Using it with THIS store's own domain as redirect_uri always fails with
        // "não foi possível conectar o aplicativo à sua conta", because Mercado Livre requires an
        // exact match between client_id and the redirect_uri registered for that app.
        $app_id = get_option('ts_ml_app_id_' . $country);

        // Direct OAuth only makes sense when the store owner registered THEIR OWN Mercado Livre
        // app (with this site's own admin URL as its redirect_uri). If only the secret is set but
        // not a matching app_id, fall through to the SaaS proxy flow instead of guessing.
        if (!empty($app_secret) && !empty($app_id)) {
            $redirect_uri = admin_url('admin.php?page=ts-ml-settings&action=oauth_callback');
            $redirect_uri = $this->force_https_if_needed($redirect_uri);

            $params = array(
                'response_type' => 'code',
                'client_id' => $app_id,
                'redirect_uri' => $redirect_uri,
                'state' => $account_id,
            );

            $domain = $this->get_oauth_domain($country);
            return $domain . '/authorization?' . http_build_query($params);
        }

        // DEFAULT SAAS MULTI-TENANT ROUTER FLOW (app.conext.click)
        $saas_url = get_option('ts_ml_saas_url');
        $shop_url = home_url();
        $shop_host = parse_url($shop_url, PHP_URL_HOST);

        if (empty($saas_url) || (!empty($shop_host) && strpos($saas_url, $shop_host) !== false)) {
            $saas_url = 'https://app.conext.click';
            update_option('ts_ml_saas_url', $saas_url);
        }

        $bot_id = get_option('ts_ml_bot_id');
        if (empty($bot_id)) {
            $bot_id = get_option('ts_ml_license_key', 'system');
        }

        $redirect_uri = admin_url('admin.php?page=ts-ml-settings');

        $connect_ml_url = rtrim($saas_url, '/') . '/dashboard/integrations/wordpress/connect-ml' .
            '?bot_id=' . urlencode($bot_id) .
            '&account_id=' . urlencode($account_id) .
            '&shop_url=' . urlencode($shop_url) .
            '&redirect_uri=' . urlencode($redirect_uri);

        return $connect_ml_url;
    }

    /**
     * Exchange authorization code for access token
     *
     * @param string $code Authorization code
     * @param int $account_id Account ID
     * @param string $country Country code
     * @return array|WP_Error
     */
    public function exchange_code_for_token($code, $account_id, $country = 'BR')
    {
        // Same reasoning as get_oauth_url(): never silently substitute Conextbot's shared
        // SaaS app_id here. It's only registered on Mercado Livre for app.conext.click's
        // redirect_uri, so exchanging a code with it against this site's own redirect_uri
        // would fail (or worse, succeed against the wrong app).
        $app_id = get_option('ts_ml_app_id_' . $country);

        $app_secret = get_option('ts_ml_app_secret_' . $country);
        $use_saas = get_option('ts_ml_use_saas') === 'yes';
        $saas_url = get_option('ts_ml_saas_url');

        // Use clean redirect URI (must match the one used in authorization)
        $redirect_uri = admin_url('admin.php?page=ts-ml-settings&action=oauth_callback');
        $redirect_uri = $this->force_https_if_needed($redirect_uri);

        // If using SaaS mode and local app_secret is not set, exchange token via SaaS proxy
        if ($use_saas && empty($app_secret) && !empty($saas_url)) {
            $url = rtrim($saas_url, '/') . '/api/v1/ml/exchange';
            $response = wp_remote_post($url, array(
                'headers' => array('Content-Type' => 'application/json'),
                'body' => json_encode(array(
                    'code' => $code,
                    'redirect_uri' => $redirect_uri,
                    'country' => $country,
                    'bot_id' => get_option('ts_ml_bot_id')
                )),
                'timeout' => 30,
            ));

            if (!is_wp_error($response)) {
                $status_code = wp_remote_retrieve_response_code($response);
                $body = wp_remote_retrieve_body($response);
                $data = json_decode($body, true);

                if ($status_code < 400 && !isset($data['error']) && isset($data['access_token'])) {
                    return $data;
                }
            }
        }

        // Direct exchange with Mercado Livre API
        $url = $this->api_base_url . '/oauth/token';

        $data = array(
            'grant_type' => 'authorization_code',
            'client_id' => $app_id,
            'client_secret' => $app_secret,
            'code' => $code,
            'redirect_uri' => $redirect_uri,
        );

        $response = wp_remote_post($url, array(
            'body' => $data,
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (isset($data['error'])) {
            return new WP_Error('oauth_error', $data['error_description'] ?? $data['error']);
        }

        return $data;
    }

    /**
     * Refresh access token
     *
     * @param string $refresh_token Refresh token
     * @param string $country Country code
     * @return array|WP_Error
     */
    public function refresh_token($refresh_token, $country = 'BR')
    {
        $use_saas = get_option('ts_ml_use_saas') === 'yes';
        $saas_url = get_option('ts_ml_saas_url');

        if ($use_saas && !empty($saas_url)) {
            // Refresh token using the SaaS secure proxy
            $url = rtrim($saas_url, '/') . '/api/v1/ml/refresh';
            $response = wp_remote_post($url, array(
                'headers' => array('Content-Type' => 'application/json'),
                'body' => json_encode(array('refresh_token' => $refresh_token)),
                'timeout' => 30,
            ));

            if (is_wp_error($response)) {
                update_option('ts_ml_saas_last_error', $response->get_error_message());
                return $response;
            }

            $status_code = wp_remote_retrieve_response_code($response);
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if ($status_code >= 400 || isset($data['error'])) {
                $error_msg = isset($data['message']) ? $data['message'] : (isset($data['error']) ? $data['error'] : 'Erro no refresh do SaaS');
                update_option('ts_ml_saas_last_error', $error_msg);
                return new WP_Error('refresh_error', $error_msg);
            }

            delete_option('ts_ml_saas_last_error');
            return $data;
        }

        $app_id = get_option('ts_ml_app_id_' . $country);
        $app_secret = get_option('ts_ml_app_secret_' . $country);

        $url = $this->api_base_url . '/oauth/token';

        $data = array(
            'grant_type' => 'refresh_token',
            'client_id' => $app_id,
            'client_secret' => $app_secret,
            'refresh_token' => $refresh_token,
        );

        $response = wp_remote_post($url, array(
            'body' => $data,
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (isset($data['error'])) {
            return new WP_Error('refresh_error', $data['error_description'] ?? $data['error']);
        }

        return $data;
    }

    /**
     * Make API request
     *
     * @param string $endpoint API endpoint
     * @param string $method HTTP method
     * @param array $data Request data
     * @param string $access_token Access token
     * @return array|WP_Error
     */
    public function api_request($endpoint, $method = 'GET', $data = array(), $access_token = '')
    {
        $url = $this->api_base_url . $endpoint;

        $args = array(
            'method' => $method,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'TS-ML-Integration-Plugin/1.0 (WordPress)',
            ),
        );

        if (!empty($access_token)) {
            $args['headers']['Authorization'] = 'Bearer ' . $access_token;
        }

        if (!empty($data) && in_array($method, array('POST', 'PUT', 'PATCH'))) {
            $args['body'] = json_encode($data);
        } elseif (!empty($data) && $method === 'GET') {
            $url .= '?' . http_build_query($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($status_code >= 400) {
            $error_message = isset($data['message']) ? $data['message'] : 'API Error';
            return new WP_Error('api_error', $error_message, array('status' => $status_code, 'body' => $body));
        }

        return $data;
    }

    /**
     * Get user info
     *
     * @param string $access_token Access token
     * @return array|WP_Error
     */
    public function get_user_info($access_token)
    {
        return $this->api_request('/users/me', 'GET', array(), $access_token);
    }

    /**
     * Get account info
     *
     * @param string $access_token Access token
     * @return array|WP_Error
     */
    public function get_account_info($access_token)
    {
        return $this->api_request('/users/me', 'GET', array(), $access_token);
    }

    /**
     * Get the real, valid attribute list for a Mercado Livre category.
     * Public catalog endpoint — the token is optional but passed through if available.
     *
     * @param string $ml_category_id e.g. MLB1055
     * @param string $access_token   Optional
     * @return array|WP_Error List of {id, name, ...} attribute definitions
     */
    public function get_category_attributes($ml_category_id, $access_token = '')
    {
        return $this->api_request('/categories/' . $ml_category_id . '/attributes', 'GET', array(), $access_token);
    }

    /**
     * Handle OAuth callback
     */
    public function handle_oauth_callback()
    {
        if (!isset($_GET['page']) || $_GET['page'] !== 'ts-ml-settings') {
            return;
        }

        if (!isset($_GET['action']) || $_GET['action'] !== 'oauth_callback') {
            return;
        }

        // Check for error from Mercado Livre
        if (isset($_GET['error'])) {
            $error = sanitize_text_field($_GET['error']);
            $error_description = isset($_GET['error_description']) ? sanitize_text_field($_GET['error_description']) : '';

            $error_message = __('Erro ao autorizar aplicação:', 'ts-ml-integration') . ' ' . $error;
            if (!empty($error_description)) {
                $error_message .= ' - ' . $error_description;
            }

            wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode($error_message)));
            exit;
        }

        $account_id = 0;
        if (isset($_GET['state'])) {
            $account_id = intval($_GET['state']);
        } elseif (isset($_GET['account_id'])) {
            $account_id = intval($_GET['account_id']);
        }

        if (!isset($_GET['code']) || empty($account_id)) {
            wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode(__('Código de autorização ou ID da conta não encontrado.', 'ts-ml-integration'))));
            exit;
        }

        $code = sanitize_text_field($_GET['code']);

        // Get account info
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $account = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_accounts WHERE id = %d",
            $account_id
        ));

        if (!$account) {
            wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode(__('Conta não encontrada.', 'ts-ml-integration'))));
            exit;
        }

        // Exchange code for token
        $token_data = $this->exchange_code_for_token($code, $account_id, $account->country);

        if (is_wp_error($token_data)) {
            $error_message = __('Erro ao obter token:', 'ts-ml-integration') . ' ' . $token_data->get_error_message();
            wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode($error_message)));
            exit;
        }

        // Calculate token expiration
        $expires_in = isset($token_data['expires_in']) ? intval($token_data['expires_in']) : 21600;
        $expires_at = date('Y-m-d H:i:s', time() + $expires_in);

        // Update account with tokens
        $result = $wpdb->update(
            $table_accounts,
            array(
                'access_token' => $token_data['access_token'],
                'refresh_token' => $token_data['refresh_token'],
                'token_expires_at' => $expires_at,
                'updated_at' => current_time('mysql'),
            ),
            array('id' => $account_id),
            array('%s', '%s', '%s', '%s'),
            array('%d')
        );

        if ($result === false) {
            wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode(__('Erro ao salvar tokens no banco de dados.', 'ts-ml-integration'))));
            exit;
        }

        // Redirect to settings page
        wp_redirect(admin_url('admin.php?page=ts-ml-settings&account_connected=1'));
        exit;
    }

    /**
     * Check if token is expired
     *
     * @param string $expires_at Expiration date
     * @return bool
     */
    public function is_token_expired($expires_at)
    {
        if (empty($expires_at)) {
            return true;
        }

        $expires_timestamp = strtotime($expires_at);
        $current_timestamp = time();

        // Refresh 5 minutes before expiration
        return ($current_timestamp + 300) >= $expires_timestamp;
    }

    /**
     * Fetch token from Conextbot SaaS
     */
    private function get_token_from_saas($saas_url, $bot_id) {
        $cache_key = 'ts_ml_saas_token_' . $bot_id;
        $cached_token = get_transient($cache_key);
        if ($cached_token) return $cached_token;

        $response = wp_remote_get($saas_url . '/api/v1/ml/token?bot_id=' . $bot_id, array(
            'timeout' => 15,
            'headers' => array('Accept' => 'application/json')
        ));

        if (is_wp_error($response)) {
            $error_msg = $response->get_error_message();
            update_option('ts_ml_saas_last_error', $error_msg);
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body_str = wp_remote_retrieve_body($response);
        $body = json_decode($body_str, true);

        if ($status_code >= 400 || isset($body['error'])) {
            $error_msg = isset($body['message']) ? $body['message'] : (isset($body['error']) ? $body['error'] : 'Erro desconhecido');
            update_option('ts_ml_saas_last_error', $error_msg);
            return new WP_Error('saas_token_error', $error_msg);
        }

        if (isset($body['access_token'])) {
            // Clear any active error state
            delete_option('ts_ml_saas_last_error');
            
            // Cache for 1 hour
            set_transient($cache_key, $body['access_token'], HOUR_IN_SECONDS);
            return $body['access_token'];
        }

        $error_msg = __('Resposta inválida do SaaS.', 'ts-ml-integration');
        update_option('ts_ml_saas_last_error', $error_msg);
        return new WP_Error('saas_token_error', $error_msg);
    }

    /**
     * Get valid access token
     *
     * @param int $account_id Account ID
     * @return string|WP_Error
     */
    public function get_valid_token($account_id = 0)
    {
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';

        if (empty($account_id)) {
            $account = $wpdb->get_row("SELECT * FROM $table_accounts ORDER BY id ASC LIMIT 1");
        } else {
            $account = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table_accounts WHERE id = %d",
                $account_id
            ));
        }

        if (!$account) {
            return new WP_Error('account_not_found', __('Nenhuma conta encontrada.', 'ts-ml-integration'));
        }

        if (empty($account->access_token)) {
            return new WP_Error('no_access_token', __('Conta sem token configurado.', 'ts-ml-integration'));
        }

        // Check if token is expired
        if ($this->is_token_expired($account->token_expires_at)) {
            // Refresh token
            $token_data = $this->refresh_token($account->refresh_token, $account->country);

            if (is_wp_error($token_data)) {
                return $token_data;
            }

            // Update tokens
            $expires_in = isset($token_data['expires_in']) ? intval($token_data['expires_in']) : 21600;
            $expires_at = date('Y-m-d H:i:s', time() + $expires_in);

            $wpdb->update(
                $table_accounts,
                array(
                    'access_token' => $token_data['access_token'],
                    'refresh_token' => isset($token_data['refresh_token']) ? $token_data['refresh_token'] : $account->refresh_token,
                    'token_expires_at' => $expires_at,
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $account->id),
                array('%s', '%s', '%s', '%s'),
                array('%d')
            );

            return $token_data['access_token'];
        }

        return $account->access_token;
    }
}
