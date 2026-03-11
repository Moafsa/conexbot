export default function IntelligenceDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Supervisor & Insights IA
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg">
                    O cérebro estratégico por trás de cada interação. O **SupervisorService** é o componente que transforma conversas em dados acionáveis.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">1. O Papel do Supervisor</h2>
                <p className="text-sm text-gray-400">
                    Diferente do Agente que responde ao cliente, o Supervisor analisa a conversa em "segundo plano" (background) para:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 glass rounded-2xl border border-white/5 bg-indigo-500/5">
                        <h4 className="font-bold text-indigo-400 mb-2">Lead Scoring (0-100)</h4>
                        <p className="text-xs text-gray-500">Calcula a propensão de compra baseada em intenções e perguntas críticas.</p>
                    </div>
                    <div className="p-5 glass rounded-2xl border border-white/5 bg-purple-500/5">
                        <h4 className="font-bold text-purple-400 mb-2">Análise de Sentimento</h4>
                        <p className="text-xs text-gray-500">Classifica o humor do cliente (Positivo, Neutro ou Negativo) para priorizar atendimentos.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">2. Multi-Agentes & Delegação</h2>
                <p className="text-gray-400">
                    O sistema suporta orquestração. Se o Supervisor detectar que um cliente precisa de um especialista (ex: suporte técnico ou fechamento), 
                    ele pode trocar o bot atual por outro bot mais adequado automaticamente.
                </p>
                <pre className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] text-gray-500 overflow-x-auto">
{`// Retorno real do Supervisor em JSON
{
  "nextStage": "NEGOCIAÇÃO",
  "assignedBotId": "clx...bot_vendas",
  "sentiment": "POSITIVE",
  "insight": "Cliente interessado no plano anual, mas preocupado com suporte."
}`}
                </pre>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">3. Insights Gerenciais</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Cada interação gera um **Insight** — uma observação estratégica para o gestor. Isso permite ler rapidamente o que aconteceu na 
                    conversa sem precisar abrir todo o histórico das mensagens.
                </p>
            </section>
        </div>
    );
}
