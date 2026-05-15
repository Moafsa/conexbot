<?php
/**
 * Logger class
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Logger class for debugging and logging
 */
class TS_ML_Logger {
    
    /**
     * Log levels
     */
    const LEVEL_DEBUG = 'debug';
    const LEVEL_INFO = 'info';
    const LEVEL_WARNING = 'warning';
    const LEVEL_ERROR = 'error';
    
    /**
     * Log message
     *
     * @param string $message Message
     * @param string $level Log level
     * @param array $context Additional context
     */
    public static function log($message, $level = self::LEVEL_INFO, $context = array()) {
        if (get_option('ts_ml_debug_mode') !== 'yes' && $level === self::LEVEL_DEBUG) {
            return;
        }
        
        $log_entry = array(
            'timestamp' => current_time('mysql'),
            'level' => $level,
            'message' => $message,
            'context' => $context,
        );
        
        // Log to database
        self::log_to_database($log_entry);
        
        // Log to file if debug mode is enabled
        if (get_option('ts_ml_debug_mode') === 'yes') {
            self::log_to_file($log_entry);
        }
    }
    
    /**
     * Log to database
     *
     * @param array $log_entry Log entry
     */
    private static function log_to_database($log_entry) {
        global $wpdb;
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';
        
        $wpdb->insert(
            $table_logs,
            array(
                'sync_type' => 'log',
                'status' => $log_entry['level'],
                'message' => $log_entry['message'] . (empty($log_entry['context']) ? '' : ' | Context: ' . json_encode($log_entry['context'])),
                'created_at' => $log_entry['timestamp'],
            ),
            array('%s', '%s', '%s', '%s')
        );
    }
    
    /**
     * Log to file
     *
     * @param array $log_entry Log entry
     */
    private static function log_to_file($log_entry) {
        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/ts-ml-logs';
        
        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
        }
        
        $log_file = $log_dir . '/ts-ml-' . date('Y-m-d') . '.log';
        $log_line = sprintf(
            "[%s] %s: %s %s\n",
            $log_entry['timestamp'],
            strtoupper($log_entry['level']),
            $log_entry['message'],
            empty($log_entry['context']) ? '' : json_encode($log_entry['context'])
        );
        
        file_put_contents($log_file, $log_line, FILE_APPEND);
    }
    
    /**
     * Debug log
     *
     * @param string $message Message
     * @param array $context Context
     */
    public static function debug($message, $context = array()) {
        self::log($message, self::LEVEL_DEBUG, $context);
    }
    
    /**
     * Info log
     *
     * @param string $message Message
     * @param array $context Context
     */
    public static function info($message, $context = array()) {
        self::log($message, self::LEVEL_INFO, $context);
    }
    
    /**
     * Warning log
     *
     * @param string $message Message
     * @param array $context Context
     */
    public static function warning($message, $context = array()) {
        self::log($message, self::LEVEL_WARNING, $context);
    }
    
    /**
     * Error log
     *
     * @param string $message Message
     * @param array $context Context
     */
    public static function error($message, $context = array()) {
        self::log($message, self::LEVEL_ERROR, $context);
    }
    
    /**
     * Get recent logs
     *
     * @param int $limit Limit
     * @param string $level Log level filter
     * @return array
     */
    public static function get_recent_logs($limit = 50, $level = '') {
        global $wpdb;
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';
        
        $where = "sync_type = 'log'";
        if (!empty($level)) {
            $where .= $wpdb->prepare(" AND status = %s", $level);
        }
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_logs WHERE $where ORDER BY created_at DESC LIMIT %d",
            $limit
        ));
    }
    
    /**
     * Clear old logs
     *
     * @param int $days Days to keep
     */
    public static function clear_old_logs($days = 30) {
        global $wpdb;
        $table_logs = $wpdb->prefix . 'ts_ml_sync_logs';
        
        $wpdb->query($wpdb->prepare(
            "DELETE FROM $table_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $days
        ));
    }
}
