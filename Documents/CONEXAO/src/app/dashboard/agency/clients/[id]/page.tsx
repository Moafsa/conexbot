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
    X
} from "lucide-react";
import Link from "next/link";

export default function ClientHubPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;
    
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            color: "text-purple-400",
            bg: "bg-purple-400/10",
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
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold border border-white/10 transition-all text-sm flex items-center gap-2">
                        <Settings size={18} />
                        Editar Dados
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

            <div className="space-y-6">
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

            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Plano Estratégico</label>
                                    <select
                                        className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-blue-500/50 appearance-none"
                                        value={selectedPlanId}
                                        onChange={(e) => setSelectedPlanId(e.target.value)}
                                    >
                                        <option value="" disabled>Escolha um plano...</option>
                                        {availablePlans
                                            .filter(p => !filterType || p.type === filterType)
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>
                                            ))
                                        }
                                    </select>
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
