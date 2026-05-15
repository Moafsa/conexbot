<?php
/**
 * WooCommerce Hooks
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WooCommerce Hooks class
 */
class TS_ML_WooCommerce_Hooks {
    
    /**
     * Instance
     *
     * @var TS_ML_WooCommerce_Hooks
     */
    private static $instance = null;
    
    /**
     * Get instance
     *
     * @return TS_ML_WooCommerce_Hooks
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
        // Product hooks
        add_action('woocommerce_update_product', array($this, 'on_product_update'), 10, 1);
        add_action('woocommerce_new_product', array($this, 'on_product_create'), 10, 1);
        
        // Stock hooks
        add_action('woocommerce_reduce_order_stock', array($this, 'on_stock_reduce'), 10, 1);
        add_action('woocommerce_restore_order_stock', array($this, 'on_stock_restore'), 10, 1);
        add_action('woocommerce_product_set_stock', array($this, 'on_stock_update'), 10, 1);
        add_action('woocommerce_variation_set_stock', array($this, 'on_stock_update'), 10, 1);
        
        // Price hooks
        add_action('woocommerce_product_object_updated_props', array($this, 'on_product_props_update'), 10, 2);

        // Status and Deletion hooks
        add_action('transition_post_status', array($this, 'on_status_transition'), 10, 3);
        add_action('trashed_post', array($this, 'on_product_trash'), 10, 1);
        add_action('untrashed_post', array($this, 'on_product_untrash'), 10, 1);
        add_action('before_delete_post', array($this, 'on_product_delete'), 10, 1);
    }
    
    /**
     * On product update
     *
     * @param int $product_id Product ID
     */
    public function on_product_update($product_id) {
        if (get_option('ts_ml_auto_sync') !== 'yes') {
            return;
        }
        
        $product = wc_get_product($product_id);
        if (!$product) {
            return;
        }
        
        // Get all active accounts
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $accounts = $wpdb->get_results("SELECT id FROM $table_accounts WHERE is_active = 1");
        
        foreach ($accounts as $account) {
            // Check if product is synced
            $table_products = $wpdb->prefix . 'ts_ml_products';
            $sync_record = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d AND sync_status = 'synced'",
                $product_id,
                $account->id
            ));
            
            if ($sync_record) {
                // Sync stock if enabled
                if (get_option('ts_ml_auto_sync_stock') === 'yes') {
                    TS_ML_Product_Sync::instance()->sync_product_stock($product_id, $account->id);
                }
                
                // Sync price if enabled
                if (get_option('ts_ml_auto_sync_prices') === 'yes') {
                    TS_ML_Product_Sync::instance()->sync_product_price($product_id, $account->id);
                }
            }
        }
    }
    
    /**
     * On product create
     *
     * @param int $product_id Product ID
     */
    public function on_product_create($product_id) {
        if (get_option('ts_ml_auto_sync') !== 'yes' || get_option('ts_ml_auto_create_on_ml') !== 'yes') {
            return;
        }

        $product = wc_get_product($product_id);
        if (!$product) return;

        // Get all active accounts
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $accounts = $wpdb->get_results("SELECT id FROM $table_accounts WHERE is_active = 1");

        foreach ($accounts as $account) {
            // Trigger the sync manager to export this new product
            TS_ML_Product_Sync::instance()->sync_product($product_id, $account->id, 'woo_to_ml');
        }
    }
    
    /**
     * On stock reduce
     *
     * @param WC_Order $order Order object
     */
    public function on_stock_reduce($order) {
        if (get_option('ts_ml_auto_sync_stock') !== 'yes') {
            return;
        }
        
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $this->sync_product_stock_for_all_accounts($product_id);
        }
    }
    
    /**
     * On stock restore
     *
     * @param WC_Order $order Order object
     */
    public function on_stock_restore($order) {
        if (get_option('ts_ml_auto_sync_stock') !== 'yes') {
            return;
        }
        
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $this->sync_product_stock_for_all_accounts($product_id);
        }
    }
    
    /**
     * On stock update
     *
     * @param WC_Product $product Product object
     */
    public function on_stock_update($product) {
        if (get_option('ts_ml_auto_sync_stock') !== 'yes') {
            return;
        }
        
        $this->sync_product_stock_for_all_accounts($product->get_id());
    }
    
    /**
     * On product props update
     *
     * @param WC_Product $product Product object
     * @param array $changed_props Changed properties
     */
    public function on_product_props_update($product, $changed_props) {
        if (get_option('ts_ml_auto_sync_prices') !== 'yes') {
            return;
        }
        
        // Check if price was changed
        if (in_array('price', $changed_props) || in_array('regular_price', $changed_props) || in_array('sale_price', $changed_props)) {
            $this->sync_product_price_for_all_accounts($product->get_id());
        }
        
        // Check if stock was changed
        if (in_array('stock_quantity', $changed_props) && get_option('ts_ml_auto_sync_stock') === 'yes') {
            $this->sync_product_stock_for_all_accounts($product->get_id());
        }
    }
    
    /**
     * Sync product stock for all accounts
     *
     * @param int $product_id Product ID
     */
    private function sync_product_stock_for_all_accounts($product_id) {
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $accounts = $wpdb->get_results("SELECT id FROM $table_accounts WHERE is_active = 1");
        
        foreach ($accounts as $account) {
            TS_ML_Product_Sync::instance()->sync_product_stock($product_id, $account->id);
        }
    }
    
    /**
     * Sync product price for all accounts
     *
     * @param int $product_id Product ID
     */
    private function sync_product_price_for_all_accounts($product_id) {
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $accounts = $wpdb->get_results("SELECT id FROM $table_accounts WHERE is_active = 1");
        
        foreach ($accounts as $account) {
            TS_ML_Product_Sync::instance()->sync_product_price($product_id, $account->id);
        }
    }

    /**
     * On status transition
     */
    public function on_status_transition($new_status, $old_status, $post) {
        if ($post->post_type !== 'product' || $new_status === $old_status) {
            return;
        }

        if (get_option('ts_ml_sync_status_changes') !== 'yes') {
            return;
        }

        $this->sync_product_status_for_all_accounts($post->ID, $new_status);
    }

    /**
     * On product trash
     */
    public function on_product_trash($post_id) {
        if (get_post_type($post_id) !== 'product') {
            return;
        }

        if (get_option('ts_ml_sync_deletions') !== 'yes') {
            return;
        }

        $this->sync_product_status_for_all_accounts($post_id, 'trash');
    }

    /**
     * On product untrash
     */
    public function on_product_untrash($post_id) {
        if (get_post_type($post_id) !== 'product') {
            return;
        }

        if (get_option('ts_ml_sync_status_changes') !== 'yes') {
            return;
        }

        $this->sync_product_status_for_all_accounts($post_id, 'publish');
    }

    /**
     * On product delete
     */
    public function on_product_delete($post_id) {
        if (get_post_type($post_id) !== 'product') {
            return;
        }

        if (get_option('ts_ml_sync_deletions') !== 'yes') {
            return;
        }

        $this->sync_product_status_for_all_accounts($post_id, 'deleted');
    }

    /**
     * Sync status for all accounts
     */
    private function sync_product_status_for_all_accounts($product_id, $status) {
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $accounts = $wpdb->get_results("SELECT id FROM $table_accounts WHERE is_active = 1");

        foreach ($accounts as $account) {
            TS_ML_Product_Sync::instance()->sync_product_status_by_woo($product_id, $account->id, $status);
        }
    }
}
