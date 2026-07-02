export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isSubscriptionActive } from '@/lib/subscription';
import { canonicalLicensingSiteUrl } from '@/lib/licensing-site-url';

export async function POST(req: NextRequest) {
    try {
        const { licenseKey, siteUrl } = await req.json();

        if (!licenseKey) {
            return NextResponse.json({ error: 'License key is required' }, { status: 400 });
        }

        const keyRecord = await prisma.licenseKey.findUnique({
            where: { key: licenseKey },
            include: {
                subscription: {
                    include: {
                        plan: true,
                        tenant: true,
                    },
                },
            },
        });

        if (!keyRecord) {
            return NextResponse.json({ error: 'Invalid license key' }, { status: 404 });
        }

        const subscription = keyRecord.subscription;
        const isTrial = subscription.status === 'TRIALING';
        const postLimit =
            isTrial || subscription.status === 'FREE'
                ? 5
                : subscription.plan?.postLimit || 0;

        const isActive = isSubscriptionActive(subscription.status);
        const isPending = subscription.status === 'PENDING';

        if (!isActive && !isPending) {
            return NextResponse.json(
                {
                    error: 'Subscription is inactive',
                    status: subscription.status,
                },
                { status: 403 },
            );
        }

        // Multi-site: atualiza siteUrl sem bloquear (créditos na subscrição). Grava URL canónica.
        if (siteUrl) {
            const canonical = canonicalLicensingSiteUrl(siteUrl);
            const storedCanon = keyRecord.siteUrl
                ? canonicalLicensingSiteUrl(keyRecord.siteUrl)
                : '';
            if (canonical !== storedCanon) {
                console.log(
                    `[Licensing] Updating siteUrl for key ${licenseKey}: ${keyRecord.siteUrl || 'none'} -> ${canonical}`,
                );
                await prisma.licenseKey.update({
                    where: { id: keyRecord.id },
                    data: { siteUrl: canonical },
                });
            }
        }

        return NextResponse.json({
            success: true,
            tier: subscription.plan?.name || 'Starter',
            postLimit: postLimit,
            wordLimit: subscription.plan?.wordLimit || 0,
            postsUsed: subscription.writerPostsUsed,
            wordsUsed: subscription.writerWordsUsed,
            status: subscription.status,
            customer: subscription.tenant.name,
            isTrial: isTrial,
            isPending: isPending,
        });
    } catch (error) {
        console.error('[Licensing API] Error verifying key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
