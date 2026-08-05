import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export const GoogleAdsService = {
    /**
     * Retorna o Access Token a partir de um Refresh Token
     */
    async getAccessToken(refreshToken: string) {
        const globalConfig = await prisma.globalConfig.findFirst();
        if (!globalConfig?.googleClientId || !globalConfig?.googleClientSecret) {
            throw new Error("Google OAuth credentials not configured in GlobalConfig");
        }

        const oauth2Client = new google.auth.OAuth2(
            globalConfig.googleClientId,
            globalConfig.googleClientSecret
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        
        const { token } = await oauth2Client.getAccessToken();
        if (!token) throw new Error("Falha ao gerar access token do Google");
        return token;
    },

    /**
     * Busca performance básica das campanhas de Google Ads.
     */
    async getCampaignInsights(tenantId: string) {
        const globalConfig = await prisma.globalConfig.findFirst();
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { googleAdsCustomerId: true, googleAdsRefreshToken: true }
        });

        if (!globalConfig?.googleAdsDeveloperToken || !tenant?.googleAdsCustomerId || !tenant?.googleAdsRefreshToken) {
            return null;
        }

        try {
            const accessToken = await this.getAccessToken(tenant.googleAdsRefreshToken);
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
                    'developer-token': globalConfig.googleAdsDeveloperToken,
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
     * Busca gastos/impressões/cliques diários dos últimos 30 dias, para gráficos de desempenho.
     */
    async getDailyInsights(tenantId: string) {
        const globalConfig = await prisma.globalConfig.findFirst();
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { googleAdsCustomerId: true, googleAdsRefreshToken: true }
        });

        if (!globalConfig?.googleAdsDeveloperToken || !tenant?.googleAdsCustomerId || !tenant?.googleAdsRefreshToken) {
            return [];
        }

        try {
            const accessToken = await this.getAccessToken(tenant.googleAdsRefreshToken);
            const customerId = tenant.googleAdsCustomerId.replace(/-/g, '');

            const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`;
            const query = {
                query: `
                    SELECT
                        segments.date,
                        metrics.cost_micros,
                        metrics.impressions,
                        metrics.clicks
                    FROM campaign
                    WHERE segments.date DURING LAST_30_DAYS
                `
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': globalConfig.googleAdsDeveloperToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(query)
            });

            const data = await res.json();
            if (data.error) {
                console.error("[GoogleAds] getDailyInsights API Error:", data.error);
                return [];
            }

            const byDate: Record<string, { spend: number; impressions: number; clicks: number }> = {};
            for (const row of data.results || []) {
                const date = row.segments?.date;
                if (!date) continue;
                if (!byDate[date]) byDate[date] = { spend: 0, impressions: 0, clicks: 0 };
                byDate[date].spend += Number(row.metrics?.costMicros || 0) / 1000000;
                byDate[date].impressions += Number(row.metrics?.impressions || 0);
                byDate[date].clicks += Number(row.metrics?.clicks || 0);
            }

            return Object.entries(byDate)
                .map(([date, v]) => ({ date, ...v }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error("[GoogleAds] getDailyInsights fetch error:", error);
            return [];
        }
    },

    /**
     * Busca gasto/impressões/cliques de HOJE por campanha (usado pelo snapshot diário
     * que alimenta o histórico de ROI, já que a API só cobre uma janela rolante).
     */
    async getCampaignSpendToday(tenantId: string) {
        const globalConfig = await prisma.globalConfig.findFirst();
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { googleAdsCustomerId: true, googleAdsRefreshToken: true }
        });

        if (!globalConfig?.googleAdsDeveloperToken || !tenant?.googleAdsCustomerId || !tenant?.googleAdsRefreshToken) {
            return [];
        }

        try {
            const accessToken = await this.getAccessToken(tenant.googleAdsRefreshToken);
            const customerId = tenant.googleAdsCustomerId.replace(/-/g, '');

            const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`;
            const query = {
                query: `
                    SELECT
                        campaign.id,
                        campaign.name,
                        metrics.cost_micros,
                        metrics.impressions,
                        metrics.clicks
                    FROM campaign
                    WHERE segments.date DURING TODAY
                `
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': globalConfig.googleAdsDeveloperToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(query)
            });

            const data = await res.json();
            if (data.error) {
                console.error("[GoogleAds] getCampaignSpendToday API Error:", data.error);
                return [];
            }

            return (data.results || []).map((r: any) => ({
                campaignId: String(r.campaign?.id ?? ''),
                campaignName: r.campaign?.name as string,
                spend: Number(r.metrics?.costMicros || 0) / 1000000,
                impressions: Number(r.metrics?.impressions || 0),
                clicks: Number(r.metrics?.clicks || 0)
            })).filter((r: any) => r.campaignId);
        } catch (error) {
            console.error("[GoogleAds] getCampaignSpendToday fetch error:", error);
            return [];
        }
    },

    /**
     * Exemplo de método para criar ou gerenciar campanhas, para uso futuro pelo Maestro.
     */
    async createCampaign(tenantId: string, params: { name: string; budgetMicros: number }) {
        const globalConfig = await prisma.globalConfig.findFirst();
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { googleAdsCustomerId: true, googleAdsRefreshToken: true }
        });

        if (!globalConfig?.googleAdsDeveloperToken || !tenant?.googleAdsCustomerId || !tenant?.googleAdsRefreshToken) {
            throw new Error("Credenciais do Google Ads incompletas para o Tenant");
        }

        const accessToken = await this.getAccessToken(tenant.googleAdsRefreshToken);
        const customerId = tenant.googleAdsCustomerId.replace(/-/g, '');

        const url = `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:mutate`;
        
        const payload = {
            mutateOperations: [
                {
                    campaignBudgetOperation: {
                        create: {
                            resourceName: `customers/${customerId}/campaignBudgets/-1`,
                            name: `${params.name} Budget`,
                            amountMicros: params.budgetMicros,
                            deliveryMethod: "STANDARD"
                        }
                    }
                },
                {
                    campaignOperation: {
                        create: {
                            name: params.name,
                            status: "PAUSED",
                            advertisingChannelType: "SEARCH",
                            campaignBudget: `customers/${customerId}/campaignBudgets/-1`,
                            networkSettings: {
                                targetGoogleSearch: true,
                                targetSearchNetwork: true
                            }
                        }
                    }
                }
            ]
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'developer-token': globalConfig.googleAdsDeveloperToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.error) {
                console.error("[GoogleAds] createCampaign API Error:", JSON.stringify(data.error, null, 2));
                throw new Error(data.error.message || "Falha ao criar campanha no Google Ads");
            }

            const campaignResult = data.mutateOperationResponses?.find((r: any) => r.campaignResult);
            const resourceName = campaignResult?.campaignResult?.resourceName;

            return { 
                success: true, 
                message: "Campanha criada com sucesso", 
                externalId: resourceName || `gads_${Date.now()}` 
            };
        } catch (error: any) {
            console.error("[GoogleAds] createCampaign fetch error:", error);
            throw error;
        }
    }
};
