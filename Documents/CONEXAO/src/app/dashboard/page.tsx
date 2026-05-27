"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Bot, MessageSquare, TrendingUp, Zap, Plus, Wifi, WifiOff, Building2, Phone, Mail, Settings, CreditCard, ChevronRight } from "lucide-react";
import OnboardingGuide from "@/components/Dashboard/OnboardingGuide";

interface AgencyInfo {
    name: string;
    whatsapp: string | null;
    email: string | null;
}

interface PrimaryBot {
    id: string;
    name: string;
    niche: string;
    connectionStatus: string;
    channels: { provider: string; identifier: string; status: string }[];
    _count: { conversations: number; contacts: number };
}

interface Analytics {
    bots: { total: number; active: number };
    conversations: number;
    messages: { total: number; received: number; sent: number; last24h: number };
    subscription: { plan: string; status: string } | null;
    usage: { messagesUsed: number; messagesLimit: number; botsUsed: number; botsLimit: number } | null;
    onboarding: {
        hasAiKeys: boolean;
        hasBots: boolean;
        hasConnections: boolean;
        hasElevenLabs: boolean;
        hasAsaas: boolean;
        hasVoiceConfig: boolean;
        hasAdvancedConfig: boolean;
    };
    isAgencyClient?: boolean;
    agencyInfo?: AgencyInfo | null;
    primaryBot?: PrimaryBot | null;
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

const CHANNEL_LABEL: Record<string, string> = {
    whatsapp: "📱 WhatsApp",
    instagram: "📸 Instagram",
    tiktok: "🎵 TikTok",
    facebook: "👍 Facebook",
    phone: "☎️ Telefone",
};

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

    const isAgencyClient = analytics?.isAgencyClient ?? false;
    const agencyInfo = analytics?.agencyInfo ?? null;
    const primaryBot = analytics?.primaryBot ?? null;

    const stats = [
        {
            label: "Mensagens (24h)",
            value: analytics?.messages?.last24h || 0,
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
            value: analytics?.bots?.active || 0,
            icon: Bot,
            color: "from-indigo-500 to-blue-400",
        },
        {
            label: "Total de Mensagens",
            value: analytics?.messages?.total || 0,
            icon: Zap,
            color: "from-amber-500 to-orange-400",
        },
    ];

