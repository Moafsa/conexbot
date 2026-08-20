"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Phone, Shield, Zap, X } from "lucide-react";
import Link from "next/link";

type Step = 'idle' | 'authenticating' | 'registering' | 'connected' | 'error';

function BspConnectContent({ metaAppId, metaConfigId }: { metaAppId: string | null; metaConfigId: string | null }) {
    const [step, setStep] = useState<Step>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [connectedInfo, setConnectedInfo] = useState<{ displayNumber?: string; verifiedName?: string; wabaId?: string } | null>(null);
    const waIdsRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});
    const botIdRef = useRef<string | null>(null);
    const searchParams = useSearchParams();

    // Pre-populate botId for reconnect flow (?botId=xxx)
    useEffect(() => {
        const bid = searchParams.get('botId');
        if (bid) botIdRef.current = bid;
    }, [searchParams]);

    // Listen for Meta popup postMessage events (phone/waba IDs)
    useEffect(() => {
        function onMessage(e: MessageEvent) {
            const allowed = ['https://www.facebook.com', 'https://web.facebook.com'];
            if (!allowed.some(o => e.origin.startsWith(o))) return;
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (data?.type === 'WA_EMBEDDED_SIGNUP') {
                    if (data.event === 'FINISH' || data.event === 'SUBMIT') {
                        waIdsRef.current = {
                            wabaId: data.data?.waba_id,
                            phoneNumberId: data.data?.phone_number_id,
                        };
                    }
                }
            } catch { }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    async function handleConnect() {
        if (!metaAppId || !metaConfigId) {
            setErrorMsg('Configuração Meta não encontrada. Contacte o suporte.');
            setStep('error');
            return;
        }
        if (!(window as any).FB) {
            setErrorMsg('SDK do Facebook não carregou. Aguarde e tente novamente.');
            setStep('error');
            return;
        }

        setStep('authenticating');
        setErrorMsg('');
        waIdsRef.current = {};

        try {
            (window as any).FB.login((response: any) => {
                if (response.authResponse?.code) {
                    processCode(response.authResponse.code);
                } else {
                    setStep('idle');
                }
            }, {
                config_id: metaConfigId,
                response_type: 'code',
                override_default_response_type: true,
                extras: { setup: {} }
            });
        } catch (e: any) {
            setErrorMsg('Erro ao abrir janela de autenticação. Desative bloqueadores de popup e tente novamente.');
            setStep('error');
        }
    }

    async function processCode(code: string) {
        setStep('registering');
        try {
            await new Promise(r => setTimeout(r, 400));

            // Get or create BSP container bot transparently
            if (!botIdRef.current) {
                const prep = await fetch('/api/bsp/prepare');
                const prepData = await prep.json();
                if (!prepData.botId) throw new Error('Erro ao preparar conexão.');
                botIdRef.current = prepData.botId;
            }

            const res = await fetch(`/api/bots/${botIdRef.current}/connect/meta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    wabaId: waIdsRef.current.wabaId,
                    phoneNumberId: waIdsRef.current.phoneNumberId,
                })
            });

            const data = await res.json();
            if (res.ok) {
                setConnectedInfo({
                    displayNumber: data.displayNumber,
                    verifiedName: data.verifiedName,
                    wabaId: waIdsRef.current.wabaId,
                });
                setStep('connected');
            } else {
                setErrorMsg(data.error || 'Falha na conexão. Tente novamente.');
                setStep('error');
            }
        } catch (e: any) {
            setErrorMsg(e.message || 'Erro de rede. Verifique sua conexão.');
            setStep('error');
        }
    }

    return (
        <div className="py-10 px-4 flex flex-col items-center">
            {/* Back */}
            <div className="w-full max-w-lg mb-8">
                <Link href="/dashboard/developer" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition">
                    <ArrowLeft size={15} /> Voltar ao Portal
                </Link>
            </div>

            {/* Card */}
            <div className="w-full max-w-lg bg-[#0e1524] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="px-8 pt-10 pb-8 border-b border-white/8 text-center">
                    <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-emerald-400">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.532 5.852L0 24l6.318-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.214-3.73.89.929-3.619-.234-.373A9.783 9.783 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.389 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Conectar número WhatsApp</h1>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Conecte seu WABA (WhatsApp Business Account) à plataforma ConextBot para obter acesso à API oficial da Meta.
                    </p>
                </div>

                {/* Body */}
                <div className="px-8 py-8 space-y-6">

                    {/* Benefits */}
                    {step === 'idle' && (
                        <div className="space-y-3">
                            {[
                                { icon: Shield, text: 'Número registrado diretamente na Meta — sem risco de bloqueio' },
                                { icon: Zap, text: 'API REST para enviar/receber mensagens de qualquer sistema' },
                                { icon: Phone, text: 'Templates, webhooks e relatórios por número' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-start gap-3">
                                    <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon size={14} className="text-emerald-400" />
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* States */}
                    {step === 'authenticating' && (
                        <div className="text-center py-6 space-y-3">
                            <Loader2 size={36} className="animate-spin text-emerald-400 mx-auto" />
                            <p className="text-white font-semibold">Aguardando autorização na Meta...</p>
                            <p className="text-sm text-gray-500">Conclua o processo na janela que abriu.</p>
                            <button
                                onClick={() => setStep('idle')}
                                className="flex items-center gap-1.5 mx-auto mt-2 text-xs text-gray-600 hover:text-gray-400 transition"
                            >
                                <X size={12} /> Cancelar
                            </button>
                        </div>
                    )}

                    {step === 'registering' && (
                        <div className="text-center py-6 space-y-3">
                            <Loader2 size={36} className="animate-spin text-emerald-400 mx-auto" />
                            <p className="text-white font-semibold">Registrando número...</p>
                            <p className="text-sm text-gray-500">Conectando à Cloud API da Meta.</p>
                        </div>
                    )}

                    {step === 'connected' && (
                        <div className="space-y-5">
                            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-5 text-center">
                                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                                <p className="text-emerald-400 font-black text-lg mb-1">Número conectado!</p>
                                {connectedInfo?.verifiedName && (
                                    <p className="text-white font-bold text-xl">{connectedInfo.verifiedName}</p>
                                )}
                                {connectedInfo?.displayNumber && (
                                    <p className="text-gray-400 text-sm font-mono mt-1">{connectedInfo.displayNumber}</p>
                                )}
                                {connectedInfo?.wabaId && (
                                    <p className="text-gray-600 text-xs mt-1">WABA: {connectedInfo.wabaId}</p>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                                O webhook foi configurado automaticamente. Agora crie uma API Key no portal para começar a usar.
                            </p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-400 font-bold text-sm mb-1">Erro na conexão</p>
                                    <p className="text-gray-400 text-sm">{errorMsg}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {step === 'connected' ? (
                        <Link href="/dashboard/developer" className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition text-sm">
                            Ir para o Portal →
                        </Link>
                    ) : step === 'idle' || step === 'error' ? (
                        <button
                            onClick={handleConnect}
                            disabled={!metaAppId || !metaConfigId}
                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1877F2] hover:bg-[#1565d8] text-white font-black rounded-2xl transition text-sm disabled:opacity-40 shadow-lg shadow-blue-900/30"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            Conectar com Facebook / Meta
                        </button>
                    ) : null}

                    {(!metaAppId || !metaConfigId) && (step === 'idle') && (
                        <p className="text-xs text-center text-yellow-500/70">Configuração Meta não detectada. Contacte o suporte.</p>
                    )}
                </div>
            </div>

            {/* Footer note */}
            <p className="mt-6 text-xs text-gray-700 text-center max-w-sm">
                Ao conectar, você autoriza o ConextBot a gerenciar mensagens e templates do seu WABA em seu nome, conforme os <span className="text-gray-500">Termos de Serviço da Meta</span>.
            </p>
        </div>
    );
}

export default function BspConnectPage() {
    const [metaAppId, setMetaAppId] = useState<string | null>(null);
    const [metaConfigId, setMetaConfigId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/config/meta')
            .then(r => r.json())
            .then(d => {
                setMetaAppId(d.appId);
                setMetaConfigId(d.configId);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (metaAppId && (window as any).FB) {
            (window as any).FB.init({ appId: metaAppId, autoLogAppEvents: true, xfbml: true, version: 'v22.0' });
        }
    }, [metaAppId]);

    return (
        <Suspense fallback={<div className="min-h-screen bg-[#090d16]" />}>
            <Script
                src="https://connect.facebook.net/pt_BR/sdk.js"
                strategy="afterInteractive"
                onLoad={() => {
                    if (metaAppId && (window as any).FB) {
                        (window as any).FB.init({ appId: metaAppId, autoLogAppEvents: true, xfbml: true, version: 'v22.0' });
                    }
                }}
            />
            <BspConnectContent metaAppId={metaAppId} metaConfigId={metaConfigId} />
        </Suspense>
    );
}
