/**
 * Entrega da resposta da IA ao canal do cliente.
 *
 * WhatsApp (WuzAPI/Uzapi) e WordPress (plugin via admin-ajax) são fluxos paralelos:
 * nenhum ramo chama o outro; não compartilham transporte nem estado de envio.
 */
import fs from 'fs';
import { UzapiService } from '../uzapi';
import { logToFile } from '../logger';

export type OutboundDeliveryChannel = 'whatsapp' | 'simulator' | 'generic' | 'wordpress' | 'meta_whatsapp' | 'instagram';

export async function deliverAssistantOutbound(params: {
    channel: OutboundDeliveryChannel;
    bot: any;
    remoteId: string;
    cleanResponse: string;
    mediaMatches: RegExpMatchArray[];
    options: { inputType: 'text' | 'audio' | 'image'; mediaPath?: string; whatsappChatJid?: string };
}): Promise<void> {
    const { channel, bot, remoteId, cleanResponse, mediaMatches, options } = params;

    if (channel === 'whatsapp') {
        if (!bot.sessionName) {
            logToFile(
                `[Outbound/WhatsApp] SKIP envio WuzAPI: bot sem sessionName (id=${bot?.id}). A resposta foi gravada no CRM apenas.`
            );
            return;
        }
        await deliverWhatsApp(bot, remoteId, cleanResponse, mediaMatches, options);
        return;
    }

    if (channel === 'meta_whatsapp') {
        await deliverMetaWhatsApp(bot, remoteId, cleanResponse, mediaMatches);
        return;
    }

    if (channel === 'wordpress') {
        await deliverWordPress(bot, remoteId, cleanResponse);
        return;
    }

    // simulator / generic: sem envio por Uzapi nem WordPress (comportamento do processor)
}

async function deliverMetaWhatsApp(
    bot: any,
    remoteId: string,
    cleanResponse: string,
    mediaMatches: RegExpMatchArray[]
): Promise<void> {
    const { default: prisma } = await import('@/lib/prisma');
    const { MetaService } = await import('@/services/meta/meta-service');

    const channel = await prisma.botChannel.findFirst({
        where: { botId: bot.id, provider: 'META_WHATSAPP', status: 'CONNECTED' },
    });

    if (!channel) {
        logToFile(`[Outbound/MetaWhatsApp] SKIP: bot ${bot?.id} sem canal META_WHATSAPP conectado.`);
        return;
    }

    const creds = channel.credentials as any;
    const accessToken = creds?.accessToken;
    const phoneId = channel.identifier;

    if (!accessToken || !phoneId) {
        logToFile(`[Outbound/MetaWhatsApp] SKIP: credenciais incompletas para bot ${bot?.id}.`);
        return;
    }

    try {
        await MetaService.sendTextMessage(phoneId, accessToken, remoteId, cleanResponse);
    } catch (e: any) {
        logToFile(`[Outbound/MetaWhatsApp] Falha ao enviar texto para ${remoteId}: ${e.message}`);
    }

    for (const match of mediaMatches as any[]) {
        const media = (bot.media as any[])?.find((m: any) => m.id === match[1]);
        if (!media) continue;

        const type = media.type === 'audio' ? 'audio' : media.type === 'video' ? 'video' : media.type === 'image' ? 'image' : 'document';
        try {
            await MetaService.sendMediaMessage(phoneId, accessToken, remoteId, type, media.url, media.description, media.filename);
        } catch (e: any) {
            logToFile(`[Outbound/MetaWhatsApp] Falha ao enviar mídia (id=${media?.id}): ${e.message}`);
        }
    }
}

