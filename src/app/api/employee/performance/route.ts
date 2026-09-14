import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// EMPLOYEE PERFORMANCE API
// GET  — List EmployeePerformance records for the authenticated employee
// POST — Create a performance record (manager action)
// PUT  — Update a performance record (manager action)
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
      const period = searchParams.get('period') || '';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Get employee profile
      const profile = await db.employeeProfile.findUnique({
        where: { userId: auth.userId },
      });
      const employeeId = profile?.employeeId || auth.userId;

      const where: Record<string, unknown> = { employeeId };
      if (period) where.period = period;

      const [records, total] = await Promise.all([
        db.employeePerformance.findMany({
          where,
          orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.employeePerformance.count({ where }),
      ]);

      // Calculate overall averages
      const avgResult = await db.employeePerformance.aggregate({
        where: { employeeId },
        _avg: {
          score: true,
          targetLeads: true,
          achievedLeads: true,
          targetConversion: true,
          achievedConversion: true,
          targetRevenue: true,
          achievedRevenue: true,
          managerRating: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: records,
        summary: {
          averageScore: avgResult._avg.score || 0,
          averageRating: avgResult._avg.managerRating || 0,
          averageTargetLeads: avgResult._avg.targetLeads || 0,
          averageAchievedLeads: avgResult._avg.achievedLeads || 0,
          averageTargetConversion: avgResult._avg.targetConversion || 0,
          averageAchievedConversion: avgResult._avg.achievedConversion || 0,
          averageTargetRevenue: avgResult._avg.targetRevenue || 0,
          averageAchievedRevenue: avgResult._avg.achievedRevenue || 0,
          totalReviews: total,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Employee performance GET error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          summary: {
            averageScore: 0,
            averageRating: 0,
            averageTargetLeads: 0,
            averageAchievedLeads: 0,
            averageTargetConversion: 0,
            averageAchievedConversion: 0,
            averageTargetRevenue: 0,
            averageAchievedRevenue: 0,
            totalReviews: 0,
          },
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load performance records' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const {
        employeeId: targetEmployeeId,
        period,
        targetLeads,
        achievedLeads,
        targetConversion,
        achievedConversion,
        targetRevenue,
        achievedRevenue,
        score,
        feedback,
        managerRating,
      } = body;

      // Only managers can create performance records
      const isManager = auth.roles.some(r =>
        ['super_admin', 'manager', 'hr', 'branch_manager', 'ceo'].includes(r)
      );

      if (!isManager) {
        return NextResponse.json(
          { success: false, error: 'Only managers can create performance records' },
          { status: 403 }
        );
      }

      if (!targetEmployeeId || !period) {
        return NextResponse.json(
          { success: false, error: 'employeeId and period are required' },
          { status: 400 }
        );
      }

      const performance = await db.employeePerformance.create({
        data: {
          employeeId: targetEmployeeId,
          period,
          targetLeads: targetLeads || 0,
          achievedLeads: achievedLeads || 0,
          targetConversion: targetConversion || 0,
          achievedConversion: achievedConversion || 0,
          targetRevenue: targetRevenue || 0,
          achievedRevenue: achievedRevenue || 0,
          score: score || 0,
          feedback: feedback || '',
          managerRating: managerRating || 0,
        },
      });

      await logAuditAction(auth, 'create_performance_review', 'EmployeePerformance', performance.id, {
        employeeId: targetEmployeeId,
        period,
        score,
        managerRating,
      });

      return NextResponse.json({
        success: true,
        data: performance,
        message: 'Performance record created successfully',
      });
    } catch (error) {
      console.error('Employee performance POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create performance record' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const body = await request.json();
      const { id, achievedLeads, achievedConversion, achievedRevenue, score, feedback, managerRating } = body;

      // Only managers can update performance records
      const isManager = auth.roles.some(r =>
        ['super_admin', 'manager', 'hr', 'branch_manager', 'ceo'].includes(r)
      );

      if (!isManager) {
        return NextResponse.json(
          { success: false, error: 'Only managers can update performance records' },
          { status: 403 }
        );
      }

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Performance record id is required' },
          { status: 400 }
        );
      }

      const existing = await db.employeePerformance.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Performance record not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (achievedLeads !== undefined) updateData.achievedLeads = achievedLeads;
      if (achievedConversion !== undefined) updateData.achievedConversion = achievedConversion;
      if (achievedRevenue !== undefined) updateData.achievedRevenue = achievedRevenue;
      if (score !== undefined) updateData.score = score;
      if (feedback !== undefined) updateData.feedback = feedback;
      if (managerRating !== undefined) updateData.managerRating = managerRating;

      const updated = await db.employeePerformance.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, 'update_performance_review', 'EmployeePerformance', id, {
        updatedFields: Object.keys(updateData),
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Performance record updated successfully',
      });
    } catch (error) {
      console.error('Employee performance PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update performance record' },
        { status: 500 }
      );
    }
  })(request);
}
