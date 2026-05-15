import prisma from '@/lib/prisma';
import { UzapiService } from './uzapi';
import { SupervisorService } from './supervisor';
import { FunnelStage } from '@prisma/client';
import { PhoneUtils } from '@/lib/phone-utils';

export const FollowUpService = {
    /**
     * Checks for stalled conversations and sends follow-ups.
     * Should be called via Cron every hour.
     */
    /**
     * Legacy stalled conversations check - replaced by rule-based followup.
     * @deprecated Use AFTER_LAST_MESSAGE rule instead.
     */
    async processStalledConversations(botId: string) {
        // No longer used, but kept for signature compatibility if needed
        return;
    },

    /**
     * Re-analyzes conversations daily to identify sales or post-sales opportunities.
     */
    async processDailyFollowups() {
        console.log('[FollowUp] Starting daily AI analysis...');
        try {
            const bots = await (prisma.bot as any).findMany({
                where: {
                    status: {
                        in: ['ACTIVE', 'active']
                    }
                },
                include: {
                    followupRules: { where: { active: true } },
                    tenant: true
                }
            });

            for (const bot of bots) {
                if (!bot.followupRules || bot.followupRules.length === 0) continue;

                const contacts = await prisma.contact.findMany({
                    where: { botId: bot.id },
                    include: {
                        orders: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                });

                console.log(`[FollowUp] Bot ${bot.name} (${bot.id}) has ${contacts.length} contacts.`);

                for (const contact of contacts) {
                    if (!contact.phone || contact.phone.startsWith('SIM_') || contact.phone.length < 8) {
                        console.log(`[FollowUp] Skipping contact with invalid phone: ${contact.phone}`);
                        continue;
                    }
                    console.log(`[FollowUp] Evaluating contact ${contact.phone} for bot ${bot.name}`);
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
        const normalizedPhone = PhoneUtils.normalize(contact.phone);
        const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
        const diffDays = Math.floor(diffMinutes / 1440);

        const triggerValue = (rule as any).triggerValue || rule.triggerDays;
        console.log(`[FollowUp] Rule "${rule.name}" (${rule.triggerType}) for ${contact.phone}: diffMinutes=${diffMinutes}, triggerUnit=${rule.triggerUnit}, triggerValue=${triggerValue}`);

        let shouldTrigger = false;

        if (rule.triggerType === 'SALES' && contact.funnelStage !== 'CUSTOMER') {
            if (diffDays >= triggerValue && diffDays < triggerValue + 1) {
                shouldTrigger = true;
            }
        } else if (rule.triggerType === 'POST_SALE' && contact.funnelStage === 'CUSTOMER') {
            const lastOrder = contact.orders?.[0];
            if (lastOrder) {
                const orderDate = new Date(lastOrder.createdAt);
                const orderDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                if (orderDiff >= triggerValue && orderDiff < triggerValue + 1) {
                    shouldTrigger = true;
                }
            }
        } else if (rule.triggerType === 'EVENT_REMINDER' && contact.eventDate) {
            const eventDate = new Date(contact.eventDate);
            const eventDiff = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (triggerValue === eventDiff) {
                shouldTrigger = true;
            }
        } else if (rule.triggerType === 'AFTER_LAST_MESSAGE' || rule.triggerType === 'STALLED') {
            // Support for MINUTES, HOURS, DAYS
            let targetMinutes = triggerValue;
            if (rule.triggerUnit === 'HOURS') targetMinutes *= 60;
            if (rule.triggerUnit === 'DAYS' || !rule.triggerUnit) targetMinutes *= 1440;

            if (diffMinutes >= targetMinutes) {
                const conversation = await prisma.conversation.findUnique({
                    where: { botId_remoteId: { botId: bot.id, remoteId: normalizedPhone } },
                    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
                });

                const lastMsg = conversation?.messages?.[0];
                // Trigger if last message was from assistant (typical stalled)
                // OR if it was from user but it was REALLY long ago (system failure)
                // OR if NO message history exists (newly imported or DB wiped)
                if (!lastMsg || lastMsg.role === 'assistant' || diffMinutes > targetMinutes + 120) {
                    shouldTrigger = true;
                }
            }
        }

        if (shouldTrigger) {
            // Adjust cooldown based on rule unit
            let cooldownMs = 23 * 60 * 60 * 1000; // Default 23h
            if (rule.triggerUnit === 'MINUTES') cooldownMs = (triggerValue - 0.5) * 60 * 1000;
            if (rule.triggerUnit === 'HOURS') cooldownMs = (triggerValue - 0.5) * 60 * 60 * 1000;

            const conv = await prisma.conversation.findUnique({ where: { botId_remoteId: { botId: bot.id, remoteId: normalizedPhone } } });
            // Check if we already sent this follow-up AFTER the last user message
            const lastFollowUp = await prisma.message.findFirst({
                where: {
                    conversationId: conv?.id,
                    content: { contains: `[FOLLOW-UP: ${rule.name}]` }
                },
                orderBy: { createdAt: 'desc' }
            });

            let alreadySent = false;
            if (lastFollowUp) {
                const lastUserMsg = await prisma.message.findFirst({
                    where: {
                        conversationId: conv?.id,
                        role: 'user'
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (!lastUserMsg || lastFollowUp.createdAt > lastUserMsg.createdAt) {
                    // Block if it was already sent after the last user interaction
                    alreadySent = true;
                }
            }

            console.log(`[FollowUp] Checking for ${contact.phone}: alreadySent=${alreadySent}, convId=${conv?.id}`);

            if (!alreadySent) {
                // Get last messages for context
                const conversation = await prisma.conversation.findUnique({
                    where: { botId_remoteId: { botId: bot.id, remoteId: normalizedPhone } },
                    include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } }
                });

                console.log(`[FollowUp] Calling AI for ${contact.phone}. History length: ${conversation?.messages?.length || 0}`);
                const { shouldFollowUp, reason } = await this.aiShouldFollowUp(bot, contact, rule, conversation?.messages || []);
                
                if (!shouldFollowUp) {
                    console.log(`[FollowUp] AI decided NOT to follow up with ${contact.phone} for rule ${rule.name}. Reason: ${reason}`);
                    return;
                }

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
                    await UzapiService.sendMessage(bot.sessionName!, normalizedPhone, generatedMessage);

                    // ENSURE Conversation exists before logging message
                    const conversation = await prisma.conversation.upsert({
                        where: { botId_remoteId: { botId: bot.id, remoteId: normalizedPhone } },
                        update: { updatedAt: new Date() },
                        create: { botId: bot.id, remoteId: normalizedPhone, channel: 'whatsapp' }
                    });

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
    },

    async generateAiFollowup(bot: any, contact: any, rule: any) {
        try {
            const { safeChatCompletion } = require('@/lib/ai-provider');

            // Get last messages for context
            const normalizedPhone = PhoneUtils.normalize(contact.phone);
            const conversation = await prisma.conversation.findUnique({
                where: { botId_remoteId: { botId: bot.id, remoteId: normalizedPhone } },
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
    },

    /**
     * AI-driven decision gate to avoid unwanted touchpoints.
     */
    async aiShouldFollowUp(bot: any, contact: any, rule: any, messages: any[]) {
        try {
            const { safeChatCompletion } = require('@/lib/ai-provider');

            const history = messages
                .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
                .reverse()
                .join('\n') || "Sem histórico anterior.";

            const prompt = `
                Você é o SUPERVISOR de atendimento. Decida se devemos enviar uma mensagem de follow-up agora.
                
                HISTÓRICO:
                ${history}
                
                REGRA DE FOLLOW-UP: "${rule.name}"
                OBJETIVO: ${rule.message}
                
                ANALISE:
                1. O cliente pediu EXPLICITAMENTE para não ser incomodado? (Se não, tenda para TRUE)
                2. O objetivo da regra ("${rule.name}") já foi alcançado na última mensagem?
                3. O cliente já comprou ou fechou o que estávamos tentando?
                
                IMPORTANTE: Somos uma equipe de vendas ativa. O follow-up é essencial. 
                Só responda FALSE se for realmente prejudicial à marca ou se o cliente já deu o próximo passo.
                Se estiver em dúvida, responda TRUE.
                
                Responda APENAS com um JSON:
                { "shouldFollowUp": true/false, "reason": "breve motivo" }
            `;

            const aiResult = await safeChatCompletion({
                bot,
                messages: [{ role: 'system', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0
            }) as any;

            const content = typeof aiResult === 'string' ? aiResult : aiResult.content;
            const result = JSON.parse(content || '{"shouldFollowUp":true, "reason": "default"}');
            
            return { shouldFollowUp: !!result.shouldFollowUp, reason: result.reason || 'No reason' };
        } catch (e) {
            console.error('[FollowUp] AI decision failed, defaulting to TRUE:', e);
            return { shouldFollowUp: true, reason: 'AI error' };
        }
    }
};
