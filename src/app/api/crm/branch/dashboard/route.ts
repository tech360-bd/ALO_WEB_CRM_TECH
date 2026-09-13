import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    try {
      const [counselors, unassignedLeads, overdueFollowups, branchLeadsCount, unassignedCount, applicationPipelineCount, escalationCount, applications] = await Promise.all([
        db.portalUser.findMany({ where: { roles: { some: { role: { name: { in: ['counselor', 'senior_counselor'] } } } } }, take: 100 }),
        db.marketingLead.findMany({ where: { counselorId: null, status: 'new' }, orderBy: { createdAt: 'desc' }, take: 10 }),
        db.counselorTask.findMany({ where: { status: 'pending', dueDate: { lt: new Date().toISOString() } }, orderBy: { dueDate: 'asc' }, take: 10 }),
        db.marketingLead.count(),
        db.marketingLead.count({ where: { counselorId: null } }),
        db.portalStudentApplication.count(),
        db.counselorTask.count({ where: { priority: 'URGENT', status: 'pending' } }),
        db.portalStudentApplication.findMany({ select: { stage: true } }),
      ]);

      const counselorPerformance = await Promise.all(counselors.map(async (counselor) => {
        const [leads, active, apps] = await Promise.all([
          db.marketingLead.count({ where: { counselorId: counselor.id } }),
          db.marketingLead.count({ where: { counselorId: counselor.id, status: { in: ['new', 'contacted', 'qualified'] } } }),
          db.portalStudentApplication.count({ where: { studentProfile: { counselorId: counselor.id } } }),
        ]);
        return { name: counselor.name, leads, active, applications: apps, conversion: leads ? `${((apps / leads) * 100).toFixed(1)}%` : '0%', rating: null };
      }));

      const stageCounts = new Map<string, number>();
      for (const application of applications) stageCounts.set(application.stage, (stageCounts.get(application.stage) || 0) + 1);
      const pipelineStages = [...stageCounts.entries()].sort(([, a], [, b]) => b - a).map(([stage, count]) => ({ stage, count, pct: applicationPipelineCount ? Math.round((count / applicationPipelineCount) * 100) : 0, color: 'bg-alo-brand' }));

      return NextResponse.json({ success: true, data: {
        counselorPerformance,
        unassignedLeads: unassignedLeads.map((lead) => ({ name: lead.name, source: lead.source || 'Unknown', interest: lead.destination || 'Not specified', time: lead.createdAt.toISOString() })),
        overdueFollowups: overdueFollowups.map((task) => ({ student: task.studentId || 'Lead', counselor: task.employeeId || 'Unassigned', due: task.dueDate ? new Date(task.dueDate).toISOString() : 'Overdue', type: task.type || 'Follow-up' })),
        pipelineStages,
        kpis: [
          { label: 'Branch Leads', value: String(branchLeadsCount), change: '', up: true, icon: 'Users', sub: 'Total assigned' },
          { label: 'Assigned Counselors', value: String(counselors.length), change: '', up: true, icon: 'UserCheck', sub: 'Active staff' },
          { label: 'Unassigned Leads', value: String(unassignedCount), change: '', up: unassignedCount === 0, icon: 'UserPlus', sub: 'Need assignment' },
          { label: 'Overdue Follow-ups', value: String(overdueFollowups.length), change: '', up: overdueFollowups.length === 0, icon: 'AlertTriangle', sub: 'Require attention' },
          { label: 'Application Pipeline', value: String(applicationPipelineCount), change: '', up: true, icon: 'FileText', sub: 'In progress' },
          { label: 'Escalation Cases', value: String(escalationCount), change: '', up: escalationCount === 0, icon: 'ShieldAlert', sub: 'Pending resolution' },
        ],
      } });
    } catch (error) {
      console.error('Branch Manager Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
