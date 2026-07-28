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
            🚨 REGRA DE MULTI-ENTREGAS / MÚLTIPLOS ENDEREÇOS (CRÍTICO): Se o cliente solicitou entregas divididas em mais de 1 local ou endereço (ex: "1 no Centro e 2 no Botafogo"), você DEVE verificar no histórico se os endereços completos de TODOS os locais solicitados foram devidamente coletados. Se ainda faltar o endereço de qualquer um dos locais, MANTENHA o estágio em "Escolhendo Pedido" e oriente o robô na "strategy" a solicitar o endereço do local que falta. NUNCA autorize a transição para "Pedido Confirmado" enquanto houver endereço pendente!
            🚨 REGRA DE CONFIRMAÇÃO (MANDATÓRIO): Se a última mensagem do assistente na conversa foi uma pergunta para confirmar detalhes finais, endereço ou forma de pagamento (ex: "Você vai pagar em dinheiro, certo?" ou "Posso confirmar o pedido?") e a resposta atual do usuário for afirmativa (ex: "sim", "isso", "pode", "ok", "confirmado"), você DEVE obrigatoriamente classificar como estágio "Pedido Confirmado", desde que todos os endereços solicitados tenham sido fornecidos.
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
            return "FOCO: ATENDIMENTO PÓS-PEDIDO CONFIRMADO. O pedido do cliente já foi registrado. NUNCA chame a ferramenta 'confirmar_pedido' novamente. Se o cliente enviar apenas mensagens como 'ok', 'obrigado' ou 'tá bom', responda de forma curta, natural e amigável (ex: 'Por nada! Qualquer coisa é só chamar. 😊'). NÃO repita a mensagem padrão de confirmação de pedido.";
        }
        return `FOCO: Atendimento prestativo adequado ao estágio ${stageName}.`;
    },

    /**
     * Valida pré-execução de qualquer ferramenta (Gatekeeper do Supervisor).
     * O Supervisor analisa se todos os requisitos da ferramenta foram preenchidos antes de permitir sua execução.
     */
    async validateToolExecution(
        toolName: string,
        toolArgs: any,
        history: { role: string; content: string }[],
        bot: any
    ): Promise<{ approved: boolean; reason?: string }> {
        // 1. Validação de Confirmação de Pedido (confirmar_pedido)
        if (toolName === 'confirmar_pedido') {
            const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
            const addrGiven = toolArgs.endereco_completo || '';

            // Encontra o início do pedido atual no histórico (ignorando pedidos antigos do histórico)
            let currentOrderStartIndex = 0;
            for (let i = history.length - 1; i >= 0; i--) {
                const text = (history[i].content || '').toLowerCase();
                if (history[i].role === 'user' && (text.includes('quero') || text.includes('gás') || text.includes('pedido') || text.includes('botijão'))) {
                    currentOrderStartIndex = i;
                    break;
                }
            }
            const currentHistory = history.slice(currentOrderStartIndex);
            const currentHistoryText = currentHistory.map(h => `${h.role}: ${h.content}`).join('\n');

            // Checa se o cliente pediu múltiplos endereços/locais no pedido atual
            const locationMatches = currentHistoryText.match(/(?:no|em|para o|para a)\s+([a-záàâãéèêíóòôõúç\s]{3,20})(?=\s*[,.e]|\s*\d|\s*$)/gi) || [];
            const requestedLocations = [...new Set(locationMatches.map(l => l.replace(/^(no|em|para o|para a)\s+/i, '').trim()).filter(l => l.length > 2 && !/^(gás|botijão|pedido|dinheiro|pix|cartão|dinheirpo)$/i.test(l)))];

            const sessionAddrWithNumbers = history.filter(h => 
                h.role === 'user' && 
                /\d+/.test(h.content) && 
                (/rua|avenida|r\.|av\.|bairro|km|estrada|alameda/i.test(h.content) || h.content.trim().length > 8) &&
                !/^(dinheiro|pix|cartão|sim|isso|pode|ok|nao|não|nada)$/i.test(h.content.trim())
            );

            if ((requestedLocations.length > 1 || currentHistoryText.match(/(outro no|locais diferentes|dividido|endereços diferentes)/i)) && sessionAddrWithNumbers.length < Math.max(2, requestedLocations.length) && !addrGiven.includes(';') && !addrGiven.includes('\n')) {
                const missingLoc = requestedLocations.find(loc => !sessionAddrWithNumbers.some(a => a.content.toLowerCase().includes(loc.toLowerCase())));
                const targetLocName = missingLoc ? missingLoc.toUpperCase() : 'SEGUNDO LOCAL';
                return {
                    approved: false,
                    reason: `FALTA O ENDEREÇO DA ENTREGA DO ${targetLocName}! O cliente solicitou entregas em locais diferentes, mas forneceu apenas 1 endereço até agora. Peça ao cliente o nome da rua e número para a entrega do ${targetLocName} antes de confirmar o pedido.`
                };
            }

            // Checa se o endereço fornecido tem rua e número (não é apenas bairro ou cidade)
            const cleanAddr = addrGiven.trim();
            const hasNumber = /\d+/.test(cleanAddr);
            if (!hasNumber && cleanAddr.length < 25) {
                return {
                    approved: false,
                    reason: `O endereço ("${cleanAddr}") está incompleto ou sem número. Peça o nome da rua e o número (or ponto de referência) ao cliente.`
                };
            }

            // 1.1 Validação do Endereço no Mapbox pelo Supervisor (Confere se o endereço existe na área de atendimento)
            const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
            const mapboxToken = config?.mapboxToken;

            if (mapboxToken && cleanAddr) {
                try {
                    const rawAddr = cleanAddr.split('\n')[0].replace('Endereço: ', '').trim();
                    const cityContext = bot?.address ? `, ${bot.address}` : ', Bento Gonçalves, RS, Brasil';
                    const hasCityOrState = /(bento|garibaldi|farroupilha|caxias|carlos barbosa|porto alegre|monte belo|\brs\b)/i.test(rawAddr);
                    const searchAddr = hasCityOrState ? rawAddr : `${rawAddr}${cityContext}`;

                    const proximityParam = '&proximity=-51.517,-29.170';
                    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddr)}.json?access_token=${mapboxToken}&country=BR${proximityParam}&limit=1`;
                    
                    const geocodeRes = await fetch(geocodeUrl);
                    if (geocodeRes.ok) {
                        const geocodeData = await geocodeRes.json();
                        const feature = geocodeData.features?.[0];
                        
                        if (!feature || (feature.relevance && feature.relevance < 0.45)) {
                            return {
                                approved: false,
                                reason: `O endereço "${rawAddr}" NÃO FOI ENCONTRADO no sistema de mapas (Mapbox). Peça ao cliente a confirmação exata da rua, número e bairro ou um ponto de referência.`
                            };
                        }

                        // Enriquece o endereço com a localização oficial verificada pelo Mapbox (Rua, Número, Bairro Oficial, Cidade, CEP)
                        if (feature.place_name) {
                            toolArgs.endereco_completo = feature.place_name;
                            logToFile(`[Supervisor Gatekeeper] Endereço verificado e atualizado com Mapbox: "${feature.place_name}"`);
                        }
                    }
                } catch (err: any) {
                    console.error('[Supervisor Gatekeeper] Mapbox address verification error:', err);
                }
            }
        }

        // 2. Validação de Geração de Fatura (gerar_fatura)
        if (toolName === 'gerar_fatura') {
            if (!toolArgs.cliente_nome || !toolArgs.cliente_email || !toolArgs.cliente_cpf) {
                return {
                    approved: false,
                    reason: `Faltam dados obrigatórios para gerar fatura (Nome, E-mail ou CPF). Peça os dados faltantes ao cliente.`
                };
            }
        }

        // 3. Validação de Despacho de Serviço (despachar_servico)
        if (toolName === 'despachar_servico') {
            if (!toolArgs.detalhes_servico || toolArgs.detalhes_servico.length < 10) {
                return {
                    approved: false,
                    reason: `Os detalhes do serviço a ser despachado estão incompletos. Especifique os itens e o endereço completo.`
                };
            }
        }

        return { approved: true };
    }
};
