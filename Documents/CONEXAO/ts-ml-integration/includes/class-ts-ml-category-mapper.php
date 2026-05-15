<?php
/**
 * Category Mapper Class
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class TS_ML_Category_Mapper
{

    /**
     * Instance
     *
     * @var TS_ML_Category_Mapper
     */
    private static $instance = null;

    /**
     * Get instance
     *
     * @return TS_ML_Category_Mapper
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
        // Init hooks if necessary
    }

    /**
     * Get ML Category ID for a WC Category
     *
     * @param int $wc_category_id WooCommerce Category ID
     * @return string|false ML Category ID or false
     */
    public function get_ml_category($wc_category_id)
    {
        $mappings = get_option('ts_ml_category_mappings', array());
        return isset($mappings[$wc_category_id]) ? $mappings[$wc_category_id] : false;
    }

    /**
     * Save Mapping
     *
     * @param int $wc_category_id WooCommerce Category ID
     * @param string $ml_category_id Mercado Livre Category ID
     * @return bool
     */
    public function save_mapping($wc_category_id, $ml_category_id)
    {
        $mappings = get_option('ts_ml_category_mappings', array());

        if (empty($ml_category_id)) {
            unset($mappings[$wc_category_id]);
        } else {
            $mappings[$wc_category_id] = sanitize_text_field($ml_category_id);
        }

        return update_option('ts_ml_category_mappings', $mappings);
    }

    /**
     * Get All Mappings
     * 
     * @return array [wc_cat_id => ml_cat_id]
     */
    public function get_all_mappings()
    {
        return get_option('ts_ml_category_mappings', array());
    }

    /**
     * Prepare Mappings for UI
     * 
     * Returns an array of objects with WC Category info and current ML mapping
     * 
     * @return array
     */
    public function get_mappings_for_ui()
    {
        $mappings = $this->get_all_mappings();
        $wc_categories = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ));

        $ui_data = array();

        foreach ($wc_categories as $cat) {
            $ml_cat_id = isset($mappings[$cat->term_id]) ? $mappings[$cat->term_id] : '';
            $ml_cat_name = '';

            if ($ml_cat_id) {
                // Ideally trigger an async fetch or cache the name, 
                // for now we just show the ID or fetch if we have a cache mechanism (implement later)
                $ml_cat_name = $ml_cat_id;
            }

            $ui_data[] = array(
                'wc_id' => $cat->term_id,
                'wc_name' => $cat->name,
                'ml_id' => $ml_cat_id,
                'ml_name' => $ml_cat_name
            );
        }

        return $ui_data;
    }
}
