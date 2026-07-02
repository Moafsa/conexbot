import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { PhoneUtils } from '@/lib/phone-utils';
import { UzapiService } from '../engine/uzapi';

export class NotificationService {
    /**
     * Sends an email using global SMTP settings
     */
    static async sendEmail(to: string, subject: string, text: string, html?: string) {
        try {
            const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
            if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
                console.warn('[NotificationService] SMTP not configured');
                return false;
            }

            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort || 587,
                secure: config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            });

            await transporter.sendMail({
                from: config.smtpFrom || config.smtpUser,
                to,
                subject,
                text,
                html: html || text,
            });

            return true;
        } catch (error) {
            console.error('[NotificationService] Email Error:', error);
            return false;
        }
    }

    /**
     * WhatsApp usando uma sessão UzAPI específica (ex.: o próprio bot em transbordo).
     */
    static async sendWhatsAppAsBot(botSessionName: string, to: string, message: string) {
        try {
            if (!botSessionName) {
                console.warn('[NotificationService] sendWhatsAppAsBot: botSessionName is empty');
                return false;
            }

            const cleanTo = PhoneUtils.normalizeBrazilWhatsAppE164(to);
            if (!cleanTo) {
                console.warn('[NotificationService] WhatsApp: número vazio após normalização');
                return false;
            }
            const remoteJid = `${cleanTo}@s.whatsapp.net`;

            const sent = await UzapiService.sendMessage(botSessionName, remoteJid, message);
            if (!sent) {
                console.warn(`[NotificationService] WhatsApp send failed (UzAPI returned false — session ${botSessionName} down or API error)`);
                return false;
            }
            return true;
        } catch (error) {
            console.error('[NotificationService] WhatsApp (AsBot) Error:', error);
            return false;
        }
    }

    /**
     * WhatsApp genérico (alertas de limite, etc.): usa o bot de sistema do admin.
     */
    static async sendWhatsApp(to: string, message: string): Promise<boolean> {
        try {
            const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
            if (!config?.systemBotId) {
                console.warn('[NotificationService] System Bot not configured');
                return false;
            }

            const sysBot = await prisma.bot.findUnique({ where: { id: config.systemBotId } });
            if (!sysBot?.sessionName) {
                console.warn('[NotificationService] System Bot or session not found');
                return false;
            }

            return this.sendWhatsAppAsBot(sysBot.sessionName, to, message);
        } catch (error) {
            console.error('[NotificationService] WhatsApp Error:', error);
            return false;
        }
    }

    /**
     * Transbordo humano (chamar_humano): sempre pela sessão UzAPI do bot que está na conversa — não usa bot de sistema.
     */
    static async sendHandoffWhatsAppFromBotSession(
        sessionName: string,
        to: string,
        message: string
    ): Promise<boolean> {
        try {
            const token = sessionName?.trim();
            if (!token) {
                console.warn('[NotificationService] Handoff WhatsApp: bot sem sessionName (conecte o bot na UzAPI)');
                return false;
            }
            const cleanTo = PhoneUtils.normalizeBrazilWhatsAppE164(to);
            if (!cleanTo) {
                console.warn('[NotificationService] Handoff WhatsApp: número vazio após normalização');
                return false;
            }
            const remoteJid = `${cleanTo}@s.whatsapp.net`;
            const sent = await UzapiService.sendMessage(token, remoteJid, message);
            if (!sent) {
                console.warn('[NotificationService] Handoff WhatsApp falhou (UzAPI — use a sessão deste mesmo bot)');
                return false;
            }
            console.log('[NotificationService] Handoff WhatsApp: enviado com sucesso');
            return true;
        } catch (error) {
            console.error('[NotificationService] Handoff WhatsApp Error:', error);
            return false;
        }
    }

    /**
     * Creates an internal notification (the "bell")
     */
    static async createInternalNotification(tenantId: string, type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'HUMAN_REQUESTED' | 'AI_DETECTED', title: string, content: string) {
        try {
            await prisma.notification.create({
                data: {
                    tenantId,
                    type,
                    title,
                    content
                }
            });
            return true;
        } catch (error) {
            console.error('[NotificationService] Internal Notification Error:', error);
            return false;
        }
    }

    /**
     * Notify about AI detection or Human Request (Triple Channel)
     */
    static async alertTenant(tenantId: string, title: string, message: string, type: 'HUMAN_REQUESTED' | 'AI_DETECTED') {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return;

        // 1. Internal Bell
        await this.createInternalNotification(tenantId, type, title, message);

        // 2. WhatsApp
        if (tenant.whatsapp) {
            await this.sendWhatsApp(tenant.whatsapp, `*${title}*\n\n${message}`);
        }

        // 3. Email
        await this.sendEmail(tenant.email, title, message);
    }

    /**
     * Notify tenant about usage limits
     */
    static async notifyLimit(tenantId: string, type: 'warning' | 'critical', used: number, limit: number) {
        try {
            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) return;

            const percentage = Math.round((used / limit) * 100);
            const config = (await prisma.globalConfig.findUnique({ where: { id: 'system' } }));
            const systemName = config?.systemName || 'ConextBot';

            const title = type === 'warning' ? `⚠️ Alerta de Uso - ${systemName}` : `🚨 Limite Atingido - ${systemName}`;
            const message = type === 'warning' 
                ? `Olá ${tenant.name || 'usuário'},\n\nSeu consumo de mensagens atingiu *${percentage}%* (${used}/${limit}).\nConsidere fazer um upgrade para evitar interrupções no atendimento.`
                : `Olá ${tenant.name || 'usuário'},\n\nSeu limite de mensagens (*${limit}*) foi atingido.\nSeus bots ficarão inativos até a próxima renovação ou upgrade de plano.`;

            // Internal
            await this.createInternalNotification(tenantId, type === 'warning' ? 'WARNING' : 'ERROR', title, message.replace(/\*/g, ''));

            // WhatsApp
            if (tenant.whatsapp) {
                await this.sendWhatsApp(tenant.whatsapp, `*${title}*\n\n${message}`);
            }

            // Email
            await this.sendEmail(tenant.email, title, message.replace(/\*/g, ''));

            // Update counter flags
            if (type === 'warning') {
                await prisma.usageCounter.update({ where: { tenantId }, data: { warned90: true } });
            } else {
                await prisma.usageCounter.update({ where: { tenantId }, data: { warned100: true } });
            }

        } catch (error) {
            console.error('[NotificationService] Notify Error:', error);
        }
    }
}
