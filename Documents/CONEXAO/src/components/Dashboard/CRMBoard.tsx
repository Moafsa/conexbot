"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
    Users, DollarSign, MessageCircle, MoreHorizontal,
    TrendingUp, Phone, Mail, User, Settings2, Search,
    ShieldAlert, Plus, Trash2, Clock, Check, AlertCircle,
    RefreshCw, MessageSquare
} from "lucide-react";
import CRMContactPanel from "./CRMContactPanel";
import { toast } from "sonner";

interface CrmStage {
    id: string;
    name: string;
    color: string;
}

interface CrmPipeline {
    id: string;
    name: string;
    allowedAgents: string[];
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
    isBlocked: boolean;
    notes: string | null;
    channel?: string;
    priority?: string;
    slaExpiresAt?: string | null;
    assignedAgentName?: string | null;
    assignedAgentAvatar?: string | null;
    dealValue?: number;
    _count?: { orders: number };
}

export function CRMBoard({ botId }: { botId: string }) {
    const searchParams = useSearchParams();
    const clientId = searchParams?.get("clientId");
    
    const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
    const [activePipelineId, setActivePipelineId] = useState<string>("");
    const [stages, setStages] = useState<CrmStage[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedContact, setDraggedContact] = useState<string | null>(null);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    
    // settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [pipelineName, setPipelineName] = useState("");
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
    const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
    const [newPipelineName, setNewPipelineName] = useState("");

    // Hook para fetch inicial de pipelines
    useEffect(() => {
        if (botId) {
            fetchPipelines();
            fetchAgents();
        }
    }, [botId]);

    // Hook para carregar stages e contacts toda vez que o pipeline mudar
    useEffect(() => {
        if (botId && activePipelineId) {
            fetchStages();
            fetchContacts(search);
        }
    }, [botId, activePipelineId]);

    // Hook com Debounce para busca de contacts
    useEffect(() => {
        if (botId && activePipelineId) {
            const timeout = setTimeout(() => {
                fetchContacts(search);
            }, 400);
            return () => clearTimeout(timeout);
        }
    }, [botId, activePipelineId, search]);

    async function fetchPipelines() {
        try {
            const query = clientId ? `&clientId=${clientId}` : '';
            const res = await fetch(`/api/crm/pipelines?botId=${botId}${query}`);
            if (res.ok) {
                const data = await res.json();
                setPipelines(data);
                if (data.length > 0) {
                    setActivePipelineId(data[0].id);
                    setPipelineName(data[0].name);
                    setSelectedAgents(data[0].allowedAgents || []);
                } else {
                    // Create default pipeline if none exists
                    await handleCreatePipeline("Funil de Vendas Principal");
                }
            }
        } catch (error) {
            console.error("Error fetching pipelines", error);
        }
    }

    async function fetchAgents() {
        try {
            const query = clientId ? `&clientId=${clientId}` : '';
            const res = await fetch(`/api/crm/agents?botId=${botId}${query}`);
            if (res.ok) {
                const data = await res.json();
                setAgents(data);
            }
        } catch (error) {
            console.error("Error fetching agents", error);
        }
    }

    async function fetchStages() {
        try {
            const query = clientId ? `&clientId=${clientId}` : '';
            const res = await fetch(`/api/bots/${botId}/crm/stages?pipelineId=${activePipelineId}${query}`);
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
            const query = clientId ? `&clientId=${clientId}` : '';
            const res = await fetch(`/api/contacts?botId=${botId}&pipelineId=${activePipelineId}&search=${encodeURIComponent(searchQuery)}${query}`, { cache: 'no-store' });
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

    async function handleCreatePipeline(name: string) {
        if (!name.trim()) return;
        try {
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/crm/pipelines${query}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, botId })
            });
            if (res.ok) {
                const newPipeline = await res.json();
                setPipelines(prev => [...prev, newPipeline]);
                setActivePipelineId(newPipeline.id);
                setPipelineName(newPipeline.name);
                setSelectedAgents(newPipeline.allowedAgents || []);
                toast.success("Funil criado com sucesso!");
                setNewPipelineName("");
                setIsCreatingPipeline(false);
            }
        } catch (error) {
            toast.error("Erro ao criar funil");
        }
    }

    async function handleUpdatePipeline() {
        try {
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/crm/pipelines/${activePipelineId}${query}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: pipelineName,
                    allowedAgents: selectedAgents
                })
            });
            if (res.ok) {
                toast.success("Configurações salvas com sucesso!");
                setIsSettingsOpen(false);
                fetchPipelines();
            }
        } catch (error) {
            toast.error("Erro ao salvar configurações do funil");
        }
    }

    async function handleDeletePipeline() {
        if (pipelines.length <= 1) {
            toast.error("Você deve manter pelo menos um funil ativo.");
            return;
        }
        if (!confirm("Tem certeza que deseja excluir este funil? Todos os estágios vinculados serão deletados!")) return;
        try {
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/crm/pipelines/${activePipelineId}${query}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Funil excluído com sucesso!");
                setIsSettingsOpen(false);
                fetchPipelines();
            }
        } catch (error) {
            toast.error("Erro ao excluir funil");
        }
    }

    async function updateStage(contactId: string, newStageId: string, newStageName: string) {
        // Optimistic update
        setContacts(prev => prev.map(c =>
            c.id === contactId ? { ...c, stageId: newStageId, funnelStage: newStageName } : c
        ));

        try {
            const query = clientId ? `?clientId=${clientId}` : '';
            const res = await fetch(`/api/contacts/${contactId}${query}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelStage: newStageName,
                    stageId: newStageId,
                    botId: botId
                })
            });
            if (!res.ok) throw new Error("Failed to update");
            toast.success(`Movido para ${newStageName}`);
        } catch (error) {
            toast.error("Erro ao mover contato");
            fetchContacts(search);
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

    // Calculate SLA Status
    const getSlaStatus = (slaStr: string | null | undefined) => {
        if (!slaStr) return 'none';
        try {
            const expireDate = new Date(slaStr);
            const now = new Date();
            
            if (expireDate < now) {
                return 'red'; // Expired
            }
            
            // Check if it's today
            const isToday = expireDate.toDateString() === now.toDateString();
            if (isToday) {
                const [hour, minute] = workingHoursEnd.split(':').map(Number);
                const workdayEndToday = new Date(now);
                workdayEndToday.setHours(hour, minute, 0, 0);
                
                if (now > workdayEndToday) {
                    return 'red'; // Workday finished and not resolved
                }
                return 'yellow'; // To resolve today
            }
            return 'none';
        } catch {
            return 'none';
        }
    };

    // Helper to render channel badges
    const renderChannelIcon = (channel: string) => {
        const channelLower = channel.toLowerCase();
        if (channelLower.includes("whatsapp")) {
            return <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-100 flex items-center gap-1">🟢 WhatsApp</span>;
        }
        if (channelLower.includes("instagram")) {
            return <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-pink-100 flex items-center gap-1">📸 Instagram</span>;
        }
        if (channelLower.includes("telegram")) {
            return <span className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-sky-100 flex items-center gap-1">✈️ Telegram</span>;
        }
        if (channelLower.includes("web") || channelLower.includes("widget")) {
            return <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-100 flex items-center gap-1">💻 Web</span>;
        }
        return <span className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-gray-100 uppercase flex items-center gap-1">{channel}</span>;
    };

    if (loading && pipelines.length === 0) return (
        <div className="h-full flex items-center justify-center py-20">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <Users className="w-12 h-12 text-gray-200 animate-bounce" />
                <p className="text-gray-400 font-medium italic uppercase tracking-widest text-xs">Sincronizando Leads...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white/30 rounded-3xl border border-white/50 p-4 shadow-sm gap-4">
            
            {/* 🔴 HEADER E CONTROLES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    {/* Pipeline Selector */}
                    <div className="relative">
                        <select
                            value={activePipelineId}
                            onChange={(e) => {
                                const matched = pipelines.find(p => p.id === e.target.value);
                                if (matched) {
                                    setActivePipelineId(matched.id);
                                    setPipelineName(matched.name);
                                    setSelectedAgents(matched.allowedAgents || []);
                                }
                            }}
                            className="bg-white/80 border border-gray-200 text-gray-800 text-sm font-black rounded-2xl px-4 py-2.5 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer pr-10 appearance-none uppercase tracking-wider"
                        >
                            {pipelines.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <MoreHorizontal size={16} />
                        </div>
                    </div>

                    {/* Pipeline Settings Button */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 p-2.5 rounded-2xl shadow-sm hover:shadow transition-all"
                        title="Configurações do Funil"
                    >
                        <Settings2 size={16} />
                    </button>

                    {/* New Pipeline Button */}
                    {!isCreatingPipeline ? (
                        <button
                            onClick={() => setIsCreatingPipeline(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all"
                        >
                            <Plus size={14} /> Novo Funil
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                            <input
                                type="text"
                                placeholder="Nome do novo funil..."
                                value={newPipelineName}
                                onChange={(e) => setNewPipelineName(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs px-2 text-gray-800"
                            />
                            <button
                                onClick={() => handleCreatePipeline(newPipelineName)}
                                className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold"
                            >
                                Criar
                            </button>
                            <button
                                onClick={() => setIsCreatingPipeline(false)}
                                className="text-gray-400 hover:text-gray-600 text-[10px] px-1"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div className="flex bg-white/60 border border-gray-200 p-2 rounded-2xl md:w-1/3 min-w-[300px] items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-shadow">
                    <Search className="w-4 h-4 text-gray-400 ml-2" />
                    <input 
                        type="text" 
                        placeholder="Buscar nome, telefone, LLID ou insight..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none px-2 text-xs text-gray-700 placeholder-gray-400 font-medium"
                    />
                    <button onClick={() => fetchContacts(search)} className="text-gray-400 hover:text-indigo-600 p-1">
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-full flex items-center justify-center py-20">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <Users className="w-12 h-12 text-gray-200 animate-bounce" />
                        <p className="text-gray-400 font-medium italic uppercase tracking-widest text-xs">Atualizando Cards...</p>
                    </div>
                </div>
            ) : stages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 m-6">
                    <Settings2 className="w-12 h-12 text-indigo-200 mb-4" />
                    <h3 className="text-gray-800 font-bold">Nenhuma coluna configurada</h3>
                    <p className="text-gray-500 text-sm">Crie colunas para este bot usando as configurações.</p>
                </div>
            ) : (
                <div className="relative flex h-[calc(100vh-250px)] min-h-[500px] overflow-hidden">
                    <div className={`flex-1 overflow-x-auto pb-4 transition-all duration-300 ${selectedContactId ? 'pr-[450px]' : ''}`}>
                        <div className="flex gap-6 h-full p-2">
                        {stages.map(stage => {
                            const stageContacts = contacts.filter(c => c.stageId === stage.id);

                            return (
                                <div
                                    key={stage.id}
                                    className="flex-1 min-w-[320px] max-w-[360px] flex flex-col rounded-3xl border border-gray-200/60 bg-white/60 backdrop-blur-sm overflow-hidden shadow-sm"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage)}
                                >
                                    {/* Column Header */}
                                    <div className="p-4 flex justify-between items-center bg-white/80 border-b border-gray-100">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color || '#6366f1' }} />
                                            <h3 className="font-extrabold text-gray-800 text-[10px] uppercase tracking-wider truncate">{stage.name}</h3>
                                        </div>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[9px] font-black text-gray-600 border border-gray-200">
                                            {stageContacts.length}
                                        </span>
                                    </div>

                                    {/* Column Content */}
                                    <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar bg-gray-50/30">
                                        {stageContacts.map(contact => {
                                            const slaStatus = getSlaStatus(contact.slaExpiresAt);
                                            const slaBorderColor = 
                                                slaStatus === 'red' ? 'border-rose-500 ring-2 ring-rose-500/15 animate-pulse' :
                                                slaStatus === 'yellow' ? 'border-amber-400 ring-2 ring-amber-400/15' :
                                                'border-gray-100 hover:border-indigo-200';

                                            return (
                                                <div
                                                    key={contact.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, contact.id)}
                                                    onClick={() => setSelectedContactId(contact.id)}
                                                    className={`group relative bg-white p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 ${selectedContactId === contact.id ? 'border-indigo-500 ring-4 ring-indigo-500/10' : slaBorderColor}`}
                                                >
                                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {contact.dealValue && contact.dealValue > 0 ? (
                                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                                R$ {contact.dealValue.toFixed(2)}
                                                            </span>
                                                        ) : null}
                                                        <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-xl shadow-sm">
                                                            <TrendingUp size={10} />
                                                        </div>
                                                    </div>

                                                    {/* Sender Details */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs ${contact.isBlocked ? 'opacity-50' : ''}`}>
                                                            {contact.name ? contact.name.substring(0, 2).toUpperCase() : <User size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`font-bold text-gray-800 text-xs truncate group-hover:text-indigo-600 transition-colors ${contact.isBlocked ? 'text-gray-400 line-through' : ''}`}>
                                                                    {contact.name || contact.phone}
                                                                </h4>
                                                                {contact.isBlocked && (
                                                                    <div className="bg-red-100 text-red-600 p-0.5 rounded-full" title="Contato Bloqueado">
                                                                        <ShieldAlert size={10} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${contact.sentiment === 'POSITIVE' ? 'bg-emerald-400' : contact.sentiment === 'NEGATIVE' ? 'bg-rose-400' : 'bg-amber-300'}`} />
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Score: {contact.leadScore}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Channel Badge & SLA Info */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                                                        {contact.channel && renderChannelIcon(contact.channel)}
                                                        {slaStatus === 'red' && (
                                                            <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-rose-100 flex items-center gap-1 animate-pulse">
                                                                <Clock size={10} /> SLA VENCIDO
                                                            </span>
                                                        )}
                                                        {slaStatus === 'yellow' && (
                                                            <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-amber-100 flex items-center gap-1">
                                                                <Clock size={10} /> RESOLVER HOJE
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Last Message/Insight snippet */}
                                                    {contact.lastAiInsight && (
                                                        <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100 line-clamp-2 italic mb-3">
                                                            "{contact.lastAiInsight}"
                                                        </p>
                                                    )}

                                                    {/* Footer details: Date and Assignee */}
                                                    <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                                                        <span>{new Date(contact.lastActive).toLocaleDateString()}</span>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            {contact.assignedAgentName ? (
                                                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100" title={`Atribuído a: ${contact.assignedAgentName}`}>
                                                                    {contact.assignedAgentAvatar ? (
                                                                        <img src={contact.assignedAgentAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                                                    ) : (
                                                                        <User size={10} />
                                                                    )}
                                                                    <span className="text-[8px] font-bold truncate max-w-[60px]">{contact.assignedAgentName}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[8px] font-bold text-gray-300">Sem agente</span>
                                                            )}
                                                            <MessageSquare className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {stageContacts.length === 0 && (
                                            <div className="py-12 flex flex-col items-center justify-center text-gray-200 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/20 group-hover:bg-indigo-50/50 transition-colors">
                                                <Users size={32} className="opacity-15 mb-2" />
                                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Sem Leads</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </div>
            )}

            {/* 🔴 SETTINGS MODAL */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-extrabold text-gray-800 text-base uppercase tracking-wider flex items-center gap-2">
                                <Settings2 className="text-indigo-600" /> Configurações do Funil
                            </h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✖</button>
                        </div>

                        {/* Funnel Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Nome do Funil</label>
                            <input
                                type="text"
                                value={pipelineName}
                                onChange={(e) => setPipelineName(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* SLA Workday End */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Fim do Expediente de Trabalho (SLA Vermelho)</label>
                            <input
                                type="time"
                                value={workingHoursEnd}
                                onChange={(e) => setWorkingHoursEnd(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* Agents Allowed Permissions */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                Permissão de Visualização (Agentes Chatwoot)
                            </label>
                            <p className="text-[10px] text-gray-400">Marque quais agentes têm permissão para ver este pipeline. Deixe vazio para que todos possam ver.</p>
                            
                            {agents.length === 0 ? (
                                <div className="p-3 bg-gray-50 rounded-2xl text-[10px] text-gray-400 text-center">
                                    Nenhum agente localizado no Chatwoot ou integração não configurada.
                                </div>
                            ) : (
                                <div className="border border-gray-100 rounded-2xl max-h-40 overflow-y-auto p-2 space-y-1.5 bg-gray-50/50">
                                    {agents.map((agent: any) => {
                                        const isChecked = selectedAgents.includes(agent.email);
                                        return (
                                            <label key={agent.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        if (isChecked) {
                                                            setSelectedAgents(prev => prev.filter(email => email !== agent.email));
                                                        } else {
                                                            setSelectedAgents(prev => [...prev, agent.email]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <div className="flex items-center gap-2">
                                                    {agent.avatar_url && (
                                                        <img src={agent.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700">{agent.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-semibold">{agent.email}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                            <button
                                onClick={handleDeletePipeline}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 flex items-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
                            >
                                <Trash2 size={14} /> Excluir Funil
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdatePipeline}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedContactId && (
                <div className="absolute inset-y-0 right-0 z-50 shadow-2xl">
                    <CRMContactPanel
                        contactId={selectedContactId}
                        botId={botId}
                        clientId={clientId}
                        onClose={() => setSelectedContactId(null)}
                        onDeleted={() => {
                            setContacts(prev => prev.filter(c => c.id !== selectedContactId));
                            setSelectedContactId(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
