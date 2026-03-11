import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

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
        logToFile(`--- Incoming Webhook ---`);
        const contentType = req.headers.get('content-type') || '';
        logToFile(`Content-Type: ${contentType}`);
        let body: any;
        let sessionName: string = '';

        if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const jsonDataStr = formData.get('jsonData') as string;
            const token = (formData.get('token') || formData.get('instanceName')) as string;

            logToFile(`Form Data - Token/InstanceName: ${token}`);
            if (jsonDataStr) {
                body = JSON.parse(jsonDataStr);
                logToFile(`Raw JD: ${jsonDataStr.substring(0, 500)}`);
            }
            if (token) {
                sessionName = token;
            }
        } else {
            body = await req.json();
            logToFile(`JSON Body: ${JSON.stringify(body).substring(0, 500)}`);

            // WuzAPI Media Fix: Check if body has jsonData string
            if (body.jsonData && typeof body.jsonData === 'string') {
                try {
                    const parsedData = JSON.parse(body.jsonData);
                    body = { ...body, ...parsedData };
                    logToFile(`Parsed jsonData: ${JSON.stringify(parsedData).substring(0, 500)}`);
                } catch (e) {
                    logToFile(`Failed to parse jsonData string: ${e}`);
                }
            }

            sessionName = body.session || body.sessionName || body.token || body.instanceName || '';
        }

        if (!body) {
            logToFile(`No body found`);
            return NextResponse.json({ status: 'no_body' });
        }

        const eventType = body.type || body.event_type || body.event;
        logToFile(`Event Type detected: ${eventType}`);

        // CATCH-ALL DEBUG FOR MEDIA
        if (JSON.stringify(body).includes('imageMessage') || JSON.stringify(body).includes('ImageMessage')) {
            logToFile(`[DEBUG] RAW IMAGE BODY: ${JSON.stringify(body).substring(0, 1000)}`);
        }

        if (eventType === 'Message' || eventType === 'onMessage' || eventType === 'message') {
            const eventData = body.event || body.data || body;
            const info = eventData.Info || eventData.info || {};
            const message = eventData.Message || eventData.message || {};

            const senderPhoneRaw = info.Sender || info.sender || '';
            const senderAltRaw = info.SenderAlt || info.senderAlt || '';
            const senderPhone = senderPhoneRaw.includes('@lid') && senderAltRaw ? senderAltRaw : senderPhoneRaw;
            const audioMessage = message.audioMessage || message.AudioMessage;
            const messageBody = message.conversation || message.Conversation ||
                message.extendedTextMessage?.text || message.ExtendedTextMessage?.Text ||
                (audioMessage ? '[AUDIO]' : '') ||
                (message.imageMessage || message.ImageMessage ? '[IMAGE]' : '') ||
                (message.documentMessage ? '[DOCUMENT]' : '');
            const fromMe = info.FromMe || info.fromMe || false;

            const cleanPhone = senderPhone.replace('@c.us', '').replace('@s.whatsapp.net', '').split(':')[0].split('.')[0];
            logToFile(`Processing message: From=${senderPhone}, Me=${fromMe}, Body=${messageBody}`);

            const isGroup = senderPhone.includes('@g.us');
            const botDoc = await prisma.bot.findUnique({ where: { sessionName }, include: { tenant: true } });

            if (!messageBody) {
                logToFile(`Skipping: empty body.`);
                return NextResponse.json({ status: 'skipped_empty' });
            }

            // Group Filtering Logic
            if (isGroup) {
                if (!botDoc) {
                    logToFile(`Skipping group message: Bot not found for session ${sessionName}`);
                    return NextResponse.json({ status: 'skipped_no_bot' });
                }

                const mode = (botDoc as any).groupResponseMode || 'ALL';
                const allowedGroups = (botDoc as any).allowedGroups || [];

                if (mode === 'NONE') {
                    logToFile(`Skipping group message: Bot configured to ignore all groups.`);
                    return NextResponse.json({ status: 'skipped_group_none' });
                }

                if (mode === 'SPECIFIC') {
                    const isAllowed = allowedGroups.includes(senderPhone) || allowedGroups.includes(cleanPhone);
                    if (!isAllowed) {
                        logToFile(`Skipping group message: Group ${senderPhone} not in allowed list.`);
                        return NextResponse.json({ status: 'skipped_group_not_allowed' });
                    }
                }
                
                logToFile(`Proceeding with group message: Mode=${mode}`);
            }

            if (fromMe) {
                logToFile(`Skipping: own message (Human Takeover Detection)`);
                
                // Active Human Takeover: If I send a message, pause the bot for the configured time
                if (botDoc) {
                    const pauseMinutes = (botDoc as any).humanTakeoverPause || 30;
                    const pausedUntil = new Date(Date.now() + pauseMinutes * 60000);
                    
                    // Find or create conversation to apply pause
                    await prisma.conversation.upsert({
                        where: { botId_remoteId: { botId: botDoc.id, remoteId: cleanPhone } },
                        update: { pausedUntil } as any,
                        create: { botId: botDoc.id, remoteId: cleanPhone, channel: 'whatsapp', pausedUntil } as any
                    });
                    
                    logToFile(`[Webhook] Human Takeover! Pausing bot ${botDoc.name} for ${pauseMinutes}m`);
                }

                return NextResponse.json({ status: 'skipped_own' });
            }

            logToFile(`Calling MessageProcessor for ${cleanPhone} / ${sessionName}`);

            if (audioMessage) {
                logToFile(`Audio detected! URL: ${audioMessage.url || 'No URL'}`);
                // Transcribe Logic
                try {
                    const { VoiceService } = await import('@/services/engine/voice');
                    // We need to download the file first. 
                    // WuzAPI url might be internal Docker URL. 
                    // For now, assume we can fetch it or it's base64 (if provided).
                    // WuzAPI often provides a direct URL or we might need to use getMedia.

                    // Let's assume audioMessage.url is accessible.
                    // If passing URL directly to openai: openai.audio.transcriptions.create({ file: fs.createReadStream... }) requires a file.
                    // So we download to temp.

                    // WuzAPI Fix: file_url is often at the root when using S3/local storage
                    const mediaUrl = (body as any).file_url || audioMessage.url;
                    const base64Data = (body as any).base64 || (body as any).data || (audioMessage as any).base64;
                    logToFile(`Audio Candidates - file_url: ${(body as any).file_url}, audioMessage.url: ${audioMessage.url}, hasBase64: ${!!base64Data}`);

                    const tempFile = path.join(process.cwd(), 'temp_audio_' + Date.now() + '.ogg');

                    if (base64Data) {
                        logToFile(`Processing audio from base64 data...`);
                        const buffer = Buffer.from(base64Data.split(',').pop()!, 'base64');
                        fs.writeFileSync(tempFile, buffer);
                    } else if (mediaUrl) {
                        logToFile(`Downloading audio from: ${mediaUrl}`);

                        // Replace localhost with actual UZAPI_URL for Docker environments
                        let fetchUrl = mediaUrl;
                        if (fetchUrl.includes('localhost') || fetchUrl.includes('127.0.0.1')) {
                            try {
                                const urlObj = new URL(fetchUrl);
                                const uzapiUrl = new URL(process.env.UZAPI_URL || 'http://host.docker.internal:21465');
                                urlObj.protocol = uzapiUrl.protocol;
                                urlObj.hostname = uzapiUrl.hostname;
                                urlObj.port = uzapiUrl.port;
                                fetchUrl = urlObj.toString();
                            } catch (e) {
                                fetchUrl = fetchUrl.replace('localhost', 'host.docker.internal').replace(':5555', ':21465');
                            }
                        }

                        // Use fetch to download (WuzAPI file_url is usually accessible)
                        const buffer = await fetch(fetchUrl).then(r => {
                            if (!r.ok) throw new Error(`Fetch failed: ${r.statusText} (${fetchUrl})`);
                            return r.arrayBuffer();
                        });
                        fs.writeFileSync(tempFile, Buffer.from(buffer));
                    }

                    if (fs.existsSync(tempFile)) {
                        const transcription = await VoiceService.transcribe(
                            tempFile, 
                            botDoc?.tenant?.openaiApiKey || undefined,
                            botDoc?.tenant?.geminiApiKey || undefined
                        );
                        logToFile(`Transcription: ${transcription}`);

                        // Clean up
                        fs.unlinkSync(tempFile);

                        if (transcription) {
                            const { BufferingService } = await import('@/services/engine/buffering');
                            BufferingService.add(sessionName, cleanPhone, transcription, 'whatsapp', 'audio').catch(err => {
                                logToFile(`BUFFER ERROR (Audio): ${err?.message || err}`);
                            });
                        }
                    } else {
                        logToFile('Audio content missing (no URL and no base64)');
                    }
                } catch (e: any) {
                    logToFile(`Transcription Error: ${e.message}`);
                }
            } else if (message.imageMessage || message.ImageMessage || (message.documentMessage && message.documentMessage.mimetype?.startsWith('image/'))) {
                // Image Handling (including Documents that are images)
                const imageMessage = message.imageMessage || message.ImageMessage || message.documentMessage;
                const caption = imageMessage.caption || '';
                logToFile(`Image/Document detected! Caption: ${caption}, Mimetype: ${imageMessage.mimetype}`);

                try {
                    // Download Image
                    // WuzAPI Fix: file_url is often at the root when using S3/local storage
                    const mediaUrl = (body as any).file_url || imageMessage.url;
                    const base64Data = (body as any).base64 || (body as any).data || (imageMessage as any).base64;
                    logToFile(`Image Candidates - file_url: ${(body as any).file_url}, imageMessage.url: ${imageMessage.url}, hasBase64: ${!!base64Data}`);

                    const tempFile = path.join(process.cwd(), 'temp_image_' + Date.now() + '.jpg');

                    if (base64Data) {
                        logToFile(`Processing image from base64 data...`);
                        const buffer = Buffer.from(base64Data.split(',').pop()!, 'base64');
                        fs.writeFileSync(tempFile, buffer);
                    } else if (mediaUrl) {
                        // Replace localhost with actual UZAPI_URL for Docker environments
                        let fetchUrl = mediaUrl;
                        if (fetchUrl.includes('localhost') || fetchUrl.includes('127.0.0.1')) {
                            try {
                                const urlObj = new URL(fetchUrl);
                                const uzapiUrl = new URL(process.env.UZAPI_URL || 'http://host.docker.internal:21465');
                                urlObj.protocol = uzapiUrl.protocol;
                                urlObj.hostname = uzapiUrl.hostname;
                                urlObj.port = uzapiUrl.port;
                                fetchUrl = urlObj.toString();
                            } catch (e) {
                                fetchUrl = fetchUrl.replace('localhost', 'host.docker.internal').replace(':5555', ':21465');
                            }
                        }

                        const buffer = await fetch(fetchUrl).then(r => {
                            if (!r.ok) throw new Error(`Fetch failed: ${r.statusText} (${fetchUrl})`);
                            return r.arrayBuffer();
                        });
                        fs.writeFileSync(tempFile, Buffer.from(buffer));
                    }

                    if (fs.existsSync(tempFile)) {
                        logToFile(`Image content ready at ${tempFile}`);

                        // Process with Vision first, then buffer
                        const { VisionService } = await import('@/services/engine/vision');
                        const description = await VisionService.analyze(tempFile, caption, botDoc);
                        logToFile(`Image analyzed: ${description.substring(0, 100)}...`);

                        // Clean up temp file
                        fs.unlinkSync(tempFile);

                        const { BufferingService } = await import('@/services/engine/buffering');
                        BufferingService.add(sessionName, cleanPhone, description, 'whatsapp', 'image').catch(err => {
                            logToFile(`BUFFER ERROR (Image): ${err?.message || err}`);
                        });
                    } else {
                        logToFile('Image content missing');
                    }
                } catch (e: any) {
                    logToFile(`Image Process Error: ${e.message}`);
                }
            } else {
                // Text Message Handling with Smart Buffering
                try {
                    const { BufferingService } = await import('@/services/engine/buffering');
                    BufferingService.add(sessionName, cleanPhone, messageBody, 'whatsapp');
                    logToFile(`Message buffered for ${cleanPhone}`);
                } catch (e: any) {
                    logToFile(`BUFFER ERROR: ${e.message}`);
                    // Fallback to direct processing if buffering fails
                    MessageProcessor.process(sessionName, cleanPhone, messageBody).catch(err => {
                        logToFile(`PROCESSOR ERROR: ${err?.message || err}`);
                    });
                }
            }
        }

        if (eventType === 'Connected' || eventType === 'onConnected') {
            logToFile(`Status Update: CONNECTED for ${sessionName}`);
            await prisma.bot.update({
                where: { sessionName },
                data: { connectionStatus: 'CONNECTED' }
            }).catch(e => logToFile(`Failed to update status CONNECTED: ${e.message}`));
        }

        const disconnectEvents = ['Disconnected', 'onDisconnected', 'LoggedOut', 'Logout', 'Unauthorized'];
        if (disconnectEvents.includes(eventType)) {
            logToFile(`Status Update: DISCONNECTED (${eventType}) for ${sessionName}`);
            await prisma.bot.update({
                where: { sessionName },
                data: { connectionStatus: 'DISCONNECTED' }
            }).catch(e => logToFile(`Failed to update status DISCONNECTED: ${e.message}`));
        }

        return NextResponse.json({ status: 'received' });

    } catch (error: any) {
        logToFile(`WEBHOOK ERROR: ${error?.message || error}`);
        return NextResponse.json({ status: 'error' }, { status: 200 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'active', service: 'whatsapp-webhook' });
}
