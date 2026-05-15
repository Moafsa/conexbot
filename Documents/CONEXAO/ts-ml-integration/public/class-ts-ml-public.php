<?php
/**
 * Public class
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Public class
 */
class TS_ML_Public {
    
    /**
     * Instance
     *
     * @var TS_ML_Public
     */
    private static $instance = null;
    
    /**
     * Get instance
     *
     * @return TS_ML_Public
     */
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Register webhook endpoint
        add_action('rest_api_init', array($this, 'register_webhook_routes'));
        
        // Legacy endpoint for compatibility
        add_action('init', array($this, 'register_legacy_webhook'));
    }
    
    /**
     * Register REST API webhook routes
     */
    public function register_webhook_routes() {
        register_rest_route('ts-ml/v1', '/webhook', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_webhook'),
            'permission_callback' => array($this, 'validate_webhook'),
        ));
    }
    
    /**
     * Register legacy webhook endpoint (for older ML apps)
     */
    public function register_legacy_webhook() {
        add_rewrite_rule('^ts-ml-webhook/?$', 'index.php?ts_ml_webhook=1', 'top');
        add_action('template_redirect', array($this, 'handle_legacy_webhook'));
    }
    
    /**
     * Handle legacy webhook
     */
    public function handle_legacy_webhook() {
        if (get_query_var('ts_ml_webhook')) {
            $this->process_webhook();
            exit;
        }
    }
    
    /**
     * Validate webhook request
     *
     * @param WP_REST_Request $request
     * @return bool
     */
    public function validate_webhook($request) {
        // Mercado Livre sends webhooks with specific headers
        // For now, we'll accept all POST requests to this endpoint
        // In production, you should validate the signature/headers from ML
        return true;
    }
    
    /**
     * Handle webhook request
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function handle_webhook($request = null) {
        // Get data from request
        if ($request instanceof WP_REST_Request) {
            $data = $request->get_json_params();
        } else {
            // Legacy endpoint
            $data = json_decode(file_get_contents('php://input'), true);
        }
        
        return $this->process_webhook($data);
    }
    
    /**
     * Process webhook data
     *
     * @param array $data Webhook data
     * @return WP_REST_Response|void
     */
    private function process_webhook($data = null) {
        if (empty($data)) {
            $data = json_decode(file_get_contents('php://input'), true);
        }
        
        if (empty($data)) {
            $response = new WP_REST_Response(array('status' => 'error', 'message' => 'No data received'));
            $response->set_status(400);
            return $response;
        }
        
        // Log webhook
        if (class_exists('TS_ML_Logger')) {
            TS_ML_Logger::instance()->log('webhook', 'Webhook recebido: ' . print_r($data, true), 'info');
        }
        
        // Process different webhook types
        $resource = isset($data['resource']) ? $data['resource'] : '';
        $topic = isset($data['topic']) ? $data['topic'] : '';
        $user_id = isset($data['user_id']) ? $data['user_id'] : '';
        
        // Handle different notification types
        switch ($topic) {
            case 'orders':
            case 'order':
                $this->handle_order_notification($data);
                break;
                
            case 'questions':
            case 'question':
                $this->handle_question_notification($data);
                break;
                
            case 'messages':
            case 'message':
                $this->handle_message_notification($data);
                break;
                
            case 'items':
            case 'item':
                $this->handle_item_notification($data);
                break;
                
            case 'payments':
            case 'payment':
                $this->handle_payment_notification($data);
                break;
                
            default:
                // Generic handler
                $this->handle_generic_notification($data);
        }
        
        $response = new WP_REST_Response(array('status' => 'success', 'message' => 'Webhook processed'));
        $response->set_status(200);
        return $response;
    }
    
    /**
     * Handle order notification
     */
    private function handle_order_notification($data) {
        if (class_exists('TS_ML_Order_Sync')) {
            $order_id = isset($data['resource']) ? str_replace('/orders/', '', $data['resource']) : null;
            if ($order_id) {
                // Find account by user_id
                global $wpdb;
                $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
                $account = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $table_accounts WHERE user_id = %s AND is_active = 1 LIMIT 1",
                    $data['user_id'] ?? ''
                ));
                
                if ($account) {
                    TS_ML_Order_Sync::instance()->sync_single_order($order_id, $account->id);
                }
            }
        }
    }
    
    /**
     * Handle question notification
     */
    private function handle_question_notification($data) {
        if (class_exists('TS_ML_Message_Handler')) {
            $question_id = isset($data['resource']) ? str_replace('/questions/', '', $data['resource']) : null;
            if ($question_id) {
                // Sync question
                global $wpdb;
                $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
                $account = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $table_accounts WHERE user_id = %s AND is_active = 1 LIMIT 1",
                    $data['user_id'] ?? ''
                ));
                
                if ($account) {
                    TS_ML_Message_Handler::instance()->sync_account_messages($account->id);
                }
            }
        }
    }
    
    /**
     * Handle message notification
     */
    private function handle_message_notification($data) {
        if (class_exists('TS_ML_Message_Handler')) {
            global $wpdb;
            $table_accounts = $wpdb->prefix . 'ts_ml_accounts';
            $account = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table_accounts WHERE user_id = %s AND is_active = 1 LIMIT 1",
                $data['user_id'] ?? ''
            ));
            
            if ($account) {
                TS_ML_Message_Handler::instance()->sync_account_messages($account->id);
            }
        }
    }
    
    /**
     * Handle item notification
     */
    private function handle_item_notification($data) {
        // Item updated on ML - sync back to WooCommerce if needed
        if (class_exists('TS_ML_Product_Sync')) {
            // Handle item updates
        }
    }
    
    /**
     * Handle payment notification
     */
    private function handle_payment_notification($data) {
        // Payment status changed - update order
        $this->handle_order_notification($data);
    }
    
    /**
     * Handle generic notification
     */
    private function handle_generic_notification($data) {
        // Log for debugging
        if (class_exists('TS_ML_Logger')) {
            TS_ML_Logger::instance()->log('webhook', 'Notificação genérica: ' . print_r($data, true), 'info');
        }
    }
    
    /**
     * Get webhook URL
     * 
     * IMPORTANTE: Mercado Livre requer que a URL use apenas letras minúsculas
     *
     * @return string
     */
    public static function get_webhook_url() {
        // Try REST API endpoint first
        if (function_exists('rest_url')) {
            $url = rest_url('ts-ml/v1/webhook');
        } else {
            // Fallback to legacy endpoint
            $url = home_url('/ts-ml-webhook/');
        }
        
        // Force HTTPS if not localhost (Mercado Livre requires HTTPS for webhooks in production)
        if (strpos($url, 'https://') === 0) {
            // Já é HTTPS, retorna como está
        } elseif (strpos($url, 'http://localhost') === 0 || strpos($url, 'http://127.0.0.1') === 0) {
            // Mantém HTTP para localhost
        } else {
            // Para produção, força HTTPS
            $url = str_replace('http://', 'https://', $url);
        }
        
        // Mercado Livre requer URLs em minúsculas
        return strtolower($url);
    }
}
