export default function CatalogDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Catálogo de Produtos & IA
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg">
                    Ensine ao seu bot o que você vende. O catálogo é a fonte da verdade para vendas e cobranças.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">1. Cadastro de Produtos</h2>
                <p className="text-sm text-gray-400">No Dashboard do bot, acesse o menu **Produtos**. Você pode cadastrar:</p>
                <div className="grid gap-4">
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-indigo-400 font-bold text-sm">Produtos Únicos</h4>
                        <p className="text-[10px] text-gray-500 text-xs">Itens físicos ou serviços pontuais com preço fixo.</p>
                    </div>
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-purple-400 font-bold text-sm">Assinaturas (Recorrência)</h4>
                        <p className="text-[10px] text-gray-500 text-xs">Planos mensais, trimestrais ou anuais. O sistema automatiza a cobrança futura via Asaas.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">2. Como a IA vende?</h2>
                <p className="text-gray-400 text-sm italic">
                    O robô não apenas "sabe" os preços; ele tem acesso dinâmico ao seu catálogo.
                </p>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Quando um cliente pergunta "Quanto custa o plano Pro?", a IA identifica o produto no seu banco de dados, 
                        gera um **Link de Pagamento dinâmico** e o entrega no chat. Se o pagamento for via Assinatura, o Asaas 
                        gerenciará os próximos meses automaticamente.
                    </p>
                </div>
            </section>
        </div>
    );
}
