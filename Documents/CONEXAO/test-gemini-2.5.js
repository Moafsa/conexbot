require('dotenv').config();
const { Client } = require('pg');

async function test() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const res = await client.query('SELECT "geminiApiKey" FROM "Tenant" WHERE "geminiApiKey" IS NOT NULL LIMIT 1');
        const key = res.rows[0].geminiApiKey;

        const model = 'gemini-2.5-flash';
        const reqBody = {
            contents: [
                { role: 'user', parts: [{ text: 'Oi, teste curtissimo' }] }
            ]
        };

        const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
        });

        if (!fetchRes.ok) {
            console.error(`ERROR ${fetchRes.status}:`, await fetchRes.text());
        } else {
            console.log("SUCCESS!");
        }
    } finally {
        await client.end();
    }
}
test();
