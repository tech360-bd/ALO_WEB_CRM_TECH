import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      // Return hardcoded mock data for now, since we only need UI to work
      return NextResponse.json({
        success: true,
        data: {
          approvalQueue: [
            { type: 'University', name: 'University of Essex — New Campus', submittedBy: 'Tanvir Ahmed', date: 'Dec 10', status: 'pending' },
            { type: 'Course', name: 'MSc AI & Data Science — Uni of Bristol', submittedBy: 'Rafiq Hasan', date: 'Dec 9', status: 'pending' },
          ],
          importHistory: [
            { file: 'uk_universities_dec2024.csv', records: 45, status: 'completed', date: 'Dec 8', by: 'Data Team' },
            { file: 'commission_rules_update.csv', records: 12, status: 'failed', date: 'Dec 2', by: 'Data Team' },
          ],
          topCountries: [
            { country: 'UK', universities: 68, courses: 524, intakes: 24, scholarships: 42 },
            { country: 'Australia', universities: 45, courses: 389, intakes: 18, scholarships: 28 },
          ],
          kpis: [
            { label: 'Universities', value: '245', change: '+12', up: true, icon: 'GraduationCap', sub: 'In database' },
            { label: 'Courses', value: '1,847', change: '+86', up: true, icon: 'BookOpen', sub: 'Active listings' },
            { label: 'Scholarships', value: '156', change: '+8', up: true, icon: 'Award', sub: 'Available' },
            { label: 'Active Intakes', value: '89', change: '+5', up: true, icon: 'Calendar', sub: 'Current cycle' },
            { label: 'Pending Approval', value: '12', change: '+4', up: false, icon: 'Clock', sub: 'Data entries' },
            { label: 'CSV Import History', value: '8', change: '+1', up: true, icon: 'FileSpreadsheet', sub: 'Recent imports' },
          ]
        }
      });
    } catch (error) {
      console.error('CRM Data Manager Dashboard error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load data' },
        { status: 500 }
      );
    }
  })(request);
}
