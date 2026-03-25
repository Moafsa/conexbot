<?php
if (!defined('ABSPATH')) {
    exit;
}

function conexbot_render_admin_page() {
    // Processamento de salvamento de Token
    if (isset($_POST['conexbot_save_token']) && check_admin_referer('conexbot_save_action')) {
        $token = sanitize_text_field($_POST['conexbot_token']);
        update_option('conexbot_api_token', $token);
        echo '<div class="notice notice-success is-dismissible"><p>Token salvo com sucesso! O CRM foi ativado.</p></div>';
    }

    $token = get_option('conexbot_api_token', '');

    ?>
    <div class="wrap">
        <h1 style="display:flex; align-items:center; gap: 10px;">
            <span class="dashicons dashicons-format-chat" style="font-size: 32px; width: 32px; height: 32px;"></span>
            Conexbot Automator - CRM Inteligente
        </h1>
        
        <?php if (empty($token)): ?>
            <!-- Tela de Boas Vindas se não tiver Token -->
            <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-top: 20px; max-width: 600px;">
                <h2>Boas-vindas ao ecossistema Conexão!</h2>
                <p>Para ativar o seu Bot de WhatsApp e nosso CRM diretamente nesta tela, insira o seu <strong>Token de Integração</strong> abaixo.</p>
                <form method="post" action="">
                    <?php wp_nonce_field('conexbot_save_action'); ?>
                    <table class="form-table">
                        <tr valign="top">
                            <th scope="row">Token de Acesso:</th>
                            <td>
                                <input type="text" name="conexbot_token" value="" size="50" placeholder="Cole aqui seu longo Token JWT" required />
                                <p class="description">Você pode gerar na tela principal do sistema clicando em Integrações > WordPress.</p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button('Conectar Conta', 'primary', 'conexbot_save_token'); ?>
                </form>
            </div>
        <?php else: ?>
            <!-- Iframe Seamless do Dashboard -->
            <div style="margin-top: 20px;">
                <iframe 
                    src="<?php echo esc_url(CONEXBOT_EMBED_URL . '?token=' . urlencode($token)); ?>" 
                    style="width: 100%; height: 85vh; border: none; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
                    allow="clipboard-write; microphone; camera"
                ></iframe>
            </div>
        <?php endif; ?>
    </div>
    <?php
}
