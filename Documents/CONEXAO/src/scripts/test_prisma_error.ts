
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { pg } from 'pg'; // Assuming pg is installed

async function test() {
    console.log("Testing Prisma connection...");
    const connectionString = "postgresql://admin:password123@localhost:5434/conext_db?schema=public";
    
    try {
        const pool = new pg.Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        console.log("Querying GlobalConfig...");
        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        console.log("Config:", config ? "Success" : "Not found");

        console.log("Querying Tenant...");
        const tenant = await prisma.tenant.findUnique({
            where: { email: 'test@example.com' }, // Try a dummy email
            include: { subscription: true, usageCounter: true }
        });
        console.log("Tenant query success (either found or null)");
        
        await prisma.$disconnect();
    } catch (err) {
        console.error("Prisma Error:", err);
    }
}

test();
