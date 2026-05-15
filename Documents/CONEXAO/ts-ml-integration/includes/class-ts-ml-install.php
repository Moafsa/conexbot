<?php
/**
 * Installation and activation class
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Installation class
 */
class TS_ML_Install {
    
    /**
     * Activate plugin
     */
    public static function activate() {
        // Clear any old scheduled events first
        self::clear_scheduled_events();
        
        // Create database tables
        self::create_tables();
        
        // Set default options
        self::set_default_options();
        
        // Set plugin version (if first install)
        $current_version = get_option('ts_ml_version');
        if (!$current_version) {
            add_option('ts_ml_version', TS_ML_VERSION);
        }
        
        // Schedule cron events
        self::schedule_events();
        
        // Register webhook rewrite rule
        add_rewrite_rule('^ts-ml-webhook/?$', 'index.php?ts_ml_webhook=1', 'top');
        add_rewrite_tag('%ts_ml_webhook%', '([^&]+)');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Deactivate plugin
     */
    public static function deactivate() {
        // Clear scheduled events
        self::clear_scheduled_events();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Settings table
        $table_settings = $wpdb->prefix . 'ts_ml_settings';
        $sql_settings = "CREATE TABLE IF NOT EXISTS $table_settings (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            setting_key varchar(255) NOT NULL,
            setting_value longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";
        
        // Accounts table
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $sql_accounts = "CREATE TABLE IF NOT EXISTS $table_accounts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            account_name varchar(255) NOT NULL,
            user_id bigint(20) NOT NULL,
            access_token text,
            refresh_token text,
            token_expires_at datetime,
            country varchar(10) DEFAULT 'BR',
            is_active tinyint(1) DEFAULT 1,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY is_active (is_active)
        ) $charset_collate;";
        
        // Products sync table
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $sql_products = "CREATE TABLE IF NOT EXISTS $table_products (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            account_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            ml_item_id varchar(255),
            ml_listing_id varchar(255),
            sync_direction varchar(20) DEFAULT 'bidirectional',
            last_sync_at datetime,
            sync_status varchar(20) DEFAULT 'pending',
            sync_errors text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY account_id (account_id),
            KEY product_id (product_id),
            KEY ml_item_id (ml_item_id),
            KEY sync_status (sync_status)
        ) $charset_collate;";
        
