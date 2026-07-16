import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { buildSystemPrompt, buildConversationMessages } from './prompts';
import { logToFile } from './logger';
import { deliverAssistantOutbound } from './outbound/deliver-assistant';
import { NotificationService } from '../notification/service';
import { logger } from '@/lib/logger';
import { PhoneUtils } from '@/lib/phone-utils';
import { acquireLock, releaseLock } from '@/lib/redis';
import { GoogleMeasurementService } from '../marketing/google-measurement-service';

async function detectAiMessage(text: string, bot?: any): Promise<boolean> {
    if (!text) return false;
    
    // Heuristic 1: Length (Bots often send long, structured texts)
    if (text.length > 800) return true;

    // Heuristic 2: Known Bot Phrases (Common in AI customer service)
    const botPatterns = [
        "Como posso te ajudar hoje?",
        "Eu sou uma inteligência artificial",
        "Sinto muito, não entendi",
        "Pode reformular sua pergunta?",
        "Estou aqui para auxiliar",
        "Escolha uma das opções abaixo",
        "Protocolo de atendimento:",
        "{\"action\":",
        "{\"type\":"
    ];
    
    if (botPatterns.some(pattern => text.toLowerCase().includes(pattern.toLowerCase()))) return true;

    // Heuristic 3: Excessive repetition or robotic structure
    const lines = text.split('\n');
    if (lines.length > 5 && lines.every(l => l.trim().startsWith('-') || l.trim().startsWith('•'))) return true;

    // Heuristic 4: LLM-based AI Scout (Only if enabled and heuristics are uncertain)
    if (bot?.enableAiDetection && text.length > 20) {
        try {
            logToFile(`[AI-Scout] Verificando se a mensagem é de uma IA: "${text.substring(0, 50)}..."`);
            const scoutResult = await safeChatCompletion({
                bot,
                messages: [
                    { role: 'system', content: 'Você é um detector de robôs. Analise o texto e responda APENAS "AI" se parecer uma mensagem automática/bot ou "HUMAN" se parecer uma pessoa real. Se estiver em dúvida, responda "HUMAN".' },
                    { role: 'user', content: text }
                ],
                temperature: 0,
                max_tokens: 5
            }) as any;

            const answer = (scoutResult.content || "").toUpperCase();
            if (answer.includes('AI')) {
                logToFile(`[AI-Scout] IA DETECTADA com sucesso via LLM.`);
                return true;
            }
        } catch (e: any) {
            logger.error({ err: e }, '[AI-Scout] Error processing background AI task');
        }
    }

    return false;
}
import { chunkKnowledge, retrieveRelevantChunks } from './knowledge-rag';
import { AsaasService } from '../payment/asaas';
import { SupervisorService } from './supervisor';
import { VectorService } from './vector';
import { FunnelStage } from '@prisma/client';
import { ChatwootService } from './chatwoot';
import { getAiClient, safeChatCompletion } from '@/lib/ai-provider';
import { format, addMinutes } from 'date-fns';
import { mercadoLivreTools } from './mcp/mercadolivre';

const MEDIA_TAG_REGEX = /\[ENVIAR_MEDIA:([^\]]+)\]/g;
const SALE_KEYWORDS = /\b(sim|quero|fecha|confirmo|fechar|vou querer|beleza|fechado|pode ser)\b/i;
const UNCERTAIN_KEYWORDS = /\b(não sei|não tenho|não encontrei|desconheço)\b/i;

