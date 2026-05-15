<?php
/**
 * Test Runner for ToySport ML Integration
 *
 * Usage: php tests/test-runner.php
 */

// 1. Load WordPress Environment
$wp_load_path = dirname(__FILE__) . '/../../../../wp-load.php';

if (!file_exists($wp_load_path)) {
    die("Error: Could not find wp-load.php at $wp_load_path\n");
}

define('WP_USE_THEMES', false);
require_once($wp_load_path);

// Ensure we are admin for some capabilities if needed
wp_set_current_user(1);

// Colors for output
$GREEN = "\033[32m";
$RED = "\033[31m";
$RESET = "\033[0m";

echo "Starting ToySport Plugin Tests...\n";
echo "---------------------------------\n";

$tests_passed = 0;
$tests_failed = 0;

/**
 * Helper Validation Function
 */
function assert_true($condition, $message)
{
    global $tests_passed, $tests_failed, $GREEN, $RED, $RESET;
    if ($condition) {
        echo "{$GREEN}[PASS]{$RESET} $message\n";
        $tests_passed++;
    } else {
        echo "{$RED}[FAIL]{$RESET} $message\n";
        $tests_failed++;
    }
}

function assert_equals($expected, $actual, $message)
{
    global $tests_passed, $tests_failed, $GREEN, $RED, $RESET;
    if ($expected == $actual) {
        echo "{$GREEN}[PASS]{$RESET} $message\n";
        $tests_passed++;
    } else {
        echo "{$RED}[FAIL]{$RESET} $message\n";
        echo "       Expected: " . print_r($expected, true) . "\n";
        echo "       Actual:   " . print_r($actual, true) . "\n";
        $tests_failed++;
    }
}

// -----------------------------------------------------------------------------
// TEST 1: AI Integration (ChatGPT)
// -----------------------------------------------------------------------------
echo "\nTesting AI Integration...\n";

// Setup Options
update_option('ts_ml_ai_api_key', 'sk-test-dummy-key');
update_option('ts_ml_ai_model', 'gpt-3.5-turbo');
update_option('ts_ml_ai_system_prompt', 'System Prompt Test');

// Mock HTTP Request for OpenAI
add_filter('pre_http_request', function ($start, $args, $url) {
    if (strpos($url, 'api.openai.com') !== false) {
        // Verify request body
        $body = json_decode($args['body'], true);
        if ($body['model'] !== 'gpt-3.5-turbo')
            return false;

        return array(
            'response' => array('code' => 200, 'message' => 'OK'),
            'body' => json_encode(array(
                'choices' => array(
                    array(
                        'message' => array(
                            'content' => 'Resposta gerada pela IA'
                        )
                    )
                )
            ))
        );
    }
    return $start;
}, 10, 3);

// Run Test
$ai = TS_ML_AI_Integration::instance();
$reply = $ai->generate_reply('Olá, tem estoque?');

assert_equals('Resposta gerada pela IA', $reply, 'AI should return generated response from API');

// Test Empty Key Fallback
update_option('ts_ml_ai_api_key', '');
$reply_fallback = $ai->generate_reply('Olá, tem estoque?');
assert_equals('Olá, tem estoque?', $reply_fallback, 'AI should return original message if API key is missing');

// Remove Mock
remove_all_filters('pre_http_request');


// -----------------------------------------------------------------------------
// TEST 2: Product Sync (Import ML -> Woo)
// -----------------------------------------------------------------------------
echo "\nTesting Product Import...\n";

// Setup Mock Account
global $wpdb;
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';
$wpdb->query("TRUNCATE TABLE $table_accounts"); // Clear accounts
$wpdb->insert($table_accounts, array(
    'account_name' => 'Conta Teste',
    'country' => 'BR',
    'is_active' => 1,
    'access_token' => 'test-token',
    'expires_in' => time() + 3600
));
$account_id = $wpdb->insert_id;

// Setup Mock ML Item Data
$ml_item_id = 'MLB123456789';
$ml_item_data = array(
    'id' => $ml_item_id,
    'title' => 'Produto de Teste Auto Import',
    'price' => 199.90,
    'available_quantity' => 50,
    'permalink' => 'https://produto.mercadolivre.com.br/test',
    'pictures' => array(
        array('id' => '1', 'url' => 'https://via.placeholder.com/500')
    )
);

