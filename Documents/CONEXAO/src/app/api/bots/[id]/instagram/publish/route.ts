export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MetaApiError, MetaService } from '@/services/meta/meta-service';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';
import { logToFile } from '@/services/engine/logger';

async function checkBotOwnership(botId: string, tenantId: string) {
    const bot = await prisma.bot.findUnique({ where: { id: botId, tenantId } });
    return bot !== null;
}

/**
 * Publica um post (imagem ou vídeo/reels + legenda) na conta Instagram conectada
 * a este bot via Embedded Signup (BotChannel provider=INSTAGRAM). Diferente do
 * fluxo de Marketing/Ads (que usa o token de anúncios do Tenant), este usa o
 * token da Página obtido no popup de conexão do próprio agente.
 */
export async function POST(req: Request, { params }: { params: any }) {
    const { id: botId } = await params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { imageUrl, videoUrl, caption, clientId } = body;

        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId || !(await checkBotOwnership(botId, tenantId))) {
            return NextResponse.json({ error: 'Agente não encontrado ou sem permissão' }, { status: 404 });
        }

        if (!imageUrl && !videoUrl) {
            return NextResponse.json({ error: 'Informe imageUrl ou videoUrl.' }, { status: 400 });
        }

        const channel = await prisma.botChannel.findFirst({
            where: { botId, provider: 'INSTAGRAM', status: 'CONNECTED' },
        });

        if (!channel) {
            return NextResponse.json({ error: 'Instagram não conectado para este agente.' }, { status: 404 });
        }

        const creds = channel.credentials as any;
        const pageAccessToken = creds?.accessToken;
        const igAccountId = channel.identifier;

        if (!pageAccessToken || !igAccountId) {
            return NextResponse.json({ error: 'Credenciais do Instagram incompletas. Reconecte o canal.' }, { status: 400 });
        }

        const container = await MetaService.createInstagramMediaContainer(igAccountId, pageAccessToken, {
            imageUrl,
            videoUrl,
            caption,
        });

        const published = await MetaService.publishInstagramMedia(igAccountId, pageAccessToken, container.id);

        logToFile(`[Instagram Publish] Bot ${botId} publicou mídia ${published.id} na conta @${creds?.username || igAccountId}`);

        return NextResponse.json({ success: true, mediaId: published.id });

    } catch (error: any) {
        const isMetaError = error instanceof MetaApiError;
        console.error('[Instagram Publish API] Error:', error.message);
        logToFile(`[Instagram Publish] Erro bot=${botId}: ${error.message}`);
        return NextResponse.json(
            { error: error.message || 'Falha ao publicar no Instagram.', metaCode: isMetaError ? error.code : undefined },
            { status: 500 }
        );
    }
}
