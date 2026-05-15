const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.tenant.findMany();
    console.log('Users found via Prisma:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
