export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageProcessor } from '@/services/engine/processor';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

function downloadBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const reqUrl = new URL(url);
            const options = {
                hostname: reqUrl.hostname,
                port: reqUrl.port || (reqUrl.protocol === 'https:' ? 443 : 80),
                path: reqUrl.pathname + reqUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'ConextBot/1.0',
                    ...headers
                }
            };

            const client = reqUrl.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return downloadBuffer(res.headers.location, headers).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP status ${res.statusCode}`));
                }
                const chunks: Buffer[] = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

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
                    const msgType = msg.type;

                    if (msgType === 'text') {
                        const text = msg.text?.body;
                        if (!text) continue;

                        console.log(`[Meta Webhook] WA Text Message from ${from}: ${text}`);
                        MessageProcessor.process(
                            channel.botId,
                            from,
                            text,
                            'meta_whatsapp',
                            'id',
                            { inputType: 'text' }
                        ).catch(err => console.error('[Meta Webhook] Processor error:', err));
                    } else if (msgType === 'audio' || msgType === 'voice') {
                        const audioData = msg.audio || msg.voice;
                        const mediaId = audioData?.id;
                        console.log(`[Meta Webhook] WA Audio Message from ${from}, mediaId: ${mediaId}`);

                        if (!mediaId) continue;

                        (async () => {
                            try {
                                const bot = await prisma.bot.findUnique({
                                    where: { id: channel.botId },
                                    include: { tenant: true }
                                });
                                if (!bot) return;

                                const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
                                const metaToken = channel.access_token || (bot as any).metaToken || globalConfig?.metaAccessToken || process.env.META_ACCESS_TOKEN;

                                if (!metaToken) {
                                    console.error('[Meta Webhook] Missing Meta Access Token for audio download');
                                    return;
                                }

                                const mediaRes = await fetch(`https://graph.facebook.com/v22.0/${mediaId}`, {
                                    headers: { 'Authorization': `Bearer ${metaToken}` }
                                });

                                if (!mediaRes.ok) {
                                    console.error('[Meta Webhook] Failed to fetch media URL:', mediaRes.status, await mediaRes.text());
                                    return;
                                }

                                const mediaJson = await mediaRes.json();
                                const downloadUrl = mediaJson.url;

                                if (!downloadUrl) {
                                    console.error('[Meta Webhook] No download URL returned for mediaId:', mediaId);
                                    return;
                                }

                                const buffer = await downloadBuffer(downloadUrl, { 'Authorization': `Bearer ${metaToken}` });
                                const tempAudioPath = path.join(os.tmpdir(), `meta_audio_${mediaId}.ogg`);
                                fs.writeFileSync(tempAudioPath, buffer);

                                console.log(`[Meta Webhook] Downloaded Meta Audio file to ${tempAudioPath} (${buffer.length} bytes)`);

                                const { VoiceService } = await import('@/services/engine/voice');
                                const transcribedText = await VoiceService.transcribe(
                                    tempAudioPath, 
                                    (bot as any).openaiToken, 
                                    (bot as any).geminiToken
                                );

                                console.log(`[Meta Webhook] Transcribed Audio: "${transcribedText}"`);

                                await MessageProcessor.process(
                                    channel.botId,
                                    from,
                                    transcribedText || '(áudio sem fala detectada)',
                                    'meta_whatsapp',
                                    'id',
                                    { inputType: 'audio', mediaPath: tempAudioPath }
                                );
                            } catch (err: any) {
                                console.error('[Meta Webhook] Error processing audio message:', err);
                            }
                        })();
                    } else if (msgType === 'image') {
                        const imageData = msg.image;
                        const mediaId = imageData?.id;
                        const caption = imageData?.caption || '';

                        console.log(`[Meta Webhook] WA Image Message from ${from}, mediaId: ${mediaId}`);

                        if (!mediaId) continue;

                        (async () => {
                            try {
                                const bot = await prisma.bot.findUnique({ where: { id: channel.botId } });
                                if (!bot) return;

                                const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
                                const metaToken = channel.access_token || (bot as any).metaToken || globalConfig?.metaAccessToken || process.env.META_ACCESS_TOKEN;

                                if (!metaToken) return;

                                const mediaRes = await fetch(`https://graph.facebook.com/v22.0/${mediaId}`, {
                                    headers: { 'Authorization': `Bearer ${metaToken}` }
                                });
                                if (!mediaRes.ok) return;

                                const mediaJson = await mediaRes.json();
                                if (!mediaJson.url) return;

                                const buffer = await downloadBuffer(mediaJson.url, { 'Authorization': `Bearer ${metaToken}` });
                                const tempImgPath = path.join(os.tmpdir(), `meta_img_${mediaId}.jpg`);
                                fs.writeFileSync(tempImgPath, buffer);

                                await MessageProcessor.process(
                                    channel.botId,
                                    from,
                                    caption,
                                    'meta_whatsapp',
                                    'id',
                                    { inputType: 'image', mediaPath: tempImgPath }
                                );
                            } catch (err: any) {
                                console.error('[Meta Webhook] Error processing image message:', err);
                            }
                        })();
                    } else {
                        console.log(`[Meta Webhook] Unsupported message type: ${msgType}`);
                    }
                }
            }
        }
    }
}

