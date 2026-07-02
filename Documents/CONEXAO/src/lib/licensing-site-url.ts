/**
 * Comparação tolerante de siteUrl para licença WordPress (http vs https, barra final, etc.).
 */
export function licensingSiteFingerprint(raw: string): string {
    const s = raw.trim();
    if (!s) return '';
    try {
        const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
        const u = new URL(withScheme);
        const host = u.hostname.toLowerCase();
        const port =
            u.port && !['80', '443'].includes(u.port) ? `:${u.port}` : '';
        let path = u.pathname || '/';
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        const pathPart = path === '/' ? '' : path;
        return `${host}${port}${pathPart}`;
    } catch {
        return s.toLowerCase();
    }
}

export function licensingSiteUrlsMatch(a: string, b: string): boolean {
    return licensingSiteFingerprint(a) === licensingSiteFingerprint(b);
}

/** URL canónica gravada na primeira ativação (sempre https salvo porta não padrão). */
export function canonicalLicensingSiteUrl(raw: string): string {
    const s = raw.trim();
    if (!s) return '';
    try {
        const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
        const u = new URL(withScheme);
        const host = u.hostname.toLowerCase();
        const port =
            u.port && !['80', '443'].includes(u.port) ? `:${u.port}` : '';
        let path = u.pathname || '/';
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        const pathPart = path === '/' ? '' : path;
        return `https://${host}${port}${pathPart}`;
    } catch {
        return s;
    }
}
