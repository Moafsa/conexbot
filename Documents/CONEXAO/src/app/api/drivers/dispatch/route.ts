import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import { UzapiService } from '@/services/engine/uzapi';
import { ChatwootService } from '@/services/engine/chatwoot';
import crypto from 'crypto';

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
        const { orderId, driverId } = body;

        if (!orderId || !driverId) {
            return NextResponse.json({ error: 'Order ID and Driver ID are required' }, { status: 400 });
        }

        // 1. Get driver
        const driver = await prisma.contact.findFirst({
            where: { id: driverId, tenantId, contactType: 'DRIVER' }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // 2. Get order
        const order = await prisma.order.findFirst({
            where: { id: orderId, bot: { tenantId } },
            include: {
                contact: true,
                bot: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 3. Generate token for driver PWA
        const token = crypto.randomBytes(16).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await prisma.contact.update({
            where: { id: driver.id },
            data: {
                loginToken: token,
                loginTokenExpires: tokenExpires,
                activeJobs: { increment: 1 }
            }
        });

        // 4. Link order to driver
        await prisma.order.update({
            where: { id: order.id },
            data: {
                driverId: driver.id,
                status: 'DISPATCHED'
            }
        });

        // 5. Send message via WhatsApp
        const botSession = order.bot?.sessionName || '';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const customerName = order.contact?.name || 'Cliente Sem Nome';
        const customerPhone = order.contact?.phone || '';
        const deliveryAddress = order.contact?.notes || order.contact?.needs || 'Endereço não especificado';
        const orderItemsStr = order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ');

        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`;
        const pwaUrl = `${appUrl}/driver?token=${token}`;

        const dispatchMsg = `🚚 *NOVA ENTREGA ATRIBUÍDA (MANUAL)* 🚚\n\n` +
            `*Cliente:* ${customerName}\n` +
            `*WhatsApp Cliente:* wa.me/${customerPhone.replace(/\D/g, '')}\n` +
            `*Endereço:* ${deliveryAddress}\n` +
            `*Itens:* ${orderItemsStr}\n\n` +
            `📍 *Iniciar Rota no Google Maps:*\n${mapsUrl}\n\n` +
            `📱 *Painel de Rastreamento (GPS):*\n${pwaUrl}\n\n` +
            `Por favor, clique no link do painel para ativar seu GPS e iniciar a corrida.`;

        const sentResult = await sendOutboundMessageToPhone(order.bot, driver.phone, dispatchMsg);
        if (!sentResult.success) {
            return NextResponse.json({ 
                error: sentResult.error || `Falha ao enviar notificação para o entregador via WhatsApp.` 
            }, { status: 500 });
        }

        // 6. Assign conversation in Chatwoot
        const conversation = await prisma.conversation.findFirst({
            where: { botId: order.botId, remoteId: customerPhone }
        });

        const cwConvId = conversation?.chatwootConversationId || (conversation as any)?.chatwootConversationId;
        if (cwConvId && order.bot.chatwootUrl && order.bot.chatwootToken) {
            const driverEmail = `${driver.phone}@entregador.conext.bot`;
            const agent = await ChatwootService.getAgentByEmail(order.bot, driverEmail);
            if (agent) {
                await ChatwootService.assignConversation(order.bot, cwConvId, agent.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API Manual Dispatch Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
