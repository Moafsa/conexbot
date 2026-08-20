"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Search, Users, Phone, Mail, Building2, Tag,
    TrendingUp, ChevronLeft, ChevronRight, Bot,
    Filter, MoreVertical, Star, Calendar, Loader2
} from "lucide-react";
import CRMContactPanel from "./CRMContactPanel";

interface Contact {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    company: string | null;
    lastActive: string;
    funnelStage: string;
    leadScore: number;
    tags: string[];
    botId: string | null;
    notes: string | null;
    contactType: string;
    createdAt: string;
    bot: { name: string } | null;
}

const FUNNEL_COLORS: Record<string, string> = {
    LEAD: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    PROSPECT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    QUALIFIED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    PROPOSAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    NEGOTIATION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    WON: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    LOST: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    CUSTOMER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

function scoreBar(score: number) {
    const pct = Math.min(Math.max(score, 0), 100);
    const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-6 text-right">{score}</span>
        </div>
    );
}

export function ContactsPage({ clientId }: { clientId?: string }) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [botFilter, setBotFilter] = useState('');
    const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<{ id: string; botId: string } | null>(null);

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (clientId) params.set('clientId', clientId);
            if (search) params.set('search', search);
            if (botFilter) params.set('botId', botFilter);
            params.set('page', String(page));
            const res = await fetch(`/api/inbox/contacts?${params}`);
            if (!res.ok) return;
            const data = await res.json();
            setContacts(data.contacts || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch { } finally {
            setLoading(false);
        }
    }, [clientId, search, botFilter, page]);

    const fetchBots = useCallback(async () => {
        const params = new URLSearchParams();
        if (clientId) params.set('clientId', clientId);
        const res = await fetch(`/api/inbox?${params}`).catch(() => null);
        if (!res?.ok) return;
        const data = await res.json();
        setBots(data.bots || []);
    }, [clientId]);

    useEffect(() => { fetchBots(); }, [fetchBots]);
    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { setPage(1); fetchContacts(); }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contatos</h2>
                        <p className="text-xs text-gray-400">{total.toLocaleString('pt-BR')} contato(s)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Bot filter */}
                    <select
                        value={botFilter}
                        onChange={e => { setBotFilter(e.target.value); setPage(1); }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
                    >
                        <option value="">Todos os bots</option>
                        {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Buscar nome, telefone, email..."
                            className="pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading && contacts.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Users className="w-12 h-12 mb-3 opacity-30" />
                        <p className="font-medium">Nenhum contato encontrado</p>
                        <p className="text-sm mt-1">Importe o histórico do WhatsApp pela Caixa de Entrada</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contato</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Empresa</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Funil</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden xl:table-cell">Score</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Tags</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Bot</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ativo em</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {contacts.map(contact => (
                                <tr
                                    key={contact.id}
                                    onClick={() => contact.botId && setSelectedContact({ id: contact.id, botId: contact.botId })}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                {(contact.name || contact.phone).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{contact.name || '—'}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />{contact.phone}
                                                    {contact.email && <><span className="mx-1">·</span><Mail className="w-3 h-3" />{contact.email}</>}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="text-gray-600 dark:text-gray-300 text-sm">{contact.company || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FUNNEL_COLORS[contact.funnelStage] || FUNNEL_COLORS.LEAD}`}>
                                            {contact.funnelStage}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 hidden xl:table-cell">
                                        {scoreBar(contact.leadScore)}
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {contact.tags.slice(0, 3).map(t => (
                                                <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t}</span>
                                            ))}
                                            {contact.tags.length > 3 && <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Bot className="w-3 h-3" />{contact.bot?.name || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-gray-400">
                                            {format(parseISO(contact.lastActive), 'dd/MM/yy HH:mm', { locale: ptBR })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                    <span className="text-gray-400 text-xs">
                        Página {page} de {pages} · {total} contato(s)
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                            disabled={page === pages}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Contact detail panel */}
            {selectedContact && (
                <CRMContactPanel
                    contactId={selectedContact.id}
                    botId={selectedContact.botId}
                    clientId={clientId}
                    onClose={() => setSelectedContact(null)}
                />
            )}
        </div>
    );
}
