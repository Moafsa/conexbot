"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Search, Send, RefreshCw, Download, ChevronDown,
    User, Phone, MessageCircle, Clock, CheckCheck,
    Bot, X, AlertCircle, Loader2, Filter, MoreVertical,
    ArrowLeft, Circle
} from "lucide-react";
import { toast } from "sonner";

interface ConvSummary {
    id: string;
    remoteId: string;
    status: string;
    botId: string;
    botName: string;
    updatedAt: string;
    contactName: string | null;
    lastMessage: { content: string; role: string; createdAt: string } | null;
}

interface Message {
    id: string;
    content: string;
    role: string;
    createdAt: string;
    tool_calls?: any;
}

interface Contact {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    notes: string | null;
    tags: string[];
    leadScore: number;
    funnelStage: string;
}

interface ImportJob {
    status: 'running' | 'done' | 'error';
    botId: string;
    steps: { label: string; done: boolean; count?: number }[];
    total: number;
    imported: number;
    errors: string[];
    log: string[];
    startedAt: string;
    finishedAt?: string;
}

function fmtTime(iso: string) {
    const d = parseISO(iso);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Ontem';
    return format(d, 'dd/MM', { locale: ptBR });
}

function roleColor(role: string) {
    if (role === 'user') return 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 self-start';
    if (role === 'assistant') return 'bg-blue-600 text-white self-end';
    return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 self-start text-xs italic';
}

