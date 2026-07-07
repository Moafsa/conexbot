import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const botId = searchParams.get("botId");

        // Buscar ofertas que pertencem a bots do tenant logado
        const offers = await prisma.digitalOffer.findMany({
            where: {
                bot: {
                    tenantId: (session.user as any).id
                },
                ...(botId ? { botId } : {})
            },
            include: {
                bot: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(offers);

    } catch (error: any) {
        console.error("[Offer GET API Error]:", error);
        return NextResponse.json({ error: "Erro interno ao buscar ofertas" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { name, niche, price, originalPrice, copy, mockupImageUrl, botId } = body;

        if (!name || !niche || !price || !botId) {
            return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
        }

        // Verificar propriedade do bot
        const bot = await prisma.bot.findFirst({
            where: {
                id: botId,
                tenantId: (session.user as any).id
            }
        });

        if (!bot) {
            return NextResponse.json({ error: "Agente não encontrado ou não pertence a você" }, { status: 403 });
        }

        // Gerar um slug amigável padrão baseado no nome
        const baseSlug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        let slug = baseSlug;
        let count = 1;
        
        // Resolver colisões de slug
        while (await prisma.digitalOffer.findUnique({ where: { publicSlug: slug } })) {
            slug = `${baseSlug}-${count++}`;
        }

        const offer = await prisma.digitalOffer.create({
            data: {
                name,
                niche,
                price: parseFloat(price),
                originalPrice: originalPrice ? parseFloat(originalPrice) : null,
                copy: copy || {},
                mockupImageUrl,
                botId,
                publicSlug: slug,
                isPublished: true // publicado por padrão para facilitar
            }
        });

        return NextResponse.json(offer);

    } catch (error: any) {
        console.error("[Offer POST API Error]:", error);
        return NextResponse.json({ error: "Erro interno ao criar oferta" }, { status: 500 });
    }
}
