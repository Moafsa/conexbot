interface ContactData {
    name?: string;
    email?: string;
    company?: string;
    role?: string;
    needs?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /\b\d{10,13}\b/;

// Common name patterns (1-4 capitalized words)
const NAME_INDICATORS = [
    /(?:me chamo|meu nome (?:é|e)|sou (?:o|a)?) (.+)/i,
    /(?:nome[:\s]+)(.+)/i,
];

const EMAIL_INDICATORS = [
    /(?:e-?mail|email)[:\s]+(.+)/i,
    /(?:meu e-?mail)[:\s]+(.+)/i,
];

const COMPANY_INDICATORS = [
    /(?:empresa|negócio|negocio|loja|minha empresa)[:\s]+(.+)/i,
    /(?:trabalho (?:na|no|em))\s+(.+)/i,
    /(?:sou (?:da|do))\s+(.+)/i,
];

const ROLE_INDICATORS = [
    /(?:sou|cargo|função|funcao)[:\s]*(gerente|diretor|dono|sócio|socio|CEO|coordenador|administrador|proprietário|proprietario|vendedor|analista|consultor|pastor|líder|lider)/i,
];

const NEEDS_INDICATORS = [
    /(?:preciso|quero|gostaria|necessito|busco|procuro)\s+(.{10,})/i,
    /(?:interesse em|interessado em)\s+(.{10,})/i,
];

export function extractContactData(
    messageText: string,
    conversationHistory: { role: string; content: string }[]
): ContactData {
    const data: ContactData = {};
    const allText = messageText;

    // Extract email
    const emailMatch = allText.match(EMAIL_REGEX);
    if (emailMatch) {
        data.email = emailMatch[0].toLowerCase();
    }

    // Extract name from patterns
    for (const pattern of NAME_INDICATORS) {
        const match = allText.match(pattern);
        if (match?.[1]) {
            const candidateName = match[1].trim().substring(0, 60);
            // Validate it looks like a name (not too long, not an email)
            if (candidateName.length >= 2 && !candidateName.includes('@') && !candidateName.match(/\d{5,}/)) {
                data.name = candidateName;
                break;
            }
        }
    }

    // If no pattern matched, check if the last bot message asked for a name and this is a short reply
    if (!data.name && conversationHistory.length >= 2) {
        const lastBotMsg = [...conversationHistory].reverse().find(m => m.role === 'assistant');
        if (lastBotMsg?.content.match(/(?:nome|qual seu nome|como (?:se chama|você se chama))/i)) {
            const words = allText.trim().split(/\s+/);
            if (words.length >= 1 && words.length <= 4 && !allText.includes('@') && !allText.match(/\d{5,}/)) {
                data.name = allText.trim();
            }
        }
    }

    // Extract company
    for (const pattern of COMPANY_INDICATORS) {
        const match = allText.match(pattern);
        if (match?.[1]) {
            data.company = match[1].trim().substring(0, 100);
            break;
        }
    }

    // Extract role
    for (const pattern of ROLE_INDICATORS) {
        const match = allText.match(pattern);
        if (match?.[1]) {
            data.role = match[1].trim();
            break;
        }
    }

    // Extract needs
    for (const pattern of NEEDS_INDICATORS) {
        const match = allText.match(pattern);
        if (match?.[1]) {
            data.needs = match[1].trim().substring(0, 200);
            break;
        }
    }

    return data;
}

export function mergeContactData(existing: ContactData, extracted: ContactData): ContactData {
    return {
        name: extracted.name || existing.name,
        email: extracted.email || existing.email,
        company: extracted.company || existing.company,
        role: extracted.role || existing.role,
        needs: extracted.needs || existing.needs,
    };
}
