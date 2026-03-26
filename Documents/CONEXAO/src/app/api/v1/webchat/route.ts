import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageProcessor } from '@/services/engine/processor';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { botId, message, sessionId, contactInfo } = body;

        if (!botId || !message) {
            return NextResponse.json({ error: 'Parâmetros botId e message são obrigatórios' }, { status: 400 });
        }

        console.log(`[WebChat API] POST received for botId: ${botId}`);
        
        // 1. Validar Bot
        const bot = await prisma.bot.findUnique({
            where: { id: botId }
        });

        if (!bot) {
            console.error(`[WebChat API] Bot NOT FOUND: ${botId}`);
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        if (bot.status !== 'active') {
             console.warn(`[WebChat API] Bot INACTIVE: ${botId}, status: ${bot.status}`);
             // Permitir por enquanto para debug, ou manter 404 se for crítico
             // return NextResponse.json({ error: 'Bot inativo' }, { status: 404 });
        }

        // 2. Processar Mensagem (Canal: generic/web)
        // Usamos 'simulator' ou 'generic' para evitar envios automáticos para WhatsApp se não estiver conectado
        const response = await MessageProcessor.process(
            bot.id, 
            sessionId || 'web_user', 
            message, 
            'generic', // Canal genérico para Web
            'id'
        );

        if (!response) {
            return NextResponse.json({ error: 'Erro ao processar mensagem pela IA' }, { status: 500 });
        }

        return NextResponse.json({ 
            text: response.text,
            media: response.media || []
        });

    } catch (error: any) {
        console.error('[WebChat API Error]:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
