import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper to check bot ownership
async function checkBotOwnership(botId: string, tenantId: string) {
    const bot = await prisma.bot.findUnique({
        where: { id: botId, tenantId },
    });
    return bot !== null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        const { id: botId } = await params;

        if (!(await checkBotOwnership(botId, tenantId))) {
            return NextResponse.json({ error: 'Bot não encontrado ou sem permissão' }, { status: 404 });
        }

        const channels = await prisma.botChannel.findMany({
            where: { botId },
            orderBy: { createdAt: 'desc' },
        });

        // Hide sensitive credentials before returning to frontend
        const safeChannels = channels.map(c => ({
            id: c.id,
            botId: c.botId,
            provider: c.provider,
            status: c.status,
            identifier: c.identifier,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            hasCredentials: !!c.credentials
        }));

        return NextResponse.json(safeChannels);
    } catch (error) {
        console.error('Error fetching bot channels:', error);
        return NextResponse.json({ error: 'Falha ao buscar canais' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        const { id: botId } = await params;

        if (!(await checkBotOwnership(botId, tenantId))) {
            return NextResponse.json({ error: 'Bot não encontrado ou sem permissão' }, { status: 404 });
        }

        const { provider, identifier, credentials } = await req.json();

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

        if (existingChannel) {
            const updated = await prisma.botChannel.update({
                where: { id: existingChannel.id },
                data: {
                    identifier: identifier || existingChannel.identifier,
                    credentials: credentials ? credentials : existingChannel.credentials,
                    status: 'CONNECTED' // assume connected if credentials provided
                }
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.botChannel.create({
                data: {
                    botId,
                    provider,
                    identifier,
                    credentials,
                    status: 'CONNECTED'
                }
            });
            return NextResponse.json(created, { status: 201 });
        }

    } catch (error) {
        console.error('Error saving bot channel:', error);
        return NextResponse.json({ error: 'Falha ao salvar canal' }, { status: 500 });
    }
}
