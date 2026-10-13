'use client';

/**
 * ALO Education — PUBLIC COURSE FINDER
 *
 * Two tabs, exactly as specified:
 *   COURSES       Subject/Course · Study Level · Destination Country · Intake (optional, multi-month)
 *   UNIVERSITIES  I'm looking for (subject) · I want to study in (university name)
 *
 * Both forms post to the public catalogue APIs (/api/course-finder,
 * /api/course-finder/universities) which only ever return published, verified,
 * source-linked rows — so a result never links to a "not available" page.
 *
 * Result table columns: Course Name · University Name · Tuition Fee ·
 * Interview Required · Intake · World Ranking · Apply Now.
 *
 * Apply Now requires an account: it always routes through /apply/[course], and
 * that page refuses to submit until the student's portal Form B is complete
 * (enforced server-side in /api/applications, not just in the UI).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

interface CourseIntake {
  intakeYear: number | null;
  intakeMonth: string;
  intakeName: string;
  applicationDeadline: string;
  yearlyTuition: number;
  tuitionCurrency: string;
}

interface CourseRow {
  id: string;
  courseId: string;
  slug: string;
  courseTitle: string;
  universityName: string;
  universitySlug: string;
  universityWorldRanking: number;
  studyLevel: string;
  subjectArea: string;
  country: string;
  city: string;
  yearlyTuition: number;
  tuitionCurrency: string;
  tuitionPeriod: string;
  applicationDeadline: string;
  interviews: string;
  interviewRequired: boolean | null;
  portfolioRequired: boolean | null;
  ieltsRequirement: number | null;
  intakes: CourseIntake[];
}

interface UniversityRow {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  worldRanking: number | null;
  courseCount: number;
}

interface Facets {
  subjects: string[];
  countries: string[];
  levels: string[];
  universities: { slug: string; name: string; country: string; worldRanking: number | null; courseCount: number }[];
  recordedIntakeMonths: number[];
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Study levels as specified: Foundation, UG, PG, MRes, PhD. */
const STUDY_LEVELS = [
  { value: 'Foundation', label: 'Foundation' },
  { value: 'Undergraduate', label: 'UG — Undergraduate' },
  { value: 'Postgraduate', label: 'PG — Postgraduate' },
  { value: 'MRes', label: 'MRes — Master of Research' },
  { value: 'PhD', label: 'PhD / Doctorate' },
] as const;

const DEFAULT_INTAKE_YEAR = 2027;
const PAGE_SIZE = 24;

const EMPTY_FACETS: Facets = {
  subjects: [],
  countries: [],
  levels: [],
  universities: [],
  recordedIntakeMonths: [],
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function money(amount: number, currency: string): string {
  if (!amount || amount <= 0) return 'Not recorded';
  const code = currency || '';
  const formatted = amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return code ? `${code} ${formatted}` : formatted;
}

function monthNumber(value: string): number | null {
  const clean = String(value || '').trim().toLowerCase();
  if (/^\d{1,2}$/.test(clean)) {
    const month = Number(clean);
    return month >= 1 && month <= 12 ? month : null;
  }
  if (!clean) return null;
  const index = MONTH_LABELS.findIndex((label) => label.toLowerCase() === clean.slice(0, 3));
  return index >= 0 ? index + 1 : null;
}

function intakeLabel(intake: CourseIntake): string {
  const month = monthNumber(intake.intakeMonth);
  const name = month ? MONTH_LABELS[month - 1] : intake.intakeMonth || intake.intakeName;
  return [name, intake.intakeYear].filter(Boolean).join(' ');
}

function interviewCell(row: CourseRow): { text: string; tone: string } {
  if (row.interviewRequired === true) return { text: 'Yes', tone: 'text-amber-700' };
  if (row.interviewRequired === false) return { text: 'No', tone: 'text-emerald-700' };
  return { text: '—', tone: 'text-alo-text-muted' };
}

/* ------------------------------------------------------------------ */
/*  SMALL BUILDING BLOCKS                                              */
/* ------------------------------------------------------------------ */

function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-heading text-[12px] font-bold text-alo-text">
      {children}
      {hint && <span className="ml-1.5 font-sans text-[11px] font-medium text-alo-text-muted">{hint}</span>}
    </label>
  );
}