async function deliverWhatsApp(
    bot: any,
    remoteIdNormalized: string,
    cleanResponse: string,
    mediaMatches: RegExpMatchArray[],
    options: { inputType: 'text' | 'audio' | 'image'; whatsappChatJid?: string }
): Promise<void> {
    /** JID do Info.Chat do WuzAPI — obrigatório quando PN/LID diverge do número normalizado p/ CRM */
    const recipient = (options.whatsappChatJid && options.whatsappChatJid.trim()) || remoteIdNormalized;
    if (options.whatsappChatJid) {
        logToFile(`[Outbound/WhatsApp] destino WuzAPI: JID Chat (${recipient.substring(0, 48)}…)`);
    }

    // Cache the reply to prevent loops from Chatwoot webhooks
    try {
        const { getRedis } = await import('@/lib/redis');
        const redis = getRedis();
        const cacheKey = `last_bot_reply:${bot.id}:${remoteIdNormalized}`;
        await redis.set(cacheKey, cleanResponse, 'EX', 15);
    } catch (e: any) {
        logToFile(`[Outbound/WhatsApp] Redis caching error: ${e.message}`);
    }

    // Regra: Sempre que houver link na resposta, tem que ser em texto (para ser clicável e evitar leitura robótica de URL)
    const hasLink = cleanResponse.includes('http://') || cleanResponse.includes('https://');

    if (options.inputType === 'audio' && !hasLink) {
        const { VoiceService } = await import('../voice');
        try {
            const audioPath = await VoiceService.speak(
                cleanResponse,
                bot.tenant?.openaiApiKey ?? undefined,
                (bot.tenant as any)?.elevenLabsApiKey ?? undefined,
                bot.voiceId
            );

            const hasElevenLabs = !!(bot.tenant as any)?.elevenLabsApiKey;
            const hasVoiceId = !!bot.voiceId;
            logToFile(`[Outbound/WhatsApp] TTS: elevenLabs=${hasElevenLabs}, voiceId=${hasVoiceId}`);
            
            const audioBuffer = fs.readFileSync(audioPath);
            const dataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;
            const sent = await UzapiService.sendMedia(bot.sessionName, recipient, 'audio', dataUri, '');

            if (!sent) {
                logToFile(`[Outbound/WhatsApp] sendMedia (áudio) false; fallback texto.`);
                await UzapiService.sendMessage(bot.sessionName, recipient, cleanResponse);
            }
        } catch (e: any) {
            logToFile(`[Outbound/WhatsApp] TTS/áudio falhou: ${e.message}; fallback texto.`);
            await UzapiService.sendMessage(bot.sessionName, recipient, cleanResponse);
        }
    } else {
        // Envio normal por texto (usado se input for texto OU se houver link na resposta)
        if (hasLink && options.inputType === 'audio') {
            logToFile(`[Outbound/WhatsApp] Link detectado em resposta de áudio. Forçando envio por texto.`);
        }
        
        const ok = await UzapiService.sendMessage(bot.sessionName, recipient, cleanResponse);
        if (!ok) {
            logToFile(`[Outbound/WhatsApp] sendMessage retornou false (remoteId=${recipient}).`);
        }
    }


    for (const match of mediaMatches as any[]) {
        const media = (bot.media as any[]).find((m: any) => m.id === match[1]);
        if (media) {
            const mediaOk = await UzapiService.sendMedia(
                bot.sessionName,
                recipient,
                media.type,
                media.url,
                media.description || media.filename
            );
            if (!mediaOk) {
                logToFile(`[Outbound/WhatsApp] sendMedia falhou (id=${media?.id})`);
            }
        }
    }
}

async function deliverWordPress(bot: any, remoteId: string, cleanResponse: string): Promise<void> {
    const parts = remoteId.split('_');
    const postId = parseInt(parts[2], 10);
    const commentId = parseInt(parts[4], 10);

    if (isNaN(postId) || isNaN(commentId)) {
        logToFile(`[Outbound/WordPress] remoteId inválido: ${remoteId}`);
        return;
    }

    const { WordpressService } = await import('../wordpress');
    await WordpressService.sendReply(bot, postId, commentId, cleanResponse);
}
