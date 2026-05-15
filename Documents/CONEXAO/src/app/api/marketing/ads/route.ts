import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [metaCampaigns, metaInsights, metaBalance, googleCampaigns] = await Promise.all([
            MetaAdsService.listCampaigns(tenantId),
            MetaAdsService.getInsights(tenantId),
            MetaAdsService.getAccountBalance(tenantId).catch(() => null),
            // Tenta Google Ads se configurado
            require("@/services/marketing/google-ads-service").GoogleAdsService.getCampaignInsights(tenantId).catch(() => null)
        ]);

        return NextResponse.json({ 
            campaigns: metaCampaigns, 
            insights: metaInsights,
            metaBalance,
            googleAds: googleCampaigns 
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao buscar dados de anúncios" }, { status: 500 });
    }
}
