import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, CalendarDays, FileSearch, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { parseBuilderDocument } from '@/lib/alo-short-form-builder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Study Abroad Guides | ALO Education',
  description: 'Source-linked study-abroad guides. Published pages show verification status, source evidence and missing information explicitly.',
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: {
    title: 'Study Abroad Guides | ALO Education',
    description: 'Source-linked study-abroad guides with visible review and verification status.',
    url: `${SITE_URL}/guides`,
    type: 'website',
  },
};

function parseTags(value: string) {
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function isLocalPublicImage(url: string) {
  return url.startsWith('/images/') && !url.includes('..') && !url.includes('\\');
}

export default async function PublishedGuidesIndex() {
  const rows = await db.contentAsset.findMany({
    where: { status: 'PUBLISHED', contentType: 'ALO_PAGE', tags: { contains: 'alo-short-form-builder' } },
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    take: 100,
    select: { id: true, title: true, slug: true, excerpt: true, body: true, tags: true, publishedAt: true, updatedAt: true },
  });
  const guides = rows.flatMap((row) => {
    const tags = parseTags(row.tags);
    const document = parseBuilderDocument(row.body);
    if (!tags.includes('alo-short-form-builder') || !document || document.images.length < 2) return [];
    const hero = document.images.find((image) => image.role === 'hero' && image.verified && image.alt.trim() && isLocalPublicImage(image.url));
    return [{ row, document, hero }];
  });
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Study Abroad Guides',
    url: `${SITE_URL}/guides`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: guides.map(({ row }, index) => ({
        '@type': 'ListItem', position: index + 1,
        item: { '@type': 'WebPage', name: row.title, url: `${SITE_URL}/guides/${row.slug}` },
      })),
    },
  };

  return (
    <main className="min-h-screen bg-[var(--alo-page)] px-4 pb-16 pt-24 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-[var(--alo-text-muted)]"><Link href="/" className="hover:text-blue-700">Home</Link><span>›</span><span className="font-semibold text-[var(--alo-text)]">Guides</span></nav>
        <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 text-white sm:p-10"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200"><BookOpen className="h-4 w-4" />ALO Education editorial library</div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Study abroad guides</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--alo-placeholder)]">Published research and planning guides. Source links, verification statuses and gaps remain visible; unverified facts are not presented as confirmed.</p><div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] text-slate-200"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />{guides.length} eligible published guide{guides.length === 1 ? '' : 's'} in this database view</div></header>

        {guides.length ? <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{guides.map(({ row, document, hero }) => <article key={row.id} className="overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Link href={`/guides/${row.slug}`} className="block"><div className="relative aspect-[16/10] bg-[var(--alo-surface-muted)]">{hero && <Image src={hero.url} alt={hero.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />}</div><div className="p-5"><div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700"><FileSearch className="h-3.5 w-3.5" />{document.contentType}</div><h2 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-[var(--alo-text)]">{row.title}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--alo-body)]">{row.excerpt || document.hero.description || 'Open this guide to review its source-linked facts and verification statuses.'}</p><div className="mt-4 flex items-center justify-between border-t border-[var(--alo-border)] pt-3 text-[11px] text-[var(--alo-text-muted)]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : 'Published'}</span><span className="font-bold text-blue-700">Read guide →</span></div></div></Link></article>)}</section> : <section className="mt-7 rounded-2xl border border-dashed border-[var(--alo-border-strong)] bg-white p-10 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]"><FileSearch className="h-5 w-5" /></div><h2 className="mt-3 text-sm font-bold text-[var(--alo-text)]">No eligible guides are published yet</h2><p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-[var(--alo-text-muted)]">Draft and review content is not public. Approved builder guides appear here after publication and validation.</p></section>}

        <footer className="mt-7 rounded-xl border border-blue-100 bg-blue-50 p-4 text-[11px] leading-4 text-blue-900">Guide availability reflects published builder assets currently in the ALO database. It is not a claim that every destination, university, course or intake has been researched.</footer>
      </div>
    </main>
  );
}
