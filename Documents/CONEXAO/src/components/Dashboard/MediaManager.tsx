
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, FileText, Image as ImageIcon, Video, Mic, ExternalLink, Copy, Check } from "lucide-react";

interface Media {
    id: string;
    type: 'pdf' | 'image' | 'video' | 'audio' | 'document';
    url: string;
    filename: string;
    description: string | null;
    createdAt: string;
}

export function MediaManager({ botId }: { botId: string }) {
    const [mediaList, setMediaList] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ url: "", description: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMedia();
    }, [botId]);

    // ... (keep default fetchMedia) ...
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

    async function handleAdd() {
        if (uploadMode === 'url' && !newItem.url) return;
        if (uploadMode === 'file' && !selectedFile) return;

        setUploading(true);

        try {
            let res;
            if (uploadMode === 'file' && selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                if (newItem.description) formData.append('description', newItem.description);

                res = await fetch(`/api/bots/${botId}/media`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                res = await fetch(`/api/bots/${botId}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newItem)
                });
            }

            if (res.ok) {
                setNewItem({ url: "", description: "" });
                setSelectedFile(null);
                setIsAdding(false);
                fetchMedia();
            } else {
                console.error("Upload failed", await res.text());
                alert("Erro ao enviar arquivo.");
            }
        } catch (error) {
            console.error("Error adding media", error);
        } finally {
            setUploading(false);
        }
    }

    // ... (keep handleDelete/others) ...
    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja remover este arquivo?")) return;
        try {
            await fetch(`/api/bots/${botId}/media?mediaId=${id}`, { method: 'DELETE' });
            fetchMedia();
        } catch (error) { console.error("Error deleting", error); }
    }

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
            case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
            case 'video': return <Video className="w-5 h-5 text-purple-500" />;
            case 'audio': return <Mic className="w-5 h-5 text-green-500" />;
            default: return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-blue-800 text-sm">Como usar Materiais</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Adicione PDFs, Vídeos ou Imagens aqui. O sistema gera um ID único para cada arquivo.
                        <br />
                        Para enviar durante a conversa, instrua o bot no Prompt do Sistema:
                        <br />
                        <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono mt-1 inline-block">
                            "Se o cliente pedir o cardápio, envie o [ENVIAR_MEDIA:ID_DO_ARQUIVO]"
                        </code>
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Biblioteca de Arquivos</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Novo
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                    <div className="flex gap-4 mb-4 border-b border-gray-100 pb-2">
                        <button
                            onClick={() => setUploadMode('file')}
                            className={`text-sm font-medium pb-2 ${uploadMode === 'file' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        >
                            Upload de Arquivo
                        </button>
                        <button
                            onClick={() => setUploadMode('url')}
                            className={`text-sm font-medium pb-2 ${uploadMode === 'url' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                        >
                            Link Externo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {uploadMode === 'url' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Arquivo</label>
                                <input
                                    type="text"
                                    placeholder="https://exemplo.com/arquivo.pdf"
                                    className="w-full input-field"
                                    value={newItem.url}
                                    onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer relative">
                                    <input
                                        type="file"
                                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {selectedFile ? (
                                        <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                                            <Check className="w-4 h-4" />
                                            {selectedFile.name}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            <span className="text-blue-600 font-medium">Clique para escolher</span> ou arraste
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Cardápio de Verão"
                                className="w-full input-field"
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={(uploadMode === 'url' && !newItem.url) || (uploadMode === 'file' && !selectedFile) || uploading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {uploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {uploading ? 'Enviando...' : 'Salvar Arquivo'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {listRender(mediaList, loading, getIcon, handleDelete, copyToClipboard, copiedId!)}
            </div>
        </div>
    );
}

function listRender(
    list: Media[],
    loading: boolean,
    getIcon: (t: string) => any,
    onDelete: (id: string) => void,
    onCopy: (id: string) => void,
    copiedId: string | null
) {
    if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    if (list.length === 0) return <div className="p-8 text-center text-gray-500">Nenhum material cadastrado.</div>;

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <th className="p-4 font-medium">Arquivo</th>
                    <th className="p-4 font-medium">Tipo</th>
                    <th className="p-4 font-medium">ID (Para Prompt)</th>
                    <th className="p-4 font-medium text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {list.map(media => (
                    <tr key={media.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    {getIcon(media.type)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm truncate max-w-[200px]">
                                        {media.description || media.filename}
                                    </p>
                                    <a href={media.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                        Ver link <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </td>
                        <td className="p-4">
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full uppercase">
                                {media.type}
                            </span>
                        </td>
                        <td className="p-4">
                            <button
                                onClick={() => onCopy(media.id)}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono text-gray-700 transition"
                            >
                                {media.id.substring(0, 8)}...
                                {copiedId === media.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />}
                            </button>
                        </td>
                        <td className="p-4 text-right">
                            <button
                                onClick={() => onDelete(media.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
