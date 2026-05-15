<?php
/**
 * Shipping Manager
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Shipping Manager class
 */
class TS_ML_Shipping_Manager
{

    /**
     * Instance
     *
     * @var TS_ML_Shipping_Manager
     */
    private static $instance = null;

    /**
     * Get instance
     *
     * @return TS_ML_Shipping_Manager
     */
    public static function instance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct()
    {
        // Constructor
    }

    /**
     * Sync account shipping
     *
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_account_shipping($account_id)
    {
        // Implementation for shipping sync
        return true;
    }

    /**
     * Download shipping label
     *
     * @param int $order_id WooCommerce Order ID
     * @param int $account_id Account ID
     * @return array|WP_Error
     */
    public function download_shipping_label($order_id, $account_id)
    {
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('not_found', 'Pedido não encontrado');
        }

        $shipment_id = $order->get_meta('_ts_ml_shipment_id');
        if (empty($shipment_id)) {
            return new WP_Error('no_shipment', 'ID de envio não encontrado para este pedido');
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return $access_token;
        }

        // Format is usually a GET to /shipment_labels with shipment_ids
        $url = 'https://api.mercadolibre.com/shipment_labels?shipment_ids=' . $shipment_id . '&savePdf=Y';
        $response = wp_remote_request($url, array(
            'method' => 'GET',
            'headers' => array(
                'Authorization' => 'Bearer ' . $access_token,
            ),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        if ($status >= 400) {
            $data = json_decode($body, true);
            $msg = isset($data['message']) ? $data['message'] : 'Erro na API ML';
            return new WP_Error('api_error', $msg);
        }

        return $body; // Raw PDF zip or PDF buffer
    }
}
