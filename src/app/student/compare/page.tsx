'use client';

/**
 * Student course comparison — /student/compare
 *
 * Reads GET /api/course-finder/compare, which only returns courses that are
 * currently public (verified + published) for this student's saved comparison.
 *
 * Every cell maps to a stored column. Where the catalogue genuinely has no
 * value, the cell says "Not published" — it does not fall back to a plausible
 * looking default. The previous version rendered a hardcoded "Sep, Jan" intake
 * for every course, which read as real data; that is removed.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { GitCompare, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CompareCourse {
  courseId: string;
  courseTitle?: string | null;
  courseName?: string | null;
  studyLevel?: string | null;
  duration?: string | null;
  tuitionFee?: number | string | null;
  tuitionCurrency?: string | null;
  depositAmount?: number | string | null;
  appFeeAmount?: number | string | null;
  intake?: string | null;
  deadline?: string | null;
  englishRequirement?: string | null;
  academicRequirement?: string | null;
  eligibility?: string | null;
  matchScore?: number | null;
  scholarships?: unknown[] | null;
  university?: { name?: string | null; country?: string | null } | null;
  universityName?: string | null;
  country?: string | null;
}

const NOT_PUBLISHED = 'Not published';

function text(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return NOT_PUBLISHED;
  return String(value);
}

function money(amount: number | string | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return NOT_PUBLISHED;
  return `${currency || ''} ${amount}`.trim();
}

function firstIntake(course: CompareCourse): string {
  // `intake` is only present when the public intake row carries a label; the
  // catalogue does not guarantee one, so this stays honest rather than inventing
  // common intake months.
  return text(course.intake);
}

export default function StudentComparePage() {
  const [courses, setCourses] = useState<CompareCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/course-finder/compare', { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setCourses([]);
        setError('Sign in as a student to see your comparison.');
        return;
      }
      setCourses(Array.isArray(json.courses) ? json.courses.slice(0, 4) : []);
    } catch {
      setError('Could not load the comparison.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (courseId: string) => {
    const remaining = courses.filter((course) => course.courseId !== courseId).map((course) => course.courseId);
    try {
      const res = await fetch('/api/course-finder/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseIds: remaining.length ? remaining : ['__none__'] }),
      });
      if (res.ok) setCourses((current) => current.filter((course) => course.courseId !== courseId));
    } catch {
      setError('Could not remove that course from the comparison.');
    }
  };

  const rows: Array<{ label: string; value: (course: CompareCourse) => string }> = [
    { label: 'University', value: (c) => text(c.university?.name ?? c.universityName) },
    { label: 'Course', value: (c) => text(c.courseTitle ?? c.courseName) },
    { label: 'Country', value: (c) => text(c.university?.country ?? c.country) },
    { label: 'Study level', value: (c) => text(c.studyLevel) },
    { label: 'Duration', value: (c) => text(c.duration) },
    { label: 'Tuition', value: (c) => money(c.tuitionFee, c.tuitionCurrency) },
    { label: 'Scholarship', value: (c) => (c.scholarships?.length ? `${c.scholarships.length} listed` : NOT_PUBLISHED) },
    { label: 'Deposit', value: (c) => money(c.depositAmount, c.tuitionCurrency) },
    { label: 'Application fee', value: (c) => money(c.appFeeAmount, c.tuitionCurrency) },
    { label: 'Intake', value: firstIntake },
    { label: 'Deadline', value: (c) => text(c.deadline) },
    { label: 'English requirement', value: (c) => text(c.englishRequirement) },
    { label: 'Academic requirement', value: (c) => text(c.academicRequirement) },
    { label: 'Eligibility', value: (c) => text(c.eligibility) },
    { label: 'Match score', value: (c) => (c.matchScore === null || c.matchScore === undefined ? NOT_PUBLISHED : `${c.matchScore}%`) },
  ];

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">
            Up to 4 courses · only verified, published catalogue rows
          </Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Compare Courses</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">
            Side-by-side on tuition, deposit, fees, intake, English and academic requirements, and match score.
            A field with no stored value shows &ldquo;{NOT_PUBLISHED}&rdquo; rather than a guessed default.
          </p>
          <div className="mt-4 flex gap-3">
            <Button onClick={load} variant="outline" className="border-[var(--alo-border)]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Refresh
            </Button>
            <Link href="/student/course-finder">
              <Button className="bg-[var(--alo-brand)] text-white">Find more courses</Button>
            </Link>
          </div>
        </div>

        {error && (
          <Card className="p-4 bg-crm-warning-bg border-crm-warning-border rounded-2xl text-sm text-crm-warning-text">{error}</Card>
        )}

        {loading ? (
          <div className="h-64 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />
        ) : courses.length === 0 ? (
          <Card className="p-12 bg-white border-[var(--alo-border)] rounded-2xl text-center">
            <GitCompare className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" />
            <p className="text-sm text-[var(--alo-body)]">Nothing to compare yet — add courses from the course finder.</p>
            <Link href="/student/course-finder">
              <Button className="mt-4 bg-[var(--alo-brand)] text-white">Find Courses</Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-0 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--alo-page)]">
                  <th className="p-3 text-left font-semibold text-[var(--alo-text)]">Field</th>
                  {courses.map((course) => (
                    <th key={course.courseId} className="p-3 text-left font-semibold text-[var(--alo-text)]">
                      <span className="block truncate">{text(course.courseTitle ?? course.courseName)}</span>
                      <button
                        type="button"
                        onClick={() => void remove(course.courseId)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-crm-danger-text hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-[var(--alo-border)]/60">
                    <td className="p-3 font-medium text-[var(--alo-body)]">{row.label}</td>
                    {courses.map((course) => (
                      <td key={course.courseId} className="p-3 text-[var(--alo-body)]">{row.value(course)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div className="flex gap-3 justify-center">
          <Link href="/student/course-finder"><Button className="bg-[var(--alo-brand)] text-white h-12 px-6 font-bold">Back to Finder</Button></Link>
          <Link href="/student/shortlist"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">View Shortlist</Button></Link>
        </div>
      </div>
    </div>
  );
}
