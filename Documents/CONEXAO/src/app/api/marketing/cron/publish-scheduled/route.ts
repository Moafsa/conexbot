import { NextResponse } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MetaPostService } from "@/services/marketing/meta-post-service";

export async function GET(req: Request) {
    // Verificar token de segurança se necessário
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ...

    try {
        const now = new Date();
        const toPublish = await prisma.marketingPost.findMany({
            where: {
                status: "SCHEDULED",
                scheduledAt: { lte: now }
            }
        });

        const results = [];
        for (const post of toPublish) {
            try {
                let mediaId;
                const platformUpper = (post.platform || "").toUpperCase();
                if (platformUpper.includes("FACEBOOK")) {
                    mediaId = await MetaPostService.publishToFacebook(post.id);
                } else {
                    mediaId = await MetaPostService.publishToInstagram(post.id);
                }
                results.push({ id: post.id, status: "SUCCESS", mediaId });
            } catch (err: any) {
                console.error(`[Cron] Erro ao publicar post ${post.id}:`, err.message);
                await prisma.marketingPost.update({
                    where: { id: post.id },
                    data: { status: "FAILED", rejectionReason: err.message }
                });
                results.push({ id: post.id, status: "FAILED", error: err.message });
            }
        }

        return NextResponse.json({ processed: toPublish.length, results });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