const CONTROL_CLASS =
  'h-11 w-full rounded-input border border-alo-border bg-white px-3 text-sm text-alo-text outline-none transition-colors placeholder:text-alo-placeholder focus:border-alo-brand focus:ring-2 focus:ring-alo-brand/20';

function Tabs({ active, onChange }: { active: 'courses' | 'universities'; onChange: (tab: 'courses' | 'universities') => void }) {
  const tabs = [
    { id: 'courses' as const, label: 'COURSES' },
    { id: 'universities' as const, label: 'UNIVERSITIES' },
  ];
  return (
    <div role="tablist" aria-label="Course finder mode" className="flex gap-1 rounded-t-xl border border-b-0 border-alo-border bg-alo-page p-1.5">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 font-heading text-[13px] font-extrabold tracking-[0.08em] transition-colors sm:flex-none sm:px-8 ${
              selected
                ? 'bg-alo-brand text-white shadow-sm'
                : 'bg-white text-alo-text hover:bg-alo-brand-light hover:text-alo-brand'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function PublicCourseFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialised = useRef(false);

  const [tab, setTab] = useState<'courses' | 'universities'>(
    searchParams.get('tab') === 'universities' ? 'universities' : 'courses'
  );
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);

  /* COURSES form */
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [level, setLevel] = useState(searchParams.get('studyLevel') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [universityFilter, setUniversityFilter] = useState(searchParams.get('university') || '');
  const [intakeYear, setIntakeYear] = useState<number>(
    Number(searchParams.get('year')) || DEFAULT_INTAKE_YEAR
  );
  const [intakeMonths, setIntakeMonths] = useState<number[]>([]);

  /* UNIVERSITIES form */
  const [lookingFor, setLookingFor] = useState('');
  const [studyIn, setStudyIn] = useState('');

  /* results */
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  /* ── Facets (subjects / countries / university names) ─────────────── */
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
          universities: json.universities ?? [],
          recordedIntakeMonths: json.recordedIntakeMonths ?? [],
        });
      })
      .catch(() => {
        /* dropdowns fall back to free text — search still works */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Search ───────────────────────────────────────────────────────── */
  const runCourseSearch = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (subject) params.set('subjectArea', subject);
        if (level) params.set('studyLevel', level);
        if (country) params.set('country', country);
        if (universityFilter) params.set('university', universityFilter);
        if (intakeMonths.length) {
          for (const month of intakeMonths) params.append('intakeMonth', String(month));
          params.set('year', String(intakeYear));
        }
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
        setSearched(true);
      }
    },
    [subject, level, country, universityFilter, intakeMonths, intakeYear]
  );

  const runUniversitySearch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (studyIn) params.set('search', studyIn);
      if (lookingFor) params.set('subjectArea', lookingFor);
      if (country) params.set('countries', country);
      params.set('limit', '60');
      params.set('sort', 'name');

      const res = await fetch(`/api/course-finder/universities?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'University search failed.');
      setUniversities(json.universities ?? []);
    } catch (err) {
      setUniversities([]);
      setError(err instanceof Error ? err.message : 'University search failed.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [studyIn, lookingFor, country]);

  /* Show the catalogue immediately on first load (no empty screen). */
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    if (searchParams.get('tab') === 'universities') void runUniversitySearch();
    else void runCourseSearch(1);
  }, [runCourseSearch, runUniversitySearch, searchParams]);

  /* ── Tab switch ───────────────────────────────────────────────────── */
  const changeTab = (next: 'courses' | 'universities') => {
    setTab(next);
    setSearched(false);
    if (next === 'universities') void runUniversitySearch();
    else void runCourseSearch(1);

    const params = new URLSearchParams(searchParams.toString());
    if (next === 'universities') params.set('tab', 'universities');
    else params.delete('tab');
    const query = params.toString();
    router.replace(query ? `/course-finder?${query}` : '/course-finder', { scroll: false });
  };

  const toggleMonth = (month: number) => {
    setIntakeMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  const resetCourseForm = () => {
    setSubject('');
    setLevel('');
    setCountry('');
    setUniversityFilter('');
    setIntakeMonths([]);
    setIntakeYear(DEFAULT_INTAKE_YEAR);
  };

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => DEFAULT_INTAKE_YEAR + index),
    []
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-alo-text sm:text-4xl">
          Course Finder
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-alo-text-secondary">
          Search verified published courses and universities. Every result links to a page that exists —
          fees, intakes and deadlines are shown only where the institution publishes them.
        </p>
      </header>

      <Tabs active={tab} onChange={changeTab} />

      <div className="rounded-b-xl border border-alo-border bg-white p-4 shadow-sm sm:p-6">
        {/* ── COURSES tab ─────────────────────────────────────────────── */}
        {tab === 'courses' && (
          <div role="tabpanel" id="panel-courses" aria-labelledby="tab-courses">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <FieldLabel htmlFor="cf-subject" hint="dropdown or type">
                  Subject / Course
                </FieldLabel>
                <input
                  id="cf-subject"
                  list="cf-subject-options"
                  className={CONTROL_CLASS}
                  placeholder="e.g. Business, Computing, Nursing"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void runCourseSearch(1);
                  }}
                />
                <datalist id="cf-subject-options">
                  {facets.subjects.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <FieldLabel htmlFor="cf-level">Study Level</FieldLabel>
                <select
                  id="cf-level"
                  className={CONTROL_CLASS}
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                >
                  <option value="">All levels</option>
                  {STUDY_LEVELS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="cf-country">Destination Country</FieldLabel>
                <input
                  id="cf-country"
                  list="cf-country-options"
                  className={CONTROL_CLASS}
                  placeholder="e.g. United Kingdom"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                />
                <datalist id="cf-country-options">
                  {facets.countries.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  onClick={() => void runCourseSearch(1)}
                  disabled={loading}
                  className="h-11 flex-1 gap-2 bg-alo-cta font-heading text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-alo-cta-hover"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetCourseForm();
                    void runCourseSearch(1);
                  }}
                  className="h-11 px-3"
                  aria-label="Reset course filters"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {universityFilter && (
              <div className="mt-4 flex items-center gap-2 text-[12px]">
                <span className="rounded-full border border-alo-brand-border bg-alo-brand-light px-3 py-1.5 font-semibold text-alo-brand">
                  University filter: {universityFilter}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUniversityFilter('');
                    void runCourseSearch(1);
                  }}
                  className="font-semibold text-alo-text-muted underline underline-offset-2 hover:text-alo-cta"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Intake — optional, multi-month, Jan–Dec of the chosen year */}
            <div className="mt-5 rounded-xl border border-alo-border bg-alo-page p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-alo-cta" aria-hidden="true" />
                  <span className="font-heading text-[12px] font-bold text-alo-text">
                    Intake <span className="font-sans text-[11px] font-medium text-alo-text-muted">(optional — select one or more months)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="cf-intake-year" className="text-[12px] font-medium text-alo-text-secondary">
                    Year
                  </label>
                  <select
                    id="cf-intake-year"
                    className="h-9 rounded-input border border-alo-border bg-white px-2 text-sm"
                    value={intakeYear}
                    onChange={(event) => setIntakeYear(Number(event.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIntakeMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                    className="text-[12px] font-semibold text-alo-brand underline underline-offset-2 hover:text-alo-cta"
                  >
                    All months
                  </button>
                  {intakeMonths.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIntakeMonths([])}
                      className="text-[12px] font-semibold text-alo-text-muted underline underline-offset-2 hover:text-alo-cta"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {MONTH_LABELS.map((label, index) => {
                  const month = index + 1;
                  const selected = intakeMonths.includes(month);
                  const recorded = facets.recordedIntakeMonths.includes(month);
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleMonth(month)}
                      className={`rounded-full border px-3.5 py-2 font-heading text-[12px] font-bold transition-colors ${
                        selected
                          ? 'border-alo-cta bg-alo-cta text-white'
                          : 'border-alo-border bg-white text-alo-text hover:border-alo-brand hover:text-alo-brand'
                      }`}
                      title={recorded ? `${label} ${intakeYear} intakes are recorded` : `${label} ${intakeYear}`}
                    >
                      {label} {intakeYear}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── UNIVERSITIES tab ────────────────────────────────────────── */}
        {tab === 'universities' && (
          <div role="tabpanel" id="panel-universities" aria-labelledby="tab-universities">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <FieldLabel htmlFor="cf-looking-for" hint="dropdown or type">
                  I&apos;m looking for
                </FieldLabel>
                <input
                  id="cf-looking-for"
                  list="cf-subject-options-uni"
                  className={CONTROL_CLASS}
                  placeholder="Subject, e.g. Business"
                  value={lookingFor}
                  onChange={(event) => setLookingFor(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void runUniversitySearch();
                  }}
                />
                <datalist id="cf-subject-options-uni">
                  {facets.subjects.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <FieldLabel htmlFor="cf-study-in" hint="dropdown or type">
                  I want to study in
                </FieldLabel>
                <input
                  id="cf-study-in"
                  list="cf-university-options"
                  className={CONTROL_CLASS}
                  placeholder="University name"
                  value={studyIn}
                  onChange={(event) => setStudyIn(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void runUniversitySearch();
                  }}
                />
                <datalist id="cf-university-options">
                  {facets.universities.map((item) => (
                    <option key={item.slug} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => void runUniversitySearch()}
                  disabled={loading}
                  className="h-11 w-full gap-2 bg-alo-cta font-heading text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-alo-cta-hover"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-alo-text-muted">
              Prefer a country instead? Switch to the COURSES tab and pick a destination, or{' '}
              <Link href="/destinations" className="font-semibold text-alo-brand underline">
                browse destinations
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────────── */}
      <div className="mt-8">
        {error && (
          <div role="alert" className="rounded-xl border border-alo-error/30 bg-alo-error-soft p-4 text-sm text-alo-error">
            {error}
          </div>
        )}

        {tab === 'courses' && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-alo-text-secondary">
                {loading ? 'Searching…' : `${total.toLocaleString()} course${total === 1 ? '' : 's'} match your filters`}
              </p>
              {pages > 1 && (
                <p className="text-[12px] text-alo-text-muted">
                  Page {page} of {pages}
                </p>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-alo-border bg-white shadow-sm">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <caption className="sr-only">Course finder results</caption>
                <thead>
                  <tr className="bg-alo-page text-left">
                    {['Course Name', 'University Name', 'Tuition Fee', 'Interview Required', 'Intake', 'World Ranking', ''].map(
                      (heading) => (
                        <th
                          key={heading || 'action'}
                          scope="col"
                          className="whitespace-nowrap px-4 py-3 font-heading text-[11px] font-extrabold uppercase tracking-[0.08em] text-alo-text"
                        >
                          {heading || <span className="sr-only">Apply</span>}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {!loading && courses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-alo-text-secondary">
                        No published course matches these filters. Try clearing the intake months or the subject.
                      </td>
                    </tr>
                  )}
                  {courses.map((course) => {
                    const interview = interviewCell(course);
                    const intakeText = course.intakes
                      .map(intakeLabel)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(' · ');
                    return (
                      <tr key={course.id} className="border-t border-alo-border align-top hover:bg-alo-page/60">
                        <td className="px-4 py-3">
                          <Link
                            href={`/course/${encodeURIComponent(course.slug || course.courseId)}`}
                            className="font-heading text-[13px] font-bold text-alo-brand underline-offset-2 hover:underline"
                          >
                            {course.courseTitle}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-alo-text-muted">
                            {[course.studyLevel, course.subjectArea].filter(Boolean).join(' · ') || 'Level not recorded'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/universities/${encodeURIComponent(course.universitySlug)}`}
                            className="text-[13px] font-semibold text-alo-text underline-offset-2 hover:text-alo-brand hover:underline"
                          >
                            {course.universityName}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-alo-text-muted">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {[course.city, course.country].filter(Boolean).join(', ') || 'Location not recorded'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-alo-text">
                          {money(course.yearlyTuition, course.tuitionCurrency)}
                          {course.tuitionPeriod && course.yearlyTuition > 0 && (
                            <span className="block text-[11px] text-alo-text-muted">{course.tuitionPeriod}</span>
                          )}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 text-[13px] font-semibold ${interview.tone}`}>
                          {interview.text}
                          {course.portfolioRequired === true && course.interviewRequired === false && (
                            <span className="block text-[11px] font-normal text-amber-700">Portfolio required</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-alo-text-secondary">
                          {intakeText || 'Not recorded'}
                          {course.applicationDeadline && (
                            <span className="mt-0.5 block text-[11px] text-alo-text-muted">
                              Deadline: {course.applicationDeadline}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-alo-text">
                          {course.universityWorldRanking > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5 text-alo-cta-accent" aria-hidden="true" />
                              #{course.universityWorldRanking}
                            </span>
                          ) : (
                            <span className="text-alo-text-muted">Not ranked</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link
                            href={`/apply/${encodeURIComponent(course.slug || course.courseId)}`}
                            className="inline-flex h-10 items-center gap-1.5 rounded-button bg-alo-cta px-4 font-heading text-[12px] font-bold text-white transition-colors hover:bg-alo-cta-hover"
                          >
                            Apply Now
                          </Link>
                          <span className="mt-1 block text-[10px] text-alo-text-muted">Login / Register required</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={page <= 1 || loading}
                  onClick={() => void runCourseSearch(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-alo-text-secondary">
                  Page {page} / {pages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  disabled={page >= pages || loading}
                  onClick={() => void runCourseSearch(page + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {tab === 'universities' && (
          <div className="overflow-x-auto rounded-xl border border-alo-border bg-white shadow-sm">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <caption className="sr-only">University finder results</caption>
              <thead>
                <tr className="bg-alo-page text-left">
                  {['University', 'Location', 'World Ranking', 'Courses', ''].map((heading) => (
                    <th
                      key={heading || 'action'}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-heading text-[11px] font-extrabold uppercase tracking-[0.08em] text-alo-text"
                    >
                      {heading || <span className="sr-only">Open</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && universities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-alo-text-secondary">
                      No published university matches that search yet.
                    </td>
                  </tr>
                )}
                {universities.map((university) => (
                  <tr key={university.id} className="border-t border-alo-border hover:bg-alo-page/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/universities/${encodeURIComponent(university.slug)}`}
                        className="inline-flex items-center gap-2 font-heading text-[13px] font-bold text-alo-brand underline-offset-2 hover:underline"
                      >
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                        {university.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-alo-text-secondary">
                      {[university.city, university.country].filter(Boolean).join(', ') || 'Not recorded'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-alo-text">
                      {university.worldRanking ? `#${university.worldRanking}` : <span className="text-alo-text-muted">Not ranked</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-alo-text-secondary">
                      {university.courseCount > 0 ? `${university.courseCount} published` : 'None published'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/course-finder?university=${encodeURIComponent(university.slug)}`}
                        className="inline-flex h-10 items-center rounded-button border border-alo-brand px-4 font-heading text-[12px] font-bold text-alo-brand transition-colors hover:bg-alo-brand-light"
                      >
                        View courses
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!searched && !loading && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-alo-text-secondary">
            <CheckCircle2 className="h-4 w-4 text-alo-success" aria-hidden="true" />
            Showing the full published catalogue — narrow it with the filters above.
          </p>
        )}
      </div>
    </section>
  );
}
