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
