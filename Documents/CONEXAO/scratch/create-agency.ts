import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'agencia@teste.com';
    const password = 'senha';
    const hashedPassword = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.upsert({
        where: { email },
        update: { password: hashedPassword, role: 'AGENCY' },
        create: {
            name: 'Agencia Teste',
            email,
            password: hashedPassword,
            role: 'AGENCY',
            agency: {
                create: {
                    status: 'APPROVED',
                    currentFee: 20.0
                }
            }
        }
    });

    console.log("Agência criada com sucesso!");
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    console.log(`Tenant ID: ${tenant.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
