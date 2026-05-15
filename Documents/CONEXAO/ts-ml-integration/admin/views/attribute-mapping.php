<?php
/**
 * Attribute Mapping View
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

// Save Logic
if (isset($_POST['save_attribute_mapping']) && check_admin_referer('ts_ml_save_attribute_mapping')) {
    $mapping = isset($_POST['ts_ml_fmt_mapping']) ? $_POST['ts_ml_fmt_mapping'] : array();
    // Sanitize
    $clean_mapping = array();
    foreach ($mapping as $woo_attr => $ml_attr) {
        if (!empty($ml_attr)) {
            $clean_mapping[sanitize_text_field($woo_attr)] = sanitize_text_field($ml_attr);
        }
    }
    update_option('ts_ml_attribute_mapping', $clean_mapping);
    echo '<div class="notice notice-success is-dismissible"><p>Mapeamento salvo com sucesso!</p></div>';
}

// Get Saved Mapping
$saved_mapping = get_option('ts_ml_attribute_mapping', array());

// Get Woo Attributes
$attribute_taxonomies = wc_get_attribute_taxonomies();
?>

<div class="wrap">
    <h1>
        <?php esc_html_e('Mapeamento de Atributos', 'ts-ml-integration'); ?>
    </h1>

    <div class="notice notice-info">
        <p>
            mapeie os atributos globais do WooCommerce para os IDs de atributos do Mercado Livre.
            <br>Exemplos de IDs do ML: <code>COLOR</code> (Cor), <code>SIZE</code> (Tamanho), <code>BRAND</code>
            (Marca), <code>MODEL</code> (Modelo), <code>VOLTAGE</code> (Voltagem).
        </p>
    </div>

    <form method="post" action="">
        <?php wp_nonce_field('ts_ml_save_attribute_mapping'); ?>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Atributo WooCommerce</th>
                    <th>Slug</th>
                    <th>Atributo Mercado Livre (ID)</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($attribute_taxonomies)): ?>
                    <tr>
                        <td colspan="3">Nenhum atributo global encontrado no WooCommerce.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($attribute_taxonomies as $tax): ?>
                        <?php
                        $woo_slug = 'pa_' . $tax->attribute_name;
                        $ml_val = isset($saved_mapping[$woo_slug]) ? $saved_mapping[$woo_slug] : '';

                        // Auto-guess for UX
                        if (empty($ml_val)) {
                            if (stripos($tax->attribute_label, 'cor') !== false)
                                $ml_val = 'COLOR';
                            if (stripos($tax->attribute_label, 'tamanho') !== false)
                                $ml_val = 'SIZE';
                            if (stripos($tax->attribute_label, 'marca') !== false)
                                $ml_val = 'BRAND';
                            if (stripos($tax->attribute_label, 'modelo') !== false)
                                $ml_val = 'MODEL';
                        }
                        ?>
                        <tr>
                            <td><strong>
                                    <?php echo esc_html($tax->attribute_label); ?>
                                </strong></td>
                            <td><code><?php echo esc_html($woo_slug); ?></code></td>
                            <td>
                                <input type="text" name="ts_ml_fmt_mapping[<?php echo esc_attr($woo_slug); ?>]"
                                    value="<?php echo esc_attr($ml_val); ?>" placeholder="Ex: COLOR" />
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>

                <!-- Custom / Extra Mappings could go here -->
            </tbody>
        </table>

        <p class="submit">
            <input type="submit" name="save_attribute_mapping" class="button button-primary"
                value="Salvar Mapeamento" />
        </p>
    </form>
</div>