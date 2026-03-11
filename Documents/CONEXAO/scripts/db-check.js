
const { Client } = require('pg');
const connectionString = "postgresql://admin:password123@localhost:5434/conext_db?schema=public";

async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    const res = await client.query('SELECT id, name, "sessionName", "chatwootUrl", "webhookUrl", "chatwootAccountId" FROM "Bot" WHERE id = $1', ['9ba31a1e-4c84-400d-a59e-55578d05fcd8']);
    console.log('--- DATABASE RESULT ---');
    console.log(JSON.stringify(res.rows[0], null, 2));
    console.log('---');
    await client.end();
}

run().catch(console.error);
