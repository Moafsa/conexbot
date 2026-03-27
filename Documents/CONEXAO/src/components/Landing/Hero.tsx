import Link from "next/link";

export default function Hero({ branding }: { branding?: any }) {
    const systemName = branding?.systemName || "Conext Bot";
    const firstName = systemName.split(' ')[0];
    const lastName = systemName.split(' ').slice(1).join(' ');
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">

            {/* Badge */}
            <div className="mb-6 inline-block px-5 py-2 rounded-full glass animate-float">
                <span className="text-sm font-semibold tracking-wide bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    🚀 Powered by ElevenLabs & OpenAI
                </span>
            </div>

            {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight animate-fade-in-up">
                    Seu WhatsApp <br />
                    com <span className="bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">{firstName} {lastName}</span>
                </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Pare de perder leads por demora no atendimento. O <strong>Conext Bot</strong> usa IA de ponta para 
                automatizar vendas, suporte e pagamentos via áudio e texto, com o tom de voz da sua marca.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                <Link href="/auth/login" className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-3">
                    criar meu agente agora
                </Link>
                <Link href="/conexbot-wp.zip" download className="btn-outline flex items-center justify-center gap-3 text-lg px-8 py-3 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 group">
                    <svg className="w-6 h-6 fill-current group-hover:scale-110 transition-all duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.47 2 2 6.47 2 12c0 1.25.23 2.45.65 3.56l3.41-9.33L9.5 12h-3L12 22l5.5-10h-3l3.44-5.77 3.41 9.33c.42-1.11.65-2.31.65-3.56 0-5.53-4.47-10-10-10zm0 18.83l-3.05-8.36 1.94 5.31 1.24-3.38 1.23 3.38 1.95-5.31 3.05 8.36C16.63 19.85 14.43 20.83 12 20.83z"/>
                    </svg>
                    baixar plugin wordpress
                </Link>
            </div>

            {/* Stats/Social Proof */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70">
                <div>
                    <h3 className="text-2xl font-bold text-white">+500</h3>
                    <p className="text-sm text-gray-500">Negócios Ativos</p>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">24/7</h3>
                    <p className="text-sm text-gray-500">Atendimento</p>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">99%</h3>
                    <p className="text-sm text-gray-500">Taxa de Resposta</p>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">100%</h3>
                    <p className="text-sm text-gray-500">ElevenLabs Audio</p>
                </div>
            </div>
        </section>
    );
}
