export default function PaymentsDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    Pagamentos Avançados & Split
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg">
                    Transforme o WhatsApp em um checkout de alta performance com a integração Asaas personalizada.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">1. Pagamento Simples vs Assinatura</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-5 glass rounded-2xl border border-white/5">
                        <h4 className="font-bold text-white mb-2">Venda Única</h4>
                        <p className="text-xs text-gray-500">Geração de link PIX/Boleto para um item específico. Ideal para serviços rápidos.</p>
                    </div>
                    <div className="p-5 glass rounded-2xl border border-white/5">
                        <h4 className="font-bold text-white mb-2">Plano de Assinatura</h4>
                        <p className="text-xs text-gray-500">Configurado no Catálogo, permite criar cobranças recorrentes (Mensal/Anual) automáticas.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">2. Lógica de Split (Comissão)</h2>
                <p className="text-sm text-gray-400">
                    O Conext Bot permite configurar o **Split de Pagamento** para divisão automática de valores.
                </p>
                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-4">
                    <h4 className="text-white font-bold italic underline">Como funciona:</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Ao gerar uma cobrança, o sistema pode enviar uma instrução de Split para o Asaas. 
                        Isso significa que uma porcentagem ou valor fixo da venda vai para a conta principal do Tenant e outra parte para 
                        uma carteira de parceiro ou taxa da plataforma, tudo de forma transparente e instantânea.
                    </p>
                </div>
            </section>

            <section className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                <h3 className="font-bold text-yellow-500 mb-2">Checkout no Chat</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                    Dica: A IA só oferecerá pagamento se o catálago estiver preenchido e a opção "Habilitar Vendas" estiver ativa nas configurações do robô.
                </p>
            </section>
        </div>
    );
}
