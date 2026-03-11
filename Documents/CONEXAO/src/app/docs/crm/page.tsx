export default function CrmDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                    Gestão de Leads (CRM)
                </h1>
                <p className="text-gray-400 leading-relaxed">
                    O Conext Bot não apenas responde, ele vende. O CRM integrado organiza cada conversa automaticamente no seu funil de vendas.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">O Funil Automático</h2>
                <p className="text-sm text-gray-400">Cada novo contato inicia no estágio **NOVO**. A IA analisa o sentimento e a intenção da conversa em tempo real:</p>
                <ul className="space-y-4">
                    <li className="p-4 glass rounded-xl border-l-4 border-blue-500">
                        <h4 className="font-bold text-white">Novo & Em Atendimento</h4>
                        <p className="text-xs text-gray-500">Contatos iniciais. A IA tenta qualificar o lead coletando nome e necessidade.</p>
                    </li>
                    <li className="p-4 glass rounded-xl border-l-4 border-purple-500">
                        <h4 className="font-bold text-white">Negociação</h4>
                        <p className="text-xs text-gray-500">Ativado quando o cliente pergunta sobre preços, prazos ou solicita uma proposta.</p>
                    </li>
                    <li className="p-4 glass rounded-xl border-l-4 border-green-500">
                        <h4 className="font-bold text-white">Ganho</h4>
                        <p className="text-xs text-gray-500">Movimentação automática após a confirmação de um pagamento via checkout no chat.</p>
                    </li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">Lead Score</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    O sistema atribui uma pontuação de 0 a 100 para cada contato. Quanto mais próximo da compra (perguntas sobre pagamento, interesse em produtos), 
                    maior o score. Isso ajuda você a focar nos clientes mais quentes no Dashboard.
                </p>
            </section>
        </div>
    );
}
