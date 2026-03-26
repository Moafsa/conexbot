/**
 * Utility for normalizing phone numbers across the system.
 * Removes formatting, country code prefixes (if redundant), and WhatsApp suffixes.
 */
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
    }
};
