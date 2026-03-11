import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
    const tenants = await prisma.tenant.findMany();

    if (tenants.length > 0) {
        console.log("Found users:");
        for (const t of tenants) {
            console.log(`- Email: ${t.email}, Name: ${t.name}`);
        }

        // Reset password for the first user
        const firstUser = tenants[0];
        const hashedPassword = await bcrypt.hash('123456', 10);

        await prisma.tenant.update({
            where: { id: firstUser.id },
            data: { password: hashedPassword }
        });

        console.log(`\n✔ Senha redefinida localmente para testes:`);
        console.log(`Email: ${firstUser.email}`);
        console.log(`Senha: 123456`);
    } else {
        console.log("Nenhum usuário encontrado. Criando admin padrão...");
        const hashedPassword = await bcrypt.hash('123456', 10);
        const newUser = await prisma.tenant.create({
            data: {
                name: 'Admin Local',
                email: 'admin@conexao.com',
                password: hashedPassword
            }
        });
        console.log(`✔ Usuário criado com sucesso:`);
        console.log(`Email: ${newUser.email}`);
        console.log(`Senha: 123456`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
