import prisma from '@/lib/prisma';
import { logToFile } from '@/services/engine/logger';

const GRAPH_VERSION = 'v22.0';
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class MetaApiError extends Error {
    code?: number;
    subcode?: number;
    fbtraceId?: string;
    constructor(message: string, code?: number, subcode?: number, fbtraceId?: string) {
        super(message);
        this.name = 'MetaApiError';
        this.code = code;
        this.subcode = subcode;
        this.fbtraceId = fbtraceId;
    }
}

function friendlyMetaError(raw: any): string {
    const err = raw?.error;
    if (!err) return 'Erro desconhecido ao comunicar com a Meta.';

    const msg = err.error_user_msg || err.message || 'Erro desconhecido.';

    // Códigos conhecidos que merecem uma explicação melhor para o usuário final
    if (err.code === 100 && /phone number/i.test(msg)) {
        return 'Este número já está registrado em outra conta WhatsApp Business (App oficial, on-premise ou outro sistema). Migre o número ou use outro.';
    }
    if (err.code === 190) {
        return 'Sessão/token da Meta expirado. Refaça o login com o Facebook.';
    }
    if (err.code === 200 || err.code === 10) {
        if (/whatsapp/i.test(msg)) {
            return 'Permissões insuficientes no WhatsApp. Verifique se o App da Meta possui acesso aprovado a "whatsapp_business_management" e "whatsapp_business_messaging".';
        }
        return `Permissões insuficientes na Meta (${err.code}): ${msg}`;
    }
    if (err.code === 368) {
        return 'A conta da Meta associada está temporariamente restrita para essa ação. Verifique o Gerenciador de Negócios.';
    }
    if (err.code === 131030 || err.error_subcode === 131030 || /allowed list/i.test(msg)) {
        return 'O número do entregador/destinatário não está na lista de números de teste autorizados no painel Meta Developers (App em modo Desenvolvimento). Adicione o número no painel da Meta ou altere o App para Produção.';
    }
    if (err.code === 131047 || err.error_subcode === 131047 || /24 hour/i.test(msg)) {
        return 'A Meta bloqueou a mensagem porque se passaram mais de 24h desde o último contato do destinatário. Para iniciar contato via Meta Cloud API, o entregador precisa mandar um "Oi" primeiro ou usar um Modelo de Mensagem (Template) aprovado.';
    }
    return msg;
}

async function graphFetch(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    const data = await res.json();
    if (!res.ok || data.error) {
        logToFile(`[MetaGraphFetch Error] url=${url.split('?')[0]} status=${res.status} error=${JSON.stringify(data.error || data)}`);
        throw new MetaApiError(friendlyMetaError(data), data?.error?.code, data?.error?.error_subcode, data?.error?.fbtrace_id);
    }
    return data;
}

export class MetaService {
    private static async getGlobalConfig() {
        return prisma.globalConfig.findUnique({ where: { id: 'system' } });
    }

    static async getPublicConfig() {
        const config = await this.getGlobalConfig();
        return {
            appId: config?.metaAppId || null,
            configId: config?.metaWhatsappConfigId || null,
            instagramConfigId: config?.metaInstagramConfigId || null,
        };
    }

    /**
     * Troca o código de autorização (retornado pelo popup de Embedded Signup, ou pelo
     * redirect clássico do Facebook Login for Business) por um token de acesso de
     * curta duração (~1h-2h).
     *
     * `redirectUri` só é necessário (e deve ser passado) para fluxos de OAuth dialog
     * clássico com redirect (ex.: conexão do Instagram) — a Meta exige que o mesmo
     * redirect_uri usado na etapa de autorização seja repetido aqui, senão retorna
     * "Error validating verification code... redirect_uri". O Embedded Signup via
     * popup (WhatsApp) não usa redirect_uri e não deve passá-lo.
     */
    static async exchangeCodeForToken(code: string, redirectUri?: string): Promise<string> {
        const config = await this.getGlobalConfig();
        if (!config?.metaAppId || !config?.metaAppSecret) {
            throw new Error('Configurações globais da Meta (App ID/Secret) não encontradas. Configure em Admin > Configurações.');
        }

        let url = `${GRAPH_URL}/oauth/access_token?client_id=${config.metaAppId}&client_secret=${config.metaAppSecret}&code=${encodeURIComponent(code)}`;
        if (redirectUri) {
            url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
        }
        const data = await graphFetch(url);
        return data.access_token;
    }

