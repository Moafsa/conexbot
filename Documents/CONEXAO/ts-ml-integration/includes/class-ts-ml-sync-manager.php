<?php
/**
 * Sync Manager
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sync Manager class
 */
class TS_ML_Sync_Manager {
    
    /**
     * Instance
     *
     * @var TS_ML_Sync_Manager
     */
    private static $instance = null;
    
    /**
     * Get instance
     *
     * @return TS_ML_Sync_Manager
     */
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Cron hooks
        add_action('ts_ml_sync_products', array($this, 'sync_products_cron'));
        add_action('ts_ml_sync_orders', array($this, 'sync_orders_cron'));
        add_action('ts_ml_sync_stock', array($this, 'sync_stock_cron'));
        add_action('ts_ml_sync_prices', array($this, 'sync_prices_cron'));
        add_action('ts_ml_check_messages', array($this, 'check_messages_cron'));
        add_action('ts_ml_update_shipping', array($this, 'update_shipping_cron'));

        // SaaS Sync AJAX hook
        add_action('wp_ajax_nopriv_conexbot_sync_from_saas', array($this, 'handle_saas_sync'));
        add_action('wp_ajax_conexbot_sync_from_saas', array($this, 'handle_saas_sync'));
    }

    /**
     * Handle synchronization request from SaaS
     */
    public function handle_saas_sync() {
        // We expect a JSON body
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (empty($data) || !isset($data['woo_product_id'])) {
            wp_send_json_error(array('message' => 'Dados inválidos'), 400);
        }

        $product_id = intval($data['woo_product_id']);
        $price = isset($data['price']) ? floatval($data['price']) : null;
        $stock = isset($data['stock']) ? intval($data['stock']) : null;

        if (class_exists('TS_ML_Product_Sync')) {
            $result = TS_ML_Product_Sync::instance()->update_product_from_saas($product_id, $price, $stock);
            if ($result) {
                wp_send_json_success(array('message' => 'Produto atualizado com sucesso'));
            } else {
                wp_send_json_error(array('message' => 'Erro ao atualizar produto'), 500);
            }
        }

        wp_send_json_error(array('message' => 'Classe de sincronização não encontrada'), 500);
    }
    
    /**
     * Sync products cron
     */
    public function sync_products_cron() {
        if (get_option('ts_ml_auto_sync') !== 'yes') {
            return;
        }
        
        // Check if WooCommerce is loaded
        if (!class_exists('WooCommerce')) {
            return;
        }
        
        $this->log_sync('products', 'started', 'Sincronização automática de produtos iniciada');
        
        // Get active accounts
        $accounts = $this->get_active_accounts();
        
        if (empty($accounts)) {
            $this->log_sync('products', 'skipped', 'Nenhuma conta ativa encontrada');
            return;
        }
        
        foreach ($accounts as $account) {
            try {
                if (class_exists('TS_ML_Product_Sync')) {
                    TS_ML_Product_Sync::instance()->sync_account_products($account->id);
                }
            } catch (Exception $e) {
                $this->log_sync('products', 'error', $e->getMessage(), $account->id);
            }
        }
        
        $this->log_sync('products', 'completed', 'Sincronização automática de produtos concluída');
    }
    
    /**
     * Sync orders cron
     */
    public function sync_orders_cron() {
        if (get_option('ts_ml_auto_sync_orders') !== 'yes') {
            return;
        }
        
        $this->log_sync('orders', 'started', 'Sincronização automática de pedidos iniciada');
        
        // Get active accounts
        $accounts = $this->get_active_accounts();
        
        foreach ($accounts as $account) {
            try {
                TS_ML_Order_Sync::instance()->sync_account_orders($account->id);
            } catch (Exception $e) {
                $this->log_sync('orders', 'error', $e->getMessage(), $account->id);
            }
        }
        
        $this->log_sync('orders', 'completed', 'Sincronização automática de pedidos concluída');
    }
    
    /**
     * Sync stock cron
     */
    public function sync_stock_cron() {
        if (get_option('ts_ml_auto_sync_stock') !== 'yes') {
            return;
        }
        
        if (!class_exists('WooCommerce')) {
            return;
        }
        
        $this->log_sync('stock', 'started', 'Sincronização automática de estoque iniciada');
        
        $accounts = $this->get_active_accounts();
        
        if (empty($accounts)) {
            $this->log_sync('stock', 'skipped', 'Nenhuma conta ativa encontrada');
            return;
        }
        
        foreach ($accounts as $account) {
            try {
                if (class_exists('TS_ML_Product_Sync')) {
                    TS_ML_Product_Sync::instance()->sync_account_stock($account->id);
                }
            } catch (Exception $e) {
                $this->log_sync('stock', 'error', $e->getMessage(), $account->id);
            }
        }
        
        $this->log_sync('stock', 'completed', 'Sincronização automática de estoque concluída');
    }
    
    /**
     * Sync prices cron
     */
    public function sync_prices_cron() {
        if (get_option('ts_ml_auto_sync_prices') !== 'yes') {
            return;
        }
        
        if (!class_exists('WooCommerce')) {
            return;
        }
        
        $this->log_sync('prices', 'started', 'Sincronização automática de preços iniciada');
        
        $accounts = $this->get_active_accounts();
        
        if (empty($accounts)) {
            $this->log_sync('prices', 'skipped', 'Nenhuma conta ativa encontrada');
            return;
        }
        
        foreach ($accounts as $account) {
            try {
                if (class_exists('TS_ML_Product_Sync')) {
                    TS_ML_Product_Sync::instance()->sync_account_prices($account->id);
                }
            } catch (Exception $e) {
                $this->log_sync('prices', 'error', $e->getMessage(), $account->id);
            }
        }
        
        $this->log_sync('prices', 'completed', 'Sincronização automática de preços concluída');
    }
    
    /**
     * Check messages cron
     */
    public function check_messages_cron() {
        if (!class_exists('WooCommerce')) {
            return;
        }
        
        $this->log_sync('messages', 'started', 'Verificação de mensagens iniciada');
        
        $accounts = $this->get_active_accounts();
        
        if (empty($accounts)) {
            $this->log_sync('messages', 'skipped', 'Nenhuma conta ativa encontrada');
            return;
        }
        
        foreach ($accounts as $account) {
            try {
                if (class_exists('TS_ML_Message_Handler')) {
                    TS_ML_Message_Handler::instance()->sync_account_messages($account->id);
                }
            } catch (Exception $e) {
                $this->log_sync('messages', 'error', $e->getMessage(), $account->id);
            }
        }
        
        $this->log_sync('messages', 'completed', 'Verificação de mensagens concluída');
    }
    
    /**
     * Update shipping cron
     */
    public function update_shipping_cron() {
        if (!class_exists('WooCommerce')) {
            return;
        }
        
        $this->log_sync('shipping', 'started', 'Atualização de envios iniciada');
        
        $accounts = $this->get_active_accounts();
        
        if (empty($accounts)) {
            $this->log_sync('shipping', 'skipped', 'Nenhuma conta ativa encontrada');
            return;
        }
        
        foreach ($accounts as $account) {
            try {
                if (class_exists('TS_ML_Shipping_Manager')) {
                    TS_ML_Shipping_Manager::instance()->sync_account_shipping($account->id);
                }
            } catch (Exception $e) {
                $this->log_sync('shipping', 'error', $e->getMessage(), $account->id);
            }
        }
        
        $this->log_sync('shipping', 'completed', 'Atualização de envios concluída');
    }
    
    /**
     * Get active accounts
     *
     * @return array
     */
    private function get_active_accounts() {
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        
        // Check if table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");
        if (!$table_exists) {
            return array();
        }
        
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_accounts WHERE is_active = %d",
                1
            )
        );
    }
    
    /**
     * Log sync operation
     *
     * @param string $sync_type Sync type
     * @param string $status Status
     * @param string $message Message
     * @param int|null $account_id Account ID
     */
    private function log_sync($sync_type, $status, $message, $account_id = null) {
        global $wpdb;
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';
        
        $wpdb->insert(
            $table_logs,
            array(
                'account_id' => $account_id,
                'sync_type' => $sync_type,
                'status' => $status,
                'message' => $message,
                'created_at' => current_time('mysql'),
            ),
            array('%d', '%s', '%s', '%s', '%s')
        );
    }
}
