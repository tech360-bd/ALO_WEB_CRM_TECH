import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

  const [
    universities,
    courses,
    blogPosts,
    newsArticles,
    events,
    countries,
    exams,
  ] = await Promise.all([
    db.universityPage.findMany({
      where: {
        approvalStatus: "PUBLISHED",
        OR: [
          { name: { contains: q } },
          { city: { contains: q } },
          { overview: { contains: q } },
        ],
      },
      take: 8,
      select: {
        slug: true,
        name: true,
        city: true,
        countrySlug: true,
        quickFacts: true,
        overview: true,
      },
    }),
    db.coursePage.findMany({
      where: {
        approvalStatus: "PUBLISHED",
        OR: [
          { name: { contains: q } },
          { subject: { contains: q } },
          { overview: { contains: q } },
        ],
      },
      take: 8,
      select: {
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
  ]);

  const total =
    universities.length +
    courses.length +
    blogPosts.length +
    newsArticles.length +
    events.length +
    countries.length +
    exams.length;

  return NextResponse.json({
    universities,
    courses,
    blogPosts,
    newsArticles,
    events,
    countries,
    exams,
    total,
  });
}
