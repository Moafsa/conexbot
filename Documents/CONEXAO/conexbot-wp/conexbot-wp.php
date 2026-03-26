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
        $whatsapp = isset($_POST['conexbot_whatsapp_number']) ? sanitize_text_field($_POST['conexbot_whatsapp_number']) : '';
        
        if (!empty($token)) {
            update_option('conexbot_api_token', $token);
            if (!empty($whatsapp)) update_option('conexbot_whatsapp_number', $whatsapp);
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
    $whatsapp = isset($_POST['whatsapp']) ? sanitize_text_field($_POST['whatsapp']) : '';
    
    update_option('conexbot_bot_id', $bot_id);
    if (!empty($whatsapp)) update_option('conexbot_whatsapp_number', $whatsapp);
    
    wp_send_json_success(array('message' => 'Configurações atualizadas com sucesso.'));
}

/**
 * 4. Renderização do Chat Widget no Frontend
 */
add_action('wp_footer', function() {
    $token = get_option('conexbot_api_token', '');
    $whatsapp = get_option('conexbot_whatsapp_number', '');
    
    if (empty($token) || empty($whatsapp)) return;

    $whatsapp_url = "https://wa.me/" . preg_replace('/[^0-9]/', '', $whatsapp);
    ?>
    <style>
        .conexbot-chat-widget {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 99999;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .conexbot-chat-button {
            width: 65px;
            height: 65px;
            background: #25d366;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px rgba(37, 211, 102, 0.4);
            cursor: pointer;
            text-decoration: none;
            position: relative;
        }
        .conexbot-chat-button:hover {
            transform: scale(1.1) translateY(-5px);
            box-shadow: 0 15px 30px rgba(37, 211, 102, 0.5);
        }
        .conexbot-chat-button svg {
            width: 35px;
            height: 35px;
            fill: #fff;
        }
        .conexbot-chat-tooltip {
            position: absolute;
            right: 80px;
            top: 50%;
            transform: translateY(-50%);
            background: #fff;
            color: #1a1a1a;
            padding: 10px 18px;
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s;
        }
        .conexbot-chat-widget:hover .conexbot-chat-tooltip {
            opacity: 1;
            visibility: visible;
            right: 90px;
        }
    </style>
    <div class="conexbot-chat-widget">
        <div class="conexbot-chat-tooltip">Fale com nossa IA agora!</div>
        <a href="<?php echo esc_url($whatsapp_url); ?>" target="_blank" class="conexbot-chat-button">
            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.4l-11.812 4.312 4.411-1.159a11.771 11.771 0 01-5.694 1.484h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
    </div>
    <?php
});
