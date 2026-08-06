"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";

function WordPressConnectContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const shopUrl = searchParams.get("shop_url");
    const wpRedirectUri = searchParams.get("redirect_uri");

    const [status, setStatus] = useState<"loading" | "error" | "redirecting">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!shopUrl || !wpRedirectUri) {
            setStatus("error");
            setErrorMessage("Parâmetros de integração inválidos ou incompletos.");
            return;
        }

        const initOAuth = async () => {
            try {
                // 1. Get session details to verify login
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (!session || !session.user) {
                    // Redirect to login, but keep the current path so they come back after login!
                    const callbackUrl = window.location.href;
                    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                    return;
                }

                // 2. Register / Get Bot in SaaS database (validates the license / pairs the site)
                const tenantId = session.user.id;
                const registerRes = await fetch("/api/v1/wp/register-store", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ shopUrl, tenantId })
                });
                const registerData = await registerRes.json();

                if (!registerRes.ok || !registerData.botId) {
                    throw new Error(registerData.error || "Falha ao registrar loja no SaaS.");
                }

                setStatus("redirecting");

                // 3. Continue straight into the real Mercado Livre OAuth screen — this button
                // promises to both validate the license AND authenticate Mercado Livre in one
                // click, so licensing alone isn't enough here. account_id=0 tells the callback
                // this is a fresh "step 1" connection (not linking an existing WP account row),
                // and it reuses Conextbot's own centrally-configured ML app (GlobalConfig.mlClientId),
                // never the store's own domain/app.
                const oauthUrlRes = await fetch(
                    `/api/auth/mercadolivre/url-plugin?shop_url=${encodeURIComponent(shopUrl)}&redirect_uri=${encodeURIComponent(wpRedirectUri)}&account_id=0`
                );
                const oauthUrlData = await oauthUrlRes.json();

                if (!oauthUrlRes.ok || !oauthUrlData.url) {
                    throw new Error(oauthUrlData.error || "Loja vinculada, mas falhou ao iniciar a autenticação com o Mercado Livre.");
                }

                window.location.href = oauthUrlData.url;
            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err.message || "Erro desconhecido ao iniciar conexão com o SaaS.");
            }
        };

        initOAuth();
    }, [shopUrl, wpRedirectUri, router]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center space-y-6">
                {status === "loading" && (
                    <div className="space-y-4 my-6">
                        <RefreshCw className="animate-spin w-12 h-12 text-indigo-500 mx-auto" />
                        <h2 className="text-xl font-bold">Conectando ao SaaS...</h2>
                        <p className="text-gray-400 text-sm">Autenticando sua sessão do Conextbot.</p>
                    </div>
                )}

                {status === "redirecting" && (
                    <div className="space-y-4 my-6">
                        <RefreshCw className="animate-spin w-12 h-12 text-green-500 mx-auto" />
                        <h2 className="text-xl font-bold text-green-400">Loja Vinculada!</h2>
                        <p className="text-gray-400 text-sm">Redirecionando para você autorizar sua conta do Mercado Livre.</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-4 my-6">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                        <h2 className="text-xl font-bold text-red-400">Falha na Conexão</h2>
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                        <button onClick={() => router.push("/dashboard")} className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition" style={{ display: 'block', textDecoration: 'none' }}>
                            Ir para o Painel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WordPressConnectPage() {
    return (
        <Suspense fallback={<div className="text-white p-10 text-center">Carregando...</div>}>
            <WordPressConnectContent />
        </Suspense>
    );
}
