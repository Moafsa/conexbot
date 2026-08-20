import prisma from './prisma';

export async function validateApiKey(key: string) {
    if (!key) return null;
    const apiKey = await prisma.apiKey.findUnique({
        where: { key, active: true },
        include: {
            bot: {
                include: { channels: { where: { provider: 'META_WHATSAPP' } } }
            }
        }
    });
    if (!apiKey) return null;

    // Update lastUsedAt without blocking
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    return apiKey;
}

export function extractApiKey(req: Request): string | null {
    const auth = req.headers.get('authorization') || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    const url = new URL(req.url);
    return url.searchParams.get('api_key');
}
