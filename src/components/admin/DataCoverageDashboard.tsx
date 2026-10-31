'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, BookOpen, Building2, CalendarDays,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, Database, ExternalLink, Filter,
  Globe2, Image as ImageIcon, RefreshCw, Search, ShieldAlert, ShieldCheck, Sparkles,
  Tag, Users,
} from 'lucide-react';

type CoverageData = {
  generatedAt: string;
  scope: string;
  completeness: { overall: number | null; universities: number | null; courses: number | null; intakes: number | null };
  universities: { discovered: number; total: number; verified: number; requiringResearch: number; noCourses: number; missingSource: number; missingLocation: number; missingImages: number };
  courses: { discovered: number; total: number; verified: number; requiringResearch: number; expired: number; conflicting: number; missingTuition: number; missingIntake: number; missingRequirements: number; missingEnglish: number; missingSource: number; missingInternationalEligibility: number };
  intakeWindow: { start: string; end: string; discovered: number; verified: number; requiringResearch: number; months: Array<{ label: string; discovered: number; verified: number; requiringResearch: number; coverage: number | null }> };
  referenceData: { countries: number; subjects: number; degrees: number };
  conflicts: { pending: number; records: Array<any> };
  researchQueue: { courses: Array<any>; universities: Array<any> };
  distribution: { universitiesByCountry: Array<{ country: string; count: number }>; coursesBySubject: Array<{ subject: string; count: number }> };
};

type FilterState = { country: string; university: string; intake: string; year: string; subject: string; degree: string };

const emptyFilters: FilterState = { country: 'all', university: 'all', intake: 'all', year: 'all', subject: 'all', degree: 'all' };

function percentLabel(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${value.toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString();
}

function MetricCard({ title, value, hint, icon: Icon, accent, link }: { title: string; value: number | string; hint: string; icon: typeof Database; accent: string; link?: string }) {
  const content = <div className="group rounded-2xl border border-[var(--alo-border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><div className="flex items-start justify-between"><div><div className="text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--alo-text-muted)]">{title}</div><div className="mt-2 text-2xl font-black tracking-tight text-[var(--alo-text)]">{value}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{hint}</div></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}><Icon className="h-5 w-5" /></div></div>{link && <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[var(--alo-brand)]">Open records <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></div>}</div>;
  return link ? <Link href={link}>{content}</Link> : content;
}

