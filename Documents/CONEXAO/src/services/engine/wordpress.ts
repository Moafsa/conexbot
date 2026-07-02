import { logToFile } from './logger';

/**
 * URL pública do WordPress (ajax). Preferir campo do bot; senão derivar do primeiro produto com link absoluto.
 */
function resolveWordPressBaseUrl(bot: any): string | null {
    const direct = (bot.websiteUrl || '').trim();
    if (direct) {
        return direct.replace(/\/$/, '');
    }
    const products = bot.products as Array<{ externalUrl?: string | null }> | undefined;
    if (products?.length) {
        for (const p of products) {
            const u = p?.externalUrl;
            if (!u || typeof u !== 'string' || !u.startsWith('http')) continue;
            try {
                const parsed = new URL(u);
                return `${parsed.protocol}//${parsed.host}`;
            } catch {
                continue;
            }
        }
    }
    return null;
}

export const WordpressService = {
    /**
     * Envia uma resposta da IA de volta para o WordPress
     */
    async sendReply(bot: any, postId: number, parentId: number, message: string): Promise<boolean> {
        const baseUrl = resolveWordPressBaseUrl(bot);
        if (!baseUrl) {
            const msg = `[WordpressService] Error: Bot ${bot.id} has no websiteUrl and no product URL to infer site`;
            logToFile(msg);
            console.error(msg);
            return false;
        }

        if (!(bot.websiteUrl || '').trim()) {
            logToFile(`[WordpressService] Using inferred base URL from catalog: ${baseUrl}`);
        }

        // O plugin WP valida contra conexbot_bot_id (UUID) ou conexbot_api_token (CONEXT).
        // webhookToken existe no Prisma mas não é salvo no WordPress — priorizar bot.id.
        const token = bot.id || bot.webhookToken;
        const ajaxUrl = `${baseUrl}/wp-admin/admin-ajax.php`;

        logToFile(`[WordpressService] Sending reply to ${baseUrl} (Post: ${postId}, Parent: ${parentId})`);

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
