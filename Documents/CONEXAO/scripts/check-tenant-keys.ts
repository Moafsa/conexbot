const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenantKeys() {
    try {
        const globalConfig = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        
        console.log('=== GLOBAL CONFIG KEYS ===');
        console.log(`OpenAI: ${!!globalConfig?.openaiApiKey}`);
        console.log(`Gemini: ${!!globalConfig?.geminiApiKey}`);
        console.log(`OpenRouter: ${!!globalConfig?.openrouterApiKey}`);
        console.log('==========================\n');

        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                openaiApiKey: true,
                geminiApiKey: true,
                openrouterApiKey: true
            }
        });

        console.log(`Encontrados ${tenants.length} tenants.\n`);

        for (const t of tenants) {
            const eOpenAI = t.openaiApiKey || globalConfig?.openaiApiKey;
            const eGemini = t.geminiApiKey || globalConfig?.geminiApiKey;
            const eOpenRouter = t.openrouterApiKey || globalConfig?.openrouterApiKey;

            console.log(`[Tenant] ${t.name} (${t.email})`);
            console.log(`  - Local Keys   | OpenAI: ${!!t.openaiApiKey} | Gemini: ${!!t.geminiApiKey} | OpenRouter: ${!!t.openrouterApiKey}`);
            console.log(`  - Effective    | OpenAI: ${!!eOpenAI} | Gemini: ${!!eGemini} | OpenRouter: ${!!eOpenRouter}`);
            console.log(`  - Ready for AI Architect? ${!!(eOpenAI || eGemini || eOpenRouter)}\n`);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkTenantKeys();
