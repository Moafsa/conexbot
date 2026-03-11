import prisma from '@/lib/prisma';
import { UzapiService } from './uzapi';
import { SupervisorService } from './supervisor';
import { FunnelStage } from '@prisma/client';

export const FollowUpService = {
    /**
     * Checks for stalled conversations and sends follow-ups.
     * Should be called via Cron every hour.
     */
    async processStalledConversations(botId: string) {
        console.log(`[FollowUp] Checking bot ${botId}...`);

        const STALLED_HOURS = 24;
        const stalledTime = new Date(Date.now() - STALLED_HOURS * 60 * 60 * 1000);

        // Find contacts in 'purchase' stages who haven't interacted recently
        const stalls = await prisma.contact.findMany({
            where: {
                tenantId: { not: undefined }, // Safety check
                // Associated bot check might be tricky via Contact-Tenant relation, 
                // but we can find conversations linked to this bot.
                // Better: Find conversations for this bot where updated_at is old.
            },
            include: {
                tenant: true
            }
        });

        // Better query via Conversation
        const stalledConversations = await prisma.conversation.findMany({
            where: {
                botId: botId,
                updatedAt: { lt: stalledTime },
                status: 'open',
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                bot: true
            }
        });

        console.log(`[FollowUp] Found ${stalledConversations.length} stalled conversations.`);

        for (const conv of stalledConversations) {
            const lastMsg = conv.messages[0];
            if (!lastMsg) continue;

            // Only follow up if last message was NOT from us (wait, if last was from us, user didn't reply. If last was from user, we didn't reply - which is a bug).
            // Actually, we want to follow up if USER didn't reply to US.
            // So last message role == 'assistant'.

            if (lastMsg.role !== 'assistant') continue;

            // Check contact stage
            const contact = await prisma.contact.findUnique({
                where: { phone_botId: { phone: conv.remoteId, botId: conv.botId } }
            });

            if (!contact || ['LEAD', 'CHURNED', 'ACTION', 'SUPPORT'].includes(contact.funnelStage)) {
                continue; // Skip these stages
            }

            console.log(`[FollowUp] Sending to ${conv.remoteId} (${contact.funnelStage})...`);

            // Generate Follow-up Text
            // We can ask Supervisor or use a template
            const followUpPrompt = `
            O cliente parou de responder há 24 horas.
            Estágio: ${contact.funnelStage}.
            Última mensagem do bot: "${lastMsg.content}".
            
            Gere uma mensagem curta de retomada de contato, empática e leve.
            Ex: "Oi, conseguiu ver a proposta?"
            `;

            // For now, simple logic or call OpenAI
            const message = `Olá! 👋 Conseguiu dar uma olhadinha na nossa última conversa? Estou por aqui se tiver dúvidas!`;

            // Send
            await UzapiService.sendMessage(conv.bot.sessionName!, conv.remoteId, message);

            // Log (optional: update conversation to avoid looping)
            // We might want to mark it as "followed_up" or just let updatedAt update?
            // Sending message updates updatedAt automatically in normal flow, but UzapiService doesn't update DB.
            // We must update DB.
            await prisma.conversation.update({
                where: { id: conv.id },
                data: { updatedAt: new Date() } // Bumps timestamp so we don't spam instantly next run
            });

            await prisma.message.create({
                data: {
                    conversationId: conv.id,
                    role: 'assistant',
                    content: message
                }
            });
        }
    },

    /**
     * Re-analyzes conversations daily to identify sales or post-sales opportunities.
     */
    async processDailyFollowups() {
        console.log('[FollowUp] Starting daily AI analysis...');
        try {
            const bots = await (prisma.bot as any).findMany({
                where: { status: 'active' },
                include: {
                    followupRules: { where: { active: true } },
                    tenant: true
                }
            });

            for (const bot of bots) {
                if (!bot.followupRules || bot.followupRules.length === 0) continue;

                // Find all active contacts for this bot
                const contacts = await prisma.contact.findMany({
                    where: { botId: bot.id },
                    include: {
                        orders: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                });

                for (const contact of contacts) {
                    for (const rule of bot.followupRules) {
                        await this.evaluateRule(bot, contact, rule);
                    }
                }
            }
        } catch (error) {
            console.error('[FollowUp] Critical error in daily analysis:', error);
        }
    },

    async evaluateRule(bot: any, contact: any, rule: any) {
        const now = new Date();
        const lastActive = new Date(contact.lastActive || contact.updatedAt);
        const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        let shouldTrigger = false;

        if (rule.triggerType === 'SALES' && contact.funnelStage !== 'CUSTOMER') {
            if (diffDays >= rule.triggerDays && diffDays < rule.triggerDays + 1) {
                shouldTrigger = true;
            }
        } else if (rule.triggerType === 'POST_SALE' && contact.funnelStage === 'CUSTOMER') {
            const lastOrder = contact.orders[0];
            if (lastOrder) {
                const orderDate = new Date(lastOrder.createdAt);
                const orderDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                if (orderDiff >= rule.triggerDays && orderDiff < rule.triggerDays + 1) {
                    shouldTrigger = true;
                }
            }
        } else if (rule.triggerType === 'EVENT_REMINDER' && contact.eventDate) {
            const eventDate = new Date(contact.eventDate);
            const eventDiff = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (rule.triggerDays === eventDiff) {
                shouldTrigger = true;
            }
        }

        if (shouldTrigger) {
            // Check if we already sent this rule recently
            const alreadySent = await prisma.message.findFirst({
                where: {
                    content: { contains: `[FOLLOW-UP: ${rule.name}]` },
                    createdAt: { gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) }
                }
            });

            if (!alreadySent) {
                console.log(`[FollowUp] Generating AI message for ${contact.phone} (${rule.name})`);

                let actingBot = bot;
                if (contact.assignedBotId) {
                    const assignedBot = await prisma.bot.findUnique({
                        where: { id: contact.assignedBotId }
                    });
                    if (assignedBot) actingBot = assignedBot;
                }

                const generatedMessage = await this.generateAiFollowup(actingBot, contact, rule);

                if (generatedMessage) {
                    await UzapiService.sendMessage(bot.sessionName!, contact.phone, generatedMessage);

                    const conversation = await prisma.conversation.findUnique({
                        where: { botId_remoteId: { botId: bot.id, remoteId: contact.phone } }
                    });

                    if (conversation) {
                        await prisma.message.create({
                            data: {
                                conversationId: conversation.id,
                                role: 'assistant',
                                content: `[FOLLOW-UP: ${rule.name}] ${generatedMessage}`
                            }
                        });
                    }
                }
            }
        }
    },

    async generateAiFollowup(bot: any, contact: any, rule: any) {
        try {
            const { safeChatCompletion } = require('@/lib/ai-provider');

            // Get last messages for context
            const conversation = await prisma.conversation.findUnique({
                where: { botId_remoteId: { botId: bot.id, remoteId: contact.phone } },
                include: { messages: { orderBy: { createdAt: 'desc' }, take: 15 } }
            });

            const history = conversation?.messages
                .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
                .reverse()
                .join('\n') || "Sem histórico anterior.";

            const prompt = `
                Você é o assistente virtual "${bot.name}". 
                Sua tarefa é enviar um acompanhamento (follow-up) para o cliente.
                
                OBJETIVO DA REGRA: ${rule.name}
                INSTRUÇÕES DO USUÁRIO: ${rule.message}
                ESTÁGIO DO FUNIL: ${contact.funnelStage}
                
                HISTÓRICO DE CONVERSA:
                ${history}
                
                Gere uma mensagem curta, natural e humana, que faça sentido com o que foi conversado por último.
                Não pareça um robô de automação. Se o cliente parou de responder, seja empático.
                Responda APENAS com o texto da mensagem a ser enviada.
            `;

            const result = await safeChatCompletion({
                bot,
                messages: [{ role: 'system', content: prompt }]
            }) as any;

            return typeof result === 'string' ? result : result.content;
        } catch (error) {
            console.error(`[FollowUp] Error generating AI message:`, error);
            return null;
        }
    }
};
