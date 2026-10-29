/**
 * GET /api/university-catalogue/coverage
 * --------------------------------------
 * The single read model for the January 2027 → January 2028 course-month
 * coverage matrix. Every surface (Super Admin dashboard, CRM, website Course
 * Finder badges) reads the same rows, so published numbers cannot diverge.
 *
 * Auth: Super Admin (the matrix exposes unpublished/pending research state).
 * Published-only data for public surfaces is available with `?published=1`,
 * which additionally requires no pending information and returns only rows the
 * Super Admin has approved.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';
import { buildCoverageMatrix, summarizeCoverage } from '@/lib/verified-catalogue/coverage';
import { latestCoverageMonitoringReport } from '@/lib/verified-catalogue/monitoring';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const publishedOnly = new URL(req.url).searchParams.get('published') === '1';
  if (!publishedOnly) {
    const guard = await requireMonitoringAdmin(req);
    if (!guard.ok) return guard.response;
  }

  try {
    const courses = await db.crmCourse.findMany({
      where: publishedOnly
        ? { monthlyCoverage: { some: { published: true } } }
        : { monthlyCoverage: { some: {} } },
      include: {
        university: { select: { name: true, slug: true, country: true } },
        monthlyCoverage: { where: publishedOnly ? { published: true } : undefined },
      },
    });

    const matrix = buildCoverageMatrix(
      courses.map((course) => ({
        slug: course.slug,
        title: course.courseTitle,
        universitySlug: course.university.slug,
        universityName: course.university.name,
        country: course.university.country,
      })),
      courses.flatMap((course) => course.monthlyCoverage.map((row) => ({
        courseSlug: course.slug,
        year: row.year,
        month: row.month,
        status: row.status,
        startDate: row.startDate,
        feeAmount: row.feeAmount,
        feeCurrency: row.feeCurrency,
        evidenceId: row.evidenceId,
      }))),
    );

    const latest = publishedOnly ? null : await latestCoverageMonitoringReport(db);

    return NextResponse.json({
      success: true,
      publishedOnly,
      generatedAt: new Date().toISOString(),
      months: matrix.months,
      totals: matrix.totals,
      summary: summarizeCoverage(matrix),
      courses: matrix.courses.map((course) => ({
        courseSlug: course.courseSlug,
        title: course.title,
        university: course.universityName,
        country: course.country,
        months: course.cells,
        availableMonths: course.availableMonths,
        missingMonths: course.missingMonths,
      })),
      lastMonitoringReport: latest,
      taxonomy: {
        VERIFIED_AVAILABLE: 'official source states the intake exists',
        VERIFIED_NOT_OFFERED: 'official availability table enumerates intakes and this month is absent',
        NOT_PUBLISHED: 'source read; does not state availability for this month — not proof of absence',
        VERIFICATION_PENDING: 'research queued, page not yet read',
        SOURCE_UNAVAILABLE: 'official source could not be retrieved',
        CONFLICT_REQUIRES_REVIEW: 'official sources disagree; Super Admin review required',
        MISSING: 'no record stored at all (data gap, never inferred)',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Coverage data is temporarily unavailable.' }, { status: 503 });
  }
}
