const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://admin:password123@postgres:5432/conext_db?schema=public"
});

async function main() {
    await client.connect();
    const res = await client.query('SELECT name FROM "ProductCatalog"');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

main().catch(console.error);
