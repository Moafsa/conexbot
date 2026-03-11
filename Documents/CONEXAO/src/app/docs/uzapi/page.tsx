export default function UzapiDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
                    WhatsApp (Uzapi)
                </h1>
                <p className="text-gray-400 leading-relaxed text-lg">
                    A Uzapi é o motor que conecta seu bot ao WhatsApp oficial, permitindo o envio e recebimento de mensagens em tempo real.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Como Conectar</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        O processo é simples e direto:
                    </p>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-400">
                        <li>Acesse o menu **Meus Bots** no painel administrativo.</li>
                        <li>Clique no botão de **Conexão** do bot que deseja ativar.</li>
                        <li>Escaneie o **QR Code** gerado usando o seu celular (WhatsApp &gt; Aparelhos Conectados).</li>
                    </ol>
                    <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <p className="text-xs text-green-500 font-medium">✅ Uma vez conectado, seu bot já estará pronto para responder seus clientes instantaneamente.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Como as Mensagens Funcionam</h2>
                <p className="text-sm text-gray-400">
                    O fluxo de comunicação segue este caminho:
                </p>
                <div className="grid gap-4">
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-white font-bold text-sm">Recebimento</h4>
                        <p className="text-[10px] text-gray-500">Quando um cliente envia uma mensagem, a Uzapi a recebe e encaminha para o Conext Bot processar com IA.</p>
                    </div>
                    <div className="p-4 glass rounded-xl border border-white/5">
                        <h4 className="text-white font-bold text-sm">Resposta</h4>
                        <p className="text-[10px] text-gray-500">Após a IA gerar a resposta, o sistema usa a Uzapi para enviar o texto ou áudio de volta para o cliente.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
