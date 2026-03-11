import prisma from "@/lib/prisma";
import { MessageSquare, Mail, ChevronLeft, Headphones } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
    const config = await prisma.globalConfig.findUnique({
        where: { id: "system" }
    });

    const email = config?.supportEmail || "suporte@conexbot.com";
    const whatsapp = config?.supportWhatsapp || "";
    // Formata o link do WhatsApp (remove caracteres não numéricos)
    const whatsappLink = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : null;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
                    <ChevronLeft size={20} /> Voltar para o Início
                </Link>

                <div className="text-center mb-12">
                    <div className="inline-flex p-4 bg-indigo-500/10 rounded-3xl mb-6">
                        <Headphones className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4">Como podemos ajudar?</h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Nossa equipe está pronta para te auxiliar com qualquer dúvida técnica ou suporte sobre a plataforma.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card WhatsApp */}
                    <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center text-center group hover:border-indigo-500/30 transition-all duration-300">
                        <div className="p-4 bg-green-500/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-10 h-10 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">WhatsApp</h2>
                        <p className="text-gray-400 mb-8 text-sm">
                            Fale com um atendente em tempo real para suporte rápido.
                        </p>
                        {whatsappLink ? (
                            <a 
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
                            >
                                Iniciar Conversa
                            </a>
                        ) : (
                            <div className="w-full py-4 rounded-2xl bg-white/5 text-gray-500 border border-white/5 text-sm">
                                WhatsApp indisponível no momento
                            </div>
                        )}
                    </div>

                    {/* Card E-mail */}
                    <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center text-center group hover:border-purple-500/30 transition-all duration-300">
                        <div className="p-4 bg-purple-500/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                            <Mail className="w-10 h-10 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">E-mail</h2>
                        <p className="text-gray-400 mb-8 text-sm">
                            Envie sua dúvida detalhada e responderemos em até 24h.
                        </p>
                        <a 
                            href={`mailto:${email}`}
                            className="bg-white/10 hover:bg-white/20 text-white w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold border border-white/10 transition-colors"
                        >
                            {email}
                        </a>
                    </div>
                </div>

                <div className="mt-16 text-center text-gray-500 text-sm">
                    Horário de atendimento: Segunda a Sexta, das 09h às 18h.
                </div>
            </div>
        </div>
    );
}
