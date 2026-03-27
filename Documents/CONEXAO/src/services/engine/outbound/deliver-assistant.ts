/**
 * Entrega da resposta da IA ao canal do cliente.
 *
 * WhatsApp (WuzAPI/Uzapi) e WordPress (plugin via admin-ajax) são fluxos paralelos:
 * nenhum ramo chama o outro; não compartilham transporte nem estado de envio.
 */
import fs from 'fs';
import { UzapiService } from '../uzapi';
import { logToFile } from '../logger';

export type OutboundDeliveryChannel = 'whatsapp' | 'simulator' | 'generic' | 'wordpress';

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

    if (channel === 'wordpress') {
        await deliverWordPress(bot, remoteId, cleanResponse);
        return;
    }

    // simulator / generic: sem envio por Uzapi nem WordPress (comportamento do processor)
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

    if (options.inputType === 'audio') {
        const { VoiceService } = await import('../voice');
        try {
            const audioPath = await VoiceService.speak(
                cleanResponse,
                bot.tenant?.openaiApiKey,
                (bot.tenant as any)?.elevenLabsApiKey,
                bot.voiceId
            );

            const hasElevenLabs = !!(bot.tenant as any)?.elevenLabsApiKey;
            const hasVoiceId = !!bot.voiceId;
            logToFile(`[Outbound/WhatsApp] TTS: elevenLabs=${hasElevenLabs}, voiceId=${hasVoiceId}`);
            if (!hasElevenLabs || !hasVoiceId) {
                logToFile(
                    `[Outbound/WhatsApp] HINT: ElevenLabs + Voice ID para resposta em áudio.`
                );
            }

            const audioBuffer = fs.readFileSync(audioPath);
            const dataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;
            const sent = await UzapiService.sendMedia(bot.sessionName, recipient, 'audio', dataUri, '');

            if (sent) {
                logToFile(`[Outbound/WhatsApp] Áudio enviado.`);
            } else {
                logToFile(`[Outbound/WhatsApp] sendMedia (áudio) false; texto.`);
                const okText = await UzapiService.sendMessage(bot.sessionName, recipient, cleanResponse);
                if (!okText) {
                    logToFile(`[Outbound/WhatsApp] fallback texto também falhou (remoteId=${recipient})`);
                }
            }
        } catch (e: any) {
            logToFile(`[Outbound/WhatsApp] TTS/áudio falhou: ${e.message}; texto.`);
            const okText = await UzapiService.sendMessage(bot.sessionName, recipient, cleanResponse);
            if (!okText) {
                logToFile(`[Outbound/WhatsApp] fallback texto falhou após erro TTS (remoteId=${recipient})`);
            }
        }
    } else {
        const ok = await UzapiService.sendMessage(bot.sessionName, recipient, cleanResponse);
        if (!ok) {
            logToFile(
                `[Outbound/WhatsApp] sendMessage retornou false (remoteId=${recipient}). Ver UZAPI_URL/logs Uzapi.`
            );
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
