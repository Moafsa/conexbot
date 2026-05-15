<?php
/**
 * Test Import Logic (Mocked Environment)
 * 
 * Usage: php tests/test-import-mocked.php
 */

if (!defined('ABSPATH'))
    define('ABSPATH', '/var/www/html/');

$mock_post_meta = array();

// --- MOCKS ---

class MockWPDB
{
    public $prefix = 'wp_';
    public function prepare($query, ...$args)
    {
        return $query;
    }
    public function get_row($query)
    {
        return null;
    } // No existing product
    public function get_var($query)
    {
        return null;
    }
    public function insert($table, $data)
    {
        return 1;
    }
    public function update($table, $data, $where)
    {
        return 1;
    }
    public function get_results($query)
    {
        return array();
    }
}
$wpdb = new MockWPDB();

// WP Functions
function get_option($key, $default = false)
{
    return $default;
}
function update_option($key, $value)
{
}
function add_action($hook, $callback)
{
}
function is_wp_error($thing)
{
    return false;
}
function is_admin()
{
    return true;
}
function wp_remote_post($url, $args)
{
    return array('body' => '{}');
}
function wp_remote_retrieve_body($response)
{
    return $response['body'];
}
function wp_remote_retrieve_response_code($response)
{
    return 200;
}
function get_post_meta($post_id, $key, $single = false)
{
    global $mock_post_meta;
    return isset($mock_post_meta[$post_id][$key]) ? $mock_post_meta[$post_id][$key] : '';
}
function update_post_meta($post_id, $key, $value)
{
    global $mock_post_meta;
    $mock_post_meta[$post_id][$key] = $value;
}
function get_posts($args)
{
    return array();
}
function current_time($type)
{
    return date('Y-m-d H:i:s');
}
function esc_html_e($text)
{
    echo $text;
}
function __($text)
{
    return $text;
}
// intval built-in
function sanitize_title($title)
{
    return strtolower(str_replace(' ', '-', $title));
}
function wp_get_post_parent_id($post_id)
{
    return 0;
}
function wc_get_product_id_by_sku($sku)
{
    return 0;
}

// Logger
class TS_ML_Logger
{
    public static function info($msg, $ctx = [])
    {
        echo "[INFO] $msg\n";
    }
    public static function error($msg, $ctx = [])
    {
        echo "[ERROR] $msg\n";
    }
    public static function debug($msg, $ctx = [])
    {
    }
}

// WC Classes
class WC_Product
{
    protected $id = 0;
    protected $props = array();
    public function __construct($id = 0)
    {
        $this->id = $id ? $id : rand(1000, 9999);
    }
    public function get_id()
    {
        return $this->id;
    }
    public function set_name($n)
    {
        $this->props['name'] = $n;
    }
    public function set_status($s)
    {
        $this->props['status'] = $s;
    }
    public function set_regular_price($p)
    {
        $this->props['price'] = $p;
    }
    public function set_manage_stock($m)
    {
        $this->props['manage_stock'] = $m;
    }
    public function set_stock_quantity($q)
    {
        $this->props['stock'] = $q;
    }
    public function set_description($d)
    {
        $this->props['desc'] = $d;
    }
    public function set_sku($s)
    {
        $this->props['sku'] = $s;
    }
    public function set_image_id($id)
    {
    }
    public function set_gallery_image_ids($ids)
    {
    }
    public function set_attributes($attrs)
    {
        $this->props['attributes'] = $attrs;
    }
    public function save()
    {
    }
    public function get_gallery_image_ids()
    {
        return array();
    }
    public function get_image_id()
    {
        return 0;
    }
    public function get_meta($key)
    {
        return '';
    }
}

class WC_Product_Simple extends WC_Product
{
}

class WC_Product_Variable extends WC_Product
{
}

class WC_Product_Variation extends WC_Product
{
    public function set_parent_id($id)
    {
        $this->props['parent_id'] = $id;
    }
}

class WC_Product_Attribute
{
    public function set_id($id)
    {
    }
    public function set_name($n)
    {
    }
    public function set_options($o)
    {
    }
    public function set_position($p)
    {
    }
    public function set_visible($v)
    {
    }
    public function set_variation($v)
    {
    }
}

function wc_get_product($id)
{
    return new WC_Product($id);
}

// --- API HANDLING ---

// Include Plugin Files
$plugin_dir = dirname(dirname(__FILE__)) . '/';
require_once $plugin_dir . 'includes/class-ts-ml-api-handler.php';
require_once $plugin_dir . 'includes/class-ts-ml-product-sync.php';

// Mock API Handler
class TS_ML_API_Handler_Mock extends TS_ML_API_Handler
{
    public static $instance = null;
    public function __construct()
    {
    }
    public function get_valid_token($account_id)
    {
        return 'mock_token';
    }
    public function api_request($endpoint, $method = 'GET', $data = array(), $access_token = '')
    {
        // Mock Import Response
        if ($method === 'GET' && strpos($endpoint, '/items/MLB123') !== false) {
            return array(
                'id' => 'MLB123',
                'title' => 'Produto Teste Import',
                'price' => 199.90,
                'available_quantity' => 10,
                'variations' => array(
                    array(
                        'id' => 'VAR_ML_1',
                        'price' => 199.90,
                        'available_quantity' => 5,
                        'attribute_combinations' => array(
                            array('name' => 'Cor', 'value_name' => 'Azul'),
                            array('name' => 'Tamanho', 'value_name' => 'M')
                        ),
                        'seller_custom_field' => 'SKU_VAR_1'
                    ),
                    array(
                        'id' => 'VAR_ML_2',
                        'price' => 199.90,
                        'available_quantity' => 5,
                        'attribute_combinations' => array(
                            array('name' => 'Cor', 'value_name' => 'Vermelho'),
                            array('name' => 'Tamanho', 'value_name' => 'G')
                        ),
                        'seller_custom_field' => 'SKU_VAR_2'
                    )
                ),
                'attributes' => array(),
                'pictures' => array()
            );
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

// Inject Mock
$ref = new ReflectionClass('TS_ML_API_Handler');
$prop = $ref->getProperty('instance');
$prop->setAccessible(true);
$prop->setValue(null, new TS_ML_API_Handler_Mock());


// --- RUN TEST ---

echo "Starting Import Test...\n";

$syncer = TS_ML_Product_Sync::instance();
$result = $syncer->import_product_from_ml('MLB123', 1);

if ($result) {
    echo "[PASS] Import returned true.\n";
    // Since we mocked WC_Product, we can't easily check created products unless we store them globally in mock
    // But logs show "Criando novo produto (Variable)" which is a good sign
} else {
    echo "[FAIL] Import returned false.\n";
}
