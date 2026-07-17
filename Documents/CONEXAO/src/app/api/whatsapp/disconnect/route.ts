export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { botId, clientId } = await req.json();

        if (!botId) {
            return NextResponse.json({ error: 'Bot ID não fornecido' }, { status: 400 });
        }

        const tenantId = await getEffectiveTenantId(clientId);
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId: tenantId ?? undefined }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 });
        }

        if (bot.sessionName) {
            await UzapiService.logout(bot.sessionName);
        }

        await prisma.bot.update({
            where: { id: botId },
            data: { connectionStatus: 'DISCONNECTED' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API /whatsapp/disconnect] Error:', error);
        return NextResponse.json({ error: 'Falha ao desconectar' }, { status: 500 });
    }
}

