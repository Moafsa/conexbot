export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageProcessor } from '@/services/engine/processor';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { botId, message, sessionId } = body as { botId?: string; message?: string; sessionId?: string };

        if (!botId || !message) {
            return NextResponse.json({ error: 'Parâmetros botId e message são obrigatórios' }, { status: 400 });
        }

        const bot = await prisma.bot.findUnique({ where: { id: String(botId).trim() } });
        if (!bot) return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });

        const response = await MessageProcessor.process(
            bot.id,
            sessionId || 'sim_user',
            String(message),
            'simulator',
            'id'
        );

        if (!response) {
            // Simulator should never be blocked by handoff pause; null here indicates an internal issue.
            return NextResponse.json({ error: 'A IA não retornou uma resposta' }, { status: 500 });
        }

        // Simulator.tsx expects { response: string }
        return NextResponse.json({ response: response.text, media: response.media || [] });
    } catch (error: any) {
        return NextResponse.json({ error: 'Erro interno', detail: error?.message || String(error) }, { status: 500 });
    }
}

