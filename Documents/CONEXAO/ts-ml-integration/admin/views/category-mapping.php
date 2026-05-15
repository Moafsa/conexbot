<?php
/**
 * Category Mapping View
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Ensure we're in admin context
if (!function_exists('is_admin') || !is_admin()) {
    return;
}

// Handle Form Submission
if (isset($_POST['save_mappings']) && check_admin_referer('ts_ml_save_mappings')) {
    $mappings = isset($_POST['ml_category']) ? $_POST['ml_category'] : array();
    $mapper = TS_ML_Category_Mapper::instance();

    foreach ($mappings as $wc_id => $ml_id) {
        $mapper->save_mapping(intval($wc_id), sanitize_text_field($ml_id));
    }

    echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('Mapeamentos salvos com sucesso!', 'ts-ml-integration') . '</p></div>';
}

$mapper = TS_ML_Category_Mapper::instance();
$ui_data = $mapper->get_mappings_for_ui();
?>

<div class="wrap">
    <h1>
        <?php esc_html_e('Mapeamento de Categorias', 'ts-ml-integration'); ?>
    </h1>

    <div class="notice notice-info">
        <p>
            <strong>
                <?php esc_html_e('Como funciona:', 'ts-ml-integration'); ?>
            </strong>
            <?php esc_html_e('Associe cada categoria da sua loja a uma categoria correspondente no Mercado Livre. Isso garante que seus produtos sejam listados na seção correta.', 'ts-ml-integration'); ?>
        </p>
        <p>
            <?php esc_html_e('Para encontrar o ID da categoria no Mercado Livre, você pode usar a ferramenta de previsão de categorias ou consultar a API.', 'ts-ml-integration'); ?>
            <br>
            <?php esc_html_e('Exemplo: "MLB12345"', 'ts-ml-integration'); ?>
        </p>
    </div>

    <form method="post" action="">
        <?php wp_nonce_field('ts_ml_save_mappings'); ?>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width: 300px;">
                        <?php esc_html_e('Categoria WooCommerce', 'ts-ml-integration'); ?>
                    </th>
                    <th>
                        <?php esc_html_e('ID da Categoria Mercado Livre (Ex: MLB1055)', 'ts-ml-integration'); ?>
                    </th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($ui_data)): ?>
                    <tr>
                        <td colspan="2">
                            <?php esc_html_e('Nenhuma categoria de produto encontrada no WooCommerce.', 'ts-ml-integration'); ?>
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($ui_data as $item): ?>
                        <tr>
                            <td>
                                <strong>
                                    <?php echo esc_html($item['wc_name']); ?>
                                </strong>
                                <br>
                                <small>ID:
                                    <?php echo esc_html($item['wc_id']); ?>
                                </small>
                            </td>
                            <td>
                                <input type="text" name="ml_category[<?php echo esc_attr($item['wc_id']); ?>]"
                                    value="<?php echo esc_attr($item['ml_id']); ?>" placeholder="MLB..." class="regular-text">
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>

        <p class="submit">
            <input type="submit" name="save_mappings" id="submit" class="button button-primary"
                value="<?php esc_attr_e('Salvar Mapeamentos', 'ts-ml-integration'); ?>">
        </p>
    </form>
</div>