<?php
/**
 * Plugin Name: Conexbot Automação & CRM (WhatsApp)
 * Plugin URI: https://app.conext.click
 * Description: Integre perfeitamente a Inteligência Artificial Conexão ao seu WooCommerce. O Bot mapeia seu estoque, interage com clientes via WhatsApp e oferece um CRM completo dentro do seu Painel.
 * Version: 1.0.0
 * Author: Equipe Conexão AI
 * License: GPLv2 or later
 * Text Domain: conexbot-wp
 */

if (!defined('ABSPATH')) {
    exit; // Segurança: Exit se acessado diretamente
}

define('CONEXBOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONEXBOT_API_URL', 'https://app.conext.click/api/v1/wp'); // Integrando com a URL oficial
define('CONEXBOT_EMBED_URL', 'https://app.conext.click/embed/crm');

// Inclui as classes necessárias
require_once CONEXBOT_PLUGIN_DIR . 'includes/class-woocommerce-sync.php';
require_once CONEXBOT_PLUGIN_DIR . 'admin/settings-page.php';

// Registra menu no painel
add_action('admin_menu', 'conexbot_register_admin_menu');

function conexbot_register_admin_menu() {
    add_menu_page(
        'Conexbot IA',             // Título da página
        'Conexbot IA',             // Título do Menu
        'manage_options',          // Capacidade (Apenas admin)
        'conexbot-dashboard',      // Slug
        'conexbot_render_admin_page', // Função que renderiza a View
        'dashicons-format-chat',   // Ícone
        56                         // Posição no menu
    );
}

// Inicializa Sincronização
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        new Conexbot_WooCommerce_Sync();
    }
});

// Endpoint AJAX para salvar o Token
add_action('wp_ajax_conexbot_save_token_ajax', 'conexbot_save_token_ajax_handler');

function conexbot_save_token_ajax_handler() {
    // Verifica nonces
    check_ajax_referer('conexbot_save_action', 'security');
    
    // Pega o Token
    $token = isset($_POST['token']) ? sanitize_text_field($_POST['token']) : '';
    
    if (empty($token)) {
        wp_send_json_error(array('message' => 'Token inválido.'));
    }
    
    // Salva a opção no WP
    update_option('conexbot_api_token', $token);
    
    wp_send_json_success(array('message' => 'Token salvo com sucesso.', 'token' => $token));
}
