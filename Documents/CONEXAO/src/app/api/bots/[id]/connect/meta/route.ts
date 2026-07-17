export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MetaApiError } from '@/services/meta/meta-service';
import { connectMetaWhatsAppForBot } from '@/services/meta/connect-flow';
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
        const body = await req.json();
        const { code, wabaId, phoneNumberId, businessId, clientId, token } = body;

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
            return NextResponse.json({ error: 'Agente não encontrado ou sem permissão' }, { status: 404 });
        }

        const result = await connectMetaWhatsAppForBot(botId, { code, wabaId, phoneNumberId, businessId });
        return NextResponse.json(result);

    } catch (error: any) {
        const isMetaError = error instanceof MetaApiError;
        console.error('[Meta Connect API] Error:', error.message);
        logToFile(`[Meta Connect] Erro bot=${botId}: ${error.message}`);
        return NextResponse.json(
            { error: error.message || 'Falha ao conectar o WhatsApp oficial.', metaCode: isMetaError ? error.code : undefined },
            { status: error.message?.includes('obrigatório') ? 400 : error.message?.includes('encontrad') ? 404 : 500 }
        );
    }
}
