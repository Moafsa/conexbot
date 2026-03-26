<?php
if (!defined('ABSPATH')) {
    exit;
}

function conexbot_render_admin_page() {
    $token = get_option('conexbot_api_token', '');
    $is_connected = !empty($token);

    // Adicionar estilos CSS modernos
    ?>
    <style>
        .conexbot-wrap {
            max-width: 1000px;
            margin: 20px auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }
        .conexbot-card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            padding: 40px;
            text-align: center;
        }
        .conexbot-logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: #fff;
            box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
        }
        .conexbot-h1 {
            font-size: 28px;
            font-weight: 800;
            color: #1a1a1b;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }
        .conexbot-p {
            font-size: 16px;
            color: #64748b;
            max-width: 600px;
            margin: 0 auto 32px;
            line-height: 1.6;
        }
        .conexbot-steps {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
            text-align: left;
        }
        .conexbot-step {
            padding: 20px;
            background: #f8fafc;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
        }
        .conexbot-step-num {
            width: 28px;
            height: 28px;
            background: #7c3aed;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 12px;
        }
        .conexbot-step-h3 {
            font-size: 15px;
            font-weight: 700;
            margin: 0 0 8px;
            color: #1e293b;
        }
        .conexbot-step-p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
            line-height: 1.4;
        }
        .btn-connect {
            background: #7c3aed;
            color: #fff;
            padding: 14px 32px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }
        .btn-connect:hover {
            background: #6d28d9;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
            color: #fff;
        }
        .btn-disconnect {
            background: transparent;
            color: #94a3b8;
            font-size: 12px;
            text-decoration: none;
            margin-top: 20px;
            display: inline-block;
        }
        .btn-disconnect:hover {
            color: #ef4444;
        }
        .iframe-container {
            background: #000;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            margin-top: 20px;
        }
    </style>

    <div class="conexbot-wrap">
        
        <?php if (!$is_connected && !isset($_GET['start_onboarding'])): ?>
            <!-- Tela de Instruções / Welcome -->
            <div class="conexbot-card">
                <div class="conexbot-logo">
                    <span class="dashicons dashicons-format-chat" style="font-size: 40px; width: 40px; height: 40px;"></span>
                </div>
                <h1 class="conexbot-h1">Turbine seu WordPress com IA</h1>
                <p class="conexbot-p">O Conext.click integra a inteligência artificial mais avançada diretamente ao seu WooCommerce e WhatsApp. Automatize vendas e gerencie leads sem sair do painel.</p>
                
                <div class="conexbot-steps">
                    <div class="conexbot-step">
                        <div class="conexbot-step-num">1</div>
                        <h3 class="conexbot-step-h3">Conecte sua Conta</h3>
                        <p class="conexbot-step-p">Cadastre-se ou faça login na plataforma oficial em segundos.</p>
                    </div>
                    <div class="conexbot-step">
                        <div class="conexbot-step-num">2</div>
                        <h3 class="conexbot-step-h3">Escolha seu Plano</h3>
                        <p class="conexbot-step-p">Selecione o plano que melhor atende ao seu volume de mensagens.</p>
                    </div>
                    <div class="conexbot-step">
                        <div class="conexbot-step-num">3</div>
                        <h3 class="conexbot-step-h3">Inicie a Automação</h3>
                        <p class="conexbot-step-p">Seu estoque e pedidos são sincronizados automaticamente.</p>
                    </div>
                </div>

                <a href="<?php echo esc_url(admin_url('admin.php?page=conexbot-dashboard&start_onboarding=1')); ?>" class="btn-connect">
                    Começar Configuração <span class="dashicons dashicons-arrow-right-alt2" style="margin-top:4px"></span>
                </a>
            </div>

        <?php elseif (isset($_GET['start_onboarding']) && !$is_connected): ?>
            <!-- Iframe de Onboarding -->
            <div class="iframe-container">
                <iframe 
                    src="https://app.conext.click/wp-onboarding" 
                    style="width: 100%; height: 85vh; border: none; display: block;"
                    id="conexbot-onboarding-iframe"
                ></iframe>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #fff; border: 1px dashed #ccc; border-radius: 8px;">
                <h4 style="margin-top: 0; color: #d63638;"><span class="dashicons dashicons-warning" style="vertical-align: middle;"></span> Conexão de Emergência</h4>
                <p style="font-size: 12px; color: #666;">Se o botão "Prosseguir" no quadro acima não funcionar, copie o código gerado no final do processo e cole abaixo:</p>
                <form method="post" action="">
                    <?php wp_nonce_field('conexbot_manual_action', 'conexbot_manual_nonce'); ?>
                    <input type="text" name="conexbot_manual_token" placeholder="CONEXT_..." style="width: 100%; margin-bottom: 10px; font-family: monospace; font-size: 11px;" />
                    <button type="submit" name="conexbot_save_manual" class="button button-secondary">Salvar Código Manualmente</button>
                    <a href="<?php echo esc_url(remove_query_arg('start_onboarding')); ?>" style="margin-left: 10px; font-size: 12px; text-decoration: none; color: #666;">Cancelar</a>
                </form>
            </div>
            
            <script>
            window.addEventListener('message', function(event) {
                if (event.origin !== "https://app.conext.click" && event.origin !== "http://localhost:3000") return;
                
                if (event.data && event.data.type === 'CONEXBOT_AUTH' && event.data.token) {
                    var data = new FormData();
                    data.append('action', 'conexbot_save_token_ajax');
                    data.append('token', event.data.token);
                    data.append('security', '<?php echo wp_create_nonce('conexbot_save_action'); ?>');

                    fetch(ajaxurl, { method: 'POST', body: data })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) window.location.href = "<?php echo admin_url('admin.php?page=conexbot-dashboard'); ?>";
                        else alert('Erro ao salvar conexão.');
                    });
                }
            });
            </script>
            <a href="<?php echo esc_url(admin_url('admin.php?page=conexbot-dashboard')); ?>" class="btn-disconnect">← Voltar para instruções</a>

        <?php else: ?>
            <!-- Dashboard Conectado -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h2 style="margin:0; font-weight: 800;">Painel Conext.click</h2>
                <a href="#" id="conexbot-disconnect" class="btn-disconnect" style="margin:0;">Desconectar da Conta</a>
            </div>

            <div class="iframe-container" style="margin-top: 10px;">
                <iframe 
                    src="<?php echo esc_url(CONEXBOT_EMBED_URL . '?token=' . $token); ?>" 
                    style="width: 100%; height: 85vh; border: none; display: block;"
                    allow="clipboard-write; microphone; camera"
                ></iframe>
            </div>

            <script>
            document.getElementById('conexbot-disconnect').addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Deseja realmente desconectar sua conta? A automação e o CRM pararão de funcionar.')) {
                    var data = new FormData();
                    data.append('action', 'conexbot_disconnect');
                    data.append('security', '<?php echo wp_create_nonce('conexbot_save_action'); ?>');

                    fetch(ajaxurl, { method: 'POST', body: data })
                    .then(() => window.location.reload());
                }
            });
            </script>
        <?php endif; ?>
    </div>
    
    <div style="text-align: center; margin-top: 15px; opacity: 0.5;">
        <a href="<?php echo esc_url(add_query_arg('conexbot_reset', '1', admin_url('admin.php?page=conexbot-dashboard'))); ?>" style="color: #666; font-size: 11px; text-decoration: none;">
            <span class="dashicons dashicons-image-rotate" style="font-size: 14px; vertical-align: middle; margin-right: 4px;"></span>
            Resetar Plugin (Usar em caso de erro de conexão)
        </a>
    </div>
    <?php
}
