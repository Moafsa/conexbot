"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Bell, Shield, Smartphone, Loader2, Save, Check, AlertCircle, DollarSign } from "lucide-react";
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
                    <TabButton id="finance" label="Financeiro & Pagamentos" icon={DollarSign} />
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
                                        <p className="mt-2 text-xs text-gray-500">
                                            Você pode encontrar essa chave no painel do Asaas em Minha Conta `{'>'}` Integrações.
                                        </p>
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
