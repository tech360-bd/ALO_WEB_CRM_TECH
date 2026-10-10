import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import CourseDetailHub from '@/components/website/CourseDetailHub';
import { db } from '@/lib/db';
import { publicCourseIdentifierWhere } from '@/lib/public-catalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Same visibility rule as /api/courses/[slug] and the Course Finder (src/lib/public-catalog.ts).
async function findPublicCourse(slug: string) {
  const where = publicCourseIdentifierWhere(slug);
  if (!where) return null;
  return db.crmCourse.findFirst({
    where: where as any,
    select: { id: true, courseTitle: true, slug: true, courseId: true },
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
    const pageRecord = await db.coursePage.findFirst({
      where: { slug, approvalStatus: 'PUBLISHED', sourceUrl: { not: '' } },
      select: { slug: true },
    });
    if (pageRecord) redirect(`/courses/${encodeURIComponent(pageRecord.slug)}`);
    notFound();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <main className="flex-1 pt-20 pb-16">
        <Suspense
          fallback={
            <div className="p-12 text-center text-gray-500 font-medium">
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
