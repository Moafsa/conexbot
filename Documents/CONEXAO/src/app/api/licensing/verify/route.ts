export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isSubscriptionActive } from '@/lib/subscription';

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
                        tenant: true
                    }
                }
            }
        });

        if (!keyRecord) {
            return NextResponse.json({ error: 'Invalid license key' }, { status: 404 });
        }

        const subscription = keyRecord.subscription;
        const isTrial = subscription.status === 'TRIALING' || (subscription.plan?.trialDays || 0) > 0;
        const postLimit = isTrial ? 5 : (subscription.plan?.postLimit || 0);

        // Permitimos PENDING para integração, mas avisamos o status
        const isActive = isSubscriptionActive(subscription.status);
        const isPending = subscription.status === 'PENDING';

        if (!isActive && !isPending) {
            return NextResponse.json({ 
                error: 'Subscription is inactive',
                status: subscription.status 
            }, { status: 403 });
        }

        // Se o siteUrl for enviado, registramos ou validamos
        if (siteUrl) {
            if (!keyRecord.siteUrl) {
                // Primeira ativação
                await prisma.licenseKey.update({
                    where: { id: keyRecord.id },
                    data: { siteUrl }
                });
            } else if (keyRecord.siteUrl !== siteUrl) {
                // Chave já usada em outro site
                return NextResponse.json({ 
                    error: 'License key already active on another site',
                    activeSite: keyRecord.siteUrl 
                }, { status: 403 });
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
            isPending: isPending
        });

    } catch (error) {
        console.error('[Licensing API] Error verifying key:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

