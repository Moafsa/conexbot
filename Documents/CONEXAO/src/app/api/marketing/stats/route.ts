import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const postsCount = await prisma.marketingPost.count({
            where: { tenantId }
        });

        return NextResponse.json({ postsCount });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
    }
}
