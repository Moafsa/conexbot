import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MercadoLivreService } from '@/services/mercadolivre/service';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('bot_id');

    if (!botId) {
        return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    try {
        const bot = await prisma.bot.findUnique({
            where: { id: botId },
            include: { 
                tenant: {
                    include: {
                        subscriptions: true
                    }
                } 
            }
        });

        if (!bot || !bot.tenant) {
            return NextResponse.json({ error: 'Bot or Tenant not found' }, { status: 404 });
        }

        // Check for active subscription
        const activeSub = bot.tenant.subscriptions.find(s => s.status === 'ACTIVE' || s.status === 'TRIALING');
        if (!activeSub) {
            return NextResponse.json({ error: 'Inativa: Assinatura não encontrada ou expirada. Verifique seu painel Conextbot.' }, { status: 403 });
        }

        const accessToken = await MercadoLivreService.getValidToken(bot.tenantId);
        
        return NextResponse.json({ access_token: accessToken });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
