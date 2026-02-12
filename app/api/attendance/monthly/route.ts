// app/api/attendance/monthly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch monthly meeting attendance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using your userType field
    const isAdmin = (session.user as any).userType === 'ADMIN' || (session.user as any).role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Calculate the date range for the specified month
    const startDate = new Date(parseInt(year), parseInt(month), 1);
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);

    // Fetch attendance records for monthly meetings in the specified month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        eventType: 'MONTHLY_MEETING',
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            surname: true,
            givenName: true,
          },
        },
      },
    });

    // Transform the data to match the frontend format
    const transformedData = attendanceRecords.map(record => ({
      memberId: record.memberId,
      present: record.status === 'PRESENT',
      absent: record.status === 'ABSENT',
      excused: record.status === 'EXCUSED',
      excuseLetter: record.notes || '',
      dueChecked: false, // This will be from financial records
      dueAmount: 0, // This will be from financial records
    }));

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST - Save monthly meeting attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using your userType field
    const isAdmin = (session.user as any).userType === 'ADMIN' || (session.user as any).role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { month, year, attendance } = body;

    if (!month || !year || !attendance) {
      return NextResponse.json(
        { error: 'Month, year, and attendance data are required' },
        { status: 400 }
      );
    }

    // Get the admin user ID
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // The event date for the monthly meeting (first day of the month)
    const eventDate = new Date(parseInt(year), parseInt(month), 1);

    // Process each attendance record
    const attendancePromises = Object.values(attendance).map(async (record: any) => {
      // Determine attendance status
      let status = 'ABSENT';
      if (record.present) status = 'PRESENT';
      else if (record.excused) status = 'EXCUSED';

      // Check if attendance record already exists
      const existingRecord = await prisma.attendance.findFirst({
        where: {
          memberId: record.memberId,
          eventType: 'MONTHLY_MEETING',
          eventDate: {
            gte: new Date(parseInt(year), parseInt(month), 1),
            lte: new Date(parseInt(year), parseInt(month) + 1, 0),
          },
        },
      });

      if (existingRecord) {
        // Update existing record
        return prisma.attendance.update({
          where: { id: existingRecord.id },
          data: {
            status: status as any,
            notes: record.excuseLetter || null,
            recordedByUserId: adminUser.id,
          },
        });
      } else {
        // Create new record
        return prisma.attendance.create({
          data: {
            memberId: record.memberId,
            eventType: 'MONTHLY_MEETING',
            eventDate,
            status: status as any,
            notes: record.excuseLetter || null,
            recordedByUserId: adminUser.id,
          },
        });
      }
    });

    // Handle financial records (monthly dues)
    const duesPromises = Object.values(attendance)
      .filter((record: any) => record.dueChecked && record.dueAmount > 0)
      .map(async (record: any) => {
        // Check if financial record already exists
        const existingDue = await prisma.financialRecord.findFirst({
          where: {
            memberId: record.memberId,
            type: 'DUES',
            transactionDate: {
              gte: new Date(parseInt(year), parseInt(month), 1),
              lte: new Date(parseInt(year), parseInt(month) + 1, 0),
            },
          },
        });

        if (existingDue) {
          // Update existing due
          return prisma.financialRecord.update({
            where: { id: existingDue.id },
            data: {
              amount: record.dueAmount,
              status: 'PAID',
            },
          });
        } else {
          // Create new due record
          return prisma.financialRecord.create({
            data: {
              memberId: record.memberId,
              type: 'DUES',
              amount: record.dueAmount,
              description: `Monthly dues for ${new Date(parseInt(year), parseInt(month)).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
              transactionDate: new Date(),
              status: 'PAID',
              recordedByUserId: adminUser.id,
            },
          });
        }
      });

    // Execute all database operations
    await Promise.all([...attendancePromises, ...duesPromises]);

    return NextResponse.json(
      { message: 'Attendance saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json(
      { error: 'Failed to save attendance' },
      { status: 500 }
    );
  }
}