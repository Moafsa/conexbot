<?php
/**
 * Plugin Name: Conexbot Automação & CRM (WhatsApp)
 * Plugin URI: https://app.conext.click
 * Description: Integre perfeitamente a Inteligência Artificial Conexão ao seu WooCommerce. O Bot mapeia seu estoque e interage com clientes via Chat e WhatsApp.
 * Version: 1.0.96
 * Author: Conext
 * License: GPLv2 or later
 * Text Domain: conexbot-wp
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. Constantes e Inclusões
define('CONEXBOT_WP_VERSION', '1.0.96');
define('CONEXBOT_WP_PLUGIN_FILE', __FILE__);
define('CONEXBOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CONEXBOT_API_URL', 'https://app.conext.click/api/v1/wp');
define('CONEXBOT_EMBED_URL', 'https://app.conext.click/embed/dashboard');
require_once CONEXBOT_PLUGIN_DIR . 'includes/class-woocommerce-sync.php';
require_once CONEXBOT_PLUGIN_DIR . 'includes/class-conexbot-wp-auto-updater.php';
require_once CONEXBOT_PLUGIN_DIR . 'admin/settings-page.php';

// Inicializar auto updater
if (class_exists('Conexbot_WP_Auto_Updater')) {
    new Conexbot_WP_Auto_Updater(plugin_basename(__FILE__));
}

// 2. Sincronização WooCommerce
add_action('plugins_loaded', function () {
    if (class_exists('WooCommerce')) {
        new Conexbot_WooCommerce_Sync();
    }
});

// 3. Menu Administrativo
add_action('admin_menu', function () {
    add_menu_page('Conexbot', 'Conexbot', 'manage_options', 'conexbot-dashboard', 'conexbot_render_admin_page', 'dashicons-format-chat', 30);
});

add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'toplevel_page_conexbot-dashboard') {
        return;
    }
    wp_enqueue_script(
        'conexbot-admin',
        plugins_url('admin/conexbot-admin.js', __FILE__),
        array(),
        '1.0.3',
        true
    );
    wp_localize_script('conexbot-admin', 'conexbotAdmin', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonceSave' => wp_create_nonce('conexbot_save_action'),
        'nonceSetup' => wp_create_nonce('conexbot_setup_nonce'),
        'token' => get_option('conexbot_api_token', ''),
        'dashboardUrl' => admin_url('admin.php?page=conexbot-dashboard'),
    ));
});

// 4. Salvar Configurações (Token e Bot ID)
add_action('admin_init', function () {
    if (isset($_GET['conexbot_reset']) && current_user_can('manage_options')) {
        delete_option('conexbot_api_token');
        delete_option('conexbot_bot_id');
        wp_redirect(remove_query_arg('conexbot_reset'));
        exit;
    }

    if (isset($_POST['conexbot_save_settings'])) {
        check_admin_referer('conexbot_save_action');
        if (!current_user_can('manage_options'))
            return;

        $token = sanitize_text_field($_POST['conexbot_api_token']);
        $bot_id = sanitize_text_field($_POST['conexbot_bot_id']);

        update_option('conexbot_api_token', $token);
        update_option('conexbot_bot_id', $bot_id);

        wp_redirect(add_query_arg('message', '1', admin_url('admin.php?page=conexbot-dashboard')));
        exit;
    }
});

// 5. Handlers AJAX
add_action('wp_ajax_conexbot_save_token_ajax', function () {
    check_ajax_referer('conexbot_save_action', 'security');
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => 'Sem permissão.'));
    }
    $token = isset($_POST['token']) ? sanitize_text_field(wp_unslash($_POST['token'])) : '';
    if ($token === '') {
        wp_send_json_error(array('message' => 'Token vazio.'));
    }
    update_option('conexbot_api_token', $token);
    wp_send_json_success(array('message' => 'Conexão salva.'));
});

add_action('wp_ajax_conexbot_save_setup', function () {
    check_ajax_referer('conexbot_setup_nonce', 'security');
    if (!current_user_can('manage_options'))
        wp_send_json_error('Sem permissão.');

    update_option('conexbot_api_token', sanitize_text_field($_POST['token']));
    update_option('conexbot_bot_id', sanitize_text_field($_POST['bot_id']));
    wp_send_json_success('Configurações salvas!');
});

add_action('wp_ajax_conexbot_disconnect', function () {
    check_ajax_referer('conexbot_save_action', 'security');
    if (!current_user_can('manage_options'))
        wp_send_json_error('Sem permissão.');

    delete_option('conexbot_api_token');
    delete_option('conexbot_bot_id');
    wp_send_json_success(array('message' => 'Desconectado com sucesso.'));
});

add_action('wp_ajax_conexbot_bulk_sync_ajax', function () {
    check_ajax_referer('conexbot_save_action', 'security');
    if (!current_user_can('manage_options'))
        wp_send_json_error('Sem permissão.');

    $sync = new Conexbot_WooCommerce_Sync();
    $count = $sync->sincronizar_todos_os_produtos();
    if ($count !== false) {
        wp_send_json_success(array('message' => "Sincronização iniciada! $count produtos enviados."));
    } else {
        wp_send_json_error(array('message' => 'Erro ao iniciar sincronização.'));
    }
});

// 6. Chat Nativo no Frontend
add_action('wp_footer', function () {
    $token = get_option('conexbot_api_token', '');
    $bot_id = get_option('conexbot_bot_id', '');

    if (empty($token) || empty($bot_id))
        return;

    $chat_url = "https://app.conext.click/chat-embed/" . $bot_id;

    // Adicionar contexto do usuário logado no WordPress
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $chat_url = add_query_arg(array(
            'name' => $current_user->display_name,
            'email' => $current_user->user_email
        ), $chat_url);
    }
    ?>
    <style>
        #conexbot-native-chat {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 99999;
            font-family: sans-serif;
        }

        .conexbot-bubble {
            width: 60px;
            height: 60px;
            background: #7c3aed;
            border-radius: 50%;
            box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .conexbot-bubble:hover {
            transform: scale(1.1);
        }

        .conexbot-bubble svg {
            width: 30px;
            height: 30px;
            fill: white;
        }

        #conexbot-iframe-container {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 380px;
            height: 600px;
            max-height: 80vh;
            max-width: 90vw;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
            display: none;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }

        #conexbot-iframe-container.open {
            display: block;
        }
    </style>
    <div id="conexbot-native-chat">
        <div id="conexbot-iframe-container">
            <iframe src="<?php echo esc_url($chat_url); ?>" style="width: 100%; height: 100%; border: none;"
                allow="microphone"></iframe>
        </div>
        <div class="conexbot-bubble"
            onclick="document.getElementById('conexbot-iframe-container').classList.toggle('open')">
            <svg viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
        </div>
    </div>
    <?php
});

// --- COMENTÁRIOS WP ---

/**
 * Hook para quando um novo comentário é inserido
 */
