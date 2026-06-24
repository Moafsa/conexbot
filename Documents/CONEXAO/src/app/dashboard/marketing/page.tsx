"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
    Sparkles, Settings, Plus, Target, CheckCircle2,
    Calendar, RefreshCw, Facebook, Search, Zap,
    History, MessageSquare, PenTool, Image as ImageIcon,
    Trash2, Save, Send, Share2, Play
} from "lucide-react";
import { AdsTab } from './components/AdsTab'; // we can import it later if needed, but I will inline or refactor if needed. Actually, let's inline what's needed or keep imports if they exist.

// I'll create a completely self-contained page to avoid breaking missing component imports.
export default function MarketingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Sparkles className="text-emerald-500 animate-spin" size={40} />
                    <p className="text-gray-500 font-medium">Iniciando Maestro Hub...</p>
                </div>
            </div>
        }>
            <MaestroHub />
        </Suspense>
    );
}

function MaestroHub() {
    const searchParams = useSearchParams();
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [agencyClients, setAgencyClients] = useState<any[]>([]);
    const [isAgency, setIsAgency] = useState(false);
    const [bots, setBots] = useState<any[]>([]);
    const [data, setData] = useState<any>({ campaigns: [], insights: null, postsCount: 0, recentPosts: [], recommendations: [] });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    
    // Modals
    const [showSettings, setShowSettings] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showPostCreator, setShowPostCreator] = useState(false);

    useEffect(() => {
        const id = searchParams.get("clientId");
        if (id) setSelectedClientId(id);
    }, [searchParams]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            
            // Parallel fetches
            const [botsRes, clientsRes, statsRes, postsRes, adsRes] = await Promise.all([
                fetch(`/api/bots${query}`),
                fetch("/api/agency/clients").catch(() => null),
                fetch(`/api/marketing/stats${query}`),
                fetch(`/api/marketing/posts${query}`),
                fetch(`/api/marketing/ads${query}`)
            ]);

            if (botsRes.ok) setBots(await botsRes.json());
            
            if (clientsRes && clientsRes.ok) {
                setAgencyClients(await clientsRes.json());
                setIsAgency(true);
            }

            const statsData = statsRes.ok ? await statsRes.json() : {};
            const postsData = postsRes.ok ? await postsRes.json() : [];
            const adsData = adsRes.ok ? await adsRes.json() : {};

            setData({
                campaigns: adsData.campaigns || [],
                insights: adsData.insights || null,
                postsCount: statsData.postsCount || 0,
                recentPosts: postsData || [],
                recommendations: statsData.recommendations || []
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedClientId]);

    const handleForceSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/marketing/automation/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true, botId: bots[0]?.id })
            });
            if (res.ok) {
                alert("Sincronização Autônoma do Maestro concluída!");
                fetchData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            {/* Header: Maestro Command Center */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#111827] border border-white/10 p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                        <Sparkles size={32} className="text-black" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            Maestro Hub
                        </h1>
                        <p className="text-emerald-400 font-medium tracking-wide text-sm mt-1 uppercase">
                            Gestor de Tráfego & Marketing Autônomo
                        </p>
                    </div>

                    {isAgency && (
                        <select 
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-xl px-6 py-3 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500/50 w-full md:w-64"
                        >
                            <option value="">Minha Agência (Próprio)</option>
                            {agencyClients.map(c => (
                                <option key={c.id} value={c.id}>{c.name || c.email}</option>
                            ))}
                        </select>
                    )}

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={handleForceSync}
                            disabled={syncing}
                            className="flex-1 md:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                            {syncing ? "Sincronizando..." : "Forçar Ação IA"}
                        </button>
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400"
                            title="Configurações (Meta/Google)"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Grid Principal */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Coluna 1: Gestão Orgânica */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <PenTool className="text-emerald-400" />
                            Conteúdo Orgânico
                        </h2>
                        <button 
                            onClick={() => setShowPostCreator(true)}
                            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 text-white"
                        >
                            <Plus size={16} /> Criar Manualmente
                        </button>
                    </div>

                    <div className="bg-[#111827] border border-white/10 rounded-[32px] p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Clock size={16} /> Fila de Aprovação
                        </h3>
                        
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {data.recentPosts.filter((p: any) => p.status === 'DRAFT').length === 0 ? (
                                <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-gray-500 font-medium">Nenhum rascunho pendente.</p>
                                </div>
                            ) : (
                                data.recentPosts.filter((p: any) => p.status === 'DRAFT').map((post: any) => (
                                    <PostDraftCard key={post.id} post={post} onRefresh={fetchData} />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna 2: Tráfego Pago */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <Target className="text-blue-500" />
                            Tráfego Pago (Ads)
                        </h2>
                        <button 
                            onClick={() => setShowCampaignModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 text-white"
                        >
                            <Plus size={16} /> Nova Campanha
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#111827] border border-white/10 p-6 rounded-2xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Gasto (Meta Ads)</p>
                            <h3 className="text-2xl font-black text-white">R$ {(data.insights?.spend || 0).toFixed(2)}</h3>
                        </div>
                        <div className="bg-[#111827] border border-white/10 p-6 rounded-2xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Campanhas Ativas</p>
                            <h3 className="text-2xl font-black text-white">{data.campaigns.filter((c:any) => c.status === 'ACTIVE').length}</h3>
                        </div>
                    </div>

                    <div className="bg-[#111827] border border-white/10 rounded-[32px] p-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap size={16} /> Campanhas da Agência
                        </h3>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {data.campaigns.length === 0 ? (
                                <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <Facebook size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-gray-500 font-medium">Nenhuma campanha encontrada.</p>
                                </div>
                            ) : (
                                data.campaigns.map((camp: any) => (
                                        <CampaignItem key={camp.id} campaign={camp} onRefresh={fetchData} selectedClientId={selectedClientId} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals placeholders */}
            {showPostCreator && <PostCreatorModal bots={bots} onClose={() => setShowPostCreator(false)} onRefresh={fetchData} />}
            {/* O AdsTab antigo e SettingsTab antigo podem ser usados em modais separados, mas por simplicidade e evitar quebrar dependencias de outros imports, vou deixar mockados aqui por enquanto ou reimplementar o SettingsTab */}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} selectedClientId={selectedClientId} />}
        </div>
    );
}

// --------------------------------------------------------------------------------------
// COMPONENTS
// --------------------------------------------------------------------------------------

function PostDraftCard({ post, onRefresh }: { post: any; onRefresh: () => void }) {
    const [generatingImg, setGeneratingImg] = useState(false);

    const handleGenerateImage = async () => {
        setGeneratingImg(true);
        try {
            const res = await fetch(\`/api/marketing/posts/\${post.id}/generate-image\`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert("Imagem gerada com sucesso via IA!");
                onRefresh();
            } else {
                alert(data.error || "Erro ao gerar imagem.");
            }
        } catch(e) {
            alert("Erro na conexão");
        } finally {
            setGeneratingImg(false);
        }
    };

    const handlePublish = async () => {
        try {
            const res = await fetch(\`/api/marketing/posts/\${post.id}/publish\`, { method: "POST" });
            if (res.ok) { alert("Post Agendado!"); onRefresh(); }
        } catch(e) {}
    };
    
    const handleDelete = async () => {
        if(!confirm("Excluir rascunho?")) return;
        try {
            const res = await fetch(\`/api/marketing/posts/\${post.id}\`, { method: "DELETE" });
            if (res.ok) onRefresh();
        } catch(e) {}
    };

    let parsed = null;
    try { parsed = JSON.parse(post.content); } catch (e) {}

    return (
        <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 relative group">
            <div className="w-full sm:w-32 h-48 sm:h-32 bg-black/40 rounded-xl overflow-hidden shrink-0 border border-white/5 relative flex items-center justify-center group-hover:border-emerald-500/30 transition-all">
                {post.imageUrl ? (
                    <img src={post.imageUrl} className="w-full h-full object-cover" alt="Draft" />
                ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-gray-600">
                        <ImageIcon size={24} className="mb-2 opacity-50" />
                        <span className="text-[10px] uppercase font-bold text-gray-500">Sem Imagem</span>
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full uppercase">
                        {post.platform || "MULTI"}
                    </span>
                    <button onClick={handleDelete} className="text-gray-600 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
                
                <p className="text-sm text-gray-300 line-clamp-3 mb-4 flex-1">
                    {parsed?.caption || post.content}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-auto">
                    {!post.imageUrl && (
                        <button 
                            onClick={handleGenerateImage}
                            disabled={generatingImg}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-cyan-400 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                        >
                            <Sparkles size={14} className={generatingImg ? "animate-spin" : ""} />
                            {generatingImg ? "Gerando..." : "Gerar Imagem"}
                        </button>
                    )}
                    <button 
                        onClick={handlePublish}
                        className="px-4 py-2 flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-lg transition-all flex items-center"
                    >
                        Aprovar
                    </button>
                </div>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------------------
// CAMPAIGN ITEM (Expands to show Ads)
// --------------------------------------------------------------------------------------
function CampaignItem({ campaign, onRefresh, selectedClientId }: any) {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);

    const toggleCampaignStatus = async () => {
        setUpdating(true);
        const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/marketing/ads/campaigns/${campaign.id}${query}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) onRefresh();
        } catch(e) {} finally { setUpdating(false); }
    };

    const ads = campaign.adsets?.data?.[0]?.ads?.data || [];

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all">
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="cursor-pointer flex-1" onClick={() => setExpanded(!expanded)}>
                    <h4 className="font-bold text-white flex items-center gap-2">
                        {campaign.name}
                        <span className="text-gray-500 text-xs">({ads.length} ads)</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Obj: {campaign.objective || 'Desconhecido'}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${campaign.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {campaign.status}
                    </span>
                    <button 
                        onClick={toggleCampaignStatus} disabled={updating}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-all"
                    >
                        {campaign.status === 'ACTIVE' ? <Play size={14} className="rotate-90" /> : <Play size={14} />}
                    </button>
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all"
                    >
                        {expanded ? "Ocultar" : "Ver Anúncios"}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 bg-black/40 border-t border-white/5 space-y-3">
                    {ads.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">Nenhum anúncio encontrado neste conjunto.</p>
                    ) : (
                        ads.map((ad: any) => (
                            <AdItem key={ad.id} ad={ad} onRefresh={onRefresh} selectedClientId={selectedClientId} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function AdItem({ ad, onRefresh, selectedClientId }: any) {
    const [updating, setUpdating] = useState(false);
    
    const toggleAdStatus = async () => {
        setUpdating(true);
        const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/marketing/ads/${ad.id}${query}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) onRefresh();
        } catch(e) {} finally { setUpdating(false); }
    };

    const deleteAd = async () => {
        if (!confirm("Deletar anúncio definitivamente?")) return;
        setUpdating(true);
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/marketing/ads/${ad.id}${query}`, {
                method: "DELETE"
            });
            if (res.ok) onRefresh();
        } catch(e) {} finally { setUpdating(false); }
    };

    const creative = ad.creative || {};
    const imgUrl = creative.image_url || creative.thumbnail_url;

    return (
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl">
            {imgUrl ? (
                <img src={imgUrl} className="w-12 h-12 rounded object-cover" alt="Ad" />
            ) : (
                <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center">
                    <ImageIcon size={16} className="text-gray-600" />
                </div>
            )}
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{ad.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${ad.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                    <span className="text-[10px] uppercase text-gray-500">{ad.status}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleAdStatus} disabled={updating}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    title={ad.status === 'ACTIVE' ? "Pausar" : "Ativar"}
                >
                    <Play size={12} className={ad.status === 'ACTIVE' ? "rotate-90" : ""} />
                </button>
                <button 
                    onClick={deleteAd} disabled={updating}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                    title="Deletar Anúncio"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------------------
// POST CREATOR MODAL (Simplified version of old ContentTab Studio)
// --------------------------------------------------------------------------------------
function PostCreatorModal({ bots, onClose, onRefresh }: any) {
    const [botId, setBotId] = useState("");
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!botId || !prompt) return alert("Selecione um agente e digite o prompt.");
        setLoading(true);
        try {
            // we use the normal chat-generate route
            const res = await fetch("/api/marketing/chat-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    botId,
                    messages: [{ role: "user", content: prompt }],
                    postFormat: "SINGLE"
                })
            });
            const data = await res.json();
            
            if (res.ok && data.postDraft) {
                // Save it directly as a Draft
                await fetch("/api/marketing/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        theme: "Criado Manualmente",
                        content: JSON.stringify(data.postDraft),
                        botId,
                        status: "DRAFT"
                    })
                });
                alert("Rascunho gerado e salvo na fila de aprovação!");
                onRefresh();
                onClose();
            } else {
                alert("Erro ao gerar post");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-xl p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">Assistente de Criação Rápida</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><Trash2 size={20} /></button>
                </div>
                
                <div className="space-y-4">
                    <select 
                        value={botId}
                        onChange={(e) => setBotId(e.target.value)}
                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-4 text-white outline-none"
                    >
                        <option value="">Selecione o Atendente IA...</option>
                        {bots.map((b:any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Crie um post para o instagram divulgando nossa promoção de Black Friday..."
                        rows={5}
                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-4 text-white outline-none"
                    />

                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase transition-all"
                    >
                        {loading ? "Gerando Conteúdo..." : "Gerar Rascunho IA"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------------------
// SETTINGS MODAL
// --------------------------------------------------------------------------------------
function SettingsModal({ onClose, selectedClientId }: any) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black">Integrações de Marketing</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white">X</button>
                </div>
                <p className="text-gray-400">Para simplificar a versão atual e demonstrar a evolução do Layout, esta tela de configurações foi compactada. Vá ao painel Settings antigo para alterar Tokens (O código das APIs permanece intacto no backend).</p>
                
                <a href={`/api/integrations/facebook/connect${selectedClientId ? `?clientId=${selectedClientId}` : ""}`} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20">
                    <Facebook size={18} />
                    Conectar / Renovar Facebook
                </a>
            </div>
        </div>
    );
}
