<?php
/**
 * Reports
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Reports class
 */
class TS_ML_Reports {
    
    /**
     * Instance
     *
     * @var TS_ML_Reports
     */
    private static $instance = null;
    
    /**
     * Get instance
     *
     * @return TS_ML_Reports
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
        // Constructor
    }

    /**
     * Get billing and summary stats for dashboard
     * 
     * @return array
     */
    public function get_dashboard_stats() {
        global $wpdb;
        $table_orders = $wpdb->prefix . 'ts_ml_orders';
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';

        // 1. Total Orders
        $total_orders = $wpdb->get_var("SELECT COUNT(*) FROM $table_orders WHERE sync_status = 'synced'");

        // 2. Total Billing
        $total_billing = 0;
        $order_ids = $wpdb->get_col("SELECT order_id FROM $table_orders WHERE sync_status = 'synced'");
        if (!empty($order_ids)) {
            foreach ($order_ids as $order_id) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $total_billing += $order->get_total();
                }
            }
        }

        // 3. Mapped Products
        $mapped_products = $wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'synced'");

        // 4. Last Sync Logs
        $recent_logs = $wpdb->get_results("SELECT * FROM $table_logs ORDER BY created_at DESC LIMIT 5", ARRAY_A);

        return array(
            'total_orders' => intval($total_orders),
            'total_billing' => floatval($total_billing),
            'mapped_products' => intval($mapped_products),
            'recent_logs' => $recent_logs
        );
    }

    /**
     * Get recent sync stats grouped by status
     * 
     * @return array
     */
    public function get_sync_status_summary() {
        global $wpdb;
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';

        $summary = $wpdb->get_results(
            "SELECT status, COUNT(*) as count 
             FROM $table_logs 
             GROUP BY status", 
            ARRAY_A
        );

        return $summary;
    }
}
