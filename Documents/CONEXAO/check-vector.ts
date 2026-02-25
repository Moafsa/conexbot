import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function checkVector() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('🔌 Connected to Database.');

        // 1. Check if extension exists
        const res = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
        if (res.rows.length > 0) {
            console.log('✅ pgvector extension is ALREADY ENABLED.');
        } else {
            console.log('⚠️ pgvector NOT found. Attempting to enable...');
            try {
                await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
                console.log('🎉 pgvector extension ENABLED SAFELY!');
            } catch (err) {
                console.error('❌ Failed to enable pgvector via SQL:', err.message);
                console.log('\n💡 DATA: If you are using Supabase/Neon, enable it in the Dashboard.');
                console.log('💡 DOCKER: Ensure your image is `pgvector/pgvector:pg16` or similar.');
            }
        }

    } catch (err) {
        console.error('Connection Error:', err);
    } finally {
        await client.end();
    }
}

checkVector();
