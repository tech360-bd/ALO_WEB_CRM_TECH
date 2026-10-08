import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ScholarshipDetailHub from '@/components/website/ScholarshipDetailHub';
import { MASTER_SCHOLARSHIPS_DATA, getScholarshipBySlug } from '@/lib/scholarships-data';

export async function generateStaticParams() {
  return MASTER_SCHOLARSHIPS_DATA.slice(0, 20).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = getScholarshipBySlug(slug);

  if (!scholarship) {
    return {
      title: 'Scholarship Details | ALO Education',
      description: 'Explore global study abroad scholarships and funding opportunities. Scholarship details, eligibility, deadlines and source verification.',
    };
  }

  return {
    title: `${scholarship.title} | How, When, What & Benefits | ALO Education`,
    description: scholarship.description + ' Eligibility, deadlines, related content, FAQs and source verification.',
    alternates: {
      canonical: `https://aloeducation.com/scholarships/${scholarship.slug}`,
    },
    openGraph: {
      title: scholarship.title,
      description: scholarship.description,
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
  const scholarship = getScholarshipBySlug(slug);

  // §49 structured data: Scholarship + FAQ + Breadcrumb
  const jsonLd = scholarship ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Grant',
      name: scholarship.title,
      description: scholarship.description,
      funder: { '@type': 'Organization', name: scholarship.provider || 'Scholarship provider' },
      url: `https://aloeducation.com/scholarships/${scholarship.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aloeducation.com' },
        { '@type': 'ListItem', position: 2, name: 'Scholarships', item: 'https://aloeducation.com/scholarships' },
        { '@type': 'ListItem', position: 3, name: scholarship.title, item: `https://aloeducation.com/scholarships/${scholarship.slug}` },
      ],
    },
  ] : [];

  return (
    <div className="min-h-screen bg-white">
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}
      <main className="flex-1 pt-20 pb-20">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading scholarship details…</div>}>
          <ScholarshipDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
