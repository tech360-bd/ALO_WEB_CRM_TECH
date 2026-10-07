import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ServiceDetailHub from '@/components/website/ServiceDetailHub';
import { SPEC_SERVICES, getSpecService } from '@/lib/website/spec-services';

export async function generateStaticParams() {
  return SPEC_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spec = getSpecService(slug);

  // DB-backed services get their metadata from generated page content; the
  // spec catalog guarantees correct, honest metadata for the 14 services.
  const title = spec ? `${spec.title} — ${spec.category} Service | ALO Education` : 'Our Services | ALO Education';
  const description = spec
    ? spec.shortDescription
    : 'Comprehensive study abroad services for international students.';

  return {
    title,
    description,
    alternates: {
      canonical: `https://aloeducation.com/services/${spec?.slug || slug}`,
    },
    openGraph: {
      title: spec?.title || 'ALO Education Services',
      description,
      url: `https://aloeducation.com/services/${spec?.slug || slug}`,
      type: 'website',
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spec = getSpecService(slug);

  // §49 structured data: Service + FAQPage shell + BreadcrumbList
  const jsonLd = spec ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: spec.title,
      provider: { '@type': 'Organization', name: 'ALO Education', url: 'https://aloeducation.com' },
      serviceType: spec.category,
      description: spec.shortDescription,
      url: `https://aloeducation.com/services/${spec.slug}`,
      areaServed: 'Bangladesh',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aloeducation.com' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://aloeducation.com/services' },
        { '@type': 'ListItem', position: 3, name: spec.title, item: `https://aloeducation.com/services/${spec.slug}` },
      ],
    },
  ] : [];

  return (
    <div className="min-h-screen bg-white">
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}
      <main className="flex-1 pt-20 pb-20">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading service details…</div>}>
          <ServiceDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
