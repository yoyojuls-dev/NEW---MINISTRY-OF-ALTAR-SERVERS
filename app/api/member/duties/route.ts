// app/api/member/duties/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL params for month and year
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    
    const currentDate = new Date();
    const month = monthParam ? parseInt(monthParam) : currentDate.getMonth();
    const year = yearParam ? parseInt(yearParam) : currentDate.getFullYear();

    // Find the member by email
    const member = await prisma.member.findFirst({
      where: {
        email: session.user.email,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get the first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Fetch attendance records for the member in this month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        memberId: member.id,
        eventDate: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    // Fetch ministry events for this month
    const ministryEvents = await prisma.ministryEvent.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group duties by day
    const dutiesByDay: Record<number, string[]> = {};

    // Add attendance-based duties
    attendanceRecords.forEach((record) => {
      const day = record.eventDate.getDate();
      
      if (!dutiesByDay[day]) {
        dutiesByDay[day] = [];
      }

      let dutyText = '';
      switch (record.eventType) {
        case 'SUNDAY_MASS':
          dutyText = `Sunday Mass ${record.serviceTime || 'AM'} - ${formatTime(record.eventDate)}`;
          break;
        case 'DAILY_MASS':
          dutyText = `Daily Mass ${record.serviceTime || 'AM'} - ${formatTime(record.eventDate)}`;
          break;
        case 'MONTHLY_MEETING':
          dutyText = `Monthly Meeting - ${formatTime(record.eventDate)}`;
          break;
        case 'SPECIAL_EVENT':
          dutyText = `Special Event - ${formatTime(record.eventDate)}`;
          break;
        case 'TRAINING':
          dutyText = `Training - ${formatTime(record.eventDate)}`;
          break;
        case 'RETREAT':
          dutyText = `Retreat - ${formatTime(record.eventDate)}`;
          break;
        default:
          dutyText = `${record.eventType} - ${formatTime(record.eventDate)}`;
      }

      dutiesByDay[day].push(dutyText);
    });

    // Add ministry events
    ministryEvents.forEach((event) => {
      const day = event.date.getDate();
      
      if (!dutiesByDay[day]) {
        dutiesByDay[day] = [];
      }

      const eventTime = formatEventTime(event.time);
      dutiesByDay[day].push(`${event.title} - ${eventTime}`);
    });

    // Convert to array format for frontend
    const duties = Object.entries(dutiesByDay).map(([day, dutyList]) => ({
      day: parseInt(day),
      duties: dutyList,
    }));

    return NextResponse.json({
      month,
      year,
      duties,
    });
  } catch (error) {
    console.error('Error fetching member duties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duties' },
      { status: 500 }
    );
  }
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHour}:${displayMinutes} ${ampm}`;
}

function formatEventTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHour}:${displayMinutes} ${ampm}`;
}