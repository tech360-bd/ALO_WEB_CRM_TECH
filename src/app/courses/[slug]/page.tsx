import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, CalendarDays, ExternalLink, FileSearch, MapPin, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { getCountryDestination } from '@/lib/country-destinations-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aloeducation.com').replace(/\/$/, '');

function statusLabel(value: string | null | undefined) {
  const normalized = String(value || 'RESEARCH_REQUIRED').toUpperCase();
  if (normalized === 'VERIFIED') return 'VERIFIED';
  if (normalized.includes('CONFLICT')) return 'CONFLICTING';
  if (normalized.includes('OUTDATED') || normalized.includes('EXPIRED')) return 'OUTDATED';
  if (normalized === 'MISSING') return 'MISSING';
  return normalized || 'RESEARCH_REQUIRED';
}

function recorded(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : 'Not recorded';
}

function safeHttpUrl(value: string | null | undefined) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [crmCourse, coursePage] = await Promise.all([
    db.crmCourse.findFirst({
      where: { OR: [{ slug }, { courseId: slug }], status: 'active', verificationStatus: 'VERIFIED', publicationStatus: { in: ['published', 'PUBLISHED'] }, AND: [{ OR: [{ sourceUrl: { not: '' } }, { officialUrl: { not: '' } }] } ] },
      select: { slug: true, courseId: true, courseTitle: true, sourceUrl: true, officialUrl: true },
    }),
    db.coursePage.findFirst({ where: { slug, approvalStatus: 'PUBLISHED' }, select: { slug: true, name: true, overview: true } }),
  ]);
  if (crmCourse) {
    const canonicalSlug = crmCourse.slug || crmCourse.courseId;
    return { title: `${crmCourse.courseTitle} | ALO Education`, description: `Published course record for ${crmCourse.courseTitle}. Course facts and verification sources are shown where recorded.`, alternates: { canonical: `${SITE_URL}/course/${encodeURIComponent(canonicalSlug)}` } };
  }
  if (!coursePage) return { title: 'Course details | ALO Education' };
  return {
    title: `${coursePage.name} | Course Details | ALO Education`,
    description: coursePage.overview?.slice(0, 155) || `Source-linked course information for ${coursePage.name}. Missing values are marked as not recorded.`,
    alternates: { canonical: `${SITE_URL}/courses/${encodeURIComponent(coursePage.slug)}` },
    openGraph: { title: `${coursePage.name} | ALO Education`, url: `${SITE_URL}/courses/${encodeURIComponent(coursePage.slug)}`, type: 'website' },
  };
}

