'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookmarkX,
  Bookmark,
  GitCompareArrows,
  ArrowRight,
  Trash2,
  Calendar,
  Globe,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
// Mirrors the real `SavedCourse` model (prisma/schema.prisma) and the
// /api/student/shortlist payload. Nothing here is seeded: every value the
// student sees comes from that endpoint or is rendered as "Not recorded".
// This file intentionally contains NO visa, work-rights, PSW, ranking or
// match-score claims — the CRM shortlist does not store them, and
// inventing them would put fabricated facts in front of students.
interface ShortlistRow {
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

const show = (value: string | null | undefined) =>
  value && value.trim().length > 0 ? value : 'Not recorded';

export default function StudentCompare() {
  const [rows, setRows] = useState<ShortlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('shortlist');
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const loadShortlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/shortlist', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || `Failed to load shortlist (${res.status})`);
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load your shortlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShortlist();
  }, [loadShortlist]);

  const selectedCourses = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  );

  const removeCourse = async (id: string) => {
    setPendingRemove(id);
    try {
      const res = await fetch('/api/student/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', courseId: id, courseName: rows.find((r) => r.id === id)?.courseName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || `Failed to remove course (${res.status})`);
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      setError(err?.message || 'Could not remove the course. Please try again.');
    } finally {
      setPendingRemove(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-[var(--alo-border)] bg-alo-hero px-4 py-8 md:py-10">
        <div className="max-w-6xl mx-auto">
          <p className="caption-text mb-2">Course shortlist</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)] mb-2">
            Shortlist &amp; Compare
          </h1>
          <p className="text-[var(--alo-text-secondary)] text-sm md:text-base max-w-xl">
            Your shortlisted courses are stored in your ALO portal. Compare the recorded details side by side; anything not yet recorded is labelled as such.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div role="alert" className="mb-4 border border-crm-warning-border bg-crm-warning-bg text-crm-warning-text rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <TabsList className="h-10">
              <TabsTrigger value="shortlist" className="gap-2 px-5">
                <Bookmark className="size-4" />
                My Shortlist
                {rows.length > 0 && (
                  <span className="ml-1 size-5 rounded-full bg-[var(--alo-brand)] text-white text-[11px] flex items-center justify-center font-bold">
                    {rows.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2 px-5">
                <GitCompareArrows className="size-4" />
                Compare
                {selectedCourses.length > 0 && (
                  <span className="ml-1 size-5 rounded-full bg-[var(--alo-cta-hover)] text-white text-[11px] flex items-center justify-center font-bold">
                    {selectedCourses.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {activeTab === 'shortlist' && selectedCourses.length >= 2 && (
              <Button variant="brand" onClick={() => setActiveTab('compare')} className="gap-2">
                <GitCompareArrows className="size-4" />
                Compare Selected ({selectedCourses.length})
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>

          {/* Shortlist Tab */}
          <TabsContent value="shortlist">
            {loading ? (
              <div className="text-center py-20" role="status">
                <p className="text-[var(--alo-text-muted)]">Loading your shortlist…</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-20">
                <BookmarkX className="size-16 text-[var(--alo-text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--alo-body)] mb-2">No courses shortlisted yet</h3>
                <p className="text-sm text-[var(--alo-text-muted)] max-w-md mx-auto mb-6">
                  Browse the course finder and shortlist courses you like. You can keep up to 5 for side-by-side comparison.
                </p>
                <Link href="/course-finder">
                  <Button variant="cta" className="gap-2">
                    Browse Courses
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--alo-text-muted)] mb-4">
                  Select 2-5 courses to compare using the checkboxes.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {rows.map((row) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                      <div
                        key={row.id}
                        className="flex items-start gap-3 border border-[var(--alo-border)] rounded-xl p-4 bg-white"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(row.id)}
                          aria-label={`Select ${row.courseName} for comparison`}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[var(--alo-text)] leading-snug">{row.courseName || 'Untitled course'}</div>
                          <div className="mt-1 text-xs text-[var(--alo-text-muted)] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="inline-flex items-center gap-1"><Globe className="size-3" />{show(row.universityName)}{row.country ? ` — ${row.country}` : ''}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {row.level && <Badge variant="outline" className="text-[11px] px-2 py-0">{row.level}</Badge>}
                            {row.intake && (
                              <Badge variant="outline" className="text-[11px] px-2 py-0">
                                <Calendar className="size-3 mr-1" />{row.intake}
                              </Badge>
                            )}
                            {row.tuitionFee && <Badge variant="outline" className="text-[11px] px-2 py-0">Tuition: {row.tuitionFee}</Badge>}
                          </div>
                          <div className="mt-3 flex items-center justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={pendingRemove === row.id}
                              onClick={() => removeCourse(row.id)}
                              className="gap-1 text-crm-danger-text border-crm-danger-border"
                            >
                              <Trash2 className="size-3" />
                              {pendingRemove === row.id ? 'Removing…' : 'Remove'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare">
            {selectedCourses.length < 2 ? (
              <div className="text-center py-20">
                <GitCompareArrows className="size-16 text-[var(--alo-text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--alo-body)] mb-2">
                  {selectedCourses.length === 0 ? 'No courses selected for comparison' : 'Select at least 2 courses'}
                </h3>
                <p className="text-sm text-[var(--alo-text-muted)] max-w-md mx-auto mb-6">
                  Go to the Shortlist tab, select 2-5 courses using the checkboxes, and come back to see them side by side.
                </p>
                <Button variant="outline" onClick={() => setActiveTab('shortlist')} className="gap-2">
                  Go to Shortlist
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Detail</TableHead>
                      {selectedCourses.map((course) => (
                        <TableHead key={course.id} className="min-w-[200px] align-top">
                          <div className="font-semibold text-[var(--alo-text)] leading-snug">{course.courseName || 'Untitled course'}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {([
                      ['University', (c: ShortlistRow) => show(c.universityName)],
                      ['Country', (c: ShortlistRow) => show(c.country)],
                      ['Academic level', (c: ShortlistRow) => show(c.level)],
                      ['Department', (c: ShortlistRow) => show(c.department)],
                      ['Tuition fee', (c: ShortlistRow) => show(c.tuitionFee)],
                      ['Intake', (c: ShortlistRow) => show(c.intake)],
                      ['Shortlisted on', (c: ShortlistRow) => {
                        const d = new Date(c.createdAt);
                        return Number.isNaN(d.getTime()) ? 'Not recorded' : d.toLocaleDateString();
                      }],
                    ] as Array<[string, (c: ShortlistRow) => string]>).map(([label, render]) => (
                      <TableRow key={label}>
                        <TableCell className="font-medium text-[var(--alo-text-muted)]">{label}</TableCell>
                        {selectedCourses.map((course) => (
                          <TableCell key={course.id}>{render(course)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium text-[var(--alo-text-muted)]">Fees, deadlines, English &amp; academic requirements, scholarships, intakes</TableCell>
                      {selectedCourses.map((course) => (
                        <TableCell key={course.id} className="text-sm text-[var(--alo-text-muted)]">
                          Not stored in your shortlist. Your counsellor can confirm the verified record for this course.
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="mt-4 text-xs text-[var(--alo-text-muted)] border border-[var(--alo-border)] rounded-xl px-4 py-3">
                  Only details stored against your saved shortlist are shown. Where a fee, deadline, requirement or scholarship is not recorded here, it is intentionally left blank rather than guessed — ask your ALO counsellor for the source-verified record before making any decision.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
