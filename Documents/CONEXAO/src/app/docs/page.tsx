import { Cpu, Zap, Brain, MessageSquare, ShieldCheck, PieChart, Globe } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section>
                <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Manual do Conext Bot
                </h1>
                <p className="text-lg text-gray-400 leading-relaxed">
                    O Conext Bot é uma infraestrutura completa de **atendimento automatizado com IA de alta fidelidade**. 
                    Ao contrário de chatbots tradicionais, o sistema utiliza RAG (Retrieval-Augmented Generation) para responder 
                    baseado em dados reais do seu negócio, integrando **WhatsApp e WordPress** com voz, texto e pagamentos.
                </p>
            </section>

            {/* System Architecture Overview */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: "Motor de IA", desc: "Baseado em GPT-4o-mini com processamento de contexto semântico.", icon: Cpu, color: "text-blue-400" },
                    { title: "RAG Nativo", desc: "Indexação automática de sites, PDFs e manuais diretamente no banco vetorial.", icon: Brain, color: "text-purple-400" },
                    { title: "Plugin WordPress", desc: "Sincronização WooCommerce e atendimento híbrido (WhatsApp + Site).", icon: Globe, color: "text-indigo-400" },
                    { title: "Vozes Premium", desc: "Áudios gerados via ElevenLabs com entonação humana ultra-realista.", icon: MessageSquare, color: "text-pink-400" },
                    { title: "Funil CRM", desc: "Classificação automática de leads e movimentação de estágios via IA.", icon: PieChart, color: "text-green-400" },
                    { title: "Pagamentos", desc: "Checkout direto no chat com geração de PIX e split de comissão via Asaas.", icon: ShieldCheck, color: "text-yellow-400" },
                ].map((item, i) => (
                    <div key={i} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <item.icon className={`${item.color} mb-3`} size={24} />
                        <h3 className="font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </section>

            {/* How it works below the hood */}
            <section className="p-8 glass rounded-3xl border border-white/10 bg-white/5 space-y-4">
                <h3 className="text-xl font-bold text-white italic underline decoration-purple-500 underline-offset-8">Como funciona o atendimento duplo?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    O plugin monitora o hook `wp_insert_comment`. Quando um novo comentário entra:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-white/5 rounded-xl bg-black/20">
                        <h4 className="text-blue-400 font-bold text-xs mb-2 uppercase">Fluxo Web (WordPress)</h4>
                        <p className="text-[10px] text-gray-500">A IA analisa o comentário e responde diretamente no site, mantendo o engajamento e SEO.</p>
                    </div>
                    <div className="p-4 border border-white/5 rounded-xl bg-black/20">
                        <h4 className="text-emerald-400 font-bold text-xs mb-2 uppercase">Fluxo CRM (WhatsApp)</h4>
                        <p className="text-[10px] text-gray-500">O robô identifica se o cliente tem um WhatsApp vinculado e envia a resposta via chat direto.</p>
                    </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mt-4">
                    <p className="text-xs text-yellow-200 font-medium italic">
                        💡 Dica: No WordPress, você pode ver os Logs de Sincronização em tempo real para depurar quais produtos foram enviados para a IA.
                    </p>
                </div>
            </section>

            {/* Core Flow Explanation */}
            <section className="space-y-8 bg-white/5 p-8 rounded-3xl border border-white/10">
                <h2 className="text-2xl font-bold text-white">Como o Sistema Funciona?</h2>
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-white">1</div>
                        <div>
                            <h4 className="font-bold text-gray-200">Ingestão de Dados</h4>
                            <p className="text-sm text-gray-400 mt-1">Você cadastra o site ou faz upload de arquivos. O `KnowledgeService` processa esse conteúdo em chunks semânticos e armazena vetores no banco de dados.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-white">2</div>
                        <div>
                            <h4 className="font-bold text-gray-200">Processamento de Mensagem</h4>
                            <p className="text-sm text-gray-400 mt-1">Quando um cliente envia um "Olá", o `MessageProcessor` busca o contexto mais relevante no Vector Store e consulta a IA para gerar uma resposta específica para o seu negócio.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-white">3</div>
                        <div>
                            <h4 className="font-bold text-gray-200">Integração & Vendas</h4>
                            <p className="text-sm text-gray-400 mt-1">Conecte o bot ao seu WhatsApp e WordPress. Se o cliente demonstrar intenção de compra, a IA gera links de pagamento e move o lead no CRM automaticamente.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Getting Help */}
            <footer className="pt-8 border-t border-white/5">
                <p className="text-sm text-gray-500 italic">Explore a sidebar lateral para detalhes técnicos de cada módulo.</p>
            </footer>
        </div>
    );
}
