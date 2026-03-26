import { logToFile } from './logger';

export const WordpressService = {
    /**
     * Envia uma resposta da IA de volta para o WordPress
     */
    async sendReply(bot: any, postId: number, parentId: number, message: string): Promise<boolean> {
        if (!bot.websiteUrl) {
            logToFile(`[WordpressService] Error: Bot ${bot.id} has no websiteUrl`);
            return false;
        }

        const token = bot.webhookToken || bot.id; // Usar webhookToken como segredo compartilhado
        const ajaxUrl = `${bot.websiteUrl.replace(/\/$/, '')}/wp-admin/admin-ajax.php`;

        logToFile(`[WordpressService] Sending reply to ${bot.websiteUrl} (Post: ${postId}, Parent: ${parentId})`);

        try {
            const formData = new URLSearchParams();
            formData.append('action', 'conexbot_ai_reply');
            formData.append('token', token);
            formData.append('post_id', String(postId));
            formData.append('parent_id', String(parentId));
            formData.append('message', message);
            formData.append('bot_name', bot.name || 'Assistente');

            const res = await fetch(ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    logToFile(`[WordpressService] Reply posted successfully: Comment ID ${data.data.comment_id}`);
                    return true;
                } else {
                    logToFile(`[WordpressService] WP Error: ${data.data || 'Unknown error'}`);
                    return false;
                }
            } else {
                const errText = await res.text();
                logToFile(`[WordpressService] HTTP Error ${res.status}: ${errText.substring(0, 200)}`);
                return false;
            }
        } catch (error: any) {
            logToFile(`[WordpressService] Fetch Exception: ${error.message}`);
            return false;
        }
    }
};
