import prisma from '@/lib/prisma';
import { MetaService } from './meta-service';
import { logToFile } from '@/services/engine/logger';

export interface InstagramConnectInput {
    code: string;
}

export interface InstagramConnectResult {
    success: true;
    igAccountId: string;
    username?: string;
    pageName?: string;
}

/**
 * Fluxo completo de conexão do Instagram Direct (Messenger Platform, via Facebook
 * Login for Business) para um bot já resolvido. Usado tanto pela rota autenticada
 * (dashboard) quanto pela rota pública (link por token), para manter exatamente o
 * mesmo comportamento sem duplicar lógica — mesmo padrão do connect-flow do WhatsApp.
 */
export async function connectInstagramForBot(botId: string, input: InstagramConnectInput): Promise<InstagramConnectResult> {
    const { code } = input;

    if (!code) {
        throw new Error('Código de autorização é obrigatório');
    }

    // 1. Troca o código de autorização por um access token de curta duração
    const shortLivedToken = await MetaService.exchangeCodeForToken(code);

    // 2. Converte para token de longa duração (~60 dias)
    const { accessToken } = await MetaService.getLongLivedToken(shortLivedToken);

    // 3. Lista as Páginas administradas pelo usuário e encontra uma com Instagram Profissional vinculado
    const pages = await MetaService.getFacebookPagesWithInstagram(accessToken);
    const pageWithInsta = pages.find(p => p.instagram_business_account?.id);

    if (!pageWithInsta || !pageWithInsta.instagram_business_account) {
        throw new Error(
            'Nenhuma Página do Facebook com conta Instagram Profissional (Business/Creator) vinculada foi encontrada. ' +
            'Vincule sua conta Instagram a uma Página do Facebook em Configurações do Instagram > Conta vinculada, e tente novamente.'
        );
    }

    const igAccountId = pageWithInsta.instagram_business_account.id;
    const username = pageWithInsta.instagram_business_account.username;
    // O token da Página (não o do usuário) é o que deve ser usado nas chamadas de mensagens/publicação.
    const pageAccessToken = pageWithInsta.access_token;

    // 4. Assina o nosso App nos eventos da Página (mensagens diretas + comentários)
    await MetaService.subscribePageToWebhooks(pageWithInsta.id, pageAccessToken);

    // 5. Persiste no BotChannel
    const existingChannel = await prisma.botChannel.findFirst({
        where: { botId, provider: 'INSTAGRAM' },
    });

    const channelData = {
        botId,
        provider: 'INSTAGRAM',
        identifier: igAccountId,
        status: 'CONNECTED',
        credentials: {
            accessToken: pageAccessToken,
            pageId: pageWithInsta.id,
            pageName: pageWithInsta.name,
            username: username || null,
            connectedAt: new Date().toISOString(),
        },
    };

    if (existingChannel) {
        await prisma.botChannel.update({ where: { id: existingChannel.id }, data: channelData });
    } else {
        await prisma.botChannel.create({ data: channelData });
    }

    logToFile(`[Instagram Connect] Bot ${botId} conectado à conta @${username} (ig=${igAccountId}, page=${pageWithInsta.id})`);

    return { success: true, igAccountId, username, pageName: pageWithInsta.name };
}
