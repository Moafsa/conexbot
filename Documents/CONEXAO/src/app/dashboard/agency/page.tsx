"use client";
// aria-label placeholder

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
    ArrowUpRight,
    Sparkles,
    Bot,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

export default function AgencyDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [clients, setClients] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/agency/stats")
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setStats(data);
                }
            })
            .catch(err => {
                setError("Erro ao carregar métricas");
            });

        // Buscar dados detalhados de clientes e suas auditorias
        fetch("/api/agency/clients")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setClients(data);
                }
                setLoading(false);
            })
            .catch(() => {
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
            color: "text-cyan-400", 
            bg: "bg-cyan-400/10",
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

            {/* Jornada Sequencial do Sucesso */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-black flex items-center gap-3">
                                <Sparkles className="text-amber-400" />
                                Jornada de Sucesso da Agência (Passo a Passo)
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">Siga a trilha estratégica recomendada para ativar clientes, montar squads e faturar mais.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-4 py-2">
                            <span className="text-[10px] font-black tracking-widest text-[#00a884] uppercase">Seu Progresso:</span>
                            <span className="text-sm font-bold text-white">
                                {stats.activeClientsCount === 0 
                                    ? 20 
                                    : (stats.activeSubscriptionsCount === 0 ? 60 : 100)}%
                            </span>
                        </div>
                    </div>

                    {/* Step Map Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Chaves de API",
                                desc: "Configure OpenAI, Anthropic, Gemini e Asaas para ativar a inteligência.",
                                label: "Configurar Chaves",
                                href: "/dashboard/settings",
                                active: true
                            },
                            {
                                step: "02",
                                title: "Cadastrar Cliente",
                                desc: "Adicione as empresas que você vai gerenciar na plataforma.",
                                label: "Adicionar Cliente",
                                href: "/dashboard/agency/clients",
                                active: true
                            },
                            {
                                step: "03",
                                title: "Squad de IA",
                                desc: "Convoque o conselho de especialistas para traçar o plano.",
                                label: "Montar Squad",
                                href: "/dashboard/agency/squads",
                                active: stats.activeClientsCount > 0
                            },
                            {
                                step: "04",
                                title: "Workflow de IA",
                                desc: "Dispare o sequenciador de lançamento e planeje campanhas.",
                                label: "Rodar Sequenciador",
                                href: "/dashboard/agency/workflows",
                                active: stats.activeClientsCount > 0
                            },
                            {
                                step: "05",
                                title: "Conteúdo & Kanban",
                                desc: "Gere posts, carrosséis ou roteiros e gerencie as entregas.",
                                label: "Criar & Entregar",
                                href: "/dashboard/marketing",
                                active: stats.activeClientsCount > 0
                            }
                        ].map((item, idx) => (
                            <Link 
                                key={idx} 
                                href={item.href}
                                className={`group p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between text-left ${
                                    item.active 
                                    ? "bg-black/40 border-emerald-500/30 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5" 
                                    : "bg-white/[0.02] border-white/5 opacity-50 hover:opacity-75"
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md font-mono ${
                                            item.active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-500"
                                        }`}>
                                            PASSO {item.step}
                                        </span>
                                        {item.active && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
                                        )}
                                    </div>
                                    <h4 className="font-extrabold text-white text-sm group-hover:text-emerald-400 transition-colors">
                                        {item.title}
                                    </h4>
                                    <p className="text-[11px] text-gray-400 leading-normal line-clamp-3">
                                        {item.desc}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-400 group-hover:text-emerald-300">
                                    <span>{item.label}</span>
                                    <ChevronRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[40px] p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-2xl font-bold text-white">Pronto para escalar?</h3>
                            <p className="text-emerald-50 text-sm max-w-md">Adicione seus clientes finais e ative seus robôs de atendimento. Defina o valor de cobrança customizado direto no faturamento.</p>
                            <div className="flex gap-4 pt-2">
                                <Link href="/dashboard/agency/clients" className="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-black/20">
                                    Adicionar Cliente <ChevronRight size={18} />
                                </Link>
                                <Link href="/dashboard/settings" className="bg-black/20 text-white border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-black/30 transition-all">
                                    Configurações de API
                                </Link>
                            </div>
                        </div>
                        <Target size={120} className="absolute -bottom-8 -right-8 text-white/10 rotate-12" />
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <Sparkles className="text-emerald-500" />
                                Radar de Oportunidades de IA
                            </h3>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-emerald-500/20">
                                Sugestões Ativas
                            </span>
                        </div>

                        {/* Gerador de Cards de Oportunidades Dinâmico */}
                        {(() => {
                            const opportunities: any[] = [];

                            clients.forEach((c: any) => {
                                const lastAudit = c.clientAudits?.[0];
                                if (!lastAudit) {
                                    // Oportunidade: Cliente sem auditoria ainda
                                    opportunities.push({
                                        clientId: c.id,
                                        type: "NO_AUDIT",
                                        title: `Empresa ${c.name} sem Raio-X Ativo`,
                                        description: "O cliente ainda não possui nenhuma auditoria estratégica calculada pelo conselho de IAs. Descubra falhas e configure a melhor trilha de crescimento para este cliente.",
                                        actionLabel: "Gerar Auditoria",
                                        actionUrl: `/dashboard/agency/clients/${c.id}/audit`,
                                        badge: "Urgente",
                                        badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
                                        iconColor: "text-red-400 bg-red-500/10"
                                    });
                                } else {
                                    // Oportunidades baseadas nos scores de cada squad
                                    const sc = lastAudit.scores || {};
                                    
                                    if (sc.copy < 60) {
                                        opportunities.push({
                                            clientId: c.id,
                                            type: "SQUAD_RECOMMENDATION",
                                            title: `Melhoria Crítica em Copy: ${c.name}`,
                                            description: `A copy e poder de atração do site estão avaliados em ${sc.copy}/100. Recomendamos utilizar Gary Halbert no Copy Squad para reescrever as cartas de vendas e headlines.`,
                                            actionLabel: "Consultar Copy Squad",
                                            actionUrl: `/dashboard/agency/squads`,
                                            badge: "Copywriting",
                                            badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
                                            iconColor: "text-orange-400 bg-orange-500/10"
                                        });
                                    }

                                    if (sc.traffic < 60) {
                                        opportunities.push({
                                            clientId: c.id,
                                            type: "SQUAD_RECOMMENDATION",
                                            title: `Amplificar Tráfego de ${c.name}`,
                                            description: `A eficiência e distribuição das campanhas de tráfego pago estão em ${sc.traffic}/100. Pedro Sobral (Traffic Masters) pode traçar uma estrutura de escala 10x de budgets.`,
                                            actionLabel: "Consultar Tráfego",
                                            actionUrl: `/dashboard/agency/squads`,
                                            badge: "Tráfego Pago",
                                            badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
                                            iconColor: "text-red-400 bg-red-500/10"
                                        });
                                    }

                                    if (sc.brand < 60) {
                                        opportunities.push({
                                            clientId: c.id,
                                            type: "SQUAD_RECOMMENDATION",
                                            title: `Ajustar Posicionamento de Marca: ${c.name}`,
                                            description: `O alinhamento e diferenciação da marca estão pontuados em ${sc.brand}/100. Acione Marty Neumeier (Brand Squad) para construir um posicionamento único e disruptivo.`,
                                            actionLabel: "Consultar Brand Squad",
                                            actionUrl: `/dashboard/agency/squads`,
                                            badge: "Branding",
                                            badgeClass: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
                                            iconColor: "text-indigo-400 bg-indigo-500/10"
                                        });
                                    }

                                    if (sc.data < 60) {
                                        opportunities.push({
                                            clientId: c.id,
                                            type: "SQUAD_RECOMMENDATION",
                                            title: `Otimizar Taxa de Conversão & SEO: ${c.name}`,
                                            description: `A eficiência analítica e SEO técnico do site estão com nota ${sc.data}/100. Sean Ellis (Data Squad) pode traçar estratégias de Growth e rastreamento.`,
                                            actionLabel: "Consultar Data Squad",
                                            actionUrl: `/dashboard/agency/squads`,
                                            badge: "Growth & Dados",
                                            badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                                            iconColor: "text-emerald-400 bg-emerald-500/10"
                                        });
                                    }

                                    if (sc.strategy < 60) {
                                        opportunities.push({
                                            clientId: c.id,
                                            type: "SQUAD_RECOMMENDATION",
                                            title: `Reestruturar Oferta Comercial: ${c.name}`,
                                            description: `A atratividade comercial da oferta está com score ${sc.strategy}/100. Acione Alex Hormozi (Hormozi Squad) para redefinir as garantias e o valor percebido.`,
                                            actionLabel: "Consultar Hormozi",
                                            actionUrl: `/dashboard/agency/squads`,
                                            badge: "Oferta & Escala",
                                            badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                                            iconColor: "text-yellow-400 bg-yellow-500/10"
                                        });
                                    }
                                }
                            });

                            if (opportunities.length === 0) {
                                return (
                                    <div className="space-y-4 text-center py-12 border border-white/5 bg-[#0b0f1a]/30 rounded-2xl">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <CheckCircle2 className="text-emerald-400" size={24} />
                                        </div>
                                        <p className="text-gray-400 text-sm">Tudo excelente por aqui! Seus clientes estão em dia.</p>
                                        <p className="text-gray-600 text-xs">Crie novos clientes ou refaça auditorias para identificar oportunidades.</p>
                                    </div>
                                );
                            }

                            // Limitar a exibição das 4 oportunidades mais críticas
                            return (
                                <div className="space-y-4">
                                    {opportunities.slice(0, 4).map((opp, idx) => (
                                        <div 
                                            key={idx} 
                                            className="bg-[#0b0f1a]/80 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/20 transition-all duration-300 group"
                                        >
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${opp.badgeClass}`}>
                                                        {opp.badge}
                                                    </span>
                                                </div>
                                                <h4 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors">
                                                    {opp.title}
                                                </h4>
                                                <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                                                    {opp.description}
                                                </p>
                                            </div>

                                            <Link 
                                                href={opp.actionUrl}
                                                className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-emerald-500 hover:border-emerald-500 text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                {opp.actionLabel}
                                                <ChevronRight size={12} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
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
                            Agências que incluem o Escritor IA no pacote de seus clientes retêm 3x mais usuários. Defina uma cobrança recorrente customizada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