function CoverageBar({ value, label }: { value: number | null; label: string }) {
  const safeValue = value ?? 0;
  return <div><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="font-semibold text-[var(--alo-body)]">{label}</span><span className="font-bold text-[var(--alo-text)]">{percentLabel(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]"><div className={`h-full rounded-full transition-all ${safeValue >= 90 ? 'bg-[var(--alo-success)]' : safeValue >= 75 ? 'bg-[var(--alo-brand)]' : 'bg-orange-400'}`} style={{ width: `${safeValue}%` }} /></div></div>;
}

export default function DataCoverageDashboard() {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'courses' | 'universities' | 'conflicts'>('courses');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/data-coverage', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || (response.status === 401 ? 'Log in with an authorized admin account to view live coverage.' : 'Coverage could not be loaded.'));
      setData(payload as CoverageData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Coverage could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const countries = useMemo(() => [...new Set((data?.researchQueue.courses || []).map((course) => course.country || course.university?.country).filter(Boolean))].sort(), [data]);
  const universities = useMemo(() => [...new Set((data?.researchQueue.courses || []).map((course) => course.university?.name).filter(Boolean))].sort(), [data]);
  const subjects = useMemo(() => [...new Set((data?.researchQueue.courses || []).map((course) => course.subjectArea).filter(Boolean))].sort(), [data]);
  const degrees = useMemo(() => [...new Set((data?.researchQueue.courses || []).map((course) => course.studyLevel).filter(Boolean))].sort(), [data]);

  const filteredCourses = useMemo(() => (data?.researchQueue.courses || []).filter((course) => {
    const text = `${course.courseTitle} ${course.courseId} ${course.university?.name} ${course.country} ${course.subjectArea}`.toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (filters.country !== 'all' && (course.country || course.university?.country) !== filters.country) return false;
    if (filters.university !== 'all' && course.university?.name !== filters.university) return false;
    if (filters.subject !== 'all' && course.subjectArea !== filters.subject) return false;
    if (filters.degree !== 'all' && course.studyLevel !== filters.degree) return false;
    if (filters.intake !== 'all' && !(course.intakeFees || []).some((intake: any) => `${intake.intakeMonth} ${intake.intakeYear}` === filters.intake)) return false;
    if (filters.year !== 'all' && !(course.intakeFees || []).some((intake: any) => String(intake.intakeYear) === filters.year)) return false;
    return true;
  }), [data, filters, search]);

  const filteredUniversities = useMemo(() => (data?.researchQueue.universities || []).filter((university) => {
    const text = `${university.name} ${university.country} ${university.city} ${university.universityId}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (filters.country === 'all' || university.country === filters.country);
  }), [data, filters.country, search]);

  const filterControl = (key: keyof FilterState, label: string, options: Array<string>) => <label key={key} className="min-w-[120px] flex-1"><span className="text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]">{label}</span><select value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-[var(--alo-border)] bg-white px-2.5 text-[11px] font-medium text-[var(--alo-body)] outline-none focus:border-[var(--alo-brand-border)]"><option value="all">All {label.toLowerCase()}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;

  if (loading) return <div className="min-h-screen bg-[var(--alo-page)] p-5"><div className="mx-auto max-w-[1500px] space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-white" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div></div></div>;

  return (
    <div className="min-h-screen bg-[var(--alo-page)] p-4 text-[var(--alo-text)] sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--alo-brand)]"><Activity className="h-3.5 w-3.5" />Global course intelligence</div><h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--alo-text)]">Data coverage & quality</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--alo-text-muted)]">Measure discovered, verified, missing and conflicting records from the live ALO database. Coverage figures are computed, not estimates.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Link href="/admin/research" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><Search className="h-3.5 w-3.5" />Research queue</Link><Link href="/admin/university-data" className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--alo-brand)] px-3 text-[11px] font-bold text-white hover:bg-[var(--alo-brand-hover)]"><Sparkles className="h-3.5 w-3.5" />Open data review</Link><button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)] disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div>
        </header>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-crm-danger-border bg-crm-danger-bg p-4 text-xs text-crm-danger-text"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

        {data && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Universities discovered" value={formatNumber(data.universities.discovered)} hint={`${formatNumber(data.universities.verified)} verified · ${formatNumber(data.universities.requiringResearch)} research required`} icon={Building2} accent="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]" link="/admin/universities" />
            <MetricCard title="Courses discovered" value={formatNumber(data.courses.discovered)} hint={`${formatNumber(data.courses.verified)} verified · ${formatNumber(data.courses.requiringResearch)} research required`} icon={BookOpen} accent="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]" link="/admin/courses" />
            <MetricCard title="Jan 2027 — Jan 2028 intakes" value={formatNumber(data.intakeWindow.discovered)} hint={`${formatNumber(data.intakeWindow.verified)} verified intake records`} icon={CalendarDays} accent="bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" />
            <MetricCard title="Conflicts pending review" value={formatNumber(data.conflicts.pending)} hint="Conflicting values never overwrite verified data" icon={ShieldAlert} accent="bg-crm-warning-bg text-crm-warning-text" link="/admin/data-conflicts" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-crm-success-text" /><h2 className="text-sm font-bold text-[var(--alo-text)]">Data completeness</h2></div><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Calculated from verification, source, relationship and required-field coverage.</p></div><span className="rounded-full bg-[var(--alo-surface-muted)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--alo-body)]">Live DB · {new Date(data.generatedAt).toLocaleString()}</span></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><CoverageBar label="Universities" value={data.completeness.universities} /><CoverageBar label="Courses" value={data.completeness.courses} /><CoverageBar label="Intakes" value={data.completeness.intakes} /><CoverageBar label="Overall" value={data.completeness.overall} /></div><div className="mt-5 rounded-xl bg-[var(--alo-page)] p-3 text-[11px] leading-4 text-[var(--alo-text-muted)]">Formula is a completeness indicator over recorded required fields. It does not imply the dataset contains every university or every course worldwide.</div></div>
            <div className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-[var(--alo-text)]">Reference catalogue</h2><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Distinct operational dimensions in the database</p></div><Database className="h-5 w-5 text-[var(--alo-text-muted)]" /></div><div className="mt-5 grid grid-cols-3 gap-2">{[
              { label: 'Countries', value: data.referenceData.countries, icon: Globe2 },
              { label: 'Subjects', value: data.referenceData.subjects, icon: Tag },
              { label: 'Degrees', value: data.referenceData.degrees, icon: BadgeCheck },
            ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3"><Icon className="h-4 w-4 text-[var(--alo-text-muted)]" /><div className="mt-2 text-lg font-black text-[var(--alo-text)]">{formatNumber(value)}</div><div className="text-[11px] font-semibold text-[var(--alo-text-muted)]">{label}</div></div>)}</div><div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--alo-text-muted)]"><Clock3 className="h-3.5 w-3.5" />Coverage snapshot is recalculated on every refresh.</div></div>
          </section>

          <section className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--alo-brand)]">Intake intelligence</div><h2 className="mt-1 text-lg font-black text-[var(--alo-text)]">Course availability coverage by month</h2><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Required window: {data.intakeWindow.start} through {data.intakeWindow.end}. Each bar shows verified records only.</p></div><div className="flex gap-4 text-[11px] font-semibold text-[var(--alo-text-muted)]"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--alo-brand)]" />Verified</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--alo-page)]" />Requires research</span></div></div><div className="mt-5 h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.intakeWindow.months} margin={{ top: 8, right: 8, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf4" /><XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={48} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 11 }} /><Bar dataKey="verified" name="Verified" stackId="a" fill="#0057B8" radius={[4, 4, 0, 0]} /><Bar dataKey="requiringResearch" name="Requires research" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-13">{data.intakeWindow.months.map((month) => <div key={month.label} className="rounded-xl border border-[var(--alo-border)] p-2.5"><div className="text-[11px] font-bold text-[var(--alo-body)]">{month.label.replace(' ', '\n')}</div><div className="mt-1 text-[12px] font-black text-[var(--alo-text)]">{formatNumber(month.discovered)}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{formatNumber(month.verified)} verified</div><div className={`mt-1 text-[11px] font-bold ${month.coverage !== null && month.coverage >= 80 ? 'text-crm-success-text' : 'text-crm-warning-text'}`}>{percentLabel(month.coverage)}</div></div>)}</div></section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DataQualityPanel title="University coverage" icon={Building2} totals={[
              ['Verified', data.universities.verified, 'text-crm-success-text'],
              ['Research required', data.universities.requiringResearch, 'text-crm-warning-text'],
              ['No courses', data.universities.noCourses, 'text-[var(--alo-body)]'],
              ['No source', data.universities.missingSource, 'text-crm-warning-text'],
              ['No image', data.universities.missingImages, 'text-crm-warning-text'],
              ['Location missing', data.universities.missingLocation, 'text-crm-warning-text'],
            ]} />
            <DataQualityPanel title="Course coverage" icon={BookOpen} totals={[
              ['Verified', data.courses.verified, 'text-crm-success-text'],
              ['Research required', data.courses.requiringResearch, 'text-crm-warning-text'],
              ['Expired', data.courses.expired, 'text-crm-warning-text'],
              ['Conflicting', data.courses.conflicting, 'text-crm-warning-text'],
              ['Missing tuition', data.courses.missingTuition, 'text-crm-warning-text'],
              ['Missing intake', data.courses.missingIntake, 'text-crm-warning-text'],
              ['Missing requirements', data.courses.missingRequirements, 'text-crm-warning-text'],
              ['Missing English', data.courses.missingEnglish, 'text-crm-warning-text'],
              ['Missing source', data.courses.missingSource, 'text-crm-warning-text'],
              ['Eligibility unknown', data.courses.missingInternationalEligibility, 'text-crm-warning-text'],
            ]} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--alo-border)] p-5"><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--alo-brand)]">Work queues</div><h2 className="mt-1 text-lg font-black text-[var(--alo-text)]">Missing data & verification</h2><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">Prioritized live records that need research, evidence or verification.</p></div><div className="flex rounded-xl bg-[var(--alo-surface-muted)] p-1">{[
              ['courses', `Courses (${data.researchQueue.courses.length})`], ['universities', `Universities (${data.researchQueue.universities.length})`], ['conflicts', `Conflicts (${data.conflicts.pending})`],
            ].map(([value, label]) => <button key={value} type="button" onClick={() => setView(value as typeof view)} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${view === value ? 'bg-white text-[var(--alo-text)] shadow-sm' : 'text-[var(--alo-text-muted)]'}`}>{label}</button>)}</div></div>

            <div className="flex flex-wrap gap-2 border-b border-[var(--alo-border)] bg-[var(--alo-page)]/60 p-4"><div className="relative min-w-[210px] flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--alo-text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search entity, course, university, source…" className="h-9 w-full rounded-lg border border-[var(--alo-border)] bg-white pl-9 pr-3 text-[11px] outline-none focus:border-[var(--alo-brand-border)]" /></div>{filterControl('country', 'Country', countries)}{view === 'courses' && <>{filterControl('university', 'University', universities)}{filterControl('subject', 'Subject', subjects)}{filterControl('degree', 'Degree', degrees)}{filterControl('intake', 'Intake', data.intakeWindow.months.filter((month) => month.discovered > 0).map((month) => month.label))}{filterControl('year', 'Year', ['2027', '2028'])}</>}<button type="button" onClick={() => { setFilters(emptyFilters); setSearch(''); }} className="self-end rounded-lg border border-[var(--alo-border)] bg-white px-3 py-2 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><Filter className="mr-1 inline h-3 w-3" />Reset</button></div>

            {view === 'courses' && <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left"><thead className="bg-white text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]"><tr><th className="px-5 py-3">Course</th><th className="px-4 py-3">University</th><th className="px-4 py-3">Location / subject</th><th className="px-4 py-3">Intake records</th><th className="px-4 py-3">Source / status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-[var(--alo-border)]">{filteredCourses.map((course) => <tr key={course.id} className="hover:bg-[var(--alo-page)]/70"><td className="px-5 py-3"><div className="max-w-[230px] truncate text-[11px] font-bold text-[var(--alo-text)]">{course.courseTitle}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{course.courseId}</div></td><td className="px-4 py-3"><div className="text-[11px] font-semibold text-[var(--alo-body)]">{course.university?.name || 'University not linked'}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{course.university?.country || course.country || 'Country not recorded'}</div></td><td className="px-4 py-3"><div className="text-[11px] text-[var(--alo-body)]">{course.subjectArea || 'Subject missing'}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{course.studyLevel || 'Degree missing'}</div></td><td className="px-4 py-3"><div className="text-[11px] font-semibold text-[var(--alo-body)]">{course.intakeFees?.length ? course.intakeFees.map((intake: any) => `${intake.intakeMonth} ${intake.intakeYear}`).join(', ') : 'No recorded intake'}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{course._count?.intakeFees || 0} linked record(s)</div></td><td className="px-4 py-3"><div className="flex flex-col items-start gap-1.5"><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${course.verificationStatus === 'VERIFIED' ? 'bg-crm-success-bg text-crm-success-text' : 'bg-crm-warning-bg text-crm-warning-text'}`}>{String(course.verificationStatus || 'MISSING').replaceAll('_', ' ')}</span><span className="text-[11px] text-[var(--alo-text-muted)]">{course.sourceUrl ? 'Source recorded' : 'Source missing'}</span></div></td><td className="px-5 py-3"><div className="flex gap-1.5"><Link href={`/admin/courses?search=${encodeURIComponent(course.courseTitle)}`} className="rounded-lg border border-[var(--alo-border)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]">Research</Link><Link href={`/courses/${course.slug || course.courseId}`} target="_blank" className="flex items-center gap-1 rounded-lg bg-[var(--alo-brand-pale)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]">View <ExternalLink className="h-2.5 w-2.5" /></Link></div></td></tr>)}{filteredCourses.length === 0 && <EmptyRow colSpan={6} label="No course records match these filters." />}</tbody></table></div>}

            {view === 'universities' && <div className="overflow-x-auto"><table className="min-w-[750px] w-full text-left"><thead className="bg-white text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]"><tr><th className="px-5 py-3">University</th><th className="px-4 py-3">Country / city</th><th className="px-4 py-3">Courses</th><th className="px-4 py-3">Verification</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-[var(--alo-border)]">{filteredUniversities.map((university) => <tr key={university.id} className="hover:bg-[var(--alo-page)]/70"><td className="px-5 py-3"><div className="text-[11px] font-bold text-[var(--alo-text)]">{university.name}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{university.universityId}</div></td><td className="px-4 py-3 text-[11px] text-[var(--alo-body)]">{university.city || 'City missing'} · {university.country || 'Country missing'}</td><td className="px-4 py-3 text-[11px] text-[var(--alo-body)]">{university._count?.courses || 0}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${university.verificationStatus === 'VERIFIED' ? 'bg-crm-success-bg text-crm-success-text' : 'bg-crm-warning-bg text-crm-warning-text'}`}>{String(university.verificationStatus || 'MISSING').replaceAll('_', ' ')}</span><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{university.sourceUrl ? 'Source recorded' : 'Source missing'}</div></td><td className="px-5 py-3"><div className="flex gap-1.5"><Link href={`/admin/universities?search=${encodeURIComponent(university.name)}`} className="rounded-lg border border-[var(--alo-border)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]">Research</Link><Link href={`/universities/${university.slug || university.universityId}`} target="_blank" className="flex items-center gap-1 rounded-lg bg-[var(--alo-brand-pale)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]">View <ExternalLink className="h-2.5 w-2.5" /></Link></div></td></tr>)}{filteredUniversities.length === 0 && <EmptyRow colSpan={5} label="No university records match these filters." />}</tbody></table></div>}

            {view === 'conflicts' && <div className="divide-y divide-[var(--alo-border)]">{data.conflicts.records.length ? data.conflicts.records.map((conflict) => <div key={conflict.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div className="flex min-w-0 gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-crm-warning-bg text-crm-warning-text"><ShieldAlert className="h-4 w-4" /></div><div className="min-w-0"><div className="text-[11px] font-bold text-[var(--alo-text)]">{conflict.entityType} · {conflict.fieldName}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{conflict.universitySlug || conflict.courseSlug || conflict.countrySlug || 'Entity not linked'} · detected {new Date(conflict.detectedAt).toLocaleDateString()}</div><ConflictValues value={conflict.conflictingValues} /></div></div><Link href="/admin/data-conflicts" className="flex items-center gap-1 rounded-lg bg-crm-warning-bg px-3 py-2 text-[11px] font-bold text-crm-warning-text hover:bg-crm-warning-bg">Human review <ArrowRight className="h-3 w-3" /></Link></div>) : <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-crm-success-text" /><div className="mt-2 text-xs font-bold text-[var(--alo-body)]">No pending conflicts</div><p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">This reflects current database conflict records.</p></div>}</div>}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DistributionList title="Universities by country" icon={Globe2} rows={data.distribution.universitiesByCountry.map((row) => ({ label: row.country, count: row.count }))} />
            <DistributionList title="Courses by subject" icon={BookOpen} rows={data.distribution.coursesBySubject.map((row) => ({ label: row.subject, count: row.count }))} />
          </section>
          <div className="text-center text-[11px] text-[var(--alo-text-muted)]">Coverage output represents records present in the ALO database at {new Date(data.generatedAt).toLocaleString()}. It is not a claim of total worldwide coverage.</div>
        </>}
      </div>
    </div>
  );
}

