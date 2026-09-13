import React, { Suspense } from 'react';
import { Metadata } from 'next';
import CourseDetailHub from '@/components/website/CourseDetailHub';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Course Details, Fees & Entry Requirements | ALO Education`,
    description: `Full details for ${name}: tuition fees, IELTS requirements, intakes, scholarships, and how to apply through ALO Education from Bangladesh. Complete course information hub with related content engine, FAQ accordion, source verification — DB-driven.`,
    alternates: {
      canonical: `https://aloeducation.com/course/${slug}`,
    },
    openGraph: {
      title: `${name} | ALO Education`,
      description: `Entry requirements, fees, scholarships and application support for ${name}.`,
      url: `https://aloeducation.com/course/${slug}`,
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
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <main className="flex-1 pt-20 pb-16">
        <Suspense
          fallback={
            <div className="p-12 text-center text-gray-500 font-medium">
              Loading Course Details — DB-driven with related content, FAQ, source verification...
            </div>
          }
        >
          <CourseDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
