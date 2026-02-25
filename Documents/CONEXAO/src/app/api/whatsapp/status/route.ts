import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const url = new URL(req.url);
        const botId = url.searchParams.get('botId');

        if (!botId) {
            return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
        }

        const tenantId = (session.user as any).id;
        const bot = await prisma.bot.findFirst({
            where: { id: botId, tenantId },
        });

        if (!bot || !bot.sessionName) {
            return NextResponse.json({ status: 'DISCONNECTED' });
        }

        const status = await UzapiService.getSessionStatus(bot.sessionName);

        let qrCode = null;
        if (status === 'QRCODE') {
            qrCode = await UzapiService.getQrCode(bot.sessionName);
        }

        return NextResponse.json({
            status,
            qrCodeUrl: qrCode,
        });

    } catch (error) {
        console.error('WhatsApp Status Error:', error);
        return NextResponse.json({ error: 'Falha ao verificar status' }, { status: 500 });
    }
}
