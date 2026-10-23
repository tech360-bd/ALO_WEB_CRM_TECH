import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ScholarshipDetailHub from '@/components/website/ScholarshipDetailHub';
import { getPublishedScholarship } from '@/lib/website/public-content';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await getPublishedScholarship(slug);
  if (!scholarship) notFound();

  if (!scholarship) {
    return {
      title: 'Scholarship Details | ALO Education',
      description: 'Explore global study abroad scholarships and funding opportunities. Scholarship details, eligibility, deadlines and source verification.',
    };
  }

  return {
    title: `${scholarship.name} | How, When, What & Benefits | ALO Education`,
    description: scholarship.overview + ' Eligibility, deadlines, related content, FAQs and source verification.',
    alternates: {
      canonical: `https://aloeducation.com/scholarships/${scholarship.slug}`,
    },
    openGraph: {
      title: scholarship.name,
      description: scholarship.overview,
      url: `https://aloeducation.com/scholarships/${scholarship.slug}`,
      type: 'website',
    },
  };
}

export default async function ScholarshipDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scholarship = await getPublishedScholarship(slug);
  if (!scholarship) notFound();

  // §49 structured data: Scholarship + FAQ + Breadcrumb
  const jsonLd = scholarship ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Grant',
      name: scholarship.name,
      description: scholarship.overview,
      funder: { '@type': 'Organization', name: scholarship.officialSourceName || 'Scholarship provider' },
      url: `https://aloeducation.com/scholarships/${scholarship.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aloeducation.com' },
        { '@type': 'ListItem', position: 2, name: 'Scholarships', item: 'https://aloeducation.com/scholarships' },
        { '@type': 'ListItem', position: 3, name: scholarship.name, item: `https://aloeducation.com/scholarships/${scholarship.slug}` },
      ],
    },
  ] : [];

  return (
    <div className="min-h-screen bg-white">
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      ))}
      <main className="flex-1 pt-20 pb-20">
        <Suspense fallback={<div className="p-12 text-center text-[var(--alo-text-muted)]">Loading scholarship details…</div>}>
          <ScholarshipDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
