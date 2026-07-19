export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MetaApiError } from '@/services/meta/meta-service';
import { connectInstagramForBot } from '@/services/meta/connect-instagram-flow';
import { logToFile } from '@/services/engine/logger';

/**
 * Variante pública (sem sessão) da conexão do Instagram, usada no link
 * /connect/[token] enviado diretamente ao cliente final — ele autentica com a
 * própria conta do Facebook/Instagram dentro do popup, não com uma conta do Conextbot.
 */
export async function POST(req: Request) {
    let botId: string | undefined;
    try {
        const body = await req.json();
        const { token, code, redirectUri } = body;

        if (!token) {
            return NextResponse.json({ error: 'Token de conexão é obrigatório' }, { status: 400 });
        }

        const bot = await prisma.bot.findFirst({ where: { connectToken: token } });
        if (!bot) {
            return NextResponse.json({ error: 'Link de conexão inválido ou expirado' }, { status: 404 });
        }
        botId = bot.id;

        const result = await connectInstagramForBot(bot.id, { code, redirectUri });
        return NextResponse.json(result);

    } catch (error: any) {
        const isMetaError = error instanceof MetaApiError;
        console.error('[Public Instagram Connect API] Error:', error.message);
        logToFile(`[Public Instagram Connect] Erro bot=${botId}: ${error.message}`);
        return NextResponse.json(
            { error: error.message || 'Falha ao conectar o Instagram.', metaCode: isMetaError ? error.code : undefined },
            { status: error.message?.includes('obrigatório') ? 400 : error.message?.includes('encontrad') || error.message?.includes('inválido') ? 404 : 500 }
        );
    }
}
