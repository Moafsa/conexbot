export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageProcessor } from '@/services/engine/processor';

// GET: Verificação de Webhook da Meta
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
    const verifyToken = globalConfig?.metaVerifyToken || process.env.META_VERIFY_TOKEN || 'CONEXT_META_VERIFY';

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Meta Webhook] Verified successfully');
        return new NextResponse(challenge, { status: 200 });
    } else {
        console.warn('[Meta Webhook] Verification failed', { mode, token });
        return new NextResponse('Forbidden', { status: 403 });
    }
}

// POST: Recebimento de Mensagens
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if it's a Meta Webhook payload
        if (body.object === 'whatsapp_business_account') {
            await handleWhatsApp(body);
        } else if (body.object === 'page' || body.object === 'instagram') {
            await handleInstagram(body);
        } else {
            console.log('[Meta Webhook] Unrecognized object:', body.object);
        }

        // Return 200 OK immediately to acknowledge receipt to Meta
        return NextResponse.json({ status: 'received' }, { status: 200 });

    } catch (error: any) {
        console.error('[Meta Webhook] Error:', error.message);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}

async function handleWhatsApp(body: any) {
    for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
            if (change.field === 'messages') {
                const value = change.value;
                const metadata = value.metadata;
                const phoneId = metadata?.phone_number_id;

                if (!phoneId) continue;

                // Find the bot channel
                const channel = await prisma.botChannel.findUnique({
                    where: { provider_identifier: { provider: 'META_WHATSAPP', identifier: phoneId } }
                });

                if (!channel) {
                    console.log(`[Meta Webhook] No bot found for WhatsApp Phone ID: ${phoneId}`);
                    continue;
                }

                const messages = value.messages || [];
                for (const msg of messages) {
                    const from = msg.from; // Customer phone
                    const text = msg.text?.body;

                    if (!text) {
                        console.log(`[Meta Webhook] Received non-text WA message, skipping for now.`);
                        continue;
                    }

                    console.log(`[Meta Webhook] WA Message from ${from} to ${phoneId}: ${text}`);
                    
                    // Call the engine processor
                    MessageProcessor.process(
                        channel.botId, 
                        from, 
                        text, 
                        'meta_whatsapp', 
                        'id', 
                        { inputType: 'text' }
                    ).catch(err => console.error('[Meta Webhook] Processor error:', err));
                }
            }
        }
    }
}

async function handleInstagram(body: any) {
    for (const entry of body.entry || []) {
        const accountId = entry.id;
        
        // Find the bot channel
        const channel = await prisma.botChannel.findUnique({
            where: { provider_identifier: { provider: 'INSTAGRAM', identifier: accountId } }
        });

        if (!channel) {
            console.log(`[Meta Webhook] No bot found for Insta Account ID: ${accountId}`);
            continue;
        }

        const messaging = entry.messaging || [];
        for (const event of messaging) {
            const senderId = event.sender?.id;
            const message = event.message;

            // Ignore messages sent by our own page/bot
            if (senderId === accountId) continue;

            if (message && message.text) {
                console.log(`[Meta Webhook] Insta Message from ${senderId} to ${accountId}: ${message.text}`);
                
                // Call the engine processor
                MessageProcessor.process(
                    channel.botId, 
                    senderId, 
                    message.text, 
                    'instagram', 
                    'id', 
                    { inputType: 'text' }
                ).catch(err => console.error('[Meta Webhook] Processor error:', err));
            }
        }
    }
}
