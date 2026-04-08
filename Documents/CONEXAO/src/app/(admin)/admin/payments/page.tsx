'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Calendar, User, Search, Package, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsAdminPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPayments, setTotalPayments] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchPayments(search, page);
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, page]);

    const [stats, setStats] = useState<any[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const fetchPayments = async (searchQuery = "", pageNum = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/payments?page=${pageNum}&search=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.data);
                setTotalPages(data.totalPages);
                setTotalPayments(data.total);
                setStats(data.stats || []);
                setTotalRevenue(data.totalRevenue || 0);
            }
        } catch (error) {
            console.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const handlePayPayment = async (id: string) => {
        if (!confirm('Deseja realmente dar baixa manual nesta fatura? O plano do cliente será ativado imediatamente.')) return;
        
        try {
            const res = await fetch(`/api/admin/payments/${id}/pay`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast.success('Fatura liquidada com sucesso!');
                fetchPayments(search, page);
            } else {
                toast.error(data.error || 'Falha ao processar pagamento');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        }
    };

    const handleCancelPayment = async (id: string) => {
        if (!confirm('Deseja cancelar esta fatura?')) return;
        
        try {
            const res = await fetch(`/api/admin/payments/${id}/cancel`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast.success('Fatura cancelada com sucesso!');
                fetchPayments(search, page);
            } else {
                toast.error(data.error || 'Falha ao cancelar fatura');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Financeiro</h1>
                    <p className="text-gray-400 mt-2">Gestão centralizada de faturamento e splits.</p>
                </div>
                
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 w-full md:w-80 shadow-inner">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
                    />
                </div>
            </div>

            {/* Sumário e Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-3xl shadow-xl">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Faturamento Total</p>
                    <h2 className="text-4xl font-extrabold text-emerald-500 tracking-tighter">
                        R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                        <CreditCard size={12} className="text-emerald-500" />
                        <span>Pagamentos recebidos/vencidos</span>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Distribuição por Serviço</p>
                        <div className="space-y-4">
                            {stats.map((s, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-300 uppercase">{s.type === 'WRITER_PLUGIN' ? 'AI Writer Plugin' : 'Bots / Plataforma'}</span>
                                        <span className="text-white">R$ {s.total.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${s.type === 'WRITER_PLUGIN' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${(s.total / (totalRevenue || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.length === 0 && <p className="text-xs text-gray-600 italic">Sem dados suficientes para gerar o gráfico.</p>}
                        </div>
                    </div>

                    <div className="w-px bg-[#1a1a1a] hidden md:block" />

                    <div className="flex-1 flex items-center justify-center p-4">
                        {/* Gráfico de Rosca em SVG Customizado */}
                        <div className="relative w-32 h-32 flex items-center justify-center">
                           <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                {stats.map((s, i) => {
                                    const percentage = (s.total / (totalRevenue || 1)) * 100;
                                    const offset = stats.slice(0, i).reduce((acc, curr) => acc + (curr.total / (totalRevenue || 1)) * 100, 0);
                                    return (
                                        <circle
                                            key={i}
                                            cx="18"
                                            cy="18"
                                            r="16"
                                            fill="none"
                                            stroke={s.type === 'WRITER_PLUGIN' ? '#3b82f6' : '#10b981'}
                                            strokeWidth="3.5"
                                            strokeDasharray={`${percentage} ${100 - percentage}`}
                                            strokeDashoffset={-offset}
                                            className="transition-all duration-1000"
                                        />
                                    );
                                })}
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Market</span>
                                <span className="text-lg font-bold">Mix</span>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Serviço / Cliente</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Bruto</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Fatura / Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Carregando transações...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhum pagamento registrado.</td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${payment.type === 'WRITER_PLUGIN' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                                                    <Package size={18} className={payment.type === 'WRITER_PLUGIN' ? 'text-blue-400' : 'text-emerald-400'} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-tight">{payment.tenant.name || 'Sem nome'}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${payment.type === 'WRITER_PLUGIN' ? 'border-blue-500/30 text-blue-400' : 'border-emerald-500/30 text-emerald-400'}`}>
                                                            {payment.type === 'WRITER_PLUGIN' ? 'AI WRITER' : 'BOT SYSTEM'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{payment.tenant.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg text-white">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                <span className="text-[9px] text-gray-600 font-mono">ASAAS: {payment.externalId || 'LOCAL'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'PAID'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : payment.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-gray-400 font-medium">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar size={12} />
                                                    <span>{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-600">{new Date(payment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {payment.invoiceUrl && (
                                                    <a
                                                        href={payment.invoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center space-x-2 text-white hover:text-emerald-400 text-xs font-bold bg-[#151515] hover:bg-[#222] px-4 py-2 rounded-xl transition-all border border-[#222] group/link"
                                                    >
                                                        <CreditCard size={14} className="text-emerald-500 group-hover/link:scale-110 transition-transform" />
                                                        <span>Fatura</span>
                                                        <ExternalLink size={10} className="opacity-50" />
                                                    </a>
                                                )}
                                                
                                                {/* Botões de Ação para faturas pendentes */}
                                                {(payment.status === 'PENDING' || payment.status === 'OVERDUE') && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <button 
                                                            onClick={() => handlePayPayment(payment.id)}
                                                            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20"
                                                            title="Baixa Manual"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancelPayment(payment.id)}
                                                            className="p-2 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20 hover:bg-orange-500/20"
                                                            title="Cancelar"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-[#1a1a1a] bg-[#0d0d0d]">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#1a1a1a] rounded-lg hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-gray-400 font-medium">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#1a1a1a] rounded-lg hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
