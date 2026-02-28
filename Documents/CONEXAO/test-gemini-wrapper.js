require('dotenv').config();
const { Client } = require('pg');

async function test() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query('SELECT "geminiApiKey" FROM "Tenant" WHERE "geminiApiKey" IS NOT NULL LIMIT 1');
        const key = res.rows[0].geminiApiKey;
        console.log("Using Database API Key...");

        const model = 'gemini-2.0-flash'; // As mapped by the processor
        const reqBody = {
            contents: [
                { role: 'user', parts: [{ text: 'Oi, teste!' }] }
            ]
        };

        console.log(`Sending API request for model ${model}...`);
        const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
        });

        if (!fetchRes.ok) {
            console.error(`ERROR ${fetchRes.status}:`, await fetchRes.text());
        } else {
            const data = await fetchRes.json();
            console.log("SUCCESS! Reply:");
            console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
    } finally {
        await client.end();
    }
}
test();
