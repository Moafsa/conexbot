<?php
/**
 * Product Sync
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Product Sync class
 */
class TS_ML_Product_Sync
{

    /**
     * Instance
     *
     * @var TS_ML_Product_Sync
     */
    private static $instance = null;

    /**
     * Get instance
     *
     * @return TS_ML_Product_Sync
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
        // Constructor
    }

    /**
     * Update product from SaaS data (ML -> SaaS -> WP flow)
     */
    public function update_product_from_saas($product_id, $price = null, $stock = null) {
        if (!class_exists('WooCommerce')) return false;

        $product = wc_get_product($product_id);
        if (!$product) return false;

        $updated = false;

        if ($price !== null) {
            $product->set_regular_price($price);
            $updated = true;
        }

        if ($stock !== null) {
            $product->set_manage_stock(true);
            $product->set_stock_quantity($stock);
            $updated = true;
        }

        if ($updated) {
            $product->save();
            TS_ML_Logger::info('Produto atualizado via SaaS', array('product_id' => $product_id, 'price' => $price, 'stock' => $stock));
            return true;
        }

        return false;
    }

    /**
     * Sync account products
     *
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_account_products($account_id)
    {
        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        // Get products to sync
        $products = $this->get_products_to_sync($account_id);

        foreach ($products as $product) {
            $this->sync_product($product->product_id, $account_id, $product->sync_direction);
        }

        return true;
    }

    /**
     * Sync product
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @param string $direction Sync direction
     * @return bool
     */
    public function sync_product($product_id, $account_id, $direction = 'bidirectional')
    {
        $product = wc_get_product($product_id);

        if (!$product) {
            TS_ML_Logger::error('Produto não encontrado', array('product_id' => $product_id));
            return false;
        }

        // Validate account
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $account = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_accounts WHERE id = %d AND is_active = 1",
            $account_id
        ));

        if (!$account) {
            TS_ML_Logger::error('Conta não encontrada ou inativa', array('account_id' => $account_id));
            return false;
        }

        // Create or update sync record
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d",
            $product_id,
            $account_id
        ));

        if (!$existing) {
            $wpdb->insert(
                $table_products,
                array(
                    'account_id' => $account_id,
                    'product_id' => $product_id,
                    'sync_direction' => $direction,
                    'sync_status' => 'pending',
                    'created_at' => current_time('mysql'),
                ),
                array('%d', '%d', '%s', '%s', '%s')
            );
        } else {
            $wpdb->update(
                $table_products,
                array(
                    'sync_direction' => $direction,
                    'sync_status' => 'pending',
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $existing->id),
                array('%s', '%s', '%s'),
                array('%d')
            );
        }

        // 1. Check if sync is disabled individually for this product
        $sync_enabled = get_post_meta($product_id, '_ts_ml_sync_enabled', true);
        if ($sync_enabled === 'no') {
            TS_ML_Logger::info('Sincronização ignorada: desativada para este produto nas configurações individuais', array('product_id' => $product_id));
            $this->update_sync_status($product_id, $account_id, 'error', __('Sincronização desativada individualmente.', 'ts-ml-integration'));
            return false;
        }

        // Only enforce quality/niche checks when exporting to ML
        if ($direction === 'woo_to_ml' || $direction === 'bidirectional') {
            // 2. Check if product has photo (if option enabled)
            if (get_option('ts_ml_sync_only_with_photos') === 'yes') {
                if (!$this->has_photo($product)) {
                    TS_ML_Logger::info('Sincronização ignorada: produto sem foto', array('product_id' => $product_id));
                    $this->update_sync_status($product_id, $account_id, 'error', __('Sincronização ignorada: produto sem foto.', 'ts-ml-integration'));
                    return false;
                }
            }

            // 3. Check if product is 100% ready (if option enabled)
            if (get_option('ts_ml_sync_only_ready') === 'yes') {
                if (!$this->is_product_ready($product)) {
                    TS_ML_Logger::info('Sincronização ignorada: produto não está 100% pronto para o ML', array('product_id' => $product_id));
                    $this->update_sync_status($product_id, $account_id, 'error', __('Sincronização ignorada: produto incompleto/não mapeado para o ML.', 'ts-ml-integration'));
                    return false;
                }
            }
        }

        if ($direction === 'woo_to_ml' || $direction === 'bidirectional') {
            return $this->export_product_to_ml($product, $account_id);
        }

        if ($direction === 'ml_to_woo' || $direction === 'bidirectional') {
            // Get ML Item ID if not provided (for existing syncs)
            if (empty($ml_item_id) && $existing && !empty($existing->ml_item_id)) {
                $ml_item_id = $existing->ml_item_id;
            }

            if (!empty($ml_item_id)) {
                return $this->import_product_from_ml($ml_item_id, $account_id);
            }
        }

        return true;
    }

    /**
     * Import product from Mercado Livre
     *
     * @param string $ml_item_id ML Item ID
     * @param int $account_id Account ID
     * @return bool
     */
    public function import_product_from_ml($ml_item_id, $account_id)
    {
        TS_ML_Logger::info('Iniciando importação de produto do ML', array('ml_item_id' => $ml_item_id, 'account_id' => $account_id));

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            TS_ML_Logger::error('Erro ao obter token de acesso', array('error' => $access_token->get_error_message()));
            return false;
        }

        // Get Item Data
        $ml_product_data = $api_handler->api_request('/items/' . $ml_item_id, 'GET', array(), $access_token);

        if (is_wp_error($ml_product_data)) {
            TS_ML_Logger::error('Erro ao buscar dados do produto no ML', array('error' => $ml_product_data->get_error_message()));
            return false;
        }

        // Check if exists by SKU or Sync Record
        $product_id = $this->find_existing_product($ml_item_id, $ml_product_data);

        // VARIATION HANDLING
        // Check if ML product has variations
        $is_variable = !empty($ml_product_data['variations']);

        if ($product_id) {
            $product = wc_get_product($product_id);
            TS_ML_Logger::info('Atualizando produto existente', array('product_id' => $product_id));
        } else {
            // Decide type based on ML data
            $product = $is_variable ? new WC_Product_Variable() : new WC_Product_Simple();
            TS_ML_Logger::info('Criando novo produto (' . ($is_variable ? 'Variable' : 'Simple') . ')');
        }

        // Set Basic Data
        $product->set_name($ml_product_data['title']);
        $product->set_status('publish'); // Or draft, configurable?

        // Attributes (Brand, Model, etc) - Common to both
        // TODO: Map ML Attributes to Woo Attributes formally

        // Description
        // ... (existing desc logic) ...
        if (!isset($ml_product_data['description'])) {
            $description_data = $api_handler->api_request('/items/' . $ml_item_id . '/description', 'GET', array(), $access_token);
            if (!is_wp_error($description_data) && isset($description_data['plain_text'])) {
                $product->set_description($description_data['plain_text']);
            }
        }

        // Images (Parent)
        if (isset($ml_product_data['pictures']) && is_array($ml_product_data['pictures'])) {
            // For variable products, parent images are usually the first variation's or general
            // ML structure: 'pictures' has all images.
            $this->import_product_images($product, $ml_product_data['pictures']);
        }

        if (!$is_variable) {
            // SIMPLE PRODUCT Logic
            if (isset($ml_product_data['price'])) {
                $product->set_regular_price($ml_product_data['price']);
            }
            if (isset($ml_product_data['available_quantity'])) {
                $product->set_manage_stock(true);
                $product->set_stock_quantity($ml_product_data['available_quantity']);
            }
            // Seller SKU
            if (isset($ml_product_data['seller_custom_field'])) {
                $product->set_sku($ml_product_data['seller_custom_field']);
            }
        }

        $product->save();
        $product_id = $product->get_id();

        // VARIABLE PRODUCT Logic
        if ($is_variable) {
            $this->import_variations($product, $ml_product_data['variations'], $ml_product_data['attributes']);
        }

        // Update Sync Record
        $this->update_sync_record($product_id, $account_id, $ml_product_data);

        return true;
    }

    /**
     * Import Variations
     */
    private function import_variations($product, $ml_variations, $ml_attributes_list)
    {
        $attributes_to_sync = array(); // Store attr names for parent

        // 1. Identify Attributes used for variation (Color, Size)
        // ML variation has 'attribute_combinations'.
        // We need to register these attributes in Woo global or custom

        foreach ($ml_variations as $var_data) {
            foreach ($var_data['attribute_combinations'] as $attr) {
                $attr_name = $attr['name']; // e.g., "Cor"
                $attr_val = $attr['value_name']; // e.g., "Azul"

                // Normalize name for Slug
                $slug = sanitize_title($attr_name);

                if (!isset($attributes_to_sync[$slug])) {
                    $attributes_to_sync[$slug] = array(
                        'name' => $attr_name,
                        'options' => array()
                    );
                }
                if (!in_array($attr_val, $attributes_to_sync[$slug]['options'])) {
                    $attributes_to_sync[$slug]['options'][] = $attr_val;
                }
            }
        }

        // 2. Set Attributes on Parent Product
        $product_attributes = array();
        foreach ($attributes_to_sync as $slug => $data) {
            $attribute = new WC_Product_Attribute();
            $attribute->set_id(0);
            $attribute->set_name($data['name']);
            $attribute->set_options($data['options']);
            $attribute->set_position(0);
            $attribute->set_visible(true);
            $attribute->set_variation(true);
            $product_attributes[] = $attribute;
        }
        $product->set_attributes($product_attributes);
        $product->save(); // Save parent to link attrs

        // 3. Create/Update Variations
        foreach ($ml_variations as $var_data) {
            // Find if variation exists by SKU or Sync ID (we need to store ML Var ID)
            // For now, check ID by meta
            $variation_id = $this->get_variation_id_by_ml_id($product->get_id(), $var_data['id']);

            if (!$variation_id) {
                // Check by SKU
                if (isset($var_data['seller_custom_field']) && !empty($var_data['seller_custom_field'])) {
                    // Check if SKU exists and is child of this product
                    $existing_id = wc_get_product_id_by_sku($var_data['seller_custom_field']);
                    if ($existing_id && wp_get_post_parent_id($existing_id) == $product->get_id()) {
                        $variation_id = $existing_id;
                    }
                }
            }

            if ($variation_id) {
                $variation = new WC_Product_Variation($variation_id);
            } else {
                $variation = new WC_Product_Variation();
                $variation->set_parent_id($product->get_id());
            }

            // Map attributes
            $var_attributes = array();
            foreach ($var_data['attribute_combinations'] as $attr) {
                $slug = sanitize_title($attr['name']);
                $var_attributes[$slug] = $attr['value_name'];
            }
            $variation->set_attributes($var_attributes);

            // Set Data
            $variation->set_regular_price($var_data['price']);
            $variation->set_manage_stock(true);
            $variation->set_stock_quantity($var_data['available_quantity']);

            if (isset($var_data['seller_custom_field'])) {
                $variation->set_sku($var_data['seller_custom_field']);
            }

            // Save ML ID
            $variation->save();
            update_post_meta($variation->get_id(), '_ts_ml_variation_id', $var_data['id']);
        }
        $product->save(); // Sync stock status etc
    }

    /** 
     * Get variation by ML ID
     */
    private function get_variation_id_by_ml_id($parent_id, $ml_var_id)
    {
        $args = array(
            'post_type' => 'product_variation',
            'post_parent' => $parent_id,
            'meta_key' => '_ts_ml_variation_id',
            'meta_value' => $ml_var_id,
            'fields' => 'ids'
        );
        $posts = get_posts($args);
        return !empty($posts) ? $posts[0] : false;
    }

    /**
     * Find existing product
     */
    private function find_existing_product($ml_item_id, $ml_data)
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        // Check by ML ID
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT product_id FROM $table_products WHERE ml_item_id = %s",
            $ml_item_id
        ));

        if ($existing)
            return $existing;

        // Check by SKU (Seller SKU in attributes)
        if (isset($ml_data['seller_custom_field'])) {
            $product_id = wc_get_product_id_by_sku($ml_data['seller_custom_field']);
            if ($product_id)
                return $product_id;
        }

        return false;
    }

    /**
     * Import Images
     */
    private function import_product_images($product, $pictures)
    {
        if (empty($pictures))
            return;

        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $gallery_ids = array();
        $main_image_set = false;

        foreach ($pictures as $pic) {
            if (!isset($pic['url']))
                continue;

            // Check if image already exists (by URL or name hash - simplified here)
            // For now, simple download
            $url = $pic['url'];
            $desc = "ML Image " . $pic['id'];

            $file_array = array();
            $file_array['name'] = basename($url);
            $file_array['tmp_name'] = download_url($url);

            if (is_wp_error($file_array['tmp_name']))
                continue;

            $id = media_handle_sideload($file_array, $product->get_id(), $desc);

            if (is_wp_error($id)) {
                @unlink($file_array['tmp_name']);
                continue;
            }

            if (!$main_image_set) {
                $product->set_image_id($id);
                $main_image_set = true;
            } else {
                $gallery_ids[] = $id;
            }
        }

        if (!empty($gallery_ids)) {
            $product->set_gallery_image_ids($gallery_ids);
        }
    }

    /**
     * Calculate Price with Rules
     */
    private function calculate_price($price)
    {
        $percent = floatval(get_option('ts_ml_price_adjustment_percent', 0));
        $fixed = floatval(get_option('ts_ml_price_adjustment_fixed', 0));

        if ($percent != 0) {
            $price = $price * (1 + ($percent / 100));
        }

        if ($fixed != 0) {
            $price = $price + $fixed;
        }

        return round($price, 2);
    }

    /**
     * Export product to Mercado Livre
     *
     * @param WC_Product $product Product object
     * @param int $account_id Account ID
     * @return bool
     */
    private function export_product_to_ml($product, $account_id)
    {
        TS_ML_Logger::info('Iniciando exportação de produto para ML', array('product_id' => $product->get_id(), 'account_id' => $account_id));

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            TS_ML_Logger::error('Erro ao obter token de acesso', array('error' => $access_token->get_error_message()));
            $this->update_sync_status($product->get_id(), $account_id, 'error', $access_token->get_error_message());
            return false;
        }

        // Update status to syncing
        $this->update_sync_status($product->get_id(), $account_id, 'syncing');

        // Prepare product data for ML
        $ml_product_data = $this->prepare_product_for_ml($product);

        // Mercado Livre's /items endpoint doesn't reliably persist an inline "description" —
        // for an already-active item it rejects the whole request outright ("description is
        // not modifiable"), and even on creation it isn't guaranteed to stick. The only
        // reliable path is the dedicated /items/{id}/description endpoint, called separately
        // below once the item itself exists.
        $description_text = isset($ml_product_data['description']['plain_text']) ? $ml_product_data['description']['plain_text'] : '';
        unset($ml_product_data['description']);

        TS_ML_Logger::debug('Dados do produto preparados', array('data' => $ml_product_data));

        // Check if product already exists in ML
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d",
            $product->get_id(),
            $account_id
        ));

        $is_update = $existing && !empty($existing->ml_item_id);

        if ($is_update) {
            // listing_type_id can't change after publish without a dedicated upgrade/
            // downgrade flow — sending it on an update is rejected outright. Use a copy for
            // the update payload: $ml_product_data itself must keep listing_type_id intact,
            // since it's required if this falls through to creating a brand new listing below.
            TS_ML_Logger::info('Atualizando publicação existente', array('ml_item_id' => $existing->ml_item_id));
            $update_payload = $ml_product_data;
            unset($update_payload['listing_type_id']);

            $response = $api_handler->api_request(
                '/items/' . $existing->ml_item_id,
                'PUT',
                $update_payload,
                $access_token
            );

            // A closed OR inactive listing rejects every single field ("title is not
            // modifiable; category_id is not modifiable; ...") — confirmed both
            // "status:closed" and "status:inactive" produce this exact same locked-item
            // pattern (inactive items are common when Mercado Livre auto-deactivates a
            // listing, e.g. after being out of stock too long). Neither can be "reopened" via
            // the API — the only way to keep syncing this product is to publish it as a brand
            // new listing, which also gets a new item ID/permalink.
            if (is_wp_error($response) && preg_match('/status:(closed|inactive)/', $response->get_error_message())) {
                TS_ML_Logger::info('Anúncio anterior está travado (fechado/inativo) no ML — criando um novo em seu lugar', array('old_ml_item_id' => $existing->ml_item_id));
                $is_update = false;
                $response = $api_handler->api_request(
                    '/items',
                    'POST',
                    $ml_product_data,
                    $access_token
                );
            }
        } else {
            // Create new listing
            TS_ML_Logger::info('Criando nova publicação');
            $response = $api_handler->api_request(
                '/items',
                'POST',
                $ml_product_data,
                $access_token
            );
        }

        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            TS_ML_Logger::error('Erro na API do Mercado Livre', array('error' => $error_message));
            $this->update_sync_status($product->get_id(), $account_id, 'error', $error_message);
            return false;
        }

        // Set the description via its own endpoint now that the item definitely exists.
        // Mercado Livre's contract is POST to create a description (an item that doesn't
        // have one yet) and PUT to edit an existing one — but whether the item ALREADY has a
        // description isn't reliably the same thing as whether this sync is an "update" in
        // our own local records (e.g. a prior sync could have set the item's fields fine but
        // failed to set the description). So: always try POST first; if Mercado Livre says
        // one already exists, retry with PUT instead of guessing upfront.
        $ml_item_id = $is_update ? $existing->ml_item_id : (isset($response['id']) ? $response['id'] : '');
        $description_warning = '';
        if ($description_text !== '' && !empty($ml_item_id)) {
            $description_response = $api_handler->api_request(
                '/items/' . $ml_item_id . '/description',
                'POST',
                array('plain_text' => $description_text),
                $access_token
            );

            if (is_wp_error($description_response)) {
                $description_response = $api_handler->api_request(
                    '/items/' . $ml_item_id . '/description',
                    'PUT',
                    array('plain_text' => $description_text),
                    $access_token
                );
            }

            if (is_wp_error($description_response)) {
                $description_warning = $description_response->get_error_message();
                TS_ML_Logger::warning('Item sincronizado, mas a descrição falhou', array(
                    'ml_item_id' => $ml_item_id,
                    'error' => $description_warning,
                ));
            }
        }

        // Update sync record. Product itself synced fine even if the description call above
        // failed — surface that as a visible (non-blocking) warning instead of only logging
        // it, so "description isn't showing up" has an actual answer in the product list.
        $this->update_sync_record($product->get_id(), $account_id, $response, $description_warning ? __('Produto sincronizado, mas a descrição falhou: ', 'ts-ml-integration') . $description_warning : '');

        // Update variations data if variable
        if ($product->is_type('variable') && isset($response['variations'])) {
            $this->update_variations_sync_data($product, $response['variations']);
        }

        TS_ML_Logger::info('Produto sincronizado com sucesso', array('ml_item_id' => isset($response['id']) ? $response['id'] : 'N/A'));

        return true;
    }

    /**
     * Pause a published listing on Mercado Livre (hides it from search/buyers; can be
     * reactivated later by setting status back to 'active').
     *
     * @param int $product_id WooCommerce product ID
     * @param int $account_id
     * @return true|WP_Error
     */
    public function pause_listing($product_id, $account_id)
    {
        return $this->set_listing_status($product_id, $account_id, 'paused');
    }

    /**
     * Reactivate a paused listing on Mercado Livre. Not valid for a 'closed' listing —
     * Mercado Livre rejects reopening a closed one, syncing the product again publishes a
     * fresh listing instead (handled in export_product_to_ml()).
     *
     * @param int $product_id WooCommerce product ID
     * @param int $account_id
     * @return true|WP_Error
     */
    public function activate_listing($product_id, $account_id)
    {
        return $this->set_listing_status($product_id, $account_id, 'active');
    }

    /**
     * Permanently close a listing on Mercado Livre. This is the actual equivalent of
     * "deleting" an ad — Mercado Livre doesn't allow hard-deleting a listing that has ever
     * been active (for buyer/audit history), 'closed' is the real, always-available option.
     *
     * @param int $product_id WooCommerce product ID
     * @param int $account_id
     * @return true|WP_Error
     */
    public function close_listing($product_id, $account_id)
    {
        return $this->set_listing_status($product_id, $account_id, 'closed');
    }

    /**
     * @param int $product_id
     * @param int $account_id
     * @param string $status 'active'|'paused'|'closed'
     * @return true|WP_Error
     */
    private function set_listing_status($product_id, $account_id, $status)
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d",
            $product_id,
            $account_id
        ));

        if (!$existing || empty($existing->ml_item_id)) {
            return new WP_Error('not_synced', __('Este produto ainda não foi publicado no Mercado Livre.', 'ts-ml-integration'));
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return $access_token;
        }

        $response = $api_handler->api_request(
            '/items/' . $existing->ml_item_id,
            'PUT',
            array('status' => $status),
            $access_token
        );

        if (is_wp_error($response)) {
            TS_ML_Logger::error('Erro ao alterar status do anúncio no ML', array(
                'ml_item_id' => $existing->ml_item_id,
                'status' => $status,
                'error' => $response->get_error_message(),
            ));
            return $response;
        }

        TS_ML_Logger::info('Status do anúncio alterado no ML', array('ml_item_id' => $existing->ml_item_id, 'status' => $status));

        $wpdb->update(
            $table_products,
            array('ml_status' => $status, 'updated_at' => current_time('mysql')),
            array('id' => $existing->id),
            array('%s', '%s'),
            array('%d')
        );

        return true;
    }

    /**
     * Prepare product for Mercado Livre
     *
     * @param WC_Product $product Product object
     * @return array
     */
    private function prepare_product_for_ml($product)
    {
        $data = array(
            'title' => $product->get_name(),
            'category_id' => $this->get_ml_category($product),
            'price' => $this->calculate_price(floatval($product->get_price())),
            'currency_id' => 'BRL',
            'available_quantity' => $product->get_stock_quantity() ?: 1,
            'buying_mode' => 'buy_it_now',
            'listing_type_id' => 'gold_special',
            'condition' => 'new',
            'description' => array(
                // Mercado Livre rejects this outright if it isn't genuinely plain text —
                // WooCommerce descriptions are HTML (<p>, <strong>, etc.), so it has to be
                // stripped and decoded first, not sent as-is.
                'plain_text' => $this->to_plain_text($product->get_description() ?: $product->get_short_description()),
            ),
            'pictures' => $this->get_product_images($product),
            'attributes' => $this->get_product_attributes($product),
            // Mercado Livre rejects the listing outright ("Mandatory free shipping added")
            // without a shipping mode. me2 (Mercado Envios) is the standard managed-shipping
            // mode; free_shipping defaults to false (buyer pays) and can be changed per
            // listing in the ML seller dashboard afterwards.
            'shipping' => array(
                'mode' => 'me2',
                'free_shipping' => false,
            ),
        );

        if ($product->is_type('variable')) {
            $variations = $this->get_product_variations_data($product);
            if (!empty($variations)) {
                $data['variations'] = $variations;
                // When variations are present, stock is sum of variations (ML calculates it, but good to ensure valid total)
                $data['available_quantity'] = array_sum(array_column($variations, 'available_quantity'));
            }
        }

        return $data;
    }

    /**
     * Get ML category
     *
     * @param WC_Product $product Product object
     * @return string
     */
    private function get_ml_category($product)
    {
        $categories = $product->get_category_ids();

        if (empty($categories)) {
            return 'MLB1000'; // Default fallback
        }

        $mapper = TS_ML_Category_Mapper::instance();

        // Try to find a mapping for any of the product categories
        foreach ($categories as $cat_id) {
            $ml_cat_id = $mapper->get_ml_category($cat_id);
            if ($ml_cat_id) {
                return $ml_cat_id;
            }
        }

        TS_ML_Logger::warning('Nenhuma categoria mapeada. Usando fallback genérico (MLB1000)', array('product_id' => $product->get_id()));
        return 'MLB1000'; // Fallback if no mapping found
    }

    /**
     * Strip a WooCommerce (HTML) description down to genuine plain text — Mercado Livre's
     * description endpoint rejects anything containing markup.
     *
     * @param string $html
     * @return string
     */
    private function to_plain_text($html)
    {
        // wp_strip_all_tags() removes tags without inserting anything in their place, so
        // "</p><p>" or "<br>" between blocks collapses straight into "...texto!Próximo
        // bloco..." with no separator at all — including "</th><td>" inside a table row,
        // which is why a spec table came out as "ModeloF1-Spray com Rodas 360°" instead of
        // "Modelo: F1-Spray com Rodas 360°". Turn block boundaries into real line breaks
        // (and cell boundaries into ": ") *before* stripping, so paragraphs/list items/
        // headings/tables stay readable.
        $html = preg_replace('/<(br|\/p|\/div|\/h[1-6]|\/li|\/tr)\s*\/?>/i', "\n", $html);
        $html = preg_replace('/<\/t[hd]>\s*<t[hd][^>]*>/i', ': ', $html);
        $html = preg_replace('/<li[^>]*>/i', '• ', $html);

        $text = wp_strip_all_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
    }

    /**
     * Get product images
     *
     * @param WC_Product $product Product object
     * @return array
     */
    private function get_product_images($product)
    {
        $images = array();
        $attachment_ids = $product->get_gallery_image_ids();

        if ($product->get_image_id()) {
            array_unshift($attachment_ids, $product->get_image_id());
        }

        foreach ($attachment_ids as $attachment_id) {
            $image_url = $this->get_ml_compatible_image_url($attachment_id);
            if ($image_url) {
                $images[] = array('source' => $image_url);
            }
        }

        return $images;
    }

    /**
     * Mercado Livre's picture ingestion doesn't reliably accept WebP — an attachment in
     * that format (common with EWWW Image Optimizer and similar, or with images sourced/
     * scraped as .webp to begin with) can get registered but never actually load, leaving
     * the listing with a broken photo and no valid picture (which can also cause Mercado
     * Livre to leave the item paused). Convert to a cached JPEG on the fly when that's the
     * case; every other format passes through unchanged.
     *
     * @param int $attachment_id
     * @return string|false
     */
    private function get_ml_compatible_image_url($attachment_id)
    {
        $image_url = wp_get_attachment_image_url($attachment_id, 'full');
        if (!$image_url) {
            return false;
        }

        if (get_post_mime_type($attachment_id) !== 'image/webp') {
            return $image_url;
        }

        $upload_dir = wp_upload_dir();
        $cache_dir = $upload_dir['basedir'] . '/ts-ml-jpeg-cache';
        $cache_file = $cache_dir . '/' . $attachment_id . '.jpg';
        $cache_url = $upload_dir['baseurl'] . '/ts-ml-jpeg-cache/' . $attachment_id . '.jpg';

        if (file_exists($cache_file)) {
            return $cache_url;
        }

        $source_file = get_attached_file($attachment_id);
        if (!$source_file || !file_exists($source_file)) {
            return $image_url; // Fall back to the (likely broken for ML) webp URL rather than nothing.
        }

        $editor = wp_get_image_editor($source_file);
        if (is_wp_error($editor)) {
            TS_ML_Logger::warning('Não foi possível carregar editor de imagem para conversão WebP→JPEG', array('attachment_id' => $attachment_id));
            return $image_url;
        }

        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }

        $saved = $editor->save($cache_file, 'image/jpeg');
        if (is_wp_error($saved)) {
            TS_ML_Logger::warning('Falha ao converter imagem WebP para JPEG', array(
                'attachment_id' => $attachment_id,
                'error' => $saved->get_error_message(),
            ));
            return $image_url;
        }

        return $cache_url;
    }

    /**
     * Get product attributes
     *
     * @param WC_Product $product Product object
     * @return array
     */
    private function get_product_attributes($product)
    {
        $attributes = array();

        // Most Mercado Livre categories require BRAND and MODEL. Without them the listing
        // is rejected outright ("attributes [BRAND, MODEL] are required for category X"), so
        // these are never skipped — only the SOURCE of the value changes. Mercado Livre's own
        // convention for unbranded/generic products is the literal value "Genérica"/"Genérico",
        // which is accepted across virtually every category, so that's the last resort instead
        // of leaving the attribute out entirely.
        $brand = $this->find_product_value($product, 'product_brand', array('_brand'), array('marca', 'brand'));
        $model = $this->find_product_value($product, '', array('_model'), array('modelo', 'model'));

        // Still nothing structured? Try pulling it from the product's own description text —
        // sellers often write "Modelo: X" / "Marca: Y" in the description without ever
        // filling a dedicated field. Constrained to values literally present in that text
        // (see extract_brand_model_from_description), so this never invents data.
        if ((empty($brand) || empty($model)) && get_option('ts_ml_ai_api_key')) {
            $extracted = $this->extract_brand_model_from_description($product);
            $brand = $brand ?: $extracted['brand'];
            $model = $model ?: $extracted['model'];
        }

        $attributes[] = array('id' => 'BRAND', 'value_name' => $brand ?: 'Genérica');
        $attributes[] = array('id' => 'MODEL', 'value_name' => $model ?: 'Genérico');

        // Add GTIN/EAN if available
        $gtin = $product->get_meta('_ean') ?: ($product->get_meta('_gtin') ?: ($product->get_meta('_ts_ml_ean') ?: ''));
        if (!empty($gtin)) {
            $attributes[] = array(
                'id' => 'GTIN',
                'value_name' => $gtin,
            );
        }

        return $attributes;
    }

    /**
     * Look for a value across the places a store might realistically have it:
     * a WooCommerce taxonomy (e.g. native product_brand), legacy postmeta keys, or a
     * per-product custom attribute (matched by name, not just global pa_* taxonomies).
     *
     * @param WC_Product $product
     * @param string $taxonomy Taxonomy slug to check, or '' to skip
     * @param array $meta_keys Postmeta keys to check, in order
     * @param array $attribute_names Custom attribute names to check (case-insensitive), in order
     * @return string
     */
    private function find_product_value($product, $taxonomy, $meta_keys, $attribute_names)
    {
        if (!empty($taxonomy) && taxonomy_exists($taxonomy)) {
            $terms = get_the_terms($product->get_id(), $taxonomy);
            if (!empty($terms) && !is_wp_error($terms)) {
                return $terms[0]->name;
            }
        }

        foreach ($meta_keys as $meta_key) {
            $value = $product->get_meta($meta_key);
            if (!empty($value)) {
                return $value;
            }
        }

        foreach ($attribute_names as $attribute_name) {
            $value = $product->get_attribute($attribute_name);
            if (!empty($value)) {
                return $value;
            }
        }

        return '';
    }

    /**
     * Ask AI to pull brand/model out of the product's own description — but ONLY values
     * literally written there, never inferred or guessed, since a wrong-but-plausible brand
     * is worse than the honest "Genérica" fallback.
     *
     * @param WC_Product $product
     * @return array{brand: string, model: string}
     */
    private function extract_brand_model_from_description($product)
    {
        $empty = array('brand' => '', 'model' => '');

        $api_key = get_option('ts_ml_ai_api_key');
        if (empty($api_key)) {
            return $empty;
        }

        $description = $this->to_plain_text($product->get_description() ?: $product->get_short_description());
        if ($description === '') {
            return $empty;
        }

        $model_name = get_option('ts_ml_ai_model', 'gpt-4o-mini');
        $system_prompt = 'Você extrai marca e modelo de um produto a partir da descrição dele. ' .
            'Responda APENAS um JSON no formato {"brand": "...", "model": "..."} , sem texto adicional. ' .
            'Use string vazia em qualquer campo que não esteja EXPLICITAMENTE escrito na descrição — nunca invente, deduza ou adivinhe um valor que não apareça literalmente no texto.';

        $messages = array(
            array('role' => 'system', 'content' => $system_prompt),
            array('role' => 'user', 'content' => $description),
        );

        $ai = TS_ML_AI_Integration::instance();
        $response = $ai->call_openai_api($messages, $model_name, $api_key);

        if (is_wp_error($response)) {
            return $empty;
        }

        $result = isset($response['choices'][0]['message']['content']) ? trim($response['choices'][0]['message']['content']) : '';
        $result = preg_replace('/^```(?:json)?|```$/m', '', $result);
        $decoded = json_decode(trim($result), true);

        if (!is_array($decoded)) {
            return $empty;
        }

        return array(
            'brand' => isset($decoded['brand']) ? sanitize_text_field($decoded['brand']) : '',
            'model' => isset($decoded['model']) ? sanitize_text_field($decoded['model']) : '',
        );
    }

    /**
     * Get product variations data
     *
     * @param WC_Product_Variable $product Variable Product
     * @return array
     */
    private function get_product_variations_data($product)
    {
        $variations_data = array();
        $variations = $product->get_available_variations();
        $mapping = get_option('ts_ml_attribute_mapping', array());

        foreach ($variations as $variation) {
            $var_obj = wc_get_product($variation['variation_id']);
            $attributes_combinations = array();

            foreach ($variation['attributes'] as $attr_name => $attr_value) {
                // $attr_name is like 'attribute_pa_color' or just 'pa_color' depending on context, 
                // but in get_available_variations it usually comes as 'attribute_pa_color'

                // Clean slug: 'attribute_pa_color' -> 'pa_color'
                $clean_slug = str_replace('attribute_', '', $attr_name);

                // 1. Try Mapped Value
                $ml_id = isset($mapping[$clean_slug]) ? $mapping[$clean_slug] : '';

                // 2. Fallback Heuristic if no map
                if (empty($ml_id)) {
                    if (stripos($clean_slug, 'cor') !== false || stripos($clean_slug, 'color') !== false)
                        $ml_id = 'COLOR';
                    if (stripos($clean_slug, 'tamanho') !== false || stripos($clean_slug, 'size') !== false)
                        $ml_id = 'SIZE';
                }

                // If we found a mapped ID, add it
                if ($ml_id) {
                    $attributes_combinations[] = array(
                        'id' => $ml_id,
                        'value_name' => $attr_value
                    );
                }
            }

            // Skip if no relevant attributes found (optional, but ML requires at least one distinguishing attribute)
            if (empty($attributes_combinations)) {
                // Se não mapeou tamanho ou cor, usaremos um genérico para não invalidar a variação
                $attributes_combinations[] = array(
                    'id' => 'VARIATION',
                    'value_name' => wc_get_formatted_variation($variation['attributes'], true)
                );
            }

            $var_attributes = array();
            $gtin = $var_obj->get_meta('_ean') ?: ($var_obj->get_meta('_gtin') ?: ($var_obj->get_meta('_ts_ml_ean') ?: ''));
            if (!empty($gtin)) {
                $var_attributes[] = array(
                    'id' => 'GTIN',
                    'value_name' => $gtin,
                );
            }

            $variations_data[] = array(
                'price' => $this->calculate_price(floatval($var_obj->get_price())),
                'available_quantity' => $var_obj->get_stock_quantity() ?: 0,
                'attribute_combinations' => $attributes_combinations,
                'attributes' => $var_attributes,
                'picture_ids' => array(), // Logic to map variation images could be added here
                'seller_custom_field' => $var_obj->get_sku() // Store SKU to map back later
            );
        }

        return $variations_data;
    }

    /**
     * Get products to sync
     *
     * @param int $account_id Account ID
     * @return array
     */
    private function get_products_to_sync($account_id)
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_products WHERE account_id = %d AND sync_status IN ('pending', 'syncing')",
            $account_id
        ));
    }

    /**
     * Update sync record
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @param array $ml_response ML API response
     */
    private function update_sync_record($product_id, $account_id, $ml_response, $warning = '')
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $table_products WHERE product_id = %d AND account_id = %d",
            $product_id,
            $account_id
        ));

        $data = array(
            'ml_item_id' => isset($ml_response['id']) ? $ml_response['id'] : null,
            'ml_listing_id' => isset($ml_response['id']) ? $ml_response['id'] : null,
            // The real, canonical listing URL Mercado Livre returns — don't hand-construct
            // one from just the item ID, the actual URL format/subdomain isn't guessable.
            'permalink' => isset($ml_response['permalink']) ? $ml_response['permalink'] : null,
            // Reset from whatever the real ML response says — critical when a closed listing
            // just got replaced by a brand new one, so the UI stops showing "Finalizado no ML"
            // for a product that's actually active again under a new item ID.
            'ml_status' => isset($ml_response['status']) ? $ml_response['status'] : 'active',
            'sync_status' => 'synced',
            // Not a sync failure (status stays 'synced'), but worth surfacing in the same
            // visible spot rather than only in the internal log — e.g. the description call
            // failing separately from the main item update.
            'sync_errors' => $warning,
            'last_sync_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        );

        if ($existing) {
            $wpdb->update($table_products, $data, array('id' => $existing->id));
        } else {
            $data['product_id'] = $product_id;
            $data['account_id'] = $account_id;
            $data['created_at'] = current_time('mysql');
            $data['sync_direction'] = 'ml_to_woo'; // Default for imported items
            $wpdb->insert($table_products, $data);
        }
    }

    /**
     * Update variations sync data
     * 
     * @param WC_Product $product Parent Product
     * @param array $ml_variations Variations data from ML Response
     */
    private function update_variations_sync_data($product, $ml_variations)
    {
        foreach ($ml_variations as $ml_var) {
            $sku = isset($ml_var['seller_custom_field']) ? $ml_var['seller_custom_field'] : '';
            if (empty($sku))
                continue;

            $variation_id = wc_get_product_id_by_sku($sku);

            // Ensure the variation belongs to the current product (security check)
            if ($variation_id) {
                $variation = wc_get_product($variation_id);
                if ($variation && $variation->get_parent_id() == $product->get_id()) {
                    update_post_meta($variation_id, '_ts_ml_variation_id', $ml_var['id']);
                }
            }
        }
    }

    /**
     * Update sync status
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @param string $status Status
     * @param string $error_message Error message
     */
    private function update_sync_status($product_id, $account_id, $status, $error_message = '')
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        $data = array(
            'sync_status' => $status,
            'sync_errors' => $error_message,
            'updated_at' => current_time('mysql'),
        );

        $where = array(
            'product_id' => $product_id,
            'account_id' => $account_id,
        );

        $wpdb->update($table_products, $data, $where);
    }

    /**
     * Sync account stock
     *
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_account_stock($account_id)
    {
        TS_ML_Logger::info('Iniciando sincronização de estoque', array('account_id' => $account_id));

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            TS_ML_Logger::error('Erro ao obter token para sincronização de estoque', array('error' => $access_token->get_error_message()));
            return false;
        }

        // Get all synced products for this account
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $synced_products = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_products WHERE account_id = %d AND sync_status = 'synced' AND ml_item_id IS NOT NULL",
            $account_id
        ));

        $synced_count = 0;
        $error_count = 0;

        foreach ($synced_products as $sync_record) {
            $product = wc_get_product($sync_record->product_id);

            if (!$product) {
                continue;
            }

            $stock_quantity = $product->get_stock_quantity();
            if ($stock_quantity === null) {
                $stock_quantity = $product->is_in_stock() ? 999 : 0;
            }

            // Update stock on ML
            $response = $api_handler->api_request(
                '/items/' . $sync_record->ml_item_id,
                'PUT',
                array('available_quantity' => intval($stock_quantity)),
                $access_token
            );

            if (is_wp_error($response)) {
                TS_ML_Logger::error('Erro ao atualizar estoque no ML', array(
                    'product_id' => $sync_record->product_id,
                    'ml_item_id' => $sync_record->ml_item_id,
                    'error' => $response->get_error_message()
                ));
                $error_count++;
            } else {
                // Update last sync time
                $wpdb->update(
                    $table_products,
                    array('last_sync_at' => current_time('mysql')),
                    array('id' => $sync_record->id),
                    array('%s'),
                    array('%d')
                );
                $synced_count++;
            }
        }

        TS_ML_Logger::info('Sincronização de estoque concluída', array(
            'synced' => $synced_count,
            'errors' => $error_count
        ));

        return true;
    }

    /**
     * Sync account prices
     *
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_account_prices($account_id)
    {
        TS_ML_Logger::info('Iniciando sincronização de preços', array('account_id' => $account_id));

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            TS_ML_Logger::error('Erro ao obter token para sincronização de preços', array('error' => $access_token->get_error_message()));
            return false;
        }

        // Get all synced products for this account
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';
        $synced_products = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_products WHERE account_id = %d AND sync_status = 'synced' AND ml_item_id IS NOT NULL",
            $account_id
        ));

        $synced_count = 0;
        $error_count = 0;

        foreach ($synced_products as $sync_record) {
            $product = wc_get_product($sync_record->product_id);

            if (!$product) {
                continue;
            }

            $price = floatval($product->get_price());

            if ($price <= 0) {
                continue;
            }

            // Update price on ML
            $response = $api_handler->api_request(
                '/items/' . $sync_record->ml_item_id,
                'PUT',
                array('price' => $price),
                $access_token
            );

            if (is_wp_error($response)) {
                TS_ML_Logger::error('Erro ao atualizar preço no ML', array(
                    'product_id' => $sync_record->product_id,
                    'ml_item_id' => $sync_record->ml_item_id,
                    'error' => $response->get_error_message()
                ));
                $error_count++;
            } else {
                // Update last sync time
                $wpdb->update(
                    $table_products,
                    array('last_sync_at' => current_time('mysql')),
                    array('id' => $sync_record->id),
                    array('%s'),
                    array('%d')
                );
                $synced_count++;
            }
        }

        TS_ML_Logger::info('Sincronização de preços concluída', array(
            'synced' => $synced_count,
            'errors' => $error_count
        ));

        return true;
    }

    /**
     * Sync single product stock
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_product_stock($product_id, $account_id)
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        $sync_record = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d AND sync_status = 'synced' AND ml_item_id IS NOT NULL",
            $product_id,
            $account_id
        ));

        if (!$sync_record) {
            return false;
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return false;
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        $stock_quantity = $product->get_stock_quantity();
        if ($stock_quantity === null) {
            $stock_quantity = $product->is_in_stock() ? 999 : 0;
        }

        $response = $api_handler->api_request(
            '/items/' . $sync_record->ml_item_id,
            'PUT',
            array('available_quantity' => intval($stock_quantity)),
            $access_token
        );

        if (!is_wp_error($response)) {
            $wpdb->update(
                $table_products,
                array('last_sync_at' => current_time('mysql')),
                array('id' => $sync_record->id),
                array('%s'),
                array('%d')
            );

            // Notify SaaS
            $this->notify_saas_of_update($product_id, null, $stock_quantity);

            return true;
        }

        return false;
    }

    /**
     * Sync single product price
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_product_price($product_id, $account_id)
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        $sync_record = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d AND sync_status = 'synced' AND ml_item_id IS NOT NULL",
            $product_id,
            $account_id
        ));

        if (!$sync_record) {
            return false;
        }

        $product = wc_get_product($product_id);
        if (!$product) {
            return false;
        }

        $price = floatval($product->get_price());
        if ($price <= 0) {
            return false;
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        $response = $api_handler->api_request(
            '/items/' . $sync_record->ml_item_id,
            'PUT',
            array('price' => $price),
            $access_token
        );

        if (!is_wp_error($response)) {
            $wpdb->update(
                $table_products,
                array('last_sync_at' => current_time('mysql')),
                array('id' => $sync_record->id),
                array('%s'),
                array('%d')
            );

            // Notify SaaS
            $this->notify_saas_of_update($product_id, $price, null);

            return true;
        }

        return false;
    }

    /**
     * Notify SaaS of update
     */
    private function notify_saas_of_update($product_id, $price = null, $stock = null) {
        $saas_url = get_option('ts_ml_saas_url');
        $bot_id = get_option('ts_ml_bot_id');
        
        if (empty($saas_url) || empty($bot_id)) return;

        $body = array(
            'woo_product_id' => $product_id,
            'price' => $price,
            'stock' => $stock,
            'bot_id' => $bot_id,
            'source' => 'wordpress'
        );

        wp_remote_post($saas_url . '/api/v1/wp/sync', array(
            'method' => 'POST',
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode($body),
            'blocking' => false,
        ));
    }

    /**
     * Update ML item status
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @param string $status New ML status (active, paused, closed)
     * @return bool
     */
    public function update_product_status($product_id, $account_id, $status)
    {
        global $wpdb;
        $table_products = $wpdb->prefix . 'ts_ml_products';

        $sync_record = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d AND sync_status = 'synced' AND ml_item_id IS NOT NULL",
            $product_id,
            $account_id
        ));

        if (!$sync_record) {
            return false;
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        // Prepare data
        $data = array('status' => $status);

        // ML items cannot be reactivated if they are closed.
        // We only send the status update.
        $response = $api_handler->api_request(
            '/items/' . $sync_record->ml_item_id,
            'PUT',
            $data,
            $access_token
        );

        if (!is_wp_error($response)) {
            $wpdb->update(
                $table_products,
                array('last_sync_at' => current_time('mysql')),
                array('id' => $sync_record->id),
                array('%s'),
                array('%d')
            );
            TS_ML_Logger::info('Status do produto atualizado no ML', array(
                'ml_item_id' => $sync_record->ml_item_id,
                'status' => $status
            ));
            return true;
        }

        TS_ML_Logger::error('Erro ao atualizar status do produto no ML', array(
            'ml_item_id' => $sync_record->ml_item_id,
            'error' => $response->get_error_message()
        ));

        return false;
    }

    /**
     * Sync product status to ML based on Woo status
     *
     * @param int $product_id Product ID
     * @param int $account_id Account ID
     * @param string $woo_status WooCommerce status
     * @return bool
     */
    public function sync_product_status_by_woo($product_id, $account_id, $woo_status)
    {
        $ml_status = 'active';

        if ($woo_status === 'trash' || $woo_status === 'deleted') {
            $ml_status = 'closed';
        } elseif ($woo_status === 'draft' || $woo_status === 'private' || $woo_status === 'pending') {
            $ml_status = 'paused';
        }

        return $this->update_product_status($product_id, $account_id, $ml_status);
    }

    /**
     * Check if product has a photo
     *
     * @param WC_Product $product
     * @return bool
     */
    public function has_photo($product)
    {
        return !empty($product->get_image_id());
    }

    /**
     * Check if a product is 100% ready for Mercado Livre
     *
     * @param WC_Product $product
     * @return bool
     */
    public function is_product_ready($product)
    {
        if (!$product) {
            return false;
        }

        // 1. Has name/title
        if (empty($product->get_name())) {
            return false;
        }

        // 2. Has price > 0
        if (floatval($product->get_price()) <= 0) {
            return false;
        }

        // 3. Has stock (in stock, and if managing stock, quantity > 0)
        if (!$product->is_in_stock()) {
            return false;
        }
        if ($product->managing_stock() && $product->get_stock_quantity() <= 0) {
            return false;
        }

        // 4. Has description (content or short description)
        $description = $product->get_description() ?: $product->get_short_description();
        if (empty(trim(wp_strip_all_tags($description)))) {
            return false;
        }

        // 5. Has at least one image
        if (!$this->has_photo($product)) {
            return false;
        }

        // 6. Has mapped category
        $categories = $product->get_category_ids();
        if (empty($categories)) {
            return false;
        }
        $mappings = get_option('ts_ml_category_mappings', array());
        $has_mapped_cat = false;
        foreach ($categories as $cat_id) {
            if (isset($mappings[$cat_id]) && !empty($mappings[$cat_id]) && $mappings[$cat_id] !== 'MLB1000') {
                $has_mapped_cat = true;
                break;
            }
        }
        if (!$has_mapped_cat) {
            return false;
        }

        return true;
    }
}

