import prisma from '@/lib/prisma';

export class MetaService {
    private static async getGlobalConfig() {
        return await prisma.globalConfig.findUnique({ where: { id: 'system' } });
    }

    /**
     * Troca o código de autorização (do Embedded Signup) por um token de acesso de curta duração.
     */
    static async exchangeCodeForToken(code: string) {
        const config = await this.getGlobalConfig();
        if (!config?.metaAppId || !config?.metaAppSecret) {
            throw new Error('Configurações globais da Meta (App ID/Secret) não encontradas.');
        }

        const url = `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${config.metaAppId}&client_secret=${config.metaAppSecret}&code=${code}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            throw new Error(`Meta OAuth Error: ${data.error.message}`);
        }

        return data.access_token;
    }

    /**
     * Busca os números de telefone vinculados a uma WABA.
     */
    static async getWabaPhoneNumbers(wabaId: string, accessToken: string) {
        const url = `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        return data.data || [];
    }

    /**
     * Busca as WABAs acessíveis pelo token.
     */
    static async getAvailableWabas(accessToken: string) {
        const url = `https://graph.facebook.com/v22.0/me/whatsapp_business_accounts`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        return data.data || [];
    }
}
