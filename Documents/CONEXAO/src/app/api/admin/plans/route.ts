export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as any;

        const plans = await prisma.plan.findMany({
            where: type ? { type } : {},
            orderBy: { price: 'asc' }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('[API /admin/plans POST] Received body:', JSON.stringify(body, null, 2));

        const { name, description, price, priceQuarterly, priceSemiannual, priceYearly, trialDays, botLimit, messageLimit, postLimit, wordLimit, type, active, externalId, platformSplitType, platformSplitValue, features, productId } = body;
        
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
                postLimit: parseInt(postLimit as string) || 0,
                wordLimit: parseInt(wordLimit as string) || 0,
                type: type || 'PRIMARY',
                active: active !== undefined ? Boolean(active) : true,
                externalId,
                platformSplitType,
                platformSplitValue: parseNum(platformSplitValue),
                features: features || [],
                productCatalogId: productId || null
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
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('[API /admin/plans PUT] Received body:', JSON.stringify(body, null, 2));

        const { id, name, description, price, priceQuarterly, priceSemiannual, priceYearly, trialDays, botLimit, messageLimit, postLimit, wordLimit, type, active, externalId, platformSplitType, platformSplitValue, features, productId } = body;
        
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
                postLimit: parseInt(postLimit as string) || 0,
                wordLimit: parseInt(wordLimit as string) || 0,
                type: type || 'PRIMARY',
                active: active !== undefined ? Boolean(active) : true,
                externalId,
                platformSplitType,
                platformSplitValue: parseNum(platformSplitValue),
                features: features || [],
                productCatalogId: productId || null
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

