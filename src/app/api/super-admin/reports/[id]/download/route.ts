// GET /api/super-admin/reports/{id}/download
//
// Streams a previously generated report artifact and writes a
// REPORT_DOWNLOADED audit row *before* the bytes are served, so an unlogged
// download is impossible.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const { id } = await context!.params;

  try {
    const report = await db.report.findUnique({ where: { id } });
    if (!report) return notFound('Report not found.');
    if (report.status !== 'READY' || !report.payload) {
      return badRequest(`Report is ${report.status} and has no downloadable payload.`);
    }
    if (report.expiresAt && report.expiresAt.getTime() <= Date.now()) {
      return badRequest('This report artifact has expired. Generate it again.');
    }

    // Audit first: if the audit write fails, the artifact is not served.
    await db.$transaction(async (tx) => {
      await tx.report.update({
        where: { id },
        data: { downloadCount: { increment: 1 }, lastDownloadedAt: new Date() },
      });
      await writePortalAudit(tx, auth, 'REPORT_DOWNLOADED', 'Report', id, {
        reportCode: report.reportCode,
        category: report.category,
        format: report.format,
        rowCount: report.rowCount,
      }, request);
    });

    const filename = `${report.reportCode}-${report.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${report.format}`;
    const contentType = report.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';

    return new NextResponse(report.payload, {
      status: 200,
      headers: {
        'content-type': contentType,
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return unavailable('super-admin/reports/{id}/download', error);
  }
}

export const GET = withAuth(handleGet);
