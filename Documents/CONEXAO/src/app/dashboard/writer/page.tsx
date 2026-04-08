"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Download, Copy, Check, ExternalLink, Zap, AlertCircle, Rocket, Layout, Globe, Star } from "lucide-react";
import { useSession } from "next-auth/react";

export default function WriterDashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resStatus, resPlans] = await Promise.all([
                    fetch('/api/user/writer'),
                    fetch('/api/plans?type=WRITER_PLUGIN')
                ]);
                const statusData = await resStatus.json();
                const plansData = await resPlans.json();
                
                setData(statusData);
                setPlans(plansData.plans || []);
            } catch (error) {
                console.error("Failed to fetch writer data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-pulse">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-blue-500" size={32} />
                </div>
                <p className="text-gray-500 font-medium">Carregando inteligência de redação...</p>
            </div>
        );
    }

    if (!data?.hasPlugin) {
        return (
            <div className="space-y-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Upgrade Hero */}
                <div className="p-10 md:p-16 rounded-[40px] bg-gradient-to-br from-blue-600/10 via-[#0a0a0a] to-[#050505] border border-blue-500/20 relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={14} /> Plugin Adicional
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight">
                            Ative o <span className="text-blue-500">Conext Writer</span> <br /> e Escalone seu SEO
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed italic">
                            O melhor plugin para WordPress para quem quer dominar o Google com artigos otimizados sem esforço manual.
                        </p>
                        <ul className="space-y-3">
                            {["Geração de posts em massa", "Otimização SEO automática", "Integração WordPress nativa", "Baseado em GPT-4o"].map((t, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[40%] hidden lg:block opacity-20 group-hover:opacity-40 transition-opacity">
                         <Layout className="w-full h-auto text-blue-500" />
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold uppercase tracking-tight">Planos Disponíveis</h2>
                        <p className="text-gray-500 mt-2">Escolha a escala ideal para o seu negócio.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div key={plan.id} className="p-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-3xl hover:border-blue-500/30 transition-all flex flex-col group">
                                <h3 className="text-lg font-bold text-blue-400 uppercase mb-4">{plan.name}</h3>
                                <div className="text-3xl font-black mb-6">
                                    R$ {plan.price.toLocaleString('pt-BR')}
                                    <span className="text-sm font-normal text-gray-500">/mês</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-sm text-gray-400">
                                        <Check className="text-blue-500" size={16} />
                                        {plan.postLimit} Posts/mês
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-400">
                                        <Check className="text-blue-500" size={16} />
                                        {plan.wordLimit.toLocaleString()} Palavras/mês
                                    </li>
                                </ul>
                                <button 
                                    onClick={() => window.location.href = `/api/checkout/portal?planId=${plan.id}&interval=MONTHLY&gateway=asaas`}
                                    className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                >
                                    Assinar Plugin
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Sparkles className="text-blue-500" size={32} /> Central AI Writer
                    </h1>
                    <p className="text-gray-500 mt-1 italic">Sua máquina de conteúdo SEO está ativa e pronta.</p>
                </div>
                <div className="flex gap-3">
                    <a 
                        href="/conext-writer.zip" 
                        download
                        className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        <Download size={18} /> Baixar Plugin .ZIP
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Usage Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-4 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                <Rocket size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Limite Mensal</span>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Posts Gerados</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-black">{data.usage.postsUsed}</span>
                                <span className="text-gray-600 font-medium">/ {data.usage.postLimit}</span>
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-1000" 
                                style={{ width: `${Math.min((data.usage.postsUsed / data.usage.postLimit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-4 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                                <Layout size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Escritura IA</span>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Palavras Usadas</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-black">{data.usage.wordsUsed.toLocaleString()}</span>
                                <span className="text-gray-600 font-medium">/ {data.usage.wordLimit.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-1000" 
                                style={{ width: `${Math.min((data.usage.wordsUsed / data.usage.wordLimit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* License Info Full Width */}
                    <div className="md:col-span-2 p-8 bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                <Star size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-tight">Sua Chave de Licença Ativa</h3>
                                <p className="text-xs text-gray-500">Copie e cole nas configurações do plugin em seu WordPress.</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-grow bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between group">
                                <code className="text-xl font-mono text-emerald-400 font-bold break-all">
                                    {data.licenseKey || "GERANDO LICENÇA..."}
                                </code>
                                <button 
                                    onClick={() => copyToClipboard(data.licenseKey || "")}
                                    className="p-3 hover:bg-white/5 rounded-xl transition-all active:scale-95 text-gray-500 hover:text-white shrink-0"
                                >
                                    {copySuccess ? <Check className="text-emerald-500" size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guidelines / Mini Guide */}
                <div className="space-y-6">
                    <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                             Guia de Início
                        </h4>
                        <div className="space-y-4">
                            {[
                                { step: "1", text: "Baixe o arquivo .zip acima" },
                                { step: "2", text: "Instale no menu 'Plugins' do WordPress" },
                                { step: "3", text: "Ative o plugin e procure pela aba Conext Writer" },
                                { step: "4", text: "Cole sua Chave de Licença e comece a criar!" }
                            ].map((s, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-400 shrink-0 border border-blue-500/20">
                                        {s.step}
                                    </div>
                                    <p className="text-sm text-gray-400">{s.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/5">
                             <a href="#" className="flex items-center justify-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">
                                 Ver Documentação Completa <ExternalLink size={12} />
                             </a>
                        </div>
                    </div>

                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex items-start gap-4">
                         <AlertCircle className="text-red-500 shrink-0" size={20} />
                         <div>
                             <p className="text-xs font-bold text-red-500 uppercase">Precisa de escala?</p>
                             <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                 Se você atingir 100% dos seus limites antes do fim do mês, pode realizar o upgrade para um plano superior a qualquer momento.
                             </p>
                             <button className="text-[10px] font-black uppercase text-white mt-2 hover:underline decoration-white/30 underline-offset-4">
                                 Falar com Gerente de Conta
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