function DataQualityPanel({ title, icon: Icon, totals }: { title: string; icon: typeof Building2; totals: Array<[string, number, string]> }) {
  return <section className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"><Icon className="h-4 w-4" /></div><h2 className="text-sm font-bold text-[var(--alo-text)]">{title}</h2></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{totals.map(([label, value, color]) => <div key={label} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)]/50 p-3"><div className={`text-lg font-black ${color}`}>{formatNumber(value)}</div><div className="mt-0.5 text-[11px] font-semibold text-[var(--alo-text-muted)]">{label}</div></div>)}</div></section>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return <tr><td colSpan={colSpan} className="p-10 text-center"><CircleHelp className="mx-auto h-5 w-5 text-[var(--alo-placeholder)]" /><div className="mt-2 text-[11px] font-semibold text-[var(--alo-text-muted)]">{label}</div></td></tr>;
}

function ConflictValues({ value }: { value: string }) {
  let rows: any[] = [];
  try { const parsed = JSON.parse(value || '[]'); if (Array.isArray(parsed)) rows = parsed; } catch { rows = []; }
  if (!rows.length) return null;
  return <div className="mt-2 flex flex-wrap gap-1.5">{rows.slice(0, 3).map((row, index) => <span key={index} className="max-w-[230px] truncate rounded-md bg-crm-warning-bg px-2 py-1 text-[11px] text-crm-warning-text">{row.sourceName || 'Source'}: {row.value || 'value unavailable'}</span>)}</div>;
}

function DistributionList({ title, icon: Icon, rows }: { title: string; icon: typeof Globe2; rows: Array<{ label: string; count: number }> }) {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map((row) => row.count));
  return <section className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[var(--alo-brand)]" /><h2 className="text-sm font-bold text-[var(--alo-text)]">{title}</h2></div><div className="mt-4 space-y-3">{top.map((row) => <div key={row.label}><div className="mb-1 flex items-center justify-between text-[11px]"><span className="truncate font-semibold text-[var(--alo-body)]">{row.label}</span><span className="font-bold text-[var(--alo-text-muted)]">{formatNumber(row.count)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]"><div className="h-full rounded-full bg-[var(--alo-brand)]" style={{ width: `${Math.max(3, row.count / max * 100)}%` }} /></div></div>)}{top.length === 0 && <div className="py-5 text-center text-[11px] text-[var(--alo-text-muted)]">No category data recorded.</div>}</div></section>;
}
