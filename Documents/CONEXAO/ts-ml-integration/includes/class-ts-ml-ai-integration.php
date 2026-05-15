<?php
/**
 * AI Integration (ChatGPT)
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * AI Integration class
 */
class TS_ML_AI_Integration {
    
    /**
     * Instance
     *
     * @var TS_ML_AI_Integration
     */
    private static $instance = null;
    
    /**
     * Get instance
     *
     * @return TS_ML_AI_Integration
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
        // Constructor
    }
    
    /**
     * Generate reply using AI
     *
     * @param string $original_message Original message
     * @param string $user_reply User reply (optional)
     * @return string
     */
    public function generate_reply($original_message, $user_reply = '') {
        // If user already replied, just return it
        if (!empty($user_reply)) {
            return $user_reply;
        }

        $api_key = get_option('ts_ml_ai_api_key');
        
        if (empty($api_key)) {
            return $original_message; // Fallback to original if no API key
        }

        $model = get_option('ts_ml_ai_model', 'gpt-3.5-turbo');
        $system_prompt = get_option('ts_ml_ai_system_prompt', 
            'Você é um assistente virtual da loja de brinquedos Toy Sport. Responda de forma educada, curta e prestativa. O foco é ajudar o cliente a comprar.'
        );

        $messages = array(
            array(
                'role' => 'system',
                'content' => $system_prompt
            ),
            array(
                'role' => 'user',
                'content' => $original_message
            )
        );

        $response = $this->call_openai_api($messages, $model, $api_key);

        if (is_wp_error($response)) {
            TS_ML_Logger::error('Erro na API OpenAI', array('error' => $response->get_error_message()));
            return $original_message;
        }

        return isset($response['choices'][0]['message']['content']) 
            ? trim($response['choices'][0]['message']['content']) 
            : $original_message;
    }

    /**
     * Call OpenAI API
     * 
     * @param array  $messages Messages array
     * @param string $model    Model name
     * @param string $api_key  API Key
     * @return array|WP_Error
     */
    private function call_openai_api($messages, $model, $api_key) {
        $url = 'https://api.openai.com/v1/chat/completions';
        
        $body = array(
            'model' => $model,
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 500
        );

        $args = array(
            'body'        => json_encode($body),
            'headers'     => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $api_key,
            ),
            'timeout'     => 30,
            'data_format' => 'body',
        );

        $response = wp_remote_post($url, $args);

        if (is_wp_error($response)) {
            return $response;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        $data = json_decode($response_body, true);

        if ($response_code !== 200) {
            $error_msg = isset($data['error']['message']) ? $data['error']['message'] : 'Erro desconhecido na OpenAI';
            return new WP_Error('openai_error', $error_msg, array('status' => $response_code));
        }

        return $data;
    }
}
