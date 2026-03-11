"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, Check, AlertCircle, Zap, Mail, Smartphone, Globe, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [config, setConfig] = useState({
        systemName: "ConextBot",
        maintenanceMode: false,
        supportEmail: "",
        asaasApiKey: "",
        asaasWalletId: "",
        openaiApiKey: "",
        geminiApiKey: "",
        elevenLabsApiKey: "",
        logoColoredUrl: "",
        logoWhiteUrl: "",
        googleClientId: "",
        googleClientSecret: "",
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpFrom: "",
        systemBotId: ""
    });

    const [systemBot, setSystemBot] = useState<{ status: string, botName?: string, botId?: string } | null>(null);

    useEffect(() => {
        if (session && (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPERADMIN') {
            router.push('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                const [configRes, systemBotRes] = await Promise.all([
                    fetch("/api/admin/config"),
                    fetch("/api/admin/system-bot")
                ]);

                if (configRes.ok) {
                    const data = await configRes.json();
                    setConfig(prev => ({ ...prev, ...data }));
                }

                if (systemBotRes.ok) {
                    const data = await systemBotRes.json();
                    setSystemBot(data);
                }
            } catch (err) {
                console.error("Failed to fetch admin data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session, router]);

    const handleConnectSystemBot = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/system-bot", { method: "POST" });
            const data = await res.json();
            if (data.botId) {
                router.push(`/dashboard/connect?botId=${data.botId}`);
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao iniciar conexão." });
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnectSystemBot = async () => {
        if (!confirm("Tem certeza que deseja desconectar o WhatsApp do sistema?")) return;
        setSaving(true);
        try {
            await fetch("/api/admin/system-bot", { method: "DELETE" });
            const systemBotRes = await fetch("/api/admin/system-bot");
            if (systemBotRes.ok) {
                const data = await systemBotRes.json();
                setSystemBot(data);
            }
            setMessage({ type: 'success', text: "WhatsApp desconectado com sucesso." });
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao desconectar." });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error("Erro ao salvar configuração");
            setMessage({ type: 'success', text: "Configurações globais atualizadas!" });
        } catch (err) {
            setMessage({ type: 'error', text: "Falha ao salvar. Verifique as permissões." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Shield className="text-indigo-500" />
                    Painel do Super Admin
                </h1>
                <p className="text-gray-400">Configurações globais do ecossistema ConextBot.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Config */}
                <section className="glass rounded-3xl p-8 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Globe size={20} className="text-blue-400" />
                        Geral & Identidade
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Sistema</label>
                            <input value={config.systemName} onChange={e => setConfig({...config, systemName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">E-mail de Suporte</label>
                            <input value={config.supportEmail} onChange={e => setConfig({...config, supportEmail: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo Colorida (URL)</label>
                            <input value={config.logoColoredUrl} onChange={e => setConfig({...config, logoColoredUrl: e.target.value})} placeholder="https://exemplo.com/logo-color.png" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            <p className="text-[10px] text-gray-500 mt-1">Usada como favicon e em fundos claros.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logo Branca (URL)</label>
                            <input value={config.logoWhiteUrl} onChange={e => setConfig({...config, logoWhiteUrl: e.target.value})} placeholder="https://exemplo.com/logo-white.png" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                            <p className="text-[10px] text-gray-500 mt-1">Usada em fundos escuros e no topo da Landing Page.</p>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold">Modo Manutenção</p>
                                <p className="text-[10px] text-gray-500">Bloqueia acesso de usuários comuns</p>
                            </div>
                            <button 
                                onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                                className={`w-12 h-6 rounded-full relative transition-colors ${config.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.maintenanceMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* AI Config */}
                <section className="glass rounded-3xl p-8 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Zap size={20} className="text-yellow-400" />
                        API Keys Globais (IA)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">OpenAI Key</label>
                            <input type="password" value={config.openaiApiKey} onChange={e => setConfig({...config, openaiApiKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gemini Key</label>
                            <input type="password" value={config.geminiApiKey} onChange={e => setConfig({...config, geminiApiKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">ElevenLabs Key</label>
                            <input type="password" value={config.elevenLabsApiKey} onChange={e => setConfig({...config, elevenLabsApiKey: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono" />
                        </div>
                    </div>
                </section>

                {/* Alert SMTP Config */}
                <section className="glass rounded-3xl p-8 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Mail size={20} className="text-purple-400" />
                        SMTP Global (Alertas)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Host SMTP</label>
                            <input value={config.smtpHost} onChange={e => setConfig({...config, smtpHost: e.target.value})} placeholder="smtp.gmail.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Porta</label>
                            <input type="number" value={config.smtpPort} onChange={e => setConfig({...config, smtpPort: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">User</label>
                            <input value={config.smtpUser} onChange={e => setConfig({...config, smtpUser: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Senha</label>
                            <input type="password" value={config.smtpPass} onChange={e => setConfig({...config, smtpPass: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">From Email</label>
                            <input value={config.smtpFrom} onChange={e => setConfig({...config, smtpFrom: e.target.value})} placeholder="alertas@conexbot.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        </div>
                    </div>
                </section>

                {/* System Bot for WA Alerts */}
                <section className="glass rounded-3xl p-8 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Smartphone size={20} className="text-green-400" />
                        WhatsApp do Sistema (Global)
                    </h3>
                    <div className="space-y-4">
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                            Este é o WhatsApp oficial que enviará alertas de cobrança, limite e suporte para todos os usuários do ecossistema.
                        </p>
                        
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full animate-pulse ${systemBot?.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <div>
                                    <p className="text-sm font-bold">{systemBot?.botName || "Sistema - Avisos"}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                        Status: {systemBot?.status || 'DESCONECTADO'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleConnectSystemBot}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                                >
                                    {systemBot?.status === 'CONNECTED' ? 'Reconectar' : 'Conectar Agora'}
                                </button>
                                {systemBot?.status === 'CONNECTED' && (
                                    <button 
                                        onClick={handleDisconnectSystemBot}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Desconectar
                                    </button>
                                )}
                            </div>
                        </div>

                        {systemBot?.status !== 'CONNECTED' && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-yellow-200/80">
                                    O WhatsApp do sistema está offline. Os alertas de limite não serão enviados via WhatsApp até que você realize a conexão.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="fixed bottom-8 right-8 left-8 md:left-auto md:w-64 z-20">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/40 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
}
