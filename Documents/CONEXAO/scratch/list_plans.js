const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://admin:password123@postgres:5432/conext_db?schema=public"
});

async function main() {
    await client.connect();
    const res = await client.query(`
        SELECT p.name as product_name, pl.name as plan_name, pl.price 
        FROM "ProductCatalog" p 
        LEFT JOIN "Plan" pl ON pl."productCatalogId" = p.id
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

main().catch(console.error);
