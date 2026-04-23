export const dynamic = 'force-dynamic';
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
        const isTrial = subscription.status === 'TRIALING';
        const postLimit = isTrial ? 5 : (subscription.plan?.postLimit || 0);

        // Se estiver PENDING, bloqueamos consumo real A MENOS que seja trial e tenha créditos
        if (subscription.status === 'PENDING') {
            const hasTrialCredits = isTrial && subscription.writerPostsUsed < 5;
            
            if (!hasTrialCredits) {
                return NextResponse.json({ 
                    error: 'Sua assinatura está aguardando pagamento. Aproveite para terminar as configurações, mas a geração de posts será liberada após a liquidação da fatura.' 
                }, { status: 403 });
            }
        }

        if (!isSubscriptionActive(subscription.status) && subscription.status !== 'PENDING') {
            return NextResponse.json({ error: 'Subscription is inactive' }, { status: 403 });
        }

        // Validar limites
        const wordLimit = subscription.plan?.wordLimit || 0;

        if (postLimit > 0 && subscription.writerPostsUsed + (postsToConsume || 1) > postLimit) {
            const errorMsg = isTrial 
                ? 'Você atingiu o limite máximo de 5 posts no período de teste (trial). É necessário pagar a sua fatura para liberar o restante dos posts do seu plano e continuar gerando conteúdo.'
                : 'Você atingiu o limite de posts do seu plano.';
            
            return NextResponse.json({ error: errorMsg }, { status: 403 });
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

