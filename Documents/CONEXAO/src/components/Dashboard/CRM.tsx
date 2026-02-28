"use client";

import { useState, useEffect } from "react";
import { User, Building2, Phone, Mail, MoreHorizontal, Download, Plus, Settings2, Trash2 } from "lucide-react";
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

export function CRM() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string>("");
    const [stages, setStages] = useState<CrmStage[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingStage, setIsAddingStage] = useState(false);
    const [newStageName, setNewStageName] = useState("");

    useEffect(() => {
        fetchBots();
    }, []);

    useEffect(() => {
        if (selectedBotId) {
            fetchStages();
            fetchContacts();
        }
    }, [selectedBotId]);

    async function fetchBots() {
        try {
            const res = await fetch("/api/bots");
            if (res.ok) {
                const data = await res.json();
                setBots(data);
                if (data.length > 0) setSelectedBotId(data[0].id);
            }
        } catch (error) {
            toast.error("Erro ao carregar bots");
        }
    }

    async function fetchStages() {
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

    async function fetchContacts() {
        setLoading(true);
        try {
            // Updated API call to use bot-specific contacts if available, 
            // fallback to general contacts filtered by botId logic in backend
            const res = await fetch(`/api/contacts?botId=${selectedBotId}`);
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
        if (!newStageName) return;
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
        try {
            const url = `/api/bots/${selectedBotId}/crm/export` + (stageId ? `?stageId=${stageId}` : '');
            window.open(url, '_blank');
        } catch (error) {
            toast.error("Erro ao exportar");
        }
    }

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
        <div className="h-full flex flex-col bg-gray-50/50">
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
                    <button
                        onClick={() => handleExport()}
                        className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Tudo
                    </button>
                    <button
                        onClick={() => setIsAddingStage(true)}
                        className="flex items-center gap-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:bg-[#008f6f] text-sm font-medium shadow-sm transition"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Coluna
                    </button>
                </div>
            </div>

            {/* Kanban Horizontal Scroll Area */}
            <div className="flex-1 overflow-x-auto pb-6 px-6">
                <div className="flex gap-4 min-w-max h-full">
                    {stages.map((stage) => {
                        const stageContacts = grouped[stage.id] || [];

                        return (
                            <div key={stage.id} className="w-80 flex-shrink-0 flex flex-col rounded-xl border border-gray-200 h-full bg-white shadow-sm overflow-hidden">
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
                                <div className="p-2 flex-1 overflow-y-auto space-y-2 bg-gray-50/30">
                                    {stageContacts.map(contact => (
                                        <div key={contact.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group relative">
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
                        <button
                            onClick={() => setIsAddingStage(true)}
                            className="w-80 flex-shrink-0 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition bg-white/50 group h-32"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Plus className="w-6 h-6 group-hover:scale-110 transition" />
                                <span className="text-xs font-bold uppercase tracking-wider">Adicionar Etapa</span>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