add_action('wp_insert_comment', 'conexbot_on_new_comment', 10, 2);
function conexbot_on_new_comment($comment_ID, $comment) {
    // Evitar loop: meta is_conexbot_reply só existe DEPOIS que wp_insert_comment retorna;
    // o hook wp_insert_comment dispara antes, então precisamos deste flag na inserção via AJAX.
    if (!empty($GLOBALS['conexbot_inserting_bot_reply'])) {
        return;
    }
    if (get_comment_meta($comment_ID, 'is_conexbot_reply', true)) {
        return;
    }

    $token = get_option('conexbot_api_token');
    if (!$token)
        return;

    $post = get_post($comment->comment_post_ID);
    /** ID do bot no painel (UUID). O SaaS procura o bot por id; antes enviava-se o token CONEXT por engano. */
    $bot_id = get_option('conexbot_bot_id', '');

    // Detecção Inteligente de Canal (WhatsApp vs WordPress)
    $channel = 'wordpress';
    $whatsapp_chat_jid = null;

    $author_email = $comment->comment_author_email;
    $author_name = $comment->comment_author;

    // Se o e-mail contiver @c.us ou @g.us, ou se o nome for apenas números (telefone)
    if (strpos($author_email, '@c.us') !== false || strpos($author_email, '@g.us') !== false) {
        $channel = 'whatsapp';
        $whatsapp_chat_jid = $author_email;
    } elseif (preg_match('/^\d{8,20}$/', str_replace(['+', ' ', '-', '(', ')'], '', $author_name))) {
        $channel = 'whatsapp';
        // Normalizar número para o formato esperado pelo SaaS
        $whatsapp_chat_jid = preg_replace('/\D/', '', $author_name) . '@c.us';
    }

    $payload = [
        'bot_id' => $bot_id !== '' ? $bot_id : $token,
        'post_id' => $comment->comment_post_ID,
        'post_title' => $post->post_title,
        'post_content' => strip_tags($post->post_content),
        'comment_id' => $comment_ID,
        'comment_author' => $author_name,
        'comment_content' => $comment->comment_content,
        'channel' => $channel,
        'whatsapp_chat_jid' => $whatsapp_chat_jid
    ];

    wp_remote_post('https://app.conext.click/api/webhooks/wordpress', [
        'body' => json_encode($payload),
        'headers' => [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $token
        ],
        'timeout' => 15,
        'blocking' => false // Assíncrono para não travar o WP
    ]);
}

