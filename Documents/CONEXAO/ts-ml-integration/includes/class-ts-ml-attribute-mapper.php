<?php
/**
 * Attribute Mapper Class
 *
 * Auto-maps WooCommerce global attributes (pa_*) to real Mercado Livre attribute IDs.
 * Unlike a naive AI guess, matches are only ever picked from the real attribute list
 * Mercado Livre returns for the categories the store already mapped — the AI step (when
 * configured) is constrained to that same list, so it can never invent a non-existent ID.
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

class TS_ML_Attribute_Mapper
{
    private static $instance = null;

    public static function instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
    }

    public function get_all_mappings()
    {
        return get_option('ts_ml_attribute_mapping', array());
    }

    public function save_mapping($woo_slug, $ml_attribute_id)
    {
        $mapping = $this->get_all_mappings();

        if (empty($ml_attribute_id)) {
            unset($mapping[$woo_slug]);
        } else {
            $mapping[$woo_slug] = sanitize_text_field($ml_attribute_id);
        }

        return update_option('ts_ml_attribute_mapping', $mapping);
    }

    /**
     * Collect the real, deduped attribute candidates from every ML category the store
     * has already mapped in Category Mapping. This is the ground truth the matching
     * below picks from — never a hallucinated ID.
     *
     * @return array [id => name]
     */
    private function get_candidate_attributes()
    {
        $category_mappings = TS_ML_Category_Mapper::instance()->get_all_mappings();
        $ml_category_ids = array_unique(array_values($category_mappings));

        if (empty($ml_category_ids)) {
            return array();
        }

        $api_handler = TS_ML_API_Handler::instance();
        $candidates = array();

        foreach ($ml_category_ids as $ml_category_id) {
            $attributes = $api_handler->get_category_attributes($ml_category_id);
            if (is_wp_error($attributes) || !is_array($attributes)) {
                continue;
            }
            foreach ($attributes as $attr) {
                if (!empty($attr['id']) && !empty($attr['name'])) {
                    $candidates[$attr['id']] = $attr['name'];
                }
            }
        }

        return $candidates;
    }

    /**
     * Normalize for comparison: lowercase, strip accents/punctuation.
     */
    private function normalize($text)
    {
        $text = remove_accents($text);
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '', $text);
        return $text;
    }

    /**
     * Try a direct normalized match between a WooCommerce attribute label and the
     * real candidate attribute names for the store's mapped categories.
     *
     * @return string|false ML attribute ID or false
     */
    private function match_directly($woo_label, $candidates)
    {
        $normalized_label = $this->normalize($woo_label);

        foreach ($candidates as $ml_id => $ml_name) {
            if ($this->normalize($ml_name) === $normalized_label) {
                return $ml_id;
            }
        }

        return false;
    }

    /**
     * Ask AI to pick the best-matching ML attribute ID for a WooCommerce attribute,
     * constrained to the real candidate list (the AI can only return an ID that's
     * actually in the list, or "NONE").
     *
     * @return string|false
     */
    private function match_via_ai($woo_label, $candidates)
    {
        $api_key = get_option('ts_ml_ai_api_key');
        if (empty($api_key) || empty($candidates)) {
            return false;
        }

        $model = get_option('ts_ml_ai_model', 'gpt-4o-mini');
        $options_list = array();
        foreach ($candidates as $ml_id => $ml_name) {
            $options_list[] = $ml_id . ' = "' . $ml_name . '"';
        }

        $system_prompt = "Você mapeia atributos de uma loja WooCommerce para atributos do Mercado Livre Brasil.\n" .
            "Escolha o ID mais adequado APENAS dentre esta lista de opções válidas:\n" . implode("\n", $options_list) . "\n" .
            "Responda APENAS com o ID escolhido (ex: COLOR), exatamente como aparece na lista. " .
            "Se nenhuma opção fizer sentido, responda exatamente: NONE. Não escreva mais nada.";

        $messages = array(
            array('role' => 'system', 'content' => $system_prompt),
            array('role' => 'user', 'content' => 'Atributo da loja: ' . $woo_label),
        );

        $ai = TS_ML_AI_Integration::instance();
        $response = $ai->call_openai_api($messages, $model, $api_key);

        if (is_wp_error($response)) {
            return false;
        }

        $result = isset($response['choices'][0]['message']['content'])
            ? trim($response['choices'][0]['message']['content'])
            : '';

        // Only accept the answer if it's literally one of the real candidate IDs.
        return isset($candidates[$result]) ? $result : false;
    }

    /**
     * Auto-map every WooCommerce global attribute that doesn't already have a saved
     * mapping. Direct name match first, AI (grounded to the real candidate list) as
     * fallback when configured.
     *
     * @return array{mapped: int, skipped: int, total_candidates: int}
     */
    public function auto_map_all()
    {
        $candidates = $this->get_candidate_attributes();
        $saved_mapping = $this->get_all_mappings();
        $attribute_taxonomies = wc_get_attribute_taxonomies();

        $mapped = 0;
        $skipped = 0;

        foreach ($attribute_taxonomies as $tax) {
            $woo_slug = 'pa_' . $tax->attribute_name;

            if (!empty($saved_mapping[$woo_slug])) {
                continue; // Already mapped, don't override a manual choice.
            }

            $ml_id = $this->match_directly($tax->attribute_label, $candidates);

            if (!$ml_id) {
                $ml_id = $this->match_via_ai($tax->attribute_label, $candidates);
            }

            if ($ml_id) {
                $this->save_mapping($woo_slug, $ml_id);
                $mapped++;
            } else {
                $skipped++;
            }
        }

        return array(
            'mapped' => $mapped,
            'skipped' => $skipped,
            'total_candidates' => count($candidates),
        );
    }
}
