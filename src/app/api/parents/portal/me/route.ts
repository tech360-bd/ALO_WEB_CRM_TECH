import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import {
  buildParentStudentView,
  parentFinancialSummary,
  resolveParentAccess,
} from '@/lib/parent-guardian';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET /api/parents/portal/me — the parent's OWN gated view (spec s13, s67, s69)
//
// The parent record is resolved from the authenticated portal user, never from
// a request parameter. Everything returned has already been filtered by
// resolveParentAccess(), so internal notes, review status, counselor identity,
// commission figures and B2B confidential fields can never appear here.
// ============================================================

export const GET = withAuth(async (request: Request, auth) => {
  const gated = await isFeatureEnabled('PARENT_GUARDIAN_PORTAL', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'The parent/guardian portal is disabled. Enable the PARENT_GUARDIAN_PORTAL feature flag.',
    }, { status: 404 });
  }

  const parent = await db.parentGuardian.findFirst({
    where: { userId: auth.userId },
    select: { id: true, studentId: true },
  });
  if (!parent) {
    return NextResponse.json(
      { success: false, status: 'NOT_LINKED', error: 'This account is not linked to a parent/guardian record.' },
      { status: 403 },
    );
  }

  // A student id in the query is only accepted if it matches the linked one;
  // anything else is an attempted cross-student read.
  const requestedStudentId = new URL(request.url).searchParams.get('studentId') || undefined;
  const access = await resolveParentAccess(parent.id, requestedStudentId);
  if (!access.allowed) {
    return NextResponse.json({ success: false, error: access.reason }, { status: 403 });
  }

  const view = await buildParentStudentView(parent.id);
  const finance = access.capabilities.includes('payment.own_responsibility')
    ? await parentFinancialSummary(parent.studentId).catch(() => null)
    : null;

  return NextResponse.json({
    success: true,
    accessLevel: access.accessLevel,
    capabilities: access.capabilities,
    student: view.student,
    applications: view.applications,
    deadlines: view.deadlines,
    finance,
  });
}, { requireUserTypes: ['PARENT', 'GUARDIAN', 'STUDENT', 'ADMIN', 'SUPER_ADMIN'] });
