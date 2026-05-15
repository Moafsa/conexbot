import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agency = await prisma.agency.findUnique({
        where: { tenantId: session.user.id },
        include: { pricing: { include: { product: true } } }
    });

    if (!agency) {
        // Se não for agência, tenta converter o tenant em agência (ou retorna erro)
        return NextResponse.json({ error: "User is not an agency" }, { status: 403 });
    }

    return NextResponse.json(agency.pricing);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json(); // Array de { productId, monthlyPrice, setupPrice }
        const agency = await prisma.agency.findUnique({ where: { tenantId: session.user.id } });
        if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });

        // Validar contra preços mínimos
        const products = await prisma.productCatalog.findMany();
        
        for (const item of body) {
            const product = products.find(p => p.id === item.productId);
            if (!product) continue;
            
            if (item.monthlyPrice < product.minMonthlyPrice) {
                return NextResponse.json({ error: `Preço para ${product.name} abaixo do mínimo permitido.` }, { status: 400 });
            }
        }

        // Salvar precificação
        const operations = body.map((item: any) => 
            prisma.agencyPricing.upsert({
                where: { agencyId_productId: { agencyId: agency.id, productId: item.productId } },
                update: { 
                    monthlyPrice: item.monthlyPrice, 
                    setupPrice: item.setupPrice,
                    markupPercent: item.markupPercent || 0
                },
                create: { 
                    agencyId: agency.id, 
                    productId: item.productId, 
                    monthlyPrice: item.monthlyPrice, 
                    setupPrice: item.setupPrice,
                    markupPercent: item.markupPercent || 0
                }
            })
        );

        await Promise.all(operations);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
