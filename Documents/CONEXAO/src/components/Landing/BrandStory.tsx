import { Target, Zap, Layout, Palette, TrendingUp } from "lucide-react";

export default function BrandStory() {
    return (
        <section className="py-32 px-6 relative overflow-hidden bg-black/20">
            <div className="max-w-7xl mx-auto">
                
                {/* PIPELINE SECTION */}
                <div className="mb-32 text-center" id="agencias">
                    <h4 className="text-indigo-500 font-black uppercase tracking-[0.3em] text-sm mb-6">Pipeline</h4>
                    <h2 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter text-white">
                        Três passos para o <span className="text-indigo-500">topo.</span>
                    </h2>
                    <p className="text-gray-400 text-xl font-light mb-16 max-w-2xl mx-auto">
                        De agência iniciante a império de tecnologia em tempo recorde.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-10 glass rounded-[2.5rem] border border-white/5 relative group hover:border-indigo-500/30 transition-all">
                            <span className="text-8xl font-black text-white/5 absolute top-5 right-10">01</span>
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20">
                                <Target className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white text-left italic">Onboarding Imediato</h3>
                            <p className="text-gray-400 text-sm text-left leading-relaxed">Crie sua agência instantaneamente. Sem burocracia, sem cartões. Seu painel exclusivo já vem pronto para operar.</p>
                        </div>

                        <div className="p-10 glass rounded-[2.5rem] border border-white/5 relative group hover:border-indigo-500/30 transition-all">
                            <span className="text-8xl font-black text-white/5 absolute top-5 right-10">02</span>
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20">
                                <Zap className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white text-left italic">Engenharia de Preços</h3>
                            <p className="text-gray-400 text-sm text-left leading-relaxed">Você dita as regras. Configure margens, limites e recursos. Nossa infraestrutura é o seu palco de lucros.</p>
                        </div>

                        <div className="p-10 glass rounded-[2.5rem] border border-white/5 relative group hover:border-indigo-500/30 transition-all">
                            <span className="text-8xl font-black text-white/5 absolute top-5 right-10">03</span>
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20">
                                <TrendingUp className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-white text-left italic">Escala Global</h3>
                            <p className="text-gray-400 text-sm text-left leading-relaxed">Entregue agentes de IA treinados, voz humana e WhatsApp 24/7. O sucesso do seu cliente é o seu MRR.</p>
                        </div>
                    </div>
                </div>

                {/* INFRAESTRUTURA SECTION */}
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <h4 className="text-indigo-500 font-black uppercase tracking-[0.3em] text-sm mb-6">Infraestrutura</h4>
                        <h2 className="text-5xl md:text-6xl font-black mb-10 italic tracking-tighter text-white leading-tight">
                            Um Arsenal Completo <br />
                            <span className="text-indigo-500">para sua Agência.</span>
                        </h2>
                        
                        <div className="space-y-10">
                            <div className="flex gap-6 group">
                                <div className="w-14 h-14 glass rounded-2xl border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/10 transition-all">
                                    <Layout className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-xl mb-2 italic">Portal da Agência 3.0</h4>
                                    <p className="text-gray-500 text-sm">Monitore lucros, MRR e saúde financeira de cada cliente em um painel analítico de alta performance.</p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-14 h-14 glass rounded-2xl border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/10 transition-all">
                                    <Palette className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-xl mb-2 italic">Puro White-Label</h4>
                                    <p className="text-gray-500 text-sm">Customização cirúrgica. Domínios próprios, logos, cores e e-mails transacionais com a sua marca.</p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-14 h-14 glass rounded-2xl border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/10 transition-all">
                                    <TrendingUp className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-xl mb-2 italic">Markup Dinâmico</h4>
                                    <p className="text-gray-500 text-sm">Flexibilidade total. Defina o quanto quer lucrar sobre cada ferramenta individualmente.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard Mockup */}
                    <div className="relative">
                        <div className="absolute -inset-10 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                        <div className="glass rounded-[3rem] border border-white/10 p-12 relative overflow-hidden">
                            <div className="grid grid-cols-2 gap-6 mb-10">
                                <div className="p-6 bg-white/5 rounded-3xl">
                                    <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-2">MRR</span>
                                    <h3 className="text-3xl font-black text-white italic">R$ 45k</h3>
                                </div>
                                <div className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                                    <span className="text-[10px] uppercase font-black text-indigo-400 tracking-widest block mb-2">Lucro</span>
                                    <h3 className="text-3xl font-black text-white italic">R$ 12k</h3>
                                </div>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full mb-4 w-full"></div>
                            <div className="h-4 bg-white/5 rounded-full mb-4 w-4/5"></div>
                            <div className="h-4 bg-white/5 rounded-full mb-4 w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
