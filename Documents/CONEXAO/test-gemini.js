const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');

const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Fetching tenant with Gemini API key...");
        const tenant = await prisma.tenant.findFirst({
            where: {
                geminiApiKey: { not: null }
            }
        });

        if (!tenant || !tenant.geminiApiKey) {
            console.log("No Gemini API key found in DB.");
            return;
        }

        console.log("Found key. Length:", tenant.geminiApiKey.length);

        const client = new OpenAI({
            apiKey: tenant.geminiApiKey,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
        });

        console.log("Calling OpenAI compat endpoint with gemini-1.5-flash...");
        const response = await client.chat.completions.create({
            model: "gemini-1.5-flash",
            messages: [{ role: "user", content: "hello" }],
        });

        console.log("SUCCESS!");
        console.log(response.choices[0].message.content);

    } catch (e) {
        console.error("ERROR:");
        console.error(e.message);
        if (e.response) {
            console.error(e.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

test();
