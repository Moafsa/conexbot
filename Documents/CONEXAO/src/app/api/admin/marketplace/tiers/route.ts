import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tiers = await prisma.agencyTier.findMany({
        orderBy: { minSalesVolume: 'asc' }
    });
    return NextResponse.json(tiers);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const tier = await prisma.agencyTier.create({
            data: {
                name: body.name,
                minSalesVolume: Number(body.minSalesVolume),
                feePercentage: Number(body.feePercentage)
            }
        });
        return NextResponse.json(tier);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        if (!body.id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const tier = await prisma.agencyTier.update({
            where: { id: body.id },
            data: {
                name: body.name,
                minSalesVolume: Number(body.minSalesVolume),
                feePercentage: Number(body.feePercentage)
            }
        });
        return NextResponse.json(tier);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.agencyTier.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
