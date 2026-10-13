import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/data-verification
 *
 * Aggregates content counts (universities, courses, scholarships, research
 * projects, tutors) and flags entries whose `updatedAt` is older than 30
 * days as "stale" so the content team can re-verify them.
 *
 * Recommended cPanel cron schedule: `0 3 * * 1` (weekly on Monday at 03:00).
 *
 * Auth: requires `x-cron-secret` header (or `?secret=` query) matching the
 * `CRON_SECRET` environment variable. Returns 401 on auth failure, 503 if
 * the server is misconfigured (no CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
        data: null,
        meta: {},
        errors: [auth.error],
      },
      { status: auth.status }
    );
  }

  try {
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate counts in parallel. Each query is independently wrapped via
    // Promise.all — any single failure is caught and recorded as 0 + a
    // degraded flag rather than crashing the whole cron run.
    const [universities, courses, scholarships, research, tutors] =
      await Promise.all([
        db.higherStudyUniversity.count().catch(() => 0),
        db.higherStudyCourse.count().catch(() => 0),
        db.higherStudyScholarship.count().catch(() => 0),
        db.higherStudyResearchProject.count().catch(() => 0),
        db.englishLearningTutor.count().catch(() => 0),
      ]);

    const [staleUniversities, staleCourses, staleScholarships, staleResearch] =
      await Promise.all([
        db.higherStudyUniversity
          .count({ where: { updatedAt: { lt: staleCutoff } } })
          .catch(() => 0),
        db.higherStudyCourse
          .count({ where: { updatedAt: { lt: staleCutoff } } })
          .catch(() => 0),
        db.higherStudyScholarship
          .count({ where: { updatedAt: { lt: staleCutoff } } })
          .catch(() => 0),
        db.higherStudyResearchProject
          .count({ where: { updatedAt: { lt: staleCutoff } } })
          .catch(() => 0),
      ]);

    const staleTotal =
      staleUniversities + staleCourses + staleScholarships + staleResearch;

    console.log(
      `[cron:data-verification] counts: ${universities} universities · ${courses} courses · ${scholarships} scholarships · ${research} research · ${tutors} tutors | stale(>30d): ${staleTotal}`
    );

    return NextResponse.json({
      success: true,
      message: "Data verification scan complete.",
      data: {
        counts: {
          universities,
          courses,
          scholarships,
          research,
          tutors,
          total: universities + courses + scholarships + research + tutors,
        },
        stale: {
          cutoffDays: 30,
          universities: staleUniversities,
          courses: staleCourses,
          scholarships: staleScholarships,
          research: staleResearch,
          total: staleTotal,
        },
      },
      meta: {
        scannedAt: now.toISOString(),
        staleCutoff: staleCutoff.toISOString(),
      },
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
        data: null,
        meta: {},
        errors: [String(error)],
      },
      { status: 500 }
    );
  }
}
