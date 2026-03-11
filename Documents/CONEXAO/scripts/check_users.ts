import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.tenant.findMany();
    fs.writeFileSync('users_list.txt', JSON.stringify(users, null, 2));
    console.log('Users written to users_list.txt');
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
