import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AsaasService } from '@/services/payment/asaas';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const tenantId = (session.user as any).id;
        const { id: orderId } = await params;

        const order = await prisma.order.findFirst({
            where: { id: orderId, bot: { tenantId } }
        });

        if (!order) return NextResponse.json({ error: 'Ordem não encontrada ou sem permissão' }, { status: 404 });

        if (order.externalId) {
            await AsaasService.cancelPayment(order.externalId);
        }

        await prisma.order.delete({ where: { id: order.id } });

        return NextResponse.json({ success: true, message: 'Fatura excluída com sucesso' });
    } catch (error: any) {
        console.error('[Finance Orders Delete API] Error:', error);
        return NextResponse.json({ error: 'Falha ao excluir a fatura' }, { status: 500 });
    }
}
