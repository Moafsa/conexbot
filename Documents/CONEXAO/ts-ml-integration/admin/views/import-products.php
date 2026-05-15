<?php
/**
 * Import Products View
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get accounts
global $wpdb;
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';
$accounts = $wpdb->get_results("SELECT * FROM $table_accounts WHERE is_active = 1");

$current_account_id = isset($_GET['account_id']) ? intval($_GET['account_id']) : (isset($accounts[0]) ? $accounts[0]->id : 0);
?>

<div class="wrap">
    <h1><?php esc_html_e('Importar Produtos do Mercado Livre', 'ts-ml-integration'); ?></h1>

    <?php if (empty($accounts)) : ?>
        <div class="notice notice-error">
            <p><?php esc_html_e('Nenhuma conta conectada. Por favor, conecte uma conta nas Configurações.', 'ts-ml-integration'); ?></p>
        </div>
    <?php else : ?>

        <!-- Account Selector & Search -->
        <div class="tablenav top">
            <div class="alignleft actions">
                <label for="filter-by-account"><?php esc_html_e('Conta p/ API:', 'ts-ml-integration'); ?></label>
                <select name="account_id" id="filter-by-account" style="max-width: 150px;">
                    <?php foreach ($accounts as $account) : ?>
                        <option value="<?php echo esc_attr($account->id); ?>" <?php selected($current_account_id, $account->id); ?>>
                            <?php echo esc_html($account->account_name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <select id="search-type" name="search_type" style="margin-left: 10px;">
                    <option value="account"><?php esc_html_e('Meus Anúncios', 'ts-ml-integration'); ?></option>
                    <option value="global"><?php esc_html_e('Todo o Mercado Livre', 'ts-ml-integration'); ?></option>
                </select>

                <input type="text" id="search-query" placeholder="<?php esc_attr_e('Palavra-chave, ID ou Link do ML...', 'ts-ml-integration'); ?>" style="width: 250px; margin-left: 10px;">
                
                <button type="button" id="load-products" class="button action"><?php esc_html_e('Buscar Produtos', 'ts-ml-integration'); ?></button>
            </div>
        </div>

        <!-- Products Table -->
        <table class="wp-list-table widefat striped ts-ml-import-table">
            <thead>
                <tr>
                    <th scope="col" id="cb" class="manage-column column-cb check-column">
                        <label class="screen-reader-text" for="cb-select-all-1"><?php esc_html_e('Selecionar todos', 'ts-ml-integration'); ?></label>
                        <input id="cb-select-all-1" type="checkbox">
                    </th>
                    <th scope="col" class="manage-column column-thumb"><span class="wc-image tips"><?php esc_html_e('Imagem', 'ts-ml-integration'); ?></span></th>
                    <th scope="col" class="manage-column column-primary"><?php esc_html_e('Título no Mercado Livre', 'ts-ml-integration'); ?></th>
                    <th scope="col" class="manage-column"><?php esc_html_e('SKU / ID', 'ts-ml-integration'); ?></th>
                    <th scope="col" class="manage-column"><?php esc_html_e('Preço', 'ts-ml-integration'); ?></th>
                    <th scope="col" class="manage-column"><?php esc_html_e('Status ML', 'ts-ml-integration'); ?></th>
                    <th scope="col" class="manage-column"><?php esc_html_e('Status Woo', 'ts-ml-integration'); ?></th>
                </tr>
            </thead>
            <tbody id="ts-ml-import-list">
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        <?php esc_html_e('Selecione uma conta e clique em Carregar Produtos.', 'ts-ml-integration'); ?>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Actions -->
        <div class="tablenav bottom">
            <div class="alignleft actions">
                <button type="button" id="import-selected" class="button button-primary" disabled><?php esc_html_e('Importar Selecionados', 'ts-ml-integration'); ?></button>
                <span class="spinner" id="import-spinner" style="float: none; margin: 0 10px;"></span>
                <span id="import-status"></span>
            </div>
            <div class="tablenav-pages">
                <span class="pagination-links">
                    <button type="button" class="button" id="prev-page" disabled>&laquo;</button>
                    <span class="paging-input">
                        <span class="current-page" id="current-page">1</span>
                    </span>
                    <button type="button" class="button" id="next-page" disabled>&raquo;</button>
                </span>
            </div>
        </div>

    <?php endif; ?>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    let currentPage = 0;
    let limit = 20;

    // Load Products
    function loadProducts(page = 0) {
        let accountId = $('#filter-by-account').val();
        $('#ts-ml-import-list').html('<tr><td colspan="7" style="text-align: center;">Carregando...</td></tr>');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'ts_ml_fetch_items',
                account_id: accountId,
                search_type: $('#search-type').val(),
                search_query: $('#search-query').val(),
                offset: page * limit,
                limit: limit,
                nonce: '<?php echo wp_create_nonce('ts_ml_import_nonce'); ?>'
            },
            success: function(response) {
                if(response.success) {
                    renderTable(response.data.results);
                    currentPage = page;
                    updatePagination(response.data.paging);
                } else {
                    $('#ts-ml-import-list').html('<tr><td colspan="7" style="text-align: center; color: red;">' + response.data + '</td></tr>');
                }
            },
            error: function() {
                $('#ts-ml-import-list').html('<tr><td colspan="7" style="text-align: center; color: red;">Erro na requisição.</td></tr>');
            }
        });
    }

    $('#load-products').on('click', function() {
        loadProducts(0);
    });

    $('#prev-page').on('click', function() {
        if(currentPage > 0) loadProducts(currentPage - 1);
    });

    $('#next-page').on('click', function() {
        loadProducts(currentPage + 1);
    });

    // Render Table
    function renderTable(items) {
        let html = '';
        if(items.length === 0) {
            html = '<tr><td colspan="7" style="text-align: center;">Nenhum produto encontrado.</td></tr>';
        } else {
            items.forEach(function(item) {
                let thumb = item.thumbnail ? `<img src="${item.thumbnail}" width="40" height="40" style="object-fit: cover;">` : '';
                let price = item.price ? Number(item.price) : 0;
                let currency = item.currency_id ? item.currency_id : 'BRL';
                html += `
                    <tr>
                        <th scope="row" class="check-column"><input type="checkbox" name="import_item[]" value="${item.id}"></th>
                        <td class="column-thumb">${thumb}</td>
                        <td class="column-primary"><strong>${item.title}</strong></td>
                        <td>${item.id}<br><span style="color: #666; font-size: small;">SKU: ${item.seller_custom_field || '-'}</span></td>
                        <td>${price.toLocaleString('pt-BR', {style: 'currency', currency: currency})}</td>
                        <td>${item.status}</td>
                        <td>${item.woo_status || '<span style="color: #999;">Não Importado</span>'}</td>
                    </tr>
                `;
            });
        }
        $('#ts-ml-import-list').html(html);
        $('#import-selected').prop('disabled', false);
    }

    function updatePagination(paging) {
        $('#current-page').text((paging.offset / paging.limit) + 1);
        $('#prev-page').prop('disabled', paging.offset === 0);
        $('#next-page').prop('disabled', (paging.offset + paging.limit) >= paging.total);
    }

    // Select All
    $('#cb-select-all-1').on('click', function() {
        $('input[name="import_item[]"]').prop('checked', this.checked);
    });

    // Import Selected logic will go here
    $('#import-selected').on('click', function() {
        let selected = [];
        $('input[name="import_item[]"]:checked').each(function() {
            selected.push($(this).val());
        });

        if(selected.length === 0) {
            alert('Selecione pelo menos um produto.');
            return;
        }

        $('#import-spinner').addClass('is-active');
        $('#import-selected').prop('disabled', true);
        $('#import-status').text('Importando 0/' + selected.length + '...');

        processImportQueue(selected, 0);
    });

    function processImportQueue(ids, index) {
        if(index >= ids.length) {
            $('#import-spinner').removeClass('is-active');
            $('#import-selected').prop('disabled', false);
            $('#import-status').text('Importação concluída!');
            loadProducts(currentPage); // Refresh status
            return;
        }

        let mlId = ids[index];
        let accountId = $('#filter-by-account').val();

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'ts_ml_import_single_item',
                ml_id: mlId,
                account_id: accountId,
                nonce: '<?php echo wp_create_nonce('ts_ml_import_nonce'); ?>'
            },
            success: function(response) {
                $('#import-status').text('Importando ' + (index + 1) + '/' + ids.length + '...');
                processImportQueue(ids, index + 1);
            },
            error: function() {
                processImportQueue(ids, index + 1); // Skip on error
            }
        });
    }
});
</script>
