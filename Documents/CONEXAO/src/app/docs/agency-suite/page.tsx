import { Briefcase, Users, KanbanSquare, Workflow, ClipboardCheck, ArrowRight, CheckCircle } from "lucide-react";

export default function AgencySuiteDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="text-indigo-400" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Squads, Tarefas &amp; Workflows (Agência)
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Exclusivo para contas de agência: um time inteiro de especialistas em marketing, movido a IA, para gerenciar a operação interna de cada cliente — sem contratar ninguém.
                </p>
            </section>

            {/* Squads */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-indigo-500 underline-offset-8 decoration-4">
                    <Users className="text-gray-400" /> Squads de Especialistas IA
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                    A agência tem acesso a squads temáticos (Copy, Branding, Tráfego Pago, Dados, Ofertas, Storytelling, Design e mais), cada um com vários agentes especializados inspirados em referências reais do marketing. Escolha um cliente, abra o squad certo para o problema e converse com o especialista — as respostas já vêm contextualizadas com os dados daquele cliente.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-6 glass rounded-[2rem] border border-white/5 bg-indigo-500/5">
                        <h5 className="text-white font-black text-[10px] uppercase tracking-widest mb-2">Copy &amp; Ofertas</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Headlines, scripts de vendas e construção de ofertas irresistíveis.</p>
                    </div>
                    <div className="p-6 glass rounded-[2rem] border border-white/5 bg-purple-500/5">
                        <h5 className="text-white font-black text-[10px] uppercase tracking-widest mb-2">Tráfego &amp; Dados</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Estratégia de campanhas, segmentação e leitura de métricas.</p>
                    </div>
                    <div className="p-6 glass rounded-[2rem] border border-white/5 bg-pink-500/5">
                        <h5 className="text-white font-black text-[10px] uppercase tracking-widest mb-2">Marca &amp; Storytelling</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Posicionamento, narrativa de marca e identidade visual.</p>
                    </div>
                </div>
                <p className="text-[11px] text-gray-500 italic">Agências também podem criar agentes próprios, personalizados para nichos específicos, além do catálogo padrão.</p>
            </section>

            {/* Tasks Kanban */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-white/5 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic">
                    <KanbanSquare className="text-blue-400" /> Quadro de Tarefas por Cliente
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                    Um Kanban simples para organizar a entrega de cada cliente: <strong className="not-italic text-gray-300">A Fazer → Em Execução → Aprovado p/ Cliente → Concluído</strong>. Cada tarefa pode ficar vinculada ao squad e ao especialista IA responsável, mantendo o histórico de quem gerou o quê.
                </p>
            </section>

            {/* Workflows */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic font-black underline decoration-emerald-500 underline-offset-8 decoration-4">
                    <Workflow className="text-gray-400" /> Workflows Prontos
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                    Sequências automáticas que encadeiam vários squads em um clique. Exemplo: o workflow &quot;Campanha de Lançamento&quot; aciona Copy, Marca e Tráfego em sequência e entrega roteiro de vídeo de vendas, posicionamento de marca e três criativos de anúncio em menos de um minuto.
                </p>
                <div className="p-6 bg-black/40 border border-white/5 rounded-3xl flex items-center gap-3 max-w-xl">
                    <ArrowRight size={16} className="text-emerald-400 shrink-0" />
                    <p className="text-xs text-gray-400">O resultado pode ser enviado direto ao cliente via WhatsApp, com uma etapa opcional de confirmação antes do envio.</p>
                </div>
            </section>

            {/* Audits */}
            <section className="p-10 glass rounded-[2.5rem] border border-white/10 bg-cyan-500/5 space-y-6">
                <h3 className="text-xl font-black text-white flex items-center gap-3 italic">
                    <ClipboardCheck className="text-cyan-400" /> Auditoria de Cliente
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                    Gera um raio-x com nota geral da presença digital do cliente e uma lista de &quot;missões&quot; recomendadas para melhorar — útil tanto para prospecção comercial (mostrar o que está errado antes de fechar contrato) quanto para acompanhamento contínuo.
                </p>
            </section>

            <section className="flex items-center gap-4 p-8 glass rounded-[2rem] border border-white/5 bg-black/20 max-w-2xl">
                <CheckCircle size={28} className="text-emerald-400 shrink-0" />
                <p className="text-sm text-gray-500 leading-relaxed italic">
                    Onboarding de novo cliente: a IA pode até ler o site atual do cliente e extrair um cardápio/catálogo automaticamente para popular o bot dele mais rápido.
                </p>
            </section>
        </div>
    );
}
