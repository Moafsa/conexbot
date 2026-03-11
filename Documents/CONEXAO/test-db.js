const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking GlobalConfig table...");
        const res = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        console.log("Current config:", res);
        
        console.log("Attempting to update logoColoredUrl...");
        const update = await prisma.globalConfig.upsert({
            where: { id: 'system' },
            create: { id: 'system', logoColoredUrl: 'test-from-script' },
            update: { logoColoredUrl: 'test-from-script' }
        });
        console.log("Success:", update);
    } catch (error) {
        console.error("DATABASE_ERROR_DETECTED:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
