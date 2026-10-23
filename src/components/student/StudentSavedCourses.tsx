'use client';

/**
 * Saved courses — /student/saved (spec §107)
 *
 * The student's own shortlist from GET /api/student/shortlist, with removal via
 * the same endpoint. Values recorded against a course are displayed exactly as
 * stored; a field the course record does not carry is shown as not recorded
 * rather than filled in.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  useStudentResource,
} from './portal-section';

interface SavedCourse {
  id: string;
  courseName: string;
  universityName: string;
  country: string;
  level: string;
  department: string;
  tuitionFee: string;
  intake: string;
  notes: string;
  createdAt: string;
}

interface ShortlistResponse {
  success: boolean;
  data: SavedCourse[];
}

export default function StudentSavedCourses() {
  const { data, state, error, reload } = useStudentResource<ShortlistResponse>('/api/student/shortlist');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  const [level, setLevel] = useState('all');
  const [removing, setRemoving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const courses = data?.data ?? [];

  const countries = useMemo(
    () => Array.from(new Set(courses.map((course) => course.country).filter(Boolean))).sort(),
    [courses],
  );
  const levels = useMemo(
    () => Array.from(new Set(courses.map((course) => course.level).filter(Boolean))).sort(),
    [courses],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (country !== 'all' && course.country !== country) return false;
      if (level !== 'all' && course.level !== level) return false;
      if (!needle) return true;
      return [course.courseName, course.universityName, course.department, course.country]
        .some((field) => (field ?? '').toLowerCase().includes(needle));
    });
  }, [courses, country, level, query]);

  const remove = async (course: SavedCourse) => {
    setRemoving(course.id);
    setActionError(null);
    try {
      const response = await fetch('/api/student/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'remove',
          courseName: course.courseName,
          courseId: course.notes,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `Removal failed with status ${response.status}.`);
      }
      reload();
    } catch (caught) {
      setActionError((caught as Error).message || 'The course could not be removed.');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <PortalPageHeader
          title="Saved Courses"
          description="Courses you shortlisted while searching. Only you and your assigned counselor can see this list."
          action={
            <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
              <Link href="/course-finder">
                <Search className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Find More Courses
              </Link>
            </Button>
          }
        />

        {actionError && (
          <div className="mb-4">
            <PortalError message={actionError} onRetry={() => setActionError(null)} />
          </div>
        )}

        {state === 'loading' && <PortalLoading label="Loading your shortlist…" />}

        {state === 'error' && <PortalError message={error ?? 'Your shortlist could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && courses.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="No saved courses yet"
              description="Save courses from the course finder and they will collect here, so you can compare them and share the shortlist with your counselor."
              action={
                <Button asChild className=" rounded-button bg-[var(--alo-cta-hover)] px-4 text-[13px] font-semibold text-white hover:bg-orange-700">
                  <Link href="/course-finder">Search the Course Finder</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && courses.length > 0 && (
          <PortalCard
            title={`${filtered.length} of ${courses.length} saved course${courses.length === 1 ? '' : 's'}`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your shortlist"
                  aria-label="Search saved courses"
                  className="h-9 w-full rounded-input border-[var(--alo-border)] sm:w-52"
                />
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-9 w-full rounded-input border-[var(--alo-border)] sm:w-36" aria-label="Filter by country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countries.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-9 w-full rounded-input border-[var(--alo-border)] sm:w-36" aria-label="Filter by study level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {levels.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            }
          >
            {filtered.length === 0 ? (
              <PortalEmpty
                title="No saved courses match those filters"
                description="Clear the search or filters to see your full shortlist again."
              />
            ) : (
              <ul className="divide-y divide-[var(--alo-border)]">
                {filtered.map((course) => (
                  <li key={course.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                    <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-[var(--alo-cta)]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--alo-text)]">{course.courseName}</p>
                      <p className="mt-0.5 text-[13px] text-[var(--alo-body)]">
                        {course.universityName || 'University not recorded'}
                        {course.country ? ` — ${course.country}` : ''}
                      </p>
                      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                        <Field label="Level" value={course.level} />
                        <Field label="Department" value={course.department} />
                        <Field label="Tuition" value={course.tuitionFee} />
                        <Field label="Intake" value={course.intake} />
                        <Field label="Saved" value={new Date(course.createdAt).toLocaleDateString('en-GB')} />
                      </dl>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
 variant="outline"
 className=" rounded-button border-[var(--alo-border)] px-3 text-[12px] font-semibold text-red-600"
 onClick={() => remove(course)}
                        disabled={removing === course.id}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {removing === course.id ? 'Removing…' : 'Remove'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PortalCard>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">{label}</dt>
      <dd className="text-[13px] text-[var(--alo-body)]">{value || 'Not recorded'}</dd>
    </div>
  );
}
