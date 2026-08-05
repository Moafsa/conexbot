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
    
    if ($account_id > 0) {
        foreach ($product_ids as $product_id) {
            switch ($action) {
                case 'sync_to_ml':
                    TS_ML_Product_Sync::instance()->sync_product($product_id, $account_id, 'woo_to_ml');
                    break;
                case 'remove_sync':
                    global $wpdb;
                    $table_products = $wpdb->prefix . 'ts_ml_products';
                    $wpdb->delete($table_products, array('product_id' => $product_id, 'account_id' => $account_id), array('%d', '%d'));
                    break;
            }
        }
        echo '<div class="notice notice-success"><p>' . esc_html__('Ação executada com sucesso!', 'ts-ml-integration') . '</p></div>';
    }
}

// Handle single product sync
if (isset($_GET['sync_product']) && isset($_GET['account_id']) && check_admin_referer('sync_product_' . $_GET['sync_product'])) {
    $product_id = intval($_GET['sync_product']);
    $account_id = intval($_GET['account_id']);
    TS_ML_Product_Sync::instance()->sync_product($product_id, $account_id, 'woo_to_ml');
    echo '<div class="notice notice-success"><p>' . esc_html__('Produto sincronizado!', 'ts-ml-integration') . '</p></div>';
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
    $accounts = array_filter($all_accounts, function($account) {
        return !empty($account->is_active) && $account->is_active == 1;
    });
    
    // If no active accounts but we have accounts, show them anyway (they might be in setup)
    if (empty($accounts) && !empty($all_accounts)) {
        $accounts = $all_accounts;
    }
}

// Get selected account
$selected_account = isset($_GET['account_id']) ? intval($_GET['account_id']) : (!empty($accounts) ? $accounts[0]->id : 0);

// Get products
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

if ($filter_photo !== '' || $filter_ready !== '') {
    global $wpdb;
    
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
        
        $mappings = get_option('ts_ml_category_mappings', array());
        $mapped_wc_cat_ids = array();
        foreach ($mappings as $wc_cat_id => $ml_cat_id) {
            if (!empty($ml_cat_id) && $ml_cat_id !== 'MLB1000') {
                $mapped_wc_cat_ids[] = intval($wc_cat_id);
            }
        }
        
        if (!empty($mapped_wc_cat_ids)) {
            $mapped_cats_str = implode(',', $mapped_wc_cat_ids);
            $sql .= " AND ID IN (
                SELECT object_id FROM {$wpdb->term_relationships} 
                WHERE term_taxonomy_id IN (
                    SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} 
                    WHERE taxonomy = 'product_cat' AND term_id IN ($mapped_cats_str)
                )
            )";
        } else {
            $sql .= " AND 1=0";
        }
    } elseif ($filter_ready === 'no') {
        $mappings = get_option('ts_ml_category_mappings', array());
        $mapped_wc_cat_ids = array();
        foreach ($mappings as $wc_cat_id => $ml_cat_id) {
            if (!empty($ml_cat_id) && $ml_cat_id !== 'MLB1000') {
                $mapped_wc_cat_ids[] = intval($wc_cat_id);
            }
        }
        
        $ready_subquery = "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'product' AND post_status = 'publish'";
        $ready_subquery .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value > 0 AND meta_value != '')";
        $ready_subquery .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_price' AND CAST(meta_value AS DECIMAL(10,2)) > 0)";
        $ready_subquery .= " AND ID IN (SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_stock_status' AND meta_value = 'instock')";
        $ready_subquery .= " AND (post_content != '' OR post_excerpt != '')";
        
        if (!empty($mapped_wc_cat_ids)) {
            $mapped_cats_str = implode(',', $mapped_wc_cat_ids);
            $ready_subquery .= " AND ID IN (
                SELECT object_id FROM {$wpdb->term_relationships} 
                WHERE term_taxonomy_id IN (
                    SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy} 
                    WHERE taxonomy = 'product_cat' AND term_id IN ($mapped_cats_str)
                )
            )";
        } else {
            $ready_subquery .= " AND 1=0";
        }
        
        $sql .= " AND ID NOT IN ($ready_subquery)";
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
</style>

