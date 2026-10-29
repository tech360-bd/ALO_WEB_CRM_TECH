'use client';

/**
 * Student shortlist — /student/shortlist
 *
 * Reads GET /api/course-finder/saved (course_shortlists, unique on
 * studentId+courseId, filtered to currently-public courses). Remove calls
 * DELETE on the same endpoint, so the button reflects a real state change
 * instead of being disabled.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookmarkPlus, GitCompare, Loader2, Send, Search, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SavedCourse {
  courseId?: string;
  id?: string;
  courseTitle?: string | null;
  courseName?: string | null;
  courseSlug?: string | null;
  universityName?: string | null;
  country?: string | null;
  tuitionFee?: number | string | null;
  tuitionCurrency?: string | null;
  intake?: string | null;
  matchScore?: number | null;
  university?: { name?: string | null; country?: string | null } | null;
}

export default function StudentShortlistPage() {
  const [shortlist, setShortlist] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/course-finder/saved', { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setShortlist([]);
        setError('Sign in as a student to see your shortlist.');
        return;
      }
      setShortlist(Array.isArray(json.courses) ? json.courses : []);
    } catch {
      setShortlist([]);
      setError('Could not load your shortlist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (course: SavedCourse) => {
    const courseId = course.courseId || course.id || course.courseSlug;
    if (!courseId) return;
    setBusyId(String(courseId));
    try {
      const res = await fetch(`/api/course-finder/saved?courseId=${encodeURIComponent(String(courseId))}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setShortlist((current) => current.filter((row) => (row.courseId || row.id || row.courseSlug) !== courseId));
      } else {
        setError('The course could not be removed.');
      }
    } catch {
      setError('The course could not be removed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">
            course_shortlists · unique per student + course
          </Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Your Shortlisted Courses</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">
            {shortlist.length} saved course{shortlist.length === 1 ? '' : 's'}. Only courses that are still
            verified and published in the catalogue are shown.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/student/course-finder">
              <Button variant="outline" className="border-[var(--alo-border)]"><Search className="mr-2 h-4 w-4" />Find more courses</Button>
            </Link>
            <Link href="/student/compare">
              <Button className="bg-[var(--alo-brand)] text-white"><GitCompare className="mr-2 h-4 w-4" />Compare</Button>
            </Link>
          </div>
        </div>

        {error && <Card className="p-4 bg-amber-50 border-amber-200 rounded-2xl text-sm text-amber-800">{error}</Card>}

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-32 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : shortlist.length === 0 ? (
          <Card className="p-12 bg-white border-[var(--alo-border)] rounded-2xl text-center">
            <BookmarkPlus className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" />
            <p className="text-sm text-[var(--alo-body)]">No saved courses yet.</p>
            <Link href="/student/course-finder">
              <Button className="mt-4 bg-[var(--alo-brand)] text-white">Find Courses</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {shortlist.map((course) => {
              const courseId = String(course.courseId || course.id || course.courseSlug || '');
              const title = course.courseTitle || course.courseName || 'Untitled course';
              const university = course.university?.name || course.universityName || '';
              const country = course.university?.country || course.country || '';
              return (
                <Card key={courseId} className="p-5 bg-white border-[var(--alo-border)] rounded-2xl">
                  <h3 className="font-bold text-sm">{title}</h3>
                  <p className="text-xs text-[var(--alo-text-muted)] mt-1">
                    {[university, country].filter(Boolean).join(' • ') || 'University details not published'}
                  </p>
                  <p className="text-xs text-[var(--alo-body)] mt-1">
                    Tuition: {course.tuitionFee ? `${course.tuitionCurrency || ''} ${course.tuitionFee}`.trim() : 'Not published'}
                    {course.matchScore !== null && course.matchScore !== undefined ? ` · Match ${course.matchScore}%` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href="/student/compare">
                      <Button size="sm" variant="outline" className="border-[var(--alo-border)]">
                        <GitCompare className="w-3 h-3 mr-1" />Compare
                      </Button>
                    </Link>
                    <Link href={`/student/apply/${encodeURIComponent(courseId)}`}>
                      <Button size="sm" className="bg-[var(--alo-cta)] text-white">
                        <Send className="w-3 h-3 mr-1" />Apply
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === courseId}
                      onClick={() => void remove(course)}
                      className="border-[var(--alo-border)] text-red-600"
                    >
                      {busyId === courseId
                        ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        : <Trash2 className="w-3 h-3 mr-1" />}
                      Remove
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
