"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Bot, Zap, Sparkles, Building2, Loader2, ArrowLeft, ChevronRight,
    Printer, Share2, ClipboardList, CheckCircle2, AlertTriangle, ShieldCheck, Play, X
} from "lucide-react";

// Pre-defined workflows for display
const WORKFLOW_CARDS = [
    {
        id: "vsl-launch",
        name: "Campanha de Lançamento (VSL + Branding + Anúncios)",
        description: "Sequencia Gary Halbert (Copy), Marty Neumeier (Branding) e Pedro Sobral (Tráfego) para criar um roteiro de VSL persuasivo, injetar posicionamento disruptivo de marca e criar 3 anúncios de escala.",
        icon: "🚀",
        squads: ["Copy Squad", "Brand Squad", "Traffic Masters"],
        timeEstimate: "30-40 segundos"
    },
    {
        id: "local-funnel",
        name: "Funil de Atração Local (Oferta + Storytelling + Criativos)",
        description: "Sequencia Alex Hormozi (Oferta), Joseph Campbell (Storytelling) e Gary Halbert (Copy) para criar uma Oferta Grand Slam irresistível, estruturar uma jornada mítica de marca e redigir criativos para WhatsApp.",
        icon: "🎯",
        squads: ["Hormozi Squad", "Storytelling", "Copy Squad"],
        timeEstimate: "35-45 segundos"
    },
    {
        id: "sales-page",
        name: "Página de Vendas de Alta Conversão (Copy + Design + Preço)",
        description: "Sequencia Gary Halbert (Copy), Brad Frost (Design de Interface) e Alex Hormozi (Estrategista) para escrever a copy persuasiva, definir os grids/UX do wireframe e modelar checkout/upsells.",
        icon: "💻",
        squads: ["Copy Squad", "Design Squad", "Hormozi Squad"],
        timeEstimate: "30-45 segundos"
    }
];

