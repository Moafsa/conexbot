<?php
if (!defined('ABSPATH')) {
    exit;
}

class Conexbot_WooCommerce_Sync {

    public function __construct() {
        // Hooks para Produtos
        add_action('woocommerce_update_product', array($this, 'sync_product_to_conexbot'), 10, 2);
        add_action('woocommerce_new_product', array($this, 'sync_product_to_conexbot'), 10, 2);
        
        // Hooks para Pedidos
        add_action('woocommerce_order_status_changed', array($this, 'sync_order_to_conexbot'), 10, 4);
    }

    public function sync_product_to_conexbot($product_id, $product = null) {
        $token = get_option('conexbot_api_token', '');
        if (empty($token)) return; // Sai silenciosamente se a loja nao estiver conectada

        if (!$product) {
            $product = wc_get_product($product_id);
        }

        if (!$product) return;

        // Monta carga útil inteligente
        $payload = array(
            'type' => 'product',
            'data' => array(
                'id'          => $product->get_id(),
                'name'        => $product->get_name(),
                'price'       => $product->get_price(),
                'stock'       => $product->get_stock_quantity() !== null ? $product->get_stock_quantity() : 999,
                'description' => strip_tags($product->get_short_description()),
                'active'      => $product->get_status() === 'publish'
            )
        );

        $this->disparar_webhook($payload, $token);
    }

    public function sync_order_to_conexbot($order_id, $status_from, $status_to, $order) {
        $token = get_option('conexbot_api_token', '');
        if (empty($token)) return;

        $payload = array(
            'type' => 'order',
            'data' => array(
                'order_id' => $order_id,
                'total'    => $order->get_total(),
                'status'   => $status_to,
                'email'    => $order->get_billing_email()
            )
        );

        $this->disparar_webhook($payload, $token);
    }

    private function disparar_webhook($payload, $token) {
        // Disparo assíncrono para o SaaS no Next.js
        wp_remote_post(CONEXBOT_API_URL . '/sync', array(
            'method'      => 'POST',
            'timeout'     => 5, // Curto para não travar o carregamento da página do lojista
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking'    => false, // Non-blocking é o ouro para WooCommerce! 
            'headers'     => array(
                'Authorization' => 'Bearer ' . $token,
                'Content-Type'  => 'application/json'
            ),
            'body'        => json_encode($payload),
        ));
    }
}
