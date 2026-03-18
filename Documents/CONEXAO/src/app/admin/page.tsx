"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Bot, DollarSign, Activity, Settings, Save, Globe } from "lucide-react";
import { toast } from "sonner";

interface AdminData {
    totalTenants: number;
    totalBots: number;
    totalMessages: number;
    activeSubscriptions: number;
    recentTenants: Array<{
        id: string;
        name: string | null;
        email: string;
        createdAt: string;
        _count: { bots: number };
    }>;
}

export default function AdminPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [globalConfig, setGlobalConfig] = useState({
        googleClientId: "",
        googleClientSecret: "",
        supportEmail: "",
        supportWhatsapp: "",
        maintenanceMode: false
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then(r => r.ok ? r.json() : { recentTenants: [], totalTenants: 0, totalBots: 0, totalMessages: 0, activeSubscriptions: 0 })
            .then(setData)
            .catch(() => setData({ recentTenants: [], totalTenants: 0, totalBots: 0, totalMessages: 0, activeSubscriptions: 0 }))
            .finally(() => setLoading(false));

        fetch("/api/admin/config")
            .then(r => r.ok ? r.json() : null)
            .then(c => c && !("error" in c) ? setGlobalConfig((prev) => ({ ...prev, ...c })) : null)
            .catch(console.error);
    }, []);

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(globalConfig)
            });
            if (res.ok) toast.success("Configurações globais salvas!");
            else toast.error("Erro ao salvar.");
        } catch (err) {
            toast.error("Falha na conexão.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        { label: "Total Clientes", value: data?.totalTenants || 0, icon: Users, color: "from-blue-500 to-cyan-400" },
        { label: "Bots Ativos", value: data?.totalBots || 0, icon: Bot, color: "from-green-500 to-emerald-400" },
        { label: "Assinaturas Ativas", value: data?.activeSubscriptions || 0, icon: DollarSign, color: "from-amber-500 to-orange-400" },
        { label: "Total Mensagens", value: data?.totalMessages || 0, icon: Activity, color: "from-indigo-500 to-blue-400" },
    ];

    return (
        <>
            <h1 className="text-2xl font-bold text-white mb-8">Painel Administrativo</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map(stat => (
                    <div key={stat.label} className="glass rounded-2xl p-6 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-gray-400 text-sm">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="glass rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-400" /> Configurações do Sistema
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Logo Colorida (Favicon)</label>
                                <input
                                    value={(globalConfig as any).logoColoredUrl || ""}
                                    onChange={e => setGlobalConfig({ ...globalConfig, logoColoredUrl: e.target.value } as any)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="https://..."
                                />
                                {(globalConfig as any).logoColoredUrl && (
                                    <img src={(globalConfig as any).logoColoredUrl} className="h-8 mt-2 rounded bg-white/10 p-1" alt="Preview"/>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Logo Branca (Dark Mode)</label>
                                <input
                                    value={(globalConfig as any).logoWhiteUrl || ""}
                                    onChange={e => setGlobalConfig({ ...globalConfig, logoWhiteUrl: e.target.value } as any)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                    placeholder="https://..."
                                />
                                {(globalConfig as any).logoWhiteUrl && (
                                    <img src={(globalConfig as any).logoWhiteUrl} className="h-8 mt-2 rounded bg-black/40 p-1 border border-white/10" alt="Preview"/>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Google Client ID</label>
                            <input
                                value={globalConfig.googleClientId}
                                onChange={e => setGlobalConfig({ ...globalConfig, googleClientId: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                placeholder="8273...apps.googleusercontent.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Google Client Secret</label>
                            <input
                                type="password"
                                value={globalConfig.googleClientSecret}
                                onChange={e => setGlobalConfig({ ...globalConfig, googleClientSecret: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                placeholder="GOCSPX-..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Email de Suporte</label>
                            <input
                                value={globalConfig.supportEmail}
                                onChange={e => setGlobalConfig({ ...globalConfig, supportEmail: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                placeholder="suporte@conexbot.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">WhatsApp de Suporte</label>
                            <input
                                value={globalConfig.supportWhatsapp}
                                onChange={e => setGlobalConfig({ ...globalConfig, supportWhatsapp: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                placeholder="5511999999999"
                            />
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                        >
                            {saving ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                            Salvar Configurações
                        </button>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-semibold text-white mb-6">Clientes Recentes</h2>
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10">
                                    <th className="text-left py-3 px-4">Nome</th>
                                    <th className="text-center py-3 px-4">Bots</th>
                                    <th className="text-left py-3 px-4">Cadastro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.recentTenants ?? []).map(tenant => (
                                    <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-white">{tenant.name || "-"}</div>
                                            <div className="text-[10px] text-gray-500">{tenant.email}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-white">{tenant._count.bots}</td>
                                        <td className="py-3 px-4 text-gray-400">
                                            {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
