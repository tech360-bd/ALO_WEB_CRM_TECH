import { canReadLegacyLeadDashboard } from '@/lib/crm/lead-access';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!canReadLegacyLeadDashboard(auth)) return NextResponse.json({ success: false, code: 'LEGACY_DASHBOARD_SCOPE_UNVERIFIED', error: 'User administrator required until dashboard ownership mapping is verified.' }, { status: 403 });
    try {
      const isSuperAdmin = auth.roles.includes('super_admin') || auth.roles.includes('admin');
      const employeeId = auth.userId;

      // 1. Hot Leads
      let hotLeads = await db.marketingLead.findMany({
        where: isSuperAdmin 
          ? { status: { in: ['new', 'contacted', 'QUALIFIED', 'HOT'] } }
          : { 
              counselorId: employeeId,
              status: { in: ['new', 'contacted', 'QUALIFIED', 'HOT'] }
            },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // 2. Today's Follow-up Tasks
      let todayFollowups = await db.counselorTask.findMany({
        where: isSuperAdmin 
          ? { status: 'pending' }
          : { employeeId: employeeId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // 3. Application Ready Students
      let applicationReady = await db.portalStudentApplication.findMany({
        include: {
          studentProfile: {
            include: {
              user: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });

      // 4. KPIs
      const totalLeads = await db.marketingLead.count({
        where: isSuperAdmin ? {} : { counselorId: employeeId }
      });

      const totalStudents = await db.portalStudentProfile.count();

      const pendingTasksCount = await db.counselorTask.count({
        where: isSuperAdmin ? { status: 'pending' } : { employeeId: employeeId, status: 'pending' }
      });

      return NextResponse.json({
        success: true,
        data: {
          hotLeads: hotLeads.map(l => ({
            id: l.id,
            name: l.name,
            course: l.level || 'Higher Education',
            country: l.destination || 'UK / Global',
            urgency: l.status === 'HOT' || l.status === 'new' ? 'hot' : 'warm',
            phone: l.phone,
            email: l.email
          })),
          todayFollowups: todayFollowups.map(t => ({
            id: t.id,
            student: t.studentId || t.leadId || 'Assigned Lead',
            type: t.type || 'Call Follow-up',
            time: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Today',
            status: t.status
          })),
          applicationReady: applicationReady.map(a => ({
            id: a.id,
            name: a.studentProfile?.user?.name || 'Student Applicant',
            university: a.university || 'University Partner',
            country: a.country || 'Global',
            docsReady: true,
            status: a.stage
          })),
          kpis: {
            totalLeads: String(totalLeads),
            totalStudents: String(totalStudents),
            hotLeadsCount: String(hotLeads.length),
            pendingTasksCount: String(pendingTasksCount),
            profileCompletion: '92%',
            applicationReadyCount: String(applicationReady.length)
          }
        }
      });
    } catch (error) {
      console.error('Counselor Dashboard API Error:', error);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
  })(request);
}
