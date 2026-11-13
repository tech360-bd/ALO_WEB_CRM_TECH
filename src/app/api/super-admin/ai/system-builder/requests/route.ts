// GET /api/super-admin/ai/system-builder/requests
//
// Lists every AI build request with its workflow state, so the Super Admin can
// see what is planned, what is approved, and what was applied.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { unavailable, safeRows, jsonObject, jsonArray } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const BUILD_STATUSES = [
  'PLAN_REQUESTED', 'PLAN_READY', 'SANDBOX_VALIDATED', 'APPROVED', 'REJECTED', 'APPLIED', 'FAILED',
] as const;

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || '').toUpperCase().slice(0, 40);

  try {
    const rows = await safeRows<{
      id: string; requestCode: string; taskType: string; targetModule: string; requirement: string;
      priority: string; riskLevel: string; approvalRequired: boolean; sandboxFirst: boolean;
      publishAfterApproval: boolean; status: string; plan: string; proposedFiles: string;
      sandboxResult: string; requestedBy: string; reviewedBy: string; reviewedAt: Date | null;
      appliedBy: string; appliedAt: Date | null; decisionNote: string; createdAt: Date;
    }>(
      () => db.moduleBuildRequest.findMany({
        where: BUILD_STATUSES.includes(status as (typeof BUILD_STATUSES)[number]) ? { status } : {},
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    );

    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.status] = (counts[row.status] || 0) + 1;

    return NextResponse.json({
      success: true,
      statuses: [...BUILD_STATUSES],
      counts,
      requests: rows.map((row) => ({
        id: row.id,
        code: row.requestCode,
        taskType: row.taskType,
        targetModule: row.targetModule,
        requirement: row.requirement,
        priority: row.priority,
        riskLevel: row.riskLevel,
        approvalRequired: row.approvalRequired,
        sandboxFirst: row.sandboxFirst,
        publishAfterApproval: row.publishAfterApproval,
        status: row.status,
        proposedFiles: jsonArray(row.proposedFiles),
        plan: jsonObject(row.plan),
        sandboxResult: jsonObject(row.sandboxResult),
        requestedBy: row.requestedBy,
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt?.toISOString() || null,
        appliedBy: row.appliedBy,
        appliedAt: row.appliedAt?.toISOString() || null,
        decisionNote: row.decisionNote,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/ai/system-builder/requests GET', error);
  }
}

export const GET = withAuth(handleGet);
