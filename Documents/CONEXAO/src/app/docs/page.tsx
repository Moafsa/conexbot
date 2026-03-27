import Link from "next/link";
import { 
    Cpu, Zap, Brain, MessageSquare, ShieldCheck, PieChart, 
    Globe, Calendar, Database, ArrowRight, PlayCircle, Rocket, Settings
} from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-16 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Hero Section */}
            <section className="relative overflow-hidden p-12 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/5">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Manual ConextBot
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        Bem-vindo à documentação oficial. Aprenda a configurar seu assistente de IA, conectar canais e automatizar suas vendas de ponta a ponta.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-8">
                        <Link href="/docs/settings" className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 text-sm shadow-xl shadow-white/5">
                            Começar agora <ArrowRight size={18} />
                        </Link>
                        <Link 
                            href="/conexbot-wp.zip" 
                            download 
                            className="px-6 py-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold rounded-xl hover:bg-blue-600/20 transition-all flex items-center gap-2 text-sm shadow-xl shadow-blue-500/5 group"
                        >
                            <Globe size={18} className="group-hover:rotate-12 transition-transform" />
                            Download Plugin WP
                        </Link>
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
            </section>

            {/* Core Pillars Grid */}
            <div className="space-y-12">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                    <Rocket className="text-indigo-400" /> Explorar Módulos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ModuleCard 
                        title="Conexão WhatsApp" 
                        desc="Configure sua instância Uzapi e conecte via QR Code." 
                        href="/docs/whatsapp" 
                        icon={Zap} 
                        color="text-emerald-400"
                        bg="bg-emerald-500/5"
                    />
                    <ModuleCard 
                        title="Plugin WordPress" 
                        desc="Sincronize WooCommerce, posts e comentários." 
                        href="/docs/wordpress" 
                        icon={Globe} 
                        color="text-blue-400"
                        bg="bg-blue-500/5"
                    />
                    <ModuleCard 
                        title="Arquiteto & Treino" 
                        desc="Defina a personalidade e treine a IA com seus dados." 
                        href="/docs/ai-training" 
                        icon={Brain} 
                        color="text-purple-400"
                        bg="bg-purple-500/5"
                    />
                    <ModuleCard 
                        title="Follow-up & Réguas" 
                        desc="Automação de retomada de leads e mensagens pós-venda." 
                        href="/docs/automation" 
                        icon={ShieldCheck} 
                        color="text-yellow-400"
                        bg="bg-yellow-500/5"
                    />
                    <ModuleCard 
                        title="Agenda & Booking" 
                        desc="Links de agendamento e sincronia com Google Calendar." 
                        href="/docs/agenda" 
                        icon={Calendar} 
                        color="text-indigo-400"
                        bg="bg-indigo-500/5"
                    />
                    <ModuleCard 
                        title="CRM & Pipeline" 
                        desc="Movimentação automática de funil e lead scoring." 
                        href="/docs/crm" 
                        icon={PieChart} 
                        color="text-pink-400"
                        bg="bg-pink-500/5"
                    />
                    <ModuleCard 
                        title="Catálogo & Vendas" 
                        desc="Produtos, links de checkout e Split de Pagamentos Asaas." 
                        href="/docs/catalog" 
                        icon={Database} 
                        color="text-orange-400"
                        bg="bg-orange-500/5"
                    />
                    <ModuleCard 
                        title="Insights & Voz IA" 
                        desc="Supervisor estratégico e síntese neural ElevenLabs." 
                        href="/docs/intelligence" 
                        icon={Cpu} 
                        color="text-cyan-400"
                        bg="bg-cyan-500/5"
                    />
                    <ModuleCard 
                        title="Setup & Chaves" 
                        desc="Ajustes de API, OpenAI, ElevenLabs e Asaas." 
                        href="/docs/settings" 
                        icon={Settings} 
                        color="text-gray-400"
                        bg="bg-gray-500/5"
                    />
                </div>
            </div>

            {/* Quick Tips */}
            <section className="p-8 border border-white/5 rounded-3xl bg-black/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-400" /> Dica de Especialista
                </h3>
                <p className="text-sm text-gray-500 italic leading-relaxed">
                    "Para obter os melhores resultados, comece treinando seu bot no módulo **Arquiteto** e use o **Simulador** para validar as respostas antes de conectar ao WhatsApp oficial."
                </p>
            </section>
        </div>
    );
}

function ModuleCard({ title, desc, href, icon: Icon, color, bg }: any) {
    return (
        <Link href={href} className={`p-6 rounded-[2rem] border border-white/5 ${bg} hover:border-white/10 hover:scale-[1.02] transition-all group relative overflow-hidden`}>
            <div className="relative z-10">
                <Icon className={`${color} mb-4 group-hover:scale-110 transition-transform`} size={28} />
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
            {/* Hover Arrow */}
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={16} className={color} />
            </div>
        </Link>
    );
}
