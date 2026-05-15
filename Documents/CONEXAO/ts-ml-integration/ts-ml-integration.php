<?php
/**
 * Plugin Name: ToySport Mercado Livre Integration
 * Plugin URI: https://toysport.com.br
 * Description: Integração completa entre WooCommerce e Mercado Livre com sincronização bidirecional, gestão de pedidos, mensagens, envios e muito mais.
 * Version: 1.0.0
 * Author: CONEXT
 * Author URI: https://conext.com.br
 * Text Domain: ts-ml-integration
 * Domain Path: /languages
 * Requires at least: 6.8
 * Requires PHP: 8.2
 * WC requires at least: 10.0
 * WC tested up to: 10.0
 * Update URI: https://seusite.com.br/updates/ts-ml-integration
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants immediately (needed for activation hook)
if (!defined('TS_ML_VERSION')) {
    define('TS_ML_VERSION', '1.0.0');
    define('TS_ML_PLUGIN_FILE', __FILE__);

    // Use dirname(__FILE__) instead of plugin_dir_path to avoid function calls
    // that might not be available when WordPress is just reading plugin headers
    if (!defined('TS_ML_PLUGIN_DIR')) {
        define('TS_ML_PLUGIN_DIR', dirname(__FILE__) . '/');
    }

    // Only use WordPress functions if they're available
    if (!defined('TS_ML_PLUGIN_URL')) {
        if (function_exists('plugins_url')) {
            try {
                define('TS_ML_PLUGIN_URL', plugins_url('', __FILE__) . '/');
            } catch (Exception $e) {
                // Fallback if plugins_url fails
                define('TS_ML_PLUGIN_URL', '');
            }
        } else {
            // Fallback: construct URL manually (may not work in all contexts)
            define('TS_ML_PLUGIN_URL', '');
        }
    }

    if (!defined('TS_ML_PLUGIN_BASENAME')) {
        if (function_exists('plugin_basename')) {
            try {
                define('TS_ML_PLUGIN_BASENAME', plugin_basename(__FILE__));
            } catch (Exception $e) {
                // Fallback if plugin_basename fails
                $basename = basename(dirname(__FILE__)) . '/' . basename(__FILE__);
                define('TS_ML_PLUGIN_BASENAME', $basename);
            }
        } else {
            // Fallback: extract basename manually
            $basename = basename(dirname(__FILE__)) . '/' . basename(__FILE__);
            define('TS_ML_PLUGIN_BASENAME', $basename);
        }
    }

    define('TS_ML_MIN_PHP_VERSION', '8.2');
    define('TS_ML_MIN_WP_VERSION', '6.8');
    define('TS_ML_MIN_WC_VERSION', '10.0');
}

// Register activation/deactivation hooks ONLY if WordPress is loaded enough
// This check prevents errors when WordPress is just reading plugin headers
// IMPORTANT: We need to check if we're in a context where WordPress functions are available
// When WordPress reads plugin headers, some functions may not exist yet
if (function_exists('register_activation_hook')) {
    // Load install class first (needed for activation hook)
    // Only try to load if constants are defined and file system functions work
    if (defined('TS_ML_PLUGIN_DIR') && TS_ML_PLUGIN_DIR) {
        $install_file = TS_ML_PLUGIN_DIR . 'includes/class-ts-ml-install.php';
        if (file_exists($install_file) && is_readable($install_file)) {
            // Use @ to suppress any warnings during include
            @require_once $install_file;

            // Register activation/deactivation hooks at global scope
            // These MUST be registered before plugins_loaded hook
            if (class_exists('TS_ML_Install')) {
                register_activation_hook(TS_ML_PLUGIN_FILE, array('TS_ML_Install', 'activate'));
                register_deactivation_hook(TS_ML_PLUGIN_FILE, array('TS_ML_Install', 'deactivate'));
            }
        }
    }
}

// Initialize plugin only after WordPress is fully loaded
// Only register if add_action is available (prevents errors during plugin header reading)
if (function_exists('add_action')) {
    add_action('plugins_loaded', 'ts_ml_integration_init', 20);
}

/**
 * Initialize plugin
 */
