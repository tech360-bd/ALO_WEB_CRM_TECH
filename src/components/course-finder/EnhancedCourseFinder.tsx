'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Clock, Globe, Calendar, Award, Filter, AlertTriangle, Building2 } from 'lucide-react';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';
import { COMPARE_MAX, readCompareList, subscribeCompare, toggleCompare } from '@/lib/course-finder/compare-list';

// ============================================================
// PUBLIC COURSE FINDER (/course-finder)
//
// Reads /api/course-finder — the same verified, source-linked course rules
// that the course detail pages enforce. Every filter is sent to the server.
// Filter state is mirrored into the URL so searches can be shared, refreshed,
// and navigated with the browser back button.
// ============================================================

type Filters = {
  search: string;
  country: string;
  city: string;
  campus: string;
  studyLevel: string;
  subject: string;
  discipline: string;
  university: string;
  intake: string;
  tuitionMin: string;
  tuitionMax: string;
  scholarship: string;
  appFee: string;
  deposit: string;
  englishTest: string;
  ieltsMin: string;
  duration: string;
  deadline: string;
};

const EMPTY_FILTERS: Filters = {
  search: '',
  country: '',
  city: '',
  campus: '',
  studyLevel: '',
  subject: '',
  discipline: '',
  university: '',
  intake: '',
  tuitionMin: '',
  tuitionMax: '',
  scholarship: '',
  appFee: '',
  deposit: '',
  englishTest: '',
  ieltsMin: '',
  duration: '',
  deadline: '',
};

// UI field → API query parameter name
const PARAM_NAME: Record<keyof Filters, string> = {
  search: 'search',
  country: 'country',
  city: 'city',
  campus: 'campus',
  studyLevel: 'studyLevel',
  subject: 'subjectArea',
  discipline: 'discipline',
  university: 'university',
  intake: 'intake',
  tuitionMin: 'tuitionMin',
  tuitionMax: 'tuitionMax',
  scholarship: 'scholarship',
  appFee: 'appFee',
  deposit: 'deposit',
  englishTest: 'englishTest',
  ieltsMin: 'ieltsMin',
  duration: 'duration',
  deadline: 'deadline',
};

const PAGE_SIZE = 24;

const COUNTRY_OPTIONS = [
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'UAE', label: 'Dubai / UAE' },
];

function filtersFromParams(sp: URLSearchParams): { filters: Filters; page: number } {
  const filters = { ...EMPTY_FILTERS };
  (Object.keys(PARAM_NAME) as (keyof Filters)[]).forEach((key) => {
    const value = sp.get(PARAM_NAME[key]);
    if (value) filters[key] = value;
  });
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  return { filters, page };
}

function buildQueryString(filters: Filters, page: number): string {
  const params = new URLSearchParams();
  (Object.keys(filters) as (keyof Filters)[]).forEach((key) => {
    const value = filters[key].trim();
    if (value) params.set(PARAM_NAME[key], value);
  });
  if (page > 1) params.set('page', String(page));
  return params.toString();
}

type CourseRow = {
  id: string;
  courseId: string;
  slug: string;
  courseTitle: string;
  universityName: string;
  universitySlug: string;
  universityId: string;
  country: string;
  city: string;
  campus: string;
  studyLevel: string;
  subjectArea: string;
  durationMonths: number | null;
  scholarships: boolean;
  yearlyTuition: number;
  tuitionCurrency: string;
  depositAmount: number;
  depositCurrency: string;
  appFeeAmount: number;
  appFeeCurrency: string;
  intakeMonth: string;
  intakeYear: number | null;
  applicationDeadline: string;
  courseSourceUrl: string;
  courseLastVerifiedAt: string;
};

type SearchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; courses: CourseRow[]; total: number; pages: number };

