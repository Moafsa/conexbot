import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import crypto from "crypto";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tenantId = await getEffectiveTenantId();
        if (!tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

        // 1. Buscar o post
        const post = await prisma.marketingPost.findFirst({
            where: { id, tenantId }
        });

        if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

        let shareToken = post.shareToken || crypto.randomBytes(16).toString("hex");

        if (!post.shareToken) {
            await prisma.marketingPost.update({
                where: { id: post.id },
                data: { shareToken }
            });
        }

        const shareUrl = `${process.env.NEXTAUTH_URL || 'https://app.conext.click'}/marketing/preview/${shareToken}`;

        return NextResponse.json({ shareToken, shareUrl });
    } catch (error: any) {
        console.error("[PostShare] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
