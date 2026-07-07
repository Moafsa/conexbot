import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json({ error: "Slug é obrigatório" }, { status: 400 });
        }

        const offer = await prisma.digitalOffer.findUnique({
            where: { 
                publicSlug: slug,
                isPublished: true // só retornar se estiver publicado
            },
            select: {
                id: true,
                name: true,
                niche: true,
                price: true,
                originalPrice: true,
                copy: true,
                mockupImageUrl: true,
                createdAt: true
            }
        });

        if (!offer) {
            return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
        }

        return NextResponse.json(offer);

    } catch (error: any) {
        console.error("[Public Offer API GET Error]:", error);
        return NextResponse.json({ error: "Erro interno ao buscar página de vendas" }, { status: 500 });
    }
}
