
import fs from 'fs';
import path from 'path';

import { logToFile as centralLog } from './logger';

const logToFile = (msg: string) => centralLog(msg, 'Chatwoot');

export const ChatwootService = {
    async getContactByPhone(bot: any, phone: string) {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) {
            logToFile(`Missing credentials for Chatwoot search. URL: ${bot.chatwootUrl ? 'YES' : 'NO'}, Token: ${bot.chatwootToken ? 'YES' : 'NO'}, ID: ${bot.chatwootAccountId ? 'YES' : 'NO'}`);
            return null;
        }

        try {
            // Clean phone: remove +, -, spaces and non-digits
            const cleanPhone = phone.replace(/\D/g, '');
            const encodedPhone = encodeURIComponent(cleanPhone);
            const baseUrl = bot.chatwootUrl.replace(/\/$/, '');
            const url = `${baseUrl}/api/v1/accounts/${bot.chatwootAccountId}/contacts/search?q=${encodedPhone}`;

            logToFile(`Searching contact: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'api_access_token': bot.chatwootToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No body');
                logToFile(`Search failed: ${response.status} ${response.statusText} - Body: ${errorText.substring(0, 100)}`);
                return null;
            }

            const data = await response.json();
            // Chatwoot returns { payload: [...] }
            const contacts = data.payload || [];

            if (contacts.length > 0) {
                logToFile(`Found ${contacts.length} contacts for ${cleanPhone}. Returning first match.`);
                return contacts[0];
            }

            logToFile(`No contact found in Chatwoot for ${cleanPhone}`);
            return null;
        } catch (error: any) {
            logToFile(`Error: ${error.message}`);
            return null;
        }
    },

    async updateContact(bot: any, contactId: string, data: any) {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) {
            return null;
        }
        try {
            const url = `${bot.chatwootUrl.replace(/\/$/, '')}/api/v1/accounts/${bot.chatwootAccountId}/contacts/${contactId}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'api_access_token': bot.chatwootToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error: any) {
            logToFile(`Update Error: ${error.message}`);
            return null;
        }
    },

    /** Find or create a Chatwoot contact by phone number. Returns the contact object or null. */
    async upsertContact(bot: any, phone: string, name?: string, email?: string): Promise<any | null> {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) return null;
        try {
            const base = bot.chatwootUrl.replace(/\/$/, '');
            const headers = { 'api_access_token': bot.chatwootToken, 'Content-Type': 'application/json' };

            // 1. Try to find existing contact
            const existing = await this.getContactByPhone(bot, phone);
            if (existing) {
                // Update name/email if we have new data
                if (name && name !== existing.name) {
                    await this.updateContact(bot, existing.id, { name, email: email || existing.email });
                }
                return existing;
            }

            // 2. Create new contact
            const res = await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/contacts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: name || phone,
                    phone_number: `+${phone.replace(/\D/g, '')}`,
                    email: email || undefined,
                }),
            });
            if (!res.ok) {
                logToFile(`upsertContact create failed: ${res.status} ${await res.text().catch(() => '')}`);
                return null;
            }
            const data = await res.json();
            return data.payload || data;
        } catch (e: any) {
            logToFile(`upsertContact error: ${e.message}`);
            return null;
        }
    },

    /** Find or create a Chatwoot conversation for a contact in the bot's inbox.
     *  Returns the conversation object (with at least id, status). */
    async upsertConversation(bot: any, contactId: number): Promise<any | null> {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId || !bot.chatwootInboxId) return null;
        try {
            const base = bot.chatwootUrl.replace(/\/$/, '');
            const headers = { 'api_access_token': bot.chatwootToken, 'Content-Type': 'application/json' };

            // 1. Look for open conversations for this contact in this inbox
            const searchRes = await fetch(
                `${base}/api/v1/accounts/${bot.chatwootAccountId}/contacts/${contactId}/conversations`,
                { method: 'GET', headers }
            );
            if (searchRes.ok) {
                const payload = await searchRes.json();
                const convs: any[] = payload.payload || payload || [];
                const openConv = convs.find((c: any) =>
                    (c.status === 'open' || c.status === 'pending') &&
                    c.inbox_id == bot.chatwootInboxId
                );
                if (openConv) return openConv;
            }

            // 2. Create new conversation
            const createRes = await fetch(`${base}/api/v1/accounts/${bot.chatwootAccountId}/conversations`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    contact_id: contactId,
                    inbox_id: parseInt(bot.chatwootInboxId),
                    status: 'open',
                }),
            });
            if (!createRes.ok) {
                logToFile(`upsertConversation create failed: ${createRes.status}`);
                return null;
            }
            const data = await createRes.json();
            return data.payload || data;
        } catch (e: any) {
            logToFile(`upsertConversation error: ${e.message}`);
            return null;
        }
    },

    /** Send a message to a Chatwoot conversation.
     *  role: 'incoming' (customer/lead) | 'outgoing' (bot/agent reply) */
    async sendMessage(bot: any, conversationId: number, content: string, role: 'incoming' | 'outgoing' = 'outgoing'): Promise<any | null> {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) return null;
        if (!content?.trim()) return null;
        try {
            const base = bot.chatwootUrl.replace(/\/$/, '');
            const res = await fetch(
                `${base}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${conversationId}/messages`,
                {
                    method: 'POST',
                    headers: { 'api_access_token': bot.chatwootToken, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: content.substring(0, 10000), // Chatwoot limit
                        message_type: role === 'incoming' ? 'incoming' : 'outgoing',
                        private: false,
                    }),
                }
            );
            if (!res.ok) {
                logToFile(`sendMessage failed: ${res.status}`);
                return null;
            }
            return await res.json();
        } catch (e: any) {
            logToFile(`sendMessage error: ${e.message}`);
            return null;
        }
    },

    /** Fully sync a WhatsApp message exchange to Chatwoot.
     *  Creates contact + conversation if needed, posts both customer and bot messages.
     *  Returns the conversation ID (for storing on the Conversation record). */
    async syncToConversation(
        bot: any,
        phone: string,
        customerName: string | undefined,
        customerMessage: string,
        botReply: string,
    ): Promise<number | null> {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId || !bot.chatwootInboxId) return null;
        try {
            const contact = await this.upsertContact(bot, phone, customerName);
            if (!contact) return null;

            const conversation = await this.upsertConversation(bot, contact.id);
            if (!conversation) return null;

            const convId = conversation.id;

            // Push customer message
            await this.sendMessage(bot, convId, customerMessage, 'incoming');
            // Push bot reply
            if (botReply) await this.sendMessage(bot, convId, botReply, 'outgoing');

            return convId;
        } catch (e: any) {
            logToFile(`syncToConversation error: ${e.message}`);
            return null;
        }
    },

    async updateConversationCustomAttributes(bot: any, conversationId: string | number, attributes: any) {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) {
            return null;
        }
        try {
            const url = `${bot.chatwootUrl.replace(/\/$/, '')}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${conversationId}/custom_attributes`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'api_access_token': bot.chatwootToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ custom_attributes: attributes })
            });
            return await response.json();
        } catch (error: any) {
            logToFile(`Update Conversation Custom Attributes Error: ${error.message}`);
            return null;
        }
    },

    async getBaseUrl() {
        // Usa o import inline para evitar ciclo de dependências, ou usar Prisma diretamente se for o caso
        const prisma = (await import('@/lib/prisma')).default;
        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        return config?.chatwootBaseUrl || process.env.CHATWOOT_BASE_URL;
    },

    async getSuperAdminToken() {
        const prisma = (await import('@/lib/prisma')).default;
        const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
        return config?.chatwootSuperAdminToken || process.env.CHATWOOT_SUPERADMIN_TOKEN;
    },

    /**
     * Full automatic provisioning for a new bot/client.
     * Creates Chatwoot account → user → API inbox → webhook.
     * Returns all credentials to be stored on the Bot record.
     * Returns null if Chatwoot is not configured in GlobalConfig.
     */
    async provisionForBot(params: {
        clientName: string;
        clientEmail: string;
        botId: string;
        botName: string;
        appBaseUrl: string; // e.g. http://conext-app:3000 (internal Docker URL for webhooks)
        webhookToken: string;
    }): Promise<{ chatwootUrl: string; chatwootToken: string; chatwootAccountId: string; chatwootInboxId: string } | null> {
        const baseUrl = await this.getBaseUrl();
        const superToken = await this.getSuperAdminToken();

        if (!baseUrl || !superToken) {
            logToFile('[Chatwoot] provisionForBot skipped: chatwootBaseUrl or chatwootSuperAdminToken not configured in GlobalConfig.');
            return null;
        }

        const base = baseUrl.replace(/\/$/, '');
        const headers = { 'api_access_token': superToken, 'Content-Type': 'application/json' };

        try {
            // 1. Create account
            const accountRes = await fetch(`${base}/platform/api/v1/accounts`, {
                method: 'POST', headers,
                body: JSON.stringify({ name: params.clientName }),
            });
            if (!accountRes.ok) throw new Error(`Create account failed: ${accountRes.status} ${await accountRes.text().catch(() => '')}`);
            const account = await accountRes.json();
            const accountId: number = account.id;

            // 2. Create admin user for this account
            const userRes = await fetch(`${base}/platform/api/v1/users`, {
                method: 'POST', headers,
                body: JSON.stringify({
                    email: params.clientEmail,
                    name: params.clientName,
                    password: Math.random().toString(36).slice(-10) + 'A1!',
                    role: 'user',
                }),
            });
            if (!userRes.ok) throw new Error(`Create user failed: ${userRes.status} ${await userRes.text().catch(() => '')}`);
            const user = await userRes.json();
            const accessToken: string = user.access_token || user.data?.access_token || '';

            // 3. Link user to account as administrator
            await fetch(`${base}/platform/api/v1/accounts/${accountId}/account_users`, {
                method: 'POST', headers,
                body: JSON.stringify({ user_id: user.id, role: 'administrator' }),
            });

            // 4. Create API Inbox with webhook pointing back to our generic webhook
            const webhookUrl = `${params.appBaseUrl}/api/webhooks/generic?token=${params.webhookToken}`;
            const inboxRes = await fetch(`${base}/api/v1/accounts/${accountId}/inboxes`, {
                method: 'POST',
                headers: { 'api_access_token': accessToken, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: params.botName,
                    channel: { type: 'api', webhook_url: webhookUrl },
                }),
            });
            if (!inboxRes.ok) throw new Error(`Create inbox failed: ${inboxRes.status} ${await inboxRes.text().catch(() => '')}`);
            const inbox = await inboxRes.json();
            const inboxId: number = inbox.id;

            logToFile(`[Chatwoot] Provisioned: account=${accountId}, inbox=${inboxId}, user=${user.id}`);

            return {
                chatwootUrl: base,
                chatwootToken: accessToken,
                chatwootAccountId: String(accountId),
                chatwootInboxId: String(inboxId),
            };
        } catch (e: any) {
            logToFile(`[Chatwoot] provisionForBot error: ${e.message}`);
            return null; // Non-fatal: bot is created even if Chatwoot provision fails
        }
    },

    /**
     * Creates a new Account (Tenant) in Chatwoot
     */
    async createAccount(tenantName: string, adminEmail: string) {
        const baseUrl = await this.getBaseUrl();
        const token = await this.getSuperAdminToken();

        if (!baseUrl || !token) throw new Error('Chatwoot credentials not configured in GlobalConfig.');

        try {
            const response = await fetch(`${baseUrl.replace(/\/$/, '')}/platform/api/v1/accounts`, {
                method: 'POST',
                headers: {
                    'api_access_token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: tenantName })
            });
            
            if (!response.ok) throw new Error(`Failed to create account: ${response.statusText}`);
            const account = await response.json();
            
            // Create default admin user for this account
            const userResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/platform/api/v1/users`, {
                method: 'POST',
                headers: {
                    'api_access_token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: adminEmail,
                    name: `Admin ${tenantName}`,
                    password: Math.random().toString(36).slice(-10) + 'A1!',
                })
            });

            if (!userResponse.ok) throw new Error(`Failed to create user: ${userResponse.statusText}`);
            const user = await userResponse.json();

            // Link user to account
            await fetch(`${baseUrl.replace(/\/$/, '')}/platform/api/v1/accounts/${account.id}/account_users`, {
                method: 'POST',
                headers: {
                    'api_access_token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    role: 'administrator'
                })
            });

            return account;
        } catch (error: any) {
            logToFile(`Chatwoot createAccount Error: ${error.message}`);
            throw error;
        }
    },

    /**
     * Creates an API Inbox in Chatwoot for a specific Account
     */
    async createApiInbox(accountId: number, inboxName: string, webhookUrl: string) {
        const baseUrl = await this.getBaseUrl();
        const token = await this.getSuperAdminToken();

        try {
            const response = await fetch(`${baseUrl?.replace(/\/$/, '')}/api/v1/accounts/${accountId}/inboxes`, {
                method: 'POST',
                headers: {
                    'api_access_token': token!,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: inboxName,
                    channel: {
                        type: 'api',
                        webhook_url: webhookUrl
                    }
                })
            });

            if (!response.ok) throw new Error(`Failed to create inbox: ${response.statusText}`);
            return await response.json();
        } catch (error: any) {
            logToFile(`Chatwoot createApiInbox Error: ${error.message}`);
            throw error;
        }
    },

    async assignConversation(bot: any, conversationId: number | string, agentId: number | null) {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) return null;
        try {
            const url = `${bot.chatwootUrl.replace(/\/$/, '')}/api/v1/accounts/${bot.chatwootAccountId}/conversations/${conversationId}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'api_access_token': bot.chatwootToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assignee_id: agentId })
            });
            return await response.json();
        } catch (error: any) {
            logToFile(`Assign Conversation Error: ${error.message}`);
            return null;
        }
    },

    async getAgentByEmail(bot: any, email: string) {
        if (!bot.chatwootUrl || !bot.chatwootToken || !bot.chatwootAccountId) return null;
        try {
            const url = `${bot.chatwootUrl.replace(/\/$/, '')}/api/v1/accounts/${bot.chatwootAccountId}/agents`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'api_access_token': bot.chatwootToken,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const agents = await response.json();
                const agent = agents.find((a: any) => a.email?.toLowerCase() === email.toLowerCase());
                return agent || null;
            }
            return null;
        } catch (error: any) {
            logToFile(`Get Agent By Email Error: ${error.message}`);
            return null;
        }
    }
};

