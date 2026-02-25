
"use client";

import { useState, useEffect } from "react";
import { User, Building2, Calendar, Phone, Mail, MoreHorizontal } from "lucide-react";

interface Contact {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    company: string | null;
    role: string | null;
    funnelStage: string;
    lastActive: string;
    tags: string[];
}

const STAGES = {
    "LEAD": { label: "Novos Leads", color: "bg-gray-100 border-gray-200" },
    "AWARENESS": { label: "Consciência", color: "bg-blue-50 border-blue-200" },
    "INTEREST": { label: "Interesse", color: "bg-indigo-50 border-indigo-200" },
    "CONSIDERATION": { label: "Consideração", color: "bg-purple-50 border-purple-200" },
    "DECISION": { label: "Decisão", color: "bg-orange-50 border-orange-200" },
    "ACTION": { label: "Fechamento", color: "bg-green-50 border-green-200" },
    "CUSTOMER": { label: "Clientes", color: "bg-emerald-100 border-emerald-200" },
    "SUPPORT": { label: "Suporte", color: "bg-red-50 border-red-200" }
};

export function CRM() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContacts();
    }, []);

    async function fetchContacts() {
        try {
            const res = await fetch("/api/contacts");
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando CRM...</div>;
    }

    // Group contacts by stage
    const grouped = contacts.reduce((acc, contact) => {
        const stage = contact.funnelStage as keyof typeof STAGES || "LEAD";
        if (!acc[stage]) acc[stage] = [];
        acc[stage].push(contact);
        return acc;
    }, {} as Record<string, Contact[]>);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 px-6 pt-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pipeline de Vendas</h2>
                    <p className="text-gray-500 text-sm">Gerencie seus leads e oportunidades em tempo real.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                        Exportar
                    </button>
                    <button className="bg-[#00a884] text-white px-4 py-2 rounded-lg hover:bg-[#008f6f] text-sm font-medium">
                        + Novo Contato
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-6 px-6">
                <div className="flex gap-4 min-w-max h-full">
                    {Object.entries(STAGES).map(([stageKey, config]) => {
                        const stageContacts = grouped[stageKey] || [];

                        return (
                            <div key={stageKey} className={`w-80 flex-shrink-0 flex flex-col rounded-xl border ${config.color} h-full bg-opacity-50`}>
                                {/* Column Header */}
                                <div className="p-3 border-b border-gray-200/50 flex justify-between items-center bg-white/50 rounded-t-xl backdrop-blur-sm">
                                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                        {config.label}
                                    </h3>
                                    <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                                        {stageContacts.length}
                                    </span>
                                </div>

                                {/* Cards Container */}
                                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                                    {stageContacts.map(contact => (
                                        <div key={contact.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white">
                                                        {contact.name ? contact.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 text-sm truncate w-32" title={contact.name || "Sem nome"}>
                                                            {contact.name || "Sem Nome"}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-500 block">
                                                            {new Date(contact.lastActive).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-1.5">
                                                {contact.company && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1 rounded">
                                                        <Building2 className="w-3 h-3 text-gray-400" />
                                                        <span className="truncate max-w-[180px]">{contact.company}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                                                    <a href={`https://wa.me/${contact.phone}`} target="_blank" className="text-xs text-green-600 flex items-center gap-1 hover:underline">
                                                        <Phone className="w-3 h-3" />
                                                        WhatsApp
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {stageContacts.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">
                                            Vazio
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
