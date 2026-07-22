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
/**
 * Converte número BR para formato internacional usado no JID WhatsApp (somente dígitos: 55 + DDD + número).
 * Cobre: sem DDI 55, 10 dígitos (sem 9º celular), 12 dígitos com 55 (falta o 9), 14 dígitos (9 duplicado), 55 repetido.
 * Garante que celulares brasileiros (DDD 11 a 99) tenham sempre o 9º dígito (13 dígitos: 55 + DDD + 9 + 8 dígitos).
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

    // If it starts with 55
    if (d.startsWith('55')) {
        const rest = d.slice(2);
        const ddd = rest.slice(0, 2);
        const number = rest.slice(2);

        // If 11 digits (55 + 2 DDD + 9 number), perfect
        if (rest.length === 11) return d;

        // If 10 digits (55 + 2 DDD + 8 number)
        if (rest.length === 10) {
            // Mobile numbers in Brazil start with 6, 7, 8, or 9
            if (['6', '7', '8', '9'].includes(number[0])) {
                return `55${ddd}9${number}`;
            }
            return d;
        }

        return d;
    }

    // If 11 digits (DDD + 9 + number), add 55
    if (d.length === 11) return `55${d}`;

    // If 10 digits (DDD + number), add 55 and add 9 if mobile
    if (d.length === 10) {
        if (['6', '7', '8', '9'].includes(d[2])) {
            return `55${d.slice(0, 2)}9${d.slice(2)}`;
        }
        return `55${d}`;
    }

    return d;
}

export function getPhoneVariations(phone: string): string[] {
    if (!phone) return [];
    const clean = phone.replace(/\D/g, '');
    const set = new Set<string>();
    if (!clean) return [];

    set.add(clean);
    const normalized = normalizeBrazilWhatsAppE164(clean);
    set.add(normalized);

    // Generate alternate (with or without 9th digit)
    if (clean.startsWith('55')) {
        const rest = clean.slice(2);
        const ddd = rest.slice(0, 2);
        const num = rest.slice(2);

        if (rest.length === 11 && num.startsWith('9')) {
            // Has 9th digit -> add variation without 9th digit
            set.add(`55${ddd}${num.slice(1)}`);
        } else if (rest.length === 10 && ['6', '7', '8', '9'].includes(num[0])) {
            // Missing 9th digit -> add variation with 9th digit
            set.add(`55${ddd}9${num}`);
        }
    }

    return Array.from(set);
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
     * Returns all potential database string variations of a phone number
     * (e.g. both 12-digit and 13-digit Brazilian formats).
     */
    getVariations(phone: string): string[] {
        return getPhoneVariations(phone);
    },

    getPhoneVariations(phone: string): string[] {
        return getPhoneVariations(phone);
    },

    /**
     * Compares two normalized phone numbers.
     */
    compare(phone1: string, phone2: string): boolean {
        const v1 = this.getVariations(phone1);
        const v2 = this.getVariations(phone2);
        return v1.some(p => v2.includes(p));
    },

    /** @see normalizeBrazilWhatsAppE164 */
    normalizeBrazilWhatsAppE164(raw: string): string {
        return normalizeBrazilWhatsAppE164(raw);
    },
};
