import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { latitude, longitude, token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
        }

        // Find contact/driver with matching loginToken
        const driver = await prisma.contact.findFirst({
            where: {
                loginToken: token,
                loginTokenExpires: {
                    gt: new Date()
                },
                contactType: 'DRIVER'
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // Update driver's coordinates
        await prisma.contact.update({
            where: { id: driver.id },
            data: {
                latitude,
                longitude,
                lastActive: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API Telemetry Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
