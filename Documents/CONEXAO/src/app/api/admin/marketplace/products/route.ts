import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (!session?.user || !["ADMIN", "SUPERADMIN", "AGENCY"].includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.productCatalog.findMany({
        include: { plans: true },
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const product = await prisma.productCatalog.create({
            data: {
                name: body.name,
                description: body.description,
                minMonthlyPrice: body.minMonthlyPrice,
                minSetupPrice: body.minSetupPrice
            }
        });
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const product = await prisma.productCatalog.update({
            where: { id: body.id },
            data: {
                name: body.name,
                description: body.description,
                minMonthlyPrice: Number(body.minMonthlyPrice),
                minSetupPrice: Number(body.minSetupPrice)
            }
        });
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const product = await prisma.productCatalog.findUnique({ where: { id } });
        const protectedProducts = ["CONEXT_BOT", "MARKETING_IA", "CRM_PIPELINE", "CONEXT_WRITER"];
        
        if (product && protectedProducts.includes(product.name)) {
            return NextResponse.json({ error: "Este é um produto oficial do sistema e não pode ser excluído." }, { status: 400 });
        }

        await prisma.productCatalog.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
