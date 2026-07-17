import prisma from '@/lib/prisma';
import { MetaService } from './meta-service';
import { logToFile } from '@/services/engine/logger';

export interface MetaConnectInput {
    code: string;
    wabaId?: string;
    phoneNumberId?: string;
    businessId?: string;
}

export interface MetaConnectResult {
    success: true;
    displayNumber?: string;
    verifiedName?: string;
    wabaId: string;
    phoneId: string;
}

/**
 * Fluxo completo de conexão do WhatsApp Cloud API (Embedded Signup) para um bot já resolvido.
 * Usado tanto pela rota autenticada (dashboard) quanto pela rota pública (link por token),
 * para os dois manterem exatamente o mesmo comportamento sem duplicar lógica.
 */
export async function connectMetaWhatsAppForBot(botId: string, input: MetaConnectInput): Promise<MetaConnectResult> {
    const { code, wabaId: wabaIdFromClient, phoneNumberId: phoneIdFromClient, businessId } = input;

    if (!code) {
        throw new Error('Código de autorização é obrigatório');
    }

    // 1. Troca o código de autorização por um access token de curta duração
    const shortLivedToken = await MetaService.exchangeCodeForToken(code);

    // 2. Converte para token de longa duração (~60 dias) para a conexão não cair sozinha
    const { accessToken, expiresInSeconds } = await MetaService.getLongLivedToken(shortLivedToken);
    const tokenExpiresAt = expiresInSeconds
        ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
        : null;

    // 3. WABA e número de telefone: preferimos os IDs capturados diretamente do evento
    // postMessage do popup (mais confiável e imediato). Fallback consulta a API.
    let wabaId = wabaIdFromClient;
    let phoneId = phoneIdFromClient;

    if (!wabaId) {
        const wabas = await MetaService.getAvailableWabas(accessToken);
        if (wabas.length === 0) {
            throw new Error('Nenhuma conta de WhatsApp Business encontrada para este login.');
        }
        wabaId = wabas[0].id;
    }

    if (!phoneId) {
        const phones = await MetaService.getWabaPhoneNumbers(wabaId, accessToken);
        if (phones.length === 0) {
            throw new Error('Nenhum número de telefone encontrado nesta conta WhatsApp Business.');
        }
        phoneId = phones[0].id;
    }

    // 4. Detalhes do número (nome verificado, número visível)
    const phoneDetails = await MetaService.getPhoneNumberDetails(phoneId, accessToken);
    const displayNumber = phoneDetails.display_phone_number;
    const verifiedName = phoneDetails.verified_name;

    // 5. Registra o número na Cloud API (obrigatório para poder enviar/receber mensagens).
    const pin = MetaService.generatePin();
    try {
        await MetaService.registerPhoneNumber(phoneId, accessToken, pin);
    } catch (e: any) {
        logToFile(`[Meta Connect] registerPhoneNumber aviso (pode já estar registrado): ${e.message}`);
    }

    // 6. Assina o nosso App nos eventos da WABA do cliente.
    await MetaService.subscribeAppToWaba(wabaId, accessToken);

    // 7. Persiste no BotChannel
    const existingChannel = await prisma.botChannel.findFirst({
        where: { botId, provider: 'META_WHATSAPP' },
    });

    const channelData = {
        botId,
        provider: 'META_WHATSAPP',
        identifier: phoneId,
        status: 'CONNECTED',
        credentials: {
            accessToken,
            tokenExpiresAt,
            wabaId,
            businessId: businessId || null,
            displayNumber,
            verifiedName,
            pin,
            connectedAt: new Date().toISOString(),
        },
    };

    if (existingChannel) {
        await prisma.botChannel.update({ where: { id: existingChannel.id }, data: channelData });
    } else {
        await prisma.botChannel.create({ data: channelData });
    }

    logToFile(`[Meta Connect] Bot ${botId} conectado ao número oficial ${displayNumber} (waba=${wabaId})`);

    return { success: true, displayNumber, verifiedName, wabaId, phoneId };
}
