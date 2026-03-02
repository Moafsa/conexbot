import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { buildSystemPrompt, buildConversationMessages } from './prompts';
import { UzapiService } from './uzapi';
import { chunkKnowledge, retrieveRelevantChunks } from './knowledge-rag';
import { AsaasService } from '../payment/asaas';
import { SupervisorService } from './supervisor';
import { VectorService } from './vector';
import { FunnelStage } from '@prisma/client';
import { ChatwootService } from './chatwoot';
import { getAiClient, safeChatCompletion } from '@/lib/ai-provider';

import fs from 'fs';
import path from 'path';

// Helper for file logging
function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug-today.log'), line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}

const MEDIA_TAG_REGEX = /\[ENVIAR_MEDIA:([^\]]+)\]/g;
const SALE_KEYWORDS = /\b(sim|quero|fecha|confirmo|fechar|vou querer|beleza|fechado|pode ser)\b/i;
const UNCERTAIN_KEYWORDS = /\b(não sei|não tenho|não encontrei|desconheço)\b/i;

const processingLocks = new Map<string, Promise<any>>();

export const MessageProcessor = {
    async process(identifier: string, senderPhone: string, messageText: string, channel: 'whatsapp' | 'simulator' | 'generic' = 'whatsapp', searchBy: 'sessionName' | 'id' = 'sessionName', options: { inputType: 'text' | 'audio' | 'image', mediaPath?: string } = { inputType: 'text' }): Promise<{ text: string, media?: any[], audioPath?: string } | null> {
        // Concurrency Lock: prevent same phone processing parallelly
        const existingLock = processingLocks.get(senderPhone);
        if (existingLock) {
            logToFile(`[Processor] WAITING for existing lock: ${senderPhone}`);
            await existingLock;
        }

        const currentProcess = this._executeInternal(identifier, senderPhone, messageText, channel, searchBy, options);
        processingLocks.set(senderPhone, currentProcess);

        try {
            return await currentProcess;
        } finally {
            processingLocks.delete(senderPhone);
        }
    },

    async _executeInternal(identifier: string, senderPhone: string, messageText: string, channel: 'whatsapp' | 'simulator' | 'generic' = 'whatsapp', searchBy: 'sessionName' | 'id' = 'sessionName', options: { inputType: 'text' | 'audio' | 'image', mediaPath?: string } = { inputType: 'text' }): Promise<{ text: string, media?: any[], audioPath?: string } | null> {
        try {
            logToFile(`[Processor] START: ${identifier} / ${senderPhone} / "${messageText}" / ${channel}`);

            // 1. Find bot by identifier
            const whereClause = searchBy === 'id' ? { id: identifier } : { sessionName: identifier };
            const bot = await prisma.bot.findUnique({
                where: whereClause as any,
                include: {
                    tenant: { include: { subscription: true, usageCounter: true } },
                    media: true,
                    products: { where: { active: true } }
                },
            }) as any;

            if (!bot || bot.status !== 'active') {
                logToFile(`[Processor] Bot invalid or inactive: ${identifier}`);
                return null;
            }

            // 2. Usage limits check
            const counter = bot.tenant.usageCounter;
            if (counter && counter.messagesUsed >= counter.messagesLimit) {
                logToFile(`[Processor] LIMIT REACHED - Bypassing for now`);
            }

            logToFile(`[Processor] Using Provider: ${bot.aiProvider || 'openai'} (with Fallback enabled)`);

            // 3. Find or create conversation
            const conversation = await prisma.conversation.upsert({
                where: {
                    botId_remoteId: { botId: bot.id, remoteId: senderPhone },
                },
                update: { updatedAt: new Date() },
                create: {
                    botId: bot.id,
                    remoteId: senderPhone,
                    channel: channel,
                },
            });

            // 3.5. specialized input processing
            let contentToSave = messageText;
            if (options.inputType === 'image' && options.mediaPath) {
                const { VisionService } = await import('./vision');
                try {
                    const description = await VisionService.analyze(options.mediaPath, messageText, bot);
                    contentToSave = `[IMAGEM ENVIADA PELO USUÁRIO]\nLegenda: "${messageText}"\nDescrição da IA: ${description}`;
                } catch (e) {
                    console.error('Vision analysis failed:', e);
                    contentToSave = `[IMAGEM ENVIADA PELO USUÁRIO]\n(Erro ao analisar imagem)`;
                }
            } else if (options.inputType === 'audio') {
                contentToSave = `[ÁUDIO TRANSCRITO]: "${messageText}"`;
            }

            // 4. Save user message
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: contentToSave,
                    role: 'user',
                },
            });

            // 5. Get conversation history
            const rawHistory = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: { role: true, content: true },
            });
            const history = rawHistory.reverse();

            // 6. CRM Extraction & Contact Management
            let existingContact = await prisma.contact.findUnique({
                where: { phone_botId: { phone: senderPhone, botId: bot.id } }
            });

            if (!existingContact) {
                const firstStage = await prisma.crmStage.findFirst({
                    where: { botId: bot.id },
                    orderBy: { order: 'asc' }
                });

                existingContact = await prisma.contact.create({
                    data: {
                        phone: senderPhone,
                        tenantId: bot.tenantId,
                        botId: bot.id,
                        funnelStage: firstStage?.name || 'LEAD',
                        stageId: firstStage?.id,
                    } as any
                });
            }

            // 6.1. Chatwoot Integration: Fetch enriched data
            if (bot.chatwootUrl && bot.chatwootToken) {
                try {
                    logToFile(`[Processor] Chatwoot lookup for ${senderPhone}`);
                    const cwContact = await ChatwootService.getContactByPhone(bot, senderPhone);
                    if (cwContact) {
                        logToFile(`[Processor] Chatwoot contact found: ${cwContact.name}`);
                        await prisma.contact.update({
                            where: { id: existingContact.id },
                            data: {
                                name: existingContact.name || cwContact.name || cwContact.first_name,
                                email: existingContact.email || cwContact.email,
                            }
                        });
                        existingContact.name = existingContact.name || cwContact.name || cwContact.first_name;
                        existingContact.email = existingContact.email || cwContact.email;
                    }
                } catch (e: any) {
                    logToFile(`[Processor] Chatwoot Error: ${e.message}`);
                }
            }

            // 7. SUPERVISOR ANALYSIS
            const analysis = await SupervisorService.analyze(
                messageText,
                history,
                ((existingContact as any).funnelStage) || 'LEAD',
                bot.id,
                bot
            );

            logToFile(`[Processor] SUPERVISOR: ${(existingContact as any).funnelStage} -> ${analysis.nextStage}`);

            await prisma.contact.update({
                where: { id: existingContact.id },
                data: {
                    funnelStage: analysis.nextStage,
                    stageId: analysis.nextStageId,
                    leadScore: analysis.leadScore,
                    sentiment: analysis.sentiment,
                    lastAiInsight: analysis.insight,
                    lastActive: new Date(),
                    ...(analysis.customerName && { name: analysis.customerName }),
                    ...(analysis.customerEmail && { email: analysis.customerEmail }),
                    ...(analysis.summary && { notes: analysis.summary })
                }
            });
            existingContact.funnelStage = analysis.nextStage;

            // 8. RAG Context
            const vectorResults = await VectorService.searchSimilar(bot.id, messageText, 3);
            const vectorContext = vectorResults.map(r => r.content).join('\n\n');

            const materialsText = bot.media.filter((m: any) => m.extractedText).map((m: any) => m.extractedText).join('\n');
            const legacyChunks = chunkKnowledge(bot.knowledgeBase, bot.scrapedContent, materialsText);
            const legacyContext = retrieveRelevantChunks(legacyChunks, messageText);

            const productContext = bot.products.map((p: any) =>
                `- ${p.name}: R$ ${p.price.toFixed(2)} (${p.stock > 0 ? 'Em estoque' : 'Esgotado'}) - ${p.description || ''}`
            ).join('\n');

            const combinedContext = [vectorContext, legacyContext, productContext ? `═══ CATÁLOGO DE PRODUTOS ═══\n${productContext}` : ''].filter(Boolean).join('\n\n---\n\n');

            // 9. Prompt Building
            const mediaList = bot.media.map((m: any) => ({ id: m.id, type: m.type, description: m.description }));
            const baseSystemPrompt = buildSystemPrompt({
                name: bot.name,
                businessType: bot.businessType,
                address: bot.address,
                hours: bot.hours,
                paymentMethods: bot.paymentMethods,
                systemPrompt: bot.systemPrompt,
                websiteUrl: bot.websiteUrl || undefined,
                relevantKnowledge: combinedContext || undefined,
                mediaList: mediaList.length > 0 ? mediaList : undefined,
                contactInfo: {
                    name: existingContact.name,
                    email: existingContact.email,
                    company: (existingContact as any).company,
                },
            });

            const supervisorInstruction = `\n⚠️ INSTRUÇÃO DO SUPERVISOR:\nESTÁGIO ATUAL: ${analysis.nextStage}\nESTRATÉGIA: ${analysis.strategy}\n${SupervisorService.getStagePrompt(analysis.nextStage as FunnelStage)}`;
            const finalSystemPrompt = baseSystemPrompt + supervisorInstruction;

            // 10. Call AI Provider with Fallback
            const messages = buildConversationMessages(finalSystemPrompt, history);
            const aiResponse = await safeChatCompletion({
                bot,
                messages,
                temperature: 0.7,
                max_tokens: 500
            });

            // 11. Parse Media & Payments
            const mediaMatches = Array.from(aiResponse.matchAll(MEDIA_TAG_REGEX));
            let cleanResponse = aiResponse.replace(MEDIA_TAG_REGEX, '').trim();

            if (bot.enablePayments && SALE_KEYWORDS.test(messageText)) {
                const { ProductSelector } = await import('./product-selector');
                const matchedProduct = ProductSelector.findProduct(messageText, bot.products);
                if (matchedProduct && matchedProduct.stock > 0 && bot.tenant.asaasApiKey) {
                    try {
                        const payment = await AsaasService.createPaymentLink({
                            apiKey: bot.tenant.asaasApiKey,
                            customerName: existingContact.name || 'Cliente WhatsApp',
                            customerEmail: existingContact.email || `${senderPhone}@whatsapp.com`,
                            customerPhone: senderPhone,
                            amount: Math.round(matchedProduct.price * 100),
                            description: `Pedido: ${matchedProduct.name}`
                        });
                        if (payment.success && payment.url) {
                            await prisma.order.create({
                                data: {
                                    botId: bot.id,
                                    contactId: existingContact.id,
                                    totalAmount: matchedProduct.price,
                                    status: 'PENDING',
                                    items: { create: { productId: matchedProduct.id, quantity: 1, unitPrice: matchedProduct.price } }
                                }
                            });
                            cleanResponse += `\n\n💳 *Aqui está seu link de pagamento:* ${payment.url}`;
                        }
                    } catch (err) { console.error('Payment Error:', err); }
                }
            }

            // 12. Save Assistant Response
            await prisma.message.create({
                data: { conversationId: conversation.id, content: cleanResponse, role: 'assistant' },
            });

            VectorService.addDocument(bot.id, `User: ${messageText}`, { type: 'chat_history', conversationId: conversation.id }).catch(e => console.error('Vector save error:', e));

            // 13. Outbound Webhook / Middleware Notification
            if (bot.webhookUrl) {
                logToFile(`[Processor] Dispatching event to outbound webhook: ${bot.webhookUrl}`);
                const eventPayload = {
                    event: 'message_processed',
                    bot: { id: bot.id, name: bot.name },
                    contact: { id: existingContact.id, phone: senderPhone, name: existingContact.name, email: existingContact.email, stage: (existingContact as any).funnelStage },
                    incoming: { text: messageText, type: options.inputType, channel: channel },
                    response: { text: cleanResponse, media: mediaMatches.length > 0 ? (bot.media as any[]).filter(m => (mediaMatches as any[]).some(match => match[1] === m.id)) : [] },
                    timestamp: new Date().toISOString()
                };

                try {
                    const webhookResponse = await fetch(bot.webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(bot.webhookToken ? { 'Authorization': `Bearer ${bot.webhookToken}` } : {}) },
                        body: JSON.stringify(eventPayload),
                        signal: AbortSignal.timeout(5000) // 5s timeout
                    });

                    if (webhookResponse.ok) {
                        try {
                            const result = await webhookResponse.json();
                            if (result && (result.text || result.response)) {
                                const externalText = result.text || result.response;
                                logToFile(`[Processor] EXTERNAL PROCESSOR OVERRIDE: "${externalText.substring(0, 50)}"`);
                                cleanResponse = externalText;
                            }
                        } catch (jsonErr) {
                        }
                    }
                } catch (err: any) {
                    logToFile(`[Processor] Outbound Webhook/Middleware Error: ${err.message}`);
                }
            }

            // 14. Primary Channel Sending
            if (channel === 'whatsapp' && bot.sessionName) {
                if (options.inputType === 'audio') {
                    const { VoiceService } = await import('./voice');
                    try {
                        const audioPath = await VoiceService.speak(
                            cleanResponse,
                            bot.tenant?.openaiApiKey,
                            bot.tenant?.elevenLabsApiKey,
                            bot.voiceId
                        );
                        const audioBuffer = fs.readFileSync(audioPath);
                        // Ensure correct extension and mimetype for WuzAPI
                        const dataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;
                        const sent = await UzapiService.sendMedia(bot.sessionName, senderPhone, 'audio', dataUri, '');
                        if (!sent) await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                    } catch (e) {
                        await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                    }
                } else {
                    await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                }

                for (const match of mediaMatches as any[]) {
                    const media = (bot.media as any[]).find((m: any) => m.id === match[1]);
                    if (media) await UzapiService.sendMedia(bot.sessionName, senderPhone, media.type, media.url, media.description || media.filename);
                }
            }

            // 15. Increment usage
            if (counter) {
                await prisma.usageCounter.update({ where: { id: counter.id }, data: { messagesUsed: { increment: 1 } } });
            }

            return { text: cleanResponse, media: mediaMatches.map((m: any) => m[1]) };

        } catch (error: any) {
            logToFile(`[Processor] ERROR: ${error?.message || error}`);
            return null;
        }
    },
};
