"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Wifi, WifiOff, Key, Plus, Trash2, Copy, CheckCircle2,
    RefreshCw, ChevronDown, ChevronUp, Webhook,
    Clock, ExternalLink, Link2, FileText, Unplug, RotateCcw
} from "lucide-react";

interface WaNumber {
    id: string;
    name: string;
    status: string;
    whatsapp: {
        status: string;
        phoneId: string | null;
        phoneNumber: string | null;
        wabaId: string | null;
        connectedAt: string;
    } | null;
    stats: {
        totalConversations: number;
        messagesLast30Days: number;
        lastActivity: string | null;
    };
    apiKeys: {
        id: string;
        name: string;
        keyPreview: string;
        webhookUrl: string | null;
        active: boolean;
        lastUsedAt: string | null;
        createdAt: string;
    }[];
}

interface Template {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
}

interface AllBot { id: string; name: string; status: string; }

const STATUS_COLORS: Record<string, string> = {
    APPROVED: 'bg-emerald-500/15 text-emerald-400',
    PENDING:  'bg-yellow-500/15 text-yellow-400',
    REJECTED: 'bg-red-500/15 text-red-400',
    PAUSED:   'bg-gray-500/15 text-gray-400',
};

export default function DeveloperPage() {
    const [numbers, setNumbers] = useState<WaNumber[]>([]);
    const [allBots, setAllBots] = useState<AllBot[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBot, setExpandedBot] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Record<string, 'keys' | 'templates'>>({});
    const [showConnectPicker, setShowConnectPicker] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Templates state per bot
    const [templates, setTemplates] = useState<Record<string, Template[]>>({});
    const [templatesLoading, setTemplatesLoading] = useState<Record<string, boolean>>({});
    const [showTplForm, setShowTplForm] = useState<string | null>(null);
    const [tplName, setTplName] = useState('');
    const [tplCategory, setTplCategory] = useState('MARKETING');
    const [tplLanguage, setTplLanguage] = useState('pt_BR');
    const [tplHeader, setTplHeader] = useState('');
    const [tplBody, setTplBody] = useState('');
    const [tplFooter, setTplFooter] = useState('');
    const [tplMsg, setTplMsg] = useState<Record<string, { type: 'ok' | 'err'; text: string }>>({});
    const [creatingTpl, setCreatingTpl] = useState<string | null>(null);

    // New key form state
    const [showKeyForm, setShowKeyForm] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newWebhook, setNewWebhook] = useState('');
    const [newSecret, setNewSecret] = useState('');
    const [creatingKey, setCreatingKey] = useState(false);
    const [createdKey, setCreatedKey] = useState<{ botId: string; key: string } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bsp/overview');
            const data = await res.json();
            setNumbers(data.numbers || []);
            setAllBots(data.allBots || []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function fetchTemplates(botId: string) {
        setTemplatesLoading(p => ({ ...p, [botId]: true }));
        try {
            const res = await fetch(`/api/v1/templates?botId=${botId}`);
            const data = await res.json();
            setTemplates(p => ({ ...p, [botId]: data.templates || [] }));
        } finally {
            setTemplatesLoading(p => ({ ...p, [botId]: false }));
        }
    }

    function toggleBot(botId: string) {
        if (expandedBot === botId) {
            setExpandedBot(null);
        } else {
            setExpandedBot(botId);
            if (!templates[botId]) fetchTemplates(botId);
        }
    }

    function setTab(botId: string, tab: 'keys' | 'templates') {
        setActiveTab(p => ({ ...p, [botId]: tab }));
        if (tab === 'templates' && !templates[botId]) fetchTemplates(botId);
    }

    async function createKey(botId: string) {
        if (!newName.trim()) return;
        setCreatingKey(true);
        try {
            const res = await fetch(`/api/v1/keys?botId=${botId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), webhookUrl: newWebhook || undefined, webhookSecret: newSecret || undefined })
            });
            const data = await res.json();
            if (res.ok) {
                setCreatedKey({ botId, key: data.key });
                setNewName(''); setNewWebhook(''); setNewSecret('');
                setShowKeyForm(null);
                fetchData();
            }
        } finally { setCreatingKey(false); }
    }

    async function deleteKey(botId: string, keyId: string) {
        if (!confirm('Revogar esta API Key?')) return;
        await fetch(`/api/v1/keys?botId=${botId}&id=${keyId}`, { method: 'DELETE' });
        fetchData();
    }

    async function createTemplate(botId: string) {
        if (!tplName.trim() || !tplBody.trim()) return;
        setCreatingTpl(botId);
        setTplMsg(p => ({ ...p, [botId]: { type: 'ok', text: '' } }));
        try {
            const components: any[] = [];
            if (tplHeader.trim()) components.push({ type: 'HEADER', format: 'TEXT', text: tplHeader.trim() });
            components.push({ type: 'BODY', text: tplBody.trim() });
            if (tplFooter.trim()) components.push({ type: 'FOOTER', text: tplFooter.trim() });

            const res = await fetch(`/api/v1/templates?botId=${botId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: tplName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    category: tplCategory,
                    language: tplLanguage,
                    components
                })
            });
            const data = await res.json();
            if (res.ok) {
                setTplMsg(p => ({ ...p, [botId]: { type: 'ok', text: `Template enviado para aprovação da Meta (24-72h). ID: ${data.id}` } }));
                setTplName(''); setTplBody(''); setTplHeader(''); setTplFooter('');
                setShowTplForm(null);
                fetchTemplates(botId);
            } else {
                const msg = data.details?.error?.error_user_msg || data.details?.error?.message || data.error || 'Erro ao criar';
                setTplMsg(p => ({ ...p, [botId]: { type: 'err', text: msg } }));
            }
        } finally { setCreatingTpl(null); }
    }

    async function deleteTemplate(botId: string, name: string) {
        if (!confirm(`Excluir o template "${name}"?`)) return;
        await fetch(`/api/v1/templates?botId=${botId}&name=${encodeURIComponent(name)}`, { method: 'DELETE' });
        fetchTemplates(botId);
    }

    function copyText(text: string, id: string) {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    async function disconnectNumber(botId: string) {
        if (!confirm('Desconectar este número? O bot e as API Keys serão mantidos.')) return;
        await fetch(`/api/bots/${botId}/channels?provider=META_WHATSAPP`, { method: 'DELETE' });
        fetchData();
    }

    async function deleteBot(botId: string, name: string) {
        if (!confirm(`Excluir "${name}" permanentemente? Todas as API Keys e dados serão removidos.`)) return;
        await fetch(`/api/bots/${botId}`, { method: 'DELETE' });
        fetchData();
    }

    function fmt(date: string | null) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function fmtRelative(date: string | null) {
        if (!date) return '—';
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}min atrás`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h atrás`;
        return `${Math.floor(hrs / 24)}d atrás`;
    }

    const botsWithoutWa = allBots.filter(b => !numbers.find(n => n.id === b.id));

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">ConextBot BSP</p>
                    <h1 className="text-3xl font-black text-white tracking-tight">Portal do Desenvolvedor</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie seus números WhatsApp, templates, API Keys e webhooks para integrar com sistemas externos.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition">
                        <RefreshCw size={16} />
                    </button>
                    <a href="/dashboard/developer/connect" className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black rounded-xl transition shadow-lg shadow-emerald-500/20">
                        <Plus size={14} /> Conectar Número
                    </a>
                </div>
            </div>

            {/* Base URL strip */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
                <div className="text-xs text-gray-500 font-mono shrink-0 flex items-center gap-1.5">
                    <Link2 size={12} className="text-emerald-500" /> Base URL:
                </div>
                <code className="text-sm text-emerald-400 font-mono flex-1">https://app.conext.click/api/v1</code>
                <button onClick={() => copyText('https://app.conext.click/api/v1', 'baseurl')} className="p-1.5 text-gray-600 hover:text-white transition">
                    {copiedId === 'baseurl' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-20">Carregando números...</div>
            ) : numbers.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                    <p className="text-gray-400 font-semibold">Nenhum número WhatsApp conectado</p>
                    <a href="/dashboard/developer/connect" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black font-black rounded-xl text-sm hover:bg-emerald-400 transition">
                        <Plus size={14} /> Conectar via API Oficial Meta
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {numbers.map(bot => {
                        const wa = bot.whatsapp;
                        const isExpanded = expandedBot === bot.id;
                        const isConnected = wa?.status === 'CONNECTED';
                        const tab = activeTab[bot.id] || 'keys';
                        const botTemplates = templates[bot.id] || [];
                        const tplLoading = templatesLoading[bot.id];

                        return (
                            <div key={bot.id} className={`bg-white/5 border rounded-2xl overflow-hidden transition-all ${isConnected ? 'border-white/10' : 'border-white/5'}`}>

                                {/* ── Number header row ── */}
                                <div
                                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/3 transition select-none"
                                    onClick={() => toggleBot(bot.id)}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isConnected ? 'bg-emerald-500/15' : 'bg-gray-500/10'}`}>
                                        {isConnected ? <Wifi size={18} className="text-emerald-400" /> : <WifiOff size={18} className="text-gray-600" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">{bot.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isConnected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-600/20 text-gray-500'}`}>
                                                {isConnected ? 'Conectado' : wa?.status || 'Desconectado'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {wa?.phoneNumber && <span className="text-xs text-gray-400 font-mono">{wa.phoneNumber}</span>}
                                            {wa?.phoneId && <span className="text-xs text-gray-600 font-mono">ID: {wa.phoneId}</span>}
                                            {!wa && <span className="text-xs text-yellow-500/80">Sem WhatsApp conectado</span>}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-6 shrink-0">
                                        <div className="text-center">
                                            <p className="text-lg font-black text-white">{bot.stats.messagesLast30Days.toLocaleString('pt-BR')}</p>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">msgs/30d</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-white">{bot.stats.totalConversations.toLocaleString('pt-BR')}</p>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">conversas</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-white">{fmtRelative(bot.stats.lastActivity)}</p>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">atividade</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-emerald-400">{bot.apiKeys.length}</p>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">keys</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-blue-400">{botTemplates.length || '—'}</p>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">templates</p>
                                        </div>
                                    </div>

                                    <div className="text-gray-600 ml-2">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* ── Expanded panel ── */}
                                {isExpanded && (
                                    <div className="border-t border-white/8 bg-black/20">

                                        {/* WABA info bar */}
                                        {wa?.wabaId && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pt-5">
                                                {[
                                                    { label: 'WABA ID', value: wa.wabaId },
                                                    { label: 'Phone ID', value: wa.phoneId || '—' },
                                                    { label: 'Número', value: wa.phoneNumber || '—' },
                                                    { label: 'Conectado em', value: fmt(wa.connectedAt) },
                                                ].map(item => (
                                                    <div key={item.label} className="bg-white/4 rounded-xl p-3">
                                                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{item.label}</p>
                                                        <p className="text-xs font-mono text-gray-300 truncate">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Revealed new key */}
                                        {createdKey?.botId === bot.id && (
                                            <div className="mx-5 mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                                <p className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={15} /> API Key criada — copie agora, não será exibida novamente
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-xs text-white font-mono break-all">{createdKey.key}</code>
                                                    <button onClick={() => copyText(createdKey.key, 'newkey')} className="px-3 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 shrink-0">
                                                        {copiedId === 'newkey' ? 'Copiado!' : 'Copiar'}
                                                    </button>
                                                </div>
                                                <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-300">Fechar</button>
                                            </div>
                                        )}

                                        {/* Template message */}
                                        {tplMsg[bot.id]?.text && (
                                            <div className={`mx-5 mt-4 rounded-xl p-3 text-sm font-medium ${tplMsg[bot.id].type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                                                {tplMsg[bot.id].text}
                                                <button onClick={() => setTplMsg(p => ({ ...p, [bot.id]: { type: 'ok', text: '' } }))} className="ml-3 opacity-60 hover:opacity-100 text-xs">✕</button>
                                            </div>
                                        )}

                                        {/* Sub-tabs */}
                                        <div className="flex gap-1 px-5 pt-5">
                                            <button
                                                onClick={() => setTab(bot.id, 'keys')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${tab === 'keys' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                            >
                                                <Key size={12} /> API Keys {bot.apiKeys.length > 0 && <span className="bg-black/20 rounded-full px-1.5">{bot.apiKeys.length}</span>}
                                            </button>
                                            <button
                                                onClick={() => setTab(bot.id, 'templates')}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${tab === 'templates' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                            >
                                                <FileText size={12} /> Templates {botTemplates.length > 0 && <span className="bg-black/20 rounded-full px-1.5">{botTemplates.length}</span>}
                                            </button>
                                        </div>

                                        {/* ── API KEYS TAB ── */}
                                        {tab === 'keys' && (
                                            <div className="px-5 py-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-600">Use a API Key para enviar mensagens e receber via webhook neste número.</p>
                                                    <button
                                                        onClick={() => setShowKeyForm(showKeyForm === bot.id ? null : bot.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-bold transition shrink-0"
                                                    >
                                                        <Plus size={12} /> Nova Key
                                                    </button>
                                                </div>

                                                {showKeyForm === bot.id && (
                                                    <div className="bg-black/30 border border-white/8 rounded-xl p-4 space-y-2.5">
                                                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome (ex: n8n, Zapier, App Próprio)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                                        <input value={newWebhook} onChange={e => setNewWebhook(e.target.value)} placeholder="Webhook URL — mensagens recebidas chegam aqui (opcional)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                                        <input value={newSecret} onChange={e => setNewSecret(e.target.value)} placeholder="Webhook Secret para validação HMAC (opcional)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={() => createKey(bot.id)} disabled={!newName.trim() || creatingKey} className="px-4 py-2 bg-emerald-500 text-black text-sm font-black rounded-lg hover:bg-emerald-400 disabled:opacity-40 transition">
                                                                {creatingKey ? 'Criando...' : 'Criar'}
                                                            </button>
                                                            <button onClick={() => setShowKeyForm(null)} className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10">Cancelar</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {bot.apiKeys.length === 0 ? (
                                                    <p className="text-center py-6 text-gray-600 text-sm">Nenhuma API Key. Crie uma para integrar com sistemas externos.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {bot.apiKeys.map(k => (
                                                            <div key={k.id} className="flex items-center gap-3 bg-black/20 border border-white/6 rounded-xl px-4 py-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-sm font-semibold text-white">{k.name}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                        <code className="text-xs text-gray-500 font-mono">{k.keyPreview}</code>
                                                                        {k.webhookUrl && <span className="text-xs text-blue-400/80 flex items-center gap-1 truncate max-w-xs"><Webhook size={10} className="shrink-0" />{k.webhookUrl}</span>}
                                                                        {k.lastUsedAt && <span className="text-xs text-gray-600 flex items-center gap-1"><Clock size={9} />{fmtRelative(k.lastUsedAt)}</span>}
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => deleteKey(bot.id, k.id)} className="p-1.5 text-gray-700 hover:text-red-400 transition shrink-0">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Quick code example */}
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">Exemplo — enviar mensagem</p>
                                                    <pre className="bg-black/50 border border-white/8 rounded-xl p-4 text-xs text-emerald-400 font-mono overflow-x-auto leading-6">{`POST https://app.conext.click/api/v1/messages
Authorization: Bearer cxk_sua_api_key

{
  "to": "5511999887766",
  "type": "text",
  "text": { "body": "Olá!" }
}`}</pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── TEMPLATES TAB ── */}
                                        {tab === 'templates' && (
                                            <div className="px-5 py-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-600">Templates do WABA deste número. Precisam de aprovação da Meta (24-72h).</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => fetchTemplates(bot.id)} className="p-1.5 text-gray-500 hover:text-white transition"><RefreshCw size={13} /></button>
                                                        <button
                                                            onClick={() => setShowTplForm(showTplForm === bot.id ? null : bot.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 rounded-lg text-xs font-bold transition"
                                                        >
                                                            <Plus size={12} /> Novo Template
                                                        </button>
                                                    </div>
                                                </div>

                                                {showTplForm === bot.id && (
                                                    <div className="bg-black/30 border border-white/8 rounded-xl p-4 space-y-2.5">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="col-span-3">
                                                                <input value={tplName} onChange={e => setTplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="nome_do_template (snake_case)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono" />
                                                            </div>
                                                            <select value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                                                <option value="MARKETING">Marketing</option>
                                                                <option value="UTILITY">Utilitário</option>
                                                                <option value="AUTHENTICATION">Autenticação</option>
                                                            </select>
                                                            <select value={tplLanguage} onChange={e => setTplLanguage(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                                                <option value="pt_BR">pt_BR</option>
                                                                <option value="en_US">en_US</option>
                                                                <option value="es">es</option>
                                                            </select>
                                                        </div>
                                                        <input value={tplHeader} onChange={e => setTplHeader(e.target.value)} placeholder="Cabeçalho (opcional)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                                                        <textarea value={tplBody} onChange={e => setTplBody(e.target.value)} rows={3} placeholder="Corpo da mensagem. Use {{1}}, {{2}} para variáveis." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
                                                        <input value={tplFooter} onChange={e => setTplFooter(e.target.value)} placeholder="Rodapé (opcional)" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                                                        <div className="flex gap-2 pt-1">
                                                            <button onClick={() => createTemplate(bot.id)} disabled={!tplName.trim() || !tplBody.trim() || creatingTpl === bot.id} className="px-4 py-2 bg-blue-500 text-white text-sm font-black rounded-lg hover:bg-blue-400 disabled:opacity-40 transition">
                                                                {creatingTpl === bot.id ? 'Enviando...' : 'Enviar para Meta'}
                                                            </button>
                                                            <button onClick={() => setShowTplForm(null)} className="px-4 py-2 bg-white/5 text-gray-400 text-sm rounded-lg hover:bg-white/10">Cancelar</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {tplLoading ? (
                                                    <p className="text-center py-6 text-gray-600 text-sm">Carregando...</p>
                                                ) : botTemplates.length === 0 ? (
                                                    <p className="text-center py-6 text-gray-600 text-sm">Nenhum template. Crie um ou aguarde o WhatsApp estar conectado.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {botTemplates.map(t => (
                                                            <div key={t.id} className="flex items-center gap-3 bg-black/20 border border-white/6 rounded-xl px-4 py-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <code className="text-sm font-semibold text-white font-mono">{t.name}</code>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[t.status] || 'bg-gray-500/15 text-gray-400'}`}>{t.status}</span>
                                                                        <span className="text-xs text-gray-600">{t.category} · {t.language}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button onClick={() => copyText(t.name, `tpl-${t.id}`)} className="p-1.5 text-gray-600 hover:text-white transition">
                                                                        {copiedId === `tpl-${t.id}` ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                                                    </button>
                                                                    <button onClick={() => deleteTemplate(bot.id, t.name)} className="p-1.5 text-gray-700 hover:text-red-400 transition">
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer actions */}
                                        <div className="flex items-center justify-between px-5 pb-4 mt-2">
                                            <div className="flex items-center gap-2">
                                                {isConnected ? (
                                                    <button
                                                        onClick={() => disconnectNumber(bot.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-red-400/8 border border-white/6 transition"
                                                    >
                                                        <Unplug size={12} /> Desconectar
                                                    </button>
                                                ) : (
                                                    <a
                                                        href={`/dashboard/developer/connect?botId=${bot.id}`}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/25 transition"
                                                    >
                                                        <RotateCcw size={12} /> Reconectar
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => deleteBot(bot.id, bot.name)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-red-400 hover:bg-red-400/8 border border-white/6 transition"
                                                >
                                                    <Trash2 size={12} /> Excluir
                                                </button>
                                            </div>
                                            <a href={`/dashboard/bots/${bot.id}`} className="text-xs text-gray-700 hover:text-gray-400 transition flex items-center gap-1">
                                                Gerenciar agente <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
