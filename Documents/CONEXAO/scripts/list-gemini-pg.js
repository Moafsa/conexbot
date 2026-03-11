require('dotenv').config();
const { Client } = require('pg');

async function test() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query('SELECT "geminiApiKey" FROM "Tenant" WHERE "geminiApiKey" IS NOT NULL LIMIT 1');
        const key = res.rows[0].geminiApiKey;
        console.log("Key length:", key.length);

        const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await fetchRes.json();

        if (data.models) {
            console.log("AVAILABLE GENERATECONTENT MODELS:");
            const genModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            genModels.forEach(m => console.log(m.name.replace('models/', '')));
        } else {
            console.log(data);
        }
    } finally {
        await client.end();
    }
}
test();
