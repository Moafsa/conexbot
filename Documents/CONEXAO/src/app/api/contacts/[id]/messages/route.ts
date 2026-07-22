import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import { sendOutboundMessageToPhone } from '@/services/engine/outbound-notifier';
import { ChatwootService } from '@/services/engine/chatwoot';
import { getRedis } from '@/lib/redis';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const urlObj = new URL(req.url);
        const clientId = urlObj.searchParams.get('clientId');
        const tenantId = await getEffectiveTenantId(clientId);

        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: contactId } = await params;
        const body = await req.json();
        const { message: messageText } = body;

        if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
            return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
        }

        // 1. Find contact
        const contact = await prisma.contact.findFirst({
            where: { id: contactId, tenantId },
            include: { bot: true }
        });

        if (!contact) {
            return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
        }

        // 2. Determine bot to send from
        let bot = contact.bot;
        if (!bot) {
            bot = await prisma.bot.findFirst({
                where: { tenantId }
            });
        }

        if (!bot) {
            return NextResponse.json({ error: 'Nenhum bot encontrado para realizar o envio' }, { status: 400 });
        }

        // 3. Find or create conversation by remoteId (phone variations)
        const { PhoneUtils } = await import('@/lib/phone-utils');
        const phoneVariations = PhoneUtils.getPhoneVariations(contact.phone);

        let conversation = await prisma.conversation.findFirst({
            where: {
                botId: bot.id,
                remoteId: { in: phoneVariations }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    botId: bot.id,
                    remoteId: PhoneUtils.normalize(contact.phone),
                    channel: 'whatsapp',
                }
            });
        }

        // 4. Pause bot for 30 minutes so AI does not interrupt human agent
        const pausedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { pausedUntil } as any
        });

        // Cache last reply in Redis to avoid Chatwoot loop
        const redis = getRedis();
        if (redis) {
            const cleanPhone = contact.phone.replace(/\D/g, '');
            await redis.setex(`last_bot_reply:${bot.id}:${cleanPhone}`, 120, messageText.trim());
        }

        // 5. Send message via outbound notifier (Meta WhatsApp or WuzAPI)
        const sendResult = await sendOutboundMessageToPhone(bot, contact.phone, messageText.trim());

        if (!sendResult.success) {
            return NextResponse.json({
                error: sendResult.error || 'Falha ao enviar mensagem via WhatsApp.'
            }, { status: 500 });
        }

        // 6. Save message in Database
        const newMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: `[HUMANO]: ${messageText.trim()}`,
            }
        });

        // 7. Post to Chatwoot if configured
        if (bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId && conversation.chatwootConversationId) {
            try {
                await ChatwootService.sendMessage(
                    bot,
                    conversation.chatwootConversationId,
                    `[HUMANO]: ${messageText.trim()}`,
                    'outgoing'
                );
            } catch (cwErr: any) {
                console.error('[CRM SendMessage] Chatwoot sync error:', cwErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: newMessage
        });
    } catch (error: any) {
        console.error('[CRM SendMessage POST Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
