import { 
    Cpu, AudioLines, Zap, Brain, Users, CreditCard, 
    Globe, Calendar, ShieldCheck, ArrowRight 
} from "lucide-react";

export default function Features() {
    const features = [
        {
            title: "WhatsApp Autônomo",
            desc: "Conexão via Uzapi de altíssima estabilidade. Responda centenas de clientes simultaneamente sem latência.",
            icon: <Zap className="w-8 h-8 text-indigo-400" />,
            bg: "bg-indigo-500/5"
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
            icon: <AudioLines className="w-8 h-8 text-purple-400" />,
            bg: "bg-purple-500/5"
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
            icon: <Users className="w-8 h-8 text-blue-400" />,
            bg: "bg-blue-500/5"
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
            icon: <Cpu className="w-8 h-8 text-indigo-300" />,
            bg: "bg-indigo-300/5"
        }
    ];

    return (
        <section className="py-24 px-6 relative" id="features">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight">
                        Tudo o que você <span className="text-indigo-500">precisa</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Uma arquitetura modular desenhada para converter curiosidade em receita recorrente.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div 
                            key={i} 
                            className={`p-8 rounded-3xl border border-white/5 ${f.bg} hover:bg-white/5 transition-all duration-300 group`}
                        >
                            <div className="mb-6 w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
