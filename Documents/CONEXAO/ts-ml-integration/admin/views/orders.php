<?php
/**
 * Orders page
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Handle manual sync
if (isset($_GET['sync_order']) && isset($_GET['account_id']) && check_admin_referer('sync_order_' . $_GET['sync_order'])) {
    $order_id = intval($_GET['sync_order']);
    $account_id = intval($_GET['account_id']);

    // Trigger sync
    TS_ML_Order_Sync::instance()->sync_account_orders($account_id);

    echo '<div class="notice notice-success"><p>' . esc_html__('Sincronização iniciada!', 'ts-ml-integration') . '</p></div>';
}

// Handle label download
if (isset($_GET['download_label']) && isset($_GET['account_id']) && check_admin_referer('download_label_' . $_GET['download_label'])) {
    $order_id = intval($_GET['download_label']);
    $account_id = intval($_GET['account_id']);

    $result = TS_ML_Shipping_Manager::instance()->download_shipping_label($order_id, $account_id);

    if (is_wp_error($result)) {
        // We defer notices to be shown after the header if it fails.
        echo '<div class="notice notice-error"><p>' . esc_html($result->get_error_message()) . '</p></div>';
    } elseif (!empty($result)) {
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="etiqueta_' . $order_id . '.pdf"');
        echo $result;
        exit;
    }
}

// Get accounts
global $wpdb;
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';

// Check if table exists first
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");
$accounts = array();

if ($table_exists) {
    // Get ALL accounts (not just active ones) - user can have accounts being configured
    $all_accounts = $wpdb->get_results("SELECT * FROM $table_accounts ORDER BY created_at DESC");

    // Filter active accounts for display
    $accounts = array_filter($all_accounts, function ($account) {
        return !empty($account->is_active) && $account->is_active == 1;
    });

    // If no active accounts but we have accounts, show them anyway (they might be in setup)
    if (empty($accounts) && !empty($all_accounts)) {
        $accounts = $all_accounts;
    }
}

// Get selected account
$selected_account = isset($_GET['account_id']) ? intval($_GET['account_id']) : (!empty($accounts) ? $accounts[0]->id : 0);

// Get filter
$status_filter = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : 'all';

// Get orders
$table_orders = $wpdb->prefix . 'ts_ml_orders';
$where = "account_id = %d";
$params = array($selected_account);

if ($status_filter !== 'all') {
    $where .= " AND sync_status = %s";
    $params[] = $status_filter;
}

$paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$per_page = 20;
$offset = ($paged - 1) * $per_page;

$total_orders = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM $table_orders WHERE $where",
    $params
));

$orders = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM $table_orders WHERE $where ORDER BY created_at DESC LIMIT %d OFFSET %d",
    array_merge($params, array($per_page, $offset))
));
?>

<div class="wrap">
    <h1><?php esc_html_e('Pedidos - Mercado Livre', 'ts-ml-integration'); ?></h1>

    <div class="ts-ml-orders-page">
        <?php if (empty($accounts)) { ?>
            <div class="notice notice-warning">
                <p><?php esc_html_e('Nenhuma conta do Mercado Livre configurada.', 'ts-ml-integration'); ?></p>
            </div>
        <?php } else { ?>

            <!-- Account Selector and Actions -->
            <div style="display: flex; gap: 20px; margin: 20px 0; align-items: center; flex-wrap: wrap;">
                <div>
                    <label for="account_filter"><strong><?php esc_html_e('Conta:', 'ts-ml-integration'); ?></strong></label>
                    <select id="account_filter"
                        onchange="window.location.href='?page=ts-ml-orders&account_id='+this.value+'&status=<?php echo esc_attr($status_filter); ?>'">
                        <?php foreach ($accounts as $account) { ?>
                            <option value="<?php echo esc_attr($account->id); ?>" <?php selected($selected_account, $account->id); ?>>
                                <?php echo esc_html($account->account_name . ' (' . $account->country . ')'); ?>
                            </option>
                        <?php } ?>
                    </select>
                </div>

                <div>
                    <label for="status_filter"><strong><?php esc_html_e('Status:', 'ts-ml-integration'); ?></strong></label>
                    <select id="status_filter"
                        onchange="window.location.href='?page=ts-ml-orders&account_id=<?php echo esc_attr($selected_account); ?>&status='+this.value">
                        <option value="all" <?php selected($status_filter, 'all'); ?>>
                            <?php esc_html_e('Todos', 'ts-ml-integration'); ?></option>
                        <option value="synced" <?php selected($status_filter, 'synced'); ?>>
                            <?php esc_html_e('Sincronizados', 'ts-ml-integration'); ?></option>
                        <option value="pending" <?php selected($status_filter, 'pending'); ?>>
                            <?php esc_html_e('Pendentes', 'ts-ml-integration'); ?></option>
                        <option value="error" <?php selected($status_filter, 'error'); ?>>
                            <?php esc_html_e('Com Erro', 'ts-ml-integration'); ?></option>
                    </select>
                </div>

                <div>
                    <a href="<?php echo esc_url(wp_nonce_url(add_query_arg(array('sync_order' => 'all', 'account_id' => $selected_account)), 'sync_order_all')); ?>"
                        class="button button-primary">
                        <?php esc_html_e('Sincronizar Pedidos', 'ts-ml-integration'); ?>
                    </a>
                </div>
            </div>

            <!-- Orders List -->
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Pedido WooCommerce', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Pedido ML', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Total', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Status', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Última Sincronização', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Ações', 'ts-ml-integration'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($orders)) { ?>
                        <?php foreach ($orders as $order_sync) {
                            $order = wc_get_order($order_sync->order_id);
                            ?>
                            <tr>
                                <td>
                                    <?php if ($order) { ?>
                                        <strong>
                                            <a
                                                href="<?php echo esc_url(admin_url('post.php?post=' . $order->get_id() . '&action=edit')); ?>">
                                                #<?php echo esc_html($order->get_order_number()); ?>
                                            </a>
                                        </strong>
                                        <br>
                                        <small><?php echo esc_html($order->get_billing_email()); ?></small>
                                    <?php } else { ?>
                                        <?php printf(esc_html__('Pedido #%d (não encontrado)', 'ts-ml-integration'), $order_sync->order_id); ?>
                                    <?php } ?>
                                </td>
                                <td>
                                    <?php if (!empty($order_sync->ml_order_id)) { ?>
                                        <a href="https://www.mercadolivre.com.br/orders/details/order/<?php echo esc_attr($order_sync->ml_order_id); ?>"
                                            target="_blank">
                                            <?php echo esc_html($order_sync->ml_order_id); ?>
                                        </a>
                                    <?php } else { ?>
                                        <span style="color: #646970;"><?php esc_html_e('N/A', 'ts-ml-integration'); ?></span>
                                    <?php } ?>
                                </td>
                                <td>
                                    <?php if ($order) { ?>
                                        <?php echo wc_price($order->get_total()); ?>
                                    <?php } else { ?>
                                        <?php esc_html_e('N/A', 'ts-ml-integration'); ?>
                                    <?php } ?>
                                </td>
                                <td>
                                    <span class="status-<?php echo esc_attr($order_sync->sync_status); ?>">
                                        <?php
                                        $status_labels = array(
                                            'synced' => __('Sincronizado', 'ts-ml-integration'),
                                            'pending' => __('Pendente', 'ts-ml-integration'),
                                            'error' => __('Erro', 'ts-ml-integration'),
                                        );
                                        echo isset($status_labels[$order_sync->sync_status]) ? $status_labels[$order_sync->sync_status] : $order_sync->sync_status;
                                        ?>
                                    </span>
                                    <?php if ($order_sync->sync_errors) { ?>
                                        <br><small
                                            style="color: red;"><?php echo esc_html(wp_trim_words($order_sync->sync_errors, 10)); ?></small>
                                    <?php } ?>
                                </td>
                                <td>
                                    <?php
                                    if ($order_sync->last_sync_at) {
                                        echo esc_html(human_time_diff(strtotime($order_sync->last_sync_at), current_time('timestamp'))) . ' ' . esc_html__('atrás', 'ts-ml-integration');
                                    } else {
                                        echo esc_html__('Nunca', 'ts-ml-integration');
                                    }
                                    ?>
                                </td>
                                <td>
                                    <?php if ($order) { ?>
                                        <a href="<?php echo esc_url(admin_url('post.php?post=' . $order->get_id() . '&action=edit')); ?>"
                                            class="button button-small">
                                            <?php esc_html_e('Ver Pedido', 'ts-ml-integration'); ?>
                                        </a>
                                    <?php } ?>
                                    <?php if ($order && $order->get_meta('_ts_ml_shipment_id')) { ?>
                                        <a href="<?php echo esc_url(wp_nonce_url(add_query_arg(array('download_label' => $order->get_id(), 'account_id' => $selected_account)), 'download_label_' . $order->get_id())); ?>"
                                            class="button button-small" target="_blank">
                                            <?php esc_html_e('Etiqueta', 'ts-ml-integration'); ?>
                                        </a>
                                    <?php } ?>
                                </td>
                            </tr>
                        <?php } ?>
                    <?php } else { ?>
                        <tr>
                            <td colspan="6"><?php esc_html_e('Nenhum pedido encontrado.', 'ts-ml-integration'); ?></td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>

            <!-- Pagination -->
            <?php
            $total_pages = ceil($total_orders / $per_page);
            if ($total_pages > 1) {
                echo '<div class="tablenav bottom">';
                echo paginate_links(array(
                    'base' => add_query_arg('paged', '%#%'),
                    'format' => '',
                    'prev_text' => __('&laquo;'),
                    'next_text' => __('&raquo;'),
                    'total' => $total_pages,
                    'current' => $paged,
                ));
                echo '</div>';
            }
            ?>
        <?php } ?>
    </div>
</div>