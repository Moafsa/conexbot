"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

interface ShellProps {
    children: React.ReactNode;
    branding?: any;
    alertBanner?: React.ReactNode;
    userPlans?: { hasPrimary: boolean; hasWriter: boolean };
    isImpersonating?: boolean;
    isAgencyClient?: boolean;
    agencyInfo?: { name: string; whatsapp: string | null; email: string | null } | null;
    botBusinessType?: string | null;
}

export default function Shell({ children, branding, alertBanner, userPlans, isImpersonating, isAgencyClient, agencyInfo, botBusinessType }: ShellProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden">
            {alertBanner}
            
            {/* Mobile Header with Hamburger Menu */}
            <div className="md:hidden flex items-center justify-between px-6 py-4 bg-[#0f172a] border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <img 
                        src={branding?.logoWhiteUrl || branding?.logoColoredUrl || "/logo.png"} 
                        className="h-8 w-auto shrink-0 object-contain" 
                        alt="Logo" 
                    />
                    <span className="font-bold text-sm text-white truncate max-w-[150px]">
                        {branding?.systemName || "Conext Bot"}
                    </span>
                </div>
                <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0 relative">
                <Sidebar
                    branding={branding}
                    userPlans={userPlans}
                    isImpersonating={isImpersonating}
                    isAgencyClient={isAgencyClient}
                    agencyInfo={agencyInfo}
                    botBusinessType={botBusinessType}
                    isOpenOnMobile={mobileMenuOpen}
                    onCloseMobile={() => setMobileMenuOpen(false)}
                />
                <main className="flex-1 min-w-0 relative overflow-y-auto overflow-x-hidden h-full flex flex-col min-h-0 custom-scrollbar-white">
                    {/* Background Orbs for Dashboard internal feel */}
                    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                    {children}
                </main>
            </div>
        </div>
    );
}
