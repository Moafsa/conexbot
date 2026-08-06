"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { CreditCard, Settings, ChevronLeft, ChevronRight, LogOut, Users, LayoutDashboard, MessageSquare, Shield, Download, PenTool, TrendingUp, ShoppingBag, Tag, Briefcase, Building2, Phone, Mail, Bot, RefreshCw, ClipboardList, Truck } from "lucide-react";

export default function Sidebar({ branding, userPlans, isImpersonating, isAgencyClient, agencyInfo, botBusinessType, isOpenOnMobile, onCloseMobile }: {
    branding?: any;
    userPlans?: { hasPrimary: boolean; hasWriter: boolean };
    isImpersonating?: boolean;
    isAgencyClient?: boolean;
    agencyInfo?: { name: string; whatsapp: string | null; email: string | null } | null;
    botBusinessType?: string | null;
    isOpenOnMobile?: boolean;
    onCloseMobile?: () => void;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);

    const typeLower = (botBusinessType || '').toLowerCase();
    const isDelivery = !botBusinessType || 
                       typeLower.includes('delivery') || 
                       typeLower.includes('gas') || 
                       typeLower.includes('gás') || 
                       typeLower.includes('food') || 
                       typeLower.includes('restaurante') || 
                       typeLower.includes('restaurant') || 
                       typeLower.includes('distribuidora') ||
                       typeLower.includes('logis');

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

    let menuCategories: {
        category?: string;
        items: { icon: any, label: string, href: string }[];
    }[] = [];
 
    if (isAgency && !isAdmin) {
        // ---- AGENCY MENU (categorized into strategic onboarding pipeline) ----
        menuCategories = [
            {
                category: "ESTRUTURA & CLIENTES",
                items: [
                    { icon: LayoutDashboard, label: "Portal da Agência",  href: "/dashboard/agency" },
                    { icon: Briefcase,       label: "Meus Clientes",       href: "/dashboard/agency/clients" },
                ]
            },
            {
                category: "PRODUÇÃO & ESTRATÉGIA",
                items: [
                    { icon: RefreshCw,       label: "Workflows de IA",     href: "/dashboard/agency/workflows" },
                    { icon: ClipboardList,   label: "Quadro de Tasks",     href: "/dashboard/agency/tasks" },
                    { icon: Bot,             label: "Squads de IA",        href: "/dashboard/agency/squads" },
                ]
            },
            {
                category: "MARKETING & ESCALA",
                items: [
                    { icon: MessageSquare,   label: "Meus Agentes",         href: "/dashboard/bots" },
                    { icon: Users,           label: "CRM Pipeline",         href: "/dashboard/crm" },
                    { icon: PenTool,         label: "Escritor IA",           href: "/dashboard/writer" },
                    { icon: TrendingUp,      label: "Marketing IA",          href: "/dashboard/marketing" },
                ]
            },
            {
                category: "CONTA & CONFIGS",
                items: [
                    { icon: CreditCard,      label: "Financeiro",            href: "/dashboard/finance" },
                    { icon: Settings,        label: "Configurações",         href: "/dashboard/settings" },
                ]
            }
        ];
    } else if (isAdmin) {
        // ---- ADMIN MENU ----
        menuCategories = [
            {
                category: "SISTEMA & PRODUTO",
                items: [
                    { icon: LayoutDashboard, label: "Visão Geral",           href: "/dashboard" },
                    { icon: MessageSquare,   label: "Meus Agentes",           href: "/dashboard/bots" },
                    { icon: Users,           label: "CRM Pipeline",           href: "/dashboard/crm" },
                    { icon: PenTool,         label: "Escritor IA",             href: "/dashboard/writer" },
                    { icon: TrendingUp,      label: "Marketing IA",            href: "/dashboard/marketing" },
                ]
            },
            {
                category: "ADMINISTRAÇÃO",
                items: [
                    { icon: Shield,          label: "Administração",           href: "/admin" },
                    { icon: Briefcase,       label: "Gestão Agências",         href: "/admin/agencies" },
                    { icon: ShoppingBag,     label: "Marketplace",             href: "/admin/marketplace" },
                ]
            },
            {
                category: "CONTA",
                items: [
                    { icon: CreditCard,      label: "Financeiro",              href: "/dashboard/finance" },
                    { icon: Settings,        label: "Configurações",           href: "/dashboard/settings" },
                ]
            }
        ];
    } else if (isAgencyClient) {
        // ---- AGENCY CLIENT MENU ----
        const strategyItems: any[] = [
            { icon: LayoutDashboard, label: "Visão Geral",  href: "/dashboard" },
            { icon: MessageSquare,   label: "Meu Agente",   href: "/dashboard/bots" },
            { icon: Users,           label: "CRM Pipeline", href: "/dashboard/crm" },
        ];
        if (isDelivery) {
            strategyItems.push({ icon: Truck, label: "Frota & Entregadores", href: "/dashboard/drivers" });
        }
        const marketingItems = [];
        if (userPlans?.hasWriter) {
            marketingItems.push({ icon: PenTool,    label: "Escritor IA",  href: "/dashboard/writer" });
            marketingItems.push({ icon: TrendingUp, label: "Marketing IA", href: "/dashboard/marketing" });
        }
        menuCategories = [
            {
                category: "ESTRUTURA & ESTRATÉGIA",
                items: strategyItems
            }
        ];
        if (marketingItems.length > 0) {
            menuCategories.push({
                category: "MARKETING & ESCALA",
                items: marketingItems
            });
        }
        menuCategories.push({
            category: "CONTA",
            items: [
                { icon: CreditCard, label: "Financeiro",    href: "/dashboard/finance" },
                { icon: Settings,   label: "Configurações", href: "/dashboard/settings" },
            ]
        });
    } else {
        // ---- USER MENU ----
        const overviewLink = (userPlans?.hasWriter && !userPlans?.hasPrimary) ? "/dashboard/writer" : "/dashboard";
        const primaryItems: any[] = [];
        if (userPlans?.hasPrimary) {
            primaryItems.push({ icon: Users,         label: "CRM Pipeline",  href: "/dashboard/crm" });
            primaryItems.push({ icon: MessageSquare, label: "Meus Agentes",  href: "/dashboard/bots" });
            if (isDelivery) {
                primaryItems.push({ icon: Truck, label: "Frota & Entregadores", href: "/dashboard/drivers" });
            }
        }
        const writerItems = [];
        if (userPlans?.hasWriter) {
            writerItems.push({ icon: PenTool,    label: "Escritor IA",  href: "/dashboard/writer" });
            writerItems.push({ icon: TrendingUp, label: "Marketing IA", href: "/dashboard/marketing" });
        }
        menuCategories = [
            {
                category: "ESTRUTURA & ESTRATÉGIA",
                items: [
                    { icon: LayoutDashboard, label: "Visão Geral", href: overviewLink },
                    ...primaryItems
                ]
            }
        ];
        if (writerItems.length > 0) {
            menuCategories.push({
                category: "MARKETING & ESCALA",
                items: writerItems
            });
        }
        menuCategories.push({
            category: "CONTA",
            items: [
                { icon: CreditCard, label: "Financeiro",    href: "/dashboard/finance" },
                { icon: Settings,   label: "Configurações", href: "/dashboard/settings" },
            ]
        });
    }
 
    return (
        <>
            {/* Overlay de fundo escuro no mobile */}
            {isOpenOnMobile && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
                    onClick={onCloseMobile}
                />
            )}
            
            <aside 
                className={`h-full bg-[#0f172a] border-r border-white/10 transition-all duration-300 flex flex-col shrink-0 
                    fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0
                    ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
                    ${collapsed ? 'w-20' : 'w-64'}
                `}
            >
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
                        className="absolute -right-3 top-8 bg-[#00a884] rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-[#008f6f] transition-colors text-white shadow-lg border border-[#0f172a] md:flex hidden"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>
     
                {/* Menu */}
                <nav className="flex-1 py-6 px-3 space-y-5 overflow-y-auto">
                    {menuCategories.map((cat, catIdx) => (
                        <div key={catIdx} className="space-y-1.5">
                            {cat.category && !collapsed && (
                                <p className="text-[10px] font-black tracking-widest text-[#00a884] uppercase px-4 opacity-50 select-none">
                                    {cat.category}
                                </p>
                            )}
                            {cat.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onCloseMobile}
                                        className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all group ${isActive
                                            ? "bg-[#00a884]/10 border border-[#00a884]/20 text-[#00a884]"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>
                                            <item.icon size={20} />
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
                        </div>
                    ))}
            </nav>
 
            {/* User / Footer */}
            <div className="p-4 border-t border-white/5 space-y-2 bg-[#0f172a]">
                {/* Agency branding — shown only for agency clients */}
                {isAgencyClient && agencyInfo && (
                    collapsed ? (
                        <div className="flex justify-center mb-1" title={`Gerenciado por ${agencyInfo.name}`}>
                            <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                <Building2 size={17} className="text-purple-400" />
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">Gerenciado por</p>
                            <p className="text-sm font-bold text-white truncate">{agencyInfo.name}</p>
                            {agencyInfo.whatsapp && (
                                <a
                                    href={`https://wa.me/${agencyInfo.whatsapp.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition-colors"
                                >
                                    <Phone size={11} />
                                    <span>{agencyInfo.whatsapp}</span>
                                </a>
                            )}
                            {agencyInfo.email && (
                                <a
                                    href={`mailto:${agencyInfo.email}`}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <Mail size={11} />
                                    <span className="truncate">{agencyInfo.email}</span>
                                </a>
                            )}
                        </div>
                    )
                )}

                {/* Plugins WordPress — página com todos os plugins e explicação de cada um. Escondido para clientes de agência. */}
                {!isAgencyClient && (
                    <Link
                        href="/dashboard/plugins"
                        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884] transition-colors border border-[#00a884]/20 ${collapsed ? 'justify-center' : ''}`}
                        title="Plugins WordPress"
                    >
                        <Download size={20} />
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-[#00a884]">Plugins (WP)</span>}
                    </Link>
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
        </>
    );
}
