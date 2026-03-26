<?php
/**
 * Plugin Name: Conexbot Automação & CRM (WhatsApp)
 * Plugin URI: https://app.conext.click
 * Description: Integre perfeitamente a Inteligência Artificial Conexão ao seu WooCommerce. O Bot mapeia seu estoque e interage com clientes via Chat e WhatsApp.
 * Version: 1.0.3
 * Author: Equipe Conexão AI
 * License: GPLv2 or later
 * Text Domain: conexbot-wp
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. Constantes e Inclusões
define('CONEXBOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONEXBOT_API_URL', 'https://app.conext.click/api/v1/wp'); 
define('CONEXBOT_EMBED_URL', 'https://app.conext.click/embed/bots'); 
require_once CONEXBOT_PLUGIN_DIR . 'includes/class-woocommerce-sync.php';
require_once CONEXBOT_PLUGIN_DIR . 'admin/settings-page.php';

// 2. Sincronização WooCommerce
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        new Conexbot_WooCommerce_Sync();
    }
});

// 3. Menu Administrativo
add_action('admin_menu', function() {
    add_menu_page('Conexbot', 'Conexbot', 'manage_options', 'conexbot-dashboard', 'conexbot_render_admin_page', 'dashicons-format-chat', 30);
});

// 3.5 Enfileirar Scripts de Administração
add_action('admin_enqueue_scripts', function($hook) {
    if ('toplevel_page_conexbot-dashboard' !== $hook) {
        return;
    }

    wp_enqueue_script('conexbot-admin', plugin_dir_url(__FILE__) . 'admin/conexbot-admin.js', array(), '1.0.3', true);

    wp_localize_script('conexbot-admin', 'conexbotAdmin', array(
        'ajaxurl'      => admin_url('admin-ajax.php'),
        'nonceSave'    => wp_create_nonce('conexbot_save_action'),
        'nonceSetup'   => wp_create_nonce('conexbot_setup_nonce'),
        'token'        => get_option('conexbot_api_token', ''),
        'dashboardUrl' => admin_url('admin.php?page=conexbot-dashboard')
    ));
});

// 4. Salvar Configurações (Token e Bot ID)
add_action('admin_init', function() {
    if (isset($_GET['conexbot_reset']) && current_user_can('manage_options')) {
        delete_option('conexbot_api_token');
        delete_option('conexbot_bot_id');
        wp_redirect(remove_query_arg('conexbot_reset'));
        exit;
    }

    if (isset($_POST['conexbot_save_settings'])) {
        check_admin_referer('conexbot_save_action');
        if (!current_user_can('manage_options')) return;
        
        $token = sanitize_text_field($_POST['conexbot_api_token']);
        $bot_id = sanitize_text_field($_POST['conexbot_bot_id']);
        
        update_option('conexbot_api_token', $token);
        update_option('conexbot_bot_id', $bot_id);
        
        wp_redirect(add_query_arg('message', '1', admin_url('admin.php?page=conexbot-dashboard')));
        exit;
    }
});

// 5. Handlers AJAX
add_action('wp_ajax_conexbot_save_setup', function() {
    check_ajax_referer('conexbot_setup_nonce', 'security');
    if (!current_user_can('manage_options')) wp_send_json_error('Sem permissão.');

    update_option('conexbot_api_token', sanitize_text_field($_POST['token']));
    update_option('conexbot_bot_id', sanitize_text_field($_POST['bot_id']));
    wp_send_json_success('Configurações salvas!');
});

add_action('wp_ajax_conexbot_disconnect', function() {
    check_ajax_referer('conexbot_save_action', 'security');
    if (!current_user_can('manage_options')) wp_send_json_error('Sem permissão.');

    delete_option('conexbot_api_token');
    delete_option('conexbot_bot_id');
    wp_send_json_success(array('message' => 'Desconectado com sucesso.'));
});

add_action('wp_ajax_conexbot_bulk_sync_ajax', function() {
    check_ajax_referer('conexbot_save_action', 'security');
    if (!current_user_can('manage_options')) wp_send_json_error('Sem permissão.');

    $sync = new Conexbot_WooCommerce_Sync();
    $count = $sync->sincronizar_todos_os_produtos();
    if ($count !== false) {
        wp_send_json_success(array('message' => "Sincronização iniciada! $count produtos enviados."));
    } else {
        wp_send_json_error(array('message' => 'Erro ao iniciar sincronização.'));
    }
});

add_action('wp_ajax_conexbot_save_token_ajax', function() {
    check_ajax_referer('conexbot_save_action', 'security');
    if (!current_user_can('manage_options')) wp_send_json_error('Sem permissão.');

    $token = isset($_POST['token']) ? sanitize_text_field(wp_unslash($_POST['token'])) : '';
    if (empty($token)) {
        wp_send_json_error('Token vazio.');
    }

    update_option('conexbot_api_token', $token);
    wp_send_json_success(array('message' => 'Conexão salva com sucesso!'));
});

// 6. Chat Nativo no Frontend
add_action('wp_footer', function() {
    $token = get_option('conexbot_api_token', '');
    $bot_id = get_option('conexbot_bot_id', '');
    
    if (empty($token) || empty($bot_id)) return;

    $chat_url = "https://app.conext.click/chat-embed/" . $bot_id;

    // Adicionar contexto do usuário logado no WordPress
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $chat_url = add_query_arg(array(
            'name'  => $current_user->display_name,
            'email' => $current_user->user_email
        ), $chat_url);
    }
    ?>
    <style>
        #conexbot-native-chat { position: fixed; bottom: 30px; right: 30px; z-index: 99999; font-family: sans-serif; }
        .conexbot-bubble { width: 60px; height: 60px; background: #7c3aed; border-radius: 50%; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .conexbot-bubble:hover { transform: scale(1.1); }
        .conexbot-bubble svg { width: 30px; height: 30px; fill: white; }
        #conexbot-iframe-container { position: fixed; bottom: 100px; right: 30px; width: 380px; height: 600px; max-height: 80vh; max-width: 90vw; background: white; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); display: none; overflow: hidden; border: 1px solid #e2e8f0; }
        #conexbot-iframe-container.open { display: block; }
    </style>
    <div id="conexbot-native-chat">
        <div id="conexbot-iframe-container">
            <iframe src="<?php echo esc_url($chat_url); ?>" style="width: 100%; height: 100%; border: none;" allow="microphone"></iframe>
        </div>
        <div class="conexbot-bubble" onclick="document.getElementById('conexbot-iframe-container').classList.toggle('open')">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
    </div>
    <?php
});
