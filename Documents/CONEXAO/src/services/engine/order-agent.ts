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
            description: 'SOMENTE quando o cliente confirmar explicitamente (ex: "pode", "sim", "confirmado", "sem troco"). Converte os dados em pedido(s) oficial(is).',
            parameters: {
                type: 'object',
                properties: {
                    entregas: {
                        type: 'array',
                        description: 'Opcional. Se houver entregas para MÚLTIPLOS endereços (ex: 5 no Botafogo e 3 no Municipal), informe cada entrega com seu endereço e quantidade exata.',
                        items: {
                            type: 'object',
                            properties: {
                                endereco: { type: 'string', description: 'Endereço completo de entrega' },
                                quantidade: { type: 'number', description: 'Quantidade de botijões para este endereço' },
                                forma_pagamento: { type: 'string', description: 'DINHEIRO, PIX ou CARTAO' },
                                troco_para: { type: 'number', description: 'Opcional. Valor para troco' }
                            },
                            required: ['endereco', 'quantidade']
                        }
                    }
                }
            }
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

// ─── Helper: Aggregate All Saved Addresses for a Contact ───────────────────

export async function getContactSavedAddresses(contactId: string, contact?: any): Promise<Array<{ address: string; label?: string | null }>> {
    const list: Array<{ address: string; label?: string | null }> = [];
    const seen = new Set<string>();

    const addUnique = (addr: string | null | undefined, label: string) => {
        if (!addr || typeof addr !== 'string') return;
        const clean = addr.trim();
        if (clean.length < 5) return;
        const key = clean.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            list.push({ address: clean, label });
        }
    };

    // 1. Fetch from ContactAddress table
    const dbAddresses = await prisma.contactAddress.findMany({
        where: { contactId },
        orderBy: { createdAt: 'desc' },
        take: 10
    }).catch(() => []);

    for (const a of dbAddresses) {
        addUnique(a.address, a.label || 'Endereço Salvo');
    }

    // 2. Check contact.needs
    if (contact?.needs) {
        addUnique(contact.needs, 'Perfil do Cliente');
        // Auto-persist to ContactAddress if missing
        if (!dbAddresses.some((a: any) => a.address.toLowerCase().includes(contact.needs.substring(0, 10).toLowerCase()))) {
            prisma.contactAddress.create({
                data: { contactId, address: contact.needs.trim(), label: 'Perfil' }
            }).catch(() => {});
        }
    }

    // 3. Check contact.notes
    if (contact?.notes) {
        const noteMatch = contact.notes.match(/(?:rua|r\.|av\.|bairro|avenida)\s+[^\n.,]+/i);
        if (noteMatch) addUnique(noteMatch[0], 'Notas do Cliente');
    }

    // 4. Check past orders
    const pastOrders = await prisma.order.findMany({
        where: { contactId, address: { not: null } },
        select: { address: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    }).catch(() => []);

    for (const o of pastOrders) {
        addUnique(o.address, 'Pedido Anterior');
    }

    return list;
}

