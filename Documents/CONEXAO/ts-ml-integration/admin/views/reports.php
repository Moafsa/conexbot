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

$stats = array(
    'total_products' => $wpdb->get_var("SELECT COUNT(*) FROM $table_products"),
    'synced_products' => $wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'synced'"),
    'pending_products' => $wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'pending'"),
    'error_products' => $wpdb->get_var("SELECT COUNT(*) FROM $table_products WHERE sync_status = 'error'"),
    'total_orders' => $wpdb->get_var("SELECT COUNT(*) FROM $table_orders"),
    'total_messages' => $wpdb->get_var("SELECT COUNT(*) FROM $table_messages"),
    'unread_messages' => $wpdb->get_var("SELECT COUNT(*) FROM $table_messages WHERE status = 'unread'"),
    'recent_logs' => TS_ML_Logger::get_recent_logs(20),
);

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
        <!-- Statistics Cards -->
        <div class="ts-ml-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
            <div class="ts-ml-stat-card" style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Produtos Sincronizados', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #2271b1;">
                    <?php echo esc_html($stats['synced_products']); ?> / <?php echo esc_html($stats['total_products']); ?>
                </p>
            </div>
            
            <div class="ts-ml-stat-card" style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Produtos Pendentes', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #f0b849;">
                    <?php echo esc_html($stats['pending_products']); ?>
                </p>
            </div>
            
            <div class="ts-ml-stat-card" style="border: 1px solid #ddd; padding: 20px; background: #fff; border-radius: 4px;">
                <h3 style="margin-top: 0;"><?php esc_html_e('Produtos com Erro', 'ts-ml-integration'); ?></h3>
                <p style="font-size: 32px; font-weight: bold; color: #d63638;">
                    <?php echo esc_html($stats['error_products']); ?>
                </p>
            </div>
            
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
