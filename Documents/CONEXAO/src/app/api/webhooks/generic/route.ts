export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    const logPath = process.platform === 'win32' ? path.join(process.cwd(), 'debug-today.log') : '/tmp/debug-today.log';
    try {
        fs.appendFileSync(logPath, line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
        }

        logToFile(`[Generic Webhook] Token: ${token}, Body: ${JSON.stringify(body).substring(0, 500)}`);

        // Identify the Bot
        let bot;

        if (token) {
            bot = await prisma.bot.findFirst({
                where: {
                    OR: [
                        { webhookToken: token },
                        { id: token }
                    ]
                }
            });
        }

        if (!bot) {
            // attempt to find by an explicit botId in the body
            if (body.botId) {
                bot = await prisma.bot.findUnique({ where: { id: body.botId } });
            } else if (body.token) {
                bot = await prisma.bot.findFirst({ where: { webhookToken: body.token } });
            }
        }

        if (!bot) {
            logToFile(`[Generic Webhook] Bot not found`);
            return NextResponse.json({ status: 'error', message: 'Bot not found' }, { status: 404 });
        }

        // --- Data Extraction Setup ---
        let senderPhone = '';
        let messageText = '';
        let chatwootConversationId: number | undefined = undefined;

        // 1. Chatwoot Format Detection
        if (body.event === 'message_created' && body.conversation) {
            messageText = body.content || '';
            chatwootConversationId = body.conversation.id;
            const senderInfo = body.sender || {};
            const senderType: string = senderInfo.type || senderInfo.sender_type || '';

            // CASE A: Human agent typed a reply in Chatwoot → forward to WhatsApp (do NOT re-process through AI)
            if (body.message_type === 'outgoing' && senderType === 'user') {
                // Get the customer's phone from the conversation meta
                const contactMeta = body.conversation?.meta?.sender || {};
                const customerPhone = contactMeta.phone_number || contactMeta.identifier || String(contactMeta.id || '');
                if (!customerPhone || !messageText) {
                    return NextResponse.json({ status: 'ignored', message: 'Missing customer phone or text for agent reply' });
                }
                logToFile(`[Generic Webhook] Chatwoot AGENT reply → WhatsApp for ${customerPhone}: "${messageText.substring(0, 80)}"`);
                // Forward the human agent's message to the customer on WhatsApp
                try {
                    const { UzapiService } = await import('@/services/engine/uzapi');
                    await UzapiService.sendMessage(bot.sessionName || '', customerPhone.replace(/\D/g, ''), messageText);
                    return NextResponse.json({ status: 'forwarded_to_whatsapp' });
                } catch (fwdErr: any) {
                    logToFile(`[Generic Webhook] Forward agent reply to WhatsApp failed: ${fwdErr.message}`);
                    return NextResponse.json({ status: 'forward_error', message: fwdErr.message }, { status: 500 });
                }
            }

            // CASE B: Outgoing from bot/system (pushed by our syncToConversation) — ignore to avoid loops
            if (body.message_type === 'outgoing' || body.message_type === 'template') {
                logToFile(`[Generic Webhook] Ignored outgoing Chatwoot message (type=${senderType})`);
                return NextResponse.json({ status: 'ignored_outgoing' });
            }

            // CASE C: Incoming from customer (we pushed this ourselves via sync — ignore to avoid loop)
            // In API channel inboxes, 'incoming' messages come from our own pushes; WhatsApp already handled them.
            if (body.message_type === 'incoming') {
                logToFile(`[Generic Webhook] Ignored Chatwoot incoming (already processed via WhatsApp webhook)`);
                return NextResponse.json({ status: 'ignored_already_processed' });
            }

            // CASE D: Fallback — treat as customer message for legacy / non-WhatsApp inboxes
            // Prefer phone_number, fallback to identifier, then email, then ID
            senderPhone = senderInfo.phone_number || senderInfo.identifier || senderInfo.email || String(senderInfo.id || 'chatwoot_user');
        }
        // 2. n8n / Generic Custom Format Detection
        else {
            messageText = body.text || body.message || body.content || '';
            senderPhone = body.phone || body.sender || body.from || body.userId || '';
        }

        if (!messageText || !senderPhone) {
            logToFile(`[Generic Webhook] Missing text or sender`);
            return NextResponse.json({ status: 'ignored', message: 'Missing text or sender phone/id' });
        }

        logToFile(`[Generic Webhook] Processing for Bot ${bot.id}, Phone ${senderPhone}, Text: ${messageText}, ChatwootConversationId: ${chatwootConversationId}`);

        // Send to processor
        MessageProcessor.process(bot.id, senderPhone, messageText, 'generic', 'id', {
            inputType: 'text',
            chatwootConversationId
        }).catch(err => {
            logToFile(`[Generic Webhook] Processor Error: ${err?.message || err}`);
            console.error(err);
        });

        return NextResponse.json({ status: 'received' });

    } catch (error: any) {
        logToFile(`[Generic Webhook] Fatal Error: ${error.message}`);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}

