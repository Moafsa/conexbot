<?php
/**
 * Catalog Manager
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Catalog Manager class
 */
class TS_ML_Catalog_Manager {
    
    /**
     * Instance
     *
     * @var TS_ML_Catalog_Manager
     */
    private static $instance = null;
    
    /**
     * Get instance
     *
     * @return TS_ML_Catalog_Manager
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
