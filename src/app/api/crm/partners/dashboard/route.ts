import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const partners = await db.partnerProfile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const total = await db.partnerProfile.count();
      const active = await db.partnerProfile.count({ where: { approvalStatus: 'active' } });
      const pending = await db.partnerProfile.count({ where: { approvalStatus: 'pending' } });
      
      const studentsReferred = partners.reduce((sum, p) => sum + (p.activeStudents || 0) + (p.totalLeads || 0), 0);
      const commissionPending = partners.reduce((sum, p) => sum + (p.commissionPending || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          partnerPerformance: partners.map(p => ({
            partner: p.companyName,
            location: p.city || 'Unknown',
            students: (p.activeStudents || 0) + (p.totalLeads || 0),
            applications: p.totalLeads || 0,
            commission: `৳${(p.commissionPaid || 0) + (p.commissionPending || 0)}`,
            compliance: p.approvalStatus === 'active' ? 100 : 50
          })),
          kpis: [
            { label: 'Active Partners', value: active.toString(), change: '+0', up: true, icon: 'Handshake', sub: 'Across regions' },
            { label: 'Pending Approval', value: pending.toString(), change: '+0', up: false, icon: 'Clock', sub: 'Awaiting review' },
            { label: 'Partner Students', value: studentsReferred.toString(), change: '+0', up: true, icon: 'Users', sub: 'Referred this year' },
            { label: 'Partner Applications', value: '0', change: '+0', up: true, icon: 'FileText', sub: 'In pipeline' },
            { label: 'Commission Pending', value: `৳${commissionPending}`, change: '৳0', up: true, icon: 'DollarSign', sub: 'Outstanding' },
            { label: 'Training Completed', value: '0', change: '+0', up: true, icon: 'Award', sub: 'This quarter' },
          ],
          pendingApprovals: partners.filter(p => p.approvalStatus === 'pending').map(p => ({
            name: p.companyName,
            location: p.city || 'Unknown',
            submitted: p.createdAt.toISOString().split('T')[0],
            documents: 'Under Review'
          })),
          complianceStatus: [
            // Dummy for UI completeness
            { partner: 'Way to Study', issue: 'Agreement renewal overdue', severity: 'high', due: 'Dec 15' }
          ],
          trainingStatus: [
            { training: 'UK Visa Process 2025', completed: 18, total: 24, date: 'Dec 5' }
          ]
        }
      });
    } catch (error) {
      console.error('CRM Partners Dashboard error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load dashboard data' },
        { status: 500 }
      );
    }
  })(request);
}
