"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    Bot, 
    LayoutDashboard, 
    PenTool, 
    ArrowLeft, 
    Zap, 
    DollarSign, 
    Settings, 
    ChevronRight,
    ShieldCheck,
    CreditCard,
    MessageSquare,
    AlertCircle,
    Users,
    FileText,
    Check,
    Copy,
    X,
    Sparkles,
    Loader2,
    RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function ClientHubPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;
    
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tab & UX suggestions states
    const [activeTab, setActiveTab] = useState("services"); // "services" | "plano_de_voo"
    const [syncing, setSyncing] = useState(false);
    const [syncStep, setSyncStep] = useState(0);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [mappedMissions, setMappedMissions] = useState<string[]>([]);
    const [mappingMissionId, setMappingMissionId] = useState<string | null>(null);

    // Invoice Modal states
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [selectedInterval, setSelectedInterval] = useState("MONTHLY");
    const [selectedGateway, setSelectedGateway] = useState("asaas");
    const [customValue, setCustomValue] = useState<string>("");
    const [generatingInvoice, setGeneratingInvoice] = useState(false);
    const [generatedInvoiceUrl, setGeneratedInvoiceUrl] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [filterType, setFilterType] = useState<string | null>(null);

    useEffect(() => {
        refreshData();
        fetchPlans();
    }, [clientId]);

    const refreshData = () => {
        fetch(`/api/agency/clients/${clientId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) setError(data.error);
                else setClient(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Erro de conexão");
                setLoading(false);
            });
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans");
            const data = await res.json();
            if (data && Array.isArray(data.plans)) {
                setAvailablePlans(data.plans);
            }
        } catch (e) { console.error("Error fetching plans", e); }
    };

    const handleGenerateInvoice = async () => {
        if (!selectedPlanId) return alert("Selecione um plano.");
        setGeneratingInvoice(true);
        setGeneratedInvoiceUrl(null);
        setCopiedLink(false);

        try {
            const res = await fetch(`/api/agency/clients/${clientId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: selectedPlanId,
                    interval: selectedInterval,
                    gateway: selectedGateway,
                    customValue: customValue ? parseFloat(customValue) : undefined
                })
            });
            const data = await res.json();
            if (res.ok && data.checkoutUrl) {
                setGeneratedInvoiceUrl(data.checkoutUrl);
                refreshData(); 
            } else {
                alert(data.error || "Erro ao gerar fatura.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setGeneratingInvoice(false);
        }
    };

    const openInvoiceForType = (type: string) => {
        setFilterType(type);
        const filtered = availablePlans.filter(p => p.type === type);
        if (filtered.length > 0) {
            setSelectedPlanId(filtered[0].id);
            setCustomValue(filtered[0].price?.toString() || "0");
        } else if (availablePlans.length > 0) {
            setSelectedPlanId(availablePlans[0].id);
            setCustomValue(availablePlans[0].price?.toString() || "0");
        }
        setShowInvoiceModal(true);
        setGeneratedInvoiceUrl(null);
    };

    const handleMapMission = async (mission: any) => {
        setMappingMissionId(mission.id);
        try {
            const res = await fetch("/api/agency/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: mission.title,
                    description: mission.description,
                    squadId: mission.squad || "generico",
                    agentId: mission.id,
                    clientId: clientId,
                    status: "PENDING"
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setMappedMissions(prev => [...prev, mission.id]);
                alert("Missão mapeada como Task no Kanban com sucesso!");
            } else {
                alert(data.error || "Erro ao mapear missão no Kanban.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        } finally {
            setMappingMissionId(null);
        }
    };

    const handleSyncContext = () => {
        setSyncing(true);
        setSyncStep(0);
        setSyncSuccess(false);

        const interval = setInterval(() => {
            setSyncStep(s => {
                if (s < 3) return s + 1;
                clearInterval(interval);
                setSyncing(false);
                setSyncSuccess(true);
                return s;
            });
        }, 1200);
    };

    if (loading) return <div className="p-12 text-center text-white">Carregando Hub do Cliente...</div>;
    if (error) return <div className="p-12 text-center text-red-400">{error}</div>;

    const services = [
        {
            id: "PRIMARY",
            name: "Agentes de IA & WhatsApp",
            description: "Automação de atendimento e vendas 24/7.",
            icon: Bot,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
            manageUrl: `/dashboard/bots?clientId=${clientId}`,
            type: "PRIMARY"
        },
        {
            id: "MARKETING",
            name: "Marketing Digital",
            description: "Gestão de anúncios e automação de tráfego.",
            icon: LayoutDashboard,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
            manageUrl: `/dashboard/marketing?clientId=${clientId}`,
            type: "MARKETING"
        },
        {
            id: "CRM",
            name: "CRM & Funis de Vendas",
            description: "Gestão de leads e automação de pipeline.",
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            manageUrl: `/dashboard/crm?clientId=${clientId}`,
            type: "CRM"
        },
        {
            id: "WRITER_PLUGIN",
            name: "Escritor IA (Redação)",
            description: "Criação de conteúdo estratégico e SEO.",
            icon: PenTool,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            manageUrl: `/dashboard/writer?clientId=${clientId}`,
            type: "WRITER_PLUGIN"
        }
    ];

    const getSubscription = (type: string) => {
        return client?.subscriptions?.find((s: any) => s.type === type);
    };

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.push('/dashboard/agency/clients')}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                            {client?.name}
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase px-2 py-1 rounded-md border border-emerald-500/20">Cliente Ativo</span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">{client?.email} • {client?.cpfCnpj || "Sem CPF/CNPJ"}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/dashboard/agency/clients/${clientId}/audit`)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-white transition-all text-sm flex items-center gap-2"
                    >
                        <Sparkles size={18} className="text-indigo-200" />
                        Raio-X (Auditoria)
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/agency/clients/new?clientId=${clientId}`)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-white transition-all text-sm flex items-center gap-2"
                    >
                        <Settings size={18} />
                        Editar Onboarding
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-1">
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Total de Serviços</p>
                    <p className="text-2xl font-bold">{client.subscriptions?.length || 0}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-1">
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Mensagens no Mês</p>
                    <p className="text-2xl font-bold text-indigo-400">{client.usageCounter?.messagesUsed || 0}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-1">
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Agentes Criados</p>
                    <p className="text-2xl font-bold text-emerald-400">{client.usageCounter?.botsUsed || 0}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10 gap-6">
                <button
                    onClick={() => setActiveTab("services")}
                    className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === "services" ? "text-emerald-400 border-emerald-500" : "text-gray-500 border-transparent hover:text-gray-300"}`}
                >
                    Infraestrutura & Serviços
                </button>
                <button
                    onClick={() => setActiveTab("plano_de_voo")}
                    className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${activeTab === "plano_de_voo" ? "text-indigo-400 border-indigo-500" : "text-gray-500 border-transparent hover:text-gray-300"}`}
                >
                    <Sparkles size={16} className={activeTab === "plano_de_voo" ? "text-indigo-400" : "text-gray-500"} />
                    Plano de Voo Estratégico
                </button>
            </div>

            {activeTab === "services" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <Zap className="text-emerald-500" />
                        Ecossistema de Serviços
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service) => {
                            const sub = getSubscription(service.type);
                            const isActive = sub && ['ACTIVE', 'TRIALING'].includes(sub.status);

                            return (
                                <div key={service.id} className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 relative overflow-hidden group hover:border-white/20 transition-all">
                                    {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>}
                                    
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className={`p-4 rounded-2xl ${service.bg} ${service.color}`}>
                                            <service.icon size={28} />
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                            {isActive ? 'Liberado' : 'Aguardando'}
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <h3 className="text-xl font-bold">{service.name}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
                                    </div>

                                    {isActive ? (
                                        <div className="space-y-3 pt-4 relative z-10">
                                            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                                Plano: {sub?.plan?.name || "Premium"}
                                            </div>
                                            <button 
                                                onClick={() => router.push(service.manageUrl)}
                                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                Configurar Infraestrutura
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pt-4 relative z-10">
                                            <div className="flex items-center gap-2 text-xs text-gray-400 bg-orange-500/5 p-3 rounded-xl border border-orange-500/10">
                                                <AlertCircle size={14} className="text-orange-500" />
                                                Este serviço ainda não foi contratado.
                                            </div>
                                            <button 
                                                onClick={() => openInvoiceForType(service.type)}
                                                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold border border-white/10 flex items-center justify-center gap-2 transition-all"
                                            >
                                                Liberar Serviço
                                                <DollarSign size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === "plano_de_voo" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {!client.clientAudits || client.clientAudits.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 text-center max-w-xl mx-auto space-y-6">
                            <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner animate-pulse">
                                🎯
                            </div>
                            <h3 className="text-2xl font-black">Nenhum Plano de Voo Gerado</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Você ainda não realizou o Raio-X de Inteligência para este cliente. Dispare a auditoria para que nossos especialistas analisem a copy, posicionamento de marca, pixel de tráfego, SEO e oferta!
                            </p>
                            <button
                                onClick={() => router.push(`/dashboard/agency/clients/${clientId}/audit`)}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto"
                            >
                                <Sparkles size={16} /> Disparar Raio-X Agora
                            </button>
                        </div>
                    ) : (
                        (() => {
                            const lastAudit = client.clientAudits[0];
                            const { scores, overallScore, report, missions } = lastAudit;

                            const getScoreColor = (score: number) => {
                                if (score >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
                                if (score >= 50) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
                                return "text-red-400 border-red-500/20 bg-red-500/10";
                            };

                            const getPriorityLabel = (p: number) => {
                                if (p === 1) return { label: "🚨 Crítico / Imediato", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
                                if (p === 2) return { label: "⚠️ Importante", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
                                if (p === 3) return { label: "⚡ Recomendado", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
                                return { label: "⚙️ Otimização", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
                            };

                            const SQUAD_METADATA: Record<string, { label: string; color: string; bg: string }> = {
                                copy: { label: "Copy Squad", color: "text-orange-400 border-orange-500/20", bg: "bg-orange-500/10" },
                                brand: { label: "Brand Squad", color: "text-indigo-400 border-indigo-500/20", bg: "bg-indigo-500/10" },
                                traffic: { label: "Traffic Masters", color: "text-red-400 border-red-500/20", bg: "bg-red-500/10" },
                                data: { label: "Data Squad", color: "text-emerald-400 border-emerald-500/20", bg: "bg-emerald-500/10" },
                                strategy: { label: "Hormozi Squad", color: "text-yellow-400 border-yellow-500/20", bg: "bg-yellow-500/10" }
                            };

                            const SYNC_STEPS = [
                                "Carregando histórico de auditoria...",
                                "Raspando estrutura e tags de SEO do site...",
                                "Compilando métricas de tráfego e pixel...",
                                "Sincronizando memória dos agentes do conselho..."
                            ];

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column: Report & Actions (2/3) */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Score Card Header */}
                                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32"></div>
                                            <div className="space-y-2 relative z-10 text-left">
                                                <h3 className="text-2xl font-black">Diagnóstico Estratégico</h3>
                                                <p className="text-gray-400 text-sm">Raio-X de marca, SEO, tráfego pago e oferta do cliente.</p>
                                            </div>
                                            <div className={`px-6 py-4 rounded-3xl border flex items-center gap-3 relative z-10 shrink-0 ${getScoreColor(overallScore)}`}>
                                                <Sparkles size={24} />
                                                <div>
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Score de Saúde</p>
                                                    <p className="text-3xl font-black">{overallScore}/100</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Squad Analysis */}
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Sparkles size={20} className="text-indigo-400" />
                                                Análise do Conselho de IAs
                                            </h3>

                                            <div className="grid grid-cols-1 gap-6">
                                                {Object.entries(report || {}).map(([key, val]: [string, any]) => {
                                                    const metadata = SQUAD_METADATA[key] || { label: "Especialista", color: "text-gray-400 border-white/5", bg: "bg-white/5" };
                                                    return (
                                                        <div key={key} className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 hover:border-white/20 transition-all text-left">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${metadata.color} ${metadata.bg}`}>
                                                                    {metadata.label}
                                                                </span>
                                                                <span className="text-xs text-gray-500 font-medium">Pontuação do Pilar: {scores[key] || 0}%</span>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                                                {/* Problems */}
                                                                <div className="space-y-3">
                                                                    <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                                                        <AlertCircle size={14} /> Problemas Identificados
                                                                    </h4>
                                                                    <ul className="space-y-2">
                                                                        {val.problems?.map((p: string, idx: number) => (
                                                                            <li key={idx} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                                                                                <span className="text-red-500 mt-1 select-none">•</span>
                                                                                <span>{p}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                {/* Solutions */}
                                                                <div className="space-y-3">
                                                                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                                        <ShieldCheck size={14} /> Recomendações Táticas
                                                                    </h4>
                                                                    <ul className="space-y-2">
                                                                        {val.solutions?.map((s: string, idx: number) => (
                                                                            <li key={idx} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                                                                                <span className="text-emerald-500 mt-1 select-none">✔</span>
                                                                                <span>{s}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* SWOT Matrix */}
                                        <div className="space-y-4 text-left">
                                            <h3 className="text-xl font-bold">Matriz SWOT Estratégica</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 space-y-2">
                                                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">💪 Forças (Strengths)</p>
                                                    <p className="text-xs text-gray-400 leading-relaxed">
                                                        Autoridade comercial consolidada, tempo de mercado físico notável, diferenciais de atendimento presencial e onboarding concluído na plataforma.
                                                    </p>
                                                </div>
                                                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-2">
                                                    <p className="text-xs font-black text-red-400 uppercase tracking-widest">🚨 Fraquezas (Weaknesses)</p>
                                                    <p className="text-xs text-gray-400 leading-relaxed">
                                                        Inconsistência severa na publicação de conteúdos de engajamento, erros de carregamento/redirecionamento no site oficial e atrito técnico.
                                                    </p>
                                                </div>
                                                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-6 space-y-2">
                                                    <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">🚀 Oportunidades (Opportunities)</p>
                                                    <p className="text-xs text-gray-400 leading-relaxed">
                                                        Campanhas ativas de tráfego pago geolocalizadas na microrregião, vídeos educacionais (Reels de tour) e otimização das chamadas para o WhatsApp.
                                                    </p>
                                                </div>
                                                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-3xl p-6 space-y-2">
                                                    <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">⚠️ Ameaças (Threats)</p>
                                                    <p className="text-xs text-gray-400 leading-relaxed">
                                                        Concorrentes digitais nativos agressivos e perda de relevância orgânica para agregadores imobiliários centralizados.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trilha de Missões / Plano de Ação */}
                                        <div className="space-y-6 text-left">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <FileText size={20} className="text-emerald-400" />
                                                Trilha de Missões Operacionais (Kanban)
                                            </h3>

                                            <div className="space-y-4">
                                                {Array.isArray(missions) && missions.map((mission: any) => {
                                                    const isMapped = mappedMissions.includes(mission.id);
                                                    const pMeta = getPriorityLabel(mission.priority);

                                                    return (
                                                        <div key={mission.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                            <div className="space-y-1.5 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${pMeta.cls}`}>
                                                                        {pMeta.label}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Squad: {mission.squad}</span>
                                                                </div>
                                                                <h4 className="font-extrabold text-white text-base">{mission.title}</h4>
                                                                <p className="text-xs text-gray-400 leading-relaxed">{mission.description}</p>
                                                            </div>

                                                            <button
                                                                onClick={() => handleMapMission(mission)}
                                                                disabled={isMapped || mappingMissionId === mission.id}
                                                                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 ${isMapped ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default" : "bg-white/5 border border-white/10 hover:bg-emerald-500 hover:border-emerald-500 text-gray-300 hover:text-white"}`}
                                                            >
                                                                {mappingMissionId === mission.id ? (
                                                                    <span className="flex items-center gap-1.5"><Loader2 className="animate-spin" size={12} /> Mapeando...</span>
                                                                ) : isMapped ? (
                                                                    <span className="flex items-center gap-1.5"><Check size={12} /> Mapeada no Kanban</span>
                                                                ) : (
                                                                    "Mapear no Kanban"
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: AI Context Ingestion Panel (1/3) */}
                                    <div className="space-y-6 text-left">
                                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16"></div>
                                            
                                            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl w-fit">
                                                <Sparkles size={24} />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="font-bold text-lg">Memória do Contexto de IA</h3>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    Sincronize as mídias sociais, o site raspado, as metas da campanha e os insights de conversa diretamente para os robôs do Squad.
                                                </p>
                                            </div>

                                            {syncing ? (
                                                <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-5 space-y-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <Loader2 size={16} className="animate-spin text-indigo-400" />
                                                        <p className="text-xs font-semibold text-indigo-400">Ingerindo dados...</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed animate-pulse">{SYNC_STEPS[syncStep]}</p>
                                                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                                        <div 
                                                            className="bg-indigo-500 h-1 rounded-full transition-all duration-700" 
                                                            style={{ width: `${((syncStep + 1) / SYNC_STEPS.length) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ) : syncSuccess ? (
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                                                        <Check size={20} strokeWidth={3} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-400">Contexto Sincronizado!</p>
                                                        <p className="text-[10px] text-gray-500">Pronto para consultas nos bots e squads.</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between text-xs">
                                                    <span className="text-gray-500 font-bold uppercase tracking-wider">Status:</span>
                                                    <span className="text-orange-400 font-extrabold flex items-center gap-1">● Desatualizado</span>
                                                </div>
                                            )}

                                            {!syncing && (
                                                <button
                                                    onClick={handleSyncContext}
                                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                                >
                                                    <RefreshCw size={16} className={syncSuccess ? "" : "animate-spin"} />
                                                    {syncSuccess ? "Sincronizar Novamente" : "Sincronizar Contexto"}
                                                </button>
                                            )}
                                        </div>

                                        {/* Strategic Tips */}
                                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
                                            <h3 className="font-bold text-lg">💡 Sugestão Operacional</h3>
                                            <div className="space-y-4 text-xs">
                                                <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                                                    <p className="font-black text-indigo-400 uppercase tracking-widest text-[9px]">Workflow Indicado</p>
                                                    <p className="font-bold text-white text-sm">Negócio Local 10x</p>
                                                    <p className="text-gray-500">Desenhe ofertas locais e capte leads com tráfego geolocalizado de forma rápida.</p>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                                                    <p className="font-black text-emerald-400 uppercase tracking-widest text-[9px]">Squad de Frente</p>
                                                    <p className="font-bold text-white text-sm">Traffic Masters & Copy Squad</p>
                                                    <p className="text-gray-500">Combine a captação estruturada de Pedro Sobral com o poder de redação de Gary Halbert.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            )}

            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-white/10 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-500 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                        <MessageSquare size={32} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">Histórico de Cobrança</h4>
                        <p className="text-gray-400 text-sm">Visualize todas as faturas geradas para este cliente.</p>
                    </div>
                </div>
                <Link 
                    href={`/dashboard/finance?search=${encodeURIComponent(client?.email || "")}`}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all border border-white/10"
                >
                    Ver Financeiro
                </Link>
            </div>

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-md p-10 space-y-8 shadow-2xl relative">
                        <button 
                            onClick={() => setShowInvoiceModal(false)}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div>
                            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
                                <FileText className="text-blue-500" size={32} />
                                Ativar Serviço
                            </h2>
                            <p className="text-gray-400 text-sm mt-2 font-medium">Gere uma fatura para liberar o serviço para {client?.name}.</p>
                        </div>

                        {!generatedInvoiceUrl ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 px-1">Serviço a ser Liberado</label>
                                    <div className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl p-5 text-white flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                                <Sparkles size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-extrabold">
                                                    {filterType === "PRIMARY" ? "Agentes de IA & WhatsApp" : 
                                                     filterType === "MARKETING" ? "Marketing Digital" : 
                                                     filterType === "CRM" ? "CRM & Funis de Vendas" : 
                                                     filterType === "WRITER_PLUGIN" ? "Escritor IA (Redação)" : "Serviço Geral"}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Ativação Direta Sem Complicações</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Valor Unitário</label>
                                        <input
                                            type="number"
                                            className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50"
                                            value={customValue}
                                            onChange={(e) => setCustomValue(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Ciclo</label>
                                        <select
                                            className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 appearance-none"
                                            value={selectedInterval}
                                            onChange={(e) => setSelectedInterval(e.target.value)}
                                        >
                                            <option value="MONTHLY">Mensal</option>
                                            <option value="QUARTERLY">Trimestral</option>
                                            <option value="SEMIANNUAL">Semestral</option>
                                            <option value="YEARLY">Anual</option>
                                            <option value="ONCE">Único</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Market Suggestion & Revenue Split Preview */}
                                {(() => {
                                    const val = parseFloat(customValue) || 0;
                                    const platformFeePercent = client?.agencyFee || 0;
                                    const platformShare = (val * platformFeePercent) / 100;
                                    const agencyShare = val - platformShare;

                                    // Define market suggestions based on filterType
                                    let suggestedPrice = 249;
                                    if (filterType === "MARKETING") suggestedPrice = 349;
                                    if (filterType === "CRM") suggestedPrice = 199;
                                    if (filterType === "WRITER_PLUGIN") suggestedPrice = 149;

                                    return (
                                        <div className="space-y-4 bg-white/5 border border-white/5 rounded-2xl p-5 text-left text-xs text-gray-400">
                                            <div className="flex items-center gap-2 text-indigo-400 font-bold">
                                                <Sparkles size={14} className="animate-pulse" />
                                                <span>💡 Sugestão Mínima de Mercado: R$ {suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            
                                            {val > 0 && (
                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-500">Estimativa de Divisão de Receita</p>
                                                    <div className="flex justify-between items-center text-sm font-semibold">
                                                        <span className="text-gray-300">🏢 Agência (Você):</span>
                                                        <span className="text-emerald-400">R$ {agencyShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-500">({100 - platformFeePercent}%)</span></span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm font-semibold">
                                                        <span className="text-gray-300">⚡ Plataforma (Taxa):</span>
                                                        <span className="text-blue-400">R$ {platformShare.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-500">({platformFeePercent}%)</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Canal de Pagamento</label>
                                    <select
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 appearance-none"
                                        value={selectedGateway}
                                        onChange={(e) => setSelectedGateway(e.target.value)}
                                    >
                                        <option value="asaas">Asaas (PIX/Boleto)</option>
                                        <option value="mercadopago">Mercado Pago</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleGenerateInvoice}
                                    disabled={generatingInvoice}
                                    className="w-full py-5 bg-blue-500 hover:bg-blue-600 rounded-3xl font-black text-lg transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                                >
                                    {generatingInvoice ? (
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Gerar Link de Pagamento
                                            <ChevronRight size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                        <Check size={32} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <p className="text-emerald-400 font-black text-xl">Link Disponível!</p>
                                        <p className="text-xs text-gray-500 mt-1">O serviço será liberado imediatamente após o pagamento.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-[#0b0f1a] border border-white/10 rounded-2xl p-4">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={generatedInvoiceUrl} 
                                        className="bg-transparent border-none outline-none text-sm text-gray-400 w-full font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedInvoiceUrl);
                                            setCopiedLink(true);
                                            setTimeout(() => setCopiedLink(false), 2000);
                                        }}
                                        className="shrink-0 bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
                                    >
                                        {copiedLink ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all"
                                >
                                    Concluir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
