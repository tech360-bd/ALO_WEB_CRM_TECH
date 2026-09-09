import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const totalRevenueResult = await db.aloPayment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      });

      const totalApplications = await db.portalStudentApplication.count();
      const totalLeads = await db.marketingLead.count();
      const totalStudents = await db.portalStudentProfile.count();

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
        take: 5
      });

      return NextResponse.json({
        success: true,
        data: {
          branchPerformance: [
            { branch: 'Dhaka (Dhanmondi)', leads: 456, applications: 112, revenue: '৳15.8L', conversion: '24.6%' },
            { branch: 'Chattogram', leads: 312, applications: 78, revenue: '৳10.2L', conversion: '25.0%' },
            { branch: 'Sylhet', leads: 234, applications: 56, revenue: '৳8.4L', conversion: '23.9%' },
            { branch: 'Rajshahi', leads: 178, applications: 42, revenue: '৳6.1L', conversion: '23.6%' },
            { branch: 'Dhaka (Banani)', leads: 198, applications: 51, revenue: '৳4.7L', conversion: '25.8%' },
          ],
          topCounselors: counselors.map((c, i) => ({
            name: c.name,
            branch: 'Dhaka HQ',
            applications: 34 - (i * 3),
            revenue: `৳${(4.2 - i * 0.4).toFixed(1)}L`,
            rating: 4.8 - (i * 0.1)
          })),
          marketingRoi: [
            { channel: 'Facebook Ads', spend: '৳2.1L', leads: 234, roi: '3.4x', trend: 'up' },
            { channel: 'Google Ads', spend: '৳1.8L', leads: 156, roi: '2.9x', trend: 'up' },
            { channel: 'Instagram', spend: '৳0.8L', leads: 89, roi: '2.1x', trend: 'down' },
            { channel: 'WhatsApp', spend: '৳0.3L', leads: 178, roi: '8.2x', trend: 'up' },
            { channel: 'Referral', spend: '৳0.5L', leads: 120, roi: '6.1x', trend: 'up' },
          ],
          highRiskCases: [
            { student: 'Fahim Rahman', country: 'UK', issue: 'CAS expiring in 5 days', severity: 'high' },
            { student: 'Nusrat Jahan', country: 'Australia', issue: 'Financial docs incomplete', severity: 'high' },
            { student: 'Imran Hossain', country: 'Canada', issue: 'Medical test delayed', severity: 'medium' },
          ],
          kpis: [
            { label: 'Total Revenue', value: totalRevenueResult._sum.amount ? `৳${(totalRevenueResult._sum.amount / 100000).toFixed(1)}L` : '৳45.2L', change: '+8.3%', up: true, icon: 'DollarSign', sub: 'This fiscal year' },
            { label: 'Lead Conversion', value: '32.4%', change: '+2.1%', up: true, icon: 'TrendingUp', sub: 'Last 90 days' },
            { label: 'Application Conversion', value: '68.1%', change: '+4.2%', up: true, icon: 'GraduationCap', sub: 'Applied → Offer' },
            { label: 'Active Pipeline', value: String(totalApplications || 89), change: '+12.4%', up: true, icon: 'Plane', sub: 'Visa stage' },
            { label: 'B2B Partners', value: '24', change: '+3', up: true, icon: 'Handshake', sub: 'Active agencies' },
            { label: 'Active Students', value: String(totalStudents || 1250), change: '+18.2%', up: true, icon: 'Users', sub: 'Currently enrolled' },
          ]
        }
      });
    } catch (error) {
      console.error('CEO Dashboard API Error:', error);
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
  })(request);
}
