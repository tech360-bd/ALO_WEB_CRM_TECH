import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, BookOpenCheck, CheckCircle2, Info, Link2, MapPin, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { parseBuilderDocument, type AloBuilderDocument, type FactStatus } from '@/lib/alo-short-form-builder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUILDER_TAG = 'alo-short-form-builder';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

async function getPublishedPage(slug: string) {
  try {
    const asset = await db.contentAsset.findFirst({
      where: { slug, contentType: 'ALO_PAGE', status: 'PUBLISHED', tags: { contains: BUILDER_TAG } },
      select: { id: true, slug: true, title: true, body: true, metaTitle: true, metaDescription: true, canonicalUrl: true, publishedAt: true, updatedAt: true },
    });
    if (!asset) return null;
    const document = parseBuilderDocument(asset.body);
    if (!document || !Array.isArray(document.images) || document.images.length < 2) return null;
    return { asset, document };
  } catch (error) {
    console.error('[published-guide] database read failed', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: 'Study guide not found | ALO Education' };
  const { asset, document } = page;
  const canonical = document.canonicalUrl.startsWith('http') ? document.canonicalUrl : `${SITE_URL}${document.canonicalUrl || `/guides/${slug}`}`;
  const images = document.images.slice(0, 2).map((image) => ({ url: image.url.startsWith('http') ? image.url : `${SITE_URL}${image.url}`, alt: image.alt }));
  return {
    title: asset.metaTitle || document.seoTitle || asset.title,
    description: asset.metaDescription || document.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: asset.metaTitle || document.seoTitle || asset.title,
      description: asset.metaDescription || document.metaDescription,
      url: canonical,
      type: 'article',
      images,
      publishedTime: asset.publishedAt?.toISOString(),
      modifiedTime: asset.updatedAt.toISOString(),
    },
    twitter: { card: 'summary_large_image', title: asset.metaTitle || document.seoTitle || asset.title, description: asset.metaDescription || document.metaDescription, images: images.map((image) => image.url) },
  };
}

function statusLabel(status: FactStatus) {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'KNOWN') return 'Known · source review needed';
  if (status === 'OUTDATED') return 'Outdated · verify before use';
  if (status === 'CONFLICTING') return 'Conflicting · review required';
  if (status === 'NOT_APPLICABLE') return 'Not applicable';
  if (status === 'MISSING') return 'Information currently being verified';
  return 'Research required';
}

function safeJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export default async function PublishedGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublishedPage(slug);
  if (!result) notFound();
  const { asset, document } = result;
  const verifiedFacts = document.facts.filter((fact) => fact.status === 'VERIFIED' && fact.sourceUrl);
  const heroImage = document.images.find((image) => image.id === document.hero.imageId) || document.images[0];
  const supportImage = document.images.find((image) => image.id !== heroImage?.id) || document.images[1];
  const structuredData = { ...document.structuredData, datePublished: asset.publishedAt?.toISOString(), dateModified: asset.updatedAt.toISOString(), url: `${SITE_URL}/guides/${asset.slug}` };

  return (
    <main className="min-h-screen bg-white pb-16 pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[var(--alo-text-muted)]">
          {document.breadcrumbs.map((crumb, index) => <span key={`${crumb.href}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="text-[var(--alo-placeholder)]">/</span>}
            {index === document.breadcrumbs.length - 1 ? <span aria-current="page" className="text-[var(--alo-text)]">{crumb.label}</span> : <Link href={crumb.href} className="hover:text-[var(--alo-brand)]">{crumb.label}</Link>}
          </span>)}
        </nav>

        {/* Master §08 Variant E — editorial inner-page hero: white surface,
            copy first, photograph in a rounded frame. No dark photo overlay. */}
        <section className="grid items-center gap-8 pb-2 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--alo-brand-pale)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--alo-brand)] ring-1 ring-inset ring-[var(--alo-brand-border)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{(document.hero as any).eyebrow ?? 'ALO guide'}</span>
            </div>
            <h1 className="max-w-2xl font-heading text-[30px] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--alo-text)] sm:text-[40px] lg:text-[46px]">{document.hero.title}</h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[var(--alo-body)] sm:text-base">{document.hero.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/book-consultation" className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[var(--alo-cta)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--alo-cta-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2">{document.input.cta || 'Book counselling'}</Link>
              <Link href="/course-finder" className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-[var(--alo-border-strong)] bg-card px-5 text-sm font-semibold text-[var(--alo-text)] transition-colors hover:border-[var(--alo-brand)] hover:text-[var(--alo-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2">Browse courses</Link>
            </div>
            <p className="mt-5 max-w-xl text-[11px] leading-5 text-[var(--alo-text-muted)]">Specific fees, requirements, deadlines and course availability are shown only when verified source records are available.</p>
          </div>
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-[var(--alo-border)] bg-[var(--alo-page)] shadow-[var(--alo-shadow-sm)]">
              <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              {heroImage.caption && <div className="absolute bottom-3 right-3 z-10 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-medium text-[var(--alo-text-secondary)] shadow-[var(--alo-shadow-xs)]">{heroImage.caption}</div>}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {verifiedFacts.length > 0 ? <section aria-labelledby="verified-data-heading" className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /><h2 id="verified-data-heading" className="text-sm font-bold text-[var(--alo-text)]">Verified source information</h2></div><p className="mt-1 text-[11px] text-[var(--alo-body)]">Only source-linked fields with a verified record are shown as facts.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700">{verifiedFacts.length} verified</span></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{verifiedFacts.slice(0, 6).map((fact) => <FactRow key={fact.id} fact={fact} />)}</div>
            </section> : <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-sm font-bold text-amber-900"><Info className="h-4 w-4" />Information currently being verified</div><p className="mt-1 text-xs leading-5 text-amber-800">No specific factual data passed the source-verification threshold for this page. Confirm requirements, fees, deadlines and availability with the official provider before applying.</p></section>}

            <div className="space-y-9">
              {document.sections.map((section, index) => {
                const image = section.imageId ? document.images.find((candidate) => candidate.id === section.imageId) : index === 1 ? supportImage : undefined;
                return <section key={section.id} className={`grid items-center gap-6 ${image ? 'md:grid-cols-[minmax(0,1fr)_minmax(230px,0.78fr)]' : ''}`}>
                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--alo-brand)]">{String(index + 1).padStart(2, '0')} · {document.contentType}</div>
                    <h2 className="text-xl font-black tracking-tight text-[var(--alo-text)] sm:text-2xl">{section.title}</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--alo-body)]">{section.body}</p>
                    {section.bullets && section.bullets.length > 0 && <ul className="mt-4 space-y-2">{section.bullets.map((bullet, bulletIndex) => <li key={bulletIndex} className="flex items-start gap-2.5 text-sm leading-6 text-[var(--alo-body)]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{bullet}</li>)}</ul>}
                  </div>
                  {image && <figure className="overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-surface-muted)]"><div className="relative min-h-[230px]"><Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover" /></div>{image.caption && <figcaption className="border-t border-[var(--alo-border)] bg-white px-4 py-3 text-xs font-medium text-[var(--alo-text-secondary)]">{image.caption}</figcaption>}</figure>}
                </section>;
              })}
            </div>

            {document.facts.length > verifiedFacts.length && <section className="mt-9 rounded-2xl border border-[var(--alo-border)] p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--alo-text)]"><Info className="h-4 w-4 text-amber-600" />Other database information</h2>
              <p className="mt-1 text-[11px] leading-4 text-[var(--alo-text-muted)]">These records are not presented as verified facts. Their current evidence status is shown explicitly.</p>
              <div className="mt-4 divide-y divide-[var(--alo-border)]">{document.facts.filter((fact) => fact.status !== 'VERIFIED' || !fact.sourceUrl).slice(0, 8).map((fact) => <div key={fact.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><div><div className="text-xs font-semibold text-[var(--alo-text)]">{fact.label}</div><div className="mt-0.5 text-[11px] text-[var(--alo-text-muted)]">{fact.status === 'MISSING' ? 'Information currently being verified' : fact.value}</div></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">{statusLabel(fact.status)}</span></div>)}</div>
            </section>}

            {document.faqs.length > 0 && <section className="mt-10"><div className="mb-4"><div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--alo-brand)]">Need clarity?</div><h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--alo-text)]">Frequently asked questions</h2></div><div className="space-y-2">{document.faqs.map((faq, index) => <details key={index} className="group rounded-xl border border-[var(--alo-border)] p-4 open:bg-[var(--alo-page)]"><summary className="cursor-pointer list-none pr-5 text-sm font-bold text-[var(--alo-text)] marker:hidden">{faq.question}<span className="float-right text-[var(--alo-brand)] transition group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-[var(--alo-body)]">{faq.answer}</p></details>)}</div></section>}

            {/* Master §02/§11: pale-orange CTA panel — no dark or navy block
                behind the photograph, no dark scrim over it. */}
            <section className="mt-10 overflow-hidden rounded-[20px] border border-[#FFD5C4] bg-[var(--alo-cta-soft)]">
              <div className="grid gap-0 md:grid-cols-[1fr_260px]">
                <div className="p-6 sm:p-8"><div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--alo-cta)]">Take the next step</div><h2 className="mt-2 max-w-xl text-2xl font-black tracking-tight text-[var(--alo-text)]">Build a plan around verified information.</h2><p className="mt-2 max-w-xl text-xs leading-6 text-[var(--alo-text-secondary)]">An ALO Education counsellor can help you confirm course choices, source requirements and next steps for your situation.</p><Link href="/book-consultation" className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-alo-cta-solid px-5 text-sm font-bold text-white transition-colors hover:bg-alo-cta-solid-hover">{document.input.cta || 'Book counselling'}<ArrowRight className="h-4 w-4" /></Link></div>
                <div className="relative hidden min-h-[220px] md:block"><Image src={supportImage.url} alt={supportImage.alt} fill sizes="260px" className="object-cover" /></div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--alo-brand)]" /><h2 className="text-xs font-bold text-[var(--alo-text)]">Your page context</h2></div><div className="mt-4 space-y-3">{[
              ['Destination', document.input.country], ['Subject', document.input.subject], ['Degree', document.input.degree], ['Requested intake', document.input.intake], ['Audience', document.input.audience],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex items-start justify-between gap-2 border-b border-[var(--alo-border)] pb-2.5"><span className="text-[11px] text-[var(--alo-text-muted)]">{label}</span><span className="max-w-[160px] text-right text-[11px] font-semibold text-[var(--alo-text)]">{value}</span></div>)}</div><p className="mt-3 text-[11px] leading-4 text-[var(--alo-text-muted)]">A requested intake is a topic, not proof of course availability.</p></section>
            <section className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-[var(--alo-brand)]" /><h2 className="text-xs font-bold text-[var(--alo-text)]">Continue exploring</h2></div><div className="mt-3 space-y-1">{document.links.slice(0, 8).map((link, index) => <Link key={`${link.href}-${index}`} href={link.href} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-[var(--alo-body)] transition hover:bg-[var(--alo-brand-pale)] hover:text-[var(--alo-brand)]"><span className="truncate">{link.label}</span><ArrowRight className="h-3 w-3 shrink-0" /></Link>)}</div></section>
            <section className="rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-5"><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--alo-text-muted)]">Evidence transparency</div><p className="mt-2 text-[11px] leading-5 text-[var(--alo-body)]">Verified values cite their source. Missing or outdated records are not silently treated as facts.</p><div className="mt-3 text-[11px] text-[var(--alo-text-muted)]">Published {asset.publishedAt ? new Date(asset.publishedAt).toLocaleDateString() : 'date not recorded'}</div></section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FactRow({ fact }: { fact: AloBuilderDocument['facts'][number] }) {
  return <div className="rounded-xl border border-emerald-100 bg-white p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]">{fact.label}</div><div className="mt-1 text-xs font-semibold text-[var(--alo-text)]">{fact.value}</div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-bold text-emerald-700">VERIFIED{fact.lastVerifiedAt ? ` · ${new Date(fact.lastVerifiedAt).toLocaleDateString()}` : ''}</span>{fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-[var(--alo-brand)] hover:underline">{fact.sourceName || 'Verified source'} ↗</a>}</div></div>;
}
