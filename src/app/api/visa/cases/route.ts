import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const destinationCountry = searchParams.get('destinationCountry');
    const riskLevel = searchParams.get('riskLevel');
    const currentStage = searchParams.get('currentStage');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (destinationCountry) where.destinationCountry = destinationCountry;
    if (riskLevel) where.riskLevel = riskLevel;
    if (currentStage) where.currentStage = currentStage;

    // Enforce case assignment filtering for non-super_admin users
    const isSuperAdmin = auth.roles.includes('super_admin');
    if (!isSuperAdmin && auth.roles.includes('visa_officer')) {
      where.OR = [
        { visaOfficerId: auth.userId },
        { visaOfficerId: '' },
      ];
    }

    let cases = await db.visaCase.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    // Seed mock cases if database is empty for demo/verification
    if (cases.length === 0) {
      const mockCases = [
        {
          caseCode: 'CASE-101',
          studentId: 'STU-101',
          studentName: 'Rahim Uddin',
          destinationCountry: 'UK',
          university: 'University of Manchester',
          course: 'MSc Data Science',
          intake: 'Sep 2025',
          currentStage: 'Officer Review Pending',
          readinessScore: 82,
          riskLevel: 'low',
          visaOfficerId: auth.userId,
          visaOfficerName: auth.name || 'Visa Officer',
        },
        {
          caseCode: 'CASE-102',
          studentId: 'STU-419',
          studentName: 'Shakib Hasan',
          destinationCountry: 'Canada',
          university: 'University of Toronto',
          course: 'MBA',
          intake: 'Sep 2025',
          currentStage: 'AI Interview Pending',
          readinessScore: 68,
          riskLevel: 'medium',
          visaOfficerId: auth.userId,
          visaOfficerName: auth.name || 'Visa Officer',
        },
        {
          caseCode: 'CASE-103',
          studentId: 'STU-882',
          studentName: 'Mitu Sarkar',
          destinationCountry: 'USA',
          university: 'NYU',
          course: 'MS Computer Science',
          intake: 'Fall 2025',
          currentStage: 'Missing Documents',
          readinessScore: 45,
          riskLevel: 'high',
          visaOfficerId: auth.userId,
          visaOfficerName: auth.name || 'Visa Officer',
        },
      ];

      for (const m of mockCases) {
        await db.visaCase.create({ data: m });
      }

      cases = await db.visaCase.findMany({
        where,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      count: cases.length,
      cases,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch visa cases' },
      { status: 500 }
    );
  }
});
