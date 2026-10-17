'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Search,
  GraduationCap,
  Globe,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  ArrowUpRight,
  Info,
  RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
// Mirrors /api/student-portal/course-finder, which returns CrmCourse rows
// enriched with their CrmUniversity. Only fields that exist on those models
// are modelled here — no predicted admission, visa or scholarship percentages,
// because none are computed or stored anywhere.
interface CourseUniversity {
  universityId: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  scholarships: string;
  tuitionRange: string;
  website: string;
}

interface MatchedCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  studyLevel: string;
  programLevel: string;
  subjectArea: string;
  disciplineArea: string;
  country: string;
  city: string;
  durationMonths: number;
  tuitionFee: number;
  currency: string;
  deadline: string;
  officialUrl: string;
  sourceUrl: string;
  verificationStatus: string;
  lastVerifiedAt: string;
  university: CourseUniversity | null;
}

const VERIFICATION_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  VERIFIED: { label: 'Verified', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  OFFICIAL_SOURCE_FOUND: { label: 'Official source found', className: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  NEEDS_REVIEW: { label: 'Needs review', className: 'bg-amber-100 text-amber-700', icon: Info },
  PARTIAL: { label: 'Partially verified', className: 'bg-amber-100 text-amber-700', icon: Info },
  UNVERIFIED: { label: 'Unverified', className: 'bg-gray-100 text-gray-600', icon: AlertTriangle },
  EXPIRED_SOURCE: { label: 'Source expired', className: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  CONFLICT_FOUND: { label: 'Conflict found', className: 'bg-red-100 text-red-700', icon: AlertTriangle },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

function verificationMeta(value: string) {
  const key = (value || '').toUpperCase();
  return VERIFICATION_META[key] ?? { label: value || 'Status unknown', className: 'bg-gray-100 text-gray-600', icon: Info };
}

function formatMoney(amount: number, currency: string) {
  if (!amount || amount <= 0) return null;
  const code = (currency || '').toUpperCase() || 'GBP';
  return `${code} ${amount.toLocaleString('en-GB')}`;
}

function formatDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CourseCard({ course }: { course: MatchedCourse }) {
  const uni = course.university;
  const vMeta = verificationMeta(course.verificationStatus);
  const VIcon = vMeta.icon;
  const tuition = formatMoney(course.tuitionFee, course.currency);
  const location = [course.city, course.country].filter(Boolean).join(', ')
    || [uni?.city, uni?.country].filter(Boolean).join(', ');
  // Resolved once so the JSX below never has to null-guard `uni` inline.
  const tuitionRange = uni?.tuitionRange ?? '';
  const ranking = uni?.ranking ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 leading-snug">{course.courseTitle}</h3>
          <p className="text-sm text-slate-600 mt-0.5 truncate">
            {uni?.name || 'University record not linked'}
          </p>
        </div>
        <Badge className={`text-[10px] shrink-0 ${vMeta.className}`}>
          <VIcon className="size-3 mr-1" />
          {vMeta.label}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
        {location && (
          <span className="flex items-center gap-1"><Globe className="size-3.5 text-slate-400" />{location}</span>
        )}
        {(course.studyLevel || course.programLevel) && (
          <span className="flex items-center gap-1">
            <GraduationCap className="size-3.5 text-slate-400" />
            {course.studyLevel || course.programLevel}
          </span>
        )}
        {course.durationMonths > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-slate-400" />
            {course.durationMonths} months
          </span>
        )}
        {(course.subjectArea || course.disciplineArea) && (
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5 text-slate-400" />
            {course.subjectArea || course.disciplineArea}
          </span>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[11px] text-slate-500">Tuition</p>
          <p className="font-medium text-slate-800">{tuition ?? 'Not published'}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Application deadline</p>
          <p className="font-medium text-slate-800">{formatDate(course.deadline) ?? 'Not published'}</p>
        </div>
      </div>

      {(tuitionRange || ranking) && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {tuitionRange && (
            <div>
              <p className="text-[11px] text-slate-500">University fee range</p>
              <p className="font-medium text-slate-800">{tuitionRange}</p>
            </div>
          )}
          {ranking > 0 && (
            <div>
              <p className="text-[11px] text-slate-500">Recorded ranking</p>
              <p className="font-medium text-slate-800">#{ranking}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-[11px] text-slate-400">
          {course.lastVerifiedAt
            ? `Last verified ${formatDate(course.lastVerifiedAt)}`
            : 'No verification date recorded'}
        </p>
        {course.officialUrl && (
          <a
            href={course.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Official source<ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function StudentAiMatch() {
  usePortalStore();

  const [courses, setCourses] = useState<MatchedCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = usePortalStore.getState().token;
      const params = new URLSearchParams({ limit: '50' });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (levelFilter !== 'all') params.set('studyLevel', levelFilter);

      const response = await fetch(`/api/student-portal/course-finder?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Course matches could not be loaded.');
      }
      setCourses(Array.isArray(result.data) ? result.data : []);
      setTotal(typeof result.total === 'number' ? result.total : 0);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Course matches could not be loaded.');
      setCourses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, levelFilter]);

  useEffect(() => {
    const handle = setTimeout(() => { void loadCourses(); }, searchQuery ? 350 : 0);
    return () => clearTimeout(handle);
  }, [loadCourses, searchQuery]);

  const verifiedCount = courses.filter((c) =>
    ['VERIFIED', 'OFFICIAL_SOURCE_FOUND'].includes((c.verificationStatus || '').toUpperCase())
  ).length;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0057B8] to-[#003d8f] px-4 py-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="shrink-0 size-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Course Matching
                </h1>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  Courses from the verified ALO catalogue, filtered by your search and programme level.
                  Every record shows its own verification status and last-verified date.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses by title..."
                  className="h-10 pl-10 pr-4 text-sm rounded-lg bg-white border-0"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Program Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="Masters">Masters</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                className="h-10 rounded-lg"
                onClick={() => void loadCourses()}
                disabled={loading}
              >
                <RefreshCw className={`size-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Results ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{courses.length}</span>
            {total > courses.length ? ` of ${total}` : ''} catalogue courses
            {courses.length > 0 && (
              <span className="text-slate-400"> · {verifiedCount} verified</span>
            )}
          </p>
          <Badge variant="brand" className="text-xs">
            <ShieldCheck className="size-3 mr-1" /> Verified catalogue only
          </Badge>
        </div>

        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
          <Info className="size-4 shrink-0 text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">
            This list shows catalogue records, not a prediction of your chances. Admission decisions are
            made by the university and visa decisions by the issuing government, so no approval or
            acceptance percentage is shown. Use the Eligibility Check for a rule-based assessment of your
            own profile.
          </p>
        </div>

        {loadError && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-6">
            <p className="text-sm font-semibold text-slate-900">Course matches are unavailable</p>
            <p className="text-xs text-slate-600 mt-0.5">{loadError}</p>
            <Button size="sm" variant="outline" className="mt-3 h-8" onClick={() => void loadCourses()}>
              Try again
            </Button>
          </div>
        )}

        {loading && !loadError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {!loading && !loadError && courses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {!loading && !loadError && courses.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="size-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No courses match your filters</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {total === 0
                ? 'The verified course catalogue has no published courses yet. Your counselor can search on your behalf in the meantime.'
                : 'Try a broader search term or a different programme level.'}
            </p>
            {(searchQuery || levelFilter !== 'all') && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearchQuery(''); setLevelFilter('all'); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
