"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Bot, MessageSquare, TrendingUp, Zap, Plus, Wifi, WifiOff } from "lucide-react";

interface Analytics {
    bots: { total: number; active: number };
    conversations: number;
    messages: { total: number; received: number; sent: number; last24h: number };
    subscription: { plan: string; status: string } | null;
    usage: { messagesUsed: number; messagesLimit: number; botsUsed: number; botsLimit: number } | null;
}

interface BotItem {
    id: string;
    name: string;
    businessType: string;
    status: string;
    sessionName: string | null;
    connectionStatus: string;
    _count?: { conversations: number };
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [bots, setBots] = useState<BotItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/analytics").then(r => r.json()),
            fetch("/api/bots").then(r => r.json()),
        ]).then(([analyticsData, botsData]) => {
            setAnalytics(analyticsData);
            setBots(Array.isArray(botsData) ? botsData : []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        {
            label: "Mensagens (24h)",
            value: analytics?.messages.last24h || 0,
            icon: MessageSquare,
            color: "from-blue-500 to-cyan-400",
        },
        {
            label: "Conversas Ativas",
            value: analytics?.conversations || 0,
            icon: TrendingUp,
            color: "from-green-500 to-emerald-400",
        },
        {
            label: "Agentes Ativos",
            value: analytics?.bots.active || 0,
            icon: Bot,
            color: "from-indigo-500 to-blue-400",
        },
        {
            label: "Total de Mensagens",
            value: analytics?.messages.total || 0,
            icon: Zap,
            color: "from-amber-500 to-orange-400",
        },
    ];

    return (
        <>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Olá, {session?.user?.name || "👋"}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {analytics?.subscription
                            ? `Plano ${analytics.subscription.plan.charAt(0).toUpperCase() + analytics.subscription.plan.slice(1)} • ${analytics.subscription.status === 'active' ? '✅ Ativo' : '⚠️ ' + analytics.subscription.status}`
                            : "Plano Gratuito • "}
                        {analytics?.usage
                            ? `${analytics.usage.messagesUsed}/${analytics.usage.messagesLimit} mensagens`
                            : ""}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/create-bot"
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Novo Agente
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
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

            {/* Active Bots */}
            <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-white">Seus Agentes</h2>
                    <Link href="/dashboard/bots" className="text-indigo-400 text-sm hover:text-indigo-300">
                        Ver todos →
                    </Link>
                </div>

                {bots.length === 0 ? (
                    <div className="text-center py-12">
                        <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Você ainda não tem agentes.</p>
                        <Link href="/dashboard/create-bot" className="btn-primary px-6 py-2 text-sm">
                            Criar Primeiro Agente
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bots.map((bot) => (
                            <div key={bot.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${bot.connectionStatus === 'CONNECTED' ? 'bg-green-400 animate-pulse' : bot.connectionStatus === 'QRCODE' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                                    <div>
                                        <p className="text-white font-medium">{bot.name}</p>
                                        <p className="text-gray-400 text-sm">{bot.businessType} • {bot._count?.conversations || 0} conversas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {bot.connectionStatus === 'CONNECTED' ? (
                                        <span className="flex items-center gap-1 text-green-400 text-xs">
                                            <Wifi className="w-3 h-3" /> Conectado
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/dashboard/connect?botId=${bot.id}`}
                                            className={`flex items-center gap-1 text-xs hover:text-opacity-80 ${bot.connectionStatus === 'QRCODE' ? 'text-yellow-400' : 'text-amber-400'}`}
                                        >
                                            <WifiOff className="w-3 h-3" /> {bot.connectionStatus === 'QRCODE' ? 'Escanear QR' : 'Conectar'}
                                        </Link>
                                    )}
                                    <Link
                                        href={`/dashboard/create-bot?edit=${bot.id}`}
                                        className="text-gray-400 hover:text-white text-xs"
                                    >
                                        Editar
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
