"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
    TrendingUp, 
    Search, 
    PenTool, 
    BarChart3, 
    Settings, 
    Plus, 
    Zap, 
    Instagram, 
    Facebook, 
    ArrowUpRight,
    SearchCode,
    Sparkles,
    Calendar,
    Target,
    History,
    Clock,
    RefreshCw,
    Link as LinkIcon,
    Share2,
    X,
    XCircle,
    CheckCircle2,
    Check,
    Trash2
} from "lucide-react";
import { uploadMarketingMedia } from "@/app/actions/marketing-actions";

export default function MarketingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Sparkles className="text-emerald-500 animate-spin" size={40} />
                    <p className="text-gray-500 font-medium">Carregando Dashboard...</p>
                </div>
            </div>
        }>
            <MarketingContent />
        </Suspense>
    );
}

function MarketingContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("overview");
    const [bots, setBots] = useState<any[]>([]);
    const [data, setData] = useState<any>({ campaigns: [], insights: null, postsCount: 0, recentPosts: [] });
    const [loadingBots, setLoadingBots] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [agencyClients, setAgencyClients] = useState<any[]>([]);
    const [isAgency, setIsAgency] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [showClientList, setShowClientList] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);

    useEffect(() => {
        const id = searchParams.get("clientId");
        if (id) setSelectedClientId(id);
    }, [searchParams]);

    const tabs = [
        { id: "overview", label: "Visão Geral", icon: BarChart3 },
        { id: "seo", label: "SEO & Keywords", icon: SearchCode },
        { id: "content", label: "Criador de Posts", icon: Sparkles },
        { id: "ads", label: "Anúncios (Meta Ads)", icon: Target },
        { id: "settings", label: "Integrações", icon: Settings },
    ];

    const fetchBots = async () => {
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/bots${query}`);
            const data = await res.json();
            if (res.ok) setBots(data);
        } catch (error) {
            console.error("Erro ao buscar bots:", error);
        } finally {
            setLoadingBots(false);
        }
    };

    const fetchMarketingData = async () => {
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const [adsRes, statsRes, postsRes, recsRes] = await Promise.all([
                fetch(`/api/marketing/ads${query}`),
                fetch(`/api/marketing/stats${query}`),
                fetch(`/api/marketing/posts${query}`),
                fetch(`/api/marketing/recommendations${query}`)
            ]);
            
            const adsData = adsRes.ok ? await adsRes.json() : {};
            const statsData = statsRes.ok ? await statsRes.json() : {};
            const postsData = postsRes.ok ? await postsRes.json() : [];
            const recsData = recsRes.ok ? await recsRes.json() : { recommendations: [] };

            setData({
                campaigns: adsData.campaigns || [],
                insights: adsData.insights || null,
                googleAds: adsData.googleAds || null,
                postsCount: statsData.postsCount || 0,
                recentPosts: postsData,
                recommendations: recsData.recommendations || []
            });
        } catch (error) {
            console.error("Erro ao buscar dados de marketing:", error);
        }
    };

    const checkAgencyStatus = async () => {
        try {
            const res = await fetch("/api/agency/clients");
            if (res.ok) {
                const clients = await res.json();
                setAgencyClients(clients);
                setIsAgency(true);
            }
        } catch (e) {
            console.error("Not an agency or error fetching clients");
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch("/api/marketing/report");
            const data = await res.json();
            
            // Converter para CSV simples
            const headers = ["Categoria", "Métrica", "Valor"];
            const rows = [
                ["Geral", "Total Posts", data.stats.totalPosts],
                ["Geral", "Posts Publicados", data.stats.publishedPosts],
                ["Ads", "Campanhas Ativas", data.stats.activeCampaigns],
                ["Ads", "Investimento Total", `R$ ${data.stats.totalSpend}`],
                ["Ads", "CTR Médio", `${data.stats.avgCtr}%`],
                ["Ads", "Impressões", data.stats.impressions],
                ["Ads", "Cliques", data.stats.clicks],
            ];

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Relatorio_Marketing_${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert("Erro ao exportar relatório");
        }
    };

    useEffect(() => {
        checkAgencyStatus();
        fetchBots();
        fetchMarketingData();
    }, []);

    useEffect(() => {
        fetchBots();
        fetchMarketingData();
    }, [selectedClientId]);

    const handleNewCampaign = () => {
        setActiveTab("ads");
        setShowCampaignModal(true);
    };

    return (
        <div className="p-6 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-2xl relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">Agência Conext <span className="text-emerald-400">IA</span></h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        Marketing Automatizado & Inteligência de Dados
                    </p>
                    {isAgency && (
                        <div className="mt-4 flex flex-col gap-2 relative z-50">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Visualizando cliente:</span>
                            
                            <div className="relative group">
                                <button 
                                    onClick={() => setShowClientList(!showClientList)}
                                    className="w-full max-w-xs bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-emerald-400 font-bold outline-none flex items-center justify-between hover:border-emerald-500/50 transition-all"
                                >
                                    {selectedClientId 
                                        ? agencyClients.find(c => c.id === selectedClientId)?.name || "Cliente Selecionado"
                                        : "Minha Agência (Próprio)"}
                                    <Search size={14} className="text-gray-500" />
                                </button>

                                {showClientList && (
                                    <div className="absolute top-full left-0 mt-2 w-full max-w-xs bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-[500] p-2 animate-fade-in ring-1 ring-white/10">
                                        <div className="relative mb-2">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                            <input 
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-emerald-500/30"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                                            <button 
                                                onClick={() => {
                                                    setSelectedClientId("");
                                                    setShowClientList(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${!selectedClientId ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-white/5'}`}
                                            >
                                                Minha Agência (Próprio)
                                            </button>
                                            {agencyClients
                                                .filter(c => (c.name || c.email).toLowerCase().includes(clientSearch.toLowerCase()))
                                                .map(c => (
                                                    <button 
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedClientId(c.id);
                                                            setShowClientList(false);
                                                            setClientSearch("");
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedClientId === c.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-white/5'}`}
                                                    >
                                                        {c.name || c.email}
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                        onClick={handleExport}
                        className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold transition-all border border-white/5 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <Calendar size={18} />
                        Exportar Relatório
                    </button>
                    <button onClick={handleNewCampaign} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Plus size={18} />
                        Nova Campanha
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-full overflow-x-auto custom-scrollbar snap-x">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium whitespace-nowrap snap-center ${
                            activeTab === tab.id 
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {activeTab === "overview" && <OverviewTab stats={{
                    postsCount: data.postsCount,
                    adsInsights: data.insights,
                    activeCampaigns: data.campaigns.filter((c: any) => c.status === 'ACTIVE').length,
                    recentPosts: data.recentPosts || []
                }} refresh={fetchMarketingData} onEdit={(post: any) => {
                    setEditingPost(post);
                    setShowEditModal(true);
                }} />}
                {activeTab === "seo" && <SEOTab />}
                {activeTab === "content" && <ContentTab bots={bots} loadingBots={loadingBots} />}
                {activeTab === "ads" && <AdsTab selectedClientId={selectedClientId} setShowCampaignModal={setShowCampaignModal} bots={bots} loadingBots={loadingBots} />}
                {activeTab === "settings" && <SettingsTab selectedClientId={selectedClientId} />}
            </div>

            {/* Modal de Nova Campanha */}
            {showCampaignModal && (
                <CampaignModal 
                    onClose={() => setShowCampaignModal(false)} 
                    selectedClientId={selectedClientId} 
                    onSuccess={() => {
                        setShowCampaignModal(false);
                        fetchMarketingData();
                    }} 
                />
            )}

            {/* Modal de Edição de Post */}
            {showEditModal && editingPost && (
                <EditPostModal 
                    post={editingPost}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingPost(null);
                    }}
                    onSuccess={() => {
                        setShowEditModal(false);
                        setEditingPost(null);
                        fetchMarketingData();
                    }}
                />
            )}
        </div>
    );
}

