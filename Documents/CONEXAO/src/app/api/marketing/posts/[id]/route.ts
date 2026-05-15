import { NextResponse } from "next/server";
import { getEffectiveTenantId } from "@/lib/get-effective-tenant";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const tenantId = await getEffectiveTenantId();
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        await prisma.marketingPost.delete({
            where: { id, tenantId }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[PostDelete] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const tenantId = await getEffectiveTenantId();
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content, imageUrl } = await req.json();

    try {
        const isVideo = imageUrl?.toLowerCase().endsWith('.mp4') || 
                       imageUrl?.toLowerCase().endsWith('.mov') || 
                       imageUrl?.toLowerCase().includes('video');

        const post = await prisma.marketingPost.update({
            where: { id, tenantId },
            data: { 
                content,
                ...(imageUrl && { 
                    imageUrl: isVideo ? null : imageUrl,
                    videoUrl: isVideo ? imageUrl : null,
                    mediaType: isVideo ? "VIDEO" : "IMAGE"
                })
            }
        });
        return NextResponse.json(post);
    } catch (error: any) {
        console.error("[PostPatch] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
