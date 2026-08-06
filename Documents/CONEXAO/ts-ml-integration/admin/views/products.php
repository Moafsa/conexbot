<?php
/**
 * Products page
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Handle bulk actions
if (isset($_POST['bulk_action']) && isset($_POST['product_ids']) && check_admin_referer('ts_ml_bulk_products')) {
    $action = sanitize_text_field($_POST['bulk_action']);
    $product_ids = array_map('intval', $_POST['product_ids']);
    $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;
    
    if ($account_id > 0 && !empty($product_ids)) {
        $count_success = 0;
        foreach ($product_ids as $product_id) {
            switch ($action) {
                case 'sync_woo_to_ml':
                case 'sync_to_ml':
                    TS_ML_Product_Sync::instance()->sync_product($product_id, $account_id, 'woo_to_ml');
                    $count_success++;
                    break;
                case 'sync_ml_to_woo':
                    TS_ML_Product_Sync::instance()->sync_product($product_id, $account_id, 'ml_to_woo');
                    $count_success++;
                    break;
                case 'remove_sync':
                    global $wpdb;
                    $table_products = $wpdb->prefix . 'ts_ml_products';
                    $wpdb->delete($table_products, array('product_id' => $product_id, 'account_id' => $account_id), array('%d', '%d'));
                    $count_success++;
                    break;
            }
        }
        echo '<div class="notice notice-success is-dismissible"><p>' . sprintf(esc_html__('Sincronização processada com sucesso para %d produto(s)!', 'ts-ml-integration'), $count_success) . '</p></div>';
    }
}

// Handle single product sync
if (isset($_GET['sync_product']) && isset($_GET['account_id']) && check_admin_referer('sync_product_' . $_GET['sync_product'])) {
    $product_id = intval($_GET['sync_product']);
    $account_id = intval($_GET['account_id']);
    $direction = isset($_GET['direction']) ? sanitize_text_field($_GET['direction']) : 'woo_to_ml';
    
    TS_ML_Product_Sync::instance()->sync_product($product_id, $account_id, $direction);
    echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Produto enviado para a fila de sincronização!', 'ts-ml-integration') . '</p></div>';
}

// Get accounts
global $wpdb;
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_accounts'");
$accounts = array();

if ($table_exists) {
    $all_accounts = $wpdb->get_results("SELECT * FROM $table_accounts ORDER BY created_at DESC");
    $accounts = array_filter($all_accounts, function($account) {
        return !empty($account->is_active) && $account->is_active == 1;
    });
    if (empty($accounts) && !empty($all_accounts)) {
        $accounts = $all_accounts;
    }
}

$selected_account = isset($_GET['account_id']) ? intval($_GET['account_id']) : (!empty($accounts) ? reset($accounts)->id : 0);

// Get products query
$paged = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$per_page = 20;
$offset = ($paged - 1) * $per_page;

$args = array(
    'post_type' => 'product',
    'posts_per_page' => $per_page,
    'offset' => $offset,
    'paged' => $paged,
    'post_status' => 'publish',
);

if (isset($_GET['search'])) {
    $args['s'] = sanitize_text_field($_GET['search']);
}

$filter_photo = isset($_GET['filter_photo']) ? sanitize_text_field($_GET['filter_photo']) : '';
$filter_ready = isset($_GET['filter_ready']) ? sanitize_text_field($_GET['filter_ready']) : '';
$filter_flow  = isset($_GET['filter_flow']) ? sanitize_text_field($_GET['filter_flow']) : '';

if ($filter_photo !== '' || $filter_ready !== '' || $filter_flow !== '') {
    $sql = "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'product' AND post_status = 'publish'";
    
    if ($filter_photo === 'yes') {
        $sql .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value > 0 AND meta_value != '')";
    } elseif ($filter_photo === 'no') {
        $sql .= " AND ID NOT IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value > 0 AND meta_value != '')";
    }
    
    if ($filter_ready === 'yes') {
        $sql .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value > 0 AND meta_value != '')";
        $sql .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_price' AND CAST(meta_value AS DECIMAL(10,2)) > 0)";
        $sql .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_stock_status' AND meta_value = 'instock')";
        $sql .= " AND (post_content != '' OR post_excerpt != '')";
    } elseif ($filter_ready === 'no') {
        $ready_subquery = "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'product' AND post_status = 'publish'";
        $ready_subquery .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value > 0 AND meta_value != '')";
        $ready_subquery .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_price' AND CAST(meta_value AS DECIMAL(10,2)) > 0)";
        $ready_subquery .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_stock_status' AND meta_value = 'instock')";
        $sql .= " AND ID NOT IN ($ready_subquery)";
    }

    if (!empty($filter_flow) && $selected_account > 0) {
        $table_products = $wpdb->prefix . 'ts_ml_products';
        if ($filter_flow === 'woo_to_ml') {
            $sql .= " AND ID IN (SELECT product_id FROM $table_products WHERE account_id = $selected_account AND (sync_direction = 'woo_to_ml' OR sync_direction = 'bidirectional'))";
        } elseif ($filter_flow === 'ml_to_woo') {
            $sql .= " AND ID IN (SELECT product_id FROM $table_products WHERE account_id = $selected_account AND (sync_direction = 'ml_to_woo' OR sync_direction = 'bidirectional'))";
        }
    }
    
    $filtered_ids = $wpdb->get_col($sql);
    if (!empty($filtered_ids)) {
        $args['post__in'] = $filtered_ids;
    } else {
        $args['post__in'] = array(0);
    }
}

$products_query = new WP_Query($args);
$table_products = $wpdb->prefix . 'ts_ml_products';
?>

<style>
.ts-ml-switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 20px;
}
.ts-ml-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.ts-ml-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cbd5e1;
  transition: .3s;
  border-radius: 20px;
}
.ts-ml-slider:before {
  position: absolute;
  content: "";
  height: 14px; width: 14px;
  left: 3px; bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}
input:checked + .ts-ml-slider {
  background-color: #10b981;
}
input:checked + .ts-ml-slider:before {
  transform: translateX(18px);
}
.ts-ml-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}
.ts-ml-badge-woo-to-ml {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.ts-ml-badge-ml-to-woo {
  background: #fcf4ff;
  color: #86198f;
  border: 1px solid #f5d0fe;
}
.ts-ml-badge-has-photo {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.ts-ml-badge-no-photo {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}
/* Modal Staging Queue */
.ts-ml-modal-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 99999;
  align-items: center;
  justify-content: center;
}
.ts-ml-modal-content {
  background: #ffffff;
  border-radius: 12px;
  width: 90%;
  max-width: 850px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  overflow: hidden;
}
</style>

