import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET - list clients of the agency
export async function GET() {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve tenantId (own or impersonated)
    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }

    const agency = await prisma.agency.findUnique({
        where: { tenantId },
        include: {
            clients: {
                include: {
                    subscriptions: {
                        where: { status: { in: ['ACTIVE', 'TRIALING', 'PENDING'] } },
                        select: { id: true, status: true, type: true }
                    }
                }
            }
        }
    });

    if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });

    return NextResponse.json(agency.clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        cpfCnpj: c.cpfCnpj,
        whatsapp: c.whatsapp,
        subscriptions: c.subscriptions,
        createdAt: c.createdAt
    })));
}

// POST - add a new client to the agency
export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }

    const agency = await prisma.agency.findUnique({ where: { tenantId } });
    if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });

    const { email, name, cpfCnpj, phone } = await req.json();
    if (!email || !name) return NextResponse.json({ error: "Email e nome são obrigatórios" }, { status: 400 });
    if (!cpfCnpj) return NextResponse.json({ error: "CPF/CNPJ é obrigatório" }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 });

    // Check if tenant already exists
    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
        // If already exists, just link to agency if not already linked
        if (existing.agencyId === agency.id) {
            return NextResponse.json({ error: "Este cliente já está vinculado à sua agência" }, { status: 400 });
        }
        await prisma.tenant.update({
            where: { id: existing.id },
            data: { agencyId: agency.id, cpfCnpj, whatsapp: phone }
        });
        return NextResponse.json({ success: true, message: "Cliente vinculado com sucesso", id: existing.id });
    }

    // Create new tenant with temp password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const newClient = await prisma.tenant.create({
        data: {
            email,
            name,
            password: hashedPassword,
            role: "USER",
            agencyId: agency.id,
            cpfCnpj,
            whatsapp: phone
        }
    });

    return NextResponse.json({
        success: true,
        message: `Cliente criado. Senha provisória: ${tempPassword}`,
        id: newClient.id,
        tempPassword
    });
}
