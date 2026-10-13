/**
 * GET /api/v1/higher-study/admin/dashboard
 * --------------------------------------------------------------------
 * Higher Study admin dashboard stats:
 *   - Counts of each entity type
 *   - Recent referrals (last 20)
 *   - Pending verifications (entities with verificationStatus=pending-review)
 *   - Stale content (entities not verified in 90+ days)
 *   - Recent import jobs (last 10)
 *
 * Permission: `higher-study.dashboard.view`
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { jsonResponse } from "@/lib/higher-study/api-helpers";
import { internalError } from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

const STALE_THRESHOLD = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "higher-study.dashboard.view");
  if (guard.denied) return guard.response;

  try {
    const [
      universitiesCount,
      coursesCount,
      scholarshipsCount,
      researchCount,
      supervisorsCount,
      resourcesCount,
      countriesCount,
      subjectsCount,
      intakesCount,
      eventsCount,
      studentStoriesCount,
      referralsTotal,
      pendingVerificationsUniversities,
      pendingVerificationsCourses,
      pendingVerificationsScholarships,
      pendingVerificationsResearch,
      pendingVerificationsSupervisors,
      pendingVerificationsResources,
      staleUniversities,
      staleCourses,
      staleScholarships,
      staleResearch,
      staleSupervisors,
      staleResources,
      recentReferrals,
      recentImportJobs,
    ] = await Promise.all([
      db.higherStudyUniversity.count(),
      db.higherStudyCourse.count(),
      db.higherStudyScholarship.count(),
      db.higherStudyResearchProject.count(),
      db.higherStudySupervisor.count(),
      db.higherStudyResource.count(),
      db.higherStudyCountry.count(),
      db.higherStudySubject.count(),
      db.higherStudyIntake.count(),
      db.higherStudyEvent.count(),
      db.higherStudyStudentStory.count(),
      db.higherStudyReferral.count(),
      db.higherStudyUniversity.count({ where: { verificationStatus: "pending-review" } }),
      db.higherStudyCourse.count({ where: { verificationStatus: "pending-review" } }),
      db.higherStudyScholarship.count({ where: { verificationStatus: "pending-review" } }),
      db.higherStudyResearchProject.count({ where: { verificationStatus: "pending-review" } }),
      db.higherStudySupervisor.count({ where: { verificationStatus: "pending-review" } }),
      db.higherStudyResource.count({ where: { verificationStatus: "pending-review" } }),
      db.higherStudyUniversity.count({
        where: { OR: [{ lastVerifiedAt: { lt: STALE_THRESHOLD } }, { lastVerifiedAt: null }] },
      }),
      db.higherStudyCourse.count({
        where: { OR: [{ lastVerifiedAt: { lt: STALE_THRESHOLD } }, { lastVerifiedAt: null }] },
      }),
      db.higherStudyScholarship.count({
        where: { OR: [{ lastVerifiedAt: { lt: STALE_THRESHOLD } }, { lastVerifiedAt: null }] },
      }),
      db.higherStudyResearchProject.count({
        where: { OR: [{ lastVerifiedAt: { lt: STALE_THRESHOLD } }, { lastVerifiedAt: null }] },
      }),
      db.higherStudySupervisor.count({
        where: { OR: [{ lastVerifiedAt: { lt: STALE_THRESHOLD } }, { lastVerifiedAt: null }] },
      }),
      db.higherStudyResource.count({
        where: { OR: [{ lastVerifiedAt: { lt: STALE_THRESHOLD } }, { lastVerifiedAt: null }] },
      }),
      db.higherStudyReferral.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.higherStudyImportJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return jsonResponse(
      true,
      "Dashboard stats retrieved.",
      {
        counts: {
          universities: universitiesCount,
          courses: coursesCount,
          scholarships: scholarshipsCount,
          research: researchCount,
          supervisors: supervisorsCount,
          resources: resourcesCount,
          countries: countriesCount,
          subjects: subjectsCount,
          intakes: intakesCount,
          events: eventsCount,
          studentStories: studentStoriesCount,
          referrals: referralsTotal,
        },
        pendingVerifications: {
          universities: pendingVerificationsUniversities,
          courses: pendingVerificationsCourses,
          scholarships: pendingVerificationsScholarships,
          research: pendingVerificationsResearch,
          supervisors: pendingVerificationsSupervisors,
          resources: pendingVerificationsResources,
          total:
            pendingVerificationsUniversities +
            pendingVerificationsCourses +
            pendingVerificationsScholarships +
            pendingVerificationsResearch +
            pendingVerificationsSupervisors +
            pendingVerificationsResources,
        },
        staleContent: {
          universities: staleUniversities,
          courses: staleCourses,
          scholarships: staleScholarships,
          research: staleResearch,
          supervisors: staleSupervisors,
          resources: staleResources,
          total:
            staleUniversities +
            staleCourses +
            staleScholarships +
            staleResearch +
            staleSupervisors +
            staleResources,
          staleThreshold: STALE_THRESHOLD.toISOString(),
        },
        recentReferrals,
        recentImportJobs,
      },
      {
        actor: {
          userId: guard.session.userId,
          email: guard.session.email,
          role: guard.session.role,
        },
      },
    );
  } catch (err) {
    console.error("[admin/dashboard GET] error", err);
    return internalError();
  }
}