export function InboxPage({ clientId }: { clientId?: string }) {
    const [bots, setBots] = useState<{ id: string; name: string }[]>([]);
    const [selectedBot, setSelectedBot] = useState<string>('');
    const [conversations, setConversations] = useState<ConvSummary[]>([]);
    const [selectedConv, setSelectedConv] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [contact, setContact] = useState<Contact | null>(null);
    const [convInfo, setConvInfo] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [replyText, setReplyText] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importJob, setImportJob] = useState<ImportJob | null>(null);
    const [importLog, setImportLog] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

    const chatEndRef = useRef<HTMLDivElement>(null);
    const replyRef = useRef<HTMLTextAreaElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const q = (path: string) => `${path}${clientId ? `?clientId=${clientId}` : ''}`;
    const qa = (path: string, params: string) => `${path}?${clientId ? `clientId=${clientId}&` : ''}${params}`;

    const fetchConversations = useCallback(async () => {
        setLoadingConvs(true);
        try {
            const params = new URLSearchParams();
            if (clientId) params.set('clientId', clientId);
            if (selectedBot) params.set('botId', selectedBot);
            if (search) params.set('search', search);
            const res = await fetch(`/api/inbox?${params}`);
            if (!res.ok) return;
            const data = await res.json();
            setBots(data.bots || []);
            setConversations(data.conversations || []);
        } catch { } finally {
            setLoadingConvs(false);
        }
    }, [clientId, selectedBot, search]);

    const fetchMessages = useCallback(async (convId: string) => {
        setLoadingMsgs(true);
        try {
            const res = await fetch(qa(`/api/inbox/${convId}/messages`, ''));
            if (!res.ok) return;
            const data = await res.json();
            setMessages(data.messages || []);
            setContact(data.contact || null);
            setConvInfo(data.conversation || null);
        } catch { } finally {
            setLoadingMsgs(false);
        }
    }, [clientId]);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    useEffect(() => {
        if (!selectedConv) return;
        fetchMessages(selectedConv);
    }, [selectedConv, fetchMessages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-refresh conversations
    useEffect(() => {
        const id = setInterval(fetchConversations, 8000);
        return () => clearInterval(id);
    }, [fetchConversations]);

    // Auto-refresh messages for selected conv
    useEffect(() => {
        if (!selectedConv) return;
        const id = setInterval(() => fetchMessages(selectedConv), 5000);
        return () => clearInterval(id);
    }, [selectedConv, fetchMessages]);

    const handleSelectConv = (id: string) => {
        setSelectedConv(id);
        setMessages([]);
        setContact(null);
        setMobileView('chat');
    };

    const handleSend = async () => {
        if (!replyText.trim() || !selectedConv || sending) return;
        setSending(true);
        const text = replyText.trim();
        setReplyText('');
        try {
            const res = await fetch(q(`/api/inbox/${selectedConv}/reply`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) { toast.error('Falha ao enviar mensagem'); return; }
            const data = await res.json();
            setMessages(prev => [...prev, data.message]);
        } catch { toast.error('Erro de conexão'); } finally {
            setSending(false);
            replyRef.current?.focus();
        }
    };

    const startImport = async () => {
        if (!selectedBot) { toast.error('Selecione um bot primeiro'); return; }
        setImporting(true);
        setImportLog([]);
        setImportJob(null);

        try {
            const params = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/inbox/import${params}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botId: selectedBot }),
            });
            if (!res.ok) { toast.error('Falha ao iniciar importação'); setImporting(false); return; }
            const { jobId } = await res.json();

            // Connect SSE
            eventSourceRef.current?.close();
            const es = new EventSource(`/api/inbox/import?jobId=${jobId}`);
            eventSourceRef.current = es;

            es.addEventListener('progress', (e: any) => {
                const job: ImportJob = JSON.parse(e.data);
                setImportJob(job);
                if (job.status !== 'running') {
                    setImporting(false);
                    es.close();
                    fetchConversations();
                }
            });
            es.addEventListener('log', (e: any) => {
                const { msg } = JSON.parse(e.data);
                setImportLog(prev => [...prev, msg]);
            });
            es.onerror = () => { setImporting(false); es.close(); };
        } catch { setImporting(false); }
    };

    const filteredConvs = conversations;

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* ── Left panel: conversation list ───────────────────────── */}
            <div className={`flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 w-full md:w-80 lg:w-96 flex-shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-blue-500" />
                            Caixa de Entrada
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => fetchConversations()} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Atualizar">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowImport(true)} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600" title="Importar histórico">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Bot selector */}
                    <select
                        value={selectedBot}
                        onChange={e => setSelectedBot(e.target.value)}
                        className="w-full mb-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
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
                            onKeyDown={e => e.key === 'Enter' && fetchConversations()}
                            placeholder="Buscar contato ou número..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConvs && conversations.length === 0 ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : filteredConvs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                            <p className="text-sm">Nenhuma conversa encontrada</p>
                            <button onClick={() => setShowImport(true)} className="mt-3 text-xs text-blue-500 hover:underline flex items-center gap-1">
                                <Download className="w-3 h-3" /> Importar do WhatsApp
                            </button>
                        </div>
                    ) : (
                        filteredConvs.map(conv => {
                            const isSelected = selectedConv === conv.id;
                            const displayName = conv.contactName || conv.remoteId;
                            const preview = conv.lastMessage
                                ? (conv.lastMessage.role === 'assistant' ? '↗ ' : '') + conv.lastMessage.content
                                : 'Sem mensagens';

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectConv(conv.id)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{displayName}</span>
                                                {conv.updatedAt && (
                                                    <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{fmtTime(conv.updatedAt)}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{preview}</p>
                                            <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Bot className="w-3 h-3" />{conv.botName}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Center panel: chat ───────────────────────────────────── */}
            <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                {!selectedConv ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecione uma conversa</p>
                        <p className="text-sm mt-1">ou importe o histórico do WhatsApp</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <button onClick={() => setMobileView('list')} className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {(contact?.name || convInfo?.remoteId || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {contact?.name || convInfo?.remoteId}
                                </p>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {convInfo?.remoteId}
                                    <span className="mx-1">·</span>
                                    <Bot className="w-3 h-3" /> {convInfo?.botName}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${convInfo?.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {convInfo?.status === 'open' ? 'Aberta' : convInfo?.status}
                            </span>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-gray-50 dark:bg-gray-850" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
                            {loadingMsgs ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Sem mensagens</div>
                            ) : (
                                messages.map(msg => {
                                    const isAssistant = msg.role === 'assistant';
                                    const isSystem = msg.role === 'system' || msg.role === 'tool';
                                    return (
                                        <div key={msg.id} className={`flex ${isAssistant ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
                                            {isSystem ? (
                                                <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full max-w-xs text-center">{msg.content.substring(0, 120)}</span>
                                            ) : (
                                                <div className={`max-w-xs lg:max-w-sm xl:max-w-md px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${isAssistant ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm border border-gray-100 dark:border-gray-600'}`}>
                                                    {msg.content}
                                                    <div className={`text-xs mt-1 text-right ${isAssistant ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {format(parseISO(msg.createdAt), 'HH:mm')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Reply bar */}
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    ref={replyRef}
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    placeholder="Digite uma mensagem... (Enter para enviar)"
                                    rows={1}
                                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ maxHeight: '120px' }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim() || sending}
                                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex-shrink-0"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Right panel: contact info ────────────────────────────── */}
            {selectedConv && contact && (
                <div className="hidden xl:flex flex-col w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-2">
                                {(contact.name || contact.phone).charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">{contact.name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{contact.phone}</p>
                            {contact.email && <p className="text-xs text-gray-400 mt-0.5">{contact.email}</p>}
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Funil</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{contact.funnelStage}</span>
                        </div>
                        {contact.tags.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Tags</p>
                                <div className="flex flex-wrap gap-1">
                                    {contact.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t}</span>)}
                                </div>
                            </div>
                        )}
                        {contact.notes && (
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notas</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">{contact.notes}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Lead Score</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(contact.leadScore, 100)}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{contact.leadScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Import modal ─────────────────────────────────────────── */}
            {showImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Download className="w-5 h-5 text-blue-500" />
                                Importar histórico do WhatsApp
                            </h3>
                            {!importing && <button onClick={() => { setShowImport(false); setImportJob(null); setImportLog([]); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>}
                        </div>

                        <div className="p-5 space-y-4">
                            {!importJob && !importing && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Bot / Número WhatsApp</label>
                                        <select
                                            value={selectedBot}
                                            onChange={e => setSelectedBot(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                        >
                                            <option value="">Selecione um bot...</option>
                                            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
                                        <p className="font-medium mb-1">O que será importado:</p>
                                        <ul className="space-y-0.5 list-disc list-inside">
                                            <li>Contatos existentes no banco de dados</li>
                                            <li>Histórico de mensagens do WUZAPI (requer conexão ativa)</li>
                                            <li>Contatos do Chatwoot (se integrado)</li>
                                            <li>Conversas sincronizadas no Chatwoot</li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={startImport}
                                        disabled={!selectedBot}
                                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Iniciar Importação
                                    </button>
                                </>
                            )}

                            {(importing || importJob) && (
                                <div className="space-y-4">
                                    {/* Steps */}
                                    {importJob?.steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {step.done ? (
                                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                                    <CheckCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : importing && i === importJob.steps.findIndex(s => !s.done) ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-500 flex-shrink-0" />
                                            ) : (
                                                <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                                            )}
                                            <span className={`text-sm ${step.done ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {step.label}
                                                {step.count !== undefined && <span className="ml-1 text-xs text-gray-400">({step.count})</span>}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Progress bar */}
                                    {importJob && importJob.total > 0 && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>{importJob.imported} / {importJob.total} contatos</span>
                                                <span>{Math.round((importJob.imported / importJob.total) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min((importJob.imported / importJob.total) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Log */}
                                    <div className="bg-gray-900 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs text-green-400">
                                        {importLog.map((line, i) => <div key={i}>{line}</div>)}
                                        {importing && <div className="animate-pulse">▋</div>}
                                    </div>

                                    {/* Errors */}
                                    {importJob?.errors.length > 0 && (
                                        <details className="text-xs">
                                            <summary className="text-red-500 cursor-pointer">{importJob.errors.length} erro(s)</summary>
                                            <div className="mt-1 space-y-0.5 text-red-400">
                                                {importJob.errors.slice(-10).map((e, i) => <div key={i}>{e}</div>)}
                                            </div>
                                        </details>
                                    )}

                                    {/* Done state */}
                                    {importJob?.status === 'done' && (
                                        <div className="flex gap-2">
                                            <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                                <p className="text-green-700 dark:text-green-400 font-medium text-sm">✅ Importação concluída!</p>
                                            </div>
                                            <button
                                                onClick={() => { setShowImport(false); setImportJob(null); setImportLog([]); fetchConversations(); }}
                                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
                                            >
                                                Fechar
                                            </button>
                                        </div>
                                    )}
                                    {importJob?.status === 'error' && (
                                        <button onClick={() => { setImportJob(null); setImportLog([]); setImporting(false); }} className="w-full py-2 rounded-lg bg-red-600 text-white text-sm">
                                            Tentar novamente
                                        </button>
                                    )}
                                </div>
                            )}

                            {importing && !importJob && (
                                <div className="flex items-center justify-center py-4 gap-2 text-blue-600">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Iniciando importação...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Alias used in import statements
function CheckCheck({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M4 17l4 4L21 9" />
        </svg>
    );
}
