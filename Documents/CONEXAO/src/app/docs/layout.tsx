import Link from "next/link";
export const dynamic = 'force-dynamic';
import { BookOpen, Rocket, Zap, Settings, ShieldCheck, HelpCircle, Brain, AudioLines, Users, CreditCard } from "lucide-react";

export default async function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const prisma = (await import('@/lib/prisma')).default;
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;
    const logo = config?.logoWhiteUrl || "/logo.png";
    const systemName = config?.systemName || "Conext Bot";

    const sections = [
        {
            title: "Começando",
            items: [
                { title: "Visão Geral", href: "/docs", icon: BookOpen },
                { title: "Criação de Agente", href: "/docs/bot-creation", icon: Rocket },
                { title: "Conexão WhatsApp", href: "/docs/whatsapp", icon: Zap },
            ]
        },
        {
            title: "Inteligência Artificial",
            items: [
                { title: "Treinamento de IA", href: "/docs/ai-training", icon: Brain },
                { title: "Comportamento Avançado", href: "/docs/intelligence", icon: Brain },
                { title: "Simulador de Conversas", href: "/docs/simulator", icon: HelpCircle },
            ]
        },
        {
            title: "Ferramentas",
            items: [
                { title: "CRM e Gestão de Leads", href: "/docs/crm", icon: Users },
                { title: "Pagamentos e Faturas", href: "/docs/payments", icon: CreditCard },
                { title: "Catálogo e Produtos", href: "/docs/catalog", icon: BookOpen },
                { title: "Automação e Follow-ups", href: "/docs/automation", icon: Rocket },
            ]
        },
        {
            title: "Integração e API",
            items: [
                { title: "Conexões Uzapi", href: "/docs/uzapi", icon: ShieldCheck },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#030014] text-gray-300">
            {/* Nav Header */}
            <header className="fixed top-0 left-0 w-full h-20 border-b border-white/5 bg-[#030014]/80 backdrop-blur-md z-50 flex items-center px-6 justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <img src={logo} alt={systemName} className="h-14 w-auto object-contain group-hover:scale-105 transition-all duration-300" />
                    <span className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {systemName} Docs
                    </span>
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Voltar para o App
                </Link>
            </header>

            <div className="max-w-8xl mx-auto flex pt-16">
                {/* Sidebar */}
                <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-white/5 p-6 overflow-y-auto hidden md:block">
                    {sections.map((section, idx) => (
                        <div key={idx} className="mb-8">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                                {section.title}
                            </h4>
                            <ul className="space-y-2">
                                {section.items.map((item, i) => (
                                    <li key={i}>
                                        <Link
                                            href={item.href}
                                            className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-indigo-400 transition-colors py-1"
                                        >
                                            <item.icon size={16} />
                                            {item.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </aside>

                {/* Content */}
                <main className="flex-grow md:ml-64 p-8 lg:p-12 min-h-[calc(100vh-64px)]">
                    <div className="max-w-3xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
