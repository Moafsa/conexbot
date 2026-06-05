"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    ShoppingBag,
    MessageCircle,
    Settings,
    BarChart3,
    ArrowLeft,
    Users,
    Zap,
    FileText,
    RefreshCw,
    LogOut,
    Calendar,
    ShieldAlert,
    Ticket,
    Pause,
    Trash2
} from "lucide-react";
import { ProductManager } from "@/components/Dashboard/ProductManager";
import { MediaManager } from "@/components/Dashboard/MediaManager";
import { Simulator } from "@/components/Dashboard/Simulator";
import { CRMBoard } from "@/components/Dashboard/CRMBoard";
import { AgendaManager } from "@/components/Dashboard/AgendaManager";
import { SecuritySettings } from "@/components/Dashboard/SecuritySettings";
import { CouponManager } from "@/components/Dashboard/CouponManager";

export default function BotDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;
    const searchParams = useSearchParams();
    const clientId = searchParams.get("clientId");
    const [activeTab, setActiveTab] = useState("overview");
    const [bot, setBot] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!botId) return;
        fetchBot();
    }, [botId]);

    async function fetchBot() {
        try {
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/bots/${botId}${query}`);
            if (res.ok) {
                const data = await res.json();
                setBot(data);
            } else {
                router.push(`/dashboard/bots${clientId ? `?clientId=${clientId}` : ''}`);
            }
        } catch (error) {
            console.error("Error fetching bot", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDisconnect() {
        if (!confirm("Deseja desconectar o WhatsApp deste agente?")) return;
        try {
            setLoading(true);
            const res = await fetch('/api/whatsapp/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId })
            });

            if (res.ok) {
                alert("WhatsApp desconectado com sucesso!");
                fetchBot();
            } else {
                alert("Erro ao desconectar.");
            }
        } catch (error) {
            console.error("Error disconnecting bot", error);
            alert("Erro ao desconectar.");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleStatus() {
        const newStatus = bot.status === 'active' ? 'paused' : 'active';
        try {
            setLoading(true);
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/bots/${botId}${query}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setBot({ ...bot, status: newStatus });
            } else {
                alert("Erro ao atualizar status.");
            }
        } catch (error) {
            console.error("Error toggling bot status", error);
            alert("Erro ao atualizar status.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Tem certeza que deseja excluir este agente? Esta ação é irreversível.')) {
            return;
        }

        try {
            setLoading(true);
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/bots/${botId}${query}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push(`/dashboard/bots${clientId ? `?clientId=${clientId}` : ''}`);
            } else {
                alert('Erro ao excluir agente.');
            }
        } catch (error) {
            console.error('Failed to delete bot:', error);
            alert('Erro ao excluir agente.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando agente...</div>;
    }

    if (!bot) return null;

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/dashboard/bots${clientId ? `?clientId=${clientId}` : ''}`)}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{bot.name}</h1>
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">
                            <span className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></span>
                            {bot.businessType} • {bot.sessionName ? "Online" : "Offline"}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                            bot.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                    >
                        {bot.status === 'active' ? <Zap size={14} className="fill-current" /> : <Pause size={14} className="fill-current" />}
                        {bot.status === 'active' ? 'Ativo' : 'Pausado'}
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/create-bot?id=${botId}${clientId ? `&clientId=${clientId}` : ''}`)}
                        className="h-10 px-4 bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2"
                    >
                        <Settings size={14} />
                        Configurar
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/connect${clientId ? `?clientId=${clientId}` : ''}`)}
                        className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <RefreshCw size={14} />
                        Conexão
                    </button>
                    {bot.connectionStatus === 'CONNECTED' && (
                        <button
                            onClick={handleDisconnect}
                            className="h-10 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
                        >
                            <LogOut size={14} />
                            Desconectar
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="h-10 px-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-black rounded-xl border border-red-600/20 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        Excluir
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-full overflow-x-auto custom-scrollbar snap-x no-scrollbar">
                <TabButton
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                    icon={<BarChart3 size={16} />}
                    label="Visão Geral"
                />
                <TabButton
                    active={activeTab === "products"}
                    onClick={() => setActiveTab("products")}
                    icon={<ShoppingBag size={16} />}
                    label="Catálogo"
                />
                <TabButton
                    active={activeTab === "coupons"}
                    onClick={() => setActiveTab("coupons")}
                    icon={<Ticket size={16} />}
                    label="Cupons"
                />
                <TabButton
                    active={activeTab === "media"}
                    onClick={() => setActiveTab("media")}
                    icon={<FileText size={16} />}
                    label="Materiais"
                />
                <TabButton
                    active={activeTab === "simulator"}
                    onClick={() => setActiveTab("simulator")}
                    icon={<MessageCircle size={16} />}
                    label="Simulador"
                />
                <TabButton
                    active={activeTab === "crm"}
                    onClick={() => setActiveTab("crm")}
                    icon={<Users size={16} />}
                    label="CRM (Clientes)"
                />
                <TabButton
                    active={activeTab === "agenda"}
                    onClick={() => setActiveTab("agenda")}
                    icon={<Calendar size={16} />}
                    label="Agenda"
                />
                <TabButton
                    active={activeTab === "security"}
                    onClick={() => setActiveTab("security")}
                    icon={<ShieldAlert size={16} />}
                    label="Segurança"
                />
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MessageCircle size={100} />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total de Conversas</h3>
                            <p className="text-4xl font-black text-white leading-none">{bot._count?.conversations || 0}</p>
                        </div>
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Zap size={100} />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total de Vendas</h3>
                            <p className="text-4xl font-black text-emerald-400 leading-none">R$ 0,00</p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-2">Em desenvolvimento</p>
                        </div>
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ShoppingBag size={100} />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Produtos Ativos</h3>
                            <p className="text-4xl font-black text-white leading-none">{bot._count?.products || 0}</p>
                        </div>
                    </div>
                )}

                {activeTab === "products" && (
                    <ProductManager botId={botId} />
                )}

                {activeTab === "coupons" && (
                    <CouponManager botId={botId} />
                )}

                {activeTab === "media" && (
                    <MediaManager botId={botId} />
                )}

                {activeTab === "simulator" && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3">
                            <Simulator botId={botId} />
                        </div>
                        <div className="space-y-6">
                            <div className="bg-emerald-500/5 p-6 rounded-[32px] border border-emerald-500/10 relative overflow-hidden">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full"></div>
                                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Zap size={14} className="fill-current" />
                                    Dicas de Teste
                                </h3>
                                <ul className="text-sm text-gray-400 space-y-4">
                                    <li className="flex gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                                        Pergunte o preço dos produtos que você cadastrou.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                                        Tente negociar para ver a reação de vendas.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                                        Pergunte sobre a empresa para testar a personalidade.
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status do Agente</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-gray-300">Pronto para conversão</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "crm" && (
                    <CRMBoard botId={botId} />
                )}

                {activeTab === "agenda" && (
                    <AgendaManager botId={botId} />
                )}

                {activeTab === "security" && (
                    <SecuritySettings bot={bot} onUpdate={fetchBot} />
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap snap-center ${active
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}


