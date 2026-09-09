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

      return NextResponse.json({
        success: true,
        data: {
          aiTaskOverview: [
            { task: 'Course Match for Sharif Uddin', type: 'Course Match', status: 'approved', created: 'Today, 9:00 AM', action: 'Approved' },
            { task: 'SOP Draft — Arif Khan (Manchester)', type: 'SOP Draft', status: 'pending', created: 'Today, 8:30 AM', action: 'Review' },
            { task: 'CV Draft — Sadia Rahman', type: 'CV Draft', status: 'approved', created: 'Today, 8:15 AM', action: 'Approved' },
            { task: 'Document Check — Imtiaz Ahmed', type: 'Doc Check', status: 'rejected', created: 'Yesterday, 5:30 PM', action: 'Regenerate' },
            { task: 'Visa Risk Note — Fahim Rahman (UK)', type: 'Visa Risk', status: 'pending', created: 'Yesterday, 4:00 PM', action: 'Review' },
          ],
          auditLogs: [
            { time: 'Today, 9:15 AM', action: 'SOP generated for Arif Khan', model: 'GPT-4o', tokens: 1240, user: 'AI Engine' },
            { time: 'Today, 8:45 AM', action: 'Course matching executed for batch', model: 'Embedding v2', tokens: 3400, user: 'System' },
            { time: 'Today, 8:30 AM', action: 'CV draft generated for Sadia Rahman', model: 'GPT-4o', tokens: 980, user: 'AI Engine' },
          ],
          pendingApprovals: [
            { task: 'SOP Draft — Arif Khan (Manchester)', type: 'SOP', priority: 'high', created: '8:30 AM' },
            { task: 'Visa Risk Note — Fahim Rahman (UK)', type: 'Visa Risk', priority: 'high', created: '4:00 PM' },
            { task: 'CV Draft — Mithila Akter', type: 'CV', priority: 'medium', created: '11:30 AM' },
          ],
          performanceMetrics: [
            { metric: 'Avg SOP Quality Score', value: '4.8/5.0', trend: '+0.3', icon: 'FileText' },
            { metric: 'Course Match Accuracy', value: '94%', trend: '+4%', icon: 'BookOpen' },
            { metric: 'Doc Check Accuracy', value: '98%', trend: '+2%', icon: 'CheckCircle2' },
            { metric: 'Visa Risk Precision', value: '91%', trend: '+5%', icon: 'ShieldAlert' },
            { metric: 'Avg Generation Time', value: '2.1s', trend: '-0.8s', icon: 'Clock' },
          ],
          kpis: [
            { label: 'AI Course Matches', value: String(courseMatches || 456), change: '+78', up: true, icon: 'BookOpen', sub: 'This month' },
            { label: 'AI SOP Drafts', value: String(sopsCount || 89), change: '+23', up: true, icon: 'FileText', sub: 'Generated' },
            { label: 'AI CV Drafts', value: String(cvCount || 67), change: '+15', up: true, icon: 'FileText', sub: 'Generated' },
            { label: 'AI Document Checks', value: String(docCount || 234), change: '+42', up: true, icon: 'CheckCircle2', sub: 'Completed' },
            { label: 'AI Visa Risk Notes', value: '123', change: '+18', up: true, icon: 'ShieldAlert', sub: 'Generated' },
            { label: 'Human Overrides', value: '3.4%', change: '-0.8%', up: true, icon: 'Brain', sub: 'Manual corrections' },
          ]
        }
      });
    } catch (error) {
      console.error('AI Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
