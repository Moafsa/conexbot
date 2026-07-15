import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import DriverMap from '@/components/Dashboard/DriverMap';
import { redirect } from 'next/navigation';
import { getEffectiveTenantId } from '@/lib/get-effective-tenant';

export const dynamic = 'force-dynamic';

export default async function DriversDashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect('/auth/login?callbackUrl=/dashboard/drivers');
    }

    const tenantId = await getEffectiveTenantId();

    // Try to get a bot's mapboxToken or fallback to GlobalConfig
    const bot = tenantId ? await prisma.bot.findFirst({
        where: {
            tenantId
        }
    }) : null;

    const systemConfig = await prisma.globalConfig.findUnique({
        where: { id: 'system' }
    });

    const mapboxToken = bot?.mapboxToken || systemConfig?.mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    return (
        <div className="h-full w-full">
            <DriverMap mapboxToken={mapboxToken} />
        </div>
    );
}
