import Link from "next/link";
import { 
    Cpu, Zap, Brain, MessageSquare, ShieldCheck, PieChart, 
    Globe, Calendar, Database, ArrowRight, Rocket, Settings, PencilLine
} from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-16 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Hero Section */}
            <section className="relative overflow-hidden p-12 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/5">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Manual Conext
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed italic">
                        Bem-vindo à infraestrutura de elite. Aprenda a dominar o ecossistema e escalar sua agência White-Label.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-8">
                        <Link href="/docs/settings" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all flex items-center gap-2 text-sm shadow-xl shadow-indigo-600/20">
                            Começar agora <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
            </section>

            {/* Core Pillars Grid */}
            <div className="space-y-12">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic uppercase tracking-widest text-sm">
                    <Rocket className="text-indigo-400" /> Ecossistema Conext
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ModuleCard 
                        title="WhatsApp de Elite" 
                        desc="Configure instâncias Uzapi de latência zero para sua agência." 
                        href="/docs/whatsapp" 
                        icon={Zap} 
                        color="text-emerald-400"
                        bg="bg-emerald-500/5"
                    />
                    <ModuleCard 
                        title="Voz Humana Real" 
                        desc="Sincronia neural com ElevenLabs para áudios que vendem." 
                        href="/docs/intelligence" 
                        icon={Cpu} 
                        color="text-purple-400"
                        bg="bg-purple-500/5"
                    />
                    <ModuleCard 
                        title="Treinamento Rápido" 
                        desc="Base de conhecimento via URL ou PDF em segundos." 
                        href="/docs/ai-training" 
                        icon={Brain} 
                        color="text-pink-400"
                        bg="bg-pink-500/5"
                    />
                    <ModuleCard 
                        title="Agendamento IA" 
                        desc="Booking inteligente com Google Calendar e lembretes." 
                        href="/docs/agenda" 
                        icon={Calendar} 
                        color="text-indigo-400"
                        bg="bg-indigo-500/5"
                    />
                    <ModuleCard 
                        title="CRM Visual Inteligente" 
                        desc="Gestão tática baseada no sentimento e intenção do lead." 
                        href="/docs/crm" 
                        icon={PieChart} 
                        color="text-blue-400"
                        bg="bg-blue-500/5"
                    />
                    <ModuleCard 
                        title="Split de Pagamentos" 
                        desc="Configuração Asaas e divisão automática de MRR." 
                        href="/docs/payments" 
                        icon={Database} 
                        color="text-orange-400"
                        bg="bg-orange-500/5"
                    />
                    <ModuleCard 
                        title="Supervisor AI" 
                        desc="Auditoria e melhoria contínua dos seus agentes de IA." 
                        href="/docs/intelligence" 
                        icon={ShieldCheck} 
                        color="text-cyan-400"
                        bg="bg-cyan-500/5"
                    />
                    <ModuleCard 
                        title="Conext Writer" 
                        desc="IA para posts e SEO nativo dentro do WordPress." 
                        href="/docs/ai-writer" 
                        icon={PencilLine} 
                        color="text-green-400"
                        bg="bg-green-500/5"
                    />
                    <ModuleCard 
                        title="Setup & Branding" 
                        desc="Configuração White-Label e chaves de API." 
                        href="/docs/settings" 
                        icon={Settings} 
                        color="text-gray-400"
                        bg="bg-gray-500/5"
                    />
                </div>
            </div>

            {/* Quick Tips */}
            <section className="p-8 border border-white/5 rounded-3xl bg-black/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 italic uppercase text-xs tracking-widest">
                    <MessageSquare size={18} className="text-indigo-400" /> Escala Reversa
                </h3>
                <p className="text-sm text-gray-500 italic leading-relaxed">
                    "Lembre-se: sua agência escala com base no MRR total. Acompanhe seu tier (Bronze ao Diamante) no Dashboard de Infraestrutura para maximizar sua lucratividade."
                </p>
            </section>
        </div>
    );
}

function ModuleCard({ title, desc, href, icon: Icon, color, bg }: any) {
    return (
        <Link href={href} className={`p-8 rounded-[2rem] border border-white/5 ${bg} hover:border-indigo-500/30 hover:scale-[1.02] transition-all group relative overflow-hidden`}>
            <div className="relative z-10">
                <Icon className={`${color} mb-6 group-hover:scale-110 transition-transform`} size={32} />
                <h3 className="font-bold text-white mb-2 text-xl italic">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
            {/* Hover Arrow */}
            <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} className={color} />
            </div>
        </Link>
    );
}
