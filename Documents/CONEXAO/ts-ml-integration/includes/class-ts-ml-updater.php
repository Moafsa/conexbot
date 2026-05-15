<?php
/**
 * Plugin Updater Class
 * Handles version checking and automatic updates
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Updater class
 */
class TS_ML_Updater {
    
    /**
     * Check version and upgrade if needed
     */
    public static function check_version() {
        $installed_version = get_option('ts_ml_version', '0.0.0');
        $current_version = TS_ML_VERSION;
        
        if (version_compare($installed_version, $current_version, '<')) {
            self::upgrade($installed_version, $current_version);
        }
    }
    
    /**
     * Upgrade plugin
     *
     * @param string $old_version Old version
     * @param string $new_version New version
     */
    private static function upgrade($old_version, $new_version) {
        // Hook before upgrade
        do_action('ts_ml_before_upgrade', $old_version, $new_version);
        
        // Run migrations based on version
        self::run_migrations($old_version, $new_version);
        
        // Update version in database
        update_option('ts_ml_version', $new_version);
        
        // Log upgrade
        self::log_upgrade($old_version, $new_version);
        
        // Hook after upgrade
        do_action('ts_ml_after_upgrade', $old_version, $new_version);
        
        // Set transient to show upgrade notice
        set_transient('ts_ml_upgraded', true, 30);
    }
    
    /**
     * Run migrations based on version
     *
     * @param string $old_version Old version
     * @param string $new_version New version
     */
    private static function run_migrations($old_version, $new_version) {
        // Migration to version 1.1.0
        if (version_compare($old_version, '1.1.0', '<')) {
            self::migrate_to_1_1_0();
        }
        
        // Migration to version 1.2.0
        if (version_compare($old_version, '1.2.0', '<')) {
            self::migrate_to_1_2_0();
        }
        
        // Migration to version 1.3.0
        if (version_compare($old_version, '1.3.0', '<')) {
            self::migrate_to_1_3_0();
        }
        
        // Add more migrations as needed
    }
    
    /**
     * Migration to version 1.1.0
     */
    private static function migrate_to_1_1_0() {
        global $wpdb;
        
        // Example: Add new column to existing table
        $table_products = $wpdb->prefix . 'ts_ml_products';
        
        // Check if column exists before adding
        $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $table_products LIKE 'variation_sync_enabled'");
        if (empty($column_exists)) {
            $wpdb->query("ALTER TABLE $table_products ADD COLUMN variation_sync_enabled tinyint(1) DEFAULT 0");
        }
        
        // Migrate old data if needed
        // Example: Convert old settings format to new format
        $old_settings = get_option('ts_ml_old_settings');
        if ($old_settings) {
            // Convert and save new format
            $new_settings = self::convert_settings_format($old_settings);
            update_option('ts_ml_settings', $new_settings);
            delete_option('ts_ml_old_settings');
        }
    }
    
    /**
     * Migration to version 1.2.0
     */
    private static function migrate_to_1_2_0() {
        global $wpdb;
        
        // Example: Create new table
        $table_shipping = $wpdb->prefix . 'ts_ml_shipping_labels';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_shipping (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            order_id bigint(20) NOT NULL,
            ml_shipment_id varchar(255),
            label_url text,
            tracking_number varchar(255),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Migrate shipping data if exists
        self::migrate_shipping_data();
    }
    
    /**
     * Migration to version 1.3.0
     */
    private static function migrate_to_1_3_0() {
        // Example: Update options structure
        $settings = get_option('ts_ml_settings', array());
        
        if (!isset($settings['ai_enabled'])) {
            $settings['ai_enabled'] = false;
            $settings['ai_provider'] = 'openai';
            update_option('ts_ml_settings', $settings);
        }
        
        // Clear old transients
        delete_transient('ts_ml_old_cache');
    }
    
    /**
     * Convert old settings format to new format
     *
     * @param array $old_settings Old settings
     * @return array New settings
     */
    private static function convert_settings_format($old_settings) {
        $new_settings = array();
        
        // Convert old format to new format
        if (isset($old_settings['auto_sync'])) {
            $new_settings['sync_auto'] = $old_settings['auto_sync'];
        }
        
        if (isset($old_settings['sync_interval'])) {
            $new_settings['sync_interval'] = $old_settings['sync_interval'];
        }
        
        return $new_settings;
    }
    
    /**
     * Migrate shipping data
     */
    private static function migrate_shipping_data() {
        // Migrate existing shipping data if any
        // This is just an example
    }
    
    /**
     * Log upgrade
     *
     * @param string $old_version Old version
     * @param string $new_version New version
     */
    private static function log_upgrade($old_version, $new_version) {
        $log = get_option('ts_ml_upgrade_log', array());
        
        $log[] = array(
            'from' => $old_version,
            'to' => $new_version,
            'date' => current_time('mysql'),
            'user' => get_current_user_id()
        );
        
        // Keep only last 10 upgrades
        $log = array_slice($log, -10);
        update_option('ts_ml_upgrade_log', $log);
        
        // Also log to plugin logger if available
        if (class_exists('TS_ML_Logger')) {
            TS_ML_Logger::log(
                sprintf('Plugin atualizado de %s para %s', $old_version, $new_version),
                'info',
                'upgrade'
            );
        }
    }
    
    /**
     * Get upgrade log
     *
     * @return array Upgrade log
     */
    public static function get_upgrade_log() {
        return get_option('ts_ml_upgrade_log', array());
    }
}
