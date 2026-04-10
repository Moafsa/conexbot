<?php
if (!defined('ABSPATH')) {
    exit;
}

class ConexAI_Admin {
    public function init() {
        add_action('admin_menu', [$this, 'add_menu_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_conex_ai_generate', [$this, 'handle_manual_generate']);
        add_action('admin_post_conex_ai_activate_license', [$this, 'handle_activate_license']);
        
        // Resetar créditos se necessário
        add_action('update_option_conex_ai_frequency_num', [$this, 'reschedule_cron']);
        add_action('update_option_conex_ai_frequency_unit', [$this, 'reschedule_cron']);
    }

    public function add_menu_page() {
        add_menu_page(
            'Conex AI Writer',
            'Conex AI Writer',
            'manage_options',
            'conex-ai-writer',
            [$this, 'render_admin_page'],
            'dashicons-superhero',
            65
        );
    }

    public function register_settings() {
        register_setting('conex_ai_settings', 'conex_ai_openai_key');
        register_setting('conex_ai_settings', 'conex_ai_gemini_key');
        register_setting('conex_ai_settings', 'conex_ai_news_source');
        
        register_setting('conex_ai_settings', 'conex_ai_frequency_num');
        register_setting('conex_ai_settings', 'conex_ai_frequency_unit');
        register_setting('conex_ai_settings', 'conex_ai_topic_random');
        register_setting('conex_ai_settings', 'conex_ai_topic_products');
        register_setting('conex_ai_settings', 'conex_ai_search_terms');
        register_setting('conex_ai_settings', 'conex_ai_custom_topics');
        register_setting('conex_ai_settings', 'conex_ai_tone');
        register_setting('conex_ai_settings', 'conex_ai_word_count');
        register_setting('conex_ai_settings', 'conex_ai_image_count', ['default' => 1]);
    }

    public function reschedule_cron() {
        // Triggered when the frequency interval changes. We will wait for both updates to finish, 
        // the actual clear/schedule relies on the main plugin file detecting the change or we handle it here.
        wp_clear_scheduled_hook('conex_ai_cron_generation');
        $num = (int) get_option('conex_ai_frequency_num', 24);
        $unit = get_option('conex_ai_frequency_unit', 'hours');
        if ($num > 0) {
            // "conex_ai_custom_interval" will be registered in cron_schedules
            wp_schedule_event(time(), 'conex_ai_custom_interval', 'conex_ai_cron_generation');
        }
    }

    public function render_admin_page() {
        $credits_used = ConexAI_Licensing::get_credits_total() - ConexAI_Licensing::get_credits_remaining();
        $total = ConexAI_Licensing::get_credits_total();
        $percent = ($total > 0) ? ($credits_used / $total) * 100 : 100;
        $status_color = ($percent > 80) ? '#d63638' : '#2271b1';
        ?>
        <div class="wrap conex-ai-admin-wrap">
            <style>
                .conex-ai-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
                .conex-ai-progress { background: #f0f0f1; border-radius: 10px; height: 20px; width: 100%; margin: 15px 0; overflow: hidden; }
                .conex-ai-bar { background: <?php echo $status_color; ?>; height: 100%; transition: width 0.5s ease; }
                .tier-badge { background: #3c434a; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; float: right; }
                .upgrade-btn { background: #f6f7f7; color: #2271b1; border: 1px solid #2271b1; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 10px; }
                .upgrade-btn:hover { background: #2271b1; color: #fff; }
            </style>

            <h1>Conex AI Writer <span class="tier-badge"><?php echo ConexAI_Licensing::get_tier_label(); ?></span></h1>
            
            <div class="conex-ai-card">
                <h3>Uso de Créditos Mensais</h3>
                <div class="conex-ai-progress">
                    <div class="conex-ai-bar" style="width: <?php echo $percent; ?>%;"></div>
                </div>
                <p><strong><?php echo ConexAI_Licensing::get_credits_remaining(); ?></strong> créditos restantes de <?php echo $total; ?>.</p>
                <?php if ($total <= 10): ?>
                    <a href="https://conexbot.com/precos" class="upgrade-btn" target="_blank">Upgrade para Plano Gold (50 posts)</a>
                <?php endif; ?>
            </div>

            <h2 class="nav-tab-wrapper">
                <a href="#settings" class="nav-tab nav-tab-active">Configurações</a>
                <a href="#licensing" class="nav-tab">Licenciamento</a>
            </h2>

            <div id="conex-settings-tab">
                <form method="post" action="options.php">
                <?php settings_fields('conex_ai_settings'); ?>
                <?php do_settings_sections('conex_ai_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">OpenAI API Key</th>
                        <td><input type="password" name="conex_ai_openai_key" value="<?php echo esc_attr(get_option('conex_ai_openai_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Google Gemini API Key</th>
                        <td><input type="password" name="conex_ai_gemini_key" value="<?php echo esc_attr(get_option('conex_ai_gemini_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Frequência de Postagens</th>
                        <td>
                            A cada <input type="number" name="conex_ai_frequency_num" value="<?php echo esc_attr(get_option('conex_ai_frequency_num', 24)); ?>" class="small-text" min="1" />
                            <select name="conex_ai_frequency_unit">
                                <option value="hours" <?php selected(get_option('conex_ai_frequency_unit', 'hours'), 'hours'); ?>>Hora(s)</option>
                                <option value="days" <?php selected(get_option('conex_ai_frequency_unit', 'hours'), 'days'); ?>>Dia(s)</option>
                            </select>
                            <p class="description">Define quando a IA deve gerar um novo post automaticamente.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Assunto Principal</th>
                        <td>
                            <fieldset>
                                <label>
                                    <input type="checkbox" name="conex_ai_topic_random" value="1" <?php checked(get_option('conex_ai_topic_random'), 1); ?> />
                                    Notícias, Tendências e Dicas (Aleatórias)
                                </label><br>
                                <label>
                                    <input type="checkbox" name="conex_ai_topic_products" value="1" <?php checked(get_option('conex_ai_topic_products'), 1); ?> />
                                    Meus Produtos / Serviços (Via WooCommerce e Lista)
                                </label>
                                <p class="description">Marque ambas para a IA sortear (50/50) a cada postagem.</p>
                            </fieldset>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Termos de Pesquisa Extras</th>
                        <td>
                            <input type="text" name="conex_ai_search_terms" value="<?php echo esc_attr(get_option('conex_ai_search_terms')); ?>" class="large-text" placeholder="Ex: RPG, Ação, Playstation, Jogos de Tabuleiro, Poker..." />
                            <p class="description">Obriga a IA a focar nesses nichos durante a criação dos posts e das imagens.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Meus Produtos/Serviços</th>
                        <td>
                            <textarea name="conex_ai_custom_topics" rows="3" class="large-text" placeholder="Se você escolheu 'Meus Produtos/Serviços', descreva aqui os produtos ou temas que quer abordar..."><?php echo esc_textarea(get_option('conex_ai_custom_topics')); ?></textarea>
                            <p class="description">Explique o que você vende ou os assuntos específicos que deseja tratar. A IA focará neles.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Tom de Escrita</th>
                        <td>
                            <select name="conex_ai_tone">
                                <option value="Persuasivo e Vendedor" <?php selected(get_option('conex_ai_tone', 'Persuasivo e Vendedor'), 'Persuasivo e Vendedor'); ?>>Persuasivo e Vendedor</option>
                                <option value="Informativo e Direto" <?php selected(get_option('conex_ai_tone'), 'Informativo e Direto'); ?>>Informativo e Direto</option>
                                <option value="Descontraído e Casual" <?php selected(get_option('conex_ai_tone'), 'Descontraído e Casual'); ?>>Descontraído e Casual</option>
                                <option value="Agressivo (Gatilhos Mentais)" <?php selected(get_option('conex_ai_tone'), 'Agressivo (Gatilhos Mentais)'); ?>>Agressivo (Gatilhos Mentais)</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Tamanho Médio (Palavras)</th>
                        <td>
                            <select name="conex_ai_word_count">
                                <option value="500-1000" <?php selected(get_option('conex_ai_word_count'), '500-1000'); ?>>Curto (500-1000 palavras)</option>
                                <option value="1500-3000" <?php selected(get_option('conex_ai_word_count', '1500-3000'), '1500-3000'); ?>>Médio/Longo (1500-3000 palavras)</option>
                                <option value="3000-5000" <?php selected(get_option('conex_ai_word_count'), '3000-5000'); ?>>Muito Longo (3000-5000 palavras)</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Número de Imagens</th>
                        <td>
                            <input type="number" name="conex_ai_image_count" value="<?php echo esc_attr(get_option('conex_ai_image_count', 1)); ?>" class="small-text" min="1" max="3" />
                            <p class="description">Máximo recomendado: 3 imagens (Evita limites de API).</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Fontes de Notícias ou RSS</th>
                        <td>
                            <textarea name="conex_ai_news_source" rows="5" class="large-text code" placeholder="Cole URLs de fontes (uma por linha) ou deixe em branco para busca 100% automática">
<?php echo esc_textarea(get_option('conex_ai_news_source')); ?>
                            </textarea>
                            <p class="description">Insira a URL de um feed RSS, o link direto de um site/domínio, ou deixe em branco para o Agente pesquisar na Web livremente sobre os assuntos.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr />
            <h2>Teste de Geração</h2>
            <p>Clique no botão abaixo para forçar o Orquestrador a pesquisar, escrever e publicar um post agora.</p>
            <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                <input type="hidden" name="action" value="conex_ai_generate">
                <?php wp_nonce_field('conex_ai_generate_action', 'conex_ai_nonce'); ?>
                <?php submit_button('Gerar Post AGORA (Manual)', 'secondary', 'generate_post'); ?>
            </form>
            </div>

            <div id="conex-licensing-tab" style="display:none;">
                <div class="conex-ai-card">
                    <h3>Ativar Licença Premium</h3>
                    <p>Insira sua licença recebida após a compra para liberar mais créditos e funções.</p>
                    <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                        <input type="hidden" name="action" value="conex_ai_activate_license">
                        <?php wp_nonce_field('conex_ai_license_action', 'conex_ai_license_nonce'); ?>
                        <input type="text" name="license_key" value="<?php echo esc_attr(get_option('conex_ai_license_key')); ?>" class="regular-text" placeholder="PRO-XXXX-XXXX" />
                        <?php submit_button('Ativar Agora', 'primary', 'activate_license'); ?>
                    </form>
                    <hr>
                    <h4>Onde comprar?</h4>
                    <p>Visite <a href="https://conexbot.com" target="_blank">conexbot.com</a> para assinar um plano mensal.</p>
                </div>
            </div>

            <script>
                jQuery(document).ready(function($) {
                    $('.nav-tab').click(function(e) {
                        e.preventDefault();
                        $('.nav-tab').removeClass('nav-tab-active');
                        $(this).addClass('nav-tab-active');
                        
                        var target = $(this).attr('href');
                        if (target == '#settings') {
                            $('#conex-settings-tab').show();
                            $('#conex-licensing-tab').hide();
                        } else {
                            $('#conex-settings-tab').hide();
                            $('#conex-licensing-tab').show();
                        }
                    });
                });
            </script>

            <?php if (isset($_GET['status'])): ?>
                <div id="message" class="updated notice is-dismissible">
                    <p>
                        <?php 
                            if ($_GET['status'] == 'success') echo 'Post gerado e publicado com sucesso!'; 
                            elseif ($_GET['status'] == 'error') echo 'Erro na geração do post. Verifique os logs.';
                            elseif ($_GET['status'] == 'license_ok') echo 'Licença ativada com sucesso!';
                            elseif ($_GET['status'] == 'license_error') echo 'Chave de licença inválida.';
                            elseif ($_GET['status'] == 'no_credits') echo 'Você não possui mais créditos este mês. Faça um upgrade!';
                        ?>
                    </p>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    public function handle_manual_generate() {
        if (!current_user_can('manage_options')) {
            wp_die('Sem permissão.');
        }

        check_admin_referer('conex_ai_generate_action', 'conex_ai_nonce');

        $orchestrator = new ConexAI_Orchestrator();
        $result = $orchestrator->execute_daily_generation();

        if ($result) {
            wp_redirect(admin_url('admin.php?page=conex-ai-writer&status=success'));
        } else {
            wp_redirect(admin_url('admin.php?page=conex-ai-writer&status=error'));
        }
        exit;
    }

    public function handle_activate_license() {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.');
        check_admin_referer('conex_ai_license_action', 'conex_ai_license_nonce');

        $key = sanitize_text_field($_POST['license_key']);
        $success = ConexAI_Licensing::activate_key($key);

        if ($success) {
            wp_redirect(admin_url('admin.php?page=conex-ai-writer&status=license_ok'));
        } else {
            wp_redirect(admin_url('admin.php?page=conex-ai-writer&status=license_error'));
        }
        exit;
    }
}
