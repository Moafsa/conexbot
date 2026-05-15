<?php
/**
 * Standalone Test for Pricing Rules Logic
 * Usage: php tests/test-mocked-features.php
 */

// 1. Mock WordPress Environment
define('ABSPATH', __DIR__ . '/../../../../');

// Mock Data Store
$mock_options = [];

function get_option($key, $default = false)
{
    global $mock_options;
    return isset($mock_options[$key]) ? $mock_options[$key] : $default;
}

function update_option($key, $value)
{
    global $mock_options;
    $mock_options[$key] = $value;
    return true;
}

function wc_get_product($id)
{
    return null;
}
function is_wp_error($thing)
{
    return false;
}
function wp_parse_args($args, $defaults = [])
{
    return $args;
}

// Mock Classes
class TS_ML_API_Handler
{
    public static function instance()
    {
        return new self();
    }
    public function get_valid_token($id)
    {
        return 'token';
    }
}

class TS_ML_Logger
{
    public static function info($msg, $ctx = [])
    {
    }
    public static function error($msg, $ctx = [])
    {
    }
    public static function debug($msg, $ctx = [])
    {
    }
}

class TS_ML_Category_Mapper
{
    public static function instance()
    {
        return new self();
    }
}

// 2. Load Class to Test
// We need to bypass the file check at the top if it uses ABSPATH (we defined it)
require_once __DIR__ . '/../includes/class-ts-ml-product-sync.php';

// 3. Run Tests
$GREEN = "\033[32m";
$RED = "\033[31m";
$RESET = "\033[0m";

echo "Starting Mocked Pricing Tests...\n";
echo "-------------------------------\n";

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

// Setup
$sync = TS_ML_Product_Sync::instance();
$reflection = new ReflectionClass('TS_ML_Product_Sync');
$method = $reflection->getMethod('calculate_price');
$method->setAccessible(true);

// TEST CASES

// Case 1: No rules
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

// Case 6: Decimal Percentage (5.5%)
update_option('ts_ml_price_adjustment_percent', 5.5);
update_option('ts_ml_price_adjustment_fixed', 0);
$price = $method->invokeArgs($sync, array(100.00));
assert_equals(105.50, $price, 'Price should be 105.50 with 5.5%');

echo "\n---------------------------------\n";
echo "Tests Completed.\n";
echo "Passed: $tests_passed\n";
echo "Failed: $tests_failed\n";

if ($tests_failed > 0)
    exit(1);
exit(0);
