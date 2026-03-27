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
                <Link href="/conexbot-wp.zip" download className="btn-outline flex items-center justify-center gap-2 text-lg px-8 py-3 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 group">
                    <svg className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 .49.036.972.105 1.442l3.41-9.337C7.23 3.447 9.49 2.164 12 2.164c2.51 0 4.77 1.283 6.485 3.278l3.41 9.337c.07-.47.105-.952.105-1.442 0-5.523-4.477-10-10-10zm0 19.836c-2.43 0-4.63-.984-6.225-2.57l3.05-8.358 1.94 5.318 1.235-3.377 1.235 3.377 1.94-5.318 3.05 8.358c-1.595 1.586-3.795 2.57-6.225 2.57zM2 12c0 1.264.235 2.473.662 3.593L7.756 3.03C4.346 4.673 2 8.06 2 12zm10 10c-1.264 0-2.473-.235-3.593-.662l12.563-5.094C19.327 19.654 15.94 22 12 22z"/></svg>
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
