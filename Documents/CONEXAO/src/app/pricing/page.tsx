"use client";

import { Check, Zap, CreditCard, Building, Globe, Loader2, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const GATEWAYS = [
    { id: 'asaas', name: 'Asaas', icon: Building, desc: "Pix e Boleto" },
    { id: 'stripe', name: 'Stripe', icon: Globe, desc: "Cartão Internacional" },
    { id: 'mercadopago', name: 'Mercado Pago', icon: CreditCard, desc: "Pix e Cartão BR" },
];

export default function PricingPage() {
    const [selectedGateway, setSelectedGateway] = useState('asaas');
    const [loading, setLoading] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [interval, setInterval] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'>('MONTHLY');
    const { data: session, status } = useSession();
    const router = useRouter();
    const [availableGateways, setAvailableGateways] = useState<string[]>(['asaas']);
    const [activeTab, setActiveTab] = useState<string>('');
    const [availableTabs, setAvailableTabs] = useState<any[]>([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch(`/api/plans?_t=${Date.now()}`);
                const data = await res.json();
                
                let fetchedPlans: any[] = [];
                let activeBots = 0;

                if (data && Array.isArray(data.plans)) {
                    fetchedPlans = data.plans;
                    activeBots = data.activeBots || 0;
                    if (data.gateways && Array.isArray(data.gateways)) {
                        setAvailableGateways(data.gateways);
                        if (!data.gateways.includes(selectedGateway)) {
                            setSelectedGateway(data.gateways[0] || 'asaas');
                        }
                    }
                }

                // Group plans by Product Catalog
                const groups: Record<string, any[]> = {};
                fetchedPlans.forEach(p => {
                    const catalogName = p.productCatalog?.name || 'Geral';
                    if (!groups[catalogName]) groups[catalogName] = [];
                    groups[catalogName].push(p);
                });

                const tabs = Object.keys(groups).map(name => ({
                    id: name,
                    label: name.replace(/_/g, ' '),
                    plans: groups[name]
                }));

                setAvailableTabs(tabs);
                if (tabs.length > 0 && !activeTab) {
                    setActiveTab(tabs[0].id);
                }

                setPlans(fetchedPlans);
            } catch (error) {
                console.error("Failed to fetch plans");
            }
        };
        fetchPlans();
    }, []);

    const currentTabPlans = availableTabs.find(t => t.id === activeTab)?.plans || [];

    const handleCheckout = async (plan: string) => {
        if (status === 'unauthenticated' || !session) {
            router.push(`/auth/register?planId=${plan}&interval=${interval}&gateway=${selectedGateway}`);
            return;
        }

        setLoading(plan);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: plan,
                    interval: interval,
                    gateway: selectedGateway,
                    tenantId: (session?.user as any)?.id
                })
            });

            const data = await res.json();

            if (res.ok && data.checkoutUrl) {
                window.open(data.checkoutUrl, '_blank');
                router.push('/dashboard/finance');
            } else {
                alert("Erro ao iniciar pagamento: " + (data.error || 'Unknown Error'));
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão com o servidor de pagamentos.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-20">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <Link href={status === 'unauthenticated' ? "/" : "/dashboard"} className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← {status === 'unauthenticated' ? "Voltar para Início" : "Voltar para Dashboard"}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-600 uppercase tracking-tighter">
                        Escolha sua Solução
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto italic">
                        Selecione o serviço ideal para o momento do seu negócio.
                    </p>

                    {/* Service Tabs */}
                    <div className="flex justify-center mt-10">
                        <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            {availableTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center mt-6">
                        <div className="bg-white/5 p-1 flex rounded-xl border border-white/10">
                            {[
                                { id: 'MONTHLY', label: 'Mensal' },
                                { id: 'QUARTERLY', label: 'Trimestral' },
                                { id: 'SEMIANNUAL', label: 'Semestral' },
                                { id: 'YEARLY', label: 'Anual' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setInterval(opt.id as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${interval === opt.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gateway Selector */}
                    <div className="flex justify-center gap-4 mt-8 flex-wrap">
                        {GATEWAYS.filter(g => availableGateways.includes(g.id)).map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGateway(g.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all ${selectedGateway === g.id ? 'bg-white text-black border-white' : 'bg-black/50 border-white/10 text-gray-400 hover:border-white/30'}`}
                            >
                                <g.icon size={18} />
                                <div className="text-left">
                                    <p className="text-sm font-bold leading-none">{g.name}</p>
                                    <p className="text-[10px] opacity-70">{g.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {currentTabPlans.map((plan: any) => {
                        const baseMonthPrice = Number(plan.price) || 0;
                        let currentPrice = baseMonthPrice;
                        let originalPrice = baseMonthPrice;
                        let periodLabel = 'mês';

                        if (interval === 'QUARTERLY') {
                            currentPrice = plan.priceQuarterly !== null && plan.priceQuarterly !== undefined ? Number(plan.priceQuarterly) : (baseMonthPrice * 3);
                            originalPrice = baseMonthPrice * 3;
                            periodLabel = 'trimestre';
                        } else if (interval === 'SEMIANNUAL') {
                            currentPrice = plan.priceSemiannual !== null && plan.priceSemiannual !== undefined ? Number(plan.priceSemiannual) : (baseMonthPrice * 6);
                            originalPrice = baseMonthPrice * 6;
                            periodLabel = 'semestre';
                        } else if (interval === 'YEARLY') {
                            currentPrice = plan.priceYearly !== null && plan.priceYearly !== undefined ? Number(plan.priceYearly) : (baseMonthPrice * 12);
                            originalPrice = baseMonthPrice * 12;
                            periodLabel = 'ano';
                        }

                        const hasDiscount = originalPrice > 0 && currentPrice < originalPrice && currentPrice > 0;
                        const discountPercent = hasDiscount ? Math.round((1 - (currentPrice / originalPrice)) * 100) : 0;
                        const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [];

                        return (
                        <div
                            key={plan.id}
                            className={`relative p-8 rounded-3xl border border-white/10 bg-white/5 transition-transform hover:-translate-y-2`}
                        >
                            {plan.name.toLowerCase().includes('pro') && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                                    Mais Popular
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2 uppercase">{plan.name}</h3>
                            <div className="flex flex-col gap-1 mb-6">
                                {hasDiscount && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg text-gray-500 font-medium line-through decoration-red-500/50 decoration-2">
                                            De R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            Economize {discountPercent}%
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    <span className="text-sm text-gray-400 uppercase">/{periodLabel}</span>
                                </div>
                                {plan.setupPrice > 0 && (
                                    <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pagamento Inicial</p>
                                        <p className="text-sm font-bold text-amber-500">
                                            + R$ {Number(plan.setupPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-400 font-normal">(Taxa de Ativação Única)</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3 text-sm text-gray-300">
                                    <Check className="shrink-0 text-emerald-500" size={18} />
                                    {plan.botLimit} Agentes IA
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300">
                                    <Check className="shrink-0 text-emerald-500" size={18} />
                                    {plan.messageLimit > 0 ? `${plan.messageLimit} Mensagens` : 'Mensagens Ilimitadas'}
                                </li>
                                {features.filter((f: any) => f.enabled).map((feature: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check className="shrink-0 text-emerald-500" size={18} />
                                        {feature.text}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(plan.id)}
                                disabled={!!loading}
                                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading === plan.id ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                                {loading === plan.id ? 'Processando...' : `Assinar com ${GATEWAYS.find(g => g.id === selectedGateway)?.name}`}
                            </button>
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
}
