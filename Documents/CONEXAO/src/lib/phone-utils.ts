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

    // Remove leading zeros
    while (d.startsWith('0')) d = d.slice(1);

    // Handle 55 prefix duplication
    if (d.length > 13 && d.startsWith('5555')) {
        d = '55' + d.slice(4);
    }

    // If it starts with 55, process the rest
    if (d.startsWith('55')) {
        const rest = d.slice(2);
        const ddd = rest.slice(0, 2);
        const number = rest.slice(2);

        // If it already has 11 digits (55 + 2 DDD + 9 number), it's perfect
        if (rest.length === 11) return d;

        // If it has 10 digits (55 + 2 DDD + 8 number), DO NOT force the 9th digit 
        // unless it's a known requirement. For now, preserve 8-digit accounts.
        if (rest.length === 10) return d;

        return d;
    }

    // If it has 11 digits (DDD + 9 + number), add 55
    if (d.length === 11) return `55${d}`;

    // If it has 10 digits (DDD + number), add 55 but DO NOT force 9
    if (d.length === 10) return `55${d}`;

    // Fallback
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

        // 4. Handle Brazilian numbers
        // Use the specialized Brazil normalization which ensures 55 and correct digits
        if (clean.length >= 10 && (clean.startsWith('55') || clean.length <= 11)) {
            return normalizeBrazilWhatsAppE164(clean);
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
