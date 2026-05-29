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

    /**
     * Auto map WooCommerce category using OpenAI GPT-4o-Mini
     *
     * @param int $wc_category_id Category ID
     * @param string $wc_category_name Category Name
     * @return string|false
     */
    public function auto_map_via_ai($wc_category_id, $wc_category_name)
    {
        $api_key = get_option('ts_ml_ai_api_key');

        if (empty($api_key)) {
            // Fallback to official ML category predictor
            return $this->auto_map_via_ml_predictor($wc_category_id, $wc_category_name);
        }

        $model = get_option('ts_ml_ai_model', 'gpt-4o-mini');
        $system_prompt = "Você é um especialista em e-commerce e Mercado Livre. Sua tarefa é mapear categorias de uma loja WooCommerce para as categorias correspondentes do Mercado Livre Brasil (MLB).\n" .
                         "Dado o nome da categoria do WooCommerce, responda APENAS com o ID da categoria do Mercado Livre (formato MLB seguido de números, ex: MLB1055, MLB438497) que seja mais adequado.\n" .
                         "Não responda nada além do ID da categoria. Sem explicações, sem texto adicional. Apenas o ID da categoria.";

        $messages = array(
            array(
                'role' => 'system',
                'content' => $system_prompt
            ),
            array(
                'role' => 'user',
                'content' => "Mapeie a categoria: " . $wc_category_name
            )
        );

        $ai = TS_ML_AI_Integration::instance();
        $response = $ai->call_openai_api($messages, $model, $api_key);

        if (is_wp_error($response)) {
            // Log error and fallback to predictor
            return $this->auto_map_via_ml_predictor($wc_category_id, $wc_category_name);
        }

        $result = isset($response['choices'][0]['message']['content']) 
            ? trim($response['choices'][0]['message']['content']) 
            : '';

        // Match MLBXXXXX format
        if (preg_match('/(MLB\d+)/i', $result, $matches)) {
            $ml_category_id = strtoupper($matches[1]);
            $this->save_mapping($wc_category_id, $ml_category_id);
            return $ml_category_id;
        }

        // Fallback if AI output is invalid
        return $this->auto_map_via_ml_predictor($wc_category_id, $wc_category_name);
    }

    /**
     * Auto map WooCommerce category using Mercado Livre's official category predictor
     *
     * @param int $wc_category_id Category ID
     * @param string $wc_category_name Category Name
     * @return string|false
     */
    public function auto_map_via_ml_predictor($wc_category_id, $wc_category_name)
    {
        $url = 'https://api.mercadolibre.com/sites/MLB/category_predictor/predict?title=' . urlencode($wc_category_name);
        $response = wp_remote_get($url, array('timeout' => 15));

        if (is_wp_error($response)) {
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (isset($data['id'])) {
            $ml_category_id = sanitize_text_field($data['id']);
            $this->save_mapping($wc_category_id, $ml_category_id);
            return $ml_category_id;
        }

        return false;
    }
}
