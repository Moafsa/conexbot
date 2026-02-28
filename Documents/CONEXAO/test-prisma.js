const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
    try {
        console.log("Testing Prisma query to Tenant table...");
        const tenants = await prisma.tenant.findMany({
            take: 1,
            select: {
                id: true,
                email: true,
                openaiApiKey: true,
                geminiApiKey: true,
                openrouterApiKey: true,
            }
        });
        console.log("Success! Found tenants:", tenants.length);
        if (tenants.length > 0) {
            console.log("Tenant sample:", tenants[0]);
        }
    } catch (error) {
        console.error("Prisma Error:", error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

test();
