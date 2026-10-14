import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UniversityHub from '@/components/website/UniversityHub';
import UniversityPageRecord from '@/components/website/UniversityPageRecord';
import { db } from '@/lib/db';
import {
  loadOpenConflicts,
  passesPublicInternationalCoursePagePolicy,
  passesPublicPagePolicy,
  publicInternationalCoursePageWhere,
  publicUniversityPageWhere,
} from '@/lib/course-finder/public-content-page-policy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [crmUniversity, publishedPage] = await Promise.all([
    db.crmUniversity.findFirst({
      where: { OR: [{ slug }, { universityId: slug }], status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] }, AND: [{ OR: [{ sourceUrl: { not: '' } }, { officialUrl: { not: '' } }] } ] },
      select: { name: true, slug: true, universityId: true, description: true },
    }),
    // Phase 1 review (P0-C): metadata uses the same public policy as the page.
    loadOpenConflicts().then((conflicts) => db.universityPage.findFirst({ where: publicUniversityPageWhere(conflicts, [{ slug }]), select: { name: true, slug: true, overview: true, sourceUrl: true } })
      .then((row) => (passesPublicPagePolicy(row, conflicts.universitySlugs) ? row : null))),
  ]);
  // Metadata comes only from published database records (no static fallback data).
  const profile = crmUniversity || publishedPage;
  const title = profile?.name || 'University information';
  const description = (crmUniversity?.description || publishedPage?.overview || `University details for ${title}. Only recorded, source-linked information is displayed.`).slice(0, 155);
  return {
    title: `${title} | University Information & Courses | ALO Education`,
    description,
    alternates: { canonical: `${SITE_URL}/universities/${encodeURIComponent(profile?.slug || crmUniversity?.universityId || slug)}` },
    openGraph: { title: `${title} | ALO Education`, description, url: `${SITE_URL}/universities/${encodeURIComponent(profile?.slug || crmUniversity?.universityId || slug)}`, type: 'website' },
  };
}

const COURSE_PAGE_SIZE = 30;

function parseCoursePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,6}$/.test(raw)) return 1;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default async function UniversityDetailPageRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ coursesPage?: string | string[] }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams || Promise.resolve({})]);
  const crmUniversity = await db.crmUniversity.findFirst({
    where: { OR: [{ slug }, { universityId: slug }], status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] }, AND: [{ OR: [{ sourceUrl: { not: '' } }, { officialUrl: { not: '' } }] } ] },
    select: { id: true },
  });
  if (crmUniversity) {
    return <div className="min-h-screen bg-white"><main className="pb-16 pt-20"><Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading source-linked university records…</div>}><UniversityHub slug={slug} /></Suspense></main></div>;
  }

  // Legacy page-model route: show the complete paginated set of verified course
  // pages with an explicit positive international-eligibility decision. Do not
  // use the intake window as a proxy for the university's full catalogue.
  const conflicts = await loadOpenConflicts();
  const universityPage = await db.universityPage.findFirst({
    where: publicUniversityPageWhere(conflicts, [{ slug }]),
    select: {
      id: true, slug: true, name: true, countrySlug: true, city: true, overview: true,
      strengths: true, quickFacts: true, entryRequirements: true, tuition: true,
      applicationSteps: true, documents: true, faqs: true, sourceUrl: true,
      lastVerifiedAt: true, verificationStatus: true, approvalStatus: true, updatedAt: true,
      country: { select: { slug: true, name: true, sourceUrl: true, verificationStatus: true, approvalStatus: true } },
    },
  });
  if (!universityPage || !passesPublicPagePolicy(universityPage, conflicts.universitySlugs)) notFound();

  const coursesWhere = publicInternationalCoursePageWhere(conflicts, [{ universitySlug: slug }]);
  const totalCourses = await db.coursePage.count({ where: coursesWhere });
  const totalPages = Math.max(1, Math.ceil(totalCourses / COURSE_PAGE_SIZE));
  const page = Math.min(parseCoursePage(query?.coursesPage), totalPages);
  const courseRows = await db.coursePage.findMany({
    where: coursesWhere,
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
    skip: (page - 1) * COURSE_PAGE_SIZE,
    take: COURSE_PAGE_SIZE,
    select: {
      id: true, slug: true, name: true, level: true, internationalEligibility: true,
      subject: true, duration: true, intake: true, tuition: true, scholarship: true,
      englishRequirement: true, academicRequirement: true, overview: true,
      sourceUrl: true, lastVerifiedAt: true, verificationStatus: true, approvalStatus: true,
    },
  });
  const publicCourses = courseRows.filter((course) => passesPublicInternationalCoursePagePolicy(course, conflicts));

  return <UniversityPageRecord
    university={{ ...universityPage, courses: publicCourses }}
    coursePagination={{ page, pageSize: COURSE_PAGE_SIZE, total: totalCourses, totalPages }}
  />;
}
