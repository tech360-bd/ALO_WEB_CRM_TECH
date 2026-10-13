import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

type RelatedItem = {
  type: string;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const slug = searchParams.get('slug');

    if (!type || !slug) {
      return NextResponse.json(
        { error: 'type and slug query params are required' },
        { status: 400 }
      );
    }

    const items: RelatedItem[] = [];
    const MAX_ITEMS = 8;

    if (type === 'university') {
      const uni = await db.universityPage.findUnique({
        where: { slug, approvalStatus: 'PUBLISHED' },
        select: { countrySlug: true },
      });
      if (!uni) {
        return NextResponse.json({ items: [] });
      }

      // Related courses from this university
      const courses = await db.coursePage.findMany({
        where: { universitySlug: slug, approvalStatus: 'PUBLISHED' },
        select: { slug: true, name: true, level: true, subject: true },
        take: 3,
      });
      for (const c of courses) {
        items.push({ type: 'course', slug: c.slug, title: c.name, subtitle: `${c.level} · ${c.subject}` });
      }

      // Related scholarships (same country)
      const scholarships = await db.scholarship.findMany({
        where: { countrySlug: uni.countrySlug, status: 'OPEN' },
        select: { slug: true, name: true, amount: true, currency: true },
        take: 2,
      });
      for (const s of scholarships) {
        items.push({ type: 'scholarship', slug: s.slug, title: s.name, subtitle: `${s.amount} ${s.currency}` });
      }

      // Related universities (same country)
      const unis = await db.universityPage.findMany({
        where: { countrySlug: uni.countrySlug, approvalStatus: 'PUBLISHED', slug: { not: slug } },
        select: { slug: true, name: true, city: true, logo: true },
        take: 2,
      });
      for (const u of unis) {
        items.push({ type: 'university', slug: u.slug, title: u.name, subtitle: u.city, image: u.logo });
      }

      // Related resources
      const blogs = await db.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, title: true, category: true, heroImage: true },
        take: 1,
      });
      for (const b of blogs) {
        items.push({ type: 'resource', slug: b.slug, title: b.title, subtitle: b.category, image: b.heroImage ?? undefined });
      }
    } else if (type === 'course') {
      const course = await db.coursePage.findUnique({
        where: { slug, approvalStatus: 'PUBLISHED' },
        select: { universitySlug: true, countrySlug: true, level: true, subject: true },
      });
      if (!course) {
        return NextResponse.json({ items: [] });
      }

      // Similar courses (same level/subject)
      const similarCourses = await db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED', slug: { not: slug }, OR: [{ level: course.level }, { subject: course.subject }] },
        select: { slug: true, name: true, level: true, subject: true },
        take: 3,
      });
      for (const c of similarCourses) {
        items.push({ type: 'course', slug: c.slug, title: c.name, subtitle: `${c.level} · ${c.subject}` });
      }

      // Other courses at same university
      const uniCourses = await db.coursePage.findMany({
        where: { universitySlug: course.universitySlug, approvalStatus: 'PUBLISHED', slug: { not: slug } },
        select: { slug: true, name: true, level: true, subject: true },
        take: 2,
      });
      for (const c of uniCourses) {
        items.push({ type: 'course', slug: c.slug, title: c.name, subtitle: `${c.level} · ${c.subject}` });
      }

      // Related scholarships
      const scholarships = await db.scholarship.findMany({
        where: { countrySlug: course.countrySlug, status: 'OPEN' },
        select: { slug: true, name: true, amount: true, currency: true },
        take: 2,
      });
      for (const s of scholarships) {
        items.push({ type: 'scholarship', slug: s.slug, title: s.name, subtitle: `${s.amount} ${s.currency}` });
      }

      // Related university
      const uni = await db.universityPage.findUnique({
        where: { slug: course.universitySlug, approvalStatus: 'PUBLISHED' },
        select: { slug: true, name: true, city: true, logo: true },
      });
      if (uni) {
        items.push({ type: 'university', slug: uni.slug, title: uni.name, subtitle: uni.city, image: uni.logo });
      }
    } else if (type === 'scholarship') {
      const scholarship = await db.scholarship.findUnique({
        where: { slug, status: 'OPEN' },
        select: { countrySlug: true, universitySlug: true, courseSlug: true },
      });
      if (!scholarship) {
        return NextResponse.json({ items: [] });
      }

      // Related scholarships (same country)
      const relatedScholarships = await db.scholarship.findMany({
        where: { countrySlug: scholarship.countrySlug, status: 'OPEN', slug: { not: slug } },
        select: { slug: true, name: true, amount: true, currency: true },
        take: 4,
      });
      for (const s of relatedScholarships) {
        items.push({ type: 'scholarship', slug: s.slug, title: s.name, subtitle: `${s.amount} ${s.currency}` });
      }

      // Eligible universities
      if (scholarship.countrySlug) {
        const unis = await db.universityPage.findMany({
          where: { countrySlug: scholarship.countrySlug, approvalStatus: 'PUBLISHED' },
          select: { slug: true, name: true, city: true, logo: true },
          take: 2,
        });
        for (const u of unis) {
          items.push({ type: 'university', slug: u.slug, title: u.name, subtitle: u.city, image: u.logo });
        }
      }

      // Eligible courses
      if (scholarship.universitySlug) {
        const courses = await db.coursePage.findMany({
          where: { universitySlug: scholarship.universitySlug, approvalStatus: 'PUBLISHED' },
          select: { slug: true, name: true, level: true, subject: true },
          take: 2,
        });
        for (const c of courses) {
          items.push({ type: 'course', slug: c.slug, title: c.name, subtitle: `${c.level} · ${c.subject}` });
        }
      }
    } else if (type === 'exam') {
      const relatedExams = await db.examPage.findMany({
        where: { approvalStatus: 'PUBLISHED', slug: { not: slug } },
        select: { slug: true, name: true, fullName: true, duration: true },
        take: 3,
      });
      for (const e of relatedExams) {
        items.push({ type: 'exam', slug: e.slug, title: e.name, subtitle: e.duration ?? e.fullName });
      }

      // Related courses (top match score)
      const courses = await db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: { slug: true, name: true, level: true, subject: true },
        orderBy: { matchScore: 'desc' },
        take: 3,
      });
      for (const c of courses) {
        items.push({ type: 'course', slug: c.slug, title: c.name, subtitle: `${c.level} · ${c.subject}` });
      }

      // Related resources
      const blogs = await db.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, title: true, category: true, heroImage: true },
        take: 2,
      });
      for (const b of blogs) {
        items.push({ type: 'resource', slug: b.slug, title: b.title, subtitle: b.category, image: b.heroImage ?? undefined });
      }
    } else if (type === 'service' || type === 'resource') {
      // Related resources for service or resource pages
      const blogs = await db.blogPost.findMany({
        where: { status: 'PUBLISHED', slug: { not: slug } },
        select: { slug: true, title: true, category: true, heroImage: true },
        take: 4,
      });
      for (const b of blogs) {
        items.push({ type: 'resource', slug: b.slug, title: b.title, subtitle: b.category, image: b.heroImage ?? undefined });
      }

      // Related services for resource pages
      const services = await db.service.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, title: true, description: true, icon: true },
        take: 4,
      });
      for (const s of services) {
        items.push({ type: 'service', slug: s.slug, title: s.title, subtitle: s.description });
      }
    } else {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json(
      { items: items.slice(0, MAX_ITEMS) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Related content API error:', error);
    return NextResponse.json(
      { error: 'Failed to load related content' },
      { status: 500 }
    );
  }
}
