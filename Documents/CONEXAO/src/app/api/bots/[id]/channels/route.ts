import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import { MetaService } from '@/services/meta/meta-service';
import { logToFile } from '@/services/engine/logger';

// Helper to check bot ownership
async function checkBotOwnership(botId: string, tenantId: string) {
    const bot = await prisma.bot.findUnique({
        where: { id: botId, tenantId },
    });
    return bot !== null;
}

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');
        const token = searchParams.get('token');
        const { id: botId } = await params;

        let hasAccess = false;
        if (session?.user) {
            const tenantId = await getEffectiveTenantId(clientId);
            hasAccess = tenantId ? (await checkBotOwnership(botId, tenantId)) : false;
        } else if (token) {
            const bot = await prisma.bot.findFirst({
                where: { id: botId, connectToken: token }
            });
            hasAccess = bot !== null;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Bot não encontrado ou sem permissão' }, { status: 404 });
        }

        const channels = await prisma.botChannel.findMany({
            where: { botId },
            orderBy: { createdAt: 'desc' },
        });

        // Hide sensitive credentials before returning to frontend (mantém apenas metadados não sensíveis)
        const safeChannels = channels.map(c => {
            const creds = c.credentials as any;
            return {
                id: c.id,
                botId: c.botId,
                provider: c.provider,
                status: c.status,
                identifier: c.identifier,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                hasCredentials: !!c.credentials,
                displayNumber: creds?.displayNumber || null,
                verifiedName: creds?.verifiedName || null,
                username: creds?.username || null,
                pageName: creds?.pageName || null,
            };
        });

        return NextResponse.json(safeChannels);
    } catch (error) {
        console.error('Error fetching bot channels:', error);
        return NextResponse.json({ error: 'Falha ao buscar canais' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');
        const token = searchParams.get('token');
        const { id: botId } = await params;

        const body = await req.json();
        const { provider, identifier, credentials, token: bodyToken } = body;
        const actualToken = token || bodyToken;

        let hasAccess = false;
        if (session?.user) {
            const tenantId = await getEffectiveTenantId(clientId);
            hasAccess = tenantId ? (await checkBotOwnership(botId, tenantId)) : false;
        } else if (actualToken) {
            const bot = await prisma.bot.findFirst({
                where: { id: botId, connectToken: actualToken }
            });
            hasAccess = bot !== null;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Bot não encontrado ou sem permissão' }, { status: 404 });
        }

        if (!provider) {
            return NextResponse.json({ error: 'Provedor é obrigatório' }, { status: 400 });
        }

        // Upsert based on botId + provider + identifier? 
        // Actually unique is provider + identifier.
        // But for simplicity, we allow one channel per provider per bot or just create.
        // Let's just create or update if it exists for this bot and provider
        const existingChannel = await prisma.botChannel.findFirst({
            where: { botId, provider }
        });

        let savedChannel;
        if (existingChannel) {
            savedChannel = await prisma.botChannel.update({
                where: { id: existingChannel.id },
                data: {
                    identifier: identifier || existingChannel.identifier,
                    credentials: credentials ? credentials : existingChannel.credentials,
                    status: 'CONNECTED' // assume connected if credentials provided
                }
            });
        } else {
            savedChannel = await prisma.botChannel.create({
                data: {
                    botId,
                    provider,
                    identifier,
                    credentials,
                    status: 'CONNECTED'
                }
            });
        }

        // Ao salvar credenciais manualmente para o WhatsApp Oficial (Meta), o front-end
        // não passa pelo fluxo de Embedded Signup (connect-flow.ts), que é o único lugar
        // que chamava subscribeAppToWaba. Sem essa assinatura, um token novo/válido não
        // basta: a Meta continua sem enviar eventos de webhook pra essa WABA (por exemplo,
        // depois que um token antigo expira com subcode 463, a Meta pausa o envio de
        // eventos e só volta a mandar depois que o app se re-inscreve na WABA). Replicamos
        // esse passo aqui para o caminho manual não ficar "mudo" silenciosamente.
        let webhookSubscription: 'ok' | 'skipped' | 'failed' | undefined;
        let webhookSubscriptionError: string | undefined;

        if (provider === 'META_WHATSAPP') {
            const creds = (credentials || {}) as any;
            const wabaId = creds.wabaId;
            const accessToken = creds.accessToken;

            if (wabaId && accessToken) {
                try {
                    await MetaService.subscribeAppToWaba(wabaId, accessToken);
                    webhookSubscription = 'ok';
                } catch (e: any) {
                    webhookSubscription = 'failed';
                    webhookSubscriptionError = e?.message || 'Erro desconhecido';
                    logToFile(`[Channels API] subscribeAppToWaba falhou para waba=${wabaId} botId=${botId}: ${webhookSubscriptionError}`);
                }
            } else if (accessToken) {
                // Sem wabaId não temos como assinar o webhook — apenas avisamos.
                webhookSubscription = 'skipped';
            }
        }

        return NextResponse.json(
            { ...savedChannel, webhookSubscription, webhookSubscriptionError },
            { status: existingChannel ? 200 : 201 }
        );

    } catch (error) {
        console.error('Error saving bot channel:', error);
        return NextResponse.json({ error: 'Falha ao salvar canal' }, { status: 500 });
    }
}
