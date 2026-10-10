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
  const content = <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">{title}</div><div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</div><div className="mt-1 text-[10px] text-slate-500">{hint}</div></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}><Icon className="h-5 w-5" /></div></div>{link && <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-blue-700">Open records <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" /></div>}</div>;
  return link ? <Link href={link}>{content}</Link> : content;
}

function CoverageBar({ value, label }: { value: number | null; label: string }) {
  const safeValue = value ?? 0;
  return <div><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="font-semibold text-slate-700">{label}</span><span className="font-bold text-slate-900">{percentLabel(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${safeValue >= 90 ? 'bg-emerald-500' : safeValue >= 75 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${safeValue}%` }} /></div></div>;
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

  const filterControl = (key: keyof FilterState, label: string, options: Array<string>) => <label key={key} className="min-w-[120px] flex-1"><span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span><select value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-700 outline-none focus:border-blue-400"><option value="all">All {label.toLowerCase()}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;

  if (loading) return <div className="min-h-screen bg-slate-50 p-5"><div className="mx-auto max-w-[1500px] space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-white" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div></div></div>;

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700"><Activity className="h-3.5 w-3.5" />Global course intelligence</div><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Data coverage & quality</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Measure discovered, verified, missing and conflicting records from the live ALO database. Coverage figures are computed, not estimates.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Link href="/admin/research" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><Search className="h-3.5 w-3.5" />Research queue</Link><Link href="/admin/university-data" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[10px] font-bold text-white hover:bg-slate-800"><Sparkles className="h-3.5 w-3.5" />Open data review</Link><button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div>
        </header>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

        {data && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Universities discovered" value={formatNumber(data.universities.discovered)} hint={`${formatNumber(data.universities.verified)} verified · ${formatNumber(data.universities.requiringResearch)} research required`} icon={Building2} accent="bg-blue-50 text-blue-700" link="/admin/universities" />
            <MetricCard title="Courses discovered" value={formatNumber(data.courses.discovered)} hint={`${formatNumber(data.courses.verified)} verified · ${formatNumber(data.courses.requiringResearch)} research required`} icon={BookOpen} accent="bg-violet-50 text-violet-700" link="/admin/courses" />
            <MetricCard title="Jan 2027 — Jan 2028 intakes" value={formatNumber(data.intakeWindow.discovered)} hint={`${formatNumber(data.intakeWindow.verified)} verified intake records`} icon={CalendarDays} accent="bg-orange-50 text-orange-700" />
            <MetricCard title="Conflicts pending review" value={formatNumber(data.conflicts.pending)} hint="Conflicting values never overwrite verified data" icon={ShieldAlert} accent="bg-rose-50 text-rose-700" link="/admin/data-conflicts" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><h2 className="text-sm font-bold text-slate-900">Data completeness</h2></div><p className="mt-1 text-[10px] text-slate-500">Calculated from verification, source, relationship and required-field coverage.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600">Live DB · {new Date(data.generatedAt).toLocaleString()}</span></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><CoverageBar label="Universities" value={data.completeness.universities} /><CoverageBar label="Courses" value={data.completeness.courses} /><CoverageBar label="Intakes" value={data.completeness.intakes} /><CoverageBar label="Overall" value={data.completeness.overall} /></div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-[9px] leading-4 text-slate-500">Formula is a completeness indicator over recorded required fields. It does not imply the dataset contains every university or every course worldwide.</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">Reference catalogue</h2><p className="mt-1 text-[10px] text-slate-500">Distinct operational dimensions in the database</p></div><Database className="h-5 w-5 text-slate-400" /></div><div className="mt-5 grid grid-cols-3 gap-2">{[
              { label: 'Countries', value: data.referenceData.countries, icon: Globe2 },
              { label: 'Subjects', value: data.referenceData.subjects, icon: Tag },
              { label: 'Degrees', value: data.referenceData.degrees, icon: BadgeCheck },
            ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><Icon className="h-4 w-4 text-slate-500" /><div className="mt-2 text-lg font-black text-slate-900">{formatNumber(value)}</div><div className="text-[9px] font-semibold text-slate-500">{label}</div></div>)}</div><div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />Coverage snapshot is recalculated on every refresh.</div></div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Intake intelligence</div><h2 className="mt-1 text-lg font-black text-slate-900">Course availability coverage by month</h2><p className="mt-1 text-[10px] text-slate-500">Required window: {data.intakeWindow.start} through {data.intakeWindow.end}. Each bar shows verified records only.</p></div><div className="flex gap-4 text-[9px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />Verified</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />Requires research</span></div></div><div className="mt-5 h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.intakeWindow.months} margin={{ top: 8, right: 8, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf4" /><XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={48} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 11 }} /><Bar dataKey="verified" name="Verified" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} /><Bar dataKey="requiringResearch" name="Requires research" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-13">{data.intakeWindow.months.map((month) => <div key={month.label} className="rounded-xl border border-slate-200 p-2.5"><div className="text-[8px] font-bold text-slate-700">{month.label.replace(' ', '\n')}</div><div className="mt-1 text-[12px] font-black text-slate-900">{formatNumber(month.discovered)}</div><div className="mt-1 text-[8px] text-slate-500">{formatNumber(month.verified)} verified</div><div className={`mt-1 text-[8px] font-bold ${month.coverage !== null && month.coverage >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>{percentLabel(month.coverage)}</div></div>)}</div></section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DataQualityPanel title="University coverage" icon={Building2} totals={[
              ['Verified', data.universities.verified, 'text-emerald-700'],
              ['Research required', data.universities.requiringResearch, 'text-amber-700'],
              ['No courses', data.universities.noCourses, 'text-slate-700'],
              ['No source', data.universities.missingSource, 'text-rose-700'],
              ['No image', data.universities.missingImages, 'text-rose-700'],
              ['Location missing', data.universities.missingLocation, 'text-rose-700'],
            ]} />
            <DataQualityPanel title="Course coverage" icon={BookOpen} totals={[
              ['Verified', data.courses.verified, 'text-emerald-700'],
              ['Research required', data.courses.requiringResearch, 'text-amber-700'],
              ['Expired', data.courses.expired, 'text-rose-700'],
              ['Conflicting', data.courses.conflicting, 'text-rose-700'],
              ['Missing tuition', data.courses.missingTuition, 'text-amber-700'],
              ['Missing intake', data.courses.missingIntake, 'text-amber-700'],
              ['Missing requirements', data.courses.missingRequirements, 'text-amber-700'],
              ['Missing English', data.courses.missingEnglish, 'text-amber-700'],
              ['Missing source', data.courses.missingSource, 'text-rose-700'],
              ['Eligibility unknown', data.courses.missingInternationalEligibility, 'text-amber-700'],
            ]} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Work queues</div><h2 className="mt-1 text-lg font-black text-slate-900">Missing data & verification</h2><p className="mt-1 text-[10px] text-slate-500">Prioritized live records that need research, evidence or verification.</p></div><div className="flex rounded-xl bg-slate-100 p-1">{[
              ['courses', `Courses (${data.researchQueue.courses.length})`], ['universities', `Universities (${data.researchQueue.universities.length})`], ['conflicts', `Conflicts (${data.conflicts.pending})`],
            ].map(([value, label]) => <button key={value} type="button" onClick={() => setView(value as typeof view)} className={`rounded-lg px-3 py-2 text-[9px] font-bold ${view === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div></div>

            <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/60 p-4"><div className="relative min-w-[210px] flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search entity, course, university, source…" className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[10px] outline-none focus:border-blue-400" /></div>{filterControl('country', 'Country', countries)}{view === 'courses' && <>{filterControl('university', 'University', universities)}{filterControl('subject', 'Subject', subjects)}{filterControl('degree', 'Degree', degrees)}{filterControl('intake', 'Intake', data.intakeWindow.months.filter((month) => month.discovered > 0).map((month) => month.label))}{filterControl('year', 'Year', ['2027', '2028'])}</>}<button type="button" onClick={() => { setFilters(emptyFilters); setSearch(''); }} className="self-end rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-bold text-slate-600 hover:bg-slate-50"><Filter className="mr-1 inline h-3 w-3" />Reset</button></div>

            {view === 'courses' && <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left"><thead className="bg-white text-[9px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Course</th><th className="px-4 py-3">University</th><th className="px-4 py-3">Location / subject</th><th className="px-4 py-3">Intake records</th><th className="px-4 py-3">Source / status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredCourses.map((course) => <tr key={course.id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><div className="max-w-[230px] truncate text-[10px] font-bold text-slate-900">{course.courseTitle}</div><div className="mt-1 text-[8px] text-slate-400">{course.courseId}</div></td><td className="px-4 py-3"><div className="text-[10px] font-semibold text-slate-700">{course.university?.name || 'University not linked'}</div><div className="mt-1 text-[8px] text-slate-400">{course.university?.country || course.country || 'Country not recorded'}</div></td><td className="px-4 py-3"><div className="text-[9px] text-slate-700">{course.subjectArea || 'Subject missing'}</div><div className="mt-1 text-[8px] text-slate-400">{course.studyLevel || 'Degree missing'}</div></td><td className="px-4 py-3"><div className="text-[9px] font-semibold text-slate-700">{course.intakeFees?.length ? course.intakeFees.map((intake: any) => `${intake.intakeMonth} ${intake.intakeYear}`).join(', ') : 'No recorded intake'}</div><div className="mt-1 text-[8px] text-slate-400">{course._count?.intakeFees || 0} linked record(s)</div></td><td className="px-4 py-3"><div className="flex flex-col items-start gap-1.5"><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${course.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{String(course.verificationStatus || 'MISSING').replaceAll('_', ' ')}</span><span className="text-[8px] text-slate-400">{course.sourceUrl ? 'Source recorded' : 'Source missing'}</span></div></td><td className="px-5 py-3"><div className="flex gap-1.5"><Link href={`/admin/courses?search=${encodeURIComponent(course.courseTitle)}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-bold text-slate-700 hover:bg-slate-50">Research</Link><Link href={`/courses/${course.slug || course.courseId}`} target="_blank" className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[8px] font-bold text-blue-700 hover:bg-blue-100">View <ExternalLink className="h-2.5 w-2.5" /></Link></div></td></tr>)}{filteredCourses.length === 0 && <EmptyRow colSpan={6} label="No course records match these filters." />}</tbody></table></div>}

            {view === 'universities' && <div className="overflow-x-auto"><table className="min-w-[750px] w-full text-left"><thead className="bg-white text-[9px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">University</th><th className="px-4 py-3">Country / city</th><th className="px-4 py-3">Courses</th><th className="px-4 py-3">Verification</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUniversities.map((university) => <tr key={university.id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><div className="text-[10px] font-bold text-slate-900">{university.name}</div><div className="mt-1 text-[8px] text-slate-400">{university.universityId}</div></td><td className="px-4 py-3 text-[9px] text-slate-700">{university.city || 'City missing'} · {university.country || 'Country missing'}</td><td className="px-4 py-3 text-[9px] text-slate-700">{university._count?.courses || 0}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[8px] font-bold ${university.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{String(university.verificationStatus || 'MISSING').replaceAll('_', ' ')}</span><div className="mt-1 text-[8px] text-slate-400">{university.sourceUrl ? 'Source recorded' : 'Source missing'}</div></td><td className="px-5 py-3"><div className="flex gap-1.5"><Link href={`/admin/universities?search=${encodeURIComponent(university.name)}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-bold text-slate-700 hover:bg-slate-50">Research</Link><Link href={`/universities/${university.slug || university.universityId}`} target="_blank" className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[8px] font-bold text-blue-700 hover:bg-blue-100">View <ExternalLink className="h-2.5 w-2.5" /></Link></div></td></tr>)}{filteredUniversities.length === 0 && <EmptyRow colSpan={5} label="No university records match these filters." />}</tbody></table></div>}

            {view === 'conflicts' && <div className="divide-y divide-slate-100">{data.conflicts.records.length ? data.conflicts.records.map((conflict) => <div key={conflict.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div className="flex min-w-0 gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700"><ShieldAlert className="h-4 w-4" /></div><div className="min-w-0"><div className="text-[10px] font-bold text-slate-900">{conflict.entityType} · {conflict.fieldName}</div><div className="mt-1 text-[9px] text-slate-500">{conflict.universitySlug || conflict.courseSlug || conflict.countrySlug || 'Entity not linked'} · detected {new Date(conflict.detectedAt).toLocaleDateString()}</div><ConflictValues value={conflict.conflictingValues} /></div></div><Link href="/admin/data-conflicts" className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-[9px] font-bold text-rose-700 hover:bg-rose-100">Human review <ArrowRight className="h-3 w-3" /></Link></div>) : <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" /><div className="mt-2 text-xs font-bold text-slate-700">No pending conflicts</div><p className="mt-1 text-[10px] text-slate-500">This reflects current database conflict records.</p></div>}</div>}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DistributionList title="Universities by country" icon={Globe2} rows={data.distribution.universitiesByCountry.map((row) => ({ label: row.country, count: row.count }))} />
            <DistributionList title="Courses by subject" icon={BookOpen} rows={data.distribution.coursesBySubject.map((row) => ({ label: row.subject, count: row.count }))} />
          </section>
          <div className="text-center text-[9px] text-slate-400">Coverage output represents records present in the ALO database at {new Date(data.generatedAt).toLocaleString()}. It is not a claim of total worldwide coverage.</div>
        </>}
      </div>
    </div>
  );
}

function DataQualityPanel({ title, icon: Icon, totals }: { title: string; icon: typeof Building2; totals: Array<[string, number, string]> }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></div><h2 className="text-sm font-bold text-slate-900">{title}</h2></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{totals.map(([label, value, color]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"><div className={`text-lg font-black ${color}`}>{formatNumber(value)}</div><div className="mt-0.5 text-[9px] font-semibold text-slate-500">{label}</div></div>)}</div></section>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return <tr><td colSpan={colSpan} className="p-10 text-center"><CircleHelp className="mx-auto h-5 w-5 text-slate-300" /><div className="mt-2 text-[10px] font-semibold text-slate-500">{label}</div></td></tr>;
}

function ConflictValues({ value }: { value: string }) {
  let rows: any[] = [];
  try { const parsed = JSON.parse(value || '[]'); if (Array.isArray(parsed)) rows = parsed; } catch { rows = []; }
  if (!rows.length) return null;
  return <div className="mt-2 flex flex-wrap gap-1.5">{rows.slice(0, 3).map((row, index) => <span key={index} className="max-w-[230px] truncate rounded-md bg-rose-50 px-2 py-1 text-[8px] text-rose-700">{row.sourceName || 'Source'}: {row.value || 'value unavailable'}</span>)}</div>;
}

function DistributionList({ title, icon: Icon, rows }: { title: string; icon: typeof Globe2; rows: Array<{ label: string; count: number }> }) {
  const top = rows.slice(0, 6);
  const max = Math.max(1, ...top.map((row) => row.count));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-blue-700" /><h2 className="text-sm font-bold text-slate-900">{title}</h2></div><div className="mt-4 space-y-3">{top.map((row) => <div key={row.label}><div className="mb-1 flex items-center justify-between text-[9px]"><span className="truncate font-semibold text-slate-700">{row.label}</span><span className="font-bold text-slate-500">{formatNumber(row.count)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(3, row.count / max * 100)}%` }} /></div></div>)}{top.length === 0 && <div className="py-5 text-center text-[10px] text-slate-400">No category data recorded.</div>}</div></section>;
}
