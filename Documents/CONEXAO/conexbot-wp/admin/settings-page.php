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
            <!-- Tela de Cadastro/Login Integrada (Iframe) -->
            <div style="background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-top: 20px; max-width: 100%; overflow: hidden;">
                <iframe 
                    src="https://app.conext.click/wp-onboarding" 
                    style="width: 100%; height: 85vh; border: none;"
                    id="conexbot-onboarding-iframe"
                ></iframe>
            </div>
            
            <script>
            document.addEventListener('DOMContentLoaded', function() {
                window.addEventListener('message', function(event) {
                    // Segurança: validar origem
                    if (event.origin !== "https://app.conext.click" && event.origin !== "http://localhost:3000") {
                        // return; // Em desenvolvimento podemos permitir localhost
                    }
                    
                    if (event.data && event.data.type === 'CONEXBOT_AUTH' && event.data.token) {
                        // Recebemos o token! Salvar via AJAX
                        var data = new FormData();
                        data.append('action', 'conexbot_save_token_ajax');
                        data.append('token', event.data.token);
                        data.append('security', '<?php echo wp_create_nonce('conexbot_save_action'); ?>');

                        fetch(ajaxurl, {
                            method: 'POST',
                            body: data
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Sucesso! Recarregar a página para abrir o CRM
                                window.location.reload();
                            } else {
                                alert('Erro ao salvar a conexão com a inteligência: ' + (data.data.message || 'Erro desconhecido.'));
                            }
                        })
                        .catch(err => {
                            console.error('Erro na requisição:', err);
                            alert('Erro de rede ao conectar.');
                        });
                    }
                });
            });
            </script>
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
