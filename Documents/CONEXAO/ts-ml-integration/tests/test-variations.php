<?php
/**
 * Test Variations Flow
 * 
 * Usage: php tests/test-variations.php
 */

// Load WordPress
$wp_load_path = dirname(__FILE__) . '/../../../../wp-load.php';
if (!file_exists($wp_load_path)) {
    die("Error: Could not find wp-load.php\n");
}
define('WP_USE_THEMES', false);
require_once($wp_load_path);

// Log Helper
function test_log($msg, $status = 'INFO')
{
    $color = $status === 'PASS' ? "\033[32m" : ($status === 'FAIL' ? "\033[31m" : "\033[0m");
    echo "{$color}[{$status}] {$msg}\033[0m\n";
}

// 1. Mock API Handler
test_log("Mocking API Handler...");
class TS_ML_API_Handler_Mock
{
    public static $instance = null;
    public function get_valid_token($account_id)
    {
        return 'mock_token';
    }
    public function api_request($endpoint, $method, $data, $token)
    {
        if ($method === 'POST' && strpos($endpoint, '/items') !== false) {
            // Mock specific response for variable product
            if (isset($data['variations'])) {
                $mock_variations = array();
                foreach ($data['variations'] as $idx => $var) {
                    $mock_variations[] = array(
                        'id' => 'ML_VAR_' . ($idx + 1),
                        'seller_custom_field' => isset($var['seller_custom_field']) ? $var['seller_custom_field'] : ''
                    );
                }
                return array(
                    'id' => 'MLB_MOCK_ITEM',
                    'variations' => $mock_variations
                );
            }
            return array('id' => 'MLB_MOCK_ITEM');
        }
        return array();
    }
    public static function instance()
    {
        if (!self::$instance)
            self::$instance = new self();
        return self::$instance;
    }
}

// Monkey Patching: We can't easy replace the singleton in PHP without runkit, 
// but we can assume for this test environment we might modify the class or use a hook if available.
// Since we are running a standalone script, we can't easily swap the class already loaded by WP.
// Instead, we will force the Singleton instance if possible or use a different approach.
// Reflection to reset singleton?
$ref = new ReflectionClass('TS_ML_API_Handler');
$prop = $ref->getProperty('instance');
$prop->setAccessible(true);
$prop->setValue(null, new TS_ML_API_Handler_Mock());
test_log("API Handler Mocked.");

// 2. Create Variable Product
test_log("Creating Variable Product...");
$product = new WC_Product_Variable();
$product->set_name('Test Variable Product ' . time());
$product->set_sku('VAR_PARENT_' . time());
$product->save();

// Create Attributes
$attribute = new WC_Product_Attribute();
$attribute->set_id(0);
$attribute->set_name('Tamanho');
$attribute->set_options(array('P', 'M'));
$attribute->set_position(0);
$attribute->set_visible(true);
$attribute->set_variation(true);
$product->set_attributes(array($attribute));
$product->save();

// Create Variations
$variation1 = new WC_Product_Variation();
$variation1->set_parent_id($product->get_id());
$variation1->set_attributes(array('Tamanho' => 'P'));
$variation1->set_regular_price(100);
$variation1->set_sku('VAR_P_' . time());
$variation1->save();

$variation2 = new WC_Product_Variation();
$variation2->set_parent_id($product->get_id());
$variation2->set_attributes(array('Tamanho' => 'M'));
$variation2->set_regular_price(110);
$variation2->set_sku('VAR_M_' . time());
$variation2->save();

test_log("Product Created. ID: " . $product->get_id());
test_log("Variation 1 SKU: " . $variation1->get_sku());
test_log("Variation 2 SKU: " . $variation2->get_sku());

// 3. Sync Product
test_log("Syncing Product...");
$account_id = 1; // Assume account 1 exists
// Ensure account exists in DB for validation
global $wpdb;
$wpdb->replace($wpdb->prefix . 'ts_ml_accounts', array('id' => 1, 'account_name' => 'Test', 'is_active' => 1));

$syncer = TS_ML_Product_Sync::instance();
$result = $syncer->sync_product($product->get_id(), $account_id, 'woo_to_ml');

if ($result) {
    test_log("Sync returned true.", "PASS");
} else {
    test_log("Sync failed.", "FAIL");
}

// 4. Verify Post Meta
$ml_var_id_1 = get_post_meta($variation1->get_id(), '_ts_ml_variation_id', true);
$ml_var_id_2 = get_post_meta($variation2->get_id(), '_ts_ml_variation_id', true);

if ($ml_var_id_1 === 'ML_VAR_1') {
    test_log("Variation 1 mapped correctly to ML_VAR_1", "PASS");
} else {
    test_log("Variation 1 mapping failed. Got: $ml_var_id_1", "FAIL");
}

if ($ml_var_id_2 === 'ML_VAR_2') {
    test_log("Variation 2 mapped correctly to ML_VAR_2", "PASS");
} else {
    test_log("Variation 2 mapping failed. Got: $ml_var_id_2", "FAIL");
}

// 5. Test Order Import
test_log("Testing Order Import...");
$ml_order_data = array(
    'id' => 'ORDER_MOCK_' . time(),
    'buyer' => array('email' => 'test@example.com', 'first_name' => 'John', 'last_name' => 'Doe'),
    'total_amount' => 100,
    'status' => 'paid',
    'order_items' => array(
        array(
            'item' => array(
                'id' => 'MLB_MOCK_ITEM',
                'variation_id' => 'ML_VAR_1', // Should match Variation 1
                'title' => 'Test Item'
            ),
            'quantity' => 1
        )
    )
);

// We need to inject the mock product into the custom table because get_product_by_ml_id_and_variation fallback checks it
$wpdb->insert($wpdb->prefix . 'ts_ml_products', array(
    'account_id' => 1,
    'product_id' => $product->get_id(),
    'ml_item_id' => 'MLB_MOCK_ITEM',
    'sync_status' => 'synced'
));

$order_sync = TS_ML_Order_Sync::instance();
// We need to access private method import_order_from_ml... or just call sync_account_orders with mocked get_ml_orders
// Easier to use Reflection to call import_order_from_ml
$method = new ReflectionMethod('TS_ML_Order_Sync', 'import_order_from_ml');
$method->setAccessible(true);
$order_id = $method->invoke($order_sync, $ml_order_data, 1);

if ($order_id) {
    test_log("Order created. ID: $order_id", "PASS");
    $order = wc_get_order($order_id);
    $items = $order->get_items();
    $first_item = reset($items);

    if ($first_item->get_variation_id() == $variation1->get_id()) {
        test_log("Order Item matches Variation 1.", "PASS");
    } else {
        test_log("Order Item mismatch. Expected " . $variation1->get_id() . ", got " . $first_item->get_variation_id(), "FAIL");
    }
} else {
    test_log("Order creation failed.", "FAIL");
}

// Cleanup
$product->delete(true);
if ($order_id)
    wp_delete_post($order_id, true);
