export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        console.log('[Cron] Iniciando verificação de serviços pendentes...');

        // 1. Busca todos os bots conectados (para poder enviar whatsapp)
        const bots = await prisma.bot.findMany({
            where: {
                connectionStatus: 'CONNECTED'
            },
            select: { id: true, name: true, sessionName: true }
        });

        const notified: any[] = [];
        const { UzapiService } = await import('@/services/engine/uzapi');

        for (const bot of bots) {
            if (!bot.sessionName) continue;

            // Busca os contatos que não são clientes e que possuem serviços ativos > 0
            const pendingCollaborators = await prisma.contact.findMany({
                where: {
                    botId: bot.id,
                    contactType: { not: 'CUSTOMER' },
                    activeJobs: { gt: 0 }
                }
            });

            for (const collaborator of pendingCollaborators) {
                try {
                    const message = `Olá, *${collaborator.name || 'colaborador'}*!\n\nConsta em nosso sistema que você ainda tem *${collaborator.activeJobs}* serviço(s) pendente(s) hoje.\n\nSe você já concluiu, por favor responda com *1*, *entregue* ou *finalizado* para atualizarmos sua fila de trabalhos. Obrigado!`;
                    
                    await UzapiService.sendMessage(bot.sessionName, collaborator.phone, message);
                    
                    notified.push({
                        bot: bot.name,
                        colaborador: collaborator.name,
                        telefone: collaborator.phone,
                        pendentes: collaborator.activeJobs
                    });
                } catch (sendErr: any) {
                    console.error(`[Cron] Erro ao notificar ${collaborator.phone} no bot ${bot.name}:`, sendErr.message);
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date(),
            notificados: notified
        });

    } catch (error) {
        console.error('[Cron] Erro fatal na verificação de fila ativa:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
