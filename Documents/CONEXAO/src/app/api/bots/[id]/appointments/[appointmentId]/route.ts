import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string, appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: botId, appointmentId } = await params;
    const { status } = await req.json();

    if (!['PENDING', 'CONFIRMED', 'CANCELED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('[Appointment Update API] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string, appointmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appointmentId } = await params;

    await prisma.appointment.delete({
      where: { id: appointmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Appointment Delete API] Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
