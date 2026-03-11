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
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/auth/login" className="btn-primary flex items-center justify-center gap-2 text-lg">
                    criar meu agente agora
                </Link>
                <Link href="#demo" className="btn-outline flex items-center justify-center gap-2 text-lg">
                    ver funcionamento
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
