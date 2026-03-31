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
                O Cérebro da sua <br />
                <span className="bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent italic">Operação Digital</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Não é apenas um <span className="text-gradient font-bold italic">Bot</span>. É um ecossistema autônomo que vende, agenda e sincroniza sua empresa 24/7 com voz humana e inteligência estratégica.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center mb-16 px-4 sm:px-0">
                <Link href="/auth/register" className="btn-primary flex items-center justify-center w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 text-base md:text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    Criar meu Agente agora
                </Link>
                <Link href="/conexbot-wp.zip" download className="btn-outline flex items-center justify-center gap-3 w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-3 border-white/10 text-white hover:bg-white/5 group">
                    <img src="https://cdn.simpleicons.org/wordpress/white" alt="WordPress" className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-all duration-300" />
                    Baixar Plugin WordPress
                </Link>
            </div>

            {/* Stats/Social Proof */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-70">
                <StatItem val="+500" label="Empresas Ativas" />
                <StatItem val="24/7" label="Disponibilidade" />
                <StatItem val="99.9%" label="Uptime Central" />
                <StatItem val="100%" label="ElevenLabs" />
            </div>
        </section>
    );
}

function StatItem({ val, label }: { val: string, label: string }) {
    return (
        <div className="group cursor-default">
            <h3 className="text-3xl font-black text-white mb-1 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                {val}
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
        </div>
    );
}
