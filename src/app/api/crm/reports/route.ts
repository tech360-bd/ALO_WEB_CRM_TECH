import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || 'last_30_days';
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = dateTo ? new Date(dateTo) : new Date();

      const [
        totalStudents, newStudents, activeApplications,
        studentsByStage, applicationsByStage, tasksCompleted,
        tasksPending, tasksOverdue, totalPartners, activePartners,
        pendingLeads, documentsPending, documentsApproved,
        totalRevenue, paymentsPending,
      ] = await Promise.all([
        db.portalStudentProfile.count(),
        db.portalStudentProfile.count({ where: { createdAt: { gte: fromDate, lte: toDate } } }),
        db.portalStudentApplication.count({ where: { stage: { notIn: ['enrolled', 'withdrawn', 'rejected'] } } }),
        db.portalStudentApplication.groupBy({ by: ['stage'], _count: { stage: true } }),
        db.portalStudentApplication.groupBy({ by: ['stage'], _count: { stage: true } }),
        db.counselorTask.count({ where: { status: 'completed', completedAt: { gte: fromDate, lte: toDate } } }),
        db.counselorTask.count({ where: { status: 'pending' } }),
        db.counselorTask.count({ where: { status: 'pending', dueDate: { lt: new Date().toISOString().split('T')[0] } } }),
        db.partnerProfile.count(),
        db.partnerProfile.count({ where: { approvalStatus: 'approved' } }),
        db.marketingLead.count({ where: { status: 'new' } }),
        db.portalStudentDocument.count({ where: { status: { in: ['pending', 'pending_review', 'needs_update'] } } }),
        db.portalStudentDocument.count({ where: { status: 'accepted' } }),
        db.portalStudentApplication.count({ where: { stage: 'enrolled' } }),
        db.communicationThread.count({ where: { status: 'open', unreadCount: { gt: 0 } } }),
      ]);

      const monthlyStudents = await db.portalStudentProfile.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _count: { id: true },
      });

      const data = {
        summary: {
          totalStudents, newStudents, activeApplications,
          totalPartners, activePartners,
          pendingLeads, documentsPending, documentsApproved,
          tasksCompleted, tasksPending, tasksOverdue,
          totalRevenue, paymentsPending,
        },
        studentsByStage: studentsByStage.map(g => ({ stage: g.stage, count: g._count.stage })),
        applicationsByStage: applicationsByStage.map(g => ({ stage: g.stage, count: g._count.stage })),
        recentStudents: newStudents,
        period: { from: fromDate.toISOString(), to: toDate.toISOString(), label: period },
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('Reports API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({ success: true, data: { summary: {} } });
      }
      return NextResponse.json({ success: false, error: 'Failed to load reports' }, { status: 500 });
    }
  })(request);
}
