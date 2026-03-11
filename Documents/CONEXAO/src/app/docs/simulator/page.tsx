export default function SimulatorDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Simulador de Conversas
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg">
                    Teste seu agente em um ambiente seguro antes de conectá-lo ao WhatsApp oficial.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">O que é o Simulador?</h2>
                <p className="text-sm text-gray-400">
                    Ao lado de cada bot no Dashboard, você encontrará o botão **Simulador**. Ele abre uma interface de chat web que emula 100% o comportamento que o cliente teria no WhatsApp.
                </p>
                <div className="p-5 glass rounded-2xl border border-white/5 bg-blue-500/5">
                    <h4 className="font-bold text-blue-400 mb-2">Vantagens:</h4>
                    <ul className="list-disc list-inside text-xs text-gray-500 space-y-2">
                        <li>Não consome sua quota de mensagens da Uzapi.</li>
                        <li>Permite testar **Áudio**, **Imagens** e **Links de Pagamento** instantaneamente.</li>
                        <li>Ideal para refinar o `System Prompt` do seu agente.</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Log de Depuração</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    No simulador, você pode ver em tempo real como a IA está processando o `contexto` e quais ferramentas (como geração de PIX) ela decidiu usar para aquela resposta específica.
                </p>
            </section>
        </div>
    );
}
