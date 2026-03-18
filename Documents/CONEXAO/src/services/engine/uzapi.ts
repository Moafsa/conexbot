const UZAPI_URL = process.env.UZAPI_URL || 'http://127.0.0.1:21465';
const ADMIN_TOKEN =
    process.env.UZAPI_SECRET_KEY ||
    process.env.WUZAPI_ADMIN_TOKEN ||
    process.env.API_KEY ||
    'admin_token_123';

export const UzapiService = {
    // Helper: Ensure user exists in WuzAPI
    async ensureUser(sessionName: string, webhookUrl: string): Promise<boolean> {
        try {
            console.log(`[UZAPI] ensureUser: ${sessionName} (Webhook: ${webhookUrl})`);
            console.log(`[UZAPI] ADMIN_TOKEN used: ${ADMIN_TOKEN}`);

            // First, try to list users to see if it exists
            const listRes = await fetch(`${UZAPI_URL}/admin/users`, {
                headers: { 'Authorization': ADMIN_TOKEN }
            });

            if (listRes.ok) {
                const result = await listRes.json();
                const users = Array.isArray(result) ? result : (result.instances || []);
                const exists = users.find((u: any) => u.name === sessionName || u.token === sessionName);
                if (exists) {
                    console.log(`[UZAPI] User ${sessionName} already exists in list.`);
                    return true;
                }
            } else {
                const text = await listRes.text();
                console.warn(`[UZAPI] List Failed: ${listRes.status} - ${text}`);
            }

            // Create user
            console.log(`[UZAPI] Creating user: ${sessionName}`);
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

            if (createRes.ok) {
                console.log(`[UZAPI] User ${sessionName} created successfully.`);
                return true;
            }

            if (createRes.status === 409) {
                console.log(`[UZAPI] User ${sessionName} already exists (409).`);
                return true;
            }

            const errorText = await createRes.text();
            console.error(`[UZAPI] Create user FAILED: ${createRes.status} - ${errorText}`);
            return false;
        } catch (error: any) {
            console.error('[UZAPI] ensureUser exception:', error.message);
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
            const endpoint = (type === 'pdf') ? 'chat/send/document'
                : (type === 'audio') ? 'chat/send/audio'
                    : (type === 'video') ? 'chat/send/video'
                        : 'chat/send/image';

            const body: Record<string, string> = {
                Phone: to,
                [type === 'audio' ? 'Audio' : 'Url']: url,
            };

            if (caption) body.Caption = caption;
            if (type === 'pdf') body.FileName = caption || 'document.pdf';

            // TRANSFORM URL FOR DOCKER
            // If the URL is localhost/127.0.0.1 (host machine), WuzAPI (container) needs to access it via internal network name
            let finalUrl = url;
            if (url.startsWith('http')) {
                const internalHost = process.env.INTERNAL_WEBHOOK_URL
                    ? new URL(process.env.INTERNAL_WEBHOOK_URL).hostname
                    : 'host.docker.internal';

                if (url.includes('127.0.0.1') || url.includes('localhost')) {
                    finalUrl = url.replace('127.0.0.1', internalHost).replace('localhost', internalHost);
                    console.log(`[UZAPI] Transformed Media URL for Docker: ${url} -> ${finalUrl}`);
                }
            }

            if (type === 'audio') {
                body.Audio = finalUrl;
            } else {
                body.Url = finalUrl;
            }

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
                console.error(`[UZAPI] sendMedia request: endpoint=${endpoint}, urlLength=${url?.length || 0}, phone=${to}`);
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

            if (!res.ok) {
                // FALLBACK: Check admin/users if session/status fails (common when session is dormant or No Session)
                try {
                    const adminRes = await fetch(`${UZAPI_URL}/admin/users`, {
                        headers: { 'Authorization': ADMIN_TOKEN }
                    });
                    if (adminRes.ok) {
                        const data = await adminRes.json();
                        const instances = data.instances || [];
                        const inst = instances.find((i: any) => i.name === sessionName || i.token === sessionName);
                        if (inst && inst.connected) {
                            return 'CONNECTED';
                        }
                    }
                } catch (e: any) {
                    console.error('[UZAPI] Fallback status check failed:', e.message);
                }
                return 'DISCONNECTED';
            }

            const resText = await res.text();
            
            let data: any = {};
            try {
                const response = JSON.parse(resText);
                data = response.data || {};
            } catch (jsonErr) {
                return 'DISCONNECTED';
            }

            // More robust checking across different WuzAPI versions
            const isLoggedIn = !!(data.LoggedIn || data.loggedIn || data.authenticated || data.Authenticated || data.state === 'CONNECTED');
            const isConnecting = !!(data.Connected || data.connected || data.state === 'CONNECTING' || data.state === 'STARTING' || data.state === 'QRCODE' || data.QRCode);

            if (isLoggedIn) return 'CONNECTED';
            if (isConnecting) return 'QRCODE';
            
            return 'DISCONNECTED';
        } catch (e: any) {
            console.error('[UZAPI] getSessionStatus exception:', e.message);
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
                // If WuzAPI is unstable or says "already connected", we should verify the real state
                if (res.status === 500 || text.toLowerCase().includes('already')) {
                    const currentStatus = await this.getSessionStatus(sessionName);
                    if (currentStatus === 'CONNECTED' || currentStatus === 'QRCODE') {
                        return { success: true };
                    }
                }
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

            if (!res.ok) {
                // Return null so the calling code can retry or handle fallback
                return null;
            }

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

    /** Download image via WuzAPI /chat/downloadimage (when file_url not in webhook) */
    async downloadImage(sessionName: string, imageMessage: {
        URL?: string; Url?: string;
        mimetype?: string; Mimetype?: string;
        fileSHA256?: string; FileSHA256?: string;
        fileLength?: number; FileLength?: number;
        mediaKey?: string; MediaKey?: string;
        fileEncSHA256?: string; FileEncSHA256?: string;
        directPath?: string; DirectPath?: string;
    }): Promise<Buffer | null> {
        try {
            let url = (imageMessage.URL || imageMessage.Url || '').replace(/ /g, '+');
            const mimetype = imageMessage.mimetype || imageMessage.Mimetype || 'image/jpeg';
            const fileLength = imageMessage.fileLength ?? imageMessage.FileLength ?? 0;
            const directPath = imageMessage.directPath || imageMessage.DirectPath || '';

            if (!url) return null;

            const body: Record<string, unknown> = {
                Url: url,
                Mimetype: mimetype,
                FileLength: fileLength,
            };
            if (directPath) body.DirectPath = directPath;
            const sha = imageMessage.fileSHA256 || imageMessage.FileSHA256;
            const encSha = imageMessage.fileEncSHA256 || imageMessage.FileEncSHA256;
            const key = imageMessage.mediaKey || imageMessage.MediaKey;
            if (sha) body.FileSHA256 = sha;
            if (encSha) body.FileEncSHA256 = encSha;
            if (key) body.MediaKey = key;

            const res = await fetch(`${UZAPI_URL}/chat/downloadimage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[UZAPI] downloadImage failed:', res.status, errText.substring(0, 200));
                return null;
            }

            const data = await res.json();
            const raw = data?.data?.Data ?? data?.Data ?? data?.data?.Image ?? data?.Image ?? data?.data ?? data?.base64;
            if (typeof raw === 'string') {
                const b64 = raw.includes(',') ? raw.split(',')[1] : raw;
                const buf = Buffer.from(b64, 'base64');
                const hex = buf.slice(0, 8).toString('hex');
                console.log(`[UZAPI] downloadImage: ${buf.length} bytes, magic: ${hex}`);
                return buf;
            }
            if (data?.data && typeof data.data === 'object' && data.data.Data) {
                const b64 = String(data.data.Data).includes(',') ? String(data.data.Data).split(',')[1] : data.data.Data;
                const buf = Buffer.from(b64, 'base64');
                console.log(`[UZAPI] downloadImage (nested): ${buf.length} bytes`);
                return buf;
            }
            console.warn('[UZAPI] downloadImage: no Data in response. Keys:', Object.keys(data || {}).join(','));
            return null;
        } catch (e: unknown) {
            console.error('[UZAPI] downloadImage exception:', e);
            return null;
        }
    },

    /** Download audio via WuzAPI /chat/downloadaudio (when file_url not in webhook) */
    async downloadAudio(sessionName: string, audioMessage: {
        URL?: string; Url?: string;
        mimetype?: string; Mimetype?: string;
        fileSHA256?: string; FileSHA256?: string;
        fileLength?: number; FileLength?: number;
        mediaKey?: string; MediaKey?: string;
        fileEncSHA256?: string; FileEncSHA256?: string;
        directPath?: string; DirectPath?: string;
    }): Promise<Buffer | null> {
        try {
            // WuzAPI issue #66: + in URL can become space when decoded - restore for API
            let url = (audioMessage.URL || audioMessage.Url || '').replace(/ /g, '+');
            const mimetype = audioMessage.mimetype || audioMessage.Mimetype || 'audio/ogg; codecs=opus';
            const fileLength = audioMessage.fileLength ?? audioMessage.FileLength ?? 0;
            const directPath = audioMessage.directPath || audioMessage.DirectPath || '';

            if (!url) return null;

            const body: Record<string, unknown> = {
                Url: url,
                Mimetype: mimetype,
                FileLength: fileLength,
            };
            if (directPath) body.DirectPath = directPath;
            const sha = audioMessage.fileSHA256 || audioMessage.FileSHA256;
            const encSha = audioMessage.fileEncSHA256 || audioMessage.FileEncSHA256;
            const key = audioMessage.mediaKey || audioMessage.MediaKey;
            if (sha) body.FileSHA256 = sha;
            if (encSha) body.FileEncSHA256 = encSha;
            if (key) body.MediaKey = key;

            const res = await fetch(`${UZAPI_URL}/chat/downloadaudio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': sessionName,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error('[UZAPI] downloadAudio failed:', res.status, errText.substring(0, 200));
                return null;
            }

            const data = await res.json();
            // WuzAPI returns { Mimetype, Data: "data:audio/ogg;base64,..." } or wrapped in data
            const raw = data?.data?.Data ?? data?.Data ?? data?.data?.Audio ?? data?.Audio;
            if (typeof raw === 'string') {
                const b64 = raw.includes(',') ? raw.split(',')[1] : raw;
                return Buffer.from(b64, 'base64');
            }
            return null;
        } catch (e: unknown) {
            console.error('[UZAPI] downloadAudio exception:', e);
            return null;
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
                    webhookurl: webhookUrl,
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
