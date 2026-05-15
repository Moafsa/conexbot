import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const posts = await prisma.marketingPost.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { bot: { select: { name: true } } }
        });

        return NextResponse.json(posts);
    } catch (error: any) {
        console.error("[API_MARKETING_POSTS] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
