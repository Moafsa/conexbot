import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencies = await prisma.agency.findMany({
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    whatsapp: true
                }
            }
        },
        orderBy: { salesVolumeCurrentMonth: 'desc' }
    });
    
    return NextResponse.json(agencies);
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, status, fee } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
        }

        const updated = await prisma.agency.update({
            where: { id },
            data: { 
                status,
                currentFee: fee !== undefined ? Number(fee) : undefined
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update agency:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
