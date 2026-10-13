'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  ArrowLeftRight,
  Search,
  GraduationCap,
  MapPin,
  CheckCircle,
  XCircle,
  BookOpen,
  Globe,
  Clock,
  Award,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompareProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
  compareItems?: {
    type: 'course' | 'university';
    slug: string;
  }[];
}

interface CourseData {
  type: 'course';
  slug: string;
  name: string;
  universitySlug: string;
  university: {
    name: string;
    slug: string;
    city: string;
    ranking: string | null;
    countrySlug: string;
    country: {
      name: string;
      shortName: string | null;
      flag: string | null;
      slug: string;
    } | null;
  } | null;
  countrySlug: string;
  city: string;
  level: string | null;
  subject: string | null;
  duration: string | null;
  tuition: string | null;
  tuitionCurrency: string | null;
  englishRequirement: string | null;
  scholarshipAvailable: boolean | null;
  overview: string | null;
}

interface UniversityData {
  type: 'university';
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  ranking: string | null;
  overview: string | null;
  tuition: string | null;
  tuitionRange: string | null;
  scholarshipAvailable: boolean | null;
  popularSubjects: string[] | null;
  country: {
    name: string;
    shortName: string | null;
    flag: string | null;
    slug: string;
  } | null;
  courses: {
    slug: string;
    name: string;
    level: string | null;
  }[];
}

type CompareItemData = CourseData | UniversityData;

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRIES_MAP: Record<string, string> = {
  uk: '🇬🇧 United Kingdom',
  usa: '🇺🇸 United States',
  canada: '🇨🇦 Canada',
  australia: '🇦🇺 Australia',
  ireland: '🇮🇪 Ireland',
  germany: '🇩🇪 Germany',
  malaysia: '🇲🇾 Malaysia',
  'new-zealand': '🇳🇿 New Zealand',
  malta: '🇲🇹 Malta',
  cyprus: '🇨🇾 Cyprus',
  'south-korea': '🇰🇷 South Korea',
};

// ─── Helper: parse tuition to numeric for comparison ─────────────────────────

function parseTuitionToNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CompareView({
  onBack,
  onNavigate,
  onLeadOpen,
  compareItems = [],
}: CompareProps) {
  const [items, setItems] = useState<CompareItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all compare items
  useEffect(() => {
    if (compareItems.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchItems() {
      try {
        const results = await Promise.all(
          compareItems.map(async (ci) => {
            const endpoint =
              ci.type === 'course'
                ? `/api/courses/${ci.slug}`
                : `/api/universities/${ci.slug}`;
            const res = await fetch(endpoint);
            if (!res.ok) return null;
            const data = await res.json();
            if (ci.type === 'course' && data.course) {
              return { ...data.course, type: 'course' as const };
            }
            if (ci.type === 'university' && data.university) {
              return { ...data.university, type: 'university' as const };
            }
            return null;
          })
        );
        if (!cancelled) {
          const valid = results.filter(Boolean) as CompareItemData[];
          setItems(valid);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load comparison data');
          setLoading(false);
        }
      }
    }

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [compareItems]);

  // Compute tuition comparison values for color-coding
  const tuitionValues = items.map((item) => {
    if (item.type === 'course') {
      return parseTuitionToNumber(item.tuition);
    }
    return parseTuitionToNumber(item.tuition) ?? parseTuitionToNumber(item.tuitionRange);
  });

  const validTuitionValues = tuitionValues.filter((v): v is number => v !== null);
  const minTuition = validTuitionValues.length > 0 ? Math.min(...validTuitionValues) : null;
  const maxTuition = validTuitionValues.length > 0 ? Math.max(...validTuitionValues) : null;

  function getTuitionColor(index: number): string {
    const val = tuitionValues[index];
    if (val === null || minTuition === null || maxTuition === null || minTuition === maxTuition) {
      return '';
    }
    if (val === minTuition) return 'text-emerald-600 font-semibold';
    if (val === maxTuition) return 'text-red-500 font-semibold';
    return '';
  }

  // ─── Empty State ─────────────────────────────────────────────────────────

  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
                </button>
                <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">Compare Courses</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Empty State */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#0057B8]/10 flex items-center justify-center mb-6">
              <ArrowLeftRight className="w-10 h-10 text-[#0057B8]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
              Nothing to compare yet
            </h2>
            <p className="text-gray-500 text-base mb-8 max-w-md">
              Select courses or universities to compare side by side and find your perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => onNavigate('course-finder')}
                className="rounded-xl h-12 px-6 bg-[#0057B8] hover:bg-[#0057B8]/90 text-white font-semibold"
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Courses
              </Button>
              <Button
                onClick={() => onNavigate('course-finder')}
                variant="outline"
                className="rounded-xl h-12 px-6 border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50 font-semibold"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Browse Universities
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
                </button>
                <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">Compare Courses</h1>
              </div>
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </header>

        {/* Loading Skeleton */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="overflow-x-auto">
            <div className="flex gap-0 min-w-[600px]">
              {/* Label column skeleton */}
              <div className="w-48 flex-shrink-0 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
              {/* Data column skeletons */}
              {Array.from({ length: Math.max(compareItems.length, 2) }).map((_, colIdx) => (
                <div key={colIdx} className="flex-1 min-w-[200px] space-y-4">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
                </button>
                <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">Compare Courses</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center text-center">
            <XCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-gray-500 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-xl h-11 px-6"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Build rows for comparison ───────────────────────────────────────────

  const allAreCourses = items.every((i) => i.type === 'course');
  const allAreUniversities = items.every((i) => i.type === 'university');

  interface Row {
    label: string;
    icon: React.ReactNode;
    getValue: (item: CompareItemData, index?: number) => React.ReactNode;
  }

  const courseRows: Row[] = [
    {
      label: 'Name',
      icon: <BookOpen className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const c = item as CourseData;
        return <span className="font-semibold text-[#0F172A] text-sm">{c.name}</span>;
      },
    },
    {
      label: 'University',
      icon: <GraduationCap className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const c = item as CourseData;
        return c.university?.name ? (
          <button
            onClick={() => onNavigate('university', c.university!.slug)}
            className="text-[#0057B8] hover:underline text-sm font-medium"
          >
            {c.university.name}
          </button>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Country',
      icon: <Globe className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const countrySlug = item.type === 'course' ? (item as CourseData).countrySlug : (item as UniversityData).countrySlug;
        return (
          <span className="text-sm text-[#0F172A]">
            {COUNTRIES_MAP[countrySlug] || countrySlug}
          </span>
        );
      },
    },
    {
      label: 'City',
      icon: <MapPin className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const city = item.type === 'course' ? (item as CourseData).city : (item as UniversityData).city;
        return city ? (
          <span className="text-sm text-[#0F172A]">{city}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Level',
      icon: <Award className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const level = item.type === 'course' ? (item as CourseData).level : null;
        return level ? (
          <Badge variant="secondary" className="text-xs font-medium bg-[#0057B8]/10 text-[#0057B8] border-0 rounded-lg">
            {level}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Subject',
      icon: <BookOpen className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const subject = item.type === 'course' ? (item as CourseData).subject : null;
        return subject ? (
          <span className="text-sm text-[#0F172A]">{subject}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Duration',
      icon: <Clock className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const duration = item.type === 'course' ? (item as CourseData).duration : null;
        return duration ? (
          <span className="text-sm text-[#0F172A]">{duration}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Tuition',
      icon: <span className="text-sm font-bold text-gray-400">£</span>,
      getValue: (item, index) => {
        let tuition: string | null = null;
        let currency: string | null = null;
        if (item.type === 'course') {
          tuition = (item as CourseData).tuition;
          currency = (item as CourseData).tuitionCurrency;
        }
        if (tuition) {
          const colorClass = getTuitionColor(index);
          const prefix = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'KRW' ? '₩' : '£';
          return (
            <span className={cn('text-sm', colorClass || 'text-[#0F172A]')}>{
              tuition.startsWith(prefix) ? tuition : `${prefix}${tuition}`
            }</span>
          );
        }
        return <span className="text-gray-400 text-sm">—</span>;
      },
    },
    {
      label: 'English Requirement',
      icon: <Globe className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const req = item.type === 'course' ? (item as CourseData).englishRequirement : null;
        return req ? (
          <span className="text-sm text-[#0F172A]">{req}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Scholarship Available',
      icon: <Award className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const avail = item.type === 'course' 
          ? (item as CourseData).scholarshipAvailable 
          : (item as UniversityData).scholarshipAvailable;
        if (avail === true) {
          return (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600 font-medium">Available</span>
            </div>
          );
        }
        if (avail === false) {
          return (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-500">Not Available</span>
            </div>
          );
        }
        return <span className="text-gray-400 text-sm">—</span>;
      },
    },
    {
      label: 'Overview',
      icon: <BookOpen className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const overview = item.type === 'course' 
          ? (item as CourseData).overview 
          : (item as UniversityData).overview;
        if (!overview) return <span className="text-gray-400 text-sm">—</span>;
        const truncated = overview.length > 120 ? overview.slice(0, 120) + '…' : overview;
        return <span className="text-xs text-gray-600 leading-relaxed">{truncated}</span>;
      },
    },
  ];

  const universityRows: Row[] = [
    {
      label: 'Name',
      icon: <GraduationCap className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        return <span className="font-semibold text-[#0F172A] text-sm">{u.name}</span>;
      },
    },
    {
      label: 'Country',
      icon: <Globe className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        return (
          <span className="text-sm text-[#0F172A]">
            {COUNTRIES_MAP[u.countrySlug] || u.countrySlug}
          </span>
        );
      },
    },
    {
      label: 'City',
      icon: <MapPin className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        return u.city ? (
          <span className="text-sm text-[#0F172A]">{u.city}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'World Ranking',
      icon: <Award className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        return u.ranking ? (
          <Badge variant="secondary" className="text-xs font-medium bg-amber-50 text-amber-700 border-0 rounded-lg">
            {u.ranking}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      label: 'Tuition Range',
      icon: <span className="text-sm font-bold text-gray-400">£</span>,
      getValue: (item, index) => {
        const u = item as UniversityData;
        const tuitionStr = u.tuitionRange || u.tuition;
        if (!tuitionStr) return <span className="text-gray-400 text-sm">—</span>;
        const colorClass = getTuitionColor(index);
        return (
          <span className={cn('text-sm', colorClass || 'text-[#0F172A]')}>{tuitionStr}</span>
        );
      },
    },
    {
      label: 'Scholarship Available',
      icon: <Award className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        if (u.scholarshipAvailable === true) {
          return (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600 font-medium">Available</span>
            </div>
          );
        }
        if (u.scholarshipAvailable === false) {
          return (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-500">Not Available</span>
            </div>
          );
        }
        return <span className="text-gray-400 text-sm">—</span>;
      },
    },
    {
      label: 'Popular Subjects',
      icon: <BookOpen className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        if (!u.popularSubjects || u.popularSubjects.length === 0) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {u.popularSubjects.slice(0, 4).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0 rounded-lg">
                {s}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      label: 'Number of Courses',
      icon: <BookOpen className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        return (
          <span className="text-sm text-[#0F172A] font-medium">{u.courses?.length ?? 0} courses</span>
        );
      },
    },
    {
      label: 'Overview',
      icon: <BookOpen className="w-4 h-4 text-gray-400" />,
      getValue: (item) => {
        const u = item as UniversityData;
        if (!u.overview) return <span className="text-gray-400 text-sm">—</span>;
        const truncated = u.overview.length > 120 ? u.overview.slice(0, 120) + '…' : u.overview;
        return <span className="text-xs text-gray-600 leading-relaxed">{truncated}</span>;
      },
    },
  ];

  // Pick the right rows based on content
  const rows = allAreUniversities ? universityRows : courseRows;

  // ─── Get column header info ──────────────────────────────────────────────

  function getColumnHeader(item: CompareItemData) {
    if (item.type === 'course') {
      const c = item as CourseData;
      return {
        name: c.name,
        sub: c.university?.name || '',
        badge: c.level || '',
      };
    }
    const u = item as UniversityData;
    return {
      name: u.name,
      sub: COUNTRIES_MAP[u.countrySlug] || u.countrySlug,
      badge: u.ranking || '',
    };
  }

  // ─── Comparison Table ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                Compare{' '}
                {allAreUniversities
                  ? 'Universities'
                  : allAreCourses
                  ? 'Courses'
                  : 'Items'}
              </h1>
              <Badge
                variant="secondary"
                className="ml-1 bg-[#0057B8]/10 text-[#0057B8] border-0 rounded-lg text-xs font-semibold"
              >
                {items.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              onClick={onBack}
              className="rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 h-9 px-3 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear All
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Table Header Row: Column Headers */}
                <div className="flex border-b border-[#E2E8F0]">
                  {/* Empty corner cell */}
                  <div className="w-44 flex-shrink-0 p-4 bg-white" />
                  {/* Item column headers */}
                  {items.map((item) => {
                    const header = getColumnHeader(item);
                    return (
                      <div
                        key={`${item.type}-${item.slug}`}
                        className="flex-1 min-w-[200px] p-4 bg-white border-l border-[#E2E8F0] relative"
                      >
                        {/* Remove button */}
                        <button
                          onClick={onBack}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                          aria-label={`Remove ${header.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex flex-col gap-1 pr-8">
                          <Badge
                            variant="secondary"
                            className="w-fit text-[10px] font-semibold uppercase tracking-wider bg-[#E8501A]/10 text-[#E8501A] border-0 rounded-md px-2 py-0.5"
                          >
                            {item.type === 'course' ? 'Course' : 'University'}
                          </Badge>
                          <h3 className="text-sm font-bold text-[#0F172A] leading-tight line-clamp-2">
                            {header.name}
                          </h3>
                          {header.sub && (
                            <p className="text-xs text-gray-500 truncate">{header.sub}</p>
                          )}
                          {header.badge && (
                            <Badge
                              variant="secondary"
                              className="w-fit text-[11px] bg-[#0057B8]/10 text-[#0057B8] border-0 rounded-md px-2 py-0.5"
                            >
                              {header.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Data Rows */}
                {rows.map((row, rowIdx) => (
                  <div
                    key={row.label}
                    className={cn(
                      'flex border-b border-[#E2E8F0] last:border-b-0',
                      rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'
                    )}
                  >
                    {/* Label Cell */}
                    <div className="w-44 flex-shrink-0 p-4 flex items-center gap-2 justify-end border-r border-[#E2E8F0]">
                      <span className="text-sm font-semibold text-[#0F172A] whitespace-nowrap">
                        {row.label}
                      </span>
                      {row.icon}
                    </div>
                    {/* Value Cells */}
                    {items.map((item, colIdx) => (
                      <div
                        key={`${item.type}-${item.slug}-${row.label}`}
                        className="flex-1 min-w-[200px] p-4 border-l border-[#E2E8F0] flex items-start"
                      >
                        <div className="w-full">{row.getValue(item, colIdx)}</div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Action Row: View Details Buttons */}
                <div className="flex border-t border-[#E2E8F0]">
                  <div className="w-44 flex-shrink-0" />
                  {items.map((item) => (
                    <div
                      key={`action-${item.type}-${item.slug}`}
                      className="flex-1 min-w-[200px] p-4 border-l border-[#E2E8F0]"
                    >
                      <Button
                        onClick={() =>
                          onNavigate(
                            item.type === 'course' ? 'course-detail' : 'university',
                            item.slug
                          )
                        }
                        className="w-full rounded-xl h-10 bg-[#0057B8] hover:bg-[#0057B8]/90 text-white text-sm font-medium"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Tuition Legend */}
          {minTuition !== null && maxTuition !== null && minTuition !== maxTuition && (
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Lowest tuition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Highest tuition</span>
              </div>
            </div>
          )}

          {/* Browse more CTA */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">Want to add more items to compare?</p>
            <Button
              onClick={() => onNavigate('course-finder')}
              className="rounded-xl h-11 px-6 bg-[#E8501A] hover:bg-[#E8501A]/90 text-white font-semibold"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse More Courses
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
