"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    Users, 
    TrendingUp, 
    DollarSign, 
    Briefcase,
    ChevronRight,
    Target,
    Zap,
    ArrowUpRight
} from "lucide-react";

export default function AgencyDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/agency/stats")
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setStats(data);
                }
                setLoading(false);
            })
            .catch(err => {
                setError("Erro ao carregar métricas");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center text-white">Carregando métricas da agência...</div>;
    
    if (error) return (
        <div className="p-8 text-center text-white">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-md mx-auto">
                <p className="text-red-400 font-bold text-lg mb-2">⚠️ Sem Perfil de Agência</p>
                <p className="text-gray-400 text-sm">{error}</p>
            </div>
        </div>
    );

    if (!stats) return null;

    const cards = [
        { 
            label: "Clientes Ativos", 
            value: stats.activeClientsCount, 
            icon: Users, 
            color: "text-blue-400", 
            bg: "bg-blue-400/10",
            description: "Total de empresas sob sua gestão"
        },
        { 
            label: "Assinaturas", 
            value: stats.activeSubscriptionsCount, 
            icon: Briefcase, 
            color: "text-emerald-400", 
            bg: "bg-emerald-400/10",
            description: "Serviços ativos no momento"
        },
        { 
            label: "Receita Mensal (MRR)", 
            value: `R$ ${stats.totalMonthlyRevenue.toFixed(2)}`, 
            icon: DollarSign, 
            color: "text-purple-400", 
            bg: "bg-purple-400/10",
            description: "Faturamento bruto recorrente"
        },
        { 
            label: "Lucro Estimado", 
            value: `R$ ${stats.estimatedMonthlyProfit.toFixed(2)}`, 
            icon: TrendingUp, 
            color: "text-orange-400", 
            bg: "bg-orange-400/10",
            description: `Após R$ ${stats.platformCommission?.toFixed(2)} de taxa`
        },
        { 
            label: "Vendas (Mês)", 
            value: `R$ ${stats.salesVolumeCurrentMonth.toFixed(2)}`, 
            icon: Zap, 
            color: "text-yellow-400", 
            bg: "bg-yellow-400/10",
            description: "Volume total processado este mês"
        }
    ];

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black flex items-center gap-4 tracking-tighter">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Zap size={28} className="text-white" />
                        </div>
                        Portal da Agência
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Acompanhe o crescimento e a lucratividade do seu ecossistema.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                    <div className="px-4 py-2">
                        <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Taxa de Plataforma</p>
                        <p className="text-xl font-bold text-emerald-400">{stats.currentFee}%</p>
                    </div>
                    <div className="h-10 w-px bg-white/10"></div>
                    <button 
                        onClick={() => alert(`O sistema de Upgrade de Tier é automático baseado no seu faturamento mensal (MRR). Ao atingir R$ ${stats.tierInfo?.nextTierLimit.toLocaleString() || "5.000"} de MRR, você subirá para o ${stats.tierInfo?.nextTierName || "próximo Tier"} automaticamente!`)}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold transition-all text-sm"
                    >
                        Upgrade Tier
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-4 hover:border-white/20 transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} blur-3xl -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                            <ArrowUpRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        
                        <div className="space-y-1 relative z-10">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">{card.label}</p>
                            <h2 className="text-3xl font-bold tracking-tight">{card.value}</h2>
                            <p className="text-[10px] text-gray-600 font-medium">{card.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[40px] p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-2xl font-bold text-white">Pronto para escalar?</h3>
                            <p className="text-emerald-50 text-sm max-w-md">Configure novos produtos em sua tabela e convide clientes para sua base. Lembre-se: sua margem é você quem define.</p>
                            <div className="flex gap-4 pt-2">
                                <Link href="/dashboard/agency/pricing" className="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-black/20">
                                    Ajustar Tabela <ChevronRight size={18} />
                                </Link>
                                <Link href="/dashboard/agency/clients" className="bg-black/20 text-white border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-black/30 transition-all">
                                    Ver Meus Clientes
                                </Link>
                            </div>
                        </div>
                        <Target size={120} className="absolute -bottom-8 -right-8 text-white/10 rotate-12" />
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <ArrowUpRight className="text-emerald-500" />
                            Últimas Atividades
                        </h3>
                        <div className="space-y-4 text-center py-12">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <Users size={24} className="text-gray-600" />
                            </div>
                            <p className="text-gray-500 text-sm">Nenhuma atividade recente registrada.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
                        <h3 className="font-bold text-lg">Resumo de Tier</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <p className="text-xs font-black uppercase text-emerald-500 tracking-tighter">Tier Atual</p>
                                <p className="text-xl font-bold">{stats.tierInfo?.currentTierName || "Bronze"}</p>
                                <p className="text-[10px] text-gray-500 mt-1">Taxa fixa de {stats.currentFee}% sobre o MRR</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">Progresso para {stats.tierInfo?.nextTierName || "Tier Prata"}</span>
                                    <span className="text-emerald-400">R$ {stats.salesVolumeCurrentMonth.toFixed(0)} / R$ {(stats.tierInfo?.nextTierLimit || 5000).toLocaleString()}</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000" 
                                        style={{ width: `${Math.min(stats.tierInfo?.progress || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[40px] p-8 space-y-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl w-fit text-white">
                            <Zap size={24} />
                        </div>
                        <h4 className="font-bold text-indigo-300">Dica Pro: Escritor IA</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Agências que incluem o Escritor IA no pacote de seus clientes retêm 3x mais usuários. Defina um markup atrativo em sua tabela.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
