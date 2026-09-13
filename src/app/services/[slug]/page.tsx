import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ServiceDetailHub from '@/components/website/ServiceDetailHub';
import { MASTER_SERVICES_DATA, getServiceBySlug } from '@/lib/services-data';

export async function generateStaticParams() {
  return MASTER_SERVICES_DATA.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: 'Our Services | ALO Education',
      description: 'Comprehensive study abroad services for international students.',
    };
  }

  return {
    title: service.seoTitle,
    description: service.seoDescription + ' Complete service detail page with 19 sections — DB-driven, related content, FAQ, source verification.',
    alternates: {
      canonical: `https://aloeducation.com/services/${service.slug}`,
    },
    openGraph: {
      title: service.title,
      description: service.seoDescription,
      url: `https://aloeducation.com/services/${service.slug}`,
      images: [{ url: service.heroImage }],
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

  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pt-20 pb-20">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Service Detail — DB-driven with 19 sections...</div>}>
          <ServiceDetailHub slug={slug} />
        </Suspense>
      </main>
    </div>
  );
}
