export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import prisma from '@/lib/prisma';

// In-memory job store (single process, sufficient for this use case)
type JobStatus = 'running' | 'done' | 'error';
interface ImportJob {
    status: JobStatus;
    botId: string;
    steps: { label: string; done: boolean; count?: number }[];
    total: number;
    imported: number;
    errors: string[];
    log: string[];
    startedAt: Date;
    finishedAt?: Date;
}

const jobs = new Map<string, ImportJob>();
const subscribers = new Map<string, Set<(data: string) => void>>();

function emit(jobId: string, event: string, data: unknown) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    subscribers.get(jobId)?.forEach(fn => fn(msg));
}

function updateJob(jobId: string, patch: Partial<ImportJob>) {
    const job = jobs.get(jobId);
    if (!job) return;
    Object.assign(job, patch);
    emit(jobId, 'progress', job);
}

async function runImport(jobId: string, botId: string, tenantId: string) {
    const job = jobs.get(jobId)!;

    const log = (msg: string) => {
        job.log.push(msg);
        emit(jobId, 'log', { msg });
    };

    try {
        // ── Step 1: Get bot info ──────────────────────────────────────────
        updateJob(jobId, { steps: job.steps.map((s, i) => i === 0 ? { ...s, done: false } : s) });
        log('Buscando dados do bot...');

        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            select: { id: true, name: true, chatwootUrl: true, chatwootToken: true, chatwootAccountId: true, chatwootInboxId: true },
        });
        if (!bot) throw new Error('Bot não encontrado');
        log(`Bot: ${bot.name}`);

        const UZAPI_URL = process.env.UZAPI_URL || 'http://localhost:21465';
        const sessionToken = `bot-${botId}`;

        // Enable history on this WUZAPI session
        const UZAPI_ADMIN = process.env.UZAPI_SECRET_KEY || 'admin_token_123';
        const usersRes = await fetch(`${UZAPI_URL}/admin/users`, { headers: { 'Authorization': UZAPI_ADMIN } }).catch(() => null);
        let uzapiUserId: string | null = null;
        if (usersRes?.ok) {
            const usersData = await usersRes.json();
            const user = (usersData.data || []).find((u: any) => u.name === `bot-${botId}`);
            if (user) {
                uzapiUserId = user.id;
                await fetch(`${UZAPI_URL}/admin/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': UZAPI_ADMIN, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: 1 }),
                }).catch(() => null);
                log('Histórico habilitado no WUZAPI');
            }
        }

        // Step 1 done
        job.steps[0].done = true;
        emit(jobId, 'progress', job);

        // ── Step 2: Discover contacts ─────────────────────────────────────
        log('Descobrindo contatos...');
        job.steps[1].done = false;
        emit(jobId, 'progress', job);

        const dbContacts = await prisma.contact.findMany({
            where: { tenantId, botId },
            select: { id: true, phone: true, name: true, email: true },
        });
        log(`${dbContacts.length} contato(s) no banco de dados`);

        // Also discover from whatsmeow_contacts via Chatwoot if configured
        const chatwootContacts: Array<{ phone: string; name: string }> = [];
        if (bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId) {
            try {
                const base = bot.chatwootUrl.replace(/\/$/, '');
                let page = 1;
                while (true) {
                    const res = await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/contacts?page=${page}&include_contacts=true`, {
                        headers: { 'api_access_token': bot.chatwootToken },
                    });
                    if (!res.ok) break;
                    const data = await res.json();
                    const items: any[] = data.payload || [];
                    if (items.length === 0) break;
                    for (const c of items) {
                        if (c.phone_number) {
                            chatwootContacts.push({ phone: c.phone_number.replace(/\D/g, ''), name: c.name || c.phone_number });
                        }
                    }
                    if (items.length < 15) break;
                    page++;
                    if (page > 20) break;
                }
                log(`${chatwootContacts.length} contato(s) encontrado(s) no Chatwoot`);
            } catch (e: any) {
                log(`Aviso: Chatwoot inacessível — ${e.message}`);
            }
        }

        // Merge all known phones
        const knownPhones = new Map<string, string>(); // phone → name
        for (const c of dbContacts) knownPhones.set(c.phone.replace(/\D/g, ''), c.name || c.phone);
        for (const c of chatwootContacts) if (!knownPhones.has(c.phone)) knownPhones.set(c.phone, c.name);

        job.steps[1].done = true;
        job.steps[1].count = knownPhones.size;
        job.total = knownPhones.size;
        emit(jobId, 'progress', job);

        // ── Step 3: Import messages from WUZAPI ───────────────────────────
        log(`Importando histórico de ${knownPhones.size} contato(s)...`);
        job.steps[2].done = false;
        emit(jobId, 'progress', job);

        let importedContacts = 0;
        let importedMessages = 0;
        let importedChatwoot = 0;

        for (const [phone, name] of knownPhones) {
            const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

            // Fetch history from WUZAPI
            let history: any[] = [];
            try {
                const histRes = await fetch(`${UZAPI_URL}/chat/history?chat_jid=${encodeURIComponent(jid)}&count=200`, {
                    headers: { 'Token': sessionToken },
                });
                if (histRes.ok) {
                    const histData = await histRes.json();
                    history = histData.data || [];
                }
            } catch (e: any) {
                job.errors.push(`WUZAPI history ${phone}: ${e.message}`);
            }

            if (history.length === 0) {
                job.imported++;
                emit(jobId, 'progress', job);
                continue;
            }

            // Upsert Contact in local DB
            const cleanPhone = phone.replace(/\D/g, '');
            try {
                await prisma.contact.upsert({
                    where: { phone_botId: { phone: cleanPhone, botId } },
                    create: { phone: cleanPhone, name, botId, tenantId, lastActive: new Date() },
                    update: { lastActive: new Date(), ...(name && name !== cleanPhone ? { name } : {}) },
                });
                importedContacts++;
            } catch (e: any) {
                job.errors.push(`Contact upsert ${phone}: ${e.message}`);
            }

            // Upsert Conversation
            let convId: string | null = null;
            try {
                const conv = await prisma.conversation.upsert({
                    where: { botId_remoteId: { botId, remoteId: cleanPhone } },
                    create: { botId, remoteId: cleanPhone, channel: 'whatsapp', status: 'open' },
                    update: { updatedAt: new Date() },
                });
                convId = conv.id;
            } catch (e: any) {
                job.errors.push(`Conversation upsert ${phone}: ${e.message}`);
            }

            if (convId) {
                // Import messages
                const existingMsgIds = new Set(
                    (await prisma.message.findMany({ where: { conversationId: convId }, select: { tool_call_id: true } }))
                        .map(m => m.tool_call_id).filter(Boolean)
                );

                for (const item of history) {
                    const msgId = item.message_id;
                    if (msgId && existingMsgIds.has(msgId)) continue;

                    const content = item.text_content || '[mídia]';
                    const fromMe = item.sender_jid?.includes(phone) === false || item.sender_jid?.startsWith('55');
                    const role = item.sender_jid === jid ? 'user' : 'assistant';
                    const ts = item.timestamp ? new Date(item.timestamp) : new Date();

                    try {
                        await prisma.message.create({
                            data: {
                                conversationId: convId,
                                content,
                                role,
                                createdAt: ts,
                                tool_call_id: msgId || undefined,
                            },
                        });
                        importedMessages++;
                    } catch (e: any) {
                        // duplicate key — ignore
                    }
                }
            }

            // Push contact + conversation to Chatwoot
            if (bot.chatwootUrl && bot.chatwootToken && bot.chatwootAccountId && bot.chatwootInboxId) {
                try {
                    const base = bot.chatwootUrl.replace(/\/$/, '');
                    const headers = { 'api_access_token': bot.chatwootToken, 'Content-Type': 'application/json' };

                    // Find or create contact in Chatwoot
                    const searchRes = await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/contacts/search?q=${encodeURIComponent(cleanPhone)}`, { headers });
                    let cwContactId: number | null = null;
                    if (searchRes.ok) {
                        const sData = await searchRes.json();
                        cwContactId = sData.payload?.[0]?.id || null;
                    }
                    if (!cwContactId) {
                        const createRes = await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/contacts`, {
                            method: 'POST', headers,
                            body: JSON.stringify({ name: name || cleanPhone, phone_number: `+${cleanPhone}` }),
                        });
                        if (createRes.ok) {
                            const created = await createRes.json();
                            cwContactId = created.id;
                        }
                    }

                    if (cwContactId && history.length > 0) {
                        // Create conversation in Chatwoot
                        const convRes = await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/conversations`, {
                            method: 'POST', headers,
                            body: JSON.stringify({
                                contact_id: cwContactId,
                                inbox_id: parseInt(bot.chatwootInboxId),
                            }),
                        });
                        if (convRes.ok) {
                            const cwConv = await convRes.json();
                            const cwConvId = cwConv.id;

                            // Push messages to Chatwoot (last 50 only to avoid overload)
                            const toSend = history.slice(-50);
                            for (const item of toSend) {
                                const content = item.text_content;
                                if (!content || content === '[mídia]') continue;
                                const fromMe = item.sender_jid !== jid;
                                await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${cwConvId}/messages`, {
                                    method: 'POST', headers,
                                    body: JSON.stringify({
                                        content,
                                        message_type: fromMe ? 'outgoing' : 'incoming',
                                        private: false,
                                    }),
                                }).catch(() => null);
                            }
                            importedChatwoot++;
                        }
                    }
                } catch (e: any) {
                    job.errors.push(`Chatwoot ${phone}: ${e.message}`);
                }
            }

            job.imported++;
            emit(jobId, 'progress', job);
            // Small delay to avoid overwhelming services
            await new Promise(r => setTimeout(r, 50));
        }

        job.steps[2].done = true;
        job.steps[2].count = importedMessages;
        emit(jobId, 'progress', job);

        // ── Step 4: Finalize ──────────────────────────────────────────────
        job.steps[3].done = true;
        log(`✅ Importação concluída!`);
        log(`   • ${importedContacts} contato(s) importado(s)`);
        log(`   • ${importedMessages} mensagem(ns) importada(s)`);
        if (importedChatwoot > 0) log(`   • ${importedChatwoot} conversa(s) enviada(s) ao Chatwoot`);
        if (job.errors.length > 0) log(`   • ${job.errors.length} erro(s) — veja detalhes`);

        updateJob(jobId, { status: 'done', finishedAt: new Date() });
    } catch (err: any) {
        log(`❌ Erro fatal: ${err.message}`);
        updateJob(jobId, { status: 'error', finishedAt: new Date() });
    }
}

