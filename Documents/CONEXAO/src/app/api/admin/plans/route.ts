import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const plans = await prisma.plan.findMany({
            orderBy: { price: 'asc' }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('[API /admin/plans POST] Received body:', JSON.stringify(body, null, 2));

        const { name, description, price, priceQuarterly, priceSemiannual, priceYearly, trialDays, botLimit, messageLimit, active, externalId, platformSplitType, platformSplitValue, features } = body;
        
        const parseNum = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        };

        const parseOptionalNum = (val: any) => {
            if (val === undefined || val === null || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        };

        const plan = await prisma.plan.create({
            data: {
                name,
                description,
                price: parseNum(price),
                priceQuarterly: parseOptionalNum(priceQuarterly),
                priceSemiannual: parseOptionalNum(priceSemiannual),
                priceYearly: parseOptionalNum(priceYearly),
                trialDays: parseInt(trialDays as string) || 0,
                botLimit: parseInt(botLimit as string) || 0,
                messageLimit: parseInt(messageLimit as string) || 0,
                active: active !== undefined ? Boolean(active) : true,
                externalId,
                platformSplitType,
                platformSplitValue: parseNum(platformSplitValue),
                features: features || []
            }
        });

        return NextResponse.json(plan);
    } catch (error: any) {
        console.error('[API /admin/plans POST] Error creating plan:', error);
        return NextResponse.json({ 
            error: 'Internal Error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('[API /admin/plans PUT] Received body:', JSON.stringify(body, null, 2));

        const { id, name, description, price, priceQuarterly, priceSemiannual, priceYearly, trialDays, botLimit, messageLimit, active, externalId, platformSplitType, platformSplitValue, features } = body;
        
        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const parseNum = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        };

        const parseOptionalNum = (val: any) => {
            if (val === undefined || val === null || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? null : num;
        };

        const plan = await prisma.plan.update({
            where: { id },
            data: {
                name,
                description,
                price: parseNum(price),
                priceQuarterly: parseOptionalNum(priceQuarterly),
                priceSemiannual: parseOptionalNum(priceSemiannual),
                priceYearly: parseOptionalNum(priceYearly),
                trialDays: parseInt(trialDays as string) || 0,
                botLimit: parseInt(botLimit as string) || 0,
                messageLimit: parseInt(messageLimit as string) || 0,
                active: active !== undefined ? Boolean(active) : true,
                externalId,
                platformSplitType,
                platformSplitValue: parseNum(platformSplitValue),
                features: features || []
            }
        });

        return NextResponse.json(plan);
    } catch (error: any) {
        console.error('[API /admin/plans PUT] Error updating plan:', error);
        return NextResponse.json({ 
            error: 'Internal Error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}
