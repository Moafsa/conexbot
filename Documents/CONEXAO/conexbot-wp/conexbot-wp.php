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

// 1. Definição das constantes e inclusão de arquivos essenciais
define('CONEXBOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONEXBOT_API_URL', 'https://app.conext.click/api/v1/wp'); 
define('CONEXBOT_EMBED_URL', 'https://app.conext.click/embed/crm'); 
require_once CONEXBOT_PLUGIN_DIR . 'includes/class-woocommerce-sync.php';
require_once CONEXBOT_PLUGIN_DIR . 'admin/settings-page.php';

// 2. Inicialização da Sincronização WooCommerce
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        new Conexbot_WooCommerce_Sync();
    }
});

// 3. Registro do Menu Administrativo (Obrigatório para o painel aparecer)
add_action('admin_menu', function() {
    add_menu_page(
        'Conexbot',
        'Conexbot',
        'manage_options',
        'conexbot-dashboard',
        'conexbot_render_admin_page',
        'dashicons-format-chat',
        30
    );
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

// 3. Sincronização em Massa (Bulk Sync)
add_action('wp_ajax_conexbot_bulk_sync_ajax', 'conexbot_bulk_sync_ajax_handler');
function conexbot_bulk_sync_ajax_handler() {
    check_ajax_referer('conexbot_save_action', 'security');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Sem permissão.'));
    }

    $sync = new Conexbot_WooCommerce_Sync();
    $count = $sync->sincronizar_todos_os_produtos();

    if ($count !== false) {
        wp_send_json_success(array('message' => "Sincronização iniciada! $count produtos enviados para a IA."));
    } else {
        wp_send_json_error(array('message' => 'Erro ao iniciar sincronização. Verifique se o plugin está conectado.'));
    }
}

// 4. Salvar ID do Bot Específico
add_action('wp_ajax_conexbot_save_bot_id_ajax', 'conexbot_save_bot_id_ajax_handler');
function conexbot_save_bot_id_ajax_handler() {
    check_ajax_referer('conexbot_save_action', 'security');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Sem permissão.'));
    }

    $bot_id = isset($_POST['bot_id']) ? sanitize_text_field($_POST['bot_id']) : '';
    update_option('conexbot_bot_id', $bot_id);
    
    wp_send_json_success(array('message' => 'ID do Bot atualizado com sucesso.'));
}
