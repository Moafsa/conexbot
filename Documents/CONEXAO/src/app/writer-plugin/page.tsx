"use client";

import React, { useState, useEffect } from "react";
import { Check, Zap, Sparkles, Layout, BarChart, Rocket, Globe, Building, CreditCard, ChevronRight, Play, Download, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const FEATURES = [
    {
        title: "SEO Automatizado",
        desc: "Geração de posts otimizados para mecanismos de busca com zero esforço manual.",
        icon: Sparkles,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "Integração WordPress",
        desc: "Publique diretamente em qualquer site WordPress via licença nativa.",
        icon: Globe,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    },
    {
        title: "Conteúdo Ilimitado",
        desc: "Produza centenas de artigos mensais com consistência e qualidade profissional.",
        icon: Layout,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
    {
        title: "Dashboards de Uso",
        desc: "Acompanhe o consumo de palavras e posts ativos em tempo real.",
        icon: BarChart,
        color: "text-orange-400",
        bg: "bg-orange-400/10"
    }
];

export default function WriterPluginLP() {
    const { data: session, status } = useSession();
    const [plans, setPlans] = useState<any[]>([]);
    const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [loading, setLoading] = useState(false);
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
            router.push(`/dashboard/writer`); // Central de compra no dashboard
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30">
            {/* Dark Gradient Overlay */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a2e_0%,transparent_50%)] pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <Link href="/" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
                    CONEX AI WRITER
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Preços</Link>
                    <Link href="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Conextbot</Link>
                    <Link 
                        href={status === 'authenticated' ? "/dashboard/writer" : "/auth/login"} 
                        className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-all active:scale-95"
                    >
                        {status === 'authenticated' ? "Meu Plugin" : "Entrar"}
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest animate-bounce">
                        <Sparkles size={14} /> NOVO PLUGIN DISPONÍVEL
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                        Domine o Google com <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600">
                            IA de Redação
                        </span>
                    </h1>
                    <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                        O primeiro plugin WordPress que utiliza o motor Conextbot para criar, otimizar e publicar artigos em massa. Escala total para o seu SEO.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="#pricing" className="w-full md:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 group">
                            COMEÇAR AGORA <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3">
                            <Play size={20} fill="currentColor" /> VER DEMO
                        </button>
                    </div>
                </div>

                {/* Floating Elements / Decoration */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
            </section>

            {/* Features Grid */}
            <section className="relative z-10 py-32 bg-[#050505]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl font-black uppercase tracking-tighter">Por que o Conex Writer?</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">Tecnologia avançada para quem busca performance orgânica sem depender de redatores humanos.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {FEATURES.map((feat, i) => (
                            <div key={i} className="group p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2">
                                <div className={`w-14 h-14 rounded-2xl ${feat.bg} ${feat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                    <feat.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Plugin Image Section */}
            <section className="relative z-10 py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-20">
                    <div className="flex-1 space-y-8">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit rounded-2xl">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter leading-tight">
                            Seguro, Rápido e <br />
                            Pronto para Brilhar.
                        </h2>
                        <div className="space-y-6">
                            {[
                                "Geração baseada em GPT-4o e Claude 3.5 Sonnet",
                                "Otimização automática de imagens (Alt tags)",
                                "Estrutura de Heading Tags Perfeita",
                                "Suporte a múltiplos idiomas"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 text-gray-300 font-medium italic">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <div className="relative z-10 bg-gradient-to-br from-[#111] to-black p-4 rounded-[40px] border border-white/10 shadow-2xl">
                            <img 
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                                alt="Dashboard Interface" 
                                className="rounded-[30px] opacity-80"
                            />
                        </div>
                        <div className="absolute -inset-4 bg-blue-500/10 blur-3xl -z-10 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 py-32 bg-[#030303]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-5xl font-black uppercase tracking-tighter">Escolha seu Poder</h2>
                        <p className="text-gray-500 italic">Planos pensados para escalas individuais até agências de SEO.</p>
                        
                        <div className="flex justify-center mt-10">
                            <div className="bg-white/5 p-1 flex rounded-xl border border-white/10 self-center">
                                <button
                                    onClick={() => setInterval('MONTHLY')}
                                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${interval === 'MONTHLY' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    MENSAL
                                </button>
                                <button
                                    onClick={() => setInterval('YEARLY')}
                                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${interval === 'YEARLY' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    ANUAL (Economize 20%)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => {
                            const price = interval === 'YEARLY' ? (plan.priceYearly || plan.price * 12 * 0.8) : plan.price;
                            const period = interval === 'YEARLY' ? '/ano' : '/mês';
                            
                            return (
                                <div key={plan.id} className="relative group p-1 rounded-[35px] bg-white/5 hover:bg-gradient-to-br hover:from-blue-600/50 hover:to-purple-600/50 transition-all duration-500">
                                    <div className="h-full bg-[#080808] rounded-[34px] p-10 flex flex-col">
                                        <div className="mb-8">
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-blue-400">{plan.name}</h3>
                                            <div className="flex items-baseline gap-1 mt-4">
                                                <span className="text-5xl font-black tracking-tighter">R$ {price.toLocaleString('pt-BR')}</span>
                                                <span className="text-sm text-gray-500 uppercase font-bold">{period}</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-5 mb-12 flex-grow">
                                            <li className="flex items-center gap-3 text-gray-300 font-medium">
                                                <Check className="text-blue-500 shrink-0" size={20} />
                                                <span>{plan.postLimit} Posts Mensais</span>
                                            </li>
                                            <li className="flex items-center gap-3 text-gray-300 font-medium">
                                                <Check className="text-blue-500 shrink-0" size={20} />
                                                <span>{plan.wordLimit.toLocaleString()} Palavras</span>
                                            </li>
                                            {(plan.features || []).filter((f:any)=>f.enabled).map((feat: any, i: number) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-300 font-medium italic">
                                                    <Check className="text-blue-500 shrink-0" size={20} />
                                                    <span>{feat.text}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button 
                                            onClick={() => handlePurchase(plan.id)}
                                            className="w-full py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-blue-600 hover:text-white transition-all duration-300 active:scale-95 shadow-xl shadow-white/5"
                                        >
                                            CONTRATAR AGORA
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 border-t border-white/5 bg-[#010101]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-4">
                        <Link href="/" className="text-2xl font-black tracking-tighter">
                            CONEX AI <span className="text-blue-500">WRITER</span>
                        </Link>
                        <p className="text-gray-600 text-sm italic max-w-xs">A revolução da escrita automatizada integrada ao motor do Conextbot.</p>
                    </div>
                    <div className="flex gap-10">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Produto</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="#pricing">Preços</Link></li>
                                <li><Link href="/pricing">Robôs IA</Link></li>
                                <li><a href="#">Documentação</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Suporte</h4>
                            <ul className="space-y-2 text-sm text-gray-400 flex flex-col">
                                <Link href="/support" className="flex items-center gap-2">Central de Ajuda <ChevronRight size={12} /></Link>
                                <a href="mailto:contato@conexbot.com">Email</a>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-20 text-[10px] text-gray-700 uppercase tracking-[0.2em]">
                    &copy; 2024 CONEXTBOT - TODOS OS DIREITOS RESERVADOS
                </div>
            </footer>
        </div>
    );
}
