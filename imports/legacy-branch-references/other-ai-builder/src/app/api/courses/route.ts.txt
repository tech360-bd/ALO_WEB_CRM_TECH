import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const countrySlug = req.nextUrl.searchParams.get("country");
  const universitySlug = req.nextUrl.searchParams.get("university");
  const level = req.nextUrl.searchParams.get("level");
  const subject = req.nextUrl.searchParams.get("subject");
  const where: any = { approvalStatus: "PUBLISHED" };
  if (countrySlug) where.countrySlug = countrySlug;
  if (universitySlug) where.universitySlug = universitySlug;
  if (level) where.level = level;
  if (subject) where.subject = subject;
  const courses = await db.coursePage.findMany({
    where,
    orderBy: { name: "asc" },
    include: { university: { select: { name: true, city: true, slug: true } } },
  });
  // Fetch country info
  const slugs = Array.from(new Set(courses.map((c) => c.countrySlug).filter(Boolean)));
  const countries = await db.countryPage.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, shortName: true, flag: true } });
  const cmap: Record<string, any> = {};
  for (const c of countries) cmap[c.slug] = c;
  const coursesWithCountry = courses.map((c) => ({ ...c, country: cmap[c.countrySlug] || null }));
  return NextResponse.json({ courses: coursesWithCountry });
}
