const fetch = require('node-fetch');

async function test() {
    try {
        console.log("Simulating Admin Config PUT...");
        // Need to simulate a session or skip it if possible for testing
        // But the API has role check.
        // Let's try to just run the logic of the API in a script instead.
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const updateData = {
           logoColoredUrl: 'test-from-script-debug'
        };
        
        console.log("Upserting with data:", updateData);
        const config = await prisma.globalConfig.upsert({
            where: { id: 'system' },
            create: {
                id: 'system',
                ...updateData
            },
            update: updateData
        });
        console.log("Prisma Success:", !!config);
    } catch (e) {
        console.error("PRISMA_ERROR_DETAILS:");
        console.error(e);
        if (e.code) console.log("Code:", e.code);
        if (e.meta) console.log("Meta:", e.meta);
    }
}

test();
