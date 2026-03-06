
"use client";

import { useState, useEffect } from "react";
import {
    X, MessageCircle, History, Info, Send,
    TrendingUp, Star, Phone, Mail, MapPin,
    Calendar, CreditCard, ExternalLink, Bot, Trash2,
    Package, CheckCircle2, Clock, AlertCircle, DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface CRMContactPanelProps {
    contactId: string;
    onClose: () => void;
    onDeleted?: () => void;
}

export default function CRMContactPanel({ contactId, onClose, onDeleted }: CRMContactPanelProps) {
    const [activeTab, setActiveTab] = useState<'chat' | 'data' | 'auto' | 'finance'>('chat');
    const [contact, setContact] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [bots, setBots] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchContactData();
    }, [contactId]);

    async function fetchContactData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/contacts/${contactId}`);
            if (res.ok) {
                const data = await res.json();
                setContact(data);
                setOrders(data.orders || []);
                if (data.conversations?.[0]) {
                    setMessages(data.conversations[0].messages || []);
                }
            }

            // Fetch bots for delegation
            const botsRes = await fetch('/api/bots');
            if (botsRes.ok) setBots(await botsRes.json());
        } catch (error) {
            console.error("Error fetching contact detail", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelegate = async (botId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/contacts/${contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedBotId: botId === 'none' ? null : botId })
            });
            if (res.ok) {
                toast.success("Agente especialista delegado");
                fetchContactData();
            } else {
                toast.error("Falha ao delegar");
            }
        } catch (e) {
            toast.error("Erro de conexão");
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        console.log("Sending manual message:", input);
        setInput("");
    };

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.")) return;

        try {
            const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Lead excluído com sucesso");
                onDeleted?.();
            } else {
                toast.error("Erro ao excluir contato");
            }
        } catch (error) {
            toast.error("Erro de conexão ao excluir");
        }
    };

    if (loading) return (
        <div className="w-full h-full flex items-center justify-center bg-white border-l shadow-2xl animate-fade-in">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="w-[450px] h-full flex flex-col bg-white border-l shadow-2xl relative animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {contact?.name?.[0] || "?"}
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 leading-tight">{contact?.name || contact?.phone}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                {contact?.funnelStage}
                            </span>
                            <span className="text-[10px] text-gray-400">ID: {contact?.id.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all group"
                        title="Excluir Lead"
                    >
                        <Trash2 size={18} className="group-active:scale-90" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/20 overflow-x-auto no-scrollbar">
                <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageCircle size={16} />} label="Chat" />
                <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Info size={16} />} label="Dados" />
                <TabButton active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={<DollarSign size={16} />} label="Financeiro" />
                <TabButton active={activeTab === 'auto'} onClick={() => setActiveTab('auto')} icon={<Bot size={16} />} label="IA" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30">

                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                    <History size={40} className="opacity-20" />
                                    <p className="text-sm">Nenhum histórico encontrado</p>
                                </div>
                            ) : (
                                messages.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                                            : 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                                            }`}>
                                            {msg.content}
                                            <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-indigo-200'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Responder como o Bot..."
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                                <button onClick={handleSend} className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="p-6 space-y-8 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md group">
                                <p className="text-[10px] text-gray-400 uppercase font-black mb-1 group-hover:text-indigo-500">Pedidos</p>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={18} className="text-indigo-500" />
                                    <span className="text-lg font-black text-gray-800">{orders.length}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md group">
                                <p className="text-[10px] text-gray-400 uppercase font-black mb-1 group-hover:text-indigo-500">Lead Score</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} className={`${(contact?.leadScore || 0) > 70 ? 'text-green-500' : 'text-yellow-500'}`} />
                                    <span className="text-lg font-black text-gray-800">{contact?.leadScore || 0}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Informações Base</h3>
                            <InfoRow label="Email" value={contact?.email || 'Não informado'} icon={<Mail size={14} />} />
                            <InfoRow label="Telefone" value={contact?.phone} icon={<Phone size={14} />} />
                            <InfoRow label="Insight IA" value={contact?.lastAiInsight ? 'Gerado' : 'Aguardando'} icon={<Bot size={14} />} />
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Histórico de Cobranças</h3>
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">ASAAS INTEGRADO</span>
                        </div>

                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-100 opacity-40">
                                    <Package size={48} className="mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Nenhuma compra detectada</p>
                                </div>
                            ) : (
                                orders.map((order: any) => (
                                    <div key={order.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-800">Cód: {order.id.slice(-6)}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-indigo-600">R$ {order.totalAmount?.toFixed(2) || '0.00'}</p>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === 'RECEIVED' || order.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Itens do Pedido */}
                                        <div className="mb-3 space-y-1">
                                            {order.items?.map((item: any) => (
                                                <div key={item.id} className="text-[10px] flex justify-between italic text-gray-500">
                                                    <span>• {item.product?.name || 'Produto'} x{item.quantity}</span>
                                                    <span>R$ {item.unitPrice.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                                            {order.status === 'RECEIVED' ? <CheckCircle2 size={12} className="text-green-500" /> : <Clock size={12} className="text-amber-500" />}
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                                {order.status === 'RECEIVED' ? 'Pagamento Confirmado' : 'Aguardando Compensação'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-indigo-600/5 rounded-2xl border border-indigo-500/10">
                            <p className="text-[10px] text-indigo-600 leading-tight">
                                💡 <strong>Dica Asaas:</strong> O bot identifica pagamentos automaticamente via webhook. Quando o status muda para <strong>RECEIVED</strong>, o lead é movido no funil.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'auto' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                            <Bot className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <Star size={20} fill="currentColor" className="text-yellow-400 animate-pulse" />
                                Insight Estratégico
                            </h3>
                            <p className="text-sm opacity-90 leading-relaxed font-medium bg-white/10 p-4 rounded-2xl border border-white/10 italic">
                                "{contact?.lastAiInsight || "Aguardando próxima interação para análise..."}"
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button className="flex-1 py-3 bg-white text-indigo-700 rounded-2xl text-[11px] font-black uppercase tracking-tighter hover:bg-indigo-50 transition-all shadow-lg">
                                    Ação Recomendada
                                </button>
                                <button className="p-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all">
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Agente Especialista Delegado</h3>
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Bot size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Responsável Atual</p>
                                        <p className="text-sm font-black text-gray-800">
                                            {bots.find(b => b.id === contact?.assignedBotId)?.name || "Agente Padrão (IA)"}
                                        </p>
                                    </div>
                                </div>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                    value={contact?.assignedBotId || 'none'}
                                    disabled={saving}
                                    onChange={(e) => handleDelegate(e.target.value)}
                                >
                                    <option value="none">Transferir para Agente Padrão</option>
                                    {bots.filter(b => b.id !== contact?.botId).map(b => (
                                        <option key={b.id} value={b.id}>Delegar para: {b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monitor de Sentimento</h3>
                            <div className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:border-indigo-100 group">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${contact?.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-600' :
                                    contact?.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-600' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                    {contact?.sentiment === 'POSITIVE' ? '😊' : contact?.sentiment === 'NEGATIVE' ? '😠' : '😐'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                                        {contact?.sentiment === 'POSITIVE' ? 'Altamente Receptivo' :
                                            contact?.sentiment === 'NEGATIVE' ? 'Risco de Churn' :
                                                'Interação Neutra'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                                        Análise baseada no contexto das conversas via {contact?.bot?.aiProvider || 'IA'}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


function InfoRow({ label, value, icon }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                    {icon}
                </div>
                <span className="text-xs text-gray-500 font-bold">{label}</span>
            </div>
            <span className="text-xs font-medium text-gray-800">{value}</span>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${active
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
