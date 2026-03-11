"use client";

import { useEffect, useState, Suspense } from "react";
import { Smartphone, CheckCircle, RefreshCw, ArrowLeft, Globe, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

function PublicConnectPageContent() {
    const params = useParams();
    const token = params.token as string;
    const router = useRouter();

    const [step, setStep] = useState<'generating' | 'qrcode' | 'connected'>('generating');
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");
    const [botName, setBotName] = useState("");

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

        if (step === 'generating') {
            startSession();
        }

        // Poll for status
        const interval = setInterval(async () => {
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
    }, [token]);

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
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Smartphone size={40} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black mb-3 tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Conectar WhatsApp
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                            Escaneie o QR Code abaixo para vincular seu WhatsApp ao agente inteligente.
                        </p>
                    </div>

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
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-bold animate-pulse">Iniciando Conexão Segura...</div>}>
            <PublicConnectPageContent />
        </Suspense>
    );
}
