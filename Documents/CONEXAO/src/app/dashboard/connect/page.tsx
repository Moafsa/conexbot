"use client";

import { useEffect, useState, Suspense } from "react";
import { Smartphone, CheckCircle, RefreshCw, ArrowLeft, Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";

function ConnectPageContent({ metaAppId }: { metaAppId: string | null }) {
    const searchParams = useSearchParams();
    const botId = searchParams.get('botId');
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'whatsapp' | 'meta_whatsapp' | 'instagram' | 'webhook'>('whatsapp');
    const [step, setStep] = useState<'generating' | 'qrcode' | 'connected'>('generating');
    const [sessionName, setSessionName] = useState("");
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");
    const [webhookBaseUrl, setWebhookBaseUrl] = useState("");

    // Meta API Form States
    const [metaPhoneId, setMetaPhoneId] = useState("");
    const [metaToken, setMetaToken] = useState("");
    const [instaAccountId, setInstaAccountId] = useState("");
    const [instaToken, setInstaToken] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleMetaLogin = () => {
        if (!metaAppId) {
            alert("Meta App ID não configurado no sistema. Contate o suporte.");
            return;
        }

        if (!(window as any).FB) {
            alert("SDK do Facebook não carregado. Tente novamente em instantes.");
            return;
        }

        (window as any).FB.login((response: any) => {
            if (response.authResponse) {
                const code = response.authResponse.code;
                if (code) {
                    processMetaCode(code);
                } else {
                    alert("Falha ao obter código de autorização da Meta.");
                }
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, {
            scope: 'whatsapp_business_management,whatsapp_business_messaging,instagram_basic,instagram_manage_messages',
            extras: {
                feature: 'whatsapp_embedded_signup',
                setup: {
                    // Custom config if needed
                }
            }
        });
    };

    const processMetaCode = async (code: string) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/bots/${botId}/connect/meta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Conectado com sucesso ao número: ${data.displayNumber}`);
                setStep('connected');
            } else {
                const data = await res.json();
                alert(`Erro: ${data.error || "Falha na conexão automática"}`);
            }
        } catch (e) {
            alert("Erro ao processar conexão.");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        setWebhookBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        if (!botId) {
            setError("Bot ID não encontrado na URL.");
            return;
        }

        // Fetch existing channels
        const fetchChannels = async () => {
            try {
                const res = await fetch(`/api/bots/${botId}/channels`);
                if (res.ok) {
                    const channels = await res.json();
                    const metaWa = channels.find((c: any) => c.provider === 'META_WHATSAPP');
                    if (metaWa) {
                        setMetaPhoneId(metaWa.identifier || "");
                    }
                    const insta = channels.find((c: any) => c.provider === 'INSTAGRAM');
                    if (insta) {
                        setInstaAccountId(insta.identifier || "");
                    }
                }
            } catch (e) {
                console.error("Error fetching channels", e);
            }
        };
        fetchChannels();

        // Wuzapi polling
        if (activeTab === 'whatsapp' && step === 'generating') {
            const startSession = async () => {
                try {
                    const res = await fetch('/api/whatsapp/connect', {
                        method: 'POST',
                        body: JSON.stringify({ botId }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    const data = await res.json();

                    if (res.ok) {
                        setSessionName(data.session);
                        if (data.qrCodeUrl) setQrCodeData(data.qrCodeUrl);
                        setStep('qrcode');
                    } else {
                        setError(data.error || "Erro ao iniciar sessão.");
                    }
                } catch (e) {
                    console.error("Failed to start session", e);
                    setError("Falha de conexão.");
                }
            };
            startSession();
        }

        const interval = setInterval(async () => {
            if (step === 'connected' || activeTab !== 'whatsapp') {
                clearInterval(interval);
                return;
            }

            try {
                const res = await fetch(`/api/whatsapp/status?botId=${botId}`);
                const data = await res.json();

                if (res.ok) {
                    if (data.status === 'CONNECTED') {
                        setStep('connected');
                        clearInterval(interval);
                    } else if (data.status === 'QRCODE' || data.status === 'GENERATING_QR' || data.status === 'DISCONNECTED') {
                        if (data.qrCodeUrl) {
                            setQrCodeData(data.qrCodeUrl);
                            setStep('qrcode');
                        }
                    }
                }
            } catch (e) {
                console.error("Polling error:", e);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [botId, step, activeTab]);

    const handleSaveMetaChannel = async (provider: string, identifier: string, token: string) => {
        if (!identifier || !token) {
            alert("Preencha todos os campos.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/bots/${botId}/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    identifier,
                    credentials: { accessToken: token }
                })
            });

            if (res.ok) {
                alert("Canal configurado com sucesso!");
            } else {
                alert("Erro ao salvar canal.");
            }
        } catch (e) {
            alert("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Link href={`/dashboard/bots/${botId}`} className="btn-secondary">Voltar</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-10">
            <div className="max-w-2xl w-full glass rounded-3xl p-8 border border-white/10 relative my-auto">
                <Link href={`/dashboard/bots/${botId}`} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </Link>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                        <Smartphone size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Canais de Atendimento</h2>
                    <p className="text-gray-400">Escolha por onde seu agente deve responder.</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        WhatsApp Aparelho
                    </button>
                    <button onClick={() => setActiveTab('meta_whatsapp')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'meta_whatsapp' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        WhatsApp Oficial (Meta)
                    </button>
                    <button onClick={() => setActiveTab('instagram')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'instagram' ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        Instagram
                    </button>
                    <button onClick={() => setActiveTab('webhook')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'webhook' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        Webhook
                    </button>
                </div>

                <div className="bg-white rounded-xl p-6 relative overflow-hidden w-full text-black">
                    {/* WUZAPI */}
                    {activeTab === 'whatsapp' && (
                        <div className="flex flex-col items-center justify-center min-h-[300px]">
                            {(step === 'generating' || (step === 'qrcode' && !qrCodeData)) && (
                                <div className="flex flex-col items-center gap-4 text-black w-full my-10">
                                    <RefreshCw size={40} className="animate-spin text-gray-400" />
                                    <p className="font-medium animate-pulse text-center">Gerando QRCode Seguro...</p>
                                </div>
                            )}
                            {step === 'qrcode' && qrCodeData && (
                                <div className="text-center animate-fade-in w-full">
                                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white p-2 mx-auto mb-4 rounded-lg flex items-center justify-center overflow-hidden border">
                                        <img src={qrCodeData} alt="WhatsApp QR Code" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/250?text=Aguardando+QR...'; }} />
                                    </div>
                                    <p className="text-xs text-gray-500">Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Escanear QR Code</p>
                                    <button onClick={() => window.location.reload()} className="mt-4 text-xs text-indigo-400 hover:underline">Atualizar</button>
                                </div>
                            )}
                            {step === 'connected' && (
                                <div className="flex flex-col items-center gap-4 text-green-600 animate-fade-in">
                                    <CheckCircle size={64} />
                                    <h3 className="text-xl font-bold">Conectado com Sucesso!</h3>
                                    <Link href={`/dashboard/bots/${botId}`} className="btn-primary mt-4">Voltar ao Agente</Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* META WHATSAPP */}
                    {activeTab === 'meta_whatsapp' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <Facebook className="w-6 h-6 text-blue-600" />
                                <h3 className="font-bold text-lg text-gray-800">WhatsApp API Oficial (Cloud)</h3>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 space-y-3">
                                <p className="font-semibold">Tutorial de Configuração:</p>
                                <ol className="list-decimal pl-5 space-y-1">
                                    <li>Crie um App em <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline">Meta for Developers</a>.</li>
                                    <li>Adicione o produto <b>WhatsApp</b> ao seu app.</li>
                                    <li>Configure o Webhook com a URL: <code className="bg-blue-100 px-1 py-0.5 rounded select-all break-all">{webhookBaseUrl}/api/webhooks/meta</code></li>
                                    <li>Use o Verify Token: <code className="bg-blue-100 px-1 py-0.5 rounded select-all">CONEXT_META_VERIFY</code></li>
                                    <li>Assine o evento de webhook: <b>messages</b>.</li>
                                    <li>Cole abaixo o Token de Acesso permanente e o ID do Número de Telefone gerados no painel.</li>
                                </ol>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID do Número de Telefone (Meta)</label>
                                    <input 
                                        type="text" 
                                        value={metaPhoneId} 
                                        onChange={e => setMetaPhoneId(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                                        placeholder="Ex: 101234567890123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Token da Meta</label>
                                    <input 
                                        type="password" 
                                        value={metaToken} 
                                        onChange={e => setMetaToken(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                                        placeholder="EAAL..."
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSaveMetaChannel('META_WHATSAPP', metaPhoneId, metaToken)}
                                    disabled={isSaving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar e Conectar'}
                                </button>
                            </div>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-400 font-bold">OU</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-700">Conexão Automática</h4>
                                <p className="text-[10px] text-gray-500">Forma recomendada: faça login com sua conta do Facebook e escolha o número.</p>
                                <button 
                                    onClick={handleMetaLogin}
                                    disabled={isSaving || !metaAppId}
                                    className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    <Facebook size={20} />
                                    <span>Conectar com Facebook</span>
                                </button>
                                {!metaAppId && <p className="text-[9px] text-red-500 text-center">App ID global não configurado.</p>}
                            </div>
                        </div>
                    )}

                    {/* INSTAGRAM */}
                    {activeTab === 'instagram' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <Instagram className="w-6 h-6 text-fuchsia-600" />
                                <h3 className="font-bold text-lg text-gray-800">Instagram Direct</h3>
                            </div>
                            
                            <div className="bg-fuchsia-50 border border-fuchsia-100 p-4 rounded-lg text-sm text-fuchsia-800 space-y-3">
                                <p className="font-semibold">Tutorial de Configuração:</p>
                                <ol className="list-decimal pl-5 space-y-1">
                                    <li>Crie um App em <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline">Meta for Developers</a>.</li>
                                    <li>Adicione o produto <b>Instagram Graph API</b> ao seu app.</li>
                                    <li>Configure o Webhook com a URL: <code className="bg-fuchsia-100 px-1 py-0.5 rounded select-all break-all">{webhookBaseUrl}/api/webhooks/meta</code></li>
                                    <li>Use o Verify Token: <code className="bg-fuchsia-100 px-1 py-0.5 rounded select-all">CONEXT_META_VERIFY</code></li>
                                    <li>Assine os eventos: <b>messages</b> e <b>messaging_postbacks</b>.</li>
                                    <li>Cole abaixo o Token de Acesso da Página e o ID da Conta do Instagram.</li>
                                </ol>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID da Conta do Instagram</label>
                                    <input 
                                        type="text" 
                                        value={instaAccountId} 
                                        onChange={e => setInstaAccountId(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                                        placeholder="Ex: 17841400000000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Token da Meta</label>
                                    <input 
                                        type="password" 
                                        value={instaToken} 
                                        onChange={e => setInstaToken(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                                        placeholder="EAAL..."
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSaveMetaChannel('INSTAGRAM', instaAccountId, instaToken)}
                                    disabled={isSaving}
                                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-2 rounded-lg transition"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar e Conectar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* WEBHOOK */}
                    {activeTab === 'webhook' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Integração Webhook Nativo</h3>
                            <p className="text-sm text-gray-600">Para conectar via Chatwoot, n8n ou Make.</p>
                            <div className="bg-gray-100 p-3 rounded border border-gray-200 text-xs font-mono break-all text-blue-600 select-all">
                                {webhookBaseUrl}/api/webhooks/generic{botId ? `?token=SEU_TOKEN_AQUI` : ''}
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p><strong>1.</strong> Vá nas Configurações deste agente.</p>
                                <p><strong>2.</strong> Adicione a URL do Chatwoot (ou n8n) em Webhook URL.</p>
                                <p><strong>3.</strong> Defina um Token, salve, e cole a URL acima no seu sistema substituindo SEU_TOKEN_AQUI.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ConnectPage() {
    const [metaAppId, setMetaAppId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/config/meta')
            .then(res => res.json())
            .then(data => setMetaAppId(data.appId))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (metaAppId && (window as any).FB) {
            (window as any).FB.init({
                appId: metaAppId,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v22.0'
            });
        }
    }, [metaAppId]);

    return (
        <Suspense fallback={<div className="text-white p-10">Carregando...</div>}>
            <Script
                src="https://connect.facebook.net/pt_BR/sdk.js"
                strategy="afterInteractive"
                onLoad={() => {
                    if (metaAppId && (window as any).FB) {
                        (window as any).FB.init({
                            appId: metaAppId,
                            autoLogAppEvents: true,
                            xfbml: true,
                            version: 'v22.0'
                        });
                    }
                }}
            />
            <ConnectPageContent metaAppId={metaAppId} />
        </Suspense>
    );
}
