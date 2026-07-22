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
): Promise<boolean> {
    if (!bot || !phone || !text) return false;

    const normalizedPhone = PhoneUtils.normalize(phone);

    // 1. Tenta enviar via Meta WhatsApp se o bot tiver canal Meta conectado
    try {
        const metaChannel = await prisma.botChannel.findFirst({
            where: { botId: bot.id, provider: 'META_WHATSAPP', status: 'CONNECTED' },
        });

        if (metaChannel && metaChannel.identifier && (metaChannel.credentials as any)?.accessToken) {
            const creds = metaChannel.credentials as any;
            await MetaService.sendTextMessage(metaChannel.identifier, creds.accessToken, normalizedPhone, text);
            logToFile(`[OutboundNotifier] Mensagem enviada via Meta WhatsApp para ${normalizedPhone}`);
            return true;
        }
    } catch (e: any) {
        logToFile(`[OutboundNotifier] Falha ao enviar via Meta WhatsApp para ${normalizedPhone}: ${e.message}`);
    }

    // 2. Fallback: Tenta enviar via WuzAPI se o bot tiver sessionName
    if (bot.sessionName) {
        try {
            await UzapiService.sendMessage(bot.sessionName, normalizedPhone, text);
            logToFile(`[OutboundNotifier] Mensagem enviada via WuzAPI para ${normalizedPhone}`);
            return true;
        } catch (e: any) {
            logToFile(`[OutboundNotifier] Falha ao enviar via WuzAPI para ${normalizedPhone}: ${e.message}`);
        }
    }

    logToFile(`[OutboundNotifier] Nenhum canal ativo encontrado para enviar mensagem ao telefone ${normalizedPhone} (botId=${bot.id})`);
    return false;
}