<div class="wrap">
    <h1><?php esc_html_e('Produtos - Mercado Livre', 'ts-ml-integration'); ?></h1>
    
    <div class="ts-ml-products-page">
        <?php 
        // Debug information (only show if debug mode is enabled)
        if (get_option('ts_ml_debug_mode') === 'yes') {
            echo '<div class="notice notice-info">';
            echo '<p><strong>Debug Info:</strong></p>';
            echo '<ul>';
            echo '<li>Tabela existe: ' . ($table_exists ? 'Sim' : 'Não') . '</li>';
            if ($table_exists) {
                $all_accounts_debug = $wpdb->get_results("SELECT id, account_name, is_active, country FROM $table_accounts");
                echo '<li>Total de contas na tabela: ' . count($all_accounts_debug) . '</li>';
                if (!empty($all_accounts_debug)) {
                    echo '<li>Contas encontradas:<ul>';
                    foreach ($all_accounts_debug as $acc) {
                        echo '<li>ID: ' . esc_html($acc->id) . ', Nome: ' . esc_html($acc->account_name) . ', Ativa: ' . ($acc->is_active ? 'Sim' : 'Não') . ', País: ' . esc_html($acc->country) . '</li>';
                    }
                    echo '</ul></li>';
                }
            }
            echo '<li>Contas filtradas (ativas): ' . count($accounts) . '</li>';
            echo '</ul>';
            echo '</div>';
        }
        
        if (empty($accounts)) { ?>
            <div class="notice notice-warning">
                <p><?php esc_html_e('Nenhuma conta do Mercado Livre configurada. Configure uma conta em', 'ts-ml-integration'); ?> 
                   <a href="<?php echo esc_url(admin_url('admin.php?page=ts-ml-settings')); ?>"><?php esc_html_e('Configurações', 'ts-ml-integration'); ?></a>
                </p>
                <?php if (!$table_exists) { ?>
                    <p><strong><?php esc_html_e('⚠️ A tabela de contas não existe!', 'ts-ml-integration'); ?></strong> 
                       <?php esc_html_e('Por favor, vá em Configurações e clique em "Criar Tabelas Agora".', 'ts-ml-integration'); ?>
                    </p>
                <?php } ?>
            </div>
        <?php } else { ?>
            
            <!-- Account Selector -->
            <div class="ts-ml-account-selector" style="margin: 20px 0;">
                <label for="account_filter"><strong><?php esc_html_e('Conta:', 'ts-ml-integration'); ?></strong></label>
                <select id="account_filter" onchange="window.location.href='?page=ts-ml-products&account_id='+this.value">
                    <?php foreach ($accounts as $account) { ?>
                        <option value="<?php echo esc_attr($account->id); ?>" <?php selected($selected_account, $account->id); ?>>
                            <?php echo esc_html($account->account_name . ' (' . $account->country . ')'); ?>
                        </option>
                    <?php } ?>
                </select>
            </div>
            
            <!-- Search Form -->
            <form method="get" action="" style="margin: 20px 0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <input type="hidden" name="page" value="ts-ml-products" />
                <input type="hidden" name="account_id" value="<?php echo esc_attr($selected_account); ?>" />
                <input type="search" name="search" value="<?php echo isset($_GET['search']) ? esc_attr($_GET['search']) : ''; ?>" placeholder="<?php esc_attr_e('Buscar produtos...', 'ts-ml-integration'); ?>" />
                
                <select name="filter_photo">
                    <option value=""><?php esc_html_e('Todas as fotos', 'ts-ml-integration'); ?></option>
                    <option value="yes" <?php selected(isset($_GET['filter_photo']) && $_GET['filter_photo'] === 'yes'); ?>><?php esc_html_e('Com foto', 'ts-ml-integration'); ?></option>
                    <option value="no" <?php selected(isset($_GET['filter_photo']) && $_GET['filter_photo'] === 'no'); ?>><?php esc_html_e('Sem foto', 'ts-ml-integration'); ?></option>
                </select>

                <select name="filter_ready">
                    <option value=""><?php esc_html_e('Todos os status de prontidão', 'ts-ml-integration'); ?></option>
                    <option value="yes" <?php selected(isset($_GET['filter_ready']) && $_GET['filter_ready'] === 'yes'); ?>><?php esc_html_e('100% Prontos para ML', 'ts-ml-integration'); ?></option>
                    <option value="no" <?php selected(isset($_GET['filter_ready']) && $_GET['filter_ready'] === 'no'); ?>><?php esc_html_e('Incompletos para ML', 'ts-ml-integration'); ?></option>
                </select>

                <input type="submit" class="button" value="<?php esc_attr_e('Filtrar', 'ts-ml-integration'); ?>" />
                <?php if (isset($_GET['search']) || !empty($_GET['filter_photo']) || !empty($_GET['filter_ready'])) { ?>
                    <a href="?page=ts-ml-products&account_id=<?php echo esc_attr($selected_account); ?>" class="button"><?php esc_html_e('Limpar Filtros', 'ts-ml-integration'); ?></a>
                <?php } ?>
            </form>
            
            <!-- Bulk Actions Form -->
            <form method="post" action="" id="bulk-products-form">
                <?php wp_nonce_field('ts_ml_bulk_products'); ?>
                <input type="hidden" name="account_id" value="<?php echo esc_attr($selected_account); ?>" />
                
                <div class="tablenav top">
                    <div class="alignleft actions bulkactions">
                        <select name="bulk_action">
                            <option value=""><?php esc_html_e('Ações em massa', 'ts-ml-integration'); ?></option>
                            <option value="sync_to_ml"><?php esc_html_e('Sincronizar para Mercado Livre', 'ts-ml-integration'); ?></option>
                            <option value="remove_sync"><?php esc_html_e('Remover sincronização', 'ts-ml-integration'); ?></option>
                        </select>
                        <input type="submit" class="button action" value="<?php esc_attr_e('Aplicar', 'ts-ml-integration'); ?>" />
                    </div>
                </div>
                
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td class="manage-column column-cb check-column">
                                <input type="checkbox" id="cb-select-all" />
                            </td>
                            <th><?php esc_html_e('Produto', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Preço', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Estoque', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Status ML', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Sincronização Ativa', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Última Sincronização', 'ts-ml-integration'); ?></th>
                            <th><?php esc_html_e('Ações', 'ts-ml-integration'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($products_query->have_posts()) { ?>
                            <?php while ($products_query->have_posts()) { 
                                $products_query->the_post();
                                $product = wc_get_product(get_the_ID());
                                $sync_data = $wpdb->get_row($wpdb->prepare(
                                    "SELECT * FROM $table_products WHERE product_id = %d AND account_id = %d",
                                    get_the_ID(),
                                    $selected_account
                                ));
                                ?>
                                <tr>
                                    <th scope="row" class="check-column">
                                        <input type="checkbox" name="product_ids[]" value="<?php echo esc_attr(get_the_ID()); ?>" />
                                    </th>
                                    <td>
                                        <strong>
                                            <a href="<?php echo esc_url(admin_url('post.php?post=' . get_the_ID() . '&action=edit')); ?>">
                                                <?php echo esc_html(get_the_title()); ?>
                                            </a>
                                        </strong>
                                        <?php if ($sync_data && !empty($sync_data->ml_item_id)) { ?>
                                            <br>
                                            <small>
                                                <a href="https://produto.mercadolivre.com.br/<?php echo esc_attr($sync_data->ml_item_id); ?>" target="_blank">
                                                    <?php esc_html_e('Ver no ML', 'ts-ml-integration'); ?>
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
                                                <br><small style="color: red;"><?php echo esc_html($sync_data->sync_errors); ?></small>
                                            <?php } ?>
                                        <?php } else { ?>
                                            <span class="status-not-synced"><?php esc_html_e('Não sincronizado', 'ts-ml-integration'); ?></span>
                                        <?php } ?>
                                    </td>
                                    <td>
                                        <?php 
                                        $sync_enabled = get_post_meta(get_the_ID(), '_ts_ml_sync_enabled', true);
                                        if (empty($sync_enabled)) {
                                            $sync_enabled = 'yes';
                                        }
                                        ?>
                                        <label class="ts-ml-switch" title="<?php esc_attr_e('Ativar/desativar sincronização deste produto', 'ts-ml-integration'); ?>">
                                            <input type="checkbox" class="ts-ml-sync-toggle" data-id="<?php echo esc_attr(get_the_ID()); ?>" <?php checked($sync_enabled, 'yes'); ?>>
                                            <span class="ts-ml-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <?php 
                                        if ($sync_data && $sync_data->last_sync_at) {
                                            echo esc_html(human_time_diff(strtotime($sync_data->last_sync_at), current_time('timestamp'))) . ' ' . esc_html__('atrás', 'ts-ml-integration');
                                        } else {
                                            echo esc_html__('Nunca', 'ts-ml-integration');
                                        }
                                        ?>
                                    </td>
                                    <td>
                                        <?php if (!$sync_data || $sync_data->sync_status !== 'syncing') { ?>
                                            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=ts-ml-products&sync_product=' . get_the_ID() . '&account_id=' . $selected_account), 'sync_product_' . get_the_ID())); ?>" class="button button-small">
                                                <?php esc_html_e('Sincronizar', 'ts-ml-integration'); ?>
                                            </a>
                                        <?php } else { ?>
                                            <span class="button button-small disabled"><?php esc_html_e('Sincronizando...', 'ts-ml-integration'); ?></span>
                                        <?php } ?>
                                    </td>
                                </tr>
                            <?php } ?>
                        <?php } else { ?>
                            <tr>
                                <td colspan="8"><?php esc_html_e('Nenhum produto encontrado.', 'ts-ml-integration'); ?></td>
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
});
</script>
