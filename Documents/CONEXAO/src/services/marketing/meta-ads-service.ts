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
    }
};
