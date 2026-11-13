import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { applicationRiskDistribution } from '@/lib/risk/application-risk-score';
import { SUCCESS_SCORE_DISCLAIMER, studentSuccessDistribution } from '@/lib/risk/student-success-score';

// ============================================================
// GET /api/risk/distribution — management roll-up of application risk (s111)
// and student success bands (s112). Staff/management only.
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const country = url.searchParams.get('country') || undefined;
  const stage = url.searchParams.get('stage') || undefined;
  const partnerId = url.searchParams.get('partnerId') || undefined;

  const where = {
    ...(country ? { country } : {}),
    ...(stage ? { stage } : {}),
    ...(partnerId ? { partnerId } : {}),
  };

  const [applications, students] = await Promise.all([
    applicationRiskDistribution(where),
    studentSuccessDistribution(),
  ]);

  return NextResponse.json({
    success: true,
    applications,
    students,
    // The success score is operational support, never an admission or visa
    // prediction (s15, s93). Returned here so the UI can display it without
    // importing server-only code into the client bundle.
    disclaimer: SUCCESS_SCORE_DISCLAIMER,
  });
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO'] });
