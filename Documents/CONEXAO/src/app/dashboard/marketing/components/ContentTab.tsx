"use client";

import { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Video, Calendar, ArrowUpRight, Zap, RefreshCw, PenTool, Trash2, CheckCircle2, Plus, Instagram, Settings, HardDrive, ArrowLeft, Upload, Clock, Heart, MessageCircle, ThumbsUp, MessageSquare, Share2, Send, Bookmark } from "lucide-react";
import { uploadMarketingMedia } from "@/app/actions/marketing-actions";

export function ContentTab({ bots, loadingBots, selectedClientId, prefilledDate, onClearPrefilledDate }: any) {
    const [theme, setTheme] = useState("");
    const [tone, setTone] = useState("Profissional");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram Feed"]);
    const [botId, setBotId] = useState("");
    const [postFormat, setPostFormat] = useState("SINGLE");
    const [activeSlide, setActiveSlide] = useState(0);
    const [loading, setLoading] = useState(false);

    // Creation Modes
    const [creationMode, setCreationMode] = useState<"manual" | "ai">("manual");
    const [manualCaption, setManualCaption] = useState("");
    const [manualFirstComment, setManualFirstComment] = useState("");
    
    // Draft Queue State
    const [drafts, setDrafts] = useState<any[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<any>(null);
    const [loadingDrafts, setLoadingDrafts] = useState(false);

    // Editor State
    const [editedCaption, setEditedCaption] = useState("");
    const [firstComment, setFirstComment] = useState("");
    const [scheduleDate, setScheduleDate] = useState("");
    const [savingDraft, setSavingDraft] = useState(false);
    const [editorMode, setEditorMode] = useState<"edit" | "preview">("edit");
    const [previewPlatform, setPreviewPlatform] = useState<"instagram" | "facebook">("instagram");

    // Canva and Cloud Media state
    const [canvaModalOpen, setCanvaModalOpen] = useState(false);
    const [cloudModalOpen, setCloudModalOpen] = useState(false);
    const [cloudTab, setCloudTab] = useState<"drive" | "dropbox" | "onedrive">("drive");
    const [cloudUrl, setCloudUrl] = useState("");

    const parseCloudUrl = (url: string): string => {
        if (url.includes("drive.google.com")) {
            const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match) {
                return `https://drive.google.com/uc?export=download&id=${match[1]}`;
            }
        } else if (url.includes("dropbox.com")) {
            return url.replace("?dl=0", "").replace("&dl=0", "") + (url.includes("?") ? "&raw=1" : "?raw=1");
        } else if (url.includes("onedrive.live.com")) {
            return url.replace("/redir?", "/download?").replace("/view.aspx", "");
        }
        return url;
    };

    useEffect(() => {
        if (prefilledDate) {
            setScheduleDate(prefilledDate);
            if (onClearPrefilledDate) onClearPrefilledDate();
        }
    }, [prefilledDate]);

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
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        setLoadingDrafts(true);
        try {
            const res = await fetch("/api/marketing/posts?status=DRAFT");
            if (res.ok) {
                const data = await res.json();
                setDrafts(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDrafts(false);
        }
    };

    useEffect(() => {
        const selectedBot = bots?.find((b: any) => b.id === botId);
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
                    setSelectedPlatforms(["Instagram Reels"]);
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
            e.target.value = "";
        }
    };

    const handleGenerate = async () => {
        if (!theme || !botId) return alert("Selecione um bot e digite um tema!");
        setLoading(true);
        try {
            let lastGeneratedPost = null;
            for (const plat of selectedPlatforms) {
                const res = await fetch("/api/marketing/generate-post", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        theme, 
                        tone, 
                        platform: plat, 
                        botId, 
                        baseImageUrls: baseImages,
                        videoUrl: videoUrl,
                        postFormat
                    })
                });
                const data = await res.json();
                if (res.ok && data.id) {
                    lastGeneratedPost = data;
                    setDrafts(prev => [data, ...prev]);
                } else {
                    console.error(`Erro ao gerar para ${plat}:`, data.error);
                }
            }
            if (lastGeneratedPost) {
                openDraftEditor(lastGeneratedPost);
                setBaseImages([]);
                setVideoUrl(null);
                setTheme("");
            } else {
                alert("Falha ao gerar posts. Verifique suas credenciais da OpenAI.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro crítico de comunicação com a IA.");
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
                    platform: selectedPlatforms[0] || "Instagram Feed"
                })
            });
            const data = await res.json();
            if (res.ok && data.length > 0) {
                alert(`${data.length} posts gerados com sucesso!`);
                setDrafts([...data, ...drafts]);
            } else alert(data.error || "Erro ao gerar lote de posts");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveManualDraft = async () => {
        if (!botId) return alert("Selecione um bot primeiro!");
        if (!manualCaption) return alert("Digite uma legenda para o post!");
        
        setLoading(true);
        try {
            const contentPayload = JSON.stringify({
                caption: manualCaption,
                firstComment: manualFirstComment
            });
            
            let lastSaved = null;
            for (const plat of selectedPlatforms) {
                const res = await fetch("/api/marketing/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        botId,
                        content: contentPayload,
                        imageUrl: baseImages[0] || null,
                        videoUrl: videoUrl || null,
                        mediaType: videoUrl ? "VIDEO" : "IMAGE",
                        platform: plat.toUpperCase(),
                        status: "DRAFT"
                    })
                });
                const data = await res.json();
                if (res.ok && data.id) {
                    lastSaved = data;
                    setDrafts(prev => [data, ...prev]);
                }
            }
            if (lastSaved) {
                alert("Rascunho manual salvo com sucesso!");
                openDraftEditor(lastSaved);
                setManualCaption("");
                setManualFirstComment("");
                setBaseImages([]);
                setVideoUrl(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefineManualCaption = async () => {
        if (!manualCaption) return alert("Digite algum texto para melhorar!");
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caption: manualCaption, tone })
            });
            const data = await res.json();
            if (res.ok && data.refinedCaption) {
                setManualCaption(data.refinedCaption);
            } else {
                alert(data.error || "Erro ao melhorar legenda");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInstantPreview = () => {
        if (!manualCaption) return alert("Escreva uma legenda primeiro para ver o preview!");
        
        const selectedBot = bots?.find((b: any) => b.id === botId) || { name: "Minha Marca" };
        
        const mockDraft = {
            id: "temp_preview",
            content: JSON.stringify({
                caption: manualCaption,
                firstComment: manualFirstComment
            }),
            imageUrl: baseImages[0] || null,
            videoUrl: videoUrl || null,
            mediaType: videoUrl ? "VIDEO" : "IMAGE",
            platform: selectedPlatforms[0] || "Instagram Feed",
            bot: selectedBot,
            createdAt: new Date().toISOString()
        };
        
        setSelectedDraft(mockDraft);
        setEditorMode("preview");
    };

    const openDraftEditor = (draft: any) => {
        setSelectedDraft(draft);
        setEditorMode("edit");
        
        let parsedData: any = null;
        try {
            if (draft.content && (draft.content.trim().startsWith('{') || draft.content.trim().startsWith('['))) {
                parsedData = JSON.parse(draft.content);
            }
        } catch (e) {}

        const captionText = parsedData ? parsedData.caption : draft.content;
        setEditedCaption(captionText);
        setFirstComment(parsedData ? parsedData.firstComment || "" : "");
        setScheduleDate("");
    };

    const handleSaveDraft = async () => {
        if (!selectedDraft) return;
        setSavingDraft(true);
        
        let newContent = selectedDraft.content;
        try {
            newContent = JSON.stringify({
                caption: editedCaption,
                firstComment: firstComment
            });
        } catch(e) {
            newContent = editedCaption;
        }

        try {
            const res = await fetch(`/api/marketing/posts/${selectedDraft.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent })
            });
            if (res.ok) {
                alert("Edições salvas com sucesso!");
                const updated = await res.json();
                setDrafts(drafts.map(d => d.id === updated.id ? updated : d));
                setSelectedDraft(updated);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingDraft(false);
        }
    };

    const handleReplaceDraftImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedDraft) return;
        
        setSavingDraft(true);
        const formData = new FormData();
        formData.append("files", file);

        try {
            const data = await uploadMarketingMedia(formData);
            if (data.urls && data.urls.length > 0) {
                const newImageUrl = data.urls[0];
                const res = await fetch(`/api/marketing/posts/${selectedDraft.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl: newImageUrl })
                });
                if (res.ok) {
                    const updated = await res.json();
                    setDrafts(drafts.map(d => d.id === updated.id ? updated : d));
                    setSelectedDraft(updated);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingDraft(false);
        }
    };

    const handleScheduleOrPublish = async () => {
        if (!selectedDraft?.id) return;
        
        // Se não houver data, publica agora. Se houver, agenda.
        const isScheduling = !!scheduleDate;
        
        setLoading(true);
        try {
            const endpoint = isScheduling ? `/api/marketing/posts/${selectedDraft.id}/schedule` : `/api/marketing/posts/${selectedDraft.id}/publish`;
            const body = isScheduling ? JSON.stringify({ scheduledAt: new Date(scheduleDate).toISOString() }) : undefined;
            
            // Salvar edições primeiro se houver mudança!
            await handleSaveDraft();

            const res = await fetch(endpoint, { 
                method: "POST",
                headers: isScheduling ? { "Content-Type": "application/json" } : undefined,
                body
            });
            
            const data = await res.json();
            if (res.ok) {
                alert(isScheduling ? `Post agendado para ${new Date(data.scheduledAt).toLocaleString('pt-BR')}!` : "Post publicado instantaneamente no Feed!");
                // Remove dos rascunhos ou atualiza status
                setDrafts(drafts.filter(d => d.id !== selectedDraft.id));
                setSelectedDraft(null);
            } else alert(data.error || "Erro ao agendar/publicar post");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: Generator & Creator Form */}
            <div className="space-y-8">
                <div className="bg-[#121824] border border-white/10 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Sparkles size={24} className="text-emerald-400" />
                            Criador de Publicações
                        </h2>
                        <p className="text-gray-400 text-sm">Crie seu post manualmente ou gere conteúdos estratégicos com inteligência artificial.</p>
                    </div>

                    {/* Creation Mode Selector Tabs */}
                    <div className="flex gap-2 p-1 bg-black/45 rounded-2xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => setCreationMode("manual")}
                            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
                                creationMode === "manual"
                                ? "bg-emerald-500 text-black shadow-lg"
                                : "text-gray-400 hover:text-white"
                            }`}
                        >
                            📝 Criar Direto
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreationMode("ai")}
                            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
                                creationMode === "ai"
                                ? "bg-emerald-500 text-black shadow-lg"
                                : "text-gray-400 hover:text-white"
                            }`}
                        >
                            🤖 Gerar com IA
                        </button>
                    </div>

                    <div className="space-y-4 pt-2">
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
                                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
                                    <ImageIcon size={20} className="text-gray-500 group-hover:text-emerald-400" />
                                    <span className="text-[8px] text-gray-500 uppercase font-bold group-hover:text-emerald-400 mt-1">Imagem</span>
                                    <input type="file" multiple hidden accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} />
                                </label>
                                <label className={`w-16 h-16 rounded-lg border-2 border-dashed ${videoUrl ? 'border-blue-500 bg-blue-500/10' : 'border-white/10'} flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group`}>
                                    <Video size={20} className={videoUrl ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-400'} />
                                    <span className={`text-[8px] uppercase font-bold mt-1 ${videoUrl ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-400'}`}>{videoUrl ? 'Vídeo OK' : 'Vídeo'}</span>
                                    <input type="file" hidden accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} />
                                </label>
                                <button 
                                    onClick={() => setCanvaModalOpen(true)}
                                    type="button"
                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500/50 hover:bg-sky-500/5 transition-all group"
                                >
                                    <span className="text-gray-500 group-hover:text-sky-400 text-sm font-bold">🎨</span>
                                    <span className="text-[8px] text-gray-500 uppercase font-bold group-hover:text-sky-400 mt-1">Canva</span>
                                </button>
                                <button 
                                    onClick={() => setCloudModalOpen(true)}
                                    type="button"
                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                                >
                                    <HardDrive size={20} className="text-gray-500 group-hover:text-emerald-400" />
                                    <span className="text-[8px] text-gray-500 uppercase font-bold group-hover:text-emerald-400 mt-1">Nuvem</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Canais de Publicação</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "Instagram Feed", label: "Instagram Feed" },
                                    { id: "Instagram Reels", label: "Instagram Reels" },
                                    { id: "Instagram Stories", label: "Instagram Stories" },
                                    { id: "Facebook Feed", label: "Facebook Feed" },
                                    { id: "LinkedIn Feed", label: "LinkedIn Feed" },
                                    { id: "Google Business", label: "Google Business" }
                                ].map((plat) => {
                                    const isChecked = selectedPlatforms.includes(plat.id);
                                    return (
                                        <button
                                            key={plat.id}
                                            type="button"
                                            onClick={() => {
                                                if (isChecked) {
                                                    if (selectedPlatforms.length > 1) {
                                                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== plat.id));
                                                    }
                                                } else {
                                                    setSelectedPlatforms([...selectedPlatforms, plat.id]);
                                                    if (plat.id.includes("Reels")) {
                                                        setPostFormat("VIDEO_SCRIPT");
                                                    }
                                                }
                                            }}
                                            className={`py-2 px-2.5 rounded-xl border text-[10px] font-black transition-all truncate text-left ${
                                                isChecked 
                                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                                                : "bg-[#0b0f1a] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                                            }`}
                                        >
                                            {plat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {creationMode === "manual" ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Legenda da Publicação</label>
                                    <textarea 
                                        rows={4}
                                        value={manualCaption}
                                        onChange={(e) => setManualCaption(e.target.value)}
                                        placeholder="Digite a legenda que será publicada..."
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500/50 outline-none transition-all text-sm leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Primeiro Comentário (Opcional)</label>
                                    <textarea 
                                        rows={2}
                                        value={manualFirstComment}
                                        onChange={(e) => setManualFirstComment(e.target.value)}
                                        placeholder="Tags ou comentários de engajamento..."
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-3 text-white focus:border-emerald-500/50 outline-none transition-all text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={handleRefineManualCaption}
                                        disabled={loading || !manualCaption}
                                        className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Sparkles size={14} className="text-emerald-400" /> Melhorar com IA
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleInstantPreview}
                                        disabled={!manualCaption}
                                        className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        Ver Preview
                                    </button>
                                </div>

                                <button 
                                    onClick={handleSaveManualDraft}
                                    disabled={loading || !manualCaption}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-2xl font-black text-sm transition-all transform hover:scale-[1.01] shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    Salvar como Rascunho
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Sobre o que é o post?</label>
                                    <textarea 
                                        rows={3}
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value)}
                                        placeholder="Descreva o tema, produto ou promoção..."
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-4 text-white focus:border-emerald-500/50 outline-none transition-all text-sm leading-relaxed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Formato do Conteúdo</label>
                                    <select 
                                        value={postFormat}
                                        onChange={(e) => setPostFormat(e.target.value)}
                                        className="w-full bg-[#0b0f1a] border border-emerald-500/20 rounded-2xl p-3 text-emerald-400 font-bold focus:border-emerald-500/50 outline-none transition-all"
                                    >
                                        <option value="SINGLE">Post Único (Imagem + Legenda)</option>
                                        <option value="CAROUSEL">Carrossel Multislide (Vários Slides)</option>
                                        <option value="VIDEO_SCRIPT">Roteiro de Vídeo (Reels/TikTok/Shorts)</option>
                                    </select>
                                </div>

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

                                <button 
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] disabled:opacity-50"
                                >
                                    {loading ? <Sparkles className="animate-spin" size={22} /> : <Sparkles size={22} />}
                                    {loading ? "Gerando Mágica..." : "Gerar Post com IA"}
                                </button>
                            </>
                        )}
                    </div>
                </div>

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
                                placeholder="Ex: Dicas de moda feminina, promoções..."
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
                                disabled={loading || !botId}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Settings size={14} /> Salvar Automação
                            </button>
                            <button 
                                onClick={handleGenerateBatch}
                                disabled={loading || !automation.topic || !botId}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:grayscale"
                            >
                                <Sparkles size={14} /> Gerar Lote Agora
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Draft Queue & Editor */}
            <div className="space-y-6">
                {!selectedDraft ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-400" size={24} /> Fila de Aprovação
                            </h2>
                            <button onClick={fetchDrafts} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                <RefreshCw size={16} className={loadingDrafts ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {loadingDrafts ? (
                            <div className="flex items-center justify-center h-48 text-emerald-400">
                                <RefreshCw className="animate-spin" size={32} />
                            </div>
                        ) : drafts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <ImageIcon size={48} className="text-gray-500" />
                                <p>Nenhum rascunho na fila.<br/>Gere um novo post para começar a aprovação.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 max-h-[800px]">
                                {drafts.map(draft => {
                                    let captionSnippet = draft.content || "Sem legenda";
                                    try {
                                        if (draft.content.startsWith('{')) {
                                            const p = JSON.parse(draft.content);
                                            captionSnippet = p.caption || captionSnippet;
                                        }
                                    } catch(e) {}
                                    
                                    return (
                                        <div key={draft.id} onClick={() => openDraftEditor(draft)} className="group bg-[#0b0f1a] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex flex-col">
                                            <div className="aspect-square relative">
                                                {draft.imageUrl ? (
                                                    <img src={draft.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Draft" />
                                                ) : (
                                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                        <Video size={32} className="text-gray-500" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold uppercase">
                                                    {draft.platform}
                                                </div>
                                            </div>
                                            <div className="p-3 flex-1 flex flex-col justify-between">
                                                <p className="text-xs text-gray-300 line-clamp-3 mb-2">{captionSnippet}</p>
                                                <p className="text-[10px] text-gray-500 font-mono">{new Date(draft.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between">
                            <button onClick={() => setSelectedDraft(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft size={16} /> Voltar para Fila
                            </button>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                Modo Editor
                            </span>
                        </div>

                        {/* Editor Mode Selector tabs */}
                        <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-full">
                            <button
                                onClick={() => setEditorMode("edit")}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                    editorMode === "edit"
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                Editar Conteúdo
                            </button>
                            <button
                                onClick={() => setEditorMode("preview")}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                    editorMode === "preview"
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/10"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                Preview do Feed
                            </button>
                        </div>

                        {editorMode === "edit" ? (
                            <>
                                {/* Imagem do Draft com Opção de Troca */}
                                <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group bg-black">
                                    {selectedDraft.mediaType === "VIDEO" || selectedDraft.videoUrl ? (
                                        <video src={selectedDraft.videoUrl || selectedDraft.imageUrl} controls className="w-full h-full object-contain" />
                                    ) : (
                                        <img 
                                            src={selectedDraft.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain"
                                        />
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                        <label className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer hover:bg-gray-200 transition-colors shadow-xl">
                                            {savingDraft ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
                                            Substituir Mídia
                                            <input type="file" hidden accept="image/*,video/*" onChange={handleReplaceDraftImage} />
                                        </label>
                                        <p className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full border border-white/20">A IA gerou isso. Clique acima para trocar.</p>
                                    </div>
                                </div>

                                {/* Editor de Texto */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Editar Legenda & Hashtags</h4>
                                        {(editedCaption !== (
                                            selectedDraft.content?.trim().startsWith('{') 
                                                ? JSON.parse(selectedDraft.content).caption 
                                                : selectedDraft.content
                                        ) || firstComment !== (
                                            selectedDraft.content?.trim().startsWith('{') 
                                                ? JSON.parse(selectedDraft.content).firstComment || "" 
                                                : ""
                                        )) && (
                                            <button onClick={handleSaveDraft} disabled={savingDraft} className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-2 rounded-md font-bold uppercase flex items-center gap-1 transition-colors border border-emerald-500/30">
                                                {savingDraft ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Salvar Edições
                                            </button>
                                        )}
                                    </div>
                                    <textarea 
                                        value={editedCaption}
                                        onChange={(e) => setEditedCaption(e.target.value)}
                                        rows={8}
                                        placeholder="A legenda do post aparece aqui para você editar livremente antes de aprovar..."
                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-gray-200 focus:border-emerald-500/50 outline-none custom-scrollbar transition-colors leading-relaxed"
                                    />
                                    {selectedDraft.platform?.toLowerCase().includes("instagram") && (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Primeiro Comentário Automático</label>
                                            <textarea 
                                                value={firstComment}
                                                onChange={(e) => setFirstComment(e.target.value)}
                                                rows={3}
                                                placeholder="Cole suas hashtags ou primeiro comentário de engajamento aqui..."
                                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-gray-300 focus:border-emerald-500/50 outline-none leading-relaxed"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Painel de Agendamento */}
                                <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-4 shadow-xl">
                                    <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                                        <Calendar size={18} /> Agendamento e Publicação
                                    </h4>
                                    <p className="text-xs text-gray-400">Escolha a data e hora para publicar automaticamente. Se deixar vazio, o post será enviado agora.</p>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                        <input 
                                            type="datetime-local"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                        <button 
                                            onClick={handleScheduleOrPublish}
                                            disabled={loading}
                                            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 py-3"
                                        >
                                            {loading ? <RefreshCw size={16} className="animate-spin" /> : (scheduleDate ? <Clock size={16}/> : <Instagram size={16} />)}
                                            {scheduleDate ? "Agendar Publicação" : "Publicar Agora"}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                {/* Feed platform toggle */}
                                <div className="flex items-center gap-2 p-1 bg-[#0b0f1a] border border-white/5 rounded-xl w-fit">
                                    <button
                                        onClick={() => setPreviewPlatform("instagram")}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                            previewPlatform === "instagram"
                                            ? "bg-gradient-to-r from-pink-500 to-amber-500 text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        Instagram
                                    </button>
                                    <button
                                        onClick={() => setPreviewPlatform("facebook")}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                            previewPlatform === "facebook"
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        Facebook
                                    </button>
                                </div>

                                {/* Phone Frame Simulator */}
                                <div className="mx-auto w-full max-w-[340px] border-8 border-gray-800 bg-[#0b0f1a] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                                    {/* Phone Notch/Status Bar */}
                                    <div className="bg-gray-800 w-24 h-4 mx-auto rounded-b-xl mb-2"></div>
                                    
                                    {/* Mockup Body */}
                                    <div className="bg-[#121824] text-white text-xs select-none">
                                        {previewPlatform === "instagram" ? (
                                            <div className="flex flex-col">
                                                {/* IG Header */}
                                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                                                    <span className="font-bold tracking-wide">Instagram</span>
                                                </div>
                                                
                                                {/* IG User info */}
                                                <div className="flex items-center justify-between px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-purple-600 flex items-center justify-center p-[2px]">
                                                            <div className="w-full h-full bg-[#121824] rounded-full flex items-center justify-center font-black text-[10px] text-emerald-400">
                                                                {(selectedDraft.bot?.name?.[0] || 'C').toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[10px]">{selectedDraft.bot?.name || "Minha Marca"}</span>
                                                            <span className="text-[8px] text-gray-400">Patrocinado</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-[14px]">•••</span>
                                                </div>

                                                {/* IG Post Image */}
                                                <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                                                    {selectedDraft.mediaType === "VIDEO" || selectedDraft.videoUrl ? (
                                                        <video src={selectedDraft.videoUrl || selectedDraft.imageUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                                    ) : (
                                                        <img src={selectedDraft.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} alt="Mockup" className="w-full h-full object-cover" />
                                                    )}
                                                </div>

                                                {/* IG Actions */}
                                                <div className="flex items-center justify-between px-3 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <Heart size={16} className="text-gray-300 hover:text-red-500 cursor-pointer" />
                                                        <MessageCircle size={16} className="text-gray-300" />
                                                        <Send size={16} className="text-gray-300" />
                                                    </div>
                                                    <Bookmark size={16} className="text-gray-300" />
                                                </div>

                                                {/* IG Likes */}
                                                <div className="px-3 py-1 font-bold text-[9px]">
                                                    Curtido por conext.ai e outras 142 pessoas
                                                </div>

                                                {/* IG Caption */}
                                                <div className="px-3 pb-4 space-y-1">
                                                    <p className="text-[10px] leading-relaxed">
                                                        <span className="font-bold mr-1.5">{selectedDraft.bot?.name || "Minha Marca"}</span>
                                                        {editedCaption.split('\n').map((line, lIdx) => (
                                                            <span key={lIdx} className="block mt-0.5">
                                                                {line.split(' ').map((word, wIdx) => {
                                                                    if (word.startsWith('#') || word.startsWith('@')) {
                                                                        return <span key={wIdx} className="text-blue-400 font-medium mr-1">{word} </span>;
                                                                    }
                                                                    return <span key={wIdx}>{word} </span>;
                                                                })}
                                                            </span>
                                                        ))}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                {/* FB Header info */}
                                                <div className="flex items-center gap-2 px-3 py-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs text-white">
                                                        {(selectedDraft.bot?.name?.[0] || 'C').toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[11px] text-blue-400">{selectedDraft.bot?.name || "Minha Marca"}</span>
                                                        <span className="text-[8px] text-gray-500 flex items-center gap-1">Agora mesmo • 🌐</span>
                                                    </div>
                                                </div>

                                                {/* FB Caption */}
                                                <div className="px-3 pb-2 text-[10px] leading-relaxed text-gray-200">
                                                    {editedCaption.split('\n').map((line, lIdx) => (
                                                        <span key={lIdx} className="block mt-0.5">
                                                            {line.split(' ').map((word, wIdx) => {
                                                                if (word.startsWith('#') || word.startsWith('@')) {
                                                                    return <span key={wIdx} className="text-blue-400 font-bold mr-1">{word} </span>;
                                                                }
                                                                return <span key={wIdx}>{word} </span>;
                                                            })}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* FB Image */}
                                                <div className="w-full bg-black flex items-center justify-center overflow-hidden border-y border-white/5">
                                                    {selectedDraft.mediaType === "VIDEO" || selectedDraft.videoUrl ? (
                                                        <video src={selectedDraft.videoUrl || selectedDraft.imageUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                                                    ) : (
                                                        <img src={selectedDraft.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'} alt="Mockup" className="w-full. h-full object-cover" />
                                                    )}
                                                </div>

                                                {/* FB Action Buttons */}
                                                <div className="grid grid-cols-3 border-t border-white/5 py-1 text-center text-gray-400 text-[10px] font-bold">
                                                    <div className="flex items-center justify-center gap-1 py-1 hover:bg-white/5 rounded-lg cursor-pointer">
                                                        <ThumbsUp size={12} /> Curtir
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1 py-1 hover:bg-white/5 rounded-lg cursor-pointer">
                                                        <MessageSquare size={12} /> Comentar
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1 py-1 hover:bg-white/5 rounded-lg cursor-pointer">
                                                        <Share2 size={12} /> Compartilhar
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Bottom Home Indicator */}
                                    <div className="bg-gray-800 w-32 h-1 mx-auto rounded-full my-2"></div>
                                </div>
                            </div>
                        )}
                        
                        {/* Espaço morto de baixo */}
                        <div className="pb-10"></div>
                    </div>
                )}
            </div>

            {/* Canva Integration Modal */}
            {canvaModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#121824] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                                🎨 Canva Workspace
                            </h3>
                            <button onClick={() => setCanvaModalOpen(false)} className="text-gray-400 hover:text-white">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Crie sua arte no Canva e traga diretamente para a agência. Clique no botão abaixo para abrir o editor e depois insira o link da imagem compartilhada.
                        </p>
                        <div className="space-y-4">
                            <button 
                                onClick={() => window.open("https://canva.com", "_blank")}
                                className="w-full py-3 bg-[#8b3dff] hover:bg-[#7a2ff0] rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                            >
                                Abrir Editor do Canva
                            </button>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Link de Compartilhamento da Imagem</label>
                                <input 
                                    type="text" 
                                    placeholder="Cole aqui o link direto da imagem exportada..."
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500/50 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                setBaseImages([...baseImages, val]);
                                                setCanvaModalOpen(false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cloud Import Modal */}
            {cloudModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#121824] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                ☁️ Importar Mídia da Nuvem
                            </h3>
                            <button onClick={() => setCloudModalOpen(false)} className="text-gray-400 hover:text-white">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 p-1 bg-black/35 rounded-xl border border-white/5">
                            {(["drive", "dropbox", "onedrive"] as const).map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => { setCloudTab(tab); setCloudUrl(""); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                                        cloudTab === tab 
                                        ? "bg-emerald-500 text-black shadow-lg" 
                                        : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {tab === "drive" ? "Google Drive" : tab}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Cole o link de compartilhamento público do seu arquivo na nuvem. Nós faremos a otimização e importação automática para o seu post.
                            </p>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Link de Compartilhamento</label>
                                <input 
                                    type="text" 
                                    value={cloudUrl}
                                    onChange={(e) => setCloudUrl(e.target.value)}
                                    placeholder={
                                        cloudTab === "drive" ? "https://drive.google.com/file/d/..." :
                                        cloudTab === "dropbox" ? "https://www.dropbox.com/s/..." :
                                        "https://1drv.ms/..."
                                    }
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500/50 text-xs"
                                />
                            </div>

                            <button 
                                onClick={() => {
                                    if (cloudUrl.trim()) {
                                        const directUrl = parseCloudUrl(cloudUrl.trim());
                                        if (cloudUrl.toLowerCase().includes(".mp4") || cloudUrl.toLowerCase().includes("video")) {
                                            setVideoUrl(directUrl);
                                        } else {
                                            setBaseImages([...baseImages, directUrl]);
                                        }
                                        setCloudModalOpen(false);
                                        setCloudUrl("");
                                    }
                                }}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10"
                            >
                                Importar Arquivo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
