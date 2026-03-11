"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    priceQuarterly: number | null;
    priceSemiannual: number | null;
    priceYearly: number | null;
    trialDays: number;
    botLimit: number;
    messageLimit: number;
    features?: { text: string, enabled: boolean }[];
}

type Interval = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY';

export default function Pricing() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [interval, setInterval] = useState<Interval>('MONTHLY');

    useEffect(() => {
        fetch("/api/plans")
            .then(r => r.json())
            .then(data => {
                if (data && Array.isArray(data.plans)) {
                    setPlans(data.plans);
                } else if (Array.isArray(data)) {
                    setPlans(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Lógica movida para dentro do render

    if (loading) return (
        <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
    );

    return (
        <section className="py-24 px-4 overflow-hidden" id="pricing">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Planos que crescem com você
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Escolha a recorrência ideal e economize. Comece com 7 dias grátis nos planos Professional e Enterprise.
                    </p>
                </div>

                {/* Interval Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="glass p-1 rounded-2xl border-white/5 flex gap-1">
                        {[
                            { id: 'MONTHLY', label: 'Mensal' },
                            { id: 'QUARTERLY', label: 'Trimestral' },
                            { id: 'SEMIANNUAL', label: 'Semestral' },
                            { id: 'YEARLY', label: 'Anual' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setInterval(opt.id as Interval)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${interval === opt.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start relative">
                    {/* Background Glow */}
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-pulse"></div>

                    {plans.map((plan, idx) => {
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

                        // Arredonda para evitar problemas com floats (ex: 402.30 < 447.00)
                        const hasDiscount = originalPrice > 0 && currentPrice < originalPrice && currentPrice > 0;
                        const discountPercent = hasDiscount ? Math.round((1 - (currentPrice / originalPrice)) * 100) : 0;

                        return (
                        <div key={plan.id} className={`glass p-8 rounded-3xl border border-white/5 flex flex-col h-full transition-all duration-500 hover:scale-[1.02] hover:border-white/10 ${idx === 1 ? 'border-purple-500/30 relative bg-gradient-to-b from-purple-900/10 to-transparent md:-translate-y-4 shadow-2xl shadow-purple-500/10' : ''}`}>
                            {idx === 1 && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-[10px] font-black px-4 py-1.5 rounded-full text-white uppercase tracking-widest shadow-xl shadow-purple-500/20">
                                    Mais Popular
                                </div>
                            )}

                            {plan.trialDays > 0 && (
                                <div className="mb-4 flex">
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                                        {plan.trialDays} Dias de Teste Grátis
                                    </span>
                                </div>
                            )}

                            <h3 className={`text-xl font-bold mb-2 tracking-tight ${idx === 1 ? 'text-purple-400' : 'text-white'}`}>{plan.name}</h3>
                            
                            {hasDiscount && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-gray-400 font-medium line-through decoration-red-500 decoration-2">
                                        De R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-emerald-500/10">
                                        Economize {discountPercent}%
                                    </span>
                                </div>
                            )}

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-sm text-gray-500 font-medium">R$</span>
                                <span className="text-5xl font-black text-white">
                                    {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-sm font-normal text-gray-500 uppercase tracking-widest ml-1">/{periodLabel}</span>
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-8 leading-relaxed h-8 line-clamp-2">{plan.description}</p>

                            <ul className="space-y-4 mb-8 text-sm text-gray-300 flex-grow">
                                <li className="flex gap-3 items-center group/item">
                                    <div className="p-1 bg-green-500/20 rounded-lg group-hover/item:scale-110 transition-transform">
                                        <Check size={12} className="text-green-400" />
                                    </div>
                                    <span className="font-medium">{plan.botLimit} {plan.botLimit === 1 ? 'Agente de IA' : 'Agentes de IA'}</span>
                                </li>
                                <li className="flex gap-3 items-center group/item">
                                    <div className="p-1 bg-green-500/20 rounded-lg group-hover/item:scale-110 transition-transform">
                                        <Check size={12} className="text-green-400" />
                                    </div>
                                    <span className="font-medium">{plan.messageLimit === 0 ? 'Conversas Ilimitadas' : `${plan.messageLimit.toLocaleString()} Mensagens/mês`}</span>
                                </li>
                                {(plan.features || []).map((feature, fIdx) => (
                                    <li key={fIdx} className={`flex gap-3 items-center group/item ${!feature.enabled ? 'text-gray-500' : ''}`}>
                                        <div className={`p-1 ${feature.enabled ? 'bg-green-500/20' : 'bg-white/5'} rounded-lg group-hover/item:scale-110 transition-transform`}>
                                            {feature.enabled ? (
                                                <Check size={12} className="text-green-400" />
                                            ) : (
                                                <X size={12} className="text-gray-600" />
                                            )}
                                        </div>
                                        <span className={feature.enabled ? 'font-medium' : ''}>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/auth/register?planId=${plan.id}&interval=${interval}&trial=${plan.trialDays > 0}`}
                                className={`w-full py-4 rounded-2xl text-center font-bold text-sm tracking-widest transition-all ${idx === 1 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 active:scale-[0.98]' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-[0.98]'}`}
                            >
                                {plan.trialDays > 0 ? 'INICIAR TESTE GRÁTIS' : 'COMEÇAR AGORA'}
                            </Link>
                        </div>
                    )})}
                </div>
            </div>
        </section>
    );
}
