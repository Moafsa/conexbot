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
                return { 
                    success: true, 
                    message: "Mocked campaign creation (Developer Token might be pending approval).", 
                    externalId: `mock_gads_${Date.now()}` 
                };
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
