<?php

if (!defined('ABSPATH')) {
    exit;
}

class Conext_Agent_SEO {
    
    private $provider;

    public function __construct($provider_config) {
        $this->provider = $provider_config;
    }

    private function get_language_name() {
        $setting = get_option('conext_writer_language', 'auto');
        
        if ($setting !== 'auto') {
            switch ($setting) {
                case 'pt': return 'Portuguese (Brazil)';
                case 'es': return 'Spanish';
                case 'en': return 'English';
            }
        }

        $locale = get_locale();
        $map = [
            'pt_BR' => 'Portuguese (Brazil)',
            'pt_PT' => 'Portuguese (Portugal)',
            'es_ES' => 'Spanish (Spain)',
            'es_MX' => 'Spanish (Mexico)',
            'en_US' => 'English (US)',
            'en_GB' => 'English (UK)',
        ];
        
        if (isset($map[$locale])) return $map[$locale];
        
        $base = substr($locale, 0, 2);
        if ($base === 'es') return 'Spanish';
        if ($base === 'pt') return 'Portuguese';
        if ($base === 'en') return 'English';
        
        return 'Portuguese (Brazil)'; // Default
    }

    public function optimize($draft) {
        
        $language = $this->get_language_name();
        $prompt = "Você é um Especialista Sênior em SEO On-Page (Yoast) especializado no idioma **$language**. " .
                  "Analise o rascunho: " . json_encode($draft['raw_content']) . " " .
                  "IDIOMA OBRIGATÓRIO: Toda a sua resposta deve estar em **$language**. \n" .
                  "1. Responda APENAS num JSON estruturado contendo as chaves: \n" .
                  "'title' (Máximo 60 caracteres no idioma **$language**. A focus_keyword DEVE estar no início do título. PROIBIDO usar o nome do site/domínio), \n" .
                  "'meta_desc' (Máximo 155 caracteres no idioma **$language**. A focus_keyword DEVE aparecer obrigatoriamente neste texto com um CTA forte), \n" .
                  "'focus_keyword' (Termo exato, curto e forte que resuma o assunto em **$language**. Deve aparecer identicamente no texto analizado). \n" .
                  "Não use anos (2023, 2026) nos metadados.";

        $optimized_json = $this->call_llm_api($prompt);
        
        // Limpar possíveis blocos de código markdown que a IA costuma adicionar
        $clean_json = preg_replace('/^```json|```$/m', '', trim($optimized_json));
        $decoded = json_decode($clean_json, true);

        if (!$decoded) {
             error_log('Conext Writer SEO Error: Falha ao decodificar JSON.');
             return [
                'title' => $draft['topic_data']['raw_data']['title'] ?? 'Novo Artigo',
                'meta_desc' => 'Confira nosso novo artigo sobre tendências e novidades do setor.',
                'focus_keyword' => $draft['topic_data']['keywords'],
                'content' => $draft['raw_content']
            ];
        }

        $decoded['content'] = $draft['raw_content']; // Preservar o conteúdo massivo gerado pela esteira
        return $decoded;
    }

    private function call_llm_api($prompt) {
        if (!$this->provider) return "Error: No provider";
        return Conext_API::call($prompt, $this->provider);
    }
}
