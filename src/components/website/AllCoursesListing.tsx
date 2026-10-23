'use client';

/**
 * All Courses — the complete public course catalogue at /courses.
 *
 * Data comes only from the existing public catalogue API
 * (/api/course-finder + /api/course-finder/facets), which returns published,
 * source-linked records. Nothing is hard-coded: when the catalogue has no
 * matching record the page says so. Fees are shown only when an intake's
 * fee is verified; otherwise the card states "Fees pending verification"
 * instead of inventing a number. The advanced multi-criteria search keeps
 * living in /course-finder — this page is the browsable catalogue index and
 * links every card to its existing course/university detail pages.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Building2, Clock, Globe, GraduationCap, MapPin, Search } from 'lucide-react';

interface CourseIntake {
  intakeYear: number | null;
  intakeMonth: string;
  intakeName: string;
  applicationDeadline: string;
  yearlyTuition: number;
  tuitionCurrency: string;
  verified?: boolean;
}

interface CourseRow {
  id: string;
  courseId: string;
  slug: string;
  courseTitle: string;
  universityName: string;
  universitySlug: string;
  studyLevel: string;
  subjectArea: string;
  qualification?: string;
  durationMonths?: number;
  deliveryMode?: string;
  country: string;
  city: string;
  ieltsRequirement: number | null;
  intakes: CourseIntake[];
}

interface Facets {
  subjects: string[];
  countries: string[];
  levels: string[];
}

const PAGE_SIZE = 12;

function verifiedFee(course: CourseRow): string | null {
  const intake = (course.intakes ?? []).find(
    (i) => i.verified && i.yearlyTuition > 0 && i.tuitionCurrency
  );
  if (!intake) return null;
  return `${intake.tuitionCurrency} ${intake.yearlyTuition.toLocaleString()} / year`;
}

function intakeLabel(intake: CourseIntake): string {
  if (intake.intakeName) return intake.intakeName;
  if (intake.intakeMonth) return intake.intakeYear ? `${intake.intakeMonth} ${intake.intakeYear}` : intake.intakeMonth;
  return '';
}

export default function AllCoursesListing() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [country, setCountry] = useState(searchParams.get('country') ?? '');
  const [level, setLevel] = useState(searchParams.get('studyLevel') ?? '');
  const [subject, setSubject] = useState(searchParams.get('subject') ?? '');
  const [facets, setFacets] = useState<Facets>({ subjects: [], countries: [], levels: [] });
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/course-finder/facets')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.success) return;
        setFacets({
          subjects: json.subjects ?? [],
          countries: json.countries ?? [],
          levels: json.levels ?? [],
        });
      })
      .catch(() => { /* filters stay empty; search still works */ });
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (country) params.set('country', country);
      if (level) params.set('studyLevel', level);
      if (subject) params.set('subject', subject);
      params.set('limit', String(PAGE_SIZE));
      params.set('page', String(targetPage));
      const res = await fetch(`/api/course-finder?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Course search failed.');
      setCourses(json.courses ?? []);
      setTotal(json.total ?? 0);
      setPages(json.pages ?? 1);
      setPage(json.page ?? targetPage);
    } catch (err) {
      setCourses([]);
      setTotal(0);
      setPages(1);
      setError(err instanceof Error ? err.message : 'Course search failed.');
    } finally {
      setLoading(false);
    }
  }, [search, country, level, subject]);

  useEffect(() => { void load(1); }, [load]);

  const selectClass =
    'h-12 w-full rounded-xl border border-[var(--alo-border)] bg-white px-3 text-sm text-[var(--alo-text)] focus:border-[var(--alo-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--alo-brand)]/30';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--alo-cta)]">
          <GraduationCap className="h-4 w-4" aria-hidden="true" /> Course Catalogue
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-[var(--alo-text)] sm:text-4xl">
          All Courses
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--alo-body)]">
          Browse every published course in the ALO Education catalogue. Fees and intakes are shown
          only where they have been verified against an official source — anything still being
          checked is labelled as pending verification. For multi-criteria matching, use the{' '}
          <Link href="/course-finder" className="font-semibold text-[var(--alo-brand)] underline underline-offset-2">
            Course Finder
          </Link>.
        </p>
      </div>

      {/* Search + filters */}
      <form
        className="mt-8 grid gap-3 rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
        onSubmit={(e) => { e.preventDefault(); void load(1); }}
        role="search"
        aria-label="Search courses"
      >
        <label className="relative block">
          <span className="sr-only">Search course or university</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--alo-text-muted)]" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course or university…"
            className="h-12 w-full rounded-xl border border-[var(--alo-border)] bg-white pl-10 pr-3 text-sm text-[var(--alo-text)] focus:border-[var(--alo-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--alo-brand)]/30"
          />
        </label>
        <label className="block">
          <span className="sr-only">Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClass}>
            <option value="">All countries</option>
            {facets.countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Study level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectClass}>
            <option value="">All levels</option>
            {facets.levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Subject area</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectClass}>
            <option value="">All subjects</option>
            {facets.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button
          type="submit"
          className="h-12 rounded-xl bg-[var(--alo-brand)] px-6 font-heading text-sm font-bold text-white transition-colors hover:bg-[var(--alo-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2"
        >
          Search
        </button>
      </form>

      {/* Result count */}
      <p className="mt-6 text-sm text-[var(--alo-text-muted)]" role="status">
        {loading ? 'Loading courses…' : error ? '' : `${total.toLocaleString()} course${total === 1 ? '' : 's'} found`}
      </p>

      {/* States */}
      {error && (
        <div className="mt-4 rounded-2xl border border-[var(--alo-border)] bg-white p-8 text-center" role="alert">
          <p className="font-semibold text-[var(--alo-text)]">The course catalogue could not be loaded.</p>
          <p className="mt-1 text-sm text-[var(--alo-text-muted)]">{error}</p>
          <button
            type="button"
            onClick={() => void load(page)}
            className="mt-4 h-11 rounded-xl bg-[var(--alo-brand)] px-5 text-sm font-bold text-white hover:bg-[var(--alo-brand-hover)]"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[var(--alo-border)] bg-white p-5">
              <div className="h-4 w-2/3 rounded bg-[var(--alo-brand-light)]" />
              <div className="mt-3 h-3 w-1/2 rounded bg-[var(--alo-brand-light)]" />
              <div className="mt-6 h-3 w-full rounded bg-[var(--alo-brand-light)]" />
              <div className="mt-2 h-3 w-5/6 rounded bg-[var(--alo-brand-light)]" />
              <div className="mt-6 h-10 w-full rounded-xl bg-[var(--alo-brand-light)]" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="mt-4 rounded-2xl border border-[var(--alo-border)] bg-white p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-[var(--alo-brand)]" aria-hidden="true" />
          <p className="mt-3 font-semibold text-[var(--alo-text)]">No courses match your search yet.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--alo-text-muted)]">
            Try a broader subject or country — or tell us what you want to study and a counsellor
            will check availability against official university sources.
          </p>
          <Link
 href="/book-consultation"
 className="mt-5 inline-flex items-center rounded-xl bg-[var(--alo-cta)] px-5 font-heading text-sm font-bold text-black transition-colors hover:bg-[var(--alo-cta-hover)]"
 >
            Book Free Counseling
          </Link>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && courses.length > 0 && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const fee = verifiedFee(course);
            const intakes = (course.intakes ?? []).map(intakeLabel).filter(Boolean).slice(0, 3);
            return (
              <article
                key={course.id || course.courseId}
                className="flex h-full flex-col rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand-border)] hover:shadow-[0_12px_32px_-12px_rgba(0,87,184,0.25)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--alo-cta)]">
                  {course.subjectArea || 'Course'}
                </p>
                <h2 className="mt-2 font-heading text-[17px] font-bold leading-snug text-[var(--alo-text)]">
                  <Link href={`/course/${encodeURIComponent(course.slug || course.courseId)}`} className="hover:text-[var(--alo-brand)]">
                    {course.courseTitle}
                  </Link>
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--alo-body)]">
                  <Building2 className="h-4 w-4 shrink-0 text-[var(--alo-brand)]" aria-hidden="true" />
                  {course.universitySlug ? (
                    <Link href={`/universities/${encodeURIComponent(course.universitySlug)}`} className="font-medium hover:text-[var(--alo-brand)] hover:underline">
                      {course.universityName}
                    </Link>
                  ) : (
                    <span className="font-medium">{course.universityName}</span>
                  )}
                </p>

                <dl className="mt-4 space-y-1.5 text-[13px] text-[var(--alo-text-muted)]">
                  {(course.city || course.country) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{[course.city, course.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {(course.studyLevel || course.qualification) && (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{[course.studyLevel, course.qualification].filter(Boolean).join(' · ')}</span>
                    </div>
                  )}
                  {typeof course.durationMonths === 'number' && course.durationMonths > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{course.durationMonths} months{course.deliveryMode ? ` · ${course.deliveryMode}` : ''}</span>
                    </div>
                  )}
                  {typeof course.ieltsRequirement === 'number' && course.ieltsRequirement > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>IELTS {course.ieltsRequirement} (recorded requirement)</span>
                    </div>
                  )}
                </dl>

                {intakes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {intakes.map((label) => (
                      <span key={label} className="rounded-full bg-[var(--alo-brand-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--alo-brand)]">
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-sm">
                  {fee ? (
                    <span className="font-bold text-[var(--alo-text)]">{fee}</span>
                  ) : (
                    <span className="font-medium text-[var(--alo-text-muted)]">Fees pending verification</span>
                  )}
                </p>

                <div className="mt-auto flex gap-2 pt-5">
                  <Link
 href={`/course/${encodeURIComponent(course.slug || course.courseId)}`}
 className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--alo-brand)] px-4 font-heading text-[13px] font-bold text-white transition-colors hover:bg-[var(--alo-brand-hover)]"
 >
                    View Course
                  </Link>
                  <Link
 href={`/course-finder?subject=${encodeURIComponent(course.subjectArea || '')}`}
 className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--alo-brand)] px-4 font-heading text-[13px] font-bold text-[var(--alo-brand)] transition-colors hover:bg-[var(--alo-brand-light)]"
 >
                    Compare
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Course pages">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => void load(page - 1)}
            className="h-11 rounded-xl border border-[var(--alo-border)] bg-white px-4 text-sm font-semibold text-[var(--alo-brand)] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--alo-text-muted)]">Page {page} of {pages}</span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => void load(page + 1)}
            className="h-11 rounded-xl border border-[var(--alo-border)] bg-white px-4 text-sm font-semibold text-[var(--alo-brand)] disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
