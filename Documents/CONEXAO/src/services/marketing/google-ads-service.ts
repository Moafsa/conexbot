import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export const GoogleAdsService = {
    /**
     * Busca performance básica das campanhas de Google Ads.
     */
    async getCampaignInsights(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { 
                googleAdsDeveloperToken: true, 
                googleAdsCustomerId: true,
                // Assumindo que podemos usar o refresh token de um dos bots se o tenant não tiver um global
                bots: {
                    where: { schedulingProvider: 'GOOGLE', googleRefreshToken: { not: null } },
                    select: { googleRefreshToken: true },
                    take: 1
                }
            }
        });

        if (!tenant?.googleAdsDeveloperToken || !tenant?.googleAdsCustomerId) {
            return null;
        }

        const refreshToken = tenant.bots[0]?.googleRefreshToken;
        if (!refreshToken) return null;

        try {
            const accessToken = await this.getAccessToken(refreshToken);
            const customerId = tenant.googleAdsCustomerId.replace(/-/g, '');
            
            const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`;
            
            const query = {
                query: `
                    SELECT 
                        campaign.id, 
                        campaign.name, 
                        campaign.status, 
                        metrics.impressions, 
                        metrics.clicks, 
                        metrics.cost_micros 
                    FROM campaign 
                    WHERE campaign.status = 'ENABLED'
                    LIMIT 10
                `
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': tenant.googleAdsDeveloperToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(query)
            });

            const data = await res.json();
            
            if (data.error) {
                console.error("[GoogleAds] API Error:", data.error);
                return null;
            }

            return data.results || [];
        } catch (error) {
            console.error("[GoogleAds] Fetch error:", error);
            return null;
        }
    },

    /**
     * Gera um Access Token a partir do Refresh Token.
     */
    async getAccessToken(refreshToken: string) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        
        const { token } = await oauth2Client.getAccessToken();
        if (!token) throw new Error("Falha ao gerar access token do Google");
        return token;
    }
};
