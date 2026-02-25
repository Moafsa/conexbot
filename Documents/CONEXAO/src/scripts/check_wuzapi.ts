
import fetch from 'node-fetch';

const UZAPI_URL = process.env.UZAPI_URL || 'http://127.0.0.1:21465';
const ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || 'admin_token_123';

async function check() {
    console.log(`Checking WuzAPI at ${UZAPI_URL} with token ${ADMIN_TOKEN}...`);

    try {
        // 1. List Users
        console.log('1. Listing Users...');
        const listRes = await fetch(`${UZAPI_URL}/admin/users`, {
            headers: { 'Authorization': ADMIN_TOKEN }
        });

        console.log(`   Status: ${listRes.status} ${listRes.statusText}`);
        if (!listRes.ok) {
            console.error('   Error Body:', await listRes.text());
        } else {
            const data = await listRes.json();
            console.log('   Users:', JSON.stringify(data, null, 2));
        }

        // 2. Create Test User
        console.log('\n2. Creating Test User (test-user-diag)...');
        const createRes = await fetch(`${UZAPI_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': ADMIN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'test-user-diag',
                token: 'test-user-diag',
                webhook: 'http://host.docker.internal:3000/api/webhooks/whatsapp',
                expiration: 0,
                events: "Message,ReadReceipt,Disconnected,Connected"
            })
        });

        console.log(`   Create Status: ${createRes.status} ${createRes.statusText}`);
        if (!createRes.ok) {
            console.error('   Create Error Body:', await createRes.text());
        } else {
            console.log('   Create Success:', await createRes.json());
        }

        // 3. Start Session
        console.log('\n3. Starting Session (bot-757b9f7f)...');
        const connectRes = await fetch(`${UZAPI_URL}/session/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': 'bot-757b9f7f',
            },
            body: JSON.stringify({
                Subscribe: ["Message", "ReadReceipt", "Disconnected", "Connected"],
                Immediate: false
            })
        });

        console.log(`   Connect Status: ${connectRes.status} ${connectRes.statusText}`);
        if (!connectRes.ok) {
            console.error('   Connect Error Body:', await connectRes.text());
        } else {
            console.log('   Connect Success');
        }

        // 4. Get QR Code
        console.log('\n4. Getting QR Code...');
        const qrRes = await fetch(`${UZAPI_URL}/session/qr`, {
            headers: { 'Token': 'bot-757b9f7f' }
        });

        console.log(`   QR Status: ${qrRes.status} ${qrRes.statusText}`);
        if (!qrRes.ok) {
            console.error('   QR Error Body:', await qrRes.text());
        } else {
            const qrData = await qrRes.json();
            console.log('   QR Data:', JSON.stringify(qrData).substring(0, 100) + '...');
        }


        // Cleanup
        /*
        console.log('   Cleaning up...');
        await fetch(`${UZAPI_URL}/admin/users/test-user-diag`, {
            method: 'DELETE',
            headers: { 'Authorization': ADMIN_TOKEN }
        });
        */



    } catch (e: any) {
        console.error('CRITICAL: Connection failed:', e.message);
    }
}

check();
