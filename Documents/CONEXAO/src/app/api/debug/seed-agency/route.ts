import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const email = 'agency@test.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const tenant = await prisma.tenant.upsert({
            where: { email },
            update: {
                role: 'AGENCY',
                password: hashedPassword,
            },
            create: {
                email,
                name: 'Test Agency',
                password: hashedPassword,
                role: 'AGENCY',
                usageCounter: {
                    create: {
                        messagesLimit: 10000,
                        botsLimit: 10,
                        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }
        });

        const agency = await prisma.agency.upsert({
            where: { tenantId: tenant.id },
            update: {},
            create: {
                tenantId: tenant.id,
                currentFee: 20.0,
            }
        });

        return NextResponse.json({ success: true, agency });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
