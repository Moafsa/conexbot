"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Callback fixo (redirect_uri único, registrado uma vez no App da Meta) do fluxo
 * de OAuth dialog clássico usado para conectar o Instagram (Facebook Login for
 * Business, "API setup with Facebook login" — ver docs oficiais). Diferente do
 * WhatsApp (Embedded Signup via popup + postMessage), aqui a Meta redireciona a
 * página inteira de volta para cá com ?code=...&state=....
 *
 * O `state` carrega o contexto (bot/cliente, ou token do link público) que se
 * perderia na navegação de ida e volta pela Meta. Depois de processar o código
 * no backend, devolvemos o usuário para a página de origem.
 */
function InstagramCallbackContent() {
    const searchParams = useSearchParams();
    const [message, setMessage] = useState("Conectando sua conta do Instagram…");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const run = async () => {
            const code = searchParams.get('code');
            const stateRaw = searchParams.get('state');
            const oauthError = searchParams.get('error');
            const errorDescription = searchParams.get('error_description') || searchParams.get('error_reason');

            let state: { m: 'd' | 'p'; botId?: string; clientId?: string; token?: string } | null = null;
            if (stateRaw) {
                try {
                    state = JSON.parse(decodeURIComponent(stateRaw));
                } catch {
                    state = null;
                }
            }

            const goBack = (params: Record<string, string>) => {
                const qs = new URLSearchParams(params).toString();
                if (state?.m === 'p' && state.token) {
                    window.location.replace(`/connect/${state.token}?${qs}`);
                } else if (state?.botId) {
                    window.location.replace(`/dashboard/connect?botId=${state.botId}&clientId=${state.clientId || ''}&${qs}`);
                } else {
                    window.location.replace('/dashboard');
                }
            };

            if (!state) {
                setFailed(true);
                setMessage('Não foi possível identificar de onde veio essa conexão. Volte e tente novamente.');
                return;
            }

            if (oauthError) {
                setFailed(true);
                setMessage('Conexão cancelada ou negada pela Meta.');
                setTimeout(() => goBack({ activeTab: 'instagram', insta_error: errorDescription || 'Conexão cancelada antes de finalizar.' }), 1500);
                return;
            }

            if (!code) {
                setFailed(true);
                setMessage('Código de autorização não recebido da Meta.');
                setTimeout(() => goBack({ activeTab: 'instagram', insta_error: 'Código de autorização não recebido da Meta.' }), 1500);
                return;
            }

            const redirectUri = `${window.location.origin}/instagram/callback`;

            try {
                const endpoint = state.m === 'p' ? '/api/public/instagram/connect' : `/api/bots/${state.botId}/connect/instagram`;
                const body = state.m === 'p'
                    ? { token: state.token, code, redirectUri }
                    : { code, clientId: state.clientId, redirectUri };

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                const data = await res.json();

                if (res.ok) {
                    if (data.requiresSelection) {
                        setMessage('Múltiplas contas encontradas! Redirecionando para seleção…');
                        try {
                            sessionStorage.setItem('insta_available_accounts', JSON.stringify(data.availableAccounts));
                        } catch {}
                        goBack({
                            activeTab: 'instagram',
                            insta_select: 'true',
                        });
                    } else {
                        setMessage('Instagram conectado! Redirecionando…');
                        goBack({
                            activeTab: 'instagram',
                            insta_status: 'connected',
                            ...(data.username ? { insta_username: data.username } : {}),
                            ...(data.pageName ? { insta_page: data.pageName } : {}),
                        });
                    }
                } else {
                    setFailed(true);
                    setMessage(data.error || 'Falha ao conectar o Instagram.');
                    setTimeout(() => goBack({ activeTab: 'instagram', insta_error: data.error || 'Falha ao conectar o Instagram.' }), 1500);
                }
            } catch {
                setFailed(true);
                setMessage('Erro de rede ao finalizar a conexão.');
                setTimeout(() => goBack({ activeTab: 'instagram', insta_error: 'Erro de rede ao finalizar a conexão.' }), 1500);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-6">
            <div className="text-center space-y-4">
                {failed ? (
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                ) : (
                    <Loader2 className="w-10 h-10 text-fuchsia-500 mx-auto animate-spin" />
                )}
                <p className={`font-medium ${failed ? 'text-red-400' : 'text-gray-200'}`}>{message}</p>
                <p className="text-xs text-gray-500">Não feche esta página.</p>
            </div>
        </div>
    );
}

export default function InstagramCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
            <InstagramCallbackContent />
        </Suspense>
    );
}
