export default function BotCreationPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                    Criando seu Primeiro Agente
                </h1>
                <p className="text-gray-400 leading-relaxed">
                    No Conext Bot, você não configura fluxogramas manuais. Você constrói um **agente inteligente** que entende o seu negócio.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">1. O Arquiteto de IA</h2>
                <p className="text-sm text-gray-400">Ao clicar em **Criar Novo Bot**, você será recebido pelo "Arquiteto de Automação".</p>
                <div className="p-6 glass rounded-2xl border border-white/5 bg-indigo-500/5">
                    <h4 className="font-bold text-white mb-2 italic">"O que seu bot deve fazer?"</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Em vez de preencher formulários infinitos, você descreve o objetivo do bot (ex: "Quero um bot para minha clínica que aceite agendamentos e tire dúvidas sobre convênios"). 
                        A IA então gera automaticamente o `System Prompt` e as configurações ideais.
                    </p>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">2. Configurações Essenciais</h2>
                <div className="grid gap-4">
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-white font-bold mb-1">Nome e Nicho</h4>
                        <p className="text-xs text-gray-500">Define a personalidade do bot. Um bot de "Suporte Técnico" fala diferente de um bot de "Vendas de Carros".</p>
                    </div>
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-white font-bold mb-1">Prompt do Sistema</h4>
                        <p className="text-xs text-gray-500">O conjunto de instruções que rege o comportamento da IA. Você pode editar isso a qualquer momento para refinar as respostas.</p>
                    </div>
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-white font-bold mb-1">Módulos (Delivery/Suporte)</h4>
                        <p className="text-xs text-gray-500">Habilita comportamentos específicos, como coleta de endereço ou abertura de tickets.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold">3. Ativação</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                    Após criado, o bot aparecerá no seu Dashboard. Certifique-se de que ele está com o status **Ativo** e proceda para a 
                    [Conexão WhatsApp](/docs/whatsapp) para começar a receber mensagens.
                </p>
            </section>
        </div>
    );
}
