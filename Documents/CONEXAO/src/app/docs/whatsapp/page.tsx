export default function WhatsAppDocsPage() {
    return (
        <div className="space-y-12">
            <section>
                <h1 className="text-4xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                    Conexão WhatsApp (WuzAPI)
                </h1>
                <p className="text-gray-400 leading-relaxed">
                    A integração com o WhatsApp é feita através de uma instância dedicada da **WuzAPI**, garantindo estabilidade e velocidade.
                </p>
            </section>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold">Como Conectar</h2>
                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-green-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
                        <p className="text-sm text-gray-400">Vá em **Meus Bots** e clique no botão de "Conectar" (ícone de link) do robô desejado.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-green-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
                        <p className="text-sm text-gray-400">Aguarde a geração do QR Code. Abra o WhatsApp no seu celular &gt; Aparelhos Conectados &gt; Conectar um aparelho.</p>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-green-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
                        <p className="text-sm text-gray-400">Aponte a câmera e pronto! O status mudará para <span className="text-green-500 font-bold uppercase">Conectado</span>.</p>
                    </div>
                </div>
            </section>

            <section className="p-6 glass rounded-2xl border border-white/5">
                <h3 className="font-bold text-white mb-3">Manutenção da Conexão</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                    O sistema mantém a sessão ativa 24/7. Caso o celular fique offline por muito tempo, a sessão pode expirar. 
                    Nesse caso, basta clicar em "Desconectar" e gerar um novo QR Code.
                </p>
            </section>
        </div>
    );
}
