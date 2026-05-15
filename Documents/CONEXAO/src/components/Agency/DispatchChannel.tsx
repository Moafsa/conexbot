import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle, Send, LogOut, AlertCircle, Loader2 } from 'lucide-react';

interface DispatchChannelProps {
    bots: any[];
    onRefresh: () => void;
}

export const DispatchChannel: React.FC<DispatchChannelProps> = ({ bots, onRefresh }) => {
    const [dispatchBot, setDispatchBot] = useState<any>(null);
    const [connecting, setConnecting] = useState(false);
    const [step, setStep] = useState<'idle' | 'generating' | 'qrcode' | 'connected'>('idle');
    const [qrCodeData, setQrCodeData] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const bot = bots.find(b => b.businessType === 'SYSTEM_DISPATCH');
        setDispatchBot(bot);
        
        if (bot?.connectionStatus === 'CONNECTED') {
            setStep('connected');
        } else if (bot?.connectionStatus === 'QRCODE') {
            // If already in QR code status, start polling
            startConnection(bot.id);
        }
    }, [bots]);

    const startConnection = async (id?: string) => {
        const botId = id || dispatchBot?.id;
        if (!botId) {
            // First time: Create/Get bot
            try {
                setConnecting(true);
                const res = await fetch('/api/agency/settings/dispatch-connection');
                const data = await res.json();
                if (data.id) {
                    setDispatchBot(data);
                    handleConnect(data.id);
                }
            } catch (err) {
                setError("Erro ao iniciar canal.");
                setConnecting(false);
            }
            return;
        }
        handleConnect(botId);
    };

    const handleConnect = async (botId: string) => {
        setConnecting(true);
        setStep('generating');
        setError("");
        
        try {
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                body: JSON.stringify({ botId }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (res.ok) {
                if (data.status === 'CONNECTED') {
                    setStep('connected');
                    onRefresh();
                } else {
                    setQrCodeData(data.qrCodeUrl);
                    setStep('qrcode');
                }
            } else {
                setError(data.error || "Erro ao gerar QR Code.");
            }
        } catch (err) {
            setError("Falha de conexão com o servidor.");
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!dispatchBot?.id) return;
        if (!confirm("Deseja desconectar o WhatsApp da Agência?")) return;
        
        try {
            setConnecting(true);
            const res = await fetch('/api/whatsapp/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId: dispatchBot.id })
            });
            if (res.ok) {
                setStep('idle');
                setQrCodeData("");
                onRefresh();
            }
        } catch (err) {
            setError("Erro ao desconectar.");
        } finally {
            setConnecting(false);
        }
    };

    // Polling logic
    useEffect(() => {
        let interval: any;
        if (step === 'qrcode' && dispatchBot?.id) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/whatsapp/status?botId=${dispatchBot.id}`);
                    const data = await res.json();
                    if (res.ok) {
                        if (data.status === 'CONNECTED') {
                            setStep('connected');
                            onRefresh();
                            clearInterval(interval);
                        } else if (data.qrCodeUrl && data.qrCodeUrl !== qrCodeData) {
                            setQrCodeData(data.qrCodeUrl);
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [step, dispatchBot, qrCodeData]);

    return (
        <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Send size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg">Canal de Disparo da Agência</h4>
                        <p className="text-xs text-gray-400">Este é o WhatsApp oficial que enviará os links de acesso para seus clientes.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {step === 'connected' ? (
                        <button 
                            onClick={handleDisconnect}
                            disabled={connecting}
                            className="btn-outline border-red-500/20 text-red-500 hover:bg-red-500/10 py-2 px-4 flex items-center gap-2"
                        >
                            {connecting ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                            Desconectar
                        </button>
                    ) : step === 'qrcode' ? (
                        <button 
                            onClick={() => handleConnect(dispatchBot.id)}
                            disabled={connecting}
                            className="btn-primary py-2 px-6 flex items-center gap-2"
                        >
                            {connecting ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            Gerar Novo QR Code
                        </button>
                    ) : (
                        <button 
                            onClick={() => startConnection()}
                            disabled={connecting}
                            className="btn-primary py-2 px-6 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            {connecting ? <Loader2 className="animate-spin" size={16} /> : <Smartphone size={16} />}
                            Configurar Conexão
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {step === 'generating' && (
                <div className="flex flex-col items-center justify-center py-10 bg-black/20 rounded-xl border border-white/5">
                    <RefreshCw size={32} className="animate-spin text-emerald-500 mb-4" />
                    <p className="text-sm text-gray-400 animate-pulse">Iniciando sessão segura e gerando QR Code...</p>
                </div>
            )}

            {step === 'qrcode' && qrCodeData && (
                <div className="flex flex-col md:flex-row items-center gap-8 py-8 bg-black/20 rounded-xl border border-white/5 px-8">
                    <div className="bg-white p-3 rounded-2xl shadow-2xl">
                        <img src={qrCodeData} alt="WhatsApp QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                    </div>
                    <div className="space-y-4 max-w-xs text-center md:text-left">
                        <h5 className="font-bold text-white">Escaneie o QR Code</h5>
                        <ol className="text-xs text-gray-400 space-y-2 text-left">
                            <li className="flex gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">1</span>
                                Abra o WhatsApp no seu celular
                            </li>
                            <li className="flex gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">2</span>
                                Toque em Aparelhos Conectados
                            </li>
                            <li className="flex gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">3</span>
                                Clique em Conectar um Aparelho e aponte para a tela
                            </li>
                        </ol>
                        <p className="text-[10px] text-emerald-500/60 pt-2 flex items-center gap-2 justify-center md:justify-start">
                            <RefreshCw size={10} className="animate-spin" />
                            Aguardando leitura automática...
                        </p>
                    </div>
                </div>
            )}

            {step === 'connected' && (
                <div className="flex items-center gap-4 py-4 px-6 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">WhatsApp Conectado com Sucesso!</p>
                        <p className="text-[10px] opacity-70">O Canal de Disparo da Agência está ativo e pronto para enviar mensagens.</p>
                    </div>
                    <div className="ml-auto text-[10px] font-mono opacity-50 uppercase tracking-widest">
                        Status: Online
                    </div>
                </div>
            )}
        </div>
    );
};
