import prisma from '@/lib/prisma';
import { safeChatCompletion } from '@/lib/ai-provider';

export const SupervisorService = {
    /**
     * Analyzes the conversation to determine the current Funnel Stage and Next Best Action.
     */
    async analyze(
        userMessage: string,
        history: { role: string, content: string }[],
        currentStage: string,
        botId: string,
        bot: any
    ): Promise<{
        nextStage: string;
        nextStageId?: string;
        strategy: string;
        reasoning: string;
        leadScore: number;
        sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        insight: string;
        customerName: string | null;
        customerEmail: string | null;
        summary: string | null;
    }> {
        // 1. Fetch dynamic stages for this bot
        const dynamicStages = await prisma.crmStage.findMany({
            where: { botId },
            orderBy: { order: 'asc' }
        });

        const stagesList = dynamicStages.length > 0
            ? dynamicStages.map((s: any, i: number) => `${i + 1}. ${s.name}: ${s.description || 'Nenhuma descrição fornecida.'}`).join('\n        ')
            : `1. LEAD: Cliente novo.\n        2. INTEREST: Interessado.\n        3. CUSTOMER: Cliente.`;

        const historyString = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

        const prompt = `
        VOCÊ É O SUPERVISOR DE VENDAS DA INTELIGÊNCIA ARTIFICIAL.
        
        OBJETIVO: Analisar a conversa e decidir em qual etapa do CRM o cliente está, qualificar o lead, e extrair dados importantes.
        
        ESTÁGIOS CONFIGURADOS PARA ESTE BOT:
        ${stagesList}
        
        ESTADO ATUAL DO CLIENTE: ${currentStage}

        HISTÓRICO DA CONVERSA:
        ${historyString}

        SUA TAREFA:
        1. DECIDIR O PRÓXIMO ESTÁGIO: Baseado na conversa, o cliente deve avançar no funil? Use os nomes exatos fornecidos na lista de estágios.
        2. LEAD SCORE (0-100): Avalie o quão perto o cliente está de fechar (100 = pronto).
        3. SENTIMENTO: POSITIVE, NEUTRAL ou NEGATIVE.
        4. INSIGHT: Uma frase curta para o dono do bot.
        5. ESTRATÉGIA: Como o bot deve agir agora?
        6. NOME: Se o usuário já informou o nome na conversa, extraia aqui. Se não, retorne null.
        7. EMAIL: Se o usuário informou o email, extraia aqui. Se não, retorne null.
        8. RESUMO: Um resumo conciso da interação de vendas até o momento.

        Retorne APENAS um JSON estrito:
        {
            "nextStage": "NOME_DO_ESTÁGIO_ESCOLHIDO",
            "strategy": "...",
            "reasoning": "...",
            "leadScore": 85,
            "sentiment": "POSITIVE",
            "insight": "...",
            "customerName": "Nome do Cliente" ou null,
            "customerEmail": "email@cliente.com" ou null,
            "summary": "Resumo da qualificação..."
        }
        `;

        try {
            const content = await safeChatCompletion({
                bot,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.2
            });

            const result = JSON.parse(content || '{}');
            const matchedStage = dynamicStages.find((s: any) => s.name.toLowerCase() === result.nextStage?.toLowerCase());

            return {
                nextStage: (matchedStage as any)?.name || result.nextStage || currentStage,
                nextStageId: (matchedStage as any)?.id,
                strategy: result.strategy || "Responda cordialmente.",
                reasoning: result.reasoning || "Análise dinâmica.",
                leadScore: result.leadScore || 0,
                sentiment: result.sentiment || 'NEUTRAL',
                insight: result.insight || "Nenhum insight novo.",
                customerName: result.customerName || null,
                customerEmail: result.customerEmail || null,
                summary: result.summary || null
            };

        } catch (error) {
            console.error('[Supervisor] Analysis failed:', error);
            return {
                nextStage: currentStage,
                strategy: "Siga o fluxo normal.",
                reasoning: "Erro na análise.",
                leadScore: 0,
                sentiment: 'NEUTRAL',
                insight: "Erro na IA ao gerar insight.",
                customerName: null,
                customerEmail: null,
                summary: null
            };
        }
    },

    /**
     * Returns a specific system prompt amendment based on the stage name.
     */
    getStagePrompt(stageName: string): string {
        const name = (stageName || '').toUpperCase();
        if (name === 'LEAD' || name === 'AWARENESS') {
            return "FOCO: QUALIFICAÇÃO. Identifique as necessidades básicas e quem é o cliente.";
        }
        if (name === 'INTEREST' || name === 'INTERESSADO') {
            return "FOCO: Apresentação de Solução. Mostre como o produto resolve a dor dele.";
        }
        if (name === 'DECISION' || name === 'DECISÃO' || name === 'FECHAMENTO') {
            return "FOCO: FECHAMENTO. Seja direto e encoraje o pagamento/contratação.";
        }
        return `FOCO: Atendimento prestativo adequado ao estágio ${stageName}.`;
    }
};
