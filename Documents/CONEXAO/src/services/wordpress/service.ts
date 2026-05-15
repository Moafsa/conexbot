export class WordPressService {
    /**
     * Sends a sync request to the WordPress plugin
     */
    static async syncToWp(siteUrl: string, data: any) {
        // Ensure URL has /wp-admin/admin-ajax.php
        const baseUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
        const ajaxUrl = `${baseUrl}wp-admin/admin-ajax.php?action=conexbot_sync_from_saas`;

        try {
            const response = await fetch(ajaxUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`WP Sync failed: ${response.status} - ${text}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[WordPressService] Error syncing to ${siteUrl}:`, error);
            throw error;
        }
    }
}
