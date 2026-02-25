import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
        where: { email: session.user.email },
        include: {
            bots: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    sessionName: true,
                }
            }
        }
    });

    if (!tenant) return NextResponse.json([], { status: 404 });

    // In a real scenario, we would also check the UZAPI status for each sessionName
    // For now, we return the bots and their basic db status
    return NextResponse.json(tenant.bots);
}
