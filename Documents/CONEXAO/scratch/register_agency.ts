import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'agency@test.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Tenant
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

    // Create Agency record
    const agency = await prisma.agency.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            currentFee: 20.0,
        }
    });

    console.log('Agency registered:', { tenantId: tenant.id, agencyId: agency.id });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
