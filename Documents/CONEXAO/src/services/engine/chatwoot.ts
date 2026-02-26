
import fs from 'fs';
import path from 'path';

function logToFile(msg: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [Chatwoot] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug-today.log'), line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}

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
    }
};
