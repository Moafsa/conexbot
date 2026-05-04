<?php

if (!defined('ABSPATH')) {
    exit;
}

class Conext_Agent_Writer {
    
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
                case 'bn': return 'Bengali';
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
        if ($base === 'bn') return 'Bengali';
        
        return 'Portuguese (Brazil)'; // Default
    }

    public function draft_outline($topic_data) {
        $word_count_raw = get_option('conext_writer_word_count', '1500-3000');
        $site_context = isset($topic_data['site_context']) ? $topic_data['site_context'] : 'Um portal de nicho geral.';
        
        $language = $this->get_language_name();
        $prompt = "Missão Arquitetural: Analise a pauta [" . json_encode($topic_data['raw_data']) . "]. " .
                  "IDIOMA OBRIGATÓRIO: Você DEVE produzir este esboço em **$language**. " .
                  ($language === 'Bengali' ? "Escreva com a fluidez e vocabulário de um falante nativo, evitando traduções literais." : "") . " \n" .
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
        $tone = get_option('conext_writer_tone', 'Persuasivo');
        $site_context = isset($topic_data['site_context']) ? $topic_data['site_context'] : 'Portal Genérico';

        $language = $this->get_language_name();
        $prompt = "Missão de Redação Profunda baseada na pauta: " . json_encode($topic_data['raw_data']) . " \n\n" .
                  "IDIOMA OBRIGATÓRIO: Você DEVE escrever este post em **$language**. \n" .
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
                   "6. PALAVRAS DE TRANSIÇÃO (REGRA YOAST): Para atingir nota máxima no Yoast SEO, pelo menos 40% das suas sentenças DEVEM conter palavras de transição ricas e variadas (Ex: Portanto, Contudo, Sendo assim, Dessa forma, Como resultado, Logo, Entretanto, Consequentemente, De fato). É PROIBIDO repetir a mesma transição em frases consecutivas. É ESTRITAMENTE PROIBIDO citar anos específicos no texto (ex: 2023, 2024, 2025, 2026).\n" .
                   "7. MÉTRICA YOAST (VITAL): Escreva parágrafos ricos e profissionais (Linguagem: $tone). Para garantir a pontuação verde no Yoast, use sentenças curtas (máximo de 25 palavras por frase). No entanto, o texto de cada seção deve ser EXTREMAMENTE LONGO. Para bater a meta de palavras, você DEVE escrever pelo menos 5 a 6 parágrafos detalhados por seção e DEVE obrigatoriamente criar pelo menos um subtítulo H3 dentro de cada seção para expandir o conteúdo.\n" .
                   "8. FORMATO OBRIGATÓRIO: Use apenas tags HTML (H2, H3, P, STRONG). É PROIBIDO usar Markdown (como ### ou **).\n" .
                   "9. CRÍTICO: Todo o conteúdo e tags HTML devem estar em **$language**. " . 
                   ($language === 'Bengali' ? "IMPORTANTE: Atue como um jornalista sênior renomado de Dhaka (Bangladesh). Use vocabulário rico, coloquialismos locais apropriados e varie o ritmo do texto. REGRA CRÍTICA DE SINTAXE: NUNCA comece duas frases seguidas com pronomes como 'এই' (Este) ou 'এটি' (Isto). Alterne o início das frases começando ora por advérbios de tempo (Hoje, Frequentemente), ora pelo sujeito direto. Em Bengali, a IA tende a escrever textos curtos e com frases muito longas. Para resolver: 1) USE MUITOS PONTOS FINAIS (।) para garantir frases curtas (máximo 15 a 20 palavras por frase). 2) Seja extremamente prolixo, detalhista e gigantesco nas explicações. Escreva como um nativo (Bangladesh/West Bengal)." : "");

        return $this->call_llm_api($prompt) . "\n\n";
    }

    private function call_llm_api($prompt) {
        if (!$this->provider) return "Error: No provider";
        return Conext_API::call($prompt, $this->provider);
    }
}
