/**
 * GET /api/v1/english-learning/admin/dashboard
 * --------------------------------------------------------------------
 * Admin overview — counts of every English Learning entity + lists of
 * pending verifications (verificationStatus = "pending-review" or
 * "needs-update") for courses and tutors.
 *
 * Permission: `english-learning.dashboard.view`.
 */
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  jsonResponse,
} from "@/lib/english-learning/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "english-learning.dashboard.view");
  if (guard.denied) return guard.response;

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
      pendingCourses,
      pendingTutors,
      recentReferrals,
    ] = await Promise.all([
      db.englishLearningCourse.count(),
      db.englishLearningLesson.count(),
      db.englishLearningPracticeTest.count(),
      db.englishLearningQuestion.count(),
      db.englishLearningTutor.count(),
      db.englishLearningResource.count(),
      db.englishLearningEnrollment.count(),
      db.englishLearningProgress.count(),
      db.englishLearningReferral.count(),
      db.englishLearningCourse.count({
        where: { verificationStatus: { in: ["pending-review", "needs-update"] } },
      }),
      db.englishLearningTutor.count({
        where: { verificationStatus: { in: ["pending-review", "needs-update"] } },
      }),
      db.englishLearningReferral.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          referralCode: true,
          referralType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return jsonResponse(true, "English Learning dashboard.", {
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
      },
      pendingVerifications: {
        courses: pendingCourses,
        tutors: pendingTutors,
        total: pendingCourses + pendingTutors,
      },
      recentReferrals,
    });
  } catch (err) {
    console.error("[english-learning/admin/dashboard] error", err);
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
