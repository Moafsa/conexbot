import Shell from "@/components/Dashboard/Shell";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
    
    let trialBanner = null;

    // Check if user has an active subscription
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
        try {
            const tenant = await prisma.tenant.findUnique({
                where: { email: session.user.email as string },
                include: { subscription: true, usageCounter: true }
            });
            
            // Let SUPERADMIN and ADMIN pass. For normal users, require a subscription.
            if (tenant && tenant.role === 'USER') {
                const hasSub = tenant.subscription && ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'].includes(tenant.subscription.status);

                if (!hasSub) {
                    redirect('/pricing');
                }

                if (tenant.subscription?.status === 'TRIALING' && tenant.usageCounter?.periodEnd) {
                    const diffTime = tenant.usageCounter.periodEnd.getTime() - new Date().getTime();
                    const trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (trialDaysLeft >= 0) {
                        trialBanner = (
                            <div className="bg-red-600/90 text-white text-center py-2 px-4 shadow-md w-full relative z-50 animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-2 group border-b border-red-500/50">
                                <span className="flex items-center gap-2 font-semibold">
                                    <AlertTriangle size={18} className="animate-pulse" />
                                    ⏳ ALERTA: Seu período de teste termina em {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}. 
                                </span>
                                <Link href="/pricing" className="bg-white text-red-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-sm ml-2">
                                    Assine Agora
                                </Link>
                            </div>
                        );
                    }
                } else if (tenant.subscription?.status === 'PAST_DUE') {
                    trialBanner = (
                        <div className="bg-amber-600/90 text-white text-center py-2 px-4 shadow-md w-full relative z-50 animate-fade-in flex flex-col sm:flex-row items-center justify-center gap-2 group border-b border-amber-500/50">
                            <span className="flex items-center gap-2 font-semibold">
                                <AlertTriangle size={18} className="animate-pulse" />
                                ⚠️ ATENÇÃO: Sua fatura está vencida. Acesse Finanças para pagar e manter seu acesso.
                            </span>
                            <Link href="/dashboard/finance" className="bg-white text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-sm ml-2">
                                Pagar Agora
                            </Link>
                        </div>
                    );
                }

            }
        } catch (error) {
            console.error('[DashboardLayout] Prisma Error:', error);
            // Don't block the UI if it's just a query failure, but log it.
        }
    }
    
    return <Shell branding={config} alertBanner={trialBanner}>{children}</Shell>;
}
