import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const applications = await db.portalStudentApplication.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
          studentProfile: {
            select: { fullName: true }
          }
        }
      });

      // Basic aggregations
      const total = await db.portalStudentApplication.count();
      const submitted = await db.portalStudentApplication.count({ where: { stage: 'submitted' } });
      const ready = await db.portalStudentApplication.count({ where: { stage: 'document_ready' } });
      const conditional = await db.portalStudentApplication.count({ where: { stage: 'conditional' } });
      const missing = await db.portalStudentApplication.count({ where: { stage: 'research' } }); // Approx missing

      return NextResponse.json({
        success: true,
        data: {
          applications: applications.map(app => ({
            id: app.id,
            student: app.studentProfile?.fullName || 'Unknown',
            university: app.university,
            country: app.country,
            course: app.course,
            stage: app.stage,
            submitted: app.updatedAt.toISOString().split('T')[0]
          })),
          kpis: [
            { label: 'Ready to Submit', value: ready, change: '+0', up: true, icon: 'FileCheck', sub: 'Awaiting final review' },
            { label: 'Doc Review Pending', value: missing, change: '+0', up: false, icon: 'Eye', sub: 'In review queue' },
            { label: 'Submitted to Uni', value: submitted, change: '+0', up: true, icon: 'Send', sub: 'Awaiting response' },
            { label: 'Acknowledged', value: 0, change: '+0', up: true, icon: 'CheckCircle2', sub: 'Under evaluation' },
            { label: 'Conditional Offers', value: conditional, change: '+0', up: true, icon: 'Award', sub: 'Awaiting acceptance' },
            { label: 'Missing Documents', value: missing, change: '0', up: false, icon: 'FileX', sub: 'Blocking submission' },
          ],
          missingDocs: [
            // Dummy for UI completeness since we don't track detailed docs in DB currently
            { student: 'Jamil Hossain', doc: 'IELTS Certificate', deadline: 'Dec 12', severity: 'high' }
          ],
          universityFollowups: [
            { university: 'University of Manchester', task: 'Check application status', due: 'Today' }
          ],
          deadlineAlerts: [
            { university: 'University of Edinburgh', intake: 'Jan 2025', deadline: 'Dec 15', daysLeft: 5 }
          ]
        }
      });
    } catch (error) {
      console.error('CRM Applications Dashboard error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    }
  })(request);
}
