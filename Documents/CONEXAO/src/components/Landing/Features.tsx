export default function Features() {
    const features = [
        {
            title: "Arquiteto IA",
            desc: "Não gaste horas configurando fluxos. Apenas diga 'Sou uma Pizzaria' e nós criamos o bot de delivery completo para você.",
            icon: "🧠"
        },
        {
            title: "Voz Ultra-Realista",
            desc: "Integração nativa com ElevenLabs. Seu bot fala com entonação, pausas e emoção humana, não como um robô.",
            icon: "🎙️"
        },
        {
            title: "Omnichannel",
            desc: "Conecte-se onde seu cliente está: WhatsApp (Uzapi), Instagram, Telegram e Webchat. Tudo centralizado.",
            icon: "🔗"
        },
        {
            title: "Foco em Vendas",
            desc: "Nossos agentes são treinados para fechar negócios. Eles são objetivos, persuazivos e buscam o 'sim' do cliente.",
            icon: "💰"
        },
        {
            title: "Base de Conhecimento",
            desc: "O bot 'lê' seu site automaticamente para aprender sobre seus produtos, preços e políticas.",
            icon: "📚"
        },
        {
            title: "Pagamentos In-Chat",
            desc: "Integração com Mercado Pago e Asaas. Receba via PIX sem o cliente sair da conversa.",
            icon: "💳"
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
