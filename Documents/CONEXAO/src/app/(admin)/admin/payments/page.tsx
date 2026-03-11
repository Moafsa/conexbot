'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Calendar, User, Search } from 'lucide-react';

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

    const fetchPayments = async (searchQuery = "", pageNum = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/payments?page=${pageNum}&search=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.data);
                setTotalPages(data.totalPages);
                setTotalPayments(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPayment = async (paymentId: string) => {
        if (!confirm('Deseja realmente cancelar este pagamento (isso cancelará a fatura/assinatura no Asaas)?')) return;
        
        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/cancel`, { method: 'POST' });
            if (res.ok) {
                alert('Fatura cancelada/baixada com sucesso!');
                fetchPayments(search, page);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao cancelar a fatura.');
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!confirm('Deseja realmente EXCLUIR este pagamento do banco de dados e do Asaas?')) return;
        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/delete`, { method: 'POST' });
            if (res.ok) {
                alert('Fatura excluída com sucesso!');
                fetchPayments(search, page);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao excluir a fatura.');
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
        }
    };

    const handlePayPayment = async (paymentId: string) => {
        if (!confirm('Deseja dar baixa manual nesta fatura (Quitar no Asaas)?')) return;
        try {
            const res = await fetch(`/api/admin/payments/${paymentId}/pay`, { method: 'POST' });
            if (res.ok) {
                alert('Fatura quitada com sucesso!');
                fetchPayments(search, page);
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao quitar a fatura.');
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Pagamentos</h1>
                    <p className="text-gray-400 mt-2">Monitore todas as transações da plataforma. (Total: {totalPayments})</p>
                </div>
                
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 w-full md:w-80">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar cliente (nome ou email)..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // Resetar página
                        }}
                        className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
                    />
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Cliente</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Valor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Data</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Referência</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">Fatura / Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Carregando transações...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhum pagamento registrado.</td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <User size={14} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white uppercase">{payment.tenant.name || 'Sem nome'}</div>
                                                    <div className="text-[10px] text-gray-500">{payment.tenant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-white">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' || payment.status === 'PAID'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : payment.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : payment.status === 'REFUNDED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {payment.status === 'REFUNDED' ? 'CANCELADO (BAIXADO)' : payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                                                <Calendar size={12} />
                                                <span>{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono text-gray-600">{payment.externalId || 'LOCAL'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {payment.invoiceUrl && (
                                                    <a
                                                        href={payment.invoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs font-medium bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors border border-blue-400/20"
                                                    >
                                                        <CreditCard size={12} />
                                                        <span>Ver Fatura</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {payment.status !== 'PAID' && payment.status !== 'RECEIVED' && payment.status !== 'CONFIRMED' && payment.status !== 'REFUNDED' && (
                                                    <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                                                        <button 
                                                            onClick={() => handlePayPayment(payment.id)}
                                                            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 text-[10px] font-bold bg-emerald-400/10 px-2 py-1 rounded transition-colors border border-emerald-400/20 uppercase"
                                                        >
                                                            Quitar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCancelPayment(payment.id)}
                                                            className="inline-flex items-center text-orange-400 hover:text-orange-300 text-[10px] font-bold bg-orange-400/10 px-2 py-1 rounded transition-colors border border-orange-400/20 uppercase"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeletePayment(payment.id)}
                                                            className="inline-flex items-center text-red-500 hover:text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-1 rounded transition-colors border border-red-500/20 uppercase"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                                {payment.status === 'REFUNDED' && (
                                                    <button 
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        className="inline-flex items-center text-red-500 hover:text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-1 rounded transition-colors border border-red-500/20 uppercase"
                                                    >
                                                        Excluir
                                                    </button>
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
