const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const tenant = await prisma.tenant.findFirst({
            where: { geminiApiKey: { not: null } }
        });

        if (!tenant || !tenant.geminiApiKey) {
            console.log("No Gemini API key found in DB.");
            return;
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${tenant.geminiApiKey}`);
        const data = await res.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.filter(m => m.supportedGenerationMethods.includes("generateContent")).forEach(m => {
                console.log(m.name);
            });
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
