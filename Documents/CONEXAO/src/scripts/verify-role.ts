import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const user = await prisma.tenant.findUnique({
            where: { email: 'mferreira@conext.click' }
        });

        console.log('--- DB USER ROLE ---');
        console.log('User:', user?.email);
        console.log('Role:', user?.role);
        console.log('--- ---');

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
