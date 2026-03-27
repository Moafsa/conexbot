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

    return (        <section className="py-32 px-6 overflow-hidden relative" id="pricing">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-cyan-600/5 blur-[200px] -z-10 rounded-full"></div>

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter text-white">
                        Planos de <span className="text-cyan-500">Escala</span>
                    </h2>
                    <p className="text-gray-400 text-xl font-light leading-relaxed">
                        Escolha o nível de inteligência e escala ideal para o seu momento.
                    </p>
                </div>

                {/* Interval Toggle */}
                <div className="flex justify-center mb-24">
                    <div className="glass p-1.5 rounded-[2rem] border-white/10 flex gap-2 bg-black/40">
                        {[
                            { id: 'MONTHLY', label: 'Mensal' },
                            { id: 'QUARTERLY', label: 'Trimestral' },
                            { id: 'SEMIANNUAL', label: 'Semestral' },
                            { id: 'YEARLY', label: 'Anual' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setInterval(opt.id as Interval)}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${interval === opt.id ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-500/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan, idx) => {
                        const baseMonthPrice = Number(plan.price) || 0;
                        let currentPrice = baseMonthPrice;
                        let originalPrice = baseMonthPrice * 1.25; // Ancoragem: Preço original sugerido como 25% superior
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
                        <div key={plan.id} className={`p-10 rounded-[3rem] border transition-all duration-700 hover:scale-[1.02] flex flex-col h-full relative group overflow-hidden ${idx === 1 ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-950/10 to-transparent shadow-2xl md:-translate-y-8 h-[750px] mb-20 md:mb-0' : 'border-white/5 bg-black/40'}`}>
                            
                            {idx === 1 && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[8px] font-black px-6 py-2 rounded-full uppercase tracking-[0.3em] shadow-xl shadow-cyan-500/20 italic">
                                    Recomendado para Escala
                                </div>
                            )}

                            {plan.trialDays > 0 && (
                                <div className="mb-6 flex">
                                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-4 py-1 rounded-full border border-emerald-500/20 uppercase tracking-[0.1em]">
                                        {plan.trialDays} Dias Grátis
                                    </span>
                                </div>
                            )}

                            <h3 className="text-2xl font-black mb-2 italic tracking-tighter text-white uppercase">{plan.name}</h3>
                            
                            <div className="flex items-center gap-3 mb-2 min-h-[30px]">
                                <span className="text-sm text-gray-500 font-bold line-through decoration-red-500/50">
                                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border border-emerald-500/20">
                                    Save {discountPercent}%
                                </span>
                            </div>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">R$</span>
                                <span className="text-6xl font-black text-white italic tracking-tighter leading-none">
                                    {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                                </span>
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest ml-1">/{periodLabel}</span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-10 leading-relaxed font-light line-clamp-2 h-8 uppercase tracking-[0.05em]">{plan.description}</p>

                            <ul className="space-y-4 mb-12 text-sm text-gray-400 flex-grow">
                                <li className="flex gap-4 items-center group/item italic">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 group-hover/item:scale-150 transition-transform" />
                                    <span className="font-bold text-white">{plan.botLimit} {plan.botLimit === 1 ? 'Agente de IA' : 'Agentes de IA'}</span>
                                </li>
                                <li className="flex gap-4 items-center group/item italic">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 group-hover/item:scale-150 transition-transform" />
                                    <span className="font-bold text-white">{plan.messageLimit === 0 ? 'Conversas Ilimitadas' : `${plan.messageLimit.toLocaleString()} Mensagens`}</span>
                                </li>
                                {(plan.features || []).map((feature, fIdx) => (
                                    <li key={fIdx} className={`flex gap-4 items-center group/item italic ${!feature.enabled ? 'opacity-20 grayscale' : ''}`}>
                                        <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                                        <span className={feature.enabled ? 'text-gray-300' : ''}>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/auth/register?planId=${plan.id}&interval=${interval}&trial=${plan.trialDays > 0}`}
                                className={`w-full py-5 rounded-2xl text-center font-black text-[10px] tracking-[0.3em] uppercase transition-all italic border ${idx === 1 ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400/20 shadow-2xl shadow-cyan-500/20' : 'bg-white/5 hover:bg-white/10 text-white border-white/10 opacity-70 hover:opacity-100'}`}
                            >
                                {plan.trialDays > 0 ? 'Iniciar Teste' : 'Começar Agora'}
                            </Link>

                        </div>
                    )})}
                </div>
            </div>
        </section>
    );
}
