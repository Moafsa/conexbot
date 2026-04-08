import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isSubscriptionActive } from '@/lib/subscription';

export async function POST(req: NextRequest) {
    try {
        const { licenseKey, postsToConsume, wordsToConsume } = await req.json();

        if (!licenseKey) {
            return NextResponse.json({ error: 'License key is required' }, { status: 400 });
        }

        const keyRecord = await prisma.licenseKey.findUnique({
            where: { key: licenseKey },
            include: {
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        if (!keyRecord) {
            return NextResponse.json({ error: 'Invalid license key' }, { status: 404 });
        }

        const subscription = keyRecord.subscription;

        if (!isSubscriptionActive(subscription.status)) {
            return NextResponse.json({ error: 'Subscription is inactive' }, { status: 403 });
        }

        // Validar limites
        const postLimit = subscription.plan?.postLimit || 0;
        const wordLimit = subscription.plan?.wordLimit || 0;

        if (postLimit > 0 && subscription.writerPostsUsed + (postsToConsume || 1) > postLimit) {
            return NextResponse.json({ error: 'Post limit reached' }, { status: 403 });
        }

        if (wordLimit > 0 && subscription.writerWordsUsed + (wordsToConsume || 0) > wordLimit) {
            return NextResponse.json({ error: 'Word limit reached' }, { status: 403 });
        }

        // Debitar Créditos
        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                writerPostsUsed: { increment: postsToConsume || 1 },
                writerWordsUsed: { increment: wordsToConsume || 0 }
            }
        });

        return NextResponse.json({
            success: true,
            postsRemaining: postLimit > 0 ? postLimit - updatedSubscription.writerPostsUsed : 'Unlimited',
            wordsRemaining: wordLimit > 0 ? wordLimit - updatedSubscription.writerWordsUsed : 'Unlimited'
        });

    } catch (error) {
        console.error('[Licensing API] Error consuming credits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
