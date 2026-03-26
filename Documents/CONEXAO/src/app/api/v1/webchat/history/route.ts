import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const botId = searchParams.get('botId');
        const sessionId = searchParams.get('sessionId');

        if (!botId || !sessionId) {
            return NextResponse.json({ error: 'Parâmetros botId e sessionId são obrigatórios' }, { status: 400 });
        }

        // 1. Encontrar a conversa
        const conversation = await prisma.conversation.findUnique({
            where: {
                botId_remoteId: { botId, remoteId: sessionId }
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 50,
                    select: {
                        role: true,
                        content: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json({
            messages: conversation.messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.createdAt
            }))
        });

    } catch (error: any) {
        console.error('[WebChat History API Error]:', error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