// POST — start import job
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const tenantId = await getEffectiveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { botId } = body;
    if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

    // Verify bot belongs to tenant
    const bot = await prisma.bot.findFirst({ where: { id: botId, tenantId } });
    if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

    const jobId = `${botId}-${Date.now()}`;
    const job: ImportJob = {
        status: 'running',
        botId,
        steps: [
            { label: 'Carregando dados do bot', done: false },
            { label: 'Descobrindo contatos', done: false },
            { label: 'Importando mensagens do WhatsApp', done: false },
            { label: 'Finalizado', done: false },
        ],
        total: 0,
        imported: 0,
        errors: [],
        log: [],
        startedAt: new Date(),
    };
    jobs.set(jobId, job);

    // Run async (fire and forget)
    runImport(jobId, botId, tenantId);

    return NextResponse.json({ jobId });
}

// GET — SSE stream for job progress
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return new Response('jobId required', { status: 400 });

    const job = jobs.get(jobId);
    if (!job) return new Response('Job not found', { status: 404 });

    let controller: ReadableStreamDefaultController<string>;
    const stream = new ReadableStream<string>({
        start(c) {
            controller = c;
            // Send current state immediately
            c.enqueue(`event: progress\ndata: ${JSON.stringify(job)}\n\n`);

            // Subscribe to future updates
            if (!subscribers.has(jobId)) subscribers.set(jobId, new Set());
            const send = (data: string) => { try { c.enqueue(data); } catch {} };
            subscribers.get(jobId)!.add(send);

            // Clean up on close
            req.signal.addEventListener('abort', () => {
                subscribers.get(jobId)?.delete(send);
                try { c.close(); } catch {}
            });
        },
        cancel() {
            // nothing — cleanup handled above
        },
    });

    return new Response(stream as any, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
