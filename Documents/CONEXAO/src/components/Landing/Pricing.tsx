"use client";

import { Check, Medal, Trophy, Gem } from "lucide-react";

export default function Pricing({ tiers }: { tiers?: any[] }) {
    // Fallback caso não venha tiers do banco
    const defaultTiers = [
        {
            name: "Bronze",
            feePercentage: 20,
            minSalesVolume: 0,
            maxSalesVolume: 5000,
            color: "text-[#CD7F32]",
            border: "hover:border-[#CD7F32]/50",
            progress: "w-1/4 bg-[#CD7F32]",
            icon: <Medal size={32} className="text-[#CD7F32]" />
        },
        {
            name: "Prata",
            feePercentage: 15,
            minSalesVolume: 5000,
            maxSalesVolume: 15000,
            color: "text-[#C0C0C0]",
            border: "hover:border-[#C0C0C0]/50",
            progress: "w-1/2 bg-[#C0C0C0]",
            icon: <Medal size={32} className="text-[#C0C0C0]" />
        },
        {
            name: "Ouro",
            feePercentage: 10,
            minSalesVolume: 15000,
            maxSalesVolume: 50000,
            color: "text-yellow-500",
            border: "border-yellow-500/30",
            progress: "w-3/4 bg-yellow-500",
            popular: true,
            icon: <Trophy size={32} className="text-yellow-500" />
        },
        {
            name: "Diamante",
            feePercentage: 5,
            minSalesVolume: 50000,
            maxSalesVolume: 1000000,
            color: "text-cyan-300",
            border: "hover:border-cyan-300/50",
            progress: "w-full bg-cyan-300",
            icon: <Gem size={32} className="text-cyan-300" />
        }
    ];

    // Mapear tiers do banco para o visual se existirem
    const displayTiers = (tiers && tiers.length > 0) ? tiers.map((t, i) => {
        const nextTier = tiers[i+1];
        const range = nextTier 
            ? `R$ ${(t.minSalesVolume/1000).toFixed(0)}k - R$ ${(nextTier.minSalesVolume/1000).toFixed(0)}k MRR`
            : `Acima de R$ ${(t.minSalesVolume/1000).toFixed(0)}k MRR`;
        
        // Atribuir cores/ícones baseados no index
        const visual = defaultTiers[i] || defaultTiers[defaultTiers.length-1];
        
        return {
            ...visual,
            name: t.name || visual.name,
            percent: `${t.feePercentage}%`,
            mrr: range,
            progress: `w-${(i+1)*25}% ${visual.color.replace('text-', 'bg-')}` // Simplificação da barra
        };
    }) : defaultTiers.map(t => ({...t, percent: `${t.feePercentage}%`}));

    return (
        <section className="py-32 px-6 relative overflow-hidden" id="pricing">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <h4 className="text-indigo-500 font-black uppercase tracking-[0.3em] text-sm mb-6">Parceria de Crescimento</h4>
                    <h2 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter text-white">
                        Escala <span className="text-indigo-500">Reversa.</span>
                    </h2>
                    <p className="text-gray-400 text-xl font-light max-w-2xl mx-auto leading-relaxed">
                        Quanto mais você fatura, menos nós cobramos. O lucro é seu por direito.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {displayTiers.map((tier, i) => (
                        <div 
                            key={i} 
                            className={`glass p-10 rounded-[2.5rem] border transition-all duration-500 relative group overflow-hidden ${tier.popular ? tier.border + ' shadow-[0_0_50px_rgba(234,179,8,0.1)]' : 'border-white/5 ' + tier.border}`}
                        >
                            {tier.popular && (
                                <div className="absolute top-0 right-0 bg-yellow-500 text-black px-4 py-1 text-[10px] font-black uppercase rounded-bl-xl tracking-tighter">
                                    Mais Popular
                                </div>
                            )}
                            
                            <div className="mb-10 flex items-center gap-3">
                                {tier.icon}
                                <span className={`font-black uppercase tracking-widest text-xs ${tier.color}`}>{tier.name}</span>
                            </div>

                            <div className={`text-6xl font-black mb-4 italic ${tier.popular ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' : 'text-white'}`}>
                                {tier.percent}
                            </div>
                            
                            <p className="text-gray-500 text-sm mb-10 font-medium italic">{tier.mrr}</p>
                            
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 delay-300 ${tier.progress}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
