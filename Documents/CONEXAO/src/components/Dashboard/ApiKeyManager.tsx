"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Plus, Trash2, Eye, EyeOff, RefreshCw, Webhook, Key, CheckCircle2, ExternalLink, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface ApiKeyRecord {
    id: string;
    name: string;
    key: string;
    keyPreview: string;
    webhookUrl: string | null;
    active: boolean;
    lastUsedAt: string | null;
    createdAt: string;
}

interface Template {
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
    components: any[];
}

export function ApiKeyManager({ botId }: { botId: string }) {
    const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'keys' | 'templates'>('keys');

    // Key creation state
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newWebhookUrl, setNewWebhookUrl] = useState("");
    const [newWebhookSecret, setNewWebhookSecret] = useState("");
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    // Template creation state
    const [showTemplateCreate, setShowTemplateCreate] = useState(false);
    const [tplName, setTplName] = useState("");
    const [tplCategory, setTplCategory] = useState("MARKETING");
    const [tplLanguage, setTplLanguage] = useState("pt_BR");
    const [tplBody, setTplBody] = useState("");
    const [tplHeader, setTplHeader] = useState("");
    const [tplFooter, setTplFooter] = useState("");
    const [creatingTemplate, setCreatingTemplate] = useState(false);
    const [templateMsg, setTemplateMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null);

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [expandedDocs, setExpandedDocs] = useState(false);

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/keys?botId=${botId}`);
            const data = await res.json();
            setKeys(data.keys || []);
        } catch { } finally { setLoading(false); }
    }, [botId]);

    const fetchTemplates = useCallback(async () => {
        setTemplatesLoading(true);
        try {
            const res = await fetch(`/api/v1/templates?botId=${botId}`);
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch { } finally { setTemplatesLoading(false); }
    }, [botId]);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);
    useEffect(() => { if (activeTab === 'templates') fetchTemplates(); }, [activeTab, fetchTemplates]);

    async function createKey() {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`/api/v1/keys?botId=${botId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), webhookUrl: newWebhookUrl || undefined, webhookSecret: newWebhookSecret || undefined })
            });
            const data = await res.json();
            if (res.ok) {
                setCreatedKey(data.key);
                setNewName(""); setNewWebhookUrl(""); setNewWebhookSecret("");
                fetchKeys();
            }
        } finally { setCreating(false); }
    }

    async function deleteKey(id: string) {
        if (!confirm('Revogar esta API Key? Sistemas usando ela perderão acesso imediatamente.')) return;
        await fetch(`/api/v1/keys?botId=${botId}&id=${id}`, { method: 'DELETE' });
        fetchKeys();
    }

    async function toggleKey(key: ApiKeyRecord) {
        await fetch(`/api/v1/keys?botId=${botId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: key.id, active: !key.active })
        });
        fetchKeys();
    }

    async function createTemplate() {
        if (!tplName.trim() || !tplBody.trim()) return;
        setCreatingTemplate(true);
        setTemplateMsg(null);
        try {
            const components: any[] = [];
            if (tplHeader.trim()) components.push({ type: 'HEADER', format: 'TEXT', text: tplHeader.trim() });
            components.push({ type: 'BODY', text: tplBody.trim() });
            if (tplFooter.trim()) components.push({ type: 'FOOTER', text: tplFooter.trim() });

            const res = await fetch(`/api/v1/templates?botId=${botId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tplName.trim().toLowerCase().replace(/\s+/g, '_'), category: tplCategory, language: tplLanguage, components })
            });
            const data = await res.json();
            if (res.ok) {
                setTemplateMsg({ type: 'ok', text: `Template enviado para aprovação da Meta (ID: ${data.id}). Aguarde 24-72h.` });
                setTplName(""); setTplBody(""); setTplHeader(""); setTplFooter("");
                setShowTemplateCreate(false);
                fetchTemplates();
            } else {
                const errMsg = data.details?.error?.error_user_msg || data.details?.error?.message || data.error || 'Erro ao criar template';
                setTemplateMsg({ type: 'err', text: errMsg });
            }
        } finally { setCreatingTemplate(false); }
    }

    async function deleteTemplate(name: string) {
        if (!confirm(`Excluir o template "${name}"?`)) return;
        await fetch(`/api/v1/templates?botId=${botId}&name=${encodeURIComponent(name)}`, { method: 'DELETE' });
        fetchTemplates();
    }

    function copyText(text: string, id: string) {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    const statusColor: Record<string, string> = {
        APPROVED: 'text-emerald-400 bg-emerald-500/10',
        PENDING: 'text-yellow-400 bg-yellow-500/10',
        REJECTED: 'text-red-400 bg-red-500/10',
        PAUSED: 'text-gray-400 bg-gray-500/10',
    };

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2">
                <button onClick={() => setActiveTab('keys')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'keys' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Key size={14} /> API Keys
                </button>
                <button onClick={() => setActiveTab('templates')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'templates' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <FileText size={14} /> Templates WhatsApp
                </button>
            </div>

            {/* ── API KEYS TAB ── */}
            {activeTab === 'keys' && (
                <div className="space-y-5">

                    {/* Info banner */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-blue-300 font-semibold mb-1">Como usar a API</p>
                        <p className="text-xs text-gray-400">Qualquer sistema externo pode enviar mensagens WhatsApp através do ConextBot usando sua API Key. Mensagens recebidas são encaminhadas para o Webhook URL que você cadastrar.</p>
                        <button onClick={() => setExpandedDocs(!expandedDocs)} className="mt-2 text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300">
                            {expandedDocs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expandedDocs ? 'Ocultar' : 'Ver'} exemplos de uso
                        </button>
                        {expandedDocs && (
                            <div className="mt-3 space-y-3">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Enviar mensagem de texto</p>
                                    <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-300 overflow-x-auto">{`POST https://app.conext.click/api/v1/messages
Authorization: Bearer cxk_sua_api_key

{
  "to": "5511999887766",
  "type": "text",
  "text": { "body": "Olá! Como posso ajudar?" }
}`}</pre>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Enviar template</p>
                                    <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-300 overflow-x-auto">{`POST https://app.conext.click/api/v1/messages
Authorization: Bearer cxk_sua_api_key

{
  "to": "5511999887766",
  "type": "template",
  "template": {
    "name": "nome_do_template",
    "language": { "code": "pt_BR" },
    "components": []
  }
}`}</pre>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1 font-mono uppercase tracking-wider">Webhook recebido (formato Meta)</p>
                                    <pre className="bg-black/40 rounded-lg p-3 text-xs text-yellow-300 overflow-x-auto">{`// O ConextBot repassa o payload original da Meta para sua URL
// Assinado com HMAC-SHA256 no header X-Conext-Signature
// se você cadastrar um Webhook Secret.
{
  "object": "whatsapp_business_account",
  "entry": [{ "changes": [{ "value": { "messages": [...] } }] }]
}`}</pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Created key alert */}
                    {createdKey && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                            <p className="text-emerald-400 font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> API Key criada — copie agora, não será exibida novamente</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-xs text-white font-mono break-all">{createdKey}</code>
                                <button onClick={() => copyText(createdKey, 'created')} className="px-3 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400">
                                    {copiedId === 'created' ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>
                            <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-300">Fechar</button>
                        </div>
                    )}

                    {/* Keys list */}
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <h3 className="text-sm font-bold text-white">Suas API Keys</h3>
                            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 transition">
                                <Plus size={14} /> Nova Key
                            </button>
                        </div>

                        {showCreate && (
                            <div className="px-5 py-4 border-b border-white/10 bg-white/3 space-y-3">
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome (ex: n8n Production)" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                <input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="Webhook URL (opcional) — https://meu-sistema.com/webhook" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                <input value={newWebhookSecret} onChange={e => setNewWebhookSecret(e.target.value)} placeholder="Webhook Secret (opcional) — para validar HMAC" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                <div className="flex gap-2">
                                    <button onClick={createKey} disabled={creating || !newName.trim()} className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-sm font-bold hover:bg-emerald-400 disabled:opacity-40 transition">
                                        {creating ? 'Criando...' : 'Criar Key'}
                                    </button>
                                    <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm hover:bg-white/10">Cancelar</button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="px-5 py-8 text-center text-gray-500 text-sm">Carregando...</div>
                        ) : keys.length === 0 ? (
                            <div className="px-5 py-8 text-center text-gray-500 text-sm">Nenhuma API Key criada. Clique em "Nova Key" para começar.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {keys.map(k => (
                                    <div key={k.id} className="flex items-center gap-4 px-5 py-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-semibold text-white">{k.name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {k.active ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs text-gray-500 font-mono">{k.keyPreview}</code>
                                                {k.webhookUrl && (
                                                    <span className="text-xs text-blue-400 flex items-center gap-1"><Webhook size={10} />{k.webhookUrl.length > 40 ? k.webhookUrl.slice(0, 40) + '…' : k.webhookUrl}</span>
                                                )}
                                            </div>
                                            {k.lastUsedAt && (
                                                <p className="text-xs text-gray-600 mt-0.5">Último uso: {new Date(k.lastUsedAt).toLocaleString('pt-BR')}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => toggleKey(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${k.active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                                {k.active ? 'Desativar' : 'Ativar'}
                                            </button>
                                            <button onClick={() => deleteKey(k.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TEMPLATES TAB ── */}
            {activeTab === 'templates' && (
                <div className="space-y-5">
                    {templateMsg && (
                        <div className={`rounded-xl p-4 text-sm font-medium ${templateMsg.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                            {templateMsg.text}
                            <button onClick={() => setTemplateMsg(null)} className="ml-3 text-xs opacity-60 hover:opacity-100">✕</button>
                        </div>
                    )}

                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <h3 className="text-sm font-bold text-white">Templates do WABA</h3>
                            <div className="flex gap-2">
                                <button onClick={fetchTemplates} className="p-2 text-gray-500 hover:text-white transition"><RefreshCw size={14} /></button>
                                <button onClick={() => setShowTemplateCreate(!showTemplateCreate)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 transition">
                                    <Plus size={14} /> Novo Template
                                </button>
                            </div>
                        </div>

                        {showTemplateCreate && (
                            <div className="px-5 py-4 border-b border-white/10 bg-white/3 space-y-3">
                                <p className="text-xs text-gray-500">O template será enviado para aprovação da Meta (24-72h). Use apenas letras minúsculas e underscore no nome.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-3">
                                        <input value={tplName} onChange={e => setTplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="nome_do_template" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono" />
                                    </div>
                                    <select value={tplCategory} onChange={e => setTplCategory(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                        <option value="MARKETING">Marketing</option>
                                        <option value="UTILITY">Utilitário</option>
                                        <option value="AUTHENTICATION">Autenticação</option>
                                    </select>
                                    <select value={tplLanguage} onChange={e => setTplLanguage(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                                        <option value="pt_BR">Português (BR)</option>
                                        <option value="en_US">English (US)</option>
                                        <option value="es">Español</option>
                                    </select>
                                </div>
                                <input value={tplHeader} onChange={e => setTplHeader(e.target.value)} placeholder="Cabeçalho (opcional)" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                <textarea value={tplBody} onChange={e => setTplBody(e.target.value)} rows={3} placeholder="Corpo da mensagem. Use {{1}}, {{2}} para variáveis." className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none" />
                                <input value={tplFooter} onChange={e => setTplFooter(e.target.value)} placeholder="Rodapé (opcional)" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                                <div className="flex gap-2">
                                    <button onClick={createTemplate} disabled={creatingTemplate || !tplName.trim() || !tplBody.trim()} className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-sm font-bold hover:bg-emerald-400 disabled:opacity-40 transition">
                                        {creatingTemplate ? 'Enviando...' : 'Enviar para Meta'}
                                    </button>
                                    <button onClick={() => setShowTemplateCreate(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm hover:bg-white/10">Cancelar</button>
                                </div>
                            </div>
                        )}

                        {templatesLoading ? (
                            <div className="px-5 py-8 text-center text-gray-500 text-sm">Carregando templates...</div>
                        ) : templates.length === 0 ? (
                            <div className="px-5 py-8 text-center text-gray-500 text-sm">Nenhum template encontrado. Crie um ou conecte um WABA primeiro.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {templates.map(t => (
                                    <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <code className="text-sm font-semibold text-white font-mono">{t.name}</code>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status] || 'text-gray-400 bg-gray-500/10'}`}>{t.status}</span>
                                                <span className="text-xs text-gray-600">{t.category}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{t.language} · ID: {t.id}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => copyText(t.name, `tpl-${t.id}`)} className="px-2 py-1.5 text-xs text-gray-400 hover:text-white flex items-center gap-1 transition">
                                                {copiedId === `tpl-${t.id}` ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                Copiar nome
                                            </button>
                                            <button onClick={() => deleteTemplate(t.name)} className="p-1.5 text-gray-600 hover:text-red-400 transition">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white/3 border border-white/5 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                        <p className="font-semibold text-gray-400">Sobre templates:</p>
                        <p>· Templates <span className="text-yellow-400">PENDING</span> aguardam revisão da Meta (24-72h)</p>
                        <p>· Templates <span className="text-emerald-400">APPROVED</span> podem ser usados para iniciar conversas</p>
                        <p>· Templates <span className="text-red-400">REJECTED</span> precisam ser editados e reenviados</p>
                        <p>· Fora da janela de 24h, só é possível enviar templates aprovados</p>
                    </div>
                </div>
            )}
        </div>
    );
}
