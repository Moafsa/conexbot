import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Por favor, informe o e-mail do usuário: npm run promote-admin <email>');
        process.exit(1);
    }

    try {
        const user = await prisma.tenant.update({
            where: { email },
            data: { role: 'SUPERADMIN' },
        });

        console.log(`✅ Usuário ${user.email} promovido a SUPERADMIN com sucesso!`);
    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
