import Link from 'next/link';
import { BookOpen, Building2, ExternalLink, FileSearch, MapPin, ShieldCheck } from 'lucide-react';
import { getCountryDestination } from '@/lib/country-destinations-data';

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

export default function UniversityPageRecord({ university }: { university: UniversityRecord }) {
  const country = getCountryDestination(university.countrySlug) || getCountryDestination(university.country.slug);
  const sourceUrl = safeHttpUrl(university.sourceUrl);
  const countrySource = safeHttpUrl(university.country.sourceUrl);
  const listedCourses = university.courses.filter((course) => course.approvalStatus === 'PUBLISHED' && course.verificationStatus.toUpperCase() === 'VERIFIED' && safeHttpUrl(course.sourceUrl));
  const status = String(university.verificationStatus || 'RESEARCH_REQUIRED').toUpperCase();
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollegeOrUniversity', name: university.name,
    url: `https://aloeducation.com/universities/${university.slug}`,
    description: university.overview || undefined,
    address: { '@type': 'PostalAddress', addressLocality: university.city || undefined, addressCountry: country?.name || university.country.name },
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link href="/" className="hover:text-blue-700">Home</Link><span>›</span><Link href="/universities" className="hover:text-blue-700">Universities</Link>{country && <><span>›</span><Link href={`/destinations/${country.slug}`} className="hover:text-blue-700">{country.name}</Link></>}<span>›</span><span className="font-semibold text-slate-800">{university.name}</span></nav>

        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-[9px] font-bold text-blue-800"><Building2 className="h-3 w-3" />UNIVERSITY RECORD</span><span className={`rounded-full px-2.5 py-1.5 text-[9px] font-bold ${statusStyle(status)}`}>{status}</span></div><h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{university.name}</h1><p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4" />{university.city || 'City not recorded'}{country ? ` · ${country.name}` : ` · Destination: ${university.countrySlug || 'Not recorded'}`}</p><p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-600">{display(university.overview)}</p><div className="mt-5 flex flex-wrap gap-2">{sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-[10px] font-bold text-white hover:bg-slate-800"><ExternalLink className="h-3.5 w-3.5" />Official source</a>}{country && <Link href={`/destinations/${country.slug}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Destination guide</Link>}<Link href={`/course-finder?university=${encodeURIComponent(university.slug)}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[10px] font-bold text-slate-700 hover:bg-slate-50">Course search</Link></div></header>

        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-4 text-amber-900"><div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Source and verification</div><p className="mt-1">This page reflects the published university record shown above. Its verification label does not imply that missing facts are known. Unrecorded facts stay marked “Not recorded.”</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-amber-950"><span>Source: {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{new URL(sourceUrl).hostname}</a> : 'Not recorded'}</span><span>Last checked: {university.lastVerifiedAt ? new Date(university.lastVerifiedAt).toLocaleDateString() : 'Not recorded'}</span><span>Country source: {countrySource ? <a href={countrySource} target="_blank" rel="noopener noreferrer" className="underline">View</a> : 'Not recorded'}</span></div></section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2"><FactCard icon={<FileSearch className="h-4 w-4 text-blue-700" />} title="Recorded strengths" value={university.strengths} /><FactCard icon={<BookOpen className="h-4 w-4 text-purple-700" />} title="Recorded quick facts" value={university.quickFacts} /><FactCard icon={<FileSearch className="h-4 w-4 text-amber-700" />} title="Entry requirements" value={university.entryRequirements} /><FactCard icon={<FileSearch className="h-4 w-4 text-emerald-700" />} title="Tuition record" value={university.tuition} /></section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Dedicated course records</div><h2 className="mt-1 text-lg font-black text-slate-900">Courses linked to {university.name}</h2><p className="mt-1 text-[10px] text-slate-500">Only published, source-linked and verified CoursePage rows appear below. This list is not a claim of full catalogue coverage.</p></div><BookOpen className="h-5 w-5 text-slate-400" /></div>{listedCourses.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{listedCourses.map((course) => <article key={course.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-700">{display(course.level)}</span><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${statusStyle(course.verificationStatus)}`}>{course.verificationStatus}</span></div><h3 className="mt-2 text-sm font-bold text-slate-900">{course.name}</h3><p className="mt-1 text-[10px] text-slate-600">{display(course.subject)} · Intake: {display(course.intake)} · Duration: {display(course.duration)}</p><p className="mt-1 text-[10px] text-slate-600">Tuition: {display(course.tuition)}</p><a href={safeHttpUrl(course.sourceUrl) || '#'} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 hover:underline">Official course source <ExternalLink className="h-3 w-3" /></a><Link href={`/courses/${course.slug}`} className="ml-3 mt-3 inline-flex text-[9px] font-bold text-slate-700 hover:underline">Course details →</Link></article>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">No published, verified course page is currently linked in this university profile. This does not establish that no courses exist.</div>}</section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2"><FactCard icon={<FileSearch className="h-4 w-4 text-slate-600" />} title="Application steps" value={university.applicationSteps} /><FactCard icon={<FileSearch className="h-4 w-4 text-slate-600" />} title="Required documents" value={university.documents} /><FactCard icon={<FileSearch className="h-4 w-4 text-slate-600" />} title="Published FAQs" value={university.faqs} /><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-900">Media coverage</h2><p className="mt-2 text-xs leading-5 text-slate-600">No university-specific hero image or descriptive image-alt record is attached to this page model. Image coverage is marked for review rather than substituted with a generic campus photo.</p></div></section>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[9px] text-slate-500"><span>Record updated {new Date(university.updatedAt).toLocaleDateString()}</span><Link href="/universities" className="font-bold text-blue-700 hover:underline">Browse university pages →</Link></footer>
      </div>
    </main>
  );
}

function FactCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2">{icon}<h2 className="text-sm font-bold text-slate-900">{title}</h2></div><p className="mt-3 whitespace-pre-line break-words text-xs leading-5 text-slate-600">{display(value)}</p></article>;
}