export default async function PublishedCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const crmCourse = await db.crmCourse.findFirst({
    where: {
      OR: [{ slug }, { courseId: slug }],
      status: 'active',
      verificationStatus: 'VERIFIED',
      publicationStatus: { in: ['published', 'PUBLISHED'] },
      AND: [{ OR: [{ sourceUrl: { not: '' } }, { officialUrl: { not: '' } }] }],
    },
    select: { slug: true, courseId: true },
  });
  if (crmCourse) redirect(`/course/${encodeURIComponent(crmCourse.slug || crmCourse.courseId)}`);

  const course = await db.coursePage.findFirst({
    where: { slug, approvalStatus: 'PUBLISHED', sourceUrl: { not: '' } },
    include: {
      university: {
        select: {
          slug: true, name: true, countrySlug: true, city: true, sourceUrl: true,
          lastVerifiedAt: true, verificationStatus: true, approvalStatus: true,
          country: { select: { slug: true, name: true } },
        },
      },
    },
  });
  const sourceUrl = safeHttpUrl(course?.sourceUrl);
  if (!course || !sourceUrl) notFound();

  const sourceStatus = statusLabel(course.verificationStatus);
  const universityApproved = course.university.approvalStatus === 'PUBLISHED'
    && statusLabel(course.university.verificationStatus) === 'VERIFIED'
    && Boolean(safeHttpUrl(course.university.sourceUrl));
  const country = getCountryDestination(course.countrySlug || course.university.countrySlug);
  const facts = [
    ['Study level', course.level], ['Subject area', course.subject], ['Duration', course.duration],
    ['Tuition', course.tuition], ['Recorded intake', course.intake], ['Deadline', course.deadline],
    ['English requirement', course.englishRequirement], ['Academic requirement', course.academicRequirement],
    ['Scholarship note', course.scholarship],
  ] as const;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Course', name: course.name,
    description: course.overview || undefined, url: `${SITE_URL}/courses/${course.slug}`,
    provider: course.university.name ? { '@type': 'CollegeOrUniversity', name: course.university.name } : undefined,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/" className="hover:text-blue-700">Home</Link><span>›</span><Link href="/courses" className="hover:text-blue-700">Courses</Link>{country && <><span>›</span><Link href={`/destinations/${country.slug}`} className="hover:text-blue-700">{country.name}</Link></>}{universityApproved && <><span>›</span><Link href={`/universities/${course.university.slug}`} className="hover:text-blue-700">{course.university.name}</Link></>}<span>›</span><span className="font-semibold text-slate-800">{course.name}</span></nav>
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-[9px] font-bold text-blue-800"><BookOpen className="h-3 w-3" />COURSE RECORD</span><span className={`rounded-full px-2.5 py-1.5 text-[9px] font-bold ${sourceStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : sourceStatus === 'CONFLICTING' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{sourceStatus}</span></div><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{course.name}</h1><p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">{course.university.name}{course.city ? ` · ${course.city}` : ''}{country ? <><span>·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{country.name}</span></> : course.countrySlug ? <span>· Destination: {course.countrySlug} (country guide availability not confirmed)</span> : null}</p><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{course.overview || 'No course overview is recorded.'}</p><div className="mt-5 flex flex-wrap gap-2"><a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-[10px] font-bold text-white hover:bg-slate-800"><ExternalLink className="h-3.5 w-3.5" />Open official source</a>{universityApproved && <Link href={`/universities/${course.university.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[10px] font-bold text-slate-700 hover:bg-slate-50">University page</Link>}<Link href="/course-finder" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Course search</Link></div></header>

        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-4 text-amber-900"><div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Evidence and verification</div><p className="mt-1">This page reflects one published database record. The verification label applies to the record as a whole; it is not evidence that every field was independently confirmed unless the official source supports it. Missing fields remain “Not recorded.”</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-amber-950"><span>Source: <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{new URL(sourceUrl).hostname}</a></span><span>Last checked: {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toLocaleDateString() : 'Not recorded'}</span><span>Record status: {sourceStatus}</span></div></section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-blue-700" /><h2 className="text-lg font-black text-slate-900">Course information</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{facts.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1.5 break-words text-xs font-semibold text-slate-800">{recorded(value)}</div><div className={`mt-2 text-[8px] font-bold ${sourceStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}`}>{sourceStatus}</div></div>)}</div></section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-purple-700" /><h2 className="text-sm font-bold text-slate-900">Modules and outcomes</h2></div><div className="mt-3"><h3 className="text-[10px] font-bold text-slate-700">Recorded modules</h3><p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">{recorded(course.modules)}</p><h3 className="mt-4 text-[10px] font-bold text-slate-700">Career outcomes</h3><p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">{recorded(course.careerOutcomes)}</p><h3 className="mt-4 text-[10px] font-bold text-slate-700">Course documents</h3><p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">{recorded(course.documents)}</p></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-600" /><h2 className="text-sm font-bold text-slate-900">Dates and application</h2></div><p className="mt-3 text-xs leading-5 text-slate-600">Intake and deadline values shown above come only from the published record. An empty field means no date was recorded; it does not indicate that an intake is open.</p><p className="mt-3 text-xs text-slate-600">Application URL: {course.sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Institution source</a> : 'Not recorded'}</p><div className="mt-4 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-600">No dedicated course image is recorded for this page. Image coverage remains a separate page-health issue.</div></div></section>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[9px] text-slate-500"><span>Record updated {new Date(course.updatedAt).toLocaleDateString()}</span><Link href="/course-finder" className="font-bold text-blue-700 hover:underline">Search more courses →</Link></footer>
      </div>
    </main>
  );
}
