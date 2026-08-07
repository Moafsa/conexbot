'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function MlErrorsAdminPage() {
    const [errors, setErrors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        fetchErrors(page, showResolved);
    }, [page, showResolved]);

    const fetchErrors = async (currentPage: number, resolved: boolean) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/ml-errors?page=${currentPage}&resolved=${resolved ? '1' : '0'}`);
            const data = await res.json();
            setErrors(data.errors || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch ML error reports');
        } finally {
            setLoading(false);
        }
    };

    const toggleResolved = async (id: string, resolved: boolean) => {
        try {
            await fetch('/api/admin/ml-errors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, resolved }),
            });
            toast.success(resolved ? 'Marcado como resolvido' : 'Reaberto');
            fetchErrors(page, showResolved);
        } catch {
            toast.error('Falha ao atualizar');
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <AlertTriangle className="w-7 h-7 text-orange-400" />
                        Erros do Plugin ML
                        <span className="bg-white/10 text-xs px-3 py-1 rounded-full text-gray-300 font-medium">{total}</span>
                    </h1>
                    <p className="text-gray-400 mt-2">Erros de sincronização reportados por todos os sites WordPress conectados.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setPage(1); setShowResolved(false); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!showResolved ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Abertos
                    </button>
                    <button
                        onClick={() => { setPage(1); setShowResolved(true); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${showResolved ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Resolvidos
                    </button>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Conta</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Produto</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Erro</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Versão</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Data</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Carregando...</td></tr>
                            ) : errors.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {showResolved ? 'Nenhum erro resolvido ainda.' : 'Nenhum erro em aberto. 🎉'}
                                </td></tr>
                            ) : (
                                errors.map((err) => (
                                    <tr key={err.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors group align-top">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{err.tenant?.name || 'Sem nome'}</div>
                                            <div className="text-xs text-gray-500">{err.tenant?.email}</div>
                                            {err.siteUrl && (
                                                <a href={err.siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1">
                                                    {err.siteUrl.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            <div>{err.productName || '—'}</div>
                                            <div className="text-xs text-gray-500">
                                                {err.wooProductId ? `Woo #${err.wooProductId}` : ''}
                                                {err.mlItemId ? ` · ${err.mlItemId}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-400 max-w-md whitespace-pre-wrap break-words">{err.errorMessage}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{err.pluginVersion || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{new Date(err.createdAt).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleResolved(err.id, !err.resolved)}
                                                className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg transition-all flex items-center gap-1 text-xs text-gray-400"
                                                title={showResolved ? 'Reabrir' : 'Marcar como resolvido'}
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> {showResolved ? 'Reabrir' : 'Resolvido'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl bg-white/5 disabled:opacity-40 text-sm">Anterior</button>
                    <span className="px-4 py-2 text-sm text-gray-400">{page} / {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-white/5 disabled:opacity-40 text-sm">Próxima</button>
                </div>
            )}
        </div>
    );
}
