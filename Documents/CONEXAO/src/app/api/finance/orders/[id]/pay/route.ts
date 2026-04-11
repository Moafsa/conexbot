export const dynamic = 'force-dynamic';
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

        if (!order) return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });

        if (order.externalId) {
            await AsaasService.receivePaymentInCash(order.externalId);
        }

        await prisma.order.update({
            where: { id: order.id },
            data: { status: 'PAID' }
        });

        // Tentar encontrar a assinatura relacionada ao tenant e tipo (se houver metadados ou se for o padrão)
        // Como o sistema busca faturas de assinaturas, vamos garantir que a assinatura do usuário mije para ACTIVE
        await prisma.subscription.updateMany({
            where: { tenantId: tenantId },
            data: { status: 'ACTIVE' }
        });

        return NextResponse.json({ success: true, message: 'Fatura quitada e assinatura ativada com sucesso' });
    } catch (error: any) {
        console.error('[Finance Orders Pay API] Error:', error);
        return NextResponse.json({ error: 'Falha ao quitar a fatura' }, { status: 500 });
    }
}
