import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { buildSystemPrompt, buildConversationMessages } from './prompts';
import { UzapiService } from './uzapi';
import { extractContactData, mergeContactData } from './contact-extractor';
import { chunkKnowledge, retrieveRelevantChunks } from './knowledge-rag';
import { findRelevantPrice } from '../payment/price-detector';
import { AsaasService } from '../payment/asaas';
import { SupervisorService } from './supervisor';
import { VectorService } from './vector';
import { FunnelStage } from '@prisma/client';

import fs from 'fs';
import path from 'path';

// Helper for file logging
function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'webhook-debug.log'), line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MEDIA_TAG_REGEX = /\[ENVIAR_MEDIA:([^\]]+)\]/g;
const SALE_KEYWORDS = /\b(sim|quero|fecha|confirmo|fechar|vou querer|beleza|fechado|pode ser)\b/i;
const UNCERTAIN_KEYWORDS = /\b(não sei|não tenho|não encontrei|desconheço)\b/i;

export const MessageProcessor = {
    async process(identifier: string, senderPhone: string, messageText: string, channel: 'whatsapp' | 'simulator' | 'generic' = 'whatsapp', searchBy: 'sessionName' | 'id' = 'sessionName', options: { inputType: 'text' | 'audio' | 'image', mediaPath?: string } = { inputType: 'text' }): Promise<{ text: string, media?: any[], audioPath?: string } | null> {
        try {
            logToFile(`[Processor] START: ${identifier} / ${senderPhone} / "${messageText}" / ${channel}`);

            // 1. Find bot by identifier (sessionName OR id)
            // If simulator, we might want to find by ID directly to avoid "sessionName" requirement
            const whereClause = searchBy === 'id' ? { id: identifier } : { sessionName: identifier };

            const bot = await prisma.bot.findUnique({
                where: whereClause as any, // dynamic where
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

            // 3. Find or create conversation
            const conversation = await prisma.conversation.upsert({
                where: {
                    botId_remoteId: { botId: bot.id, remoteId: senderPhone },
                },
                update: { updatedAt: new Date() },
                create: {
                    botId: bot.id,
                    remoteId: senderPhone,
                    channel: channel, // Use the actual channel
                },
            });

            // 3.5. specialized input processing
            let contentToSave = messageText;

            if (options.inputType === 'image' && options.mediaPath) {
                const { VisionService } = await import('./vision');
                try {
                    const description = await VisionService.analyze(options.mediaPath, messageText); // messageText is caption here
                    contentToSave = `[IMAGEM ENVIADA PELO USUÁRIO]\nLegenda: "${messageText}"\nDescrição da IA: ${description}`;

                    // Clean up temp image
                    // fs.unlinkSync(options.mediaPath);
                } catch (e) {
                    console.error('Vision analysis failed:', e);
                    contentToSave = `[IMAGEM ENVIADA PELO USUÁRIO]\n(Erro ao analisar imagem)`;
                }
            } else if (options.inputType === 'audio') {
                // Already transcribed, passed as messageText
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
            // 5. Get conversation history (Fetch latest 20, then reverse)
            const rawHistory = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'desc' },
                take: 20, // Limit context window to RECENT messages
                select: { role: true, content: true },
            });
            const history = rawHistory.reverse();

            // 6. CRM Extraction & Contact Management
            const contactData = extractContactData(messageText, history);
            let existingContact = await prisma.contact.findUnique({
                where: { phone_tenantId: { phone: senderPhone, tenantId: bot.tenantId } },
            });

            if (!existingContact) {
                existingContact = await prisma.contact.create({
                    data: {
                        phone: senderPhone,
                        tenantId: bot.tenantId,
                        funnelStage: 'LEAD', // Default new contact
                    },
                });
            }

            // 7. SUPERVISOR ANALYSIS (The Brain) 🧠
            const analysis = await SupervisorService.analyze(
                messageText,
                history,
                ((existingContact as any).funnelStage) || 'LEAD'
            );

            logToFile(`[Processor] SUPERVISOR: ${(existingContact as any).funnelStage} -> ${analysis.nextStage} | Score: ${analysis.leadScore} | Sentiment: ${analysis.sentiment}`);

            // Update contact intelligence & stage
            await prisma.contact.update({
                where: { id: existingContact.id },
                data: {
                    funnelStage: analysis.nextStage,
                    leadScore: analysis.leadScore,
                    sentiment: analysis.sentiment,
                    lastAiInsight: analysis.insight,
                    lastActive: new Date()
                }
            });
            (existingContact as any).funnelStage = analysis.nextStage;

            // 8. RAG: Vector Search for Context 🔍
            // Search mainly in knowledge base / scraped content embeddings
            // Note: We need to populate the VectorStore first! This assumes it's being populated.
            // Fallback to legacy chunk search if VectorStore is empty or for now merge both.

            const vectorResults = await VectorService.searchSimilar(bot.id, messageText, 3);
            const vectorContext = vectorResults.map(r => r.content).join('\n\n');

            // Legacy RAG Fallback (for immediate compatibility)
            const materialsText = bot.media.filter((m: any) => m.extractedText).map((m: any) => m.extractedText).join('\n');
            const legacyChunks = chunkKnowledge(bot.knowledgeBase, bot.scrapedContent, materialsText);
            const legacyContext = retrieveRelevantChunks(legacyChunks, messageText);

            // Product Context
            const productContext = bot.products.map(p =>
                `- ${p.name}: R$ ${p.price.toFixed(2)} (${p.stock > 0 ? 'Em estoque' : 'Esgotado'}) - ${p.description || ''}`
            ).join('\n');

            const combinedContext = [
                vectorContext,
                legacyContext,
                productContext ? `═══ CATÁLOGO DE PRODUTOS ═══\n${productContext}` : ''
            ].filter(Boolean).join('\n\n---\n\n');

            logToFile(`[Processor] RAG Context Length: ${combinedContext.length}`);

            // 9. Build Dynamic System Prompt using Supervisor Strategy
            const mediaList = bot.media.map((m: any) => ({
                id: m.id, type: m.type, description: m.description
            }));

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
                    company: existingContact.company,
                },
            });

            const supervisorInstruction = `
            \n⚠️ INSTRUÇÃO DO SUPERVISOR (PRIORIDADE MÁXIMA):
            ESTÁGIO ATUAL: ${analysis.nextStage}
            ESTRATÉGIA: ${analysis.strategy}
            MOTIVO: ${analysis.reasoning}
            
            ${SupervisorService.getStagePrompt(analysis.nextStage as FunnelStage)}
            `;

            const finalSystemPrompt = baseSystemPrompt + supervisorInstruction;

            // 10. Call OpenAI
            logToFile(`[Processor] Calling OpenAI...`);
            const messages = buildConversationMessages(finalSystemPrompt, history);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                temperature: 0.7,
                max_tokens: 500,
            });

            const aiResponse = completion.choices[0]?.message?.content?.trim() || 'Desculpe, não entendi.';
            logToFile(`[Processor] AI Response: "${aiResponse.substring(0, 50)}..."`);

            // 11. Parse & Verify Logic (Media, Payments)
            const mediaMatches = Array.from(aiResponse.matchAll(MEDIA_TAG_REGEX));
            let cleanResponse = aiResponse.replace(MEDIA_TAG_REGEX, '').trim();

            // --- PAYMENT LOGIC START ---
            // If bot enables payments and user shows intent
            if (bot.enablePayments && SALE_KEYWORDS.test(messageText)) {
                logToFile(`[Processor] Buying intent detected. Looking for product match...`);

                const { ProductSelector } = await import('./product-selector');
                const matchedProduct = ProductSelector.findProduct(messageText, bot.products);

                if (matchedProduct) {
                    logToFile(`[Processor] Product Found: ${matchedProduct.name} - R$ ${matchedProduct.price}`);

                    // Check if we need to generate a link
                    // Avoid generating if AI already sent a link or if stock is 0
                    if (matchedProduct.stock > 0) {
                        try {
                            const apiKey = bot.tenant.asaasApiKey;
                            if (apiKey) {
                                // Create Payment Link
                                const payment = await AsaasService.createPaymentLink({
                                    apiKey,
                                    customerName: existingContact.name || 'Cliente WhatsApp',
                                    customerEmail: existingContact.email || `${senderPhone}@whatsapp.com`,
                                    customerPhone: senderPhone,
                                    amount: Math.round(matchedProduct.price * 100), // cents
                                    description: `Pedido: ${matchedProduct.name} (via Conext Bot)`
                                });

                                if (payment.success && payment.url) {
                                    logToFile(`[Processor] Payment Link Generated: ${payment.url}`);

                                    // Transform localhost for Docker if needed (though Asaas returns public URLs usually)
                                    const paymentUrl = payment.url;

                                    // Create Order
                                    await prisma.order.create({
                                        data: {
                                            botId: bot.id,
                                            contactId: existingContact.id,
                                            totalAmount: matchedProduct.price,
                                            status: 'PENDING',
                                            items: {
                                                create: {
                                                    productId: matchedProduct.id,
                                                    quantity: 1,
                                                    unitPrice: matchedProduct.price
                                                }
                                            }
                                        }
                                    });

                                    // Append link to response
                                    cleanResponse += `\n\n💳 *Aqui está seu link de pagamento:* ${paymentUrl}`;

                                    // Update contact stage to DECISION or ACTION
                                    if ((existingContact as any).funnelStage !== 'ACTION') {
                                        await prisma.contact.update({
                                            where: { id: existingContact.id },
                                            data: { funnelStage: 'ACTION' }
                                        });
                                    }
                                }
                            } else {
                                logToFile(`[Processor] Tenant has no Asaas API Key.`);
                            }
                        } catch (err) {
                            console.error('Payment Generation Error:', err);
                        }
                    } else {
                        logToFile(`[Processor] Product out of stock.`);
                    }
                }
            }
            // --- PAYMENT LOGIC END ---

            // 12. Save Assistant Response
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: cleanResponse,
                    role: 'assistant',
                },
            });

            // Also add user message to Vector Store for future context memory
            // We do this asynchronously to not block response
            VectorService.addDocument(bot.id, `User: ${messageText}`, { type: 'chat_history', conversationId: conversation.id })
                .catch(e => console.error('Vector save error:', e));

            // 13. Send Reply (WuzAPI or Generic Webhook)
            if (bot.webhookUrl && bot.webhookToken && channel !== 'simulator') {
                logToFile(`[Processor] Sending reply to generic webhook: ${bot.webhookUrl}`);
                try {
                    const payload = {
                        botId: bot.id,
                        phone: senderPhone,
                        text: cleanResponse,
                        media: mediaMatches.length > 0 ? (bot.media as any[]).filter(m => mediaMatches.some(match => match[1] === m.id)) : [],
                        contactId: existingContact.id
                    };
                    await fetch(bot.webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${bot.webhookToken}`,
                            'Token': bot.webhookToken
                        },
                        body: JSON.stringify(payload)
                    });
                    logToFile(`[Processor] Generic webhook sent.`);
                } catch (err: any) {
                    logToFile(`[Processor] Generic webhook send error: ${err.message}`);
                }
            } else if (channel === 'whatsapp' && bot.sessionName) {
                // Audio Reply Logic
                if (options.inputType === 'audio') {
                    logToFile(`[Processor] Generaing Audio Reply...`);
                    const { VoiceService } = await import('./voice');
                    try {
                        const audioPath = await VoiceService.speak(cleanResponse);
                        logToFile(`[Processor] Audio generated at ${audioPath}`);

                        // Convert to Base64 for WuzAPI (since it might be on a different container/host)
                        const audioBuffer = fs.readFileSync(audioPath);
                        const audioBase64 = audioBuffer.toString('base64');
                        const dataUri = `data:audio/mpeg;base64,${audioBase64}`;

                        logToFile(`[Processor] Sending Audio to WuzAPI...`);
                        // Send as PTT (Push To Talk) - usually type 'audio' or 'voice' in WuzAPI
                        const sent = await UzapiService.sendMedia(bot.sessionName, senderPhone, 'audio', dataUri, ''); // Empty caption for audio

                        if (!sent) {
                            logToFile(`[Processor] Audio send failed. Fallback to text.`);
                            console.error('Initial audio send failed. Fallback to text.');
                            await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                        } else {
                            logToFile(`[Processor] Audio Sent Successfully!`);
                        }
                    } catch (e) {
                        logToFile(`[Processor] Audio Generation/Send Error: ${e}`);
                        console.error('Failed to send audio reply, falling back to text:', e);
                        await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                    }
                } else {
                    await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                }

                // 14. Send Media if requested
                for (const match of mediaMatches) {
                    const mediaId = match[1];
                    // Explicit cast to avoid type errors if Prisma types are strict
                    const media = (bot.media as any[]).find((m: any) => m.id === mediaId);
                    if (media) {
                        await UzapiService.sendMedia(bot.sessionName, senderPhone, media.type, media.url, media.description || media.filename);
                    }
                }
            }

            // 15. Increment usage
            if (counter) {
                await prisma.usageCounter.update({
                    where: { id: counter.id },
                    data: { messagesUsed: { increment: 1 }, },
                });
            }

            return {
                text: cleanResponse,
                media: mediaMatches.map(m => m[1])
            };

        } catch (error: any) {
            logToFile(`[Processor] ERROR: ${error?.message || error}`);
            return null;
        }
    },
};
