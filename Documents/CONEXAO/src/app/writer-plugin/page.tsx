"use client";

import React, { useState, useEffect } from "react";
import { Check, Zap, Sparkles, Layout, BarChart, Rocket, Globe, Building, CreditCard, ChevronRight, Play, Download, ShieldCheck, Mail, Shield, Search, PenTool, Image as LucideImage, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const AGENTS = [
    {
        name: "Supervisor",
        role: "Orquestrador",
        desc: "Coordena a linha de montagem e garante que o contexto do seu site seja respeitado.",
        icon: Shield
    },
    {
        name: "Researcher",
        role: "Analista de Dados",
        desc: "Busca tendências em tempo real e fatos atualizados para enriquecer o conteúdo.",
        icon: Search
    },
    {
        name: "Writer",
        role: "Redator Criativo",
        desc: "Gera textos humanizados (até 5000 palavras) sem nomes de seções clichês.",
        icon: PenTool
    },
    {
        name: "SEO Expert",
        role: "Otimizador Yoast",
        desc: "Configura Títulos, Meta Descrições e Focus Keywords com rigor matemático.",
        icon: BarChart
    },
    {
        name: "Visualist",
        role: "Gestor de Mídia",
        desc: "Cria e otimiza imagens com alt-tags inteligentes e relacionadas ao assunto.",
        icon: LucideImage
    }
];

export default function WriterPluginLP() {
    const { data: session, status } = useSession();
    const [plans, setPlans] = useState<any[]>([]);
    const [interval, setInterval] = useState<'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'YEARLY'>('MONTHLY');
    const router = useRouter();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/plans?type=WRITER_PLUGIN');
                const data = await res.json();
                setPlans(data.plans || []);
            } catch (error) {
                console.error("Failed to fetch plugin plans");
            }
        };
        fetchPlans();
    }, []);

    const handlePurchase = (planId: string) => {
        if (status === 'unauthenticated') {
            router.push(`/auth/register?planId=${planId}&type=WRITER_PLUGIN`);
        } else {
            router.push(`/checkout?planId=${planId}&type=WRITER_PLUGIN`);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 font-sans">
            {/* Dark Gradient Overlay */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#090915_0%,transparent_50%)] pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <Link href="/" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
                    CONEXT WRITER
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Tecnologia</Link>
                    <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Preços</Link>
                    <Link 
                        href={status === 'authenticated' ? "/dashboard/writer" : "/auth/login"} 
                        className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-white/5"
                    >
                        {status === 'authenticated' ? "Meu Painel" : "Entrar"}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6 overflow-hidden">
                <div className="max-w-6xl mx-auto text-center space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.2em] animate-fade-in">
                        <Sparkles size={14} /> 5 AGENTES TRABALHANDO PARA VOCÊ
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
                        A IA que escreve como um <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-600">Especialista</span>
                    </h1>
                    <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed italic">
                        O primeiro plugin WordPress que utiliza uma linha de montagem de agentes para criar conteúdos densos, humanizados e otimizados para o **Yoast SEO**.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6">
                        <Link href="#pricing" className="w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-700 rounded-[22px] font-black text-lg transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-95 group">
                            ASSINAR AGORA <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="w-full md:w-auto px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[22px] font-black text-lg transition-all flex items-center justify-center gap-3">
                             ASSISTIR DEMO
                        </button>
                    </div>
                </div>

                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full" />
            </section>

            {/* The 5-Agent Architecture Section */}
            <section id="features" className="relative z-10 py-32 bg-black/40 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-20 items-center">
                        <div className="flex-1 space-y-8">
                            <h2 className="text-5xl font-black tracking-tighter leading-tight">
                                Uma <span className="text-blue-500">Esteira Digital</span> de Produção de Elite.
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Esqueça textos genéricos. O Conext Writer orquestra 5 IAs especialistas simultaneamente para garantir que cada parágrafo tenha profundidade técnica e autoridade.
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                                {AGENTS.map((agent, i) => (
                                    <div key={i} className="flex gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-colors group">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                                            <agent.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white flex items-center gap-2">
                                                {agent.name} <span className="text-[10px] text-gray-500 uppercase tracking-widest">{agent.role}</span>
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">{agent.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <div className="relative z-10 rounded-[40px] border border-white/10 overflow-hidden shadow-3xl bg-black">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="h-4 w-3/4 bg-blue-500/20 rounded-full animate-pulse" />
                                    <div className="space-y-3">
                                        <div className="h-3 w-full bg-white/5 rounded-full" />
                                        <div className="h-3 w-full bg-white/5 rounded-full" />
                                        <div className="h-3 w-5/6 bg-white/5 rounded-full" />
                                    </div>
                                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest">Yoast SEO Score</span>
                                            <span className="text-lg font-black italic">100% OK</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="h-1.5 bg-emerald-500 rounded-full" />
                                            <div className="h-1.5 bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -inset-10 bg-blue-600/10 blur-[100px] -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* SEO Features Grid */}
            <section className="relative z-10 py-32 bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24 space-y-6">
                        <div className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                            SEO DE ALTA PERFORMANCE
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.8]">Domine a <span className="text-blue-500">Primeira Página</span></h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                            Nossa linha de montagem de agentes não apenas escreve; ela constrói autoridade semântica inquestionável para o seu domínio.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                title: "Indexação Prioritária",
                                desc: "Estrutura técnica impecável com dados estruturados (Schema) e metadados que forçam o Google a priorizar seu conteúdo.",
                                icon: BarChart
                            },
                            {
                                title: "Humanização Indetectável",
                                desc: "Nossa IA de terceira geração remove padrões robóticos, garantindo 99% de aprovação em detectores de IA e maior retenção do usuário.",
                                icon: Sparkles
                            },
                            {
                                title: "Autoridade de Especialista",
                                desc: "Análise profunda de intenção de busca (Search Intent) que cobre loops de informação que IAs genéricas ignoram.",
                                icon: Globe
                            }
                        ].map((stat, i) => (
                            <div key={i} className="group p-12 rounded-[45px] bg-[#0a0a0a] border border-white/5 hover:border-blue-500/30 transition-all duration-700 hover:-translate-y-2">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
                                    <stat.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-6 tracking-tight">{stat.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-6xl font-black uppercase tracking-tighter">Escolha seu Poder</h2>
                        <p className="text-gray-400 text-lg italic">Planos dimensionados para quem leva SEO a sério.</p>
                        
                        <div className="flex justify-center mt-12 overflow-x-auto no-scrollbar pb-4">
                            <div className="bg-white/5 p-1.5 flex rounded-3xl border border-white/10 shrink-0">
                                {[
                                    { id: 'MONTHLY', label: 'MENSAL' },
                                    { id: 'QUARTERLY', label: 'TRIMESTRAL' },
                                    { id: 'SEMIANNUAL', label: 'SEMESTRAL' },
                                    { id: 'YEARLY', label: 'ANUAL' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setInterval(opt.id as any)}
                                        className={`px-6 md:px-10 py-3.5 rounded-2xl text-[10px] md:text-xs font-black transition-all whitespace-nowrap ${interval === opt.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/40' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => {
                            let price = plan.price;
                            let period = '/mês';
                            let discount = 0;

                            if (interval === 'QUARTERLY') {
                                price = plan.priceQuarterly || plan.price * 3 * 0.9;
                                period = '/tri';
                                discount = Math.round(100 - ((price / (plan.price * 3)) * 100));
                            } else if (interval === 'SEMIANNUAL') {
                                price = plan.priceSemiannual || plan.price * 6 * 0.85;
                                period = '/sem';
                                discount = Math.round(100 - ((price / (plan.price * 6)) * 100));
                            } else if (interval === 'YEARLY') {
                                price = plan.priceYearly || plan.price * 12 * 0.8;
                                period = '/ano';
                                discount = Math.round(100 - ((price / (plan.price * 12)) * 100));
                            }

                            const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [];

                            return (
                                <div key={plan.id} className="group h-full bg-[#0a0a0a] rounded-[50px] p-12 border border-white/5 hover:border-blue-600/40 transition-all duration-700 flex flex-col relative overflow-hidden">
                                    {discount > 0 && (
                                        <div className="absolute top-8 right-[-35px] bg-emerald-500 text-black text-[10px] font-black py-1 w-32 text-center rotate-45 shadow-xl">
                                            {discount}% OFF
                                        </div>
                                    )}

                                    <div className="mb-12">
                                        <h3 className="text-3xl font-black uppercase tracking-tight text-blue-500">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mt-6">
                                            <span className="text-sm text-gray-500 font-bold">R$</span>
                                            <span className="text-6xl font-black tracking-tighter">
                                                {price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase font-black italic ml-2">{period}</span>
                                        </div>
                                        <p className="text-gray-500 text-sm mt-4 font-medium italic">{plan.description}</p>
                                    </div>

                                    <ul className="space-y-6 mb-16 flex-grow">
                                        <li className="flex items-center gap-4 text-gray-200 font-black border-b border-white/5 pb-5">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="text-blue-500" size={14} />
                                            </div>
                                            <span>{plan.postLimit} Posts de Especialista /mês</span>
                                        </li>
                                        <li className="flex items-center gap-4 text-gray-200 font-black border-b border-white/5 pb-5">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="text-blue-500" size={14} />
                                            </div>
                                            <span>Até {plan.wordLimit.toLocaleString()} Palavras /mês</span>
                                        </li>
                                        {features.filter((f: any) => f.enabled).map((feat: any, i: number) => (
                                            <li key={i} className="flex items-center gap-4 text-gray-400 text-sm font-medium">
                                                <Check className="text-blue-500/40 shrink-0" size={18} />
                                                <span>{feat.text}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button 
                                        onClick={() => handlePurchase(plan.id)}
                                        className="w-full py-6 rounded-[25px] bg-blue-600 text-white font-black text-xl hover:bg-blue-500 transition-all duration-300 active:scale-95 shadow-2xl shadow-blue-600/20"
                                    >
                                        ATIVAR PLUGIN
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 border-t border-white/5 bg-black">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
                    <Link href="/" className="text-2xl font-black tracking-tighter">
                        CONEXT <span className="text-blue-500">WRITER</span>
                    </Link>
                    <p className="text-gray-600 text-sm uppercase tracking-widest font-bold">A inteligência que seu WordPress merece.</p>
                    <div className="flex justify-center gap-10 text-xs font-black text-gray-500 uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-white">Privacidade</Link>
                        <Link href="/terms" className="hover:text-white">Termos</Link>
                        <Link href="/support" className="hover:text-white">Suporte</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
