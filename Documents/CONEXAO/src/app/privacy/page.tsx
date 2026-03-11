"use client";

import { ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-8 transition-colors">
                    <ChevronLeft size={20} /> Voltar para o Início
                </Link>

                <div className="glass rounded-3xl p-8 md:p-12 border border-white/5">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">Política de Privacidade</h1>
                    </div>
                    
                    <div className="space-y-6 text-sm leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">1. Coleta de Informações</h2>
                            <p>
                                Coletamos informações necessárias para a prestação de nossos serviços, como nome, e-mail e dados de conexão com o WhatsApp. 
                                Esses dados são utilizados exclusivamente para o funcionamento técnico da plataforma e gestão de sua conta.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">2. Uso de Dados</h2>
                            <p>
                                O ConexBot atua como um processador de dados para as informações enviadas via WhatsApp pelos seus clientes. 
                                Nós não vendemos, alugamos ou compartilhamos esses dados com terceiros para fins de marketing.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Segurança dos Dados</h2>
                            <p>
                                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, 
                                perda ou destruição. Utilizamos criptografia e servidores seguros para garantir a integridade das informações.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">4. Cookies e Tecnologias de Rastreamento</h2>
                            <p>
                                Utilizamos cookies apenas para manter sua sessão ativa e melhorar a experiência de navegação em nosso dashboard. 
                                Você pode gerenciar as preferências de cookies através das configurações de seu navegador.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Seus Direitos (LGPD)</h2>
                            <p>
                                Em conformidade com a LGPD, você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. 
                                Para exercer esses direitos, entre em contato conosco através de nossos canais de suporte.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-white/10 text-gray-500 text-xs text-center">
                            Sua privacidade é nossa prioridade. ConexBot &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
