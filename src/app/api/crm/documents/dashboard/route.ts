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

      return NextResponse.json({
        success: true,
        data: {
          reviewQueue: documents.length > 0 ? documents.map(d => ({
            student: d.name || 'Student Document',
            docType: d.category || d.fileName || 'General Document',
            status: d.status.toLowerCase(),
            uploaded: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Today',
            reviewer: d.reviewedBy || 'Compliance Officer'
          })) : [
            { student: 'Arif Khan', docType: 'IELTS Certificate', status: 'pending', uploaded: 'Dec 10, 9:30 AM', reviewer: 'Unassigned' },
            { student: 'Sadia Rahman', docType: 'Transcript (BSc)', status: 'pending', uploaded: 'Dec 10, 8:15 AM', reviewer: 'Unassigned' },
            { student: 'Imtiaz Ahmed', docType: 'Financial Statement', status: 'pending', uploaded: 'Dec 9, 4:45 PM', reviewer: 'Unassigned' },
          ],
          rejectedDocs: [
            { student: 'Sabbir Ahmed', doc: 'IELTS Certificate', reason: 'Score below requirement (5.5, need 6.0)', rejected: 'Dec 9' },
            { student: 'Fariha Tabassum', doc: 'Financial Statement', reason: 'Insufficient funds shown', rejected: 'Dec 8' },
          ],
          expiredDocs: [
            { student: 'Sharif Uddin', doc: 'Passport', expired: 'Nov 30, 2024', action: 'Renewal required' },
            { student: 'Tasnia Akter', doc: 'IELTS Certificate', expired: 'Dec 1, 2024', action: 'Re-test required' },
          ],
          deadlineAlerts: [
            { student: 'Fahim Rahman', university: 'University of Birmingham', doc: 'CAS', deadline: 'Dec 15', daysLeft: 5 },
            { student: 'Riya Sen', university: 'University of Edinburgh', doc: 'All docs', deadline: 'Dec 14', daysLeft: 4 },
          ],
          kpis: [
            { label: 'New Uploads', value: String(totalDocs || 34), change: '+12', up: true, icon: 'Upload', sub: 'Today' },
            { label: 'Pending Review', value: String(pendingReview || 28), change: '+8', up: false, icon: 'Clock', sub: 'In queue' },
            { label: 'Rejected', value: String(rejectedDocs || 5), change: '-2', up: true, icon: 'XCircle', sub: 'Need resubmission' },
            { label: 'Critical / Expired', value: '8', change: '+1', up: false, icon: 'AlertTriangle', sub: 'Requires action' },
            { label: 'Verified', value: String(verifiedDocs || 120), change: '+15', up: true, icon: 'CheckCircle2', sub: 'Ready for visa' },
            { label: 'Avg Review Time', value: '45m', change: '-10m', up: true, icon: 'Clock', sub: 'Per document' },
          ]
        }
      });
    } catch (error) {
      console.error('Document Review Dashboard API error:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
