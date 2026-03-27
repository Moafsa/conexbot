import { BrainCircuit, Play, Cpu, Database, Save, MessageSquare, Terminal, Eye, Sparkles } from "lucide-react";

export default function AiTrainingDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero Arquiteto */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <BrainCircuit className="text-purple-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        IA Arquiteto & Treinamento
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    O **IA Arquiteto** é onde você define a personalidade, o conhecimento e o comportamento do seu agente assistente. Aqui, unimos a inteligência do GPT-4 com a sua base de dados proprietária de forma nativa.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/20 transition-all">
                        <Cpu className="text-purple-400 mb-4" size={24} />
                        <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Cérebro Central</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Configuração de System Prompts e chaves de API individuais por robô.</p>
                    </div>
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/20 transition-all">
                        <Database className="text-blue-400 mb-4" size={24} />
                        <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Base RAG</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Treinamento via arquivos PDF, TXT ou links de sites com Crawler automático.</p>
                    </div>
                    <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/20 transition-all">
                        <Eye className="text-emerald-400 mb-4" size={24} />
                        <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Monitor de Pensamento</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Veja exatamente o que a IA consultou de cada documento antes de responder.</p>
                    </div>
                </div>
            </section>

            {/* 1. System Prompt */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-purple-500 underline-offset-8 decoration-4">
                    <Terminal className="text-gray-400" /> 1. O Prompt do Sistema
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl px-2">
                    O Prompt é o "manual de instruções" da IA. Ele define quem o bot é e o que ele pode (ou não) fazer. É a alma do atendimento.
                </p>
                
                <div className="p-10 glass rounded-[2.5rem] border border-white/10 bg-black/40 space-y-6 shadow-2xl">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Sparkles size={14} /> Exemplo de Prompt Eficaz:
                    </h4>
                    <pre className="text-xs text-gray-500 leading-relaxed bg-black/20 p-6 rounded-3xl border border-white/5 whitespace-pre-wrap font-mono scrollbar-thin scrollbar-thumb-white/5">
{`Você é a Alice, atendente virtual da Loja ToySport.
Seu tom é amigável, entusiasmado e use emojis de esporte ⚽.
DASHBOARD: Você tem acesso ao estoque real no WooCommerce.
REGRA CRÍTICA: Nunca invente preços. Se não encontrar o produto na base, peça um momento e chame um humano.`}
                    </pre>
                </div>
            </section>

            {/* 2. Base de Conhecimento (RAG) */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-blue-500 underline-offset-8 decoration-4">
                    <Database className="text-blue-500" /> 2. Treinamento Automatizado
                </h2>
                <div className="p-8 glass rounded-[2rem] border border-white/5 bg-white/5 space-y-6">
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Nosso sistema utiliza **RAG (Retrieval-Augmented Generation)**. Diferente de IAs comuns, seu assistente lê seus documentos antes de cada resposta.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="p-6 border border-white/5 rounded-3xl bg-black/40">
                            <h5 className="text-white font-bold text-xs uppercase tracking-widest mb-2">Web Crawler</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed">A IA navega e aprende sobre seus serviços, posts de blog e páginas inteiras automaticamente via URL.</p>
                        </div>
                        <div className="p-6 border border-white/5 rounded-3xl bg-black/40">
                            <h5 className="text-white font-bold text-xs uppercase tracking-widest mb-2">Upload de Arquivos</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed">Carregue manuais de produtos complexos (PDF) ou scripts de vendas prontos (TXT/Markdown).</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Info Section */}
            <section className="p-8 glass rounded-[2.5rem] border border-white/10 bg-purple-500/5 max-w-2xl shadow-xl flex items-center gap-6">
                <div className="p-4 rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                    <Save size={24} />
                </div>
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    "Um bot treinado com RAG elimina 95% das alucinações da IA e responde apenas o que você determinou nos manuais técnicos."
                </p>
            </section>
        </div>
    );
}
