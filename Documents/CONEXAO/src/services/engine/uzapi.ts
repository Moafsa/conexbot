const UZAPI_URL = process.env.UZAPI_URL || 'http://127.0.0.1:21465';
const ADMIN_TOKEN = process.env.WUZAPI_ADMIN_TOKEN || 'admin_token_123';

export const UzapiService = {
    // Helper: Ensure user exists in WuzAPI
    async ensureUser(sessionName: string, webhookUrl: string): Promise<boolean> {
        try {
            console.log(`[UZAPI] Checking user ${sessionName} at ${UZAPI_URL}`);

            // First, try to list users to see if it exists
            const listRes = await fetch(`${UZAPI_URL}/admin/users`, {
                headers: { 'Authorization': ADMIN_TOKEN }
            });

            if (listRes.ok) {
                const result = await listRes.json();
                console.log('[UZAPI] List Result:', JSON.stringify(result)); // DEBUG
                // WuzAPI returns [...] or { "instances": [...] }
                const users = Array.isArray(result) ? result : (result.instances || []);
                const exists = users.find((u: any) => u.name === sessionName || u.token === sessionName);
                if (exists) {
                    console.log(`[UZAPI] User ${sessionName} already exists.`);
                    return true;
                }
            } else {
                console.warn(`[UZAPI] Failed to list users: ${listRes.status} ${listRes.statusText}`);
                const text = await listRes.text();
                console.warn(`[UZAPI] List error body: ${text}`);
            }

            // Create user
            console.log(`[UZAPI] Creating user for session: ${sessionName}`);
            const createRes = await fetch(`${UZAPI_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': ADMIN_TOKEN,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: sessionName,
                    token: sessionName,
                    webhook: webhookUrl,
                    expiration: 0,
                    events: "Message,ReadReceipt,Disconnected,Connected"
                })
            });

            if (!createRes.ok) {
                if (createRes.status === 409) {
                    console.log(`[UZAPI] User ${sessionName} already exists (409 Conflict). Proceeding.`);
                    return true;
                }
                const errorText = await createRes.text();
                console.error('[UZAPI] Create user failed:', errorText);
                return false;
            }
            return true;
        } catch (error) {
            console.error('[UZAPI] ensureUser error:', error);
            // If fetch fails completely (e.g. connection refused), it often means UZAPI is not running or URL is wrong
            return false;
        }
    },

    async sendMessage(sessionName: string, to: string, text: string): Promise<boolean> {
        try {
            const res = await fetch(`${UZAPI_URL}/chat/send/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify({
                    Phone: to,
                    Body: text,
                }),
            });

            if (!res.ok) {
                console.error('UZAPI send error:', await res.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error('UZAPI connection error:', error);
            return false;
        }
    },

    async sendMedia(
        sessionName: string,
        to: string,
        type: string,
        url: string,
        caption?: string
    ): Promise<boolean> {
        try {
            const endpoint = (type === 'pdf') ? '/chat/send/document'
                : (type === 'audio') ? '/chat/send/voice'
                    : (type === 'video') ? '/chat/send/video'
                        : '/chat/send/image';

            const body: Record<string, string> = {
                Phone: to,
                Url: url,
            };

            if (caption) body.Caption = caption;
            if (type === 'pdf') body.FileName = caption || 'document.pdf';

            // TRANSFORM URL FOR DOCKER (If using local MinIO)
            // If the URL is localhost/127.0.0.1 (host machine), WuzAPI (container) needs to access it via internal network name 'minio' 
            // OR 'host.docker.internal' depending on setup. Since they are in same stack, 'minio' is best.
            let finalUrl = url;
            if (url.includes('127.0.0.1:9000') || url.includes('localhost:9000')) {
                finalUrl = url.replace('127.0.0.1:9000', 'minio:9000').replace('localhost:9000', 'minio:9000');
                console.log(`[UZAPI] Transformed URL for Docker: ${url} -> ${finalUrl}`);
            }
            body.Url = finalUrl;

            const res = await fetch(`${UZAPI_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[UZAPI] sendMedia error: ${res.status} ${res.statusText} - ${errorText}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error('[UZAPI] sendMedia exception:', error);
            return false;
        }
    },

    async getSessionStatus(sessionName: string): Promise<'CONNECTED' | 'DISCONNECTED' | 'QRCODE'> {
        try {
            const res = await fetch(`${UZAPI_URL}/session/status`, {
                headers: {
                    'Token': sessionName,
                },
            });

            if (!res.ok) return 'DISCONNECTED';

            const response = await res.json();
            // Data is wrapped in envelope { "code": 200, "data": { ... } }
            const data = response.data || {};

            if (data.LoggedIn) return 'CONNECTED';
            if (data.Connected && !data.LoggedIn) return 'QRCODE';

            return 'DISCONNECTED';
        } catch (e) {
            console.error('[UZAPI] getSessionStatus error:', e);
            return 'DISCONNECTED';
        }
    },

    async startSession(sessionName: string, webhookUrl: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Ensure user exists first
            const userOk = await this.ensureUser(sessionName, webhookUrl);
            if (!userOk) {
                return { success: false, error: 'Failed to create/verify user in WuzAPI' };
            }

            // Call Connect
            const res = await fetch(`${UZAPI_URL}/session/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify({
                    Subscribe: ["Message", "ReadReceipt", "Disconnected", "Connected"],
                    Immediate: false
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                return { success: false, error: `UZAPI Error: ${res.status} - ${text}` };
            }

            return { success: true };
        } catch (e: any) {
            console.error('UZAPI startSession exception:', e);
            return { success: false, error: e.message || 'Unknown UZAPI error' };
        }
    },

    // New method for QR Code
    async getQrCode(sessionName: string): Promise<string | null> {
        try {
            const res = await fetch(`${UZAPI_URL}/session/qr`, {
                headers: {
                    'Token': sessionName,
                },
            });

            if (!res.ok) return null;

            const response = await res.json();
            // Data is wrapped in envelope { "code": 200, "data": { "QRCode": "..." } }
            const data = response.data || {};
            return data.QRCode || null;
        } catch (e) {
            console.error('UZAPI getQrCode error:', e);
            return null;
        }
    },

    async logout(sessionName: string): Promise<boolean> {
        try {
            const res = await fetch(`${UZAPI_URL}/session/logout`, {
                method: 'POST',
                headers: {
                    'Token': sessionName,
                },
            });
            return res.ok;
        } catch {
            return false;
        }
    },

    async setWebhook(sessionName: string, webhookUrl: string): Promise<boolean> {
        try {
            const res = await fetch(`${UZAPI_URL}/webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify({
                    webhook: webhookUrl,
                    events: ["Message", "ReadReceipt", "Disconnected", "Connected"]
                }),
            });
            return res.ok;
        } catch (e) {
            console.error('[UZAPI] setWebhook error:', e);
            return false;
        }
    }
};
