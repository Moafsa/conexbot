import prisma from '@/lib/prisma';
import { MetaService } from './meta-service';
import { logToFile } from '@/services/engine/logger';

export interface InstagramAccountOption {
    pageId: string;
    pageName: string;
    igAccountId: string;
    username: string | null;
    pageAccessToken: string;
}

export interface InstagramConnectInput {
    code?: string;
    redirectUri?: string;
    selectedIgAccountId?: string;
    selectedPageId?: string;
    accountSelectionData?: InstagramAccountOption;
}

export type InstagramConnectResult =
    | {
        success: true;
        igAccountId: string;
        username?: string;
        pageName?: string;
    }
    | {
        success: false;
        requiresSelection: true;
        availableAccounts: InstagramAccountOption[];
    };

/**
 * Fluxo completo de conexão do Instagram Direct (Messenger Platform, via Facebook
 * Login for Business) para um bot já resolvido. Suporta contas únicas ou seleção
 * de múltiplas contas de Instagram vinculadas ao mesmo perfil de Facebook.
 */
export async function connectInstagramForBot(botId: string, input: InstagramConnectInput): Promise<InstagramConnectResult> {
    const { code, redirectUri, selectedIgAccountId, selectedPageId, accountSelectionData } = input;

    // Se o usuário selecionou diretamente uma conta da lista na UI:
    if (accountSelectionData) {
        return finalizeInstagramChannelConnection(botId, accountSelectionData);
    }

    if (!code) {
        throw new Error('Código de autorização é obrigatório');
    }

    // 1. Tenta o fluxo de OAuth DIRETO da conta de Instagram logada na máquina/navegador
    try {
        if (redirectUri) {
            const directResult = await MetaService.exchangeInstagramDirectCode(code, redirectUri);
            logToFile(`[Instagram Connect] Conectado diretamente à conta de Instagram do navegador: @${directResult.username} (${directResult.userId})`);
            
            return finalizeInstagramChannelConnection(botId, {
                pageId: directResult.userId,
                pageName: directResult.username,
                igAccountId: directResult.userId,
                username: directResult.username,
                pageAccessToken: directResult.accessToken
            });
        }
    } catch (directErr: any) {
        logToFile(`[Instagram Connect] OAuth direto do Instagram não utilizado ou falhou (${directErr.message}), tentando via Meta Graph API...`);
    }

    // 2. Fallback: Troca de token via Meta Graph API clássico
    const shortLivedToken = await MetaService.exchangeCodeForToken(code, redirectUri);

    // 2. Converte para token de longa duração (~60 dias)
    const { accessToken } = await MetaService.getLongLivedToken(shortLivedToken);

    // 3. Lista as Páginas do Facebook que possuem Instagram Profissional vinculado
    const pagesWithInsta = await MetaService.getFacebookPagesWithInstagram(accessToken);

    if (pagesWithInsta.length === 0) {
        throw new Error(
            'Nenhuma Página do Facebook com conta Instagram Profissional (Business/Creator) vinculada foi encontrada. ' +
            'Vincule sua conta Instagram a uma Página do Facebook em Configurações do Instagram > Conta vinculada, e tente novamente.'
        );
    }

    const availableAccounts: InstagramAccountOption[] = pagesWithInsta.map(p => ({
        pageId: p.id,
        pageName: p.name,
        igAccountId: p.instagram_business_account!.id,
        username: p.instagram_business_account!.username || null,
        pageAccessToken: p.access_token,
    }));

    // Verifica se alguma conta específica foi selecionada
    let selectedAccount: InstagramAccountOption | undefined;

    if (selectedIgAccountId) {
        selectedAccount = availableAccounts.find(a => a.igAccountId === selectedIgAccountId);
    } else if (selectedPageId) {
        selectedAccount = availableAccounts.find(a => a.pageId === selectedPageId);
    } else if (availableAccounts.length === 1) {
        selectedAccount = availableAccounts[0];
    }

    // Se houver múltiplas contas e nenhuma tiver sido pré-selecionada:
    if (!selectedAccount) {
        return {
            success: false,
            requiresSelection: true,
            availableAccounts,
        };
    }

    return finalizeInstagramChannelConnection(botId, selectedAccount);
}

async function finalizeInstagramChannelConnection(botId: string, account: InstagramAccountOption): Promise<InstagramConnectResult> {
    const { pageId, pageName, igAccountId, username, pageAccessToken } = account;

    // Assina o nosso App nos eventos da Página (mensagens diretas + comentários)
    try {
        await MetaService.subscribePageToWebhooks(pageId, pageAccessToken);
    } catch (err: any) {
        logToFile(`[Instagram Connect] Aviso na assinatura de webhook: ${err.message}`);
    }

    // Persiste no BotChannel
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
            pageId,
            pageName,
            username: username || null,
            connectedAt: new Date().toISOString(),
        },
    };

    if (existingChannel) {
        await prisma.botChannel.update({ where: { id: existingChannel.id }, data: channelData });
    } else {
        await prisma.botChannel.create({ data: channelData });
    }

    logToFile(`[Instagram Connect] Bot ${botId} conectado à conta @${username} (ig=${igAccountId}, page=${pageId})`);

    return { success: true, igAccountId, username: username || undefined, pageName };
}
