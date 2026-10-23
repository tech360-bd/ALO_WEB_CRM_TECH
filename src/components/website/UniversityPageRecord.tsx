import Link from 'next/link';
import { BookOpen, Building2, ChevronLeft, ChevronRight, ExternalLink, FileSearch, MapPin, ShieldCheck } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';
import { VERIFIED_INTERNATIONAL_ELIGIBILITY_VALUES } from '@/lib/university-intake-window';

type UniversityRecord = {
  id: string;
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  overview: string;
  strengths: string;
  quickFacts: string;
  entryRequirements: string;
  tuition: string;
  applicationSteps: string;
  documents: string;
  faqs: string;
  sourceUrl: string | null;
  lastVerifiedAt: Date | null;
  verificationStatus: string;
  approvalStatus: string;
  updatedAt: Date;
  country: { slug: string; name: string; sourceUrl: string | null; verificationStatus: string; approvalStatus: string };
  courses: Array<{
    id: string;
    slug: string;
    name: string;
    level: string;
    internationalEligibility: string;
    subject: string;
    duration: string;
    intake: string;
    tuition: string;
    scholarship: string | null;
    englishRequirement: string;
    academicRequirement: string;
    overview: string;
    sourceUrl: string | null;
    lastVerifiedAt: Date | null;
    verificationStatus: string;
    approvalStatus: string;
  }>;
};

type CoursePagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function display(value: unknown) {
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

function statusStyle(value: string) {
  const normalized = String(value || 'RESEARCH_REQUIRED').toUpperCase();
  return normalized === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : normalized.includes('CONFLICT') ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700';
}

export default function UniversityPageRecord({
  university,
  coursePagination,
}: {
  university: UniversityRecord;
  coursePagination: CoursePagination;
}) {
  const country = getCountryDestination(university.countrySlug) || getCountryDestination(university.country.slug);
  const sourceUrl = safeHttpUrl(university.sourceUrl);
  const countrySource = safeHttpUrl(university.country.sourceUrl);
  const listedCourses = university.courses.filter((course) =>
    course.approvalStatus === 'PUBLISHED'
      && course.verificationStatus.toUpperCase() === 'VERIFIED'
      && (VERIFIED_INTERNATIONAL_ELIGIBILITY_VALUES as readonly string[]).includes(course.internationalEligibility.trim().toLowerCase())
      && safeHttpUrl(course.sourceUrl),
  );
  const status = String(university.verificationStatus || 'RESEARCH_REQUIRED').toUpperCase();
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollegeOrUniversity', name: university.name,
    url: `https://aloeducation.com/universities/${university.slug}`,
    description: university.overview || undefined,
    address: { '@type': 'PostalAddress', addressLocality: university.city || undefined, addressCountry: country?.name || university.country.name },
  };

  return (
    <main className="min-h-screen bg-[var(--alo-page)] px-4 pb-16 pt-24 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)]"><Link href="/" className="hover:text-blue-700">Home</Link><span>›</span><Link href="/universities" className="hover:text-blue-700">Universities</Link>{country && <><span>›</span><Link href={`/destinations/${country.slug}`} className="hover:text-blue-700">{country.name}</Link></>}<span>›</span><span className="font-semibold text-[var(--alo-text)]">{university.name}</span></nav>

        <header className="rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm sm:p-9"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-800"><Building2 className="h-3 w-3" />UNIVERSITY RECORD</span><span className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold ${statusStyle(status)}`}>{status}</span></div><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{university.name}</h1><p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--alo-body)]"><MapPin className="h-4 w-4" />{university.city || 'City not recorded'}{country ? ` · ${country.name}` : ` · Destination: ${university.countrySlug || 'Not recorded'}`}</p><p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-[var(--alo-body)]">{display(university.overview)}</p><div className="mt-5 flex flex-wrap gap-2">{sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-[11px] font-bold text-white hover:bg-slate-800"><ExternalLink className="h-3.5 w-3.5" />Official source</a>}{country && <Link href={`/destinations/${country.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--alo-border)] px-4 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]">Destination guide</Link>}<Link href={`/course-finder?university=${encodeURIComponent(university.slug)}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--alo-border)] px-4 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]">Course search</Link></div></header>

        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-4 text-amber-900"><div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Source and verification</div><p className="mt-1">This page reflects the published university record shown above. Its verification label does not imply that missing facts are known. Unrecorded facts stay marked “Not recorded.”</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-amber-950"><span>Source: {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{new URL(sourceUrl).hostname}</a> : 'Not recorded'}</span><span>Last checked: {university.lastVerifiedAt ? new Date(university.lastVerifiedAt).toLocaleDateString() : 'Not recorded'}</span><span>Country source: {countrySource ? <a href={countrySource} target="_blank" rel="noopener noreferrer" className="underline">View</a> : 'Not recorded'}</span></div></section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2"><FactCard icon={<FileSearch className="h-4 w-4 text-blue-700" />} title="Recorded strengths" value={university.strengths} /><FactCard icon={<BookOpen className="h-4 w-4 text-purple-700" />} title="Recorded quick facts" value={university.quickFacts} /><FactCard icon={<FileSearch className="h-4 w-4 text-amber-700" />} title="Entry requirements" value={university.entryRequirements} /><FactCard icon={<FileSearch className="h-4 w-4 text-emerald-700" />} title="Tuition record" value={university.tuition} /></section>

        <section className="mt-5 rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">International-eligible course records</div>
              <h2 className="mt-1 text-lg font-black text-[var(--alo-text)]">Courses linked to {university.name}</h2>
              <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Only published, source-linked and verified course records with an explicit positive international-eligibility status appear here. This is not a claim of complete university-catalogue coverage.</p>
            </div>
            <BookOpen className="h-5 w-5 text-[var(--alo-text-muted)]" />
          </div>
          {listedCourses.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {listedCourses.map((course) => {
                const courseSource = safeHttpUrl(course.sourceUrl);
                return (
                  <article key={course.id} className="rounded-xl border border-[var(--alo-border)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">{display(course.level)}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">International eligible</span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusStyle(course.verificationStatus)}`}>{course.verificationStatus}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-[var(--alo-text)]">{course.name}</h3>
                    <p className="mt-1 text-[11px] text-[var(--alo-body)]">{display(course.subject)} · Intake: {display(course.intake)} · Duration: {display(course.duration)}</p>
                    <p className="mt-1 text-[11px] text-[var(--alo-body)]">Tuition: {display(course.tuition)} · Eligibility: {course.internationalEligibility}</p>
                    {courseSource && <a href={courseSource} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline">Official course source <ExternalLink className="h-3 w-3" /></a>}
                    <Link href={`/courses/${course.slug}`} className="ml-3 mt-3 inline-flex text-[11px] font-bold text-[var(--alo-body)] hover:underline">Course details →</Link>
                    <p className="mt-2 text-[11px] text-[var(--alo-text-muted)]">Last checked: {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toLocaleDateString() : 'Not recorded'}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--alo-border)] p-8 text-center text-xs text-[var(--alo-text-muted)]">No published course page with a verified, explicit international-eligibility decision is currently linked here. This does not establish that the university offers no internationally eligible courses.</div>
          )}
          {coursePagination.totalPages > 1 && (
            <nav aria-label="International-eligible course pages" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--alo-border)] pt-4">
              <span className="text-[11px] text-[var(--alo-text-muted)]">Showing {(coursePagination.page - 1) * coursePagination.pageSize + 1}–{Math.min(coursePagination.page * coursePagination.pageSize, coursePagination.total)} of {coursePagination.total} verified eligible course records</span>
              <div className="flex items-center gap-2">
                {coursePagination.page > 1 ? (
                  <Link href={`/universities/${encodeURIComponent(university.slug)}?coursesPage=${coursePagination.page - 1}`} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><ChevronLeft className="h-3.5 w-3.5" />Previous</Link>
                ) : <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--alo-border)] px-3 text-[11px] text-[var(--alo-placeholder)]"><ChevronLeft className="h-3.5 w-3.5" />Previous</span>}
                <span className="text-[11px] font-semibold text-[var(--alo-body)]">Page {coursePagination.page} of {coursePagination.totalPages}</span>
                {coursePagination.page < coursePagination.totalPages ? (
                  <Link href={`/universities/${encodeURIComponent(university.slug)}?coursesPage=${coursePagination.page + 1}`} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]">Next<ChevronRight className="h-3.5 w-3.5" /></Link>
                ) : <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--alo-border)] px-3 text-[11px] text-[var(--alo-placeholder)]">Next<ChevronRight className="h-3.5 w-3.5" /></span>}
              </div>
            </nav>
          )}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2"><FactCard icon={<FileSearch className="h-4 w-4 text-[var(--alo-body)]" />} title="Application steps" value={university.applicationSteps} /><FactCard icon={<FileSearch className="h-4 w-4 text-[var(--alo-body)]" />} title="Required documents" value={university.documents} /><FactCard icon={<FileSearch className="h-4 w-4 text-[var(--alo-body)]" />} title="Published FAQs" value={university.faqs} /><div className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[var(--alo-text)]">Media coverage</h2><p className="mt-2 text-xs leading-5 text-[var(--alo-body)]">No university-specific hero image or descriptive image-alt record is attached to this page model. Image coverage is marked for review rather than substituted with a generic campus photo.</p></div></section>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--alo-border)] bg-white p-4 text-[11px] text-[var(--alo-text-muted)]"><span>Record updated {new Date(university.updatedAt).toLocaleDateString()}</span><Link href="/universities" className="font-bold text-blue-700 hover:underline">Browse university pages →</Link></footer>
      </div>
    </main>
  );
}

function FactCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <article className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2">{icon}<h2 className="text-sm font-bold text-[var(--alo-text)]">{title}</h2></div><p className="mt-3 whitespace-pre-line break-words text-xs leading-5 text-[var(--alo-body)]">{display(value)}</p></article>;
}
