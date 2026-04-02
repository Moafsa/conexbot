<?php

if (!defined('ABSPATH')) {
    exit;
}

class ConexAI_Agent_Writer {
    
    private $provider;

    public function __construct($provider_config) {
        $this->provider = $provider_config;
    }

    public function draft_post($topic_data) {
        
        $prompt = "Você é o Redator Chefe de um cassino online brasileiro. " .
                  "Seu papel é detalhar ao máximo os pontos seguintes: " . json_encode($topic_data['raw_data']) . " " .
                  "Instruções: " .
                  "1. O texto DEVE ter entre 1500 a 3000 palavras. " .
                  "2. Use linguagem altamente persuasiva, focada na dor do mercado brasileiro (ganhar rápido via PIX, jogos fáceis como Fortune Tiger). " .
                  "3. Crie seções com <h2> e <h3> de forma lógica e concisa. " .
                  "4. Escreva tudo em blocos de HTML amigáveis para WordPress (Gutenberg compatível - uso de <p>, <ul>, <li>). " .
                  "Não invente nada além do escopo. Seja persuasivo. Não fale de fraudes, foque no entretenimento e depósitos/saques.";

        $draft = $this->call_llm_api($prompt);
        
        return [
            'raw_content' => $draft,
            'topic_data'  => $topic_data
        ];
    }

    private function call_llm_api($prompt) {
        if (!$this->provider) return "Error: No provider";
        
        // Simulating the 3000 words generated Output
        return "<h2>A Revolução das Apostas no Brasil</h2><p>O mercado de cassinos como o 9096bets.com tem crescido...</p><h3>Por que o PIX mudou tudo?</h3><p>Saques instantâneos garantem a diversão...</p>";
    }
}
