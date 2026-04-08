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

    return (        <section className="py-24 px-6 overflow-hidden relative" id="pricing">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-600/5 blur-[150px] -z-10 rounded-full"></div>

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight">
                        Planos de <span className="text-indigo-500">Escala</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Escolha o nível de inteligência e escala ideal para o seu momento.
                    </p>
                </div>

                {/* Interval Toggle */}
                <div className="flex justify-center mb-12 px-2">
                    <div className="glass p-1 rounded-2xl border-white/5 flex gap-1 overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { id: 'MONTHLY', label: 'Mensal' },
                            { id: 'QUARTERLY', label: 'Trimestral' },
                            { id: 'SEMIANNUAL', label: 'Semestral' },
                            { id: 'YEARLY', label: 'Anual' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setInterval(opt.id as Interval)}
                                className={`px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${interval === opt.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {plans.filter((p: any) => p.type === 'PRIMARY').map((plan, idx) => {
                        const baseMonthPrice = Number(plan.price) || 0;
                        let currentPrice = baseMonthPrice;
                        let originalPrice = baseMonthPrice * 1.25; 
                        let periodLabel = 'mês';

                        if (interval === 'QUARTERLY') {
                            currentPrice = plan.priceQuarterly !== null && plan.priceQuarterly !== undefined ? Number(plan.priceQuarterly) : (baseMonthPrice * 3);
                            originalPrice = (baseMonthPrice * 3) * 1.2;
                            periodLabel = 'trimestre';
                        } else if (interval === 'SEMIANNUAL') {
                            currentPrice = plan.priceSemiannual !== null && plan.priceSemiannual !== undefined ? Number(plan.priceSemiannual) : (baseMonthPrice * 6);
                            originalPrice = (baseMonthPrice * 6) * 1.25;
                            periodLabel = 'semestre';
                        } else if (interval === 'YEARLY') {
                            currentPrice = plan.priceYearly !== null && plan.priceYearly !== undefined ? Number(plan.priceYearly) : (baseMonthPrice * 12);
                            originalPrice = (baseMonthPrice * 12) * 1.35;
                            periodLabel = 'ano';
                        }

                        const discountPercent = Math.round((1 - (currentPrice / originalPrice)) * 100);

                        return (
                        <div key={plan.id} className={`glass p-6 md:p-8 rounded-3xl border flex flex-col h-full relative transition-all duration-500 hover:scale-[1.02] ${idx === 1 ? 'border-indigo-500/30 bg-gradient-to-b from-indigo-900/10 to-transparent shadow-2xl md:-translate-y-4' : 'border-white/5'}`}>
                            
                            {idx === 1 && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl shadow-indigo-500/20">
                                    Mais Popular
                                </div>
                            )}

                            {plan.trialDays > 0 && (
                                <div className="mb-4 flex">
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                                        {plan.trialDays} Dias Grátis
                                    </span>
                                </div>
                            )}

                            <h3 className={`text-xl font-bold mb-2 tracking-tight ${idx === 1 ? 'text-indigo-400' : 'text-white'}`}>{plan.name}</h3>
                            
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-500 font-medium line-through decoration-red-500 decoration-2">
                                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-emerald-500/10">
                                    Economize {discountPercent}%
                                </span>
                            </div>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-sm text-gray-500 font-medium">R$</span>
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                                </span>
                                <span className="text-[10px] md:text-xs font-normal text-gray-500 uppercase tracking-widest ml-1">/{periodLabel}</span>
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-8 leading-relaxed h-8 line-clamp-2">{plan.description}</p>

                            <ul className="space-y-4 mb-8 text-sm text-gray-300 flex-grow">
                                <li className="flex gap-3 items-center group/item italic">
                                    <div className="p-1 bg-indigo-500/20 rounded-lg group-hover/item:scale-110 transition-transform">
                                        <Check size={12} className="text-indigo-400" />
                                    </div>
                                    <span className="font-medium text-white">{plan.botLimit} {plan.botLimit === 1 ? 'Agente de IA' : 'Agentes de IA'}</span>
                                </li>
                                <li className="flex gap-3 items-center group/item italic">
                                    <div className="p-1 bg-indigo-500/20 rounded-lg group-hover/item:scale-110 transition-transform">
                                        <Check size={12} className="text-indigo-400" />
                                    </div>
                                    <span className="font-medium text-white">{plan.messageLimit === 0 ? 'Conversas Ilimitadas' : `${plan.messageLimit.toLocaleString()} Mensagens`}</span>
                                </li>
                                {(plan.features || []).map((feature, fIdx) => (
                                    <li key={fIdx} className={`flex gap-3 items-center group/item italic ${!feature.enabled ? 'opacity-30' : ''}`}>
                                        <div className={`p-1 ${feature.enabled ? 'bg-indigo-500/20' : 'bg-white/5'} rounded-lg group-hover/item:scale-110 transition-transform`}>
                                            {feature.enabled ? (
                                                <Check size={12} className="text-indigo-400" />
                                            ) : (
                                                <X size={12} className="text-gray-600" />
                                            )}
                                        </div>
                                        <span className={feature.enabled ? 'text-gray-300' : ''}>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/auth/register?planId=${plan.id}&interval=${interval}&trial=${plan.trialDays > 0}`}
                                className={`w-full py-4 rounded-2xl text-center font-bold text-sm tracking-widest transition-all ${idx === 1 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 active:scale-[0.98]' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 active:scale-[0.98]'}`}
                            >
                                {plan.trialDays > 0 ? 'INICIAR TESTE' : 'COMEÇAR AGORA'}
                            </Link>

                        </div>
                    )})}
                </div>
            </div>
        </section>
    );
}
