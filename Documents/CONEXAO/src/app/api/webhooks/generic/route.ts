import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug-today.log'), line);
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

        // 1. Chatwoot Format Detection
        if (body.event === 'message_created' && body.conversation) {
            // Ignore messages from the agent/system itself (Chatwoot sends outgoing replies too)
            if (body.message_type === 'outgoing' || body.message_type === 'template') {
                logToFile(`[Generic Webhook] Ignored outgoing Chatwoot message`);
                return NextResponse.json({ status: 'ignored_outgoing' });
            }

            messageText = body.content || '';
            const senderInfo = body.sender || (body.conversation.meta && body.conversation.meta.sender) || {};
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

        logToFile(`[Generic Webhook] Processing for Bot ${bot.id}, Phone ${senderPhone}, Text: ${messageText}`);

        // Send to processor
        MessageProcessor.process(bot.id, senderPhone, messageText, 'generic', 'id').catch(err => {
            logToFile(`[Generic Webhook] Processor Error: ${err?.message || err}`);
            console.error(err);
        });

        return NextResponse.json({ status: 'received' });

    } catch (error: any) {
        logToFile(`[Generic Webhook] Fatal Error: ${error.message}`);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
