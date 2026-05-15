import prisma from "@/lib/prisma";

export class MercadoLivreService {
    private static API_URL = "https://api.mercadolibre.com";

    /**
     * Gets the authorization URL for Mercado Livre
     */
    static async getAuthUrl(tenantId: string) {
        const config = await prisma.globalConfig.findUnique({ where: { id: "system" } });
        const clientId = config?.mlClientId;
        
        if (!clientId) {
            throw new Error("Mercado Livre Client ID not configured in system settings.");
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolivre/callback`;
        return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${tenantId}`;
    }

    /**
     * Exchanges auth code for access token
     */
    static async handleCallback(code: string, tenantId: string) {
        const config = await prisma.globalConfig.findUnique({ where: { id: "system" } });
        const clientId = config?.mlClientId;
        const clientSecret = config?.mlClientSecret;

        if (!clientId || !clientSecret) {
            throw new Error("Mercado Livre credentials not configured.");
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolivre/callback`;

        const response = await fetch(`${this.API_URL}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(`ML Auth Error: ${data.message || data.error}`);
        }

        // Save tokens to Tenant
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                mlAccessToken: data.access_token,
                mlRefreshToken: data.refresh_token,
                mlTokenExpires: new Date(Date.now() + data.expires_in * 1000),
                mlUserId: String(data.user_id)
            }
        });

        return data;
    }

    /**
     * Refreshes the access token if needed
     */
    static async getValidToken(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { mlAccessToken: true, mlRefreshToken: true, mlTokenExpires: true }
        });

        if (!tenant?.mlAccessToken) return null;

        // If token is still valid (with 5 min margin), return it
        if (tenant.mlTokenExpires && tenant.mlTokenExpires.getTime() > Date.now() + 5 * 60000) {
            return tenant.mlAccessToken;
        }

        // Otherwise, refresh it
        return this.refreshToken(tenantId, tenant.mlRefreshToken!);
    }

    private static async refreshToken(tenantId: string, refreshToken: string) {
        const config = await prisma.globalConfig.findUnique({ where: { id: "system" } });
        const clientId = config?.mlClientId;
        const clientSecret = config?.mlClientSecret;

        const response = await fetch(`${this.API_URL}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: clientId!,
                client_secret: clientSecret!,
                refresh_token: refreshToken
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error(`[ML Service] Refresh Token Error for Tenant ${tenantId}:`, data);
            return null;
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                mlAccessToken: data.access_token,
                mlRefreshToken: data.refresh_token,
                mlTokenExpires: new Date(Date.now() + data.expires_in * 1000)
            }
        });

        return data.access_token;
    }

    /**
     * Updates product stock/price in Mercado Livre
     */
    static async updateItem(tenantId: string, mlItemId: string, data: { price?: number, available_quantity?: number }) {
        const token = await this.getValidToken(tenantId);
        if (!token) throw new Error("Unauthorized: ML Token not found or expired.");

        const response = await fetch(`${this.API_URL}/items/${mlItemId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        return response.json();
    }

    /**
     * Gets item details from Mercado Livre
     */
    static async getItem(tenantId: string, mlItemId: string) {
        const token = await this.getValidToken(tenantId);
        if (!token) throw new Error("Unauthorized: ML Token not found or expired.");

        const response = await fetch(`${this.API_URL}/items/${mlItemId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        return response.json();
    }
}
