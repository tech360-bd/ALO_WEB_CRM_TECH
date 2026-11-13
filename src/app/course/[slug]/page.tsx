import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import CourseDetailHub from '@/components/website/CourseDetailHub';
import { db } from '@/lib/db';
import { loadOpenConflicts, passesPublicCoursePagePolicy, publicCoursePageWhere } from '@/lib/course-finder/public-content-page-policy';
import { publicCourseIdentifierWhere } from '@/lib/public-catalog';
import { breadcrumbSchema, courseSchema } from '@/lib/seo/schema-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Same visibility rule as /api/courses/[slug] and the Course Finder (src/lib/public-catalog.ts).
async function findPublicCourse(slug: string) {
  const where = publicCourseIdentifierWhere(slug);
  if (!where) return null;
  return db.crmCourse.findFirst({
    where: where as any,
    select: {
      id: true,
      courseTitle: true,
      slug: true,
      courseId: true,
      studyLevel: true,
      university: { select: { name: true, slug: true, universityId: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = await findPublicCourse(slug);
  const name = record?.courseTitle || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const canonicalSlug = record?.slug || record?.courseId || slug;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');
  const description = `Source-linked course information for ${name}. Facts are shown when recorded; missing information is identified clearly.`;
  return {
    title: `${name} | Course Information | ALO Education`,
    description,
    alternates: { canonical: `${siteUrl}/course/${encodeURIComponent(canonicalSlug)}` },
    openGraph: {
      title: `${name} | ALO Education`,
      description,
      url: `${siteUrl}/course/${encodeURIComponent(canonicalSlug)}`,
      type: 'website',
    },
  };
}

export default async function CourseDetailPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await findPublicCourse(slug);
  if (!record) {
    // Legacy course-page records keep working via a permanent redirect path.
    // Phase 1 review (P0-C): only redirect to a page that passes the public policy.
    const conflicts = await loadOpenConflicts();
    const pageRecord = await db.coursePage.findFirst({
      where: publicCoursePageWhere(conflicts, [{ slug }]),
      select: { slug: true, sourceUrl: true },
    });
    if (pageRecord && passesPublicCoursePagePolicy(pageRecord, conflicts)) redirect(`/courses/${encodeURIComponent(pageRecord.slug)}`);
    notFound();
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');
  const canonicalSlug = record.slug || record.courseId || slug;
  const uniSlug = record.university?.slug || record.university?.universityId;
  const courseLd = [
    courseSchema({
      name: record.courseTitle,
      description: `Source-linked course information for ${record.courseTitle}.`,
      slug: canonicalSlug,
      providerName: record.university?.name || 'ALO Education Partner Institution',
      providerUrl: uniSlug ? `${siteUrl}/universities/${encodeURIComponent(uniSlug)}` : undefined,
      educationalCredentialAwarded: record.studyLevel || undefined,
      baseUrl: siteUrl,
    }),
    breadcrumbSchema(
      [
        { name: 'Home', url: '/' },
        { name: 'Courses', url: '/courses' },
        { name: record.courseTitle, url: `/course/${encodeURIComponent(canonicalSlug)}` },
      ],
      siteUrl,
    ),
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd).replace(/</g, '\\u003c') }}
      />
      <main className="flex-1 pt-20 pb-16">
        <Suspense
          fallback={
            <div className="p-12 text-center text-[var(--alo-text-muted)] font-medium">
              Loading course details…
            </div>
          }
        >
          <CourseDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