<div class="wrap">
    <h1 style="display: flex; align-items: center; gap: 10px;">
        🛍️ <?php esc_html_e('Produtos - Mercado Livre', 'ts-ml-integration'); ?>
    </h1>
    
    <div class="ts-ml-products-page">
        <?php if (empty($accounts)) { ?>
            <div class="notice notice-warning" style="margin-top: 20px;">
                <p><?php esc_html_e('Nenhuma conta do Mercado Livre configurada.', 'ts-ml-integration'); ?> 
                   <a href="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>"><?php esc_html_e('Configurar Conta Agora', 'ts-ml-integration'); ?></a>
                </p>
            </div>
        <?php } else { ?>
            
            <!-- Barra Superior de Controle & Conta -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px 20px; margin: 20px 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <label for="account_filter" style="font-weight: 700; color: #334155; font-size: 14px;">🏢 <?php esc_html_e('Conta Ativa:', 'ts-ml-integration'); ?></label>
                    <select id="account_filter" style="height: 38px; font-weight: 600; border-radius: 6px; padding: 0 12px;" onchange="window.location.href='?page=ts-ml-products&account_id='+this.value">
                        <?php foreach ($accounts as $account) { ?>
                            <option value="<?php echo esc_attr($account->id); ?>" <?php selected($selected_account, $account->id); ?>>
                                <?php echo esc_html($account->account_name . ' (' . $account->country . ')'); ?>
                            </option>
                        <?php } ?>
                    </select>
                </div>

                <div style="display: flex; gap: 10px; align-items: center;">
                    <button type="button" id="btn-open-sync-queue" class="button button-primary button-large" style="background: #2563eb; border-color: #2563eb; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 0 18px; height: 38px;">
                        📋 <?php esc_html_e('Ver Fila & Prévia de Sincronização', 'ts-ml-integration'); ?>
                    </button>
                </div>
            </div>

            <!-- Filtros de Busca, Fotos e Fluxo -->
            <form method="get" action="" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <input type="hidden" name="page" value="ts-ml-products" />
                <input type="hidden" name="account_id" value="<?php echo esc_attr($selected_account); ?>" />
                
                <div style="flex: 1; min-width: 220px;">
                    <input type="search" name="search" value="<?php echo isset($_GET['search']) ? esc_attr($_GET['search']) : ''; ?>" style="width: 100%; height: 38px;" placeholder="<?php esc_attr_e('🔍 Buscar produto por nome...', 'ts-ml-integration'); ?>" />
                </div>
                
                <div>
                    <select name="filter_photo" style="height: 38px;">
                        <option value=""><?php esc_html_e('🖼️ Filtro de Foto: Todos', 'ts-ml-integration'); ?></option>
                        <option value="yes" <?php selected(isset($_GET['filter_photo']) && $_GET['filter_photo'] === 'yes'); ?>><?php esc_html_e('🖼️ Somente Com Foto', 'ts-ml-integration'); ?></option>
                        <option value="no" <?php selected(isset($_GET['filter_photo']) && $_GET['filter_photo'] === 'no'); ?>><?php esc_html_e('⚠️ Somente Sem Foto', 'ts-ml-integration'); ?></option>
                    </select>
                </div>

                <div>
                    <select name="filter_flow" style="height: 38px;">
                        <option value=""><?php esc_html_e('⇄ Fluxo: Todos', 'ts-ml-integration'); ?></option>
                        <option value="woo_to_ml" <?php selected(isset($_GET['filter_flow']) && $_GET['filter_flow'] === 'woo_to_ml'); ?>><?php esc_html_e('🛒 Loja ➔ 🟡 ML (Enviar)', 'ts-ml-integration'); ?></option>
                        <option value="ml_to_woo" <?php selected(isset($_GET['filter_flow']) && $_GET['filter_flow'] === 'ml_to_woo'); ?>><?php esc_html_e('🟡 ML ➔ 🛒 Loja (Importar)', 'ts-ml-integration'); ?></option>
                    </select>
                </div>

                <div>
                    <select name="filter_ready" style="height: 38px;">
                        <option value=""><?php esc_html_e('✅ Prontidão: Todos', 'ts-ml-integration'); ?></option>
                        <option value="yes" <?php selected(isset($_GET['filter_ready']) && $_GET['filter_ready'] === 'yes'); ?>><?php esc_html_e('✅ 100% Prontos para ML', 'ts-ml-integration'); ?></option>
                        <option value="no" <?php selected(isset($_GET['filter_ready']) && $_GET['filter_ready'] === 'no'); ?>><?php esc_html_e('⚠️ Incompletos para ML', 'ts-ml-integration'); ?></option>
                    </select>
                </div>

                <input type="submit" class="button button-secondary" style="height: 38px; font-weight: 600;" value="<?php esc_attr_e('Filtrar', 'ts-ml-integration'); ?>" />
                
                <?php if (isset($_GET['search']) || !empty($_GET['filter_photo']) || !empty($_GET['filter_ready']) || !empty($_GET['filter_flow'])) { ?>
                    <a href="?page=ts-ml-products&account_id=<?php echo esc_attr($selected_account); ?>" class="button" style="height: 38px; line-height: 36px;"><?php esc_html_e('Limpar Filtros', 'ts-ml-integration'); ?></a>
                <?php } ?>
            </form>
            
            <!-- Tabela Principal com Ações em Massa -->
            <form method="post" action="" id="bulk-products-form">
                <?php wp_nonce_field('ts_ml_bulk_products'); ?>
                <input type="hidden" name="account_id" value="<?php echo esc_attr($selected_account); ?>" />
                
                <div class="tablenav top" style="margin-bottom: 10px;">
                    <div class="alignleft actions bulkactions" style="display: flex; gap: 8px; align-items: center;">
                        <select name="bulk_action" id="bulk-action-selector" style="height: 32px;">
                            <option value=""><?php esc_html_e('Ações em massa...', 'ts-ml-integration'); ?></option>
                            <option value="sync_woo_to_ml"><?php esc_html_e('🛒 Enviar para o Mercado Livre (Loja ➔ ML)', 'ts-ml-integration'); ?></option>
                            <option value="sync_ml_to_woo"><?php esc_html_e('🟡 Importar do Mercado Livre (ML ➔ Loja)', 'ts-ml-integration'); ?></option>
                            <option value="remove_sync"><?php esc_html_e('🗑️ Remover da Sincronização', 'ts-ml-integration'); ?></option>
                        </select>
                        <input type="submit" class="button action" value="<?php esc_attr_e('Aplicar Ação', 'ts-ml-integration'); ?>" />
                    </div>
                </div>
                
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td class="manage-column column-cb check-column">
                                <input type="checkbox" id="cb-select-all" />
                            </td>
                            <th style="width: 70px;"><?php esc_html_e('Foto', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Produto', 'ts-ml-integration'); ?></th>
                            <th style="width: 100px;"><?php esc_html_e('Preço', 'ts-ml-integration'); ?></th>
                            <th style="width: 90px;"><?php esc_html_e('Estoque', 'ts-ml-integration'); ?></th>
                            <th style="width: 130px;"><?php esc_html_e('Fluxo / Direção', 'ts-ml-integration'); ?></th>
                            <th style="width: 120px;"><?php esc_html_e('Status ML', 'ts-ml-integration'); ?></th>
                            <th style="width: 90px;"><?php esc_html_e('Sincronizar', 'ts-ml-integration'); ?></th>
                            <th style="width: 140px;"><?php esc_html_e('Ações Rápidas', 'ts-ml-integration'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($products_query->have_posts()) { ?>
                            <?php while ($products_query->have_posts()) { 
                                $products_query->the_post();
                                $product_id = get_the_ID();
                                $product = wc_get_product($product_id);
                                $has_photo = $product->get_image_id() > 0;
                                $thumb_url = $has_photo ? wp_get_attachment_image_url($product->get_image_id(), 'thumbnail') : '';
                                $stock_qty = $product->managing_stock() ? $product->get_stock_quantity() : null;

                                $sync_data = $wpdb->get_row($wpdb->prepare(
                                    "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d",
                                    $product_id,
                                    $selected_account
                                ));

                                $direction = $sync_data ? $sync_data->sync_direction : 'woo_to_ml';
                                ?>
                                <tr data-id="<?php echo esc_attr($product_id); ?>" data-name="<?php echo esc_attr(get_the_title()); ?>" data-photo="<?php echo $has_photo ? 'yes' : 'no'; ?>" data-thumb="<?php echo esc_url($thumb_url); ?>" data-stock="<?php echo esc_attr($stock_qty === null ? '' : $stock_qty); ?>">
                                    <th scope="row" class="check-column">
                                        <input type="checkbox" name="product_ids[]" value="<?php echo esc_attr($product_id); ?>" class="product-cb" />
                                    </th>
                                    <td>
                                        <?php if ($has_photo) { ?>
                                            <img src="<?php echo esc_url($thumb_url); ?>" alt="" width="40" height="40" style="border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; display: block;" />
                                        <?php } else { ?>
                                            <span class="ts-ml-badge ts-ml-badge-no-photo">⚠️ Sem foto</span>
                                        <?php } ?>
                                    </td>
                                    <td>
                                        <strong>
                                            <a href="<?php echo esc_url(admin_url('post.php?post=' . $product_id . '&action=edit')); ?>">
                                                <?php echo esc_html(get_the_title()); ?>
                                            </a>
                                        </strong>
                                        <?php if ($sync_data && !empty($sync_data->ml_item_id)) { ?>
                                            <br>
                                            <small>
                                                <a href="https://produto.mercadolivre.com.br/<?php echo esc_attr($sync_data->ml_item_id); ?>" target="_blank">
                                                    🔗 <?php esc_html_e('Ver no Mercado Livre', 'ts-ml-integration'); ?>
                                                </a>
                                            </small>
                                        <?php } ?>
                                    </td>
                                    <td>
                                        <?php echo wc_price($product->get_price()); ?>
                                    </td>
                                    <td>
                                        <?php 
                                        if ($product->managing_stock()) {
                                            echo esc_html($product->get_stock_quantity());
                                        } else {
                                            echo esc_html__('Sem controle', 'ts-ml-integration');
                                        }
                                        ?>
                                    </td>
                                    <td>
                                        <?php if ($direction === 'ml_to_woo') { ?>
                                            <span class="ts-ml-badge ts-ml-badge-ml-to-woo">🟡 ML ➔ 🛒 Loja</span>
                                        <?php } else { ?>
                                            <span class="ts-ml-badge ts-ml-badge-woo-to-ml">🛒 Loja ➔ 🟡 ML</span>
                                        <?php } ?>
                                    </td>
                                    <td>
                                        <?php if ($sync_data) { ?>
                                            <span class="status-<?php echo esc_attr($sync_data->sync_status); ?>">
                                                <?php 
                                                $status_labels = array(
                                                    'synced' => __('Sincronizado', 'ts-ml-integration'),
                                                    'pending' => __('Pendente', 'ts-ml-integration'),
                                                    'syncing' => __('Sincronizando', 'ts-ml-integration'),
                                                    'error' => __('Erro', 'ts-ml-integration'),
                                                );
                                                echo isset($status_labels[$sync_data->sync_status]) ? $status_labels[$sync_data->sync_status] : $sync_data->sync_status;
                                                ?>
                                            </span>
                                            <?php if ($sync_data->sync_errors) { ?>
                                                <br><small style="color: #ef4444; font-size: 11px;"><?php echo esc_html($sync_data->sync_errors); ?></small>
                                            <?php } ?>
                                        <?php } else { ?>
                                            <span class="status-not-synced" style="color: #64748b; font-size: 12px;"><?php esc_html_e('Não sincronizado', 'ts-ml-integration'); ?></span>
                                        <?php } ?>
                                    </td>
                                    <td>
                                        <?php 
                                        $sync_enabled = get_post_meta($product_id, '_ts_ml_sync_enabled', true);
                                        if (empty($sync_enabled)) {
                                            $sync_enabled = 'yes';
                                        }
                                        ?>
                                        <label class="ts-ml-switch" title="<?php esc_attr_e('Ativar/desativar sincronização deste produto', 'ts-ml-integration'); ?>">
                                            <input type="checkbox" class="ts-ml-sync-toggle" data-id="<?php echo esc_attr($product_id); ?>" <?php checked($sync_enabled, 'yes'); ?>>
                                            <span class="ts-ml-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div style="display: flex; flex-direction: column; gap: 4px;">
                                            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-products&sync_product=' . $product_id . '&account_id=' . $selected_account . '&direction=woo_to_ml'), 'sync_product_' . $product_id)); ?>" class="button button-small" style="font-size: 11px;">
                                                🛒 <?php esc_html_e('Enviar p/ ML', 'ts-ml-integration'); ?>
                                            </a>
                                            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-products&sync_product=' . $product_id . '&account_id=' . $selected_account . '&direction=ml_to_woo'), 'sync_product_' . $product_id)); ?>" class="button button-small" style="font-size: 11px; background: #fcf4ff; border-color: #e9d5ff; color: #7e22ce;">
                                                🟡 <?php esc_html_e('Importar do ML', 'ts-ml-integration'); ?>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            <?php } ?>
                        <?php } else { ?>
                            <tr>
                                <td colspan="9"><?php esc_html_e('Nenhum produto encontrado com os filtros selecionados.', 'ts-ml-integration'); ?></td>
                            </tr>
                        <?php } ?>
                    </tbody>
                </table>
                
                <!-- Pagination -->
                <?php
                $total_pages = $products_query->max_num_pages;
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
                wp_reset_postdata();
                ?>
            </form>
        <?php } ?>
    </div>
</div>

<!-- MODAL DA FILA & PRÉVIA DE SINCRONIZAÇÃO -->
<div id="ts-ml-queue-modal" class="ts-ml-modal-overlay">
    <div class="ts-ml-modal-content">
        <div style="background: #0f172a; color: #ffffff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 18px; color: #ffffff; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                📋 <?php esc_html_e('Fila & Prévia de Sincronização de Produtos', 'ts-ml-integration'); ?>
            </h3>
            <button type="button" id="btn-close-queue-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
        </div>

        <div style="padding: 20px; overflow-y: auto; flex: 1;">
            <!-- Métricas da Fila -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 8px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;"><?php esc_html_e('Total na Prévia', 'ts-ml-integration'); ?></span>
                    <strong id="modal-total-count" style="font-size: 22px; color: #0f172a;">0</strong>
                </div>
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 15px; border-radius: 8px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #047857; font-weight: 700; display: block;"><?php esc_html_e('Com Foto', 'ts-ml-integration'); ?></span>
                    <strong id="modal-photo-count" style="font-size: 22px; color: #065f46;">0</strong>
                </div>
                <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 12px 15px; border-radius: 8px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #be123c; font-weight: 700; display: block;"><?php esc_html_e('Sem Foto', 'ts-ml-integration'); ?></span>
                    <strong id="modal-nophoto-count" style="font-size: 22px; color: #9f1239;">0</strong>
                </div>
            </div>

            <!-- Escolha do Fluxo da Fila -->
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <label style="font-weight: 700; font-size: 13px; color: #1e293b;"><?php esc_html_e('Escolha a Direção da Sincronização para a Fila:', 'ts-ml-integration'); ?></label>
                <select id="modal-sync-direction-selector" style="height: 38px; font-weight: 700; border-radius: 6px; padding: 0 10px;">
                    <option value="sync_woo_to_ml">🛒 Loja ➔ 🟡 Mercado Livre (Enviar / Atualizar no ML)</option>
                    <option value="sync_ml_to_woo">🟡 Mercado Livre ➔ 🛒 Loja (Importar / Atualizar no WP)</option>
                </select>
            </div>

            <!-- Tabela Prévia da Fila -->
            <table class="wp-list-table widefat fixed striped" style="margin: 0;">
                <thead>
                    <tr>
                        <th style="width: 60px;"><?php esc_html_e('Foto', 'ts-ml-integration'); ?></th>
                        <th><?php esc_html_e('Produto', 'ts-ml-integration'); ?></th>
                        <th style="width: 90px;"><?php esc_html_e('Estoque', 'ts-ml-integration'); ?></th>
                        <th style="width: 180px;"><?php esc_html_e('Fluxo Selecionado', 'ts-ml-integration'); ?></th>
                    </tr>
                </thead>
                <tbody id="modal-queue-tbody">
                    <!-- Dinâmico via JS -->
                </tbody>
            </table>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 15px 24px; display: flex; justify-content: space-between; align-items: center;">
            <button type="button" id="btn-cancel-queue-modal" class="button" style="height: 38px; padding: 0 18px;"><?php esc_html_e('Cancelar', 'ts-ml-integration'); ?></button>
            <button type="button" id="btn-confirm-execute-sync" class="button button-primary button-large" style="background: #10b981; border-color: #10b981; height: 38px; padding: 0 25px; font-weight: 700;">
                🚀 <?php esc_html_e('Confirmar e Sincronizar Fila Agora', 'ts-ml-integration'); ?>
            </button>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    $('#cb-select-all').on('change', function() {
        $('input[name="product_ids[]"]').prop('checked', this.checked);
    });

    $('.ts-ml-sync-toggle').on('change', function() {
        const checkbox = $(this);
        const productId = checkbox.data('id');
        const enabled = checkbox.is(':checked') ? 'yes' : 'no';
        
        checkbox.prop('disabled', true);
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'ts_ml_toggle_product_sync',
                product_id: productId,
                enabled: enabled,
                nonce: '<?php echo wp_create_nonce("ts_ml_products_nonce"); ?>'
            },
            success: function(response) {
                checkbox.prop('disabled', false);
                if (!response.success) {
                    alert(response.data || 'Erro ao alterar o status de sincronização.');
                    checkbox.prop('checked', !checkbox.is(':checked'));
                }
            },
            error: function() {
                checkbox.prop('disabled', false);
                alert('Erro de conexão ao alterar o status.');
                checkbox.prop('checked', !checkbox.is(':checked'));
            }
        });
    });

    // MODAL FILA DE SINCRONIZAÇÃO
    const modal = $('#ts-ml-queue-modal');
    
    $('#btn-open-sync-queue').on('click', function() {
        populateModalQueue();
        modal.css('display', 'flex');
    });

    $('#btn-close-queue-modal, #btn-cancel-queue-modal').on('click', function() {
        modal.hide();
    });

    function populateModalQueue() {
        const checkedBoxes = $('input[name="product_ids[]"]:checked');
        const rowsToProcess = checkedBoxes.length > 0 ? checkedBoxes.closest('tr') : $('tbody tr[data-id]');
        
        let totalCount = 0;
        let photoCount = 0;
        let noPhotoCount = 0;
        let tbodyHtml = '';

        const selectedFlow = $('#modal-sync-direction-selector').val();
        const flowLabel = selectedFlow === 'sync_woo_to_ml' ? '🛒 Loja ➔ 🟡 ML' : '🟡 ML ➔ 🛒 Loja';

        rowsToProcess.each(function() {
            const tr = $(this);
            const id = tr.data('id');
            const name = tr.data('name');
            const photo = tr.data('photo');
            const thumb = tr.data('thumb');
            const stock = tr.data('stock');

            if (!id) return;

            totalCount++;
            if (photo === 'yes') {
                photoCount++;
            } else {
                noPhotoCount++;
            }

            const photoCell = photo === 'yes' && thumb
                ? `<img src="${thumb}" alt="" width="36" height="36" style="border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; display: block;" />`
                : '<span class="ts-ml-badge ts-ml-badge-no-photo">⚠️</span>';

            const stockCell = (stock === '' || stock === undefined) ? '—' : stock;

            tbodyHtml += `
                <tr>
                    <td>${photoCell}</td>
                    <td><strong>${name}</strong></td>
                    <td>${stockCell}</td>
                    <td><span class="ts-ml-badge ts-ml-badge-woo-to-ml">${flowLabel}</span></td>
                </tr>
            `;
        });

        if (totalCount === 0) {
            tbodyHtml = '<tr><td colspan="4">Nenhum produto selecionado ou disponível para a fila.</td></tr>';
        }

        $('#modal-total-count').text(totalCount);
        $('#modal-photo-count').text(photoCount);
        $('#modal-nophoto-count').text(noPhotoCount);
        $('#modal-queue-tbody').html(tbodyHtml);
    }

    $('#modal-sync-direction-selector').on('change', function() {
        populateModalQueue();
    });

    $('#btn-confirm-execute-sync').on('click', function() {
        const selectedAction = $('#modal-sync-direction-selector').val();
        $('#bulk-action-selector').val(selectedAction);
        
        // If no checkboxes are explicitly checked, check all items currently listed
        if ($('input[name="product_ids[]"]:checked').length === 0) {
            $('.product-cb').prop('checked', true);
        }

        $('#bulk-products-form').submit();
    });
});
</script>
