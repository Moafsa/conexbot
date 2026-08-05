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

// Handle SaaS ML Callback (Step 2: Connect Account via Next.js SaaS Router)
if (isset($_GET['action']) && $_GET['action'] === 'saas_ml_callback' && current_user_can('manage_woocommerce')) {
    $account_id = isset($_GET['account_id']) ? intval($_GET['account_id']) : 0;
    $access_token = isset($_GET['access_token']) ? sanitize_text_field($_GET['access_token']) : '';
    $refresh_token = isset($_GET['refresh_token']) ? sanitize_text_field($_GET['refresh_token']) : '';
    $expires_in = isset($_GET['expires_in']) ? intval($_GET['expires_in']) : 21600;
    $account_name = isset($_GET['account_name']) ? sanitize_text_field($_GET['account_name']) : '';

    if ($account_id > 0 && !empty($access_token)) {
        $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
        $expires_at = date('Y-m-d H:i:s', time() + $expires_in);

        $update_data = array(
            'access_token' => $access_token,
            'refresh_token' => $refresh_token,
            'token_expires_at' => $expires_at,
            'updated_at' => current_time('mysql'),
        );

        if (!empty($account_name)) {
            $update_data['account_name'] = $account_name;
        }

        $wpdb->update(
            $table_accounts,
            $update_data,
            array('id' => $account_id)
        );

        update_option('ts_ml_use_saas', 'yes');
        wp_redirect(admin_url('admin.php?page=ts-ml-settings&account_connected=1'));
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
                        $new_account_id = $wpdb->insert_id;
                        $oauth_url = '';
                        if (class_exists('TS_ML_API_Handler')) {
                            $oauth_result = TS_ML_API_Handler::instance()->get_oauth_url($new_account_id, $country);
                            if (!is_wp_error($oauth_result)) {
                                $oauth_url = $oauth_result;
                            }
                        }

                        if (!empty($oauth_url)) {
                            wp_redirect($oauth_url);
                            exit;
                        }

                        $redirect_url = admin_url('admin.php?page=ts-ml-settings&account_added=1');
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
    update_option('ts_ml_sync_only_with_photos', isset($_POST['sync_only_with_photos']) ? 'yes' : 'no');
    update_option('ts_ml_sync_only_ready', isset($_POST['sync_only_ready']) ? 'yes' : 'no');
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

        <!-- CABEÇALHO DE CONEXÃO SAAS CONEXTBOT (1-CLIQUE) -->
        <?php
        $saas_url = get_option('ts_ml_saas_url');
        $shop_url = home_url();
        $shop_host = parse_url($shop_url, PHP_URL_HOST);

        if (empty($saas_url) || (!empty($shop_host) && strpos($saas_url, $shop_host) !== false)) {
            $saas_url = 'https://app.conext.click';
            update_option('ts_ml_saas_url', $saas_url);
        }

        $redirect_uri = admin_url('admin.php?page=ts-ml-settings&action=saas_callback');
        $connect_url = rtrim($saas_url, '/') . '/dashboard/integrations/wordpress/connect?shop_url=' . urlencode($shop_url) . '&redirect_uri=' . urlencode($redirect_uri);
        $is_saas_connected = (get_option('ts_ml_use_saas') === 'yes' && !empty(get_option('ts_ml_bot_id')));
        ?>

        <div class="ts-ml-saas-hero-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <?php if (!$is_saas_connected) : ?>
                <div style="text-align: center; padding: 15px 10px;">
                    <div style="font-size: 44px; margin-bottom: 10px;">⚡</div>
                    <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 22px; font-weight: 700;"><?php esc_html_e('Conexão Conextbot SaaS (1-Clique)', 'ts-ml-integration'); ?></h2>
                    <p style="font-size: 14px; color: #64748b; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.5;">
                        <?php esc_html_e('Conecte sua loja ao Conextbot SaaS para validar sua licença e autenticar sua conta no Mercado Livre sem precisar configurar chaves de desenvolvedor.', 'ts-ml-integration'); ?>
                    </p>
                    
                    <a href="<?php echo esc_url($connect_url); ?>" class="button button-primary button-hero" style="background: #10b981; border-color: #10b981; font-size: 15px; padding: 4px 30px; height: auto; line-height: 2.2; border-radius: 6px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(16,185,129,0.3);">
                        🔌 <?php esc_html_e('Conectar Loja ao Conextbot SaaS', 'ts-ml-integration'); ?>
                    </a>

                    <div style="margin-top: 15px; font-size: 12px; color: #94a3b8;">
                        <?php esc_html_e('Conexão segura e instantânea intermediada pelo aplicativo mestre em app.conext.click.', 'ts-ml-integration'); ?>
                    </div>
                </div>
            <?php else : ?>
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 18px;">
                    <div style="display: flex; align-items: center;">
                        <div style="background: #ecfdf5; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-right: 15px;">
                            ✅
                        </div>
                        <div>
                            <h2 style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 700;"><?php esc_html_e('Loja Conectada ao Conextbot SaaS', 'ts-ml-integration'); ?></h2>
                            <p style="margin: 3px 0 0 0; color: #64748b; font-size: 13px;">
                                <?php esc_html_e('Integração ativa e sincronizando em segundo plano através do SaaS centralizado.', 'ts-ml-integration'); ?>
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <a href="<?php echo esc_url($saas_url . '/dashboard/integrations'); ?>" target="_blank" class="button button-secondary" style="font-weight: 600;">
                            🔗 <?php esc_html_e('Painel Conextbot', 'ts-ml-integration'); ?>
                        </a>
                        <form method="post" action="" onsubmit="return confirm('<?php esc_attr_e('Tem certeza que deseja desconectar sua loja do Conextbot SaaS?', 'ts-ml-integration'); ?>');">
                            <?php wp_nonce_field('ts_ml_disconnect_saas'); ?>
                            <input type="submit" name="disconnect_saas" class="button button-secondary" style="color: #ef4444; border-color: #fca5a5; font-weight: 600;" value="<?php esc_attr_e('Desconectar', 'ts-ml-integration'); ?>" />
                        </form>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px;">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 3px;"><?php esc_html_e('Status da Conexão', 'ts-ml-integration'); ?></span>
                        <span style="color: #10b981; font-weight: 700; font-size: 13px;">🟢 Conectada e Ativa</span>
                    </div>
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 3px;"><?php esc_html_e('Bot ID', 'ts-ml-integration'); ?></span>
                        <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid #e2e8f0;"><?php echo esc_html(get_option('ts_ml_bot_id')); ?></code>
                    </div>
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 3px;"><?php esc_html_e('Servidor SaaS', 'ts-ml-integration'); ?></span>
                        <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid #e2e8f0;"><?php echo esc_html(get_option('ts_ml_saas_url')); ?></code>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <!-- SEÇÃO 1: CONTAS DO MERCADO LIVRE -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                <div>
                    <h2 style="margin: 0; font-size: 18px; color: #0f172a; font-weight: 700;"><?php esc_html_e('🛍️ Contas do Mercado Livre Conectadas', 'ts-ml-integration'); ?></h2>
                    <p style="margin: 3px 0 0 0; color: #64748b; font-size: 13px;"><?php esc_html_e('Gerencie as contas de vendedor conectadas ao seu site.', 'ts-ml-integration'); ?></p>
                </div>
            </div>

            <div class="ts-ml-accounts-list">
                <?php
                global $wpdb;
                $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
                $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");

                if (!$table_exists) {
                    ?>
                    <div class="notice notice-error" style="margin: 0;">
                        <p><strong><?php esc_html_e('Aviso:', 'ts-ml-integration'); ?></strong> <?php esc_html_e('Tabela de contas pendente.', 'ts-ml-integration'); ?>
                            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-settings&action=create_tables'), 'create_tables')); ?>" class="button button-small button-primary">
                                <?php esc_html_e('Criar Tabelas', 'ts-ml-integration'); ?>
                            </a>
                        </p>
                    </div>
                    <?php
                } else {
                    $accounts = $wpdb->get_results("SELECT * FROM $table_accounts ORDER BY created_at DESC");

                    if (empty($accounts)) {
                        ?>
                        <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; width: 100%;">
                            <p style="margin: 0 0 10px 0; color: #64748b;"><?php esc_html_e('Nenhuma conta do Mercado Livre vinculada no momento.', 'ts-ml-integration'); ?></p>
                        </div>
                        <?php
                    } else {
                        foreach ($accounts as $account) {
                            ?>
                            <div class="ts-ml-account-card" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff;">
                                <div class="ts-ml-account-card-header" style="background: #f8fafc; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                                    <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;"><?php echo esc_html($account->account_name); ?></h3>
                                    <div class="ts-ml-account-actions">
                                        <button type="button" class="button button-small edit-account-btn" data-id="<?php echo esc_attr($account->id); ?>" data-name="<?php echo esc_attr($account->account_name); ?>" data-country="<?php echo esc_attr($account->country); ?>">
                                            <?php esc_html_e('✏️ Editar', 'ts-ml-integration'); ?>
                                        </button>
                                        <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-settings&delete_account=' . $account->id), 'delete_account_' . $account->id)); ?>" class="button button-small button-link-delete" onclick="return confirm('<?php esc_attr_e('Tem certeza que deseja remover esta conta?', 'ts-ml-integration'); ?>');">
                                            <?php esc_html_e('🗑️ Remover', 'ts-ml-integration'); ?>
                                        </a>
                                    </div>
                                </div>

                                <div class="ts-ml-account-details" style="padding: 15px;">
                                    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong><?php esc_html_e('País:', 'ts-ml-integration'); ?></strong> <?php echo esc_html($account->country); ?></p>
                                    
                                    <div style="margin-top: 10px;">
                                        <?php
                                        $token_check = TS_ML_API_Handler::instance()->get_valid_token($account->id);
                                        $is_account_connected = !is_wp_error($token_check) && !empty($account->access_token);
                                        $oauth_url = TS_ML_API_Handler::instance()->get_oauth_url($account->id, $account->country);
                                        ?>

                                        <?php if ($is_account_connected) { ?>
                                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                                <span style="color: #10b981; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center;">
                                                    <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                    <?php esc_html_e('Conectada e Ativa', 'ts-ml-integration'); ?>
                                                </span>
                                                <?php if (!is_wp_error($oauth_url)) { ?>
                                                    <a href="<?php echo esc_url($oauth_url); ?>" class="button button-small" style="font-size: 11px;">
                                                        🔄 <?php esc_html_e('Reconectar', 'ts-ml-integration'); ?>
                                                    </a>
                                                <?php } ?>
                                            </div>
                                        <?php } else { ?>
                                            <div style="margin-bottom: 8px;">
                                                <span style="color: #ef4444; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center;">
                                                    <span style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
                                                    <?php esc_html_e('Desconectada / Token Pendente', 'ts-ml-integration'); ?>
                                                </span>
                                            </div>
                                            <?php if (!is_wp_error($oauth_url)) { ?>
                                                <a href="<?php echo esc_url($oauth_url); ?>" class="button button-primary button-small" style="background: #2563eb; border-color: #2563eb; font-weight: 600; width: 100%; text-align: center; display: block;">
                                                    ⚡ <?php esc_html_e('Conectar no Mercado Livre', 'ts-ml-integration'); ?>
                                                </a>
                                            <?php } ?>
                                        <?php } ?>
                                    </div>
                                </div>

                                <div id="edit-form-<?php echo esc_attr($account->id); ?>" class="ts-ml-edit-account-form" style="display:none; padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                                    <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>">
                                        <?php wp_nonce_field('ts_ml_edit_account'); ?>
                                        <input type="hidden" name="edit_account" value="1">
                                        <input type="hidden" name="account_id" value="<?php echo esc_attr($account->id); ?>">

                                        <div style="margin-bottom: 10px;">
                                            <label style="font-weight: 600; display: block; margin-bottom: 4px;"><?php esc_html_e('Nome', 'ts-ml-integration'); ?></label>
                                            <input type="text" name="account_name" value="<?php echo esc_attr($account->account_name); ?>" class="regular-text" style="width: 100%;" required>
                                        </div>

                                        <div style="margin-bottom: 10px;">
                                            <label style="font-weight: 600; display: block; margin-bottom: 4px;"><?php esc_html_e('País', 'ts-ml-integration'); ?></label>
                                            <select name="country" style="width: 100%;">
                                                <option value="BR" <?php selected($account->country, 'BR'); ?>>Brasil</option>
                                                <option value="AR" <?php selected($account->country, 'AR'); ?>>Argentina</option>
                                                <option value="MX" <?php selected($account->country, 'MX'); ?>>México</option>
                                                <option value="CL" <?php selected($account->country, 'CL'); ?>>Chile</option>
                                                <option value="CO" <?php selected($account->country, 'CO'); ?>>Colômbia</option>
                                            </select>
                                        </div>

                                        <div style="display: flex; gap: 8px;">
                                            <input type="submit" class="button button-primary button-small" value="<?php esc_attr_e('Salvar', 'ts-ml-integration'); ?>">
                                            <button type="button" class="button button-small cancel-edit-btn" data-id="<?php echo esc_attr($account->id); ?>"><?php esc_html_e('Cancelar', 'ts-ml-integration'); ?></button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <?php
                        }
                    }
                }
                ?>
            </div>

            <!-- Adicionar Nova Conta -->
            <div style="margin-top: 25px; background: #ffffff; border: 2px solid #2563eb; border-radius: 10px; padding: 20px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08); position: relative; z-index: 10;">
                <h4 style="margin: 0 0 14px 0; font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                    ➕ <?php esc_html_e('Adicionar Nova Conta do Mercado Livre', 'ts-ml-integration'); ?>
                </h4>
                <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>" style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
                    <?php wp_nonce_field('ts_ml_add_account'); ?>
                    <input type="hidden" name="action" value="add_account" />
                    
                    <div style="flex: 1; min-width: 240px;">
                        <label for="account_name" style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 6px; color: #334155;"><?php esc_html_e('Nome da Sua Loja', 'ts-ml-integration'); ?></label>
                        <input type="text" name="account_name" id="account_name" class="regular-text" style="width: 100%; height: 42px; font-size: 14px; padding: 0 12px; border: 1px solid #94a3b8; border-radius: 6px; background: #ffffff; color: #0f172a; box-shadow: none;" placeholder="Ex: Toy Sport Mercado Livre" required autocomplete="off" />
                    </div>

                    <div style="width: 140px;">
                        <label for="country" style="font-weight: 700; font-size: 13px; display: block; margin-bottom: 6px; color: #334155;"><?php esc_html_e('País', 'ts-ml-integration'); ?></label>
                        <select name="country" id="country" style="width: 100%; height: 42px; font-size: 14px; border: 1px solid #94a3b8; border-radius: 6px; background: #ffffff; color: #0f172a;">
                            <option value="BR">Brasil</option>
                            <option value="AR">Argentina</option>
                            <option value="MX">México</option>
                            <option value="CL">Chile</option>
                            <option value="CO">Colômbia</option>
                        </select>
                    </div>

                    <button type="submit" name="add_account" class="button button-primary button-large" style="background: #2563eb; border-color: #2563eb; height: 42px; line-height: 40px; padding: 0 24px; font-size: 14px; font-weight: 700; border-radius: 6px; cursor: pointer;">
                        ⚡ <?php esc_attr_e('Adicionar e Conectar no Mercado Livre', 'ts-ml-integration'); ?>
                    </button>
                </form>
            </div>
        </div>

        <!-- SEÇÃO 2: REGRAS DE SINCRONIZAÇÃO E QUALIDADE -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                <h2 style="margin: 0; font-size: 18px; color: #0f172a; font-weight: 700;"><?php esc_html_e('⚙️ Regras de Sincronização & Qualidade de Anúncios', 'ts-ml-integration'); ?></h2>
                <p style="margin: 3px 0 0 0; color: #64748b; font-size: 13px;"><?php esc_html_e('Configure como seus produtos, preços e estoques são enviados para o Mercado Livre.', 'ts-ml-integration'); ?></p>
            </div>

            <form method="post" action="">
                <?php wp_nonce_field('ts_ml_save_settings'); ?>

                <table class="form-table" style="margin-top: 0;">
                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Sincronização Automática', 'ts-ml-integration'); ?></th>
                        <td>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="auto_sync" value="1" <?php checked(get_option('ts_ml_auto_sync'), 'yes'); ?> />
                                <strong><?php esc_html_e('Ativar sincronização automática de produtos', 'ts-ml-integration'); ?></strong>
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="auto_create_on_ml" value="1" <?php checked(get_option('ts_ml_auto_create_on_ml'), 'yes'); ?> />
                                <?php esc_html_e('Publicar no Mercado Livre automaticamente ao criar novo produto no WooCommerce', 'ts-ml-integration'); ?>
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="auto_sync_stock" value="1" <?php checked(get_option('ts_ml_auto_sync_stock'), 'yes'); ?> />
                                <?php esc_html_e('Sincronizar estoque automaticamente', 'ts-ml-integration'); ?>
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="auto_sync_prices" value="1" <?php checked(get_option('ts_ml_auto_sync_prices'), 'yes'); ?> />
                                <?php esc_html_e('Sincronizar preços automaticamente', 'ts-ml-integration'); ?>
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="auto_sync_orders" value="1" <?php checked(get_option('ts_ml_auto_sync_orders'), 'yes'); ?> />
                                <?php esc_html_e('Importar pedidos do Mercado Livre automaticamente', 'ts-ml-integration'); ?>
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Filtros de Qualidade', 'ts-ml-integration'); ?></th>
                        <td>
                            <label style="display: block; margin-bottom: 10px;">
                                <input type="checkbox" name="sync_only_with_photos" value="1" <?php checked(get_option('ts_ml_sync_only_with_photos'), 'yes'); ?> />
                                🖼️ <strong><?php esc_html_e('Sincronizar apenas produtos com foto', 'ts-ml-integration'); ?></strong>
                            </label>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="sync_only_ready" value="1" <?php checked(get_option('ts_ml_sync_only_ready'), 'yes'); ?> />
                                ✅ <strong><?php esc_html_e('Sincronizar apenas produtos 100% prontos para o Mercado Livre', 'ts-ml-integration'); ?></strong>
                            </label>
                            <p class="description" style="margin-top: 5px;">
                                <?php esc_html_e('Evita o envio de produtos sem fotos, sem preço, sem estoque ou com categorias não mapeadas.', 'ts-ml-integration'); ?>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Mudanças de Status', 'ts-ml-integration'); ?></th>
                        <td>
                            <label style="display: block; margin-bottom: 8px;">
                                <input type="checkbox" name="sync_status_changes" value="1" <?php checked(get_option('ts_ml_sync_status_changes'), 'yes'); ?> />
                                <?php esc_html_e('Pausar anúncio no ML ao alterar produto para Rascunho no WooCommerce', 'ts-ml-integration'); ?>
                            </label>
                            <label style="display: block;">
                                <input type="checkbox" name="sync_deletions" value="1" <?php checked(get_option('ts_ml_sync_deletions'), 'yes'); ?> />
                                <?php esc_html_e('Finalizar anúncio no ML ao mover produto para a Lixeira no WooCommerce', 'ts-ml-integration'); ?>
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Ajustes de Preço no ML', 'ts-ml-integration'); ?></th>
                        <td>
                            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                                <div>
                                    <label for="price_adjustment_percent" style="font-weight: 600; display: block; font-size: 12px; margin-bottom: 4px;"><?php esc_html_e('Ajuste Percentual (%)', 'ts-ml-integration'); ?></label>
                                    <input type="number" step="0.01" name="price_adjustment_percent" id="price_adjustment_percent" value="<?php echo esc_attr(get_option('ts_ml_price_adjustment_percent', '0')); ?>" class="small-text" />
                                    <span class="description"><?php esc_html_e('Ex: 10 para +10%', 'ts-ml-integration'); ?></span>
                                </div>
                                <div>
                                    <label for="price_adjustment_fixed" style="font-weight: 600; display: block; font-size: 12px; margin-bottom: 4px;"><?php esc_html_e('Ajuste Fixo (R$)', 'ts-ml-integration'); ?></label>
                                    <input type="number" step="0.01" name="price_adjustment_fixed" id="price_adjustment_fixed" value="<?php echo esc_attr(get_option('ts_ml_price_adjustment_fixed', '0')); ?>" class="small-text" />
                                    <span class="description"><?php esc_html_e('Ex: 5.00 para +R$5', 'ts-ml-integration'); ?></span>
                                </div>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Frequência de Cron', 'ts-ml-integration'); ?></th>
                        <td>
                            <select name="sync_frequency">
                                <option value="hourly" <?php selected(get_option('ts_ml_sync_frequency'), 'hourly'); ?>><?php esc_html_e('A cada hora (Recomendado)', 'ts-ml-integration'); ?></option>
                                <option value="twicedaily" <?php selected(get_option('ts_ml_sync_frequency'), 'twicedaily'); ?>><?php esc_html_e('Duas vezes por dia', 'ts-ml-integration'); ?></option>
                                <option value="daily" <?php selected(get_option('ts_ml_sync_frequency'), 'daily'); ?>><?php esc_html_e('Uma vez por dia', 'ts-ml-integration'); ?></option>
                            </select>
                        </td>
                    </tr>
                </table>

                <h3 style="margin: 25px 0 15px 0; font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #f1f5f9; padding-top: 20px;"><?php esc_html_e('🤖 Inteligência Artificial (ChatGPT / Conextbot AI)', 'ts-ml-integration'); ?></h3>

                <table class="form-table" style="margin-top: 0;">
                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Respostas Automáticas', 'ts-ml-integration'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="ai_enabled" value="1" <?php checked(get_option('ts_ml_ai_enabled'), 'yes'); ?> />
                                <strong><?php esc_html_e('Ativar respostas automáticas com IA para perguntas do Mercado Livre', 'ts-ml-integration'); ?></strong>
                            </label>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="ai_model"><?php esc_html_e('Modelo de IA', 'ts-ml-integration'); ?></label></th>
                        <td>
                            <select name="ai_model" id="ai_model">
                                <option value="gpt-3.5-turbo" <?php selected(get_option('ts_ml_ai_model', 'gpt-3.5-turbo'), 'gpt-3.5-turbo'); ?>>GPT-3.5 Turbo (Rápido)</option>
                                <option value="gpt-4o" <?php selected(get_option('ts_ml_ai_model'), 'gpt-4o'); ?>>GPT-4o (Avançado)</option>
                                <option value="gpt-4-turbo" <?php selected(get_option('ts_ml_ai_model'), 'gpt-4-turbo'); ?>>GPT-4 Turbo</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="ai_system_prompt"><?php esc_html_e('Prompt do Sistema', 'ts-ml-integration'); ?></label></th>
                        <td>
                            <textarea name="ai_system_prompt" id="ai_system_prompt" rows="4" class="large-text code"><?php echo esc_textarea(get_option('ts_ml_ai_system_prompt', sprintf('Você é um assistente virtual da loja %s. Responda de forma educada, curta e prestativa para ajudar o cliente a comprar.', esc_html(get_bloginfo('name'))))); ?></textarea>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row" style="font-weight: 600;"><?php esc_html_e('Modo Debug', 'ts-ml-integration'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="debug_mode" value="1" <?php checked(get_option('ts_ml_debug_mode'), 'yes'); ?> />
                                <?php esc_html_e('Ativar logs detalhados de diagnóstico', 'ts-ml-integration'); ?>
                            </label>
                        </td>
                    </tr>
                </table>

                <p class="submit">
                    <input type="submit" name="save_settings" class="button button-primary button-large" style="background: #2563eb; border-color: #2563eb; font-weight: 600; padding: 4px 25px;" value="<?php esc_attr_e('Salvar Configurações', 'ts-ml-integration'); ?>" />
                </p>
            </form>
        </div>

        <!-- MODO DESENVOLVEDOR AVANÇADO (SANFONA EXPANSÍVEL - PARA DEPLOY SEM SAAS) -->
        <details style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px 20px; margin-bottom: 30px;">
            <summary style="font-weight: 600; color: #64748b; cursor: pointer; user-select: none;">
                ⚙️ <?php esc_html_e('Modo Avançado / Desenvolvedor (Credenciais Manuais de API sem SaaS)', 'ts-ml-integration'); ?>
            </summary>
            
            <div style="margin-top: 15px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                <p class="description" style="margin-bottom: 15px;">
                    <?php esc_html_e('Utilize esta seção apenas se estiver executando este plugin de forma independente, sem conexão ao Conextbot SaaS.', 'ts-ml-integration'); ?>
                </p>

                <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>">
                    <?php wp_nonce_field('ts_ml_save_api_credentials'); ?>
                    <table class="form-table" style="margin-top: 0;">
                        <tr>
                            <th scope="row"><label for="app_id_br"><?php esc_html_e('App ID (Brasil)', 'ts-ml-integration'); ?></label></th>
                            <td>
                                <input type="text" name="app_id_br" id="app_id_br" value="<?php echo esc_attr(get_option('ts_ml_app_id_BR')); ?>" class="regular-text" />
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="app_secret_br"><?php esc_html_e('Secret Key (Brasil)', 'ts-ml-integration'); ?></label></th>
                            <td>
                                <input type="password" name="app_secret_br" id="app_secret_br" value="" class="regular-text" placeholder="Secret Key mantido oculta" />
                            </td>
                        </tr>
                    </table>

                    <p class="submit" style="padding: 0; margin-top: 10px;">
                        <input type="submit" name="save_api_credentials" class="button button-secondary" value="<?php esc_attr_e('Salvar Credenciais Manuais', 'ts-ml-integration'); ?>" />
                    </p>
                </form>

                <div style="margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <h5 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700;"><?php esc_html_e('📋 URLs para Mercado Livre Developers (Modo Manual):', 'ts-ml-integration'); ?></h5>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>OAuth Redirect:</strong> <code><?php echo esc_html(admin_url('admin.php?page=ts-ml-settings&action=oauth_callback')); ?></code></p>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Webhook:</strong> <code><?php echo esc_html(home_url('/wp-json/ts-ml/v1/webhook')); ?></code></p>
                </div>
            </div>
        </details>
    </div>