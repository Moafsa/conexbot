import Sidebar from "./Sidebar";

interface ShellProps {
    children: React.ReactNode;
    branding?: any;
    alertBanner?: React.ReactNode;
    userPlans?: { hasPrimary: boolean; hasWriter: boolean };
    isImpersonating?: boolean;
    isAgencyClient?: boolean;
    agencyInfo?: { name: string; whatsapp: string | null; email: string | null } | null;
}

export default function Shell({ children, branding, alertBanner, userPlans, isImpersonating, isAgencyClient, agencyInfo }: ShellProps) {
    return (
        <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden">
            {alertBanner}
            <div className="flex flex-1 overflow-hidden min-h-0">
                <Sidebar
                    branding={branding}
                    userPlans={userPlans}
                    isImpersonating={isImpersonating}
                    isAgencyClient={isAgencyClient}
                    agencyInfo={agencyInfo}
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
