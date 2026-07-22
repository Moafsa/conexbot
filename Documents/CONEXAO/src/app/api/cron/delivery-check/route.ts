import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UzapiService } from '@/services/engine/uzapi';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get('secret');
    
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Find orders dispatched more than 30 minutes ago where check hasn't been sent
        const pendingChecks = await prisma.order.findMany({
            where: {
                status: 'DISPATCHED',
                followUpSent: false,
                updatedAt: {
                    lt: thirtyMinutesAgo
                },
                driverId: {
                    not: null
                }
            },
            include: {
                driver: true,
                contact: true, // customer
                bot: true
            }
        });

        let sentCount = 0;

        for (const order of pendingChecks) {
            if (!order.driver || !order.contact || !order.bot) continue;

            const driverPhone = order.driver.phone;
            const customerName = order.contact.name || 'Cliente';
            const botSession = order.bot.sessionName || '';

            const followUpMsg = `👋 Olá! Passaram-se 30 minutos desde que você iniciou a entrega para *${customerName}*.\n\n` +
                `*Deu tudo certo com a entrega?*\n\n` +
                `Por favor, responda com *SIM* ou *NÃO* diretamente neste chat.`;

            try {
                const { sendOutboundMessageToPhone } = await import('@/services/engine/outbound-notifier');
                await sendOutboundMessageToPhone(order.bot, driverPhone, followUpMsg);
                
                await prisma.order.update({
                    where: { id: order.id },
                    data: { followUpSent: true }
                });

                sentCount++;
            } catch (e: any) {
                console.error(`Failed to send follow-up check for order ${order.id}:`, e);
            }
        }

        return NextResponse.json({ success: true, processed: pendingChecks.length, sent: sentCount });
    } catch (error: any) {
        console.error('[Cron Delivery Check Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
