import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'conexbot-default-secret';

/**
 * Gera um token assinado simples para o WordPress (evita problemas de JWE do NextAuth)
 */
export function generateWpToken(payload: { id: string; email: string; role?: string }) {
    const data = JSON.stringify({
        id: payload.id,
        email: payload.email,
        role: payload.role || 'USER',
        iat: Date.now()
    });
    const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    // Prefix for identification + Base64 payload + Signature
    return 'CONEXT_' + Buffer.from(data).toString('base64') + '.' + signature;
}

export function verifyWpToken(token: string) {
    try {
        if (!token.startsWith('CONEXT_')) {
            console.error('Invalid token prefix');
            return null;
        }

        const actualToken = token.replace('CONEXT_', '');
        const [dataBase64, signature] = actualToken.split('.');
        if (!dataBase64 || !signature) return null;

        const data = Buffer.from(dataBase64, 'base64').toString('utf-8');
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
        
        if (signature === expectedSignature) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Verify WP Token Error:', e);
        return null;
    }
    return null;
}
