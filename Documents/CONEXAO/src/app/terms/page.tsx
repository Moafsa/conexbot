"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
                    <ChevronLeft size={20} /> Voltar para o Início
                </Link>

                <div className="glass rounded-3xl p-8 md:p-12 border border-white/5">
                    <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso</h1>
                    
                    <div className="space-y-6 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
                            <p>
                                Ao acessar e usar a plataforma ConexBot, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                                Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
                            <p>
                                O ConexBot é uma plataforma SaaS que fornece ferramentas de automação para WhatsApp, CRM e integração com Inteligência Artificial. 
                                Nosso serviço permite a criação de agentes virtuais para atendimento automático.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Responsabilidades do Usuário</h2>
                            <p>
                                Você é responsável por manter a confidencialidade de sua conta e senha. Além disso, compromete-se a:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Não utilizar a plataforma para envio de SPAM ou mensagens abusivas.</li>
                                <li>Cumprir as políticas de uso do WhatsApp (Meta).</li>
                                <li>Garantir que os dados coletados de seus clientes estejam em conformidade com a LGPD.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">4. Limitação de Responsabilidade</h2>
                            <p>
                                O ConexBot não se responsabiliza por eventuais banimentos de números de WhatsApp decorrentes do uso indevido das ferramentas de automação. 
                                O uso da plataforma é de inteira responsabilidade do contratante.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Modificações nos Termos</h2>
                            <p>
                                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas aos usuários ativos via e-mail ou aviso na plataforma.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-white/10 text-gray-500 text-xs">
                            Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
