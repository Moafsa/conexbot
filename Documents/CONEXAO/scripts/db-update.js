
const { Client } = require('pg');
const connectionString = "postgresql://admin:password123@localhost:5434/conext_db?schema=public";

async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    const botId = '9ba31a1e-4c84-400d-a59e-55578d05fcd8';

    console.log('--- ATTEMPTING MANUAL UPDATE ---');
    const res = await client.query(
        'UPDATE "Bot" SET "chatwootUrl" = $1, "chatwootToken" = $2, "chatwootAccountId" = $3 WHERE id = $4 RETURNING id, name, "chatwootUrl"',
        ['https://chatwoot.falecomogoogle.com.br', 'abc-123-token', '1', botId]
    );

    console.log('Update result:', JSON.stringify(res.rows[0], null, 2));

    const check = await client.query('SELECT "chatwootUrl" FROM "Bot" WHERE id = $1', [botId]);
    console.log('Verify in DB:', check.rows[0]);

    await client.end();
}

run().catch(console.error);
