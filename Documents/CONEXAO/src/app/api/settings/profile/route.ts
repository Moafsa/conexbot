export const dynamic = 'force-dynamic';
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

    let body;
    try {
        body = await req.json();
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
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        
        let errorMessage = "Erro interno ao atualizar o perfil.";
        
        if (error.code === 'P2002') {
            if (error.meta?.target?.includes('whatsapp')) {
                errorMessage = 'Já existe um usuário cadastrado com este número de WhatsApp.';
                try {
                    const wp = body?.whatsapp;
                    if (wp) {
                        const existingOwner = await prisma.tenant.findUnique({ 
                            where: { whatsapp: wp },
                            select: { name: true, email: true }
                        });
                        if (existingOwner) {
                            errorMessage = `O WhatsApp já existe e está sendo usado por ${existingOwner.name || 'Sem nome'} (${existingOwner.email}).`;
                        }
                    }
                } catch (e) {}
            } else if (error.meta?.target?.includes('email')) {
                errorMessage = 'Já existe um usuário cadastrado com este E-mail.';
            }
        }
        
        console.error("API /settings/profile error:", error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

