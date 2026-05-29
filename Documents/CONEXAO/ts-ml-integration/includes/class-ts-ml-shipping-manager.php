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
     * Sync account shipping statuses
     *
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_account_shipping($account_id)
    {
        global $wpdb;
        $table_orders = $wpdb->prefix . 'ts_ml_orders';

        // Get orders that are synced but not yet fully completed or cancelled
        // We look for WooCommerce orders that are mapped, excluding completed/cancelled ones
        $active_orders = $wpdb->get_results($wpdb->prepare(
            "SELECT o.order_id, o.ml_order_id 
             FROM $table_orders o 
             INNER JOIN {$wpdb->prefix}posts p ON o.order_id = p.ID 
             WHERE o.account_id = %d AND p.post_status NOT IN ('wc-completed', 'wc-cancelled')",
            $account_id
        ));

        if (empty($active_orders)) {
            return true;
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        $synced_count = 0;

        foreach ($active_orders as $mapped_order) {
            $order = wc_get_order($mapped_order->order_id);
            if (!$order) {
                continue;
            }

            $shipment_id = $order->get_meta('_ts_ml_shipment_id');
            if (empty($shipment_id)) {
                continue;
            }

            // Fetch shipment details from Mercado Livre
            $response = $api_handler->api_request(
                '/shipments/' . $shipment_id,
                'GET',
                array(),
                $access_token
            );

            if (is_wp_error($response) || !isset($response['status'])) {
                continue;
            }

            $ml_shipping_status = $response['status']; // e.g., ready_to_ship, shipped, delivered, cancelled
            $old_status = $order->get_meta('_ts_ml_shipping_status');

            if ($ml_shipping_status !== $old_status) {
                $order->update_meta_data('_ts_ml_shipping_status', $ml_shipping_status);
                
                // Add tracking details if available
                if (isset($response['tracking_number']) && !empty($response['tracking_number'])) {
                    $order->update_meta_data('_ts_ml_tracking_number', $response['tracking_number']);
                    $order->update_meta_data('_ts_ml_tracking_method', $response['tracking_method'] ?? 'Mercado Envios');
                }

                // Add a note to the WooCommerce order
                $note = sprintf(
                    __('Status de envio no Mercado Livre atualizado para: %s. ID de Rastreio: %s', 'ts-ml-integration'),
                    $ml_shipping_status,
                    $response['tracking_number'] ?? __('N/A', 'ts-ml-integration')
                );
                $order->add_order_note($note);

                // Map shipment status to WooCommerce order status if appropriate
                if ($ml_shipping_status === 'shipped') {
                    $order->update_status('completed', __('Pedido marcado como entregue à transportadora no Mercado Livre.', 'ts-ml-integration'));
                } elseif ($ml_shipping_status === 'delivered') {
                    $order->update_status('completed', __('Pedido entregue ao cliente final pelo Mercado Livre.', 'ts-ml-integration'));
                } elseif ($ml_shipping_status === 'cancelled') {
                    $order->update_status('cancelled', __('Envio cancelado no Mercado Livre.', 'ts-ml-integration'));
                }

                $order->save();
                $synced_count++;
            }
        }

        TS_ML_Logger::info(sprintf('Sincronização de envios finalizada. %d pedidos atualizados.', $synced_count), array('account_id' => $account_id));
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
