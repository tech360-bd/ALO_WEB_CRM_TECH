'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GitCompare,
  X,
  Search,
  Plus,
  GraduationCap,
  Loader2,
  MapPin,
  Award,
  Clock,
  DollarSign,
  Calendar,
  BookOpen,
  Globe,
  Building2,
  Languages,
  Briefcase,
  ArrowLeft,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Constants ────────────────────────────────────────────────────────────
const MAX_COURSES = 4;

// ─── Types ────────────────────────────────────────────────────────────────

interface CourseCompareData {
  slug: string;
  name: string;
  countrySlug?: string;
  city?: string;
  campus?: string;
  level?: string;
  subject?: string;
  discipline?: string;
  studyArea?: string;
  deliveryMode?: string;
  degreeType?: string;
  duration?: string;
  intake?: string;
  tuition?: string;
  tuitionCurrency?: string;
  applicationFee?: string;
  scholarship?: string;
  scholarshipAvailable?: boolean;
  englishRequirement?: string;
  academicRequirement?: string;
  careerOutcomes?: string;
  placement?: string;
  visaNotes?: string;
  deadline?: string;
  university?: {
    name: string;
    slug: string;
    city?: string;
    logo?: string;
    ranking?: string;
    countrySlug?: string;
    country?: {
      name: string;
      shortName?: string;
      flag?: string;
      slug: string;
    };
  };
}

interface CourseComparePageProps {
  courseSlugs?: string[];
  onNavigate: (page: string, slug?: string) => void;
  onBack: () => void;
}

interface SearchResult {
  slug: string;
  name: string;
  universityName: string;
  country: string;
  level: string;
}

// ─── Comparison Rows Config ───────────────────────────────────────────────

type CompareRowKey =
  | 'university'
  | 'level'
  | 'duration'
  | 'tuition'
  | 'ielts'
  | 'intake'
  | 'campus'
  | 'scholarship'
  | 'deadline'
  | 'careerOutcomes'
  | 'visaNotes';

interface CompareRow {
  key: CompareRowKey;
  label: string;
  icon: React.ElementType;
}

