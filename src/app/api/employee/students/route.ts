import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE STUDENTS API
// GET — List PortalStudentProfile records assigned to this counselor
// ============================================================

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const stage = searchParams.get('stage') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Build where clause — counselorId matches auth.userId
      const where: Record<string, unknown> = { counselorId: auth.userId };

      if (search) {
        where.OR = [
          { fullName: { contains: search } },
          { studentId: { contains: search } },
          { preferredCountry: { contains: search } },
          { preferredSubject: { contains: search } },
        ];
      }
      if (stage) where.journeyStage = stage;

      const [students, total] = await Promise.all([
        db.portalStudentProfile.findMany({
          where,
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            userId: true,
            studentId: true,
            fullName: true,
            guardianName: true,
            city: true,
            preferredCountry: true,
            preferredIntake: true,
            preferredSubject: true,
            preferredLevel: true,
            profileCompletion: true,
            journeyStage: true,
            counselorId: true,
            counselorName: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.portalStudentProfile.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Employee students GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load students' },
        { status: 500 }
      );
    }
  })(request);
}
