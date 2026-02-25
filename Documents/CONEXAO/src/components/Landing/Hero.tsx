import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">

            {/* Badge */}
            <div className="mb-6 inline-block px-5 py-2 rounded-full glass animate-float">
                <span className="text-sm font-semibold tracking-wide bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    🚀 Powered by ElevenLabs & OpenAI
                </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter leading-[1.1]">
                Crie seu <span className="text-gradient">Agente de Vendas</span> <br />
                Humano via Áudio.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                O <strong>Conext Bot</strong> é o "Arquiteto" que constrói automações para você.
                Descreva seu negócio, escolha uma voz ultra-realista e deixe nossa IA
                gerenciar vendas, agendamentos e suporte.
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
