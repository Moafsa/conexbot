"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { CreditCard, Settings, ChevronLeft, ChevronRight, LogOut, Users, LayoutDashboard, MessageSquare, Shield, Download, PenTool, TrendingUp, ShoppingBag, Tag, Briefcase } from "lucide-react";

export default function Sidebar({ branding, userPlans, isImpersonating }: { branding?: any, userPlans?: { hasPrimary: boolean, hasWriter: boolean }, isImpersonating?: boolean }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(true);

    const handleStopImpersonating = async () => {
        await fetch("/api/admin/impersonate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId: null })
        });
        window.location.href = "/admin/agencies";
    };

    const logo = branding?.logoWhiteUrl || branding?.logoColoredUrl || "/logo.png";
    const systemName = branding?.systemName || "Conext Bot";
    const firstName = systemName.split(' ')[0];
    const lastName = systemName.split(' ').slice(1).join(' ');

    const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SUPERADMIN';
    const isAgency = (session?.user as any)?.role === 'AGENCY' || (session?.user as any)?.isAgency;

    let menuItems: { icon: any, label: string, href: string }[] = [];

    if (isAgency && !isAdmin) {
        // ---- AGENCY MENU (clean & focused) ----
        menuItems = [
            { icon: LayoutDashboard, label: "Portal da Agência",  href: "/dashboard/agency" },
            { icon: Briefcase,       label: "Meus Clientes",       href: "/dashboard/agency/clients" },
            { icon: Tag,             label: "Minha Tabela",         href: "/dashboard/agency/pricing" },
            // --- Divider group: Agency's own tools ---
            { icon: MessageSquare,   label: "Meus Agentes",         href: "/dashboard/bots" },
            { icon: Users,           label: "CRM Pipeline",         href: "/dashboard/crm" },
            { icon: PenTool,         label: "Escritor IA",           href: "/dashboard/writer" },
            { icon: TrendingUp,      label: "Marketing IA",          href: "/dashboard/marketing" },
            // --- Account ---
            { icon: CreditCard,      label: "Financeiro",            href: "/dashboard/finance" },
            { icon: Settings,        label: "Configurações",         href: "/dashboard/settings" },
        ];
    } else if (isAdmin) {
        // ---- ADMIN MENU ----
        menuItems = [
            { icon: LayoutDashboard, label: "Visão Geral",           href: "/dashboard" },
            { icon: MessageSquare,   label: "Meus Agentes",           href: "/dashboard/bots" },
            { icon: Users,           label: "CRM Pipeline",           href: "/dashboard/crm" },
            { icon: PenTool,         label: "Escritor IA",             href: "/dashboard/writer" },
            { icon: TrendingUp,      label: "Marketing IA",            href: "/dashboard/marketing" },
            { icon: CreditCard,      label: "Financeiro",              href: "/dashboard/finance" },
            { icon: Settings,        label: "Configurações",           href: "/dashboard/settings" },
            // --- Admin shortcuts ---
            { icon: Shield,          label: "Administração",           href: "/admin" },
            { icon: Briefcase,       label: "Gestão Agências",         href: "/admin/agencies" },
            { icon: ShoppingBag,     label: "Marketplace",             href: "/admin/marketplace" },
        ];
    } else {
        // ---- USER MENU ----
        const overviewLink = (userPlans?.hasWriter && !userPlans?.hasPrimary) ? "/dashboard/writer" : "/dashboard";
        menuItems = [
            { icon: LayoutDashboard, label: "Visão Geral",   href: overviewLink },
        ];
        if (userPlans?.hasPrimary) {
            menuItems.push({ icon: Users,        label: "CRM Pipeline",  href: "/dashboard/crm" });
            menuItems.push({ icon: MessageSquare, label: "Meus Agentes", href: "/dashboard/bots" });
        }
        if (userPlans?.hasWriter) {
            menuItems.push({ icon: PenTool,    label: "Escritor IA",  href: "/dashboard/writer" });
            menuItems.push({ icon: TrendingUp, label: "Marketing IA", href: "/dashboard/marketing" });
        }
        menuItems.push({ icon: CreditCard, label: "Financeiro",    href: "/dashboard/finance" });
        menuItems.push({ icon: Settings,   label: "Configurações", href: "/dashboard/settings" });
    }

    return (
        <aside className={`h-full bg-[#0f172a] border-r border-white/10 transition-all duration-300 flex flex-col shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
            {isImpersonating && (
                <div className="bg-red-600 p-2 text-center text-[10px] font-black uppercase tracking-tighter">
                    {collapsed ? "MODO SUPORTE" : "Modo Suporte Ativo"}
                    {!collapsed && (
                        <button 
                            onClick={handleStopImpersonating}
                            className="block w-full mt-1 bg-white text-red-600 rounded px-2 py-0.5 hover:bg-gray-100 transition-colors"
                        >
                            Sair
                        </button>
                    )}
                </div>
            )}
            {/* Brand */}
            <div className="h-24 flex items-center justify-center border-b border-white/5 relative px-4 text-center">
                {!collapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img src={logo} className="h-12 w-auto shrink-0 object-contain" alt="Logo" />
                        <h1 className="font-bold text-xl tracking-tighter text-white truncate">
                            {firstName}<span className="text-[#00a884]">{lastName}</span>
                        </h1>
                    </div>
                )}
                {collapsed && <img src={logo} className="h-12 w-auto object-contain" alt="Logo" />}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-[#00a884] rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#008f6f] transition-colors text-white shadow-lg border border-[#0f172a]"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-6 px-3 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? "bg-[#00a884]/10 border border-[#00a884]/20 text-[#00a884]"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                                <item.icon size={22} />
                            </span>
                            <span className={`font-medium whitespace-nowrap overflow-hidden transition-all ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                {item.label}
                            </span>
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a884] shadow-[0_0_5px_#00a884]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer */}
            <div className="p-4 border-t border-white/5 space-y-2 bg-[#0f172a]">
                {/* Plugin Downloads based on plan */}
                {userPlans?.hasPrimary && (
                    <a 
                        href="/conexbot-wp.zip" 
                        download
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884] transition-colors border border-[#00a884]/20 ${collapsed ? 'justify-center' : ''}`}
                        title="Baixar Conext Bot"
                    >
                        <Download size={20} />
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-[#00a884]">Conext Bot (WP)</span>}
                    </a>
                )}

                {userPlans?.hasWriter && (
                    <a 
                        href="/conext-writer.zip" 
                        download
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors border border-indigo-500/20 ${collapsed ? 'justify-center' : ''}`}
                        title="Baixar Escritor IA"
                    >
                        <Download size={20} />
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Escritor IA (WP)</span>}
                    </a>
                )}

                {/* Fallback if no specific plan is detected yet but user is active (or for admins) */}
                {(!userPlans?.hasPrimary && !userPlans?.hasWriter) && (
                    <a 
                        href="/conexbot-wp.zip" 
                        download
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors border border-white/5 ${collapsed ? 'justify-center' : ''}`}
                        title="Baixar Plugin WP"
                    >
                        <Download size={20} />
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">Plugin (WP)</span>}
                    </a>
                )}

                <button className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00a884] to-emerald-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                        U
                    </div>
                    {!collapsed && (
                        <div className="text-left flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">Minha Conta</p>
                            <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${collapsed ? 'justify-center' : ''}`}
                    title="Sair da Conta"
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium">Sair</span>}
                </button>
            </div>
        </aside>
    );
}
