import { 
    Cpu, AudioLines, Zap, Brain, Users, CreditCard, 
    Globe, Calendar, ShieldCheck, ArrowRight 
} from "lucide-react";

export default function Features() {
    const features = [
        {
            title: "WhatsApp Autônomo",
            desc: "Conexão via Uzapi de altíssima estabilidade. Responda centenas de clientes simultaneamente sem latência.",
            icon: <Zap className="w-8 h-8 text-cyan-400" />,
            bg: "bg-cyan-500/5"
        },
        {
            title: "Sincronia WordPress",
            desc: "Sincronização nativa com WooCommerce, posts e comentários. Seu site e seu bot falando a mesma língua.",
            icon: <Globe className="w-8 h-8 text-blue-400" />,
            bg: "bg-blue-500/5"
        },
        {
            title: "Agenda & Booking",
            desc: "Integração com Google Calendar. O bot agenda reuniões e consultas sozinho, evitando conflitos de horários.",
            icon: <Calendar className="w-8 h-8 text-emerald-400" />,
            bg: "bg-emerald-500/5"
        },
        {
            title: "Split de Pagamentos",
            desc: "Receba e divida comissões automaticamente via Asaas. O modelo ideal para marketplaces e afiliados.",
            icon: <CreditCard className="w-8 h-8 text-orange-400" />,
            bg: "bg-orange-500/5"
        },
        {
            title: "Vozes ElevenLabs",
            desc: "A IA de voz mais humana do mundo. Seus áudios no WhatsApp com tonação, emoção e altíssima fidelidade.",
            icon: <AudioLines className="w-8 h-8 text-indigo-400" />,
            bg: "bg-indigo-500/5"
        },
        {
            title: "Cérebro do Negócio",
            desc: "Treine sua IA com PDFs, URLs ou manuais. Ele aprende tudo sobre seu produto e cultura em segundos.",
            icon: <Brain className="w-8 h-8 text-pink-400" />,
            bg: "bg-pink-500/5"
        },
        {
            title: "CRM & Automação",
            desc: "Movimentação automática de funil. Saiba quem está pronto para comprar e quem precisa de follow-up.",
            icon: <Users className="w-8 h-8 text-teal-400" />,
            bg: "bg-teal-500/5"
        },
        {
            title: "Modelo de Agência",
            desc: "White-label e suporte a múltiplos bots. Monte sua própria agência de IA com custos reduzidos e alta escala.",
            icon: <ShieldCheck className="w-8 h-8 text-green-400" />,
            bg: "bg-green-500/5"
        },
        {
            title: "Supervisor IA",
            desc: "Análise estratégica em tempo real. O supervisor monitora as conversas e sugere melhorias táticas.",
            icon: <Cpu className="w-8 h-8 text-cyan-300" />,
            bg: "bg-cyan-300/5"
        }
    ];

    return (
        <section className="py-32 px-6 relative" id="features">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black mb-8 italic tracking-tighter text-white">
                        Poderes de <span className="text-cyan-500">Escala</span>
                    </h2>
                    <p className="text-gray-400 text-xl font-light leading-relaxed">
                        Uma arquitetura modular desenhada para converter curiosidade em receita recorrente.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div 
                            key={i} 
                            className={`p-10 rounded-[2.5rem] border border-white/5 ${f.bg} hover:border-white/10 transition-all duration-500 group relative overflow-hidden`}
                        >
                            <div className="relative z-10">
                                <div className="mb-8 w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-white/5">
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-white italic">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm font-light">
                                    {f.desc}
                                </p>
                            </div>
                            {/* Hover Arrow */}
                            <div className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                <ArrowRight className="text-white/20" size={24} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
