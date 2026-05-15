import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password, whatsapp, cpfCnpj, planId, trial, type, isAgency } = parsed.data;

        if (!planId && !isAgency) {
            return NextResponse.json(
                { error: 'Um plano deve ser selecionado para criar a conta.' },
                { status: 400 }
            );
        }

        const existing = await prisma.tenant.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Este email já está cadastrado' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Fetch plan details if selected
        let plan = null;
        if (planId) {
            try {
                // Try finding by UUID
                plan = await prisma.plan.findUnique({
                    where: { id: planId }
                });
            } catch (e) {
                // Ignore parse errors from invalid UUID formats
            }

            if (!plan) {
                // Fallback to name
                plan = await prisma.plan.findFirst({
                    where: { name: { equals: planId, mode: 'insensitive' } }
                });
            }
        }

        // New hard fallback for Writer Plugin registration
        if (!plan && type === 'WRITER_PLUGIN') {
            plan = await prisma.plan.findFirst({
                where: { type: 'WRITER_PLUGIN', active: true }
            });
            console.log('FALLBACK TO FIRST WRITER PLAN:', plan?.id);
        }

        const tenant = await prisma.tenant.create({
            data: {
                name,
                email,
                password: hashedPassword,
                whatsapp: whatsapp || null,
                cpfCnpj: cpfCnpj || null,
                role: isAgency ? 'AGENCY' : 'USER',
                agency: isAgency ? {
                    create: {
                        status: 'PENDING',
                        currentFee: 20.0
                    }
                } : undefined,
                subscriptions: plan ? {
                    create: {
                        planId: plan.id,
                        status: trial === 'true' ? 'TRIALING' : 'PENDING',
                        gateway: trial === 'true' ? 'SYSTEM' : 'ASAAS',
                        type: type as any,
                        licenseKeys: type === 'WRITER_PLUGIN' ? {
                            create: {
                                key: `CNX-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                            }
                        } : undefined
                    }
                } : undefined,
                usageCounter: {
                    create: {
                        messagesLimit: isAgency ? 50000 : (plan?.messageLimit || 5000),
                        botsLimit: isAgency ? 20 : (plan?.botLimit || 1),
                        periodEnd: new Date(Date.now() + (trial === 'true' && plan ? plan.trialDays : 30) * 24 * 60 * 60 * 1000)
                    }
                }
            },
        });

        return NextResponse.json({
            id: tenant.id,
            email: tenant.email,
            name: tenant.name,
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Erro ao criar conta' },
            { status: 500 }
        );
    }
}
