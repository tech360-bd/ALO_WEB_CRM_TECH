import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Course Finder: search & filter courses across all countries/universities
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const country = sp.get("country");
  const level = sp.get("level");
  const subject = sp.get("subject");
  const intake = sp.get("intake");
  const q = sp.get("q")?.toLowerCase();
  const where: any = { approvalStatus: "PUBLISHED" };
  if (country) where.countrySlug = country;
  if (level) where.level = level;
  if (subject) where.subject = subject;
  if (intake) where.intake = { contains: intake };
  if (q) where.OR = [{ name: { contains: q } }, { subject: { contains: q } }];

  const courses = await db.coursePage.findMany({
    where,
    orderBy: { name: "asc" },
    include: { university: { select: { name: true, slug: true, city: true } } },
    take: 100,
  });

  // Fetch country info for the results
  const countrySlugsInResults = Array.from(new Set(courses.map((c) => c.countrySlug).filter(Boolean)));
  const countriesMap = await db.countryPage.findMany({ where: { slug: { in: countrySlugsInResults } }, select: { slug: true, name: true, shortName: true, flag: true } });
  const countryBySlug: Record<string, any> = {};
  for (const c of countriesMap) countryBySlug[c.slug] = c;
  const coursesWithCountry = courses.map((c) => ({ ...c, country: countryBySlug[c.countrySlug] || null }));

  // Aggregations for filter facets
  const all = await db.coursePage.findMany({ where: { approvalStatus: "PUBLISHED" }, select: { level: true, subject: true, countrySlug: true } });
  const levels = Array.from(new Set(all.map((c) => c.level).filter(Boolean)));
  const subjects = Array.from(new Set(all.map((c) => c.subject).filter(Boolean)));
  const countrySlugs = Array.from(new Set(all.map((c) => c.countrySlug).filter(Boolean)));
  const countries = await db.countryPage.findMany({ where: { slug: { in: countrySlugs } }, select: { slug: true, name: true, flag: true } });

  return NextResponse.json({ courses: coursesWithCountry, facets: { levels, subjects, countries } });
}
