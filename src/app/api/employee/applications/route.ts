import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE APPLICATIONS API
// GET — List PortalStudentApplication for counselor's students
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
      const stage = searchParams.get('stage') || '';
      const country = searchParams.get('country') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // First get student profile IDs for this counselor
      const counselorStudents = await db.portalStudentProfile.findMany({
        where: { counselorId: auth.userId },
        select: { id: true },
      });

      const studentIds = counselorStudents.map(s => s.id);

      if (studentIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }

      // Build where clause for applications
      const where: Record<string, unknown> = {
        studentProfileId: { in: studentIds },
      };

      if (search) {
        where.OR = [
          { university: { contains: search } },
          { course: { contains: search } },
          { intake: { contains: search } },
          { counselorNote: { contains: search } },
        ];
      }
      if (stage) where.stage = stage;
      if (country) where.country = country;

      const [applications, total] = await Promise.all([
        db.portalStudentApplication.findMany({
          where,
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.portalStudentApplication.count({ where }),
      ]);

      // Enrich with student names
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const student = await db.portalStudentProfile.findUnique({
            where: { id: app.studentProfileId },
            select: { fullName: true, studentId: true },
          });
          return {
            ...app,
            studentName: student?.fullName || '',
            studentStudentId: student?.studentId || '',
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: enrichedApplications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Employee applications GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load applications' },
        { status: 500 }
      );
    }
  })(request);
}
