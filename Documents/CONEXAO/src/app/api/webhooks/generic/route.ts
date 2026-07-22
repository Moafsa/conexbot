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

        // --- Chatwoot Assignee Change / Assignment Detection ---
        if (body.event === 'conversation_updated' && body.assignee) {
            const assignee = body.assignee;
            const assigneeEmail = assignee.email || '';
            
            if (assigneeEmail.includes('@entregador.conext.bot')) {
                const driverPhone = assigneeEmail.split('@')[0].replace(/\D/g, '');
                
                const driver = await prisma.contact.findFirst({
                    where: {
                        phone: driverPhone,
                        contactType: 'DRIVER',
                        botId: bot.id
                    }
                });

                if (driver) {
                    const contactMeta = body.conversation?.meta?.sender || {};
                    const customerPhoneRaw = contactMeta.phone_number || contactMeta.identifier || '';
                    const customerPhone = customerPhoneRaw.replace(/\D/g, '');

                    if (customerPhone) {
                        const customer = await prisma.contact.findFirst({
                            where: {
                                phone: customerPhone,
                                botId: bot.id
                            }
                        });

                        const latestOrder = await prisma.order.findFirst({
                            where: {
                                contactId: customer?.id,
                                botId: bot.id,
                                status: { in: ['PENDING', 'DISPATCHED'] }
                            },
                            include: {
                                items: {
                                    include: {
                                        product: true
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            }
                        });

                        if (latestOrder) {
                            const crypto = require('crypto');
                            const token = crypto.randomBytes(16).toString('hex');
                            const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

                            await prisma.contact.update({
                                where: { id: driver.id },
                                data: {
                                    loginToken: token,
                                    loginTokenExpires: tokenExpires
                                }
                            });

                            await prisma.order.update({
                                where: { id: latestOrder.id },
                                data: {
                                    driverId: driver.id,
                                    status: 'DISPATCHED'
                                }
                            });

                            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                            const orderItemsStr = latestOrder.items.map(i => `${i.product.name} x${i.quantity}`).join(', ');
                            const customerName = customer?.name || 'Cliente Sem Nome';
                            const deliveryAddress = customer?.notes || customer?.needs || 'Endereço não especificado no CRM.';

                            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`;
                            const pwaUrl = `${appUrl}/driver?token=${token}`;

                            const dispatchMsg = `🚚 *NOVA ENTREGA ATRIBUÍDA* 🚚\n\n` +
                                `*Cliente:* ${customerName}\n` +
                                `*WhatsApp Cliente:* wa.me/${customerPhone}\n` +
                                `*Endereço:* ${deliveryAddress}\n` +
                                `*Itens:* ${orderItemsStr}\n\n` +
                                `📍 *Iniciar Rota no Google Maps:*\n${mapsUrl}\n\n` +
                                `📱 *Painel de Rastreamento (GPS):*\n${pwaUrl}\n\n` +
                                `Por favor, clique no link do painel para ativar seu GPS e iniciar a corrida.`;

                            const { sendOutboundMessageToPhone } = await import('@/services/engine/outbound-notifier');
                            await sendOutboundMessageToPhone(bot, driver.phone, dispatchMsg);
                            
                            logToFile(`[Chatwoot Assignee Webhook] Dispatched order ${latestOrder.id} to driver ${driver.name} (${driver.phone})`);
                        }
                    }
                }
            }
            return NextResponse.json({ status: 'processed_assignment' });
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
                const cleanPhone = customerPhone.replace(/\D/g, '');

                // Prevent loop: Check if this message matches a recent bot reply
                try {
                    const { getRedis } = await import('@/lib/redis');
                    const redis = getRedis();
                    const cacheKey = `last_bot_reply:${bot.id}:${cleanPhone}`;
                    const cachedReply = await redis.get(cacheKey);
                    if (cachedReply && cachedReply.trim() === messageText.trim()) {
                        logToFile(`[Generic Webhook] Ignored loop message matching cached bot reply for ${cleanPhone}`);
                        return NextResponse.json({ status: 'ignored_loop', message: 'Matches cached bot reply' });
                    }
                } catch (redisErr: any) {
                    logToFile(`[Generic Webhook] Redis check failed: ${redisErr.message}`);
                }

                logToFile(`[Generic Webhook] Chatwoot AGENT reply → WhatsApp for ${customerPhone}: "${messageText.substring(0, 80)}"`);
                // Forward the human agent's message to the customer on WhatsApp
                try {
                    const { UzapiService } = await import('@/services/engine/uzapi');
                    await UzapiService.sendMessage(bot.sessionName || '', customerPhone.replace(/\D/g, ''), messageText);

                    // Save human agent's message to database conversation history
                    try {
                        const conversation = await prisma.conversation.upsert({
                            where: { botId_remoteId: { botId: bot.id, remoteId: cleanPhone } },
                            update: { updatedAt: new Date() },
                            create: { botId: bot.id, remoteId: cleanPhone, channel: 'whatsapp' }
                        });
                        await prisma.message.create({
                            data: {
                                conversationId: conversation.id,
                                role: 'assistant',
                                content: `[HUMANO]: ${messageText}`
                            }
                        });
                    } catch (dbErr: any) {
                        logToFile(`[Generic Webhook] Failed to save human agent reply to DB: ${dbErr.message}`);
                    }

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