// Mock HTTP Request for Mercado Libre
add_filter('pre_http_request', function ($start, $args, $url) use ($ml_item_id, $ml_item_data) {
    // Mock Token Request (Refresh or Validation) - assume valid for this test or mock api call
    // Mock Item Details
    if (strpos($url, "/items/$ml_item_id") !== false && strpos($url, '/description') === false) {
        return array(
            'response' => array('code' => 200, 'message' => 'OK'),
            'body' => json_encode($ml_item_data)
        );
    }
    // Mock Item Description
    if (strpos($url, "/items/$ml_item_id/description") !== false) {
        return array(
            'response' => array('code' => 200, 'message' => 'OK'),
            'body' => json_encode(array('plain_text' => 'Descrição do produto teste'))
        );
    }
    // Mock Image Download (HEAD request or GET)
    if (strpos($url, 'placeholder.com') !== false) {
        return array(
            'response' => array('code' => 200, 'message' => 'OK'),
            'body' => 'fake_image_content' // Simplified, WP media_handle_sideload usually needs real file or more complex mock
        );
    }

    return $start;
}, 10, 3);

// Run Import
$sync = TS_ML_Product_Sync::instance();

// We need to bypass image download for simple test or accept failure there
// Assuming image download might fail in CLI environment without 'allow_url_fopen' or similar, 
// but code should handle it gracefully.

// Note: import_product_from_ml is private? No, let's check class definition again.
// Snippet showed `private function import_product_from_ml`.
// I need to use reflection or change it to public for testing, OR call `sync_product` with `ml_to_woo` direction if that triggers it.
// Looking at `sync_product($product_id, $account_id, $direction)`... it takes a product_id. 
// But verify `sync_product` logic:
// if direction is ml_to_woo...
//   it checks for existing mapping.
// It doesn't look like `sync_product` exposes a way to START from an ML ID easily if it's not mapped yet...
// Wait, my replacement code had:
// if (!empty($ml_item_id)) { return $this->import_product_from_ml($ml_item_id, $account_id); }
// BUT `sync_product` takes `$product_id` (Woo ID) as first arg. 
// If I pass 0 or null, `wc_get_product` returns false.
// `sync_product` returns false if product not found.

// I must verify how I trigger import for a NEW product.
// Usually this happens via Webhook notification ("item created/updated").
// There should be a method to handle webhook or "Import All" button.
// `TS_ML_Product_Sync` should likely have a public `import_product($ml_id, $account_id)` method.
// I made it `private` in my edit: `private function import_product_from_ml`.
// I should use Reflection to test it, or update it to public. Use Reflection for now to avoid changing code just for tests if strict.

$reflection = new ReflectionClass('TS_ML_Product_Sync');
$method = $reflection->getMethod('import_product_from_ml');
$method->setAccessible(true);
$result = $method->invokeArgs($sync, array($ml_item_id, $account_id));

assert_true($result, 'Import method returned true');

// Verify WC Product Created
$product_id_query = $wpdb->get_var($wpdb->prepare(
    "SELECT product_id FROM {$wpdb->prefix}ts_ml_products WHERE ml_item_id = %s",
    $ml_item_id
));

assert_true(!empty($product_id_query), 'Product record created in sync table');

if ($product_id_query) {
    $product = wc_get_product($product_id_query);
    assert_true($product instanceof WC_Product, 'WooCommerce product created');
    assert_equals('Produto de Teste Auto Import', $product->get_name(), 'Product title matches');
    assert_equals(199.90, floatval($product->get_price()), 'Product price matches');
    assert_equals(50, $product->get_stock_quantity(), 'Stock matches');

    // Cleanup
    $product->delete(true);
    $wpdb->delete($wpdb->prefix . 'ts_ml_products', array('product_id' => $product_id_query));
}

echo "\n---------------------------------\n";
echo "Tests Completed.\n";
echo "Passed: $tests_passed\n";
echo "Failed: $tests_failed\n";

if ($tests_failed > 0) {
    exit(1);
} else {
    exit(0);
}