function ts_ml_integration_init()
{
    // Ensure WordPress is fully loaded
    if (!function_exists('add_action')) {
        return;
    }

    // Check PHP version
    if (version_compare(PHP_VERSION, '8.2', '<')) {
        if (function_exists('add_action')) {
            add_action('admin_notices', 'ts_ml_php_version_notice');
        }
        return;
    }

    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        if (function_exists('add_action')) {
            add_action('admin_notices', 'ts_ml_woocommerce_missing_notice');
        }
        return;
    }

    // Load dependencies
    ts_ml_load_dependencies();

    // Check version and upgrade if needed
    if (class_exists('TS_ML_Updater')) {
        TS_ML_Updater::check_version();
    }

    // Initialize auto updater (for remote update checks)
    if (class_exists('TS_ML_Auto_Updater')) {
        new TS_ML_Auto_Updater(TS_ML_PLUGIN_BASENAME);
    }

    // Initialize plugin
    try {
        if (!class_exists('TS_ML_Integration')) {
            return;
        }

        $plugin = TS_ML_Integration::instance();

        // Initialize admin immediately
        // The admin class registers admin_menu hook in its constructor,
        // so we need to instantiate it before admin_menu fires
        // It's safe to call this always - admin_menu only runs in admin context anyway
        if (method_exists($plugin, 'init_admin')) {
            $plugin->init_admin();
        }
    } catch (Exception $e) {
        // Log error but don't break WordPress
        if (defined('WP_DEBUG') && WP_DEBUG && function_exists('error_log')) {
            error_log('TS ML Integration Error: ' . $e->getMessage());
        }
    } catch (Error $e) {
        // Catch fatal errors too
        if (defined('WP_DEBUG') && WP_DEBUG && function_exists('error_log')) {
            error_log('TS ML Integration Fatal Error: ' . $e->getMessage());
        }
    }
}

/**
 * Load plugin dependencies
 */
function ts_ml_load_dependencies()
{
    $includes_dir = TS_ML_PLUGIN_DIR . 'includes/';

    $core_files = array(
        // class-ts-ml-install.php is already loaded above for activation hook
        'class-ts-ml-updater.php',
        'class-ts-ml-auto-updater.php',
        'class-ts-ml-api-handler.php',
        'class-ts-ml-logger.php',
        'class-ts-ml-sync-manager.php',
        'class-ts-ml-product-sync.php',
        'class-ts-ml-order-sync.php',
        'class-ts-ml-message-handler.php',
        'class-ts-ml-shipping-manager.php',
        'class-ts-ml-shipping-method.php',
        'class-ts-ml-ai-integration.php',
        'class-ts-ml-catalog-manager.php',
        'class-ts-ml-reports.php',
        'class-ts-ml-category-mapper.php',
        'class-ts-ml-woocommerce-hooks.php',
    );

    foreach ($core_files as $file) {
        $file_path = $includes_dir . $file;
        if (file_exists($file_path) && is_readable($file_path)) {
            try {
                require_once $file_path;
            } catch (Exception $e) {
                // Log error but continue loading other files
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('TS ML Integration: Error loading ' . $file . ': ' . $e->getMessage());
                }
            }
        }
    }

    if (is_admin()) {
        $admin_file = TS_ML_PLUGIN_DIR . 'admin/class-ts-ml-admin.php';
        if (file_exists($admin_file) && is_readable($admin_file)) {
            try {
                require_once $admin_file;
            } catch (Exception $e) {
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log('TS ML Integration: Error loading admin class: ' . $e->getMessage());
                }
            }
        }
    }

    $public_file = TS_ML_PLUGIN_DIR . 'public/class-ts-ml-public.php';
    if (file_exists($public_file) && is_readable($public_file)) {
        try {
            require_once $public_file;
        } catch (Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('TS ML Integration: Error loading public class: ' . $e->getMessage());
            }
        }
    }
}

/**
 * PHP version notice
 */
function ts_ml_php_version_notice()
{
    ?>
    <div class="error">
        <p>
            <strong><?php esc_html_e('ToySport Mercado Livre Integration', 'ts-ml-integration'); ?></strong>
            <?php
            printf(
                esc_html__('requer PHP %s ou superior. Você está usando PHP %s.', 'ts-ml-integration'),
                '8.2',
                PHP_VERSION
            );
            ?>
        </p>
    </div>
    <?php
}

/**
 * WooCommerce missing notice
 */
function ts_ml_woocommerce_missing_notice()
{
    ?>
    <div class="error">
        <p>
            <strong><?php esc_html_e('ToySport Mercado Livre Integration', 'ts-ml-integration'); ?></strong>
            <?php esc_html_e('requer que o WooCommerce esteja instalado e ativo.', 'ts-ml-integration'); ?>
        </p>
    </div>
    <?php
}

/**
 * Main plugin class
 */