/**
 * Handler AJAX para o SaaS postar a resposta da IA
 */
add_action('wp_ajax_nopriv_conexbot_ai_reply', 'conexbot_ai_reply_callback');
add_action('wp_ajax_conexbot_ai_reply', 'conexbot_ai_reply_callback');

function conexbot_ai_reply_callback()
{
    $token = isset($_POST['token']) ? sanitize_text_field($_POST['token']) : '';
    $saved_token = get_option('conexbot_api_token');
    $saved_bot_id = get_option('conexbot_bot_id', '');

    // SaaS envia bot.webhookToken ou bot.id; o site guarda token CONEXT no login — aceitar também o UUID do bot
    $ok = !empty($token) && (
        hash_equals((string) $saved_token, $token) ||
        ($saved_bot_id !== '' && hash_equals((string) $saved_bot_id, $token))
    );
    if (!$ok) {
        wp_send_json_error('Token inválido', 403);
    }

    $post_id = intval($_POST['post_id']);
    $parent_id = intval($_POST['parent_id']);
    $message = wp_kses_post(wp_unslash($_POST['message']));
    $bot_name = isset($_POST['bot_name']) ? sanitize_text_field($_POST['bot_name']) : (get_bloginfo('name') . ' (IA)');

    if (!$post_id || !$message) {
        wp_send_json_error('Dados incompletos', 400);
    }

    $comment_data = [
        'comment_post_ID' => $post_id,
        'comment_content' => $message,
        'comment_type' => 'comment',
        'comment_parent' => $parent_id,
        'comment_author' => $bot_name,
        'comment_author_email' => get_option('admin_email'),
        'comment_approved' => 1,
    ];

    $GLOBALS['conexbot_inserting_bot_reply'] = true;
    $comment_id = wp_insert_comment($comment_data);
    unset($GLOBALS['conexbot_inserting_bot_reply']);

    if ($comment_id) {
        // Marcar este comentário como sendo do Bot (útil se outro código notificar depois)
        add_comment_meta($comment_id, 'is_conexbot_reply', '1');
        wp_send_json_success(['comment_id' => $comment_id]);
    } else {
        wp_send_json_error('Erro ao inserir comentário');
    }
}
