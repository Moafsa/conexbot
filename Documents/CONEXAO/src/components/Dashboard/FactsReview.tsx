
"use client";

import { useState, useEffect } from "react";
import { FileText, Save, Trash2, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

interface Media {
    id: string;
    filename: string;
    type: string;
    extractedText: string | null;
    description: string | null;
}

export default function FactsReview({ botId, onClose }: { botId: string; onClose: () => void }) {
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        if (botId) fetchMedia();
    }, [botId]);

    async function fetchMedia() {
        try {
            const res = await fetch(`/api/bots/${botId}/media`);
            if (res.ok) {
                const data = await res.json();
                setMediaList(data);
            }
        } catch (error) {
            console.error("Error fetching media", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(id: string, text: string) {
        setSaving(id);
        try {
            const res = await fetch(`/api/media/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ extractedText: text })
            });
            if (res.ok) {
                // Refresh local state
                setMediaList(prev => prev.map(m => m.id === id ? { ...m, extractedText: text } : m));
            }
        } catch (error) {
            console.error("Error updating fact", error);
        } finally {
            setSaving(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja remover este material do conhecimento do bot?")) return;

        try {
            const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMediaList(prev => prev.filter(m => m.id !== id));
            }
        } catch (error) {
            console.error("Error deleting media", error);
        }
    }

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border-l border-white/5 w-[450px]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FileText className="text-indigo-400" size={20} />
                    <h2 className="font-semibold text-white">Revisão de Conhecimento</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <Loader2 className="animate-spin mb-2" />
                        <p>Carregando arquivos...</p>
                    </div>
                ) : mediaList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <AlertCircle className="mx-auto mb-2 opacity-20" size={40} />
                        <p>Nenhum arquivo de conhecimento encontrado.</p>
                    </div>
                ) : (
                    mediaList.map(media => (
                        <FactCard
                            key={media.id}
                            media={media}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            isSaving={saving === media.id}
                        />
                    ))
                )}
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5">
                <p className="text-[10px] text-gray-500 text-center">
                    Alterações aqui atualizam o RAG automaticamente para o bot.
                </p>
            </div>
        </div>
    );
}

function FactCard({ media, onUpdate, onDelete, isSaving }: {
    media: Media;
    onUpdate: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    isSaving: boolean;
}) {
    const [text, setText] = useState(media.extractedText || "");
    const [isDirty, setIsDirty] = useState(false);

    return (
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden group">
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                        {media.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-300 truncate font-medium">
                        {media.filename}
                    </span>
                </div>
                <button
                    onClick={() => onDelete(media.id)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="p-3">
                <textarea
                    value={text}
                    onChange={(e) => { setText(e.target.value); setIsDirty(true); }}
                    className="w-full h-32 bg-black/20 text-gray-300 text-xs p-2 rounded-lg border border-white/5 focus:border-indigo-500 outline-none resize-none"
                    placeholder="Conteúdo extraído aparecerá aqui..."
                />

                {isDirty && (
                    <div className="mt-2 flex justify-end">
                        <button
                            disabled={isSaving}
                            onClick={() => { onUpdate(media.id, text); setIsDirty(false); }}
                            className="flex items-center gap-1.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full transition-colors"
                        >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            SALVAR ALTERAÇÕES
                        </button>
                    </div>
                )}

                {!isDirty && media.extractedText && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-green-500/70">
                        <CheckCircle size={10} />
                        <span>Sincronizado com RAG</span>
                    </div>
                )}
            </div>
        </div>
    );
}
