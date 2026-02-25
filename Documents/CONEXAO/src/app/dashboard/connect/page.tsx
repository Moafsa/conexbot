"use client";

import { useEffect, useState, Suspense } from "react";
import { Smartphone, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ConnectPageContent() {
    const searchParams = useSearchParams();
    const botId = searchParams.get('botId');
    const router = useRouter();

    const [step, setStep] = useState<'generating' | 'qrcode' | 'connected'>('generating');
    const [sessionName, setSessionName] = useState("");
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!botId) {
            setError("Bot ID não encontrado na URL.");
            return;
        }

        // Start session if generating
        if (step === 'generating') {
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
                    } else if (data.status === 'QRCODE' && data.qrCodeUrl) {
                        setQrCodeData(data.qrCodeUrl);
                        setStep('qrcode');
                    }
                }
            } catch (e) {
                console.error("Polling error:", e);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [botId, step, router]);

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
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 relative">
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

                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-xl p-4 mb-6 relative overflow-hidden">
                    {step === 'generating' && (
                        <div className="flex flex-col items-center gap-4 text-black">
                            <RefreshCw size={40} className="animate-spin text-gray-400" />
                            <p className="font-medium animate-pulse">Gerando QRCode Seguro...</p>
                        </div>
                    )}

                    {step === 'qrcode' && qrCodeData && (
                        <div className="text-center animate-fade-in">
                            <div className="w-64 h-64 bg-white p-2 mx-auto mb-4 rounded-lg flex items-center justify-center overflow-hidden">
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
                </div>

                <div className="text-center">
                    {step === 'connected' ? (
                        <Link href="/dashboard" className="btn-primary w-full block">
                            Voltar ao Dashboard
                        </Link>
                    ) : (
                        <p className="text-xs text-gray-500">
                            Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos Conectados {'>'} Conectar Aparelho
                        </p>
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
