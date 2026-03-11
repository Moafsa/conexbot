import 'dotenv/config';

const UZAPI_URL = process.env.UZAPI_URL || 'http://127.0.0.1:21465';
const ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || 'admin_token_123';

async function testWuzapi() {
    console.log(`Testing WuzAPI at ${UZAPI_URL} with token ${ADMIN_TOKEN}`);

    try {
        // 1. List Users
        console.log('1. JSON Listing Users...');
        const listRes = await fetch(`${UZAPI_URL}/admin/users`, {
            headers: { 'Authorization': ADMIN_TOKEN }
        });

        console.log(`Details: ${listRes.status} ${listRes.statusText}`);
        const text = await listRes.text();
        console.log('Body:', text);

    } catch (e) {
        console.error('Fatal Error:', e);
    }
}

testWuzapi();
