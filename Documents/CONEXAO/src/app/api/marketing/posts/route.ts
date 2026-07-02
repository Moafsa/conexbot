import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const clientId = url.searchParams.get("clientId");
        
        const tenantId = await getEffectiveTenantId(clientId);
        if (!tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? Math.min(Math.max(parseInt(limitParam), 1), 100) : 20;

        const status = url.searchParams.get("status");

        const whereClause: any = { tenantId };
        if (status) {
            whereClause.status = status;
        }

        const posts = await prisma.marketingPost.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { bot: { select: { name: true } } }
        });

        return NextResponse.json(posts);
    } catch (error: any) {
        console.error("[API_MARKETING_POSTS] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
