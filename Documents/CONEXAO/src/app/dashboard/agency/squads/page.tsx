"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Bot, Users, MessageSquare, Send, Sparkles, UserCheck, ChevronRight,
    ArrowLeft, Search, HelpCircle, Loader2, Play, Building2, CheckCircle2, ShieldAlert
} from "lucide-react";
import { ALL_SQUADS, Agent, Squad } from "@/lib/agent-squads";

export default function AgencySquadsPage() {
    const router = useRouter();

    // ─── Clientes & Contexto ──────────────────────────────────────────────────
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [loadingClients, setLoadingClients] = useState(true);

    // ─── Squads & Filtros ─────────────────────────────────────────────────────
    const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // ─── Chat ─────────────────────────────────────────────────────────────────
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Carregar clientes da agência ao montar a página
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/agency/clients");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setClients(data);
                    if (data.length > 0) {
                        setSelectedClientId(data[0].id);
                    }
                }
            } catch (e) {
                console.error("Erro ao carregar clientes", e);
            } finally {
                setLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Rolar chat para o final
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    // Fechar chat ao trocar de cliente
    useEffect(() => {
        if (selectedAgent) {
            setMessages([]);
            setChatError(null);
        }
    }, [selectedClientId]);

    const activeClientName = clients.find(c => c.id === selectedClientId)?.name || "Cliente Selecionado";

    // Filtrar squads e agentes
    const filteredSquads = ALL_SQUADS.map(squad => {
        const matchingAgents = squad.agents.filter(agent =>
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            squad.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...squad, agents: matchingAgents };
    }).filter(squad => squad.agents.length > 0);

    // Abertura do chat com especialista
    const handleOpenChat = (agent: Agent) => {
        if (!selectedClientId) {
            alert("Por favor, selecione o cliente (contexto do negócio) antes de consultar o Squad.");
            return;
        }
        setSelectedAgent(agent);
        setMessages([
            {
                role: "assistant",
                content: `Olá! Sou **${agent.name}**, especialista em **${agent.role}**. Como estou atuando com o contexto de **${activeClientName}** carregado na minha memória operacional, posso te dar conselhos e criar estratégias altamente focadas. Como posso te ajudar hoje?`
            }
        ]);
        setChatError(null);
    };

    // Fechamento de chat
    const handleCloseChat = () => {
        setSelectedAgent(null);
        setMessages([]);
        setInputText("");
        setChatError(null);
    };

    // Enviar mensagem de chat
    const handleSendMessage = async (textToSend?: string) => {
        const text = textToSend || inputText;
        if (!text.trim() || !selectedAgent || !selectedClientId || sending) return;

        const newMessages = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        if (!textToSend) setInputText("");
        setSending(true);
        setChatError(null);

        try {
            const res = await fetch("/api/agency/squads/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentId: selectedAgent.id,
                    clientId: selectedClientId,
                    messages: newMessages.slice(1) // Ignora a mensagem de introdução
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessages([
                    ...newMessages,
                    { role: "assistant", content: data.response, provider: data.provider }
                ]);
            } else {
                setChatError(data.error || "Erro ao consultar o especialista. Verifique suas chaves de API.");
            }
        } catch (e: any) {
            setChatError("Falha de conexão. Tente novamente.");
        } finally {
            setSending(false);
        }
    };

    // Clique nas tarefas prontas
    const handleTaskClick = (promptTemplate: string) => {
        // Substituir placeholder [PRODUTO] ou [NEGÓCIO]
        let finalPrompt = promptTemplate.replace(/\[PRODUTO\]/gi, "nossos produtos/serviços");
        finalPrompt = finalPrompt.replace(/\[PRODUTO\/NICHO\]/gi, "nosso nicho");
        finalPrompt = finalPrompt.replace(/\[PRODUTO\/SERVIÇO\]/gi, "nossos serviços");
        finalPrompt = finalPrompt.replace(/\[MARCA\]/gi, activeClientName);
        finalPrompt = finalPrompt.replace(/\[NEGÓCIO\]/gi, activeClientName);
        
        setInputText(finalPrompt);
    };

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header com Contexto */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Bot className="text-emerald-500 w-9 h-9" />
                        Agency Intelligence Hub
                    </h1>
                    <p className="text-gray-400 mt-1">Consulte os maiores especialistas do marketing mundial focados no seu cliente.</p>
                </div>

                {/* Seletor de Cliente Premium */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 max-w-md w-full">
                    <div className="flex items-center gap-2 text-emerald-400 shrink-0">
                        <Building2 size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Contexto Ativo</span>
                    </div>
                    {loadingClients ? (
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Loader2 className="animate-spin" size={14} /> Carregando clientes...
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="text-xs text-orange-400">
                            Sem clientes cadastrados.
                        </div>
                    ) : (
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl py-2 px-3 text-sm text-white font-bold outline-none focus:border-emerald-500/50"
                        >
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    🏢 {c.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Hub Shell (Squad View ou Grid) */}
            {selectedSquad ? (
                <div className="space-y-6">
                    {/* Botão Voltar */}
                    <button
                        onClick={() => setSelectedSquad(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 font-bold transition-all text-sm group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar para os 12 Squads
                    </button>

                    {/* Banner do Squad */}
                    <div className="bg-gradient-to-r from-emerald-950/20 to-indigo-950/20 border border-white/10 rounded-3xl p-8 flex items-center gap-6">
                        <div className="text-5xl shrink-0 p-4 bg-white/5 rounded-2xl border border-white/10">{selectedSquad.emoji}</div>
                        <div>
                            <h2 className="text-2xl font-black">{selectedSquad.name}</h2>
                            <p className="text-gray-400 mt-1 max-w-2xl">{selectedSquad.description}</p>
                        </div>
                    </div>

                    {/* Agentes do Squad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedSquad.agents.map((agent) => (
                            <div
                                key={agent.id}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all duration-300"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                            {agent.emoji}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight">{agent.name}</h3>
                                            <p className="text-xs text-emerald-400 font-medium">{agent.role}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed mb-6">
                                        {agent.systemPrompt.replace(/Você é/i, "Especialista em").split('\n')[0]}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleOpenChat(agent)}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-auto"
                                >
                                    <MessageSquare size={16} />
                                    Consultar Especialista
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Barra de Busca */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar especialista ou squad..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-xs text-gray-500">
                            Carregados: <span className="text-emerald-400 font-bold">12 Squads / 144 Especialistas</span>
                        </div>
                    </div>

                    {/* Grid de 12 Squads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSquads.map((squad) => (
                            <div
                                key={squad.id}
                                onClick={() => setSelectedSquad(squad)}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all duration-300 cursor-pointer group"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="text-4xl p-3 bg-white/5 border border-white/10 rounded-2xl">{squad.emoji}</div>
                                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">
                                            {squad.agents.length} Agentes
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-xl group-hover:text-emerald-400 transition-colors leading-tight">{squad.name}</h3>
                                        <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">{squad.description}</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 group-hover:text-emerald-400 transition-colors font-bold">
                                    <span>Ver Especialistas</span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Drawer Lateral de Chat Premium */}
            {selectedAgent && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
                    {/* Fechar ao clicar fora */}
                    <div className="flex-1" onClick={handleCloseChat} />

                    {/* Painel do Chat */}
                    <div className="w-full max-w-2xl bg-[#0f172a] border-l border-white/10 flex flex-col h-full shadow-2xl relative">
                        {/* Header do Chat */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-black/20 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl p-2 bg-white/5 border border-white/10 rounded-xl">{selectedAgent.emoji}</div>
                                <div>
                                    <h3 className="font-bold text-lg text-white leading-none">{selectedAgent.name}</h3>
                                    <p className="text-xs text-emerald-400 font-medium mt-1.5">{selectedAgent.role}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleCloseChat}
                                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-gray-400 hover:text-white rounded-xl transition-all font-bold"
                            >
                                Sair da Sala
                            </button>
                        </div>

                        {/* Banner do Contexto */}
                        <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <CheckCircle2 size={12} /> Contexto ativo: {activeClientName}
                            </span>
                            <span className="text-gray-500">
                                Powered by {selectedAgent.llmProvider.toUpperCase()}
                            </span>
                        </div>

                        {/* Mensagens de Chat */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0b0f1a]/30">
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                                >
                                    {m.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-md flex items-center justify-center shrink-0">
                                            {selectedAgent.emoji}
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <div
                                            className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                                                m.role === "user"
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-white rounded-tr-none"
                                                    : "bg-white/5 border-white/10 text-gray-200 rounded-tl-none"
                                            }`}
                                        >
                                            {/* Markdown simples */}
                                            <p className="whitespace-pre-wrap">{m.content}</p>
                                        </div>
                                        {m.provider && (
                                            <p className="text-[10px] text-gray-600 px-2">
                                                Respondido por {m.provider.toUpperCase()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {sending && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-md flex items-center justify-center shrink-0 animate-pulse">
                                        {selectedAgent.emoji}
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 text-sm flex items-center gap-2 text-gray-400">
                                        <Loader2 className="animate-spin text-emerald-500" size={16} />
                                        <span>{selectedAgent.name} está analisando as métricas e formulando estratégias...</span>
                                    </div>
                                </div>
                            )}

                            {chatError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-400 text-xs">
                                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Falha na Resolução do Agente</p>
                                        <p className="mt-1 leading-relaxed">{chatError}</p>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Atalhos de Tasks Rápidas */}
                        {selectedAgent.tasks && selectedAgent.tasks.length > 0 && (
                            <div className="px-6 py-4 border-t border-white/5 bg-[#0f172a] space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-emerald-400" />
                                    Tasks Recomendadas do Especialista
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAgent.tasks.map((task: any) => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskClick(task.prompt)}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-xs font-bold text-gray-300 hover:text-emerald-400 rounded-xl transition-all text-left truncate max-w-full"
                                            title={task.label}
                                        >
                                            {task.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input de Envio */}
                        <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    placeholder={`Digite sua dúvida estratégica ou escolha uma Task acima...`}
                                    disabled={sending}
                                    className="flex-1 bg-[#0b0f1a] border border-white/10 rounded-2xl py-3.5 px-4 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 disabled:opacity-50"
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={sending || !inputText.trim()}
                                    className="px-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl transition-all flex items-center justify-center gap-1.5 font-bold shadow-xl shadow-emerald-500/10"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                    <span className="hidden sm:inline">Enviar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
