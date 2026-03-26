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
    // Base64 do payload + assinatura separada por ponto
    const token = Buffer.from(data).toString('base64') + '.' + signature;
    return token;
}

/**
 * Verifica o token assinado
 */
export function verifyWpToken(token: string) {
    try {
        const [dataBase64, signature] = token.split('.');
        if (!dataBase64 || !signature) return null;

        const data = Buffer.from(dataBase64, 'base64').toString('utf-8');
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
        
        if (signature === expectedSignature) {
            const parsed = JSON.parse(data);
            // Opcional: validar expiração se quiser (aqui deixamos longa duração como solicitado)
            return parsed;
        }
    } catch (e) {
        console.error('Verify WP Token Error:', e);
        return null;
    }
    return null;
}
