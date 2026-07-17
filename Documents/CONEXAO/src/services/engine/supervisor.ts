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
        assignedBotId?: string | null;
        strategy: string;
        reasoning: string;
        leadScore: number;
        sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        insight: string;
        customerName: string | null;
        customerEmail: string | null;
        summary: string | null;
    }> {
        // 1. Fetch dynamic stages and available bots for this tenant
        const dynamicStages = await prisma.crmStage.findMany({
            where: { botId },
            orderBy: { order: 'asc' }
        });

        const availableBots = await prisma.bot.findMany({
            where: { 
                masterId: botId, 
                status: 'active'
            },
            select: { id: true, name: true, businessType: true }
        });

        const stagesList = dynamicStages.length > 0
            ? dynamicStages.map((s: any, i: number) => `${i + 1}. ${s.name}: ${s.description || 'Nenhuma descrição fornecida.'}`).join('\n        ')
            : `1. LEAD: Cliente novo.\n        2. INTEREST: Interessado.\n        3. CUSTOMER: Cliente.`;

        const botsList = availableBots
            .filter((b: any) => b.id !== botId)
            .map((b: any) => `- ID: ${b.id} | NOME: ${b.name} | PERFIL: ${b.businessType}`)
            .join('\n        ');

        const historyString = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

        const prompt = `
        VOCÊ É O SUPERVISOR DE VENDAS DA INTELIGÊNCIA ARTIFICIAL.
        
        OBJETIVO: Analisar a conversa e decidir em qual etapa do CRM o cliente está, qualificar o lead, extrair dados e DELEGAR para um especialista se necessário.
        
        ESTÁGIOS CONFIGURADOS PARA ESTE BOT:
        ${stagesList}

        AGENTES ESPECIALISTAS DISPONÍVEIS (SE NECESSÁRIO DELEGAR):
        ${botsList || "Nenhum outro agente disponível."}
        
        ESTADO ATUAL DO CLIENTE: ${currentStage}

        HISTÓRICO DA CONVERSA:
        ${historyString}

        SUA TAREFA:
        1. DECIDIR O PRÓXIMO ESTÁGIO: Baseado na conversa, o cliente deve avançar no funil?
           🚨 ATENÇÃO (RECOMPRA/RETORNO): Se o cliente já concluiu um pedido anterior (estágio Entregue ou Saiu para Entrega) e agora está iniciando um NOVO contato ou querendo fazer um novo pedido (ex: dizendo "quero gás", "quero 1 gas", "quero fazer um pedido", "oi", etc.), você DEVE obrigatoriamente retorná-lo para o estágio inicial de negociação correspondente (como "Escolhendo Pedido"), permitindo que o bot faça uma nova venda do início!
           🚨 REGRA DE CONFIRMAÇÃO (MANDATÓRIO): Se a última mensagem do assistente na conversa foi uma pergunta para confirmar detalhes finais, endereço ou forma de pagamento (ex: "Você vai pagar em dinheiro, certo?" ou "Posso confirmar o pedido?") e a resposta atual do usuário for afirmativa (ex: "sim", "isso", "pode", "ok", "confirmado"), você DEVE obrigatoriamente classificar como estágio "Pedido Confirmado", mesmo que a conversa pareça repetitiva no histórico devido a testes.
        2. LEAD SCORE (0-100): Avalie o quão perto o cliente está de fechar.
        3. SENTIMENTO: POSITIVE, NEUTRAL ou NEGATIVE.
        4. INSIGHT: Uma frase curta para o dono do bot.
        5. ESTRATÉGIA: Como o bot deve agir agora? 🚨 REGRA DE PREÇO: Se sugerir falar de oferta, use sempre o formato "De R$ [Original] por APENAS R$ [Promocional]".
        6. DELEGAÇÃO: Se você perceber que o cliente precisa de um especialista da lista acima, retorne o "assignedBotId" correspondente.
        7. NOME/EMAIL/RESUMO: Extraia dados do cliente se disponíveis.

        Retorne APENAS um JSON estrito:
        {
            "nextStage": "NOME_DO_ESTÁGIO_ESCOLHIDO",
            "assignedBotId": "ID_DO_BOT_ESPECIALISTA" ou null,
            "strategy": "...",
            "reasoning": "...",
            "leadScore": 1-100,
            "sentiment": "...",
            "insight": "...",
            "customerName": "...",
            "customerEmail": "...",
            "summary": "..."
        }
        `;

        try {
            const aiResult = await safeChatCompletion({
                bot,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.2
            }) as any;

            const content = typeof aiResult === 'string' ? aiResult : aiResult.content;

            const result = JSON.parse(content || '{}');
            const matchedStage = dynamicStages.find((s: any) => s.name.toLowerCase() === result.nextStage?.toLowerCase());

            return {
                nextStage: (matchedStage as any)?.name || result.nextStage || currentStage,
                nextStageId: (matchedStage as any)?.id,
                assignedBotId: result.assignedBotId || null,
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
     * Suporta estágios em português e inglês.
     */
    getStagePrompt(stageName: string): string {
        const name = (stageName || '').toUpperCase().trim();
        // Saudação e boas-vindas
        if (name === 'GREETING' || name === 'SAUDAÇÃO' || name === 'SAUDACAO' || name === 'INÍCIO') {
            return "FOCO: SAUDAÇÃO. Seja educado, amigável e receptivo. NÃO empurre vendas ou preços ainda. Apenas se coloque à disposição para ajudar.";
        }
        // Qualificação inicial
        if (name === 'LEAD' || name === 'AWARENESS' || name === 'NOVO') {
            return "FOCO: QUALIFICAÇÃO. Identifique as necessidades básicas e quem é o cliente. Pergunte sobre a empresa ou o que busca.";
        }
        // Interesse / em conversa
        if (name === 'INTEREST' || name === 'INTERESSADO' || name === 'EM ATENDIMENTO' || name === 'EM_ATENDIMENTO') {
            return "FOCO: Apresentação de Solução. Mostre como o produto resolve a dor dele. Conecte a necessidade com a oferta.";
        }
        // Apresentação / proposta
        if (name === 'APRESENTAÇÃO' || name === 'APRESENTACAO' || name === 'PROPOSAL') {
            return "FOCO: Apresentação de proposta. Destaque benefícios e valor. Responda dúvidas sobre preço e condições.";
        }
        // Negociação
        if (name === 'NEGOCIAÇÃO' || name === 'NEGOCIACAO' || name === 'NEGOTIATION') {
            return "FOCO: Negociação. Supere objeções. Ofereça alternativas (parcelamento, descontos se aplicável). Leve ao fechamento.";
        }
        // Fechamento e Confirmação de Pedidos
        if (name === 'DECISION' || name === 'DECISÃO' || name === 'FECHAMENTO' || name === 'GANHO' || name === 'CUSTOMER' || name === 'PEDIDO CONFIRMADO' || name === 'PEDIDO_CONFIRMADO' || name === 'ORDER_CONFIRMED' || name === 'CONFIRMADO') {
            return "FOCO: FECHAMENTO. O cliente confirmou o pedido. Você DEVE obrigatoriamente chamar a ferramenta \"confirmar_pedido\" para registrar o pedido no banco de dados e enviá-lo para os entregadores. Certifique-se de passar todos os parâmetros necessários (endereco_completo, forma_pagamento, bairro_entrega e itens_descricao se for pedido verbal sem carrinho). NÃO apenas responda em formato texto sem acionar a ferramenta.";
        }
        return `FOCO: Atendimento prestativo adequado ao estágio ${stageName}.`;
    }
};
