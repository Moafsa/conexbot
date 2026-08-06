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
        // Mercado Livre's own predictor is purpose-built for exactly this task (real text
        // → real category) and only ever returns categories that actually exist and are
        // relevant. Try it first. AI is a fallback for names it can't confidently match —
        // and even then, an AI answer is only trusted after verifying the ID exists, since
        // a plausible-looking MLBxxxxx can still be a hallucinated, unrelated category (e.g.
        // it once mapped "BEBÊ" to MLB1000, which is real but is "Eletrônicos, Áudio e Vídeo").
        $predicted = $this->auto_map_via_ml_predictor($wc_category_id, $wc_category_name);
        if ($predicted) {
            return $predicted;
        }

        $api_key = get_option('ts_ml_ai_api_key');

        if (empty($api_key)) {
            return false;
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
            return false; // Predictor (tried above) already couldn't match this one either.
        }

        $result = isset($response['choices'][0]['message']['content']) 
            ? trim($response['choices'][0]['message']['content']) 
            : '';

        // Match MLBXXXXX format
        if (preg_match('/(MLB\d+)/i', $result, $matches)) {
            $ml_category_id = strtoupper($matches[1]);

            // LLMs don't reliably know real Mercado Livre category IDs — a well-formatted
            // MLBxxxxx string can still be a hallucinated ID that doesn't exist. Verify it
            // against the real category endpoint before trusting it.
            if ($this->category_exists($ml_category_id)) {
                $this->save_mapping($wc_category_id, $ml_category_id);
                return $ml_category_id;
            }
        }

        // AI output was invalid or the ID doesn't actually exist, and the predictor (tried
        // above) already couldn't match this one either.
        return false;
    }

    /**
     * Verify a Mercado Livre category ID actually exists AND is a "leaf" category — a
     * category with sub-categories (or explicitly marked listing_allowed=false) exists but
     * rejects every listing posted directly into it ("Is not allowed to post in category X.
     * Make sure you're posting in a leaf category"), confirmed live for both the AI-mapped
     * and product-sync fallback paths. A mapping to a non-leaf category is just as broken as
     * one to a category that doesn't exist at all, so both are rejected the same way here.
     *
     * @param string $ml_category_id
     * @return bool
     */
    private function category_exists($ml_category_id)
    {
        $response = wp_remote_get('https://api.mercadolibre.com/categories/' . rawurlencode($ml_category_id), array('timeout' => 10));

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return false;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($data)) {
            return false;
        }

        if (isset($data['settings']['listing_allowed'])) {
            return (bool) $data['settings']['listing_allowed'];
        }

        return empty($data['children_categories']);
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
        // Mercado Livre discontinued /category_predictor/predict (now returns 404 for every
        // query). /domain_discovery/search is its replacement and returns the same kind of
        // result: the best-matching real category for a free-text title.
        $url = 'https://api.mercadolibre.com/sites/MLB/domain_discovery/search?limit=1&q=' . urlencode($wc_category_name);
        $response = wp_remote_get($url, array('timeout' => 15));

        if (is_wp_error($response)) {
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // domain_discovery/search is meant to return only leaf (postable) categories, but
        // confirmed live that a broad single-word WC category name ("Bebês") can still get
        // back a parent category (MLB1384, 15 sub-categories, listing_allowed=false) — same
        // failure mode as an unverified AI answer. Verify before saving either way.
        if (isset($data[0]['category_id'])) {
            $ml_category_id = sanitize_text_field($data[0]['category_id']);
            if ($this->category_exists($ml_category_id)) {
                $this->save_mapping($wc_category_id, $ml_category_id);
                return $ml_category_id;
            }
        }

        return false;
    }
}
