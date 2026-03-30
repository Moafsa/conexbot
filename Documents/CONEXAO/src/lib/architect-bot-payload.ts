import { createBotSchema } from '@/lib/validations';

function pickString(v: unknown): string | undefined {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s !== '' ? s : undefined;
}

/** URL absoluta válida; inválida ou vazia → omitir (evita falhas do Zod com `''` em `.url()`). */
function optionalValidUrl(v: unknown): string | undefined {
    if (v == null || v === '') return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    try {
        new URL(s);
        return s;
    } catch {
        return undefined;
    }
}

function toStringArray(v: unknown): string[] | undefined {
    if (v == null) return undefined;
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === 'string' && v.trim()) return [v.trim()];
    return undefined;
}

function toOptionalNumber(v: unknown, min: number, max: number): number | undefined {
    if (v == null || v === '') return undefined;
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    if (Number.isNaN(n)) return undefined;
    return Math.min(max, Math.max(min, n));
}

function toOptionalInt(v: unknown, min: number): number | undefined {
    const n = toOptionalNumber(v, -Infinity, Infinity);
    if (n === undefined) return undefined;
    const i = Math.round(n);
    if (i < min) return undefined;
    return i;
}

function toOptionalBool(v: unknown): boolean | undefined {
    if (v == null) return undefined;
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === 1) return true;
    if (v === 'false' || v === 0) return false;
    return undefined;
}

function optionalDigitsContact(v: unknown): string | undefined {
    const raw = String(v ?? '').replace(/\D/g, '');
    if (!raw) return undefined;
    if (/^\d{10,15}$/.test(raw)) return raw;
    return undefined;
}

/**
 * Monta apenas campos do `createBotSchema`, com tipos coerentes para o POST/PUT da API.
 * Evita "Invalid input" quando a IA ou o estado misturam tipos (número vs string, etc.).
 */
export function buildArchitectBotPayload(botData: unknown, extractedData: unknown) {
    const b = (botData && typeof botData === 'object' ? botData : {}) as Record<string, unknown>;
    const e = (extractedData && typeof extractedData === 'object' ? extractedData : {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...b, ...e };

    const payload: Record<string, unknown> = {
        name: pickString(merged.name) ?? 'Novo Agente',
        businessType: pickString(merged.businessType) ?? 'Geral',
        voiceId: pickString(merged.voiceId) ?? '',
        aiProvider: pickString(merged.aiProvider) ?? 'openai',
        aiModel: pickString(merged.aiModel) ?? 'gpt-4o-mini',
    };

    const ks = pickString(merged.knowledgeBase);
    if (ks !== undefined) payload.knowledgeBase = ks;
    const desc = pickString(merged.description);
    if (desc !== undefined) payload.description = desc;
    const sys = pickString(merged.systemPrompt);
    if (sys !== undefined) payload.systemPrompt = sys;
    const ps = pickString(merged.productsServices);
    if (ps !== undefined) payload.productsServices = ps;

    const addr = pickString(merged.address);
    if (addr !== undefined) payload.address = addr;
    const hrs = pickString(merged.hours);
    if (hrs !== undefined) payload.hours = hrs;

    const wu = optionalValidUrl(merged.webhookUrl);
    if (wu !== undefined) payload.webhookUrl = wu;
    const wt = pickString(merged.webhookToken);
    if (wt !== undefined) payload.webhookToken = wt;

    const cu = optionalValidUrl(merged.chatwootUrl);
    if (cu !== undefined) payload.chatwootUrl = cu;
    const ct = pickString(merged.chatwootToken);
    if (ct !== undefined) payload.chatwootToken = ct;

    if (merged.chatwootAccountId != null && merged.chatwootAccountId !== '') {
        payload.chatwootAccountId = String(merged.chatwootAccountId);
    }

    const site = optionalValidUrl(merged.websiteUrl);
    if (site !== undefined) payload.websiteUrl = site;

    const fb = optionalDigitsContact(merged.fallbackContact);
    if (fb !== undefined) payload.fallbackContact = fb;

    const mods = toStringArray(merged.modules);
    if (mods !== undefined) payload.modules = mods;

    const payM = toStringArray(merged.paymentMethods);
    if (payM !== undefined) payload.paymentMethods = payM;

    const ag = toStringArray(merged.allowedGroups);
    if (ag !== undefined) payload.allowedGroups = ag;

    const ep = toOptionalBool(merged.enablePayments);
    if (ep !== undefined) payload.enablePayments = ep;

    const mb = toOptionalNumber(merged.messageBuffer, 0, 10000);
    if (mb !== undefined) payload.messageBuffer = mb;

    const ak = pickString(merged.asaasApiKey);
    if (ak !== undefined) payload.asaasApiKey = ak;

    const ust = pickString(merged.userSplitType);
    if (ust === 'FIXED' || ust === 'PERCENTAGE') payload.userSplitType = ust;

    const usv = toOptionalNumber(merged.userSplitValue, 0, 10);
    if (usv !== undefined) payload.userSplitValue = usv;

    const sp = pickString(merged.schedulingProvider);
    if (sp === 'INTERNAL' || sp === 'GOOGLE') payload.schedulingProvider = sp;

    const ad = toOptionalInt(merged.appointmentDuration, 1);
    if (ad !== undefined) payload.appointmentDuration = ad;

    if (merged.workingHours !== undefined && merged.workingHours !== null) {
        payload.workingHours = merged.workingHours;
    }

    const grm = pickString(merged.groupResponseMode);
    if (grm === 'ALL' || grm === 'NONE' || grm === 'SPECIFIC') payload.groupResponseMode = grm;

    const parsed = createBotSchema.safeParse(payload);
    if (!parsed.success) {
        const minimal = createBotSchema.safeParse({
            name: payload.name,
            businessType: payload.businessType,
            voiceId: payload.voiceId ?? '',
            aiProvider: payload.aiProvider,
            aiModel: payload.aiModel,
        });
        if (minimal.success) return minimal.data;
        const detail = parsed.error.issues
            .map((i) => `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`)
            .join('; ');
        throw new Error(
            detail || 'Não foi possível validar os dados do agente. Tente de novo ou edite na aba Identidade.'
        );
    }
    return parsed.data;
}
