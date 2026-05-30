<?php
/*
Plugin Name: Conext Writer
Plugin URI: https://app.conext.click
Description: Multi-Agent AI Writer with OpenAI and Gemini fallbacks for automated content generation and SEO optimization.
Version: 1.0.7
Author: Conext
Text Domain: conext-writer
*/

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Define Plugin Constants
define('CONEXT_WRITER_VERSION', '1.0.7');
define('CONEXT_WRITER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONEXT_WRITER_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include Core Classes
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/class-conext-api.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/class-conext-licensing.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/class-conext-admin.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/class-conext-orchestrator.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/agents/class-agent-supervisor.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/agents/class-agent-researcher.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/agents/class-agent-writer.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/agents/class-agent-seo.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/agents/class-agent-visualist.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/class-conext-i18n-fallback.php';
require_once CONEXT_WRITER_PLUGIN_DIR . 'includes/class-conext-writer-auto-updater.php';

// Initialize Plugin
function conext_writer_init() {
    // Load Text Domain
    load_plugin_textdomain('conext-writer', false, dirname(plugin_basename(__FILE__)) . '/languages');

    // Initialize Auto Updater
    if (class_exists('Conext_Writer_Auto_Updater')) {
        new Conext_Writer_Auto_Updater(plugin_basename(__FILE__));
    }

    // i18n Fallback for missing MO files
    Conext_i18n_Fallback::init();

    // Initialize Admin
    if (is_admin()) {
        $admin = new Conext_Admin();
        $admin->init();
    }

    // Ensure cron is scheduled
    conext_writer_maybe_schedule_cron();
}
add_action('plugins_loaded', 'conext_writer_init');

// Add custom cron interval
add_filter('cron_schedules', 'conext_writer_cron_schedules');
function conext_writer_cron_schedules($schedules) {
    $num = (int) get_option('conext_writer_frequency_num', 24);
    $unit = get_option('conext_writer_frequency_unit', 'hours');
    
    $multiplier = ($unit === 'days') ? 86400 : 3600;
    $interval_seconds = max(1, $num) * $multiplier;
    
    $schedules['conext_writer_custom_interval'] = array(
        'interval' => $interval_seconds,
        'display'  => "A cada $num $unit (Conext Writer)",
    );
    return $schedules;
}

// Scheduled generation hook
add_action('conext_writer_cron_generation', 'conext_writer_run_scheduled_generation');
function conext_writer_run_scheduled_generation() {
    $orchestrator = new Conext_Orchestrator();
    $orchestrator->execute_daily_generation();
}

/**
 * Ensures the cron is scheduled if not already present.
 * Called on init and plugin activation.
 */
function conext_writer_maybe_schedule_cron() {
    if (!wp_next_scheduled('conext_writer_cron_generation')) {
        $num = (int) get_option('conext_writer_frequency_num', 24);
        if ($num > 0) {
            wp_schedule_event(time(), 'conext_writer_custom_interval', 'conext_writer_cron_generation');
        }
    }
}

// Activation hook to schedule cron immediately
register_activation_hook(__FILE__, 'conext_writer_activation');
function conext_writer_activation() {
    conext_writer_maybe_schedule_cron();
}

// Deactivation hook to clean up
register_deactivation_hook(__FILE__, 'conext_writer_deactivation');
function conext_writer_deactivation() {
    wp_clear_scheduled_hook('conext_writer_cron_generation');
}

