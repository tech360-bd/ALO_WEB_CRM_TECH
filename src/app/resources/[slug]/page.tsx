import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ResourceDetailHub from '@/components/website/ResourceDetailHub';
import ResourcesCategoryListing from '@/components/website/ResourcesCategoryListing';
import { RESOURCE_CATEGORIES } from '@/lib/website/resource-categories';
import { db } from '@/lib/db';

// /resources/{slug} dispatcher (spec: RESOURCES SYSTEM):
//   slug is a canonical category → category listing
//   slug is an article slug   → full article page (legacy deep links keep working)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = RESOURCE_CATEGORIES.find((c) => c.slug === slug);
  if (cat) {
    return {
      title: `${cat.name} — Study Abroad ${cat.name} | ALO Education`,
      description: cat.desc,
      alternates: { canonical: `https://aloeducation.com/resources/${cat.slug}` },
      openGraph: {
        title: `${cat.name} | ALO Education`,
        description: cat.desc,
        type: 'website',
      },
    };
  }
  try {
    const resource = await db.resource.findUnique({ where: { slug }, select: { title: true, seoTitle: true, seoDescription: true, summary: true, featuredImage: true } }).catch(() => null);
    if (resource) {
      return {
        title: resource.seoTitle || `${resource.title} | ALO Education`,
        description: resource.seoDescription || resource.summary || '',
        alternates: { canonical: `https://aloeducation.com/resources/${slug}` },
        openGraph: {
          title: resource.seoTitle || resource.title,
          description: resource.seoDescription || resource.summary || '',
          images: resource.featuredImage ? [resource.featuredImage] : undefined,
          type: 'article',
        },
      };
    }
  } catch { /* metadata falls back below */ }
  return {
    title: 'ALO Education Resources — Verified Study Abroad Guidance',
    description: 'Practical, updated and student-friendly guidance for courses, universities, applications, scholarships, visas and life abroad.',
  };
}

export default async function ResourceSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = RESOURCE_CATEGORIES.find((c) => c.slug === slug);

  if (cat) {
    return <ResourcesCategoryListing categorySlug={cat.slug} categoryName={cat.name} intro={cat.desc} />;
  }

  // Article fallback (legacy flat route). Unknown slugs 404 inside the hub
  // with an honest "not verified" empty state.
  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading article…</div>}>
          <ResourceDetailHub slug={slug || ''} />
        </Suspense>
      </main>
    </div>
  );
}
