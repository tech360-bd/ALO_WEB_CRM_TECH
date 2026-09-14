import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Score published courses against the student's persisted education, English
 * tests, and profile preferences. All inputs are read from canonical Main
 * models; no demo data is used.
 */
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const [student, educationHistory, englishTests, profileSections] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, profileComplete: true, currentCountry: true },
    }),
    db.studentEducation.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.studentEnglishTest.findMany({ where: { studentId }, orderBy: { updatedAt: "desc" } }),
    db.studentProfileSection.findMany({ where: { studentId } }),
  ]);
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const profile = (profileSections as any[]).reduce((acc: Record<string, unknown>, section: any) => {
    try {
      const value = JSON.parse(section.data || "{}");
      if (value && typeof value === "object") Object.assign(acc, value);
    } catch {
      // A malformed optional profile section must not make course search fail.
    }
    return acc;
  }, {} as Record<string, unknown>);
  const stringPreference = (...keys: string[]) => {
    for (const key of keys) {
      const value = profile[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };
  const studyDestination = stringPreference("studyDestination", "preferredCountry") || (student as any).currentCountry;
  const studyLevel = stringPreference("studyLevel", "level");
  const studyArea = stringPreference("studyArea", "subject", "field");
  const latestEnglish = (englishTests as any[])[0];
  const latestEducation = (educationHistory as any[])[0];

  const courses = await (db as any).coursePage.findMany({
    where: { approvalStatus: "PUBLISHED" },
    include: { university: { select: { name: true, slug: true } } },
  });

  const results = (courses as any[]).map((course: any) => {
    let score = 0;
    let maxScore = 0;
    const reasons: string[] = [];
    const missing: string[] = [];

    maxScore += 30;
    if (latestEducation) {
      const gpa = parseFloat(latestEducation.gpa || "0");
      if (gpa >= 3) { score += 30; reasons.push("Academic background meets requirement"); }
      else if (gpa >= 2.5) { score += 20; reasons.push("Academic background may meet requirement"); }
      else { score += 10; reasons.push("Academic background below typical requirement"); }
    } else missing.push("Education history not provided");

    maxScore += 25;
    if (latestEnglish) {
      const englishScore = latestEnglish.overallScore;
      if (englishScore >= 6.5) { score += 25; reasons.push("English score meets requirement"); }
      else if (englishScore >= 6) { score += 18; reasons.push("English score close to requirement"); }
      else { score += 8; reasons.push("English score below requirement"); }
    } else missing.push("English test score not provided");

    maxScore += 15;
    if (studyDestination && course.countrySlug.toLowerCase() === studyDestination.toLowerCase()) {
      score += 15; reasons.push("Matches preferred destination");
    } else if (!studyDestination) missing.push("Preferred destination not set");

    maxScore += 10;
    if (studyLevel && course.level.toLowerCase().includes(studyLevel.toLowerCase())) {
      score += 10; reasons.push("Matches preferred study level");
    } else if (!studyLevel) missing.push("Preferred study level not set");

    maxScore += 10;
    if (studyArea && course.subject.toLowerCase().includes(studyArea.toLowerCase())) {
      score += 10; reasons.push("Matches preferred subject area");
    } else if (!studyArea) missing.push("Preferred subject area not set");

    maxScore += 10;
    score += Math.min(10, Math.floor((student as any).profileComplete / 10));

    const eligibilityScore = Math.round((score / maxScore) * 100);
    const status = eligibilityScore >= 80 ? "ELIGIBLE" : eligibilityScore >= 60 ? "LIKELY_ELIGIBLE" : eligibilityScore >= 40 ? "NEED_REVIEW" : missing.length > 2 ? "MISSING_INFO" : "NOT_ELIGIBLE";
    return { courseSlug: course.slug, courseName: course.name, university: course.university?.name, eligibilityScore, status, reasons, missing };
  });
  results.sort((a: any, b: any) => b.eligibilityScore - a.eligibilityScore);

  return NextResponse.json({
    student: { id: (student as any).id, name: (student as any).name, profileCompletion: (student as any).profileComplete },
    results: results.slice(0, 50),
    summary: {
      total: results.length,
      eligible: results.filter((r: any) => r.status === "ELIGIBLE").length,
      likelyEligible: results.filter((r: any) => r.status === "LIKELY_ELIGIBLE").length,
      needReview: results.filter((r: any) => r.status === "NEED_REVIEW").length,
      notEligible: results.filter((r: any) => r.status === "NOT_ELIGIBLE").length,
      missingInfo: results.filter((r: any) => r.status === "MISSING_INFO").length,
    },
  });
}
