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

        const url = `https://graph.facebook.com/v22.0/${accountId}/campaigns?fields=name,status,objective,budget_remaining,daily_budget,lifetime_budget&access_token=${tenant.metaAdsToken}`;
        
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
    }
};
