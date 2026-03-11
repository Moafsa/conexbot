import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AsaasService } from '@/services/payment/asaas';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).id;
        const { id: orderId } = await params;

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                bot: { tenantId }
            },
            include: { bot: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Ordem não encontrada ou sem permissão' }, { status: 404 });
        }

        if (order.status === 'PAID') {
            return NextResponse.json({ error: 'Fatura já está paga' }, { status: 400 });
        }

        if (order.externalId) {
            const success = await AsaasService.cancelPayment(order.externalId);
            if (!success) {
                // If it fails on Asaas, still allow local cancellation but perhaps warn user?
                console.warn(`[Finance] Failed to cancel payment ${order.externalId} on Asaas for Order ${order.id}. Overriding local status anyway.`);
            }
        }

        // Ficar o registro "baixada" / cancelada
        await prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELED' }
        });

        return NextResponse.json({ success: true, message: 'Fatura cancelada e baixada com sucesso' });
    } catch (error: any) {
        console.error('[Finance Orders Cancel API] Error:', error);
        return NextResponse.json({ error: 'Falha ao cancelar a fatura' }, { status: 500 });
    }
}
