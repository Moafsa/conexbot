import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Determine which tenant to show stats for (support impersonation)
    const cookieStore = await cookies();
    const impersonateId = cookieStore.get('impersonate_id')?.value;
    
    let tenantId: string | undefined;

    if (impersonateId && (session.user.role === 'SUPERADMIN' || session.user.role === 'ADMIN')) {
        tenantId = impersonateId;
    } else {
        // Get tenant id from email (most reliable)
        if (session.user.id) {
            tenantId = session.user.id;
        } else if (session.user.email) {
            const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
            tenantId = t?.id;
        }
    }

    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agency = await prisma.agency.findUnique({
        where: { tenantId },
        include: {
            clients: {
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        include: { plan: true }
                    }
                }
            },
            pricing: true
        }
    });

    // Not an agency - return empty stats instead of 403 (avoids crash on dashboard)
    if (!agency) {
        return NextResponse.json({
            salesVolumeCurrentMonth: 0,
            salesVolumeLifetime: 0,
            activeClientsCount: 0,
            activeSubscriptionsCount: 0,
            totalMonthlyRevenue: 0,
            estimatedMonthlyProfit: 0,
            currentFee: 0,
            notAgency: true
        });
    }

    let totalMonthlyRevenue = 0;
    const activeClientsCount = agency.clients.length;
    let activeSubscriptionsCount = 0;

    agency.clients.forEach((client: any) => {
        client.subscriptions.forEach((sub: any) => {
            activeSubscriptionsCount++;
            const customPrice = agency.pricing.find((ap: any) => ap.productId === sub.plan?.productCatalogId)?.monthlyPrice;
            const price = customPrice ?? sub.plan?.price ?? 0;
            totalMonthlyRevenue += Number(price);
        });
    });

    const tiers = await prisma.agencyTier.findMany({
        orderBy: { minSalesVolume: 'asc' }
    });

    let currentTier = null;
    let nextTier = null;

    // Use current month volume to determine tier (as per business logic)
    const currentVolume = agency.salesVolumeCurrentMonth || 0;

    for (let i = 0; i < tiers.length; i++) {
        if (currentVolume >= tiers[i].minSalesVolume) {
            currentTier = tiers[i];
        } else {
            nextTier = tiers[i];
            break;
        }
    }

    // Fallback if no tiers configured
    const tierName = currentTier ? (currentTier.name || `Tier ${currentTier.feePercentage}%`) : "Iniciante";
    const nextTierName = nextTier ? (nextTier.name || `Tier ${nextTier.feePercentage}%`) : "Máximo Alcançado";
    const nextTierLimit = nextTier ? nextTier.minSalesVolume : 0;

    const platformFee = agency.currentFee / 100;
    const platformFeeAmount = totalMonthlyRevenue * platformFee;
    const estimatedMonthlyProfit = totalMonthlyRevenue - platformFeeAmount;

    return NextResponse.json({
        salesVolumeCurrentMonth: agency.salesVolumeCurrentMonth,
        salesVolumeLifetime: agency.salesVolumeLifetime,
        activeClientsCount,
        activeSubscriptionsCount,
        totalMonthlyRevenue,
        estimatedMonthlyProfit,
        platformCommission: platformFeeAmount,
        currentFee: agency.currentFee,
        tierInfo: {
            currentTierName: tierName,
            nextTierName: nextTierName,
            nextTierLimit: nextTierLimit,
            progress: nextTierLimit > 0 ? (currentVolume / nextTierLimit) * 100 : 100
        }
    });
}
