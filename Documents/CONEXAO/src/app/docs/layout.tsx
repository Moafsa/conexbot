import Link from "next/link";
export const dynamic = 'force-dynamic';
import { 
    BookOpen, Rocket, Zap, Settings, ShieldCheck, 
    Brain, AudioLines, Users, CreditCard, Calendar, Database, Cpu, PlayCircle, Layout
} from "lucide-react";
import { MobileDocsNav } from "@/components/Docs/MobileDocsNav";

export default async function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const prisma = (await import('@/lib/prisma')).default;
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;
    const session = await import('next-auth').then(m => m.getServerSession(require('@/lib/auth').authOptions)) as any;
    const logo = config?.logoWhiteUrl || "/logo.png";
    const systemName = config?.systemName || "Conext Bot";

    const sections = [
        {
            title: "Começando",
            items: [
                { title: "Manual Inicial", href: "/docs", icon: BookOpen },
                { title: "API Keys & Sistema", href: "/docs/settings", icon: Settings },
            ]
        },
        {
            title: "Canais de Conexão",
            items: [
                { title: "WhatsApp (Uzapi)", href: "/docs/whatsapp", icon: Zap },
                { title: "Plugin WordPress", href: "/docs/wordpress", icon: Rocket },
            ]
        },
        {
            title: "Cérebro IA",
            items: [
                { title: "Arquiteto & Treino", href: "/docs/ai-training", icon: Brain },
                { title: "Simulador Vendas", href: "/docs/simulator", icon: PlayCircle },
                { title: "Supervisor Insights", href: "/docs/intelligence", icon: Cpu },
            ]
        },
        {
            title: "Fluxos de Venda",
            items: [
                { title: "CRM & Funil", href: "/docs/crm", icon: Users },
                { title: "Follow-up & Réguas", href: "/docs/automation", icon: Zap },
                { title: "Agenda & Booking", href: "/docs/agenda", icon: Calendar },
                { title: "Produtos & Catálogo", href: "/docs/catalog", icon: Database },
                { title: "Pagamentos Asaas", href: "/docs/payments", icon: CreditCard },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#030014] text-gray-300">
            {/* Nav Header */}
            <header className="fixed top-0 left-0 w-full h-20 border-b border-white/5 bg-[#030014]/80 backdrop-blur-md z-50 flex items-center px-6 justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <img src={logo} alt={systemName} className="h-14 w-auto object-contain group-hover:scale-105 transition-all duration-300" />
                    <span className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
                        {systemName} Docs
                    </span>
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/conexbot-wp.zip" download className="hidden lg:flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                        <Rocket size={14} />
                        Download Plugin WP
                    </Link>
                    <Link href={session?.user ? "/dashboard" : "/"} className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Voltar para o App
                    </Link>
                    
                    {/* Mobile Menu */}
                    <MobileDocsNav sections={sections} />
                </div>
            </header>

            <div className="max-w-8xl mx-auto flex pt-20">
                {/* Sidebar */}
                <aside className="fixed left-0 top-20 bottom-0 w-64 border-r border-white/5 p-6 overflow-y-auto hidden md:block scrollbar-thin scrollbar-thumb-white/10">
                    {sections.map((section, idx) => (
                        <div key={idx} className="mb-8">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                                {section.title}
                            </h4>
                            <ul className="space-y-1">
                                {section.items.map((item, i) => (
                                    <li key={i}>
                                        <Link
                                            href={item.href}
                                            className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-indigo-400 hover:bg-white/5 px-2 py-2 rounded-lg transition-all group"
                                        >
                                            <item.icon size={16} className="group-hover:scale-110 transition-transform text-gray-500 group-hover:text-indigo-400" />
                                            {item.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </aside>

                {/* Content */}
                <main className="flex-grow md:ml-64 p-8 lg:p-12 min-h-[calc(100vh-80px)]">
                    <div className="max-w-4xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