function CampaignModal({ onClose, selectedClientId, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [objective, setObjective] = useState("OUTREACH");
    const [budget, setBudget] = useState("50");

    const handleCreate = async () => {
        if (!name) return alert("Dê um nome para a campanha");
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name, 
                    objective, 
                    dailyBudget: parseFloat(budget) * 100,
                    clientId: selectedClientId 
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert("Campanha criada com sucesso!");
                onSuccess();
            } else {
                alert(data.error || "Erro ao criar campanha. Verifique se suas credenciais da Meta Ads estão corretas na aba de Configurações.");
            }
        } catch (error) {
            alert("Erro de conexão ao tentar criar campanha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-lg p-10 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10">
                    <h2 className="text-3xl font-black flex items-center gap-3">
                        <Target className="text-blue-500" />
                        Nova Campanha
                    </h2>
                    <p className="text-gray-400 mt-2">Configure sua campanha de anúncios na Meta (FB/IG).</p>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nome da Campanha</label>
                        <input 
                            type="text"
                            placeholder="Ex: Lançamento Verão 2025"
                            className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50 transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Objetivo</label>
                            <select 
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                            >
                                <option value="OUTREACH">Alcance</option>
                                <option value="TRAFFIC">Tráfego</option>
                                <option value="CONVERSIONS">Conversões</option>
                                <option value="LEAD_GEN">Geração de Leads</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Orçamento Diário (R$)</label>
                            <input 
                                type="number"
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 relative z-10">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleCreate}
                        disabled={loading}
                        className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20"
                    >
                        {loading ? "Criando..." : "Criar Campanha"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ stats, refresh, onEdit }: any) {
    const postsCount = stats.postsCount || 0;
    const spend = stats.adsInsights?.spend || "0";
    const ctr = stats.adsInsights?.inline_link_click_ctr || "0.00";
    const recentPosts = stats.recentPosts || [];

    // Paginação
    const [draftPage, setDraftPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const drafts = recentPosts.filter((p: any) => p.status === 'DRAFT');
    const history = recentPosts.filter((p: any) => p.status !== 'DRAFT');

    const totalDraftPages = Math.ceil(drafts.length / ITEMS_PER_PAGE);
    const totalHistoryPages = Math.ceil(history.length / ITEMS_PER_PAGE);

    const currentDrafts = drafts.slice((draftPage - 1) * ITEMS_PER_PAGE, draftPage * ITEMS_PER_PAGE);
    const currentHistory = history.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

    const handleApprove = async (postId: string) => {
        try {
            const res = await fetch(`/api/marketing/posts/${postId}/publish`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert(`Post aprovado e agendado para: ${new Date(data.scheduledAt).toLocaleString()}`);
                refresh();
            } else {
                alert(data.error || "Erro ao aprovar post.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleShare = async (postId: string) => {
        try {
            const res = await fetch(`/api/marketing/posts/${postId}/share`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                await navigator.clipboard.writeText(data.shareUrl);
                alert("Link de aprovação copiado para a área de transferência!");
            } else {
                alert("Erro ao gerar link de compartilhamento.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Tem certeza que deseja excluir este rascunho?")) return;
        try {
            const res = await fetch(`/api/marketing/posts/${postId}`, { method: "DELETE" });
            if (res.ok) {
                refresh();
            } else {
                alert("Erro ao excluir post.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Ativos na Meta" 
                    value={stats.activeCampaigns} 
                    change="Campanhas" 
                    icon={TrendingUp} 
                    color="text-emerald-400" 
                />
                <StatCard 
                    title="Posts Criados" 
                    value={postsCount} 
                    change="IA Generated" 
                    icon={Sparkles} 
                    color="text-cyan-400" 
                />
                <StatCard 
                    title="CTR Médio" 
                    value={`${parseFloat(ctr).toFixed(2)}%`} 
                    change="Marketing API" 
                    icon={Target} 
                    color="text-amber-400" 
                />
                <StatCard 
                    title="Investimento" 
                    value={`R$ ${parseFloat(spend).toFixed(2)}`} 
                    change="Total Gasto" 
                    icon={Zap} 
                    color="text-purple-400" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <Clock size={24} className="text-emerald-400" />
                                    Aprovação de Conteúdo (Lote)
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Revise e aprove os rascunhos gerados pela automação.</p>
                            </div>
                            <button onClick={refresh} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                <RefreshCw size={18} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {drafts.length === 0 ? (
                                <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-gray-500">Nenhum rascunho aguardando aprovação.</p>
                                    <p className="text-xs text-gray-600 mt-1">Use o "Gerador em Lote" na aba de Conteúdo para criar posts.</p>
                                </div>
                            ) : (
                                <>
                                    {currentDrafts.map((post: any) => (
                                        <div key={post.id} className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:border-emerald-500/30 transition-all relative group">
                                            <div className="w-full sm:w-24 h-48 sm:h-24 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                                {(() => {
                                                    const vUrl = post.videoUrl || post.imageUrl;
                                                    const isVideo = post.mediaType?.toUpperCase() === "VIDEO" || 
                                                                  (vUrl && (vUrl.toLowerCase().endsWith('.mp4') || vUrl.toLowerCase().endsWith('.mov') || vUrl.toLowerCase().includes('video')));
                                                    
                                                    if (isVideo && vUrl) {
                                                        return <video src={vUrl} className="w-full h-full object-cover" muted playsInline />;
                                                    } else if (post.imageUrl) {
                                                        return <img src={post.imageUrl} alt="AI" className="w-full h-full object-cover" />;
                                                    } else {
                                                        return (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                                <PenTool size={20} />
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full uppercase">
                                                            {post.platform}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 italic">via {post.bot?.name || "IA"}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDelete(post.id)}
                                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                                                    {post.content}
                                                </p>

                                                {post.rejectionReason && (
                                                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 border-l-4 border-l-amber-500 animate-in fade-in slide-in-from-top-2 duration-500">
                                                        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                                                            <Sparkles size={16} className="text-amber-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Observação do Cliente</p>
                                                            <p className="text-sm text-amber-200/80 font-medium italic">"{post.rejectionReason}"</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 mt-4 w-full">
                                                    <button 
                                                        onClick={() => handleApprove(post.id)}
                                                        className="px-4 py-2 flex-1 sm:flex-none justify-center bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-lg transition-all flex items-center"
                                                    >
                                                        Aprovar & Publicar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleShare(post.id)}
                                                        className="px-4 py-2 flex-1 sm:flex-none justify-center bg-white/5 hover:bg-white/10 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                                                    >
                                                        <Share2 size={14} />
                                                        Compartilhar
                                                    </button>
                                                    <button 
                                                        onClick={() => onEdit(post)}
                                                        className="px-4 py-2 flex-1 sm:flex-none justify-center bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-lg transition-all"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {totalDraftPages > 1 && (
                                        <div className="flex items-center justify-center gap-2 pt-4">
                                            <button 
                                                disabled={draftPage === 1}
                                                onClick={() => setDraftPage(p => p - 1)}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"
                                            >
                                                <RefreshCw size={14} className="rotate-180" />
                                            </button>
                                            <span className="text-xs font-bold text-gray-500">
                                                Página {draftPage} de {totalDraftPages}
                                            </span>
                                            <button 
                                                disabled={draftPage === totalDraftPages}
                                                onClick={() => setDraftPage(p => p + 1)}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-emerald-400" />
                            Desempenho de Campanhas
                        </h3>
                        <div className="h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-gray-500 italic">
                            Gráfico de desempenho será exibido aqui após a integração.
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-fit">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Zap size={20} className="text-amber-400" />
                        Ações Recomendadas
                    </h3>
                    <div className="space-y-4">
                        {stats.recommendations && stats.recommendations.length > 0 ? (
                            stats.recommendations.map((rec: any, i: number) => (
                                <ActionItem 
                                    key={i}
                                    title={rec.title} 
                                    desc={rec.desc}
                                />
                            ))
                        ) : (
                            <>
                                <ActionItem 
                                    title="Configurar Metas" 
                                    desc="Defina seus objetivos de marketing para receber recomendações personalizadas."
                                />
                                <ActionItem 
                                    title="Analisar Concorrência" 
                                    desc="Use o explorador de SEO para entender o que seus concorrentes estão buscando."
                                />
                                <ActionItem 
                                    title="Criar Novo Post" 
                                    desc="Mantenha sua audiência engajada criando conteúdos frequentes."
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Queue/History Section */}
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <Clock className="text-cyan-400" size={24} />
                            Fila de Publicação & Histórico
                        </h3>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Acompanhe o status dos seus posts</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-[0.2em]">
                                <th className="pb-4 font-black">Visual</th>
                                <th className="pb-4 font-black">Conteúdo</th>
                                <th className="pb-4 font-black">Plataforma</th>
                                <th className="pb-4 font-black">Agendado/Postado</th>
                                <th className="pb-4 font-black">Status</th>
                                <th className="pb-4 font-black text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Clock size={40} />
                                            <p className="text-sm font-medium">Nenhum post na fila ou histórico.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentHistory.map((post: any) => (
                                    <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                                {(() => {
                                                    const vUrl = post.videoUrl || post.imageUrl;
                                                    const isVideo = post.mediaType?.toUpperCase() === "VIDEO" || 
                                                                  (vUrl && (vUrl.toLowerCase().endsWith('.mp4') || vUrl.toLowerCase().endsWith('.mov') || vUrl.toLowerCase().includes('video')));
                                                    
                                                    if (isVideo && vUrl) {
                                                        return <video src={vUrl} className="w-full h-full object-cover" muted playsInline />;
                                                    } else if (post.imageUrl) {
                                                        return <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />;
                                                    } else {
                                                        return (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                                <Instagram size={20} />
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </td>
                                        <td className="py-4 max-w-[200px]">
                                            <p className="text-sm text-gray-300 line-clamp-1 font-medium">{post.content}</p>
                                            <p className="text-[10px] text-gray-600 mt-0.5">Bot: {post.bot?.name || 'Sistema'}</p>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 capitalize">
                                                {post.platform.toLowerCase() === 'instagram' ? <Instagram size={14} className="text-pink-500" /> : <Facebook size={14} className="text-blue-500" />}
                                                {post.platform.toLowerCase()}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-300 font-bold">
                                                    {post.status === 'PUBLISHED' ? new Date(post.publishedAt || post.updatedAt).toLocaleDateString() : new Date(post.scheduledAt || post.updatedAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    {post.status === 'PUBLISHED' ? new Date(post.publishedAt || post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(post.scheduledAt || post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                post.status === 'PUBLISHED' 
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 animate-pulse'
                                            }`}>
                                                {post.status === 'PUBLISHED' ? 'Publicado' : 'Agendado'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleShare(post.id)}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-emerald-400 transition-all"
                                                    title="Compartilhar/Ver"
                                                >
                                                    <Share2 size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => onEdit(post)}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-all"
                                                    title="Editar"
                                                >
                                                    <PenTool size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-500 transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/5">
                        <button 
                            disabled={historyPage === 1}
                            onClick={() => setHistoryPage(p => p - 1)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"
                        >
                            <RefreshCw size={14} className="rotate-180" />
                        </button>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Página {historyPage} de {totalHistoryPages}
                        </span>
                        <button 
                            disabled={historyPage === totalHistoryPages}
                            onClick={() => setHistoryPage(p => p + 1)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function SEOTab() {
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/marketing/keywords-history");
            const data = await res.json();
            if (res.ok) setHistory(data.history || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = async (kw?: string) => {
        const targetKw = kw || keyword;
        if (!targetKw) return;
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/search-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: targetKw })
            });
            const data = await res.json();
            if (res.ok) {
                setResults(data);
                fetchHistory(); // Atualiza histórico após pesquisa
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/10 rounded-3xl p-8">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <h2 className="text-2xl font-bold">Explorador de Palavras-Chave</h2>
                    <p className="text-gray-400">Descubra o que seu público está buscando e crie conteúdos baseados em dados reais.</p>
                    <div className="flex gap-2 p-2 bg-[#0b0f1a] rounded-2xl border border-white/10 shadow-2xl">
                        <input 
                            type="text" 
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ex: Marketing Digital, Clínica Odontológica..." 
                            className="flex-1 bg-transparent border-none outline-none px-4 text-white placeholder:text-gray-600"
                        />
                        <button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Sparkles className="animate-spin" size={18} /> : <Search size={18} />}
                            {loading ? "Analisando..." : "Analisar"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 overflow-hidden">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-400" />
                        {results ? `Resultados para "${results.keyword}"` : "Resultados da Pesquisa"}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="pb-4 font-medium">Palavra-Chave</th>
                                    <th className="pb-4 font-medium">Vol. Busca</th>
                                    <th className="pb-4 font-medium">Dificuldade</th>
                                    <th className="pb-4 font-medium">CPC Médio</th>
                                    <th className="pb-4 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {results ? (
                                    <>
                                        <tr className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 text-sm font-bold text-emerald-400">{results.keyword}</td>
                                            <td className="py-4 text-sm text-gray-400">{results.volume.toLocaleString()}/mês</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className={`h-full ${results.difficulty > 60 ? 'bg-red-500' : results.difficulty > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${results.difficulty}%` }}></div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${results.difficulty > 60 ? 'text-red-500' : results.difficulty > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {results.difficulty > 60 ? 'Difícil' : results.difficulty > 30 ? 'Média' : 'Fácil'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-gray-400">R$ {results.cpc.toFixed(2)}</td>
                                            <td className="py-4 text-right">
                                                <button className="text-emerald-400 hover:text-emerald-300 p-1 rounded-lg">
                                                    <Plus size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                        {results.suggestions?.map((s: any, i: number) => {
                                            const suggestion = typeof s === 'string' ? { keyword: s, volume: null, difficulty: null } : s;
                                            return (
                                                <tr key={i} className="group hover:bg-white/5 transition-colors opacity-70">
                                                    <td className="py-4 text-sm font-medium">{suggestion.keyword}</td>
                                                    <td className="py-4 text-sm text-gray-400">{suggestion.volume ? `${suggestion.volume.toLocaleString()}/mês` : '--'}</td>
                                                    <td className="py-4 text-sm text-gray-400">
                                                        {suggestion.difficulty ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${suggestion.difficulty > 60 ? 'bg-red-500' : suggestion.difficulty > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${suggestion.difficulty}%` }}></div>
                                                                </div>
                                                                <span className="text-[10px]">{suggestion.difficulty}%</span>
                                                            </div>
                                                        ) : '--'}
                                                    </td>
                                                    <td className="py-4 text-sm text-gray-400">--</td>
                                                    <td className="py-4 text-right"></td>
                                                </tr>
                                            );
                                        })}
                                    </>
                                ) : (
                                    [1,2,3,4].map((i) => (
                                        <tr key={i} className="group hover:bg-white/5 transition-colors opacity-20">
                                            <td className="py-4 text-sm font-medium">Pesquise uma palavra...</td>
                                            <td className="py-4 text-sm text-gray-400">--</td>
                                            <td className="py-4 text-sm text-gray-400">--</td>
                                            <td className="py-4 text-sm text-gray-400">--</td>
                                            <td className="py-4 text-right"></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Zap size={20} className="text-amber-400" />
                            Estratégia IA
                        </h3>
                        {results?.strategy ? (
                            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                                <p className="text-xs text-gray-400 leading-relaxed italic">"{results.strategy}"</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Pesquise algo para ver a estratégia...</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Target size={20} className="text-cyan-400" />
                            Sugestões de Tópicos
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {results?.topTopics ? results.topTopics.map((t: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 border border-white/10">
                                    {t}
                                </span>
                            )) : (
                                <p className="text-sm text-gray-500 italic">Pesquise algo para ver tópicos...</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <History size={20} className="text-gray-400" />
                            Pesquisas Recentes
                        </h3>
                        <div className="space-y-2">
                            {history.length > 0 ? history.map((h: any, i: number) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSearch(h.keyword)}
                                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-300 group-hover:text-emerald-400 transition-colors">{h.keyword}</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-black">{h.provider}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono text-gray-400">{h.volume?.toLocaleString() || '--'}</span>
                                        <div className="text-[10px] text-gray-600">vol/mês</div>
                                    </div>
                                </button>
                            )) : (
                                <p className="text-sm text-gray-500 italic">Nenhuma pesquisa recente encontrada.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContentTab({ bots, loadingBots }: any) {
    const [theme, setTheme] = useState("");
    const [tone, setTone] = useState("Profissional");
    const [platform, setPlatform] = useState("Instagram Feed");
    const [botId, setBotId] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedPost, setGeneratedPost] = useState<any>(null);
    const [baseImages, setBaseImages] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Configurações de Automação
    const [automation, setAutomation] = useState({
        frequency: "MANUAL",
        autoGenerate: false,
        batchSize: 1,
        postInterval: 24,
        topic: "",
        adsAutoOptimize: false,
        adsDailyBudget: 0,
        adsObjective: "ENGAGEMENT"
    });

    useEffect(() => {
        const selectedBot = bots.find((b: any) => b.id === botId);
        if (selectedBot) {
            setAutomation({
                frequency: selectedBot.marketingFrequency || "MANUAL",
                autoGenerate: selectedBot.marketingAutoGenerate || false,
                batchSize: selectedBot.marketingBatchSize || 1,
                postInterval: selectedBot.marketingPostInterval || 24,
                topic: selectedBot.marketingTopic || "",
                adsAutoOptimize: (selectedBot as any).adsAutoOptimize || false,
                adsDailyBudget: (selectedBot as any).adsDailyBudget || 0,
                adsObjective: (selectedBot as any).adsObjective || "ENGAGEMENT"
            });
            if (selectedBot.marketingTopic && !theme) {
                setTheme(selectedBot.marketingTopic);
            }
        }
    }, [botId, bots]);

    const handleSaveAutomation = async () => {
        if (!botId) return alert("Selecione um bot primeiro!");
        setLoading(true);
        try {
            const res = await fetch(`/api/bots/${botId}/marketing-automation`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(automation)
            });
            if (res.ok) alert("Configurações de automação salvas!");
            else alert("Erro ao salvar configurações.");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamanho no client antes de tentar
        if (file.size > 100 * 1024 * 1024) {
            return alert("Arquivo muito grande! O limite é de 100MB.");
        }

        setUploadingMedia(true);
        const formData = new FormData();
        formData.append("files", file);

        try {
            const data = await uploadMarketingMedia(formData);
            if (data.urls && data.urls.length > 0) {
                if (type === 'video') {
                    setVideoUrl(data.urls[0]);
                    setPlatform("Instagram Reels");
                } else {
                    setBaseImages([...baseImages, ...data.urls]);
                }
            } else {
                alert("Erro no upload. Tente um arquivo menor ou verifique sua conexão.");
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erro de rede ao tentar enviar o arquivo.");
        } finally {
            setUploadingMedia(false);
            e.target.value = ""; // Limpa o input para permitir re-upload do mesmo arquivo se necessário
        }
    };

    const handleGenerate = async () => {
        if (!theme || !botId) return alert("Selecione um bot e digite um tema!");
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/generate-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    theme, 
                    tone, 
                    platform, 
                    botId, 
                    baseImageUrls: baseImages,
                    videoUrl: videoUrl 
                })
            });
            const data = await res.json();
            if (res.ok && data.id) {
                setGeneratedPost(data);
                setBaseImages([]); // Limpar após gerar
            }
            else alert(data.error || "Erro desconhecido ao gerar post");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBatch = async () => {
        if (!botId || !automation.topic) return alert("Configure o tema da automação primeiro!");
        if (!confirm(`Gerar lote de ${automation.batchSize} posts como rascunho?`)) return;
        
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/generate-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    botId, 
                    count: automation.batchSize, 
                    theme: automation.topic,
                    tone,
                    platform
                })
            });
            const data = await res.json();
            if (res.ok && data.posts && data.posts.length > 0) {
                alert(`${data.count} posts gerados com sucesso! Verifique sua lista de rascunhos.`);
                setGeneratedPost(data.posts[0]); // Mostra o primeiro do lote
            } else alert(data.error || "Erro ao gerar lote de posts");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!generatedPost?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/marketing/posts/${generatedPost.id}/publish`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert(`Post agendado com sucesso para ${new Date(data.scheduledAt).toLocaleString('pt-BR')}!`);
                setGeneratedPost({ ...generatedPost, status: "SCHEDULED" });
            } else alert(data.error || "Erro ao agendar post");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBoost = async () => {
        if (!generatedPost?.id) return;
        const budget = prompt("Qual o orçamento diário para este impulsionamento? (Ex: 10 para R$ 10,00)", "10");
        if (!budget) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/marketing/posts/${generatedPost.id}/boost`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dailyBudget: parseInt(budget) * 100 })
            });
            const data = await res.json();
            if (res.ok) alert(`Impulsionamento iniciado! ID: ${data.adId}`);
            else alert(data.error);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
                {/* Manual Generator */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Sparkles size={24} className="text-emerald-400" />
                            Criar Novo Conteúdo
                        </h2>
                        <p className="text-gray-400">Dê um tema e a IA criará a imagem e o texto otimizado.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Atendente Responsável</label>
                            <select 
                                value={botId}
                                onChange={(e) => setBotId(e.target.value)}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                            >
                                <option value="">Selecione um atendente...</option>
                                {bots && Array.isArray(bots) && bots.map((bot: any) => (
                                    <option key={bot.id} value={bot.id}>{bot.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 flex items-center justify-between">
                                Fotos de Referência (Opcional)
                                {uploadingMedia && <span className="text-[10px] text-emerald-400 animate-pulse">Enviando...</span>}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {baseImages.map((url, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                        <img src={url} alt="Reference" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setBaseImages(baseImages.filter((_, i) => i !== idx))}
                                            className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl-lg hover:bg-red-500"
                                        >
                                            <Plus size={10} className="rotate-45" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-all">
                                    <Plus size={20} className="text-gray-500" />
                                    <span className="text-[8px] text-gray-500 uppercase font-bold">Imagem</span>
                                    <input type="file" multiple hidden accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} />
                                </label>
                                <label className={`w-16 h-16 rounded-lg border-2 border-dashed ${videoUrl ? 'border-blue-500 bg-blue-500/10' : 'border-white/10'} flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all`}>
                                    <Zap size={20} className={videoUrl ? 'text-blue-400' : 'text-gray-500'} />
                                    <span className="text-[8px] text-gray-500 uppercase font-bold">{videoUrl ? 'Vídeo OK' : 'Vídeo'}</span>
                                    <input type="file" hidden accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Sobre o que é o post?</label>
                            <textarea 
                                rows={3}
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="Descreva o tema, produto ou promoção..."
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Tom de Voz</label>
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                                >
                                    <option>Profissional</option>
                                    <option>Descontraído</option>
                                    <option>Urgente/Vendas</option>
                                    <option>Inspirador</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Plataforma</label>
                                <select 
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                                >
                                    <option>Instagram Feed</option>
                                    <option>Instagram Stories</option>
                                    <option>Instagram Reels</option>
                                    <option>Facebook Feed</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] disabled:opacity-50"
                        >
                            {loading ? <Sparkles className="animate-spin" size={22} /> : <Sparkles size={22} />}
                            {loading ? "Gerando Mágica..." : "Gerar Post com IA"}
                        </button>
                    </div>
                </div>

                {/* Automation Settings */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Zap size={22} className="text-amber-400" />
                            Automação de Posts (Set & Forget)
                        </h2>
                        <p className="text-gray-400 text-sm">Configure a IA para gerar rascunhos automaticamente para você aprovar.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Tema Central da Automação</label>
                            <input 
                                type="text"
                                value={automation.topic}
                                onChange={(e) => setAutomation({...automation, topic: e.target.value})}
                                placeholder="Ex: Dicas de moda feminina, promoções da semana..."
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white outline-none focus:border-amber-500/50 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Frequência</label>
                                <select 
                                    value={automation.frequency}
                                    onChange={(e) => setAutomation({...automation, frequency: e.target.value})}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white outline-none"
                                >
                                    <option value="MANUAL">Manual</option>
                                    <option value="HOURLY">Por Hora</option>
                                    <option value="DAILY">Diário (1x dia)</option>
                                    <option value="3X_WEEK">3x por Semana</option>
                                    <option value="WEEKLY">Semanal (1x semana)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Qtd. por Lote</label>
                                <input 
                                    type="number"
                                    min={1}
                                    max={7}
                                    value={automation.batchSize}
                                    onChange={(e) => setAutomation({...automation, batchSize: parseInt(e.target.value)})}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={handleSaveAutomation}
                                disabled={loading}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <Settings size={14} /> Salvar Automação
                            </button>
                            <button 
                                onClick={handleGenerateBatch}
                                disabled={loading || !automation.topic}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                                <Sparkles size={14} /> Gerar Lote Agora
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <div className="space-y-6">
                {generatedPost ? (() => {
                    const headline = generatedPost.content.split('\n')[0].replace(/[#*]/g, '').substring(0, 60) || "Destaque Conexão";
                    
                    return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
                            {/* Imagem Base */}
                            {generatedPost.mediaType === "VIDEO" || generatedPost.videoUrl ? (
                                <video src={generatedPost.videoUrl || generatedPost.imageUrl} controls className="w-full h-full object-cover" />
                            ) : (
                                <img 
                                    src={generatedPost.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            )}

                            {/* Badge de Status */}
                            <div className="absolute top-6 right-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-xl ${
                                    generatedPost.status === 'PUBLISHED' 
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>
                                    {generatedPost.status === 'PUBLISHED' ? 'Publicado' : 'Criativo Pronto'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Legenda Final (Português)</h4>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedPost.content);
                                        alert("Legenda copiada!");
                                    }}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase transition-colors"
                                >
                                    Copiar
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedPost.content}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handlePublish}
                                disabled={loading || generatedPost.status === 'PUBLISHED'}
                                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:grayscale text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Instagram size={20} />}
                                {generatedPost.status === 'PUBLISHED' ? "Post Publicado no Feed" : "Aprovar e Publicar no Instagram"}
                            </button>
                            
                            {generatedPost.status === 'PUBLISHED' && (
                                <button 
                                    onClick={handleBoost}
                                    className="h-14 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
                                >
                                    <Zap size={20} />
                                    Impulsionar este Criativo
                                </button>
                            )}
                        </div>
                    </div>
                    )})() : (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-gray-600">
                            <PenTool size={40} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">Preview do Post</h4>
                            <p className="text-gray-500">Configure as opções ao lado para gerar uma prévia.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AdsTab({ selectedClientId, setShowCampaignModal, bots, loadingBots }: any) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ campaigns: [], insights: null });
    const [loadingSave, setLoadingSave] = useState(false);
    const [automation, setAutomation] = useState({
        adsAutoOptimize: false,
        adsDailyBudget: 0,
        adsObjective: "ENGAGEMENT",
        botId: ""
    });

    const handleSaveAutomation = async () => {
        if (!automation.botId) return alert("Selecione um bot para gerenciar a automação");
        setLoadingSave(true);
        try {
            const res = await fetch(`/api/bots/${automation.botId}/marketing-automation`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(automation)
            });
            if (res.ok) alert("Automação de anúncios atualizada com sucesso!");
            else alert("Erro ao salvar automação.");
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setLoadingSave(false);
        }
    };

    const fetchAds = async () => {
        try {
            const url = `/api/marketing/ads${selectedClientId ? `?clientId=${selectedClientId}` : ""}`;
            const res = await fetch(url);
            const d = await res.json();
            if (res.ok) setData(d);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, [selectedClientId]);

    const spend = data.insights?.spend || "0.00";
    const ctr = data.insights?.inline_link_click_ctr || "0.00";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Campanhas Ativas</p>
                        <p className="text-xl font-bold">{data.campaigns.filter((c: any) => c.status === 'ACTIVE').length}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Gasto Total</p>
                        <p className="text-xl font-bold">R$ {parseFloat(spend).toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">CTR Médio</p>
                        <p className="text-xl font-bold">{parseFloat(ctr).toFixed(2)}%</p>
                    </div>
                </div>
            </div>

            {/* Gestor Autônomo de Tráfego (Piloto Automático) */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                            <Target size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Gestor Autônomo de Tráfego</h3>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Piloto Automático & Otimização</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${automation.adsAutoOptimize ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {automation.adsAutoOptimize ? 'LIGADO' : 'DESLIGADO'}
                        </span>
                        <button 
                            onClick={() => setAutomation({...automation, adsAutoOptimize: !automation.adsAutoOptimize})}
                            className={`w-12 h-6 rounded-full transition-all relative ${automation.adsAutoOptimize ? 'bg-emerald-500' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${automation.adsAutoOptimize ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Bot Responsável</label>
                            <select 
                                value={automation.botId}
                                onChange={(e) => setAutomation({...automation, botId: e.target.value})}
                                className="w-full bg-transparent text-sm text-white outline-none"
                            >
                                <option value="" className="bg-[#0b0f1a]">Selecione um Bot...</option>
                                {bots.map((bot: any) => (
                                    <option key={bot.id} value={bot.id} className="bg-[#0b0f1a]">{bot.name}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-gray-400 text-sm">O Supervisor analisará seus melhores posts e criará campanhas automaticamente para otimizar seus resultados.</p>
                        
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-blue-400/60">
                                <span>Verificação de Saldo (Meta Ads)</span>
                                <span className={data.metaBalance ? "text-emerald-400" : "text-amber-500"}>
                                    {data.metaBalance ? "Conectado" : "Não Integrado"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-300">Saldo Disponível na Conta</span>
                                <span className="text-sm font-bold text-white">
                                    {data.metaBalance ? `R$ ${data.metaBalance.balance.toFixed(2)}` : "R$ 0,00"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Orçamento Diário (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">R$</span>
                                    <input 
                                        type="number"
                                        value={automation.adsDailyBudget}
                                        onChange={(e) => setAutomation({...automation, adsDailyBudget: parseFloat(e.target.value) || 0})}
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500/50 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Objetivo</label>
                                <select 
                                    value={automation.adsObjective}
                                    onChange={(e) => setAutomation({...automation, adsObjective: e.target.value})}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white outline-none"
                                >
                                    <option value="ENGAGEMENT">Engajamento</option>
                                    <option value="TRAFFIC">Tráfego</option>
                                    <option value="LEAD_GEN">Geração de Leads</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveAutomation}
                            disabled={loadingSave || (automation.adsAutoOptimize && automation.adsDailyBudget <= 0)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {loadingSave ? <RefreshCw className="animate-spin" size={18} /> : <Target size={18} />}
                            {automation.adsAutoOptimize ? "Salvar & Ativar Otimização" : "Salvar Configurações"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">

                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold">Gerenciador de Anúncios (Meta Ads)</h3>
                    <button 
                        onClick={() => setShowCampaignModal(true)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nova Campanha
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Sparkles className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : data.campaigns.length === 0 ? (
                        <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/10">
                            <p className="text-gray-500">Nenhuma campanha encontrada ou conta não integrada.</p>
                            <p className="text-xs text-gray-600 mt-1">Configure seu Token e ID da Conta na aba de Integrações.</p>
                        </div>
                    ) : (
                        data.campaigns.map((camp: any) => (
                            <div key={camp.id} className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500/30 transition-all">
                                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                    <Instagram size={24} className="text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold truncate text-lg">{camp.name}</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${camp.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gray-400/10 text-gray-400'}`}>
                                            {camp.status}
                                        </span>
                                        <span className="text-xs text-gray-500">Objetivo: {camp.objective}</span>
                                        {camp.daily_budget && <span className="text-xs text-gray-500">Orçamento: R$ {(camp.daily_budget / 100).toFixed(2)}/dia</span>}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
                                        <Settings size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ selectedClientId }: { selectedClientId?: string }) {
    const [settings, setSettings] = useState({
        metaAdsToken: "",
        metaAdsAccountId: "",
        metaAdsPixelId: "",
        googleAdsCustomerId: "",
        semrushApiKey: "",
        dataForSeoApiKey: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
        fetch(`/api/settings/marketing${query}`)
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            });
    }, [selectedClientId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            await fetch(`/api/settings/marketing${query}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            alert("Configurações salvas!");
        } catch (error) {
            alert("Erro ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {selectedClientId && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                            <Target size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Editando Configurações de Cliente</p>
                            <p className="text-sm text-white font-medium">As chaves abaixo serão aplicadas apenas a este cliente.</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                        Modo Cliente
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Meta Settings */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Target className="text-blue-500" size={24} />
                        Meta Marketing (FB/IG)
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Access Token (Marketing API)</label>
                            <input 
                                type="password" 
                                value={settings.metaAdsToken}
                                onChange={e => setSettings({...settings, metaAdsToken: e.target.value})}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50" 
                                placeholder="EAAB..." 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Ad Account ID</label>
                            <input 
                                type="text" 
                                value={settings.metaAdsAccountId}
                                onChange={e => setSettings({...settings, metaAdsAccountId: e.target.value})}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50" 
                                placeholder="act_123456789" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Pixel ID (Conversões)</label>
                            <input 
                                type="text" 
                                value={settings.metaAdsPixelId}
                                onChange={e => setSettings({...settings, metaAdsPixelId: e.target.value})}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500/50" 
                                placeholder="123456789012345" 
                            />
                        </div>
                    </div>
                </div>
                
                {/* SEO Settings */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <SearchCode className="text-emerald-500" size={24} />
                        SEO & Keywords
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Semrush API Key</label>
                            <input 
                                type="password" 
                                value={settings.semrushApiKey}
                                onChange={e => setSettings({...settings, semrushApiKey: e.target.value})}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500/50" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">DataForSEO API Key</label>
                            <input 
                                type="password" 
                                value={settings.dataForSeoApiKey}
                                onChange={e => setSettings({...settings, dataForSeoApiKey: e.target.value})}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500/50" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-white text-[#0b0f1a] rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-xl disabled:opacity-50"
            >
                {loading ? "Salvando..." : "Salvar Configurações de Marketing"}
            </button>
        </div>
    );
}

function StatCard({ title, value, change, icon: Icon, color }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-2 relative overflow-hidden group hover:bg-white/[0.07] transition-all text-left">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={80} />
            </div>
            <div className={`p-2 w-fit rounded-xl bg-white/5 ${color}`}>
                <Icon size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <div className="flex items-end justify-between">
                <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-400`}>
                    {change}
                </span>
            </div>
        </div>
    );
}

function ActionItem({ title, desc }: any) {
    return (
        <div className="p-4 bg-[#0b0f1a] border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group text-left">
            <h4 className="text-sm font-bold flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                {title}
                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
            </h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
        </div>
    );
}

function EditPostModal({ post, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState(post.content);
    const [imageUrl, setImageUrl] = useState(post.imageUrl);
    const [instructions, setInstructions] = useState("");
    const [refining, setRefining] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("files", file);

        try {
            const data = await uploadMarketingMedia(formData);
            if (data.urls && data.urls.length > 0) {
                setImageUrl(data.urls[0]);
            } else {
                alert("Erro no upload da imagem");
            }
        } catch (error: any) {
            alert(error.message || "Erro de conexão no upload");
        } finally {
            setUploading(false);
        }
    };

    const handleRefine = async () => {
        if (!instructions) return alert("Digite o que você deseja mudar (ex: 'deixe mais engraçado')");
        setRefining(true);
        try {
            const res = await fetch(`/api/marketing/posts/${post.id}/refine`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instructions })
            });
            const data = await res.json();
            if (res.ok) {
                setContent(data.content);
                setImageUrl(data.imageUrl);
                setInstructions("");
                alert("IA refinou o post com sucesso!");
            } else {
                alert(data.error || "Erro ao refinar post");
            }
        } catch (error) {
            alert("Erro de conexão ao refinar");
        } finally {
            setRefining(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/marketing/posts/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, imageUrl })
            });
            if (res.ok) {
                alert("Post atualizado!");
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao salvar post");
            }
        } catch (error) {
            alert("Erro de conexão ao salvar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-4xl p-8 space-y-6 shadow-2xl relative my-auto">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                            <PenTool size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Edição Inteligente</h2>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Ajuste manual ou automático via IA</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    {/* Imagem */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Visual do Post</label>
                        <div className="relative aspect-square bg-black/20 rounded-3xl overflow-hidden border border-white/10 group">
                            {(() => {
                                const vUrl = post.videoUrl || imageUrl;
                                const isVideo = post.mediaType?.toUpperCase() === "VIDEO" || 
                                              (vUrl && (vUrl.toLowerCase().endsWith('.mp4') || vUrl.toLowerCase().endsWith('.mov') || vUrl.toLowerCase().includes('video')));
                                
                                if (isVideo && vUrl) {
                                    return <video src={vUrl} className="w-full h-full object-cover" muted playsInline controls />;
                                } else if (imageUrl) {
                                    return <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />;
                                } else {
                                    return (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500">
                                            <Plus size={32} />
                                            <span className="text-xs">Sem Mídia</span>
                                        </div>
                                    );
                                }
                            })()}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all">
                                    {uploading ? "Enviando..." : "Trocar Imagem"}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Texto Manual */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500">Edição Manual</label>
                        <textarea 
                            className="w-full h-[300px] bg-[#0b0f1a] border border-white/10 rounded-3xl p-6 text-sm text-gray-300 outline-none focus:border-emerald-500/50 transition-all resize-none custom-scrollbar"
                            placeholder="Altere o texto aqui..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {/* Refinamento IA */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-emerald-500/70 flex items-center gap-2">
                            <Sparkles size={14} />
                            Observações para a IA
                        </label>
                        <div className="space-y-4 flex flex-col h-[300px]">
                            <textarea 
                                className="flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 text-sm text-gray-300 outline-none focus:border-emerald-500/30 transition-all resize-none custom-scrollbar placeholder:text-gray-600"
                                placeholder="Ex: 'Mude o tom para mais engraçado', 'Adicione um emoji de foguete', 'Mude a imagem para algo futurista'..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                            <button 
                                onClick={handleRefine}
                                disabled={refining || !instructions}
                                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 border border-white/5"
                            >
                                {refining ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Refinando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} className="text-emerald-500" />
                                        Melhorar com IA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 relative z-10 border-t border-white/5">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all font-bold"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading || uploading || refining}
                        className="flex-1 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-black transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                        {loading ? "Salvando..." : (
                            <>
                                <Check size={18} />
                                Salvar Alterações Finalizadas
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
