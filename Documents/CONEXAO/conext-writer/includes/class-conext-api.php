<?php
if (!defined('ABSPATH')) {
    exit;
}

class Conext_API {
    
    public static function call($prompt, $provider) {
        if ($provider['provider'] === 'openai') {
            return self::call_openai($prompt, $provider['key']);
        } elseif ($provider['provider'] === 'gemini') {
            return self::call_gemini($prompt, $provider['key']);
        }
        return false;
    }

    private static function call_openai($prompt, $key) {
        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', [
            'timeout' => 60,
            'headers' => [
                'Authorization' => 'Bearer ' . $key,
                'Content-Type'  => 'application/json',
            ],
            'body' => json_encode([
                'model' => 'gpt-4o',
                'messages' => [
                    ['role' => 'system', 'content' => 'Você é uma IA de ponta para análise e redação voltada a E-commerce e SEO Moderno.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.7,
            ]),
        ]);

        if (is_wp_error($response)) {
            error_log('Conext Writer OpenAI API Error: ' . $response->get_error_message());
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return isset($body['choices'][0]['message']['content']) ? $body['choices'][0]['message']['content'] : false;
    }

    private static function call_gemini($prompt, $key) {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $key;
        
        $response = wp_remote_post($url, [
            'timeout' => 60,
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]),
        ]);

        $http_code = wp_remote_retrieve_response_code($response);
        if ($http_code !== 200) {
            error_log('Conext Writer Gemini API Error: HTTP ' . $http_code . ' - ' . wp_remote_retrieve_body($response));
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($body['candidates'][0]['content']['parts'][0]['text'])) {
            return $body['candidates'][0]['content']['parts'][0]['text'];
        }

        error_log('Conext Writer Gemini API Error: Unexpected response structure - ' . json_encode($body));
        return false;
    }
    public static function generate_image($prompt, $provider) {
        if ($provider['provider'] === 'openai') {
            return self::call_dalle($prompt, $provider['key']);
        }
        return false;
    }

    private static function call_dalle($prompt, $key) {
        $response = wp_remote_post('https://api.openai.com/v1/images/generations', [
            'timeout' => 120, // Imagens demoram mais
            'headers' => [
                'Authorization' => 'Bearer ' . $key,
                'Content-Type'  => 'application/json',
            ],
            'body' => json_encode([
                'model' => 'dall-e-3',
                'prompt' => $prompt,
                'n' => 1,
                'size' => '1024x1024',
            ]),
        ]);

        if (is_wp_error($response)) {
            error_log('Conext Writer DALL-E API Error: ' . $response->get_error_message());
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return isset($body['data'][0]['url']) ? $body['data'][0]['url'] : false;
    }
}
