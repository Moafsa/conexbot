import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: botId } = await params;

    const appointments = await prisma.appointment.findMany({
      where: {
        botId,
      },
      include: {
        contact: {
          select: {
            name: true,
            phone: true,
          }
        }
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 50,
    });

    // Map to a cleaner format for the frontend
    const mapped = appointments.map((appt: any) => ({
      id: appt.id,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      contactName: appt.contact?.name,
      contactPhone: appt.contact?.phone,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('[Appointments API] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
