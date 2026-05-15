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

        // AJAX Handlers for Import
        add_action('wp_ajax_ts_ml_fetch_items', array($this, 'ajax_fetch_items'));
        add_action('wp_ajax_ts_ml_import_single_item', array($this, 'ajax_import_single_item'));
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
            __('Mensagens', 'ts-ml-integration'),
            __('Mensagens', 'ts-ml-integration'),
            'manage_woocommerce',
            'ts-ml-messages',
            array($this, 'render_messages_page')
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
}
