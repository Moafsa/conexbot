import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import fs from 'fs';
import path from 'path';
import os from 'os';
import prisma from '@/lib/prisma';

const TEMP_DIR = os.tmpdir();

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug-today.log'), line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
    // stdout para docker logs (áudio/debug)
    if (msg.includes('Audio') || msg.includes('downloadAudio') || msg.includes('Transcription') || msg.includes('file_url') ||
        msg.includes('Image') || msg.includes('downloadImage') || msg.includes('Vision') || msg.includes('imageMessage')) {
        console.error(`[Webhook] ${msg}`);
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
            const fileUrlFromForm = (formData.get('file_url') || formData.get('fileUrl') || formData.get('file-url')) as string;

            logToFile(`Form Data - Token/InstanceName: ${token}, file_url: ${fileUrlFromForm || 'none'}, tempDir: ${TEMP_DIR}`);
            if (jsonDataStr) {
                body = JSON.parse(jsonDataStr);
                if (fileUrlFromForm) body.file_url = fileUrlFromForm;
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
            // WuzAPI: audio pode vir em audioMessage OU em Info.Type=media + Info.MediaType=ptt
            const isAudioPtt = (info.Type === 'media' && info.MediaType === 'ptt') && !message.conversation && !message.extendedTextMessage?.text;
            const audioMessage = message.audioMessage || message.AudioMessage || (isAudioPtt ? { url: '' } : null);
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
                logToFile(`Audio detected! file_url: ${(body as any).file_url || 'none'}, audioMessage: ${!!audioMessage}`);
                // Transcribe Logic
                try {
                    const { VoiceService } = await import('@/services/engine/voice');
                    const { UzapiService } = await import('@/services/engine/uzapi');

                    const mediaUrl = (body as any).file_url || (audioMessage as any).url;
                    const base64Data = (body as any).base64 || (body as any).data || (audioMessage as any).base64;
                    logToFile(`Audio Candidates - file_url: ${(body as any).file_url}, hasBase64: ${!!base64Data}`);

                    const tempFile = path.join(TEMP_DIR, 'conexbot_audio_' + Date.now() + '.ogg');
                    let gotBuffer = false;

                    if (base64Data) {
                        logToFile(`Processing audio from base64 data...`);
                        const buffer = Buffer.from((base64Data.split(',').pop() || base64Data), 'base64');
                        fs.writeFileSync(tempFile, buffer);
                        gotBuffer = true;
                    } else if (mediaUrl) {
                        logToFile(`Downloading audio from file_url: ${mediaUrl}`);
                        let fetchUrl = mediaUrl;
                        if (fetchUrl.includes('localhost') || fetchUrl.includes('127.0.0.1')) {
                            const uzapiBase = process.env.UZAPI_URL || 'http://uzapi:8080';
                            const uzapiUrl = new URL(uzapiBase);
                            try {
                                const urlObj = new URL(fetchUrl);
                                urlObj.protocol = uzapiUrl.protocol;
                                urlObj.hostname = uzapiUrl.hostname;
                                urlObj.port = uzapiUrl.port || (uzapiUrl.protocol === 'https:' ? '443' : '80');
                                fetchUrl = urlObj.toString();
                            } catch {
                                fetchUrl = fetchUrl.replace(/localhost|127\.0\.0\.1/, 'uzapi').replace(':5555', ':8080');
                            }
                            logToFile(`Rewrote to: ${fetchUrl}`);
                        }
                        try {
                            const buffer = await fetch(fetchUrl).then(r => {
                                if (!r.ok) throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
                                return r.arrayBuffer();
                            });
                            fs.writeFileSync(tempFile, Buffer.from(buffer));
                            gotBuffer = true;
                        } catch (e: unknown) {
                            logToFile(`Fetch file_url failed: ${(e as Error).message}`);
                        }
                    }

                    // Fallback: WuzAPI não envia file_url (deleta antes do webhook). Usar /chat/downloadaudio.
                    if (!gotBuffer && ((audioMessage as any).URL || (audioMessage as any).Url)) {
                        logToFile(`No file_url - using UzapiService.downloadAudio session=${sessionName}`);
                        const buffer = await UzapiService.downloadAudio(sessionName, audioMessage as any);
                        logToFile(`downloadAudio result: ${buffer ? buffer.length + ' bytes' : 'null'}`);
                        if (buffer && buffer.length > 0) {
                            fs.writeFileSync(tempFile, buffer);
                            gotBuffer = true;
                        } else {
                            logToFile(`downloadAudio returned empty - check UZAPI_URL and token`);
                        }
                    }

                    if (gotBuffer && fs.existsSync(tempFile)) {
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
                const caption = imageMessage.caption || imageMessage.Caption || '';
                logToFile(`Image/Document detected! Caption: ${caption}, Mimetype: ${imageMessage.mimetype || imageMessage.Mimetype}`);

                try {
                    let mediaUrl = (body as any).file_url || imageMessage.url || imageMessage.URL || imageMessage.Url;
                    if (mediaUrl === 'none' || mediaUrl === 'null' || !mediaUrl || String(mediaUrl).trim() === '') mediaUrl = undefined;
                    const base64Data = (body as any).base64 || (body as any).data || (imageMessage as any).base64;
                    const hasJpegThumb = !!((imageMessage as any).JPEGThumbnail || (imageMessage as any).jpegThumbnail);
                    logToFile(`Image Candidates - file_url: ${(body as any).file_url}, mediaUrl(valid): ${!!mediaUrl}, hasBase64: ${!!base64Data}, hasJPEGThumbnail: ${hasJpegThumb}`);

                    const tempFile = path.join(TEMP_DIR, 'conexbot_image_' + Date.now() + '.jpg');
                    let gotBuffer = false;
                    const info = eventData.Info || eventData.info || {};
                    const messageId = info.ID || info.Id || '';

                    // 1. JPEGThumbnail (já no payload - JPEG válido, sem download)
                    if (!gotBuffer && ((imageMessage as any).JPEGThumbnail || (imageMessage as any).jpegThumbnail)) {
                        const thumb = (imageMessage as any).JPEGThumbnail || (imageMessage as any).jpegThumbnail;
                        try {
                            const thumbBuf = Buffer.from(thumb.includes(',') ? thumb.split(',')[1] : thumb, 'base64');
                            if (thumbBuf.length > 100) {
                                fs.writeFileSync(tempFile, thumbBuf);
                                gotBuffer = true;
                                logToFile(`Using JPEGThumbnail from payload (${thumbBuf.length} bytes)`);
                            }
                        } catch (e) {
                            logToFile(`JPEGThumbnail decode failed: ${(e as Error).message}`);
                        }
                    }

                    if (!gotBuffer && base64Data) {
                        logToFile(`Processing image from base64 data...`);
                        const buffer = Buffer.from((base64Data.split(',').pop() || base64Data), 'base64');
                        fs.writeFileSync(tempFile, buffer);
                        gotBuffer = true;
                    }
                    if (!gotBuffer && mediaUrl) {
                        let fetchUrl = mediaUrl;
                        if (fetchUrl.includes('localhost') || fetchUrl.includes('127.0.0.1')) {
                            const uzapiBase = process.env.UZAPI_URL || 'http://uzapi:8080';
                            const uzapiUrl = new URL(uzapiBase);
                            try {
                                const urlObj = new URL(fetchUrl);
                                urlObj.protocol = uzapiUrl.protocol;
                                urlObj.hostname = uzapiUrl.hostname;
                                urlObj.port = uzapiUrl.port || (uzapiUrl.protocol === 'https:' ? '443' : '80');
                                fetchUrl = urlObj.toString();
                            } catch {
                                fetchUrl = fetchUrl.replace(/localhost|127\.0\.0\.1/g, uzapiUrl.hostname).replace(/:5555/g, ':' + (uzapiUrl.port || '8080'));
                            }
                            logToFile(`Image fetch URL rewritten: ${mediaUrl} -> ${fetchUrl}`);
                        }
                        try {
                            const buffer = await fetch(fetchUrl).then(r => {
                                if (!r.ok) throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
                                return r.arrayBuffer();
                            });
                            fs.writeFileSync(tempFile, Buffer.from(buffer));
                            gotBuffer = true;
                        } catch (e: unknown) {
                            logToFile(`Fetch image file_url failed: ${(e as Error).message}`);
                        }
                    }

                    // 4. Tentar file_url do WuzAPI (files/user_X/ID.jpeg)
                    if (!gotBuffer && messageId && sessionName) {
                        const uzapiBase = process.env.UZAPI_URL || 'http://uzapi:8080';
                        const fileUrls = [
                            `${uzapiBase}/files/${sessionName}/${messageId}.jpeg`,
                            `${uzapiBase}/files/${sessionName}/${messageId}.jpg`,
                        ];
                        for (const fileUrl of fileUrls) {
                            try {
                                const r = await fetch(fileUrl);
                                if (r.ok) {
                                    const buf = Buffer.from(await r.arrayBuffer());
                                    if (buf.length > 100) {
                                        fs.writeFileSync(tempFile, buf);
                                        gotBuffer = true;
                                        logToFile(`Fetched from WuzAPI files: ${fileUrl} (${buf.length} bytes)`);
                                        break;
                                    }
                                }
                            } catch { }
                        }
                    }

                    // 5. WuzAPI /chat/downloadimage
                    if (!gotBuffer && ((imageMessage as any).URL || (imageMessage as any).Url)) {
                        logToFile(`No file_url - using UzapiService.downloadImage session=${sessionName}`);
                        const { UzapiService } = await import('@/services/engine/uzapi');
                        const buffer = await UzapiService.downloadImage(sessionName, imageMessage as any);
                        logToFile(`downloadImage result: ${buffer ? buffer.length + ' bytes' : 'null'}`);
                        if (buffer && buffer.length > 0) {
                            fs.writeFileSync(tempFile, buffer);
                            gotBuffer = true;
                        } else {
                            logToFile(`downloadImage returned empty - check UZAPI_URL and token`);
                        }
                    }

                    if (gotBuffer && fs.existsSync(tempFile)) {
                        logToFile(`Image content ready at ${tempFile} (${fs.statSync(tempFile).size} bytes)`);

                        // Process with Vision first
                        const { VisionService } = await import('@/services/engine/vision');
                        let description = await VisionService.analyze(tempFile, caption, botDoc);
                        if (!description || description.trim().length < 10) {
                            description = caption || 'O usuário enviou uma imagem. Não foi possível analisar o conteúdo.';
                            logToFile(`Vision returned empty/short - using fallback: ${description.substring(0, 50)}...`);
                        } else {
                            logToFile(`Image analyzed: ${description.substring(0, 100)}...`);
                        }

                        // Clean up temp file
                        fs.unlinkSync(tempFile);

                        // Passar direto ao Processor (evita race com buffer que recebia "")
                        const textToProcess = `[IMAGEM ENVIADA PELO USUÁRIO (Descrição)]: ${description}`;
                        logToFile(`Sending image description (${textToProcess.length} chars) to Processor for ${cleanPhone}`);
                        MessageProcessor.process(sessionName, cleanPhone, textToProcess, 'whatsapp', 'sessionName', { inputType: 'image' }).catch(err => {
                            logToFile(`PROCESSOR ERROR (Image): ${err?.message || err}`);
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
