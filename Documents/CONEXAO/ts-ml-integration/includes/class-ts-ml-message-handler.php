<?php
/**
 * Message Handler
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Message Handler class
 */
class TS_ML_Message_Handler
{

    /**
     * Instance
     *
     * @var TS_ML_Message_Handler
     */
    private static $instance = null;

    /**
     * Get instance
     *
     * @return TS_ML_Message_Handler
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
     * Sync account messages
     *
     * @param int $account_id Account ID
     * @return bool
     */
    public function sync_account_messages($account_id)
    {
        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        // Get messages from ML
        $messages = $this->get_ml_messages($access_token);

        foreach ($messages as $ml_message) {
            $this->import_message_from_ml($ml_message, $account_id);
        }

        return true;
    }

    /**
     * Get messages from Mercado Livre
     *
     * @param string $access_token Access token
     * @return array
     */
    private function get_ml_messages($access_token)
    {
        $api_handler = TS_ML_API_Handler::instance();

        $response = $api_handler->api_request(
            '/messages/received',
            'GET',
            array('status' => 'unread'),
            $access_token
        );

        if (is_wp_error($response)) {
            return array();
        }

        return isset($response['results']) ? $response['results'] : array();
    }

    /**
     * Import message from Mercado Livre
     *
     * @param array $ml_message ML message data
     * @param int $account_id Account ID
     * @return int|false Message ID or false
     */
    private function import_message_from_ml($ml_message, $account_id)
    {
        global $wpdb;
        $table_messages = $wpdb->prefix . 'ts_ml_messages';

        // Check if message already exists
        $existing = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_messages WHERE ml_message_id = %s AND account_id = %d",
            $ml_message['id'],
            $account_id
        ));

        if ($existing) {
            return $existing->id;
        }

        // Insert message
        $wpdb->insert(
            $table_messages,
            array(
                'account_id' => $account_id,
                'ml_message_id' => $ml_message['id'],
                'ml_question_id' => $ml_message['question_id'] ?? null,
                'product_id' => $this->get_product_id_from_message($ml_message),
                'sender_id' => $ml_message['from']['user_id'] ?? null,
                'message_text' => $ml_message['text'] ?? '',
                'message_type' => $ml_message['message_type'] ?? 'question',
                'status' => 'unread',
                'created_at' => current_time('mysql'),
            ),
            array('%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s')
        );
        $message_id = $wpdb->insert_id;

        // Auto-reply 100% automático se a IA estiver habilitada
        if (get_option('ts_ml_ai_enabled') === 'yes') {
            $this->send_reply($message_id, '');
        }

        return $message_id;
    }

    /**
     * Get product ID from message
     *
     * @param array $ml_message ML message data
     * @return int|false
     */
    private function get_product_id_from_message($ml_message)
    {
        if (isset($ml_message['resource']) && isset($ml_message['resource']['item_id'])) {
            global $wpdb;
            $table_products = $wpdb->prefix . 'ts_ml_products';

            $product_id = $wpdb->get_var($wpdb->prepare(
                "SELECT product_id FROM $table_products WHERE ml_item_id = %s LIMIT 1",
                $ml_message['resource']['item_id']
            ));

            return $product_id ? intval($product_id) : false;
        }

        return false;
    }

    /**
     * Send reply to Mercado Livre
     *
     * @param int $message_id Message ID
     * @param string $reply_text Reply text
     * @return bool
     */
    public function send_reply($message_id, $reply_text)
    {
        global $wpdb;
        $table_messages = $wpdb->prefix . 'ts_ml_messages';

        $message = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_messages WHERE id = %d",
            $message_id
        ));

        if (!$message) {
            return false;
        }

        $api_handler = TS_ML_API_Handler::instance();
        $access_token = $api_handler->get_valid_token($message->account_id);

        if (is_wp_error($access_token)) {
            return false;
        }

        // Use AI if enabled
        if (get_option('ts_ml_ai_enabled') === 'yes') {
            $ai_integration = TS_ML_AI_Integration::instance();
            $reply_text = $ai_integration->generate_reply($message->message_text, $reply_text);
        }

        // Send reply via ML API
        $response = $api_handler->api_request(
            '/messages',
            'POST',
            array(
                'from' => array('user_id' => 'me'),
                'to' => array('user_id' => $message->sender_id),
                'text' => $reply_text,
                'resource' => $message->ml_question_id ? array('question_id' => $message->ml_question_id) : null,
            ),
            $access_token
        );

        if (is_wp_error($response)) {
            return false;
        }

        // Update message status
        $wpdb->update(
            $table_messages,
            array(
                'status' => 'replied',
                'replied_at' => current_time('mysql'),
            ),
            array('id' => $message_id)
        );

        return true;
    }
}
