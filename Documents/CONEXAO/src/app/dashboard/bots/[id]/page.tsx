"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ShoppingBag,
    MessageSquare,
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
    Ticket
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
    const [activeTab, setActiveTab] = useState("overview");
    const [bot, setBot] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!botId) return;
        fetchBot();
    }, [botId]);

    async function fetchBot() {
        try {
            const res = await fetch(`/api/bots/${botId}`);
            if (res.ok) {
                const data = await res.json();
                setBot(data);
            } else {
                router.push("/dashboard/bots");
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

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando agente...</div>;
    }

    if (!bot) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/bots")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{bot.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${bot.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {bot.businessType} • {bot.sessionName ? "Online" : "Offline"}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => router.push(`/dashboard/create-bot?id=${botId}`)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Configurar
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/connect")}
                        className="btn-primary flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Conexão
                    </button>
                    {bot.connectionStatus === 'CONNECTED' && (
                        <button
                            onClick={handleDisconnect}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Desconectar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1 overflow-x-auto">
                <TabButton
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                    icon={<BarChart3 className="w-4 h-4" />}
                    label="Visão Geral"
                />
                <TabButton
                    active={activeTab === "products"}
                    onClick={() => setActiveTab("products")}
                    icon={<ShoppingBag className="w-4 h-4" />}
                    label="Catálogo"
                />
                <TabButton
                    active={activeTab === "coupons"}
                    onClick={() => setActiveTab("coupons")}
                    icon={<Ticket className="w-4 h-4" />}
                    label="Cupons"
                />
                <TabButton
                    active={activeTab === "media"}
                    onClick={() => setActiveTab("media")}
                    icon={<FileText className="w-4 h-4" />}
                    label="Materiais (PDF/Vídeo)"
                />
                <TabButton
                    active={activeTab === "simulator"}
                    onClick={() => setActiveTab("simulator")}
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="Simulador"
                />
                <TabButton
                    active={activeTab === "crm"}
                    onClick={() => setActiveTab("crm")}
                    icon={<Users className="w-4 h-4" />}
                    label="CRM (Clientes)"
                />
                <TabButton
                    active={activeTab === "agenda"}
                    onClick={() => setActiveTab("agenda")}
                    icon={<Calendar className="w-4 h-4" />}
                    label="Agenda"
                />
                <TabButton
                    active={activeTab === "security"}
                    onClick={() => setActiveTab("security")}
                    icon={<ShieldAlert className="w-4 h-4" />}
                    label="Segurança"
                />
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Total de Conversas</h3>
                            <p className="text-3xl font-bold text-gray-800">{bot._count?.conversations || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Total de Vendas</h3>
                            <p className="text-3xl font-bold text-gray-800">R$ 0,00</p>
                            <p className="text-xs text-gray-400 mt-1">Em desenvolvimento</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Produtos Ativos</h3>
                            <p className="text-3xl font-bold text-gray-800">{bot._count?.products || 0}</p>
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Simulator botId={botId} />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Dicas de Teste
                                </h3>
                                <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
                                    <li>Pergunte o preço dos produtos que você cadastrou.</li>
                                    <li>Tente negociar para ver a reação de vendas.</li>
                                    <li>Pergunte sobre a empresa para testar a personalidade.</li>
                                </ul>
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
                ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}


