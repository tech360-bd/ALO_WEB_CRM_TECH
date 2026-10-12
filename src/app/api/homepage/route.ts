import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      heroSlides,
      services,
      universities,
      courses,
      scholarships,
      faqs,
      blogPosts,
      examPages,
      countries,
      stories,
      team,
      uniCount,
      courseCount,
    ] = await Promise.all([
      // Hero slides
      db.homeHeroSlide.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { sortOrder: 'asc' },
        select: {
          countrySlug: true,
          headline: true,
          subtitle: true,
          accentColor: true,
          popularCity: true,
          popularIntake: true,
          universityCountLabel: true,
          courseCountLabel: true,
          scholarshipLabel: true,
          ctaPrimaryLabel: true,
          ctaSecondaryLabel: true,
          sortOrder: true,
        },
      }),
      // Services (all active)
      db.service.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
        select: {
          title: true,
          slug: true,
          icon: true,
          shortDescription: true,
          heroImage: true,
          ctaLabel: true,
          ctaUrl: true,
          sortOrder: true,
        },
      }),
      // Universities (published, 6)
      db.universityPage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        take: 6,
        select: {
          slug: true,
          name: true,
          city: true,
          ranking: true,
          logo: true,
          campusImage: true,
          scholarshipAvailable: true,
          tuitionRange: true,
          countrySlug: true,
          country: {
            select: { name: true, shortName: true, flag: true, slug: true },
          },
          _count: {
            select: { courses: { where: { approvalStatus: 'PUBLISHED' } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      // Courses (published, 6)
      db.coursePage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        take: 6,
        select: {
          slug: true,
          name: true,
          level: true,
          subject: true,
          duration: true,
          tuition: true,
          tuitionCurrency: true,
          intake: true,
          scholarshipAvailable: true,
          deliveryMode: true,
          degreeType: true,
          universitySlug: true,
          university: {
            select: { name: true, city: true, logo: true, campusImage: true },
          },
        },
        orderBy: { matchScore: 'desc' },
      }),
      // Scholarships (active, 4)
      db.scholarship.findMany({
        where: { status: 'OPEN' },
        take: 4,
        select: {
          name: true,
          slug: true,
          amount: true,
          currency: true,
          fundingType: true,
          deadline: true,
          countrySlug: true,
          universitySlug: true,
        },
        orderBy: { name: 'asc' },
      }),
      // FAQs (active)
      db.homepageFaq.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { sortOrder: 'asc' },
        select: {
          question: true,
          answer: true,
          sortOrder: true,
        },
      }),
      // Blog posts (published, 6)
      db.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        take: 6,
        select: {
          slug: true,
          title: true,
          category: true,
          excerpt: true,
          heroImage: true,
          author: true,
          readingTime: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Exam pages (all published)
      db.examPage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: {
          slug: true,
          name: true,
          fullName: true,
          shortName: true,
          intro: true,
          duration: true,
          cost: true,
        },
        orderBy: { name: 'asc' },
      }),
      // Countries
      db.countryPage.findMany({
        where: { approvalStatus: 'PUBLISHED' },
        select: {
          slug: true,
          name: true,
          shortName: true,
          flag: true,
          capital: true,
          currency: true,
        },
      }),
      // Success stories
      db.successStory.findMany({
        where: { status: 'ACTIVE', consentStatus: 'APPROVED' },
        orderBy: { sortOrder: 'asc' },
        select: {
          studentName: true,
          homeDistrict: true,
          countrySlug: true,
          universityName: true,
          courseName: true,
          outcome: true,
          testimonial: true,
          photo: true,
        },
      }),
      // Team members
      db.teamMember.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { sortOrder: 'asc' },
        select: {
          name: true,
          role: true,
          specialty: true,
          bio: true,
          photo: true,
        },
      }),
      db.universityPage.count({ where: { approvalStatus: 'PUBLISHED' } }),
      db.coursePage.count({ where: { approvalStatus: 'PUBLISHED' } }),
    ]);

    const safeUniversities = universities.map((u) => ({
      ...u,
      courseCount: u._count.courses,
      _count: undefined,
    }));

    return NextResponse.json(
      {
        heroSlides,
        services,
        universities: safeUniversities,
        courses,
        scholarships,
        faqs,
        blogPosts,
        examPages,
        countries,
        stories,
        team,
        stats: {
          totalCountries: countries.length,
          totalUniversities: uniCount,
          totalCourses: courseCount,
          totalExams: examPages.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Homepage API error:', error);
    return NextResponse.json(
      { error: 'Failed to load homepage data' },
      { status: 500 }
    );
  }
}
