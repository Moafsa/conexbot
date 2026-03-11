import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    whatsapp: z.string().nullable().optional(),
    cpfCnpj: z.string().nullable().optional(),
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
                name: true,
                email: true,
                whatsapp: true,
                cpfCnpj: true,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("API /settings/profile error:", error);
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
        const data = updateProfileSchema.parse(body);

        const tenant = await prisma.tenant.update({
            where: { email: session.user.email },
            data: {
                name: data.name,
                email: data.email,
                whatsapp: data.whatsapp,
                cpfCnpj: data.cpfCnpj,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
