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
        register_setting('conext_writer_settings', 'conext_writer_word_count');
        register_setting('conext_writer_settings', 'conext_writer_image_count', ['default' => 1]);
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
            </style>

            <h1>Conext Writer <span class="tier-badge"><?php echo Conext_Licensing::get_tier_label(); ?></span></h1>
            
            <div class="conex-ai-card">
                <h3>Uso de Créditos Mensais</h3>
                <div class="conex-ai-progress">
                    <div class="conex-ai-bar" style="width: <?php echo $percent; ?>%;"></div>
                </div>
                <p><strong><?php echo Conext_Licensing::get_credits_remaining(); ?></strong> créditos restantes de <?php echo $total; ?>.</p>
            </div>

            <h2 class="nav-tab-wrapper">
                <a href="#licensing" class="nav-tab nav-tab-active">Licenciamento</a>
                <a href="#settings" class="nav-tab">Configurações</a>
            </h2>

            <div id="conex-licensing-tab">
                <div class="conex-ai-card">
                    <h3>Ativar Licença Premium</h3>
                    <p>Controle total sobre a orquestração de 5 agentes e SEO Nível Yoast.</p>
                    <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                        <input type="hidden" name="action" value="conext_writer_activate_license">
                        <?php wp_nonce_field('conext_writer_license_action', 'conext_writer_license_nonce'); ?>
                        <input type="text" name="license_key" value="<?php echo esc_attr(get_option('conext_writer_license_key')); ?>" class="regular-text" placeholder="CNX-XXXX-XXXX" />
                        <?php submit_button('Ativar Agora', 'primary', 'activate_license'); ?>
                    </form>
                    <hr>
                    <h4>Não tem uma licença ou quer fazer Upgrade?</h4>
                    
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
                                        R$ <?php echo number_format($plan['price'], 2, ',', '.'); ?>
                                        <span style="font-size: 12px; font-weight: normal; color: #666;">/mês</span>
                                    </div>
                                    <p style="font-size: 13px; color: #666; min-height: 40px;"><?php echo esc_html($plan['description']); ?></p>
                                    <ul style="text-align: left; font-size: 12px; margin: 15px 0; padding: 0; list-style: none;">
                                        <?php 
                                        if (!empty($plan['features']) && is_array($plan['features'])):
                                            foreach ($plan['features'] as $feature):
                                                if (isset($feature['enabled']) && $feature['enabled']): ?>
                                                    <li>✅ <?php echo esc_html($feature['text']); ?></li>
                                                <?php endif;
                                            endforeach;
                                        else: ?>
                                            <li>✅ <?php echo $plan['postLimit']; ?> Posts/mês</li>
                                            <li>✅ <?php echo number_format($plan['wordLimit'], 0, ',', '.'); ?> Palavras</li>
                                            <li>✅ Yoast SEO Nível Pro</li>
                                        <?php endif; ?>
                                    </ul>
                                    <a href="<?php echo esc_url($checkout_url); ?>" class="upgrade-btn" target="_blank" style="width: 100%; box-sizing: border-box;">Assinar Plano <?php echo esc_html($plan['name']); ?></a>
                                </div>
                            <?php endforeach; 
                        else: ?>
                            <p>Carregando planos da plataforma... Se não aparecerem, <a href="https://app.conext.click/writer-plugin" target="_blank">clique aqui</a>.</p>
                        <?php endif; ?>
                    </div>
                    
                    <p style="font-size:10px; color:#666; margin-top:20px;">* O plugin utiliza o motor Conext para garantir 100% de aprovação no Yoast SEO.</p>
                </div>
            </div>

            <div id="conex-settings-tab" style="display:none;">
                <form method="post" action="options.php">
                <?php settings_fields('conext_writer_settings'); ?>
                <?php do_settings_sections('conext_writer_settings'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">OpenAI API Key</th>
                        <td><input type="password" name="conext_writer_openai_key" value="<?php echo esc_attr(get_option('conext_writer_openai_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Google Gemini API Key</th>
                        <td><input type="password" name="conext_writer_gemini_key" value="<?php echo esc_attr(get_option('conext_writer_gemini_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Frequência de Postagens</th>
                        <td>
                            A cada <input type="number" name="conext_writer_frequency_num" value="<?php echo esc_attr(get_option('conext_writer_frequency_num', 24)); ?>" class="small-text" min="1" />
                            <select name="conext_writer_frequency_unit">
                                <option value="hours" <?php selected(get_option('conext_writer_frequency_unit', 'hours'), 'hours'); ?>>Hora(s)</option>
                                <option value="days" <?php selected(get_option('conext_writer_frequency_unit', 'hours'), 'days'); ?>>Dia(s)</option>
                            </select>
                            <p class="description">Define quando a IA deve gerar um novo post automaticamente.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Assunto Principal</th>
                        <td>
                            <fieldset>
                                <label>
                                    <input type="checkbox" name="conext_writer_topic_random" value="1" <?php checked(get_option('conext_writer_topic_random'), 1); ?> />
                                    Notícias, Tendências e Dicas (Aleatórias)
                                </label><br>
                                <label>
                                    <input type="checkbox" name="conext_writer_topic_products" value="1" <?php checked(get_option('conext_writer_topic_products'), 1); ?> />
                                    Meus Produtos / Serviços (Via WooCommerce e Lista)
                                </label>
                                <p class="description">Marque ambas para a IA sortear (50/50) a cada postagem.</p>
                            </fieldset>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Termos de Pesquisa Extras</th>
                        <td>
                            <input type="text" name="conext_writer_search_terms" value="<?php echo esc_attr(get_option('conext_writer_search_terms')); ?>" class="large-text" placeholder="Ex: RPG, Ação, Playstation, Jogos de Tabuleiro, Poker..." />
                            <p class="description">Obriga a IA a focar nesses nichos durante a criação dos posts e das imagens.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Meus Produtos/Serviços</th>
                        <td>
                            <textarea name="conext_writer_custom_topics" rows="3" class="large-text" placeholder="Se você escolheu 'Meus Produtos/Serviços', descreva aqui os produtos ou temas que quer abordar..."><?php echo esc_textarea(get_option('conext_writer_custom_topics')); ?></textarea>
                            <p class="description">Explique o que você vende ou os assuntos específicos que deseja tratar. A IA focará neles.</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Tom de Escrita</th>
                        <td>
                            <select name="conext_writer_tone">
                                <option value="Persuasivo e Vendedor" <?php selected(get_option('conext_writer_tone', 'Persuasivo e Vendedor'), 'Persuasivo e Vendedor'); ?>>Persuasivo e Vendedor</option>
                                <option value="Informativo e Direto" <?php selected(get_option('conext_writer_tone'), 'Informativo e Direto'); ?>>Informativo e Direto</option>
                                <option value="Descontraído e Casual" <?php selected(get_option('conext_writer_tone'), 'Descontraído e Casual'); ?>>Descontraído e Casual</option>
                                <option value="Agressivo (Gatilhos Mentais)" <?php selected(get_option('conext_writer_tone'), 'Agressivo (Gatilhos Mentais)'); ?>>Agressivo (Gatilhos Mentais)</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Tamanho Médio (Palavras)</th>
                        <td>
                            <select name="conext_writer_word_count">
                                <option value="500-1000" <?php selected(get_option('conext_writer_word_count'), '500-1000'); ?>>Curto (500-1000 palavras)</option>
                                <option value="1500-3000" <?php selected(get_option('conext_writer_word_count', '1500-3000'), '1500-3000'); ?>>Médio/Longo (1500-3000 palavras)</option>
                                <option value="3000-5000" <?php selected(get_option('conext_writer_word_count'), '3000-5000'); ?>>Muito Longo (3000-5000 palavras)</option>
                            </select>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Número de Imagens</th>
                        <td>
                            <input type="number" name="conext_writer_image_count" value="<?php echo esc_attr(get_option('conext_writer_image_count', 1)); ?>" class="small-text" min="1" max="3" />
                            <p class="description">Máximo recomendado: 3 imagens (Evita limites de API).</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">Fontes de Notícias ou RSS</th>
                        <td>
                            <textarea name="conext_writer_news_source" rows="5" class="large-text code" placeholder="Cole URLs de fontes (uma por linha) ou deixe em branco para busca 100% automática">
<?php echo esc_textarea(get_option('conext_writer_news_source')); ?>
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
                <input type="hidden" name="action" value="conext_writer_generate">
                <?php wp_nonce_field('conext_writer_generate_action', 'conext_writer_nonce'); ?>
                <?php submit_button('Gerar Post AGORA (Manual)', 'secondary', 'generate_post'); ?>
            </form>
            </div>

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
                <div id="message" class="updated notice is-dismissible">
                    <p>
                        <?php 
                            if ($_GET['status'] == 'success') echo 'Post gerado e publicado com sucesso!'; 
                            elseif ($_GET['status'] == 'error') echo 'Erro na geração do post. Verifique os logs.';
                            elseif ($_GET['status'] == 'error_keys') echo 'Erro: Chaves de API não configuradas ou inválidas.';
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

        check_admin_referer('conext_writer_generate_action', 'conext_writer_nonce');

        $orchestrator = new Conext_Orchestrator();
        $result = $orchestrator->execute_daily_generation();

        if (is_numeric($result) || $result === true) {
            wp_redirect(admin_url('admin.php?page=conext-writer&status=success'));
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
