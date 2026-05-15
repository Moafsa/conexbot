import { prisma } from "@/lib/prisma";
import { UzapiService } from "../engine/uzapi";

export const MarketingNotificationService = {
    /**
     * Envia uma notificação via WhatsApp para o dono do tenant informando sobre um novo post.
     */
    async notifyPostGenerated(postId: string) {
        try {
            const post = await prisma.marketingPost.findUnique({
                where: { id: postId },
                include: { 
                    tenant: true,
                    bot: { select: { name: true, sessionName: true } }
                }
            });

            if (!post || !post.tenant.whatsapp || !post.shareToken) return;

            const previewUrl = `${process.env.NEXTAUTH_URL || 'https://app.conext.click'}/marketing/preview/${post.shareToken}`;
            
            const message = `🚀 *Novo Conteúdo Gerado!* \n\nOlá ${post.tenant.name || 'parceiro'}, nossa IA acabou de criar um novo post para o seu *${post.platform}*.\n\n📝 *Legenda:* ${post.content.substring(0, 100)}...\n\n🔗 *Veja e Aprove aqui:* ${previewUrl}\n\n_Aguardamos sua aprovação para agendar a publicação!_`;

            // Tentamos usar o bot que gerou o post para enviar a mensagem
            if (post.bot.sessionName) {
                await UzapiService.sendMessage(post.bot.sessionName, post.tenant.whatsapp, message);
                console.log(`[NotificationService] Notificação enviada para ${post.tenant.whatsapp}`);
            } else {
                console.warn(`[NotificationService] Bot ${post.bot.name} não tem sessionName configurado.`);
            }
        } catch (error: any) {
            console.error("[NotificationService] Erro ao enviar notificação:", error.message);
        }
    }
};
