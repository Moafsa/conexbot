import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionName = searchParams.get('sessionName');
        const list = searchParams.get('list');

        if (list === 'true') {
            const bots = await prisma.bot.findMany({
                select: { id: true, name: true, sessionName: true }
            });
            return NextResponse.json(bots);
        }

        const targetSession = sessionName || 'bot-2cebade3';

        const bot = await prisma.bot.findFirst({
            where: {
                OR: [
                    { sessionName: targetSession },
                    { id: targetSession }
                ]
            },
            select: {
                id: true,
                name: true,
                sessionName: true,
                businessType: true,
                description: true,
                systemPrompt: true,
                scrapedContent: true,
                knowledgeBase: true,
                websiteUrl: true
            }
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
        }

        return NextResponse.json(bot);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
