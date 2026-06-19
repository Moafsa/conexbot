import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, status, dailyBudget, clientId } = body;
        const campaignId = params.id;
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const success = await MetaAdsService.updateCampaign(tenantId, campaignId, {
            name,
            status,
            dailyBudget
        });

        return NextResponse.json({ success });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro ao atualizar campanha" }, { status: 500 });
    }
}
