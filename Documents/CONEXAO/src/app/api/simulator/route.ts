export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageProcessor } from '@/services/engine/processor';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { botId, message, sessionId } = body;

        if (!botId || !message) {
            return NextResponse.json({ error: 'Parâmetros botId e message são obrigatórios' }, { status: 400 });
        }

        const cleanBotId = botId.trim();
        console.log(`[Simulator API] POST received for botId: "${cleanBotId}"`);
        
        let bot;
        try {
            bot = await prisma.bot.findUnique({
                where: { id: cleanBotId }
            });
        } catch (dbErr: any) {
            console.error(`[Simulator API] Database error finding bot:`, dbErr);
            return NextResponse.json({ error: 'Erro ao buscar bot no banco', detail: dbErr.message }, { status: 500 });
        }

        if (!bot) {
            console.error(`[Simulator API] Bot NOT FOUND: "${cleanBotId}"`);
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        let response;
        try {
            response = await MessageProcessor.process(
                bot.id, 
                sessionId || 'simulator_user', 
                message, 
                'simulator', // Ensures processor bypasses limits if desired, or behaves properly
                'id'
            );
        } catch (procErr: any) {
            console.error(`[Simulator API] MessageProcessor CRASHED:`, procErr);
            return NextResponse.json({ error: 'Erro no processamento da IA', detail: procErr.message }, { status: 500 });
        }

        if (!response) {
            console.error(`[Simulator API] MessageProcessor returned NULL for bot: ${bot.id}`);
            return NextResponse.json({ error: 'A IA não retornou uma resposta' }, { status: 500 });
        }

        return NextResponse.json({ 
            response: response.text, // Frontend uses data.response
            media: response.media || []
        });

    } catch (error: any) {
        console.error('[Simulator API Fatal Error]:', error);
        return NextResponse.json({ error: 'Erro interno fatal', detail: error.message }, { status: 500 });
    }
}
