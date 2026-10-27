// POST /api/super-admin/countries/{id}/trigger-data-scan
//
// Queues the weekly university/course data scan for one destination.
//
// It does NOT invent a scanner: it creates a real queued job in the existing
// task system so a worker (or an operator) picks it up, and reports whether a
// scanner implementation is configured. Claiming "scan triggered" without a
// worker would be exactly the fake action this project forbids.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');

  try {
    const country = await db.country.findUnique({ where: { id } });
    if (!country) return notFound('Country not found.');

    const [universities, courses, lastVerified] = await Promise.all([
      db.crmUniversity.count({ where: { country: country.name } }).catch(() => null),
      db.crmCourse.count({ where: { country: country.name } }).catch(() => null),
      db.country.findUnique({ where: { id }, select: { lastVerifiedAt: true } }),
    ]);

    const queued = await db.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: `Weekly data scan — ${country.name}`,
          description: `University/course data verification scan queued by Super Admin for ${country.name}. `
            + `Current inventory: ${universities ?? 'unknown'} universities, ${courses ?? 'unknown'} courses. `
            + 'Scanner worker must pick this up; the dashboard does not perform the scan synchronously.',
          assigneeId: auth.actorUserId,
          type: 'DATA_SCAN',
          priority: 'NORMAL',
          status: 'PENDING',
        },
      });
      await writePortalAudit(tx, auth, 'COUNTRY_DATA_SCAN_QUEUED', 'Country', id, {
        reason: parsed.data.reason,
        countryCode: country.code,
        taskId: task.id,
        universities,
        courses,
      }, request);
      return task;
    });

    return NextResponse.json({
      success: true,
      queued: true,
      taskId: queued.id,
      countryCode: country.code,
      inventory: { universities, courses },
      lastVerifiedAt: lastVerified?.lastVerifiedAt?.toISOString() || null,
      note:
        'A queued scan task was created. The scan itself runs in the data-verification worker; '
        + 'this endpoint does not fabricate scan results.',
    });
  } catch (error) {
    return unavailable('super-admin/countries/{id}/trigger-data-scan', error);
  }
}

export const POST = withAuth(handlePost);
