/**
 * ORDER AGENT — Agente dedicado ao gerenciamento de pedidos de gás.
 *
 * Arquitetura:
 * - Estado do carrinho: persistido no banco via CartService (itens, endereço, pagamento)
 * - Estado de multi-entrega: persistido no Redis com TTL 2h (plano de entregas)
 * - Sem histórico de conversa bruto: o agente trabalha 100% com dados estruturados atuais
 * - Sem "forcedToolHints" de comando: o system prompt descreve o estado e o próximo passo
 *
 * Fluxo de multi-entrega:
 * 1. Código detecta e parseia deterministically ("4 no municipal e 5 no conceição")
 * 2. Código resolve endereços salvos por busca normalizada (fuzzy)
 * 3. Plano salvo no Redis: { deliveries: [{qty, label, address, needsAddress}], totalQty, productId }
 * 4. Total de itens adicionado ao Cart para registro no banco
 * 5. A cada turno o plano é carregado do Redis e injetado no system prompt como dados estruturados
 * 6. fechar_pedido com entregas[] cria Orders separados no banco
 */

import { safeChatCompletion } from '@/lib/ai-provider';
import { CartService } from './cart.service';
import { getRedis } from '@/lib/redis';
import prisma from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryEntry {
    qty: number;
    label: string;
    address: string | null;
    needsAddress: boolean;
}

interface MultiDeliveryPlan {
    deliveries: DeliveryEntry[];
    totalQty: number;
    productId: string;
}

// ─── Redis Helpers ────────────────────────────────────────────────────────────

const MULTI_PLAN_KEY = (botId: string, phone: string) => `multi_delivery:${botId}:${phone}`;

async function saveMultiPlan(botId: string, phone: string, plan: MultiDeliveryPlan): Promise<void> {
    await getRedis().setex(MULTI_PLAN_KEY(botId, phone), 7200, JSON.stringify(plan));
}

