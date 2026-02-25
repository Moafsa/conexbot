"use client";

import { Check, Zap, CreditCard, Building, Globe, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PLANS = [
    {
        name: "Starter",
        price: "R$ 97",
        period: "/mês",
        features: ["1 Agente IA", "Conexão WhatsApp (Uzapi)", "500 msgs/mês", "Suporte por Email"],
        highlight: false,
        color: "gray"
    },
    {
        name: "Pro",
        price: "R$ 197",
        period: "/mês",
        features: ["3 Agentes IA", "Conexão WhatsApp + Instagram", "Mensagens Ilimitadas", "Treinamento com Arquivos (PDF)", "Suporte Prioritário"],
        highlight: true,
        color: "indigo"
    },
    {
        name: "Enterprise",
        price: "Sob Consulta",
        period: "",
        features: ["Agentes Ilimitados", "API Dedicada", "Whitelabel", "Gerente de Contas"],
        highlight: false,
        color: "gray"
    }
];

const GATEWAYS = [
    { id: 'asaas', name: 'Asaas', icon: Building, desc: "Pix e Boleto" },
    { id: 'stripe', name: 'Stripe', icon: Globe, desc: "Cartão Internacional" },
    { id: 'mercadopago', name: 'Mercado Pago', icon: CreditCard, desc: "Pix e Cartão BR" },
];

export default function PricingPage() {
    const [selectedGateway, setSelectedGateway] = useState('asaas');
    const [loading, setLoading] = useState<string | null>(null);

    const handleCheckout = async (plan: string) => {
        setLoading(plan);
        try {
            // Identify Tenant (Mock for MVP - typically from Session)
            // Ideally we would prompt login if not logged in context, 
            // but for this flow we assume a demo tenant ID or we redirect to login first.
            // For functionality demonstration, we hardcode a demo ID if not present.
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: plan.toLowerCase(),
                    gateway: selectedGateway,
                    tenantId: 'demo-tenant-id' // In real app: useSession().data.user.id
                })
            });

            const data = await res.json();

            if (res.ok && data.checkoutUrl) {
                // Redirect to Payment Gateway (or Mock URL)
                window.location.href = data.checkoutUrl;
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
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white transition-colors">
                        ← Voltar para Dashboard
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
                        Escolha seu Plano
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Comece a automatizar seu negócio hoje. Cancele a qualquer momento.
                    </p>

                    {/* Gateway Selector */}
                    <div className="flex justify-center gap-4 mt-8 flex-wrap">
                        {GATEWAYS.map(g => (
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
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative p-8 rounded-3xl border ${plan.highlight ? 'border-indigo-500/50 bg-indigo-900/10 shadow-[0_0_40px_rgba(99,102,241,0.1)]' : 'border-white/10 bg-white/5'} transition-transform hover:-translate-y-2`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Mais Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-sm text-gray-400">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                                        <Check className={`shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-gray-500'}`} size={18} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(plan.name)}
                                disabled={!!loading}
                                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                  ${plan.highlight
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                                        : 'bg-white text-black hover:bg-gray-200'
                                    } ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading === plan.name ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                                {loading === plan.name ? 'Processando...' : `Assinar com ${GATEWAYS.find(g => g.id === selectedGateway)?.name}`}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
