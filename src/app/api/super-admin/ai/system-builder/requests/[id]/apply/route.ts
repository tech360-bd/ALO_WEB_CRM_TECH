// POST /api/super-admin/ai/system-builder/requests/{id}/apply
//
// Records the application of an APPROVED patch.
//
// HONEST LIMIT: this endpoint does not rewrite source files. Applying an
// arbitrary patch from inside a running web process would be an unaudited
// remote-code-execution surface, and this project must not have one. Instead it:
//   1. refuses unless the request is APPROVED (the approval gate is enforced),
//   2. marks the request APPLIED with who applied it and when,
//   3. writes an audit row naming the files the operator must change,
//   4. returns the explicit instruction that the patch is applied by the
//      deployment pipeline, not by the dashboard.
// If a sandboxed patch runner is added later, it plugs in here — behind the
// same approval check.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable, jsonArray, jsonObject } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  note: z.string().trim().min(8, 'A note of at least 8 characters is required.').max(2000),
  confirmedApplied: z.literal(true),
}).strict();

async function handlePost(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return badRequest('A note of 8+ characters and `confirmedApplied: true` are required.');
  }

  try {
    const row = await db.moduleBuildRequest.findUnique({ where: { id } });
    if (!row) return notFound('Build request not found.');

    // The gate. Anything not explicitly APPROVED cannot be applied.
    if (row.status !== 'APPROVED') {
      return badRequest(
        `Request is ${row.status}. A patch can only be applied after a Super Admin approval (status APPROVED).`,
      );
    }
    if (row.approvalRequired && !row.reviewedBy) {
      return badRequest('This request requires approval and has no recorded reviewer.');
    }

    await db.$transaction(async (tx) => {
      await tx.moduleBuildRequest.update({
        where: { id },
        data: { status: 'APPLIED', appliedBy: auth.actorUserId, appliedAt: new Date(), decisionNote: parsed.data.note },
      });
      await writePortalAudit(tx, auth, 'AI_BUILD_APPLIED', 'ModuleBuildRequest', id, {
        note: parsed.data.note,
        requestCode: row.requestCode,
        taskType: row.taskType,
        targetModule: row.targetModule,
        filesToChange: jsonArray(row.proposedFiles),
        reviewedBy: row.reviewedBy,
        appliedByDashboard: false,
      }, request);
    });

    return NextResponse.json({
      success: true,
      requestId: id,
      status: 'APPLIED',
      filesToChange: jsonArray(row.proposedFiles),
      plan: jsonObject(row.plan),
      appliedBy: auth.actorUserId,
      note:
        'Approval recorded and the request is marked APPLIED. The dashboard does not rewrite source files: '
        + 'the patch is applied through the deployment pipeline (commit → CI → deploy). '
        + 'This endpoint never mutates the running application code.',
    });
  } catch (error) {
    return unavailable('super-admin/ai/system-builder/requests/{id}/apply', error);
  }
}

export const POST = withAuth(handlePost);
