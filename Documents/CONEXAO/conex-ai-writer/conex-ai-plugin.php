<?php
/*
Plugin Name: Conex AI Writer Orchestrator
Plugin URI: https://conexbot.com
Description: Multi-Agent AI Writer with OpenAI and Gemini fallbacks for automated 9096bets content generation and SEO optimization.
Version: 1.0.0
Author: ConexBot
Text Domain: conex-ai-writer
*/

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Define Plugin Constants
define('CONEX_AI_VERSION', '1.0.0');
define('CONEX_AI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONEX_AI_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include Core Classes
require_once CONEX_AI_PLUGIN_DIR . 'includes/class-conex-ai-api.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/class-conex-ai-licensing.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/class-conex-ai-admin.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/class-conex-ai-orchestrator.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/agents/class-agent-supervisor.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/agents/class-agent-researcher.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/agents/class-agent-writer.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/agents/class-agent-seo.php';
require_once CONEX_AI_PLUGIN_DIR . 'includes/agents/class-agent-visualist.php';

// Initialize Plugin
function conex_ai_init() {
    // Initialize Admin
    if (is_admin()) {
        $admin = new ConexAI_Admin();
        $admin->init();
    }
}
add_action('plugins_loaded', 'conex_ai_init');

// Add custom cron interval
add_filter('cron_schedules', 'conex_ai_cron_schedules');
function conex_ai_cron_schedules($schedules) {
    $num = (int) get_option('conex_ai_frequency_num', 24);
    $unit = get_option('conex_ai_frequency_unit', 'hours');
    
    $multiplier = ($unit === 'days') ? 86400 : 3600;
    $interval_seconds = max(1, $num) * $multiplier;
    
    $schedules['conex_ai_custom_interval'] = array(
        'interval' => $interval_seconds,
        'display'  => "A cada $num $unit (Conex AI Writer)",
    );
    return $schedules;
}

// Scheduled generation hook
add_action('conex_ai_cron_generation', 'conex_ai_run_scheduled_generation');
function conex_ai_run_scheduled_generation() {
    $orchestrator = new ConexAI_Orchestrator();
    $orchestrator->execute_daily_generation();
}

