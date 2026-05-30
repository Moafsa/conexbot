<?php
/**
 * Settings page
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Ensure we're in admin context
if (!function_exists('is_admin') || !is_admin() || !defined('ABSPATH')) {
    return;
}

// Ensure we're on the correct page (double check)
if (!isset($_GET['page']) || $_GET['page'] !== 'ts-ml-settings') {
    // This view should only be loaded on the settings page
    return;
}

// Ensure WooCommerce is loaded
if (!function_exists('class_exists') || !class_exists('WooCommerce')) {
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Configurações - Mercado Livre Integration', 'ts-ml-integration'); ?></h1>
        <div class="error">
            <p><?php esc_html_e('Este plugin requer WooCommerce para funcionar.', 'ts-ml-integration'); ?></p>
        </div>
    </div>
    <?php
    return;
}

// PROCESS ALL FORM SUBMISSIONS FIRST - BEFORE ANY HTML OUTPUT
global $wpdb;

// Handle table creation
if (isset($_GET['action']) && $_GET['action'] === 'create_tables' && current_user_can('manage_woocommerce')) {
    check_admin_referer('create_tables');
    if (class_exists('TS_ML_Install')) {
        TS_ML_Install::create_tables();
        wp_redirect(admin_url('admin.php?page=ts-ml-settings&tables_created=1'));
        exit;
    }
}

// Handle account deletion
$account_deleted = false;
if (isset($_GET['delete_account']) && isset($_GET['_wpnonce']) && current_user_can('manage_woocommerce')) {
    $account_id = intval($_GET['delete_account']);
    if (wp_verify_nonce($_GET['_wpnonce'], 'delete_account_' . $account_id)) {
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';

        $result = $wpdb->delete(
            $table_accounts,
            array('id' => $account_id),
            array('%d')
        );

        if ($result !== false && $result > 0) {
            wp_redirect(admin_url('admin.php?page=ts-ml-settings&account_deleted=1'));
            exit;
        } else {
            $account_error = __('Erro ao excluir conta.', 'ts-ml-integration');
        }
    }
}

// Handle account addition
$account_added = false;
$account_error = '';
$debug_info = array();

// Handle account edition
if (isset($_POST['edit_account']) && check_admin_referer('ts_ml_edit_account')) {
    $edit_account_id = intval($_POST['account_id']);
    $edit_account_name = sanitize_text_field($_POST['account_name']);
    $edit_country = sanitize_text_field($_POST['country']);

    $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
    $result = $wpdb->update(
        $table_accounts,
        array(
            'account_name' => $edit_account_name,
            'country' => $edit_country,
            'updated_at' => current_time('mysql'),
        ),
        array('id' => $edit_account_id),
        array('%s', '%s', '%s'),
        array('%d')
    );

    if ($result !== false) {
        wp_redirect(admin_url('admin.php?page=ts-ml-settings&account_updated=1'));
        exit;
    } else {
        $account_error = __('Erro ao atualizar conta.', 'ts-ml-integration');
    }
}

if (isset($_POST['add_account'])) {
    $debug_info[] = 'Formulário submetido detectado';

    // Check nonce
    if (!isset($_POST['_wpnonce'])) {
        $account_error = __('Erro: Nonce não encontrado. Recarregue a página e tente novamente.', 'ts-ml-integration');
        $debug_info[] = 'Erro: Nonce não encontrado';
    } elseif (!wp_verify_nonce($_POST['_wpnonce'], 'ts_ml_add_account')) {
        $account_error = __('Erro: Verificação de segurança falhou. Recarregue a página e tente novamente.', 'ts-ml-integration');
        $debug_info[] = 'Erro: Nonce inválido';
    } else {
        $debug_info[] = 'Nonce verificado com sucesso';

        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';

        // Check if table exists
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");
        $debug_info[] = 'Tabela existe: ' . ($table_exists ? 'Sim' : 'Não');

        if (!$table_exists) {
            $account_error = __('Erro: Tabela de contas não existe. Clique em "Criar Tabelas Agora" abaixo.', 'ts-ml-integration');
        } else {
            // Validate input
            $account_name = isset($_POST['account_name']) ? sanitize_text_field($_POST['account_name']) : '';
            $country = isset($_POST['country']) ? sanitize_text_field($_POST['country']) : 'BR';

            $debug_info[] = 'Nome da conta: ' . $account_name;
            $debug_info[] = 'País: ' . $country;

            if (empty($account_name)) {
                $account_error = __('Erro: Nome da conta é obrigatório.', 'ts-ml-integration');
            } else {
                // Check for duplicate account name
                $existing = $wpdb->get_var($wpdb->prepare(
                    "SELECT id FROM $table_accounts WHERE account_name = %s",
                    $account_name
                ));

                $debug_info[] = 'Conta existente: ' . ($existing ? 'Sim (ID: ' . $existing . ')' : 'Não');

                if ($existing) {
                    $account_error = __('Erro: Já existe uma conta com este nome. Escolha outro nome.', 'ts-ml-integration');
                } else {
                    $user_id = get_current_user_id();
                    $debug_info[] = 'User ID: ' . $user_id;

                    $result = $wpdb->insert(
                        $table_accounts,
                        array(
                            'account_name' => $account_name,
                            'user_id' => $user_id,
                            'country' => $country,
                            'is_active' => 1,
                        ),
                        array('%s', '%d', '%s', '%d')
                    );

                    $debug_info[] = 'Resultado do insert: ' . var_export($result, true);
                    $debug_info[] = 'Last query: ' . $wpdb->last_query;
                    $debug_info[] = 'Last error: ' . $wpdb->last_error;

                    if ($result === false) {
                        $error = $wpdb->last_error;
                        $account_error = __('Erro ao adicionar conta:', 'ts-ml-integration') . ' ' . $error;
                    } elseif ($result > 0) {
                        // Success - redirect to avoid duplicate submissions
                        $redirect_url = admin_url('admin.php?page=ts-ml-settings&account_added=1');
                        $debug_info[] = 'Redirecionando para: ' . $redirect_url;
                        wp_redirect($redirect_url);
                        exit;
                    } else {
                        $account_error = __('Erro: Não foi possível adicionar a conta. Tente novamente.', 'ts-ml-integration');
                    }
                }
            }
        }
    }
}

// Handle API credentials save
$credentials_saved = false;
$credentials_error = '';
if (isset($_POST['save_api_credentials']) && check_admin_referer('ts_ml_save_api_credentials')) {
    $app_id = isset($_POST['app_id_br']) ? sanitize_text_field($_POST['app_id_br']) : '';
    $app_secret = isset($_POST['app_secret_br']) ? sanitize_text_field($_POST['app_secret_br']) : '';

    $result1 = update_option('ts_ml_app_id_BR', $app_id);
    $result2 = update_option('ts_ml_app_secret_BR', $app_secret);

    if ($result1 !== false && $result2 !== false) {
        $credentials_saved = true;
    } else {
        $credentials_error = __('Erro ao salvar credenciais. Tente novamente.', 'ts-ml-integration');
    }
}

// Handle SaaS Disconnect
if (isset($_POST['disconnect_saas']) && check_admin_referer('ts_ml_disconnect_saas')) {
    update_option('ts_ml_use_saas', 'no');
    update_option('ts_ml_bot_id', '');
    update_option('ts_ml_license_key', '');
    
    global $wpdb;
    $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
    $wpdb->delete($table_accounts, array('access_token' => 'saas_managed'));
    
    $settings_saved = true;
}

// Handle settings save
$settings_saved = false;
if (isset($_POST['save_settings']) && check_admin_referer('ts_ml_save_settings')) {
    update_option('ts_ml_auto_sync', isset($_POST['auto_sync']) ? 'yes' : 'no');
    update_option('ts_ml_auto_sync_stock', isset($_POST['auto_sync_stock']) ? 'yes' : 'no');
    update_option('ts_ml_auto_sync_prices', isset($_POST['auto_sync_prices']) ? 'yes' : 'no');
    update_option('ts_ml_auto_sync_orders', isset($_POST['auto_sync_orders']) ? 'yes' : 'no');
    update_option('ts_ml_sync_deletions', isset($_POST['sync_deletions']) ? 'yes' : 'no');
    update_option('ts_ml_sync_status_changes', isset($_POST['sync_status_changes']) ? 'yes' : 'no');
    update_option('ts_ml_ai_enabled', isset($_POST['ai_enabled']) ? 'yes' : 'no');
    update_option('ts_ml_ai_api_key', sanitize_text_field($_POST['ai_api_key'] ?? ''));
    update_option('ts_ml_ai_model', sanitize_text_field($_POST['ai_model'] ?? 'gpt-3.5-turbo'));
    update_option('ts_ml_ai_system_prompt', sanitize_textarea_field($_POST['ai_system_prompt'] ?? ''));
    update_option('ts_ml_debug_mode', isset($_POST['debug_mode']) ? 'yes' : 'no');
    update_option('ts_ml_sync_frequency', sanitize_text_field($_POST['sync_frequency'] ?? 'hourly'));
    update_option('ts_ml_price_adjustment_fixed', sanitize_text_field($_POST['price_adjustment_fixed'] ?? ''));

    // SaaS Connection
    $use_saas = isset($_POST['use_saas']) ? 'yes' : 'no';
    update_option('ts_ml_use_saas', $use_saas);
    update_option('ts_ml_saas_url', esc_url_raw($_POST['saas_url'] ?? ''));
    update_option('ts_ml_bot_id', sanitize_text_field($_POST['bot_id'] ?? ''));
    update_option('ts_ml_license_key', sanitize_text_field($_POST['license_key'] ?? ''));
    update_option('ts_ml_auto_create_on_ml', isset($_POST['auto_create_on_ml']) ? 'yes' : 'no');

    if ($use_saas === 'yes') {
        global $wpdb;
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");
        if ($table_exists) {
            $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_accounts");
            if (intval($count) === 0) {
                $wpdb->insert(
                    $table_accounts,
                    array(
                        'account_name' => 'Conextbot SaaS',
                        'country' => 'BR',
                        'is_active' => 1,
                        'access_token' => 'saas_managed',
                        'refresh_token' => 'saas_managed',
                        'token_expires_at' => date('Y-m-d H:i:s', time() + 365 * 24 * 3600),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ),
                    array('%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s')
                );
            }
        }
    }

    $settings_saved = true;
}

// Initialize variables for messages (ensure they exist before use)
if (!isset($account_deleted)) {
    $account_deleted = false;
}
if (!isset($account_added)) {
    $account_added = false;
}
if (!isset($account_error)) {
    $account_error = '';
}
if (!isset($debug_info)) {
    $debug_info = array();
}
if (!isset($credentials_saved)) {
    $credentials_saved = false;
}
if (!isset($credentials_error)) {
    $credentials_error = '';
}
if (!isset($settings_saved)) {
    $settings_saved = false;
}

// NOW START HTML OUTPUT
?>

<div class="wrap">
    <h1><?php esc_html_e('Configurações - Mercado Livre Integration', 'ts-ml-integration'); ?></h1>

    <?php
    // Show success/error messages at the top
    if (isset($_GET['tables_created']) && $_GET['tables_created'] == '1') {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Tabelas criadas com sucesso!', 'ts-ml-integration') . '</p></div>';
    }

    if (isset($_GET['account_added']) && $_GET['account_added'] == '1') {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Conta adicionada com sucesso!', 'ts-ml-integration') . '</p></div>';
    }

    if (isset($_GET['account_connected']) && $_GET['account_connected'] == '1') {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Conta conectada com sucesso!', 'ts-ml-integration') . '</p></div>';
    }

    if (isset($_GET['account_deleted']) && $_GET['account_deleted'] == '1') {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Conta excluída com sucesso!', 'ts-ml-integration') . '</p></div>';
    }

    if (isset($_GET['account_updated']) && $_GET['account_updated'] == '1') {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Conta atualizada com sucesso!', 'ts-ml-integration') . '</p></div>';
    }

    if (isset($_GET['oauth_error'])) {
        $oauth_error = urldecode($_GET['oauth_error']);
        echo '<div class="notice notice-error is-dismissible"><p><strong>' . esc_html__('Erro na Conexão:', 'ts-ml-integration') . '</strong> ' . esc_html($oauth_error) . '</p></div>';
    }

    if ($account_error) {
        echo '<div class="notice notice-error is-dismissible"><p>' . wp_kses_post($account_error) . '</p></div>';
    }

    // Show debug info if debug mode is enabled
    if (get_option('ts_ml_debug_mode') === 'yes' && !empty($debug_info)) {
        echo '<div class="notice notice-info"><p><strong>Debug Info (Account Addition):</strong></p><ul>';
        foreach ($debug_info as $info) {
            echo '<li>' . esc_html($info) . '</li>';
        }
        echo '</ul></div>';
    }

    if ($credentials_saved) {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Credenciais salvas com sucesso!', 'ts-ml-integration') . '</p></div>';
    }

    if ($credentials_error) {
        echo '<div class="notice notice-error is-dismissible"><p>' . esc_html($credentials_error) . '</p></div>';
    }

    if ($settings_saved) {
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Configurações salvas com sucesso!', 'ts-ml-integration') . '</p></div>';
    }
    ?>

        <!-- CONEXTBOT SAAS CONNECTION -->
        <?php
        $saas_url = get_option('ts_ml_saas_url', 'https://app.conext.click');
        $shop_url = home_url();
        $redirect_uri = admin_url('admin.php?page=ts-ml-settings&action=saas_callback');
        $connect_url = $saas_url . '/dashboard/integrations/wordpress/connect?shop_url=' . urlencode($shop_url) . '&redirect_uri=' . urlencode($redirect_uri);
        $is_saas_connected = (get_option('ts_ml_use_saas') === 'yes' && !empty(get_option('ts_ml_bot_id')));
        $is_manual_mode = isset($_GET['mode']) && $_GET['mode'] === 'manual';
        ?>
        <div class="ts-ml-saas-card" style="background: #ffffff; border: 1px solid #e5e5e5; padding: 25px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <?php if (!$is_saas_connected) : ?>
                <div style="text-align: center; padding: 20px 10px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">🔌</div>
                    <h2 style="margin-top: 0; color: #1d2327; font-size: 24px; font-weight: 600;"><?php esc_html_e('Conecte sua Loja ao Conextbot', 'ts-ml-integration'); ?></h2>
                    <p style="font-size: 15px; color: #64748b; max-width: 600px; margin: 0 auto 25px auto; line-height: 1.6;">
                        <?php esc_html_e('Habilite o cérebro de Inteligência Artificial para responder perguntas automaticamente e sincronize seus produtos, preços e estoque com o Mercado Livre em tempo real através do nosso SaaS.', 'ts-ml-integration'); ?>
                    </p>
                    
                    <a href="<?php echo esc_url($connect_url); ?>" class="button button-primary button-hero" style="background: #00a32a; border-color: #00a32a; font-size: 16px; padding: 5px 35px; height: auto; line-height: 2.2; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,163,42,0.2); font-weight: 600;">
                        <?php esc_html_e('Conectar Minha Loja Agora', 'ts-ml-integration'); ?>
                    </a>

                    <div style="margin-top: 25px; font-size: 13px; color: #94a3b8;">
                        <?php esc_html_e('Não requer criação de chaves de desenvolvedor. Autenticação oficial e simplificada por OAuth.', 'ts-ml-integration'); ?>
                    </div>

                    <?php if (!$is_manual_mode) : ?>
                        <p style="margin-top: 25px; margin-bottom: 0; font-size: 13px;"><a href="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings&mode=manual')); ?>" style="color: #64748b; text-decoration: underline;"><?php esc_html_e('Configuração avançada para desenvolvedores (manual sem SaaS)', 'ts-ml-integration'); ?></a></p>
                    <?php else : ?>
                        <p style="margin-top: 25px; margin-bottom: 0; font-size: 13px;"><a href="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>" style="color: #64748b; text-decoration: underline;"><?php esc_html_e('Voltar para conexão simplificada de 1 clique (Recomendado)', 'ts-ml-integration'); ?></a></p>
                    <?php endif; ?>
                </div>
            <?php else : ?>
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 32px; margin-right: 15px;">✅</span>
                        <div>
                            <h2 style="margin: 0; color: #1d2327; font-size: 20px; font-weight: 600;"><?php esc_html_e('Loja Conectada ao Conextbot', 'ts-ml-integration'); ?></h2>
                            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">
                                <?php esc_html_e('Integração ativa e sincronizando em segundo plano através do SaaS centralizado.', 'ts-ml-integration'); ?>
                            </p>
                        </div>
                    </div>
                    
                    <form method="post" action="" onsubmit="return confirm('<?php esc_attr_e('Tem certeza que deseja desconectar sua loja do Conextbot SaaS? Isso desativará a IA e a sincronização.', 'ts-ml-integration'); ?>');">
                        <?php wp_nonce_field('ts_ml_disconnect_saas'); ?>
                        <input type="submit" name="disconnect_saas" class="button button-secondary" style="color: #d63638; border-color: #d63638; font-weight: 600; padding: 5px 15px;" value="<?php esc_attr_e('Desconectar Loja', 'ts-ml-integration'); ?>" />
                    </form>
                </div>

                <table class="form-table">
                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Status da Conexão', 'ts-ml-integration'); ?></th>
                        <td>
                            <?php
                            $token_check = TS_ML_API_Handler::instance()->get_valid_token(0);
                            if (!is_wp_error($token_check)) {
                                echo '<span style="color: #00a32a; font-weight: bold; display: inline-flex; align-items: center;"><span style="display: inline-block; width: 8px; height: 8px; background: #00a32a; border-radius: 50%; margin-right: 8px;"></span>Ativa e Conectada</span>';
                            } else {
                                echo '<span style="color: #d63638; font-weight: bold;">❌ Erro de Conexão: ' . esc_html($token_check->get_error_message()) . '</span>';
                            }
                            ?>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Bot ID', 'ts-ml-integration'); ?></th>
                        <td>
                            <code><?php echo esc_html(get_option('ts_ml_bot_id')); ?></code>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('URL do SaaS', 'ts-ml-integration'); ?></th>
                        <td>
                            <code><?php echo esc_html(get_option('ts_ml_saas_url')); ?></code>
                        </td>
                    </tr>
                </table>
            <?php endif; ?>
        </div>

        <?php if ($is_saas_connected) : ?>
            <div class="notice notice-info" style="border-left-color: #00a32a; padding: 15px; margin-bottom: 25px; background: #fff;">
                <h3 style="margin-top: 0; color: #00a32a;"><?php esc_html_e('☁️ Conexão via SaaS Conextbot Ativa', 'ts-ml-integration'); ?></h3>
                <p><?php esc_html_e('A sua loja está integrada ao Conextbot SaaS! Você pode agora conectar e autorizar uma ou mais contas do Mercado Livre abaixo usando o fluxo seguro do SaaS (OAuth simplificado de 1 clique).', 'ts-ml-integration'); ?></p>
                <p><a href="<?php echo esc_url($saas_url . '/dashboard/integrations'); ?>" target="_blank" class="button button-secondary">🔗 <?php esc_html_e('Ir para o Painel do Conextbot', 'ts-ml-integration'); ?></a></p>
            </div>
        <?php endif; ?>

        <?php if ($is_saas_connected || $is_manual_mode) : ?>
            <?php if ($is_manual_mode && !$is_saas_connected) : ?>
            <!-- PASSO 1: Credenciais da API (POR PAÍS) -->
            <h2><?php esc_html_e('🔑 Passo 1: Credenciais da API do Mercado Livre', 'ts-ml-integration'); ?></h2>
        <div class="notice notice-info">
            <p><strong><?php esc_html_e('ℹ️ Importante:', 'ts-ml-integration'); ?></strong>
                <?php esc_html_e('As credenciais da API são configuradas POR PAÍS. Todas as contas do mesmo país compartilham as mesmas credenciais (App ID e Secret Key).', 'ts-ml-integration'); ?>
            </p>
        </div>
        <div class="notice notice-info">
            <p><strong><?php esc_html_e('Antes de começar:', 'ts-ml-integration'); ?></strong></p>
            <ol>
                <li><?php esc_html_e('Acesse', 'ts-ml-integration'); ?> <a
                        href="https://developers.mercadolivre.com.br/"
                        target="_blank">developers.mercadolivre.com.br</a>
                    <?php esc_html_e('e faça login', 'ts-ml-integration'); ?></li>
                <li><?php esc_html_e('Clique em "Criar nova aplicação"', 'ts-ml-integration'); ?></li>
                <li><?php esc_html_e('Configure a URL de redirecionamento OAuth:', 'ts-ml-integration'); ?>
                    <br><code><?php echo esc_html(admin_url('admin.php?page=ts-ml-settings&action=oauth_callback')); ?></code>
                    <br><small><strong><?php esc_html_e('⚠️ Deve ser idêntica à URL exibida acima.', 'ts-ml-integration'); ?></strong></small>
                </li>
                <li><?php esc_html_e('Configure a URL de retorno de notificações (Webhook):', 'ts-ml-integration'); ?>
                    <br><code><?php
                    $webhook_url = home_url('/wp-json/ts-ml/v1/webhook');
                    $webhook_url = '';
                    if (class_exists('TS_ML_Public')) {
                        if (method_exists('TS_ML_Public', 'get_webhook_url')) {
                            $webhook_url = TS_ML_Public::get_webhook_url();
                        }
                    }

                    if (empty($webhook_url)) {
                        // Fallback: force HTTPS if not localhost
                        if (strpos($webhook_url, 'https://') !== 0) {
                            if (strpos($webhook_url, 'http://localhost') !== 0 && strpos($webhook_url, 'http://127.0.0.1') !== 0) {
                                $webhook_url = str_replace('http://', 'https://', $webhook_url);
                            }
                        }
                        $webhook_url = strtolower($webhook_url);
                    }
                    echo esc_html($webhook_url);
                    ?></code>
                    <br><small><?php esc_html_e('Cole esta URL no campo "URL de retornos de chamada de notificação" no painel do Mercado Livre', 'ts-ml-integration'); ?></small>
                </li>
                <li><?php esc_html_e('Copie o App ID e Secret Key gerados', 'ts-ml-integration'); ?></li>
            </ol>
        </div>
        <p>
            <a href="https://developers.mercadolivre.com.br/" target="_blank" class="button button-primary">
                <?php esc_html_e('🌐 Criar Aplicação no Mercado Livre', 'ts-ml-integration'); ?>
            </a>
        </p>

        <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>">
            <?php wp_nonce_field('ts_ml_save_api_credentials'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="app_id_br"><?php esc_html_e('App ID (Brasil)', 'ts-ml-integration'); ?></label>
                    </th>
                    <td>
                        <?php
                        $saved_app_id = get_option('ts_ml_app_id_BR');
                        ?>
                        <input type="text" name="app_id_br" id="app_id_br"
                            value="<?php echo esc_attr($saved_app_id); ?>" class="regular-text"
                            placeholder="<?php esc_attr_e('Cole o App ID aqui', 'ts-ml-integration'); ?>" />
                        <?php if (!empty($saved_app_id)) { ?>
                            <span style="color: #00a32a; margin-left: 10px;">✓
                                <?php esc_html_e('Salvo', 'ts-ml-integration'); ?></span>
                            <p class="description" style="color: #00a32a;">
                                <?php esc_html_e('App ID configurado:', 'ts-ml-integration'); ?>
                                <code><?php echo esc_html(substr($saved_app_id, 0, 10)); ?>...</code>
                            </p>
                        <?php } else { ?>
                            <p class="description">
                                <?php esc_html_e('Cole o App ID obtido no Mercado Livre Developers', 'ts-ml-integration'); ?>
                            </p>
                        <?php } ?>
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label
                            for="app_secret_br"><?php esc_html_e('Secret Key (Brasil)', 'ts-ml-integration'); ?></label>
                    </th>
                    <td>
                        <?php
                        $saved_app_secret = get_option('ts_ml_app_secret_BR');
                        ?>
                        <input type="password" name="app_secret_br" id="app_secret_br" value="" class="regular-text"
                            placeholder="<?php esc_attr_e('Cole o Secret Key aqui', 'ts-ml-integration'); ?>" />
                        <?php if (!empty($saved_app_secret)) { ?>
                            <span style="color: #00a32a; margin-left: 10px;">✓
                                <?php esc_html_e('Salvo', 'ts-ml-integration'); ?></span>
                            <p class="description" style="color: #00a32a;">
                                <?php esc_html_e('Secret Key configurado (oculto por segurança)', 'ts-ml-integration'); ?>
                            </p>
                        <?php } else { ?>
                            <p class="description">
                                <?php esc_html_e('Cole o Secret Key obtido no Mercado Livre Developers', 'ts-ml-integration'); ?>
                            </p>
                        <?php } ?>
                    </td>
                </tr>
            </table>

            <p class="submit">
                <input type="submit" name="save_api_credentials" class="button button-primary"
                    value="<?php esc_attr_e('Salvar Credenciais', 'ts-ml-integration'); ?>" />
            </p>
        </form>

        <!-- URLs Section -->
        <h3><?php esc_html_e('📋 URLs para Configurar no Mercado Livre', 'ts-ml-integration'); ?></h3>
        <div class="notice notice-warning">
            <p><strong><?php esc_html_e('⚠️ IMPORTANTE: Configure estas URLs no painel do Mercado Livre Developers', 'ts-ml-integration'); ?></strong>
            </p>
        </div>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label><?php esc_html_e('1. URL de Redirecionamento OAuth', 'ts-ml-integration'); ?></label>
                </th>
                <td>
                    <code
                        style="display: block; padding: 10px; background: #f5f5f5; border: 1px solid #ccc; margin: 5px 0;">
                        <?php
                        $oauth_redirect_url = admin_url('admin.php?page=ts-ml-settings&action=oauth_callback');
                        // Force HTTPS if not localhost
                        if (strpos($oauth_redirect_url, 'https://') !== 0 && strpos($oauth_redirect_url, 'http://localhost') !== 0 && strpos($oauth_redirect_url, 'http://127.0.0.1') !== 0) {
                            $oauth_redirect_url = str_replace('http://', 'https://', $oauth_redirect_url);
                        }
                        echo esc_html($oauth_redirect_url);
                        ?>
                    </code>
                    <p class="description">
                        <strong><?php esc_html_e('⚠️ ATENÇÃO:', 'ts-ml-integration'); ?></strong>
                        <?php esc_html_e('Esta URL deve ser cadastrada EXATAMENTE assim no Mercado Livre. Se o seu site mudou de domínio ou protocolo (HTTP/HTTPS), você deve atualizar lá.', 'ts-ml-integration'); ?>
                    </p>
                    <p class="description">
                        <?php esc_html_e('Sem essa correspondência exata, o Mercado Livre negará a conexão por segurança.', 'ts-ml-integration'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label><?php esc_html_e('2. URL de Retorno de Notificações (Webhook)', 'ts-ml-integration'); ?></label>
                </th>
                <td>
                    <?php
                    // Get webhook URL with fallback
                    $webhook_url_display = '';
                    if (class_exists('TS_ML_Public')) {
                        if (method_exists('TS_ML_Public', 'get_webhook_url')) {
                            try {
                                $webhook_url_display = TS_ML_Public::get_webhook_url();
                            } catch (Exception $e) {
                                // Error getting URL, use fallback
                                $webhook_url_display = '';
                            }
                        }
                    }

                    // Fallback if class doesn't exist or method failed
                    if (empty($webhook_url_display)) {
                        $webhook_url_display = home_url('/wp-json/ts-ml/v1/webhook');
                        // Force HTTPS if not localhost
                        if (strpos($webhook_url_display, 'https://') !== 0) {
                            if (strpos($webhook_url_display, 'http://localhost') !== 0 && strpos($webhook_url_display, 'http://127.0.0.1') !== 0) {
                                $webhook_url_display = str_replace('http://', 'https://', $webhook_url_display);
                            }
                        }
                        $webhook_url_display = strtolower($webhook_url_display);
                    }
                    ?>
                    <code style="display: block; padding: 10px; background: #f5f5f5; margin: 5px 0;">
                        <?php echo esc_html($webhook_url_display); ?>
                    </code>
                    <p class="description">
                        <?php esc_html_e('Cole esta URL no campo "URL de retornos de chamada de notificação" no painel do Mercado Livre. Esta URL receberá notificações sobre pedidos, mensagens e atualizações.', 'ts-ml-integration'); ?>
                        <br><strong><?php esc_html_e('⚠️ IMPORTANTE:', 'ts-ml-integration'); ?></strong>
                        <?php esc_html_e('O Mercado Livre requer que a URL use apenas letras minúsculas. Esta URL já está formatada corretamente.', 'ts-ml-integration'); ?>
                    </p>
                    <button type="button" class="button button-secondary"
                        onclick="navigator.clipboard.writeText('<?php echo esc_js($webhook_url_display); ?>'); alert('<?php esc_attr_e('URL copiada!', 'ts-ml-integration'); ?>');">
                        <?php esc_html_e('📋 Copiar URL', 'ts-ml-integration'); ?>
                    </button>
                </td>
            </tr>
        </table>

        <?php endif; ?>

        <hr style="margin: 40px 0;">

        <!-- PASSO 2: Contas (INDIVIDUAIS) -->
        <h2><?php esc_html_e('👤 Passo 2: Contas do Mercado Livre', 'ts-ml-integration'); ?></h2>
        <div class="notice notice-info">
            <p><strong><?php esc_html_e('ℹ️ Importante:', 'ts-ml-integration'); ?></strong>
                <?php esc_html_e('Você pode adicionar MÚLTIPLAS contas do Mercado Livre. Cada conta precisa ser conectada individualmente via OAuth para obter seus próprios tokens de acesso.', 'ts-ml-integration'); ?>
            </p>
        </div>

        <p><?php esc_html_e('Adicione e conecte suas contas do Mercado Livre para começar a sincronizar produtos, pedidos e mensagens.', 'ts-ml-integration'); ?>
        </p>

        <div class="ts-ml-accounts-list">
            <?php
            global $wpdb;
            $table_accounts = $wpdb->prefix . 'ts_ml_accounts';

            // Check if table exists
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");

            if (!$table_exists) {
                ?>
                <div class="notice notice-error">
                    <p><strong><?php esc_html_e('Erro:', 'ts-ml-integration'); ?></strong>
                        <?php esc_html_e('A tabela de contas não existe. Por favor, desative e reative o plugin para criar as tabelas necessárias.', 'ts-ml-integration'); ?>
                    </p>
                    <p>
                        <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-settings&action=create_tables'), 'create_tables')); ?>"
                            class="button button-primary">
                            <?php esc_html_e('Criar Tabelas Agora', 'ts-ml-integration'); ?>
                        </a>
                    </p>
                </div>
                <?php
            } else {
                $accounts = $wpdb->get_results("SELECT * FROM $table_accounts ORDER BY created_at DESC");

                if (empty($accounts)) {
                    ?>
                    <p><?php esc_html_e('Nenhuma conta configurada. Adicione uma conta para começar.', 'ts-ml-integration'); ?>
                    </p>
                    <?php
                } else {
                    foreach ($accounts as $account) {
                        ?>
                        <div class="ts-ml-account-card">
                            <div class="ts-ml-account-card-header">
                                <h3 style="margin: 0;"><?php echo esc_html($account->account_name); ?></h3>
                                <div class="ts-ml-account-actions">
                                    <button type="button" class="button button-secondary edit-account-btn"
                                        data-id="<?php echo esc_attr($account->id); ?>"
                                        data-name="<?php echo esc_attr($account->account_name); ?>"
                                        data-country="<?php echo esc_attr($account->country); ?>">
                                        <?php esc_html_e('✏️ Editar', 'ts-ml-integration'); ?>
                                    </button>
                                    <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-settings&delete_account=' . $account->id), 'delete_account_' . $account->id)); ?>"
                                        class="button button-link-delete submitdelete"
                                        onclick="return confirm('<?php esc_attr_e('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.', 'ts-ml-integration'); ?>');">
                                        <?php esc_html_e('🗑️ Excluir', 'ts-ml-integration'); ?>
                                    </a>
                                </div>
                            </div>

                            <div class="ts-ml-account-details">
                                <p><strong><?php esc_html_e('ID:', 'ts-ml-integration'); ?></strong>
                                    <?php echo esc_html($account->id); ?></p>
                                <p><strong><?php esc_html_e('País:', 'ts-ml-integration'); ?></strong>
                                    <?php echo esc_html($account->country); ?></p>
                                <p><strong><?php esc_html_e('Status:', 'ts-ml-integration'); ?></strong>
                                    <?php echo $account->is_active ? esc_html__('Ativa', 'ts-ml-integration') : esc_html__('Inativa', 'ts-ml-integration'); ?>
                                </p>
                            </div>

                            <div id="edit-form-<?php echo esc_attr($account->id); ?>" class="ts-ml-edit-account-form"
                                style="display:none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                                <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>">
                                    <?php wp_nonce_field('ts_ml_edit_account'); ?>
                                    <input type="hidden" name="edit_account" value="1">
                                    <input type="hidden" name="account_id" value="<?php echo esc_attr($account->id); ?>">

                                    <table class="form-table" style="margin-top: 0;">
                                        <tr>
                                            <th scope="row" style="width: 100px; padding: 10px 0;">
                                                <label><?php esc_html_e('Nome', 'ts-ml-integration'); ?></label>
                                            </th>
                                            <td style="padding: 10px 0;">
                                                <input type="text" name="account_name"
                                                    value="<?php echo esc_attr($account->account_name); ?>" class="regular-text"
                                                    style="width: 100%;" required>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th scope="row" style="width: 100px; padding: 10px 0;">
                                                <label><?php esc_html_e('País', 'ts-ml-integration'); ?></label>
                                            </th>
                                            <td style="padding: 10px 0;">
                                                <select name="country" style="width: 100%;">
                                                    <option value="BR" <?php selected($account->country, 'BR'); ?>>Brasil</option>
                                                    <option value="AR" <?php selected($account->country, 'AR'); ?>>Argentina
                                                    </option>
                                                    <option value="MX" <?php selected($account->country, 'MX'); ?>>México</option>
                                                    <option value="CL" <?php selected($account->country, 'CL'); ?>>Chile</option>
                                                    <option value="CO" <?php selected($account->country, 'CO'); ?>>Colômbia</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="margin-top: 10px;">
                                        <input type="submit" class="button button-primary"
                                            value="<?php esc_attr_e('Salvar', 'ts-ml-integration'); ?>">
                                        <button type="button" class="button cancel-edit-btn"
                                            data-id="<?php echo esc_attr($account->id); ?>"><?php esc_html_e('Cancelar', 'ts-ml-integration'); ?></button>
                                    </div>
                                </form>
                            </div>

                            <div class="ts-ml-account-connection" style="margin-top: 15px;">
                                <?php if (empty($account->access_token)) { ?>
                                    <?php
                                    $oauth_url = '';
                                    $oauth_error = '';
                                    if ($is_saas_connected) {
                                        $bot_id = get_option('ts_ml_bot_id');
                                        $oauth_url = rtrim($saas_url, '/') . '/dashboard/integrations/wordpress/connect-ml' .
                                            '?bot_id=' . urlencode($bot_id) .
                                            '&account_id=' . urlencode($account->id) .
                                            '&shop_url=' . urlencode($shop_url) .
                                            '&redirect_uri=' . urlencode(admin_url('admin.php?page=ts-ml-settings'));
                                    } else {
                                        if (class_exists('TS_ML_API_Handler')) {
                                            $oauth_result = TS_ML_API_Handler::instance()->get_oauth_url($account->id, $account->country);
                                            if (is_wp_error($oauth_result)) {
                                                $oauth_error = $oauth_result->get_error_message();
                                            } else {
                                                $oauth_url = $oauth_result;
                                            }
                                        }
                                    }
                                    ?>
                                    <?php if (!empty($oauth_error)) { ?>
                                        <p class="description" style="color: #d63638;">
                                            <strong><?php esc_html_e('⚠️ Erro:', 'ts-ml-integration'); ?></strong>
                                            <?php echo esc_html($oauth_error); ?>
                                        </p>
                                    <?php } elseif (!empty($oauth_url)) { ?>
                                        <a href="<?php echo esc_url($oauth_url); ?>" class="button button-primary" target="_blank">
                                            <?php esc_html_e('Conectar Conta', 'ts-ml-integration'); ?>
                                        </a>
                                    <?php } ?>
                                <?php } else { ?>
                                    <p><strong style="color: #00a32a;"><?php esc_html_e('✅ Conectada', 'ts-ml-integration'); ?></strong>
                                    </p>
                                    <p class="description">
                                        <small><?php esc_html_e('Expira em:', 'ts-ml-integration'); ?>
                                            <?php echo $account->token_expires_at ? esc_html($account->token_expires_at) : esc_html__('N/A', 'ts-ml-integration'); ?></small>
                                    </p>
                                <?php } ?>
                            </div>
                        </div>
                        <?php
                    }
                }
            }
            ?>
        </div>

        <h3><?php esc_html_e('➕ Adicionar Nova Conta', 'ts-ml-integration'); ?></h3>
        <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>">
            <?php wp_nonce_field('ts_ml_add_account'); ?>
            <input type="hidden" name="action" value="add_account" />
            <table class="form-table">
                <tr>
                    <th><label for="account_name"><?php esc_html_e('Nome da Conta', 'ts-ml-integration'); ?></label>
                    </th>
                    <td>
                        <input type="text" name="account_name" id="account_name" class="regular-text" required
                            value="<?php echo isset($_POST['account_name']) ? esc_attr($_POST['account_name']) : ''; ?>" />
                        <p class="description">
                            <?php esc_html_e('Ex: Conta Principal, Loja Online, etc.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><label for="country"><?php esc_html_e('País', 'ts-ml-integration'); ?></label></th>
                    <td>
                        <select name="country" id="country">
                            <option value="BR" <?php selected(isset($_POST['country']) ? $_POST['country'] : 'BR', 'BR'); ?>>Brasil</option>
                            <option value="AR" <?php selected(isset($_POST['country']) ? $_POST['country'] : '', 'AR'); ?>>Argentina</option>
                            <option value="MX" <?php selected(isset($_POST['country']) ? $_POST['country'] : '', 'MX'); ?>>México</option>
                            <option value="CL" <?php selected(isset($_POST['country']) ? $_POST['country'] : '', 'CL'); ?>>Chile</option>
                            <option value="CO" <?php selected(isset($_POST['country']) ? $_POST['country'] : '', 'CO'); ?>>Colômbia</option>
                        </select>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <input type="submit" name="add_account" class="button button-primary"
                    value="<?php esc_attr_e('Adicionar Conta', 'ts-ml-integration'); ?>" />
            </p>
        </form>
        <?php endif; ?>

        <hr style="margin: 40px 0;">

        <!-- PASSO 3: Configurações Avançadas (GLOBAIS) -->
        <h2><?php esc_html_e('⚙️ Passo 3: Configurações Avançadas', 'ts-ml-integration'); ?></h2>
        <div class="notice notice-info">
            <p><strong><?php esc_html_e('ℹ️ Importante:', 'ts-ml-integration'); ?></strong>
                <?php esc_html_e('Estas configurações são GLOBAIS e se aplicam a TODAS as contas do Mercado Livre configuradas no plugin.', 'ts-ml-integration'); ?>
            </p>
        </div>
        <p><?php esc_html_e('Configure as opções de sincronização automática e outras funcionalidades do plugin.', 'ts-ml-integration'); ?>
        </p>

        <form method="post" action="">
            <?php wp_nonce_field('ts_ml_save_settings'); ?>

            <table class="form-table">
                <tr>
                    <th scope="row"><?php esc_html_e('Sincronização Automática', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_sync" value="1" <?php checked(get_option('ts_ml_auto_sync'), 'yes'); ?> />
                            <?php esc_html_e('Ativar sincronização automática de produtos', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Sincroniza produtos automaticamente via cron jobs.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Criação Automática', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_create_on_ml" value="1" <?php checked(get_option('ts_ml_auto_create_on_ml'), 'yes'); ?> />
                            <?php esc_html_e('Criar anúncio no ML ao criar produto no WooCommerce', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Ao publicar um novo produto no site, ele será automaticamente enviado para o Mercado Livre.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Sincronização de Estoque', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_sync_stock" value="1" <?php checked(get_option('ts_ml_auto_sync_stock'), 'yes'); ?> />
                            <?php esc_html_e('Sincronizar estoque automaticamente', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Atualiza o estoque no Mercado Livre quando alterado no WooCommerce.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Sincronização de Preços', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_sync_prices" value="1" <?php checked(get_option('ts_ml_auto_sync_prices'), 'yes'); ?> />
                            <?php esc_html_e('Sincronizar preços automaticamente', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Atualiza os preços no Mercado Livre quando alterados no WooCommerce.', 'ts-ml-integration'); ?>
                        </p>

                        <br>

                        <label for="price_adjustment_percent">
                            <strong><?php esc_html_e('Ajuste Percentual (%):', 'ts-ml-integration'); ?></strong>
                        </label>
                        <input type="number" step="0.01" name="price_adjustment_percent" id="price_adjustment_percent"
                            value="<?php echo esc_attr(get_option('ts_ml_price_adjustment_percent', '0')); ?>"
                            class="small-text" />
                        <span
                            class="description"><?php esc_html_e('Ex: 10 para aumentar 10%, -5 para descontar 5%.', 'ts-ml-integration'); ?></span>

                        <br><br>

                        <label for="price_adjustment_fixed">
                            <strong><?php esc_html_e('Ajuste Fixo (R$):', 'ts-ml-integration'); ?></strong>
                        </label>
                        <input type="number" step="0.01" name="price_adjustment_fixed" id="price_adjustment_fixed"
                            value="<?php echo esc_attr(get_option('ts_ml_price_adjustment_fixed', '0')); ?>"
                            class="small-text" />
                        <span
                            class="description"><?php esc_html_e('Valor fixo adicionado APÓS o percentual. Ex: 5.00', 'ts-ml-integration'); ?></span>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Sincronização de Pedidos', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="auto_sync_orders" value="1" <?php checked(get_option('ts_ml_auto_sync_orders'), 'yes'); ?> />
                            <?php esc_html_e('Sincronizar pedidos automaticamente', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Importa pedidos do Mercado Livre automaticamente.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Sincronização de Exclusão', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="sync_deletions" value="1" <?php checked(get_option('ts_ml_sync_deletions'), 'yes'); ?> />
                            <?php esc_html_e('Finalizar anúncio no ML ao excluir produto no WooCommerce', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Quando um produto for para a lixeira ou for excluído permanentemente, o anúncio vinculado no Mercado Livre será FINALIZADO (Closed).', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Sincronização de Visibilidade', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="sync_status_changes" value="1" <?php checked(get_option('ts_ml_sync_status_changes'), 'yes'); ?> />
                            <?php esc_html_e('Pausar anúncio no ML ao mudar produto para Rascunho', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Quando um produto for alterado para Rascunho ou Privado, o anúncio no Mercado Livre será PAUSADO. Ao publicar novamente, ele voltará a ficar ATIVO.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Frequência de Sincronização', 'ts-ml-integration'); ?></th>
                    <td>
                        <select name="sync_frequency">
                            <option value="hourly" <?php selected(get_option('ts_ml_sync_frequency'), 'hourly'); ?>>
                                <?php esc_html_e('A cada hora', 'ts-ml-integration'); ?>
                            </option>
                            <option value="twicedaily" <?php selected(get_option('ts_ml_sync_frequency'), 'twicedaily'); ?>><?php esc_html_e('Duas vezes por dia', 'ts-ml-integration'); ?></option>
                            <option value="daily" <?php selected(get_option('ts_ml_sync_frequency'), 'daily'); ?>>
                                <?php esc_html_e('Uma vez por dia', 'ts-ml-integration'); ?>
                            </option>
                        </select>
                        <p class="description">
                            <?php esc_html_e('Frequência das sincronizações automáticas via cron.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Integração com ChatGPT', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="ai_enabled" value="1" <?php checked(get_option('ts_ml_ai_enabled'), 'yes'); ?> />
                            <?php esc_html_e('Ativar respostas automáticas com IA', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Use ChatGPT para gerar respostas automáticas às mensagens do Mercado Livre.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label for="ai_api_key"><?php esc_html_e('Chave API OpenAI', 'ts-ml-integration'); ?></label>
                    </th>
                    <td>
                        <input type="password" name="ai_api_key" id="ai_api_key"
                            value="<?php echo esc_attr(get_option('ts_ml_ai_api_key')); ?>" class="regular-text" />
                        <p class="description">
                            <?php esc_html_e('Chave API do OpenAI para usar ChatGPT. Obtenha em', 'ts-ml-integration'); ?>
                            <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label for="ai_model"><?php esc_html_e('Modelo IA', 'ts-ml-integration'); ?></label>
                    </th>
                    <td>
                        <select name="ai_model" id="ai_model">
                            <option value="gpt-3.5-turbo" <?php selected(get_option('ts_ml_ai_model', 'gpt-3.5-turbo'), 'gpt-3.5-turbo'); ?>>GPT-3.5 Turbo (Mais rápido/barato)</option>
                            <option value="gpt-4o" <?php selected(get_option('ts_ml_ai_model'), 'gpt-4o'); ?>>GPT-4o
                                (Mais inteligente)</option>
                            <option value="gpt-4-turbo" <?php selected(get_option('ts_ml_ai_model'), 'gpt-4-turbo'); ?>>
                                GPT-4 Turbo</option>
                        </select>
                        <p class="description">
                            <?php esc_html_e('Escolha o modelo de IA a ser utilizado.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label
                            for="ai_system_prompt"><?php esc_html_e('Prompt do Sistema', 'ts-ml-integration'); ?></label>
                    </th>
                    <td>
                        <textarea name="ai_system_prompt" id="ai_system_prompt" rows="5"
                            class="large-text code"><?php echo esc_textarea(get_option('ts_ml_ai_system_prompt', sprintf('Você é um assistente virtual da loja %s. Responda de forma educada, curta e prestativa. O foco é ajudar o cliente a comprar.', esc_html(get_bloginfo('name'))))); ?></textarea>
                        <p class="description">
                            <?php esc_html_e('Instruções iniciais para a IA saber como se comportar.', 'ts-ml-integration'); ?>
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><?php esc_html_e('Modo Debug', 'ts-ml-integration'); ?></th>
                    <td>
                        <label>
                            <input type="checkbox" name="debug_mode" value="1" <?php checked(get_option('ts_ml_debug_mode'), 'yes'); ?> />
                            <?php esc_html_e('Ativar modo debug', 'ts-ml-integration'); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e('Ativa logs detalhados para depuração. Os logs são salvos em', 'ts-ml-integration'); ?>
                            <code><?php echo esc_html(wp_upload_dir()['basedir'] . '/ts-ml-logs/'); ?></code>
                        </p>
                    </td>
                </tr>
            </table>

            <p class="submit">
                <input type="submit" name="save_settings" class="button button-primary"
                    value="<?php esc_attr_e('Salvar Configurações', 'ts-ml-integration'); ?>" />
            </p>
        </form>
    </div>
</div>