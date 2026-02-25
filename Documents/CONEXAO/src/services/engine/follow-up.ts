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
                where: { phone_tenantId: { phone: conv.remoteId, tenantId: conv.bot.tenantId } }
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
    }
};
