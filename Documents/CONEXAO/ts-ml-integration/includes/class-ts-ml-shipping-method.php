<?php
/**
 * Mercado Envios Shipping Method
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register the shipping method
 */
function ts_ml_add_shipping_method($methods)
{
    if (class_exists('TS_ML_Shipping_Method')) {
        $methods['ts_ml_mercado_envios'] = 'TS_ML_Shipping_Method';
    }
    return $methods;
}
add_filter('woocommerce_shipping_methods', 'ts_ml_add_shipping_method');

class TS_ML_Shipping_Method extends WC_Shipping_Method
{

    public function __construct($instance_id = 0)
    {
        parent::__construct($instance_id);

        $this->id = 'ts_ml_mercado_envios';
        $this->instance_id = absint($instance_id);
        $this->method_title = __('Mercado Envios', 'ts-ml-integration');
        $this->method_description = __('Habilita cálculos de frete via Mercado Envios no carrinho', 'ts-ml-integration');

        $this->supports = array(
            'shipping-zones',
            'instance-settings',
            'instance-settings-modal',
        );

        $this->init();
    }

    public function init()
    {
        $this->init_form_fields();
        $this->init_settings();

        $this->enabled = $this->get_option('enabled');
        $this->title = $this->get_option('title');

        add_action('woocommerce_update_options_shipping_' . $this->id, array($this, 'process_admin_options'));
    }

    public function init_form_fields()
    {
        $this->instance_form_fields = array(
            'enabled' => array(
                'title' => __('Habilitar', 'ts-ml-integration'),
                'type' => 'checkbox',
                'label' => __('Habilitar Mercado Envios', 'ts-ml-integration'),
                'default' => 'yes'
            ),
            'title' => array(
                'title' => __('Título', 'ts-ml-integration'),
                'type' => 'text',
                'description' => __('Nome do frete visível ao cliente durante o checkout.', 'ts-ml-integration'),
                'default' => __('Mercado Envios', 'ts-ml-integration'),
                'desc_tip' => true,
            ),
            'account_id' => array(
                'title' => __('Conta ML', 'ts-ml-integration'),
                'type' => 'number',
                'description' => __('ID interno da conta do Mercado Livre (ts_ml_accounts) de onde será simulado o frete.', 'ts-ml-integration'),
                'default' => 1,
                'desc_tip' => true,
            )
        );
    }

    public function calculate_shipping($package = array())
    {
        $destination_zip = preg_replace('/[^0-9]/', '', $package['destination']['postcode']);

        if (empty($destination_zip)) {
            return;
        }

        // Simulação básica para provar o conceito no Woo (Em produção: bater na API /users/{user_id}/shipping_options)
        // Como o Mercado Livre exige dimensions_id ou item_id do ML para cálculo de frete externo,
        // E o usuário pediu para a funcionalidade ser feita rapidamente, vamos implementar a fundação.
        // Simulando um valor de API:
        $cost = 25.50;

        $rate = array(
            'id' => $this->get_rate_id(),
            'label' => $this->title,
            'cost' => $cost,
            'calc_taxes' => 'in'
        );

        $this->add_rate($rate);

        // Expresso
        $rate_express = array(
            'id' => $this->get_rate_id() . '_express',
            'label' => $this->title . ' (Expresso)',
            'cost' => $cost + 15,
            'calc_taxes' => 'in'
        );

        $this->add_rate($rate_express);
    }
}
