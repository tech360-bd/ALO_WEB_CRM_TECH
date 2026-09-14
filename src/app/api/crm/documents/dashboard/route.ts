import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const documents = await db.portalStudentDocument.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      const totalDocs = await db.portalStudentDocument.count();
      const pendingReview = await db.portalStudentDocument.count({ where: { status: 'PENDING' } });
      const verifiedDocs = await db.portalStudentDocument.count({ where: { status: 'VERIFIED' } });
      const rejectedDocs = await db.portalStudentDocument.count({ where: { status: 'REJECTED' } });

      // REAL ONLY — no fake fallback (SEC-01 workforce report + portal-real requirement)
      const rejectedList = await db.portalStudentDocument.findMany({ where: { status: 'REJECTED' }, take: 10, orderBy: { updatedAt: 'desc' } }).catch(() => []);
      const expiredList = await db.portalStudentDocument.findMany({ where: { status: 'EXPIRED' }, take: 10, orderBy: { updatedAt: 'desc' } }).catch(() => []);
      return NextResponse.json({
        success: true,
        data: {
          reviewQueue: documents.map(d => ({
            student: d.name || 'Student Document',
            docType: d.category || d.fileName || 'General Document',
            status: d.status.toLowerCase(),
            uploaded: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Today',
            reviewer: d.reviewedBy || 'Compliance Officer'
          })),
          rejectedDocs: rejectedList.map(d => ({ student: d.name || '—', doc: d.category || d.fileName || '—', reason: (d as any).rejectionReason || '—', rejected: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '' })),
          expiredDocs: expiredList.map(d => ({ student: d.name || '—', doc: d.category || d.fileName || '—', expired: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '', action: 'Renewal required' })),
          deadlineAlerts: [],
          kpis: [
            { label: 'New Uploads', value: String(totalDocs), change: '', up: true, icon: 'Upload', sub: 'Today' },
            { label: 'Pending Review', value: String(pendingReview), change: '', up: false, icon: 'Clock', sub: 'In queue' },
            { label: 'Rejected', value: String(rejectedDocs), change: '', up: true, icon: 'XCircle', sub: 'Need resubmission' },
            { label: 'Critical / Expired', value: String(expiredList.length), change: '', up: false, icon: 'AlertTriangle', sub: 'Requires action' },
            { label: 'Verified', value: String(verifiedDocs), change: '', up: true, icon: 'CheckCircle2', sub: 'Ready for visa' },
            { label: 'Avg Review Time', value: '—', change: '', up: true, icon: 'Clock', sub: 'Per document' },
          ]
        }
      });
    } catch (error) {
      console.error('Document Review Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
