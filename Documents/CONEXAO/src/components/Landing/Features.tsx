import { 
    Cpu, AudioLines, Zap, Brain, Users, CreditCard, 
    Calendar, ShieldCheck, Eye, PencilLine
} from "lucide-react";

export default function Features() {
    const features = [
        {
            title: "WhatsApp de Elite",
            desc: "Uzapi de latência zero. Centenas de conversas simultâneas com estabilidade bancária.",
            icon: <Zap className="w-8 h-8 text-indigo-400" />,
            bg: "bg-indigo-500/5"
        },
        {
            title: "Voz Humana Real",
            desc: "Powered by ElevenLabs. Áudios que transmitem emoção e fecham vendas sozinhos.",
            icon: <AudioLines className="w-8 h-8 text-purple-400" />,
            bg: "bg-purple-500/5"
        },
        {
            title: "Treinamento Rápido",
            desc: "Treine a IA com URLs ou PDFs em segundos. Conhecimento infinito em instantes.",
            icon: <Brain className="w-8 h-8 text-pink-400" />,
            bg: "bg-pink-500/5"
        },
        {
            title: "Agendamento IA",
            desc: "Conexão nativa com Google Calendar. Marcação de consultas sem erro humano.",
            icon: <Calendar className="w-8 h-8 text-emerald-400" />,
            bg: "bg-emerald-500/5"
        },
        {
            title: "CRM Visual Inteligente",
            desc: "Movimentação automática de leads baseado no sentimento da conversa.",
            icon: <Users className="w-8 h-8 text-blue-400" />,
            bg: "bg-blue-500/5"
        },
        {
            title: "Split de Pagamentos",
            desc: "Recebimentos via Asaas com divisão automática de comissões para parceiros.",
            icon: <CreditCard className="w-8 h-8 text-orange-400" />,
            bg: "bg-orange-500/5"
        },
        {
            title: "Supervisor AI",
            desc: "Monitoramento tático em tempo real. A IA sugere melhorias para o bot continuamente.",
            icon: <Eye className="w-8 h-8 text-indigo-300" />,
            bg: "bg-indigo-300/5"
        },
        {
            title: "Conext Writer",
            desc: "Geração de posts de alta conversão e SEO otimizado direto no WordPress.",
            icon: <PencilLine className="w-8 h-8 text-green-400" />,
            bg: "bg-green-500/5"
        }
    ];

    return (
        <section className="py-24 px-6 relative" id="features">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tight">
                        Para seus <span className="text-indigo-500">Clientes</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Poder de Gigante. Preço de Parceiro. Toda a tecnologia de ponta da Conext entregue por você.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
