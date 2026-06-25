"use client";

import { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Video, Calendar, ArrowUpRight, Zap, RefreshCw, PenTool, Trash2, CheckCircle2, Plus, Instagram, Settings } from "lucide-react";
import { uploadMarketingMedia } from "@/app/actions/marketing-actions";

export function ContentTab({ bots, loadingBots }: any) {
    const [theme, setTheme] = useState("");
    const [tone, setTone] = useState("Profissional");
    const [platform, setPlatform] = useState("Instagram Feed");
    const [botId, setBotId] = useState("");
    const [postFormat, setPostFormat] = useState("SINGLE");
    const [activeSlide, setActiveSlide] = useState(0);
    const [loading, setLoading] = useState(false);
    const [generatedPost, setGeneratedPost] = useState<any>(null);
    const [baseImages, setBaseImages] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Configura├º├Áes de Automa├º├úo
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
            if (res.ok) alert("Configura├º├Áes de automa├º├úo salvas!");
            else alert("Erro ao salvar configura├º├Áes.");
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
            return alert("Arquivo muito grande! O limite ├® de 100MB.");
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
                alert("Erro no upload. Tente um arquivo menor ou verifique sua conex├úo.");
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erro de rede ao tentar enviar o arquivo.");
        } finally {
            setUploadingMedia(false);
            e.target.value = ""; // Limpa o input para permitir re-upload do mesmo arquivo se necess├írio
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
                    videoUrl: videoUrl,
                    postFormat
                })
            });
            const data = await res.json();
            if (res.ok && data.id) {
                setGeneratedPost(data);
                setBaseImages([]); // Limpar ap├│s gerar
            }
            else alert(data.error || "Erro desconhecido ao gerar post");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBatch = async () => {
        if (!botId || !automation.topic) return alert("Configure o tema da automa├º├úo primeiro!");
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
        const budget = prompt("Qual o or├ºamento di├írio para este impulsionamento? (Ex: 10 para R$ 10,00)", "10");
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
                            Criar Novo Conte├║do
                        </h2>
                        <p className="text-gray-400">D├¬ um tema e a IA criar├í a imagem e o texto otimizado.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Atendente Respons├ível</label>
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
                                Fotos de Refer├¬ncia (Opcional)
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
                                    <span className="text-[8px] text-gray-500 uppercase font-bold">{videoUrl ? 'V├¡deo OK' : 'V├¡deo'}</span>
                                    <input type="file" hidden accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Sobre o que ├® o post?</label>
                            <textarea 
                                rows={3}
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                placeholder="Descreva o tema, produto ou promo├º├úo..."
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Formato do Conte├║do</label>
                            <select 
                                value={postFormat}
                                onChange={(e) => setPostFormat(e.target.value)}
                                className="w-full bg-[#0b0f1a] border border-emerald-500/20 rounded-2xl p-3 text-emerald-400 font-bold focus:border-emerald-500/50 outline-none transition-all"
                            >
                                <option value="SINGLE">Post ├Ünico (Imagem + Legenda)</option>
                                <option value="CAROUSEL">Carrossel Multislide (V├írios Slides)</option>
                                <option value="VIDEO_SCRIPT">Roteiro de V├¡deo (Reels/TikTok/Shorts)</option>
                            </select>
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
                                    <option>Descontra├¡do</option>
                                    <option>Urgente/Vendas</option>
                                    <option>Inspirador</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Plataforma</label>
                                <select 
                                    value={platform}
                                    onChange={(e) => {
                                        setPlatform(e.target.value);
                                        if (e.target.value.includes("Reels")) {
                                            setPostFormat("VIDEO_SCRIPT");
                                        }
                                    }}
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
                            {loading ? "Gerando M├ígica..." : "Gerar Post com IA"}
                        </button>
                    </div>
                </div>

                {/* Automation Settings */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <Zap size={22} className="text-amber-400" />
                            Automa├º├úo de Posts (Set & Forget)
                        </h2>
                        <p className="text-gray-400 text-sm">Configure a IA para gerar rascunhos automaticamente para voc├¬ aprovar.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Tema Central da Automa├º├úo</label>
                            <input 
                                type="text"
                                value={automation.topic}
                                onChange={(e) => setAutomation({...automation, topic: e.target.value})}
                                placeholder="Ex: Dicas de moda feminina, promo├º├Áes da semana..."
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white outline-none focus:border-amber-500/50 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Frequ├¬ncia</label>
                                <select 
                                    value={automation.frequency}
                                    onChange={(e) => setAutomation({...automation, frequency: e.target.value})}
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white outline-none"
                                >
                                    <option value="MANUAL">Manual</option>
                                    <option value="HOURLY">Por Hora</option>
                                    <option value="DAILY">Di├írio (1x dia)</option>
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
                                <Settings size={14} /> Salvar Automa├º├úo
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
                    let parsedData: any = null;
                    try {
                        if (generatedPost.content && (generatedPost.content.trim().startsWith('{') || generatedPost.content.trim().startsWith('['))) {
                            parsedData = JSON.parse(generatedPost.content);
                        }
                    } catch (e) {
                        console.error("Failed to parse structured post data:", e);
                    }

                    const captionText = parsedData ? parsedData.caption : generatedPost.content;
                    const headline = captionText.split('\n')[0].replace(/[#*]/g, '').substring(0, 60) || "Destaque Conex├úo";
                    
                    return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {parsedData && parsedData.type === "carousel" ? (
                            /* --- GORGEOUS PREMIUM CAROUSEL PREVIEW --- */
                            <div className="space-y-4">
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-emerald-500/20 bg-black/60 shadow-2xl flex flex-col justify-between p-8">
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/80 z-0"></div>
                                    {generatedPost.imageUrl && (
                                        <img src={generatedPost.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 z-0 mix-blend-overlay" alt="BG" />
                                    )}
                                    
                                    {/* Header do Slide */}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full">
                                            Carrossel Din├ómico
                                        </span>
                                        <span className="text-xs font-mono font-bold text-gray-400">
                                            Slide {activeSlide + 1} de {parsedData.slides?.length || 1}
                                        </span>
                                    </div>

                                    {/* Conte├║do do Slide */}
                                    <div className="relative z-10 space-y-4 my-auto text-center max-w-lg mx-auto">
                                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight bg-gradient-to-r from-white via-white to-emerald-300 bg-clip-text text-transparent">
                                            {parsedData.slides?.[activeSlide]?.title}
                                        </h3>
                                        <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium">
                                            {parsedData.slides?.[activeSlide]?.content}
                                        </p>
                                    </div>

                                    {/* Diretriz do Designer (Glassmorphism Footer) */}
                                    <div className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Diretriz Visual para o Designer:</p>
                                        <p className="text-xs text-gray-300 italic font-medium">
                                            "{parsedData.slides?.[activeSlide]?.visualDescription || "Foco no conceito da marca."}"
                                        </p>
                                    </div>

                                    {/* Navega├º├úo de Slides */}
                                    <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 z-20 flex justify-between pointer-events-none">
                                        <button 
                                            disabled={activeSlide === 0}
                                            onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                                            className="w-10 h-10 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 disabled:opacity-20 transition-all pointer-events-auto shadow-lg"
                                        >
                                            ÔåÉ
                                        </button>
                                        <button 
                                            disabled={activeSlide === (parsedData.slides?.length || 1) - 1}
                                            onClick={() => setActiveSlide(prev => Math.min((parsedData.slides?.length || 1) - 1, prev + 1))}
                                            className="w-10 h-10 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 disabled:opacity-20 transition-all pointer-events-auto shadow-lg"
                                        >
                                            ÔåÆ
                                        </button>
                                    </div>
                                </div>

                                {/* Slides Thumbnails */}
                                <div className="flex gap-2 overflow-x-auto py-2 custom-scrollbar">
                                    {parsedData.slides?.map((slide: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveSlide(idx)}
                                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                                                activeSlide === idx 
                                                ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/10" 
                                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                            }`}
                                        >
                                            Slide {slide.slide}: {slide.title?.substring(0, 15)}...
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : parsedData && parsedData.type === "video_script" ? (
                            /* --- GORGEOUS PREMIUM VIDEO SCRIPT GRID --- */
                            <div className="space-y-4">
                                <div className="bg-[#0f172a] border border-blue-500/20 rounded-[2rem] p-6 space-y-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                                    <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold">
                                                Reels
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-white text-base">Roteiro T├®cnico de V├¡deo</h4>
                                                <p className="text-[9px] text-blue-400 uppercase font-black tracking-widest">Reels / TikTok / Shorts</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-gray-400">
                                            {parsedData.scenes?.length || 0} cenas planejadas
                                        </span>
                                    </div>

                                    <div className="relative z-10 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                                        {parsedData.scenes?.map((scene: any, idx: number) => (
                                            <div key={idx} className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] uppercase font-black tracking-widest">
                                                    <span className="text-blue-400 font-bold">CENA {scene.scene}</span>
                                                    <span className="text-gray-500 font-mono">{scene.time}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase">Locu├º├úo / ├üudio:</span>
                                                        <p className="text-gray-200 leading-relaxed font-medium">"{scene.audio}"</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase">Instru├º├úo de V├¡deo:</span>
                                                        <p className="text-gray-300 leading-relaxed italic">"{scene.video}"</p>
                                                    </div>
                                                </div>
                                                {scene.screenText && (
                                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-xs">
                                                        <span className="text-[9px] font-black text-blue-400/80 uppercase">Texto na Tela:</span>
                                                        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-lg font-bold">
                                                            {scene.screenText}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* --- STANDARD SINGLE POST IMAGE PREVIEW --- */
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
                        )}

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Legenda Final (Portugu├¬s)</h4>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(captionText);
                                        alert("Legenda copiada!");
                                    }}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase transition-colors"
                                >
                                    Copiar
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{captionText}</p>
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
                            <p className="text-gray-500">Configure as op├º├Áes ao lado para gerar uma pr├®via.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

