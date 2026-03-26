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
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
        }

        const botId = body.bot_id;
        const commentContent = body.comment_content;
        const author = body.comment_author || 'Visitante';
        const postId = body.post_id;
        const commentId = body.comment_id;
        const postTitle = body.post_title || '';
        const postContent = body.post_content || '';

        logToFile(`[Wordpress Webhook] Received comment from ${author} on Post ${postId} (Bot: ${botId})`);

        if (!botId || !commentContent) {
            logToFile(`[Wordpress Webhook] Missing botId or commentContent`);
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        // Identify the Bot
        const bot = await prisma.bot.findFirst({
            where: {
                OR: [
                    { webhookToken: botId },
                    { id: botId }
                ]
            }
        });

        if (!bot) {
            logToFile(`[Wordpress Webhook] Bot not found: ${botId}`);
            return NextResponse.json({ status: 'error', message: 'Bot not found' }, { status: 404 });
        }

        logToFile(`[Wordpress Webhook] Processing for Bot ${bot.id}, Author ${author}, Text: ${commentContent}`);

        // Prepare context for the processor
        const contextualMessage = `[COMENTÁRIO EM POST]\nTítulo do Post: "${postTitle}"\nConteúdo do Post: "${postContent}"\nAutor do Comentário: ${author}\nComentário: "${commentContent}"`;

        // We use the commentId as a unique identifier for the conversation session in this context
        // This ensures the bot "remembers" it's replying to a specific comment thread
        const remoteId = `wp_post_${postId}_comment_${commentId}`;

        // Send to processor
        // We pass the postId and commentId in a specialized format (or we could extend the signature, but let's keep it simple)
        // Actually, we need a way to pass postId/commentId back to the sender.
        // I'll use a hack of including metadata in the senderPhone or similar if needed, 
        // OR better: MessageProcessor will store the latest wp_context in the conversation metadata.
        
        MessageProcessor.process(bot.id, remoteId, contextualMessage, 'wordpress' as any, 'id').catch(err => {
            logToFile(`[Wordpress Webhook] Processor Error: ${err?.message || err}`);
            console.error(err);
        });

        return NextResponse.json({ status: 'received' });

    } catch (error: any) {
        logToFile(`[Wordpress Webhook] Fatal Error: ${error.message}`);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
