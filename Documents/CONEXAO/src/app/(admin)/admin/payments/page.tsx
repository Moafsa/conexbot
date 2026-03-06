'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Calendar, User } from 'lucide-react';

export default function PaymentsAdminPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/admin/payments');
            const data = await res.json();
            setPayments(data);
        } catch (error) {
            console.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold">Pagamentos</h1>
                <p className="text-gray-400 mt-2">Monitore todas as transações da plataforma.</p>
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
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">Fatura</th>
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
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : payment.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {payment.status}
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
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
