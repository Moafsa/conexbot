import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { MetaAdsService } from "@/services/marketing/meta-ads-service";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, status, clientId } = body;
        const adId = params.id;
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const success = await MetaAdsService.updateAd(tenantId, adId, {
            name,
            status
        });

        return NextResponse.json({ success });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro ao atualizar anúncio" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        const adId = params.id;
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const success = await MetaAdsService.deleteAd(tenantId, adId);

        return NextResponse.json({ success });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro ao deletar anúncio" }, { status: 500 });
    }
}
