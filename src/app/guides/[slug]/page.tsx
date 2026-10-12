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
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
          {document.breadcrumbs.map((crumb, index) => <span key={`${crumb.href}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
            {index === document.breadcrumbs.length - 1 ? <span aria-current="page" className="text-slate-800">{crumb.label}</span> : <Link href={crumb.href} className="hover:text-blue-700">{crumb.label}</Link>}
          </span>)}
        </nav>

        <section className="relative isolate min-h-[450px] overflow-hidden rounded-[28px] bg-slate-950 md:min-h-[510px]">
          <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/68 to-slate-950/15" />
          <div className="relative z-10 flex min-h-[450px] max-w-3xl flex-col justify-center px-6 py-12 text-white sm:px-10 md:min-h-[510px] md:px-14">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80"><Sparkles className="h-3.5 w-3.5" />{document.hero.eyebrow || document.contentType}</div>
            <h1 className="max-w-2xl text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl">{document.hero.title}</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{document.hero.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/book-consultation" className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600">{document.input.cta || 'Book a counselling session'}<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/course-finder" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"><BookOpenCheck className="h-4 w-4" />Explore courses</Link>
            </div>
            <p className="mt-5 max-w-xl text-[10px] leading-5 text-white/65">Specific fees, requirements, deadlines and course availability are shown only when verified source records are available. Requested intake is not a confirmation of availability.</p>
          </div>
          {heroImage.caption && <div className="absolute bottom-3 right-4 z-10 rounded-full bg-slate-950/60 px-3 py-1.5 text-[9px] text-white/80">{heroImage.caption}</div>}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {verifiedFacts.length > 0 ? <section aria-labelledby="verified-data-heading" className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-700" /><h2 id="verified-data-heading" className="text-sm font-bold text-slate-900">Verified source information</h2></div><p className="mt-1 text-[10px] text-slate-600">Only source-linked fields with a verified record are shown as facts.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-emerald-700">{verifiedFacts.length} verified</span></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">{verifiedFacts.slice(0, 6).map((fact) => <FactRow key={fact.id} fact={fact} />)}</div>
            </section> : <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-2 text-sm font-bold text-amber-900"><Info className="h-4 w-4" />Information currently being verified</div><p className="mt-1 text-xs leading-5 text-amber-800">No specific factual data passed the source-verification threshold for this page. Confirm requirements, fees, deadlines and availability with the official provider before applying.</p></section>}

            <div className="space-y-9">
              {document.sections.map((section, index) => {
                const image = section.imageId ? document.images.find((candidate) => candidate.id === section.imageId) : index === 1 ? supportImage : undefined;
                return <section key={section.id} className={`grid items-center gap-6 ${image ? 'md:grid-cols-[minmax(0,1fr)_minmax(230px,0.78fr)]' : ''}`}>
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">{String(index + 1).padStart(2, '0')} · {document.contentType}</div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{section.title}</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{section.body}</p>
                    {section.bullets && section.bullets.length > 0 && <ul className="mt-4 space-y-2">{section.bullets.map((bullet, bulletIndex) => <li key={bulletIndex} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{bullet}</li>)}</ul>}
                  </div>
                  {image && <figure className="relative min-h-[230px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover" />{image.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-4 pb-3 pt-8 text-xs font-medium text-white">{image.caption}</figcaption>}</figure>}
                </section>;
              })}
            </div>

            {document.facts.length > verifiedFacts.length && <section className="mt-9 rounded-2xl border border-slate-200 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Info className="h-4 w-4 text-amber-600" />Other database information</h2>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">These records are not presented as verified facts. Their current evidence status is shown explicitly.</p>
              <div className="mt-4 divide-y divide-slate-100">{document.facts.filter((fact) => fact.status !== 'VERIFIED' || !fact.sourceUrl).slice(0, 8).map((fact) => <div key={fact.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><div><div className="text-xs font-semibold text-slate-800">{fact.label}</div><div className="mt-0.5 text-[10px] text-slate-500">{fact.status === 'MISSING' ? 'Information currently being verified' : fact.value}</div></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">{statusLabel(fact.status)}</span></div>)}</div>
            </section>}

            {document.faqs.length > 0 && <section className="mt-10"><div className="mb-4"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Need clarity?</div><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Frequently asked questions</h2></div><div className="space-y-2">{document.faqs.map((faq, index) => <details key={index} className="group rounded-xl border border-slate-200 p-4 open:bg-slate-50"><summary className="cursor-pointer list-none pr-5 text-sm font-bold text-slate-800 marker:hidden">{faq.question}<span className="float-right text-blue-700 transition group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p></details>)}</div></section>}

            <section className="mt-10 overflow-hidden rounded-2xl bg-slate-950 text-white">
              <div className="grid gap-0 md:grid-cols-[1fr_260px]">
                <div className="p-6 sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">Take the next step</div><h2 className="mt-2 max-w-xl text-2xl font-black tracking-tight">Build a plan around verified information.</h2><p className="mt-2 max-w-xl text-xs leading-6 text-slate-300">An ALO Education counsellor can help you confirm course choices, source requirements and next steps for your situation.</p><Link href="/book-consultation" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-xs font-bold text-white hover:bg-orange-600">{document.input.cta || 'Book counselling'}<ArrowRight className="h-4 w-4" /></Link></div>
                <div className="relative hidden min-h-[220px] md:block"><Image src={supportImage.url} alt={supportImage.alt} fill sizes="260px" className="object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" /></div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-700" /><h2 className="text-xs font-bold text-slate-900">Your page context</h2></div><div className="mt-4 space-y-3">{[
              ['Destination', document.input.country], ['Subject', document.input.subject], ['Degree', document.input.degree], ['Requested intake', document.input.intake], ['Audience', document.input.audience],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5"><span className="text-[10px] text-slate-500">{label}</span><span className="max-w-[160px] text-right text-[10px] font-semibold text-slate-800">{value}</span></div>)}</div><p className="mt-3 text-[9px] leading-4 text-slate-500">A requested intake is a topic, not proof of course availability.</p></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-blue-700" /><h2 className="text-xs font-bold text-slate-900">Continue exploring</h2></div><div className="mt-3 space-y-1">{document.links.slice(0, 8).map((link, index) => <Link key={`${link.href}-${index}`} href={link.href} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><span className="truncate">{link.label}</span><ArrowRight className="h-3 w-3 shrink-0" /></Link>)}</div></section>
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Evidence transparency</div><p className="mt-2 text-[10px] leading-5 text-slate-600">Verified values cite their source. Missing or outdated records are not silently treated as facts.</p><div className="mt-3 text-[9px] text-slate-400">Published {asset.publishedAt ? new Date(asset.publishedAt).toLocaleDateString() : 'date not recorded'}</div></section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FactRow({ fact }: { fact: AloBuilderDocument['facts'][number] }) {
  return <div className="rounded-xl border border-emerald-100 bg-white p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{fact.label}</div><div className="mt-1 text-xs font-semibold text-slate-900">{fact.value}</div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] font-bold text-emerald-700">VERIFIED{fact.lastVerifiedAt ? ` · ${new Date(fact.lastVerifiedAt).toLocaleDateString()}` : ''}</span>{fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] font-semibold text-blue-700 hover:underline">{fact.sourceName || 'Verified source'} ↗</a>}</div></div>;
}