const COMPARE_ROWS: CompareRow[] = [
  { key: 'university', label: 'University', icon: Building2 },
  { key: 'level', label: 'Level', icon: BookOpen },
  { key: 'duration', label: 'Duration', icon: Clock },
  { key: 'tuition', label: 'Tuition', icon: DollarSign },
  { key: 'ielts', label: 'IELTS Requirement', icon: Languages },
  { key: 'intake', label: 'Intake', icon: Calendar },
  { key: 'campus', label: 'Campus', icon: MapPin },
  { key: 'scholarship', label: 'Scholarship', icon: Award },
  { key: 'deadline', label: 'Deadline', icon: Calendar },
  { key: 'careerOutcomes', label: 'Career Outcomes', icon: Briefcase },
  { key: 'visaNotes', label: 'Visa Notes', icon: FileText },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function parseTuitionToNumber(tuition: string | undefined | null): number | null {
  if (!tuition) return null;
  const match = tuition.replace(/[^0-9.]/g, '').match(/^([0-9]+(?:\.[0-9]+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function parseIeltsToNumber(req: string | undefined | null): number | null {
  if (!req) return null;
  const match = req.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function parseCareerOutcomes(outcomes: string | undefined | null): string[] {
  if (!outcomes) return [];
  try {
    const parsed = JSON.parse(outcomes);
    if (Array.isArray(parsed)) return parsed.slice(0, 3);
    return [];
  } catch {
    // It might be a plain string
    if (outcomes.length > 10) return [outcomes.substring(0, 60) + '...'];
    return outcomes ? [outcomes] : [];
  }
}

function getLevelBadgeClasses(level: string): string {
  switch (level?.toLowerCase()) {
    case 'undergraduate':
    case 'bachelor':
      return 'bg-alo-blue/10 text-alo-blue';
    case 'postgraduate':
    case 'master':
      return 'bg-alo-blue/20 text-alo-blue';
    case 'phd':
    case 'doctorate':
      return 'bg-alo-orange/10 text-alo-orange';
    default:
      return 'bg-alo-gray-light text-alo-gray';
  }
}

/**
 * Determine which course slug has the "best" (lowest) tuition.
 * Returns null if comparison is not possible.
 */
function getBestTuitionSlug(courses: CourseCompareData[]): string | null {
  const entries = courses
    .map((c) => ({ slug: c.slug, val: parseTuitionToNumber(c.tuition) }))
    .filter((e) => e.val !== null);
  if (entries.length < 2) return null;
  const minVal = Math.min(...entries.map((e) => e.val!));
  const best = entries.find((e) => e.val === minVal);
  return best?.slug ?? null;
}

/**
 * Determine which course slug has the "best" (lowest) IELTS requirement.
 */
function getBestIeltsSlug(courses: CourseCompareData[]): string | null {
  const entries = courses
    .map((c) => ({ slug: c.slug, val: parseIeltsToNumber(c.englishRequirement) }))
    .filter((e) => e.val !== null);
  if (entries.length < 2) return null;
  const minVal = Math.min(...entries.map((e) => e.val!));
  const best = entries.find((e) => e.val === minVal);
  return best?.slug ?? null;
}

// ─── Cell Renderer ────────────────────────────────────────────────────────

function renderCell(
  course: CourseCompareData,
  key: CompareRowKey,
  isBest: boolean
): React.ReactNode {
  const bestClass = isBest
    ? 'bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1'
    : '';

  switch (key) {
    case 'university':
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (course.university?.slug) {
              window.dispatchEvent(
                new CustomEvent('alo-navigate', {
                  detail: { page: 'university', slug: course.university!.slug },
                })
              );
            }
          }}
          className="text-left group"
        >
          <span className={cn('text-sm font-medium text-alo-blue hover:underline', bestClass)}>
            {course.university?.name || 'N/A'}
          </span>
        </button>
      );

    case 'level':
      if (!course.level) return <span className="text-sm text-alo-gray">N/A</span>;
      return (
        <Badge
          variant="secondary"
          className={cn('text-xs font-medium', getLevelBadgeClasses(course.level))}
        >
          {course.level}
        </Badge>
      );

    case 'duration':
      return (
        <span className={cn('text-sm text-alo-black', bestClass)}>
          {course.duration || 'N/A'}
        </span>
      );

    case 'tuition': {
      const tuitionNum = parseTuitionToNumber(course.tuition);
      if (tuitionNum === null) {
        return <span className="text-sm text-alo-gray">N/A</span>;
      }
      return (
        <span className={cn('text-sm font-semibold', bestClass, isBest ? 'text-emerald-700' : 'text-alo-black')}>
          {course.tuitionCurrency || '£'}
          {tuitionNum.toLocaleString()}
          {isBest && <Star className="inline h-3 w-3 ml-1 text-emerald-600" />}
        </span>
      );
    }

    case 'ielts': {
      const ieltsNum = parseIeltsToNumber(course.englishRequirement);
      if (ieltsNum === null) {
        return <span className="text-sm text-alo-gray">{course.englishRequirement || 'N/A'}</span>;
      }
      return (
        <span className={cn('text-sm', bestClass, isBest ? 'text-emerald-700 font-medium' : 'text-alo-black')}>
          {course.englishRequirement}
          {isBest && <Star className="inline h-3 w-3 ml-1 text-emerald-600" />}
        </span>
      );
    }

    case 'intake':
      return (
        <span className="text-sm text-alo-black">{course.intake || 'N/A'}</span>
      );

    case 'campus':
      return (
        <span className="text-sm text-alo-black">
          {course.campus || course.city || 'N/A'}
        </span>
      );

    case 'scholarship':
      return course.scholarshipAvailable ? (
        <Badge className="bg-emerald-100 text-emerald-700 text-xs font-medium border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Available
        </Badge>
      ) : course.scholarship ? (
        <span className="text-xs text-alo-gray line-clamp-2">{course.scholarship}</span>
      ) : (
        <span className="text-sm text-alo-gray">None listed</span>
      );

    case 'deadline':
      return (
        <span className="text-sm text-alo-black">{course.deadline || 'N/A'}</span>
      );

    case 'careerOutcomes': {
      const outcomes = parseCareerOutcomes(course.careerOutcomes);
      if (outcomes.length === 0) {
        return <span className="text-sm text-alo-gray">N/A</span>;
      }
      return (
        <ul className="text-xs text-alo-gray space-y-1">
          {outcomes.map((o, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-alo-orange mt-0.5 flex-shrink-0">&#8226;</span>
              <span className="line-clamp-2">{o}</span>
            </li>
          ))}
        </ul>
      );
    }

    case 'visaNotes':
      return (
        <span className="text-xs text-alo-gray line-clamp-3">
          {course.visaNotes || 'N/A'}
        </span>
      );

    default:
      return null;
  }
}

// ─── Search Dialog Component ──────────────────────────────────────────────

function CourseSearchDialog({
  onSelect,
  disabled,
  existingSlugs,
  open,
  onOpenChange,
}: {
  onSelect: (course: SearchResult) => void;
  disabled: boolean;
  existingSlugs: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch('/api/courses/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ search: query, limit: 10 }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(
            (data.courses || []).map(
              (c: {
                slug: string;
                name: string;
                university?: { name: string };
                countrySlug?: string;
                level?: string;
              }) => ({
                slug: c.slug,
                name: c.name,
                universityName: c.university?.name || 'Unknown',
                country: c.countrySlug || '',
                level: c.level || '',
              })
            )
          );
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (course: SearchResult) => {
    onSelect(course);
    setQuery('');
    setResults([]);
    onOpenChange(false);
  };

  const filteredResults = results.filter(
    (r) => !existingSlugs.includes(r.slug)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className="border-alo-blue text-alo-blue hover:bg-alo-blue/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-alo-black">Search Courses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-gray" />
            <Input
              placeholder="Type course name, university, or subject..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-gray animate-spin" />
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredResults.length === 0 && !searching && query.length >= 2 && (
              <p className="text-sm text-alo-gray text-center py-8">
                No courses found. Try a different search term.
              </p>
            )}
            {filteredResults.map((r) => (
              <button
                key={r.slug}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-alo-blue-light border-b border-alo-gray-light last:border-0 transition-colors rounded-md"
              >
                <p className="text-sm font-medium text-alo-black truncate">{r.name}</p>
                <p className="text-xs text-alo-gray mt-0.5">
                  {r.universityName} &middot; {r.level}
                </p>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────

function CompareSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <NewNavbar onNavigate={() => {}} onLeadOpen={() => {}} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-52 mb-1" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <NewFooter onNavigate={() => {}} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────

function EmptyState({
  onAddClick,
  onBrowseClick,
}: {
  onAddClick: () => void;
  onBrowseClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-24 h-24 rounded-full bg-alo-blue-light flex items-center justify-center mb-6">
        <GitCompare className="h-12 w-12 text-alo-blue" />
      </div>
      <h2 className="text-xl font-bold text-alo-black mb-2">
        No courses to compare
      </h2>
      <p className="text-sm text-alo-gray max-w-md mb-8">
        Select up to {MAX_COURSES} courses to compare side-by-side. Use the search
        to find courses, or browse from the course finder.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={onAddClick} className="bg-alo-blue hover:bg-alo-blue-dark text-white">
          <Search className="h-4 w-4 mr-2" />
          Search Courses
        </Button>
        <Button
          variant="outline"
          onClick={onBrowseClick}
          className="border-alo-blue text-alo-blue hover:bg-alo-blue/5"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          Browse Course Finder
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function CourseComparePage({
  courseSlugs: initialSlugs,
  onNavigate,
  onBack,
}: CourseComparePageProps) {
  const [courses, setCourses] = useState<CourseCompareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // Fetch courses individually from the existing /api/courses/[slug] endpoint
  const fetchCourses = useCallback(async (slugs: string[]) => {
    if (slugs.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        slugs.map(async (s) => {
          try {
            const res = await fetch(`/api/courses/${encodeURIComponent(s)}`);
            if (res.ok) {
              const data = await res.json();
              return data.course as CourseCompareData | undefined;
            }
          } catch {
            // skip failed individual fetches
          }
          return undefined;
        })
      );
      setCourses(results.filter((c): c is CourseCompareData => c != null));
    } catch {
      toast.error('Failed to load courses for comparison');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSlugs && initialSlugs.length > 0) {
      fetchCourses(initialSlugs);
    } else {
      setLoading(false);
    }
  }, [initialSlugs, fetchCourses]);

  // Listen for custom navigation events from cell clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page && detail?.slug) {
        onNavigate(detail.page, detail.slug);
      }
    };
    window.addEventListener('alo-navigate', handler);
    return () => window.removeEventListener('alo-navigate', handler);
  }, [onNavigate]);

  // Pre-compute best values for highlighting
  const bestTuitionSlug = useMemo(
    () => getBestTuitionSlug(courses),
    [courses]
  );
  const bestIeltsSlug = useMemo(
    () => getBestIeltsSlug(courses),
    [courses]
  );

  // Add course from search
  const handleAddCourse = useCallback(
    async (searchResult: SearchResult) => {
      if (courses.some((c) => c.slug === searchResult.slug)) {
        toast.info('Course already in comparison');
        return;
      }
      if (courses.length >= MAX_COURSES) {
        toast.error(`You can compare up to ${MAX_COURSES} courses at a time`);
        return;
      }

      // Fetch the full course data from /api/courses/[slug]
      const newSlugs = [...courses.map((c) => c.slug), searchResult.slug];
      await fetchCourses(newSlugs);
      toast.success('Course added to comparison!');
    },
    [courses, fetchCourses]
  );

  // Remove course
  const handleRemove = useCallback(
    async (slug: string) => {
      setRemoving(slug);
      // Small delay for visual feedback
      await new Promise((r) => setTimeout(r, 200));
      const remaining = courses.filter((c) => c.slug !== slug);
      setCourses(remaining);
      setRemoving(null);
      toast.success('Course removed');
    },
    [courses]
  );

  // ── Loading ──
  if (loading) return <CompareSkeleton />;

  const existingSlugs = courses.map((c) => c.slug);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ═══ Back Link ═══ */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-alo-gray hover:text-alo-blue transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* ═══ Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-alo-blue-light flex items-center justify-center">
              <GitCompare className="h-5 w-5 text-alo-blue" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-alo-black">
                Course Comparison
              </h1>
              <p className="text-sm text-alo-gray">
                {courses.length > 0
                  ? `Comparing ${courses.length} course${courses.length > 1 ? 's' : ''} (max ${MAX_COURSES})`
                  : 'Select courses to compare side-by-side'}
              </p>
            </div>
            {courses.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-alo-blue/10 text-alo-blue font-medium"
              >
                {courses.length}/{MAX_COURSES}
              </Badge>
            )}
          </div>

          <CourseSearchDialog
            onSelect={handleAddCourse}
            disabled={courses.length >= MAX_COURSES}
            existingSlugs={existingSlugs}
            open={searchDialogOpen}
            onOpenChange={setSearchDialogOpen}
          />
        </div>

        {/* ═══ Max Reached Warning ═══ */}
        {courses.length >= MAX_COURSES && (
          <p className="text-xs text-alo-orange mb-6">
            <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
            Maximum {MAX_COURSES} courses reached. Remove one to add another.
          </p>
        )}

        {/* ═══ Empty State ═══ */}
        {courses.length === 0 && (
          <EmptyState
            onAddClick={() => setSearchDialogOpen(true)}
            onBrowseClick={() => onNavigate('course-finder')}
          />
        )}

        {/* ═══ Comparison Cards (Responsive Grid) ═══ */}
        {courses.length > 0 && (
          <>
            {/* Mobile: Horizontal scroll  |  Desktop: Grid */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div
                className={cn(
                  'grid gap-4 min-w-0',
                  'grid-cols-1',
                  'sm:grid-cols-2',
                  courses.length >= 3 && 'lg:grid-cols-3',
                  courses.length >= 4 && 'xl:grid-cols-4'
                )}
                style={{
                  minWidth: courses.length >= 3 ? `${courses.length * 300}px` : undefined,
                }}
              >
                {courses.map((course) => (
                  <Card
                    key={course.slug}
                    className="overflow-hidden border-alo-gray-medium/50 hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Card Header with remove button */}
                    <div className="relative p-4 pb-3 bg-alo-blue-light/30 border-b border-alo-gray-medium/30">
                      <button
                        onClick={() => handleRemove(course.slug)}
                        disabled={removing === course.slug}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full hover:bg-white/80 transition-colors text-alo-gray hover:text-red-500"
                        aria-label={`Remove ${course.name}`}
                      >
                        {removing === course.slug ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onNavigate('course', course.slug)}
                        className="text-left w-full pr-8 group"
                      >
                        <h3 className="text-sm font-semibold text-alo-blue group-hover:underline leading-snug line-clamp-2">
                          {course.name}
                        </h3>
                        <p className="text-xs text-alo-gray mt-1.5">
                          {course.university?.name || 'Unknown University'}
                          {course.university?.country && (
                            <span className="ml-1.5">
                              {course.university.country.flag}
                            </span>
                          )}
                        </p>
                      </button>
                    </div>

                    {/* Card Body: Comparison Rows */}
                    <CardContent className="p-4 flex-1">
                      <div className="space-y-3">
                        {COMPARE_ROWS.map((row) => {
                          const RowIcon = row.icon;
                          const isBest =
                            (row.key === 'tuition' && course.slug === bestTuitionSlug) ||
                            (row.key === 'ielts' && course.slug === bestIeltsSlug);

                          return (
                            <div key={row.key} className="flex items-start gap-2.5">
                              <RowIcon className="h-3.5 w-3.5 text-alo-gray mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-alo-gray uppercase tracking-wide mb-0.5">
                                  {row.label}
                                </p>
                                {renderCell(course, row.key, isBest)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>

                    {/* Card Footer */}
                    <div className="p-4 pt-0">
                      <Button
                        size="sm"
                        className="w-full bg-alo-blue hover:bg-alo-blue-dark text-white"
                        onClick={() => onNavigate('course', course.slug)}
                      >
                        View Details
                        <GraduationCap className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* Empty slot cards */}
                {Array.from({
                  length: MAX_COURSES - courses.length,
                }).map((_, i) => (
                  <Card
                    key={`empty-${i}`}
                    className="border-dashed border-alo-gray-medium flex items-center justify-center min-h-[300px]"
                  >
                    <div className="text-center p-6">
                      <Plus className="h-8 w-8 text-alo-gray-medium mx-auto mb-2" />
                      <p className="text-sm text-alo-gray-medium">
                        {courses.length < MAX_COURSES
                          ? 'Add another course'
                          : 'Max reached'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* ═══ Action Buttons ═══ */}
            <div className="flex flex-wrap gap-3 mt-8 justify-center">
              <Button
                size="lg"
                className="bg-alo-blue hover:bg-alo-blue-dark text-white px-8"
                onClick={() => {
                  toast.success(
                    `Ready to apply for ${courses.length} course(s). A counsellor will be in touch.`
                  );
                }}
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Apply with ALO
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-alo-orange text-alo-orange hover:bg-alo-orange/5 px-6"
                onClick={() => {
                  toast.success('Comparison sent to your counsellor!');
                }}
              >
                <Globe className="h-5 w-5 mr-2" />
                Send to Counsellor
              </Button>
            </div>
          </>
        )}
      </main>

      <NewFooter onNavigate={() => {}} />
    </div>
  );
}
