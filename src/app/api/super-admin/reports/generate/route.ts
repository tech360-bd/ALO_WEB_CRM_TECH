// POST /api/super-admin/reports/generate
//
// Runs one report definition, stores the resulting artifact and audits the
// generation. Generation is an explicit action (never a side effect of
// viewing), so a bulk of report data cannot be pulled without a trace.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, unavailable, shortCode } from '@/lib/super-admin/http';
import { findReport, toCsv, REPORT_CATALOG } from '@/lib/super-admin/reports';

export const dynamic = 'force-dynamic';

const Body = z.object({
  reportKey: z.string().trim().min(2).max(80),
  format: z.enum(['csv', 'json']).default('csv'),
  filters: z.object({
    dateFrom: z.string().trim().max(40).optional(),
    dateTo: z.string().trim().max(40).optional(),
    branch: z.string().trim().max(191).optional(),
    country: z.string().trim().max(120).optional(),
    role: z.string().trim().max(60).optional(),
    employeeId: z.string().trim().max(191).optional(),
    counselorId: z.string().trim().max(191).optional(),
    partnerId: z.string().trim().max(191).optional(),
    campaign: z.string().trim().max(191).optional(),
    source: z.string().trim().max(80).optional(),
    intake: z.string().trim().max(80).optional(),
    applicationStage: z.string().trim().max(80).optional(),
    visaStage: z.string().trim().max(80).optional(),
    status: z.string().trim().max(80).optional(),
  }).default({}),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  // Reading may happen while Acting-As (it is logged as acting_as); generating
  // a stored artifact is a real write, so the acting session only gets the
  // read path. requireSuperAdminOrActing is used deliberately here because the
  // generated report is scoped to the actor and fully audited.
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { reportKey, format, filters, reason } = parsed.data;

  const definition = findReport(reportKey);
  if (!definition) {
    return badRequest(`Unknown report. Available: ${REPORT_CATALOG.map((report) => report.key).join(', ')}.`);
  }
  // Reject filters this report does not declare, so the UI cannot imply a
  // filter was applied when it was silently ignored.
  const unsupported = Object.entries(filters)
    .filter(([key, value]) => value !== undefined && !definition.filters.includes(key as never))
    .map(([key]) => key);
  if (unsupported.length) {
    return badRequest(`${definition.name} does not support: ${unsupported.join(', ')}.`);
  }

  try {
    const result = await definition.build(filters);
    const payload = format === 'csv' ? toCsv(result) : JSON.stringify(result);
    const title = `${definition.name}${filters.dateFrom || filters.dateTo ? ` (${filters.dateFrom || '…'} → ${filters.dateTo || '…'})` : ''}`;

    const saved = await db.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          reportCode: shortCode('ALO-RPT'),
          category: definition.category,
          title,
          filters: JSON.stringify(filters),
          format,
          status: 'READY',
          rowCount: result.rows.length,
          payload,
          generatedBy: auth.actorUserId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        select: { id: true, reportCode: true, generatedAt: true },
      });
      await writePortalAudit(tx, auth, 'REPORT_GENERATED', 'Report', report.id, {
        reason,
        reportKey,
        category: definition.category,
        format,
        filters,
        rowCount: result.rows.length,
        limitation: result.limitation || null,
      }, request);
      return report;
    });

    return NextResponse.json({
      success: true,
      report: {
        id: saved.id,
        reportCode: saved.reportCode,
        title,
        category: definition.category,
        format,
        rowCount: result.rows.length,
        generatedAt: saved.generatedAt.toISOString(),
      },
      columns: result.columns,
      // Preview the first 100 rows; the full artifact is fetched from
      // /api/super-admin/reports/{id}/download so the payload is not shipped twice.
      preview: result.rows.slice(0, 100),
      limitation: result.limitation || null,
    }, { status: 201 });
  } catch (error) {
    return unavailable(`super-admin/reports/generate (${reportKey})`, error);
  }
}

export const POST = withAuth(handlePost);
