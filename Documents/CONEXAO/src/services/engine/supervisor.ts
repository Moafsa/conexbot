import OpenAI from 'openai';
import { FunnelStage } from '@prisma/client';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const SupervisorService = {
    /**
     * Analyzes the conversation to determine the current Funnel Stage and Next Best Action.
     */
    async analyze(
        userMessage: string,
        history: { role: string, content: string }[],
        currentStage: FunnelStage
    ): Promise<{
        nextStage: FunnelStage;
        strategy: string;
        reasoning: string;
        leadScore: number;
        sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        insight: string;
    }> {

        const recentHistory = history.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');

        const prompt = `
        VOCÊ É O SUPERVISOR DE VENDAS DA INTELIGÊNCIA ARTIFICIAL.
        
        OBJETIVO: Analisar a conversa e decidir em qual etapa do FUNIL DE VENDAS o cliente está, além de qualificar o lead.
        
        ETAPAS DO FUNIL:
        1. LEAD: Cliente novo, acabou de chegar.
        2. AWARENESS: Cliente está conhecendo o produto/serviço.
        3. INTEREST: Cliente demonstrou interesse, faz perguntas específicas.
        4. CONSIDERATION: Cliente está avaliando preços, condições.
        5. DECISION: Cliente quer comprar, pede link, pix ou contrato.
        6. ACTION: Cliente já comprou (Pagamento confirmado).
        7. SUPPORT: Cliente precisa de ajuda pós-venda.
        8. CHURNED: Cliente, pediu para parar, xingou ou não quer mais.

        ESTADO ATUAL: ${currentStage}

        SUA TAREFA ADICIONAL:
        1. LEAD SCORE (0-100): Avalie o quão perto o cliente está de fechar. (0 = nenhum interesse, 100 = pronto para pagar).
        2. SENTIMENTO: O cliente está sendo educado/positivo (POSITIVE), apenas funcional (NEUTRAL) ou agressivo/negativo (NEGATIVE)?
        3. INSIGHT: Uma frase curta (estilo Slack alert) para o dono da empresa sobre este lead. Ex: "Cliente quente, interessado em prazos".

        REGRAS DE TRANSIÇÃO (IMPORTANTE):
        - Se o usuário disser "Oi", "Tudo bem", "Voltar" -> Volte para AWARENESS.
        - Se o usuário perguntar preço -> Vá para CONSIDERATION.
        - Se o usuário disser "não sei", "vou pensar", "tá caro", "será?" -> Vá para CONSIDERATION (OBJEÇÃO).
        - Se o usuário disser "quero", "fechado", "ok" -> Vá para DECISION.
        - Se o usuário pedir link, pix -> Vá para ACTION.

        MENSAGEM ATUAL DO USUÁRIO:
        "${userMessage}"

        Retorne APENAS um JSON:
        {
            "nextStage": "...",
            "strategy": "...",
            "reasoning": "...",
            "leadScore": 85,
            "sentiment": "POSITIVE",
            "insight": "..."
        }
        `;

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.2
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');
            return {
                nextStage: result.nextStage as FunnelStage || currentStage,
                strategy: result.strategy || "Responda cordialmente.",
                reasoning: result.reasoning || "Análise padrão.",
                leadScore: result.leadScore || 0,
                sentiment: result.sentiment || 'NEUTRAL',
                insight: result.insight || "Nenhum insight novo."
            };

        } catch (error) {
            console.error('[Supervisor] Analysis failed:', error);
            return {
                nextStage: currentStage,
                strategy: "Siga o fluxo normal.",
                reasoning: "Erro na análise.",
                leadScore: 0,
                sentiment: 'NEUTRAL',
                insight: "Erro ao gerar insight."
            };
        }
    },

    /**
     * Returns a specific system prompt amendment based on the stage.
     */
    getStagePrompt(stage: FunnelStage): string {
        switch (stage) {
            case 'LEAD':
            case 'AWARENESS':
                return "FOCO: QUALIFICAÇÃO (MANDATÓRIA). Não tente vender ainda. Seu objetivo é virar um 'Agente Qualificador'. Pergunte: 1. Qual a empresa dele? 2. Qual o cargo? 3. Qual o maior desafio hoje? Só avance depois de ter uma noção básica de quem é o cliente.";
            case 'INTEREST':
                return "FOCO: Apresentação de Solução. Conecte o problema do cliente ao beneficio do produto. Use 'Isso é perfeito para você porque...'";
            case 'CONSIDERATION':
                return "FOCO: QUEBRA DE OBJEÇÃO (CRÍTICO). O cliente está em dúvida. NÃO ACEITE UM 'NÃO' FÁCIL. Use gatilhos mentais: Escassez ('Vagas acabando'), Autoridade ('Maior evento do setor') ou Prova Social. Resgate o que ele disse antes para convencer.";
            case 'DECISION':
                return "FOCO: Fechamento (CLOSING). Seja direto. Envie link de pagamento ou PIX. Use gatilhos de escassez leve.";
            case 'ACTION':
                return "FOCO: Pós-venda e Onboarding. Parabenize pela compra. Explique os próximos passos.";
            case 'SUPPORT':
                return "FOCO: Resolução de Problemas. Seja extremamente calmo, empático e resolutivo. Não tente vender.";
            case 'CHURNED':
                return "FOCO: Despedida cordial. Deixe a porta aberta.";
            default:
                return "FOCO: Atendimento prestativo.";
        }
    }
};