export default function AgencyWorkflowsPage() {
    const router = useRouter();

    // ─── State ────────────────────────────────────────────────────────────────
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [loadingClients, setLoadingClients] = useState(true);

    const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
    const [running, setRunning] = useState(false);
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [currentStepName, setCurrentStepName] = useState("");
    const [runResults, setRunResults] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<number>(1);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const consoleEndRef = useRef<HTMLDivElement>(null);

    // WhatsApp review configurations
    const [confirmBeforeSend, setConfirmBeforeSend] = useState<boolean>(true);
    const [showWpModal, setShowWpModal] = useState(false);
    const [wpMessageContent, setWpMessageContent] = useState("");

    // Load confirm choice on mount
    useEffect(() => {
        const saved = localStorage.getItem("workflows_confirm_whatsapp");
        if (saved !== null) {
            setConfirmBeforeSend(saved === "true");
        }
    }, []);

    const handleWpDispatchInitiate = () => {
        if (!runResults) return;
        const formattedText = runResults.map((r: any) => `*${r.agentName} (${r.agentRole}):*\n${r.output}`).join('\n\n');
        if (confirmBeforeSend) {
            setWpMessageContent(formattedText);
            setShowWpModal(true);
        } else {
            handleSendWhatsApp(formattedText);
        }
    };

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

    // Rolar console de progresso para o final
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [progressLogs]);

    const activeClientName = clients.find(c => c.id === selectedClientId)?.name || "Cliente Selecionado";

    // ─── Executar Workflow ─────────────────────────────────────────────────────
    const handleRunWorkflow = async (workflow: any) => {
        if (!selectedClientId) {
            alert("Por favor, selecione o cliente (contexto do negócio) antes de executar o Workflow.");
            return;
        }

        setSelectedWorkflow(workflow);
        setRunning(true);
        setRunResults(null);
        setActionMessage(null);
        setProgressLogs([]);

        // Sequência simulada de logs no console cibernético
        const logs = [
            `[${new Date().toLocaleTimeString()}] ⚙️ Iniciando sequenciador de inteligência multi-agente xquads...`,
            `[${new Date().toLocaleTimeString()}] 🏢 Carregando contexto de negócio de "${activeClientName}" do banco de dados...`,
            `[${new Date().toLocaleTimeString()}] 🔍 Cruzando metadados de onboarding, produtos e último Raio-X...`
        ];

        setProgressLogs([...logs]);

        // Passo 1
        setTimeout(() => {
            setCurrentStepName(workflow.squads[0]);
            setProgressLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] 🤖 Passo 1: Invocando especialista do ${workflow.squads[0]}...`,
                `[${new Date().toLocaleTimeString()}] 🧠 Analisando nicho comercial e redigindo copy/oferta inicial...`
            ]);
        }, 1500);

        // Passo 2
        setTimeout(() => {
            setCurrentStepName(workflow.squads[1]);
            setProgressLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] ✅ Passo 1 concluído com sucesso. Salvando saída em buffer de rede...`,
                `[${new Date().toLocaleTimeString()}] 🤖 Passo 2: Invocando estrategista do ${workflow.squads[1]}...`,
                `[${new Date().toLocaleTimeString()}] 🧠 Recebendo saída do Passo 1, cruzando dados e refinando posicionamento...`
            ]);
        }, 8000);

        // Passo 3
        setTimeout(() => {
            setCurrentStepName(workflow.squads[2]);
            setProgressLogs(prev => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] ✅ Passo 2 concluído. Mesclando diretrizes de marca...`,
                `[${new Date().toLocaleTimeString()}] 🤖 Passo 3: Invocando especialista do ${workflow.squads[2]}...`,
                `[${new Date().toLocaleTimeString()}] 🧠 Processando criativos de mídia e estruturando ofertas finais...`
            ]);
        }, 16000);

        try {
            const res = await fetch("/api/agency/workflows/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    workflowId: workflow.id,
                    clientId: selectedClientId
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setTimeout(() => {
                    setProgressLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] ✅ Passo 3 concluído com sucesso!`,
                        `[${new Date().toLocaleTimeString()}] ✨ Agregando entregável executivo final White-Label...`,
                        `[${new Date().toLocaleTimeString()}] 🚀 Processamento concluído em ${((Date.now() - startTime) / 1000).toFixed(1)}s. Sinal verde de integridade!`
                    ]);
                    setRunResults(data.results);
                    setRunning(false);
                    setActiveTab(1);
                }, 24000);
            } else {
                setProgressLogs(prev => [
                    ...prev,
                    `❌ ERRO CRÍTICO: ${data.error || "A IA não conseguiu completar o fluxo."}`
                ]);
                setRunning(false);
            }
        } catch (e) {
            setProgressLogs(prev => [
                ...prev,
                `❌ ERRO DE CONEXÃO: Falha ao se conectar com os squads de inteligência.`
            ]);
            setRunning(false);
        }

        const startTime = Date.now();
    };

    // ─── Ação: Enviar WhatsApp ────────────────────────────────────────────────
    const handleSendWhatsApp = async (content: string) => {
        setActionLoading("whatsapp");
        setActionMessage(null);

        try {
            const res = await fetch("/api/agency/deliverables/whatsapp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    content
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setActionMessage({ type: "success", text: `Entregável enviado com sucesso para o WhatsApp de ${activeClientName}! 📱` });
            } else {
                setActionMessage({ type: "error", text: data.error || "Erro ao despachar WhatsApp." });
            }
        } catch (e) {
            setActionMessage({ type: "error", text: "Falha de rede ao despachar entregável." });
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Ação: Criar Task Kanban ──────────────────────────────────────────────
    const handleCreateTask = async (stepResult: any) => {
        setActionLoading("task");
        setActionMessage(null);

        try {
            const res = await fetch("/api/agency/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    title: `[Xquads] ${stepResult.agentName}: ${selectedWorkflow?.name}`,
                    description: `Entregável estratégico gerado pelo especialista ${stepResult.agentName} (${stepResult.agentRole}):\n\n${stepResult.output}`,
                    squadId: selectedWorkflow?.id || 'generico',
                    agentId: stepResult.agentName.toLowerCase().replace(/\s+/g, '-'),
                    status: 'PENDING'
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setActionMessage({ type: "success", text: `Tarefa operacional adicionada com sucesso no quadro Kanban de ${activeClientName}! 📋` });
            } else {
                setActionMessage({ type: "error", text: data.error || "Erro ao registrar tarefa." });
            }
        } catch (e) {
            setActionMessage({ type: "error", text: "Falha de rede ao registrar tarefa no Kanban." });
        } finally {
            setActionLoading(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // ─── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white relative print:bg-white print:text-black">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none no-print" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none no-print" />

            {/* Cabeçalho da página */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 no-print">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Zap className="text-emerald-500 w-9 h-9" />
                        Sequenciador de Workflows de IA
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">Multi-Agente</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Execute tarefas complexas em cadeia sequenciando os maiores consultores de marketing do mundo.</p>
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
                    ) : (
                        <select
                            value={selectedClientId}
                            aria-label="Selecione o Cliente parceiro"
                            onChange={(e) => {
                                setSelectedClientId(e.target.value);
                                setRunResults(null);
                            }}
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

            {/* Impressão: Banner Executivo White-Label */}
            {runResults && (
                <div className="hidden print:block border-b-2 border-gray-300 pb-8 mb-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 bg-emerald-600 rounded-sm flex items-center justify-center text-white text-[9px] font-black">W</span>
                                <span className="text-xs font-black tracking-widest text-gray-500 uppercase">ConextBot Workflows</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none print-title">RELATÓRIO ESTRATÉGICO MULTI-AGENTE</h2>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{selectedWorkflow?.name}</p>
                        </div>
                        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-right space-y-1.5 shrink-0">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Status do Fluxo</p>
                            <div className="flex items-center gap-2 justify-end text-emerald-600">
                                <ShieldCheck size={18} />
                                <span className="text-sm font-black">100% HOMOLOGADO</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] text-gray-400 font-black uppercase">Cliente Parceiro</p>
                            <p className="text-xs font-bold text-gray-800 mt-1">{activeClientName}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] text-gray-400 font-black uppercase">Canal de Entrega</p>
                            <p className="text-xs font-bold text-gray-800 mt-1">Garantia Digital White-Label</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                            <p className="text-[9px] text-gray-400 font-black uppercase">Data de Geração</p>
                            <p className="text-xs font-bold text-gray-800 mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── RENDER: Modo Processando / Console ────────────────────────────── */}
            {running && (
                <div className="bg-[#0f172a] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-2xl relative no-print">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center relative">
                                <Loader2 className="animate-spin text-emerald-500" size={24} />
                                <Sparkles className="text-emerald-400 absolute -top-1 -right-1 animate-pulse" size={12} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-lg leading-tight">{selectedWorkflow?.name}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    Executando Passo {progressLogs.filter(l => l.includes("Passo")).length} de 3
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#0b0f1a] border border-white/5 rounded-xl px-4 py-2 text-xs shrink-0 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-gray-400">Ativo:</span>
                            <span className="text-emerald-400 font-bold">{currentStepName || "Iniciando..."}</span>
                        </div>
                    </div>

                    {/* Console cibernético de logs */}
                    <div className="bg-black/80 rounded-2xl border border-white/5 p-6 font-mono text-xs text-emerald-400/90 h-80 overflow-y-auto space-y-2.5 shadow-inner">
                        {progressLogs.map((log, idx) => (
                            <p key={idx} className="leading-relaxed whitespace-pre-wrap">
                                {log}
                            </p>
                        ))}
                        <div ref={consoleEndRef} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-600">
                        <span>Console Terminal Operacional xquads CLI v1.2</span>
                        <span>Não feche esta página enquanto a IA processa o sequenciamento profundo.</span>
                    </div>
                </div>
            )}

            {/* ─── RENDER: Resultados de Sucesso ─────────────────────────────────── */}
            {runResults && !running && (
                <div className="space-y-6">
                    {/* Alertas e Mensagens de Feedback */}
                    {actionMessage && (
                        <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 no-print ${
                            actionMessage.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">{actionMessage.type === "success" ? "Operação Concluída" : "Falha na Ação"}</p>
                                <p className="mt-1 leading-relaxed">{actionMessage.text}</p>
                            </div>
                        </div>
                    )}

                    {/* Barra de Menu Superior do Resultado */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5 no-print">
                        <button
                            onClick={() => setRunResults(null)}
                            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 font-bold transition-all text-sm group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Voltar para os Workflows
                        </button>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-end">
                            {/* Toggle WhatsApp Config */}
                            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs shrink-0 select-none">
                                <span className="text-gray-400 font-semibold">Revisar antes de enviar no WhatsApp</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newVal = !confirmBeforeSend;
                                        setConfirmBeforeSend(newVal);
                                        localStorage.setItem("workflows_confirm_whatsapp", String(newVal));
                                    }}
                                    className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none shrink-0 ${confirmBeforeSend ? 'bg-emerald-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 ${confirmBeforeSend ? 'left-5' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Printer size={14} /> Exportar PDF
                                </button>
                                <button
                                    onClick={handleWpDispatchInitiate}
                                    disabled={!!actionLoading}
                                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                                >
                                    {actionLoading === "whatsapp" ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
                                    Enviar para WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Estrutura das Abas do Sequenciador */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Selector Lateral de Passos */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-fit space-y-4 no-print">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Passos do Fluxo</h3>
                            <div className="flex flex-col gap-2">
                                {runResults.map((r: any) => (
                                    <button
                                        key={r.step}
                                        onClick={() => setActiveTab(r.step)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                                            activeTab === r.step
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-white font-bold"
                                                : "bg-[#0b0f1a]/40 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                            activeTab === r.step ? "bg-emerald-500 text-white" : "bg-white/5 text-gray-500"
                                        }`}>
                                            {r.agentEmoji}
                                        </div>
                                        <div>
                                            <p className="text-xs leading-none">Passo {r.step}</p>
                                            <p className="text-[10px] opacity-75 mt-1">{r.agentName}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visualizador de Conteúdo Principal */}
                        <div className="lg:col-span-3 space-y-6">
                            {runResults.map((r: any) => {
                                if (activeTab !== r.step) return null;
                                return (
                                    <div key={r.step} className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 print:bg-transparent print:border-none print:p-0">
                                        <div className="flex justify-between items-start pb-4 border-b border-white/5 print:border-b-2 print:border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="text-4xl p-2 bg-white/5 border border-white/10 rounded-xl print:bg-gray-100">{r.agentEmoji}</div>
                                                <div>
                                                    <h3 className="font-extrabold text-xl print-title">{r.agentName}</h3>
                                                    <p className="text-xs text-emerald-400 font-medium mt-1 print-text">{r.agentRole} · Passo {r.step} do Sequenciador</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleCreateTask(r)}
                                                disabled={!!actionLoading}
                                                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-gray-300 rounded-xl font-bold transition-all flex items-center gap-1.5 no-print disabled:opacity-50"
                                            >
                                                {actionLoading === "task" ? <Loader2 className="animate-spin" size={12} /> : <ClipboardList size={14} />}
                                                Transformar em Task no Kanban
                                            </button>
                                        </div>

                                        <div className="bg-[#0b0f1a]/50 border border-white/5 rounded-2xl p-6 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans print:bg-transparent print:text-black print:p-0">
                                            {r.output}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── RENDER: Grid de Seleção de Workflows ───────────────────────────── */}
            {!running && !runResults && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <Sparkles className="text-emerald-500" size={20} />
                            Selecione o Workflow de Elite para Iniciar
                        </h2>

                        <div className="space-y-6">
                            {WORKFLOW_CARDS.map((flow) => (
                                <div
                                    key={flow.id}
                                    className="bg-white/5 border border-white/10 rounded-[32px] p-6 hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
                                >
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl p-3 bg-white/5 border border-white/10 rounded-2xl">{flow.icon}</div>
                                            <div>
                                                <h3 className="font-extrabold text-lg leading-tight group-hover:text-emerald-400 transition-colors">{flow.name}</h3>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Tempo estimado: {flow.timeEstimate}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed max-w-xl">{flow.description}</p>
                                        
                                        {/* Cadeia de Squads */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                            {flow.squads.map((sq, i) => (
                                                <span key={i} className="text-[9px] px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase rounded-full">
                                                    {i + 1}. {sq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRunWorkflow(flow)}
                                        className="w-full md:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
                                    >
                                        <Play size={14} /> Executar Workflow
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-[#0f172a] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-xl">
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-white">
                                <Zap size={22} className="text-emerald-400" />
                            </div>
                            <h3 className="font-bold text-lg leading-snug">Como funcionam os Workflows em Cadeia?</h3>
                            
                            <div className="space-y-4 text-xs leading-relaxed text-gray-400">
                                <div className="flex gap-2">
                                    <span className="text-emerald-400 font-bold shrink-0">1.</span>
                                    <p>O sistema carrega automaticamente os dados de produtos, nicho e o último Raio-X do cliente selecionado no banco.</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-emerald-400 font-bold shrink-0">2.</span>
                                    <p>O primeiro especialista do fluxo analisa o briefing e redige a estrutura estratégica inicial.</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-emerald-400 font-bold shrink-0">3.</span>
                                    <p>O segundo especialista do fluxo recebe a saída do primeiro passo e a refina sob sua própria metodologia de elite.</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-emerald-400 font-bold shrink-0">4.</span>
                                    <p>O terceiro especialista finaliza gerando criativos operacionais e precificação.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: Revisar e Editar Mensagem WhatsApp ──────────────────────── */}
            {showWpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
                    <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[32px] p-8 shadow-2xl relative flex flex-col max-h-[85vh] space-y-6 animate-fade-in">
                        <button
                            onClick={() => setShowWpModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="space-y-1">
                            <h3 className="font-extrabold text-xl flex items-center gap-2">
                                <Share2 size={20} className="text-emerald-400" />
                                Revisar Entregável Estratégico
                            </h3>
                            <p className="text-xs text-gray-500">Edite ou ajuste o texto estratégico final antes de disparar diretamente para o WhatsApp de {activeClientName}.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[250px]">
                            <textarea
                                value={wpMessageContent}
                                onChange={(e) => setWpMessageContent(e.target.value)}
                                placeholder="Revise ou edite a mensagem do entregável estratégico..."
                                aria-label="Conteúdo da mensagem do WhatsApp"
                                className="w-full h-full min-h-[250px] bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-5 text-xs text-gray-300 outline-none focus:border-emerald-500/50 resize-none font-sans leading-relaxed"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => setShowWpModal(false)}
                                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold transition-all text-center"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    handleSendWhatsApp(wpMessageContent);
                                    setShowWpModal(false);
                                }}
                                disabled={!!actionLoading}
                                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                            >
                                {actionLoading === "whatsapp" ? <Loader2 className="animate-spin" size={14} /> : <Share2 size={14} />}
                                Confirmar e Enviar no WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