    // ----------------------------------------------------------------
    // Agency client view
    // ----------------------------------------------------------------
    if (isAgencyClient) {
        return (
            <div className="p-4 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Olá, {session?.user?.name?.split(" ")[0] || "👋"}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Bem-vindo ao seu painel de controle
                        </p>
                    </div>
                    {/* Agency badge */}
                    {agencyInfo && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <Building2 size={16} className="text-purple-400 shrink-0" />
                            <span className="text-sm text-purple-300 font-medium">{agencyInfo.name}</span>
                        </div>
                    )}
                </div>

                {/* Primary Bot Card — prominent hero */}
                {primaryBot ? (
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                            {/* Status orb */}
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00a884]/20 to-emerald-800/20 border border-[#00a884]/30 flex items-center justify-center">
                                    <Bot size={32} className="text-[#00a884]" />
                                </div>
                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0f172a] ${primaryBot.connectionStatus === 'CONNECTED' ? 'bg-green-400 animate-pulse' : primaryBot.connectionStatus === 'QRCODE' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                            </div>

                            {/* Bot details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl font-bold text-white">{primaryBot.name}</h2>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 capitalize">{primaryBot.niche}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {primaryBot.channels.map((ch, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#00a884]/10 border border-[#00a884]/20 text-[#00a884]">
                                            {CHANNEL_LABEL[ch.provider] || ch.provider}
                                            {ch.identifier ? ` · ${ch.identifier}` : ''}
                                        </span>
                                    ))}
                                    {primaryBot.channels.length === 0 && (
                                        <span className="text-xs text-gray-500">Nenhum canal configurado</span>
                                    )}
                                </div>
                                <div className="flex gap-4 mt-3 text-sm text-gray-400">
                                    <span>{primaryBot._count.conversations} conversas</span>
                                    <span>{primaryBot._count.contacts} contatos</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                {primaryBot.connectionStatus !== 'CONNECTED' ? (
                                    <Link
                                        href={`/dashboard/connect?botId=${primaryBot.id}`}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
                                    >
                                        <WifiOff size={16} />
                                        Conectar
                                    </Link>
                                ) : (
                                    <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                                        <Wifi size={16} />
                                        Conectado
                                    </span>
                                )}
                                <Link
                                    href={`/dashboard/bots/${primaryBot.id}`}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
                                >
                                    <Settings size={16} />
                                    Gerenciar
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass rounded-2xl border border-white/10 p-10 text-center">
                        <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Seu agente está sendo configurado. Em breve estará disponível aqui.</p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* Quick Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/dashboard/crm" className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <TrendingUp size={20} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium">CRM Pipeline</p>
                            <p className="text-gray-500 text-xs mt-0.5">Gerencie seus leads e clientes</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </Link>
                    <Link href="/dashboard/finance" className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                            <CreditCard size={20} className="text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium">Financeiro</p>
                            <p className="text-gray-500 text-xs mt-0.5">Faturas e histórico de pagamentos</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </Link>
                    <Link href="/dashboard/settings" className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center shrink-0">
                            <Settings size={20} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium">Configurações</p>
                            <p className="text-gray-500 text-xs mt-0.5">Perfil, senha e preferências</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </Link>
                </div>

                {/* Agency contact footer card */}
                {agencyInfo && (
                    <div className="glass rounded-2xl p-5 border border-purple-500/20 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Building2 size={20} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium">Suporte — {agencyInfo.name}</p>
                            <p className="text-gray-400 text-sm mt-0.5">Seu agente é gerenciado por esta agência. Entre em contato caso precise de ajuda.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {agencyInfo.whatsapp && (
                                <a
                                    href={`https://wa.me/${agencyInfo.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                                >
                                    <Phone size={13} /> WhatsApp
                                </a>
                            )}
                            {agencyInfo.email && (
                                <a
                                    href={`mailto:${agencyInfo.email}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
                                >
                                    <Mail size={13} /> E-mail
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ----------------------------------------------------------------
    // Regular USER / ADMIN view
    // ----------------------------------------------------------------
    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Olá, {session?.user?.name || "👋"}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {analytics?.subscription && (
                            <>
                                {`Plano ${analytics.subscription.plan.charAt(0).toUpperCase() + analytics.subscription.plan.slice(1)} • ${analytics.subscription.status === 'active' ? '✅ Ativo' : '⚠️ ' + analytics.subscription.status}`}
                                {analytics?.usage && ` • ${analytics.usage.messagesUsed}/${analytics.usage.messagesLimit} mensagens`}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Link
                        href="/dashboard/create-bot"
                        className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm"
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

            {/* Onboarding Guide */}
            {analytics && analytics.onboarding && (
                <OnboardingGuide
                    onboarding={analytics.onboarding}
                />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            <div key={bot.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`shrink-0 w-3 h-3 rounded-full ${bot.connectionStatus === 'CONNECTED' ? 'bg-green-400 animate-pulse' : bot.connectionStatus === 'QRCODE' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                                    <div className="min-w-0">
                                        <p className="text-white font-medium truncate">{bot.name}</p>
                                        <p className="text-gray-400 text-sm truncate">{bot.businessType} • {bot._count?.conversations || 0} conversas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                                    {bot.connectionStatus === 'CONNECTED' ? (
                                        <span className="shrink-0 flex items-center gap-1 text-green-400 text-xs">
                                            <Wifi className="w-3 h-3" /> <span className="hidden xs:inline">Conectado</span>
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/dashboard/connect?botId=${bot.id}`}
                                            className={`shrink-0 flex items-center gap-1 text-xs hover:text-opacity-80 ${bot.connectionStatus === 'QRCODE' ? 'text-yellow-400' : 'text-amber-400'}`}
                                        >
                                            <WifiOff className="w-3 h-3" /> {bot.connectionStatus === 'QRCODE' ? 'QR' : 'Conectar'}
                                        </Link>
                                    )}
                                    <button
                                        onClick={async () => {
                                            if (confirm('Deseja duplicar este agente?')) {
                                                const res = await fetch(`/api/bots/${bot.id}/clone`, { method: 'POST' });
                                                if (res.ok) window.location.reload();
                                            }
                                        }}
                                        className="shrink-0 text-indigo-400 hover:text-indigo-300 text-xs"
                                    >
                                        Duplicar
                                    </button>
                                    <Link
                                        href={`/dashboard/create-bot?edit=${bot.id}`}
                                        className="shrink-0 text-gray-400 hover:text-white text-xs"
                                    >
                                        Editar
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
