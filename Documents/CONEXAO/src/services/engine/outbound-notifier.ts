import prisma from '@/lib/prisma';
import { MetaService } from '@/services/meta/meta-service';
import { UzapiService } from '@/services/engine/uzapi';
import { logToFile } from '@/services/engine/logger';
import { PhoneUtils } from '@/lib/phone-utils';

export interface OutboundOptions {
    templateName?: string;
    templateLanguage?: string;
    templateComponents?: any[];
}

/**
 * Envia uma mensagem para qualquer número de telefone (entregador, cliente, admin)
 * utilizando o melhor canal ativo disponível no bot (Meta WhatsApp ou WuzAPI/Uzapi).
 * Suporta o envio via Modelos de Mensagem (Templates HSM) aprovados na Meta.
 */
export async function sendOutboundMessageToPhone(
    bot: any,
    phone: string,
    text: string,
    options?: OutboundOptions
): Promise<{ success: boolean; error?: string }> {
    if (!bot || !phone) return { success: false, error: 'Parâmetros inválidos' };

    const normalizedPhone = PhoneUtils.normalize(phone);
    let lastError = '';

    // 1. Tenta enviar via Meta WhatsApp se o bot tiver canal Meta conectado
    try {
        const metaChannel = await prisma.botChannel.findFirst({
            where: { botId: bot.id, provider: 'META_WHATSAPP', status: 'CONNECTED' },
        });

        if (metaChannel && metaChannel.identifier && (metaChannel.credentials as any)?.accessToken) {
            const creds = metaChannel.credentials as any;
            const phoneId = metaChannel.identifier;
            const token = creds.accessToken;

            // Se um Template Meta foi fornecido (ex: transbordo_humano, envio_link_entregador, nova_entrega_atribuida)
            if (options?.templateName) {
                try {
                    await MetaService.sendTemplateMessage(
                        phoneId,
                        token,
                        normalizedPhone,
                        options.templateName,
                        options.templateLanguage || 'pt_BR',
                        options.templateComponents
                    );
                    logToFile(`[OutboundNotifier] Template Meta "${options.templateName}" enviado com sucesso para ${normalizedPhone}`);
                    return { success: true };
                } catch (tmplErr: any) {
                    logToFile(`[OutboundNotifier] Falha ao enviar Template Meta "${options.templateName}": ${tmplErr.message}. Tentando texto simples...`);
                    lastError = tmplErr.message;
                }
            }

            // Fallback para mensagem de texto livre (janela de 24h aberta)
            if (text) {
                try {
                    await MetaService.sendTextMessage(phoneId, token, normalizedPhone, text);
                    logToFile(`[OutboundNotifier] Mensagem enviada via Meta WhatsApp para ${normalizedPhone}`);
                    return { success: true };
                } catch (textErr: any) {
                    lastError = textErr.message || 'Erro na Meta Cloud API';
                    logToFile(`[OutboundNotifier] Falha texto Meta WhatsApp para ${normalizedPhone}: ${lastError}`);
                }
            }
        }
    } catch (e: any) {
        lastError = e.message || 'Erro no canal Meta';
    }

    // 2. Fallback: Tenta enviar via WuzAPI APENAS se o WuzAPI estiver realmente CONECTADO
    if (bot.sessionName && bot.connectionStatus === 'CONNECTED' && text) {
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
