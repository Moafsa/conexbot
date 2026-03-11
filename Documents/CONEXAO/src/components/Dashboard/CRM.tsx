"use client";

import { useState, useEffect } from "react";
import { User, Building2, Phone, Mail, MoreHorizontal, Download, Plus, Settings2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Bot {
    id: string;
    name: string;
}

interface CrmStage {
    id: string;
    name: string;
    color: string;
    description: string | null;
    order: number;
}

interface Contact {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    company: string | null;
    role: string | null;
    funnelStage: string;
    stageId: string | null;
    lastActive: string;
    leadScore: number;
    sentiment: string | null;
}

import CRMContactPanel from "./CRMContactPanel";

export function CRM() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string>("");
    const [stages, setStages] = useState<CrmStage[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingStage, setIsAddingStage] = useState(false);
    const [newStageName, setNewStageName] = useState("");
    const [draggedStage, setDraggedStage] = useState<string | null>(null);
    const [draggedContact, setDraggedContact] = useState<string | null>(null);
    const [selectedContactPanel, setSelectedContactPanel] = useState<string | null>(null);
    const [search, setSearch] = useState("");


    useEffect(() => {
        fetchBots();
    }, []);

    useEffect(() => {
        if (selectedBotId) {
            fetchStages();
        }
    }, [selectedBotId]);

    useEffect(() => {
        if (selectedBotId) {
            const timeout = setTimeout(() => {
                fetchContacts(search);
            }, 400);
            return () => clearTimeout(timeout);
        }
    }, [selectedBotId, search]);

    async function fetchBots() {
        try {
            const res = await fetch("/api/bots");
            if (res.ok) {
                const data = await res.json();
                setBots(data);
                if (data.length > 0) {
                    setSelectedBotId(data[0].id);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            toast.error("Erro ao carregar bots");
            setLoading(false);
        }
    }

    async function fetchStages() {
        if (!selectedBotId) return;
        try {
            const res = await fetch(`/api/bots/${selectedBotId}/crm/stages`);
            if (res.ok) {
                const data = await res.json();
                setStages(data);
            }
        } catch (error) {
            toast.error("Erro ao carregar estágios");
        }
    }

    async function fetchContacts(searchQuery = "") {
        if (!selectedBotId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/contacts?botId=${selectedBotId}&search=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter manually for safety if API doesn't support botId param yet
                setContacts(data.filter((c: any) => c.botId === selectedBotId));
            }
        } catch (error) {
            toast.error("Erro ao carregar contatos");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddStage() {
        if (!newStageName || !selectedBotId) return;
        try {
            const res = await fetch(`/api/bots/${selectedBotId}/crm/stages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newStageName, order: stages.length })
            });
            if (res.ok) {
                toast.success("Estágio criado!");
                setNewStageName("");
                setIsAddingStage(false);
                fetchStages();
            }
        } catch (error) {
            toast.error("Erro ao criar estágio");
        }
    }

    async function handleDeleteStage(stageId: string) {
        if (!selectedBotId) return;
        if (!confirm("Tem certeza que deseja excluir esta coluna? Contatos nela ficarão sem estágio.")) return;
        try {
            const res = await fetch(`/api/bots/${selectedBotId}/crm/stages/${stageId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Coluna excluída");
                fetchStages();
            }
        } catch (error) {
            toast.error("Erro ao excluir");
        }
    }

    async function handleExport(stageId?: string) {
        if (!selectedBotId) return;
        try {
            const url = `/api/bots/${selectedBotId}/crm/export` + (stageId ? `?stageId=${stageId}` : '');
            window.open(url, '_blank');
        } catch (error) {
            toast.error("Erro ao exportar");
        }
    }

    const handleStageDragStart = (e: React.DragEvent, id: string) => {
        setDraggedStage(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleStageDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleStageDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedStage || draggedStage === targetId) {
            setDraggedStage(null);
            return;
        }

        const draggedIndex = stages.findIndex(s => s.id === draggedStage);
        const targetIndex = stages.findIndex(s => s.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedStage(null);
            return;
        }

        const newStages = [...stages];
        const [removed] = newStages.splice(draggedIndex, 1);
        newStages.splice(targetIndex, 0, removed);

        // Update local state with new order property
        const updatedStages = newStages.map((s, index) => ({ ...s, order: index }));
        setStages(updatedStages);
        setDraggedStage(null);

        // Save to backend
        try {
            const res = await fetch(`/api/bots/${selectedBotId}/crm/stages/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stages: updatedStages.map(s => ({ id: s.id, order: s.order })) })
            });
            if (!res.ok) throw new Error();
        } catch (error) {
            toast.error("Erro ao salvar ordem das colunas");
            fetchStages(); // revert on error
        }
    };

    const handleContactDragStart = (e: React.DragEvent, id: string) => {
        setDraggedContact(id);
        e.dataTransfer.effectAllowed = "move";
        e.stopPropagation();
    };

    const handleContactDrop = async (e: React.DragEvent, targetStageId: string, targetStageName: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedContact) return;

        // Optimistic update
        setContacts(prev => prev.map(c =>
            c.id === draggedContact ? { ...c, stageId: targetStageId, funnelStage: targetStageName } : c
        ));

        try {
            const res = await fetch(`/api/contacts/${draggedContact}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelStage: targetStageName,
                    stageId: targetStageId
                })
            });
            if (!res.ok) throw new Error();
            toast.success(`Movido para ${targetStageName}`);
        } catch (error) {
            toast.error("Erro ao mover contato");
            fetchContacts(); // revert
        } finally {
            setDraggedContact(null);
        }
    };

    if (!selectedBotId && bots.length === 0 && !loading) {
        return <div className="p-8 text-center text-gray-500">Crie um bot primeiro para acessar o CRM.</div>;
    }

    // Group contacts by stage ID
    const grouped = contacts.reduce((acc, contact) => {
        const key = contact.stageId || "unassigned";
        if (!acc[key]) acc[key] = [];
        acc[key].push(contact);
        return acc;
    }, {} as Record<string, Contact[]>);

    return (
        <div className="h-full flex relative overflow-hidden bg-gray-50/50">
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-6 pt-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Pipeline de Vendas
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-500 text-sm">Gerencie leads para:</p>
                            <select
                                value={selectedBotId}
                                onChange={(e) => setSelectedBotId(e.target.value)}
                                className="bg-white border border-gray-200 rounded-md px-2 py-1 text-sm font-medium text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {bots.map(bot => (
                                    <option key={bot.id} value={bot.id}>{bot.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 bg-white/50 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-64 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-shadow">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar nome ou mensagem..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
                            />
                        </div>
                        <button
                            onClick={() => handleExport()}
                            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
                        >
                            <Download className="w-4 h-4" />
                            Exportar Tudo
                        </button>
                        <button
                            onClick={() => setIsAddingStage(true)}
                            disabled={bots.length === 0 || !selectedBotId}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition ${bots.length === 0 || !selectedBotId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#00a884] text-white hover:bg-[#008f6f]'}`}
                        >
                            <Plus className="w-4 h-4" />
                            Nova Coluna
                        </button>
                    </div>
                </div>

                {/* Kanban Horizontal Scroll Area */}
                <div className="flex-1 overflow-x-auto pb-6 px-6">
                    {bots.length === 0 && !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
                            <User className="w-12 h-12 mb-3 text-gray-300" />
                            <h3 className="text-lg font-bold text-gray-500 mb-1">Nenhum Assistente</h3>
                            <p className="text-sm px-4 text-center max-w-sm">Você precisa criar um bot (assistente) para acessar e gerenciar o CRM.</p>
                        </div>
                    )}
                    {bots.length > 0 && (
                        <div className="flex gap-4 min-w-max h-full">
                            {stages.map((stage) => {
                                const stageContacts = grouped[stage.id] || [];

                                return (
                                    <div
                                        key={stage.id}
                                        draggable
                                        onDragStart={(e) => handleStageDragStart(e, stage.id)}
                                        onDragOver={handleStageDragOver}
                                        onDrop={(e) => handleStageDrop(e, stage.id)}
                                        onDragEnd={() => setDraggedStage(null)}
                                        className={`w-80 flex-shrink-0 flex flex-col rounded-xl border border-gray-200 h-full bg-white shadow-sm overflow-hidden transition-all ${draggedStage === stage.id ? 'opacity-50 scale-[0.98] cursor-grabbing' : 'cursor-grab'}`}
                                    >
                                        {/* Column Header */}

                                        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`w-2 h-2 rounded-full bg-${stage.color}-500 flex-shrink-0`} />
                                                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider truncate" title={stage.name}>
                                                    {stage.name}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-400 border border-gray-100 mr-2">
                                                    {stageContacts.length}
                                                </span>
                                                <button
                                                    onClick={() => handleExport(stage.id)}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 transition"
                                                    title="Exportar coluna"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStage(stage.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Cards Container */}
                                        <div
                                            className="p-2 flex-1 overflow-y-auto space-y-2 bg-gray-50/30 min-h-[100px]"
                                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                                            onDrop={(e) => handleContactDrop(e, stage.id, stage.name)}
                                        >
                                            {stageContacts.map(contact => (
                                                <div
                                                    key={contact.id}
                                                    draggable
                                                    onDragStart={(e) => handleContactDragStart(e, contact.id)}
                                                    onDragEnd={() => setDraggedContact(null)}
                                                    onClick={() => setSelectedContactPanel(contact.id)}
                                                    className={`bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-grab group relative ${draggedContact === contact.id ? 'opacity-50 scale-95' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] ring-1 ring-indigo-100">
                                                                {contact.name ? contact.name.substring(0, 2).toUpperCase() : "?"}
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h4 className="font-bold text-gray-800 text-xs truncate w-32" title={contact.name || contact.phone}>
                                                                    {contact.name || contact.phone}
                                                                </h4>
                                                                <div className="flex items-center gap-1">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${contact.sentiment === 'POSITIVE' ? 'bg-green-400' : contact.sentiment === 'NEGATIVE' ? 'bg-red-400' : 'bg-gray-300'}`} />
                                                                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">
                                                                        Score: {contact.leadScore}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="text-gray-300 hover:text-gray-500">
                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-1 mt-2">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                            <Phone className="w-3 h-3 opacity-40" />
                                                            <span className="truncate">{contact.phone}</span>
                                                        </div>
                                                        {contact.email && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                                <Mail className="w-3 h-3 opacity-40" />
                                                                <span className="truncate">{contact.email}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                                                        <span className="text-[9px] text-gray-400 font-medium italic">
                                                            {new Date(contact.lastActive).toLocaleDateString()}
                                                        </span>
                                                        <a
                                                            href={`https://wa.me/${contact.phone}`}
                                                            target="_blank"
                                                            className="bg-green-50 text-green-600 p-1.5 rounded-md hover:bg-green-100 transition shadow-sm"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Phone className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                            {stageContacts.length === 0 && (
                                                <div className="py-8 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-300 italic">
                                                    <span className="text-[10px] font-medium">Nenhum lead</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* New Stage Form */}
                            {isAddingStage ? (
                                <div className="w-80 flex-shrink-0 bg-white rounded-xl border-2 border-indigo-100 p-4 h-fit shadow-lg outline outline-indigo-200">
                                    <h3 className="font-bold text-gray-700 text-sm mb-3">Nova Coluna</h3>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Nome do estágio (ex: Confirmados)"
                                        value={newStageName}
                                        onChange={(e) => setNewStageName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddStage}
                                            className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
                                        >
                                            Criar
                                        </button>
                                        <button
                                            onClick={() => { setIsAddingStage(false); setNewStageName(""); }}
                                            className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-1.5 text-xs font-bold hover:bg-gray-200 transition"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    {stages.length === 0 && !loading && (
                                        <div className="w-80 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-white/50 h-32">
                                            <p className="text-sm font-semibold text-gray-600 mb-1">Nenhuma coluna</p>
                                            <p className="text-xs text-gray-400 mb-3">Seu funil está vazio.</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setIsAddingStage(true)}
                                        className="w-80 flex-shrink-0 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition bg-white/50 group h-32"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Plus className="w-6 h-6 group-hover:scale-110 transition" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Adicionar Etapa</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sliding Panel */}
            {selectedContactPanel && (
                <div className="flex-shrink-0 h-full border-l border-gray-200 shadow-2xl z-20 bg-white">
                    <CRMContactPanel
                        contactId={selectedContactPanel!}
                        onClose={() => setSelectedContactPanel(null)}
                    />
                </div>
            )}
        </div>
    );
}
