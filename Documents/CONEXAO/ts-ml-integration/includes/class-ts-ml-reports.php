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
}
