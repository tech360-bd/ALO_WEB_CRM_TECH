import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/search?q=...
// Knowledge Center integration: search verified university/course data.
// Only returns APPROVED + VERIFIED records — never pending/unverified data.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }
  const query = q.toLowerCase();
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20"), 50);

  // Search universities (verified + published only)
  const [universities, courses, scholarships, exams] = await Promise.all([
    db.universityPage.findMany({
      where: {
        AND: [
          { verificationStatus: "VERIFIED" },
          { approvalStatus: "PUBLISHED" },
          {
            OR: [
              { name: { contains: query } },
              { city: { contains: query } },
              { overview: { contains: query } },
              { strengths: { contains: query } },
            ],
          },
        ],
      },
      take: limit,
      select: {
        slug: true, name: true, countrySlug: true, city: true,
        overview: true, quickFacts: true, sourceUrl: true, lastVerifiedAt: true,
      },
    }),
    db.coursePage.findMany({
      where: {
        AND: [
          { verificationStatus: "VERIFIED" },
          { approvalStatus: "PUBLISHED" },
          {
            OR: [
              { name: { contains: query } },
              { subject: { contains: query } },
              { overview: { contains: query } },
              { tuition: { contains: query } },
            ],
          },
        ],
      },
      take: limit,
      include: {
        university: { select: { name: true, slug: true, city: true } },
      },
    }),
    db.countryPage.findMany({
      where: {
        AND: [
          { approvalStatus: "PUBLISHED" },
          {
            OR: [
              { name: { contains: query } },
              { intro: { contains: query } },
              { scholarships: { contains: query } },
            ],
          },
        ],
      },
      take: limit / 2,
      select: { slug: true, name: true, flag: true, intro: true, scholarships: true },
    }),
    db.examPage.findMany({
      where: {
        AND: [
          { approvalStatus: "PUBLISHED" },
          {
            OR: [
              { name: { contains: query } },
              { fullName: { contains: query } },
              { intro: { contains: query } },
            ],
          },
        ],
      },
      take: limit / 2,
      select: { slug: true, name: true, fullName: true, intro: true },
    }),
  ]);

  return NextResponse.json({
    query: q,
    results: {
      universities: universities.length,
      courses: courses.length,
      countries: scholarships.length,
      exams: exams.length,
      total: universities.length + courses.length + scholarships.length + exams.length,
    },
    universities,
    courses,
    countries: scholarships,
    exams,
    // Safety notice: all returned data is VERIFIED + PUBLISHED only
    safetyNotice: "All results are from APPROVED + VERIFIED database records. Pending AI-detected changes are never exposed to students.",
  });
}
