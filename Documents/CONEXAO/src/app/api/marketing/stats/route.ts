import { NextResponse } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const postsCount = await prisma.marketingPost.count({
            where: { tenantId: session.user.id }
        });

        return NextResponse.json({ postsCount });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
    }
}