        // Orders sync table
        $table_orders = $wpdb->prefix . 'ts_ml_orders';
        $sql_orders = "CREATE TABLE IF NOT EXISTS $table_orders (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            account_id bigint(20) NOT NULL,
            order_id bigint(20) NOT NULL,
            ml_order_id varchar(255),
            sync_status varchar(20) DEFAULT 'pending',
            last_sync_at datetime,
            sync_errors text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY account_id (account_id),
            KEY order_id (order_id),
            KEY ml_order_id (ml_order_id),
            KEY sync_status (sync_status)
        ) $charset_collate;";
        
        // Messages table
        $table_messages = $wpdb->prefix . 'ts_ml_messages';
        $sql_messages = "CREATE TABLE IF NOT EXISTS $table_messages (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            account_id bigint(20) NOT NULL,
            ml_message_id varchar(255),
            ml_question_id varchar(255),
            product_id bigint(20),
            order_id bigint(20),
            sender_id varchar(255),
            message_text text,
            message_type varchar(50),
            status varchar(20) DEFAULT 'unread',
            replied_at datetime,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY account_id (account_id),
            KEY ml_message_id (ml_message_id),
            KEY status (status)
        ) $charset_collate;";
        
        // Sync logs table
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';
        $sql_logs = "CREATE TABLE IF NOT EXISTS $table_logs (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            account_id bigint(20),
            sync_type varchar(50) NOT NULL,
            entity_type varchar(50),
            entity_id bigint(20),
            status varchar(20) DEFAULT 'pending',
            message text,
            error_message text,
            execution_time decimal(10,2),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY account_id (account_id),
            KEY sync_type (sync_type),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";
        
        // Schedules table
        $table_schedules = $wpdb->prefix . 'ts_ml_schedules';
        $sql_schedules = "CREATE TABLE IF NOT EXISTS $table_schedules (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            schedule_name varchar(255) NOT NULL,
            schedule_type varchar(50) NOT NULL,
            schedule_config text,
            is_active tinyint(1) DEFAULT 1,
            last_run_at datetime,
            next_run_at datetime,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY schedule_type (schedule_type),
            KEY is_active (is_active),
            KEY next_run_at (next_run_at)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Suppress errors during table creation, but log them
        $suppress = $wpdb->suppress_errors(true);
        
        dbDelta($sql_settings);
        dbDelta($sql_accounts);
        dbDelta($sql_products);
        dbDelta($sql_orders);
        dbDelta($sql_messages);
        dbDelta($sql_logs);
        dbDelta($sql_schedules);
        
        $wpdb->suppress_errors($suppress);
        
        // Verify tables were created
        $tables_to_check = array(
            $wpdb->prefix . 'ts_ml_settings',
            $wpdb->prefix . 'ts_ml_accounts',
            $wpdb->prefix . 'ts_ml_products',
            $wpdb->prefix . 'ts_ml_orders',
            $wpdb->prefix . 'ts_ml_messages',
            $wpdb->prefix . 'ts_ml_sync_logs',
            $wpdb->prefix . 'ts_ml_schedules',
        );
        
        $missing_tables = array();
        foreach ($tables_to_check as $table) {
            $exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");
            if (!$exists) {
                $missing_tables[] = $table;
            }
        }
        
        // If tables are missing, try creating them directly
        if (!empty($missing_tables)) {
            foreach ($missing_tables as $table) {
                switch ($table) {
                    case $wpdb->prefix . 'ts_ml_settings':
                        $wpdb->query($sql_settings);
                        break;
                    case $wpdb->prefix . 'ts_ml_accounts':
                        $wpdb->query($sql_accounts);
                        break;
                    case $wpdb->prefix . 'ts_ml_products':
                        $wpdb->query($sql_products);
                        break;
                    case $wpdb->prefix . 'ts_ml_orders':
                        $wpdb->query($sql_orders);
                        break;
                    case $wpdb->prefix . 'ts_ml_messages':
                        $wpdb->query($sql_messages);
                        break;
                    case $wpdb->prefix . 'ts_ml_sync_logs':
                        $wpdb->query($sql_logs);
                        break;
                    case $wpdb->prefix . 'ts_ml_schedules':
                        $wpdb->query($sql_schedules);
                        break;
                }
            }
        }
    }
    
    /**
     * Set default options
     */
    private static function set_default_options() {
        $defaults = array(
            'ts_ml_version' => TS_ML_VERSION,
            'ts_ml_sync_frequency' => 'hourly',
            'ts_ml_auto_sync' => 'yes',
            'ts_ml_auto_sync_stock' => 'yes',
            'ts_ml_auto_sync_prices' => 'yes',
            'ts_ml_auto_sync_orders' => 'yes',
            'ts_ml_ai_enabled' => 'no',
            'ts_ml_ai_api_key' => '',
            'ts_ml_debug_mode' => 'no',
        );
        
        foreach ($defaults as $key => $value) {
            if (get_option($key) === false) {
                add_option($key, $value);
            }
        }
    }
    
    /**
     * Schedule cron events
     */
    private static function schedule_events() {
        // Only schedule if auto sync is enabled (will be checked in the cron handler)
        $events = array(
            'ts_ml_sync_products' => 'hourly',
            'ts_ml_sync_orders' => 'hourly',
            'ts_ml_sync_stock' => 'hourly',
            'ts_ml_sync_prices' => 'hourly',
            'ts_ml_check_messages' => 'hourly',
            'ts_ml_update_shipping' => 'hourly',
        );
        
        foreach ($events as $hook => $recurrence) {
            // Clear any existing scheduled events for this hook
            $timestamp = wp_next_scheduled($hook);
            if ($timestamp !== false) {
                wp_unschedule_event($timestamp, $hook);
            }
            
            // Schedule new event
            wp_schedule_event(time(), $recurrence, $hook);
        }
    }
    
    /**
     * Clear scheduled events
     */
    private static function clear_scheduled_events() {
        wp_clear_scheduled_hook('ts_ml_sync_products');
        wp_clear_scheduled_hook('ts_ml_sync_orders');
        wp_clear_scheduled_hook('ts_ml_sync_stock');
        wp_clear_scheduled_hook('ts_ml_sync_prices');
        wp_clear_scheduled_hook('ts_ml_check_messages');
        wp_clear_scheduled_hook('ts_ml_update_shipping');
    }
}
