import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const recommendations = await MarketingIAService.generateRecommendations(tenantId);

        return NextResponse.json({ recommendations });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao gerar recomendações" }, { status: 500 });
    }
}
