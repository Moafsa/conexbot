export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import prisma from '@/lib/prisma';
import { verifyWpToken } from '@/lib/wp-token';
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
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
        }

        const botIdRaw = body.bot_id;
        const commentContent = body.comment_content;
        const author = body.comment_author || 'Visitante';
        const postId = body.post_id;
        const commentId = body.comment_id;
        const postTitle = body.post_title || '';
        const postContent = body.post_content || '';

        logToFile(`[Wordpress Webhook] Received comment from ${author} on Post ${postId} (Bot raw: ${String(botIdRaw).slice(0, 24)}...)`);

        if (!botIdRaw || !commentContent) {
            logToFile(`[Wordpress Webhook] Missing botId or commentContent`);
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        // Identificar o bot: UUID, webhookToken, ou token CONEXT_ (tenant) — o plugin enviava o token errado como bot_id
        let bot = await prisma.bot.findFirst({
            where: {
                OR: [
                    { id: botIdRaw },
                    { webhookToken: botIdRaw },
                ],
            },
        });

        if (!bot && typeof botIdRaw === 'string' && botIdRaw.startsWith('CONEXT_')) {
            const decoded = verifyWpToken(botIdRaw);
            if (decoded?.id) {
                bot = await prisma.bot.findFirst({
                    where: { tenantId: decoded.id as string, status: 'active' },
                    orderBy: { createdAt: 'asc' },
                });
                logToFile(`[Wordpress Webhook] Resolved bot via CONEXT tenant ${decoded.id} -> ${bot?.id || 'none'}`);
            }
        }

        if (!bot) {
            logToFile(`[Wordpress Webhook] Bot not found for: ${String(botIdRaw).slice(0, 40)}`);
            return NextResponse.json({ status: 'error', message: 'Bot not found' }, { status: 404 });
        }

        logToFile(`[Wordpress Webhook] Processing for Bot ${bot.id}, Author ${author}, Text: ${commentContent}`);

        // Prepare context for the processor
        const contextualMessage = `[COMENTÁRIO EM POST]\nTítulo do Post: "${postTitle}"\nConteúdo do Post: "${postContent}"\nAutor do Comentário: ${author}\nComentário: "${commentContent}"`;

        // We use the commentId as a unique identifier for the conversation session in this context
        // This ensures the bot "remembers" it's replying to a specific comment thread
        const remoteId = `wp_post_${postId}_comment_${commentId}`;

        const channel = body.channel || 'wordpress';
        const whatsappChatJid = body.whatsapp_chat_jid || null;

        // Send to processor
        MessageProcessor.process(bot.id, remoteId, contextualMessage, channel as any, 'id', {
            inputType: 'text',
            whatsappChatJid: whatsappChatJid
        }).catch(err => {
            logToFile(`[Wordpress Webhook] Processor Error: ${err?.message || err}`);
            console.error(err);
        });

        return NextResponse.json({ status: 'received' });

    } catch (error: any) {
        logToFile(`[Wordpress Webhook] Fatal Error: ${error.message}`);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}

