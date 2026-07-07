"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
    Check, 
    ShieldCheck, 
    Lock, 
    Sparkles, 
    Timer, 
    TrendingUp, 
    AlertCircle,
    ArrowRight,
    ShoppingBag,
    Users
} from "lucide-react";

export default function PublicLandingPage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos em segundos
    const [notification, setNotification] = useState<string | null>(null);

    // Countdown Timer
    useEffect(() => {
        if (!offer) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 15 * 60));
        }, 1000);
        return () => clearInterval(timer);
    }, [offer]);

    // Live Sales Notifications (social proof)
    useEffect(() => {
        if (!offer) return;
        const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador", "Fortaleza", "Manaus", "Porto Alegre"];
        const names = ["Moacir", "Ana", "Lucas", "Gabriel", "Mariana", "Pedro", "Juliana", "Rodrigo"];
        
        const showNotification = () => {
            const randomName = names[Math.floor(Math.random() * names.length)];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            setNotification(`${randomName} de ${randomCity} acabou de garantir o acesso! 🎉`);
            
            setTimeout(() => {
                setNotification(null);
            }, 4000);
        };

        const interval = setInterval(showNotification, 18000);
        // Mostrar primeiro após 5 segundos
        const initialTimeout = setTimeout(showNotification, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
        };
    }, [offer]);

    // Fetch Offer Data
    useEffect(() => {
        if (!slug) return;
        fetch(`/api/marketing/public/offer?slug=${slug}`)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Oferta não encontrada");
            })
            .then(data => {
                setOffer(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [slug]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Carregando oferta...</p>
                </div>
            </div>
        );
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-[#070a13] text-white flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md bg-white/5 p-8 rounded-3xl border border-white/10">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h1 className="text-xl font-black uppercase tracking-tight text-white">Oferta Indisponível</h1>
                    <p className="text-gray-400 text-sm">
                        Esta página de vendas expirou ou não está ativa no momento. Verifique o link e tente novamente.
                    </p>
                </div>
            </div>
        );
    }

    const copy = offer.copy || {};
    const headline = copy.headline || `APRENDA A LUCRAR COM ${offer.name.toUpperCase()}`;
    const subheadline = copy.subheadline || "Descubra o passo a passo completo para faturar alto sem complicação.";
    const bullets = copy.bullets || [];
    const bonuses = copy.bonuses || [];
    const guarantee = copy.guarantee || "Garantia incondicional de 7 dias. Risco zero para você.";
    const scarcity = copy.scarcity || "ATENÇÃO: O preço promocional expira nas próximas horas.";
    const checkoutUrl = copy.checkoutUrl || "#";

    const originalPrice = offer.originalPrice || (offer.price * 2.5);

    return (
        <div className="min-h-screen bg-[#070913] text-gray-200 antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-black">
            {/* Top Bar / Counter */}
            <div className="bg-red-600/90 text-white font-black text-xs uppercase py-2 px-4 text-center tracking-widest sticky top-0 z-50 backdrop-blur-md flex items-center justify-center gap-2">
                <Timer size={14} className="animate-pulse" />
                <span>{scarcity} — Oferta expira em <span className="font-mono text-sm underline">{formatTime(timeLeft)}</span></span>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 border border-emerald-400 animate-slide-in animate-bounce">
                    <Sparkles size={16} />
                    {notification}
                </div>
            )}

            {/* Hero Section */}
            <header className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center relative">
                {/* Glow backgrounds */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full -z-10"></div>
                
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 mb-6">
                    <Sparkles size={10} />
                    Método Exclusivo 2026
                </span>
                
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6 select-none uppercase">
                    {headline}
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-medium">
                    {subheadline}
                </p>

                {/* Call to Action Primary */}
                <div className="mb-12">
                    <a
                        href={checkoutUrl}
                        className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-sm px-10 py-5 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-105 group"
                    >
                        Quero Começar Agora
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                    
                    {/* Security seals */}
                    <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Lock size={12} /> Compra Segura</span>
                        <span className="flex items-center gap-1"><ShieldCheck size={12} /> Garantia Incondicional</span>
                    </div>
                </div>
            </header>

            {/* Product Mockup Section */}
            <section className="max-w-4xl mx-auto px-4 pb-20">
                <div className="relative bg-white/[0.02] border border-white/10 rounded-[32px] p-8 md:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-12">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full"></div>
                    
                    {/* Visual mockup container */}
                    <div className="w-full md:w-1/2 flex justify-center">
                        <div className="relative w-64 h-80 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-3xl shadow-2xl border-4 border-white/10 p-6 flex flex-col justify-between overflow-hidden group hover:scale-[1.02] transition-transform">
                            {/* Abstract glow inside */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-black bg-white px-2 py-0.5 rounded-full">
                                    Digital
                                </span>
                                <ShoppingBag className="text-white/80" size={24} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white leading-tight uppercase">
                                    {offer.name}
                                </h3>
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                                    Nicho: {offer.niche}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            O Que Você Vai Receber:
                        </h2>
                        
                        <ul className="space-y-4">
                            {bullets.map((bullet: string, idx: number) => (
                                <li key={idx} className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={14} className="stroke-[3]" />
                                    </span>
                                    <span className="text-gray-300 text-sm font-medium leading-relaxed">{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Stacked Bonus Section */}
            {bonuses.length > 0 && (
                <section className="bg-white/[0.01] border-y border-white/5 py-20">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="text-center mb-12">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Leve Mais</span>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-2">
                                Bônus Especiais Inclusos Hoje:
                            </h2>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mt-1">Garantindo sua vaga agora, você recebe sem custo adicional:</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {bonuses.map((bonus: any, idx: number) => (
                                <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors">
                                    <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        Grátis
                                    </span>
                                    <span className="text-3xl font-black text-gray-700 leading-none">0{idx+1}</span>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight mt-4 mb-2">{bonus.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{bonus.description}</p>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Valor original: <span className="line-through">{bonus.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Guarantee Section */}
            <section className="max-w-4xl mx-auto px-4 py-20 text-center">
                <div className="max-w-2xl mx-auto bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full"></div>
                    
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-emerald-500/20">
                        <ShieldCheck size={32} />
                    </div>
                    
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Garantia Blindada de Satisfação</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        {guarantee}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Sem perguntas, sem burocracia, 100% do valor de volta.
                    </p>
                </div>
            </section>

            {/* Checkout Pricing Section */}
            <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
                <div className="bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border-2 border-emerald-500/30 rounded-[48px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full"></div>
                    
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6">Aproveite a Condição Especial</h3>
                    
                    <div className="flex flex-col items-center justify-center gap-2 mb-8">
                        <span className="text-sm text-gray-500 font-bold uppercase tracking-widest line-through">
                            De R$ {originalPrice.toFixed(2)}
                        </span>
                        <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">Por apenas</div>
                        <div className="flex items-baseline gap-1.5 text-white">
                            <span className="text-2xl font-bold">R$</span>
                            <span className="text-6xl md:text-7xl font-black tracking-tighter leading-none">
                                {offer.price.toFixed(2).split(".")[0]}
                            </span>
                            <span className="text-xl font-bold">
                                ,{offer.price.toFixed(2).split(".")[1]}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                            Ou parcelado no cartão de crédito
                        </span>
                    </div>

                    <a
                        href={checkoutUrl}
                        className="w-full inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-sm py-5 px-8 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] mb-6"
                    >
                        Quero Garantir Meu Acesso
                        <ShoppingBag size={18} />
                    </a>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Lock size={12} /> Acesso Imediato</span>
                        <span className="flex items-center gap-1"><Users size={12} /> +12.483 Alunos</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black/40 border-t border-white/5 py-12 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest space-y-4">
                <div>© 2026 {offer.name} — Todos os direitos reservados.</div>
                <div className="max-w-xl mx-auto px-4 normal-case font-medium text-[9px] text-gray-700 leading-relaxed">
                    Aviso: Os resultados podem variar de pessoa para pessoa. Este produto não garante ganhos fáceis ou enriquecimento rápido.
                </div>
                <div className="text-gray-700 pt-4">
                    Plataforma Oficial ConextBot
                </div>
            </footer>
        </div>
    );
}
