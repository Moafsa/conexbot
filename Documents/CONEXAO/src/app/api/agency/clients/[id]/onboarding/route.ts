/**
 * GET /api/agency/clients/[id]/onboarding
 * PUT /api/agency/clients/[id]/onboarding
 *
 * Fetch/Update complete onboarding data for an existing client, including:
 * - Client info (name, email, phone, CPF/CNPJ)
 * - Primary bot configuration (name, niche, system prompt, modules)
 * - Channels (WhatsApp, Instagram, etc.)
 * - Marketing info (business description, target audience, products)
 * - Financial info (payment methods, ticket)
 * - Settings (hours, address, website)
 *
 * Used for re-editing client onboarding after creation.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = session.user.id;
    const clientId = params.id;

    // Verify agency access
    const agency = await prisma.agency.findUnique({
        where: { tenantId },
        select: { id: true },
    });
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    // Fetch client with all related data
    const client = await prisma.tenant.findFirst({
        where: {
            id: clientId,
            agencyId: agency.id,
        },
        select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            cpfCnpj: true,
            bots: {
                where: { status: 'active' },
                select: {
                    id: true,
                    name: true,
                    niche: true,
                    systemPrompt: true,
                    modules: true,
                    websiteUrl: true,
                    address: true,
                    hours: true,
                    channels: {
                        select: {
                            provider: true,
                            identifier: true,
                        },
                    },
                },
                take: 1,
            },
        },
    });

    if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const bot = client.bots[0];

    // Map to onboarding form structure
    return NextResponse.json({
        success: true,
        clientId: client.id,
        // Step 7 - Acesso
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.whatsapp || '',
        clientCpfCnpj: client.cpfCnpj || '',
        // Step 4 - Canais
        channels: bot?.channels?.map((ch: any) => ({
            provider: ch.provider,
            identifier: ch.identifier || '',
        })) || [],
        hours: bot?.hours || '',
        // Step 1 - Negócio
        businessName: client.name,
        niche: bot?.niche || 'generico',
        address: bot?.address || '',
        websiteUrl: bot?.websiteUrl || '',
        // Step 6 - IA do Bot
        botName: bot?.name || '',
        systemPrompt: bot?.systemPrompt || '',
        modules: bot?.modules || ['crm'],
    });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = session.user.id;
    const clientId = params.id;

    // Verify agency access
    const agency = await prisma.agency.findUnique({
        where: { tenantId },
        select: { id: true },
    });
    if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

    // Fetch client to verify it belongs to this agency
    const client = await prisma.tenant.findFirst({
        where: {
            id: clientId,
            agencyId: agency.id,
        },
        select: { id: true, bots: { select: { id: true }, take: 1 } },
    });

    if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const botId = client.bots[0]?.id;
    if (!botId) {
        return NextResponse.json({ error: 'No bot found for this client' }, { status: 404 });
    }

    const body = await req.json();
    const {
        botName,
        niche,
        websiteUrl,
        address,
        hours,
        channels = [],
        modules,
        systemPrompt,
    } = body;

    try {
        // Update bot configuration
        await prisma.bot.update({
            where: { id: botId },
            data: {
                name: botName || undefined,
                niche: niche || undefined,
                websiteUrl: websiteUrl || undefined,
                address: address || undefined,
                hours: hours || undefined,
                modules: modules || undefined,
                systemPrompt: systemPrompt || undefined,
            },
        });

        // Update/replace channels
        if (Array.isArray(channels)) {
            // Delete existing channels
            await prisma.botChannel.deleteMany({ where: { botId } });

            // Create new channels
            if (channels.length > 0) {
                await prisma.botChannel.createMany({
                    data: channels.map((ch: any) => ({
                        botId,
                        provider: ch.provider,
                        identifier: ch.identifier || undefined,
                        status: 'DISCONNECTED',
                    })),
                });
            }
        }

        return NextResponse.json({
            success: true,
            clientId,
            botId,
            message: 'Client onboarding updated successfully',
        });
    } catch (err: any) {
        console.error('Error updating client onboarding:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to update client onboarding' },
            { status: 500 }
        );
    }
}