async function loadMultiPlan(botId: string, phone: string): Promise<MultiDeliveryPlan | null> {
    try {
        const raw = await getRedis().get(MULTI_PLAN_KEY(botId, phone));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

async function clearMultiPlan(botId: string, phone: string): Promise<void> {
    await getRedis().del(MULTI_PLAN_KEY(botId, phone)).catch(() => {});
}

// ── Awaiting Quantity State (tracks when bot asked "quantos botíjões?") ──────────
const AWAITING_QTY_KEY = (botId: string, phone: string) => `awaiting_qty:${botId}:${phone}`;

async function setAwaitingQty(botId: string, phone: string, productId: string): Promise<void> {
    await getRedis().setex(AWAITING_QTY_KEY(botId, phone), 600, productId); // 10min TTL
}

async function getAwaitingQty(botId: string, phone: string): Promise<string | null> {
    return getRedis().get(AWAITING_QTY_KEY(botId, phone)).catch(() => null);
}

async function clearAwaitingQty(botId: string, phone: string): Promise<void> {
    await getRedis().del(AWAITING_QTY_KEY(botId, phone)).catch(() => {});
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const ORDER_AGENT_TOOLS = [
    {
        type: 'function' as const,
        function: {
            name: 'adicionar_item',
            description: 'Adiciona produto ao carrinho com a quantidade EXATA informada pelo cliente. NUNCA chame sem quantidade explícita do cliente.',
            parameters: {
                type: 'object',
                properties: {
                    produto_id: { type: 'string', description: 'ID do produto no catálogo' },
                    quantidade: { type: 'number', description: 'Quantidade exata dita pelo cliente. Nunca assuma ou invente.' }
                },
                required: ['produto_id', 'quantidade']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'definir_endereco',
            description: 'Define o endereço de entrega do pedido simples. Só chame quando tiver rua E número completos. Nunca chame apenas com nome de bairro.',
            parameters: {
                type: 'object',
                properties: {
                    rua_numero: { type: 'string', description: 'Rua e número do endereço. Se o cliente mencionar uma cidade diferente da padrão de atendimento, inclua a cidade no final. Ex: "Rua Fortaleza, 380" ou "Rua Tal, 123, Flores da Cunha - RS"' },
                    bairro: { type: 'string', description: 'Nome do bairro (opcional, complemento)' }
                },
                required: ['rua_numero']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'atualizar_endereco_entrega',
            description: 'Atualiza o endereço de uma entrega pendente no plano de multi-entrega. Use quando o cliente fornecer a rua e número para um local que ainda estava sem endereço.',
            parameters: {
                type: 'object',
                properties: {
                    label: { type: 'string', description: 'Nome do bairro/local da entrega a atualizar. Ex: "Centro"' },
                    rua_numero: { type: 'string', description: 'Rua e número informados pelo cliente para aquele local' }
                },
                required: ['label', 'rua_numero']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'definir_pagamento',
            description: 'Define a forma de pagamento depois que o cliente informar.',
            parameters: {
                type: 'object',
                properties: {
                    forma: { type: 'string', enum: ['DINHEIRO', 'PIX', 'CARTAO'], description: 'Forma de pagamento' },
                    troco_para: { type: 'number', description: 'Valor para troco em dinheiro. Null se não aplicável.' }
                },
                required: ['forma']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'fechar_pedido',
            description: 'Fecha o pedido APENAS quando o cliente confirmar explicitamente ("sim", "pode", "confirmo", "ok"). Para multi-entrega, o parâmetro "entregas" é preenchido automaticamente com base no plano ativo.',
            parameters: {
                type: 'object',
                properties: {
                    entregas: {
                        type: 'array',
                        description: 'Lista de entregas para pedidos multi-endereço (opcional — se houver plano ativo no Redis, será usado automaticamente).',
                        items: {
                            type: 'object',
                            properties: {
                                endereco: { type: 'string' },
                                quantidade: { type: 'number' },
                                forma_pagamento: { type: 'string' },
                                troco_para: { type: 'number' }
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
            description: 'Cancela e limpa o carrinho atual. Use se o cliente quiser recomeçar ou cancelar o pedido.',
            parameters: { type: 'object', properties: {} }
        }
    }
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OrderAgentContext {
    botId: string;
    contactPhone: string;
    contactId: string;
    contactName?: string;
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
    history?: Array<{ role: string; content: string; tool_calls?: any; tool_call_id?: string }>;
}

export interface OrderAgentResult {
    reply: string;
    orderConfirmed: boolean;
    orderId?: string;
    cartSummary?: any;
}

// ─── Text Normalization (accent-insensitive fuzzy match) ──────────────────────

function normalize(text: string): string {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function fuzzyMatch(needle: string, haystack: string): boolean {
    const n = normalize(needle);
    const h = normalize(haystack);
    if (!n || !h || n.length < 2 || h.length < 2) return false;
    return h.includes(n) || n.includes(h) ||
        (n.length >= 4 && h.startsWith(n.substring(0, 4)));
}

// ─── Find Saved Address by Label or Neighborhood ─────────────────────────────

function findSavedAddress(
    query: string,
    savedAddresses: Array<{ address: string; label?: string | null }>
): { address: string; label?: string | null } | null {
    const q = normalize(query);
    if (q.length < 2) return null;

    return savedAddresses.find(a => {
        const lbl = normalize(a.label || '');
        const addr = normalize(a.address || '');
        return (lbl && fuzzyMatch(q, lbl)) ||
               (addr && addr.includes(q)) ||
               (lbl && q.length >= 4 && lbl.startsWith(q.substring(0, 4)));
    }) || null;
}

// ─── Multi-Delivery Parser ────────────────────────────────────────────────────

interface ParsedDelivery {
    qty: number;
    rawLocation: string;
}

const NUM_WORDS: Record<string, number> = {
    um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4,
    cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10
};

function parseMultiDelivery(text: string): ParsedDelivery[] | null {
    const lower = text.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents for regex

    // Match "N [product?] no/na/em/para/pra LOCATION" — greedy up to next connector or end
    const pattern = /(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:botij[oa]o?es?|g[a]s|p\s*13)?\s*(?:no|na|em|para|pra)\s+([a-z][a-z\s]{1,25}?)(?=\s+e\s+\d|\s+e\s+(?:um|uma|dois|duas|tres|quatro|cinco)|\s*,\s*|\s*$)/g;

    const matches = Array.from(lower.matchAll(pattern));
    if (matches.length < 2) return null;

    return matches.map(m => {
        const rawQty = m[1].toLowerCase();
        const qty = NUM_WORDS[rawQty] ?? parseInt(rawQty, 10) ?? 1;
        const rawLocation = m[2].trim().replace(/\s+$/, '');
        return { qty, rawLocation };
    });
}

// ─── Mapbox Geocoding ─────────────────────────────────────────────────────────

async function geocodeAddress(
    rawAddr: string,
    mapboxToken: string,
    botAddress?: string
): Promise<{ resolvedAddr: string; lat: number | null; lng: number | null; valid: boolean; city?: string }> {
    // Geocode the raw address without appending city context so Mapbox returns the true city.
    // The proximity parameter biases results toward the bot's region without overriding actual location.
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(rawAddr)}.json?access_token=${mapboxToken}&country=BR&proximity=-51.517,-29.170&limit=1`;
        const res = await fetch(url);
        if (!res.ok) return { resolvedAddr: rawAddr, lat: null, lng: null, valid: true };

        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature || (feature.relevance && feature.relevance < 0.35)) {
            return { resolvedAddr: rawAddr, lat: null, lng: null, valid: false };
        }

        let resolvedAddr = rawAddr;
        const placeTypes = feature.place_type || [];
        const isSpecific = placeTypes.includes('address') || placeTypes.includes('poi') ||
            placeTypes.includes('building') || /\d+/.test(feature.place_name || '');
        if (isSpecific && feature.place_name) {
            resolvedAddr = feature.place_name;
        }

        // Extract city from Mapbox context (type "place") for reliable city-level validation
        const cityCtxEntry = (feature.context || []).find((c: any) => c.id?.startsWith('place.'));
        const city: string | undefined = cityCtxEntry?.text;

        return {
            resolvedAddr,
            lat: feature.center ? feature.center[1] : null,
            lng: feature.center ? feature.center[0] : null,
            valid: true,
            city
        };
    } catch {
        return { resolvedAddr: rawAddr, lat: null, lng: null, valid: true };
    }
}

// ─── Helper: Get Contact Saved Addresses ─────────────────────────────────────

export async function getContactSavedAddresses(
    contactId: string,
    contact?: any
): Promise<Array<{ address: string; label?: string | null }>> {
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

    const dbAddresses = await prisma.contactAddress.findMany({
        where: { contactId },
        orderBy: { createdAt: 'desc' },
        take: 10
    }).catch(() => []);

    for (const a of dbAddresses) {
        addUnique(a.address, a.label || 'Endereço Salvo');
    }

    if (contact?.needs) {
        addUnique(contact.needs, 'Perfil do Cliente');
        if (!dbAddresses.some((a: any) => a.address.toLowerCase().includes((contact.needs || '').substring(0, 10).toLowerCase()))) {
            prisma.contactAddress.create({
                data: { contactId, address: contact.needs.trim(), label: 'Perfil' }
            }).catch(() => {});
        }
    }

    if (contact?.notes) {
        const noteMatch = contact.notes.match(/(?:rua|r\.|av\.|bairro|avenida)\s+[^\n.,]+/i);
        if (noteMatch) addUnique(noteMatch[0], 'Notas');
    }

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

// ─── Main Order Agent ─────────────────────────────────────────────────────────

export async function runOrderAgent(ctx: OrderAgentContext): Promise<OrderAgentResult> {
    const cartSummary = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
    const cartIsEmpty = !cartSummary.hasItems;
    const userMsgLower = ctx.userMessage.toLowerCase().trim();

    // ── Early Exit: Pure Greetings ────────────────────────────────────────────
    const isGreeting = /^(oi|olá|ola|bom dia|boa tarde|boa noite|e ai|e aí|tudo bem|opa|oie|hey|hi)$/i.test(userMsgLower.trim());
    const lastOrder = await prisma.order.findFirst({
        where: { contactId: ctx.contactId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    }).catch(() => null);

    if (isGreeting && cartIsEmpty) {
        const nameClean = (ctx.contactName || '').trim();
        const isGenericName = !nameClean || /^(cliente|user|usuario|usuário|\d+)$/i.test(nameClean);
        const salutationName = isGenericName ? '' : `, ${nameClean}`;

        let statusNotice = '';
        if (lastOrder && ['PENDING', 'OUT_FOR_DELIVERY'].includes(lastOrder.status)) {
            const itemsStr = lastOrder.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ');
            statusNotice = `\n\nℹ️ Seu pedido (${itemsStr}) está *em andamento* para ${lastOrder.address}.`;
        }

        return {
            reply: `Olá${salutationName}! 😊 Como posso ajudar você hoje?${statusNotice}\n\nSe quiser fazer um novo pedido de gás, é só me dizer a quantidade!`,
            orderConfirmed: false,
            cartSummary
        };
    }

    // ── Load Multi-Delivery Plan from Redis ───────────────────────────────────
    let multiPlan = await loadMultiPlan(ctx.botId, ctx.contactPhone);

    // ── Detect New Multi-Delivery in Current Message ──────────────────────────
    const parsedDeliveries = parseMultiDelivery(ctx.userMessage);
    const isNewMultiDelivery = parsedDeliveries && parsedDeliveries.length >= 2;

    if (isNewMultiDelivery && parsedDeliveries) {
        // Clear any previous plan
        if (multiPlan) await clearMultiPlan(ctx.botId, ctx.contactPhone);
        if (!cartIsEmpty) await CartService.clearCart(ctx.botId, ctx.contactPhone);

        // Find default product (P13 / gas)
        const defaultProduct = ctx.catalog.find(p =>
            p.active && (p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13') ||
            p.name.toLowerCase().includes('gás') || p.name.toLowerCase().includes('gas'))
        ) || ctx.catalog.find(p => p.active) || ctx.catalog[0];

        // Resolve addresses for each delivery
        const deliveries: DeliveryEntry[] = parsedDeliveries.map(d => {
            const savedAddr = findSavedAddress(d.rawLocation, ctx.savedAddresses);
            return {
                qty: d.qty,
                label: d.rawLocation,
                address: savedAddr ? savedAddr.address : null,
                needsAddress: !savedAddr
            };
        });

        const totalQty = deliveries.reduce((s, d) => s + d.qty, 0);
        multiPlan = { deliveries, totalQty, productId: defaultProduct?.id || '' };

        // Persist plan to Redis
        await saveMultiPlan(ctx.botId, ctx.contactPhone, multiPlan);

        // Add total quantity to cart (so CartItems record is created in DB)
        if (defaultProduct) {
            await CartService.addItem(ctx.botId, ctx.contactPhone, defaultProduct.id, totalQty);
        }
    }

    // ── REDIS STATE: Check if bot was waiting for a quantity answer ──────────────
    // When the previous turn asked "Quantos botijões você precisa?", a Redis key
    // was set. Any number in the next message = the quantity. 100% deterministic.
    if (cartIsEmpty && !multiPlan && !isNewMultiDelivery) {
        const awaitingProductId = await getAwaitingQty(ctx.botId, ctx.contactPhone);
        const numMatch = ctx.userMessage.match(/(\d+|um|uma|dois|duas|tr[eê]s|tres|quatro|cinco|seis|sete|oito|nove|dez)/i);

        if (awaitingProductId && numMatch) {
            const rawQty = numMatch[1].toLowerCase();
            const detectedQty = NUM_WORDS[rawQty] ?? parseInt(rawQty, 10);
            const defProduct = ctx.catalog.find(p => p.id === awaitingProductId && p.active)
                || ctx.catalog.find(p => p.active && (p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13') || p.name.toLowerCase().includes('gás') || p.name.toLowerCase().includes('gas')))
                || ctx.catalog.find(p => p.active);

            if (defProduct && detectedQty > 0 && detectedQty <= 100) {
                await clearAwaitingQty(ctx.botId, ctx.contactPhone);
                await CartService.addItem(ctx.botId, ctx.contactPhone, defProduct.id, detectedQty);
                const updatedCart = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
                return {
                    reply: `✅ Anotado! *${detectedQty}x ${defProduct.name}* adicionado.\n\nPara qual endereço vou entregar? 📍`,
                    orderConfirmed: false,
                    cartSummary: updatedCart
                };
            }
        }

        // Belt-and-suspenders: if message is ONLY a number (strips invisible chars too)
        const numOnlyMatch = ctx.userMessage
            .replace(/[\u200b\u200c\u200d\ufeff\r\n\t]/g, '')
            .trim()
            .match(/^(\d+|um|uma|dois|duas|tr[eê]s|tres|quatro|cinco|seis|sete|oito|nove|dez)$/i);
        if (numOnlyMatch) {
            const rawQty = numOnlyMatch[1].toLowerCase();
            const detectedQty = NUM_WORDS[rawQty] ?? parseInt(rawQty, 10);
            const defProduct = ctx.catalog.find(p =>
                p.active && (p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13') ||
                p.name.toLowerCase().includes('gás') || p.name.toLowerCase().includes('gas'))
            ) || ctx.catalog.find(p => p.active);

            if (defProduct && detectedQty > 0 && detectedQty <= 100) {
                await clearAwaitingQty(ctx.botId, ctx.contactPhone);
                await CartService.addItem(ctx.botId, ctx.contactPhone, defProduct.id, detectedQty);
                const updatedCart = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
                return {
                    reply: `✅ Anotado! *${detectedQty}x ${defProduct.name}* adicionado.\n\nPara qual endereço vou entregar? 📍`,
                    orderConfirmed: false,
                    cartSummary: updatedCart
                };
            }
        }
    }

    // ── REDIS STATE: Set awaiting quantity state if product is mentioned without quantity 
    if (cartIsEmpty && !multiPlan && !isNewMultiDelivery) {
        const productMentioned = /\b(g[aá]s|bot[il][aã]o?|botij[oõ][aã]o?s?|p\s*13|kg)\b/i.test(ctx.userMessage);
        const numberInMsg = ctx.userMessage.match(/(\d+|um|uma|dois|duas|tr[eê]s|tres|quatro|cinco|seis|sete|oito|nove|dez)/i);
        
        if (productMentioned && !numberInMsg) {
            const defProduct = ctx.catalog.find(p =>
                p.active && (p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13') ||
                p.name.toLowerCase().includes('gás') || p.name.toLowerCase().includes('gas'))
            ) || ctx.catalog.find(p => p.active) || ctx.catalog[0];

            if (defProduct) {
                await setAwaitingQty(ctx.botId, ctx.contactPhone, defProduct.id);
            }
        }
    }

    // ── Handle Address Update for Pending Multi-Delivery Entry ────────────────
    // If there's a multi-plan with pending address AND the user's message looks like a street
    if (multiPlan) {
        const pendingEntry = multiPlan.deliveries.find(d => d.needsAddress);
        if (pendingEntry) {
            const hasStreetNumber = /\d+/.test(userMsgLower);
            const isPaymentMsg = /\b(dinheiro|pix|cartao|cartão|crédito|débito)\b/i.test(userMsgLower);
            const isConfirmation = /^(sim|pode|confirmo|ok|confirmado)$/i.test(userMsgLower.trim());

            if (hasStreetNumber && !isPaymentMsg && !isConfirmation && userMsgLower.length >= 5) {
                const cityCtx = ctx.botAddress || 'Bento Gonçalves, RS, Brasil';
                const hasCity = /\b(rs|sc|sp|mg|pr|rj)\b|-\s*rs\b|(bento|garibaldi|farroupilha|caxias|flores|nova\s+prata|flores\s+da\s+cunha|veranopolis|antônio\s+prado)/i.test(ctx.userMessage);
                const resolved = hasCity
                    ? ctx.userMessage.trim()
                    : `${ctx.userMessage.trim()}, ${pendingEntry.label}, ${cityCtx}`;

                pendingEntry.address = resolved;
                pendingEntry.needsAddress = false;
                await saveMultiPlan(ctx.botId, ctx.contactPhone, multiPlan);
            }
        }
    }

    // ── Catalog Text ──────────────────────────────────────────────────────────
    const catalogText = ctx.catalog.length > 0
        ? ctx.catalog.filter(p => p.active).map(p =>
            `- ID: ${p.id} | ${p.name} | R$ ${Number(p.salePrice ?? p.price).toFixed(2)}`
          ).join('\n')
        : 'Nenhum produto cadastrado.';

    // ── Saved Addresses Text ──────────────────────────────────────────────────
    const savedAddressesText = ctx.savedAddresses.length > 0
        ? ctx.savedAddresses.map((a, i) => `${i + 1}. ${a.label ? `[${a.label}] ` : ''}${a.address}`).join('\n')
        : 'Nenhum endereço salvo.';

    // ── Last Order Context ────────────────────────────────────────────────────
    let lastOrderContext = 'Nenhum pedido anterior.';
    if (lastOrder) {
        const statusMap: Record<string, string> = {
            PENDING: 'Em andamento', OUT_FOR_DELIVERY: 'A caminho',
            DELIVERED: 'Entregue', COMPLETED: 'Concluído', CANCELLED: 'Cancelado'
        };
        lastOrderContext = `${lastOrder.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')} | R$ ${Number(lastOrder.totalAmount).toFixed(2)} | ${statusMap[lastOrder.status] || lastOrder.status} | ${lastOrder.address}`;
    }

    // ── Covered Neighborhoods & Allowed Cities ────────────────────────────────
    let coveredNeighborhoodsList: string[] = [];
    let allowedCitiesList: string[] = [];
    if (ctx.bot?.deliveryFeeRules) {
        try {
            const rules = typeof ctx.bot.deliveryFeeRules === 'string'
                ? JSON.parse(ctx.bot.deliveryFeeRules)
                : ctx.bot.deliveryFeeRules;
            if (Array.isArray(rules)) {
                coveredNeighborhoodsList = rules
                    .map((r: any) => r.neighborhood || r.bairro || r.region)
                    .filter(Boolean);
                allowedCitiesList = [...new Set(
                    rules.map((r: any) => r.city).filter(Boolean)
                )] as string[];
            }
        } catch {}
    }
    const coveredText = coveredNeighborhoodsList.length > 0
        ? `\nBAIRROS ATENDIDOS: ${coveredNeighborhoodsList.join(', ')}`
        : '';

    // ── Function to build the system prompt dynamically ──────────────────────
    const buildSystemPrompt = async () => {
        const currentCart = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
        const currentCartIsEmpty = !currentCart.hasItems;
        const currentMultiPlan = await loadMultiPlan(ctx.botId, ctx.contactPhone);

        // ── Multi-Delivery Context Block ──────────────────────────────────────────
        let multiDeliveryBlock = '';
        if (currentMultiPlan) {
            const unitPrice = Number(
                ctx.catalog.find(p => p.id === currentMultiPlan!.productId)?.salePrice ??
                ctx.catalog.find(p => p.id === currentMultiPlan!.productId)?.price ?? 139
            );
            const totalVal = currentMultiPlan.totalQty * unitPrice;

            const lines = currentMultiPlan.deliveries.map(d => {
                const sub = (d.qty * unitPrice).toFixed(2);
                if (d.needsAddress || !d.address) {
                    return `  - ${d.qty}x P13 → ${d.label} ❌ aguardando rua e número`;
                }
                return `  - ${d.qty}x P13 → ${d.address} ✅ (R$ ${sub})`;
            });

            const hasPending = currentMultiPlan.deliveries.some(d => d.needsAddress || !d.address);

            multiDeliveryBlock = `\nPLANO DE MULTI-ENTREGA ATIVO:
${lines.join('\n')}
Total geral: R$ ${totalVal.toFixed(2)}
${hasPending
    ? `AGUARDANDO: Solicite a rua e número para as entregas marcadas com ❌.`
    : currentCart.paymentMethod
        ? `PRONTO: Todos os endereços confirmados e pagamento definido (${currentCart.paymentMethod}). Aguardando confirmação do cliente.`
        : `AGUARDANDO: Todos os endereços confirmados. Pergunte a forma de pagamento (dinheiro, Pix ou cartão).`
}`;
        }

        // ── Single Address Neighborhood Hint ─────────────────────────────────────
        let singleAddrHint = '';
        if (!currentMultiPlan && !currentCartIsEmpty && !currentCart.deliveryAddress) {
            const cleanMsg = userMsgLower.replace(/^(no|na|em|o|a|para|pra)\s+/i, '').trim();
            if (cleanMsg.length >= 3 && !/\b(dinheiro|pix|cartao|cartão)\b/i.test(cleanMsg)) {
                const foundSaved = findSavedAddress(cleanMsg, ctx.savedAddresses);
                if (foundSaved) {
                    singleAddrHint = `\nENDEREÇO IDENTIFICADO: O cliente mencionou "${cleanMsg}", que corresponde ao endereço salvo: "${foundSaved.address}". Chame definir_endereco com rua_numero="${foundSaved.address}" imediatamente, sem pedir confirmação.`;
                } else if (coveredNeighborhoodsList.length > 0) {
                    const isCovered = coveredNeighborhoodsList.some(n => fuzzyMatch(cleanMsg, n));
                    if (isCovered) {
                        singleAddrHint = `\nBAIRRO ATENDIDO: "${cleanMsg}" é um bairro coberto. Pergunte a rua e o número nesse bairro.`;
                    } else if (cleanMsg.length >= 4 && !/\d/.test(cleanMsg)) {
                        singleAddrHint = `\nBAIRRO FORA DA COBERTURA: "${cleanMsg}" não está na lista de bairros atendidos. Informe o cliente educadamente.`;
                    }
                }
            }
        }

        // ── Determine Current State + Next Step ───────────────────────────────────
        let stateDesc: string;
        let nextStep: string;

        if (currentMultiPlan) {
            const hasPending = currentMultiPlan.deliveries.some(d => d.needsAddress || !d.address);
            if (hasPending) {
                const pending = currentMultiPlan.deliveries.find(d => d.needsAddress || !d.address);
                stateDesc = `Multi-entrega em andamento. Aguardando endereço para: "${pending?.label}".`;
                nextStep = `Pergunte a rua e o número para "${pending?.label}". Não continue sem isso.`;
            } else if (!currentCart.paymentMethod) {
                stateDesc = `Multi-entrega com todos os endereços confirmados. Aguardando forma de pagamento.`;
                nextStep = `Pergunte a forma de pagamento (dinheiro, Pix ou cartão).`;
            } else {
                stateDesc = `Multi-entrega completa: endereços e pagamento confirmados.`;
                nextStep = `Apresente o resumo completo (ver PLANO DE MULTI-ENTREGA) e pergunte se o cliente confirma.`;
            }
        } else if (currentCartIsEmpty) {
            stateDesc = `Carrinho vazio. Aguardando pedido do cliente.`;
            nextStep = `Se o cliente mencionar apenas o produto SEM quantidade (ex: "gas", "botijão", "p13" isolados), pergunte "Quantos botijões você precisa?" antes de adicionar ao carrinho. Se a mensagem contém número + produto, adicione ao carrinho imediatamente.`;
        } else if (!currentCart.deliveryAddress) {
            stateDesc = `Carrinho com itens. Aguardando endereço de entrega.`;
            nextStep = `Pergunte para qual endereço será a entrega. Se o cliente mencionar um bairro com endereço salvo, use o endereço salvo diretamente sem pedir rua e número.${singleAddrHint}`;
        } else if (!currentCart.paymentMethod) {
            stateDesc = `Carrinho com itens e endereço confirmado. Aguardando forma de pagamento.`;
            nextStep = `Pergunte a forma de pagamento: dinheiro, Pix ou cartão.`;
        } else {
            stateDesc = `Carrinho completo: itens, endereço e pagamento definidos.`;
            nextStep = `Apresente o resumo do pedido e pergunte se o cliente confirma ("sim" ou "pode").`;
        }

        return `Você é um atendente simpático e eficiente de uma distribuidora de gás. Seu objetivo é registrar pedidos de forma natural, humanizada e sem erros.

CLIENTE: ${ctx.contactName || 'Cliente'}
ÚLTIMO PEDIDO: ${lastOrderContext}

CATÁLOGO DISPONÍVEL:
${catalogText}

ENDEREÇOS SALVOS DO CLIENTE:
${savedAddressesText}${coveredText}

ESTADO ATUAL: ${stateDesc}
PRÓXIMO PASSO: ${nextStep}

CARRINHO:
${currentCart.summary}

REGRAS DE NEGÓCIO:
1. QUANTIDADE: Se o cliente mencionar apenas o produto sem quantidade (ex: "gás", "botijão", "p13"), SEMPRE pergunte quantos botijões ele precisa antes de chamar adicionar_item. Nunca assuma quantidade.
2. ENDEREÇO SALVO: NUNCA assuma ou escolha um endereço salvo automaticamente. VOCÊ SÓ PODE usar um endereço salvo se o cliente mencionar explicitamente o nome da rua ou do bairro na mensagem atual. Caso contrário, pergunte para onde é a entrega.
3. BAIRRO SEM ENDEREÇO: Se o cliente mencionar um bairro sem endereço salvo, pergunte a rua e o número naquele bairro.
4. PAGAMENTO: Só chame definir_pagamento quando o cliente informar "dinheiro", "Pix" ou "cartão".
5. FECHAMENTO: Só chame fechar_pedido quando o cliente confirmar explicitamente com "sim", "pode", "confirmo" ou similar.
6. MULTI-ENTREGA: Se houver um PLANO DE MULTI-ENTREGA ATIVO acima, use os dados do plano. Quando fechar, chame fechar_pedido — o sistema cria pedidos separados automaticamente para cada endereço.
7. STATUS: Se o cliente perguntar sobre o status do pedido, informe com base no ÚLTIMO PEDIDO.
8. Seja natural, cordial e objetivo. Evite respostas longas ou robóticas. Responda APENAS ao que foi solicitado no estado atual.`;
    };

    const initialPrompt = await buildSystemPrompt();

    const messages: any[] = [];
    messages.push({ role: 'system', content: initialPrompt });

    if (ctx.history && ctx.history.length > 0) {
        // Mapeia o histórico do banco para o formato de mensagens da OpenAI
        const mappedHistory = ctx.history.map((h: any) => ({
            role: h.role === 'system' ? 'system' : h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content,
            ...(h.tool_calls ? { tool_calls: h.tool_calls } : {}),
            ...(h.tool_call_id ? { tool_call_id: h.tool_call_id } : {})
        }));
        messages.push(...mappedHistory);
    }

    // Adiciona a mensagem atual do usuário apenas se ela já não for a última mensagem do histórico
    const lastHistoryMsg = ctx.history?.[ctx.history.length - 1];
    if (!lastHistoryMsg || lastHistoryMsg.content !== ctx.userMessage || lastHistoryMsg.role !== 'user') {
        messages.push({ role: 'user', content: ctx.userMessage });
    }

    let reply = '';
    let orderConfirmed = false;
    let orderId: string | undefined;
    let iterations = 0;

    // ── Agent Loop ────────────────────────────────────────────────────────────
    while (iterations < 6) {
        iterations++;

        const response = await safeChatCompletion({
            bot: ctx.bot,
            messages,
            tools: ORDER_AGENT_TOOLS,
            tool_choice: 'auto',
            temperature: 0.15
        }) as any;

        const content = typeof response === 'string' ? response : response?.content;
        const toolCalls = typeof response === 'object'
            ? (response?.toolCalls || response?.tool_calls)
            : null;

        if (!toolCalls || toolCalls.length === 0) {
            reply = content || reply;
            break;
        }

        const toolResults: any[] = [];

        for (const tc of toolCalls) {
            const name = tc.function?.name;
            let args: any = {};
            try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
            let result = '';

            // ── Tool: adicionar_item ────────────────────────────────────────
            if (name === 'adicionar_item') {
                try {
                    const r = await CartService.addItem(ctx.botId, ctx.contactPhone, args.produto_id, args.quantidade);
                    result = r.message;
                } catch (e: any) {
                    result = `Erro ao adicionar item: ${e.message}`;
                }

            // ── Tool: definir_endereco ──────────────────────────────────────
            } else if (name === 'definir_endereco') {
                const bairroStr = args.bairro || undefined;
                const rawAddr = `${args.rua_numero}${bairroStr ? `, ${bairroStr}` : ''}`;
                let resolvedAddr = rawAddr.includes('Bento') || rawAddr.includes('RS')
                    ? rawAddr
                    : `${rawAddr}, Bento Gonçalves - RS`;
                let lat: number | null = null;
                let lng: number | null = null;

                if (ctx.mapboxToken) {
                    const geo = await geocodeAddress(rawAddr, ctx.mapboxToken, ctx.botAddress);
                    console.log(`[CityCheck] definir_endereco addr="${rawAddr}" geocodedCity="${geo.city}" resolvedAddr="${geo.resolvedAddr}" allowedCities=${JSON.stringify(allowedCitiesList)} mapboxToken=${!!ctx.mapboxToken}`);
                    if (!geo.valid) {
                        result = `❌ Endereço "${rawAddr}" não localizado. Peça ao cliente para verificar a rua e o número.`;
                        toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                        continue;
                    }
                    resolvedAddr = geo.resolvedAddr;
                    lat = geo.lat;
                    lng = geo.lng;

                    if (allowedCitiesList.length > 0) {
                        const geocodedCity = geo.city;
                        const cityAllowed = geocodedCity
                            ? allowedCitiesList.some(c => geocodedCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(geocodedCity.toLowerCase()))
                            : allowedCitiesList.some(c => resolvedAddr.toLowerCase().includes(c.toLowerCase()));
                        console.log(`[CityCheck] geocodedCity="${geocodedCity}" cityAllowed=${cityAllowed}`);
                        if (!cityAllowed) {
                            const citiesStr = allowedCitiesList.join(', ');
                            result = `❌ Desculpe, não realizamos entregas em "${resolvedAddr}". Atendemos apenas em: ${citiesStr}. Por favor, informe um endereço nessas cidades.`;
                            toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                            continue;
                        }
                    }
                }

                // Ensure neighborhood is in address string
                if (bairroStr && !resolvedAddr.toLowerCase().includes(bairroStr.toLowerCase())) {
                    resolvedAddr = `${args.rua_numero}, ${bairroStr}, Bento Gonçalves - RS`;
                }

                const r = await CartService.setDeliveryAddress(
                    ctx.botId, ctx.contactPhone, resolvedAddr, lat, lng, ctx.contactId, bairroStr
                );
                result = r.message;

            // ── Tool: atualizar_endereco_entrega ────────────────────────────
            } else if (name === 'atualizar_endereco_entrega') {
                const freshPlan = await loadMultiPlan(ctx.botId, ctx.contactPhone);
                if (freshPlan) {
                    const entry = freshPlan.deliveries.find(d =>
                        fuzzyMatch(args.label, d.label) || fuzzyMatch(d.label, args.label)
                    );
                    if (entry) {
                        const cityCtx = ctx.botAddress || 'Bento Gonçalves, RS, Brasil';
                        const hasCity = /\b(rs|sc|sp|mg|pr|rj)\b|-\s*rs\b|(bento|garibaldi|farroupilha|caxias|flores|nova\s+prata|flores\s+da\s+cunha|veranopolis|antônio\s+prado)/i.test(args.rua_numero);
                        const rawAddrUpd = hasCity
                            ? args.rua_numero
                            : `${args.rua_numero}, ${entry.label}, ${cityCtx}`;

                        if (ctx.mapboxToken && allowedCitiesList.length > 0) {
                            const geo = await geocodeAddress(args.rua_numero, ctx.mapboxToken, ctx.botAddress);
                            if (geo.valid) {
                                const geocodedCity = geo.city;
                                const cityAllowed = geocodedCity
                                    ? allowedCitiesList.some(c => geocodedCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(geocodedCity.toLowerCase()))
                                    : allowedCitiesList.some(c => geo.resolvedAddr.toLowerCase().includes(c.toLowerCase()));
                                if (!cityAllowed) {
                                    const citiesStr = allowedCitiesList.join(', ');
                                    result = `❌ Desculpe, não realizamos entregas em "${geo.resolvedAddr}". Atendemos apenas em: ${citiesStr}. Por favor, informe um endereço nessas cidades.`;
                                    toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                                    continue;
                                }
                            }
                        }

                        entry.address = rawAddrUpd;
                        entry.needsAddress = false;
                        await saveMultiPlan(ctx.botId, ctx.contactPhone, freshPlan);
                        multiPlan = freshPlan;
                        result = `✅ Endereço atualizado para ${entry.label}: ${entry.address}`;
                    } else {
                        result = `Entrega "${args.label}" não encontrada no plano.`;
                    }
                } else {
                    result = 'Nenhum plano de multi-entrega ativo.';
                }

            // ── Tool: definir_pagamento ─────────────────────────────────────
            } else if (name === 'definir_pagamento') {
                const r = await CartService.setPaymentMethod(
                    ctx.botId, ctx.contactPhone, args.forma, args.troco_para ?? null
                );
                result = r.message;

            // ── Tool: fechar_pedido ─────────────────────────────────────────
            } else if (name === 'fechar_pedido') {
                // Remove trailing punctuation and whitespace before checking
                const cleanMsg = userMsgLower.trim().replace(/[!.,;:?]+$/, '').trim();
                // Exact-word match OR contains a confirmation keyword in the message
                const CONFIRM_WORDS = /\b(sim|pode|confirmo|confirmado|confirma|confirmar|ok|certeza|manda|mandar|isso|correto|claro|perfeito|fechado|bora|vai|ta bom|tá bom|ta ótimo|tá ótimo|tudo certo|pode fechar|pode enviar|pode mandar|pode ir|pode sim|sem troco|está certo|esta certo|quero sim|quero|aceito|aceitar|fechar|prosseguir|vamos|vamo|boa|beleza|show|top)\b/i;
                const isConfirmed = CONFIRM_WORDS.test(cleanMsg);
                if (!isConfirmed) {
                    result = '❌ Aguardando confirmação explícita do cliente. Apresente o resumo e aguarde "sim" ou "pode".';
                    toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                    continue;
                }

                // Prefer Redis plan for multi-delivery
                const freshPlan = await loadMultiPlan(ctx.botId, ctx.contactPhone);

                if (freshPlan && freshPlan.deliveries.length > 0) {
                    const hasPending = freshPlan.deliveries.some(d => d.needsAddress || !d.address);
                    if (hasPending) {
                        result = '❌ Ainda há endereços pendentes no plano. Solicite rua e número antes de fechar.';
                        toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                        continue;
                    }

                    const defProd = ctx.catalog.find(p => p.id === freshPlan.productId) ||
                        ctx.catalog.find(p => p.active && (p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13'))) ||
                        ctx.catalog.find(p => p.active) || ctx.catalog[0];

                    const payMethod = (cartSummary.paymentMethod || 'DINHEIRO').toUpperCase();
                    const changeAmt = cartSummary.changeAmount ?? null;
                    const unitPrice = Number(defProd?.salePrice ?? defProd?.price ?? 139);

                    const createdOrders: string[] = [];
                    let summaryText = '';

                    for (const delivery of freshPlan.deliveries) {
                        const total = delivery.qty * unitPrice;
                        const rawAddr = delivery.address!;
                        let verifiedAddr = rawAddr;
                        let lat: number | null = null;
                        let lng: number | null = null;

                        if (ctx.mapboxToken) {
                            const geo = await geocodeAddress(rawAddr, ctx.mapboxToken, ctx.botAddress);
                            if (geo.valid) {
                                if (allowedCitiesList.length > 0) {
                                    const geocodedCity = geo.city;
                                    const cityAllowed = geocodedCity
                                        ? allowedCitiesList.some(c => geocodedCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(geocodedCity.toLowerCase()))
                                        : allowedCitiesList.some(c => geo.resolvedAddr.toLowerCase().includes(c.toLowerCase()));
                                    if (!cityAllowed) {
                                        const citiesStr = allowedCitiesList.join(', ');
                                        result = `❌ Desculpe, não realizamos entregas em "${geo.resolvedAddr}". Atendemos apenas em: ${citiesStr}.`;
                                        toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                                        break;
                                    }
                                }
                                verifiedAddr = geo.resolvedAddr; lat = geo.lat; lng = geo.lng;
                            }
                        }

                        const created = await ctx.onOrderCreated({
                            address: verifiedAddr,
                            latitude: lat,
                            longitude: lng,
                            paymentMethod: payMethod,
                            changeAmount: changeAmt,
                            totalAmount: total,
                            items: [{ productId: defProd?.id || '', quantity: delivery.qty, unitPrice }]
                        });

                        createdOrders.push(created.orderId);
                        summaryText += `✅ Pedido #${created.orderId.substring(0, 6)}: ${delivery.qty}x ${defProd?.name || 'P13'} → ${verifiedAddr} (R$ ${total.toFixed(2)})\n`;
                    }

                    if (createdOrders.length > 0) {
                        await CartService.clearCart(ctx.botId, ctx.contactPhone);
                        await clearMultiPlan(ctx.botId, ctx.contactPhone);
                        orderConfirmed = true;
                        orderId = createdOrders.join(', ');
                        result = summaryText;
                    }

                } else if (args.entregas && Array.isArray(args.entregas) && args.entregas.length > 0) {
                    // LLM-provided entregas array (fallback path)
                    const defProd = ctx.catalog.find(p => p.active &&
                        (p.name.toLowerCase().includes('13') || p.name.toLowerCase().includes('p13'))
                    ) || ctx.catalog.find(p => p.active) || ctx.catalog[0];

                    const createdOrders: string[] = [];
                    let summaryText = '';

                    for (const delivery of args.entregas) {
                        const prod = ctx.catalog.find(p => p.id === delivery.produto_id) || defProd;
                        const unitPrice = Number(prod?.salePrice ?? prod?.price ?? 139);
                        const qty = Number(delivery.quantidade) || 1;
                        const total = qty * unitPrice;
                        const payMethod = (delivery.forma_pagamento || cartSummary.paymentMethod || 'DINHEIRO').toUpperCase();
                        const rawAddr = delivery.endereco || '';
                        let verifiedAddr = rawAddr;
                        let lat: number | null = null;
                        let lng: number | null = null;

                        if (ctx.mapboxToken && rawAddr) {
                            const geo = await geocodeAddress(rawAddr, ctx.mapboxToken, ctx.botAddress);
                            if (geo.valid) {
                                if (allowedCitiesList.length > 0) {
                                    const geocodedCity = geo.city;
                                    const cityAllowed = geocodedCity
                                        ? allowedCitiesList.some(c => geocodedCity.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(geocodedCity.toLowerCase()))
                                        : allowedCitiesList.some(c => geo.resolvedAddr.toLowerCase().includes(c.toLowerCase()));
                                    if (!cityAllowed) {
                                        const citiesStr = allowedCitiesList.join(', ');
                                        result = `❌ Desculpe, não realizamos entregas em "${geo.resolvedAddr}". Atendemos apenas em: ${citiesStr}.`;
                                        toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
                                        break;
                                    }
                                }
                                verifiedAddr = geo.resolvedAddr; lat = geo.lat; lng = geo.lng;
                            }
                        }

                        const created = await ctx.onOrderCreated({
                            address: verifiedAddr, latitude: lat, longitude: lng,
                            paymentMethod: payMethod, changeAmount: delivery.troco_para ?? null,
                            totalAmount: total,
                            items: [{ productId: prod?.id || '', quantity: qty, unitPrice }]
                        });

                        createdOrders.push(created.orderId);
                        summaryText += `✅ Pedido #${created.orderId.substring(0, 6)}: ${qty}x ${prod?.name || 'P13'} → ${verifiedAddr}\n`;
                    }

                    if (createdOrders.length > 0) {
                        await CartService.clearCart(ctx.botId, ctx.contactPhone);
                        await clearMultiPlan(ctx.botId, ctx.contactPhone);
                        orderConfirmed = true;
                        orderId = createdOrders.join(', ');
                        result = summaryText;
                    }

                } else {
                    // Single-address checkout from Cart
                    const readiness = await CartService.isReadyForCheckout(ctx.botId, ctx.contactPhone);
                    if (!readiness.ready) {
                        result = `❌ Pedido incompleto. Faltando: ${readiness.missing.join(', ')}`;
                    } else {
                        try {
                            const orderData = await CartService.convertToOrderData(ctx.botId, ctx.contactPhone);
                            const created = await ctx.onOrderCreated(orderData);
                            orderId = created.orderId;
                            orderConfirmed = true;
                            await clearMultiPlan(ctx.botId, ctx.contactPhone);
                            result = `✅ Pedido criado! Total: R$ ${orderData.totalAmount.toFixed(2)} | ${orderData.address} | ${orderData.paymentMethod}`;
                        } catch (e: any) {
                            result = `Erro ao criar pedido: ${e.message}`;
                        }
                    }
                }

            // ── Tool: cancelar_carrinho ─────────────────────────────────────
            } else if (name === 'cancelar_carrinho') {
                await CartService.clearCart(ctx.botId, ctx.contactPhone);
                await clearMultiPlan(ctx.botId, ctx.contactPhone);
                result = '🗑️ Carrinho cancelado. Pode fazer um novo pedido quando quiser.';
            }

            toolResults.push({ tool_call_id: tc.id, role: 'tool' as const, content: result });
        }

        messages.push({ role: 'assistant', content: content || null, tool_calls: toolCalls });
        messages.push(...toolResults);

        // Update the systemPrompt with the new state from the database before the next iteration
        const updatedPrompt = await buildSystemPrompt();
        messages[0] = { role: 'system', content: updatedPrompt };

        if (orderConfirmed) break;
    }

    // ── Post-processing: Build final reply if LLM didn't produce one ──────────
    const updatedSummary = await CartService.getCartSummary(ctx.botId, ctx.contactPhone);
    const firstName = (ctx.contactName || '').trim().split(' ')[0];
    const isGenericName = !firstName || /^(cliente|user|usuario|usuário|\d+)$/i.test(firstName);
    const nameSuffix = isGenericName ? '' : `, ${firstName}`;
    const totalVal = Number(updatedSummary.totalAmount ?? 0);
    const isMultiOrder = orderId?.includes(',');

    if (orderConfirmed) {
        reply = `🎉 *Pedido${isMultiOrder ? 's' : ''} Confirmado${isMultiOrder ? 's' : ''}!*${!isGenericName ? `\n\nObrigado, ${firstName}!` : ''}\n\nSeu${isMultiOrder ? 's' : ''} pedido${isMultiOrder ? 's foram registrados' : ' foi registrado'} e nosso entregador já está a caminho! 😊\n\nSe precisar de mais alguma coisa, é só avisar!`;
    } else if (!reply && updatedSummary.hasItems && updatedSummary.deliveryAddress && updatedSummary.paymentMethod) {
        reply = `📋 *Resumo do Pedido:*\n\n${updatedSummary.itemsText}\n📍 *Endereço:* ${updatedSummary.deliveryAddress}\n💳 *Pagamento:* ${updatedSummary.paymentMethod}\n💰 *Total:* R$ ${totalVal.toFixed(2)}\n\nPosso confirmar${nameSuffix}? (responda *"sim"* ou *"pode"*)`;
    } else if (!reply && updatedSummary.hasItems) {
        const missing: string[] = [];
        if (!updatedSummary.deliveryAddress) missing.push('endereço de entrega');
        if (!updatedSummary.paymentMethod) missing.push('forma de pagamento');
        if (missing.length > 0) {
            reply = `🛒 ${updatedSummary.itemsText}\n\nAinda preciso saber: ${missing.join(' e ')}.`;
        }
    }

    return { reply, orderConfirmed, orderId, cartSummary: updatedSummary };
}

// ─── Helper: Create Order from Cart Data ─────────────────────────────────────

export async function createOrderFromCartData(
    botId: string,
    contactId: string,
    orderData: Awaited<ReturnType<typeof CartService.convertToOrderData>>
): Promise<{ orderId: string }> {
    console.log(`[OrderCreate] Creating order botId=${botId} contactId=${contactId} address="${orderData.address}" total=${orderData.totalAmount} items=${JSON.stringify(orderData.items)}`);
    try {
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
        console.log(`[OrderCreate] SUCCESS orderId=${order.id}`);
        return { orderId: order.id };
    } catch (err: any) {
        console.error(`[OrderCreate] FAILED:`, err.message, err);
        throw err;
    }
}
