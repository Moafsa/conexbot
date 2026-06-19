"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Sparkles, Zap, Image as ImageIcon, Video, PenTool, 
    Instagram, Calendar, LayoutGrid, MessageSquare, 
    Send, CheckCircle, Trash, Clock, Edit3, Save 
} from "lucide-react";

type Tab = 'STUDIO' | 'DRAFTS' | 'SCHEDULED';

export function ContentTab({ bots, loadingBots, selectedClientId }: any) {
    const [activeTab, setActiveTab] = useState<Tab>('STUDIO');
    const [loading, setLoading] = useState(false);
    
    // --- STUDIO STATES ---
    const [botId, setBotId] = useState("");
    const [postFormat, setPostFormat] = useState("SINGLE");
    const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [currentDraft, setCurrentDraft] = useState<any>(null); // json of the draft
    
    // --- DRAFTS & SCHEDULED STATES ---
    const [posts, setPosts] = useState<any[]>([]);
    const [fetchingPosts, setFetchingPosts] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchPosts = async () => {
        setFetchingPosts(true);
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/marketing/posts${query}`);
            const data = await res.json();
            if (res.ok) setPosts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchingPosts(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'DRAFTS' || activeTab === 'SCHEDULED') {
            fetchPosts();
        }
    }, [activeTab, selectedClientId]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !botId) {
            if (!botId) alert("Por favor, selecione um Atendente (Bot) primeiro!");
            return;
        }

        const newMessages = [...messages, { role: "user", content: chatInput }];
        setMessages(newMessages);
        setChatInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/marketing/chat-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    botId, 
                    messages: newMessages,
                    postFormat 
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessages([...newMessages, { role: "assistant", content: data.chatReply || "Rascunho atualizado!" }]);
                if (data.postDraft) {
                    setCurrentDraft(data.postDraft);
                }
            } else {
                alert(data.error || "Erro ao gerar resposta");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de comunicação com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraftToDb = async () => {
        if (!currentDraft || !botId) return;
        setLoading(true);
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}` : "";
            const res = await fetch(`/api/marketing/posts${query}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    theme: "Draft from Chat",
                    content: JSON.stringify(currentDraft),
                    botId,
                    status: "DRAFT" // Assume API can handle status if passed, or it defaults to DRAFT
                })
            });
            if (res.ok) {
                alert("Salvo em Rascunhos!");
                setActiveTab("DRAFTS");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        setFetchingPosts(true);
        try {
            await fetch(`/api/marketing/posts/${id}`, { method: "DELETE" });
            fetchPosts();
        } catch (e) {
            console.error(e);
            setFetchingPosts(false);
        }
    };

    const handlePublishPost = async (post: any) => {
        if (!confirm("Agendar publicação deste post?")) return;
        setFetchingPosts(true);
        try {
            const res = await fetch(`/api/marketing/posts/${post.id}/publish`, { method: "POST" });
            if (res.ok) fetchPosts();
        } catch (e) {
            console.error(e);
            setFetchingPosts(false);
        }
    };

    const drafts = posts.filter(p => p.status === 'DRAFT');
    const scheduled = posts.filter(p => p.status === 'SCHEDULED' || p.status === 'PUBLISHED');

    return (
        <div className="space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-2 gap-2">
                <button 
                    onClick={() => setActiveTab('STUDIO')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'STUDIO' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <PenTool size={18} /> Estúdio (Chat)
                </button>
                <button 
                    onClick={() => setActiveTab('DRAFTS')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'DRAFTS' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <LayoutGrid size={18} /> Fila de Aprovação ({drafts.length})
                </button>
                <button 
                    onClick={() => setActiveTab('SCHEDULED')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'SCHEDULED' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Calendar size={18} /> Agendados
                </button>
            </div>

            {/* TAB: STUDIO (SPLIT VIEW) */}
            {activeTab === 'STUDIO' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
                    {/* LEFT: CHAT INTERFACE */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <MessageSquare className="text-emerald-400" />
                            <h2 className="text-xl font-bold">Assistente de Criação</h2>
                        </div>
                        
                        {/* Bot & Format Selectors */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <select 
                                value={botId}
                                onChange={(e) => setBotId(e.target.value)}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                            >
                                <option value="">1. Selecione o Atendente</option>
                                {bots && Array.isArray(bots) && bots.map((bot: any) => (
                                    <option key={bot.id} value={bot.id}>{bot.name}</option>
                                ))}
                            </select>
                            <select 
                                value={postFormat}
                                onChange={(e) => setPostFormat(e.target.value)}
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-emerald-500/50 outline-none"
                            >
                                <option value="SINGLE">Post Único</option>
                                <option value="CAROUSEL">Carrossel</option>
                                <option value="VIDEO_SCRIPT">Roteiro Reels</option>
                            </select>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-2">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                                    <Sparkles size={40} className="text-emerald-500/30" />
                                    <p className="text-center text-sm">Descreva o post que você quer criar.<br/>A IA vai sugerir texto e imagem na direita.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.role === 'user' ? 'bg-emerald-500 text-black font-medium rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 text-emerald-400">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-100" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200" />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="relative">
                            <input 
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Digite sua ideia ou pedido de alteração..."
                                className="w-full bg-[#0b0f1a] border border-white/20 rounded-2xl py-4 pl-4 pr-14 text-white focus:border-emerald-500/50 outline-none transition-all"
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={loading || !chatInput.trim()}
                                className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black rounded-xl flex items-center justify-center transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: DRAFT EDITOR */}
                    <div className="bg-white/5 border border-emerald-500/20 rounded-3xl p-6 flex flex-col h-full relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <Edit3 className="text-emerald-400" />
                                <h2 className="text-xl font-bold">Edição Manual</h2>
                            </div>
                            <button 
                                onClick={handleSaveDraftToDb}
                                disabled={!currentDraft || loading}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold text-sm rounded-xl flex items-center gap-2"
                            >
                                <Save size={16} /> Salvar Rascunho
                            </button>
                        </div>

                        {!currentDraft ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                                O rascunho aparecerá aqui após a sua mensagem.
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                                {/* Visual Draft Editor */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <PenTool size={14} /> Legenda do Post
                                    </label>
                                    <textarea 
                                        value={currentDraft.caption || ""}
                                        onChange={e => setCurrentDraft({...currentDraft, caption: e.target.value})}
                                        rows={8}
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-4 text-gray-200 text-sm focus:border-emerald-500/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ImageIcon size={14} /> Descrição da Imagem (Para a IA ou Designer)
                                    </label>
                                    <textarea 
                                        value={currentDraft.imagePrompt || ""}
                                        onChange={e => setCurrentDraft({...currentDraft, imagePrompt: e.target.value})}
                                        rows={4}
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl p-4 text-gray-400 italic text-sm focus:border-emerald-500/50 outline-none"
                                    />
                                </div>
                                
                                {currentDraft.slides && (
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Slides do Carrossel</h4>
                                        {currentDraft.slides.map((slide: any, idx: number) => (
                                            <div key={idx} className="bg-black/30 p-4 rounded-xl space-y-2 border border-white/5">
                                                <input 
                                                    value={slide.title || ""}
                                                    onChange={e => {
                                                        const newSlides = [...currentDraft.slides];
                                                        newSlides[idx].title = e.target.value;
                                                        setCurrentDraft({...currentDraft, slides: newSlides});
                                                    }}
                                                    className="w-full bg-transparent font-bold text-emerald-400 outline-none"
                                                />
                                                <textarea 
                                                    value={slide.content || ""}
                                                    onChange={e => {
                                                        const newSlides = [...currentDraft.slides];
                                                        newSlides[idx].content = e.target.value;
                                                        setCurrentDraft({...currentDraft, slides: newSlides});
                                                    }}
                                                    rows={2}
                                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-lg p-2 text-sm text-gray-300 outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: DRAFTS */}
            {activeTab === 'DRAFTS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
                    {fetchingPosts ? (
                        <div className="col-span-full py-20 text-center text-gray-400">Carregando rascunhos...</div>
                    ) : drafts.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
                            <LayoutGrid size={48} className="mb-4 opacity-20" />
                            <p>Nenhum rascunho aguardando aprovação.</p>
                        </div>
                    ) : (
                        drafts.map((post: any) => {
                            let parsed = null;
                            try { parsed = JSON.parse(post.content); } catch (e) {}
                            const previewText = parsed?.caption || post.content;
                            
                            return (
                            <div key={post.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col hover:border-emerald-500/30 transition-all">
                                <div className="flex-1 mb-4">
                                    <span className="text-[10px] font-black uppercase bg-white/10 text-gray-300 px-3 py-1 rounded-full mb-3 inline-block">
                                        Rascunho
                                    </span>
                                    <p className="text-sm text-gray-300 line-clamp-4">{previewText}</p>
                                </div>
                                <div className="flex gap-2 border-t border-white/10 pt-4 mt-auto">
                                    <button 
                                        onClick={() => handlePublishPost(post)}
                                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={14} /> Aprovar
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePost(post.id)}
                                        className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            )}

            {/* TAB: SCHEDULED */}
            {activeTab === 'SCHEDULED' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
                    {fetchingPosts ? (
                        <div className="col-span-full py-20 text-center text-gray-400">Carregando agendados...</div>
                    ) : scheduled.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
                            <Calendar size={48} className="mb-4 opacity-20" />
                            <p>Nenhum post agendado ou publicado.</p>
                        </div>
                    ) : (
                        scheduled.map((post: any) => {
                            let parsed = null;
                            try { parsed = JSON.parse(post.content); } catch (e) {}
                            
                            return (
                            <div key={post.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                                {post.imageUrl && (
                                    <div className="h-40 w-full relative">
                                        <img src={post.imageUrl} className="w-full h-full object-cover" alt="Post" />
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${post.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {post.status === 'PUBLISHED' ? 'Publicado' : 'Agendado'}
                                        </span>
                                        {post.scheduledAt && (
                                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(post.scheduledAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 line-clamp-3 mb-4">{parsed?.caption || post.content}</p>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            )}
        </div>
    );
}
