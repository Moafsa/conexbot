import { BrainCircuit, Play, Cpu, Database, Save, MessageSquare, Terminal, Eye } from "lucide-react";

export default function AiTrainingDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero Arquiteto */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <BrainCircuit className="text-purple-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                        IA Arquiteto & Treinamento
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg mb-8">
                    O **IA Arquiteto** é onde você define a personalidade, o conhecimento e o comportamento do seu agente. Aqui, unimos a inteligência do GPT-4 com a sua base de dados proprietária.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-purple-500/5">
                        <Cpu className="text-purple-400 mb-4" size={24} />
                        <h4 className="font-bold text-white mb-2 text-sm">Cérebro Central</h4>
                        <p className="text-[11px] text-gray-500">Configuração de System Prompts e chaves de API individuais.</p>
                    </div>
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-blue-500/5">
                        <Database className="text-blue-400 mb-4" size={24} />
                        <h4 className="font-bold text-white mb-2 text-sm">Base RAG</h4>
                        <p className="text-[11px] text-gray-500">Treinamento via arquivos PDF, TXT ou links de sites (Crawl).</p>
                    </div>
                    <div className="p-6 glass rounded-2xl border border-white/5 bg-emerald-500/5">
                        <Eye className="text-emerald-400 mb-4" size={24} />
                        <h4 className="font-bold text-white mb-2 text-sm">Simulador Real</h4>
                        <p className="text-[11px] text-gray-500">Teste o comportamento do bot antes do "deploy" oficial.</p>
                    </div>
                </div>
            </section>

            {/* 1. System Prompt */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Terminal className="text-gray-400" /> 1. O Prompt do Sistema
                </h2>
                <p className="text-sm text-gray-400">
                    O Prompt é o "manual de instruções" da IA. Ele define quem o bot é e o que ele pode (ou não) fazer.
                </p>
                
                <div className="p-6 glass rounded-2xl border border-white/10 bg-black/40 space-y-4">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-widest">Exemplo de Prompt Eficaz:</h4>
                    <pre className="text-[10px] text-gray-500 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
{`Você é a Alice, atendente virtual da Loja ToySport.
Seu tom é amigável, entusiasmado e use emojis de esporte ⚽.
DASHBOARD: Você tem acesso ao estoque real no WooCommerce.
REGRA CRÍTICA: Nunca invente preços. Se não encontrar o produto na base, peça um momento e chame um humano.`}
                    </pre>
                </div>
            </section>

            {/* 2. Base de Conhecimento (RAG) */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Database className="text-blue-500" /> 2. Treinamento Baseado em Dados
                </h2>
                <p className="text-sm text-gray-400">
                    Nosso sistema utiliza **RAG (Retrieval-Augmented Generation)**. A IA lê seus documentos e utiliza as respostas neles contidas.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-white/5 rounded-xl bg-white/5">
                        <h5 className="text-white font-medium text-xs mb-1">Links Externos (Crawler)</h5>
                        <p className="text-[10px] text-gray-500">A IA navega no seu site e aprende sobre seus serviços automaticamente.</p>
                    </div>
                    <div className="p-4 border border-white/5 rounded-xl bg-white/5">
                        <h5 className="text-white font-medium text-xs mb-1">Arquivos (PDF/TXT)</h5>
                        <p className="text-[10px] text-gray-500">Faça upload de manuais de produto e scripts de vendas.</p>
                    </div>
                </div>
            </section>

            {/* 3. O Simulador (Testing Phase) */}
            <section className="space-y-6 bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Play className="text-emerald-400" /> 3. Testando no Simulador
                </h2>
                <p className="text-sm text-gray-400">
                    Antes de conectar o bot ao seu WhatsApp oficial, use o **Simulador de Chat** nativo.
                </p>
                
                <div className="space-y-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <MessageSquare className="text-emerald-400" size={16} />
                        </div>
                        <div>
                            <h5 className="text-white font-bold text-xs">Simulação em Tempo Real</h5>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Envie mensagens como se fosse um cliente. O simulador mostrará exatamente o processo de raciocínio da IA e quais trechos do seu documento foram consultados.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Save className="text-blue-400" size={16} />
                        </div>
                        <div>
                            <h5 className="text-white font-bold text-xs">Ajuste e Salve</h5>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                Se a IA responder algo incorretamente, ajuste o System Prompt e teste novamente. O ciclo de feedback é instantâneo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Call */}
            <section className="text-center p-8">
                <p className="text-xs text-gray-500 italic">
                    "Um bot bem treinado converte 4x mais do que um fluxo estático de opções."
                </p>
            </section>
        </div>
    );
}
