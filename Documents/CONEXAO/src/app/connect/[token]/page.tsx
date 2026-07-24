"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Smartphone, CheckCircle, RefreshCw, ArrowLeft, Globe, Facebook, Instagram, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";

type MetaConnectStep = 'idle' | 'authenticating' | 'registering' | 'connected' | 'error';

function PublicConnectPageContent({ metaAppId, metaConfigId, instagramConfigId }: { metaAppId: string | null; metaConfigId: string | null; instagramConfigId: string | null }) {
    const params = useParams();
    const token = params.token as string;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'whatsapp' | 'meta_whatsapp' | 'instagram'>('whatsapp');
    const [step, setStep] = useState<'generating' | 'qrcode' | 'connected'>('generating');
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");

    // Embedded Signup (popup oficial) states
    const [metaConnectStep, setMetaConnectStep] = useState<MetaConnectStep>('idle');
    const [metaConnectError, setMetaConnectError] = useState("");
    const [metaConnectedInfo, setMetaConnectedInfo] = useState<{ displayNumber?: string; verifiedName?: string } | null>(null);
    const waSignupIdsRef = useRef<{ wabaId?: string; phoneNumberId?: string; businessId?: string }>({});

    // Instagram (Facebook Login for Business, via Página vinculada)
    const [instaConnectStep, setInstaConnectStep] = useState<MetaConnectStep>('idle');
    const [instaConnectError, setInstaConnectError] = useState("");
    const [instaConnectedInfo, setInstaConnectedInfo] = useState<{ username?: string; pageName?: string } | null>(null);

    // Mesmo padrão do dashboard (ver comentário em src/app/dashboard/connect/page.tsx):
    // popup FB.login com config_id, em vez do redirect clássico que quebrava no
    // assistente "facebook_business_extension/oauth" da própria Meta.
    const handleInstagramLogin = () => {
        if (!metaAppId || !instagramConfigId) {
            setInstaConnectStep('error');
            setInstaConnectError('A conexão do Instagram ainda não foi configurada pelo administrador da plataforma.');
            return;
        }
        if (!token) {
            setInstaConnectStep('error');
            setInstaConnectError('Token de conexão não encontrado.');
            return;
        }
        if (!(window as any).FB) {
            setInstaConnectStep('error');
            setInstaConnectError('SDK do Facebook não carregado. Aguarde alguns segundos e tente novamente.');
            return;
        }

        setInstaConnectStep('authenticating');
        setInstaConnectError('');

        // Ver comentário equivalente em src/app/dashboard/connect/page.tsx: a
        // configuração "Geral" do Facebook Login for Business exige redirect_uri
        // idêntico no popup e na troca do código, mesmo sem navegação real.
        const redirectUri = `${window.location.origin}/instagram/callback`;

        (window as any).FB.login((response: any) => {
            if (response.authResponse && response.authResponse.code) {
                processInstagramCode(response.authResponse.code, redirectUri);
            } else {
                setInstaConnectStep('idle');
                console.log('Usuário cancelou o login ou não concluiu a autorização do Instagram.');
            }
        }, {
            config_id: instagramConfigId,
            response_type: 'code',
            override_default_response_type: true,
            redirect_uri: redirectUri,
        });
    };

    const processInstagramCode = async (code: string, redirectUri?: string) => {
        setInstaConnectStep('registering');
        try {
            const res = await fetch(`/api/public/instagram/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, code, redirectUri })
            });

            const data = await res.json();

            if (res.ok) {
                setInstaConnectedInfo({ username: data.username, pageName: data.pageName });
                setInstaConnectStep('connected');
            } else {
                setInstaConnectStep('error');
                setInstaConnectError(data.error || 'Falha na conexão automática do Instagram. Tente novamente.');
            }
        } catch (e) {
            setInstaConnectStep('error');
            setInstaConnectError('Erro de rede ao processar a conexão do Instagram. Verifique sua internet e tente novamente.');
        }
    };

    // Retorno do /instagram/callback — não há um fetch de canais existente nesta
    // página pública, então o status vem inteiramente pela query string.
    useEffect(() => {
        const tab = searchParams.get('activeTab');
        if (tab === 'whatsapp' || tab === 'meta_whatsapp' || tab === 'instagram') {
            setActiveTab(tab);
        }
        const instaError = searchParams.get('insta_error');
        const instaStatus = searchParams.get('insta_status');
        if (instaError) {
            setInstaConnectStep('error');
            setInstaConnectError(instaError);
        } else if (instaStatus === 'connected') {
            setInstaConnectStep('connected');
            setInstaConnectedInfo({
                username: searchParams.get('insta_username') || undefined,
                pageName: searchParams.get('insta_page') || undefined,
            });
        }
        if (tab || instaError || instaStatus) {
            router.replace(`/connect/${token}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const allowedOrigins = ['https://www.facebook.com', 'https://web.facebook.com'];
            if (!allowedOrigins.includes(event.origin)) return;
            let data: any;
            try {
                data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            } catch {
                return;
            }
            if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;

            if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA') {
                const { phone_number_id, waba_id, business_id } = data.data || {};
                waSignupIdsRef.current = { wabaId: waba_id, phoneNumberId: phone_number_id, businessId: business_id };
            } else if (data.event === 'CANCEL') {
                setMetaConnectStep('idle');
                setMetaConnectError('Conexão cancelada antes de finalizar. Você pode tentar novamente quando quiser.');
            } else if (data.event === 'ERROR') {
                setMetaConnectStep('error');
                setMetaConnectError(data.data?.error_message || 'A Meta retornou um erro durante o cadastro do número.');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleMetaLogin = () => {
        if (!metaAppId || !metaConfigId) {
            setMetaConnectStep('error');
            setMetaConnectError('A conexão oficial ainda não foi configurada pelo administrador da plataforma.');
            return;
        }
        if (!(window as any).FB) {
            setMetaConnectStep('error');
            setMetaConnectError('SDK do Facebook não carregado. Aguarde alguns segundos e tente novamente.');
            return;
        }

        setMetaConnectStep('authenticating');
        setMetaConnectError('');
        waSignupIdsRef.current = {};

        (window as any).FB.login((response: any) => {
            if (response.authResponse && response.authResponse.code) {
                processMetaCode(response.authResponse.code);
            } else {
                setMetaConnectStep('idle');
            }
        }, {
            config_id: metaConfigId,
            response_type: 'code',
            override_default_response_type: true,
            extras: { setup: {} }
        });
    };

    const processMetaCode = async (code: string) => {
        setMetaConnectStep('registering');
        try {
            await new Promise(r => setTimeout(r, 400));
            const res = await fetch('/api/public/whatsapp-meta/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    code,
                    wabaId: waSignupIdsRef.current.wabaId,
                    phoneNumberId: waSignupIdsRef.current.phoneNumberId,
                    businessId: waSignupIdsRef.current.businessId,
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMetaConnectedInfo({ displayNumber: data.displayNumber, verifiedName: data.verifiedName });
                setMetaConnectStep('connected');
            } else {
                setMetaConnectStep('error');
                setMetaConnectError(data.error || 'Falha na conexão automática. Tente novamente.');
            }
        } catch (e) {
            setMetaConnectStep('error');
            setMetaConnectError('Erro de rede ao processar a conexão. Verifique sua internet e tente novamente.');
        }
    };

    useEffect(() => {
        if (!token) {
            setError("Token de conexão não encontrado.");
            return;
        }

        const startSession = async () => {
            try {
                const res = await fetch('/api/whatsapp/connect', {
                    method: 'POST',
                    body: JSON.stringify({ token }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (res.ok) {
                    if (data.status === 'CONNECTED') {
                        setStep('connected');
                    } else {
                        if (data.qrCodeUrl) setQrCodeData(data.qrCodeUrl);
                        setStep('qrcode');
                    }
                } else {
                    setError(data.error || "Erro ao iniciar sessão.");
                }
            } catch (e) {
                console.error("Failed to start session", e);
                setError("Falha de conexão com o servidor.");
            }
        };

        if (step === 'generating' && activeTab === 'whatsapp') {
            startSession();
        }

        // Poll for status
        const interval = setInterval(async () => {
            if (activeTab !== 'whatsapp' || step === 'connected') return;
            try {
                const res = await fetch(`/api/whatsapp/status?token=${token}`);
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
    }, [token, activeTab]);

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowLeft size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h2>
                    <p className="text-red-400 mb-6">{error}</p>
                    <p className="text-gray-500 text-sm">Este link pode ter expirado ou o agente não está mais disponível.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-indigo-500/30 py-10">
            <div className="max-w-md w-full relative my-auto">
                {/* Decorative background Elements */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="glass rounded-[2rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Smartphone size={40} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-3 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Conectar WhatsApp
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                            Escolha a forma de conectar seu WhatsApp ao agente inteligente.
                        </p>
                    </div>

                    <div className="flex gap-2 mb-6 justify-center">
                        <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                            Escanear QR Code
                        </button>
                        <button onClick={() => setActiveTab('meta_whatsapp')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'meta_whatsapp' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                            WhatsApp Oficial (Meta)
                        </button>
                        <button onClick={() => setActiveTab('instagram')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'instagram' ? 'bg-fuchsia-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                            Instagram
                        </button>
                    </div>

                    {activeTab === 'whatsapp' && (
                        <>
                            <div className="bg-white rounded-[1.5rem] p-6 mb-8 shadow-inner relative group">
                                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]"></div>

                                <div className="flex flex-col items-center justify-center min-h-[280px] relative z-10 w-full">
                                    {(step === 'generating' || (step === 'qrcode' && !qrCodeData)) && (
                                        <div className="flex flex-col items-center gap-4 text-black w-full my-10">
                                            <div className="relative">
                                                <RefreshCw size={48} className="animate-spin text-indigo-600" />
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse"></div>
                                            </div>
                                            <p className="font-bold text-lg text-indigo-900 text-center">Gerando Conexão...</p>
                                        </div>
                                    )}

                                    {step === 'qrcode' && qrCodeData && (
                                        <div className="text-center animate-in fade-in zoom-in duration-500 w-full">
                                            <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white p-1 mx-auto mb-4 rounded-lg flex items-center justify-center border-4 border-gray-50">
                                                <img
                                                    src={qrCodeData}
                                                    alt="WhatsApp QR Code"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                <Globe size={10} /> Link Seguro Ativo
                                            </div>
                                        </div>
                                    )}

                                    {step === 'connected' && (
                                        <div className="flex flex-col items-center gap-6 text-emerald-600 animate-in bounce-in duration-500">
                                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                                <CheckCircle size={56} className="text-emerald-500" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-2xl font-black text-emerald-900">Conectado!</h3>
                                                <p className="text-emerald-700/60 text-sm mt-1">Seu agente já está operando.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-white/10 group">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-110 transition-transform">1</div>
                                    <p className="text-xs text-gray-400 leading-snug">
                                        Abra o **WhatsApp** no seu aparelho celular.
                                    </p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-white/10 group">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-110 transition-transform">2</div>
                                    <p className="text-xs text-gray-400 leading-snug">
                                        Vá em **Configurações** {'>'} **Aparelhos Conectados**.
                                    </p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-4 transition-all hover:bg-white/10 group">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-110 transition-transform">3</div>
                                    <p className="text-xs text-gray-400 leading-snug">
                                        Clique em **Conectar um Aparelho** e aponte para o código acima.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'meta_whatsapp' && (
                        <div className="space-y-5">
                            {metaConnectStep === 'connected' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                                    <h4 className="font-bold text-emerald-300 text-lg">Número conectado!</h4>
                                    {metaConnectedInfo?.displayNumber && (
                                        <p className="text-sm text-emerald-200">
                                            {metaConnectedInfo.verifiedName ? `${metaConnectedInfo.verifiedName} — ` : ''}
                                            <span className="font-mono">{metaConnectedInfo.displayNumber}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-emerald-200/70">
                                        Pode levar 1-2 minutos até as primeiras mensagens fluírem normalmente.
                                    </p>
                                </div>
                            )}

                            {(metaConnectStep === 'authenticating' || metaConnectStep === 'registering') && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-center space-y-3">
                                    <Loader2 className="w-10 h-10 text-blue-400 mx-auto animate-spin" />
                                    <p className="font-medium text-blue-200 text-sm">
                                        {metaConnectStep === 'authenticating'
                                            ? 'Aguardando login e seleção do número na janela da Meta…'
                                            : 'Registrando o número e ativando o webhook…'}
                                    </p>
                                    <p className="text-xs text-blue-300/70">Não feche esta página.</p>
                                </div>
                            )}

                            {metaConnectStep === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-300">Não foi possível concluir a conexão</p>
                                        <p className="text-xs text-red-300/80 mt-1">{metaConnectError}</p>
                                    </div>
                                </div>
                            )}

                            {(metaConnectStep === 'idle' || metaConnectStep === 'error') && (
                                <>
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-sm text-blue-100 space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-blue-300" />
                                            Como funciona
                                        </p>
                                        <ol className="list-decimal pl-5 space-y-1 text-blue-200/90 text-xs">
                                            <li>Clique em <b>Conectar com Facebook</b> abaixo.</li>
                                            <li>Faça login com a conta que administra o seu WhatsApp Business.</li>
                                            <li>Escolha ou crie o número na janela da Meta.</li>
                                            <li>Pronto — nenhuma outra configuração é necessária.</li>
                                        </ol>
                                    </div>

                                    <button
                                        onClick={handleMetaLogin}
                                        disabled={!metaAppId || !metaConfigId}
                                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Facebook size={20} />
                                        <span>Conectar com Facebook</span>
                                    </button>
                                    {(!metaAppId || !metaConfigId) && (
                                        <p className="text-[11px] text-red-400 text-center">
                                            Conexão automática ainda não configurada. Peça para a agência usar a opção de QR Code.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'instagram' && (
                        <div className="space-y-5">
                            {instaConnectStep === 'connected' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                                    <h4 className="font-bold text-emerald-300 text-lg">Instagram conectado!</h4>
                                    {instaConnectedInfo?.username && (
                                        <p className="text-sm text-emerald-200">@{instaConnectedInfo.username}</p>
                                    )}
                                    <p className="text-xs text-emerald-200/70">
                                        Seu agente já pode responder Directs automaticamente.
                                    </p>
                                </div>
                            )}

                            {(instaConnectStep === 'authenticating' || instaConnectStep === 'registering') && (
                                <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-6 text-center space-y-3">
                                    <Loader2 className="w-10 h-10 text-fuchsia-400 mx-auto animate-spin" />
                                    <p className="font-medium text-fuchsia-200 text-sm">
                                        {instaConnectStep === 'authenticating'
                                            ? 'Aguardando login e seleção da Página na janela da Meta…'
                                            : 'Ativando o webhook e finalizando a conexão…'}
                                    </p>
                                    <p className="text-xs text-fuchsia-300/70">Não feche esta página.</p>
                                </div>
                            )}

                            {instaConnectStep === 'error' && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-300">Não foi possível concluir a conexão</p>
                                        <p className="text-xs text-red-300/80 mt-1">{instaConnectError}</p>
                                    </div>
                                </div>
                            )}

                            {(instaConnectStep === 'idle' || instaConnectStep === 'error') && (
                                <>
                                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-4 rounded-2xl text-sm text-fuchsia-100 space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-fuchsia-300" />
                                            Como funciona
                                        </p>
                                        <ol className="list-decimal pl-5 space-y-1 text-fuchsia-200/90 text-xs">
                                            <li>Clique em <b>Conectar com Instagram</b> abaixo.</li>
                                            <li>Faça login com a conta que administra a Página do Facebook vinculada ao seu Instagram.</li>
                                            <li>Sua conta Instagram precisa ser Profissional (Business/Creator).</li>
                                            <li>Pronto — nenhuma outra configuração é necessária.</li>
                                        </ol>
                                    </div>

                                    <button
                                        onClick={handleInstagramLogin}
                                        disabled={!metaAppId}
                                        className="w-full flex items-center justify-center gap-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-fuchsia-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Instagram size={20} />
                                        <span>Conectar com Instagram</span>
                                    </button>
                                    {!metaAppId && (
                                        <p className="text-[11px] text-red-400 text-center">
                                            Conexão automática ainda não configurada. Peça para a agência.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-[10px] text-gray-600 uppercase tracking-tighter font-medium">
                            Powered by ConextBot AI Intelligence
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PublicConnectPage() {
    const [metaAppId, setMetaAppId] = useState<string | null>(null);
    const [metaConfigId, setMetaConfigId] = useState<string | null>(null);
    const [instagramConfigId, setInstagramConfigId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/config/meta')
            .then(res => res.json())
            .then(data => {
                setMetaAppId(data.appId);
                setMetaConfigId(data.configId);
                setInstagramConfigId(data.instagramConfigId);
            })
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
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-bold animate-pulse">Iniciando Conexão Segura...</div>}>
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
            <PublicConnectPageContent metaAppId={metaAppId} metaConfigId={metaConfigId} instagramConfigId={instagramConfigId} />
        </Suspense>
    );
}
