
const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://admin:password123@localhost:5434/conext_db?schema=public"
});

async function main() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, name, "sessionName", "businessType" FROM "Bot"');
    console.log('---DATA_START---');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('---DATA_END---');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
