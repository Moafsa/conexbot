import Link from "next/link";

export default function Hero({ branding }: { branding?: any }) {
    const systemName = branding?.systemName || "Conext Bot";
    const firstName = systemName.split(' ')[0];
    const lastName = systemName.split(' ').slice(1).join(' ');
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">

            {/* Badge */}
            <div className="mb-8 inline-block px-6 py-2 rounded-full glass border border-cyan-500/20 animate-float bg-cyan-500/5">
                <span className="text-xs font-black tracking-[0.2em] uppercase bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    🚀 Inteligência Multicanal: WP + WhatsApp + Booking
                </span>
            </div>

            {/* Headline */}
            <div className="max-w-4xl mx-auto mb-8">
                <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter animate-fade-in-up leading-[0.9] italic">
                    O Cérebro da sua <br />
                    <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">Operação Digital</span>
                </h1>
            </div>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                Não é apenas um bot. É um ecossistema autônomo que **vende**, **agenda** e **sincroniza** sua empresa 24/7 com voz humana e inteligência estratégica.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center mb-20">
                <Link href="/auth/register" className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-emerald-600 text-black font-black rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-widest text-sm italic">
                    Criar meu Agente agora
                </Link>
                <Link href="/conexbot-wp.zip" download className="px-10 py-5 glass border border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all flex items-center gap-3 uppercase tracking-widest text-sm group">
                    <img src="https://cdn.simpleicons.org/wordpress/white" alt="WordPress" className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                     Plugin WordPress
                </Link>
            </div>

            {/* Interactive Preview Mockup (Visual Depth) */}
            <div className="relative w-full max-w-5xl mx-auto mb-20 animate-fade-in-up delay-300">
                <div className="aspect-[16/9] glass rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-transparent shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-700"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                             <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 mx-auto animate-pulse">
                                <img src="https://cdn.simpleicons.org/openai/white" className="w-10 h-10" alt="IA" />
                             </div>
                             <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400">Sistema Online & Operacional</p>
                        </div>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-cyan-500/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-emerald-500/20 blur-[120px] rounded-full -z-10 animate-pulse delay-700"></div>
            </div>

            {/* Stats/Social Proof */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto">
                <StatItem val="+500" label="Empresas Ativas" />
                <StatItem val="24/7" label="Disponibilidade" />
                <StatItem val="99.9%" label="Uptime Uzapi" />
                <StatItem val="100%" label="Vozes ElevenLabs" />
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
