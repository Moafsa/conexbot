
import { Target, Heart, Zap, ShieldCheck } from "lucide-react";

export default function BrandStory() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    {/* Visual Side */}
                    <div className="relative">
                        <div className="aspect-square glass rounded-[3rem] border border-white/10 bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-transparent p-12 flex items-center justify-center animate-pulse">
                            <div className="text-center">
                                <Target className="w-24 h-24 text-cyan-400 mx-auto mb-6 opacity-50" />
                                <h4 className="text-2xl font-black text-white italic uppercase tracking-[0.2em]">Missão ConextBot</h4>
                            </div>
                        </div>
                        {/* Floating Cards */}
                        <div className="absolute -top-10 -right-10 p-6 glass rounded-3xl border border-white/20 shadow-2xl animate-float">
                            <Heart className="text-red-400" size={24} />
                        </div>
                        <div className="absolute -bottom-10 -left-10 p-6 glass rounded-3xl border border-white/20 shadow-2xl animate-float delay-700">
                            <ShieldCheck className="text-emerald-400" size={24} />
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="space-y-10">
                        <div>
                            <h2 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter text-white leading-none">
                                Por que o <br />
                                <span className="text-cyan-500 tracking-widest uppercase text-3xl block mt-2">ConextBot?</span>
                            </h2>
                            <p className="text-gray-400 text-xl font-light leading-relaxed max-w-xl">
                                Nascemos de uma premissa simples: **Humanos não foram feitos para tarefas repetitivas.** 
                                Nossa missão é automatizar a burocracia do atendimento para que você foque no que importa: **estratégia e escala.**
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="space-y-3 p-6 rounded-3xl hover:bg-white/5 transition-colors">
                                <Zap className="text-cyan-400" size={20} />
                                <h5 className="text-white font-bold italic lowercase tracking-tight text-lg">Velocidade <span className="text-cyan-500">Exponencial</span></h5>
                                <p className="text-xs text-gray-500 leading-relaxed">Leads não esperam. Respondemos em milissegundos, garantindo que o timing da venda nunca seja perdido.</p>
                            </div>
                            <div className="space-y-3 p-6 rounded-3xl hover:bg-white/5 transition-colors">
                                <ShieldCheck className="text-emerald-400" size={20} />
                                <h5 className="text-white font-bold italic lowercase tracking-tight text-lg">Confiança <span className="text-emerald-500">Neural</span></h5>
                                <p className="text-xs text-gray-500 leading-relaxed">Nossas vozes e textos não parecem robóticos. Construímos autoridade através de uma comunicação humana e empática.</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex items-center gap-4">
                             <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {i === 4 ? '+500' : ''}
                                    </div>
                                ))}
                             </div>
                             <p className="text-xs text-gray-500 italic">"Empresas escalando com inteligência real."</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] -z-10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] -z-10 rounded-full"></div>
        </section>
    );
}
