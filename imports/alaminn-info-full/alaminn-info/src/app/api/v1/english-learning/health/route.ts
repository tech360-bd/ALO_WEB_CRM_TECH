/**
 * GET /api/v1/english-learning/health
 * --------------------------------------------------------------------
 * Returns English Learning module health — counts of all entities.
 * Public + cacheable.
 */
import { db } from "@/lib/db";
import { jsonResponse } from "@/lib/english-learning/api-helpers";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  try {
    const [
      courses,
      lessons,
      practiceTests,
      questions,
      tutors,
      resources,
      enrollments,
      progress,
      referrals,
      auditLogs,
      settings,
    ] = await Promise.all([
      db.englishLearningCourse.count({ where: { isPublished: true } }),
      db.englishLearningLesson.count({ where: { isPublished: true } }),
      db.englishLearningPracticeTest.count({ where: { isPublished: true } }),
      db.englishLearningQuestion.count(),
      db.englishLearningTutor.count({ where: { isPublished: true } }),
      db.englishLearningResource.count({ where: { isPublished: true } }),
      db.englishLearningEnrollment.count(),
      db.englishLearningProgress.count(),
      db.englishLearningReferral.count(),
      db.englishLearningAuditLog.count(),
      db.englishLearningSetting.count(),
    ]);

    const res = jsonResponse(
      true,
      "English Learning module is healthy.",
      {
        counts: {
          courses,
          lessons,
          practiceTests,
          questions,
          tutors,
          resources,
          enrollments,
          progress,
          referrals,
          auditLogs,
          settings,
        },
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    );
    res.headers.set("Cache-Control", CACHE_HEADERS);
    return res;
  } catch (err) {
    console.error("[english-learning/health] error", err);
    return jsonResponse(
      false,
      "Internal server error.",
      null,
      {},
      ["internal"],
      500,
    );
  }
}
