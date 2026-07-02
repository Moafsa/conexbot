import Shell from "@/components/Dashboard/Shell";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const prisma = (await import('@/lib/prisma')).default;
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;

    let trialBanner = null;

    const session = await import('next-auth').then(m => m.getServerSession(require('@/lib/auth').authOptions)) as any;

    if (!session?.user) {
        const { redirect } = await import('next/navigation');
        redirect('/auth/login?callbackUrl=/dashboard');
    }

    const cookieStore = await (await import('next/headers')).cookies();
    const impersonateId = cookieStore.get('impersonate_id')?.value;
    const isImpersonating = Boolean(
        impersonateId && (session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN')
    );

    const tenantInclude = {
        subscriptions: { include: { licenseKeys: true } },
        usageCounter: true,
        agency: true,
        managedBy: {
            include: {
                tenant: { select: { name: true, whatsapp: true, email: true } }
            }
        },
    };

    let tenant = null;
    if (session?.user?.email) {
        let targetId: string | undefined = session.user.id;
        if (isImpersonating) {
            targetId = impersonateId;
        }

        if (targetId) {
            tenant = await prisma.tenant.findUnique({
                where: { id: targetId },
                include: tenantInclude,
            });
        } else {
            tenant = await prisma.tenant.findUnique({
                where: { email: session.user.email },
                include: tenantInclude,
            });
        }

        if (tenant && tenant.role === 'AGENCY' && !isImpersonating && tenant.agency?.status !== 'APPROVED') {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-6 animate-fade-in">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                            <AlertTriangle size={40} className="text-indigo-500" />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Conta em Análise</h1>
                        <p className="text-gray-400">
                            Sua conta de agência foi criada com sucesso e está sendo analisada pelo nosso time.
                            Você receberá um email assim que for aprovado.
                        </p>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-gray-500">
                            Status Atual: <span className="text-indigo-400 font-bold uppercase">{tenant.agency?.status || 'PENDING'}</span>
                        </div>
                        <Link href="/" className="block text-indigo-400 hover:text-white transition-colors font-medium">
                            Voltar para o início
                        </Link>
                    </div>
                </div>
            );
        }

        // Detect agency client (managed user who pays through agency invoices)
        const isAgencyClient = !!(tenant?.agencyId && tenant?.role === 'USER');

        if (tenant && tenant.role === 'USER' && !isImpersonating) {
            const activeSubs = tenant.subscriptions.filter((s: { status: string }) =>
                ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'].includes(s.status)
            );
            const hasSub = activeSubs.length > 0;

            // Agency clients are billed through the agency — never redirect them to platform pricing
            if (!hasSub && !isAgencyClient) {
                const { redirect } = await import('next/navigation');
                redirect('/pricing');
            }

            const prioritizedSub = activeSubs.find((s: { status: string }) => s.status === 'TRIALING')
                || activeSubs.find((s: { status: string }) => s.status === 'PAST_DUE');

            if (prioritizedSub?.status === 'TRIALING' && tenant.usageCounter?.periodEnd) {
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
            } else if (prioritizedSub?.status === 'PAST_DUE') {
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
    }

    const isAgencyClient = !!(tenant?.agencyId && tenant?.role === 'USER');

    const userPlans = {
        hasPrimary: Boolean(session?.user && (
            session.user.role === 'SUPERADMIN' ||
            session.user.role === 'ADMIN' ||
            isAgencyClient ||
            tenant?.subscriptions?.some((s: { type: string; status: string }) => s.type === 'PRIMARY' && ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'].includes(s.status))
        )),
        hasWriter: Boolean(session?.user && (
            session.user.role === 'SUPERADMIN' ||
            session.user.role === 'ADMIN' ||
            tenant?.subscriptions?.some((s: { type: string; status: string }) => s.type === 'WRITER_PLUGIN' && ['ACTIVE', 'TRIALING', 'PENDING', 'PAST_DUE'].includes(s.status))
        )),
    };

    const agencyInfo = isAgencyClient ? {
        name: tenant?.managedBy?.tenant?.name || 'Sua Agência',
        whatsapp: tenant?.managedBy?.tenant?.whatsapp || null,
        email: tenant?.managedBy?.tenant?.email || null,
    } : null;

    return (
        <Shell
            branding={config}
            alertBanner={trialBanner}
            userPlans={userPlans}
            isImpersonating={isImpersonating}
            isAgencyClient={isAgencyClient}
            agencyInfo={agencyInfo}
        >
            {children}
        </Shell>
    );
}
