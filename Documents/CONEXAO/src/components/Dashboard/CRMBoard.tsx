"use client";

import { useState, useEffect } from "react";
import {
    Users, DollarSign, MessageCircle, MoreHorizontal,
    ArrowRight, Filter, Search, Phone, Mail, Star, TrendingUp
} from "lucide-react";
import CRMContactPanel from "./CRMContactPanel";

interface Contact {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    funnelStage: string;
    leadScore: number;
    sentiment: string | null;
    lastAiInsight: string | null;
    lastActive: string;
    notes: string | null;
    _count?: { orders: number };
}

const STAGES = [
    { id: 'LEAD', label: 'Leads', color: 'border-gray-200 bg-gray-50/50' },
    { id: 'INTEREST', label: 'Interessados', color: 'border-blue-200 bg-blue-50/30' },
    { id: 'CONSIDERATION', label: 'Em Negociação', color: 'border-yellow-200 bg-yellow-50/30' },
    { id: 'CUSTOMER', label: 'Clientes', color: 'border-green-200 bg-green-50/30' },
    { id: 'CHURNED', label: 'Perdidos', color: 'border-red-200 bg-red-50/30' }
];

export function CRMBoard({ botId }: { botId: string }) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedContact, setDraggedContact] = useState<string | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

    useEffect(() => {
        fetchContacts();
    }, [botId]);

    async function fetchContacts() {
        try {
            const res = await fetch(`/api/bots/${botId}/contacts`);
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Error fetching contacts", error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStage(contactId: string, newStage: string) {
        setContacts(prev => prev.map(c =>
            c.id === contactId ? { ...c, funnelStage: newStage } : c
        ));

        try {
            await fetch(`/api/contacts/${contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelStage: newStage })
            });
        } catch (error) {
            console.error("Error updating stage", error);
            fetchContacts();
        }
    }

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedContact(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        if (draggedContact) {
            updateStage(draggedContact, stageId);
            setDraggedContact(null);
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <Users className="w-12 h-12 text-gray-200" />
                <p className="text-gray-400 font-medium">Carregando CRM Elite...</p>
            </div>
        </div>
    );

    return (
        <div className="relative flex h-[calc(100vh-200px)] min-h-[600px] overflow-hidden">

            {/* Kanban Board */}
            <div className={`flex-1 overflow-x-auto pb-4 transition-all duration-300 ${selectedContactId ? 'pr-[450px]' : ''}`}>
                <div className="flex gap-6 h-full p-2">
                    {STAGES.map(stage => {
                        const stageContacts = contacts.filter(c => c.funnelStage === stage.id);

                        return (
                            <div
                                key={stage.id}
                                className={`flex-1 min-w-[300px] flex flex-col rounded-3xl border-2 ${stage.color} overflow-hidden`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                                {/* Header */}
                                <div className="p-4 flex justify-between items-center bg-white/40 backdrop-blur-sm border-b border-white/20">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${stage.id === 'CUSTOMER' ? 'bg-green-500' : stage.id === 'CHURNED' ? 'bg-red-500' : 'bg-indigo-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">{stage.label}</h3>
                                    </div>
                                    <span className="bg-white/60 px-2.5 py-0.5 rounded-full text-[10px] font-black text-gray-500 border border-white/50">
                                        {stageContacts.length}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                    {stageContacts.map(contact => (
                                        <div
                                            key={contact.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, contact.id)}
                                            onClick={() => setSelectedContactId(contact.id)}
                                            className={`group relative bg-white p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 ${selectedContactId === contact.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-100 hover:border-indigo-200'
                                                }`}
                                        >
                                            {/* AI Insight Badge */}
                                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-1.5 rounded-xl shadow-lg">
                                                    <TrendingUp size={12} />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                                        {contact.name || contact.phone}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 font-medium">#{contact.id.slice(0, 8)}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50/50 p-1.5 rounded-lg">
                                                    <Phone className="w-3 h-3 text-indigo-400" />
                                                    <span className="truncate">{contact.phone}</span>
                                                </div>
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Mail className="w-3 h-3 text-gray-300" />
                                                        <span className="truncate opacity-60">{contact.email}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                                                <div className="flex items-center gap-1.5">
                                                    {contact._count?.orders ? (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-bold">
                                                            <DollarSign size={10} />
                                                            {contact._count.orders} Pedidos
                                                        </div>
                                                    ) : (
                                                        <div className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[9px] font-bold">
                                                            Novo Lead
                                                        </div>
                                                    )}
                                                </div>
                                                <MessageCircle className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                    {stageContacts.length === 0 && (
                                        <div className="py-12 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl bg-white/20">
                                            <Users size={32} className="opacity-10 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Pista Vazia</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Side Panel Overlay / Drawer */}
            {selectedContactId && (
                <div className="absolute inset-y-0 right-0 z-50">
                    <CRMContactPanel
                        contactId={selectedContactId}
                        onClose={() => setSelectedContactId(null)}
                    />
                </div>
            )}
        </div>
    );
}
