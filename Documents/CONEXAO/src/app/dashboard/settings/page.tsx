"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Bell, Shield, Smartphone, Loader2, Save, Check, AlertCircle, DollarSign, Zap, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Data states
    const [profile, setProfile] = useState({ name: "", email: "", whatsapp: "" });
    const [notifications, setNotifications] = useState({ email: true, whatsapp: true, marketing: false });
    const [finance, setFinance] = useState({ asaasApiKey: "" });
    const [aiSettings, setAiSettings] = useState({ openaiApiKey: "", geminiApiKey: "", openrouterApiKey: "", elevenLabsApiKey: "" });
    const [smtpConfigs, setSmtpConfigs] = useState<any[]>([]);
    const [newSmtp, setNewSmtp] = useState({ host: "", port: 587, user: "", pass: "", fromEmail: "" });
    const [bots, setBots] = useState<any[]>([]);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    // Fetch data based on tab
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setMessage(null);
            try {
                if (activeTab === "profile") {
                    const res = await fetch("/api/settings/profile");
                    const data = await res.json();
                    if (res.ok) setProfile({ name: data.name || "", email: data.email || "", whatsapp: data.whatsapp || "" });
                } else if (activeTab === "notifications") {
                    const res = await fetch("/api/settings/notifications");
                    const data = await res.json();
                    if (res.ok) setNotifications(data);
                } else if (activeTab === "whatsapp") {
                    const res = await fetch("/api/settings/whatsapp");
                    const data = await res.json();
                    if (res.ok) setBots(Array.isArray(data) ? data : []);
                } else if (activeTab === "finance") {
                    const res = await fetch("/api/settings/finance");
                    const data = await res.json();
                    if (res.ok) setFinance({ asaasApiKey: data.asaasApiKey || "" });
                } else if (activeTab === "ai") {
                    const res = await fetch("/api/settings/ai");
                    const data = await res.json();
                    if (res.ok) {
                        setAiSettings({
                            openaiApiKey: data.openaiApiKey || "",
                            geminiApiKey: data.geminiApiKey || "",
                            openrouterApiKey: data.openrouterApiKey || "",
                            elevenLabsApiKey: data.elevenLabsApiKey || ""
                        });
                    }
                } else if (activeTab === "smtp") {
                    const res = await fetch("/api/settings/smtp");
                    const data = await res.json();
                    if (res.ok) setSmtpConfigs(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile)
            });
            if (!res.ok) throw new Error("Erro ao salvar perfil");
            await updateSession({ name: profile.name });
            setMessage({ type: 'success', text: "Perfil atualizado com sucesso!" });
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao atualizar perfil." });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(notifications)
            });
            if (!res.ok) throw new Error("Erro ao salvar notificações");
            setMessage({ type: 'success', text: "Preferências salvas!" });
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao salvar preferências." });
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: "As novas senhas não coincidem." });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao alterar senha");

            setMessage({ type: 'success', text: "Senha alterada com sucesso!" });
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveFinance = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/finance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finance)
            });
            if (!res.ok) throw new Error("Erro ao salvar configurações financeiras");
            setMessage({ type: 'success', text: "Configurações salvas!" });
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao salvar configurações." });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSmtp = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/smtp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSmtp)
            });
            if (res.ok) {
                const added = await res.json();
                setSmtpConfigs([...smtpConfigs, added]);
                setNewSmtp({ host: "", port: 587, user: "", pass: "", fromEmail: "" });
                setMessage({ type: 'success', text: "SMTP adicionado!" });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao adicionar SMTP." });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSmtp = async (id: string) => {
        try {
            const res = await fetch(`/api/settings/smtp/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSmtpConfigs(smtpConfigs.filter(s => s.id !== id));
                setMessage({ type: 'success', text: "SMTP removido!" });
            }
        } catch (err) { }
    };

    const handleSaveAiSettings = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/settings/ai", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(aiSettings)
            });
            if (!res.ok) throw new Error("Erro ao salvar configurações de IA");
            setMessage({ type: 'success', text: "Configurações de IA salvas!" });
        } catch (err) {
            setMessage({ type: 'error', text: "Erro ao salvar configurações." });
        } finally {
            setSaving(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-left
                ${activeTab === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-gray-400">Gerencie sua conta e preferências.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar de Opções */}
                <div className="glass rounded-2xl p-4 h-fit space-y-2">
                    <TabButton id="profile" label="Perfil" icon={User} />
                    <TabButton id="whatsapp" label="Conexão WhatsApp" icon={Smartphone} />
                    <TabButton id="ai" label="Inteligência Artificial" icon={Zap} />
                    <TabButton id="finance" label="Financeiro & Pagamentos" icon={DollarSign} />
                    <TabButton id="smtp" label="Servidores E-mail (SMTP)" icon={Mail} />
                    <TabButton id="notifications" label="Notificações" icon={Bell} />
                    <TabButton id="security" label="Segurança" icon={Shield} />
                </div>

                {/* Conteúdo */}
                <div className="md:col-span-2 glass rounded-2xl p-8 min-h-[400px]">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-white/30" size={32} />
                        </div>
                    ) : (
                        <>
                            {activeTab === "profile" && (
                                <div className="space-y-6 max-w-md animate-fade-in">
                                    <h3 className="text-xl font-semibold">Informações do Perfil</h3>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={e => setProfile({ ...profile, email: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">WhatsApp de Contato (Opcional)</label>
                                        <input
                                            type="text"
                                            value={profile.whatsapp}
                                            onChange={e => setProfile({ ...profile, whatsapp: e.target.value })}
                                            placeholder="Para suporte e alertas"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="btn-primary flex items-center gap-2 mt-4"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Salvar Alterações
                                    </button>
                                </div>
                            )}

                            {activeTab === "finance" && (
                                <div className="space-y-6 max-w-md animate-fade-in">
                                    <h3 className="text-xl font-semibold">Configurações de Pagamento (Asaas)</h3>
                                    <p className="text-gray-400 text-sm">
                                        Configure sua chave de API do Asaas para que seus bots possam gerar links de pagamento e cobrar clientes automaticamente.
                                    </p>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Asaas API Key</label>
                                        <input
                                            type="text"
                                            value={finance.asaasApiKey}
                                            onChange={e => setFinance({ ...finance, asaasApiKey: e.target.value })}
                                            placeholder="$aact_..."
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                                        />
                                        <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
                                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">📋 Como obter sua chave Asaas:</p>
                                            <ol className="text-[11px] text-gray-400 list-decimal ml-4 space-y-1">
                                                <li>Acesse seu painel no <a href="https://www.asaas.com" target="_blank" className="underline text-blue-300">Asaas</a> (ou Sandbox para testes).</li>
                                                <li>Vá em <strong>Minha Conta</strong> {'>'} <strong>Integrações</strong>.</li>
                                                <li>Clique em <strong>Gerar nova chave API</strong>.</li>
                                                <li>Copie a chave gerada e cole no campo acima.</li>
                                                <li><em>Importante:</em> Certifique-se de que sua conta esteja verificada para processar pagamentos reais.</li>
                                            </ol>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveFinance}
                                        disabled={saving}
                                        className="btn-primary flex items-center gap-2 mt-4"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Salvar Chave
                                    </button>
                                </div>
                            )}

                            {activeTab === "whatsapp" && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold">Status da Conexão</h3>
                                    <p className="text-gray-400 text-sm">
                                        Gerencie a conexão do WhatsApp dos seus agentes. Para reconectar, acesse o painel do bot.
                                    </p>

                                    <div className="space-y-4">
                                        {bots.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                Você ainda não tem bots criados.
                                            </div>
                                        ) : (
                                            bots.map(bot => (
                                                <div key={bot.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-medium text-white">{bot.name}</h4>
                                                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                                            Sessão: {bot.sessionName || "Não configurada"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${bot.sessionName
                                                            ? "bg-green-500/20 text-green-300 border-green-500/30"
                                                            : "bg-red-500/20 text-red-300 border-red-500/30"
                                                            }`}>
                                                            {bot.sessionName ? "Conectado" : "Desconectado"}
                                                        </span>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
                                                            className="text-xs btn-outline py-1 px-3"
                                                        >
                                                            Gerenciar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "ai" && (
                                <div className="space-y-6 max-w-md animate-fade-in">
                                    <h3 className="text-xl font-semibold">Provedores de IA</h3>
                                    <p className="text-gray-400 text-sm">
                                        Configure suas chaves de API para habilitar diferentes inteligências artificiais no seu bot.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
                                            <input
                                                type="password"
                                                value={aiSettings.openaiApiKey}
                                                onChange={e => setAiSettings({ ...aiSettings, openaiApiKey: e.target.value })}
                                                placeholder="sk-..."
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                                            />
                                            <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
                                                Obtenha em <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com</a>. É necessário ter saldo (credits) para o bot funcionar.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Gemini API Key</label>
                                            <input
                                                type="password"
                                                value={aiSettings.geminiApiKey}
                                                onChange={e => setAiSettings({ ...aiSettings, geminiApiKey: e.target.value })}
                                                placeholder="AIza..."
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                                            />
                                            <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
                                                Crie gratuitamente no <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a>. Ideal para leitura de imagens.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">OpenRouter API Key</label>
                                            <input
                                                type="password"
                                                value={aiSettings.openrouterApiKey}
                                                onChange={e => setAiSettings({ ...aiSettings, openrouterApiKey: e.target.value })}
                                                placeholder="sk-or-..."
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                                            />
                                            <p className="mt-2 text-[10px] text-gray-500 leading-relaxed">
                                                Acesse <a href="https://openrouter.ai/keys" target="_blank" className="underline">openrouter.ai</a> para usar modelos de baixo custo.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2 mt-4">ElevenLabs API Key (Para Áudios)</label>
                                            <input
                                                type="password"
                                                value={aiSettings.elevenLabsApiKey}
                                                onChange={e => setAiSettings({ ...aiSettings, elevenLabsApiKey: e.target.value })}
                                                placeholder="sk_..."
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                                            />
                                            <div className="mt-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                                                <p className="text-[10px] text-gray-400">
                                                    Para vozes personalizadas, pegue a chave em <a href="https://elevenlabs.io" target="_blank" className="underline">elevenlabs.io</a>. Depois, insira o <strong>Voice ID</strong> desejado nas configurações individuais de cada bot.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveAiSettings}
                                        disabled={saving}
                                        className="btn-primary flex items-center gap-2 mt-4"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Salvar Chaves
                                    </button>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold">Preferências de Notificação</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div>
                                                <h4 className="text-white font-medium">Alertas por Email</h4>
                                                <p className="text-xs text-gray-400">Receba resumos semanais e alertas de sistema.</p>
                                            </div>
                                            <div
                                                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.email ? 'bg-purple-600' : 'bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications.email ? 'left-7' : 'left-1'}`} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div>
                                                <h4 className="text-white font-medium">Alertas no WhatsApp</h4>
                                                <p className="text-xs text-gray-400">Receba notificações urgentes no seu número cadastrado.</p>
                                            </div>
                                            <div
                                                onClick={() => setNotifications({ ...notifications, whatsapp: !notifications.whatsapp })}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.whatsapp ? 'bg-purple-600' : 'bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications.whatsapp ? 'left-7' : 'left-1'}`} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                            <div>
                                                <h4 className="text-white font-medium">Novidades e Marketing</h4>
                                                <p className="text-xs text-gray-400">Receba dicas de vendas e atualizações da plataforma.</p>
                                            </div>
                                            <div
                                                onClick={() => setNotifications({ ...notifications, marketing: !notifications.marketing })}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notifications.marketing ? 'bg-purple-600' : 'bg-gray-600'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications.marketing ? 'left-7' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveNotifications}
                                        disabled={saving}
                                        className="btn-primary flex items-center gap-2 mt-4"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Salvar Preferências
                                    </button>
                                </div>
                            )}

                            {activeTab === "smtp" && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xl font-semibold">Servidores E-mail (SMTP)</h3>
                                    <p className="text-gray-400 text-sm">
                                        Configure servidores SMTP para disparos de e-mail manuais ou automáticos.
                                    </p>

                                    <div className="space-y-4">
                                        {smtpConfigs.map(s => (
                                            <div key={s.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-medium">{s.host}:{s.port}</p>
                                                    <p className="text-xs text-gray-500">{s.fromEmail}</p>
                                                </div>
                                                <button onClick={() => handleDeleteSmtp(s.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
                                            </div>
                                        ))}

                                        <div className="p-6 rounded-xl border border-white/10 bg-black/20 space-y-4">
                                            <h4 className="text-sm font-medium text-white mb-2">Adicionar Novo Servidor</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <input placeholder="Host (ex: smtp.gmail.com)" value={newSmtp.host} onChange={e => setNewSmtp({ ...newSmtp, host: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                                                <input placeholder="Porta (ex: 587)" type="number" value={newSmtp.port} onChange={e => setNewSmtp({ ...newSmtp, port: parseInt(e.target.value) })} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                                                <input placeholder="Usuário/E-mail" value={newSmtp.user} onChange={e => setNewSmtp({ ...newSmtp, user: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                                                <input placeholder="Senha" type="password" value={newSmtp.pass} onChange={e => setNewSmtp({ ...newSmtp, pass: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                                                <input placeholder="E-mail de Remetente" value={newSmtp.fromEmail} onChange={e => setNewSmtp({ ...newSmtp, fromEmail: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm sm:col-span-2" />
                                            </div>
                                            <button onClick={handleAddSmtp} disabled={saving} className="btn-primary w-full text-sm py-2">
                                                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Adicionar SMTP"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-6 max-w-md animate-fade-in">
                                    <h3 className="text-xl font-semibold">Alterar Senha</h3>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Senha Atual</label>
                                        <input
                                            type="password"
                                            value={passwords.current}
                                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <label className="block text-sm text-gray-400 mb-2">Nova Senha</label>
                                        <input
                                            type="password"
                                            value={passwords.new}
                                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSavePassword}
                                        disabled={saving || !passwords.current || !passwords.new}
                                        className="btn-primary flex items-center gap-2 mt-4 bg-red-600 hover:bg-red-700 border-none"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                                        Atualizar Senha
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
