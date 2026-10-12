import { canReadLegacyLeadDashboard } from '@/lib/crm/lead-access';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!canReadLegacyLeadDashboard(auth)) return NextResponse.json({ success: false, code: 'LEGACY_DASHBOARD_SCOPE_UNVERIFIED', error: 'User administrator required until dashboard ownership mapping is verified.' }, { status: 403 });
    try {
      const appointments = await db.appointment.findMany({
        orderBy: { scheduledAt: 'asc' },
        take: 12
      });

      const walkIns = await db.marketingLead.findMany({
        where: {
          source: { in: ['Walk-in', 'Front Desk', 'Event', 'Direct'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      });

      const counselors = await db.portalUser.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: { in: ['counselor', 'senior_counselor'] }
              }
            }
          }
        },
        take: 6
      });

      const todayAppointmentsCount = await db.appointment.count();
      const newInquiriesCount = await db.marketingLead.count({ where: { status: 'new' } });

      return NextResponse.json({
        success: true,
        data: {
          appointments: appointments.map(a => ({
            time: a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            student: a.title || 'Student Visitor',
            purpose: a.type || 'Counseling Session',
            counselor: a.notes || 'Senior Counselor',
            status: a.status.toLowerCase()
          })),
          walkIns: walkIns.map(w => ({
            time: 'Today',
            name: w.name,
            interest: w.destination || 'Higher Education',
            assigned: w.counselorId || null
          })),
          counselorAvailability: counselors.map((c, i) => ({
            name: c.name,
            status: i % 2 === 0 ? 'available' : 'busy',
            nextSlot: `${10 + i}:00 AM`
          })),
          visitorLog: [
            { time: '9:00 AM', visitor: 'Sakib Ahmed', type: 'Walk-in', status: 'In Session' },
            { time: '9:30 AM', visitor: 'Lamia Begum', type: 'Appointment', status: 'Waiting' },
            { time: '10:00 AM', visitor: 'Sharif Uddin', type: 'Appointment', status: 'In Session' },
          ],
          kpis: [
            { label: "Today's Appointments", value: String(todayAppointmentsCount), change: '+3', up: true, icon: 'Calendar', sub: 'Scheduled' },
            { label: 'Walk-ins Today', value: String(walkIns.length), change: '+2', up: true, icon: 'DoorOpen', sub: 'Unscheduled visits' },
            { label: 'New Inquiries', value: String(newInquiriesCount), change: '+1', up: true, icon: 'UserPlus', sub: 'Via phone/walk-in' },
            { label: 'Waiting Students', value: '3', change: '-1', up: true, icon: 'Clock', sub: 'In waiting area' },
            { label: 'Missed Calls', value: '4', change: '+1', up: false, icon: 'Phone', sub: 'Need callback' },
            { label: 'Phone Callbacks', value: '7', change: '+2', up: false, icon: 'MessageSquare', sub: 'Scheduled' },
          ]
        }
      });
    } catch (error) {
      console.error('FrontDesk Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
