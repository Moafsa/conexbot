export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        const bot = await prisma.bot.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                businessType: true,
                status: true
            }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        return NextResponse.json(bot);
    } catch (error) {
        console.error('[BotInfo API Error]:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
