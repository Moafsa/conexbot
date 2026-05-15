import Link from "next/link";
import { Zap } from "lucide-react";

export default function Hero({ branding }: { branding?: any }) {
    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">

            {/* Badge */}
            <div className="mb-8 inline-block px-5 py-2 rounded-full glass animate-float">
                <span className="text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Plataforma White-Label de IA
                </span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight animate-fade-in-up">
                Sua Agência de IA.<br />
                <span className="bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent italic">Sua Marca.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Fornecemos a <span className="text-white font-bold italic">infraestrutura de elite</span>. Você foca na estratégia. <br className="hidden md:block" />
                100% Gratuito. Sem custos de entrada. Sem limites para crescer.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-center mb-16 px-4 sm:px-0">
                <Link href="/auth/register" className="btn-primary flex items-center justify-center w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 text-lg md:text-xl shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                    Criar Agência Grátis
                </Link>
                <Link href="#features" className="btn-outline flex items-center justify-center gap-3 w-full sm:w-auto text-lg md:text-xl px-8 md:px-10 py-4 md:py-5 border-white/20 text-white hover:bg-white/5 group">
                    <Zap size={24} className="text-indigo-400" />
                    Ver Ecossistema
                </Link>
            </div>

            {/* Floating Stats */}
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
                <div className="text-center group">
                    <h3 className="text-3xl font-black text-white italic group-hover:scale-110 transition-transform">100%</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">White Label</p>
                </div>
                <div className="text-center group">
                    <h3 className="text-3xl font-black text-white italic group-hover:scale-110 transition-transform">R$ 0</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Custo Zero</p>
                </div>
            </div>
        </section>
    );
}
