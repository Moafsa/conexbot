import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("clientId");
        const tenantId = await getEffectiveTenantId(clientId);

        if (!tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { driverId } = body;

        if (!driverId) {
            return NextResponse.json({ error: 'Missing driverId' }, { status: 400 });
        }

        // Find driver contact
        const driver = await prisma.contact.findFirst({
            where: { id: driverId, tenantId, contactType: 'DRIVER' }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 });
        }

        // Find bot to send the message
        let bot = null;
        if (driver.botId) {
            bot = await prisma.bot.findUnique({
                where: { id: driver.botId }
            });
        }

        if (!bot) {
            bot = await prisma.bot.findFirst({
                where: { tenantId }
            });
        }

        if (!bot) {
            return NextResponse.json({ error: 'Nenhum bot encontrado para enviar a mensagem WhatsApp.' }, { status: 400 });
        }

        // Generate PWA magic login token
        const crypto = require('crypto');
        const token = crypto.randomBytes(16).toString('hex');
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days token validity

        await prisma.contact.update({
            where: { id: driverId },
            data: {
                loginToken: token,
                loginTokenExpires: tokenExpires
            }
        });

        // Send app link via WhatsApp
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.conext.click';
        const pwaUrl = `${appUrl}/driver?token=${token}`;
        const messageText = `Olá, *${driver.name}*!\n\nAqui está o seu link de acesso exclusivo para o aplicativo do entregador (PWA):\n\n📱 *Link de Acesso:*\n${pwaUrl}\n\n_Abra o link no navegador do celular, ative a geolocalização e adicione o app à sua tela inicial para receber corridas!_`;

        const { sendOutboundMessageToPhone } = await import('@/services/engine/outbound-notifier');
        const sent = await sendOutboundMessageToPhone(bot, driver.phone, messageText);

        if (!sent) {
            return NextResponse.json({ 
                error: `Falha ao enviar mensagem de WhatsApp. Verifique se o canal WhatsApp do bot '${bot.name}' está ativo.` 
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API Send Link POST Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
