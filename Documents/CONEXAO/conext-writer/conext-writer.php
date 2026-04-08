<?php
/*
Plugin Name: Conext Writer
Plugin URI: https://conexbot.com
Description: Multi-Agent AI Writer with OpenAI and Gemini fallbacks for automated content generation and SEO optimization.
Version: 1.0.0
Author: ConexBot
Text Domain: conext-writer
*/

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Define Plugin Constants
define('CONEXT_WRITER_VERSION', '1.0.0');
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

// Initialize Plugin
function conext_writer_init() {
    // Initialize Admin
    if (is_admin()) {
        $admin = new Conext_Admin();
        $admin->init();
    }
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

