"use client";

import { useState, useEffect } from "react";
import {
    Users, DollarSign, MessageCircle, MoreHorizontal,
    TrendingUp, Phone, Mail, User, Settings2, Search
} from "lucide-react";
import CRMContactPanel from "./CRMContactPanel";
import { toast } from "sonner";

interface CrmStage {
    id: string;
    name: string;
    color: string;
}

interface Contact {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    funnelStage: string;
    stageId: string | null;
    leadScore: number;
    sentiment: string | null;
    lastAiInsight: string | null;
    lastActive: string;
    notes: string | null;
    _count?: { orders: number };
}

export function CRMBoard({ botId }: { botId: string }) {
    const [stages, setStages] = useState<CrmStage[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedContact, setDraggedContact] = useState<string | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Hook para fetch inicial de stages
    useEffect(() => {
        if (botId) {
            fetchStages();
        }
    }, [botId]);

    // Hook com Debounce para busca de contacts
    useEffect(() => {
        if (botId) {
            const timeout = setTimeout(() => {
                fetchContacts(search);
            }, 400);
            return () => clearTimeout(timeout);
        }
    }, [botId, search]);

    async function fetchStages() {
        try {
            const res = await fetch(`/api/bots/${botId}/crm/stages`);
            if (res.ok) {
                const data = await res.json();
                setStages(data);
            }
        } catch (error) {
            console.error("Error fetching stages", error);
        }
    }

    async function fetchContacts(searchQuery = "") {
        setLoading(true);
        try {
            const res = await fetch(`/api/contacts?botId=${botId}&search=${encodeURIComponent(searchQuery)}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                // Filter by botId for safety
                setContacts(data.filter((c: any) => c.botId === botId));
            }
        } catch (error) {
            console.error("Error fetching contacts", error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStage(contactId: string, newStageId: string, newStageName: string) {
        // Optimistic update
        setContacts(prev => prev.map(c =>
            c.id === contactId ? { ...c, stageId: newStageId, funnelStage: newStageName } : c
        ));

        try {
            const res = await fetch(`/api/contacts/${contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelStage: newStageName,
                    stageId: newStageId
                })
            });
            if (!res.ok) throw new Error("Failed to update");
            toast.success(`Movido para ${newStageName}`);
        } catch (error) {
            toast.error("Erro ao mover contato");
            fetchContacts();
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedContact(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, stage: CrmStage) => {
        e.preventDefault();
        if (draggedContact) {
            updateStage(draggedContact, stage.id, stage.name);
            setDraggedContact(null);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <Users className="w-12 h-12 text-gray-200" />
                <p className="text-gray-400 font-medium italic uppercase tracking-widest text-xs">Sincronizando Leads...</p>
            </div>
        </div>
    );

    if (stages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 m-6">
                <Settings2 className="w-12 h-12 text-indigo-200 mb-4" />
                <h3 className="text-gray-800 font-bold">Nenhuma coluna configurada</h3>
                <p className="text-gray-500 text-sm">Crie colunas para este bot usando o botão "+ Nova Coluna".</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white/30 rounded-3xl border border-white/50 p-4 shadow-sm gap-4">
            
            {/* 🔴 SEARCH BAR HEADER */}
            <div className="flex bg-white/50 border border-gray-100 p-2 rounded-2xl md:w-1/3 min-w-[300px] items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-shadow">
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Buscar nome, telefone, LLID ou mensagem..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-gray-700 placeholder-gray-400 font-medium"
                />
            </div>

            <div className="relative flex h-[calc(100vh-250px)] min-h-[500px] overflow-hidden">
                <div className={`flex-1 overflow-x-auto pb-4 transition-all duration-300 ${selectedContactId ? 'pr-[450px]' : ''}`}>
                    <div className="flex gap-6 h-full p-2">
                    {stages.map(stage => {
                        const stageContacts = contacts.filter(c => c.stageId === stage.id);

                        return (
                            <div
                                key={stage.id}
                                className="flex-1 min-w-[320px] flex flex-col rounded-3xl border-2 border-gray-100 bg-white/50 backdrop-blur-sm overflow-hidden"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage)}
                            >
                                {/* Header */}
                                <div className="p-4 flex justify-between items-center bg-white border-b border-gray-50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200`} />
                                        <h3 className="font-bold text-gray-700 text-[10px] uppercase tracking-widest truncate">{stage.name}</h3>
                                    </div>
                                    <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-[9px] font-black text-indigo-600 border border-indigo-100">
                                        {stageContacts.length}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                    {stageContacts.map(contact => (
                                        <div
                                            key={contact.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, contact.id)}
                                            onClick={() => setSelectedContactId(contact.id)}
                                            className={`group relative bg-white p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5 ${selectedContactId === contact.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-50 hover:border-indigo-100'}`}
                                        >
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-xl shadow-sm">
                                                    <TrendingUp size={10} />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                    {contact.name ? contact.name.substring(0, 2).toUpperCase() : <User size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                                        {contact.name || contact.phone}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${contact.sentiment === 'POSITIVE' ? 'bg-emerald-400' : contact.sentiment === 'NEGATIVE' ? 'bg-rose-400' : 'bg-amber-300'}`} />
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Score: {contact.leadScore}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/50">
                                                    <Phone className="w-3 h-3 text-indigo-400" />
                                                    <span className="truncate">{contact.phone}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(contact.lastActive).toLocaleDateString()}</span>
                                                <MessageCircle className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                    {stageContacts.length === 0 && (
                                        <div className="py-12 flex flex-col items-center justify-center text-gray-200 border-2 border-dashed border-gray-50 rounded-3xl bg-gray-50/20 group-hover:bg-indigo-50/50 transition-colors">
                                            <Users size={32} className="opacity-10 mb-2" />
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Aguardando Leads</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedContactId && (
                <div className="absolute inset-y-0 right-0 z-50 shadow-2xl">
                    <CRMContactPanel
                        contactId={selectedContactId}
                        onClose={() => setSelectedContactId(null)}
                        onDeleted={() => {
                            setContacts(prev => prev.filter(c => c.id !== selectedContactId));
                            setSelectedContactId(null);
                        }}
                    />
                </div>
            )}
        </div>
        </div>
    );
}

// Removed duplicate import
