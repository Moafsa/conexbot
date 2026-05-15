import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const history = await prisma.keywordResearch.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return NextResponse.json({ history });
    } catch (error: any) {
        return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
    }
}
