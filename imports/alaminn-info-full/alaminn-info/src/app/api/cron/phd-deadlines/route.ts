import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/phd-deadlines
 *
 * Scans `HigherStudyResearchProject` for PhD / research project
 * application deadlines falling within the next 7 days. Used to trigger
 * student deadline alerts and surface upcoming research project closures.
 *
 * Recommended cPanel cron schedule: `0 6 * * *` (daily at 06:00 local).
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
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = await db.higherStudyResearchProject.findMany({
      where: {
        applicationDeadline: {
          gte: now,
          lte: sevenDaysAhead,
        },
        publicationStatus: "published",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        department: true,
        applicationDeadline: true,
        officialSourceUrl: true,
      },
      orderBy: { applicationDeadline: "asc" },
      take: 100,
    });

    console.log(
      `[cron:phd-deadlines] ${upcoming.length} research project(s) with deadlines in the next 7 days`
    );

    return NextResponse.json({
      success: true,
      message: "PhD / research deadline scan complete.",
      data: {
        processed: upcoming.length,
        upcoming: upcoming.map((r) => ({
          slug: r.slug,
          title: r.title,
          department: r.department ?? null,
          deadline: r.applicationDeadline
            ? r.applicationDeadline.toISOString()
            : null,
          officialSourceUrl: r.officialSourceUrl ?? null,
        })),
      },
      meta: {
        windowDays: 7,
        scannedAt: now.toISOString(),
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
