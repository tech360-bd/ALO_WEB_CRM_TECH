/**
 * GET /api/v1/higher-study/health
 * --------------------------------------------------------------------
 * Returns Higher Study module health — counts of universities, courses,
 * scholarships, research projects, supervisors, resources, destinations.
 * Public + cacheable. Used by the homepage stats strip + status checks.
 */
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/higher-study/api-helpers";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  try {
    const [
      universities,
      courses,
      scholarships,
      research,
      supervisors,
      resources,
      destinations,
      subjects,
      intakes,
      events,
      studentStories,
      referrals,
    ] = await Promise.all([
      db.higherStudyUniversity.count({ where: { publicationStatus: "published" } }),
      db.higherStudyCourse.count({ where: { publicationStatus: "published" } }),
      db.higherStudyScholarship.count({ where: { publicationStatus: "published" } }),
      db.higherStudyResearchProject.count({ where: { publicationStatus: "published" } }),
      db.higherStudySupervisor.count({ where: { publicationStatus: "published" } }),
      db.higherStudyResource.count({ where: { publicationStatus: "published" } }),
      db.higherStudyCountry.count({ where: { status: "published" } }),
      db.higherStudySubject.count(),
      db.higherStudyIntake.count(),
      db.higherStudyEvent.count({ where: { status: { in: ["upcoming", "live"] } } }),
      db.higherStudyStudentStory.count({ where: { featured: true } }),
      db.higherStudyReferral.count(),
    ]);

    const res = jsonResponse(
      true,
      "Higher Study module is healthy.",
      {
        counts: {
          universities,
          courses,
          scholarships,
          research,
          supervisors,
          resources,
          destinations,
          subjects,
          intakes,
          events,
          studentStories,
          referrals,
        },
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[higher-study/health] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
