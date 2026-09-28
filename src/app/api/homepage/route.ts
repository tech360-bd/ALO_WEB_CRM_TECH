import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — all homepage content in one call
export async function GET() {
  const [heroSlides, services, stories, team, faqs, countries, courses, universities, scholarships, exams] = await Promise.all([
    db.homeHeroSlide.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    db.service.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } }),
    db.successStory.findMany({ where: { status: "ACTIVE", consentStatus: "APPROVED" }, orderBy: { createdAt: "desc" } }),
    db.teamMember.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    db.homepageFaq.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } }),
    db.countryPage.findMany({ where: { approvalStatus: "PUBLISHED" }, select: { slug: true, name: true, shortName: true, flag: true, capital: true, quickFacts: true, lastVerifiedAt: true, sourceUrl: true } }),
    db.coursePage.findMany({ where: { approvalStatus: "PUBLISHED" }, take: 12, orderBy: { name: "asc" }, include: { university: { select: { name: true, slug: true, city: true } } } }),
    db.universityPage.findMany({ where: { approvalStatus: "PUBLISHED" }, take: 8, orderBy: { name: "asc" }, select: { slug: true, name: true, city: true, countrySlug: true, quickFacts: true, overview: true, sourceUrl: true, lastVerifiedAt: true } }),
    db.countryPage.findMany({ where: { approvalStatus: "PUBLISHED" }, select: { slug: true, name: true, flag: true, scholarships: true } }),
    db.examPage.findMany({ where: { approvalStatus: "PUBLISHED" }, select: { slug: true, name: true, fullName: true, intro: true } }),
  ]);

  // Fetch countries for hero slides (to get flags)
  const countryMap: Record<string, any> = {};
  for (const c of countries) countryMap[c.slug] = c;

  const heroSlidesWithCountries = heroSlides.map((s) => ({
    ...s,
    country: countryMap[s.countryCode] || null,
  }));

  // Parse scholarships from countries
  const allScholarships: any[] = [];
  for (const c of scholarships) {
    let schols: any[] = [];
    try { schols = JSON.parse(c.scholarships || "[]"); } catch {}
    for (const s of schols) {
      allScholarships.push({ ...s, country: c.name, countryCode: c.slug, flag: c.flag });
    }
  }

  return NextResponse.json({
    heroSlides: heroSlidesWithCountries,
    services,
    stories,
    team,
    faqs,
    countries,
    courses: courses.map((c) => ({ ...c, country: countryMap[c.countrySlug] || null })),
    universities: universities.map((u) => ({ ...u, country: countryMap[u.countrySlug] || null })),
    scholarships: allScholarships.slice(0, 8),
    exams,
    stats: {
      totalCountries: countries.length,
      totalUniversities: await db.universityPage.count({ where: { approvalStatus: "PUBLISHED" } }),
      totalCourses: await db.coursePage.count({ where: { approvalStatus: "PUBLISHED" } }),
      totalExams: exams.length,
    },
  });
}
