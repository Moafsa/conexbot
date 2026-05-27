import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MarketingIAService } from "@/services/marketing/marketing-ia-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { theme, tone, platform, botId, baseImageUrls, videoUrl, postFormat } = body;

        if (!theme || !botId) {
            return NextResponse.json({ error: "Tema e Bot ID são obrigatórios" }, { status: 400 });
        }

        const post = await MarketingIAService.generatePost({
            tenantId: session.user.id,
            botId,
            theme,
            tone,
            platform,
            baseImageUrls: baseImageUrls || [],
            videoUrl,
            postFormat
        });

        return NextResponse.json(post);
    } catch (error: any) {
        console.error("[API_MARKETING_GENERATE] Error:", error);
        return NextResponse.json({ error: error.message || "Erro ao gerar post" }, { status: 500 });
    }
}
