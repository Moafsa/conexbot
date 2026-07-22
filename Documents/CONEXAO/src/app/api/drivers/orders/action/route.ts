import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const urlObj = new URL(req.url);
        const clientId = urlObj.searchParams.get('clientId');
        const tenantId = await getEffectiveTenantId(clientId);

        if (!session || !tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, action } = body; // action: 'UNASSIGN' | 'DELIVER' | 'CANCEL' | 'DELETE'

        if (!orderId || !action) {
            return NextResponse.json({ error: 'Order ID and action are required' }, { status: 400 });
        }

        // Find order belonging to tenant
        const order = await prisma.order.findFirst({
            where: { id: orderId, bot: { tenantId } },
            include: { driver: true, bot: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        const currentDriverId = order.driverId;

        if (action === 'UNASSIGN') {
            // Unassign driver -> Return order to PENDING pool
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    driverId: null,
                    status: 'PENDING'
                }
            });

            if (currentDriverId) {
                await prisma.contact.updateMany({
                    where: { id: currentDriverId, activeJobs: { gt: 0 } },
                    data: { activeJobs: { decrement: 1 } }
                });
            }

            return NextResponse.json({ success: true, message: 'Pedido devolvido para a lista de pendentes com sucesso.' });
        }

        if (action === 'DELIVER') {
            // Mark order as DELIVERED
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'DELIVERED' }
            });

            if (currentDriverId) {
                await prisma.contact.updateMany({
                    where: { id: currentDriverId, activeJobs: { gt: 0 } },
                    data: { activeJobs: { decrement: 1 } }
                });
            }

            // Optional: Move contact to "ENTREGUE" CRM stage if present
            const deliveredStage = await prisma.crmStage.findFirst({
                where: { botId: order.botId, name: { contains: 'ENTREGUE', mode: 'insensitive' } }
            });

            if (deliveredStage && order.contactId) {
                await prisma.contact.update({
                    where: { id: order.contactId },
                    data: { stageId: deliveredStage.id, funnelStage: deliveredStage.name }
                });
            }

            return NextResponse.json({ success: true, message: 'Pedido marcado como entregue.' });
        }

        if (action === 'CANCEL') {
            // Mark order as CANCELLED
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'CANCELLED' }
            });

            if (currentDriverId) {
                await prisma.contact.updateMany({
                    where: { id: currentDriverId, activeJobs: { gt: 0 } },
                    data: { activeJobs: { decrement: 1 } }
                });
            }

            return NextResponse.json({ success: true, message: 'Entrega cancelada.' });
        }

        if (action === 'DELETE') {
            // Delete OrderItems and Order
            await prisma.orderItem.deleteMany({
                where: { orderId: order.id }
            });

            await prisma.order.delete({
                where: { id: order.id }
            });

            if (currentDriverId) {
                await prisma.contact.updateMany({
                    where: { id: currentDriverId, activeJobs: { gt: 0 } },
                    data: { activeJobs: { decrement: 1 } }
                });
            }

            return NextResponse.json({ success: true, message: 'Pedido excluído com sucesso.' });
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    } catch (error: any) {
        console.error('[API Order Action Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
