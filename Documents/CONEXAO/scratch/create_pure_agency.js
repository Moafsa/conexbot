const prisma = require('./src/lib/prisma').default;
const bcrypt = require('bcryptjs');

async function createAgency() {
    const password = await bcrypt.hash('password123', 10);
    const tenant = await prisma.tenant.upsert({
        where: { email: 'agency_test@test.com' },
        update: { role: 'AGENCY' },
        create: {
            email: 'agency_test@test.com',
            password,
            role: 'AGENCY',
            name: 'Agência de Teste'
        }
    });

    await prisma.agency.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            currentFee: 20.0
        }
    });

    console.log('Agency test user created: agency_test@test.com / password123');
}

createAgency().catch(console.error);
