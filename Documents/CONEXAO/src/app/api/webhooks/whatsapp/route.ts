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

            logToFile(`Processing message: From=${senderPhone}, Me=${fromMe}, Body=${messageBody}`);

            if (!messageBody || senderPhone.includes('@g.us')) {
                logToFile(`Skipping: empty body or group. Body: ${messageBody ? 'EXISTS' : 'EMPTY'}, Group: ${senderPhone.includes('@g.us')}`);
                return NextResponse.json({ status: 'skipped' });
            }

            if (fromMe) {
                logToFile(`Skipping: own message`);
                return NextResponse.json({ status: 'skipped_own' });
            }

            const cleanPhone = senderPhone.replace('@c.us', '').replace('@s.whatsapp.net', '').split(':')[0].split('.')[0];
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
                    logToFile(`Audio Candidates - file_url: ${(body as any).file_url}, audioMessage.url: ${audioMessage.url}`);

                    if (mediaUrl) {
                        logToFile(`Downloading audio from: ${mediaUrl}`);
                        const tempFile = path.join(process.cwd(), 'temp_audio_' + Date.now() + '.ogg');

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

                        const botDoc = await prisma.bot.findUnique({ where: { sessionName }, include: { tenant: true } });
                        const transcription = await VoiceService.transcribe(tempFile, botDoc?.tenant?.openaiApiKey || undefined);
                        logToFile(`Transcription: ${transcription}`);

                        // Clean up
                        fs.unlinkSync(tempFile);

                        if (transcription) {
                            MessageProcessor.process(sessionName, cleanPhone, transcription, 'whatsapp', 'sessionName', { inputType: 'audio' }).catch(err => {
                                logToFile(`PROCESSOR ERROR (Audio): ${err?.message || err}`);
                            });
                        }
                    } else {
                        logToFile('Audio URL missing');
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
                    logToFile(`Image Candidates - file_url: ${(body as any).file_url}, imageMessage.url: ${imageMessage.url}`);

                    if (mediaUrl) {
                        const tempFile = path.join(process.cwd(), 'temp_image_' + Date.now() + '.jpg');

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
                        logToFile(`Image downloaded to ${tempFile}`);

                        // Process with Vision
                        // We pass the caption as the "text" and the image path in options
                        MessageProcessor.process(sessionName, cleanPhone, caption, 'whatsapp', 'sessionName', {
                            inputType: 'image',
                            mediaPath: tempFile
                        }).catch(err => {
                            logToFile(`PROCESSOR ERROR (Image): ${err?.message || err}`);
                        });

                    } else {
                        logToFile('Image URL missing');
                    }
                } catch (e: any) {
                    logToFile(`Image Download/Process Error: ${e.message}`);
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

        if (eventType === 'Connected') {
            logToFile(`Status Update: CONNECTED for ${sessionName}`);
            await prisma.bot.update({
                where: { sessionName },
                data: { connectionStatus: 'CONNECTED' }
            }).catch(e => logToFile(`Failed to update status CONNECTED: ${e.message}`));
        }

        if (eventType === 'Disconnected') {
            logToFile(`Status Update: DISCONNECTED for ${sessionName}`);
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
