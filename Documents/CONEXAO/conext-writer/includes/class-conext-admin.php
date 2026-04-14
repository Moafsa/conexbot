<?php
if (!defined('ABSPATH')) {
    exit;
}

class Conext_Admin {
    public function init() {
        add_action('admin_menu', [$this, 'add_menu_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_conext_writer_generate', [$this, 'handle_manual_generate']);
        add_action('admin_post_conext_writer_activate_license', [$this, 'handle_activate_license']);
        
        // Remove footer on plugin page
        add_filter('admin_footer_text', [$this, 'remove_admin_footer_text'], 99);
        add_filter('update_footer', [$this, 'remove_admin_footer_version'], 99);
        
        // Resetar créditos se necessário
        add_action('update_option_conext_writer_frequency_num', [$this, 'reschedule_cron']);
        add_action('update_option_conext_writer_frequency_unit', [$this, 'reschedule_cron']);

        // Limpeza de termos irrelevantes detectados (IA para pequenos negócios)
        $terms = get_option('conext_writer_search_terms');
        if (strpos($terms, 'IA pode ajudar pequenos negocios') !== false) {
            update_option('conext_writer_search_terms', '');
        }
    }

    public function add_menu_page() {
        add_menu_page(
            'Conext Writer',
            'Conext Writer',
            'manage_options',
            'conext-writer',
            [$this, 'render_admin_page'],
            'dashicons-superhero',
            65
        );
    }

    public function register_settings() {
        register_setting('conext_writer_settings', 'conext_writer_openai_key');
        register_setting('conext_writer_settings', 'conext_writer_gemini_key');
        register_setting('conext_writer_settings', 'conext_writer_news_source');
        
        register_setting('conext_writer_settings', 'conext_writer_frequency_num');
        register_setting('conext_writer_settings', 'conext_writer_frequency_unit');
        register_setting('conext_writer_settings', 'conext_writer_topic_random');
        register_setting('conext_writer_settings', 'conext_writer_topic_products');
        register_setting('conext_writer_settings', 'conext_writer_search_terms');
        register_setting('conext_writer_settings', 'conext_writer_custom_topics');
        register_setting('conext_writer_settings', 'conext_writer_tone');
        register_setting('conext_writer_settings', 'conext_writer_language');
        register_setting('conext_writer_settings', 'conext_writer_word_count');
        register_setting('conext_writer_settings', 'conext_writer_image_count', ['default' => 1]);
        register_setting('conext_writer_settings', 'conext_writer_image_style', ['default' => '3d_render']);
    }

    public function reschedule_cron() {
        // Triggered when the frequency interval changes. We will wait for both updates to finish, 
        // the actual clear/schedule relies on the main plugin file detecting the change or we handle it here.
        wp_clear_scheduled_hook('conext_writer_cron_generation');
        $num = (int) get_option('conext_writer_frequency_num', 24);
        $unit = get_option('conext_writer_frequency_unit', 'hours');
        if ($num > 0) {
            // "conext_writer_custom_interval" will be registered in cron_schedules
            wp_schedule_event(time(), 'conext_writer_custom_interval', 'conext_writer_cron_generation');
        }
    }

    public function render_admin_page() {
        $credits_used = Conext_Licensing::get_credits_total() - Conext_Licensing::get_credits_remaining();
        $total = Conext_Licensing::get_credits_total();
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
                #wpfooter { display: none; }
            </style>            <h1>Conext Writer <span class="tier-badge"><?php echo Conext_Licensing::get_tier_label(); ?></span></h1>

            <div class="conext-global-lang-selector" style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2271b1; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <strong style="margin-right: 10px;"><?php _e('Preferred Language / Idioma Preferido:', 'conext-writer'); ?></strong>
                    <form method="post" action="options.php" style="display: inline-block;">
                        <?php settings_fields('conext_writer_settings'); ?>
                        <?php $selected_lang = get_option('conext_writer_language', 'auto'); ?>
                        <select name="conext_writer_language" onchange="this.form.submit()" style="padding: 5px 10px; border-radius: 4px;">
                            <option value="auto" <?php selected($selected_lang, 'auto'); ?>>🌐 Automatic (Site Default)</option>
                            <option value="pt" <?php selected($selected_lang, 'pt'); ?>>🇧🇷 Português</option>
                            <option value="es" <?php selected($selected_lang, 'es'); ?>>🇪🇸 Español</option>
                            <option value="en" <?php selected($selected_lang, 'en'); ?>>🇺🇸 English</option>
                        </select>
                        <noscript><input type="submit" value="Change" /></noscript>
                    </form>
                </div>
                <small style="color: #666; font-style: italic;"><?php _e('This setting changes the interface and the content generated by AI.', 'conext-writer'); ?></small>
            </div>
            
            <div class="conex-ai-card">
                <h3><?php _e('Uso de Créditos Mensais', 'conext-writer'); ?></h3>
                <div class="conex-ai-progress">
                    <div class="conex-ai-bar" style="width: <?php echo $percent; ?>%;"></div>
                </div>
                <p><strong><?php echo Conext_Licensing::get_credits_remaining(); ?></strong> <?php _e('créditos restantes de', 'conext-writer'); ?> <?php echo $total; ?>.</p>
            </div>

            <h2 class="nav-tab-wrapper">
                <a href="#licensing" class="nav-tab nav-tab-active"><?php _e('Licenciamento', 'conext-writer'); ?></a>
                <a href="#settings" class="nav-tab"><?php _e('Configurações', 'conext-writer'); ?></a>
            </h2>

            <div id="conex-licensing-tab">
                <div class="conex-ai-card">
                    <h3><?php _e('Ativar Licença Premium', 'conext-writer'); ?></h3>
                    <p><?php _e('Controle total sobre a orquestração de 5 agentes e SEO Nível Yoast.', 'conext-writer'); ?></p>
                    <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                        <input type="hidden" name="action" value="conext_writer_activate_license">
                        <?php wp_nonce_field('conext_writer_license_action', 'conext_writer_license_nonce'); ?>
                        <input type="text" name="license_key" value="<?php echo esc_attr(get_option('conext_writer_license_key')); ?>" class="regular-text" placeholder="CNX-XXXX-XXXX" />
                        <?php submit_button(__('Ativar Agora', 'conext-writer'), 'primary', 'activate_license'); ?>
                    </form>
                    <hr>
                    <h4><?php _e('Não tem uma licença ou quer fazer Upgrade?', 'conext-writer'); ?></h4>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-top:20px;">
                        <?php 
                        $plans = Conext_Licensing::get_available_plans();
                        if (!empty($plans)):
                            foreach ($plans as $plan): 
                                $checkout_url = "https://app.conext.click/auth/register?planId=" . $plan['id'] . "&type=WRITER_PLUGIN";
                                ?>
                                <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; background: #fafafa; text-align: center;">
                                    <h4 style="margin:0 0 10px 0;"><?php echo esc_html($plan['name']); ?></h4>
                                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
                                        R$ <?php echo number_format((float)($plan['price'] ?? 0), 2, ',', '.'); ?>
                                        <span style="font-size: 12px; font-weight: normal; color: #666;">/<?php _e('mês', 'conext-writer'); ?></span>
                                    </div>
                                    <p style="font-size: 13px; color: #666; min-height: 40px;"><?php echo esc_html($plan['description'] ?? ''); ?></p>
                                    <ul style="text-align: left; font-size: 12px; margin: 15px 0; padding: 0; list-style: none;">
                                        <?php 
                                        if (!empty($plan['features']) && is_array($plan['features'])):
                                            foreach ($plan['features'] as $feature):
                                                if (isset($feature['enabled']) && $feature['enabled']): ?>
                                                    <li>✅ <?php echo esc_html($feature['text']); ?></li>
                                                <?php endif;
                                            endforeach;
                                        else: ?>
                                            <li>✅ <?php echo esc_html($plan['postLimit'] ?? 0); ?> <?php _e('Posts/mês', 'conext-writer'); ?></li>
                                            <li>✅ <?php echo number_format((float)($plan['wordLimit'] ?? 0), 0, ',', '.'); ?> <?php _e('Palavras', 'conext-writer'); ?></li>
                                            <li>✅ <?php _e('Yoast SEO Nível Pro', 'conext-writer'); ?></li>
                                        <?php endif; ?>
                                    </ul>
                                    <a href="<?php echo esc_url($checkout_url); ?>" class="upgrade-btn" target="_blank" style="width: 100%; box-sizing: border-box;"><?php _e('Assinar Plano', 'conext-writer'); ?> <?php echo esc_html($plan['name']); ?></a>
                                </div>
                            <?php endforeach; 
                        else: ?>
                            <p><?php _e('Carregando planos da plataforma... Se não aparecerem,', 'conext-writer'); ?> <a href="https://app.conext.click/writer-plugin" target="_blank"><?php _e('clique aqui', 'conext-writer'); ?></a>.</p>
                        <?php endif; ?>
                    </div>
                    
                    <p style="font-size:10px; color:#666; margin-top:20px;">* O plugin utiliza o motor Conext para garantir 100% de aprovação no Yoast SEO.</p>
                    
                    <?php if (current_user_can('manage_options')): ?>
                        <div style="margin-top:20px; padding:10px; background:#f0f0f1; border-left:4px solid #72aee6; font-family:monospace; font-size:10px;">
                            <strong>LOG TÉCNICO (Última Resposta):</strong>
                            <pre style="white-space:pre-wrap;"><?php print_r(get_option('conext_writer_last_api_response')); ?></pre>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <div id="conex-settings-tab" style="display:none;">
                <form method="post" action="options.php">
                <?php settings_fields('conext_writer_settings'); ?>
                <?php do_settings_sections('conext_writer_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row"><?php _e('OpenAI API Key', 'conext-writer'); ?></th>
                        <td><input type="password" name="conext_writer_openai_key" value="<?php echo esc_attr(get_option('conext_writer_openai_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Google Gemini API Key', 'conext-writer'); ?></th>
                        <td><input type="password" name="conext_writer_gemini_key" value="<?php echo esc_attr(get_option('conext_writer_gemini_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Frequência de Postagens', 'conext-writer'); ?></th>
                        <td>
                            <?php _e('A cada', 'conext-writer'); ?> <input type="number" name="conext_writer_frequency_num" value="<?php echo esc_attr(get_option('conext_writer_frequency_num', 24)); ?>" class="small-text" min="1" />
                            <select name="conext_writer_frequency_unit">
                                <option value="hours" <?php selected(get_option('conext_writer_frequency_unit', 'hours'), 'hours'); ?>><?php _e('Hora(s)', 'conext-writer'); ?></option>
                                <option value="days" <?php selected(get_option('conext_writer_frequency_unit', 'hours'), 'days'); ?>><?php _e('Dia(s)', 'conext-writer'); ?></option>
                            </select>
                            <p class="description"><?php _e('Define quando a IA deve gerar um novo post automaticamente.', 'conext-writer'); ?></p>
                            <div style="margin-top:5px; font-size:11px; color:#2271b1;">
                                <?php 
                                $next_run = wp_next_scheduled('conext_writer_cron_generation');
                                if ($next_run) {
                                    printf(
                                        __('🕒 Próxima execução agendada para: %s', 'conext-writer'),
                                        '<strong>' . date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $next_run) . '</strong>'
                                    );
                                } else {
                                    echo '⚠️ ' . __('A geração automática não está agendada. Verifique se a frequência é maior que zero.', 'conext-writer');
                                }
                                ?>
                            </div>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Assunto Principal', 'conext-writer'); ?></th>
                        <td>
                            <fieldset>
                                <label>
                                    <input type="checkbox" name="conext_writer_topic_random" value="1" <?php checked(get_option('conext_writer_topic_random'), 1); ?> />
                                    <?php _e('Notícias, Tendências e Dicas (Aleatórias)', 'conext-writer'); ?>
                                </label><br>
                                <label>
                                    <input type="checkbox" name="conext_writer_topic_products" value="1" <?php checked(get_option('conext_writer_topic_products'), 1); ?> />
                                    <?php _e('Meus Produtos / Serviços (Via WooCommerce e Lista)', 'conext-writer'); ?>
                                </label>
                                <p class="description"><?php _e('Marque ambas para a IA sortear (50/50) a cada postagem.', 'conext-writer'); ?></p>
                            </fieldset>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Termos de Pesquisa Extras', 'conext-writer'); ?></th>
                        <td>
                            <input type="text" name="conext_writer_search_terms" value="<?php echo esc_attr(get_option('conext_writer_search_terms')); ?>" class="large-text" placeholder="<?php _e('Ex: RPG, Ação, Playstation, Jogos de Tabuleiro, Poker...', 'conext-writer'); ?>" />
                            <p class="description"><?php _e('Obriga a IA a focar nesses nichos durante a criação dos posts e das imagens.', 'conext-writer'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Meus Produtos/Serviços', 'conext-writer'); ?></th>
                        <td>
                            <textarea name="conext_writer_custom_topics" rows="3" class="large-text" placeholder="<?php _e('Se você escolheu \'Meus Produtos/Serviços\', descreva aqui os produtos ou temas que quer abordar...', 'conext-writer'); ?>"><?php echo esc_textarea(get_option('conext_writer_custom_topics')); ?></textarea>
                            <p class="description"><?php _e('Explique o que você vende ou os assuntos específicos que deseja tratar. A IA focará neles.', 'conext-writer'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Tom de Escrita', 'conext-writer'); ?></th>
                        <td>
                            <select name="conext_writer_tone">
                                <option value="Persuasivo e Vendedor" <?php selected(get_option('conext_writer_tone', 'Persuasivo e Vendedor'), 'Persuasivo e Vendedor'); ?>><?php _e('Persuasivo e Vendedor', 'conext-writer'); ?></option>
                                <option value="Informativo e Direto" <?php selected(get_option('conext_writer_tone'), 'Informativo e Direto'); ?>><?php _e('Informativo e Direto', 'conext-writer'); ?></option>
                                <option value="Descontraído e Casual" <?php selected(get_option('conext_writer_tone'), 'Descontraído e Casual'); ?>><?php _e('Descontraído e Casual', 'conext-writer'); ?></option>
                                <option value="Agressivo (Gatilhos Mentais)" <?php selected(get_option('conext_writer_tone'), 'Agressivo (Gatilhos Mentais)'); ?>><?php _e('Agressivo (Gatilhos Mentais)', 'conext-writer'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Tamanho Médio (Palavras)', 'conext-writer'); ?></th>
                        <td>
                            <select name="conext_writer_word_count">
                                <option value="500-1000" <?php selected(get_option('conext_writer_word_count'), '500-1000'); ?>><?php _e('Curto (500-1000 palavras)', 'conext-writer'); ?></option>
                                <option value="1500-3000" <?php selected(get_option('conext_writer_word_count', '1500-3000'), '1500-3000'); ?>><?php _e('Médio/Longo (1500-3000 palavras)', 'conext-writer'); ?></option>
                                <option value="3000-5000" <?php selected(get_option('conext_writer_word_count'), '3000-5000'); ?>><?php _e('Muito Longo (3000-5000 palavras)', 'conext-writer'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Número de Imagens', 'conext-writer'); ?></th>
                        <td>
                            <input type="number" name="conext_writer_image_count" value="<?php echo esc_attr(get_option('conext_writer_image_count', 1)); ?>" class="small-text" min="1" max="3" />
                            <p class="description"><?php _e('Máximo recomendado: 3 imagens (Evita limites de API).', 'conext-writer'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Estilo das Imagens', 'conext-writer'); ?></th>
                        <td>
                            <select name="conext_writer_image_style">
                                <option value="3d_render" <?php selected(get_option('conext_writer_image_style', '3d_render'), '3d_render'); ?>><?php _e('3D Render (Moderno e Vibrante)', 'conext-writer'); ?></option>
                                <option value="photorealistic" <?php selected(get_option('conext_writer_image_style'), 'photorealistic'); ?>><?php _e('Fotorealista (Alta Qualidade)', 'conext-writer'); ?></option>
                                <option value="flat_illustration" <?php selected(get_option('conext_writer_image_style'), 'flat_illustration'); ?>><?php _e('Ilustração Flat (Minimalista)', 'conext-writer'); ?></option>
                                <option value="cyberpunk" <?php selected(get_option('conext_writer_image_style'), 'cyberpunk'); ?>><?php _e('Futurista / Cyberpunk (Neon)', 'conext-writer'); ?></option>
                                <option value="isometric" <?php selected(get_option('conext_writer_image_style'), 'isometric'); ?>><?php _e('Isométrico (Limpo e Técnico)', 'conext-writer'); ?></option>
                            </select>
                            <p class="description"><?php _e('Escolha como a IA deve "desenhar" as imagens do seu post.', 'conext-writer'); ?></p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row"><?php _e('Fontes de Notícias ou RSS', 'conext-writer'); ?></th>
                        <td>
                            <textarea name="conext_writer_news_source" rows="5" class="large-text code" placeholder="<?php _e('Cole URLs de fontes (uma por linha) ou deixe em branco para busca 100% automática', 'conext-writer'); ?>">
<?php echo esc_textarea(get_option('conext_writer_news_source')); ?>
                            </textarea>
                            <p class="description"><?php _e('Insira a URL de um feed RSS, o link direto de um site/domínio, ou deixe em branco para o Agente pesquisar na Web livremente sobre os assuntos.', 'conext-writer'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr />
            <h2><?php _e('Teste de Geração', 'conext-writer'); ?></h2>
            <p><?php _e('Clique no botão abaixo para forçar o Orquestrador a pesquisar, escrever e publicar um post agora.', 'conext-writer'); ?></p>
            <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                <input type="hidden" name="action" value="conext_writer_generate">
                <?php wp_nonce_field('conext_writer_generate_action', 'conext_writer_nonce'); ?>
                <?php submit_button(__('Gerar Post AGORA (Manual)', 'conext-writer'), 'secondary', 'generate_post'); ?>
            </form>
            </div>

            <script>
                jQuery(document).ready(function($) {
                    $('.nav-tab').click(function(e) {
                        e.preventDefault();
                        $('.nav-tab').removeClass('nav-tab-active');
                        $(this).addClass('nav-tab-active');
                        
                        var target = $(this).attr('href');
                        if (target == '#licensing') {
                            $('#conex-licensing-tab').show();
                            $('#conex-settings-tab').hide();
                        } else {
                            $('#conex-licensing-tab').hide();
                            $('#conex-settings-tab').show();
                        }
                    });
                });
            </script>

            <?php if (isset($_GET['status'])): ?>
                <div id="message" class="<?php echo ($_GET['status'] == 'license_ok' || $_GET['status'] == 'success') ? 'updated' : 'error'; ?> notice is-dismissible">
                    <p>
                        <?php 
                            if ($_GET['status'] == 'success') _e('Post gerado e publicado com sucesso!', 'conext-writer'); 
                            elseif ($_GET['status'] == 'error') _e('Erro na geração do post. Verifique os logs.', 'conext-writer');
                            elseif ($_GET['status'] == 'error_keys') _e('Erro: Chaves de API não configuradas ou inválidas.', 'conext-writer');
                            elseif ($_GET['status'] == 'license_ok') _e('Licença ativada com sucesso!', 'conext-writer');
                            elseif ($_GET['status'] == 'license_error') {
                                $last_resp = get_option('conext_writer_last_api_response');
                                $err_msg = isset($last_resp['error']) ? $last_resp['error'] : __('Chave de licença inválida.', 'conext-writer');
                                echo esc_html($err_msg);
                            }
                            elseif ($_GET['status'] == 'trial_limit') _e('Você atingiu o limite máximo de 5 posts no período de teste (trial). É necessário pagar a sua fatura para liberar o restante dos posts do seu plano.', 'conext-writer');
                            elseif ($_GET['status'] == 'no_credits') _e('Você não possui mais créditos este mês. Faça um upgrade!', 'conext-writer');
                        ?>
                    </p>
                </div>
            <?php endif; ?>

            <div style="margin-top:20px; padding:15px; border:1px solid #ccd0d4; background:#fff; border-radius:8px;">
                <h4 style="margin-top:0;"><?php _e('Informações do Sistema', 'conext-writer'); ?></h4>
                <p style="font-size:12px; color:#666;">
                    <strong><?php _e('URL Detectada para Licença:', 'conext-writer'); ?></strong> <code><?php echo esc_url(get_site_url()); ?></code><br>
                    <small><?php _e('Se esta URL estiver errada (ex: localhost em site online), ajuste suas configurações do WordPress.', 'conext-writer'); ?></small>
                </p>
            </div>
        </div>
        <?php
    }

    public function handle_manual_generate() {
        if (!current_user_can('manage_options')) {
            wp_die('Sem permissão.');
        }

        check_admin_referer('conext_writer_generate_action', 'conext_writer_nonce');

        $orchestrator = new Conext_Orchestrator();
        $result = $orchestrator->execute_daily_generation();

        if (is_numeric($result) || $result === true) {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=success'));
        } elseif ($result === 'trial_limit') {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=trial_limit'));
        } elseif ($result === 'no_credits') {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=no_credits'));
        } elseif ($result === 'no_license') {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=license_error'));
        } elseif ($result === 'no_keys') {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=error_keys'));
        } else {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=error'));
        }
        exit;
    }

    public function handle_activate_license() {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.');
        check_admin_referer('conext_writer_license_action', 'conext_writer_license_nonce');

        $key = sanitize_text_field($_POST['license_key']);
        $success = Conext_Licensing::activate_key($key);

        if ($success) {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=license_ok'));
        } else {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=license_error'));
        }
        exit;
    }

    public function remove_admin_footer_text($text) {
        if (isset($_GET['page']) && $_GET['page'] === 'conext-writer') {
            return '';
        }
        return $text;
    }

    public function remove_admin_footer_version($text) {
        if (isset($_GET['page']) && $_GET['page'] === 'conext-writer') {
            return '';
        }
        return $text;
    }
}
