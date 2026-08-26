export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MessageProcessor } from '@/services/engine/processor';
import fs from 'fs';
import path from 'path';
import os from 'os';
import prisma from '@/lib/prisma';
import { PhoneUtils } from '@/lib/phone-utils';
import { resolveMessageFromMe, resolveWhatsAppCustomerKeys, isNoiseChat } from '@/lib/whatsapp-identity';

const TEMP_DIR = os.tmpdir();

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        const token = (config as any)?.mapboxToken;
        if (!token) return `lat ${lat}, lng ${lng}`;
        const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=pt&limit=1`
        );
        if (!res.ok) return `lat ${lat}, lng ${lng}`;
        const data = await res.json();
        return data.features?.[0]?.place_name || `lat ${lat}, lng ${lng}`;
    } catch {
        return `lat ${lat}, lng ${lng}`;
    }
}

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    const logPath = process.platform === 'win32' ? path.join(process.cwd(), 'debug-today.log') : '/tmp/debug-today.log';
    try {
        fs.appendFileSync(logPath, line);
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
        // Verify webhook secret to reject spoofed requests
        const webhookSecret = process.env.UZAPI_WEBHOOK_SECRET;
        if (webhookSecret) {
            const headerToken = req.headers.get('x-webhook-token') || req.headers.get('authorization')?.replace('Bearer ', '');
            if (headerToken !== webhookSecret) {
                // Also allow token embedded in body (WuzAPI sends it there)
                const cloned = req.clone();
                const raw = await cloned.text();
                const bodyToken = (() => { try { return JSON.parse(raw)?.token; } catch { return null; } })();
                if (bodyToken !== webhookSecret) {
                    logToFile(`[Security] Rejected webhook: invalid token`);
                    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
                }
            }
        }

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

        const etLower = String(eventType || '').toLowerCase();
        if (etLower === 'undecryptablemessage') {
            logToFile(
                `UndecryptableMessage (WhatsApp E2E — não gera Message legível; nada a gravar no CRM): ${JSON.stringify(body).substring(0, 2000)}`
            );
            return NextResponse.json({ status: 'undecryptable_logged' });
        }

        // CATCH-ALL DEBUG FOR MEDIA
        if (JSON.stringify(body).includes('imageMessage') || JSON.stringify(body).includes('ImageMessage')) {
            logToFile(`[DEBUG] RAW IMAGE BODY: ${JSON.stringify(body).substring(0, 1000)}`);
        }

        if (eventType === 'Message' || eventType === 'onMessage' || eventType === 'message') {
            const eventData = body.event || body.data || body;
            const info = eventData.Info || eventData.info || {};
            const message = eventData.Message || eventData.message || {};

            const senderPhoneRaw = info.Sender || info.sender || '';
            const chatRaw = String(info.Chat || info.chat || '').trim();
            if (isNoiseChat(chatRaw)) {
                logToFile(`Skipping noise message from chat: ${chatRaw}`);
                return NextResponse.json({ status: 'skipped_noise' });
            }
            const fromMe = resolveMessageFromMe(info as Record<string, unknown>);
            const isGroup =
                chatRaw.includes('@g.us') ||
                String(senderPhoneRaw).includes('@g.us');

            const { remoteId: cleanPhone, chatJid } = resolveWhatsAppCustomerKeys({
                info: info as Record<string, unknown>,
                fromMe,
                isGroup,
            });
            // WuzAPI: audio pode vir em audioMessage OU em Info.Type=media + Info.MediaType=ptt
            const isAudioPtt = (info.Type === 'media' && info.MediaType === 'ptt') && !message.conversation && !message.extendedTextMessage?.text;
            const audioMessage = message.audioMessage || message.AudioMessage || (isAudioPtt ? { url: '' } : null);
            const messageBody = message.conversation || message.Conversation ||
                message.extendedTextMessage?.text || message.ExtendedTextMessage?.Text ||
                (audioMessage ? '[AUDIO]' : '') ||
                (message.imageMessage || message.ImageMessage ? '[IMAGE]' : '') ||
                (message.documentMessage ? '[DOCUMENT]' : '');

            logToFile(
                `Processing message: Chat=${chatRaw}, fromMe=${fromMe}, isGroup=${isGroup}, ` +
                    `resolvedRemoteId=${cleanPhone}, chatJid=${chatJid}, Body=${messageBody?.substring?.(0, 120) ?? messageBody}`
            );

            // ── Click-to-WhatsApp Ad Attribution ──────────────────────────────────────
            // Meta sends a `referral` object when a lead comes from a Click-to-WhatsApp ad.
            // WuzAPI exposes it in the message payload under message.extendedTextMessage.contextInfo
            // or directly as message.referral / body.referral.
            const referralRaw =
                message.referral ||
                message.Referral ||
                (message.extendedTextMessage as any)?.contextInfo?.externalAdReply ||
                (body as any).referral ||
                null;

            let adAttribution: Record<string, string | undefined> | undefined;
            if (referralRaw) {
                adAttribution = {
                    entrySource:  'whatsapp_ad',
                    adId:         referralRaw.source_id || referralRaw.ad_id || referralRaw.adId,
                    adName:       referralRaw.headline || referralRaw.ad_name || referralRaw.adName,
                    campaignName: referralRaw.body || referralRaw.campaign_name,
                    referrer:     referralRaw.source_url || referralRaw.source_url,
                    utmSource:    'whatsapp',
                    utmMedium:    'cpc',
                };
                logToFile(`[AdAttribution] Click-to-WhatsApp referral detected: adId=${adAttribution.adId}, ad="${adAttribution.adName}"`);
            }
            // ─────────────────────────────────────────────────────────────────────────

            // ── Location message handling ──────────────────────────────────────────
            const locationMsg = message.locationMessage || message.LocationMessage;
            if (locationMsg && !messageBody) {
                const lat: number = locationMsg.degreesLatitude ?? locationMsg.DegreesLatitude ?? 0;
                const lng: number = locationMsg.degreesLongitude ?? locationMsg.DegreesLongitude ?? 0;
                const placeName: string = locationMsg.name || locationMsg.Name || '';
                const placeAddr: string = locationMsg.address || locationMsg.Address || '';

                if (lat !== 0 || lng !== 0) {
                    (async () => {
                        try {
                            const geocoded = await reverseGeocode(lat, lng);
                            const parts = [
                                placeName && `Local: ${placeName}`,
                                placeAddr && `Endereço informado: ${placeAddr}`,
                                `Endereço pelo mapa: ${geocoded}`,
                                `Coordenadas: ${lat}, ${lng}`,
                            ].filter(Boolean);
                            const locationText = `📍 [LOCALIZAÇÃO COMPARTILHADA PELO CLIENTE]\n${parts.join('\n')}`;
                            logToFile(`Location received from ${cleanPhone}: ${locationText}`);
                            const { BufferingService } = await import('@/services/engine/buffering');
                            BufferingService.add(sessionName, cleanPhone, locationText, 'whatsapp', 'text', chatJid, adAttribution);
                        } catch (err: any) {
                            logToFile(`Location processing error: ${err.message}`);
                        }
                    })();
                    return NextResponse.json({ status: 'location_received' });
                }
            }

            if (!messageBody) {
                logToFile(`Skipping: empty body.`);
                return NextResponse.json({ status: 'skipped_empty' });
            }

            if (!cleanPhone) {
                logToFile(`Skipping: could not resolve customer remoteId from WhatsApp identities.`);
                return NextResponse.json({ status: 'skipped_no_remote_id' });
            }

            const botDoc = await prisma.bot.findUnique({ where: { sessionName }, include: { tenant: true } });
            
            // SYSTEM DISPATCH CHECK: Agency dispatch channels should NEVER respond as bots
            if (botDoc && botDoc.businessType === 'SYSTEM_DISPATCH') {
                logToFile(`Skipping: session ${sessionName} is a SYSTEM_DISPATCH channel (Agency Dispatch).`);
                return NextResponse.json({ status: 'skipped_system_dispatch' });
            }

            // Admin Commands Handling
            if (botDoc && botDoc.tenant.whatsapp) {
                const isTenantAdmin = PhoneUtils.compare(cleanPhone, botDoc.tenant.whatsapp);
                
                const cmd = messageBody.trim().toLowerCase();
                if (isTenantAdmin && (cmd === '/pausar' || cmd === '/ativar')) {
                    const newStatus = cmd === '/pausar' ? 'paused' : 'active';
                    logToFile(`Admin Command Detected: ${cmd} from ${cleanPhone}. Updating bot status to ${newStatus}`);
                    
                    await prisma.bot.update({
                        where: { id: botDoc.id },
                        data: { status: newStatus }
                    });

                    // Send confirmation message back using UzapiService
                    try {
                        const { UzapiService } = await import('@/services/engine/uzapi');
                        const msg = newStatus === 'paused' ? '⏸️ *Bot Pausado.* Não responderei mais mensagens até ser reativado.' : '▶️ *Bot Ativado.* Voltando a responder normalmente!';
                        await UzapiService.sendMessage(sessionName, cleanPhone, msg);
                    } catch (err) {
                        logToFile(`Failed to send command confirmation: ${err}`);
                    }

                    return NextResponse.json({ status: 'command_processed' });
                }
            }
            // --- MAESTRO ORCHESTRATION: Employee / Driver Routing ---
            if (botDoc) {
                const contact = await prisma.contact.findUnique({
                    where: { phone_botId: { phone: cleanPhone, botId: botDoc.id } }
                });

                if (contact && contact.contactType && contact.contactType !== 'CUSTOMER') {
                    logToFile(`Received message from Employee: ${cleanPhone} (Type: ${contact.contactType})`);
                    
                    const cmd = messageBody?.trim().toLowerCase() || '';
                    if (cmd === '1' || cmd === 'entregue' || cmd === 'finalizado' || cmd === 'concluido' || cmd === 'concluído') {
                        const { UzapiService } = await import('@/services/engine/uzapi');
                        const newJobs = Math.max(0, (contact.activeJobs || 0) - 1);
                        await prisma.contact.update({
                            where: { id: contact.id },
                            data: { activeJobs: newJobs }
                        });
                        await UzapiService.sendMessage(sessionName, cleanPhone, '✅ Serviço/Trabalho concluído com sucesso! Fila atualizada.');
                        logToFile(`Collaborator ${cleanPhone} completed job. Active jobs decremented to ${newJobs}.`);
                        return NextResponse.json({ status: 'employee_job_completed' });
                    }
                    
                    logToFile(`Skipping AI processing for employee ${cleanPhone}`);
                    return NextResponse.json({ status: 'skipped_employee' });
                }

                // AI PAUSE CHECK (Transbordo)
                if (botDoc.aiAgentStatus === 'PAUSED') {
                    logToFile(`Bot ${botDoc.name} is PAUSED for transbordo. Skipping AI processing.`);
                    // If Chatwoot integration is active, Chatwoot webhook handles human replies.
                    return NextResponse.json({ status: 'skipped_paused_bot' });
                }
            }
            // ---------------------------------------------------------

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
                    const isAllowed =
                        allowedGroups.includes(chatRaw) ||
                        allowedGroups.includes(senderPhoneRaw) ||
                        allowedGroups.includes(cleanPhone);
                    if (!isAllowed) {
                        logToFile(`Skipping group message: Group ${chatRaw} not in allowed list.`);
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
                    
                    // Upsert conversation to show human interaction in CRM
                    const conversation = await prisma.conversation.upsert({
                        where: { botId_remoteId: { botId: botDoc.id, remoteId: cleanPhone } },
                        update: { pausedUntil } as any,
                        create: { botId: botDoc.id, remoteId: cleanPhone, channel: 'whatsapp', pausedUntil } as any
                    });

                    // Log the message in CRM as 'assistant' (since it came from the business)
                    await prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            role: 'assistant',
                            content: `[HUMANO]: ${messageBody}`
                        }
                    });

                    // Update contact last active
                    await prisma.contact.updateMany({
                        where: { phone: cleanPhone, botId: botDoc.id },
                        data: { lastActive: new Date() }
                    });
                    
                    logToFile(`[Webhook] Human Takeover! Recorded message and Pausing bot ${botDoc.name} for ${pauseMinutes}m`);
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
                            BufferingService.add(sessionName, cleanPhone, transcription, 'whatsapp', 'audio', chatJid, adAttribution).catch(err => {
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
                        MessageProcessor.process(sessionName, cleanPhone, textToProcess, 'whatsapp', 'sessionName', { inputType: 'image', whatsappChatJid: chatJid, adAttribution }).catch(err => {
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
                    BufferingService.add(sessionName, cleanPhone, messageBody, 'whatsapp', 'text', chatJid, adAttribution);
                    logToFile(`Message buffered for ${cleanPhone}`);
                } catch (e: any) {
                    logToFile(`BUFFER ERROR: ${e.message}`);
                    // Fallback to direct processing if buffering fails
                    MessageProcessor.process(sessionName, cleanPhone, messageBody, 'whatsapp', 'sessionName', { inputType: 'text', whatsappChatJid: chatJid, adAttribution }).catch(err => {
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

