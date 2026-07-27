"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Smartphone, CheckCircle, RefreshCw, ArrowLeft, Facebook, Instagram, ShieldCheck, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";

type MetaConnectStep = 'idle' | 'authenticating' | 'registering' | 'connected' | 'error' | 'select_account';

function ConnectPageContent({ metaAppId, metaConfigId, instagramConfigId }: { metaAppId: string | null; metaConfigId: string | null; instagramConfigId: string | null }) {
    const searchParams = useSearchParams();
    const botId = searchParams.get('botId');
    const clientId = searchParams.get('clientId');
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'whatsapp' | 'meta_whatsapp' | 'instagram' | 'webhook'>('whatsapp');
    const [step, setStep] = useState<'generating' | 'qrcode' | 'connected'>('generating');
    const [sessionName, setSessionName] = useState("");
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");
    const [webhookBaseUrl, setWebhookBaseUrl] = useState("");

    // Meta API Form States (fallback manual)
    const [metaPhoneId, setMetaPhoneId] = useState("");
    const [metaWabaId, setMetaWabaId] = useState("");
    const [metaToken, setMetaToken] = useState("");
    const [instaAccountId, setInstaAccountId] = useState("");
    const [instaToken, setInstaToken] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showManualFallback, setShowManualFallback] = useState(false);

    // Embedded Signup (popup oficial) states
    const [metaConnectStep, setMetaConnectStep] = useState<MetaConnectStep>('idle');
    const [metaConnectError, setMetaConnectError] = useState("");
    const [metaConnectedInfo, setMetaConnectedInfo] = useState<{ displayNumber?: string; verifiedName?: string } | null>(null);
    // Usamos ref (não state) porque o callback do FB.login é assíncrono e fecha sobre
    // valores "congelados" no momento do clique — um state aqui ficaria sempre vazio
    // por causa do stale closure. A ref sempre reflete o valor mais recente.
    const waSignupIdsRef = useRef<{ wabaId?: string; phoneNumberId?: string; businessId?: string }>({});

    // Instagram (Facebook Login for Business, via Página vinculada) — mesmo padrão do WhatsApp
    const [instaConnectStep, setInstaConnectStep] = useState<MetaConnectStep>('idle');
    const [instaConnectError, setInstaConnectError] = useState("");
    const [instaConnectedInfo, setInstaConnectedInfo] = useState<{ username?: string; pageName?: string } | null>(null);
    const [availableInstaAccounts, setAvailableInstaAccounts] = useState<any[]>([]);
    const [instaPostImageUrl, setInstaPostImageUrl] = useState("");
    const [instaPostCaption, setInstaPostCaption] = useState("");
    const [instaPosting, setInstaPosting] = useState(false);
    const [instaPostMessage, setInstaPostMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Captura os IDs (WABA, phone number, business) diretamente do popup via postMessage.
    // Esse é o método oficial recomendado pela Meta — mais rápido e confiável do que
    // consultar a API depois (evita ambiguidade quando a conta gerencia vários negócios).
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
            setMetaConnectError('A conexão oficial ainda não foi configurada pelo administrador (App ID / Configuration ID da Meta ausentes).');
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
                console.log('Usuário cancelou o login ou não concluiu a autorização.');
            }
        }, {
            config_id: metaConfigId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
                setup: {}
            }
        });
    };

    const processMetaCode = async (code: string) => {
        setMetaConnectStep('registering');
        try {
            // Pequena espera para dar tempo do evento postMessage (com os IDs) chegar
            // antes de disparamos a chamada — o popup dispara o FINISH um instante
            // antes/depois do callback do FB.login, a ordem não é garantida.
            await new Promise(r => setTimeout(r, 400));

            const res = await fetch(`/api/bots/${botId}/connect/meta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    wabaId: waSignupIdsRef.current.wabaId,
                    phoneNumberId: waSignupIdsRef.current.phoneNumberId,
                    businessId: waSignupIdsRef.current.businessId,
                    clientId,
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMetaConnectedInfo({ displayNumber: data.displayNumber, verifiedName: data.verifiedName });
                setMetaConnectStep('connected');
                setMetaPhoneId(data.phoneId || '');
            } else {
                setMetaConnectStep('error');
                setMetaConnectError(data.error || 'Falha na conexão automática. Tente novamente.');
            }
        } catch (e) {
            setMetaConnectStep('error');
            setMetaConnectError('Erro de rede ao processar a conexão. Verifique sua internet e tente novamente.');
        }
    };

    // Instagram usa o mesmo padrão do WhatsApp: popup FB.login com config_id (Facebook
    // Login for Business), em vez do redirect clássico de página inteira. O redirect
    // clássico com extras.setup.channel=IG_API_ONBOARDING passa pelo assistente
    // "facebook_business_extension/oauth" hospedado pela própria Meta, que vinha
    // retornando "Sorry, something went wrong" de forma consistente (bug/instabilidade
    // do lado da Meta nesse assistente, não do nosso código). O popup com config_id
    // evita esse assistente inteiramente e usa exatamente as mesmas 6 permissões
    // (configuração "Conextbot Instagram Business Login" no painel da Meta).
    const handleInstagramLogin = () => {
        if (!metaAppId) {
            setInstaConnectStep('error');
            setInstaConnectError('A conexão do Instagram ainda não foi configurada pelo administrador (App ID ausente).');
            return;
        }
        if (!botId) {
            setInstaConnectStep('error');
            setInstaConnectError('Bot ID não encontrado.');
            return;
        }

        setInstaConnectStep('authenticating');
        setInstaConnectError('');

        const redirectUri = `${window.location.origin}/instagram/callback`;
        const scope = 'public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_messages,instagram_manage_comments,instagram_content_publish';
        const state = encodeURIComponent(JSON.stringify({
            m: 'd',
            botId,
            clientId: clientId || ''
        }));

        const url = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&auth_type=rerequest`;

        window.location.href = url;
    };

    const handleDisconnectInstagram = async () => {
        try {
            const url = clientId 
                ? `/api/bots/${botId}/channels?provider=INSTAGRAM&clientId=${clientId}` 
                : `/api/bots/${botId}/channels?provider=INSTAGRAM`;
            await fetch(url, { method: 'DELETE' });
            setInstaConnectStep('idle');
            setInstaConnectedInfo(null);
            try {
                sessionStorage.removeItem('insta_available_accounts');
            } catch {}
        } catch (e) {
            console.error("Falha ao desconectar Instagram:", e);
        }
    };

    const handleSelectInstagramAccount = async (account: any) => {
        setInstaConnectStep('registering');
        try {
            const res = await fetch(`/api/bots/${botId}/connect/instagram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, accountSelectionData: account })
            });

            const data = await res.json();

            if (res.ok) {
                setInstaConnectedInfo({ username: data.username, pageName: data.pageName });
                setInstaConnectStep('connected');
                try {
                    sessionStorage.removeItem('insta_available_accounts');
                } catch {}
            } else {
                setInstaConnectStep('error');
                setInstaConnectError(data.error || 'Falha ao conectar a conta do Instagram selecionada.');
            }
        } catch (e) {
            setInstaConnectStep('error');
            setInstaConnectError('Erro de rede ao selecionar a conta do Instagram.');
        }
    };

    const processInstagramCode = async (code: string, redirectUri?: string) => {
        setInstaConnectStep('registering');
        try {
            const res = await fetch(`/api/bots/${botId}/connect/instagram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, clientId, redirectUri })
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

    const handlePublishInstagramPost = async () => {
        if (!instaPostImageUrl) {
            setInstaPostMessage({ type: 'error', text: 'Informe a URL da imagem a publicar.' });
            return;
        }
        setInstaPosting(true);
        setInstaPostMessage(null);
        try {
            const res = await fetch(`/api/bots/${botId}/instagram/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: instaPostImageUrl, caption: instaPostCaption, clientId })
            });
            const data = await res.json();
            if (res.ok) {
                setInstaPostMessage({ type: 'success', text: 'Publicado com sucesso no Instagram!' });
                setInstaPostImageUrl("");
                setInstaPostCaption("");
            } else {
                setInstaPostMessage({ type: 'error', text: data.error || 'Falha ao publicar.' });
            }
        } catch (e) {
            setInstaPostMessage({ type: 'error', text: 'Erro de rede ao publicar.' });
        } finally {
            setInstaPosting(false);
        }
    };

    useEffect(() => {
        setWebhookBaseUrl(window.location.origin);
    }, []);

    // Retorno do /instagram/callback (redirect da Meta) — o status real da conexão
    // já é lido do banco pelo fetchChannels abaixo; aqui só tratamos erro e a aba ativa.
    useEffect(() => {
        const tab = searchParams.get('activeTab');
        if (tab === 'whatsapp' || tab === 'meta_whatsapp' || tab === 'instagram' || tab === 'webhook') {
            setActiveTab(tab);
        }
        const instaError = searchParams.get('insta_error');
        const instaStatus = searchParams.get('insta_status');
        const instaSelect = searchParams.get('insta_select');

        if (instaError) {
            setInstaConnectStep('error');
            setInstaConnectError(instaError);
        } else if (instaStatus === 'connected') {
            setInstaConnectStep('connected');
            setInstaConnectedInfo({
                username: searchParams.get('insta_username') || undefined,
                pageName: searchParams.get('insta_page') || undefined,
            });
        } else if (instaSelect === 'true') {
            try {
                const stored = sessionStorage.getItem('insta_available_accounts');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAvailableInstaAccounts(parsed);
                        setInstaConnectStep('select_account');
                    }
                }
            } catch {}
        }
        if (tab || instaError || instaStatus || instaSelect) {
            const params = new URLSearchParams();
            if (botId) params.set('botId', botId);
            if (clientId) params.set('clientId', clientId);
            router.replace(`/dashboard/connect?${params.toString()}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!botId) {
            setError("Bot ID não encontrado na URL.");
            return;
        }

        // Fetch existing channels
        const fetchChannels = async () => {
            try {
                const channelsUrl = clientId ? `/api/bots/${botId}/channels?clientId=${clientId}` : `/api/bots/${botId}/channels`;
                const res = await fetch(channelsUrl);
                if (res.ok) {
                    const channels = await res.json();
                    const metaWa = channels.find((c: any) => c.provider === 'META_WHATSAPP');
                    if (metaWa) {
                        setMetaPhoneId(metaWa.identifier || "");
                        if (metaWa.status === 'CONNECTED') {
                            setMetaConnectStep('connected');
                            setMetaConnectedInfo({ displayNumber: metaWa.displayNumber, verifiedName: metaWa.verifiedName });
                        }
                    }
                    const insta = channels.find((c: any) => c.provider === 'INSTAGRAM');
                    if (insta) {
                        setInstaAccountId(insta.identifier || "");
                        if (insta.status === 'CONNECTED') {
                            setInstaConnectStep('connected');
                            setInstaConnectedInfo({ username: insta.username, pageName: insta.pageName });
                        }
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
                        body: JSON.stringify({ botId, clientId }),
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
                const statusUrl = clientId ? `/api/whatsapp/status?botId=${botId}&clientId=${clientId}` : `/api/whatsapp/status?botId=${botId}`;
                const res = await fetch(statusUrl);
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
    }, [botId, clientId, step, activeTab]);

    const handleSaveMetaChannel = async (provider: string, identifier: string, token: string, wabaId?: string) => {
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
                    credentials: { accessToken: token, ...(wabaId ? { wabaId } : {}) },
                    clientId,
                })
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                if (data?.webhookSubscription === 'failed') {
                    alert(
                        "Canal salvo, mas não foi possível assinar o webhook automaticamente " +
                        `(${data?.webhookSubscriptionError || 'erro desconhecido'}). ` +
                        "Sem essa assinatura, mensagens recebidas não chegam ao sistema. " +
                        "Confira o WABA ID informado."
                    );
                } else if (data?.webhookSubscription === 'skipped') {
                    alert(
                        "Canal salvo. Informe o WABA ID para que o sistema assine o webhook automaticamente " +
                        "(sem isso, mensagens recebidas podem não chegar)."
                    );
                } else {
                    alert("Canal configurado com sucesso! Webhook assinado.");
                }
            } else {
                alert(`Erro ao salvar canal: ${data?.error || res.status}`);
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
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">WhatsApp API Oficial (Cloud)</h3>
                                    <p className="text-xs text-gray-500">Número protegido pela própria Meta — sem risco de bloqueio por uso não-oficial.</p>
                                </div>
                            </div>

                            {/* ESTADO: CONECTADO */}
                            {metaConnectStep === 'connected' && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3 animate-fade-in">
                                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                                    <h4 className="font-bold text-green-800 text-lg">Número conectado com sucesso!</h4>
                                    {metaConnectedInfo?.displayNumber && (
                                        <p className="text-sm text-green-700">
                                            {metaConnectedInfo.verifiedName ? `${metaConnectedInfo.verifiedName} — ` : ''}
                                            <span className="font-mono">{metaConnectedInfo.displayNumber}</span>
                                        </p>
                                    )}
                                    <p className="text-xs text-green-600">
                                        O número já está registrado na Cloud API e o webhook foi assinado automaticamente.
                                        Pode levar até 1-2 minutos para as primeiras mensagens fluírem normalmente.
                                    </p>
                                    <button
                                        onClick={() => setMetaConnectStep('idle')}
                                        className="text-xs text-green-700 underline hover:text-green-900"
                                    >
                                        Conectar outro número
                                    </button>
                                </div>
                            )}

                            {/* ESTADO: AUTENTICANDO / REGISTRANDO */}
                            {(metaConnectStep === 'authenticating' || metaConnectStep === 'registering') && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center space-y-3">
                                    <Loader2 className="w-10 h-10 text-blue-600 mx-auto animate-spin" />
                                    <p className="font-medium text-blue-800">
                                        {metaConnectStep === 'authenticating'
                                            ? 'Aguardando login e seleção do número na janela da Meta…'
                                            : 'Registrando o número na Cloud API e ativando o webhook…'}
                                    </p>
                                    <p className="text-xs text-blue-500">Não feche esta página.</p>
                                </div>
                            )}

                            {/* ESTADO: ERRO */}
                            {metaConnectStep === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">Não foi possível concluir a conexão</p>
                                        <p className="text-xs text-red-700 mt-1">{metaConnectError}</p>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO: IDLE — instruções + botão principal */}
                            {(metaConnectStep === 'idle' || metaConnectStep === 'error') && (
                                <>
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-900 space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-blue-600" />
                                            Como funciona a conexão automática
                                        </p>
                                        <ol className="list-decimal pl-5 space-y-1 text-blue-800">
                                            <li>Clique em <b>Conectar com Facebook</b> abaixo.</li>
                                            <li>Faça login com a conta que administra o WhatsApp Business do cliente (ou a sua própria).</li>
                                            <li>Escolha ou crie o <b>Portfólio de Negócios</b> e o número de telefone na janela da Meta.</li>
                                            <li>Confirme o número por SMS ou ligação, se solicitado.</li>
                                            <li>Pronto — nós registramos o número, ativamos o webhook e a IA já pode responder.</li>
                                        </ol>
                                        <p className="text-[11px] text-blue-600 pt-1">
                                            Não é necessário copiar tokens nem mexer no painel de desenvolvedor da Meta. Tudo acontece dentro do popup.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleMetaLogin}
                                        disabled={isSaving || !metaAppId || !metaConfigId}
                                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Facebook size={20} />
                                        <span>Conectar com Facebook</span>
                                    </button>
                                    {(!metaAppId || !metaConfigId) && (
                                        <p className="text-[11px] text-red-500 text-center">
                                            Conexão automática ainda não configurada pelo administrador da plataforma. Use a opção manual abaixo ou contate o suporte.
                                        </p>
                                    )}

                                    {/* Fallback manual, escondido por padrão */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowManualFallback(v => !v)}
                                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto"
                                        >
                                            <ChevronDown size={14} className={`transition-transform ${showManualFallback ? 'rotate-180' : ''}`} />
                                            Prefiro colar as credenciais manualmente
                                        </button>

                                        {showManualFallback && (
                                            <div className="mt-4 space-y-4 border-t pt-4">
                                                <p className="text-[11px] text-gray-500">
                                                    Use apenas se você já tem um token permanente gerado no painel de desenvolvedor da Meta
                                                    (App → WhatsApp → Configuração da API). Webhook: <code className="bg-gray-100 px-1 py-0.5 rounded select-all break-all">{webhookBaseUrl}/api/webhooks/meta</code>,
                                                    Verify Token: <code className="bg-gray-100 px-1 py-0.5 rounded select-all">CONEXT_META_VERIFY</code>.
                                                </p>
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                                                    <input
                                                        type="text"
                                                        value={metaWabaId}
                                                        onChange={e => setMetaWabaId(e.target.value)}
                                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                                                        placeholder="Ex: 998441572955892"
                                                    />
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        Necessário para o sistema assinar o webhook automaticamente. Sem isso, mensagens recebidas podem não chegar.
                                                    </p>
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
                                                    onClick={() => handleSaveMetaChannel('META_WHATSAPP', metaPhoneId, metaToken, metaWabaId)}
                                                    disabled={isSaving}
                                                    className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 rounded-lg transition"
                                                >
                                                    {isSaving ? 'Salvando...' : 'Salvar e Conectar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* INSTAGRAM */}
                    {activeTab === 'instagram' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b pb-4">
                                <Instagram className="w-6 h-6 text-fuchsia-600" />
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">Instagram Direct</h3>
                                    <p className="text-xs text-gray-500">Responde Directs automaticamente e pode publicar posts/reels na conta conectada.</p>
                                </div>
                            </div>

                            {/* ESTADO: CONECTADO */}
                            {instaConnectStep === 'connected' && (
                                <div className="space-y-6">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3 animate-fade-in">
                                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                                        <h4 className="font-bold text-green-800 text-lg">Instagram conectado com sucesso!</h4>
                                        {instaConnectedInfo?.username && (
                                            <p className="text-sm text-green-700">
                                                @{instaConnectedInfo.username}
                                                {instaConnectedInfo.pageName ? ` — Página ${instaConnectedInfo.pageName}` : ''}
                                            </p>
                                        )}
                                        <p className="text-xs text-green-600">
                                            A IA já pode responder Directs automaticamente. Pode levar 1-2 minutos até as primeiras mensagens fluírem.
                                            <button
                                                onClick={handleDisconnectInstagram}
                                                className="text-xs text-green-700 underline hover:text-green-900 block mt-2 font-medium"
                                            >
                                                Desconectar esta conta / Conectar outro Instagram
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO: SELEÇÃO DE CONTA */}
                            {instaConnectStep === 'select_account' && (
                                <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-6 space-y-4 animate-fade-in">
                                    <div className="flex items-center gap-3 border-b border-fuchsia-200/60 pb-3">
                                        <Instagram className="w-6 h-6 text-fuchsia-600 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-fuchsia-950 text-base">Selecione a Conta do Instagram</h4>
                                            <p className="text-xs text-fuchsia-800">Encontramos mais de uma conta profissional vinculada ao seu Facebook. Escolha qual deseja conectar a este agente:</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        {availableInstaAccounts.map((acc: any) => (
                                            <div key={acc.igAccountId} className="p-3.5 border border-fuchsia-200 rounded-xl flex items-center justify-between bg-white hover:border-fuchsia-500 transition shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                        <Instagram size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-fuchsia-950 flex items-center gap-1">
                                                            <span>📸</span>
                                                            <span>{acc.username ? `@${acc.username}` : `Instagram (${acc.pageName})`}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-500">Página do Facebook vinculada: <b>{acc.pageName}</b></p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleSelectInstagramAccount(acc)}
                                                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-md shadow-fuchsia-500/20"
                                                >
                                                    Conectar esta conta
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-center pt-2">
                                        <button
                                            onClick={() => { setInstaConnectStep('idle'); handleInstagramLogin(); }}
                                            className="text-xs text-fuchsia-700 underline hover:text-fuchsia-900 font-medium"
                                        >
                                            Trocar de perfil no Facebook
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO: AUTENTICANDO / REGISTRANDO */}
                            {(instaConnectStep === 'authenticating' || instaConnectStep === 'registering') && (
                                <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-6 text-center space-y-3">
                                    <Loader2 className="w-10 h-10 text-fuchsia-600 mx-auto animate-spin" />
                                    <p className="font-medium text-fuchsia-800">
                                        {instaConnectStep === 'authenticating'
                                            ? 'Redirecionando para o login da Meta…'
                                            : 'Ativando o webhook e finalizando a conexão…'}
                                    </p>
                                    <p className="text-xs text-fuchsia-500">Não feche esta página.</p>
                                </div>
                            )}

                            {/* ESTADO: ERRO */}
                            {instaConnectStep === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">Não foi possível concluir a conexão</p>
                                        <p className="text-xs text-red-700 mt-1">{instaConnectError}</p>
                                    </div>
                                </div>
                            )}

                            {/* ESTADO: IDLE — instruções + botão principal */}
                            {(instaConnectStep === 'idle' || instaConnectStep === 'error') && (
                                <>
                                    <div className="bg-fuchsia-50 border border-fuchsia-100 p-4 rounded-lg text-sm text-fuchsia-900 space-y-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-fuchsia-600" />
                                            Como funciona a conexão automática
                                        </p>
                                        <ol className="list-decimal pl-5 space-y-1 text-fuchsia-800">
                                            <li>Clique em <b>Conectar com Instagram</b> abaixo.</li>
                                            <li>Faça login com a conta que administra a Página do Facebook vinculada ao Instagram.</li>
                                            <li>Sua conta Instagram precisa ser <b>Profissional (Business/Creator)</b> e estar vinculada a uma Página do Facebook.</li>
                                            <li>Pronto — nós ativamos o webhook e a IA já pode responder Directs e publicar posts.</li>
                                        </ol>
                                        <p className="text-[11px] text-fuchsia-600 pt-1">
                                            Não é necessário copiar tokens nem mexer no painel de desenvolvedor da Meta.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleInstagramLogin}
                                        disabled={isSaving || !metaAppId}
                                        className="w-full flex items-center justify-center gap-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-fuchsia-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Instagram size={20} />
                                        <span>Conectar com Instagram</span>
                                    </button>
                                    {!metaAppId && (
                                        <p className="text-[11px] text-red-500 text-center">
                                            Conexão automática ainda não configurada pelo administrador da plataforma. Use a opção manual abaixo ou contate o suporte.
                                        </p>
                                    )}

                                    {/* Fallback manual, escondido por padrão */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowManualFallback(v => !v)}
                                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto"
                                        >
                                            <ChevronDown size={14} className={`transition-transform ${showManualFallback ? 'rotate-180' : ''}`} />
                                            Prefiro colar as credenciais manualmente
                                        </button>

                                        {showManualFallback && (
                                            <div className="mt-4 space-y-4 border-t pt-4">
                                                <p className="text-[11px] text-gray-500">
                                                    Use apenas se você já tem um token de Página gerado no painel de desenvolvedor da Meta.
                                                    Webhook: <code className="bg-gray-100 px-1 py-0.5 rounded select-all break-all">{webhookBaseUrl}/api/webhooks/meta</code>,
                                                    Verify Token: <code className="bg-gray-100 px-1 py-0.5 rounded select-all">CONEXT_META_VERIFY</code>.
                                                </p>
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Token da Página</label>
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
                                                    className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 rounded-lg transition"
                                                >
                                                    {isSaving ? 'Salvando...' : 'Salvar e Conectar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
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
            <ConnectPageContent metaAppId={metaAppId} metaConfigId={metaConfigId} instagramConfigId={instagramConfigId} />
        </Suspense>
    );
}
