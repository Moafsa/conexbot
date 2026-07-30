/**
 * ORDER AGENT — Agente dedicado exclusivamente ao gerenciamento de pedidos.
 *
 * Responsabilidades:
 * - Recebe contexto limpo (catálogo + carrinho + endereços salvos)
 * - Usa ferramentas estruturadas para ANOTAR o pedido no banco de dados
 * - NUNCA interpreta quantidades ou endereços via regex no histórico
 * - NUNCA cria o Order diretamente — só prepara o Cart
 *
 * O fluxo é:
 * 1. adicionar_item   → adiciona produto ao CartItem com quantidade exata
 * 2. definir_endereco → valida Mapbox + salva no Cart + salva em ContactAddress
 * 3. definir_pagamento → salva forma de pagamento no Cart
 * 4. ver_carrinho      → retorna estado atual para o agente confirmar com cliente
 * 5. fechar_pedido     → converte Cart → Order (só com Cart completo)
 */

import { safeChatCompletion } from '@/lib/ai-provider';
import { CartService } from './cart.service';
import prisma from '@/lib/prisma';

// ─── Tool Definitions for the Order Agent LLM ─────────────────────────────

const ORDER_AGENT_TOOLS = [
    {
        type: 'function' as const,
        function: {
            name: 'adicionar_item',
            description: 'Adiciona um produto ao carrinho com quantidade exata informada pelo cliente. Use o produto mais próximo do catálogo. NUNCA deduza a quantidade — use exatamente o número que o cliente disse.',
            parameters: {
                type: 'object',
                properties: {
                    produto_id: {
                        type: 'string',
                        description: 'ID do produto no catálogo (use os IDs fornecidos no contexto)'
                    },
                    quantidade: {
                        type: 'number',
                        description: 'Quantidade exata que o cliente pediu. NUNCA use número de casa ou CEP como quantidade.'
                    }
                },
                required: ['produto_id', 'quantidade']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'definir_endereco',
            description: 'Define o endereço de entrega do carrinho. Só chame quando o cliente fornecer rua e número. NUNCA chame apenas com nome de bairro.',
            parameters: {
                type: 'object',
                properties: {
                    rua_numero: {
                        type: 'string',
                        description: 'Rua e número de entrega exatamente como o cliente informou. Ex: "Rua Fortaleza, 380"'
                    },
                    bairro: {
                        type: 'string',
                        description: 'Bairro informado pelo cliente. Pode ser corrigido pelo Mapbox.'
                    }
                },
                required: ['rua_numero']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'definir_pagamento',
            description: 'Define a forma de pagamento. Chame depois de confirmar a forma com o cliente.',
            parameters: {
                type: 'object',
                properties: {
                    forma: {
                        type: 'string',
                        enum: ['DINHEIRO', 'PIX', 'CARTAO'],
                        description: 'Forma de pagamento escolhida pelo cliente'
                    },
                    troco_para: {
                        type: 'number',
                        description: 'Valor para troco (se dinheiro). Null se não precisar.'
                    }
                },
                required: ['forma']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'ver_carrinho',
            description: 'Mostra o estado atual do carrinho para verificação.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'fechar_pedido',
            description: 'SOMENTE quando o cliente confirmar explicitamente (ex: "pode", "sim", "confirmado", "sem troco"). Converte o carrinho em pedido. Falha se faltar itens, endereço ou pagamento.',
            parameters: { type: 'object', properties: {} }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'cancelar_carrinho',
            description: 'Descarta o carrinho atual. Use se cliente cancelar ou quiser recomeçar.',
            parameters: { type: 'object', properties: {} }
        }
    }
];

// ─── Main Order Agent Function ─────────────────────────────────────────────

export interface OrderAgentContext {
    botId: string;
    contactPhone: string;
    contactId: string;
    userMessage: string;
    catalog: Array<{ id: string; name: string; price: number; salePrice?: number | null; active: boolean }>;
    savedAddresses: Array<{ address: string; label?: string | null }>;
    bot: any;
    mapboxToken?: string;
    botAddress?: string;
    onOrderCreated: (orderData: {
        address: string;
        latitude: number | null;
        longitude: number | null;
        paymentMethod: string;
        changeAmount: number | null;
        totalAmount: number;
        items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    }) => Promise<{ orderId: string; orderNumber?: string }>;
}

export interface OrderAgentResult {
    reply: string;
    orderConfirmed: boolean;
    orderId?: string;
    cartSummary?: any;
}

export async function runOrderAgent(ctx: OrderAgentContext): Promise<OrderAgentResult> {
    const cartSummary = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);

    const catalogText = ctx.catalog.length > 0
        ? ctx.catalog.map(p => `- ID: ${p.id} | Nome: ${p.name} | Preço: R$ ${Number(p.salePrice ?? p.price).toFixed(2)}`).join('\n')
        : 'Nenhum produto cadastrado.';

    const savedAddressesText = ctx.savedAddresses.length > 0
        ? ctx.savedAddresses.map((a, i) => `${i + 1}. ${a.label ? `[${a.label}] ` : ''}${a.address}`).join('\n')
        : 'Nenhum endereço salvo.';

    const systemPrompt = `Você é o AGENTE DE PEDIDOS. Sua única função é registrar pedidos corretamente no sistema.

CATÁLOGO DE PRODUTOS DISPONÍVEIS:
${catalogText}

ESTADO ATUAL DO CARRINHO:
${cartSummary.summary}

ENDEREÇOS SALVOS DO CLIENTE:
${savedAddressesText}

REGRAS ABSOLUTAS:
1. QUANTIDADE: Use EXATAMENTE o número que o cliente disse nesta mensagem. NUNCA use números de ruas ou casas como quantidade.
2. ENDEREÇO: Só chame "definir_endereco" quando tiver RUA + NÚMERO. Bairro sozinho não é suficiente.
3. PAGAMENTO: Só chame "definir_pagamento" depois de o cliente informar como vai pagar.
4. FECHAR: Só chame "fechar_pedido" quando o cliente CONFIRMAR EXPLICITAMENTE (sim, pode, ok, confirmado).
5. Se o cliente pede para ADICIONAR mais itens, some ao carrinho existente, não substitua.
6. Responda em português brasileiro, de forma natural e simpática.
7. Após cada ação, informe o estado atual do carrinho ao cliente.

PROIBIÇÕES:
- NUNCA chame "fechar_pedido" se o carrinho estiver incompleto
- NUNCA invente dados — use somente o que o cliente disse nesta conversa
- NUNCA use "bom dia" ou saudações como motivo para fechar pedido`;

    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: ctx.userMessage }
    ];

    let reply = '';
    let orderConfirmed = false;
    let orderId: string | undefined;
    let iterations = 0;
    const MAX_ITER = 5;

    while (iterations < MAX_ITER) {
        iterations++;

        const response = await safeChatCompletion({
            bot: ctx.bot,
            messages,
            tools: ORDER_AGENT_TOOLS,
            tool_choice: 'auto',
            temperature: 0.1
        }) as any;

        const content = typeof response === 'string' ? response : response?.content;
        const toolCalls = typeof response === 'object' ? response?.tool_calls : null;

        if (!toolCalls || toolCalls.length === 0) {
            reply = content || reply;
            break;
        }

        // Process tool calls
        const toolResults: any[] = [];

        for (const tc of toolCalls) {
            const name = tc.function?.name;
            let args: any = {};
            try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}

            let result = '';

            if (name === 'adicionar_item') {
                try {
                    const r = await CartService.addItem(ctx.botId, ctx.contactPhone, args.produto_id, args.quantidade);
                    result = r.message;
                } catch (e: any) {
                    result = `Erro: ${e.message}`;
                }

            } else if (name === 'definir_endereco') {
                const rawAddr = `${args.rua_numero}${args.bairro ? `, ${args.bairro}` : ''}`;
                let resolvedAddr = rawAddr;
                let lat: number | null = null;
                let lng: number | null = null;

                // Validate with Mapbox if token available
                if (ctx.mapboxToken) {
                    try {
                        const cityCtx = ctx.botAddress ? `, ${ctx.botAddress}` : ', Bento Gonçalves, RS, Brasil';
                        const hasCity = /(bento|garibaldi|farroupilha|caxias|\brs\b)/i.test(rawAddr);
                        const searchAddr = hasCity ? rawAddr : `${rawAddr}${cityCtx}`;
                        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddr)}.json?access_token=${ctx.mapboxToken}&country=BR&proximity=-51.517,-29.170&limit=1`;
                        const res = await fetch(url);
                        if (res.ok) {
                            const data = await res.json();
                            const feature = data.features?.[0];
                            if (feature) {
                                if (feature.relevance && feature.relevance < 0.4) {
                                    result = `❌ Endereço "${rawAddr}" não encontrado no mapa. Por favor informe a rua e número corretamente.`;
                                    toolResults.push({ tool_call_id: tc.id, role: 'tool', content: result });
                                    continue;
                                }
                                if (feature.place_name) resolvedAddr = feature.place_name;
                                if (feature.center) { lng = feature.center[0]; lat = feature.center[1]; }
                            }
                        }
                    } catch (e: any) {
                        console.error('[OrderAgent] Mapbox error:', e.message);
                    }
                }

                const r = await CartService.setDeliveryAddress(
                    ctx.botId, ctx.contactPhone, resolvedAddr, lat, lng, ctx.contactId
                );
                result = r.message;

            } else if (name === 'definir_pagamento') {
                const r = await CartService.setPaymentMethod(
                    ctx.botId, ctx.contactPhone, args.forma, args.troco_para ?? null
                );
                result = r.message;

            } else if (name === 'ver_carrinho') {
                const r = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
                result = r.summary;

            } else if (name === 'fechar_pedido') {
                const readiness = await CartService.isReadyForCheckout(ctx.botId, ctx.contactPhone);
                if (!readiness.ready) {
                    result = `❌ Não posso fechar o pedido. Faltando: ${readiness.missing.join(', ')}`;
                } else {
                    try {
                        const orderData = await CartService.convertToOrderData(ctx.botId, ctx.contactPhone);
                        const created = await ctx.onOrderCreated(orderData);
                        orderId = created.orderId;
                        orderConfirmed = true;
                        result = `✅ PEDIDO CRIADO! ID: ${orderId}. Total: R$ ${orderData.totalAmount.toFixed(2)}. Endereço: ${orderData.address}. Pagamento: ${orderData.paymentMethod}.`;
                    } catch (e: any) {
                        result = `Erro ao criar pedido: ${e.message}`;
                    }
                }

            } else if (name === 'cancelar_carrinho') {
                await CartService.clearCart(ctx.botId, ctx.contactPhone);
                result = '🗑️ Carrinho cancelado. Pode fazer um novo pedido quando quiser.';
            }

            toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
        }

        // Add assistant message with tool calls + tool results to messages
        messages.push({
            role: 'assistant',
            content: content || null,
            tool_calls: toolCalls
        });
        messages.push(...toolResults);

        if (orderConfirmed) break;
    }

    return { reply, orderConfirmed, orderId, cartSummary: await CartService.getCartSummary(ctx.botId, ctx.contactPhone) };
}

// ─── Helper: Build Order from Cart Data ───────────────────────────────────

export async function createOrderFromCartData(
    botId: string,
    contactId: string,
    orderData: Awaited<ReturnType<typeof CartService.convertToOrderData>>
): Promise<{ orderId: string }> {
    const order = await prisma.order.create({
        data: {
            botId,
            contactId,
            address: orderData.address,
            latitude: orderData.latitude,
            longitude: orderData.longitude,
            totalAmount: orderData.totalAmount,
            status: 'PENDING',
            items: {
                create: orderData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                }))
            }
        }
    });
    return { orderId: order.id };
}
