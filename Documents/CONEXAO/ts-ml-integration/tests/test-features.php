<?php
/**
 * Test Features: Pricing Rules & Attribute Mapping
 *
 * Usage: php tests/test-features.php
 */

// 1. Load WordPress Environment
$wp_load_path = dirname(__FILE__) . '/../../../../wp-load.php';

if (!file_exists($wp_load_path)) {
    die("Error: Could not find wp-load.php at $wp_load_path\n");
}

define('WP_USE_THEMES', false);
require_once($wp_load_path);

// Ensure we are admin
wp_set_current_user(1);

// Colors
$GREEN = "\033[32m";
$RED = "\033[31m";
$RESET = "\033[0m";

echo "Starting ToySport Feature Tests...\n";
echo "----------------------------------\n";

$tests_passed = 0;
$tests_failed = 0;

function assert_equals($expected, $actual, $message)
{
    global $tests_passed, $tests_failed, $GREEN, $RED, $RESET;
    // float comparison safety
    if (is_numeric($expected) && is_numeric($actual)) {
        $diff = abs($expected - $actual);
        if ($diff < 0.001) {
            echo "{$GREEN}[PASS]{$RESET} $message\n";
            $tests_passed++;
            return;
        }
    }

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
// TEST 1: Pricing Rules Logic
// -----------------------------------------------------------------------------
echo "\nTesting Pricing Rules...\n";

$sync = TS_ML_Product_Sync::instance();
$reflection = new ReflectionClass('TS_ML_Product_Sync');
$method = $reflection->getMethod('calculate_price');
$method->setAccessible(true);

// Case 1: No adjustment
update_option('ts_ml_price_adjustment_percent', 0);
update_option('ts_ml_price_adjustment_fixed', 0);
$price = $method->invokeArgs($sync, array(100.00));
assert_equals(100.00, $price, 'Price should remain 100 with no rules');

// Case 2: Percentage Increase (10%)
update_option('ts_ml_price_adjustment_percent', 10);
update_option('ts_ml_price_adjustment_fixed', 0);
$price = $method->invokeArgs($sync, array(100.00));
assert_equals(110.00, $price, 'Price should be 110 with 10% increase');

// Case 3: Fixed Increase (5.00)
update_option('ts_ml_price_adjustment_percent', 0);
update_option('ts_ml_price_adjustment_fixed', 5.00);
$price = $method->invokeArgs($sync, array(100.00));
assert_equals(105.00, $price, 'Price should be 105 with 5.00 fixed');

// Case 4: Both (10% + 5.00)
// Formula: (Price * 1.10) + 5.00
update_option('ts_ml_price_adjustment_percent', 10);
update_option('ts_ml_price_adjustment_fixed', 5.00);
$price = $method->invokeArgs($sync, array(100.00));
assert_equals(115.00, $price, 'Price should be 115 ((100*1.1)+5)');

// Case 5: Negative Percentage (-20%)
update_option('ts_ml_price_adjustment_percent', -20);
update_option('ts_ml_price_adjustment_fixed', 0);
$price = $method->invokeArgs($sync, array(100.00));
assert_equals(80.00, $price, 'Price should be 80 with -20%');


// -----------------------------------------------------------------------------
// TEST 2: Attribute Mapping (Option Saving)
// -----------------------------------------------------------------------------
echo "\nTesting Attribute Mapping Storage...\n";

$mapping = array(
    'pa_tecido' => 'MATERIAL',
    'pa_voltagem' => 'VOLTAGE'
);
update_option('ts_ml_attribute_mapping', $mapping);

$saved = get_option('ts_ml_attribute_mapping');
assert_equals('MATERIAL', $saved['pa_tecido'], 'Mapping for pa_tecido should be MATERIAL');
assert_equals('VOLTAGE', $saved['pa_voltagem'], 'Mapping for pa_voltagem should be VOLTAGE');


echo "\n---------------------------------\n";
echo "Tests Completed.\n";
echo "Passed: $tests_passed\n";
echo "Failed: $tests_failed\n";

if ($tests_failed > 0)
    exit(1);
exit(0);
