import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tenantId = await getEffectiveTenantId();
        if (!tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const { instructions } = await req.json();
        if (!instructions) return NextResponse.json({ error: "Instruções são obrigatórias" }, { status: 400 });

        const post = await MarketingIAService.refinePost({
            tenantId,
            postId: id,
            instructions
        });

        return NextResponse.json(post);
    } catch (error: any) {
        console.error("[PostRefine] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
