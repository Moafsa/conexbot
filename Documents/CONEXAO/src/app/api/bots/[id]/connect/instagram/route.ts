export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MetaApiError } from '@/services/meta/meta-service';
import { connectInstagramForBot } from '@/services/meta/connect-instagram-flow';
import { logToFile } from '@/services/engine/logger';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

async function checkBotOwnership(botId: string, tenantId: string) {
    const bot = await prisma.bot.findUnique({ where: { id: botId, tenantId } });
    return bot !== null;
}

export async function POST(req: Request, { params }: { params: any }) {
    const { id: botId } = await params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { code, clientId } = body;

        // Considera personificação de admin e gestão de cliente por agência (mesmo padrão de /api/bots)
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId || !(await checkBotOwnership(botId, tenantId))) {
            return NextResponse.json({ error: 'Agente não encontrado ou sem permissão' }, { status: 404 });
        }

        const result = await connectInstagramForBot(botId, { code });
        return NextResponse.json(result);

    } catch (error: any) {
        const isMetaError = error instanceof MetaApiError;
        console.error('[Instagram Connect API] Error:', error.message);
        logToFile(`[Instagram Connect] Erro bot=${botId}: ${error.message}`);
        return NextResponse.json(
            { error: error.message || 'Falha ao conectar o Instagram.', metaCode: isMetaError ? error.code : undefined },
            { status: error.message?.includes('obrigatório') ? 400 : error.message?.includes('encontrad') ? 404 : 500 }
        );
    }
}
