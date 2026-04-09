export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tenantId = (session.user as any).id;

    try {
        const subscription = await prisma.subscription.findUnique({
            where: {
                tenantId_type: {
                    tenantId,
                    type: 'WRITER_PLUGIN'
                }
            },
            include: {
                plan: true,
                licenseKeys: true
            }
        });

        const activeLicense = subscription?.licenseKeys?.find(k => k.status === 'ACTIVE');

        return NextResponse.json({
            hasPlugin: !!subscription && ['ACTIVE', 'TRIALING', 'PENDING'].includes(subscription.status),
            subscription: subscription,
            licenseKey: activeLicense?.key || null,
            usage: {
                postsUsed: subscription?.writerPostsUsed || 0,
                wordsUsed: subscription?.writerWordsUsed || 0,
                postLimit: subscription?.plan?.postLimit || 0,
                wordLimit: subscription?.plan?.wordLimit || 0
            }
        });
    } catch (error) {
        console.error('Error fetching writer info:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
