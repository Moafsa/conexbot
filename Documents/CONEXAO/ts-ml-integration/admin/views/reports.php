<?php
/**
 * Reports page
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;

// Get statistics
$table_products = $wpdb->prefix . 'ts_ml_products';
$table_orders = $wpdb->prefix . 'ts_ml_orders';
$table_messages = $wpdb->prefix . 'ts_ml_messages';
$table_logs = $wpdb->prefix . 'ts_ml_sync_logs';
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';

// The store's real total is the WooCommerce product count — NOT the row count in
// ts_ml_products, which only ever contains products that were actually sent/imported at
// least once. Confusing those two is exactly why "3 / 11" didn't look right: 11 was never
// "all products in the store", it was "products ever touched by sync".
$wc_product_counts = wp_count_posts('product');
$total_wc_products = isset($wc_product_counts->publish) ? intval($wc_product_counts->publish) : 0;

$stats = array(
    'tracked_products' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_products")),
    'synced_products' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'synced'")),
    'pending_products' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'pending'")),
    'error_products' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'error'")),
    'total_orders' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_orders")),
    'total_messages' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_messages")),
    'unread_messages' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_messages WHERE status = 'unread'")),
    'recent_logs' => TS_ML_Logger::get_recent_logs(20),
);
$stats['never_synced_products'] = max(0, $total_wc_products - $stats['tracked_products']);

// The REAL current status of each listing on Mercado Livre (active/paused/closed/inactive/
// under_review) — separate from sync_status, which only tracks whether OUR last attempt to
// push/pull data succeeded, not what Mercado Livre's own state actually is right now. A
// product can be sync_status=synced and still be paused, under review, etc. on Mercado Livre.
$ml_status_breakdown = $wpdb->get_results(
    "SELECT COALESCE(NULLIF(ml_status, ''), 'desconhecido') as ml_status, COUNT(*) as count
     FROM $table_products
     WHERE ml_item_id IS NOT NULL AND ml_item_id != ''
     GROUP BY COALESCE(NULLIF(ml_status, ''), 'desconhecido')
     ORDER BY count DESC"
);
$ml_status_labels = array(
    'active' => array('label' => '✅ ' . __('Ativo', 'ts-ml-integration'), 'color' => '#047857'),
    'paused' => array('label' => '⏸️ ' . __('Pausado', 'ts-ml-integration'), 'color' => '#92400e'),
    'closed' => array('label' => '🚫 ' . __('Finalizado', 'ts-ml-integration'), 'color' => '#9f1239'),
    'inactive' => array('label' => '🚫 ' . __('Inativo', 'ts-ml-integration'), 'color' => '#9f1239'),
    'under_review' => array('label' => '🔍 ' . __('Em Análise', 'ts-ml-integration'), 'color' => '#1d4ed8'),
    'desconhecido' => array('label' => '❔ ' . __('Nunca Consultado', 'ts-ml-integration'), 'color' => '#64748b'),
);

$default_account_id = $wpdb->get_var("SELECT id FROM $table_accounts WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1");
$products_base_url = admin_url('admin.php?page=ts-ml-products' . ($default_account_id ? '&account_id=' . intval($default_account_id) : ''));

// Get sync activity (last 7 days)
$sync_activity = $wpdb->get_results(
    "SELECT DATE(created_at) as date, sync_type, status, COUNT(*) as count
     FROM $table_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at), sync_type, status
     ORDER BY date DESC"
);
?>

<div class="wrap">
    <h1><?php esc_html_e('Relatórios - Mercado Livre', 'ts-ml-integration'); ?></h1>

    <div class="ts-ml-reports">
        <p style="color: #64748b; font-size: 13px; max-width: 700px;">
            <?php printf(
                esc_html__('Sua loja tem %d produtos publicados no WooCommerce. Os cartões abaixo são clicáveis e levam direto para a lista filtrada de produtos correspondente.', 'ts-ml-integration'),
                $total_wc_products
            ); ?>
        </p>

        <!-- Statistics Cards -->
        <div class="ts-ml-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
            <a href="<?php echo esc_url($products_base_url . '&filter_sync_status=synced'); ?>" class="ts-ml-stat-card" style="display: block; border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px; text-decoration: none; color: inherit;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Produtos Sincronizados', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #2271b1; margin-bottom: 4px;">
                    <?php echo esc_html($stats['synced_products']); ?> / <?php echo esc_html($total_wc_products); ?>
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;"><?php esc_html_e('do total de produtos da loja', 'ts-ml-integration'); ?></p>
            </a>

            <div class="ts-ml-stat-card" style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Nunca Enviados', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #64748b; margin-bottom: 4px;">
                    <?php echo esc_html($stats['never_synced_products']); ?>
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;"><?php esc_html_e('produtos que nunca foram enviados nem importados', 'ts-ml-integration'); ?></p>
            </div>

            <a href="<?php echo esc_url($products_base_url . '&filter_sync_status=pending'); ?>" class="ts-ml-stat-card" style="display: block; border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px; text-decoration: none; color: inherit;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Produtos Pendentes', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #f0b849; margin-bottom: 4px;">
                    <?php echo esc_html($stats['pending_products']); ?>
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;"><?php esc_html_e('na fila, aguardando processamento', 'ts-ml-integration'); ?></p>
            </a>

            <a href="<?php echo esc_url($products_base_url . '&filter_sync_status=error'); ?>" class="ts-ml-stat-card" style="display: block; border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px; text-decoration: none; color: inherit;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Produtos com Erro', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #d63638; margin-bottom: 4px;">
                    <?php echo esc_html($stats['error_products']); ?>
                </p>
                <p style="font-size: 11px; color: #94a3b8; margin: 0;"><?php esc_html_e('a última tentativa de sincronização falhou', 'ts-ml-integration'); ?></p>
            </a>

            <div class="ts-ml-stat-card" style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Pedidos Sincronizados', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #2271b1;">
                    <?php echo esc_html($stats['total_orders']); ?>
                </p>
            </div>

            <div class="ts-ml-stat-card" style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Mensagens', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #2271b1;">
                    <?php echo esc_html($stats['total_messages']); ?>
                </p>
                <?php if ($stats['unread_messages'] > 0) { ?>
                    <p style="color: #d63638;">
                        <?php printf(esc_html__('%d não lidas', 'ts-ml-integration'), $stats['unread_messages']); ?>
                    </p>
                <?php } ?>
            </div>
        </div>

        <!-- Real Mercado Livre Status -->
        <div class="ts-ml-status-section" style="margin-top: 30px;">
            <h2><?php esc_html_e('Status Real no Mercado Livre', 'ts-ml-integration'); ?></h2>
            <p style="color: #64748b; font-size: 13px; max-width: 700px;">
                <?php esc_html_e('Diferente de "Produtos Sincronizados" acima (que só diz se nossa última tentativa deu certo), isto reflete o status atual de cada anúncio no próprio Mercado Livre — que muda por conta deles (ex: revisão automática, pausa por falta de estoque) sem que a gente saiba, a menos que consultemos. Use "Atualizar Status" na tela de Produtos para atualizar um item específico.', 'ts-ml-integration'); ?>
            </p>
            <?php if (empty($ml_status_breakdown)) { ?>
                <p><?php esc_html_e('Nenhum produto publicado no Mercado Livre ainda.', 'ts-ml-integration'); ?></p>
            <?php } else { ?>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                    <?php foreach ($ml_status_breakdown as $row) {
                        $meta = isset($ml_status_labels[$row->ml_status]) ? $ml_status_labels[$row->ml_status] : array('label' => esc_html($row->ml_status), 'color' => '#334155');
                        $link_url = $row->ml_status === 'desconhecido'
                            ? $products_base_url
                            : $products_base_url . '&filter_ml_status=' . urlencode($row->ml_status);
                        ?>
                        <a href="<?php echo esc_url($link_url); ?>" style="display: block; border: 1px solid #e2e8f0; padding: 14px 16px; background: #f8fafc; border-radius: 8px; text-decoration: none;">
                            <span style="font-size: 12px; font-weight: 700; color: <?php echo esc_attr($meta['color']); ?>;"><?php echo esc_html($meta['label']); ?></span>
                            <p style="font-size: 24px; font-weight: bold; margin: 4px 0 0 0; color: #0f172a;"><?php echo esc_html($row->count); ?></p>
                        </a>
                    <?php } ?>
                </div>
            <?php } ?>
        </div>

        <!-- Recent Logs -->
        <div class="ts-ml-logs-section" style="margin-top: 30px;">
            <h2><?php esc_html_e('Logs Recentes', 'ts-ml-integration'); ?></h2>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Data/Hora', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Nível', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Mensagem', 'ts-ml-integration'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($stats['recent_logs'])) { ?>
                        <?php foreach ($stats['recent_logs'] as $log) { ?>
                            <tr>
                                <td><?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($log->created_at))); ?></td>
                                <td>
                                    <span class="status-<?php echo esc_attr($log->status); ?>" style="padding: 3px 8px; border-radius: 3px; font-size: 11px;">
                                        <?php echo esc_html(strtoupper($log->status)); ?>
                                    </span>
                                </td>
                                <td><?php echo esc_html($log->message); ?></td>
                            </tr>
                        <?php } ?>
                    <?php } else { ?>
                        <tr>
                            <td colspan="3"><?php esc_html_e('Nenhum log encontrado.', 'ts-ml-integration'); ?></td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>

        <!-- Sync Activity -->
        <?php if (!empty($sync_activity)) { ?>
            <div class="ts-ml-activity-section" style="margin-top: 30px;">
                <h2><?php esc_html_e('Atividade de Sincronização (Últimos 7 dias)', 'ts-ml-integration'); ?></h2>

                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Data', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Tipo', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Status', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Quantidade', 'ts-ml-integration'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($sync_activity as $activity) { ?>
                            <tr>
                                <td><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($activity->date))); ?></td>
                                <td><?php echo esc_html($activity->sync_type); ?></td>
                                <td>
                                    <span class="status-<?php echo esc_attr($activity->status); ?>">
                                        <?php echo esc_html($activity->status); ?>
                                    </span>
                                </td>
                                <td><?php echo esc_html($activity->count); ?></td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
            </div>
        <?php } ?>
    </div>
</div>
