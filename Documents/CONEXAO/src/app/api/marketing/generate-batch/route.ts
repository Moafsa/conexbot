import { NextResponse } from "next/server";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        const body = await req.json();
        const { botId, count, theme, tone, platform } = body;

        if (!botId || !theme) {
            return NextResponse.json({ error: "Bot e Tema são obrigatórios" }, { status: 400 });
        }

        const posts = await MarketingIAService.generateBatchPosts({
            tenantId: (session.user as any).id,
            botId,
            count: count || 1,
            theme,
            tone: tone || "Profissional",
            platform: platform || "Instagram"
        });

        return NextResponse.json({
            success: true,
            count: posts.length,
            posts
        });
    } catch (error: any) {
        console.error("[MarketingBatch] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
