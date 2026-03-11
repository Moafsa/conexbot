import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const botId = url.searchParams.get('botId');
        const token = url.searchParams.get('token');

        const session = await getServerSession(authOptions);

        let bot;
        if (token) {
            bot = await prisma.bot.findFirst({
                where: { connectToken: token },
            });
        } else if (session?.user) {
            const tenantId = (session.user as any).id;
            bot = await prisma.bot.findFirst({
                where: { id: botId as string, tenantId },
            });
        }

        if (!bot || !bot.sessionName) {
            return NextResponse.json({ status: 'DISCONNECTED' });
        }

        const status = await UzapiService.getSessionStatus(bot.sessionName);

        // Aggressive sync: if Uzapi says CONNECTED, update DB immediately
        if (status === 'CONNECTED' && bot.connectionStatus !== 'CONNECTED') {
            console.log(`[StatusRoute] Syncing CONNECTED status for ${bot.sessionName}`);
            await prisma.bot.update({
                where: { id: bot.id },
                data: { connectionStatus: 'CONNECTED' }
            }).catch(e => console.error('Failed to sync CONNECTED status:', e));
        } else if (status !== bot.connectionStatus) {
            // General sync for other states
            await prisma.bot.update({
                where: { id: bot.id },
                data: { connectionStatus: status }
            }).catch(e => console.error('Failed to sync status to DB:', e));
        }

        let qrCode = null;
        if (status === 'QRCODE' || (status === 'DISCONNECTED' && bot.connectionStatus === 'QRCODE')) {
            qrCode = await UzapiService.getQrCode(bot.sessionName);
        }

        return NextResponse.json({
            status,
            qrCodeUrl: qrCode,
        });

    } catch (error: any) {
        const errorMsg = `[${new Date().toISOString()}] Status Error: ${error.message}\nStack: ${error.stack}\n`;
        try { require('fs').appendFileSync('connect-debug.log', errorMsg); } catch (e) {}
        console.error('WhatsApp Status Detailed Error:', error);
        return NextResponse.json({ error: 'Falha ao verificar status', details: error.message }, { status: 500 });
    }
}
