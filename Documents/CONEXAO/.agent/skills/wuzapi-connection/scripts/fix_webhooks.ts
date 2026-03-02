
// CONFIGURATION
const UZAPI_URL = 'http://127.0.0.1:21465';
const ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || 'admin_token_123';
const NEXT_APP_URL = 'http://host.docker.internal:3004'; // URL reachable from INSIDE Docker

async function fixWuzapi() {
    console.log('🔧 Starting WuzAPI Auto-Fixer...');

    // 1. Check Connectivity
    try {
        const res = await fetch(`${UZAPI_URL}/admin/users`, {
            headers: { 'Authorization': ADMIN_TOKEN }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        console.log('✅ WuzAPI is running and accessible.');
    } catch (e: any) {
        console.error('❌ WuzAPI is NOT reachable from this script (Host).');
        console.error(`   Error: ${e.message}`);
        console.error('   Running "docker-compose up -d" mapped to WuzAPI might be needed.');
        return;
    }

    // 2. Fetch all sessions (users)
    let sessions = [];
    try {
        const res = await fetch(`${UZAPI_URL}/admin/users`, {
            headers: { 'Authorization': ADMIN_TOKEN }
        });
        const data = await res.json();
        sessions = data.instances || [];
        console.log(`ℹ️ Found ${sessions.length} active sessions.`);
    } catch (e) {
        console.error('❌ Failed to list sessions.');
        return;
    }

    // 3. Update Webhooks for ALL sessions
    const webhookUrl = `${NEXT_APP_URL}/api/webhooks/whatsapp`;
    console.log(`🚀 Updating webhooks to: ${webhookUrl}`);

    for (const session of sessions) {
        const token = session.token || session.name;
        if (!token) continue;

        try {
            // Force update webhook
            const res = await fetch(`${UZAPI_URL}/webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token,
                },
                body: JSON.stringify({
                    webhook: webhookUrl,
                    events: ["Message", "ReadReceipt", "Disconnected", "Connected"]
                }),
            });

            if (res.ok) {
                console.log(`   ✅ Fixed webhook for session: ${token}`);
            } else {
                console.error(`   ❌ Failed to update session ${token}: ${res.status}`);
            }
        } catch (e) {
            console.error(`   ❌ Connection error updating ${token}`);
        }
    }

    console.log('✨ Fix complete. Try sending a message to your bot now.');
}

fixWuzapi();
