/**
 * Utility for normalizing phone numbers across the system.
 * Removes formatting, country code prefixes (if redundant), and WhatsApp suffixes.
 */

/**
 * Apenas dígitos, removendo sufixos WhatsApp e sufixo LID (:).
 */
function digitsOnlyBrazil(raw: string): string {
    if (!raw) return '';
    let s = String(raw).trim();
    s = s.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@g.us', '');
    s = s.split(':')[0];
    return s.replace(/\D/g, '');
}

/**
 * Converte número BR para formato internacional usado no JID WhatsApp (somente dígitos: 55 + DDD + número).
 * Cobre: sem DDI 55, 10 dígitos (sem 9º celular), 12 dígitos com 55 (falta o 9), 14 dígitos (9 duplicado), 55 repetido.
 * Assume Brasil (tenant/notificações); números já em outro país com outro DDI podem precisar ser informados com código completo.
 */
export function normalizeBrazilWhatsAppE164(raw: string): string {
    let d = digitsOnlyBrazil(raw);
    if (!d) return d;
    while (d.startsWith('0')) d = d.slice(1);

    // 5555... no início (erro de digitação)
    while (d.length > 13 && d.startsWith('5555')) {
        d = '55' + d.slice(4);
    }

    if (d.startsWith('55')) {
        const rest = d.slice(2);
        // 14 dígitos: 55 + DDD + "99" + 8 (9º dígito duplicado no celular)
        if (d.length === 14 && rest.length === 12) {
            const ddd = rest.slice(0, 2);
            const sub = rest.slice(2);
            if (sub.length === 10 && sub[0] === '9' && sub[1] === '9') {
                d = `55${ddd}9${sub.slice(1)}`;
            }
        }
        // 12 dígitos: 55 + DDD + 8 (celular antigo sem 9 após DDD)
        else if (d.length === 12 && rest.length === 10) {
            const ddd = rest.slice(0, 2);
            const afterDdd = rest.slice(2);
            if (afterDdd.length === 8) {
                d = `55${ddd}9${afterDdd}`;
            }
        }
        return d;
    }

    // Sem DDI: 11 dígitos = DDD + celular (9 dígitos)
    if (d.length === 11) {
        return `55${d}`;
    }

    // Sem DDI: 10 dígitos = DDD + 8 (insere 9 após DDD para padrão de celular BR)
    if (d.length === 10) {
        return `55${d.slice(0, 2)}9${d.slice(2)}`;
    }

    return d;
}

export const PhoneUtils = {
    /**
     * Cleans a phone number for use as a remoteId or identifying a contact.
     * Standardizes to the most common format: DDD + Number (Digits only).
     */
    normalize(phone: string): string {
        if (!phone) return '';

        // 1. Remove common WhatsApp suffixes
        let clean = phone.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@g.us', '');

        // 2. Remove anything after : (WuzAPI multi-device suffix)
        clean = clean.split(':')[0];

        // 3. Remove all non-digits
        clean = clean.replace(/\D/g, '');

        // 4. Handle Brazilian 55 prefix normalization
        // If it starts with 55, keep it but ensure it's not duplicated
        // If it doesn't have 55 but has 10-11 digits, it might need 55 for external tools, 
        // but for INTERNAL lookup we just want a unique string.
        // DECISION: Keep the 55 if present, but remove it if it's the ONLY thing that changed.
        
        // Strategy: We want "5551987654321" and "51987654321" to potentially match?
        // Actually, it's safer to ENSURE a prefix or REMOVE it.
        // Let's strip the 55 from Brazilian numbers for internal indexing to avoid the "55" vs "sem 55" confusion.
        if (clean.length >= 12 && clean.startsWith('55')) {
            clean = clean.substring(2);
        }

        // Remove leading 0
        if (clean.startsWith('0')) {
            clean = clean.substring(1);
        }

        return clean;
    },

    /**
     * Compares two normalized phone numbers.
     */
    compare(phone1: string, phone2: string): boolean {
        return this.normalize(phone1) === this.normalize(phone2);
    },

    /** @see normalizeBrazilWhatsAppE164 */
    normalizeBrazilWhatsAppE164(raw: string): string {
        return normalizeBrazilWhatsAppE164(raw);
    },
};
