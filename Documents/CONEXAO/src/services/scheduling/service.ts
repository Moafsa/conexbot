
import prisma from '@/lib/prisma';
import { google } from 'googleapis';
import { addMinutes, startOfDay, endOfDay, isAfter, isBefore, format, parseISO } from 'date-fns';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export class SchedulingService {
  /**
   * Get available slots for a specific date
   */
  static async getAvailableSlots(botId: string, date: Date): Promise<TimeSlot[]> {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { appointments: {
        where: {
          startTime: { gte: startOfDay(date) },
          endTime: { lte: endOfDay(date) },
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      }}
    });

    if (!bot) throw new Error('Bot not found');

    const duration = bot.appointmentDuration || 30;
    const slots: TimeSlot[] = [];

    // Parse working hours (default 09:00-18:00 if not set)
    const dayOfWeek = format(date, 'eee').toLowerCase(); // mon, tue, etc.
    const workingHoursObj = (bot.workingHours as any) || { mon: "09:00-18:00", tue: "09:00-18:00", wed: "09:00-18:00", thu: "09:00-18:00", fri: "09:00-18:00" };
    const dayRange = workingHoursObj[dayOfWeek];

    if (!dayRange) return []; // Not working this day

    const [startH, endH] = dayRange.split('-');
    const startTime = new Date(date);
    startTime.setHours(parseInt(startH.split(':')[0]), parseInt(startH.split(':')[1]), 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(parseInt(endH.split(':')[0]), parseInt(endH.split(':')[1]), 0, 0);

    // If using Google Calendar, fetch busy slots
    let busySlots: { start: Date, end: Date }[] = bot.appointments.map(a => ({ start: a.startTime, end: a.endTime }));

    if (bot.schedulingProvider === 'GOOGLE' && bot.googleRefreshToken) {
      const googleBusy = await this.getGoogleBusySlots(bot, date);
      busySlots = [...busySlots, ...googleBusy];
    }

    // Generate slots
    let current = startTime;
    while (isBefore(current, endTime)) {
      const slotEnd = addMinutes(current, duration);
      if (isAfter(slotEnd, endTime)) break;

      const isBusy = busySlots.some(busy => 
        (isAfter(current, busy.start) || current.getTime() === busy.start.getTime()) && 
        isBefore(current, busy.end)
      );

      // Don't show past slots for today
      const isPast = isBefore(current, new Date());

      slots.push({
        start: new Date(current),
        end: slotEnd,
        available: !isBusy && !isPast
      });

      current = slotEnd;
    }

    return slots;
  }

  /**
   * Create an appointment
   */
  static async createAppointment(params: {
    botId: string,
    contactId: string,
    tenantId: string,
    startTime: Date,
    endTime?: Date
  }) {
    const bot = await prisma.bot.findUnique({ where: { id: params.botId } });
    if (!bot) throw new Error('Bot not found');

    const duration = bot.appointmentDuration || 30;
    const end = params.endTime || addMinutes(params.startTime, duration);

    // Check availability
    const slots = await this.getAvailableSlots(params.botId, params.startTime);
    const isAvailable = slots.find(s => s.start.getTime() === params.startTime.getTime())?.available;

    if (!isAvailable) throw new Error('Slot not available');

    // Create internally
    const appointment = await prisma.appointment.create({
      data: {
        botId: params.botId,
        contactId: params.contactId,
        tenantId: params.tenantId,
        startTime: params.startTime,
        endTime: end,
        status: 'CONFIRMED'
      },
      include: { contact: true }
    });

    // Sync with Google if needed
    if (bot.schedulingProvider === 'GOOGLE' && bot.googleRefreshToken) {
      try {
        const googleEventId = await this.createGoogleEvent(bot, appointment);
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId }
        });
      } catch (err) {
        console.error('Failed to sync with Google Calendar:', err);
      }
    }

    return appointment;
  }

  private static async getGoogleBusySlots(bot: any, date: Date): Promise<{ start: Date, end: Date }[]> {
    const oauth2Client = this.getOauth2Client();
    oauth2Client.setCredentials({ refresh_token: bot.googleRefreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startOfDay(date).toISOString(),
        timeMax: endOfDay(date).toISOString(),
        items: [{ id: bot.googleCalendarId || 'primary' }]
      }
    });

    const busy = response.data.calendars?.[bot.googleCalendarId || 'primary']?.busy || [];
    return busy.map(b => ({
      start: new Date(b.start!),
      end: new Date(b.end!)
    }));
  }

  private static async createGoogleEvent(bot: any, appointment: any): Promise<string> {
    const oauth2Client = this.getOauth2Client();
    oauth2Client.setCredentials({ refresh_token: bot.googleRefreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const res = await calendar.events.insert({
      calendarId: bot.googleCalendarId || 'primary',
      requestBody: {
        summary: `Agendamento: ${appointment.contact?.name || 'Cliente'}`,
        description: `Agendamento realizado via Bot ${bot.name}. Contato: ${appointment.contact?.phone || 'N/A'}`,
        start: { dateTime: appointment.startTime.toISOString() },
        end: { dateTime: appointment.endTime.toISOString() },
      }
    });

    return res.data.id!;
  }

  private static getOauth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    );
  }
}
