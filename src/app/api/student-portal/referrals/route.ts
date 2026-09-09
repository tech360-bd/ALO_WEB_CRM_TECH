import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/referrals
// Returns student's referrals with pagination and status filter
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const status = searchParams.get('status') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const where: Record<string, unknown> = { studentProfileId: profile.id };
      if (status) where.status = status;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [referrals, total] = await Promise.all([
        db.studentReferral.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.studentReferral.count({ where }),
      ]);

      // Total earned rewards
      const rewardSummary = await db.studentReferral.aggregate({
        where: { studentProfileId: profile.id, rewardStatus: 'paid' },
        _sum: { rewardAmount: true },
        _count: true,
      });

      return NextResponse.json({
        success: true,
        data: referrals,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        rewardSummary: {
          totalEarned: rewardSummary._sum.rewardAmount || 0,
          completedReferrals: rewardSummary._count || 0,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch referrals';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/referrals
// Create a new referral
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { referredName, referredEmail, referredPhone, referralCode } = body;

      if (!referredName || !referredName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Referred person name is required.' },
          { status: 400 }
        );
      }

      if (!referredEmail || !referredEmail.trim()) {
        return NextResponse.json(
          { success: false, error: 'Referred person email is required.' },
          { status: 400 }
        );
      }

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const referral = await db.studentReferral.create({
        data: {
          studentProfileId: profile.id,
          referralCode: referralCode || profile.studentId || '',
          referredName: referredName.trim(),
          referredEmail: referredEmail.trim(),
          referredPhone: referredPhone || '',
          status: 'pending',
          rewardAmount: 0,
        },
      });

      // Audit log
      await logAuditAction(auth, 'REFERRAL_CREATED', 'StudentReferral', referral.id, {
        referredName: referredName.trim(),
        referredEmail: referredEmail.trim(),
      });

      return NextResponse.json({ success: true, data: referral }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create referral';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
