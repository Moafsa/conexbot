import prisma from '@/lib/prisma';
import { MetaService } from '@/services/meta/meta-service';
import { UzapiService } from '@/services/engine/uzapi';
import { logToFile } from '@/services/engine/logger';
import { PhoneUtils } from '@/lib/phone-utils';

/**
 * Envia uma mensagem para qualquer número de telefone (entregador, cliente, admin)
 * utilizando o melhor canal ativo disponível no bot (Meta WhatsApp ou WuzAPI/Uzapi).
 */
export async function sendOutboundMessageToPhone(
    bot: any,
    phone: string,
    text: string
): Promise<{ success: boolean; error?: string }> {
    if (!bot || !phone || !text) return { success: false, error: 'Parâmetros inválidos' };

    const normalizedPhone = PhoneUtils.normalize(phone);
    let lastError = '';

    // 1. Tenta enviar via Meta WhatsApp se o bot tiver canal Meta conectado
    try {
        const metaChannel = await prisma.botChannel.findFirst({
            where: { botId: bot.id, provider: 'META_WHATSAPP', status: 'CONNECTED' },
        });

        if (metaChannel && metaChannel.identifier && (metaChannel.credentials as any)?.accessToken) {
            const creds = metaChannel.credentials as any;
            await MetaService.sendTextMessage(metaChannel.identifier, creds.accessToken, normalizedPhone, text);
            logToFile(`[OutboundNotifier] Mensagem enviada via Meta WhatsApp para ${normalizedPhone}`);
            return { success: true };
        }
    } catch (e: any) {
        lastError = e.message || 'Erro na Meta Cloud API';
        logToFile(`[OutboundNotifier] Falha ao enviar via Meta WhatsApp para ${normalizedPhone}: ${lastError}`);
    }

    // 2. Fallback: Tenta enviar via WuzAPI APENAS se o WuzAPI estiver realmente CONECTADO
    if (bot.sessionName && bot.connectionStatus === 'CONNECTED') {
        try {
            const sent = await UzapiService.sendMessage(bot.sessionName, normalizedPhone, text);
            if (sent) {
                logToFile(`[OutboundNotifier] Mensagem enviada via WuzAPI para ${normalizedPhone}`);
                return { success: true };
            }
        } catch (e: any) {
            lastError = e.message || 'Erro na WuzAPI';
            logToFile(`[OutboundNotifier] Falha ao enviar via WuzAPI para ${normalizedPhone}: ${lastError}`);
        }
    }

    if (lastError) {
        return { success: false, error: lastError };
    }

    return {
        success: false,
        error: `Nenhum canal de WhatsApp ativo e conectado para enviar a mensagem ao número ${normalizedPhone}.`
    };
}
