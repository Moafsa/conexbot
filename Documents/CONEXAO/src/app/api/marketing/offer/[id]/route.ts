import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const offer = await prisma.digitalOffer.findUnique({
            where: { id },
            include: {
                bot: {
                    select: { name: true, tenantId: true }
                }
            }
        });

        if (!offer) {
            return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
        }

        if (offer.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
        }

        return NextResponse.json(offer);

    } catch (error: any) {
        console.error("[Offer Details GET Error]:", error);
        return NextResponse.json({ error: "Erro interno ao buscar detalhes" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, niche, price, originalPrice, copy, mockupImageUrl, isPublished, publicSlug } = body;

        const existing = await prisma.digitalOffer.findUnique({
            where: { id },
            include: { bot: { select: { tenantId: true } } }
        });

        if (!existing) {
            return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
        }

        if (existing.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
        }

        // Se o slug mudou, validar unicidade
        let slug = publicSlug;
        if (slug && slug !== existing.publicSlug) {
            slug = slug
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
                
            const collision = await prisma.digitalOffer.findUnique({ where: { publicSlug: slug } });
            if (collision) {
                return NextResponse.json({ error: "Este endereço/slug já está em uso" }, { status: 400 });
            }
        }

        const updated = await prisma.digitalOffer.update({
            where: { id },
            data: {
                name,
                niche,
                price: price !== undefined ? parseFloat(price) : undefined,
                originalPrice: originalPrice !== undefined ? (originalPrice ? parseFloat(originalPrice) : null) : undefined,
                copy: copy || undefined,
                mockupImageUrl,
                isPublished,
                publicSlug: slug || undefined
            }
        });

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error("[Offer Details PUT Error]:", error);
        return NextResponse.json({ error: "Erro interno ao atualizar oferta" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: any }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await prisma.digitalOffer.findUnique({
            where: { id },
            include: { bot: { select: { tenantId: true } } }
        });

        if (!existing) {
            return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
        }

        if (existing.bot.tenantId !== (session.user as any).id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
        }

        await prisma.digitalOffer.delete({ where: { id } });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[Offer Details DELETE Error]:", error);
        return NextResponse.json({ error: "Erro interno ao excluir oferta" }, { status: 500 });
    }
}