export default function EnhancedCourseFinder() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial state comes from the URL so shared links reproduce the same search.
  const initial = useMemo(() => filtersFromParams(new URLSearchParams(searchParams?.toString() || '')), []);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [page, setPage] = useState(initial.page);
  const [retryNonce, setRetryNonce] = useState(0);
  const [state, setState] = useState<SearchState>({ status: 'loading' });

  const queryString = useMemo(() => buildQueryString(filters, page), [filters, page]);

  // Mirror filters into the URL (replace, not push, so typing does not flood history).
  useEffect(() => {
    const target = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(target, { scroll: false });
  }, [queryString, pathname, router]);

  // Debounced, cancellable fetch. Stale responses are dropped by AbortController.
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/course-finder?${queryString}${queryString ? '&' : ''}limit=${PAGE_SIZE}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body || body.success === false) {
          throw new Error(body?.error || `Course search failed (HTTP ${response.status}). Please try again.`);
        }
        setState({
          status: 'ready',
          courses: Array.isArray(body.courses) ? body.courses : [],
          total: Number.isFinite(body.total) ? body.total : 0,
          pages: Number.isFinite(body.pages) ? body.pages : 0,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Course search failed. Please try again.';
        setState({ status: 'error', message });
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [queryString, retryNonce]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const activeCount = (Object.keys(filters) as (keyof Filters)[]).filter((key) => filters[key].trim()).length;
  const ready = state.status === 'ready' ? state : null;
  const totalPages = ready?.pages ?? 0;
  const firstResult = ready && ready.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = ready ? Math.min(page * PAGE_SIZE, ready.total) : 0;

  const field = 'bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11 w-full';
  const label = 'text-xs font-medium text-gray-600 mb-1 block';

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-12 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-4">Verified, source-linked courses</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">Find Your Course</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">
            Search verified course records across our partner destinations. Only courses with a published, verified record and a source link are listed. Where a fee, intake, or requirement is not recorded, the course page says so.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="p-5 lg:col-span-1 h-fit bg-white border-[#E2E8F0] rounded-2xl shadow-sm" aria-label="Course filters">
            <h2 className="font-semibold text-sm text-[#0F172A] mb-4 flex items-center gap-2"><Filter className="w-4 h-4 text-[#0057B8]" aria-hidden="true" />Filters{activeCount > 0 ? ` (${activeCount} active)` : ''}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="cf-search" className={label}>Course, subject or university</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                  <Input id="cf-search" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Course, university…" className="pl-9 bg-white border-[#E2E8F0] h-11" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-country" className={label}>Country</label>
                  <select id="cf-country" value={filters.country} onChange={(e) => updateFilter('country', e.target.value)} className={field}>
                    <option value="">All countries</option>
                    {COUNTRY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-city" className={label}>City</label>
                  <Input id="cf-city" value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} placeholder="London…" className="bg-white border-[#E2E8F0] h-11 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="cf-campus" className={label}>Campus</label>
                <Input id="cf-campus" value={filters.campus} onChange={(e) => updateFilter('campus', e.target.value)} placeholder="Main campus…" className="bg-white border-[#E2E8F0] h-11 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-level" className={label}>Study level</label>
                  <select id="cf-level" value={filters.studyLevel} onChange={(e) => updateFilter('studyLevel', e.target.value)} className={field}>
                    <option value="">All levels</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-subject" className={label}>Subject</label>
                  <Input id="cf-subject" value={filters.subject} onChange={(e) => updateFilter('subject', e.target.value)} placeholder="Business…" className="bg-white border-[#E2E8F0] h-11 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="cf-discipline" className={label}>Discipline</label>
                <Input id="cf-discipline" value={filters.discipline} onChange={(e) => updateFilter('discipline', e.target.value)} placeholder="Computer Science…" className="bg-white border-[#E2E8F0] h-11 text-sm" />
              </div>
              <div>
                <label htmlFor="cf-university" className={label}>University</label>
                <Input id="cf-university" value={filters.university} onChange={(e) => updateFilter('university', e.target.value)} placeholder="University name or slug…" className="bg-white border-[#E2E8F0] h-11 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-intake" className={label}>Intake month</label>
                  <select id="cf-intake" value={filters.intake} onChange={(e) => updateFilter('intake', e.target.value)} className={field}>
                    <option value="">Any intake</option>
                    {['January', 'May', 'September'].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-duration" className={label}>Duration</label>
                  <select id="cf-duration" value={filters.duration} onChange={(e) => updateFilter('duration', e.target.value)} className={field}>
                    <option value="">Any duration</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="48">48 months</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-tmin" className={label}>Tuition min / yr</label>
                  <Input id="cf-tmin" type="number" min={0} inputMode="numeric" value={filters.tuitionMin} onChange={(e) => updateFilter('tuitionMin', e.target.value)} placeholder="0" className="bg-white border-[#E2E8F0] h-11 text-sm" />
                </div>
                <div>
                  <label htmlFor="cf-tmax" className={label}>Tuition max / yr</label>
                  <Input id="cf-tmax" type="number" min={0} inputMode="numeric" value={filters.tuitionMax} onChange={(e) => updateFilter('tuitionMax', e.target.value)} placeholder="No limit" className="bg-white border-[#E2E8F0] h-11 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-scholarship" className={label}>Scholarship</label>
                  <select id="cf-scholarship" value={filters.scholarship} onChange={(e) => updateFilter('scholarship', e.target.value)} className={field}>
                    <option value="">All courses</option>
                    <option value="yes">Scholarship recorded</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-appfee" className={label}>Application fee</label>
                  <select id="cf-appfee" value={filters.appFee} onChange={(e) => updateFilter('appFee', e.target.value)} className={field}>
                    <option value="">Any</option>
                    <option value="waived">Fee waived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-deposit" className={label}>Deposit</label>
                  <select id="cf-deposit" value={filters.deposit} onChange={(e) => updateFilter('deposit', e.target.value)} className={field}>
                    <option value="">Any</option>
                    <option value="low">Low deposit</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-deadline" className={label}>Deadline</label>
                  <select id="cf-deadline" value={filters.deadline} onChange={(e) => updateFilter('deadline', e.target.value)} className={field}>
                    <option value="">Any</option>
                    <option value="recorded">Deadline recorded</option>
                    <option value="rolling">Rolling</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cf-english" className={label}>English test</label>
                  <select id="cf-english" value={filters.englishTest} onChange={(e) => updateFilter('englishTest', e.target.value)} className={field}>
                    <option value="">Any test</option>
                    <option value="ielts">IELTS</option>
                    <option value="pte">PTE Academic</option>
                    <option value="toefl">TOEFL iBT</option>
                    <option value="duolingo">Duolingo</option>
                    <option value="moi">MOI</option>
                    <option value="oietc">OIETC</option>
                    <option value="oxford">Oxford ELLT</option>
                    <option value="languagecert">LanguageCert</option>
                    <option value="oet">OET</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cf-ielts" className={label}>My IELTS overall</label>
                  <Input id="cf-ielts" type="number" min={0} max={9} step={0.5} value={filters.ieltsMin} onChange={(e) => updateFilter('ieltsMin', e.target.value)} placeholder="e.g. 6.5" className="bg-white border-[#E2E8F0] h-11 text-sm" />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">IELTS: shows courses whose verified IELTS requirement is at or below your score.</p>
              <Button variant="outline" onClick={clearAll} disabled={activeCount === 0} className="w-full border-[#E2E8F0] h-12">Clear all filters</Button>
              <TestPreparationMiniCard compact contextTitle="Prepare for English proficiency tests for this course" />
              <p className="text-[11px] text-gray-500 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Commission, internal notes and partner information are never shown on this page.</p>
            </div>
          </Card>

          <div className="lg:col-span-3 space-y-4" aria-live="polite">
            {state.status === 'loading' && (
              <div className="grid sm:grid-cols-2 gap-4" aria-label="Loading courses" aria-busy="true">
                {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}
              </div>
            )}

            {state.status === 'error' && (
              <Card className="p-8 bg-red-50 border-red-200 rounded-2xl text-center" role="alert">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" aria-hidden="true" />
                <p className="font-semibold text-red-900">Courses could not be loaded.</p>
                <p className="text-sm text-red-800 mt-1">{state.message}</p>
                <Button onClick={() => setRetryNonce((n) => n + 1)} className="mt-4 bg-[#0057B8] text-white h-12">Try again</Button>
              </Card>
            )}

            {ready && ready.total === 0 && (
              <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-semibold text-gray-700">No courses match your current filters.</p>
                <p className="text-xs text-gray-500 mt-2">Try removing a filter. Only verified, source-linked courses are listed.</p>
                {activeCount > 0 && <Button variant="outline" onClick={clearAll} className="mt-4 border-[#E2E8F0] h-12">Clear all filters</Button>}
              </Card>
            )}

            {ready && ready.total > 0 && (
              <>
                <p className="text-sm text-gray-600">Showing {firstResult}–{lastResult} of {ready.total} courses</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ready.courses.map((c) => (
                    <Card key={c.courseId} className="p-5 bg-white border-[#E2E8F0] hover:border-[#0057B8] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-[10px]">{c.studyLevel || 'Level not recorded'}</Badge>
                          {c.yearlyTuition > 0
                            ? <span className="text-xs font-bold text-[#0F172A]">{c.tuitionCurrency} {c.yearlyTuition.toLocaleString()}/yr</span>
                            : <span className="text-[11px] text-gray-500">Fee information requires counselor verification</span>}
                        </div>
                        <h2 className="font-bold text-sm text-[#0F172A] line-clamp-2 mb-1">{c.courseTitle}</h2>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                          <Building2 className="w-3 h-3" aria-hidden="true" />
                          {c.universitySlug
                            ? <Link href={`/universities/${encodeURIComponent(c.universitySlug)}`} className="text-[#0057B8] underline">{c.universityName}</Link>
                            : c.universityName}
                          {' · '}{[c.city, c.country].filter(Boolean).join(', ') || 'Location not recorded'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{c.durationMonths ? `${Math.round((c.durationMonths / 12) * 10) / 10} yr` : 'Duration not recorded'}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" />{c.intakeMonth ? `${c.intakeMonth}${c.intakeYear ? ` ${c.intakeYear}` : ''}` : 'Intake not recorded'}</span>
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" aria-hidden="true" />{c.country || 'Country not recorded'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.scholarships && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"><Award className="w-3 h-3 mr-1" aria-hidden="true" />Scholarship recorded</Badge>}
                          {c.applicationDeadline && <Badge className="bg-[#F8FAFC] text-slate-700 border-[#E2E8F0] text-[10px]">Deadline: {c.applicationDeadline}</Badge>}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                          Source: {c.courseSourceUrl ? <a href={c.courseSourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#0057B8] underline">Official record</a> : 'not recorded'}
                          {' · '}Last verified: {c.courseLastVerifiedAt ? new Date(c.courseLastVerifiedAt).toLocaleDateString() : 'not recorded'}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link href={`/course/${encodeURIComponent(c.slug || c.courseId)}`} className="block col-span-1">
                          <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003F87] h-12 text-xs font-bold">View course</Button>
                        </Link>
                        <Link href="/eligibility-check" className="block col-span-1">
                          <Button variant="outline" className="w-full h-12 text-xs border-[#E2E8F0]">Check eligibility</Button>
                        </Link>
                        <CompareToggle id={c.slug || c.courseId} title={c.courseTitle} />
                      </div>
                    </Card>
                  ))}
                </div>
                <nav className="flex justify-between items-center pt-4 text-xs text-gray-600" aria-label="Course results pages">
                  <span>Page {page} of {Math.max(1, totalPages)}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-[#E2E8F0] h-12 px-4" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                    <Button size="sm" variant="outline" className="border-[#E2E8F0] h-12 px-4" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Adds/removes a course from the browser-side compare list (max 4) and links to /compare. */
function CompareToggle({ id, title }: { id: string; title: string }) {
  const [list, setList] = useState<string[]>([]);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const sync = () => setList(readCompareList());
    sync();
    return subscribeCompare(sync);
  }, []);
  const inList = list.includes(id);
  return (
    <div className="col-span-2 flex items-center justify-between gap-2 text-xs">
      <Button
        type="button"
        variant="outline"
        className="h-11 px-4 text-xs border-[#E2E8F0]"
        aria-pressed={inList}
        aria-label={inList ? `Remove ${title} from comparison` : `Add ${title} to comparison`}
        onClick={() => {
          const next = toggleCompare(id);
          if (next === null) { setFull(true); return; }
          setFull(false);
          setList(next);
        }}
      >
        {inList ? 'Remove from compare' : 'Add to compare'}
      </Button>
      {full && <span role="status" className="text-red-700">You can compare up to {COMPARE_MAX} courses.</span>}
      {list.length > 0 && !full && (
        <Link href={`/compare?courses=${encodeURIComponent(list.join(','))}`} className="text-[#0057B8] underline">Compare ({list.length})</Link>
      )}
    </div>
  );
}
