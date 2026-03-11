export default function AutomationDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Buffer & Follow-up Automático
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg">
                    Eficiência rítmica. Entenda como o sistema evita respostas fragmentadas e reengaja clientes parados.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">1. Message Buffering (Debounce)</h2>
                <p className="text-sm text-gray-400">
                    Para evitar que o bot responda 5 vezes a 5 mensagens enviadas rapidamente, o **BufferingService** agrupa o conteúdo.
                </p>
                <ul className="space-y-4 text-xs text-gray-500">
                    <li className="flex gap-3">
                        <span className="text-indigo-500 font-bold italic">Processo:</span> 
                        O sistema espera 1500ms (milisegundos) após a última mensagem antes de consultar a IA. 
                    </li>
                    <li className="flex gap-3">
                        <span className="text-indigo-500 font-bold italic">Resultado:</span> 
                        Respostas muito mais inteligentes que analisam o contexto completo do que o usuário digitou ou enviou em áudio.
                    </li>
                </ul>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">2. Follow-up de Retomada</h2>
                <p className="text-sm text-gray-400">
                    Conversas paradas são dinheiro perdido. O **FollowUpService** monitora leads engajados que não respondem há mais de 24h.
                </p>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <h4 className="font-bold text-white">Como Funciona:</h4>
                    <p className="text-xs text-gray-400">
                        Um cronograma diário analisa o histórico. Se o último contato foi do bot e o cliente não respondeu, a IA gera uma 
                        frase de retomada **empática e contextual** (ex: "Oi João, conseguiu ver o catálogo que te mandei ontem?").
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">3. Funil Automático</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    A movimentação entre estágios do CRM (Funil) acontece sem intervenção humana, baseada na análise de intenção do Supervisor. 
                    Isso garante que seu funil esteja sempre atualizado com a realidade da negociação.
                </p>
            </section>
        </div>
    );
}
