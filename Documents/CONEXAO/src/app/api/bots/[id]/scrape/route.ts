import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { scrapeWebsite } from '@/services/engine/scraper';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const tenantId = (session.user as any).id;

        const bot = await prisma.bot.findFirst({
            where: { id, tenantId },
        });

        if (!bot) {
            return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
        }

        if (!bot.websiteUrl) {
            return NextResponse.json({ error: 'Nenhuma URL configurada' }, { status: 400 });
        }

        const result = await scrapeWebsite(bot.websiteUrl);

        if (!result.success) {
            return NextResponse.json(
                { error: `Falha ao acessar site: ${result.error}` },
                { status: 422 }
            );
        }

        await prisma.bot.update({
            where: { id },
            data: {
                scrapedContent: result.content,
                lastScrapedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            title: result.title,
            contentLength: result.content.length,
        });
    } catch (error) {
        console.error('Scrape API error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
