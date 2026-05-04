"use client";

import { useState, useEffect } from "react";
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
    Target
} from "lucide-react";
export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [bots, setBots] = useState<any[]>([]);
    const [data, setData] = useState<any>({ campaigns: [], insights: null, postsCount: 0 });
    const [loadingBots, setLoadingBots] = useState(true);

    const tabs = [
        { id: "overview", label: "Visão Geral", icon: BarChart3 },
        { id: "seo", label: "SEO & Keywords", icon: SearchCode },
        { id: "content", label: "Criador de Posts", icon: Sparkles },
        { id: "ads", label: "Anúncios (Meta Ads)", icon: Target },
        { id: "settings", label: "Integrações", icon: Settings },
    ];

    const fetchBots = async () => {
        try {
            const res = await fetch("/api/bots");
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
            const [adsRes, statsRes] = await Promise.all([
                fetch("/api/marketing/ads"),
                fetch("/api/marketing/stats")
            ]);
            
            const adsData = await adsRes.json();
            const statsData = await statsRes.json();

            setData({
                ...adsData,
                postsCount: statsData.postsCount || 0
            });
        } catch (error) {
            console.error("Erro ao buscar dados de marketing:", error);
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
        fetchBots();
        fetchMarketingData();
    }, []);

    return (
        <div className="p-6 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">Agência Conext <span className="text-emerald-400">IA</span></h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        Marketing Automatizado & Inteligência de Dados
                    </p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button 
                        onClick={handleExport}
                        className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold transition-all border border-white/5 flex items-center gap-2"
                    >
                        <Calendar size={18} />
                        Exportar Relatório
                    </button>
                    <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 px-6 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2">
                        <Plus size={18} />
                        Nova Campanha
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
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
                    activeCampaigns: data.campaigns.filter((c: any) => c.status === 'ACTIVE').length
                }} />}
                {activeTab === "seo" && <SEOTab />}
                {activeTab === "content" && <ContentTab bots={bots} loadingBots={loadingBots} />}
                {activeTab === "ads" && <AdsTab />}
                {activeTab === "settings" && <SettingsTab />}
            </div>
        </div>
    );
}

function OverviewTab({ stats }: any) {
    const postsCount = stats.postsCount || 0;
    const spend = stats.adsInsights?.spend || "0";
    const ctr = stats.adsInsights?.inline_link_click_ctr || "0.00";

    return (
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

            <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-emerald-400" />
                    Desempenho de Campanhas
                </h3>
                <div className="h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-gray-500 italic">
                    Gráfico de desempenho será exibido aqui após a integração.
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Zap size={20} className="text-amber-400" />
                    Ações Recomendadas
                </h3>
                <div className="space-y-4">
                    <ActionItem 
                        title="Impulsionar Post" 
                        desc="Post sobre 'Tênis' está com engajamento 40% acima da média."
                    />
                    <ActionItem 
                        title="Nova Keyword" 
                        desc="Tendência de busca por 'Moda Sustentável' subiu 200%."
                    />
                    <ActionItem 
                        title="Revisar Anúncio" 
                        desc="Campanha 'Verão 2025' está com CPC alto."
                    />
                </div>
            </div>
        </div>
    );
}

function SEOTab() {
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleSearch = async () => {
        if (!keyword) return;
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/search-keywords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword })
            });
            const data = await res.json();
            if (res.ok) setResults(data);
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
                                        {results.suggestions?.map((s: string, i: number) => (
                                            <tr key={i} className="group hover:bg-white/5 transition-colors opacity-70">
                                                <td className="py-4 text-sm font-medium">{s}</td>
                                                <td className="py-4 text-sm text-gray-400">--</td>
                                                <td className="py-4 text-sm text-gray-400">--</td>
                                                <td className="py-4 text-sm text-gray-400">--</td>
                                                <td className="py-4 text-right"></td>
                                            </tr>
                                        ))}
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

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Target size={20} className="text-cyan-400" />
                        Sugestões de Conteúdo
                    </h3>
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Baseado no SEO</p>
                        {results ? (
                             <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer">
                                <h4 className="text-sm font-bold text-emerald-400">"{results.keyword}: O Guia Definitivo"</h4>
                                <p className="text-xs text-gray-500 mt-1">Ótimo para capturar o volume de {results.volume} buscas.</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Pesquise algo para ver sugestões...</p>
                        )}
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

    const handleGenerate = async () => {
        if (!theme || !botId) return alert("Selecione um bot e digite um tema!");
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/generate-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme, tone, platform, botId })
            });
            const data = await res.json();
            if (res.ok) setGeneratedPost(data);
            else alert(data.error);
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
                alert("Post publicado com sucesso!");
                setGeneratedPost({ ...generatedPost, status: "PUBLISHED" });
            } else alert(data.error);
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
                            {bots.map((bot: any) => (
                                <option key={bot.id} value={bot.id}>{bot.name}</option>
                            ))}
                        </select>
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

            <div className="space-y-6">
                {generatedPost ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 animate-fade-in">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                            {generatedPost.imageUrl ? (
                                <img src={generatedPost.imageUrl} alt="AI Generated" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                                    <PenTool size={40} className="mb-2" />
                                    <p className="text-xs">Imagem não gerada (verifique sua chave OpenAI)</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-emerald-400">Legenda Gerada</h4>
                                <button className="text-xs text-gray-500 hover:text-white underline">Copiar</button>
                            </div>
                            <div className="bg-[#0b0f1a] p-4 rounded-xl text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border border-white/5">
                                {generatedPost.content}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {generatedPost.status !== "PUBLISHED" ? (
                                <button 
                                    onClick={handlePublish}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Instagram size={18} /> Publicar Agora
                                </button>
                            ) : (
                                <button 
                                    onClick={handleBoost}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap size={18} /> Impulsionar com 1-Clique
                                </button>
                            )}
                            <button className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-gray-400">
                                {generatedPost.status === "PUBLISHED" ? "Publicado ✓" : "Agendar para depois"}
                            </button>
                        </div>
                    </div>
                ) : (
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

function AdsTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ campaigns: [], insights: null });

    const fetchAds = async () => {
        try {
            const res = await fetch("/api/marketing/ads");
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
    }, []);

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

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold">Gerenciador de Anúncios (Meta Ads)</h3>
                    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold flex items-center gap-2">
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

function SettingsTab() {
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
        fetch("/api/settings/marketing")
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await fetch("/api/settings/marketing", {
                method: "POST",
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
