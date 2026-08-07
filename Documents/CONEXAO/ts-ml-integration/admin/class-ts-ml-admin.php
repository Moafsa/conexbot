<?php
/**
 * Admin class
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin class
 */
class TS_ML_Admin
{

    /**
     * Instance
     *
     * @var TS_ML_Admin
     */
    private static $instance = null;

    /**
     * Get instance
     *
     * @return TS_ML_Admin
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
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('admin_init', array($this, 'handle_saas_callback'));
        add_action('admin_notices', array($this, 'display_saas_admin_notices'));

        // AJAX Handlers for Import & Toggle
        add_action('wp_ajax_ts_ml_fetch_items', array($this, 'ajax_fetch_items'));
        add_action('wp_ajax_ts_ml_import_single_item', array($this, 'ajax_import_single_item'));
        add_action('wp_ajax_ts_ml_toggle_product_sync', array($this, 'ajax_toggle_product_sync'));

        // AJAX Handlers for Q&A (Messages)
        add_action('wp_ajax_ts_ml_fetch_questions', array($this, 'ajax_fetch_questions'));
        add_action('wp_ajax_ts_ml_send_answer', array($this, 'ajax_send_answer'));
        add_action('wp_ajax_ts_ml_suggest_question_answer', array($this, 'ajax_suggest_question_answer'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu()
    {
        add_menu_page(
            __('Mercado Livre', 'ts-ml-integration'),
            __('Mercado Livre', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-settings',
            array($this, 'render_settings_page'),
            'dashicons-admin-generic',
            56
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Configurações', 'ts-ml-integration'),
            __('Configurações', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-settings',
            array($this, 'render_settings_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Mapear Categorias', 'ts-ml-integration'),
            __('Mapear Categorias', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-category-mapping',
            array($this, 'render_category_mapping_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Mapear Atributos', 'ts-ml-integration'),
            __('Mapear Atributos', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-attribute-mapping',
            array($this, 'render_attribute_mapping_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Produtos', 'ts-ml-integration'),
            __('Produtos', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-products',
            array($this, 'render_products_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Pedidos', 'ts-ml-integration'),
            __('Pedidos', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-orders',
            array($this, 'render_orders_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            // This is the public pre-sale Q&A (/questions/search) — renamed from the old
            // generic "Mensagens" label, which was easy to confuse with the *separate*
            // private post-sale messages system below (different API, has AI auto-reply).
            __('Perguntas (Pré-venda)', 'ts-ml-integration'),
            __('Perguntas (Pré-venda)', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-messages',
            array($this, 'render_messages_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Mensagens Privadas', 'ts-ml-integration'),
            __('Mensagens Privadas', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-private-messages',
            array($this, 'render_private_messages_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Relatórios', 'ts-ml-integration'),
            __('Relatórios', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-reports',
            array($this, 'render_reports_page')
        );

        add_submenu_page(
            'ts-ml-settings',
            __('Importar do ML', 'ts-ml-integration'),
            __('Importar do ML', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-import',
            array($this, 'render_import_page')
        );
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook)
    {
        if (strpos($hook, 'ts-ml') === false) {
            return;
        }

        wp_enqueue_style(
            'ts-ml-admin',
            TS_ML_PLUGIN_URL . 'admin/assets/css/admin.css',
            array(),
            TS_ML_VERSION
        );

        wp_enqueue_script(
            'ts-ml-admin',
            TS_ML_PLUGIN_URL . 'admin/assets/js/admin.js',
            array('jquery'),
            TS_ML_VERSION,
            true
        );
    }

    /**
     * Render settings page
     */
    public function render_settings_page()
    {
        // Check if file exists before including
        $settings_file = TS_ML_PLUGIN_DIR . 'admin/views/settings.php';
        if (!file_exists($settings_file)) {
            wp_die(__('Arquivo de configurações não encontrado.', 'ts-ml-integration'));
        }

        // Include with error handling
        try {
            include $settings_file;
        } catch (Exception $e) {
            ?>
            <div class="wrap">
                <h1>
                    <?php esc_html_e('Configurações - Mercado Livre Integration', 'ts-ml-integration'); ?>
                </h1>
                <div class="error">
                    <p><strong>
                            <?php esc_html_e('Erro:', 'ts-ml-integration'); ?>
                        </strong>
                        <?php esc_html_e('Ocorreu um erro ao carregar a página de configurações.', 'ts-ml-integration'); ?>
                    </p>
                    <?php if (defined('WP_DEBUG') && WP_DEBUG) { ?>
                        <p>
                            <?php echo esc_html($e->getMessage()); ?>
                        </p>
                    <?php } ?>
                </div>
            </div>
            <?php
        }
    }

