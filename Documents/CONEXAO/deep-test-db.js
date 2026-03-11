const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking GlobalConfig table columns...");
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'GlobalConfig'
        `;
        console.log("Columns in DB:", JSON.stringify(columns, null, 2));
        
        console.log("Trying a simple update...");
        const result = await prisma.globalConfig.upsert({
            where: { id: 'system' },
            create: { id: 'system', systemName: 'Test' },
            update: { systemName: 'Test' }
        });
        console.log("Update Success:", result);
    } catch (e) {
        console.error("FULL_ERROR_OBJECT:", JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
