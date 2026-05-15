import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5434/conext_db?schema=public";
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const tiers = await prisma.agencyTier.findMany({
        orderBy: { minSalesVolume: 'asc' }
    });
    console.log('TIERS CADASTRADOS:', JSON.stringify(tiers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
