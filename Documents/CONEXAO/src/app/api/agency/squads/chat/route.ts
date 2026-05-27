export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeChatCompletion } from '@/lib/ai-provider';
import { ALL_SQUADS } from '@/lib/agent-squads';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // 1. Obter agência do usuário logado
        const agency = await prisma.agency.findUnique({
            where: { tenantId: session.user.id },
            include: { tenant: true }
        });
        if (!agency) {
            return NextResponse.json({ error: 'Apenas agências de marketing podem consultar os Squads.' }, { status: 403 });
        }

        // 2. Extrair dados do corpo da requisição
        const body = await req.json();
        const { agentId, clientId, messages } = body;

        if (!agentId || !clientId || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Campos agentId, clientId e messages são obrigatórios.' }, { status: 400 });
        }

        // 3. Buscar o agente (do banco de dados primeiro, fallback para o arquivo fixo)
        let agent = await prisma.agentTemplate.findFirst({
            where: { 
                id: agentId,
                OR: [
                    { agencyId: null },
                    { agencyId: agency.id }
                ],
                isActive: true
            }
        });

        if (!agent) {
            // Fallback: buscar nos squads fixos
            const flatAgents = ALL_SQUADS.flatMap(s => s.agents);
            const fixedAgent = flatAgents.find(a => a.id === agentId);
            if (fixedAgent) {
                agent = {
                    id: fixedAgent.id,
                    squadId: fixedAgent.squadId,
                    squadName: ALL_SQUADS.find(s => s.id === fixedAgent.squadId)?.name || 'Squad',
                    name: fixedAgent.name,
                    role: fixedAgent.role,
                    emoji: fixedAgent.emoji,
                    systemPrompt: fixedAgent.systemPrompt,
                    tasks: fixedAgent.tasks as any,
                    llmProvider: fixedAgent.llmProvider,
                    llmModel: fixedAgent.llmModel,
                    isCustom: false,
                    agencyId: null,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
        }

        if (!agent) {
            return NextResponse.json({ error: 'Agente especialista não encontrado.' }, { status: 404 });
        }

        // 4. Buscar o cliente (Tenant) garantindo vínculo com esta agência
        const client = await prisma.tenant.findFirst({
            where: {
                id: clientId,
                agencyId: agency.id
            },
            include: {
                bots: {
                    take: 1
                },
                clientAudits: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: 'Cliente não encontrado ou não pertence à sua agência.' }, { status: 404 });
        }

        const botInfo = client.bots?.[0];
        const lastAudit = client.clientAudits?.[0];

        // 5. Enriquecer o System Prompt com o contexto do cliente
        let clientContext = `\n---
CONTEXTO DO CLIENTE (EMPRESA ATENDIDA):
Nome da Empresa: ${client.name || 'Não informado'}
Nicho/Segmento: ${botInfo?.niche || 'Generico'}
Descrição do Negócio: ${botInfo?.description || 'Não fornecido'}
Site Oficial: ${botInfo?.websiteUrl || 'Não informado'}
Endereço Físico: ${botInfo?.address || 'Não informado'}
Horário de Funcionamento: ${botInfo?.hours || 'Não informado'}
Produtos e Serviços Principais: ${botInfo?.productsServices || 'Não informado'}
Formas de Pagamento Aceitas: ${Array.isArray(botInfo?.paymentMethods) ? botInfo?.paymentMethods.join(', ') : 'Não informado'}
`;

        if (lastAudit) {
            clientContext += `
ÚLTIMA AUDITORIA / RAIO-X DO CLIENTE:
Score de Saúde de Negócio Geral: ${lastAudit.overallScore}/100
 breakdown de Pontuações: ${JSON.stringify(lastAudit.scores)}
Dores, Problemas e Recomendações Recentes: ${JSON.stringify(lastAudit.report)}
`;
        }

        const enrichedSystemPrompt = `${agent.systemPrompt}\n${clientContext}\n`;

        // 6. Preparar as mensagens para o Safe AI
        const apiMessages = [
            { role: 'system', content: enrichedSystemPrompt },
            ...messages.map((m: any) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }))
        ];

        // 7. Simular o "bot" que o safeChatCompletion espera para saber quais API keys usar
        // Usamos as API keys da agência, ou do cliente se a agência não configurou
        const botMock = {
            name: agent.name,
            aiProvider: agent.llmProvider,
            aiModel: agent.llmModel,
            tenant: {
                openaiApiKey: agency.tenant.openaiApiKey || client.openaiApiKey || undefined,
                geminiApiKey: agency.tenant.geminiApiKey || client.geminiApiKey || undefined,
                openrouterApiKey: agency.tenant.openrouterApiKey || client.openrouterApiKey || undefined,
                anthropicApiKey: agency.tenant.anthropicApiKey || client.anthropicApiKey || undefined,
            }
        };

        console.log(`[SquadChat] Roteando chat do agente "${agent.name}" para ${agent.llmProvider} (${agent.llmModel})`);

        // 8. Chamar o safeChatCompletion
        const completionResult = await safeChatCompletion({
            messages: apiMessages,
            temperature: 0.7,
            bot: botMock
        });

        // 9. Retornar a resposta do chat
        return NextResponse.json({
            success: true,
            response: completionResult.content,
            provider: completionResult.provider,
            usage: {
                inputTokens: completionResult.inputTokens,
                outputTokens: completionResult.outputTokens
            }
        });

    } catch (error: any) {
        console.error(`[SquadChat] Erro crítico no chat do Hub de Squads:`, error);
        return NextResponse.json({ 
            error: 'Erro interno ao processar o chat com o especialista.', 
            details: error.message 
        }, { status: 500 });
    }
}
