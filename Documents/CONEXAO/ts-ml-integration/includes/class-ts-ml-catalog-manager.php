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

    /**
     * Get Mercado Livre category attributes (technical specifications)
     *
     * @param string $category_id ML Category ID
     * @param int $account_id Account ID for credentials
     * @return array|WP_Error
     */
    public function get_category_attributes($category_id, $account_id) {
        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return $access_token;
        }

        // Fetch attributes from Mercado Livre
        $response = $api_handler->api_request(
            '/categories/' . $category_id . '/attributes',
            'GET',
            array(),
            $access_token
        );

        if (is_wp_error($response)) {
            return $response;
        }

        return $response;
    }

    /**
     * Get WooCommerce product attributes to map
     *
     * @return array
     */
    public function get_wc_attributes() {
        if (!function_exists('wc_get_attribute_taxonomies')) {
            return array();
        }

        $wc_attributes = wc_get_attribute_taxonomies();
        $attributes = array();

        foreach ($wc_attributes as $attr) {
            $attributes[$attr->attribute_name] = $attr->attribute_label;
        }

        return $attributes;
    }

    /**
     * Save attribute mapping
     *
     * @param string $ml_attribute_id ML attribute ID (e.g. BRAND, MODEL)
     * @param string $wc_attribute_slug WooCommerce attribute slug
     * @return bool
     */
    public function save_attribute_mapping($ml_attribute_id, $wc_attribute_slug) {
        $mappings = get_option('ts_ml_attribute_mappings', array());

        if (empty($wc_attribute_slug)) {
            unset($mappings[$ml_attribute_id]);
        } else {
            $mappings[$ml_attribute_id] = sanitize_text_field($wc_attribute_slug);
        }

        return update_option('ts_ml_attribute_mappings', $mappings);
    }

    /**
     * Get all attribute mappings
     *
     * @return array
     */
    public function get_attribute_mappings() {
        return get_option('ts_ml_attribute_mappings', array());
    }
}
