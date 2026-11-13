// POST /api/super-admin/countries/{id}/assign-team
//
// Assigns a country counselor / application officer / visa officer by stamping
// them onto every open visa case for that destination, and records the
// assignment intent on the audit trail so the change is traceable and
// reversible case-by-case.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  counselorId: z.string().trim().max(191).optional(),
  applicationOfficerId: z.string().trim().max(191).optional(),
  visaOfficerId: z.string().trim().max(191).optional(),
  scope: z.enum(['open_cases', 'all_cases']).default('open_cases'),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { counselorId, applicationOfficerId, visaOfficerId, scope, reason } = parsed.data;

  if (!counselorId && !applicationOfficerId && !visaOfficerId) {
    return badRequest('Provide at least one of counselorId, applicationOfficerId or visaOfficerId.');
  }

  try {
    const country = await db.country.findUnique({ where: { id } });
    if (!country) return notFound('Country not found.');

    // Resolve display names once so the case rows stay readable to staff.
    const [counselor, applicationOfficer, visaOfficer] = await Promise.all([
      counselorId ? db.employee.findUnique({ where: { id: counselorId }, select: { name: true } }) : null,
      applicationOfficerId ? db.employee.findUnique({ where: { id: applicationOfficerId }, select: { name: true } }) : null,
      visaOfficerId ? db.employee.findUnique({ where: { id: visaOfficerId }, select: { name: true } }) : null,
    ]);

    const where = {
      destinationCountry: { in: [country.name, country.code].filter(Boolean) },
      ...(scope === 'open_cases' ? { currentStage: { notIn: ['decision', 'closed', 'completed'] } } : {}),
    };

    const result = await db.$transaction(async (tx) => {
      const update = await tx.visaCase.updateMany({
        where,
        data: {
          ...(counselorId ? { counselorId } : {}),
          ...(applicationOfficerId ? { applicationOfficerId } : {}),
          ...(visaOfficerId ? { visaOfficerId, visaOfficerName: visaOfficer?.name || '' } : {}),
        },
      });
      await writePortalAudit(tx, auth, 'COUNTRY_TEAM_ASSIGNED', 'Country', id, {
        reason,
        countryCode: country.code,
        scope,
        assigned: {
          counselor: counselor?.name || null,
          applicationOfficer: applicationOfficer?.name || null,
          visaOfficer: visaOfficer?.name || null,
        },
        affectedCases: update.count,
      }, request);
      return update.count;
    });

    return NextResponse.json({ success: true, countryCode: country.code, affectedCases: result });
  } catch (error) {
    return unavailable('super-admin/countries/{id}/assign-team', error);
  }
}

export const POST = withAuth(handlePost);
