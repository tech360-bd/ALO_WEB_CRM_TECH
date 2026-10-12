import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  loadOpenConflicts,
  passesPublicCoursePagePolicy,
  passesPublicPagePolicy,
  publicCoursePageWhere,
  publicUniversityPageWhere,
} from "@/lib/course-finder/public-content-page-policy";

// GET /api/search?q=... — searches universities, courses, blog posts, news, events, countries, scholarships
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({
      universities: [],
      courses: [],
      blogPosts: [],
      newsArticles: [],
      events: [],
      countries: [],
      exams: [],
      total: 0,
    });
  }

  // Phase 1 review (P0-C): catalogue pages use the shared public policy.
  const conflicts = await loadOpenConflicts();
  const [
    universitiesRaw,
    coursesRaw,
    blogPosts,
    newsArticles,
    events,
    countries,
    exams,
    services,
    scholarships,
    resources,
    faqs,
  ] = await Promise.all([
    db.universityPage.findMany({
      where: publicUniversityPageWhere(conflicts, [{
        OR: [
          { name: { contains: q } },
          { city: { contains: q } },
          { overview: { contains: q } },
        ],
      }]),
      take: 8,
      select: {
        sourceUrl: true,
        slug: true,
        name: true,
        city: true,
        countrySlug: true,
        quickFacts: true,
        overview: true,
      },
    }),
    db.coursePage.findMany({
      where: publicCoursePageWhere(conflicts, [{
        OR: [
          { name: { contains: q } },
          { subject: { contains: q } },
          { overview: { contains: q } },
        ],
      }]),
      take: 8,
      select: {
        sourceUrl: true,
        slug: true,
        name: true,
        level: true,
        subject: true,
        duration: true,
        tuition: true,
        city: true,
        countrySlug: true,
        universitySlug: true,
      },
    }),
    db.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
        ],
      },
      take: 6,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        publishedAt: true,
      },
    }),
    db.newsArticle.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { excerpt: { contains: q } },
        ],
      },
      take: 6,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        country: true,
        publishedAt: true,
      },
    }),
    db.eventPage.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 6,
      select: {
        slug: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
        eventType: true,
        category: true,
      },
    }),
    db.countryPage.findMany({
      where: {
        approvalStatus: "PUBLISHED",
        OR: [
          { name: { contains: q } },
          { shortName: { contains: q } },
          { capital: { contains: q } },
        ],
      },
      take: 6,
      select: {
        slug: true,
        name: true,
        shortName: true,
        flag: true,
        capital: true,
      },
    }),
    db.examPage.findMany({
      where: {
        approvalStatus: "PUBLISHED",
        OR: [
          { name: { contains: q } },
          { fullName: { contains: q } },
        ],
      },
      take: 6,
      select: {
        slug: true,
        name: true,
        fullName: true,
      },
    }),
    // spec §50: services, scholarships, resources, FAQs are indexed too
    db.service.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { shortDescription: { contains: q } },
        ],
      },
      take: 6,
      select: { slug: true, title: true, shortDescription: true, icon: true },
    }),
    db.scholarship.findMany({
      where: {
        status: "active",
        OR: [
          { name: { contains: q } },
          { university: { contains: q } },
          { eligibility: { contains: q } },
        ],
      },
      take: 6,
      select: { slug: true, name: true, university: true, country: true, fundingAmount: true, deadline: true },
    }).catch(() => [] as any[]),
    db.resource.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q } },
          { summary: { contains: q } },
          { excerpt: { contains: q } },
        ],
      },
      take: 8,
      select: { slug: true, title: true, excerpt: true, readingTime: true, category: { select: { slug: true, name: true } } },
    }),
    db.unifiedFaq.findMany({
      where: {
        status: "active",
        OR: [
          { question: { contains: q } },
          { answer: { contains: q } },
        ],
      },
      take: 6,
      select: { question: true, answer: true, category: true, targetType: true, targetSlug: true },
    }),
  ]);
  const universities = universitiesRaw.filter((u) => passesPublicPagePolicy(u, conflicts.universitySlugs));
  const courses = coursesRaw.filter((c) => passesPublicCoursePagePolicy(c, conflicts));

  const total =
    universities.length +
    courses.length +
    blogPosts.length +
    newsArticles.length +
    events.length +
    countries.length +
    exams.length +
    services.length +
    scholarships.length +
    resources.length +
    faqs.length;

  return NextResponse.json({
    universities,
    courses,
    blogPosts,
    newsArticles,
    events,
    countries,
    exams,
    services,
    scholarships,
    resources,
    faqs,
    total,
  });
}
