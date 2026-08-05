import { prisma } from "@/lib/prisma";

export const MetaAdsService = {
    /**
     * Lista campanhas de uma conta de anúncios.
     */
    async listCampaigns(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) {
            return []; // Retorna vazio se não estiver configurado
        }

        const accountId = tenant.metaAdsAccountId.startsWith('act_') 
            ? tenant.metaAdsAccountId 
            : `act_${tenant.metaAdsAccountId}`;

        const url = `https://graph.facebook.com/v22.0/${accountId}/campaigns?fields=name,status,objective,budget_remaining,daily_budget,lifetime_budget,adsets{id,name,status,daily_budget,ads{id,name,status,creative{thumbnail_url,image_url,body,title}}}&access_token=${tenant.metaAdsToken}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.error) {
                console.error("[MetaAds] Error:", data.error);
                return [];
            }

            return data.data || [];
        } catch (error) {
            console.error("[MetaAds] Fetch error:", error);
            return [];
        }
    },

    /**
     * Busca insights (gastos, cliques, etc) das campanhas.
     */
    async getInsights(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) {
            return null;
        }

        const accountId = tenant.metaAdsAccountId.startsWith('act_') 
            ? tenant.metaAdsAccountId 
            : `act_${tenant.metaAdsAccountId}`;

        const url = `https://graph.facebook.com/v22.0/${accountId}/insights?fields=spend,impressions,clicks,inline_link_click_ctr&access_token=${tenant.metaAdsToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            return data.data?.[0] || null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Busca gastos/impressões/cliques diários dos últimos 30 dias, para gráficos de desempenho.
     */
    async getDailyInsights(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) return [];

        const accountId = tenant.metaAdsAccountId.startsWith('act_')
            ? tenant.metaAdsAccountId
            : `act_${tenant.metaAdsAccountId}`;

        const url = `https://graph.facebook.com/v22.0/${accountId}/insights?fields=spend,impressions,clicks&time_increment=1&date_preset=last_30d&access_token=${tenant.metaAdsToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) {
                console.error("[MetaAds] getDailyInsights Error:", data.error);
                return [];
            }
            return (data.data || []).map((d: any) => ({
                date: d.date_start,
                spend: parseFloat(d.spend || 0),
                impressions: Number(d.impressions || 0),
                clicks: Number(d.clicks || 0)
            }));
        } catch (error) {
            console.error("[MetaAds] getDailyInsights fetch error:", error);
            return [];
        }
    },

    /**
     * Busca gasto/impressões/cliques dos últimos 30 dias por campanha (para o fallback
     * de ROI enquanto o histórico persistido de AdSpendSnapshot ainda não cobre o período).
     */
    async getCampaignInsightsLast30d(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) return [];

        const accountId = tenant.metaAdsAccountId.startsWith('act_')
            ? tenant.metaAdsAccountId
            : `act_${tenant.metaAdsAccountId}`;

        const url = `https://graph.facebook.com/v22.0/${accountId}/campaigns?fields=id,name,insights.date_preset(last_30d){spend,impressions,clicks}&access_token=${tenant.metaAdsToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) {
                console.error("[MetaAds] getCampaignInsightsLast30d Error:", data.error);
                return [];
            }
            return (data.data || []).map((c: any) => {
                const insight = c.insights?.data?.[0];
                return {
                    campaignId: c.id as string,
                    campaignName: c.name as string,
                    spend: parseFloat(insight?.spend || 0),
                    impressions: Number(insight?.impressions || 0),
                    clicks: Number(insight?.clicks || 0)
                };
            });
        } catch (error) {
            console.error("[MetaAds] getCampaignInsightsLast30d fetch error:", error);
            return [];
        }
    },

    /**
     * Busca gasto/impressões/cliques de HOJE por campanha (usado pelo snapshot diário
     * que alimenta o histórico de ROI, já que a Insights API só cobre uma janela rolante).
     */
    async getCampaignSpendToday(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) return [];

        const accountId = tenant.metaAdsAccountId.startsWith('act_')
            ? tenant.metaAdsAccountId
            : `act_${tenant.metaAdsAccountId}`;

        const url = `https://graph.facebook.com/v22.0/${accountId}/campaigns?fields=id,name,insights.date_preset(today){spend,impressions,clicks}&access_token=${tenant.metaAdsToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.error) {
                console.error("[MetaAds] getCampaignSpendToday Error:", data.error);
                return [];
            }
            return (data.data || []).map((c: any) => {
                const insight = c.insights?.data?.[0];
                return {
                    campaignId: c.id as string,
                    campaignName: c.name as string,
                    spend: parseFloat(insight?.spend || 0),
                    impressions: Number(insight?.impressions || 0),
                    clicks: Number(insight?.clicks || 0)
                };
            });
        } catch (error) {
            console.error("[MetaAds] getCampaignSpendToday fetch error:", error);
            return [];
        }
    },

    /**
     * Busca o saldo/status financeiro da conta.
     */
    async getAccountBalance(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) return null;

        const accountId = tenant.metaAdsAccountId.startsWith('act_') 
            ? tenant.metaAdsAccountId 
            : `act_${tenant.metaAdsAccountId}`;

        const url = `https://graph.facebook.com/v22.0/${accountId}?fields=balance,amount_spent,spend_cap,currency&access_token=${tenant.metaAdsToken}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.error) return null;

            // Meta retorna balance em centavos da moeda local
            return {
                balance: (parseFloat(data.balance || 0) / 100),
                amount_spent: (parseFloat(data.amount_spent || 0) / 100),
                spend_cap: (parseFloat(data.spend_cap || 0) / 100),
                currency: data.currency || "BRL"
            };
        } catch (error) {
            return null;
        }
    },

    /**
     * Cria uma campanha real na Meta.
     */
    async createCampaign(tenantId: string, params: { name: string, objective: string, dailyBudget: number }) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant?.metaAdsToken || !tenant?.metaAdsAccountId) throw new Error("Meta Ads não configurado");

        const accountId = tenant.metaAdsAccountId.startsWith('act_') ? tenant.metaAdsAccountId : `act_${tenant.metaAdsAccountId}`;
        
        const url = `https://graph.facebook.com/v22.0/${accountId}/campaigns`;
        
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: params.name,
                objective: params.objective, // OUTREACH, TRAFFIC, etc.
                status: 'PAUSED', // Começa pausada por segurança
                special_ad_categories: 'NONE',
                daily_budget: params.dailyBudget,
                access_token: tenant.metaAdsToken
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.id;
    },

    /**
     * Atualiza uma campanha na Meta.
     */
    async updateCampaign(tenantId: string, campaignId: string, params: { name?: string, status?: string, dailyBudget?: number }) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true }
        });

        if (!tenant?.metaAdsToken) throw new Error("Meta Ads não configurado");

        const url = `https://graph.facebook.com/v22.0/${campaignId}`;
        
        const body: any = { access_token: tenant.metaAdsToken };
        if (params.name) body.name = params.name;
        if (params.status) body.status = params.status;
        if (params.dailyBudget !== undefined) body.daily_budget = params.dailyBudget;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.success;
    },

    /**
     * Atualiza um anúncio na Meta (apenas nome e status, criativo não pode ser editado).
     */
    async updateAd(tenantId: string, adId: string, params: { name?: string, status?: string }) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true }
        });

        if (!tenant?.metaAdsToken) throw new Error("Meta Ads não configurado");

        const url = `https://graph.facebook.com/v22.0/${adId}`;
        
        const body: any = { access_token: tenant.metaAdsToken };
        if (params.name) body.name = params.name;
        if (params.status) body.status = params.status;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.success;
    },

    /**
     * Deleta um anúncio na Meta.
     */
    async deleteAd(tenantId: string, adId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true }
        });

        if (!tenant?.metaAdsToken) throw new Error("Meta Ads não configurado");

        const url = `https://graph.facebook.com/v22.0/${adId}?access_token=${tenant.metaAdsToken}`;
        
        const res = await fetch(url, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.success;
    }
};
