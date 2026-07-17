import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'SUPERADMIN' },
        select: { id: true, name: true, email: true, role: true }
    });
    console.log("Superadmins encontrados:");
    console.log(JSON.stringify(admins, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
