import Link from "next/link";
import { Cpu, Zap, Brain, MessageSquare, ShieldCheck, PieChart, Globe, Calendar, Database, ArrowRight } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-16 pb-20">
            {/* Hero Section */}
            <section>
                <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                    Manual do Conext Bot
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-3xl">
                    Sua infraestrutura completa de **atendimento automatizado com IA**. 
                    Utilize o poder do RAG para responder baseado em dados reais, integrando 
                    WhatsApp e WordPress com fluxos de vendas e pagamentos nativos.
                </p>
            </section>

            {/* Core Pillars */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                    title="Motor de IA" 
                    desc="GPT-4o com processamento de contexto semântico e memória de curto prazo." 
                    icon={Cpu} 
                    color="text-blue-400" 
                />
                <FeatureCard 
                    title="RAG & Treino" 
                    desc="Indexação automática de sites, PDFs e manuais diretamente no banco vetorial." 
                    icon={Brain} 
                    color="text-purple-400" 
                />
                <FeatureCard 
                    title="Plugin Híbrido" 
                    desc="Sincronização WooCommerce e atendimento em posts/comentários WordPress." 
                    icon={Globe} 
                    color="text-indigo-400" 
                />
                <FeatureCard 
                    title="Vozes Reais" 
                    desc="Áudios premium via ElevenLabs com entonação humana ultra-realista no WhatsApp." 
                    icon={MessageSquare} 
                    color="text-pink-400" 
                />
                <FeatureCard 
                    title="Automação CRM" 
                    desc="Classificação de leads, follow-ups e movimentação de funil orientada por IA." 
                    icon={PieChart} 
                    color="text-green-400" 
                />
                <FeatureCard 
                    title="Agenda & Pagos" 
                    desc="Agendamentos via Google Calendar e checkout direto com PIX Asaas." 
                    icon={ShieldCheck} 
                    color="text-yellow-400" 
                />
            </section>

            {/* Quick Access Cards */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white italic underline decoration-indigo-500 underline-offset-8">Principais Módulos</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <DocCard 
                        title="Follow-up & Réguas" 
                        description="Automações inteligentes de retomada e pós-venda." 
                        href="/docs/automation"
                        icon={Zap}
                    />
                    <DocCard 
                        title="Agenda & Booking" 
                        description="Sincronize com o Google Calendar e agende reuniões via Chat." 
                        href="/docs/agenda"
                        icon={Calendar}
                    />
                    <DocCard 
                        title="Catálogo & Pagamentos" 
                        description="Links dinâmicos de pagamento Asaas e gestão WooCommerce." 
                        href="/docs/catalog"
                        icon={Database}
                    />
                </div>
            </section>

            {/* Core Workflow */}
            <section className="p-8 glass rounded-3xl border border-white/10 bg-white/5 space-y-8">
                <h3 className="text-2xl font-bold text-white italic">Como começar?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">1</div>
                            <div>
                                <h4 className="font-bold text-gray-200">Alimente o Cérebro</h4>
                                <p className="text-xs text-gray-500 mt-1">Configure o Arquiteto de IA com seus arquivos ou links de site para criar a base de conhecimento (RAG).</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">2</div>
                            <div>
                                <h4 className="font-bold text-gray-200">Conecte os Canais</h4>
                                <p className="text-xs text-gray-500 mt-1">Vincule seu WhatsApp via Uzapi ou instale o Plugin WordPress para sincronizar produtos e comentários.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">3</div>
                            <div>
                                <h4 className="font-bold text-gray-200">Ative as Vendas</h4>
                                <p className="text-xs text-gray-500 mt-1">Configure o seu Catálogo e Agenda para que a IA possa fechar negócios e marcar reuniões automaticamente.</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <p className="text-sm text-gray-400 italic mb-4">"O ConextBot não é apenas um chatbot, é um funcionário digital que aprende com o seu negócio."</p>
                        <Link href="/docs/settings" className="flex items-center gap-2 text-indigo-400 font-bold hover:underline">
                            Configurações Iniciais <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ title, desc, icon: Icon, color }: any) {
    return (
        <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
            <Icon className={`${color} mb-4 group-hover:scale-110 transition-transform`} size={28} />
            <h3 className="font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        </div>
    );
}

function DocCard({ title, description, href, icon: Icon }: any) {
    return (
        <Link href={href} className="p-6 glass rounded-3xl border border-white/5 hover:bg-white/5 transition-all block group">
            <Icon className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
            <h4 className="text-white font-bold mb-2">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
        </Link>
    );
}
