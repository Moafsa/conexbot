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
     * @param int $product_id Product the question/message is about, if known — grounds the
     *                        reply in the real product data instead of answering blind.
     * @return string
     */
    public function generate_reply($original_message, $user_reply = '', $product_id = 0) {
        // If user already replied, just return it
        if (!empty($user_reply)) {
            return $user_reply;
        }

        $api_key = get_option('ts_ml_ai_api_key');

        if (empty($api_key)) {
            return $original_message; // Fallback to original if no API key
        }

        $model = get_option('ts_ml_ai_model', 'gpt-4o-mini');
        $site_name = get_bloginfo('name');
        $system_prompt = get_option('ts_ml_ai_system_prompt',
            sprintf('Você é um assistente virtual da loja %s. Responda de forma educada, curta e prestativa. O foco é ajudar o cliente a comprar.', $site_name)
        );

        $messages = array(
            array(
                'role' => 'system',
                'content' => $system_prompt
            ),
        );

        // Without this, the AI answers a question about a specific product with zero
        // information about which product it even is — just the store name and the raw
        // question text. Ground it in the real data instead of letting it guess/invent specs.
        $product_context = $product_id ? $this->build_product_context($product_id) : '';
        if ($product_context !== '') {
            $messages[] = array(
                'role' => 'system',
                'content' => "Dados reais do produto sobre o qual o cliente está perguntando. Use apenas essas informações para responder com precisão — não invente nem deduza nada que não esteja aqui:\n" . $product_context,
            );
        }

        $messages[] = array(
            'role' => 'user',
            'content' => $original_message
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
     * Plain-text summary of a product's real data (price, stock, description, attributes)
     * for grounding an AI reply.
     *
     * @param int $product_id
     * @return string Empty string if the product can't be found
     */
    private function build_product_context($product_id) {
        $product = wc_get_product($product_id);
        if (!$product) {
            return '';
        }

        $lines = array();
        $lines[] = 'Nome: ' . $product->get_name();
        $lines[] = 'Preço: R$ ' . number_format((float) $product->get_price(), 2, ',', '.');

        if ($product->managing_stock()) {
            $lines[] = 'Estoque: ' . intval($product->get_stock_quantity()) . ' unidade(s)';
        } else {
            $lines[] = 'Estoque: ' . ($product->is_in_stock() ? 'Em estoque' : 'Sem estoque');
        }

        $description = wp_strip_all_tags($product->get_description() ?: $product->get_short_description());
        if ($description !== '') {
            $lines[] = 'Descrição: ' . mb_substr($description, 0, 1500);
        }

        foreach ($product->get_attributes() as $attribute) {
            $label = wc_attribute_label($attribute->get_name());
            $values = $attribute->is_taxonomy()
                ? implode(', ', wc_get_product_terms($product_id, $attribute->get_name(), array('fields' => 'names')))
                : implode(', ', $attribute->get_options());
            if ($values !== '') {
                $lines[] = $label . ': ' . $values;
            }
        }

        return implode("\n", $lines);
    }

    /**
     * Call OpenAI API
     * 
     * @param array  $messages Messages array
     * @param string $model    Model name
     * @param string $api_key  API Key
     * @return array|WP_Error
     */
    public function call_openai_api($messages, $model, $api_key) {
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
