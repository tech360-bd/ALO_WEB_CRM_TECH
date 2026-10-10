import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ResourceDetailHub from '@/components/website/ResourceDetailHub';
import { RESOURCE_CATEGORIES } from '@/lib/website/resource-categories';
import { getPublishedResource } from '@/lib/website/public-content';
export const dynamic = 'force-dynamic';

// Canonical article route (spec): /resources/{category}/{article-slug}
// Server-side metadata + Article/Breadcrumb JSON-LD; content renders through
// the shared ResourceDetailHub so all article depth rules stay in one place.

export async function generateMetadata({ params }: { params: Promise<{ slug: string; article: string }> }): Promise<Metadata> {
  const { slug: category, article } = await params;
  try {
    const resource = await getPublishedResource(article, category);
    if (resource) {
      return {
        title: resource.seoTitle || `${resource.title} | ALO Education`,
        description: resource.seoDescription || resource.summary || '',
        alternates: { canonical: `https://aloeducation.com/resources/${category}/${article}` },
        openGraph: {
          title: resource.seoTitle || resource.title,
          description: resource.seoDescription || resource.summary || '',
          images: resource.featuredImage ? [resource.featuredImage] : undefined,
          type: 'article',
          publishedTime: resource.publishedAt?.toISOString(),
        },
      };
    }
  } catch { /* fall through to default metadata */ }
  return {
    title: 'Study Abroad Guide | ALO Education',
    description: 'Practical, updated and student-friendly study abroad guidance from ALO Education.',
  };
}

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string; article: string }> }) {
  const { slug: category, article } = await params;
  const published = await getPublishedResource(article, category);
  if (!published) notFound();
  const categoryName = RESOURCE_CATEGORIES.find((item) => item.slug === category)?.name ?? category;

  // Article/Breadcrumb structured data (spec §49) — populated from DB at request time
  let jsonLd: object[] = [];
  try {
    const r = await getPublishedResource(article, category);
    if (r) {
      jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: r.seoTitle || r.title,
          description: r.seoDescription || r.summary || '',
          image: r.featuredImage || undefined,
          datePublished: r.publishedAt?.toISOString(),
          author: { '@type': 'Organization', name: 'ALO Education' },
          publisher: { '@type': 'Organization', name: 'ALO Education', logo: { '@type': 'ImageObject', url: 'https://aloeducation.com/logo.svg' } },
          mainEntityOfPage: `https://aloeducation.com/resources/${category}/${article}`,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aloeducation.com' },
            { '@type': 'ListItem', position: 2, name: 'Resources', item: 'https://aloeducation.com/resources' },
            { '@type': 'ListItem', position: 3, name: categoryName, item: `https://aloeducation.com/resources/${category}` },
            { '@type': 'ListItem', position: 4, name: r.title, item: `https://aloeducation.com/resources/${category}/${article}` },
          ],
        },
      ];
    }
  } catch { jsonLd = []; }

  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      ))}
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading guide…</div>}>
          <ResourceDetailHub slug={article || ''} />
        </Suspense>
      </main>
    </div>
  );
}
