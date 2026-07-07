"use client";

import { useState, useEffect } from "react";
import {
    FileText, Sparkles, ShieldCheck, UserCheck, AlertTriangle, Clock,
    Calendar, CheckCircle2, ChevronLeft, Loader2, RefreshCw, Eye, Edit3, Trash2,
    CalendarClock, Share2, Instagram, Facebook
} from "lucide-react";

interface WorkflowTabProps {
    selectedClientId: string;
    bots: any[];
    onEditPost: (post: any) => void;
    refreshAll: () => void;
}

const COLUMNS = [
    { id: "DRAFT", label: "Rascunho", icon: "📄", color: "border-gray-500/20 text-gray-400 bg-gray-500/5", iconComp: FileText },
    { id: "CONTENT", label: "Conteúdo", icon: "🗂️", color: "border-purple-500/20 text-purple-400 bg-purple-500/5", iconComp: Sparkles },
    { id: "INTERNAL_APPROVAL", label: "Aprovação Interna", icon: "🔍", color: "border-orange-500/20 text-orange-400 bg-orange-500/5", iconComp: ShieldCheck },
    { id: "CLIENT_APPROVAL", label: "Aprovação do Cliente", icon: "👍", color: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5", iconComp: UserCheck },
    { id: "REJECTED", label: "Ajustes", icon: "✍️", color: "border-red-500/20 text-red-400 bg-red-500/5", iconComp: AlertTriangle },
    { id: "PENDING_SCHEDULE", label: "Aguardando Agendamento", icon: "⏰", color: "border-blue-500/20 text-blue-400 bg-blue-500/5", iconComp: Clock },
    { id: "SCHEDULED", label: "Aprovado e Agendado", icon: "📅", color: "border-sky-500/20 text-sky-400 bg-sky-500/5", iconComp: Calendar },
    { id: "PUBLISHED", label: "Concluídos", icon: "✅", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5", iconComp: CheckCircle2 }
];

export default function WorkflowTab({ selectedClientId, bots, onEditPost, refreshAll }: WorkflowTabProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedColumn, setExpandedColumn] = useState<string>("DRAFT");
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const query = selectedClientId ? `?clientId=${selectedClientId}&limit=100` : "?limit=100";
            const res = await fetch(`/api/marketing/posts${query}`);
            if (res.ok) {
                const data = await res.json();
                setPosts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Erro ao carregar posts no workflow:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [selectedClientId]);

    const handleMoveStatus = async (postId: string, newStatus: string) => {
        setUpdatingPostId(postId);
        try {
            // Otimista
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: newStatus } : p));
            if (selectedPost?.id === postId) {
                setSelectedPost((prev: any) => ({ ...prev, status: newStatus }));
            }

            const res = await fetch(`/api/marketing/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                fetchPosts(); // Reverter
                alert("Erro ao atualizar o status do post.");
            } else {
                refreshAll(); // Atualizar página mãe
            }
        } catch (error) {
            fetchPosts();
            alert("Erro de conexão ao mover post.");
        } finally {
            setUpdatingPostId(null);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Deseja realmente deletar este post?")) return;

        try {
            const res = await fetch(`/api/marketing/posts/${postId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setPosts(prev => prev.filter(p => p.id !== postId));
                setSelectedPost(null);
                refreshAll();
            } else {
                alert("Erro ao deletar post.");
            }
        } catch (error) {
            alert("Erro de conexão ao deletar post.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        🗂️ Fluxo de Produção de Posts
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Acompanhe e movimente o status de seus posts nas etapas de criação e aprovação.</p>
                </div>
                <button
                    onClick={fetchPosts}
                    className="p-2 border border-white/10 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Atualizar
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                    <p className="text-gray-500 text-xs font-medium">Sincronizando fluxo com a base...</p>
                </div>
            ) : (
                <div className="flex flex-row items-stretch gap-5 overflow-x-auto pb-6 select-none min-h-[70vh] scrollbar-thin scrollbar-thumb-white/10">
                    {COLUMNS.map((col) => {
                        const colPosts = posts.filter(p => p.status === col.id);
                        const isExpanded = expandedColumn === col.id;
                        const ColumnIcon = col.iconComp;

                        return (
                            <div
                                key={col.id}
                                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col relative rounded-[32px] border border-white/10 shadow-xl overflow-hidden bg-white/5 ${
                                    isExpanded ? "w-[346px] min-w-[346px]" : "w-[72px] min-w-[72px] cursor-pointer hover:bg-white/10"
                                }`}
                                onClick={() => {
                                    if (!isExpanded) {
                                        setExpandedColumn(col.id);
                                    }
                                }}
                            >
                                {/* Header da Coluna */}
                                <div
                                    className={`relative select-none transition-all duration-300 ${
                                        isExpanded
                                            ? "h-[68px] w-full px-6 py-4 flex items-center justify-between border-b border-white/5"
                                            : "h-[346px] w-[68px] flex items-center justify-center"
                                    }`}
                                >
                                    {isExpanded ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <ColumnIcon className={`w-5 h-5 ${col.color.split(' ')[1]}`} />
                                                <h3 className={`font-extrabold text-sm uppercase tracking-wider ${col.color.split(' ')[1]}`}>
                                                    {col.label}
                                                </h3>
                                                <span className="bg-white/5 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                                    {colPosts.length}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const idx = COLUMNS.findIndex(c => c.id === col.id);
                                                    const nextIdx = (idx + 1) % COLUMNS.length;
                                                    setExpandedColumn(COLUMNS[nextIdx].id);
                                                }}
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        // Rotated header when collapsed
                                        <div
                                            style={{
                                                width: '346px',
                                                height: '68px',
                                                transform: 'rotate(90deg)',
                                                transformOrigin: '34px 34px',
                                            }}
                                            className="absolute top-0 left-0 flex items-center justify-between px-6 py-4 w-full h-full"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <ColumnIcon className={`w-5 h-5 rotate-[-90deg] ${col.color.split(' ')[1]}`} />
                                                <h3 className={`font-extrabold text-sm uppercase tracking-wider ${col.color.split(' ')[1]}`}>
                                                    {col.label}
                                                </h3>
                                                <span className="bg-white/5 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                                    {colPosts.length}
                                                </span>
                                            </div>
                                            <ChevronLeft size={16} className="text-gray-500 rotate-[-90deg]" />
                                        </div>
                                    )}
                                </div>

                                {/* Cards list */}
                                <div
                                    className={`flex-1 p-6 space-y-4 overflow-y-auto transition-all duration-300 ${
                                        isExpanded ? "opacity-100 block" : "opacity-0 hidden"
                                    }`}
                                >
                                    {colPosts.length === 0 ? (
                                        <div className="border border-dashed border-white/5 rounded-2xl p-6 text-center text-[10px] text-gray-600 leading-relaxed">
                                            Sem posts nesta etapa.
                                        </div>
                                    ) : (
                                        colPosts.map((post) => (
                                            <div
                                                key={post.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPost(post);
                                                }}
                                                className="bg-[#0b0f1a]/80 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-4 space-y-3 cursor-pointer hover:bg-[#0b0f1a]/60 transition-all duration-200 group"
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-[9px] text-gray-400 flex items-center gap-1 font-semibold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                                        {post.platform === "instagram" ? <Instagram size={10} className="text-pink-400" /> : <Facebook size={10} className="text-blue-400" />}
                                                        {post.platform}
                                                    </span>
                                                    {post.scheduledAt && (
                                                        <span className="text-[9px] text-gray-500 flex items-center gap-1 font-medium">
                                                            <Calendar size={10} />
                                                            {new Date(post.scheduledAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                {post.imageUrl && (
                                                    <div className="w-full h-24 rounded-lg overflow-hidden relative border border-white/5">
                                                        <img src={post.imageUrl} alt="Preview" className="object-cover w-full h-full" />
                                                    </div>
                                                )}

                                                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed font-sans">
                                                    {post.content}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Post details modal drawer */}
            {selectedPost && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
                    <div className="flex-1" onClick={() => setSelectedPost(null)} />
                    <div className="w-full max-w-xl bg-[#0f172a] border-l border-white/10 flex flex-col h-full shadow-2xl relative">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📊</span>
                                <div>
                                    <h3 className="font-extrabold text-sm leading-none">Produção de Conteúdo</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1.5">Detalhes do Post</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="p-2 border border-white/10 hover:bg-white/5 rounded-xl transition-all text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedPost.imageUrl && (
                                <div className="rounded-2xl overflow-hidden border border-white/10 max-h-64 relative bg-[#0b0f1a]">
                                    <img src={selectedPost.imageUrl} alt="Post Media" className="w-full object-contain max-h-64 mx-auto" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500">Texto de Legenda</h4>
                                <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                                    {selectedPost.content}
                                </div>
                            </div>

                            {/* Column movement options */}
                            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    ⚙️ Mudar Status no Fluxo
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {COLUMNS.map((col) => (
                                        <button
                                            key={col.id}
                                            disabled={updatingPostId !== null}
                                            onClick={() => handleMoveStatus(selectedPost.id, col.id)}
                                            className={`px-3 py-2 rounded-xl text-left border text-xs transition-all font-bold flex items-center gap-1.5 ${
                                                selectedPost.status === col.id
                                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                                    : "bg-[#0b0f1a]/40 border-white/5 text-gray-500 hover:text-white"
                                            }`}
                                        >
                                            {selectedPost.status === col.id ? "✓" : ""} {col.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => {
                                    onEditPost(selectedPost);
                                    setSelectedPost(null);
                                }}
                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 rounded-2xl font-bold text-xs text-white transition-all flex items-center justify-center gap-1.5"
                            >
                                <Edit3 size={14} /> Editar Legenda / Mídia
                            </button>
                            <button
                                onClick={() => handleDeletePost(selectedPost.id)}
                                className="py-3 px-4 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={14} /> Excluir
                            </button>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold transition-all text-white text-center"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
