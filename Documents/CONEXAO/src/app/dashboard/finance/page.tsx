"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, CreditCard, Download, Loader2, ArrowUpRight, Wallet, Receipt, AlertCircle } from "lucide-react";

export default function FinancePage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch("/api/finance/stats")
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    const { summary, asaas, subscription } = stats || {};

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Financeiro Avançado
                    </h1>
                    <p className="text-gray-400 mt-1">Gestão de faturamento, vendas e plano.</p>
                </div>

                <div className="flex gap-2">
                    <button className="btn-secondary flex items-center gap-2 group">
                        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Faturamento Total"
                    value={`R$ ${summary?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign size={20} />}
                    trend="+12.5%"
                    color="green"
                />
                <StatCard
                    title="Saldo Asaas"
                    value={`R$ ${asaas?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<Wallet size={20} />}
                    trend={asaas?.isLinked ? "Sincronizado" : "Não vinculado"}
                    color="blue"
                    error={asaas?.error}
                />
                <StatCard
                    title="Vendas Pagas"
                    value={summary?.paidOrders || 0}
                    icon={<ArrowUpRight size={20} />}
                    trend={`${summary?.pendingOrders || 0} pendentes`}
                    color="purple"
                />
                <StatCard
                    title="Ticket Médio"
                    value={`R$ ${summary?.averageTicket?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    icon={<TrendingUp size={20} />}
                    trend="Últimos 30 dias"
                    color="indigo"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart Placeholder/Simulated */}
                <div className="lg:col-span-2 glass rounded-3xl p-8 border border-white/5 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-400" />
                            Performance de Faturamento
                        </h3>
                        <div className="flex bg-white/5 rounded-lg p-1 text-xs">
                            <button className="px-3 py-1 bg-white/10 rounded-md">7 dias</button>
                            <button className="px-3 py-1 hover:bg-white/5 rounded-md text-gray-400">30 dias</button>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end gap-3 pb-4">
                        {/* Simulated Bar Chart */}
                        {[40, 60, 45, 90, 65, 80, 55].map((height, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div
                                    className="bg-gradient-to-t from-indigo-500/10 to-indigo-500/40 group-hover:from-indigo-500/20 group-hover:to-indigo-500/60 transition-all rounded-t-lg"
                                    style={{ height: `${height}%` }}
                                ></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 px-2 py-1 rounded text-[10px] whitespace-nowrap">
                                    R$ {(height * 10).toFixed(2)}
                                </div>
                                <div className="text-[10px] text-gray-500 text-center mt-2">
                                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plan Info */}
                <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Receipt size={20} className="text-purple-400" />
                            Assinatura
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                <span className="text-gray-400 text-sm">Plano Atual</span>
                                <span className="font-bold text-indigo-400 uppercase tracking-wider">{subscription?.plan || "Gratuito"}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                <span className="text-gray-400 text-sm">Status</span>
                                <span className="text-xs font-bold px-2 py-1 bg-green-500/20 text-green-400 rounded-full uppercase">
                                    {subscription?.status || "ATIVO"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <button className="w-full btn-primary bg-indigo-600 hover:bg-indigo-500 py-4 font-bold">
                            Fazer Upgrade
                        </button>
                        <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">
                            Próxima renovação: 12/03/2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color, error }: any) {
    const colors: any = {
        green: "border-green-500/30 text-green-400 bg-green-500/5",
        blue: "border-blue-500/30 text-blue-400 bg-blue-500/5",
        purple: "border-purple-500/30 text-purple-400 bg-purple-500/5",
        indigo: "border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
    };

    return (
        <div className={`glass p-6 rounded-3xl border ${colors[color]} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
            {/* Subtle light effect on hover */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-current opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.1] transition-opacity"></div>

            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-white/10 rounded-xl relative z-10">
                    {icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${color === 'green' ? 'bg-green-500/20' : 'bg-white/10'} text-gray-300 uppercase tracking-tighter`}>
                    {trend}
                </span>
            </div>

            <p className="text-gray-400 text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>

            {error && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-red-400 bg-red-400/10 p-2 rounded-lg">
                    <AlertCircle size={10} />
                    {error}
                </div>
            )}
        </div>
    );
}
