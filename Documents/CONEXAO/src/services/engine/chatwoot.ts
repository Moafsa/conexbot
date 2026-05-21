
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
    }
};

