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
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 10px 20px 0 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }
        .conexbot-card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            padding: 20px;
            text-align: center;
        }
        @media (max-width: 782px) {
            .conexbot-wrap {
                padding: 10px;
            }
            .conexbot-steps {
                grid-template-columns: 1fr !important;
            }
        }
        .conexbot-logo {
            width: 140px;
            margin: 0 auto 24px;
            display: block;
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
        .btn-login {
            background: #fff;
            color: #7c3aed;
            padding: 14px 32px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            border: 2px solid #7c3aed;
            cursor: pointer;
            box-sizing: border-box;
        }
        .btn-login:hover {
            background: #f5f3ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
            color: #7c3aed;
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
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            margin-top: 10px;
        }
        .conexbot-instructions {
            margin-top: 40px;
            padding: 30px;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            text-align: left;
        }
        .conexbot-inst-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin-top: 20px;
        }
        .conexbot-inst-card {
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        .conexbot-inst-h3 {
            font-size: 16px;
            margin: 0 0 10px;
            color: #7c3aed;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .conexbot-inst-p {
            font-size: 13px;
            color: #475569;
            line-height: 1.5;
            margin: 0;
        }
    </style>

    <div class="conexbot-wrap">
        
        <?php if ($is_connected): ?>
            <!-- 1. TELA DE DASHBOARD: Só carrega se houver token -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <h2 style="margin:0; font-weight: 800; font-size: 18px;">Painel de Controle</h2>
                </div>
                
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="conexbot-bulk-sync" class="button button-primary" style="background: #10b981; border: none; height: 32px;">
                        <span class="dashicons dashicons-update" style="font-size: 16px; margin-top: 4px;"></span> Sincronizar Tudo
                    </button>
                    <a href="#" id="conexbot-disconnect" class="btn-disconnect" style="margin:0; padding: 5px 10px; border: 1px solid #ef4444; border-radius: 6px; color: #ef4444;">Desconectar</a>
                </div>
            </div>

            <!-- Bot Config -->
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0; display: flex; align-items: flex-end; gap: 15px;">
                <div style="flex: 1;">
                    <h4 style="margin:0 0 5px; font-size: 13px;">ID do Bot (UUID)</h4>
                    <p style="font-size: 11px; color: #64748b; margin: 0 0 8px;">O ID que vincula este site à inteligência criada no Arquiteto.</p>
                    <input type="text" id="conexbot-bot-id" value="<?php echo esc_attr(get_option('conexbot_bot_id', '')); ?>" placeholder="Cole o UUID do seu Bot aqui" style="width: 100%; font-size: 12px; height: 36px; border-radius: 6px;" />
                </div>
                <button id="conexbot-save-settings" class="button button-primary" style="height: 36px; padding: 0 20px;">Salvar Configuração</button>
            </div>

            <div class="iframe-container" style="margin-top: 10px;">
                <iframe 
                    src="<?php echo esc_url(CONEXBOT_EMBED_URL . '?token=' . $token); ?>" 
                    style="width: 100%; height: 90vh; min-height: 600px; border: none; display: block;"
                    allow="clipboard-write; microphone; camera"
                ></iframe>
            </div>

            <!-- Central de Instruções WordPress-Native -->
            <div class="conexbot-instructions">
                <h2 style="margin:0 0 10px; font-size: 22px; font-weight: 800;">🛠️ Guia de Ativação WordPress</h2>
                <div style="background: #fff4f4; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                    <h4 style="margin:0 0 8px; color: #b91c1c; font-size: 15px; font-weight: 700;">Requisitos para a IA funcionar:</h4>
                    <ul style="margin:0; font-size: 13px; color: #7f1d1d; line-height: 1.6;">
                        <li>💳 <b>1. Plano Ativo:</b> Sua conta Conext.click precisa estar com um plano assinado ou trial.</li>
                        <li>🔑 <b>2. AI Key:</b> Inserção obrigatória para o funcionamento do motor de IA (em <b>Configurações > IA</b>).</li>
                        <li>🤖 <b>3. ID do Bot:</b> Após criar um bot, vincule o UUID acima para ativar a inteligência neste site.</li>
                    </ul>
                </div>

                <div class="conexbot-inst-grid">
                    <div class="conexbot-inst-card">
                        <h3 class="conexbot-inst-h3"><span class="dashicons dashicons-cart"></span> Inteligência de Vendas</h3>
                        <p class="conexbot-inst-p">O bot lê automaticamente seu catálogo WooCommerce. Ele sabe preços, estoque e envia links reais dos produtos para os clientes finalizarem a compra.</p>
                    </div>
                    
                    <div class="conexbot-inst-card">
                        <h3 class="conexbot-inst-h3"><span class="dashicons dashicons-admin-comments"></span> Automação de Contatos</h3>
                        <p class="conexbot-inst-p">Quando um cliente te chama no site ou WhatsApp, o bot usa o treinamento que você fez no <b>Arquiteto</b> para saber como responder baseado no seu negócio.</p>
                    </div>
                    
                    <div class="conexbot-inst-card">
                        <h3 class="conexbot-inst-h3"><span class="dashicons dashicons-clock"></span> Gestão de Leads (CRM)</h3>
                        <p class="conexbot-inst-p">Cada conversa vira um lead automático no seu CRM. Organize por etapas e nunca perca o histórico de quem quase comprou.</p>
                    </div>
                    
                    <div class="conexbot-inst-card">
                        <h3 class="conexbot-inst-h3"><span class="dashicons dashicons-admin-tools"></span> Teste no Simulador</h3>
                        <p class="conexbot-inst-p">Antes de colocar o robô para atender público real, use o <b>Simulador</b> no painel para validar se as respostas estão de acordo com o tom da sua marca.</p>
                    </div>
                </div>

                <div style="margin-top: 25px; padding: 20px; background: #eff6ff; border-radius: 12px; font-size: 13px; color: #1e40af; border: 1px solid #bfdbfe;">
                    <p style="margin:0;">🚀 <b>Dica Pró:</b> O botão "Sincronizar Tudo" envia seus produtos agora. Futuras atualizações de preço ou estoque no WooCommerce são sincronizadas <b>automaticamente</b> em tempo real.</p>
                </div>
            </div>

        <?php elseif (isset($_GET['start_onboarding'])): ?>
            <!-- 2. TELA DE ONBOARDING: Só carrega o iframe quando você clica em "Começar" -->
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
                    <input type="text" name="conexbot_manual_token" placeholder="CONEXT_..." style="width: 100%; margin-bottom: 10px; font-family: monospace; font-size: 11px; width: 100%;" />
                    <button type="submit" name="conexbot_save_manual" class="button button-secondary">Salvar Código Manualmente</button>
                    <a href="<?php echo esc_url(remove_query_arg('start_onboarding')); ?>" style="margin-left: 10px; font-size: 12px; text-decoration: none; color: #666;">Cancelar</a>
                </form>
            </div>
            
            <a href="<?php echo esc_url(admin_url('admin.php?page=conexbot-dashboard')); ?>" class="btn-disconnect">← Voltar para instruções</a>

        <?php else: ?>
            <!-- 3. TELA DE BOAS-VINDAS: Tela padrão sem iframe (evita auto-connect) -->
            <div class="conexbot-card">
                <div class="conexbot-logo">
                    <img src="https://app.conext.click/logo-colored.svg" alt="ConextBot" style="width: 100%; height: auto;">
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

                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 10px;">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=conexbot-dashboard&start_onboarding=1')); ?>" class="btn-connect">
                        Começar Configuração <span class="dashicons dashicons-arrow-right-alt2" style="margin-top:4px"></span>
                    </a>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=conexbot-dashboard&start_onboarding=1')); ?>" class="btn-login">
                        Fazer Login
                    </a>
                </div>
            </div>
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
