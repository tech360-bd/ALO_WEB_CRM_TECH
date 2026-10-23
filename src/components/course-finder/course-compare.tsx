'use client';

import { useState, useCallback } from 'react';
import {
  GitCompare, X, Send, Plus, SearchX,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { COUNTRY_FLAGS } from './types';
import type { Course } from './types';

interface CourseCompareProps {
  courses: Course[];
  onRemove: (id: string) => void;
  onApplySelected: () => void;
}

const COMPARE_ROWS = [
  { key: 'universityName', label: 'University' },
  { key: 'courseTitle', label: 'Course' },
  { key: 'country', label: 'Country' },
  { key: 'studyLevel', label: 'Level' },
  { key: 'duration', label: 'Duration' },
  { key: 'tuitionFee', label: 'Tuition' },
  { key: 'ieltsMin', label: 'IELTS Req' },
  { key: 'pteMin', label: 'PTE Req' },
  { key: 'hasScholarship', label: 'Scholarship' },
  { key: 'intake', label: 'Intake' },
] as const;

function renderCellValue(course: Course, key: string): React.ReactNode {
  switch (key) {
    case 'universityName':
      return (
        <span className="font-medium text-emerald-600">
          {COUNTRY_FLAGS[course.country]} {course.universityName}
        </span>
      );
    case 'country':
      return `${COUNTRY_FLAGS[course.country]} ${course.country}`;
    case 'tuitionFee':
      return `${course.tuitionCurrency} ${course.tuitionFee.toLocaleString()}/yr`;
    case 'ieltsMin':
      return course.ieltsMin ?? '—';
    case 'pteMin':
      return course.pteMin ?? '—';
    case 'hasScholarship':
      return course.hasScholarship ? (
        <Badge className="bg-emerald-600 text-white text-xs">Available</Badge>
      ) : (
        <span className="text-[var(--alo-text-muted)]">None</span>
      );
    case 'studyLevel':
      return (
        <Badge variant="secondary" className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] text-xs">
          {course.studyLevel}
        </Badge>
      );
    default:
      return (course as unknown as Record<string, unknown>)[key] as React.ReactNode ?? '—';
  }
}

export function CourseCompare({ courses, onRemove, onApplySelected }: CourseCompareProps) {
  const [applying, setApplying] = useState(false);

  const handleApply = useCallback(async () => {
    setApplying(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setApplying(false);
    onApplySelected();
    toast.success(`Applications submitted for ${courses.length} course(s)`);
  }, [courses.length, onApplySelected]);

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[var(--alo-surface-muted)] flex items-center justify-center mb-4">
          <GitCompare className="size-10 text-[var(--alo-placeholder)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--alo-body)]">Select courses to compare</h3>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1 max-w-md">
          Use the &quot;Compare&quot; button on course cards to add up to 3 courses for side-by-side comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="size-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-[var(--alo-text)]">
            Compare Courses
          </h2>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
            {courses.length}/3
          </Badge>
        </div>
        <Button
          onClick={handleApply}
          disabled={applying}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {applying ? (
            <>
              <span className="animate-spin mr-1.5">⟳</span>
              Submitting...
            </>
          ) : (
            <>
              <Send className="size-4 mr-1.5" />
              Apply to Selected
            </>
          )}
        </Button>
      </div>

      {/* Comparison Table */}
      <Card className="overflow-hidden border-[var(--alo-border)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
                <th className="text-left text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4 w-32">
                  Attribute
                </th>
                {courses.map((course) => (
                  <th key={course.id} className="text-left p-4 min-w-[220px] relative">
                    <button
                      onClick={() => onRemove(course.id)}
                      className="absolute top-2 right-2 text-[var(--alo-text-muted)] hover:text-red-500 transition-colors"
                      aria-label={`Remove ${course.courseTitle}`}
                    >
                      <X className="size-4" />
                    </button>
                    <p className="text-sm font-semibold text-emerald-600 pr-6">
                      {COUNTRY_FLAGS[course.country]} {course.universityName}
                    </p>
                  </th>
                ))}
                {/* Fill remaining columns for visual consistency */}
                {Array.from({ length: 3 - courses.length }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-4 min-w-[220px] border-l border-dashed border-[var(--alo-border)]">
                    <div className="flex flex-col items-center justify-center py-4 text-[var(--alo-placeholder)]">
                      <Plus className="size-6" />
                      <span className="text-xs mt-1">Add course</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, idx) => (
                <tr
                  key={row.key}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-[var(--alo-page)]/50'}
                >
                  <td className="text-sm font-medium text-[var(--alo-body)] p-4 border-r border-[var(--alo-border)]">
                    {row.label}
                  </td>
                  {courses.map((course) => (
                    <td
                      key={course.id}
                      className="text-sm text-[var(--alo-text)] p-4"
                    >
                      {renderCellValue(course, row.key)}
                    </td>
                  ))}
                  {Array.from({ length: 3 - courses.length }).map((_, i) => (
                    <td key={`empty-val-${i}`} className="p-4 border-l border-dashed border-[var(--alo-border)]">
                      <span className="text-[var(--alo-placeholder)]">—</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * Wrapper that manages the comparison state locally.
 * Pass in courses to pre-populate, or use it standalone.
 */
export function CourseCompareManager() {
  const [selected, setSelected] = useState<Course[]>([]);

  const handleAdd = useCallback((course: Course) => {
    setSelected((prev) => {
      if (prev.length >= 3) {
        toast.error('You can compare up to 3 courses at a time');
        return prev;
      }
      if (prev.some((c) => c.id === course.id)) {
        toast.info('Course already in comparison');
        return prev;
      }
      return [...prev, course];
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleApplySelected = useCallback(() => {
    setSelected([]);
  }, []);

  return (
    <CourseCompare
      courses={selected}
      onRemove={handleRemove}
      onApplySelected={handleApplySelected}
    />
  );
}