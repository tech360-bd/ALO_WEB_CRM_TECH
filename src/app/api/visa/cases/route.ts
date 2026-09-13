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