export async function runOrderAgent(ctx: OrderAgentContext): Promise<OrderAgentResult> {
    const cartSummary = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
    const cartIsEmpty = !cartSummary.hasItems;
    const userMsgLower = ctx.userMessage.toLowerCase().trim();

    // ── Early Exit for Greetings ──
    const isGreeting = /^(oi|olá|ola|bom dia|boa tarde|boa noite|e ai|e aí|tudo bem|opa|oie)$/i.test(userMsgLower);

    // Fetch last order for contact
    const lastOrder = await prisma.order.findFirst({
        where: { contactId: ctx.contactId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    }).catch(() => null);

    if (isGreeting && cartIsEmpty) {
        let statusNotice = '';
        if (lastOrder) {
            const isOngoing = ['PENDING', 'OUT_FOR_DELIVERY'].includes(lastOrder.status);
            if (isOngoing) {
                const itemsStr = lastOrder.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ');
                statusNotice = `\n\nℹ️ Seu pedido #${lastOrder.id.substring(0, 6)} (${itemsStr}) está *em andamento* para ${lastOrder.address}.`;
            }
        }
        return {
            reply: `Olá, ${ctx.contactName || 'cliente'}! 😊 Como posso ajudar você hoje?${statusNotice}\n\nSe quiser fazer um novo pedido de gás, é só me dizer a quantidade!`,
            orderConfirmed: false,
            cartSummary
        };
    }

    const catalogText = ctx.catalog.length > 0
        ? ctx.catalog.map(p => `- ID: ${p.id} | Nome: ${p.name} | Preço: R$ ${Number(p.salePrice ?? p.price).toFixed(2)}`).join('\n')
        : 'Nenhum produto cadastrado.';

    const savedAddressesText = ctx.savedAddresses.length > 0
        ? ctx.savedAddresses.map((a, i) => `${i + 1}. ${a.label ? `[${a.label}] ` : ''}${a.address}`).join('\n')
        : 'Nenhum endereço salvo.';

    let lastOrderContext = 'Nenhum pedido anterior.';
    if (lastOrder) {
        const statusMap: Record<string, string> = {
            PENDING: 'Em andamento (aguardando entregador)',
            OUT_FOR_DELIVERY: 'A caminho para entrega',
            DELIVERED: 'Entregue com sucesso',
            COMPLETED: 'Concluído',
            CANCELLED: 'Cancelado'
        };
        const statusFormatted = statusMap[lastOrder.status] || lastOrder.status;
        const dateFormatted = new Date(lastOrder.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        lastOrderContext = `Último Pedido (#${lastOrder.id.substring(0, 6)}): ${lastOrder.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')} (R$ ${Number(lastOrder.totalAmount).toFixed(2)}) em ${dateFormatted} | Status: ${statusFormatted} | Endereço: ${lastOrder.address}`;
    }

    const cartReadyHint = !cartIsEmpty && cartSummary.deliveryAddress && cartSummary.paymentMethod
        ? '\n\n⚠️ CARRINHO PRONTO: O carrinho já tem itens, endereço e pagamento. Se o cliente confirmar, chame fechar_pedido.'
        : '';

    const systemPrompt = `Você é o AGENTE DE PEDIDOS. Sua única função é registrar pedidos corretamente no sistema.

NOME DO CLIENTE: ${ctx.contactName || 'Cliente'}

ÚLTIMO PEDIDO DO CLIENTE:
${lastOrderContext}

CATÁLOGO DE PRODUTOS DISPONÍVEIS:
${catalogText}

ESTADO ATUAL DO CARRINHO:
${cartSummary.summary}${cartReadyHint}

ENDEREÇOS SALVOS DO CLIENTE:
${savedAddressesText}

FLUXO OBRIGATÓRIO PARA CADA PEDIDO:
PASSO 1 → adicionar_item (SEMPRE O PRIMEIRO PASSO quando o carrinho estiver vazio)
PASSO 2 → definir_endereco (quando o cliente fornecer rua e número OU pedir "o mesmo endereço")
PASSO 3 → definir_pagamento (após o cliente informar a forma de pagamento)
PASSO 4 → fechar_pedido (SOMENTE após confirmação explícita do cliente)

REGRAS ABSOLUTAS:
1. CARRINHO VAZIO: Se o carrinho está vazio (🛒 Carrinho vazio), a PRIMEIRA ferramenta a chamar É SEMPRE "adicionar_item".
2. QUANTIDADE: Use EXATAMENTE a quantidade dita pelo cliente. NUNCA use números de casas ou CEPs como quantidade.
3. PRODUTO: Para "gás", "botijão" → use o produto de gás 13kg do catálogo.
4. "O MESMO ENDEREÇO": Se o cliente disser "o mesmo", "mesmo de antes", "mesmo endereço" ou "o da Fortaleza": REAPROVEITE O 1º ENDEREÇO DA LISTA DE ENDEREÇOS SALVOS ACIMA E CHAME A FERRAMENTA "definir_endereco" COM ELE IMEDIATAMENTE!
5. NOVO ENDEREÇO COM RUA E NÚMERO: Se o cliente forneceu rua e número (ex: "R. José de Gasperi, 79"), chame a ferramenta "definir_endereco" IMEDIATAMENTE. O Mapbox identifica o bairro automaticamente!
6. PAGAMENTO: Só chame "definir_pagamento" quando o cliente disser dinheiro, Pix ou cartão.
7. FECHAR: Só chame "fechar_pedido" quando o cliente CONFIRMAR EXPLICITAMENTE (sim, pode, ok, confirmado, sem troco) E o carrinho estiver completo (itens + endereço + pagamento).
8. CONSULTA DE PEDIDO: Se o cliente perguntar "onde está meu pedido?" ou "qual o status?", responda com o status do Último Pedido informado acima. NUNCA crie um novo pedido nesses casos!
9. Responda em português brasileiro, de forma natural e simpática.

PROIBIÇÕES:
- NUNCA chame "fechar_pedido" se o carrinho estiver vazio ou sem endereço/pagamento
- NUNCA pergunte bairro se o cliente já forneceu a rua e o número
- NUNCA invente dados`;

    // ── Forced tool hints for item addition AND address definition ──
    let forcedToolHint = '';

    if (cartIsEmpty) {
        const qtyMatch = ctx.userMessage.match(/(\d+|um|uma|dois|duas|três|tres|quatro|cinco)\s*(?:botij|gás|gas|g[aá]s|p13|kg)/i);
        const defaultProduct = ctx.catalog.find(p => p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13') || p.name.toLowerCase().includes('gás') || p.name.toLowerCase().includes('gas')) || ctx.catalog[0];

        if (qtyMatch && defaultProduct) {
            const numWords: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5 };
            const rawQty = qtyMatch[1].toLowerCase();
            const qty = numWords[rawQty] ?? parseInt(rawQty, 10) ?? 1;
            forcedToolHint += `\n\n🔴 AÇÃO IMEDIATA OBRIGATÓRIA: O carrinho está vazio e o cliente pediu ${qty} unidade(s) de "${defaultProduct.name}" (ID: ${defaultProduct.id}). Chame AGORA a ferramenta "adicionar_item" com produto_id="${defaultProduct.id}" e quantidade=${qty}. Não responda texto antes de chamar a ferramenta.`;
        }
    } else if (!cartSummary.deliveryAddress) {
        // Cart has items but missing address
        const isSameAddress = /(o mesmo|mesmo|no mesmo|mesmo de antes)/i.test(userMsgLower);
        if (isSameAddress && ctx.savedAddresses.length > 0) {
            const lastAddr = ctx.savedAddresses[0].address;
            forcedToolHint += `\n\n🔴 AÇÃO IMEDIATA OBRIGATÓRIA: O cliente disse "${ctx.userMessage}". O endereço salvo do cliente é "${lastAddr}". Chame AGORA a ferramenta "definir_endereco" com rua_numero="${lastAddr}". Não pergunte nada antes.`;
        } else {
            // Check if user provided street + number (e.g. "R. José de Gasperi, 79" or "Fortaleza 380")
            const streetMatch = ctx.userMessage.match(/(?:rua|r\.|av\.|avenida|estrada|servid[ãa]o)?\s*([a-z0-9\sáàâãéèêíóôõúç.-]+,?\s*\d+)/i);
            if (streetMatch && streetMatch[1].length > 4 && !/^(dinheiro|pix|cartao|cartão)$/i.test(userMsgLower)) {
                const addrStr = ctx.userMessage.trim();
                forcedToolHint += `\n\n🔴 AÇÃO IMEDIATA OBRIGATÓRIA: O cliente informou o endereço "${addrStr}". Chame AGORA a ferramenta "definir_endereco" com rua_numero="${addrStr}". Não pergunte o bairro, o Mapbox resolve o bairro sozinho.`;
            }
        }
    }

    const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: ctx.userMessage + forcedToolHint }
    ];

    let reply = '';
    let orderConfirmed = false;
    let orderId: string | undefined;
    let iterations = 0;
    const MAX_ITER = 6;

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
        const toolCalls = typeof response === 'object' ? (response?.toolCalls || response?.tool_calls) : null;

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
                if (args.entregas && Array.isArray(args.entregas) && args.entregas.length > 0) {
                    // MULTI-DELIVERY ORDER CREATION
                    const defaultProduct = ctx.catalog.find(p => p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13') || p.name.toLowerCase().includes('gás') || p.name.toLowerCase().includes('gas')) || ctx.catalog[0];
                    const createdOrders: string[] = [];
                    let summaryText = '✅ PEDIDOS CRIADOS COM SUCESSO!\n';

                    for (const delivery of args.entregas) {
                        const prod = ctx.catalog.find(p => p.id === delivery.produto_id) || defaultProduct;
                        const unitPrice = Number(prod?.salePrice ?? prod?.price ?? 139);
                        const qty = Number(delivery.quantidade) || 1;
                        const total = qty * unitPrice;
                        const payMethod = (delivery.forma_pagamento || 'DINHEIRO').toUpperCase();
                        const rawAddr = delivery.endereco || 'Endereço não especificado';

                        let verifiedAddr = rawAddr;
                        let lat: number | null = null;
                        let lng: number | null = null;

                        if (ctx.mapboxToken) {
                            try {
                                const cityCtx = ctx.botAddress ? `, ${ctx.botAddress}` : ', Bento Gonçalves, RS, Brasil';
                                const searchAddr = rawAddr.includes('Bento') ? rawAddr : `${rawAddr}${cityCtx}`;
                                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddr)}.json?access_token=${ctx.mapboxToken}&country=BR&proximity=-51.517,-29.170&limit=1`;
                                const res = await fetch(url);
                                if (res.ok) {
                                    const data = await res.json();
                                    const feature = data.features?.[0];
                                    if (feature?.place_name) verifiedAddr = feature.place_name;
                                    if (feature?.center) { lng = feature.center[0]; lat = feature.center[1]; }
                                }
                            } catch {}
                        }

                        const orderData = {
                            cartId: '',
                            address: verifiedAddr,
                            latitude: lat,
                            longitude: lng,
                            paymentMethod: payMethod,
                            changeAmount: delivery.troco_para ?? null,
                            totalAmount: total,
                            items: [{ productId: prod?.id || '', quantity: qty, unitPrice }]
                        };

                        const created = await ctx.onOrderCreated(orderData);
                        createdOrders.push(created.orderId);
                        summaryText += `- Pedido #${created.orderId.substring(0, 6)}: ${qty}x ${prod?.name || 'Gás 13kg'} (R$ ${total.toFixed(2)}) ➔ ${verifiedAddr}\n`;
                    }

                    await CartService.clearCart(ctx.botId, ctx.contactPhone);
                    orderConfirmed = true;
                    orderId = createdOrders.join(', ');
                    result = summaryText;

                } else {
                    // SINGLE DELIVERY CART CHECKOUT
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

    const updatedSummary = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
    if (!reply) {
        if (orderConfirmed) {
            reply = `🎉 *Pedido Confirmado com Sucesso!*\n\nSeu pedido foi registrado no sistema e nosso entregador já está a caminho! 😊\n\nSe precisar de mais alguma coisa, é só me avisar!`;
        } else if (updatedSummary.hasItems) {
            const missing: string[] = [];
            if (!updatedSummary.deliveryAddress) missing.push('endereço de entrega (rua e número)');
            if (!updatedSummary.paymentMethod) missing.push('forma de pagamento (dinheiro, Pix ou cartão)');

            const missingText = missing.length > 0
                ? `\n\nQual será a ${missing.join(' e ')}?`
                : `\n\nTudo pronto! Deseja confirmar o pedido agora? (responda "sim" ou "pode")`;

            reply = `🛒 *Carrinho Atual:*\n${updatedSummary.itemsText}\n📍 *Endereço:* ${updatedSummary.deliveryAddress || 'Não informado'}\n💳 *Pagamento:* ${updatedSummary.paymentMethod || 'Não informado'}\n💰 *Total:* R$ ${updatedSummary.totalAmount.toFixed(2)}${missingText}`;
        }
    }

    return { reply, orderConfirmed, orderId, cartSummary: updatedSummary };
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
