import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const sopDrafts = await db.sopDraft.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      const cvReviews = await db.cvReview.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      const courseMatches = await db.savedCourse.count();
      const sopsCount = await db.sopDraft.count();
      const cvCount = await db.cvReview.count();
      const docCount = await db.portalStudentDocument.count();

      // REAL ONLY — no hardcoded Arif/Sadia/Imtiaz (portal-real requirement)
      return NextResponse.json({
        success: true,
        data: {
          aiTaskOverview: [
            ...sopDrafts.map((s: any) => ({ task: `SOP Draft — ${s.studentId || s.id}`, type: 'SOP Draft', status: (s.status || 'pending').toLowerCase(), created: s.createdAt ? new Date(s.createdAt).toLocaleString() : '', action: 'Review' })),
            ...cvReviews.map((c: any) => ({ task: `CV Review — ${c.studentId || c.id}`, type: 'CV Review', status: (c.status || 'pending').toLowerCase(), created: c.createdAt ? new Date(c.createdAt).toLocaleString() : '', action: 'Review' })),
          ].slice(0, 10),
          auditLogs: await db.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { createdAt: true, action: true, resource: true } }).then(rows => rows.map(r => ({ time: new Date(r.createdAt).toLocaleString(), action: `${r.action} — ${r.resource}`, model: '—', tokens: 0, user: 'system' }))).catch(()=>[]),
          pendingApprovals: await db.portalStudentDocument.findMany({ where: { status: 'PENDING_REVIEW' }, take: 5, orderBy: { createdAt: 'desc' } }).then(rows => rows.map(r=>({ task: r.category || r.fileName || 'Pending', type: r.category || 'Doc', priority: 'high', created: r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : '' }))).catch(()=>[]),
          performanceMetrics: [],
          kpis: [
            { label: 'AI Course Matches', value: String(courseMatches), change: '', up: true, icon: 'BookOpen', sub: 'This month' },
            { label: 'AI SOP Drafts', value: String(sopsCount), change: '', up: true, icon: 'FileText', sub: 'Generated' },
            { label: 'AI CV Drafts', value: String(cvCount), change: '', up: true, icon: 'FileText', sub: 'Generated' },
            { label: 'AI Document Checks', value: String(docCount), change: '', up: true, icon: 'CheckCircle2', sub: 'Completed' },
            { label: 'AI Visa Risk Notes', value: String(await db.visaRiskAssessment.count().catch(()=>0)), change: '', up: true, icon: 'ShieldAlert', sub: 'Generated' },
            { label: 'Human Overrides', value: '—', change: '', up: true, icon: 'Brain', sub: 'Manual corrections' },
          ]
        }
      });
    } catch (error) {
      console.error('AI Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
