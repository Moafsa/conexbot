"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DollarSign, TrendingUp, CreditCard, Download, Loader2, ArrowUpRight, Wallet, Receipt, AlertCircle } from "lucide-react";
import { Suspense } from "react";

function ErrorBanner() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    if (!error) return null;

    let message = "Ocorreu um erro na solicitação.";
    if (error === 'checkout_failed') {
        message = "Falha ao gerar o gateway de pagamento. Verifique se o sistema está configurado corretamente.";
    } else if (error === 'invalid_gateway') {
        message = "Gateway de pagamento inválido selecionado.";
    }

    return (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
                <p className="font-bold">Aviso</p>
                <p>{message}</p>
            </div>
        </div>
    );
}

export default function FinancePage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeInterval, setUpgradeInterval] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'>('MONTHLY');
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);

    // Orders Pagination
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersTotalPages, setOrdersTotalPages] = useState(1);
    const [ordersSearch, setOrdersSearch] = useState('');
    const [tableLoading, setTableLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        fetchStats();
        fetchPlans();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchOrders(ordersPage, ordersSearch);
        }, 300);
        return () => clearTimeout(timeout);
    }, [ordersPage, ordersSearch]);

    const fetchOrders = async (page = 1, search = '') => {
        setTableLoading(true);
        try {
            const res = await fetch(`/api/finance/orders?page=${page}&search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.data || []);
                setOrdersTotalPages(data.totalPages || 1);
                if (page > (data.totalPages || 1)) setOrdersPage(1);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setTableLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Deseja realmente cancelar esta fatura (isso cancelará no Asaas e manterá o registro como baixado)?')) return;
        
        try {
            const res = await fetch(`/api/finance/orders/${orderId}/cancel`, { method: 'POST' });
            if (res.ok) {
                alert('Fatura cancelada/baixada com sucesso!');
                fetchOrders(ordersPage, ordersSearch);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao cancelar a fatura.');
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Deseja realmente EXCLUIR esta fatura do banco de dados e do Asaas?')) return;
        try {
            const res = await fetch(`/api/finance/orders/${orderId}/delete`, { method: 'POST' });
            if (res.ok) {
                alert('Fatura excluída com sucesso!');
                fetchOrders(ordersPage, ordersSearch);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao excluir a fatura.');
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
        }
    };

    const handlePayOrder = async (orderId: string) => {
        if (!confirm('Deseja dar baixa manual nesta fatura (Quitar no Asaas)?')) return;
        try {
            const res = await fetch(`/api/finance/orders/${orderId}/pay`, { method: 'POST' });
            if (res.ok) {
                alert('Fatura quitada com sucesso!');
                fetchOrders(ordersPage, ordersSearch);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao quitar a fatura.');
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/finance/stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans");
            const data = await res.json();
            setAvailablePlans(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpgrade = (planId: string) => {
        // Redirect to checkout with selected plan and interval
        window.location.href = `/api/checkout/portal?planId=${planId}&interval=${upgradeInterval}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    const { summary, asaas, subscription, invoices } = stats || {};

    return (
        <div className="space-y-8 animate-fade-in">
            <Suspense fallback={null}>
                <ErrorBanner />
            </Suspense>
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

                {/* Plan Info Focus */}
                <div className="flex flex-col gap-6">
                    <div className="glass rounded-3xl p-8 border border-white/5 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Receipt size={20} className="text-purple-400" />
                                Assinatura
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                    <span className="text-gray-400 text-sm">Plano Atual</span>
                                    <div className="text-right">
                                        <span className="font-bold text-indigo-400 uppercase tracking-wider block">{subscription?.plan?.name || "Gratuito"}</span>
                                        {subscription?.status === 'TRIALING' && (
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Período de Teste</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                                    <span className="text-gray-400 text-sm">Status</span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {subscription?.status === 'TRIALING' ? 'TRIAL' : (subscription?.status || "INATIVO")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <button 
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="w-full btn-primary bg-indigo-600 hover:bg-indigo-500 py-4 font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                            >
                                Alterar Plano / Upgrade
                            </button>
                            <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">
                                {subscription?.periodEnd ? `Renovação: ${new Date(subscription.periodEnd).toLocaleDateString('pt-BR')}` : "Renovação: N/A"}
                            </p>
                        </div>
                    </div>

                    {/* Invoices List inside right column */}
                    <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Minhas Faturas</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2 block">
                            {(!invoices || invoices.length === 0) ? (
                                <p className="text-xs text-center text-gray-500 italic">Sem histórico de faturas.</p>
                            ) : (
                                invoices.map((inv: any) => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs hover:bg-white/10 transition">
                                        <div>
                                            <p className="font-bold text-gray-300">R$ {inv.amount.toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                                inv.status === 'PAID' || inv.status === 'RECEIVED' || inv.status === 'CONFIRMED'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : inv.status === 'OVERDUE' 
                                                    ? 'bg-red-500/20 text-red-400' 
                                                    : 'bg-orange-500/20 text-orange-400'
                                            }`}>
                                                {inv.status === 'PAID' || inv.status === 'RECEIVED' || inv.status === 'CONFIRMED' ? 'PAGO' : inv.status}
                                            </span>
                                            {inv.invoiceUrl && inv.status !== 'PAID' && inv.status !== 'RECEIVED' && inv.status !== 'CONFIRMED' && (
                                                <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline">
                                                    Pagar Fatura
                                                </a>
                                            )}
                                            {inv.invoiceUrl && (inv.status === 'PAID' || inv.status === 'RECEIVED' || inv.status === 'CONFIRMED') && (
                                                <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-gray-300 underline">
                                                    Recibo
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Modal */}
            {isUpgradeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111]">
                            <h2 className="text-xl font-bold">Escolha seu novo Plano</h2>
                            <button onClick={() => setIsUpgradeModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <AlertCircle size={24} className="rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-center mb-8">
                                <div className="glass p-1 rounded-2xl border-white/5 flex gap-1">
                                    {[
                                        { id: 'MONTHLY', label: 'Mensal' },
                                        { id: 'QUARTERLY', label: 'Trimestral' },
                                        { id: 'SEMIANNUAL', label: 'Semestral' },
                                        { id: 'YEARLY', label: 'Anual' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setUpgradeInterval(opt.id as any)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${upgradeInterval === opt.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {availablePlans.map((plan: any) => (
                                    <div key={plan.id} className={`glass p-6 rounded-2xl border border-white/5 flex flex-col hover:border-indigo-500/30 transition-all ${subscription?.planId === plan.id ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5' : ''}`}>
                                        <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                                        <div className="text-2xl font-black mb-4">
                                            R$ {((upgradeInterval === 'QUARTERLY' ? plan.priceQuarterly : upgradeInterval === 'SEMIANNUAL' ? plan.priceSemiannual : upgradeInterval === 'YEARLY' ? plan.priceYearly : plan.price) || plan.price).toLocaleString('pt-BR')}
                                            <span className="text-[10px] text-gray-500 font-normal uppercase ml-1">
                                                {upgradeInterval === 'MONTHLY' ? '/mês' : upgradeInterval === 'QUARTERLY' ? '/tri' : upgradeInterval === 'SEMIANNUAL' ? '/sem' : '/ano'}
                                            </span>
                                        </div>
                                        <ul className="space-y-2 mb-6 text-xs text-gray-400">
                                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full"/> {plan.botLimit} Agentes</li>
                                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full"/> {plan.messageLimit === 0 ? 'Ilimitado' : `${plan.messageLimit} Mensagens`}</li>
                                        </ul>
                                        <button 
                                            disabled={subscription?.planId === plan.id && subscription?.interval === upgradeInterval}
                                            onClick={() => handleUpgrade(plan.id)}
                                            className={`mt-auto py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${subscription?.planId === plan.id ? 'bg-white/5 text-gray-500 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'}`}
                                        >
                                            {subscription?.planId === plan.id ? 'PLANO ATUAL' : 'SELECIONAR'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Commissions & Sales Table */}
            <div className="glass rounded-3xl p-8 border border-white/5 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Receipt size={20} className="text-emerald-400" />
                        Vendas por Agente e Comissões
                    </h3>
                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou bot..."
                            value={ordersSearch}
                            onChange={(e) => { setOrdersSearch(e.target.value); setOrdersPage(1); }}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm focus:border-indigo-500 outline-none transition-all w-full text-white"
                        />
                        <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500">
                                <th className="pb-4 font-black">Data</th>
                                <th className="pb-4 font-black">Bot / Agente</th>
                                <th className="pb-4 font-black">Cliente</th>
                                <th className="pb-4 font-black">Valor (R$)</th>
                                <th className="pb-4 font-black">Comissão (R$)</th>
                                <th className="pb-4 font-black">Status</th>
                                <th className="pb-4 font-black text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 relative">
                            {tableLoading && (
                                <tr>
                                    <td colSpan={6} className="py-12">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="animate-spin text-white/30" size={24} />
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!tableLoading && orders.map((order: any) => (
                                <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-2 text-xs text-gray-300">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                                    <td className="py-4 px-2 text-xs font-bold text-white uppercase">{order.botName || "N/A"}</td>
                                    <td className="py-4 px-2 text-xs text-gray-400">{order.contactName || "Cliente"}</td>
                                    <td className="py-4 px-2 text-xs text-emerald-400 font-bold">R$ {order.total.toFixed(2)}</td>
                                    <td className="py-4 px-2 text-xs text-indigo-400 font-bold">R$ {order.commission?.toFixed(2) || "0,00"}</td>
                                    <td className="py-4 px-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${order.status === 'PAID' ? 'bg-green-500/20 text-green-400' : order.status === 'CANCELED' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {order.status === 'PAID' ? 'PAGO' : order.status === 'CANCELED' ? 'CANCELADO (BAIXADO)' : 'PENDENTE'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        {order.status !== 'PAID' && order.status !== 'CANCELED' && (
                                            <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1 justify-end">
                                                <button 
                                                    onClick={() => handlePayOrder(order.id)}
                                                    className="text-[9px] font-bold tracking-widest uppercase text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                                                >
                                                    Quitar
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="text-[9px] font-bold tracking-widest uppercase text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/20 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="text-[9px] font-bold tracking-widest uppercase text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/20 transition-colors"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                        {order.status === 'CANCELED' && (
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="text-[9px] font-bold tracking-widest uppercase text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/20 transition-colors"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!tableLoading && orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-xs text-gray-500 italic uppercase">Sem vendas registradas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!tableLoading && ordersTotalPages > 1 && (
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-black">
                            Página <span className="text-white">{ordersPage}</span> de <span className="text-white">{ordersTotalPages}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={ordersPage === 1}
                                onClick={() => setOrdersPage(ordersPage - 1)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={ordersPage === ordersTotalPages}
                                onClick={() => setOrdersPage(ordersPage + 1)}
                                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
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