async function handleInstagram(body: any) {
    for (const entry of body.entry || []) {
        const accountId = entry.id;
        
        // Busca o canal pelo Instagram Business Account ID ou pela Página vinculada
        let channel = await prisma.botChannel.findFirst({
            where: {
                provider: 'INSTAGRAM',
                OR: [
                    { identifier: accountId },
                    { credentials: { path: ['pageId'], equals: accountId } }
                ]
            }
        });

        if (!channel) {
            console.log(`[Meta Webhook] No bot found for Insta / Page Account ID: ${accountId}`);
            continue;
        }

        const messaging = entry.messaging || [];
        for (const event of messaging) {
            const senderId = event.sender?.id;
            const message = event.message;

            // Ignore messages sent by our own page/bot
            if (senderId === accountId) continue;

            if (message) {
                const text = message.text;
                const attachments = message.attachments || [];

                if (text && attachments.length === 0) {
                    console.log(`[Meta Webhook] Insta Message from ${senderId} to ${accountId}: ${text}`);
                    MessageProcessor.process(
                        channel.botId, 
                        senderId, 
                        text, 
                        'instagram', 
                        'id', 
                        { inputType: 'text' }
                    ).catch(err => console.error('[Meta Webhook] Processor error:', err));
                } else if (attachments.length > 0) {
                    for (const att of attachments) {
                        const attType = att.type; // 'image', 'audio', etc.
                        const mediaUrl = att.payload?.url;
                        if (!mediaUrl) continue;

                        if (attType === 'image') {
                            (async () => {
                                try {
                                    const buffer = await downloadBuffer(mediaUrl);
                                    const tempImgPath = path.join(os.tmpdir(), `insta_img_${Date.now()}.jpg`);
                                    fs.writeFileSync(tempImgPath, buffer);

                                    await MessageProcessor.process(
                                        channel.botId,
                                        senderId,
                                        text || '',
                                        'instagram',
                                        'id',
                                        { inputType: 'image', mediaPath: tempImgPath }
                                    );
                                } catch (err: any) {
                                    console.error('[Meta Webhook] Insta image error:', err);
                                }
                            })();
                        } else if (attType === 'audio') {
                            (async () => {
                                try {
                                    const bot = await prisma.bot.findUnique({ where: { id: channel.botId } });
                                    const buffer = await downloadBuffer(mediaUrl);
                                    const tempAudioPath = path.join(os.tmpdir(), `insta_audio_${Date.now()}.ogg`);
                                    fs.writeFileSync(tempAudioPath, buffer);

                                    const { VoiceService } = await import('@/services/engine/voice');
                                    const transcribedText = await VoiceService.transcribe(
                                        tempAudioPath,
                                        (bot as any)?.openaiToken,
                                        (bot as any)?.geminiToken
                                    );

                                    await MessageProcessor.process(
                                        channel.botId,
                                        senderId,
                                        transcribedText || '(áudio sem fala detectada)',
                                        'instagram',
                                        'id',
                                        { inputType: 'audio', mediaPath: tempAudioPath }
                                    );
                                } catch (err: any) {
                                    console.error('[Meta Webhook] Insta audio error:', err);
                                }
                            })();
                        }
                    }
                }
            }
        }
    }
}
