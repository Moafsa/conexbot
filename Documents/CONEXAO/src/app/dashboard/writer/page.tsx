import { AlertTriangle, Download, Key, CheckCircle2, BookOpen, BarChart3, Rocket, Copy, Check, Zap, ChevronRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import CopyLicenseButton from "@/components/Dashboard/CopyLicenseButton";

export default async function WriterDashboardPage() {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.email) {
        return <div className="p-8 text-white">Sessão expirada.</div>;
    }

    const tenant = await prisma.tenant.findUnique({
        where: { email: session.user.email },
        include: { 
            subscriptions: {
                include: { licenseKeys: true }
            }, 
            usageCounter: true 
        }
    });

    if (!tenant) return <div className="p-8 text-white">Tenant não encontrado.</div>;

    const writerSub = tenant.subscriptions.find((s: any) => s.type === "WRITER_PLUGIN");
    const licenseKey = writerSub?.licenseKeys?.[0]?.key || "Pendente de geração...";

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in relative z-10">
            {/* Header / Intro */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    <Rocket size={12} /> Onboarding do Escritor IA
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                    Bem-vindo ao <span className="text-indigo-500">Conext Writer</span>
                </h1>
                <p className="text-gray-400 max-w-2xl text-lg font-medium">
                    Siga os passos abaixo para ativar a inteligência artificial de elite no seu WordPress.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Step 1: License */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass p-8 rounded-[35px] border-white/5 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 -rotate-12 group-hover:rotate-0 transition-transform">
                            <Key size={120} />
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-lg shadow-xl shadow-indigo-500/20">1</div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Sua Chave de Licença</h2>
                        </div>
                        
                        <p className="text-gray-400 text-sm max-w-md">Copie sua chave exclusiva abaixo e cole na aba de Licenciamento do seu plugin WordPress.</p>
                        
                        <div className="relative flex items-center gap-4 p-6 bg-white/5 border border-dashed border-indigo-500/30 rounded-2xl group/key hover:bg-white/10 transition-colors">
                            <code className="flex-1 font-mono text-xl md:text-2xl font-black text-indigo-400 tracking-wider">
                                {licenseKey}
                            </code>
                            <CopyLicenseButton licenseKey={licenseKey} />
                        </div>
                    </div>

                    {/* Step 2: Download */}
                    <div className="glass p-8 rounded-[35px] border-white/5 space-y-6 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <Download size={40} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <div className="flex items-center gap-4 justify-center md:justify-start">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-sm">2</div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Baixar Plugin Profissional</h2>
                            </div>
                            <p className="text-gray-400 text-sm">Versão atualizada com orquestração de 5 agentes IA.</p>
                            <div className="pt-2">
                                <Link 
                                    href="/conexbot-wp.zip" 
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 text-sm"
                                >
                                    Fazer Download Agora <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Column */}
                <div className="space-y-8">
                    <div className="glass p-8 rounded-[35px] border-white/5 space-y-8 relative overflow-hidden h-full">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <BarChart3 size={18} className="text-indigo-400" /> Seu Consumo Atual
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                                    <span>Posts Restantes</span>
                                    <span className="text-white">{writerSub?.plan?.postLimit || 30} / {writerSub?.writerPostsUsed || 0} usados</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" style={{ width: `${Math.min(100, ((writerSub?.writerPostsUsed || 0) / (writerSub?.plan?.postLimit || 30)) * 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                                    <span>Limite de Palavras</span>
                                    <span className="text-white">{writerSub?.plan?.wordLimit || 60000} / {writerSub?.writerWordsUsed || 0}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" style={{ width: `${Math.min(100, ((writerSub?.writerWordsUsed || 0) / (writerSub?.plan?.wordLimit || 60000)) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <p className="text-[11px] text-gray-500 font-medium italic">
                                * O limite é renovado a cada 30 dias na data do fechamento da fatura.
                            </p>
                            <Link href="/pricing" className="w-full block py-4 text-center rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-widest transition-all">
                                UPGRADE DE PLANO
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support / Quick Links */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { title: "Manual de Uso", icon: BookOpen, desc: "Aprenda a otimizar o Yoast SEO." },
                    { title: "Suporte VIP", icon: Zap, desc: "Acesso direto à gerência técnica." },
                    { title: "Garantia de Humanização", icon: CheckCircle2, desc: "Configurações de indetectabilidade." }
                ].map((item, i) => (
                    <div key={i} className="glass p-6 rounded-3xl border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 transition-colors">
                            <item.icon size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">{item.title}</h4>
                            <p className="text-[10px] text-gray-500 font-medium">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
