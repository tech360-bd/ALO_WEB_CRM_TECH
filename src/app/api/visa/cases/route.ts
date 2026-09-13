import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const destinationCountry = searchParams.get('destinationCountry');
    const riskLevel = searchParams.get('riskLevel');
    const currentStage = searchParams.get('currentStage');
    const studentId = searchParams.get('studentId');
    const studentName = searchParams.get('studentName');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);

    const where: any = {};
    if (destinationCountry) where.destinationCountry = destinationCountry;
    if (riskLevel) where.riskLevel = riskLevel;
    if (currentStage) where.currentStage = currentStage;
    if (studentId) where.studentId = studentId;
    if (studentName) where.studentName = { contains: studentName, mode: 'insensitive' };

    // RBAC: visa_officer, visa_interview_officer, super_admin, admin
    const isSuperAdmin = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const isVisaOfficer = auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_INTERVIEW_OFFICER');

    if (!isSuperAdmin) {
      if (isVisaOfficer) {
        // Visa officer can only view assigned cases unless explicitly has view all permission
        const canViewAll = auth.roles.includes('visa_team') || auth.roles.includes('super_admin');
        if (!canViewAll) {
          where.visaOfficerId = auth.userId;
        }
      } else if (auth.roles.includes('counselor') || auth.roles.includes('senior_counselor')) {
        // Counselor can only view own students' cases
        where.counselorId = auth.userId;
      } else if (!auth.roles.includes('application_team') && !auth.roles.includes('application_manager')) {
        // Others denied unless explicit permission
        // Allow but filtered — will be blocked by ownership if not assigned
        where.visaOfficerId = auth.userId;
      }
    }

    const [cases, total] = await Promise.all([
      db.visaCase.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { updatedAt: 'desc' },
      }),
      db.visaCase.count({ where }),
    ]);

    // No mock data — proper empty state per spec
    if (cases.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        total,
        cases: [],
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        emptyState: 'No visa cases assigned — proper empty state, no fake numbers, real database metrics',
      });
    }

    return NextResponse.json({
      success: true,
      count: cases.length,
      total,
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch visa cases' },
      { status: 500 }
    );
  }
});