final class TS_ML_Integration
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
        $this->init();
    }

    private function init()
    {
        // Note: Activation/deactivation hooks are registered in ts_ml_integration_init()
        // They must be registered at global scope, not inside a class

        // Only proceed if WordPress functions are available
        if (!function_exists('add_action')) {
            return;
        }

        // Declare WooCommerce compatibility
        add_action('before_woocommerce_init', array($this, 'declare_woocommerce_compatibility'));

        // Load text domain
        add_action('init', array($this, 'load_textdomain'), 10);

        // Initialize components
        add_action('init', array($this, 'init_components'), 20);

        // Register rewrite rules for webhook (only if needed)
        add_action('init', array($this, 'register_webhook_rewrite_rules'), 20);

        // Initialize public
        add_action('init', array($this, 'init_public'), 20);
    }

    /**
     * Declare WooCommerce compatibility
     */
    public function declare_woocommerce_compatibility()
    {
        if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', TS_ML_PLUGIN_FILE, true);
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_product_tables', TS_ML_PLUGIN_FILE, true);
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', TS_ML_PLUGIN_FILE, true);
        }
    }

    public function load_textdomain()
    {
        if (function_exists('load_plugin_textdomain')) {
            $domain_path = '';
            if (defined('TS_ML_PLUGIN_BASENAME') && TS_ML_PLUGIN_BASENAME) {
                $domain_path = dirname(TS_ML_PLUGIN_BASENAME) . '/languages';
            } else {
                $domain_path = 'ts-ml-integration/languages';
            }
            load_plugin_textdomain(
                'ts-ml-integration',
                false,
                $domain_path
            );
        }
    }

    public function init_components()
    {
        if (!class_exists('WooCommerce')) {
            return;
        }

        // Initialize API Handler
        if (class_exists('TS_ML_API_Handler')) {
            TS_ML_API_Handler::instance();
        }

        // Initialize Sync Manager
        if (class_exists('TS_ML_Sync_Manager')) {
            TS_ML_Sync_Manager::instance();
        }

        // Initialize Product Sync
        if (class_exists('TS_ML_Product_Sync')) {
            TS_ML_Product_Sync::instance();
        }

        // Initialize Order Sync
        if (class_exists('TS_ML_Order_Sync')) {
            TS_ML_Order_Sync::instance();
        }

        // Initialize Message Handler
        if (class_exists('TS_ML_Message_Handler')) {
            TS_ML_Message_Handler::instance();
        }

        // Initialize Shipping Manager
        if (class_exists('TS_ML_Shipping_Manager')) {
            TS_ML_Shipping_Manager::instance();
        }

        // Initialize AI Integration
        if (class_exists('TS_ML_AI_Integration')) {
            TS_ML_AI_Integration::instance();
        }

        // Initialize Catalog Manager
        if (class_exists('TS_ML_Catalog_Manager')) {
            TS_ML_Catalog_Manager::instance();
        }

        // Initialize Reports
        if (class_exists('TS_ML_Reports')) {
            TS_ML_Reports::instance();
        }

        // Initialize Category Mapper
        if (class_exists('TS_ML_Category_Mapper')) {
            TS_ML_Category_Mapper::instance();
        }

        // Initialize WooCommerce Hooks
        if (class_exists('TS_ML_WooCommerce_Hooks')) {
            TS_ML_WooCommerce_Hooks::instance();
        }
    }

    /**
     * Initialize admin
     */
    public function init_admin()
    {
        // Load admin class if not already loaded
        if (!class_exists('TS_ML_Admin')) {
            $admin_file = TS_ML_PLUGIN_DIR . 'admin/class-ts-ml-admin.php';
            if (file_exists($admin_file)) {
                require_once $admin_file;
            }
        }

        if (class_exists('TS_ML_Admin')) {
            TS_ML_Admin::instance();
        }
    }

    /**
     * Register webhook rewrite rules
     */
    public function register_webhook_rewrite_rules()
    {
        // Only register if not already registered (avoid duplicates)
        global $wp_rewrite;
        if (is_object($wp_rewrite)) {
            add_rewrite_rule('^ts-ml-webhook/?$', 'index.php?ts_ml_webhook=1', 'top');
            add_rewrite_tag('%ts_ml_webhook%', '([^&]+)');
        }
    }

    public function init_public()
    {
        if (class_exists('TS_ML_Public')) {
            TS_ML_Public::instance();
        }
    }

    public function get_version()
    {
        return TS_ML_VERSION;
    }
}
