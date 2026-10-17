import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await db.coursePage.findUnique({
    where: { slug },
    include: {
      university: { select: { name: true, slug: true, city: true, overview: true, sourceUrl: true } },
    },
  });
  if (!course || course.approvalStatus !== "PUBLISHED") {
    return NextResponse.json({ error: "Course page not found" }, { status: 404 });
  }

  // Fetch country info (CoursePage has countrySlug, not a country relation)
  const country = await db.countryPage.findUnique({ where: { slug: course.countrySlug }, select: { name: true, shortName: true, flag: true, slug: true } });
  const courseWithCountry = { ...course, country };

  // similar courses (same subject, different slug)
  const similarCourses = await db.coursePage.findMany({
    where: { subject: course.subject, slug: { not: course.slug }, approvalStatus: "PUBLISHED" },
    take: 4,
    include: { university: { select: { name: true, slug: true } } },
  });
  // Fetch countries for similar courses
  const similarSlugs = Array.from(new Set(similarCourses.map((c) => c.countrySlug).filter(Boolean)));
  const similarCountries = await db.countryPage.findMany({ where: { slug: { in: similarSlugs } }, select: { slug: true, name: true, shortName: true, flag: true } });
  const cmap: Record<string, any> = {};
  for (const c of similarCountries) cmap[c.slug] = c;
  const similar = similarCourses.map((c) => ({ ...c, country: cmap[c.countrySlug] || null }));

  return NextResponse.json({ course: courseWithCountry, similar });
}
