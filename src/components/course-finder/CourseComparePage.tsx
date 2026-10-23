'use client';

/**
 * Public course comparison (up to 4). Data comes only from
 * /api/course-finder/public-compare (verified + published records), and the
 * optional eligibility check uses the same engine as the Course Finder
 * (/api/course-finder/eligibility-engine with courseIds), including its
 * 7 categories, reasons, next steps and engine-checked alternatives.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { COMPARE_MAX, readCompareList, writeCompareList } from '@/lib/course-finder/compare-list';
import { ELIGIBILITY_DISCLAIMERS } from '@/lib/course-finder/eligibility-rules';

interface Intake {
  intakeYear: number | null; intakeMonth: string; applicationDeadline: string; yearlyTuition: number | null; tuitionCurrency: string; tuitionPeriod: string;
  depositAmount: number | null; depositCurrency: string; appFeeAmount: number | null; appFeeCurrency: string; feeSourceUrl: string; intakeSourceUrl: string; lastCheckedAt: string;
}
interface Requirement {
  academicReq: string; minScore: string; gradingSystem: string; ieltsOverall: number | null; ieltsMinBand: number | null; pteOverall: number | null; toeflOverall: number | null; detOverall: number | null;
  moiAccepted: boolean | null; interviewRequired: boolean | null; portfolioRequired: boolean | null; officialRequirementUrl: string; lastCheckedAt: string;
}
interface CompareCourse {
  identifier: string; courseId: string; slug: string; courseTitle: string; universityName: string; universitySlug: string; country: string; city: string; campus: string;
  studyLevel: string; qualification: string; durationMonths: number | null; deliveryMode: string; internationalEligibility: string; scholarshipsRecorded: boolean;
  officialCourseUrl: string; courseSourceUrl: string; courseLastVerifiedAt: string; intakes: Intake[]; requirement: Requirement | null;
}
interface EligibilityRow {
  courseId: string; slug?: string; eligibilityCategory: string; categoryLabel?: string; requirementsMetPercent: number; reason: string; nextSteps?: string[];
  alternativeRoutes?: Array<{ courseTitle?: string; title?: string; slug?: string; universityName?: string; categoryLabel?: string }>;
}

const NR = <span className="text-[var(--alo-text-muted)]">Not recorded</span>;
const money = (amount: number | null, cur: string) => (amount ? `${cur} ${amount.toLocaleString()}` : null);
const yesNo = (v: boolean | null) => (v === null ? null : v ? 'Yes' : 'No');

function parseCourses(raw: string | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(',').map((s) => s.trim()).filter((s) => s && s.length <= 191))].slice(0, COMPARE_MAX);
}

export default function CourseComparePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [courses, setCourses] = useState<CompareCourse[] | null>(null);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Profile for the optional eligibility check. As with the main eligibility check,
  // the engine stores a result only for a signed-in student, under their own account.
  const [qualType, setQualType] = useState("Bachelor's");
  const [grade, setGrade] = useState('');
  const [testType, setTestType] = useState('IELTS');
  const [testScore, setTestScore] = useState('');
  const [elig, setElig] = useState<Record<string, EligibilityRow> | null>(null);
  const [eligError, setEligError] = useState<string | null>(null);
  const [eligBusy, setEligBusy] = useState(false);

  useEffect(() => {
    const fromUrl = parseCourses(params.get('courses'));
    const list = fromUrl.length ? fromUrl : readCompareList();
    if (fromUrl.length) writeCompareList(fromUrl);
    setIds(list);
  }, [params]);

  const load = useCallback(async (list: string[]) => {
    setError(null); setElig(null);
    if (!list.length) { setCourses([]); setUnavailable([]); return; }
    setCourses(null);
    try {
      const res = await fetch(`/api/course-finder/public-compare?ids=${encodeURIComponent(list.join(','))}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Comparison failed (${res.status})`);
      setCourses(data.courses ?? []);
      setUnavailable(data.unavailable ?? []);
    } catch (e) {
      setCourses([]);
      setError(e instanceof Error ? e.message : 'Comparison is unavailable');
    }
  }, []);
  useEffect(() => { void load(ids); }, [ids, load]);

  function remove(id: string) {
    const next = writeCompareList(ids.filter((x) => x !== id));
    setIds(next);
    router.replace(next.length ? `/compare?courses=${encodeURIComponent(next.join(','))}` : '/compare');
  }

  async function checkEligibility() {
    if (!courses?.length) return;
    setEligBusy(true); setEligError(null); setElig(null);
    const gradeNum = Number(grade);
    const qual: Record<string, unknown> = { qualificationType: qualType };
    if (/^\d+(\.\d+)?$/.test(grade) && gradeNum <= 5) { qual.gpa = gradeNum; qual.gpaScale = gradeNum <= 4 ? 4 : 5; }
    else if (/^\d+(\.\d+)?$/.test(grade)) qual.percentage = gradeNum;
    else if (grade.trim()) qual.classification = grade.trim();
    const body = {
      courseIds: courses.map((c) => c.courseId),
      academicProfile: [qual],
      englishTests: testScore.trim() ? [{ testType, overallScore: Number(testScore) }] : [],
    };
    try {
      const res = await fetch('/api/course-finder/eligibility-engine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Eligibility check failed (${res.status})`);
      const rows: EligibilityRow[] = Array.isArray(data.results) ? data.results : [];
      setElig(Object.fromEntries(rows.map((r) => [r.courseId, r])));
    } catch (e) {
      setEligError(e instanceof Error ? e.message : 'Eligibility check failed');
    } finally { setEligBusy(false); }
  }

  const rows = useMemo(() => {
    const cs = courses ?? [];
    const first = (c: CompareCourse) => c.intakes[0];
    return [
      { label: 'University', render: (c: CompareCourse) => c.universitySlug ? <Link className="text-blue-700 underline" href={`/universities/${encodeURIComponent(c.universitySlug)}`}>{c.universityName}</Link> : c.universityName },
      { label: 'Location', render: (c: CompareCourse) => [c.campus, c.city, c.country].filter(Boolean).join(', ') || NR },
      { label: 'Study level', render: (c: CompareCourse) => c.studyLevel || NR },
      { label: 'Qualification', render: (c: CompareCourse) => c.qualification || NR },
      { label: 'Duration', render: (c: CompareCourse) => (c.durationMonths ? `${c.durationMonths} months` : NR) },
      { label: 'Study mode', render: (c: CompareCourse) => c.deliveryMode || NR },
      { label: 'Intakes', render: (c: CompareCourse) => c.intakes.length ? c.intakes.map((i) => `${i.intakeMonth} ${i.intakeYear ?? ''}`.trim()).join(', ') : NR },
      { label: 'Application deadline', render: (c: CompareCourse) => first(c)?.applicationDeadline || NR },
      { label: 'Yearly tuition', render: (c: CompareCourse) => money(first(c)?.yearlyTuition ?? null, first(c)?.tuitionCurrency ?? '') ?? NR },
      { label: 'Deposit', render: (c: CompareCourse) => money(first(c)?.depositAmount ?? null, first(c)?.depositCurrency ?? '') ?? NR },
      { label: 'Application fee', render: (c: CompareCourse) => money(first(c)?.appFeeAmount ?? null, first(c)?.appFeeCurrency ?? '') ?? NR },
      { label: 'Academic requirement', render: (c: CompareCourse) => c.requirement ? [c.requirement.academicReq, c.requirement.minScore && `(${c.requirement.minScore}${c.requirement.gradingSystem ? `, ${c.requirement.gradingSystem}` : ''})`].filter(Boolean).join(' ') || NR : NR },
      { label: 'IELTS', render: (c: CompareCourse) => c.requirement?.ieltsOverall ? `${c.requirement.ieltsOverall}${c.requirement.ieltsMinBand ? ` (min band ${c.requirement.ieltsMinBand})` : ''}` : NR },
      { label: 'PTE / TOEFL / Duolingo', render: (c: CompareCourse) => [c.requirement?.pteOverall && `PTE ${c.requirement.pteOverall}`, c.requirement?.toeflOverall && `TOEFL ${c.requirement.toeflOverall}`, c.requirement?.detOverall && `DET ${c.requirement.detOverall}`].filter(Boolean).join(' · ') || NR },
      { label: 'Medium of instruction accepted', render: (c: CompareCourse) => yesNo(c.requirement?.moiAccepted ?? null) ?? NR },
      { label: 'Interview / portfolio', render: (c: CompareCourse) => [yesNo(c.requirement?.interviewRequired ?? null) && `Interview: ${yesNo(c.requirement!.interviewRequired)}`, yesNo(c.requirement?.portfolioRequired ?? null) && `Portfolio: ${yesNo(c.requirement!.portfolioRequired)}`].filter(Boolean).join(' · ') || NR },
      { label: 'Scholarships', render: (c: CompareCourse) => (c.scholarshipsRecorded ? 'Verified scholarship recorded' : 'None recorded') },
      { label: 'Sources', render: (c: CompareCourse) => (
        <span className="space-x-2">
          {c.courseSourceUrl ? <a className="text-blue-700 underline" href={c.courseSourceUrl} target="_blank" rel="noopener noreferrer">Course</a> : null}
          {first(c)?.feeSourceUrl ? <a className="text-blue-700 underline" href={first(c)!.feeSourceUrl} target="_blank" rel="noopener noreferrer">Fees</a> : null}
          {c.requirement?.officialRequirementUrl ? <a className="text-blue-700 underline" href={c.requirement.officialRequirementUrl} target="_blank" rel="noopener noreferrer">Entry requirements</a> : null}
        </span>
      ) },
      { label: 'Last verified', render: (c: CompareCourse) => (c.courseLastVerifiedAt ? new Date(c.courseLastVerifiedAt).toLocaleDateString() : NR) },
    ].map((r) => ({ ...r, cells: cs.map((c) => r.render(c)) }));
  }, [courses]);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Compare courses</h1>
        <p className="text-sm text-[var(--alo-body)] max-w-3xl">Compare up to {COMPARE_MAX} courses side by side. Only courses whose details ALO Education has verified against official sources are shown. Fees, intakes and requirements can change, so check the source links and last-verified dates.</p>
      </header>

      {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" aria-hidden="true" />{error}</div>}
      {unavailable.length > 0 && (
        <div role="status" className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-xl">
          {unavailable.length} selected course{unavailable.length === 1 ? ' is' : 's are'} not currently available to compare (not found, or not verified and published).{' '}
          <button type="button" className="underline" onClick={() => { const next = writeCompareList(ids.filter((x) => !unavailable.includes(x))); setIds(next); }}>Remove from list</button>
        </div>
      )}

      {courses === null && <p className="text-sm text-[var(--alo-text-muted)]" role="status">Loading comparison…</p>}
      {courses && courses.length === 0 && !error && (
        <Card className="p-8 text-center space-y-3 bg-white border border-[var(--alo-border)] rounded-2xl">
          <p className="text-[var(--alo-body)] font-medium">No courses selected yet.</p>
          <p className="text-sm text-[var(--alo-text-muted)]">Use “Add to compare” on Course Finder results.</p>
          <Link href="/course-finder"><Button>Open Course Finder</Button></Link>
        </Card>
      )}

      {courses && courses.length > 0 && (
        <>
          <div className="overflow-x-auto bg-white border border-[var(--alo-border)] rounded-2xl">
            <table className="w-full text-sm min-w-[640px]">
              <caption className="sr-only">Course comparison</caption>
              <thead>
                <tr className="bg-[var(--alo-page)]">
                  <th scope="col" className="p-3 text-left text-xs text-[var(--alo-text-muted)] w-48">Course</th>
                  {courses.map((c) => (
                    <th key={c.courseId} scope="col" className="p-3 text-left align-top">
                      <Link href={`/course/${encodeURIComponent(c.slug)}`} className="font-semibold text-[var(--alo-text)] hover:underline">{c.courseTitle}</Link>
                      <div><button type="button" className="text-xs text-red-700 underline mt-1" onClick={() => remove(c.identifier)}>Remove</button></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-[var(--alo-border)] align-top">
                    <th scope="row" className="p-3 text-left text-xs font-medium text-[var(--alo-body)]">{r.label}</th>
                    {r.cells.map((cell, i) => <td key={courses[i].courseId} className="p-3 text-[var(--alo-text)]">{cell}</td>)}
                  </tr>
                ))}
                {elig && (
                  <tr className="border-t border-[var(--alo-border)] align-top bg-blue-50/40">
                    <th scope="row" className="p-3 text-left text-xs font-medium text-[var(--alo-body)]">Your indicative eligibility</th>
                    {courses.map((c) => {
                      const e = elig[c.courseId];
                      return (
                        <td key={c.courseId} className="p-3 text-xs text-[var(--alo-text)] space-y-1">
                          {e ? (
                            <>
                              <div className="font-semibold">{e.categoryLabel ?? e.eligibilityCategory}</div>
                              <div>{e.reason}</div>
                              {e.nextSteps?.[0] && <div className="text-[var(--alo-body)]">Next step: {e.nextSteps[0]}</div>}
                              {e.alternativeRoutes && e.alternativeRoutes.length > 0 && (
                                <div className="text-[var(--alo-body)]">Alternative routes (checked by the same rules): {e.alternativeRoutes.slice(0, 2).map((a) => a.courseTitle ?? a.title).filter(Boolean).join('; ')}</div>
                              )}
                            </>
                          ) : <span className="text-[var(--alo-text-muted)]">No result returned</span>}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-2xl space-y-3">
            <h2 className="text-base font-semibold text-[var(--alo-text)]">Check your indicative eligibility for these courses</h2>
            <div className="grid sm:grid-cols-4 gap-3 text-sm">
              <label className="space-y-1"><span className="block text-xs text-[var(--alo-body)]">Highest qualification</span>
                <select className="w-full border border-[var(--alo-border-strong)] rounded-lg px-2 py-2" value={qualType} onChange={(e) => setQualType(e.target.value)}>
                  {['HSC', 'A Level', 'Diploma', "Bachelor's", "Master's"].map((q) => <option key={q}>{q}</option>)}
                </select></label>
              <label className="space-y-1"><span className="block text-xs text-[var(--alo-body)]">Result (GPA, % or class)</span>
                <input className="w-full border border-[var(--alo-border-strong)] rounded-lg px-2 py-2" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 3.4 or 72 or 2:1" /></label>
              <label className="space-y-1"><span className="block text-xs text-[var(--alo-body)]">English test</span>
                <select className="w-full border border-[var(--alo-border-strong)] rounded-lg px-2 py-2" value={testType} onChange={(e) => setTestType(e.target.value)}>
                  {['IELTS', 'PTE', 'TOEFL', 'Duolingo'].map((t) => <option key={t}>{t}</option>)}
                </select></label>
              <label className="space-y-1"><span className="block text-xs text-[var(--alo-body)]">Overall score (leave blank if none)</span>
                <input className="w-full border border-[var(--alo-border-strong)] rounded-lg px-2 py-2" inputMode="decimal" value={testScore} onChange={(e) => setTestScore(e.target.value)} /></label>
            </div>
            <Button onClick={() => void checkEligibility()} disabled={eligBusy}>{eligBusy ? 'Checking…' : 'Check eligibility'}</Button>
            {eligError && <p role="alert" className="text-sm text-red-700">{eligError}</p>}
            <ul className="text-xs text-[var(--alo-text-muted)] list-disc pl-5 space-y-1">
              {ELIGIBILITY_DISCLAIMERS.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
