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
define('CONEXBOT_EMBED_URL', 'https://app.conext.click/embed/crm'); // Base URL for dashboard

// Inicializa Sincronização
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        new Conexbot_WooCommerce_Sync();
    }
});

// Handler de Reset de Emergência via URL (?conexbot_reset=1)
add_action('admin_init', function() {
    if (isset($_GET['conexbot_reset']) && current_user_can('manage_options')) {
        delete_option('conexbot_api_token');
        wp_redirect(remove_query_arg('conexbot_reset'));
        exit;
    }

    // Handler de Salvamento Manual
    if (isset($_POST['conexbot_save_manual']) && current_user_can('manage_options')) {
        check_admin_referer('conexbot_manual_action', 'conexbot_manual_nonce');
        $token = sanitize_text_field($_POST['conexbot_manual_token']);
        if (!empty($token)) {
            update_option('conexbot_api_token', $token);
            wp_redirect(add_query_arg('message', 'connected'));
            exit;
        }
    }
});

/**
 * Handlers AJAX para Autenticação
 */

// 1. Salvar Token
add_action('wp_ajax_conexbot_save_token_ajax', 'conexbot_save_token_ajax_handler');
function conexbot_save_token_ajax_handler() {
    check_ajax_referer('conexbot_save_action', 'security');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Sem permissão.'));
    }

    $token = isset($_POST['token']) ? sanitize_text_field($_POST['token']) : '';
    if (empty($token)) {
        wp_send_json_error(array('message' => 'Token inválido.'));
    }

    update_option('conexbot_api_token', $token);
    wp_send_json_success(array('message' => 'Conectado com sucesso!', 'token' => $token));
}

// 2. Desconectar Conta
add_action('wp_ajax_conexbot_disconnect', 'conexbot_disconnect_handler');
function conexbot_disconnect_handler() {
    check_ajax_referer('conexbot_save_action', 'security');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Sem permissão.'));
    }

    delete_option('conexbot_api_token');
    wp_send_json_success(array('message' => 'Desconectado com sucesso.'));
}
