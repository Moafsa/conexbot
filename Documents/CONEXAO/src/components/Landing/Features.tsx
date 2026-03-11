import { Cpu, AudioLines, Zap, Brain, Users, CreditCard } from "lucide-react";

export default function Features() {
    const features = [
        {
            title: "Arquiteto de Automação",
            desc: "Sem fluxogramas complexos. Diga seu nicho e nossa IA gera toda a estrutura de atendimento e vendas em segundos.",
            icon: <Cpu className="w-8 h-8 text-indigo-500" />
        },
        {
            title: "Vozes que Vendem",
            desc: "Integração premium ElevenLabs. Seus clientes recebem áudios com entonação humana, construindo confiança e autoridade.",
            icon: <AudioLines className="w-8 h-8 text-purple-500" />
        },
        {
            title: "WhatsApp Ininterrupto",
            desc: "Conexão via Uzapi estável e rápida. Responda centenas de clientes simultaneamente sem perder o timing da venda.",
            icon: <Zap className="w-8 h-8 text-blue-500" />
        },
        {
            title: "Cérebro do Negócio",
            desc: "O bot aprende lendo seu site e manuais. Ele sabe seus preços, horários e diferenciais melhor que qualquer manual.",
            icon: <Brain className="w-8 h-8 text-pink-500" />
        },
        {
            title: "CRM Inteligente",
            desc: "Organização automática de leads. Saiba exatamente quem está pronto para comprar e quem precisa de acompanhamento.",
            icon: <Users className="w-8 h-8 text-green-500" />
        },
        {
            title: "Checkout no Chat",
            desc: "Venda e receba via PIX (Asaas/Mercado Pago) direto no WhatsApp. Reduza a fricção e aumente sua conversão.",
            icon: <CreditCard className="w-8 h-8 text-yellow-500" />
        }
    ];

    return (
        <section className="py-24 px-4 relative">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Tudo o que você precisa</h2>
                    <p className="text-gray-400">Automação de ponta a ponta para escalar seu negócio.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="glass p-8 rounded-2xl hover:bg-white/5 transition-colors group">
                            <div className="text-4xl mb-6 bg-white/5 w-16 h-16 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
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
