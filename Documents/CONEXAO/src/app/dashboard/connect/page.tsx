"use client";

import { useEffect, useState, Suspense } from "react";
import { Smartphone, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ConnectPageContent() {
    const searchParams = useSearchParams();
    const botId = searchParams.get('botId');
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'whatsapp' | 'webhook'>('whatsapp');
    const [step, setStep] = useState<'generating' | 'qrcode' | 'connected'>('generating');
    const [sessionName, setSessionName] = useState("");
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");
    const [webhookBaseUrl, setWebhookBaseUrl] = useState("");

    useEffect(() => {
        setWebhookBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        if (!botId) {
            setError("Bot ID não encontrado na URL.");
            return;
        }

        // Only start session if whatsapp tab is active and generating
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

        // Poll for status
        const interval = setInterval(async () => {
            if (step === 'connected') {
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
                        // Redirect back to dashboard after a few seconds
                        setTimeout(() => router.push('/dashboard'), 3000);
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
    }, [botId, step, activeTab, router]);

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Link href="/dashboard" className="btn-secondary">Voltar</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-10">
            <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 relative my-auto">
                <Link href="/dashboard" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </Link>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_#22c55e]">
                        <Smartphone size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Conectar WhatsApp</h2>
                    <p className="text-gray-400">Escaneie o QR Code com seu celular para vincular o agente.</p>
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('whatsapp')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        WhatsApp
                    </button>
                    <button
                        onClick={() => setActiveTab('webhook')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'webhook' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Webhooks / Chatwoot
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl p-4 mb-6 relative overflow-hidden w-full">
                    {activeTab === 'whatsapp' ? (
                        <>
                            {(step === 'generating' || (step === 'qrcode' && !qrCodeData)) && (
                                <div className="flex flex-col items-center gap-4 text-black w-full my-10">
                                    <RefreshCw size={40} className="animate-spin text-gray-400" />
                                    <p className="font-medium animate-pulse text-center">Gerando QRCode Seguro...</p>
                                </div>
                            )}

                            {step === 'qrcode' && qrCodeData && (
                                <div className="text-center animate-fade-in w-full">
                                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-white p-2 mx-auto mb-4 rounded-lg flex items-center justify-center overflow-hidden">
                                        <img
                                            src={qrCodeData}
                                            alt="WhatsApp QR Code"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/250?text=Aguardando+QR...';
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Abra o WhatsApp e escaneie o código acima</p>
                                    <button onClick={() => window.location.reload()} className="mt-4 text-xs text-indigo-400 hover:underline">
                                        Atualizar
                                    </button>
                                </div>
                            )}

                            {step === 'connected' && (
                                <div className="flex flex-col items-center gap-4 text-green-600 animate-fade-in">
                                    <CheckCircle size={64} />
                                    <h3 className="text-xl font-bold">Conectado com Sucesso!</h3>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-black text-left w-full h-full flex flex-col justify-start space-y-4">
                            <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Integração Webhook</h3>
                            <p className="text-sm text-gray-600">
                                Para conectar ao Chatwoot, n8n ou Make, utilize esta URL de Webhook:
                            </p>
                            <div className="bg-gray-100 p-3 rounded border border-gray-200 text-xs font-mono break-all text-blue-600 select-all">
                                {webhookBaseUrl}/api/webhooks/generic{botId ? `?token=SEU_TOKEN_AQUI` : ''}
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p><strong>Passo 1:</strong> Vá em "Meus Bots" e edite as configurações deste agente.</p>
                                <p><strong>Passo 2:</strong> Adicione a URL do Chatwoot (ou n8n) em <em>Webhook URL</em>.</p>
                                <p><strong>Passo 3:</strong> Defina um <em>Token (ex: 123456)</em>, salve o agente, e cole a URL acima na sua plataforma substituindo <code>SEU_TOKEN_AQUI</code> pelo token que você definiu.</p>
                            </div>

                        </div>
                    )}
                </div>

                <div className="text-center">
                    {activeTab === 'whatsapp' ? (
                        step === 'connected' ? (
                            <Link href="/dashboard" className="btn-primary w-full block">
                                Voltar ao Dashboard
                            </Link>
                        ) : (
                            <p className="text-xs text-gray-500">
                                Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos Conectados {'>'} Conectar Aparelho
                            </p>
                        )
                    ) : (
                        <Link href="/dashboard/bots" className="btn-primary w-full block bg-indigo-600 hover:bg-indigo-700">
                            Editar Configurações do Agente
                        </Link>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function ConnectPage() {
    return (
        <Suspense fallback={<div className="text-white p-10">Carregando...</div>}>
            <ConnectPageContent />
        </Suspense>
    );
}
