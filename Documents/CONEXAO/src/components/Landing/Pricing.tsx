export default function Pricing() {
    return (
        <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4">Escolha seu Plano</h2>
                    <p className="text-gray-400">Comece pequeno e escale conforme seu negócio cresce.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Starter Plan */}
                    <div className="glass p-8 rounded-2xl border-white/5">
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Starter</h3>
                        <div className="text-4xl font-bold mb-6">R$ 97<span className="text-sm font-normal text-gray-500">/mês</span></div>
                        <ul className="space-y-4 mb-8 text-sm text-gray-300">
                            <li className="flex gap-2">✓ 1 Agente de IA</li>
                            <li className="flex gap-2">✓ 500 Conversas/mês</li>
                            <li className="flex gap-2">✓ Webhook WhatsApp (Uzapi)</li>
                            <li className="flex gap-2 opacity-50">✕ Voz ElevenLabs</li>
                        </ul>
                        <button className="btn-outline w-full text-center">Selecionar</button>
                    </div>

                    {/* Pro Plan (Best Value) */}
                    <div className="glass p-8 rounded-2xl border-purple-500/50 relative bg-gradient-to-b from-purple-900/20 to-transparent transform md:-translate-y-4">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wide">
                            Mais Popular
                        </div>
                        <h3 className="text-lg font-medium text-purple-400 mb-2">Pro</h3>
                        <div className="text-4xl font-bold mb-6">R$ 197<span className="text-sm font-normal text-gray-500">/mês</span></div>
                        <ul className="space-y-4 mb-8 text-sm text-gray-300">
                            <li className="flex gap-2">✓ 3 Agentes de IA</li>
                            <li className="flex gap-2">✓ Sem limite de conversas</li>
                            <li className="flex gap-2">✓ WhatsApp + Instagram</li>
                            <li className="flex gap-2 text-white">✓ Voz ElevenLabs (1h/mês)</li>
                            <li className="flex gap-2">✓ Arquiteto IA Completo</li>
                        </ul>
                        <button className="btn-primary w-full text-center">Selecionar</button>
                    </div>

                    {/* Business Plan */}
                    <div className="glass p-8 rounded-2xl border-white/5">
                        <h3 className="text-lg font-medium text-gray-400 mb-2">Business</h3>
                        <div className="text-4xl font-bold mb-6">R$ 497<span className="text-sm font-normal text-gray-500">/mês</span></div>
                        <ul className="space-y-4 mb-8 text-sm text-gray-300">
                            <li className="flex gap-2">✓ 10 Agentes de IA</li>
                            <li className="flex gap-2">✓ API Dedicada</li>
                            <li className="flex gap-2">✓ Gerente de Conta</li>
                            <li className="flex gap-2">✓ Voz ElevenLabs (10h/mês)</li>
                        </ul>
                        <button className="btn-outline w-full text-center">Falar com Consultor</button>
                    </div>

                </div>
            </div>
        </section>
    );
}
