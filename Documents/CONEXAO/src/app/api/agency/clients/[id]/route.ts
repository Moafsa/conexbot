import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PlanType } from "@prisma/client";
 
// GET - Fetch client details and subscriptions
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }
 
    const agency = await prisma.agency.findUnique({ where: { tenantId } });
    if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });
 
    const client = await prisma.tenant.findUnique({ 
        where: { id: clientId },
        include: {
            subscriptions: {
                include: {
                    plan: true
                }
            },
            usageCounter: true
        }
    });
 
    if (!client || client.agencyId !== agency.id) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }
 
    return NextResponse.json(client);
}

// PUT - Update client info
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }

    const agency = await prisma.agency.findUnique({ where: { tenantId } });
    if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });

    const client = await prisma.tenant.findUnique({ where: { id: clientId } });
    if (!client || client.agencyId !== agency.id) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, cpfCnpj, phone } = body;

    try {
        await prisma.tenant.update({
            where: { id: clientId },
            data: {
                name,
                email,
                cpfCnpj,
                whatsapp: phone
            }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update client error:", error);
        return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
    }
}

// DELETE - Remove client from agency
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: clientId } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let tenantId = session.user.id;
    if (!tenantId && session.user.email) {
        const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
        tenantId = t?.id;
    }

    const agency = await prisma.agency.findUnique({ where: { tenantId } });
    if (!agency) return NextResponse.json({ error: "Not an agency" }, { status: 403 });

    const client = await prisma.tenant.findUnique({ where: { id: clientId } });
    if (!client || client.agencyId !== agency.id) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    try {
        // Disconnect from agency instead of deleting the tenant entirely, 
        // to not destroy their data if they want to pay directly later.
        await prisma.tenant.update({
            where: { id: clientId },
            data: { agencyId: null }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Erro ao remover cliente" }, { status: 500 });
    }
}
