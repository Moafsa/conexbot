import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const { action, reason } = await req.json(); // "APPROVE" or "REJECT"

        const post = await prisma.marketingPost.findUnique({
            where: { shareToken: token }
        });

        if (!post) {
            return NextResponse.json({ error: "Post não encontrado ou link expirado." }, { status: 404 });
        }

        if (action === "APPROVE") {
            await prisma.marketingPost.update({
                where: { id: post.id },
                data: { 
                    status: "SCHEDULED",
                    rejectionReason: null, // Limpa qualquer feedback anterior
                    scheduledAt: new Date(Date.now() + 1000 * 60 * 60) // Agenda para daqui a 1 hora por padrão
                }
            });
            return NextResponse.json({ success: true, message: "Post aprovado e agendado!" });
        } else if (action === "REJECT") {
            await prisma.marketingPost.update({
                where: { id: post.id },
                data: { 
                    status: "DRAFT",
                    rejectionReason: reason || "Cliente solicitou alterações."
                }
            });
            return NextResponse.json({ success: true, message: "Feedback enviado. O post voltou para rascunho." });
        }

        return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