    /**
     * Troca o código de autorização do fluxo DIRETO do Instagram (api.instagram.com/oauth/authorize)
     * por um token de acesso da conta logada no navegador do usuário.
     */
    static async exchangeInstagramDirectCode(code: string, redirectUri: string): Promise<{ accessToken: string; userId: string; username: string }> {
        const config = await this.getGlobalConfig();
        const appId = config?.metaInstagramConfigId || config?.metaAppId;
        const appSecret = config?.metaAppSecret;

        if (!appId || !appSecret) {
            throw new Error('Configurações globais do Instagram (App ID/Secret) não encontradas.');
        }

        const params = new URLSearchParams();
        params.append('client_id', appId);
        params.append('client_secret', appSecret);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', redirectUri);
        params.append('code', code);

        const res = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            body: params,
        });

        const data = await res.json();
        logToFile(`[Instagram Direct OAuth] Resposta da troca de token: ${JSON.stringify(data)}`);

        if (!res.ok || data.error_type || !data.access_token) {
            throw new Error(data.error_message || data.error?.message || 'Falha na autenticação com a conta do Instagram.');
        }

        const accessToken = data.access_token;
        const userId = String(data.user_id || data.user?.id || '');

        let username = data.user?.username;
        if (!username && userId) {
            try {
                const profileRes = await fetch(`https://graph.instagram.com/v22.0/me?fields=id,username,account_type&access_token=${accessToken}`);
                const profileData = await profileRes.json();
                if (profileData?.username) {
                    username = profileData.username;
                }
            } catch (e: any) {
                logToFile(`[Instagram Direct OAuth] Aviso ao buscar perfil: ${e?.message}`);
            }
        }

        return {
            accessToken,
            userId,
            username: username || `user_${userId}`
        };
    }

    /**
     * Converte um token de curta duração em um token de longa duração (~60 dias).
     * Essencial para que a conexão do cliente não caia sozinha depois de 1h.
     */
    static async getLongLivedToken(shortLivedToken: string): Promise<{ accessToken: string; expiresInSeconds: number | null }> {
        const config = await this.getGlobalConfig();
        if (!config?.metaAppId || !config?.metaAppSecret) {
            throw new Error('Configurações globais da Meta (App ID/Secret) não encontradas.');
        }

        const url = `${GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${config.metaAppId}&client_secret=${config.metaAppSecret}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;
        const data = await graphFetch(url);
        return {
            accessToken: data.access_token || shortLivedToken,
            expiresInSeconds: typeof data.expires_in === 'number' ? data.expires_in : null,
        };
    }

    /** Busca as WABAs acessíveis pelo token (fallback caso o front não capture via postMessage). */
    static async getAvailableWabas(accessToken: string) {
        const url = `${GRAPH_URL}/me/whatsapp_business_accounts`;
        const data = await graphFetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        return data.data || [];
    }

    /** Busca os números de telefone vinculados a uma WABA. */
    static async getWabaPhoneNumbers(wabaId: string, accessToken: string) {
        const url = `${GRAPH_URL}/${wabaId}/phone_numbers`;
        const data = await graphFetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        return data.data || [];
    }

    /** Detalhes de um número específico (nome verificado, status de qualidade, etc). */
    static async getPhoneNumberDetails(phoneId: string, accessToken: string) {
        const url = `${GRAPH_URL}/${phoneId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,platform_type`;
        return graphFetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    }

    /**
     * Registra o número na Cloud API (obrigatório antes de enviar/receber mensagens
     * pela primeira vez, ou após portar um número de outro provedor/app oficial).
     */
    static async registerPhoneNumber(phoneId: string, accessToken: string, pin: string) {
        const url = `${GRAPH_URL}/${phoneId}/register`;
        return graphFetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
        });
    }

    /**
     * Inscreve o nosso App como "assinante" de eventos da WABA do cliente.
     * Sem isso, as mensagens recebidas pelo número do cliente NUNCA chegam no nosso webhook.
     */
    static async subscribeAppToWaba(wabaId: string, accessToken: string) {
        const url = `${GRAPH_URL}/${wabaId}/subscribed_apps`;
        return graphFetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    }

    /** Gera um PIN numérico de 6 dígitos para o /register (2FA da Cloud API). */
    static generatePin(): string {
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    /** Envia uma mensagem de texto simples via Cloud API. */
    static async sendTextMessage(phoneId: string, accessToken: string, to: string, body: string) {
        const url = `${GRAPH_URL}/${phoneId}/messages`;
        return graphFetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'text',
                text: { preview_url: true, body },
            }),
        });
    }

    /** Envia mídia (imagem/áudio/vídeo/documento) por link público via Cloud API. */
    static async sendMediaMessage(
        phoneId: string,
        accessToken: string,
        to: string,
        type: 'image' | 'audio' | 'video' | 'document',
        link: string,
        caption?: string,
        filename?: string
    ) {
        const url = `${GRAPH_URL}/${phoneId}/messages`;
        const mediaPayload: any = { link };
        if (caption && (type === 'image' || type === 'video' || type === 'document')) mediaPayload.caption = caption;
        if (filename && type === 'document') mediaPayload.filename = filename;

        return graphFetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type,
                [type]: mediaPayload,
            }),
        });
    }

    /**
     * Envia uma mensagem baseada em Modelo (Template HSM) pré-aprovado na Meta.
     * Necessário para iniciar contatos fora da janela de 24h ou para notificações de transbordo e entregas.
     */
    static async sendTemplateMessage(
        phoneId: string,
        accessToken: string,
        to: string,
        templateName: string,
        languageCode: string = 'pt_BR',
        components?: any[]
    ) {
        const url = `${GRAPH_URL}/${phoneId}/messages`;

        // Sanitiza todos os parâmetros de texto para evitar erro Meta #131008 (Parameter of type text is missing text value)
        const sanitizedComponents = (components || []).map((comp: any) => {
            if (comp.parameters && Array.isArray(comp.parameters)) {
                return {
                    ...comp,
                    parameters: comp.parameters.map((p: any) => {
                        if (p.type === 'text') {
                            const val = (p.text !== null && p.text !== undefined) ? String(p.text).trim() : '';
                            return { ...p, text: val || '--' };
                        }
                        return p;
                    })
                };
            }
            return comp;
        });

        return graphFetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    ...(sanitizedComponents.length > 0 ? { components: sanitizedComponents } : {})
                }
            }),
        });
    }

    // ==================== Instagram (via Facebook Login for Business) ====================
    //
    // Reaproveita o mesmo App/config_id de login com popup; a diferença é que a
    // API de mensagens/publicação do Instagram é acessada através da Página do
    // Facebook vinculada à conta profissional do Instagram (Messenger Platform),
    // não pelo host graph.instagram.com (esse é o fluxo "Instagram API com Login
    // do Instagram", que exigiria um popup/host diferente).

    /**
     * Lista as Páginas do Facebook que o usuário administra, incluindo a conta
     * profissional do Instagram vinculada a cada uma (quando existir).
     */
    static async getFacebookPagesWithInstagram(accessToken: string) {
        const url = `${GRAPH_URL}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}`;
        const data = await graphFetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        const pages = (data.data || []) as Array<{
            id: string;
            name: string;
            access_token: string;
            instagram_business_account?: { id: string; username?: string; name?: string; profile_picture_url?: string };
        }>;

        logToFile(`[MetaService] /me/accounts raw count=${pages.length}`);

        const result: Array<{
            id: string;
            name: string;
            access_token: string;
            instagram_business_account: { id: string; username: string; name?: string; profile_picture_url?: string };
        }> = [];

        for (const p of pages) {
            // Apenas Páginas que tenham uma CONTA DE INSTAGRAM PROFISSIONAL vinculada
            if (!p.instagram_business_account || !p.instagram_business_account.id) {
                continue;
            }

            let igUsername = p.instagram_business_account.username;

            // Se o username do Instagram não veio no /me/accounts, busca diretamente no nó do Instagram
            if (!igUsername) {
                try {
                    const igUrl = `${GRAPH_URL}/${p.instagram_business_account.id}?fields=id,username,name,profile_picture_url&access_token=${encodeURIComponent(p.access_token)}`;
                    const igData = await graphFetch(igUrl);
                    logToFile(`[MetaService] Direct IG fetch for ${p.instagram_business_account.id}: username=${igData?.username}`);
                    if (igData?.username) {
                        igUsername = igData.username;
                    }
                } catch (e: any) {
                    logToFile(`[MetaService] Erro ao buscar username do IG ${p.instagram_business_account.id}: ${e?.message}`);
                }
            }

            result.push({
                id: p.id,
                name: p.name,
                access_token: p.access_token,
                instagram_business_account: {
                    id: p.instagram_business_account.id,
                    username: igUsername || p.instagram_business_account.name || `instagram_${p.instagram_business_account.id.substring(0, 6)}`,
                    name: p.instagram_business_account.name,
                    profile_picture_url: p.instagram_business_account.profile_picture_url,
                }
            });
        }

        return result;
    }

    /**
     * Inscreve o nosso App nos eventos da Página (mensagens diretas e comentários
     * do Instagram). Sem isso, nada chega no nosso webhook.
     */
    static async subscribePageToWebhooks(pageId: string, pageAccessToken: string) {
        // "comments" não é um campo válido para subscribed_apps de Página vinculada ao
        // Instagram (a Graph API rejeita o pedido inteiro com #100 "Param subscribed_fields[2]
        // must be one of {...}" e nada fica inscrito, nem "messages"). Mantemos só os campos
        // realmente suportados nesse contexto.
        const url = `${GRAPH_URL}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks`;
        return graphFetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${pageAccessToken}` },
        });
    }

    /** Envia uma mensagem de texto simples no Direct do Instagram. */
    static async sendInstagramMessage(pageId: string, pageAccessToken: string, recipientId: string, text: string) {
        const url = `${GRAPH_URL}/${pageId}/messages`;
        return graphFetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${pageAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
            }),
        });
    }

    /** Envia mídia (imagem/áudio/vídeo) por link público no Direct do Instagram. */
    static async sendInstagramMedia(
        pageId: string,
        pageAccessToken: string,
        recipientId: string,
        type: 'image' | 'audio' | 'video',
        link: string
    ) {
        const url = `${GRAPH_URL}/${pageId}/messages`;
        return graphFetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${pageAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { attachment: { type, payload: { url: link } } },
            }),
        });
    }

    /**
     * Cria o container de mídia para publicação no feed/reels do Instagram.
     * Passo 1 de 2 — depois é preciso chamar publishInstagramMedia com o ID retornado.
     */
    static async createInstagramMediaContainer(
        igUserId: string,
        pageAccessToken: string,
        params: { imageUrl?: string; videoUrl?: string; caption?: string; isReels?: boolean }
    ) {
        const url = `${GRAPH_URL}/${igUserId}/media`;
        const body: Record<string, string> = { access_token: pageAccessToken };
        if (params.caption) body.caption = params.caption;
        if (params.videoUrl) {
            body.video_url = params.videoUrl;
            body.media_type = params.isReels === false ? 'VIDEO' : 'REELS';
        } else if (params.imageUrl) {
            body.image_url = params.imageUrl;
        } else {
            throw new Error('É necessário informar imageUrl ou videoUrl para publicar.');
        }

        return graphFetch(url, { method: 'POST', body: new URLSearchParams(body) });
    }

    /** Publica o container de mídia criado anteriormente. Passo 2 de 2. */
    static async publishInstagramMedia(igUserId: string, pageAccessToken: string, creationId: string) {
        const url = `${GRAPH_URL}/${igUserId}/media_publish`;
        return graphFetch(url, {
            method: 'POST',
            body: new URLSearchParams({ creation_id: creationId, access_token: pageAccessToken }),
        });
    }
}
