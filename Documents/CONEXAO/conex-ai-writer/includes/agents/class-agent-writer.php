<?php

if (!defined('ABSPATH')) {
    exit;
}

class ConexAI_Agent_Writer {
    
    private $provider;

    public function __construct($provider_config) {
        $this->provider = $provider_config;
    }

    public function draft_outline($topic_data) {
        $word_count_raw = get_option('conex_ai_word_count', '1500-3000');
        $site_context = isset($topic_data['site_context']) ? $topic_data['site_context'] : 'Um portal de nicho geral.';
        
        $prompt = "Missão Arquitetural: Analise a pauta [" . json_encode($topic_data['raw_data']) . "]. " .
                  "Este post deve atingir a meta de " . $word_count_raw . " palavras. \n" .
                  "Sua única resposta deve ser o fornecimento de um ESBOÇO (Outline) fragmentado com VÁRIOS Títulos. \n" .
                  "REGRA VITAL DE HUMANIZAÇÃO: É ESTREITAMENTE PROIBIU usar as palavras 'Introdução', 'Conclusão', 'Resumo' ou 'Considerações Finais'. " .
                  "Substitua esses títulos genéricos por Títulos de Cauda Longa que instiguem o leitor (Ex: em vez de Introdução, use 'O impacto real de [Tópico] no mercado atual'). \n" .
                  "IMPORTANTE: Se a requisição de palavras for '500-1000' gere 4 h2. Se for '1500-3000', gere 7 h2. Se for '3000-5000', gere 10 h2. " .
                  "Retorne ESTRITAMENTE um array JSON nativo. Exemplo: [\"O mistério do X\", \"Como dominar Y\", \"O futuro de Z\"]";

        $draft = $this->call_llm_api($prompt);
        $draft = preg_replace('/```json|```/', '', $draft);
        $draft = trim($draft);
        
        $outline = json_decode($draft, true);
        
        if (!is_array($outline) || empty($outline)) {
            $lines = array_filter(array_map('trim', explode("\n", $draft)));
            $outline = [];
            foreach ($lines as $line) {
                $clean_line = preg_replace('/^[\d\.\-\*\"\[\]]+\s*/', '', $line);
                if (!empty($clean_line)) {
                    $outline[] = str_replace('"', '', $clean_line);
                }
            }
        }
        
        return $outline;
    }

    public function expand_content($topic_data, $current_h2_list, $texto_anterior, $focus_keyword = '') {
        $tone = get_option('conex_ai_tone', 'Persuasivo');
        $site_context = isset($topic_data['site_context']) ? $topic_data['site_context'] : 'Portal Genérico';

        $prompt = "Missão de Redação Profunda baseada na pauta: " . json_encode($topic_data['raw_data']) . " \n\n" .
                  "PALAVRA-CHAVE FOCO (OBRIGATÓRIA): **$focus_keyword** \n\n" .
                  "Estamos escrevendo um artigo GIGANTESCO através de uma Linha de Montagem de Redatores.\n" . 
                  "----------------------\n" .
                  "TEXTO CRIADO PELOS AGENTES ANTERIORES:\n" .
                  ($texto_anterior ?: "(Você é o Agente 1, inicie o texto de forma impactante, citando a palavra-chave foco logo no primeiro parágrafo.)") . "\n" .
                  "----------------------\n\n" .
                  "SUA MISSÃO ESTRITA: \n" .
                  "1. Prossiga o texto SEM REPETIR assuntos já tratados. \n" .
                  "2. Escreva sobre os subtópicos HTML: " . implode(" e ", $current_h2_list) . ". \n" .
                  "3. REGRA DE OURO SEO: Você DEVE inserir a palavra-chave foco '**$focus_keyword**' (ou sinônimos muito próximos) pelo menos 3 a 4 vezes em cada subtópico. \n" .
                  "4. SUBTÍTULOS SEO: Você DEVE incluir a palavra-chave foco '**$focus_keyword**' em pelo menos 50% dos subtítulos (H2 ou H3) que você criar ou expandir. \n" .
                  "5. INTRODUÇÃO: Se você for o primeiro agente, a palavra-chave foco DEVE estar obrigatoriamente no primeiro parágrafo do texto. \n" .
                  "6. É PROIBIDO usar 'Além disso', 'Adicionalmente' ou citar o ano atual. \n" .
                  "7. Escreva de 4 a 5 parágrafos MUITO longos e ricos para cada título exigido. Linguagem: " . $tone . ". Formato HTML.";

        return $this->call_llm_api($prompt) . "\n\n";
    }

    private function call_llm_api($prompt) {
        if (!$this->provider) return "Error: No provider";
        return ConexAI_API::call($prompt, $this->provider);
    }
}
