import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }

    const appointments = await db.appointment.findMany({
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      appointments,
      total: appointments.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch appointments', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { studentId, title, scheduledAt, purpose, venue } = body;

    const appt = await db.appointment.create({
      data: {
        studentId: studentId || 'STU-GENERAL-01',
        title: title || purpose || 'Counseling Session',
        type: 'counseling',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        notes: venue ? `Venue: ${venue}` : 'Office',
        status: 'scheduled',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointment: appt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to schedule appointment', details: error.message }, { status: 500 });
  }
}