export const MessageProcessor = {
    async process(identifier: string, senderPhoneRaw: string, messageText: string, channel: 'whatsapp' | 'simulator' | 'generic' | 'wordpress' | 'meta_whatsapp' | 'instagram' = 'whatsapp', searchBy: 'sessionName' | 'id' = 'sessionName', options: { inputType: 'text' | 'audio' | 'image', mediaPath?: string, whatsappChatJid?: string, chatwootConversationId?: number, adAttribution?: { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string; adId?: string; adsetId?: string; adName?: string; adsetName?: string; campaignId?: string; campaignName?: string; entrySource?: string; referrer?: string } } = { inputType: 'text' }): Promise<{ text: string, media?: any[], audioPath?: string } | null> {
        const senderPhone = channel === 'whatsapp' ? PhoneUtils.normalize(senderPhoneRaw) : senderPhoneRaw;
        const lockKey = `${channel}:${senderPhone}`;

        // Distributed Redis lock — survives restarts and multi-instance deploys.
        // TTL of 120s ensures lock is released even if the process crashes mid-flight.
        const MAX_WAIT_MS = 30_000;
        const POLL_MS = 500;
        const TTL_MS = 120_000;
        const deadline = Date.now() + MAX_WAIT_MS;

        while (!(await acquireLock(lockKey, TTL_MS))) {
            if (Date.now() > deadline) {
                logToFile(`[Processor] Lock timeout for ${lockKey}, proceeding anyway`);
                break;
            }
            logToFile(`[Processor] Waiting for lock: ${lockKey}`);
            await new Promise(r => setTimeout(r, POLL_MS));
        }

        try {
            return await this._executeInternal(identifier, senderPhone, messageText, channel, searchBy, options);
        } finally {
            await releaseLock(lockKey).catch(() => {});
        }
    },

    async _executeInternal(identifier: string, senderPhone: string, messageText: string, channel: 'whatsapp' | 'simulator' | 'generic' | 'wordpress' | 'meta_whatsapp' | 'instagram' = 'whatsapp', searchBy: 'sessionName' | 'id' = 'sessionName', options: { inputType: 'text' | 'audio' | 'image', mediaPath?: string, whatsappChatJid?: string, chatwootConversationId?: number, adAttribution?: { utmSource?: string; utmMedium?: string; utmCampaign?: string; utmContent?: string; utmTerm?: string; adId?: string; adsetId?: string; adName?: string; adsetName?: string; campaignId?: string; campaignName?: string; entrySource?: string; referrer?: string } } = { inputType: 'text' }): Promise<{ text: string, media?: any[], audioPath?: string } | null> {
        try {
            logToFile(`[Processor] START: ${identifier} / ${senderPhone} / "${messageText}" / ${channel}`);

            // 1. Find bot by identifier
            const whereClause = searchBy === 'id' ? { id: identifier } : { sessionName: identifier };
            const bot = await prisma.bot.findUnique({
                where: whereClause as any,
                include: {
                    tenant: { 
                        include: { 
                            subscriptions: {
                                where: { type: 'PRIMARY' },
                                take: 1,
                                include: { plan: true }
                            }, 
                            usageCounter: true,
                            agency: true,
                            managedBy: true
                        } 
                    },
                    media: true,
                    products: { 
                        where: { active: true },
                        include: { 
                            category: true,
                            addonGroups: {
                                where: { active: true },
                                include: { addons: { where: { active: true } } }
                            }
                        }
                    }
                },
            }) as any;

            if (!bot) {
                logToFile(`[Processor] Bot not found: ${identifier}`);
                return null;
            }

            // SYSTEM DISPATCH CHECK: Agency dispatch channels should NEVER respond as bots
            if (bot.businessType === 'SYSTEM_DISPATCH') {
                logToFile(`[Processor] Skipping: bot ${bot.name} is a SYSTEM_DISPATCH channel.`);
                return null;
            }

            const subscription = bot.tenant.subscriptions[0];
            const subStatus = subscription?.status;
            if (subStatus && ['PAST_DUE', 'INACTIVE', 'CANCELED'].includes(subStatus)) {
                logToFile(`[Processor] Subscription PAST_DUE or inactive for tenant ${bot.tenantId}`);
                return { text: "⚠️ O serviço deste atendente está temporariamente suspenso devido a pendências financeiras. Por favor, acesse o painel para regularizar." };
            }


            // 2. Usage limits check
            const counter = bot.tenant.usageCounter;
            
            // Auto-sync limits if there is an active/trialing subscription that has a plan
            const sub = subscription;
            if (counter && sub && (sub.status === 'ACTIVE' || sub.status === 'TRIALING' || sub.plan?.price === 0) && sub.plan) {
                if (counter.messagesLimit !== sub.plan.messageLimit) {
                    await prisma.usageCounter.update({
                        where: { id: counter.id },
                        data: { messagesLimit: sub.plan.messageLimit, botsLimit: sub.plan.botLimit }
                    });
                    counter.messagesLimit = sub.plan.messageLimit;
                    counter.botsLimit = sub.plan.botLimit;
                    logToFile(`[Processor] Limits auto-synced for tenant ${bot.tenantId} to ${sub.plan.messageLimit} msgs`);
                }
            }

            if (channel !== 'simulator' && counter && counter.messagesLimit > 0 && counter.messagesUsed >= counter.messagesLimit) {
                logToFile(`[Processor] LIMIT REACHED for tenant ${bot.tenantId}`);
                return { text: "⚠️ Desculpe, o limite de mensagens do plano deste atendente foi atingido. Por favor, entre em contato com o administrador." };
            }

            logToFile(`[Processor] Using Provider: ${bot.aiProvider || 'openai'} (with Fallback enabled)`);

            // 3. Find or create conversation (capture ad attribution on first touch)
            const adAttr = options.adAttribution;
            const conversation = await prisma.conversation.upsert({
                where: {
                    botId_remoteId: { botId: bot.id, remoteId: senderPhone },
                },
                update: { updatedAt: new Date() },
                create: {
                    botId: bot.id,
                    remoteId: senderPhone,
                    channel: channel,
                    ...(adAttr && {
                        utmSource:    adAttr.utmSource,
                        utmMedium:    adAttr.utmMedium,
                        utmCampaign:  adAttr.utmCampaign,
                        utmContent:   adAttr.utmContent,
                        adId:         adAttr.adId,
                        adName:       adAttr.adName,
                        campaignId:   adAttr.campaignId,
                        campaignName: adAttr.campaignName,
                        entrySource:  adAttr.entrySource,
                        referrer:     adAttr.referrer,
                    }),
                } as any,
            });

            // 3.1. Check if conversation is PAUSED (handoff para humano)
            if ((conversation as any).pausedUntil) {
                if ((conversation as any).pausedUntil > new Date() && channel !== 'simulator') {
                    logToFile(`[Processor] Conversation PAUSED for ${senderPhone} until ${(conversation as any).pausedUntil.toISOString()} (Silent Mode)`);
                    // SILENT MODE: Return null instead of the "atendimento humano" message to avoid bot competition
                    return null;
                } else if ((conversation as any).pausedUntil <= new Date()) {
                    logToFile(`[Processor] Conversation pausedUntil expired for ${senderPhone}. Clearing pause limit.`);
                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { pausedUntil: null } as any
                    });
                    (conversation as any).pausedUntil = null;
                }
            }

            // 3.5. Specialized input processing
            let contentToSave = messageText;
            if (options.inputType === 'image' && options.mediaPath) {
                const { VisionService } = await import('./vision');
                try {
                    const description = await VisionService.analyze(options.mediaPath, messageText, bot);
                    contentToSave = `[IMAGEM ENVIADA PELO USUÁRIO]\nLegenda: "${messageText}"\nDescrição da IA: ${description}`;
                } catch (e: any) {
                    logger.error({ err: e }, 'Vision analysis failed');
                    contentToSave = `[IMAGEM ENVIADA PELO USUÁRIO]\n(Erro ao analisar imagem)`;
                }
            } else if (options.inputType === 'audio') {
                contentToSave = `[ÁUDIO TRANSCRITO]: "${messageText}"`;
            }

            // 4. Save user message
            const savedMessage = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: contentToSave,
                    role: 'user',
                },
            });

            if (bot.status?.toLowerCase() === 'paused') {
                logToFile(`[Processor] Bot ${bot.name} is PAUSED. Message recorded. Skipping AI response.`);
                return null;
            }

            // 5. Get conversation history
            const rawHistory = await (prisma.message as any).findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: { role: true, content: true, tool_calls: true, tool_call_id: true },
            });
            const history = rawHistory.reverse();

            // 6. CRM Extraction & Contact Management
            let existingContact = await prisma.contact.findUnique({
                where: { phone_botId: { phone: senderPhone, botId: bot.id } },
                include: {
                    orders: { orderBy: { createdAt: 'desc' }, take: 5 }
                }
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
                        // Persist ad attribution so the agent sees it on every turn
                        ...(adAttr && {
                            utmSource:    adAttr.utmSource,
                            utmMedium:    adAttr.utmMedium,
                            utmCampaign:  adAttr.utmCampaign,
                            utmContent:   adAttr.utmContent,
                            utmTerm:      adAttr.utmTerm,
                            adId:         adAttr.adId,
                            adsetId:      adAttr.adsetId,
                            adName:       adAttr.adName,
                            adsetName:    adAttr.adsetName,
                            campaignId:   adAttr.campaignId,
                            campaignName: adAttr.campaignName,
                            entrySource:  adAttr.entrySource,
                        }),
                    } as any
                });

                // Server-Side Tracking for GA4
                GoogleMeasurementService.sendEvent({
                    tenantId: bot.tenantId,
                    eventName: 'generate_lead',
                    userData: { phone: senderPhone },
                    customData: {
                        lead_source: adAttr?.utmSource || channel,
                        campaign: adAttr?.utmCampaign
                    }
                }).catch(err => logToFile(`[Processor] GA4 Error (Lead): ${err?.message || err}`));
            } else if (adAttr && !(existingContact as any).entrySource) {
                // Update attribution on existing contact only if not already set (first-touch model)
                await prisma.contact.update({
                    where: { id: existingContact.id },
                    data: {
                        utmSource:    adAttr.utmSource ?? undefined,
                        utmMedium:    adAttr.utmMedium ?? undefined,
                        utmCampaign:  adAttr.utmCampaign ?? undefined,
                        utmContent:   adAttr.utmContent ?? undefined,
                        utmTerm:      adAttr.utmTerm ?? undefined,
                        adId:         adAttr.adId ?? undefined,
                        adsetId:      adAttr.adsetId ?? undefined,
                        adName:       adAttr.adName ?? undefined,
                        adsetName:    adAttr.adsetName ?? undefined,
                        campaignId:   adAttr.campaignId ?? undefined,
                        campaignName: adAttr.campaignName ?? undefined,
                        entrySource:  adAttr.entrySource ?? undefined,
                    } as any
                });
                (existingContact as any) = { ...existingContact, ...adAttr };
            }

            // 6.0. Check if contact is BLOCKED
            if ((existingContact as any).isBlocked) {
                logToFile(`[Processor] Contact BLOCKED: ${senderPhone}`);
                return null;
            }

            // --- Driver Response Checking (Intercept) ---
            if (existingContact.contactType === 'DRIVER') {
                logToFile(`[Processor] Driver response received from ${senderPhone}: "${messageText}"`);
                
                const activeOrderForDriver = await prisma.order.findFirst({
                    where: {
                        driverId: existingContact.id,
                        status: 'DISPATCHED',
                        followUpSent: true,
                        followUpResponse: null
                    },
                    include: {
                        contact: true
                    }
                });

                if (activeOrderForDriver) {
                    const textNormalized = messageText.toUpperCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                    
                    if (['SIM', 'OK', 'TUDO CERTO', 'ENTREGUE', 'FEITO', 'DEU CERTO', 'CONFIRMADO'].some(kw => textNormalized.includes(kw))) {
                        await prisma.order.update({
                            where: { id: activeOrderForDriver.id },
                            data: {
                                status: 'DELIVERED',
                                followUpResponse: 'SIM'
                            }
                        });

                        const newActiveJobs = Math.max(0, (existingContact.activeJobs || 1) - 1);
                        await prisma.contact.update({
                            where: { id: existingContact.id },
                            data: { activeJobs: newActiveJobs }
                        });

                        return {
                            text: `Obrigado pelo retorno! Entrega para o cliente *${activeOrderForDriver.contact?.name || 'Cliente'}* finalizada com sucesso no sistema. Bom trabalho! 👍`
                        };
                    } else if (['NAO', 'PROBLEMA', 'ERRO', 'FALHOU', 'NAO DEU', 'CANCELAR'].some(kw => textNormalized.includes(kw))) {
                        await prisma.order.update({
                            where: { id: activeOrderForDriver.id },
                            data: {
                                followUpResponse: 'NÃO'
                            }
                        });

                        const title = `⚠️ Problema na Entrega`;
                        const msgContent = `O motorista *${existingContact.name || 'Sem nome'}* (${senderPhone}) reportou um problema ao entregar o pedido *#${activeOrderForDriver.id.substring(0,6)}* para o cliente *${activeOrderForDriver.contact?.name || 'Cliente'}*.\n\n*Resposta do motorista:* "${messageText}"`;
                        
                        await NotificationService.alertTenant(bot.tenantId, title, msgContent, 'DELIVERY_ISSUE');

                        return {
                            text: `Entendido. Registramos que houve um problema com a entrega. Nossa equipe de suporte na central já foi notificada e entrará em contato com você em breve. Obrigado pelo retorno.`
                        };
                    } else {
                        return {
                            text: `Não entendi sua resposta. Por favor, responda com *SIM* se a entrega foi realizada com sucesso, ou *NÃO* se houve algum problema.`
                        };
                    }
                } else {
                    return {
                        text: `Olá! Seu número está cadastrado como entregador no sistema. No momento, você não tem nenhuma entrega pendente de confirmação.`
                    };
                }
            }

            // 6.0.5 AI Detection (Enhanced with LLM Scout)
            if (bot.enableAiDetection && await detectAiMessage(messageText, bot)) {
                logToFile(`[Processor] AI DETECTED from ${senderPhone}`);
                
                const action = bot.aiDetectionAction || "PAUSE";
                const title = `🤖 Possível Bot Detectado`;
                const logMessage = `O contato *${senderPhone}* parece ser uma IA. Ação tomada: *${action}*.`;

                if (action === "PAUSE") {
                    const pausedUntil = new Date(Date.now() + 24 * 60 * 60000); // 24h pause
                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { pausedUntil } as any
                    });
                } else if (action === "BLOCK") {
                    await prisma.contact.update({
                        where: { id: existingContact.id },
                        data: { isBlocked: true } as any
                    });
                }

                // Notify using triple-channel service
                await NotificationService.alertTenant(bot.tenantId, title, logMessage, 'AI_DETECTED');
                
                if (action !== "NOTIFY") return null; // Stop processing if not just notifying
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
                history as any,
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
                    assignedBotId: analysis.assignedBotId,
                    leadScore: analysis.leadScore,
                    sentiment: analysis.sentiment,
                    lastAiInsight: analysis.insight,
                    lastActive: new Date(),
                    ...(analysis.customerName && { name: analysis.customerName }),
                    ...(analysis.customerEmail && { email: analysis.customerEmail }),
                    ...(analysis.summary && { notes: analysis.summary })
                } as any
            });

            // Sincronizar o estágio classificado pela IA com o Chatwoot
            if (bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId && options.chatwootConversationId) {
                try {
                    logToFile(`[Processor] Syncing AI classified stage ${analysis.nextStage} (${analysis.nextStageId}) to Chatwoot Conversation #${options.chatwootConversationId}`);
                    await ChatwootService.updateConversationCustomAttributes(
                        bot,
                        options.chatwootConversationId,
                        { crm_stage_id: analysis.nextStageId }
                    );
                } catch (cwErr: any) {
                    logToFile(`[Processor] Failed to sync stage to Chatwoot: ${cwErr.message}`);
                }
            }

            existingContact.funnelStage = analysis.nextStage;
            (existingContact as any).assignedBotId = analysis.assignedBotId || (existingContact as any).assignedBotId;

            // 8. RAG Context (Graph RAG / Graphify active)
            const vectorResults = await VectorService.searchSimilarGraph(bot.id, messageText, 3);
            const vectorContext = vectorResults.map(r => r.content).join('\n\n');

            const materialsText = bot.media.filter((m: any) => m.extractedText).map((m: any) => m.extractedText).join('\n');
            const legacyChunks = chunkKnowledge(bot.knowledgeBase, bot.scrapedContent, materialsText);
            const legacyContext = retrieveRelevantChunks(legacyChunks, messageText);

            // Decide if we should show prices based on stage
            const hidePrices = ['GREETING', 'SAUDAÇÃO', 'SAUDACAO', 'INÍCIO', 'LEAD', 'AWARENESS', 'NOVO'].includes(analysis.nextStage.toUpperCase().trim());

            // Group products by category
            const groupedProducts: Record<string, any[]> = {};
            for (const p of bot.products) {
                const catName = p.category?.name || 'Sem Categoria';
                if (!groupedProducts[catName]) groupedProducts[catName] = [];
                groupedProducts[catName].push(p);
            }

            let productContext = "";
            for (const [catName, prods] of Object.entries(groupedProducts)) {
                productContext += `\n[CATEGORIA: ${catName.toUpperCase()}]\n`;
                for (const p of prods) {
                    const currentPrice = p.salePrice || p.price;
                    let priceMsg = "";
                    
                    if (hidePrices) {
                        priceMsg = "[Preço Oculto nesta fase para focar na qualificação]";
                    } else {
                        priceMsg = p.salePrice 
                            ? `[OFERTA] De R$ ${p.price.toFixed(2)} por R$ ${p.salePrice.toFixed(2)}` 
                            : `R$ ${p.price.toFixed(2)}`;
                    }
                    
                    const couponInfo = p.allowCoupons ? "" : " [NÃO ACEITA CUPONS]";
                    let addonsMsg = "";
                    
                    if (p.addonGroups && p.addonGroups.length > 0) {
                        addonsMsg = "\n    Adicionais disponíveis para este item:";
                        for (const group of p.addonGroups) {
                            addonsMsg += `\n      - ${group.name} (Escolha de ${group.minSelect} a ${group.maxSelect}):`;
                            for (const addon of group.addons) {
                                addonsMsg += `\n        [ID Adicional: ${addon.id}] ${addon.name} (+ R$ ${addon.price.toFixed(2)})`;
                            }
                        }
                    }

                    productContext += `  - [ID Produto: ${p.id}] ${p.name}: ${priceMsg}${couponInfo} (${p.stock > 0 ? 'Em estoque' : 'Esgotado'}) - ${p.description || ''}${addonsMsg}\n`;
                }
            }

            logToFile(`[Processor] Product Context: ${bot.products.length} products found.`);
            if (bot.products.length > 0) {
                logToFile(`[Processor] DEBUG First Product Link: ${bot.products[0].externalUrl}`);
            }

            const combinedContext = [vectorContext, legacyContext, productContext ? `═══ CATÁLOGO DE PRODUTOS ═══\n${productContext}` : ''].filter(Boolean).join('\n\n---\n\n');

            // 8.5. Coupons Context
            const activeCoupons = await prisma.coupon.findMany({
                where: { botId: bot.id, active: true },
                select: { code: true, value: true, type: true }
            });

            // 9. Prompt Building
            const mediaList = bot.media.map((m: any) => ({ id: m.id, type: m.type, description: m.description }));

            // Check if contact has an assigned specialist bot
            let activeBot = bot;
            if ((existingContact as any).assignedBotId) {
                const assignedBot = await prisma.bot.findUnique({
                    where: { id: (existingContact as any).assignedBotId },
                    include: { media: true, products: { where: { active: true } } }
                });
                if (assignedBot) {
                    logToFile(`[Processor] DELEGATED to specialist bot: ${assignedBot.name}`);
                    activeBot = assignedBot;
                }
            }

            const { mapBotToSkill } = await import('./skills');
            const specialistSkill = mapBotToSkill(activeBot);

            const baseSystemPrompt = buildSystemPrompt({
                name: activeBot.name,
                businessType: activeBot.businessType,
                address: activeBot.address,
                hours: activeBot.hours,
                paymentMethods: activeBot.paymentMethods,
                systemPrompt: activeBot.systemPrompt,
                websiteUrl: activeBot.websiteUrl || undefined,
                relevantKnowledge: combinedContext || undefined,
                mediaList: mediaList.length > 0 ? mediaList : undefined,
                isWordpress: activeBot.isWordpress,
                isMercadoLivre: !!activeBot.tenant.mlAccessToken,
                deliveryFeeType: activeBot.deliveryFeeType,
                deliveryFeeRules: activeBot.deliveryFeeRules,
                contactInfo: {
                    name: existingContact.name,
                    email: existingContact.email,
                    company: (existingContact as any).company,
                    notes: (existingContact as any).notes,
                    orders: (existingContact as any).orders,
                    // Ad attribution — enriches agent context with lead origin
                    utmSource:    (existingContact as any).utmSource,
                    utmMedium:    (existingContact as any).utmMedium,
                    utmCampaign:  (existingContact as any).utmCampaign,
                    utmContent:   (existingContact as any).utmContent,
                    adId:         (existingContact as any).adId,
                    adName:       (existingContact as any).adName,
                    adsetName:    (existingContact as any).adsetName,
                    campaignName: (existingContact as any).campaignName,
                    entrySource:  (existingContact as any).entrySource,
                },
                crmContext: {
                    insight: existingContact.lastAiInsight,
                    sentiment: existingContact.sentiment,
                    assignedRole: activeBot.name,
                    specialistSkill: specialistSkill
                },
                coupons: activeCoupons as any
            });

            const supervisorInstruction = `\n⚠️ INSTRUÇÃO DO SUPERVISOR:\nESTÁGIO ATUAL: ${analysis.nextStage}\nESTRATÉGIA: ${analysis.strategy}\n${SupervisorService.getStagePrompt(analysis.nextStage as FunnelStage)}`;
            
            let finalSystemPrompt = baseSystemPrompt + supervisorInstruction;
            
            // 9.5 REINFORCE SALES RULES AND USER PRIMACY (Absolute recency bias fix)
            finalSystemPrompt += `\n\n═════════════════════════════════════════════════════════════════════════
🚨 DIRETRIZ ESTRATÉGICA DE VENDAS:
1. FOCO TOTAL NA QUALIFICAÇÃO: Em saudações ou no início da conversa, NUNCA empurre preços ou o catálogo. Siga 100% o seu prompt de usuário.
2. PREÇOS REATIVOS: Fale de preços SOMENTE se o cliente perguntar OU se a sua estratégia (prompt) indicar o momento certo.
3. FORMATO DE ANCORAGEM: SE e QUANDO falar de preços promocionais, use: "De R$ [Original] por APENAS R$ [Promocional]".

🚨 PRIORIDADE ABSOLUTA:
${bot.systemPrompt ? `Se as instruções acima conflitarem com o seu prompt principal ("${bot.systemPrompt}"), IGNORE estas regras e SIGA RIGOROSAMENTE O SEU PROMPT (Primasia do Usuário).` : "Siga a estratégia acima."}
═════════════════════════════════════════════════════════════════════════`;

            // WordPress Custom Tone Adjustment
            if (channel === 'wordpress') {
                finalSystemPrompt += `\n\n⚠️ AMBIENTE: WordPress Community\nVocê está respondendo a um COMENTÁRIO de um leitor em um post do site.
                - Use um tom informativo, educado e semi-formal.
                - NÃO use gírias ou emojis excessivos de chat.
                - Trate o autor do comentário pelo nome (se fornecido).`;
            }

            // INJECT CURRENT DATE/TIME (Critical for scheduling)
            const now = new Date();
            const formattedDate = format(now, "eeee, dd 'de' MMMM 'de' yyyy", { locale: (await import('date-fns/locale')).ptBR });
            const formattedTime = format(now, "HH:mm");
            finalSystemPrompt += `\n\n🕒 CONTEXTO TEMPORAL:
Hoje é ${formattedDate}.
Hora atual: ${formattedTime}.
Sempre use esta referência para resolver datas como "amanhã", "próxima semana", etc.`;

            // 10. Call AI Provider with Tool Calling support
            const { SchedulingService } = await import('../scheduling/service');
            const schedulingTools: any[] = [
                {
                    type: 'function',
                    function: {
                        name: 'consultar_horarios',
                        description: 'Consulta horários disponíveis para agendamento em uma data específica.',
                        parameters: {
                            type: 'object',
                            properties: {
                                data: { type: 'string', description: 'Data no formato YYYY-MM-DD' }
                            },
                            required: ['data']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'marcar_compromisso',
                        description: 'Agenda um compromisso para o cliente.',
                        parameters: {
                            type: 'object',
                            properties: {
                                data_hora: { type: 'string', description: 'Data e hora no formato ISO (ex: 2024-03-10T14:00:00Z)' },
                                motivo: { type: 'string', description: 'O motivo ou notas sobre o que será tratado na reunião.' }
                            },
                            required: ['data_hora', 'motivo']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'chamar_humano',
                        description: 'Chama um atendente humano para assumir a conversa quando o bot não sabe responder ou o cliente solicita explicitamente.',
                        parameters: {
                            type: 'object',
                            properties: {
                                motivo: { type: 'string', description: 'O motivo pelo qual o humano está sendo chamado.' }
                            },
                            required: ['motivo']
                        }
                    }
                }
            ];

            if (bot.enablePayments) {
                schedulingTools.push({
                    type: 'function',
                    function: {
                        name: 'gerar_fatura',
                        description: 'Gera um link de pagamento ou assinatura (fatura) usando a integração Asaas do Atendente. SÓ CHAME ESTA FUNÇÃO se você JÁ souber qual o produto e tiver coletado o Nome Completo, E-mail e CPF do cliente.',
                        parameters: {
                            type: 'object',
                            properties: {
                                produto_nome: { type: 'string', description: 'O nome do produto ou plano do catálogo que o cliente quer comprar.' },
                                cliente_nome: { type: 'string', description: 'Nome completo do cliente.' },
                                cliente_email: { type: 'string', description: 'E-mail do cliente.' },
                                cliente_cpf: { type: 'string', description: 'CPF ou CNPJ do cliente.' },
                                cupom_desconto: { type: 'string', description: 'Opcional. O cupom de desconto fornecido pelo cliente.' }
                            },
                            required: ['produto_nome', 'cliente_nome', 'cliente_email', 'cliente_cpf']
                        }
                    }
                });
            }

            // --- ADVANCED CART TOOLS ---
            schedulingTools.push(
                {
                    type: 'function',
                    function: {
                        name: 'adicionar_ao_carrinho',
                        description: 'Adiciona um produto oficial do cardápio e seus adicionais escolhidos ao carrinho do cliente. USE ISTO SEMPRE que o cliente pedir um item do cardápio, para calcular o subtotal com precisão e evitar que o cliente invente preços falsos.',
                        parameters: {
                            type: 'object',
                            properties: {
                                id_produto: { type: 'string', description: 'O ID exato do produto (listado no cardápio na seção CATÁLOGO DE PRODUTOS).' },
                                quantidade: { type: 'number', description: 'A quantidade solicitada deste item.' },
                                ids_adicionais: { type: 'array', items: { type: 'string' }, description: 'Lista de IDs exatos dos adicionais que o cliente quer incluir neste item (se houver).' }
                            },
                            required: ['id_produto', 'quantidade']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'finalizar_pedido',
                        description: 'Fecha o carrinho do cliente e retorna o subtotal oficial exato (soma dos produtos, adicionais, taxa de entrega e descontos). USE ISTO quando o cliente quiser fechar o pedido, ou perguntar o total, ou quando pedir para aplicar um cupom ou calcular a tele-entrega.',
                        parameters: {
                            type: 'object',
                            properties: {
                                cupom: { type: 'string', description: 'Opcional. Código do cupom de desconto que o cliente quer usar.' },
                                bairro_entrega: { type: 'string', description: 'Opcional. Nome do bairro para calcular a tele/taxa de entrega (caso o cliente tenha pedido entrega).' }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'confirmar_pedido',
                        description: 'Salva o pedido final no banco de dados e o envia para os entregadores no painel de frota. USE ISTO SEMPRE que o cliente der o endereço completo e confirmar que quer fechar o pedido usando dinheiro, PIX ou cartão na entrega.',
                        parameters: {
                            type: 'object',
                            properties: {
                                endereco_completo: { type: 'string', description: 'O endereço de entrega completo fornecido pelo cliente (rua, número, bairro, cidade, etc.).' },
                                forma_pagamento: { type: 'string', description: 'A forma de pagamento escolhida (ex: DINHEIRO, PIX, CARTÃO DE CRÉDITO, CARTÃO DE DÉBITO).' },
                                bairro_entrega: { type: 'string', description: 'O nome do bairro do cliente para cálculo de taxa de entrega.' },
                                troco_para: { type: 'number', description: 'Opcional. Valor para o qual o cliente precisa de troco (se a forma de pagamento for dinheiro).' }
                            },
                            required: ['endereco_completo', 'forma_pagamento', 'bairro_entrega']
                        }
                    }
                }
            );

            // --- MAESTRO ORCHESTRATION: Inject Collaborator Tools ---
            schedulingTools.push(
                {
                    type: 'function',
                    function: {
                        name: 'listar_colaboradores',
                        description: 'Lista os colaboradores e prestadores de serviço disponíveis no sistema (ex: entregadores, médicos, veterinários, etc.). Retorna o nome, telefone, status e tipo de serviço.',
                        parameters: {
                            type: 'object',
                            properties: {
                                tipo: { type: 'string', description: 'Opcional. Filtro pelo tipo de colaborador (ex: DRIVER, DOCTOR, VET, etc.).' }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'despachar_servico',
                        description: 'Despacha um serviço ou pedido enviando os detalhes diretamente para o WhatsApp de um colaborador. Se não souber o telefone, passe a localidade/especialidade e o tipo para o sistema selecionar automaticamente o melhor colaborador.',
                        parameters: {
                            type: 'object',
                            properties: {
                                detalhes_servico: { type: 'string', description: 'Os detalhes do serviço (ex: endereço de entrega, itens do pedido, observações).' },
                                colaborador_telefone: { type: 'string', description: 'Opcional. O número de telefone direto do colaborador (com código de país e DDD).' },
                                localidade: { type: 'string', description: 'Opcional. Palavra-chave, bairro, cidade ou especialidade para roteamento inteligente (ex: Farroupilha).' },
                                tipo_colaborador: { type: 'string', description: 'Opcional. Tipo de profissional (ex: DRIVER, DOCTOR, VET). Default é DRIVER.' }
                            },
                            required: ['detalhes_servico']
                        }
                    }
                }
            );

            // --- INJECT MERCADO LIVRE TOOLS ---
            if (bot.tenant.mlAccessToken) {
                mercadoLivreTools.forEach(tool => {
                    schedulingTools.push({
                        type: 'function',
                        function: {
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters
                        }
                    });
                });
            }

            // 10. Call AI Provider with Tool Calling support (Loop for recursive tools)
            let aiResult: any;
            let toolIteration = 0;
            const maxToolIterations = 5;
            let handoffDone = false;

            while (toolIteration < maxToolIterations && !handoffDone) {
                const messages = buildConversationMessages(finalSystemPrompt, history as any);
                
                // FINAL HARD CONTRAINT: Inject a final system instruction AFTER the history to override any bias from previous messages
                messages.push({
                    role: 'system',
                    content: `🚨 LEMRETE: Não empurre vendas se estiver no início da conversa. Siga o fluxo de qualificação do seu criador. Use a ancoragem de preço (De X por Y) apenas se necessário nesta etapa.`
                });

                aiResult = await safeChatCompletion({
                    bot,
                    messages: messages as any[],
                    tools: schedulingTools,
                    temperature: 0.7,
                    max_tokens: 500
                }) as any;

                if (aiResult.toolCalls && aiResult.toolCalls.length > 0) {
                    logToFile(`[Processor] AI requested ${aiResult.toolCalls.length} tool calls (Iteration: ${toolIteration + 1})`);
                    
                    // 1. Save assistant message with tool_calls to DB
                    await (prisma.message as any).create({
                        data: {
                            conversationId: conversation.id,
                            role: 'assistant',
                            content: aiResult.content || "",
                            tool_calls: aiResult.toolCalls as any
                        }
                    });
                    // Add to session history for next AI calls in this loop
                    history.push({ 
                        role: 'assistant', 
                        content: aiResult.content || "", 
                        tool_calls: aiResult.toolCalls 
                    } as any);

                    // 2. Execute each tool
                    for (const toolCall of aiResult.toolCalls) {
                        const { name, arguments: argsString } = toolCall.function;
                        logToFile(`[Processor] Executing Tool: ${name} with args: ${argsString}`);
                        const args = JSON.parse(argsString);
                        
                        let toolResult = "";
                        if (name === 'consultar_horarios') {
                            try {
                                const date = new Date(args.data);
                                const slots = await (await import('../scheduling/service')).SchedulingService.getAvailableSlots(bot.id, date);
                                const libres = slots.filter(s => s.available).map(s => format(s.start, 'HH:mm')).join(', ');
                                toolResult = libres ? `Horários disponíveis em ${args.data}: ${libres}` : `Não há horários disponíveis em ${args.data}.`;
                            } catch (e: any) { toolResult = `Erro ao consultar: ${e.message}`; }
                        } else if (name === 'marcar_compromisso') {
                            try {
                                const startTime = new Date(args.data_hora);
                                const appt = await (await import('../scheduling/service')).SchedulingService.createAppointment({
                                    botId: bot.id,
                                    contactId: existingContact.id,
                                    tenantId: bot.tenantId,
                                    startTime,
                                    notes: args.motivo
                                });
                                toolResult = `Agendamento solicitado para ${format(startTime, 'dd/MM/yyyy HH:mm')}. O atendente irá confirmar em breve. ID: ${appt.id}`;
                                const scheduledStage = await prisma.crmStage.findFirst({
                                    where: { botId: bot.id, name: { contains: 'AGENDA', mode: 'insensitive' } }
                                });
                                if (scheduledStage) {
                                    await prisma.contact.update({
                                        where: { id: existingContact.id },
                                        data: { stageId: scheduledStage.id, funnelStage: scheduledStage.name }
                                    });
                                }
                            } catch (e: any) { toolResult = `Erro ao agendar: ${e.message}`; }
                        } else if (name === 'chamar_humano') {
                            try {
                                if (handoffDone) {
                                    toolResult = "Atendimento humano já solicitado. O bot está pausado e aguardando um atendente.";
                                } else {
                                    logToFile(`[Processor] Handoff requested: ${args.motivo}`);
                                    const humanStage = await prisma.crmStage.findFirst({
                                        where: { botId: bot.id, name: { contains: 'HUMAN', mode: 'insensitive' } }
                                    });
                                    const humanStageName = humanStage?.name || 'ATENDIMENTO HUMANO';
                                    await prisma.contact.update({
                                        where: { id: existingContact.id },
                                        data: {
                                            funnelStage: humanStageName,
                                            stageId: humanStage?.id || undefined,
                                            lastAiInsight: `Transbordo humano: ${args.motivo}`,
                                            lastActive: new Date(),
                                        },
                                    });
                                    // Bot silenciado por N minutos (configurável por bot.handoffPause; default 1440 = 24h)
                                    (existingContact as { funnelStage?: string }).funnelStage = humanStageName;
                                    const pauseMinutes = Number((bot as any).handoffPause ?? 1440);
                                    const pausedUntil = addMinutes(new Date(), Number.isFinite(pauseMinutes) && pauseMinutes > 0 ? pauseMinutes : 1440);
                                    await prisma.conversation.update({
                                        where: { id: conversation.id },
                                        data: { pausedUntil } as any,
                                    });
                                    const title = `🚨 Atendimento Humano Solicitado`;
                                    const message = `*${title}*\n\nO cliente *${existingContact.name || 'Sem nome'}* solicitou um humano.\n\n*Dados do Cliente:*\n- Nome: ${existingContact.name || 'Não informado'}\n- Telefone: ${senderPhone}\n- Motivo: ${args.motivo}\n- Bot: ${bot.name}`;
                                    const channels = (bot.notifyChannels?.split(',') || ['INTERNAL', 'WHATSAPP', 'EMAIL'])
                                        .map((c: string) => c.trim().toUpperCase())
                                        .filter(Boolean);
                                    const handoffDigits = ((bot as { fallbackContact?: string | null }).fallbackContact || '').replace(/\D/g, '');
                                    const whatsappNotifyTarget = handoffDigits || bot.tenant?.whatsapp || null;

                                    if (channels.includes('INTERNAL')) await NotificationService.createInternalNotification(bot.tenantId, 'HUMAN_REQUESTED', title, message);
                                    let whatsappHandoffOk = true;
                                    if (channels.includes('WHATSAPP') && whatsappNotifyTarget) {
                                        const last4 = String(whatsappNotifyTarget).replace(/\D/g, '').slice(-4);
                                        const sessionForHandoff = bot.sessionName || identifier;
                                        console.log(
                                            `[Processor] chamar_humano: WhatsApp -> ****${last4} | sessão UzAPI do bot: ${sessionForHandoff ? `"${sessionForHandoff}"` : 'VAZIO (conecte o WhatsApp deste bot)'}`
                                        );
                                        whatsappHandoffOk = await NotificationService.sendHandoffWhatsAppFromBotSession(
                                            sessionForHandoff,
                                            whatsappNotifyTarget,
                                            message
                                        );
                                        if (!whatsappHandoffOk) {
                                            console.warn(
                                                '[Processor] chamar_humano: WhatsApp ao humano falhou — use a sessão deste bot (mesmo que atende o cliente) na UzAPI.'
                                            );
                                        }
                                    } else if (channels.includes('WHATSAPP') && !whatsappNotifyTarget) {
                                        console.warn('[Processor] chamar_humano: WHATSAPP nas notificações, mas sem número — preencha "WhatsApp de Suporte" no bot ou WhatsApp no perfil da conta.');
                                        whatsappHandoffOk = false;
                                    } else if (!channels.includes('WHATSAPP')) {
                                        console.warn(
                                            `[Processor] chamar_humano: canal WHATSAPP desligado (notifyChannels="${(bot as { notifyChannels?: string }).notifyChannels || '—'}") — não envia WhatsApp ao humano.`
                                        );
                                    }
                                    {
                                        const destDigits = whatsappNotifyTarget?.replace(/\D/g, '') || '';
                                        const destMask = destDigits ? `****${destDigits.slice(-4)}` : '—';
                                        let envioLinha: string;
                                        if (!channels.includes('WHATSAPP')) {
                                            envioLinha = 'WhatsApp ao atendente: não (canal WHATSAPP desligado no bot).';
                                        } else if (!whatsappNotifyTarget) {
                                            envioLinha = 'WhatsApp ao atendente: não (sem número transbordo/perfil).';
                                        } else if (whatsappHandoffOk) {
                                            envioLinha = `WhatsApp ao atendente: enviado para ${destMask}.`;
                                        } else {
                                            envioLinha = `WhatsApp ao atendente: não entregue (destino ${destMask}; sessão UzAPI do bot ou API).`;
                                        }
                                        await prisma.message.create({
                                            data: {
                                                conversationId: conversation.id,
                                                role: 'system',
                                                content: `[Para o humano — texto enviado / previsto]\n${message}\n\n${envioLinha}`,
                                            },
                                        });
                                    }
                                    if (channels.includes('EMAIL')) await NotificationService.sendEmail(bot.tenant.email, title, message);
                                    toolResult = whatsappHandoffOk
                                        ? "Um atendente humano foi notificado e assumirá a conversa em breve. O bot foi pausado."
                                        : "Seu pedido foi registrado no painel (notificação interna). O WhatsApp ao atendente não foi entregue: verifique o número de transbordo/perfil e se este bot está conectado na UzAPI (mesma sessão do atendimento). O bot foi pausado.";
                                    handoffDone = true;
                                }
                            } catch (e: any) { toolResult = `Erro no handoff: ${e.message}`; }
                        } else if (name === 'gerar_fatura') {
                            try {
                                const asaasKey = bot.asaasApiKey || bot.tenant?.asaasApiKey;
                                if (!asaasKey) {
                                    toolResult = "ERRO: Integração de pagamentos (Asaas) não configurada no bot nem nas configurações do tenant. Use IMEDIATAMENTE a função chamar_humano com motivo 'Pagamento não configurado' para conectar o cliente com um atendente humano.";
                                } else {
                                    const { ProductSelector } = await import('./product-selector');
                                    const matchedProduct = ProductSelector.findProduct(args.produto_nome, bot.products);
                                    if (!matchedProduct) {
                                        toolResult = `Erro: Produto "${args.produto_nome}" não encontrado no catálogo. Pergunte ao cliente qual produto ele quer exatamente.`;
                                    } else if (matchedProduct.stock <= 0) {
                                        toolResult = `Erro: Produto "${args.produto_nome}" encontra-se esgotado/sem estoque. Iforme o cliente.`;
                                    } else {
                                        // Determine base price (favor salePrice)
                                        let finalPrice = matchedProduct.salePrice || matchedProduct.price;
                                        let appliedCouponId: string | null = null;
                                        let discountDetail = "";

                                        // Apply Coupon if provided
                                        if (args.cupom_desconto) {
                                            const coupon = await prisma.coupon.findUnique({
                                                where: { botId_code: { botId: bot.id, code: args.cupom_desconto.toUpperCase() } }
                                            });

                                            if (coupon && coupon.active) {
                                                if (!matchedProduct.allowCoupons) {
                                                    discountDetail = " (Este produto não permite uso de cupons)";
                                                } else {
                                                    // Check expiration
                                                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                                                    const isLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;

                                                    if (!isExpired && !isLimitReached) {
                                                        appliedCouponId = coupon.id;
                                                        const originalValue = finalPrice;
                                                        if (coupon.type === 'PERCENTAGE') {
                                                            finalPrice = finalPrice * (1 - coupon.value / 100);
                                                            discountDetail = ` (Cupom ${coupon.code}: -${coupon.value}%)`;
                                                        } else {
                                                            finalPrice = Math.max(0, finalPrice - coupon.value);
                                                            discountDetail = ` (Cupom ${coupon.code}: -R$ ${coupon.value.toFixed(2)})`;
                                                        }
                                                        
                                                        // Increment usage count
                                                        await prisma.coupon.update({
                                                            where: { id: coupon.id },
                                                            data: { usedCount: { increment: 1 } }
                                                        });
                                                    } else {
                                                        discountDetail = " (Cupom inválido ou expirado)";
                                                    }
                                                }
                                            } else {
                                                discountDetail = " (Cupom não encontrado)";
                                            }
                                        }

                                        const globalConfig = (await prisma.globalConfig.findUnique({ where: { id: 'system' } })) as any;
                                        const platformWalletId = globalConfig?.asaasWalletId;
                                        
                                        let commissionAmount = 0;
                                        if ((bot as any).userSplitValue > 0) {
                                            if ((bot as any).userSplitType === 'PERCENTAGE') commissionAmount = (finalPrice * (bot as any).userSplitValue) / 100;
                                            else commissionAmount = (bot as any).userSplitValue;
                                        }

                                        const splits = (commissionAmount > 0 && platformWalletId && platformWalletId !== bot.asaasWalletId) 
                                            ? [{ walletId: platformWalletId, fixedValue: commissionAmount }] 
                                            : undefined;
                                        
                                        let payment: any;
                                        const chargeDescription = `Pedido: ${matchedProduct.name}${discountDetail}`;
                                        // Asaas rejeita 11999999999 (simulador) como "invalid_mobilePhone". Usar número válido em testes.
                                        const phoneForAsaas = (channel === 'simulator' && senderPhone === '11999999999')
                                            ? '11987654321'
                                            : senderPhone;
                                        
                                        const cleanCpfCnpj = String(args.cliente_cpf || '').replace(/\D/g, '');
                                        
                                        if ((matchedProduct as any).type === 'RECURRING') {
                                            payment = await (await import('../payment/asaas')).AsaasService.createSubscriptionForBot({
                                                apiKey: asaasKey, customerName: args.cliente_nome, customerEmail: args.cliente_email, customerPhone: phoneForAsaas, customerCpfCnpj: cleanCpfCnpj, value: finalPrice, cycle: (matchedProduct as any).billingPeriod as any || 'MONTHLY', description: chargeDescription, splits
                                            });
                                        } else {
                                            payment = await (await import('../payment/asaas')).AsaasService.createPaymentLink({
                                                apiKey: asaasKey, customerName: args.cliente_nome, customerEmail: args.cliente_email, customerPhone: phoneForAsaas, customerCpfCnpj: cleanCpfCnpj, amount: Math.round(finalPrice * 100), description: chargeDescription, splits
                                            });
                                        }
                                        if (payment.success && payment.url) {
                                            if (existingContact) {
                                                await prisma.contact.update({
                                                    where: { id: (existingContact as any).id },
                                                    data: { leadScore: { increment: 10 }, name: existingContact.name || args.cliente_nome, email: existingContact.email || args.cliente_email }
                                                });
                                            }
                                            await prisma.order.create({
                                                data: { 
                                                    botId: bot.id, 
                                                    contactId: (existingContact as any).id, 
                                                    totalAmount: finalPrice, 
                                                    commissionAmount: commissionAmount, 
                                                    status: 'PENDING', 
                                                    externalId: payment.id, 
                                                    couponId: appliedCouponId,
                                                    items: { create: { productId: (matchedProduct as any).id, quantity: 1, unitPrice: finalPrice } } 
                                                } as any
                                            });

                                            // Server-Side Tracking for GA4 (Purchase/Order Created)
                                            GoogleMeasurementService.sendEvent({
                                                tenantId: bot.tenantId,
                                                eventName: 'purchase',
                                                userData: { 
                                                    phone: senderPhone,
                                                    email: args.cliente_email
                                                },
                                                customData: {
                                                    value: finalPrice,
                                                    currency: 'BRL',
                                                    items: [{ item_id: (matchedProduct as any).id, item_name: matchedProduct.name, price: finalPrice }]
                                                }
                                            }).catch(err => logToFile(`[Processor] GA4 Error (Purchase): ${err?.message || err}`));

                                            toolResult = `Fatura gerada com sucesso!${discountDetail} Link de pagamento: ${payment.url}. Use apenas este link e envie para o cliente para ele continuar o pagamento.`;
                                        } else {
                                            const err = (payment.error || '').toLowerCase();
                                            // Erros de validação: pedir correção ao cliente, NÃO chamar humano
                                            if (err.includes('celular') || err.includes('mobilephone') || err.includes('telefone') || err.includes('cpf') || err.includes('cnpj') || err.includes('inválido') || err.includes('invalid')) {
                                                toolResult = `ERRO de validação: ${payment.error}. Peça ao cliente que informe os dados corretos (não use chamar_humano).`;
                                            } else {
                                                toolResult = `ERRO ao gerar fatura no Asaas: ${payment.error}. Use a função chamar_humano com motivo 'Falha técnica no pagamento' para conectar o cliente com um atendente humano.`;
                                            }
                                        }
                                    }
                                }
                            } catch (e: any) { toolResult = `Erro interno ao faturar: ${e.message}`; }
                        } else if (name === 'adicionar_ao_carrinho') {
                            try {
                                const { CartService } = await import('./cart.service');
                                const cartResult = await CartService.addToCart(
                                    bot.id, 
                                    senderPhone, 
                                    args.id_produto, 
                                    args.quantidade || 1, 
                                    args.ids_adicionais || []
                                );
                                toolResult = cartResult.message;
                            } catch (e: any) {
                                toolResult = `Erro ao adicionar ao carrinho: ${e.message}`;
                            }
                        } else if (name === 'finalizar_pedido') {
                            try {
                                const { CartService } = await import('./cart.service');
                                const summary = await CartService.getCartSummary(bot.id, senderPhone);
                                if (summary.items.length === 0) {
                                    toolResult = "O carrinho está vazio. Peça para o cliente escolher produtos do catálogo primeiro.";
                                } else {
                                    let deliveryFee = 0;
                                    let deliveryMsg = "";
                                    let discountValue = 0;
                                    let discountMsg = "";

                                    // Calcula Frete (Tele)
                                    if (bot.deliveryFeeType === 'FIXED') {
                                        deliveryFee = Number(bot.deliveryFeeRules?.[0]?.value) || 0;
                                        deliveryMsg = `\nTaxa de Entrega Fixa: R$ ${deliveryFee.toFixed(2)}`;
                                    } else if (bot.deliveryFeeType === 'NEIGHBORHOOD' && args.bairro_entrega) {
                                        const rules = (bot.deliveryFeeRules as any[]) || [];
                                        const foundRule = rules.find((r: any) => 
                                            r.neighborhood?.toLowerCase() === args.bairro_entrega.toLowerCase()
                                        );
                                        if (foundRule) {
                                            deliveryFee = Number(foundRule.value) || 0;
                                            deliveryMsg = `\nTaxa de Entrega para ${args.bairro_entrega}: R$ ${deliveryFee.toFixed(2)}`;
                                        } else {
                                            deliveryMsg = `\n[Atenção] Bairro '${args.bairro_entrega}' não encontrado nas regras de entrega. Informe o cliente.`;
                                        }
                                    } else if (bot.deliveryFeeType === 'DISTANCE' || bot.deliveryFeeType === 'NEIGHBORHOOD') {
                                        deliveryMsg = `\nTaxa de Entrega a calcular (Peça o bairro/endereço do cliente para calcular exato usando a função finalizar_pedido passando o bairro)`;
                                    } else if (bot.deliveryFeeType === 'FREE') {
                                        deliveryMsg = `\nTaxa de Entrega: Grátis`;
                                    }

                                    // Aplica Cupom (Promoção/Desconto)
                                    if (args.cupom) {
                                        const coupon = await prisma.coupon.findUnique({
                                            where: { botId_code: { botId: bot.id, code: args.cupom.toUpperCase() } }
                                        });

                                        if (coupon && coupon.active) {
                                            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                                            const isLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
                                            
                                            if (!isExpired && !isLimitReached) {
                                                if (coupon.type === 'PERCENTAGE') {
                                                    discountValue = summary.total * (coupon.value / 100);
                                                    discountMsg = `\nDesconto (Cupom ${coupon.code} - ${coupon.value}%): -R$ ${discountValue.toFixed(2)}`;
                                                } else {
                                                    discountValue = coupon.value;
                                                    discountMsg = `\nDesconto (Cupom ${coupon.code}): -R$ ${discountValue.toFixed(2)}`;
                                                }
                                            } else {
                                                discountMsg = `\n[Atenção] Cupom expirado ou limite de usos atingido.`;
                                            }
                                        } else {
                                            discountMsg = `\n[Atenção] Cupom '${args.cupom}' não encontrado ou inativo.`;
                                        }
                                    }

                                    const finalTotal = Math.max(0, summary.total - discountValue) + deliveryFee;
                                    toolResult = `CARRINHO OFICIAL:\nTotal dos Itens: R$ ${summary.total.toFixed(2)}${discountMsg}${deliveryMsg}\nValor Final (Total a Pagar): R$ ${finalTotal.toFixed(2)}.\nEste é o valor oficial no banco de dados. Fale para o cliente confirmar o pedido. Se ele quiser pagar, use a função 'gerar_fatura'.`;
                                }
                            } catch (e: any) {
                                toolResult = `Erro ao visualizar o carrinho oficial: ${e.message}`;
                            }
                        } else if (name === 'confirmar_pedido') {
                            try {
                                const cart = await prisma.cart.findFirst({
                                    where: { botId: bot.id, contactPhone: senderPhone, status: 'ACTIVE' },
                                    include: { items: true }
                                });

                                if (!cart || cart.items.length === 0) {
                                    toolResult = "O carrinho está vazio. Peça para o cliente escolher produtos do catálogo primeiro.";
                                } else {
                                    const { CartService } = await import('./cart.service');
                                    const summary = await CartService.getCartSummary(bot.id, senderPhone);
                                    
                                    let deliveryFee = 0;
                                    let deliveryMsg = "";
                                    const rawBairro = args.bairro_entrega || "";

                                    // Calculate delivery fee
                                    if (bot.deliveryFeeType === 'FIXED') {
                                        deliveryFee = Number(bot.deliveryFeeRules?.[0]?.value) || 0;
                                        deliveryMsg = ` (Taxa fixa R$ ${deliveryFee.toFixed(2)})`;
                                    } else if ((bot.deliveryFeeType === 'NEIGHBORHOOD' || bot.deliveryFeeType === 'BY_NEIGHBORHOOD') && rawBairro) {
                                        const rules = (bot.deliveryFeeRules as any[]) || [];
                                        const foundRule = rules.find((r: any) => 
                                            (r.neighborhood || r.bairro || '').toLowerCase() === rawBairro.toLowerCase()
                                        );
                                        if (foundRule) {
                                            deliveryFee = Number(foundRule.value || foundRule.fee) || 0;
                                            deliveryMsg = ` (Taxa para ${rawBairro} R$ ${deliveryFee.toFixed(2)})`;
                                        }
                                    }
                                    const finalTotal = summary.total + deliveryFee;
                                    const fullAddr = args.endereco_completo || '';
                                    const payMethod = args.forma_pagamento || 'A combinar';
                                    const changeText = args.troco_para ? ` (Troco para R$ ${args.troco_para})` : '';
                                    const contactNotes = `Endereço: ${fullAddr}\nPagamento: ${payMethod}${changeText}`;

                                    const config = await prisma.globalConfig.findUnique({
                                        where: { id: 'system' }
                                    });
                                    const mapboxToken = config?.mapboxToken;

                                    let latitude: number | null = null;
                                    let longitude: number | null = null;

                                    if (mapboxToken && fullAddr) {
                                        try {
                                            const cleanAddr = fullAddr.split('\n')[0].replace('Endereço: ', '').trim();
                                            const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanAddr)}.json?access_token=${mapboxToken}&limit=1`;
                                            const geocodeRes = await fetch(geocodeUrl);
                                            if (geocodeRes.ok) {
                                                const geocodeData = await geocodeRes.json();
                                                const center = geocodeData.features?.[0]?.center;
                                                if (center) {
                                                    longitude = center[0];
                                                    latitude = center[1];
                                                }
                                            }
                                        } catch (e: any) {
                                            console.error('[confirmar_pedido] Geocoding exception:', e.message);
                                        }
                                    }

                                    // Update contact details
                                    await prisma.contact.update({
                                        where: { id: existingContact.id },
                                        data: {
                                            notes: contactNotes,
                                            needs: fullAddr,
                                            latitude,
                                            longitude
                                        }
                                    });

                                    // Transition the CRM stage to "PEDIDO CONFIRMADO"
                                    const confirmedStage = await prisma.crmStage.findFirst({
                                        where: { 
                                            pipeline: { botId: bot.id },
                                            name: { contains: 'CONFIRMADO', mode: 'insensitive' }
                                        }
                                    });
                                    if (confirmedStage) {
                                        await prisma.contact.update({
                                            where: { id: existingContact.id },
                                            data: {
                                                stageId: confirmedStage.id,
                                                funnelStage: confirmedStage.name
                                            }
                                        });
                                        if (options.chatwootConversationId) {
                                            const { ChatwootService } = await import('@/services/engine/chatwoot');
                                            await ChatwootService.updateConversationCustomAttributes(
                                                bot, options.chatwootConversationId, { crm_stage: confirmedStage.name, crm_stage_id: confirmedStage.id }
                                            ).catch(() => {});
                                        }
                                    }

                                    // Clear cart
                                    await prisma.cart.update({
                                        where: { id: cart.id },
                                        data: { status: 'COMPLETED' }
                                    });

                                    toolResult = `PEDIDO CRIADO COM SUCESSO!\nID do Pedido: ${order.id}\nValor Total: R$ ${finalTotal.toFixed(2)}${deliveryMsg}.\nForma de Pagamento: ${payMethod}.\nEndereço de Entrega: ${fullAddr}.\nO pedido já está visível para os operadores no painel de frota e entregadores. Diga ao cliente que o pedido foi confirmado com sucesso e que o entregador já está a caminho!`;
                                }
                            } catch (e: any) {
                                toolResult = `Erro ao confirmar o pedido: ${e.message}`;
                            }
                        } else if (name === 'listar_colaboradores') {
                            try {
                                const whereClause: any = { botId: bot.id, contactType: { not: 'CUSTOMER' } };
                                if (args.tipo) {
                                    whereClause.contactType = args.tipo.toUpperCase();
                                }
                                const colaboradores = await prisma.contact.findMany({
                                    where: whereClause,
                                    select: { name: true, phone: true, contactType: true, driverStatus: true }
                                });
                                if (colaboradores.length === 0) {
                                    toolResult = "Nenhum colaborador ou prestador encontrado no sistema.";
                                } else {
                                    toolResult = colaboradores.map(c => 
                                        `- ${c.name || 'Sem nome'} (${c.phone}): Tipo=${c.contactType}, Status=${(c as any).driverStatus || 'N/A'}`
                                    ).join('\n');
                                }
                            } catch (e: any) {
                                toolResult = `Erro ao listar colaboradores: ${e.message}`;
                            }
                        } else if (name === 'despachar_servico') {
                            try {
                                const { UzapiService } = await import('@/services/engine/uzapi');
                                const { ChatwootService } = await import('@/services/engine/chatwoot');
                                let finalPhone = args.colaborador_telefone;
                                let chosenName = '';
                                let bestColaborador: any = null;

                                if (!finalPhone) {
                                    const cType = (args.tipo_colaborador || 'DRIVER').toUpperCase();
                                    const allColaboradores = await prisma.contact.findMany({
                                        where: { botId: bot.id, contactType: cType }
                                    });

                                    if (allColaboradores.length === 0) {
                                        toolResult = `ERRO: Não há nenhum colaborador do tipo ${cType} cadastrado no sistema. Use IMEDIATAMENTE a função chamar_humano com o motivo 'Sem entregadores cadastrados' para transferir o cliente ao atendimento humano.`;
                                    } else {
                                        let matchedColaboradores = allColaboradores;
                                        if (args.localidade) {
                                            const loc = args.localidade.toLowerCase().trim();
                                            matchedColaboradores = allColaboradores.filter(c => {
                                                if (!c.dispatchKeywords) return false;
                                                const kwList = c.dispatchKeywords.toLowerCase().split(',').map(k => k.trim());
                                                return kwList.some(kw => kw.includes(loc) || loc.includes(kw));
                                            });
                                        }

                                        if (matchedColaboradores.length === 0) {
                                            toolResult = `ERRO: O bairro ou região "${args.localidade || ''}" está fora da nossa área de cobertura automática de entregas. Use IMEDIATAMENTE a função chamar_humano com o motivo 'Bairro fora da cobertura de entregas' para transferir o cliente ao atendimento humano, e avise-o no chat.`;
                                        } else {
                                            matchedColaboradores.sort((a, b) => (a.activeJobs || 0) - (b.activeJobs || 0));
                                            bestColaborador = matchedColaboradores[0];
                                            finalPhone = bestColaborador.phone;
                                            chosenName = bestColaborador.name || 'Sem nome';

                                            await prisma.contact.update({
                                                where: { id: bestColaborador.id },
                                                data: { activeJobs: { increment: 1 } }
                                            });
                                        }
                                    }
                                } else {
                                    const contact = await prisma.contact.findFirst({
                                        where: { botId: bot.id, phone: finalPhone }
                                    });
                                    if (contact) {
                                        bestColaborador = contact;
                                        chosenName = contact.name || 'Sem nome';
                                        await prisma.contact.update({
                                            where: { id: contact.id },
                                            data: { activeJobs: { increment: 1 } }
                                        });
                                    }
                                }

                                if (finalPhone && !toolResult) {
                                    // 1. Find latest pending order for client
                                    const latestOrder = await prisma.order.findFirst({
                                        where: {
                                            contactId: existingContact.id,
                                            botId: bot.id,
                                            status: 'PENDING'
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

                                    // 2. Generate PWA magic login token for driver
                                    const crypto = require('crypto');
                                    const token = crypto.randomBytes(16).toString('hex');
                                    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

                                    if (bestColaborador) {
                                        await prisma.contact.update({
                                            where: { id: bestColaborador.id },
                                            data: {
                                                loginToken: token,
                                                loginTokenExpires: tokenExpires
                                            }
                                        });
                                    }

                                    // 3. Link order to driver
                                    if (latestOrder && bestColaborador) {
                                        await prisma.order.update({
                                            where: { id: latestOrder.id },
                                            data: {
                                                driverId: bestColaborador.id,
                                                status: 'DISPATCHED'
                                            }
                                        });
                                    }

                                    // 4. Format delivery dispatch message with routing links
                                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                                    const customerName = existingContact.name || 'Cliente Sem Nome';
                                    const customerPhone = existingContact.phone;
                                    const deliveryAddress = args.detalhes_servico || existingContact.notes || existingContact.needs || 'Endereço não especificado';
                                    const orderItemsStr = latestOrder ? latestOrder.items.map(i => `${i.product.name} x${i.quantity}`).join(', ') : 'Itens não especificados';

                                    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`;
                                    const pwaUrl = `${appUrl}/driver?token=${token}`;

                                    const dispatchMsg = `🚚 *NOVA ENTREGA ATRIBUÍDA* 🚚\n\n` +
                                        `*Cliente:* ${customerName}\n` +
                                        `*WhatsApp Cliente:* wa.me/${customerPhone.replace(/\D/g, '')}\n` +
                                        `*Endereço:* ${deliveryAddress}\n` +
                                        `*Itens:* ${orderItemsStr}\n\n` +
                                        `📍 *Iniciar Rota no Google Maps:*\n${mapsUrl}\n\n` +
                                        `📱 *Painel de Rastreamento (GPS):*\n${pwaUrl}\n\n` +
                                        `Por favor, clique no link do painel para ativar seu GPS e iniciar a corrida.`;

                                    // 5. Send message to driver WhatsApp
                                    await UzapiService.sendMessage(bot.sessionName, finalPhone, dispatchMsg);

                                    // 6. Assign conversation to driver in Chatwoot
                                    const cwConvId = conversation?.chatwootConversationId || (conversation as any)?.chatwootConversationId || options.chatwootConversationId;
                                    if (cwConvId && bot.chatwootUrl && bot.chatwootToken) {
                                        const driverEmail = `${finalPhone}@entregador.conext.bot`;
                                        const agent = await ChatwootService.getAgentByEmail(bot, driverEmail);
                                        if (agent) {
                                            await ChatwootService.assignConversation(bot, cwConvId, agent.id);
                                            logToFile(`[Processor dispatch] Assigned Chatwoot conversation ${cwConvId} to agent ${agent.name} (${agent.id})`);
                                        }
                                    }

                                    toolResult = `Serviço despachado com sucesso para ${chosenName} (${finalPhone}). Fila de trabalhos ativos atualizada.`;
                                }
                            } catch (e: any) {
                                toolResult = `Erro ao despachar serviço: ${e.message}`;
                            }
                        } else {
                            // --- EXECUTE MERCADO LIVRE TOOLS ---
                            const mlTool = mercadoLivreTools.find(t => t.name === name);
                            if (mlTool) {
                                try {
                                    const result = await mlTool.execute(args, { tenantId: bot.tenantId, botId: bot.id });
                                    toolResult = JSON.stringify(result);
                                } catch (e: any) {
                                    toolResult = `Erro ao executar ferramenta ML: ${e.message}`;
                                }
                            }
                        }

                        logToFile(`[Processor] Tool Result [${name}]: ${toolResult.substring(0, 100)}...`);

                        // 3. Save tool result to DB and in-memory history
                        await (prisma.message as any).create({
                            data: {
                                conversationId: conversation.id,
                                role: 'tool',
                                content: toolResult,
                                tool_call_id: toolCall.id
                            }
                        });
                        history.push({ role: 'tool', content: toolResult, tool_call_id: toolCall.id } as any);
                        if (handoffDone) break;
                    }
                    toolIteration++;
                } else {
                    // No more tool calls, AI just answered textually
                    break;
                }
            }

            const aiResponse = typeof aiResult === 'string' ? aiResult : aiResult.content;

            // 11. Parse Media
            const mediaMatches = Array.from(aiResponse.matchAll(MEDIA_TAG_REGEX));
            let cleanResponse = aiResponse.replace(MEDIA_TAG_REGEX, '').trim();

            // 12. Save Assistant Final Response (only if not a tool call already handled)
            if (!aiResult.toolCalls || aiResult.toolCalls.length === 0) {
                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        content: cleanResponse,
                        role: 'assistant',
                        inputTokens: typeof aiResult === 'object' ? (aiResult.inputTokens ?? null) : null,
                        outputTokens: typeof aiResult === 'object' ? (aiResult.outputTokens ?? null) : null,
                        aiProvider: typeof aiResult === 'object' ? (aiResult.provider ?? null) : null,
                    },
                });
            }

            VectorService.addDocument(bot.id, `User: ${messageText}`, { type: 'chat_history', conversationId: conversation.id }).catch(e => logger.error({ err: e }, 'Vector save error'));

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

            // 14. Entrega por canal (WhatsApp ‖ WordPress — ver outbound/deliver-assistant.ts)
            await deliverAssistantOutbound({
                channel,
                bot,
                remoteId: senderPhone,
                cleanResponse,
                mediaMatches: mediaMatches as RegExpMatchArray[],
                options,
            });

            // 14b. Chatwoot bidirectional sync — push exchange to Chatwoot inbox (non-blocking)
            // Only for WhatsApp channel. Simulator/generic/wordpress are already in the app or handled separately.
            if (channel === 'whatsapp' && bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId && bot.chatwootInboxId) {
                ChatwootService.syncToConversation(
                    bot,
                    senderPhone,
                    (existingContact as any)?.name,
                    messageText,
                    cleanResponse,
                ).then(async (cwConvId) => {
                    if (cwConvId && conversation?.id) {
                        // Persist chatwootConversationId on our Conversation so stage sync works
                        await prisma.conversation.update({
                            where: { id: conversation.id },
                            data: { chatwootConversationId: cwConvId } as any,
                        }).catch(() => {}); // ignore if column doesn't exist yet
                        // Also sync CRM stage to Chatwoot
                        if (analysis?.nextStageId) {
                            ChatwootService.updateConversationCustomAttributes(
                                bot, cwConvId, { crm_stage: analysis.nextStage, crm_stage_id: analysis.nextStageId }
                            ).catch(() => {});
                        }
                    }
                }).catch((e: any) => logToFile(`[Processor] Chatwoot sync error: ${e.message}`));
            }

            // 15. Subscription Autonomy (Cancellation & Status)
            const CANCELLATION_KEYWORDS = /(cancelar|encerrar|parar|desistir).*(assinatura|plano|serviço|mensalidade)/i;
            const STATUS_KEYWORDS = /(status|fatura|vencimento|pagamento|como está).*(assinatura|plano|minha conta|meu pagamento)/i;

            if (CANCELLATION_KEYWORDS.test(messageText)) {
                const sub = await prisma.order.findFirst({
                    where: { contactId: (existingContact as any).id, status: 'PAID' },
                    orderBy: { createdAt: 'desc' }
                });

                if (sub && (sub as any).externalId) {
                    return {
                        text: "Entendo que deseja cancelar sua assinatura. Para sua segurança, você pode cancelar diretamente pelo link da última fatura recebida ou solicitar ao suporte técnico. Deseja que eu envie o contato do suporte?"
                    };
                }
            }

            if (STATUS_KEYWORDS.test(messageText)) {
                const lastOrder = await prisma.order.findFirst({
                    where: { contactId: (existingContact as any).id },
                    orderBy: { createdAt: 'desc' }
                });

                if (lastOrder) {
                    const statusMap: Record<string, string> = {
                        'PENDING': 'pendente',
                        'PAID': 'pago',
                        'CANCELED': 'cancelado'
                    };
                    return {
                        text: `Sua última fatura (${lastOrder.id.slice(0, 8)}) está com status: *${statusMap[lastOrder.status] || lastOrder.status}*.`
                    };
                }
            }

            // 16. Increment usage & Check thresholds (Session-based: count once per 24h per contact)
            if (channel !== 'simulator' && counter) {
                // Check if this contact has a message in the last 24h (excluding the one we just saved)
                const lastSessionMessage = await prisma.message.findFirst({
                    where: {
                        conversation: { 
                            botId: bot.id,
                            remoteId: senderPhone
                        },
                        role: 'user',
                        id: { not: savedMessage.id }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const isNewSession = !lastSessionMessage || 
                    (new Date().getTime() - new Date(lastSessionMessage.createdAt).getTime()) > 24 * 60 * 60 * 1000;

                if (isNewSession) {
                    const newUsed = counter.messagesUsed + 1;
                    await prisma.usageCounter.update({ where: { id: counter.id }, data: { messagesUsed: newUsed } });
                    logToFile(`[Processor] New Session (Atendimento) for ${senderPhone}. Usage incremented: ${newUsed}`);

                    // Threshold alerts only on new session increments
                    if (counter.messagesLimit > 0 && newUsed >= counter.messagesLimit * 0.9 && !counter.warned90) {
                        NotificationService.notifyLimit(bot.tenantId, 'warning', newUsed, counter.messagesLimit).catch(e => logger.error({ err: e }, 'Notify Error'));
                    }
                    if (counter.messagesLimit > 0 && newUsed >= counter.messagesLimit && !counter.warned100) {
                        NotificationService.notifyLimit(bot.tenantId, 'critical', newUsed, counter.messagesLimit).catch(e => logger.error({ err: e }, 'Notify Error'));
                    }
                } else {
                    logToFile(`[Processor] Existing session for ${senderPhone} (within 24h). No usage incremented.`);
                }
            }

            return { text: cleanResponse, media: mediaMatches.map((m: any) => m[1]) };

        } catch (error: any) {
            const raw = error?.message || String(error);
            console.error('[Processor] ERROR:', raw);
            logToFile(`[Processor] ERROR: ${raw}`);
            const isAiQuota =
                /429|quota|All AI providers|rate limit|exceeded|billing|Gemini API Error|insufficient|resource_exhausted/i.test(
                    raw
                );
            return {
                text: isAiQuota
                    ? 'O serviço de IA está indisponível agora (limite de uso ou quota excedida). Confira as chaves de API no painel (OpenAI / Gemini / OpenRouter) ou tente de novo em alguns minutos.'
                    : 'Erro ao processar a mensagem. Tente novamente em instantes.',
            };
        }
    },
};
