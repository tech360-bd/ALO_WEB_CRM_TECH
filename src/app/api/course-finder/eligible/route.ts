import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Calculate eligibility score for a student against a course
// Returns: ELIGIBLE, LIKELY_ELIGIBLE, NEED_REVIEW, NOT_ELIGIBLE, MISSING_INFO
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { applications: true, documents: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Parse student profile
  const englishTests = JSON.parse(student.englishTests || "[]");
  const educationHistory = JSON.parse(student.educationHistory || "[]");
  const latestEnglish = englishTests[0];
  const latestEducation = educationHistory[educationHistory.length - 1];

  // Fetch all courses
  const courses = await db.coursePage.findMany({
    where: { approvalStatus: "PUBLISHED" },
    include: { university: { select: { name: true, slug: true } } },
  });

  const results = courses.map((course) => {
    let score = 0;
    let maxScore = 0;
    const reasons: string[] = [];
    const missing: string[] = [];

    // Academic match (30%)
    maxScore += 30;
    if (latestEducation) {
      const gpa = parseFloat(latestEducation.grade || "0");
      if (gpa >= 3.0) { score += 30; reasons.push("Academic background meets requirement"); }
      else if (gpa >= 2.5) { score += 20; reasons.push("Academic background may meet requirement"); }
      else { score += 10; reasons.push("Academic background below typical requirement"); }
    } else {
      missing.push("Education history not provided");
    }

    // English test match (25%)
    maxScore += 25;
    if (latestEnglish) {
      const englishScore = parseFloat(latestEnglish.overallScore || "0");
      if (englishScore >= 6.5) { score += 25; reasons.push("English score meets requirement"); }
      else if (englishScore >= 6.0) { score += 18; reasons.push("English score close to requirement"); }
      else { score += 8; reasons.push("English score below requirement"); }
    } else {
      missing.push("English test score not provided");
    }

    // Country preference (15%)
    maxScore += 15;
    if (student.studyDestination && course.countrySlug === student.studyDestination.toLowerCase()) {
      score += 15; reasons.push("Matches preferred destination");
    } else if (!student.studyDestination) {
      missing.push("Preferred destination not set");
    }

    // Study level match (10%)
    maxScore += 10;
    if (student.studyLevel && course.level.toLowerCase().includes(student.studyLevel.toLowerCase())) {
      score += 10; reasons.push("Matches preferred study level");
    }

    // Subject match (10%)
    maxScore += 10;
    if (student.studyArea && course.subject.toLowerCase().includes(student.studyArea.toLowerCase())) {
      score += 10; reasons.push("Matches preferred subject area");
    }

    // Profile completeness (10%)
    maxScore += 10;
    score += Math.floor(student.profileCompletion / 10);

    const percentage = Math.round((score / maxScore) * 100);
    let status: string;
    if (percentage >= 80) status = "ELIGIBLE";
    else if (percentage >= 60) status = "LIKELY_ELIGIBLE";
    else if (percentage >= 40) status = "NEED_REVIEW";
    else if (missing.length > 2) status = "MISSING_INFO";
    else status = "NOT_ELIGIBLE";

    return {
      courseSlug: course.slug,
      courseName: course.name,
      university: course.university?.name,
      eligibilityScore: percentage,
      status,
      reasons,
      missing,
    };
  });

  // Sort by eligibility score
  results.sort((a, b) => b.eligibilityScore - a.eligibilityScore);

  return NextResponse.json({
    student: { id: student.id, name: student.fullName, profileCompletion: student.profileCompletion },
    results: results.slice(0, 50), // top 50
    summary: {
      total: results.length,
      eligible: results.filter((r) => r.status === "ELIGIBLE").length,
      likelyEligible: results.filter((r) => r.status === "LIKELY_ELIGIBLE").length,
      needReview: results.filter((r) => r.status === "NEED_REVIEW").length,
      notEligible: results.filter((r) => r.status === "NOT_ELIGIBLE").length,
      missingInfo: results.filter((r) => r.status === "MISSING_INFO").length,
    },
  });
}
