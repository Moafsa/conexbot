const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const keys = await prisma.licenseKey.findMany({
            include: {
                subscription: {
                    include: {
                        tenant: true
                    }
                }
            }
        });
        console.log(JSON.stringify(keys, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