    /**
     * Render products page
     */
    public function render_products_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/products.php';
    }

    /**
     * Render orders page
     */
    public function render_orders_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/orders.php';
    }

    /**
     * Render messages page
     */
    public function render_messages_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/messages.php';
    }

    /**
     * Render private (post-sale) messages page
     */
    public function render_private_messages_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/private-messages.php';
    }

    /**
     * Render reports page
     */
    public function render_reports_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/reports.php';
    }

    /**
     * Render category mapping page
     */
    public function render_category_mapping_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/category-mapping.php';
    }

    /**
     * Render attribute mapping page
     */
    public function render_attribute_mapping_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/attribute-mapping.php';
    }

    /**
     * Render import page
     */
    public function render_import_page()
    {
        include TS_ML_PLUGIN_DIR . 'admin/views/import-products.php';
    }

    /**
     * AJAX Fetch items from Mercado Livre
     */
    public function ajax_fetch_items()
    {
        check_ajax_referer('ts_ml_import_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(__('Permissão negada.', 'ts-ml-integration'));
        }

        $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;
        $search_type = isset($_POST['search_type']) ? sanitize_text_field($_POST['search_type']) : 'account';
        $search_query = isset($_POST['search_query']) ? sanitize_text_field($_POST['search_query']) : '';
        $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;
        $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 20;

        if (empty($account_id)) {
            wp_send_json_error(__('Conta não especificada para autenticação da API.', 'ts-ml-integration'));
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            wp_send_json_error($access_token->get_error_message());
        }

        // 1. Get User ID for this account
        $user_info = $api_handler->get_user_info($access_token);
        if (is_wp_error($user_info)) {
            wp_send_json_error(__('Erro ao obter informações do usuário:', 'ts-ml-integration') . ' ' . $user_info->get_error_message());
        }

        $user_id = $user_info['id'];
        $site_id = $user_info['site_id'] ?? 'MLB';

        $items_to_fetch = array();
        $paging_info = array('total' => 0, 'offset' => $offset, 'limit' => $limit);

        if ($search_type === 'account' && empty($search_query)) {
            // 2a. Search items from MY account
            $search_params = array(
                'seller_id' => $user_id,
                'offset' => $offset,
                'limit' => $limit,
            );
            $search_results = $api_handler->api_request('/users/' . $user_id . '/items/search', 'GET', $search_params, $access_token);
            
            if (!is_wp_error($search_results)) {
                $items_to_fetch = $search_results['results'] ?? array();
                $paging_info = $search_results['paging'];
            }
        } else {
            // 2b. GLOBAL SEARCH or Filtered Account Search
            // If search_query contains a ML URL or ID like MLB123456
            if (preg_match('/(MLB|MLM|MLA|MCO|MLC|MLU|MLV|MPE|MEC|MGT|MNI|MPY|MCR|MSV|MPA|MBO)\d+/', $search_query, $matches)) {
                $items_to_fetch = array($matches[0]);
                $paging_info['total'] = 1;
            } else {
                // Keyword search
                $search_params = array(
                    'q' => $search_query,
                    'offset' => $offset,
                    'limit' => $limit,
                );
                
                // For global search, we DON'T send the access token as it often causes 403 Forbidden 
                // on many accounts/apps that don't have the explicit global search scope.
                $search_token = ($search_type === 'account') ? $access_token : '';

                if ($search_type === 'account') {
                    $search_params['seller_id'] = $user_id;
                }

                $search_results = $api_handler->api_request("/sites/{$site_id}/search", 'GET', $search_params, $search_token);

                if (is_wp_error($search_results)) {
                    wp_send_json_error($search_results->get_error_message());
                }

                $items_to_fetch = array();
                if (!empty($search_results['results'])) {
                    foreach ($search_results['results'] as $res) {
                        $items_to_fetch[] = $res['id'];
                    }
                }
                $paging_info = $search_results['paging'];
            }
        }

        if (empty($items_to_fetch)) {
            wp_send_json_success(array('results' => array(), 'paging' => $paging_info));
        }

        // 3. Get multiget items data
        $ids = implode(',', $items_to_fetch);
        $items_data = $api_handler->api_request('/items', 'GET', array('ids' => $ids), $access_token);

        if (is_wp_error($items_data)) {
            wp_send_json_error($items_data->get_error_message());
        }

        // Format results
        $formatted_results = array();
        foreach ($items_data as $item_resp) {
            $item = $item_resp['body'];

            // Check if already synced
            global $wpdb;
            $table_products = $wpdb->prefix . 'ts_ml_products';
            $sync_record = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table_products WHERE ml_item_id = %s AND account_id = %d",
                $item['id'],
                $account_id
            ));

            $woo_status = '-';
            if ($sync_record) {
                $woo_status = sprintf('<a href="%s" target="_blank">#%d</a>', get_edit_post_link($sync_record->product_id), $sync_record->product_id);
            }

            $formatted_results[] = array(
                'id' => $item['id'],
                'title' => $item['title'],
                'thumbnail' => str_replace('http://', 'https://', $item['thumbnail']),
                'price' => $item['price'],
                'currency_id' => $item['currency_id'],
                'status' => $item['status'],
                'seller_custom_field' => $item['seller_custom_field'] ?? '',
                'woo_status' => $woo_status,
            );
        }

        wp_send_json_success(array(
            'results' => $formatted_results,
            'paging' => $paging_info
        ));
    }

    /**
     * AJAX Import single item
     */
    public function ajax_import_single_item()
    {
        check_ajax_referer('ts_ml_import_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(__('Permissão negada.', 'ts-ml-integration'));
        }

        $ml_id = isset($_POST['ml_id']) ? sanitize_text_field($_POST['ml_id']) : '';
        $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;

        if (empty($ml_id) || empty($account_id)) {
            wp_send_json_error(__('Dados insuficientes.', 'ts-ml-integration'));
        }

        $product_sync = TS_ML_Product_Sync::instance();
        $result = $product_sync->import_product_from_ml($ml_id, $account_id);

        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error(__('Erro ao importar produto.', 'ts-ml-integration'));
        }
    }

    /**
     * Handle SaaS OAuth callback and activation
     */
    public function handle_saas_callback()
    {
        if (!isset($_GET['page']) || $_GET['page'] !== 'ts-ml-settings') {
            return;
        }

        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';

        if ($action === 'saas_callback') {
            $bot_id = isset($_GET['bot_id']) ? sanitize_text_field($_GET['bot_id']) : '';
            $license_key = isset($_GET['license_key']) ? sanitize_text_field($_GET['license_key']) : '';
            $saas_url = isset($_GET['saas_url']) ? esc_url_raw($_GET['saas_url']) : 'https://app.conext.click';

            if (empty($bot_id)) {
                wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode(__('Conexão falhou: Bot ID não enviado pelo SaaS.', 'ts-ml-integration'))));
                exit;
            }

            // Save options
            update_option('ts_ml_use_saas', 'yes');
            update_option('ts_ml_bot_id', $bot_id);
            if (!empty($license_key)) {
                update_option('ts_ml_license_key', $license_key);
            }
            update_option('ts_ml_saas_url', $saas_url);
            update_option('ts_ml_connected_site_url', site_url());
            delete_option('ts_ml_saas_last_error');

            // The "1-click" button promises to validate the license AND connect a real
            // Mercado Livre account in one pass. Conextbot's callback now hands back a real
            // token from this same OAuth round-trip when present — use it to create a genuinely
            // connected account, instead of the caller having to repeat "Adicionar Nova Conta"
            // + "Conectar no Mercado Livre" as a separate manual step.
            $access_token = isset($_GET['access_token']) ? sanitize_text_field($_GET['access_token']) : '';
            $refresh_token = isset($_GET['refresh_token']) ? sanitize_text_field($_GET['refresh_token']) : '';
            $expires_in = isset($_GET['expires_in']) ? intval($_GET['expires_in']) : 0;
            $account_name = isset($_GET['account_name']) ? sanitize_text_field($_GET['account_name']) : 'Mercado Livre';

            if (!empty($access_token) && !empty($refresh_token)) {
                global $wpdb;
                $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");

                if ($table_exists) {
                    $expires_at = date('Y-m-d H:i:s', time() + ($expires_in > 0 ? $expires_in : 21600));

                    // Dedupe by account_name, same convention "Adicionar Nova Conta" already uses
                    // below. user_id here follows that same convention too: it stores the WP admin
                    // who performed the action, not a Mercado Livre id.
                    $existing = $wpdb->get_row($wpdb->prepare(
                        "SELECT id FROM $table_accounts WHERE account_name = %s",
                        $account_name
                    ));

                    if ($existing) {
                        $wpdb->update(
                            $table_accounts,
                            array(
                                'access_token' => $access_token,
                                'refresh_token' => $refresh_token,
                                'token_expires_at' => $expires_at,
                                'is_active' => 1,
                                'updated_at' => current_time('mysql'),
                            ),
                            array('id' => $existing->id),
                            array('%s', '%s', '%s', '%d', '%s'),
                            array('%d')
                        );
                    } else {
                        $wpdb->insert(
                            $table_accounts,
                            array(
                                'account_name' => $account_name,
                                'country' => 'BR',
                                'user_id' => get_current_user_id(),
                                'is_active' => 1,
                                'access_token' => $access_token,
                                'refresh_token' => $refresh_token,
                                'token_expires_at' => $expires_at,
                                'created_at' => current_time('mysql'),
                                'updated_at' => current_time('mysql'),
                            ),
                            array('%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s')
                        );
                    }
                }
            }

            wp_redirect(admin_url('admin.php?page=ts-ml-settings&settings_saved=1'));
            exit;
        }

        if ($action === 'saas_ml_callback') {
            $account_id = isset($_GET['account_id']) ? intval($_GET['account_id']) : 0;
            $access_token = isset($_GET['access_token']) ? sanitize_text_field($_GET['access_token']) : '';
            $refresh_token = isset($_GET['refresh_token']) ? sanitize_text_field($_GET['refresh_token']) : '';
            $expires_in = isset($_GET['expires_in']) ? intval($_GET['expires_in']) : 21600;

            if (empty($account_id) || empty($access_token)) {
                wp_redirect(admin_url('admin.php?page=ts-ml-settings&oauth_error=' . urlencode(__('Conexão falhou: Dados de conta inválidos do SaaS.', 'ts-ml-integration'))));
                exit;
            }

            global $wpdb;
            $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
            $expires_at = date('Y-m-d H:i:s', time() + $expires_in);

            $wpdb->update(
                $table_accounts,
                array(
                    'access_token' => $access_token,
                    'refresh_token' => $refresh_token,
                    'token_expires_at' => $expires_at,
                    'is_active' => 1,
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $account_id),
                array('%s', '%s', '%s', '%d', '%s'),
                array('%d')
            );

            wp_redirect(admin_url('admin.php?page=ts-ml-settings&account_connected=1'));
            exit;
        }
    }

    /**
     * Display administrative notices for SaaS errors and URL mismatches
     */
    public function display_saas_admin_notices()
    {
        if (get_option('ts_ml_use_saas') !== 'yes') {
            return;
        }

        // 1. Check Site URL Mismatch (e.g. Migration or staging vs prod change)
        $connected_url = get_option('ts_ml_connected_site_url');
        $current_url = site_url();
        if (!empty($connected_url) && $connected_url !== $current_url) {
            $reconnect_url = admin_url('admin.php?page=ts-ml-settings');
            ?>
            <div class="notice notice-warning is-dismissible">
                <p><strong><?php _e('Conextbot Mercado Livre:', 'ts-ml-integration'); ?></strong> <?php printf(__('Foi detectada uma alteração no endereço da sua loja (de <code>%s</code> para <code>%s</code>). Para evitar falhas de sincronização e atualizar as credenciais seguras, por favor, <a href="%s">reconecte sua loja agora</a>.', 'ts-ml-integration'), esc_url($connected_url), esc_url($current_url), esc_url($reconnect_url)); ?></p>
            </div>
            <?php
            return;
        }

        // 2. Check SaaS connection or license error
        $last_error = get_option('ts_ml_saas_last_error');
        if (!empty($last_error)) {
            $reconnect_url = admin_url('admin.php?page=ts-ml-settings');
            ?>
            <div class="notice notice-error is-dismissible">
                <p><strong><?php _e('Conextbot Mercado Livre:', 'ts-ml-integration'); ?></strong> <?php printf(__('A sincronização com o Mercado Livre está pausada porque a conexão com o SaaS foi revogada, expirou ou a licença está inválida. (Erro: %s). <a href="%s">Clique aqui para reconectar sua loja agora</a>.', 'ts-ml-integration'), esc_html($last_error), esc_url($reconnect_url)); ?></p>
            </div>
            <?php
        }
    }

    /**
     * AJAX Toggle Product Sync Status
     */
    public function ajax_toggle_product_sync()
    {
        check_ajax_referer('ts_ml_products_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(__('Permissão negada.', 'ts-ml-integration'));
        }

        $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
        $enabled = isset($_POST['enabled']) && $_POST['enabled'] === 'yes' ? 'yes' : 'no';

        if (!$product_id) {
            wp_send_json_error(__('ID de produto inválido.', 'ts-ml-integration'));
        }

        update_post_meta($product_id, '_ts_ml_sync_enabled', $enabled);

        wp_send_json_success(array('enabled' => $enabled));
    }

    /**
     * AJAX: fetch Q&A questions for an account, enriched with item title/permalink
     */
    public function ajax_fetch_questions()
    {
        check_ajax_referer('ts_ml_qa_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(__('Permissão negada.', 'ts-ml-integration'));
        }

        $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;
        $status = isset($_POST['status']) ? sanitize_text_field($_POST['status']) : 'UNANSWERED';

        if (empty($account_id)) {
            wp_send_json_error(__('Conta não especificada.', 'ts-ml-integration'));
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            wp_send_json_error($access_token->get_error_message());
        }

        $user_info = $api_handler->get_user_info($access_token);
        if (is_wp_error($user_info)) {
            wp_send_json_error(__('Erro ao obter informações do usuário:', 'ts-ml-integration') . ' ' . $user_info->get_error_message());
        }

        $questions_data = $api_handler->api_request('/questions/search', 'GET', array(
            'seller_id' => $user_info['id'],
            'status' => $status,
        ), $access_token);

        if (is_wp_error($questions_data)) {
            wp_send_json_error($questions_data->get_error_message());
        }

        $questions = $questions_data['questions'] ?? array();

        if (empty($questions)) {
            wp_send_json_success(array());
        }

        // Enrich with item title/permalink via multiget, same pattern as ajax_fetch_items
        $item_ids = array_unique(array_map(function ($q) {
            return $q['item_id'];
        }, $questions));

        $items_by_id = array();
        $items_data = $api_handler->api_request('/items', 'GET', array('ids' => implode(',', $item_ids)), $access_token);
        if (!is_wp_error($items_data)) {
            foreach ($items_data as $item_resp) {
                if (isset($item_resp['body']['id'])) {
                    $items_by_id[$item_resp['body']['id']] = $item_resp['body'];
                }
            }
        }

        $formatted = array_map(function ($q) use ($items_by_id) {
            $item = $items_by_id[$q['item_id']] ?? array();
            return array(
                'id' => $q['id'],
                'text' => $q['text'],
                'status' => $q['status'],
                'date_created' => $q['date_created'],
                'answer' => $q['answer'] ?? null,
                'item' => array(
                    'id' => $q['item_id'],
                    'title' => $item['title'] ?? $q['item_id'],
                    'permalink' => $item['permalink'] ?? '#',
                ),
            );
        }, $questions);

        wp_send_json_success($formatted);
    }

    /**
     * AJAX: send an answer to a Mercado Livre question
     */
    public function ajax_send_answer()
    {
        check_ajax_referer('ts_ml_qa_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(__('Permissão negada.', 'ts-ml-integration'));
        }

        $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;
        $question_id = isset($_POST['question_id']) ? intval($_POST['question_id']) : 0;
        $text = isset($_POST['text']) ? sanitize_textarea_field($_POST['text']) : '';

        if (empty($account_id) || empty($question_id) || $text === '') {
            wp_send_json_error(__('Dados incompletos para responder a pergunta.', 'ts-ml-integration'));
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            wp_send_json_error($access_token->get_error_message());
        }

        $result = $api_handler->api_request('/answers', 'POST', array(
            'question_id' => $question_id,
            'text' => $text,
        ), $access_token);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }

        wp_send_json_success($result);
    }

    /**
     * AJAX: suggest an AI-generated reply to a public pre-sale question — returns text for
     * the seller to review/edit, does not send anything itself.
     */
    public function ajax_suggest_question_answer()
    {
        check_ajax_referer('ts_ml_qa_nonce', 'nonce');

        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(__('Permissão negada.', 'ts-ml-integration'));
        }

        $question_text = isset($_POST['question_text']) ? sanitize_textarea_field($_POST['question_text']) : '';
        $ml_item_id = isset($_POST['ml_item_id']) ? sanitize_text_field($_POST['ml_item_id']) : '';

        if ($question_text === '') {
            wp_send_json_error(__('Pergunta vazia.', 'ts-ml-integration'));
        }

        if (empty(get_option('ts_ml_ai_api_key'))) {
            wp_send_json_error(__('Nenhuma chave de IA configurada em Configurações.', 'ts-ml-integration'));
        }

        // Ground the suggestion in the real product (price/stock/description/attributes)
        // instead of answering blind — resolve the ML item back to the local WC product.
        $product_id = 0;
        if (!empty($ml_item_id)) {
            global $wpdb;
            $table_products = $wpdb->prefix . 'ts_ml_products';
            $product_id = intval($wpdb->get_var($wpdb->prepare(
                "SELECT product_id FROM $table_products WHERE ml_item_id = %s LIMIT 1",
                $ml_item_id
            )));
        }

        $suggestion = TS_ML_AI_Integration::instance()->generate_reply($question_text, '', $product_id);
        wp_send_json_success($suggestion);
    }
}

