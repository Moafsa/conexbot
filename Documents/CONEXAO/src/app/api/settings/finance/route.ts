
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateFinanceSchema = z.object({
    asaasApiKey: z.string().optional(),
});

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { email: session.user.email },
            select: {
                asaasApiKey: true,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("API /settings/finance error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const data = updateFinanceSchema.parse(body);

        const tenant = await prisma.tenant.update({
            where: { email: session.user.email },
            data: {
                asaasApiKey: data.asaasApiKey,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("API /settings/finance error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
