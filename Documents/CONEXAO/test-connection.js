require('dotenv').config();
const pg = require('pg');

async function test() {
    const connectionString = process.env.DATABASE_URL;
    console.log("Connecting to:", connectionString);
    const pool = new pg.Pool({ connectionString });
    
    try {
        const res = await pool.query('SELECT NOW() as db_time');
        console.log("DB Connection Success! Server time:", res.rows[0].db_time);
    } catch (e) {
        console.error("DB Connection Failed:", e.message);
    } finally {
        await pool.end();
    }
}

test();
