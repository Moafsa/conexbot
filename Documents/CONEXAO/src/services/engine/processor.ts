import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { buildSystemPrompt, buildConversationMessages } from './prompts';
import { UzapiService } from './uzapi';
import { logToFile } from './logger';
import { NotificationService } from '../notification/service';

function detectAiMessage(text: string): boolean {
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

    return false;
}
import { chunkKnowledge, retrieveRelevantChunks } from './knowledge-rag';
import { AsaasService } from '../payment/asaas';
import { SupervisorService } from './supervisor';
import { VectorService } from './vector';
import { FunnelStage } from '@prisma/client';
import { ChatwootService } from './chatwoot';
import { getAiClient, safeChatCompletion } from '@/lib/ai-provider';
import { format } from 'date-fns';

import fs from 'fs';
import path from 'path';


const MEDIA_TAG_REGEX = /\[ENVIAR_MEDIA:([^\]]+)\]/g;
const SALE_KEYWORDS = /\b(sim|quero|fecha|confirmo|fechar|vou querer|beleza|fechado|pode ser)\b/i;
const UNCERTAIN_KEYWORDS = /\b(não sei|não tenho|não encontrei|desconheço)\b/i;

const processingLocks = new Map<string, Promise<any>>();

export const MessageProcessor = {
    async process(identifier: string, senderPhone: string, messageText: string, channel: 'whatsapp' | 'simulator' | 'generic' = 'whatsapp', searchBy: 'sessionName' | 'id' = 'sessionName', options: { inputType: 'text' | 'audio' | 'image', mediaPath?: string } = { inputType: 'text' }): Promise<{ text: string, media?: any[], audioPath?: string } | null> {
        console.log(`[Processor] DEBUG: Processing message from ${senderPhone} (V3-RECURSIVE-HACK)`);
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
                    tenant: { include: { subscription: { include: { plan: true } }, usageCounter: true } },
                    media: true,
                    products: { where: { active: true } }
                },
            }) as any;

            if (!bot || bot.status !== 'active') {
                logToFile(`[Processor] Bot invalid or inactive: ${identifier}`);
                return null;
            }

            // 2. Usage limits check
            let counter = bot.tenant.usageCounter;
            
            // Auto-sync limits if there is an active/trialing subscription that has a plan
            const sub = bot.tenant.subscription;
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

            // 3.1. Check if conversation is PAUSED
            if ((conversation as any).pausedUntil && (conversation as any).pausedUntil > new Date()) {
                logToFile(`[Processor] Conversation PAUSED for ${senderPhone} until ${(conversation as any).pausedUntil.toISOString()}`);
                return null;
            }

            // 3.5. Specialized input processing
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
            const savedMessage = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: contentToSave,
                    role: 'user',
                },
            });

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

            // 6.0. Check if contact is BLOCKED
            if ((existingContact as any).isBlocked) {
                logToFile(`[Processor] Contact BLOCKED: ${senderPhone}`);
                return null;
            }

            // 6.0.5 AI Detection
            if (bot.enableAiDetection && detectAiMessage(messageText)) {
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
            existingContact.funnelStage = analysis.nextStage;
            (existingContact as any).assignedBotId = analysis.assignedBotId || (existingContact as any).assignedBotId;

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
                contactInfo: {
                    name: existingContact.name,
                    email: existingContact.email,
                    company: (existingContact as any).company,
                },
                crmContext: {
                    insight: existingContact.lastAiInsight,
                    sentiment: existingContact.sentiment,
                    assignedRole: activeBot.name,
                    specialistSkill: specialistSkill
                }
            });

            const supervisorInstruction = `\n⚠️ INSTRUÇÃO DO SUPERVISOR:\nESTÁGIO ATUAL: ${analysis.nextStage}\nESTRATÉGIA: ${analysis.strategy}\n${SupervisorService.getStagePrompt(analysis.nextStage as FunnelStage)}`;
            const finalSystemPrompt = baseSystemPrompt + supervisorInstruction;

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
                                data_hora: { type: 'string', description: 'Data e hora no formato ISO (ex: 2024-03-10T14:00:00Z)' }
                            },
                            required: ['data_hora']
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
                                cliente_cpf: { type: 'string', description: 'CPF ou CNPJ do cliente.' }
                            },
                            required: ['produto_nome', 'cliente_nome', 'cliente_email', 'cliente_cpf']
                        }
                    }
                });
            }

            // 10. Call AI Provider with Tool Calling support (Loop for recursive tools)
            let aiResult: any;
            let toolIteration = 0;
            const maxToolIterations = 5;

            while (toolIteration < maxToolIterations) {
                const messages = buildConversationMessages(finalSystemPrompt, history as any);
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
                                    startTime
                                });
                                toolResult = `Agendamento confirmado para ${format(startTime, 'dd/MM/yyyy HH:mm')}. ID: ${appt.id}`;
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
                                logToFile(`[Processor] Handoff requested: ${args.motivo}`);
                                const humanStage = await prisma.crmStage.findFirst({
                                    where: { botId: bot.id, name: { contains: 'HUMAN', mode: 'insensitive' } }
                                });
                                await prisma.contact.update({
                                    where: { id: existingContact.id },
                                    data: { 
                                        funnelStage: humanStage?.name || 'ATENDIMENTO HUMANO',
                                        stageId: humanStage?.id || undefined
                                    }
                                });
                                const pauseMinutes = (bot as any).handoffPause || 1440;
                                const pausedUntil = new Date(Date.now() + pauseMinutes * 60000);
                                await prisma.conversation.update({
                                    where: { id: conversation.id },
                                    data: { pausedUntil } as any
                                });
                                const title = `🚨 Atendimento Humano Solicitado`;
                                const message = `O cliente *${existingContact.name || senderPhone}* solicitou um humano.\n\n*Motivo:* ${args.motivo}\n*Bot:* ${bot.name}`;
                                const channels = bot.notifyChannels?.split(',') || ['INTERNAL', 'WHATSAPP', 'EMAIL'];
                                if (channels.includes('INTERNAL')) await NotificationService.createInternalNotification(bot.tenantId, 'HUMAN_REQUESTED', title, message);
                                if (channels.includes('WHATSAPP') && bot.tenant.whatsapp) await NotificationService.sendWhatsApp(bot.tenant.whatsapp, message);
                                if (channels.includes('EMAIL')) await NotificationService.sendEmail(bot.tenant.email, title, message);
                                toolResult = "Um atendente humano foi notificado e assumirá a conversa em breve. O bot foi pausado.";
                            } catch (e: any) { toolResult = `Erro no handoff: ${e.message}`; }
                        } else if (name === 'gerar_fatura') {
                            try {
                                const asaasKey = bot.asaasApiKey || bot.tenant.asaasApiKey;
                                if (!asaasKey) {
                                    toolResult = "A loja não tem a integração com Módulo de Pagamentos configurada. Peça desculpas ao cliente.";
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
                                        
                                        if ((matchedProduct as any).type === 'RECURRING') {
                                            payment = await (await import('../payment/asaas')).AsaasService.createSubscriptionForBot({
                                                apiKey: asaasKey, customerName: args.cliente_nome, customerEmail: args.cliente_email, customerPhone: senderPhone, customerCpfCnpj: args.cliente_cpf, value: finalPrice, cycle: (matchedProduct as any).billingPeriod as any || 'MONTHLY', description: chargeDescription, splits
                                            });
                                        } else {
                                            payment = await (await import('../payment/asaas')).AsaasService.createPaymentLink({
                                                apiKey: asaasKey, customerName: args.cliente_nome, customerEmail: args.cliente_email, customerPhone: senderPhone, customerCpfCnpj: args.cliente_cpf, amount: Math.round(finalPrice * 100), description: chargeDescription, splits
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
                                            toolResult = `Fatura gerada com sucesso!${discountDetail} Link de pagamento: ${payment.url}. Use apenas este link e envie para o cliente para ele continuar o pagamento.`;
                                        } else {
                                            toolResult = `Erro ao gerar fatura no sistema do Asaas: ${payment.error}. Avise o cliente gentilmente de que houve uma falha técnica.`;
                                        }
                                    }
                                }
                            } catch (e: any) { toolResult = `Erro interno ao faturar: ${e.message}`; }
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
                    data: { conversationId: conversation.id, content: cleanResponse, role: 'assistant' },
                });
            }

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
                            (bot.tenant as any)?.elevenLabsApiKey,
                            bot.voiceId
                        );

                        const hasElevenLabs = !!(bot.tenant as any)?.elevenLabsApiKey;
                        const hasVoiceId = !!bot.voiceId;
                        logToFile(`[Processor] TTS Config: elevenLabs=${hasElevenLabs}, voiceId=${hasVoiceId}`);
                        if (!hasElevenLabs || !hasVoiceId) {
                            logToFile(`[Processor] HINT: Configure Dashboard -> Settings -> AI (ElevenLabs API Key) and Edit Bot -> Voice ID for audio replies.`);
                        }

                        const audioBuffer = fs.readFileSync(audioPath);
                        // Ensure correct extension and mimetype for WuzAPI
                        const dataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;
                        const sent = await UzapiService.sendMedia(bot.sessionName, senderPhone, 'audio', dataUri, '');

                        if (sent) {
                            logToFile(`[Processor] Audio reply sent successfully.`);
                        } else {
                            logToFile(`[Processor] sendMedia (audio) returned false; falling back to text.`);
                            await UzapiService.sendMessage(bot.sessionName, senderPhone, cleanResponse);
                        }
                    } catch (e: any) {
                        logToFile(`[Processor] TTS or send failed: ${e.message}; sending text fallback.`);
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
                        NotificationService.notifyLimit(bot.tenantId, 'warning', newUsed, counter.messagesLimit).catch(e => console.error('Notify Error:', e));
                    }
                    if (counter.messagesLimit > 0 && newUsed >= counter.messagesLimit && !counter.warned100) {
                        NotificationService.notifyLimit(bot.tenantId, 'critical', newUsed, counter.messagesLimit).catch(e => console.error('Notify Error:', e));
                    }
                } else {
                    logToFile(`[Processor] Existing session for ${senderPhone} (within 24h). No usage incremented.`);
                }
            }

            return { text: cleanResponse, media: mediaMatches.map((m: any) => m[1]) };

        } catch (error: any) {
            logToFile(`[Processor] ERROR: ${error?.message || error}`);
            return null;
        }
    },
};
