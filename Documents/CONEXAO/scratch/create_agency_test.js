const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAgency() {
    const prisma = new PrismaClient();
    const password = await bcrypt.hash('password123', 10);
    
    const tenant = await prisma.tenant.upsert({
        where: { email: 'vendas@agenciaexemplo.com' },
        update: { 
            role: 'AGENCY',
            name: 'Agência Exemplo'
        },
        create: {
            email: 'vendas@agenciaexemplo.com',
            password,
            role: 'AGENCY',
            name: 'Agência Exemplo'
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

    console.log('--- USUÁRIO DE TESTE CRIADO ---');
    console.log('Login: vendas@agenciaexemplo.com');
    console.log('Senha: password123');
    console.log('-------------------------------');
    
    await prisma.$disconnect();
}

createAgency().catch(console.error);
