"use client";

import { useState, useEffect } from "react";
import {
    ClipboardList, CheckCircle2, Loader2, Plus, Calendar, Trash2,
    X, AlertTriangle, ShieldCheck, Tag, Info, ArrowRight, ArrowLeft,
    Building2, ChevronLeft
} from "lucide-react";

// Pre-defined columns
const COLUMNS = [
    { id: "PENDING", label: "A Fazer", color: "border-orange-500/20 text-orange-400 bg-orange-500/5", icon: "📋" },
    { id: "IN_PROGRESS", label: "Em Execução", color: "border-blue-500/20 text-blue-400 bg-blue-500/5", icon: "⚡" },
    { id: "APPROVED", label: "Aprovado p/ Cliente", color: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5", icon: "👍" },
    { id: "COMPLETED", label: "Concluído", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5", icon: "✅" }
];

const SQUAD_COLORS: Record<string, string> = {
    'copy': 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    'brand': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    'traffic': 'bg-red-500/10 border-red-500/30 text-red-400',
    'data': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    'hormozi': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    'generico': 'bg-gray-500/10 border-white/10 text-gray-400'
};

export default function KanbanBoardPage() {
    // ─── States ───────────────────────────────────────────────────────────────
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [loadingClients, setLoadingClients] = useState(true);

    const [tasks, setTasks] = useState<any[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedColumn, setExpandedColumn] = useState<string>("PENDING");

    // Form inputs for new task
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newSquad, setNewSquad] = useState("generico");
    const [newDueDate, setNewDueDate] = useState("");
    const [creating, setCreating] = useState(false);

    // Feedback messages
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Carregar clientes da agência
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

    // Carregar tarefas quando trocar de cliente ou carregar base
    useEffect(() => {
        if (selectedClientId) {
            fetchTasks();
        }
    }, [selectedClientId]);

    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await fetch(`/api/agency/tasks?clientId=${selectedClientId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTasks(data);
            }
        } catch (e) {
            console.error("Erro ao carregar tarefas", e);
        } finally {
            setLoadingTasks(false);
        }
    };

    const activeClientName = clients.find(c => c.id === selectedClientId)?.name || "Cliente Selecionado";

    // ─── Criar Tarefa ──────────────────────────────────────────────────────────
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !selectedClientId || creating) return;

        setCreating(true);
        setFeedback(null);

        try {
            const res = await fetch("/api/agency/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription,
                    squadId: newSquad,
                    clientId: selectedClientId,
                    dueDate: newDueDate || undefined
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setFeedback({ type: "success", text: "Tarefa adicionada ao Kanban com sucesso! ✨" });
                setShowCreateModal(false);
                setNewTitle("");
                setNewDescription("");
                setNewSquad("generico");
                setNewDueDate("");
                fetchTasks(); // Recarregar
            } else {
                setFeedback({ type: "error", text: data.error || "Erro ao registrar tarefa." });
            }
        } catch (err) {
            setFeedback({ type: "error", text: "Erro na conexão com o servidor." });
        } finally {
            setCreating(false);
        }
    };

    // ─── Mover Status / Coluna ─────────────────────────────────────────────────
    const handleMoveStatus = async (taskId: string, newStatus: string) => {
        try {
            // Atualização otimista no front
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            if (selectedTask?.id === taskId) {
                setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
            }

            const res = await fetch(`/api/agency/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                // Reverter em caso de falha
                fetchTasks();
                alert(data.error || "Falha ao atualizar status da tarefa.");
            }
        } catch (e) {
            fetchTasks();
            alert("Erro de rede ao movimentar tarefa.");
        }
    };

    // ─── Excluir Tarefa ────────────────────────────────────────────────────────
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta tarefa do Kanban?")) return;

        try {
            const res = await fetch(`/api/agency/tasks/${taskId}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
                setSelectedTask(null);
                setFeedback({ type: "success", text: "Tarefa removida com sucesso!" });
            } else {
                alert(data.error || "Erro ao deletar tarefa.");
            }
        } catch (e) {
            alert("Erro de rede ao remover tarefa.");
        }
    };

    // ─── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <ClipboardList className="text-emerald-500 w-9 h-9" />
                        Quadro de Tasks & Entregas
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">Kanban</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie operacionalmente os planos e entregáveis sugeridos pelos squads de IA.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center max-w-lg w-full shrink-0 justify-end">
                    {/* Seletor de Cliente */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 w-full sm:max-w-xs shrink-0">
                        <Building2 size={16} className="text-emerald-400" />
                        {loadingClients ? (
                            <span className="text-xs text-gray-500">Carregando...</span>
                        ) : (
                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                className="w-full bg-transparent border-none text-sm text-white font-bold outline-none cursor-pointer"
                            >
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id} className="bg-[#0f172a] text-white">
                                        🏢 {c.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <Plus size={14} /> Adicionar Task
                    </button>
                </div>
            </div>

            {/* Alertas de Feedback */}
            {feedback && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 max-w-xl ${
                    feedback.type === "success" 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">{feedback.type === "success" ? "Operação bem-sucedida" : "Erro Operacional"}</p>
                        <p className="mt-1 leading-relaxed">{feedback.text}</p>
                    </div>
                </div>
            )}

            {/* Quadro Kanban Shell */}
            {loadingTasks ? (
                <div className="text-center py-20">
                    <Loader2 className="animate-spin text-emerald-500 mx-auto" size={32} />
                    <p className="text-gray-400 text-xs mt-3">Carregando tarefas operacionais...</p>
                </div>
            ) : (
                <div className="flex flex-row items-stretch gap-5 overflow-x-auto pb-6 select-none min-h-[70vh] scrollbar-thin scrollbar-thumb-white/10">
                    {COLUMNS.map((col) => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        const isExpanded = expandedColumn === col.id;
                        
                        return (
                            <div 
                                key={col.id} 
                                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col relative rounded-[32px] border border-white/10 shadow-xl overflow-hidden bg-white/5 ${
                                    isExpanded ? "w-[346px] min-w-[346px]" : "w-[72px] min-w-[72px] cursor-pointer hover:bg-white/10"
                                }`}
                                onClick={() => {
                                    if (!isExpanded) {
                                        setExpandedColumn(col.id);
                                    }
                                }}
                            >
                                {/* Header da Coluna */}
                                <div 
                                    className={`relative select-none transition-all duration-300 ${
                                        isExpanded 
                                            ? "h-[68px] w-full px-6 py-4 flex items-center justify-between border-b border-white/5" 
                                            : "h-[346px] w-[68px] flex items-center justify-center"
                                    }`}
                                >
                                    {isExpanded ? (
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-lg">{col.icon}</span>
                                                <h3 className={`font-extrabold text-sm uppercase tracking-wider ${col.color.split(' ')[1]}`}>
                                                    {col.label}
                                                </h3>
                                                <span className="bg-white/5 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                                    {colTasks.length}
                                                </span>
                                            </div>
                                            
                                            {/* Collapse button */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Find next column to expand to avoid having none expanded
                                                    const idx = COLUMNS.findIndex(c => c.id === col.id);
                                                    const nextIdx = (idx + 1) % COLUMNS.length;
                                                    setExpandedColumn(COLUMNS[nextIdx].id);
                                                }}
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        // Collapsed Header Layout (Rotated 90 degrees)
                                        <div 
                                            style={{
                                                width: '346px',
                                                height: '68px',
                                                transform: 'rotate(90deg)',
                                                transformOrigin: '34px 34px',
                                            }}
                                            className="absolute top-0 left-0 flex items-center justify-between px-6 py-4 w-full h-full"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-lg rotate-[-90deg]">{col.icon}</span>
                                                <h3 className={`font-extrabold text-sm uppercase tracking-wider ${col.color.split(' ')[1]}`}>
                                                    {col.label}
                                                </h3>
                                                <span className="bg-white/5 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                                    {colTasks.length}
                                                </span>
                                            </div>
                                            
                                            {/* Counter-rotated Expand Arrow */}
                                            <ChevronLeft size={16} className="text-gray-500 rotate-[-90deg]" />
                                        </div>
                                    )}
                                </div>

                                {/* Cards da Coluna */}
                                <div 
                                    className={`flex-1 p-6 space-y-4 overflow-y-auto transition-all duration-300 ${
                                        isExpanded ? "opacity-100 block" : "opacity-0 hidden"
                                    }`}
                                >
                                    {colTasks.length === 0 ? (
                                        <div className="border border-dashed border-white/5 rounded-2xl p-6 text-center text-[10px] text-gray-600 leading-relaxed">
                                            Sem tarefas nesta coluna.
                                        </div>
                                    ) : (
                                        colTasks.map((task) => {
                                            const squadCls = SQUAD_COLORS[task.squadId] || SQUAD_COLORS.generico;
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTask(task);
                                                    }}
                                                    className="bg-[#0b0f1a]/80 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-4 space-y-3 cursor-pointer hover:bg-[#0b0f1a]/60 transition-all duration-200 group"
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className={`text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${squadCls}`}>
                                                            {task.squadId.toUpperCase()}
                                                        </span>
                                                        {task.dueDate && (
                                                            <span className="text-[9px] text-gray-500 flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors leading-tight">
                                                        {task.title.replace(/\[Xquads\]\s*/i, "")}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── MODAL: Adicionar Tarefa ──────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[32px] p-8 shadow-2xl relative space-y-6">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="space-y-1">
                            <h3 className="font-extrabold text-xl">Criar Tarefa no Kanban</h3>
                            <p className="text-xs text-gray-500">Adicione uma ação focada para o cliente {activeClientName}.</p>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Título da Task</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Instalar Meta Pixel no Checkout"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-emerald-500/50"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Especialidade / Squad</label>
                                <select
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl py-3 px-3 text-xs text-white outline-none focus:border-emerald-500/50"
                                    value={newSquad}
                                    onChange={(e) => setNewSquad(e.target.value)}
                                >
                                    <option value="generico">⚙️ Geral / Genérico</option>
                                    <option value="copy">✍️ Copywriting / Redação</option>
                                    <option value="brand">🏷️ Branding / Marca</option>
                                    <option value="traffic">📢 Tráfego Pago / Ads</option>
                                    <option value="data">📊 Growth / Dados</option>
                                    <option value="hormozi">💪 Oferta & Escala</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Data Limite (Prazo)</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-emerald-500/50"
                                    value={newDueDate}
                                    onChange={(e) => setNewDueDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Detalhamento da Entrega</label>
                                <textarea
                                    rows={4}
                                    placeholder="Escreva orientações táticas para que a agência saiba exatamente o que executar..."
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-emerald-500/50 resize-none"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={creating || !newTitle.trim()}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                {creating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                Registrar Task no Quadro
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── DRAWER: Detalhes da Tarefa ───────────────────────────────────── */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
                    {/* Fechar ao clicar fora */}
                    <div className="flex-1" onClick={() => setSelectedTask(null)} />

                    {/* Painel lateral do detalhe */}
                    <div className="w-full max-w-xl bg-[#0f172a] border-l border-white/10 flex flex-col h-full shadow-2xl relative">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${SQUAD_COLORS[selectedTask.squadId] || SQUAD_COLORS.generico}`}>
                                    {selectedTask.squadId.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm leading-none">Detalhamento Operacional</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1.5">Tarefa Kanban</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="p-2 border border-white/10 hover:bg-white/5 rounded-xl transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Corpo com scroll */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Título */}
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-white leading-tight">
                                    {selectedTask.title.replace(/\[Xquads\]\s*/i, "")}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                        <Building2 size={10} /> Client: {activeClientName}
                                    </span>
                                    {selectedTask.dueDate && (
                                        <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                            <Calendar size={10} /> Prazo: {new Date(selectedTask.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Detalhamento de IA / Descrição */}
                            {selectedTask.description && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500">Orientação Técnica Gerada</h4>
                                    <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                                        {selectedTask.description}
                                    </div>
                                </div>
                            )}

                            {/* Seletor Rápido de Colunas no rodapé do detalhe */}
                            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                    <Info size={10} /> Atualizar status no quadro
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {COLUMNS.map((col) => (
                                        <button
                                            key={col.id}
                                            onClick={() => handleMoveStatus(selectedTask.id, col.id)}
                                            className={`px-3 py-2 rounded-xl text-left border text-xs transition-all font-bold ${
                                                selectedTask.status === col.id
                                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                                    : "bg-[#0b0f1a]/40 border-white/5 text-gray-500 hover:text-white"
                                            }`}
                                        >
                                            {selectedTask.status === col.id ? "✓ " : ""} {col.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Ações Inferiores */}
                        <div className="p-6 border-t border-white/5 flex gap-3">
                            <button
                                onClick={() => handleDeleteTask(selectedTask.id)}
                                className="flex-1 py-3 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={14} /> Excluir Tarefa
                            </button>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold transition-all text-center"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
