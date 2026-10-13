'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  ArrowLeft,
  GraduationCap,
  MapPin,
  Globe,
  BookOpen,
  Award,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UniversityFinderProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface UniversityResult {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  state?: string | null;
  ranking?: string | null;
  overview?: string | null;
  tuitionRange?: string | null;
  scholarshipAvailable?: boolean | null;
  logo?: string | null;
  courseCount: number;
  country?: {
    name: string;
    shortName?: string | null;
    flag?: string | null;
    slug: string;
  } | null;
}

interface CountryInfo {
  slug: string;
  name: string;
  flag?: string | null;
  universities: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRY_MAP: Record<string, string> = {
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

const STUDY_LEVELS = [
  'Undergraduate',
  'Postgraduate',
  'PhD',
  'Foundation',
  'Pre-Master\'s',
  'Diploma',
];

const SORT_OPTIONS = [
  { value: 'best-match', label: 'Best Match' },
  { value: 'a-z', label: 'A-Z' },
  { value: 'most-courses', label: 'Most Courses' },
  { value: 'highest-ranking', label: 'Highest Ranking' },
];

const PAGE_LIMIT = 12;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function UniversityCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
// ─── University Card ─────────────────────────────────────────────────────────

function UniversityCard({
  university,
  onExplore,
}: {
  university: UniversityResult;
  onExplore: (slug: string) => void;
}) {
  const countryLabel = university.country?.name || COUNTRY_MAP[university.countrySlug] || university.countrySlug;
  const countryFlag = university.country?.flag || COUNTRY_MAP[university.countrySlug]?.split(' ')[0] || '🌍';
  const rankingDisplay = university.ranking
    ? university.ranking.replace(/world ranking[:\s]*/i, '').replace(/#/i, '#').trim()
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 transition-all duration-200 hover:shadow-lg hover:border-[#0057B8]/20 group">
      {/* Header: Logo + Name */}
      <div className="flex items-start gap-3.5">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0057B8]/5 to-[#0057B8]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {university.logo ? (
            <img
              src={university.logo}
              alt={university.name}
              className="w-full h-full object-contain p-1.5"
            />
          ) : (
            <Building2 className="h-7 w-7 text-[#0057B8]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#0F172A] truncate leading-tight">
            {university.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge
              variant="secondary"
              className="bg-[#F8FAFC] text-[#0F172A] text-xs font-medium border border-[#E2E8F0] gap-1"
            >
              <span>{countryFlag}</span>
              <Globe className="h-3 w-3" />
              {countryLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {university.city}{university.state ? `, ${university.state}` : ''}
        </span>
        {rankingDisplay && (
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
            <span className="font-medium text-[#0F172A]">{rankingDisplay}</span>
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#E2E8F0]/60">
          <p className="text-xl font-bold text-[#0057B8]">
            {university.courseCount}
          </p>
          <p className="text-xs text-[#64748B] mt-0.5">Courses</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#E2E8F0]/60">
          <p className="text-sm font-semibold text-[#0F172A] mt-1">
            {university.tuitionRange || 'Contact University'}
          </p>
          <p className="text-xs text-[#64748B] mt-0.5">Avg. Tuition</p>
        </div>
      </div>

      {/* Scholarship badge */}
      {university.scholarshipAvailable && (
        <div className="mt-3 flex items-center gap-1.5">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium gap-1">
            <Award className="h-3 w-3" />
            Scholarships Available
          </Badge>
        </div>
      )}

      {/* Explore button */}
      <button
        onClick={() => onExplore(university.slug)}
        className={cn(
          'mt-4 w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]',
          'flex items-center justify-center gap-2',
          'bg-[#0057B8] text-white hover:bg-[#004494] active:scale-[0.98]',
        )}
      >
        Explore University
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'h-12 px-4 rounded-xl text-sm font-medium transition-colors min-h-[48px] flex items-center gap-1.5',
          'border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>
      <span className="px-4 text-sm text-[#64748B]">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'h-12 px-4 rounded-xl text-sm font-medium transition-colors min-h-[48px] flex items-center gap-1.5',
          'border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UniversityFinder({ onBack, onNavigate, onLeadOpen }: UniversityFinderProps) {
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sortBy, setSortBy] = useState('best-match');

  // Data state
  const [universities, setUniversities] = useState<UniversityResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Countries list for filter pills
  const [countries, setCountries] = useState<CountryInfo[]>([]);

  // Refs
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load countries ──
  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data) => {
        if (data.countries) {
          setCountries(data.countries);
        }
      })
      .catch(console.error);
  }, []);

  // ── Fetch universities ──
  const fetchUniversities = useCallback(
    async (currentPage: number, search: string, country: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (country) params.set('country', country);
        params.set('limit', String(PAGE_LIMIT));
        params.set('offset', String((currentPage - 1) * PAGE_LIMIT));

        const res = await fetch(`/api/universities?${params.toString()}`);
        const data = await res.json();

        if (data.universities) {
          setUniversities(data.universities);
          setTotal(data.total || 0);
        } else {
          setUniversities([]);
          setTotal(0);
        }
      } catch (err) {
        console.error('Failed to fetch universities:', err);
        setUniversities([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    []
  );

  // ── Initial load + re-fetch on country changes ──
  useEffect(() => {
    fetchUniversities(1, searchQuery, selectedCountry);
    setPage(1);
  }, [selectedCountry, fetchUniversities]);

  // ── Debounced search handler ──
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        fetchUniversities(1, value, selectedCountry);
        setPage(1);
      }, 400);
    },
    [selectedCountry, fetchUniversities]
  );

  // ── Country pill click ──
  const handleCountryChange = useCallback(
    (slug: string) => {
      const newCountry = selectedCountry === slug ? '' : slug;
      setSelectedCountry(newCountry);
      setPage(1);
    },
    [selectedCountry]
  );

  // ── Level pill click ──
  const handleLevelChange = useCallback((level: string) => {
    setSelectedLevel((prev) => (prev === level ? '' : level));
  }, []);

  // ── Sort change ──
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  // ── Page change ──
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchUniversities(newPage, searchQuery, selectedCountry);
      window.scrollTo({ top: 240, behavior: 'smooth' });
    },
    [searchQuery, selectedCountry, fetchUniversities]
  );

  // ── Explore university ──
  const handleExplore = useCallback(
    (slug: string) => {
      onNavigate('university', slug);
    },
    [onNavigate]
  );

  // ── Filter + sort universities ──
  const processedUniversities = (() => {
    let results = [...universities];

    // Filter by study level (client-side since API doesn't support it)
    if (selectedLevel) {
      results = results.filter((u) => {
        // Show all universities when a level is selected (courses data not pre-loaded)
        // In a real app, this would filter by actual course levels
        return true;
      });
    }

    // Client-side sort
    switch (sortBy) {
      case 'a-z':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'most-courses':
        results.sort((a, b) => b.courseCount - a.courseCount);
        break;
      case 'highest-ranking': {
        results.sort((a, b) => {
          const numA = a.ranking ? parseInt(a.ranking.replace(/[^0-9]/g, ''), 10) : Infinity;
          const numB = b.ranking ? parseInt(b.ranking.replace(/[^0-9]/g, ''), 10) : Infinity;
          return numA - numB;
        });
        break;
      }
      case 'best-match':
      default:
        // Keep API order (alphabetical by default)
        break;
    }

    return results;
  })();

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] text-sm font-medium transition-colors min-h-[48px]"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-[#E2E8F0]" />
              <h1 className="text-lg font-semibold text-[#0F172A]">University Finder</h1>
            </div>
            <Button
              onClick={onLeadOpen}
              className="h-12 px-6 rounded-xl font-semibold text-sm text-white min-h-[48px]"
              style={{ backgroundColor: '#E8501A' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C94415')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E8501A')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* ── Search Bar ── */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8] pointer-events-none" />
            <Input
              type="text"
              placeholder="Search universities..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={cn(
                'w-full h-14 pl-12 pr-4 text-base rounded-2xl border-[#E2E8F0]',
                'bg-white placeholder:text-[#94A3B8] focus-visible:ring-[#0057B8]/20 focus-visible:border-[#0057B8]',
                'shadow-sm transition-all',
              )}
            />
            {loading && !initialLoad && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0057B8] animate-spin" />
            )}
          </div>

          {/* ── Filter Bar ── */}
          <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {/* Country pills */}
            <Filter className="h-4 w-4 text-[#94A3B8] shrink-0" />
            <button
              onClick={() => handleCountryChange('')}
              className={cn(
                'shrink-0 h-10 px-4 rounded-xl text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap',
                !selectedCountry
                  ? 'bg-[#0057B8] text-white'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#0057B8] hover:text-[#0057B8]',
              )}
            >
              All Countries
            </button>
            {countries.map((c) => {
              const flag = c.flag || COUNTRY_MAP[c.slug]?.split(' ')[0] || '🌍';
              return (
                <button
                  key={c.slug}
                  onClick={() => handleCountryChange(c.slug)}
                  className={cn(
                    'shrink-0 h-10 px-4 rounded-xl text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap flex items-center gap-1.5',
                    selectedCountry === c.slug
                      ? 'bg-[#0057B8] text-white'
                      : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#0057B8] hover:text-[#0057B8]',
                  )}
                >
                  <span>{flag}</span>
                  {c.shortName || c.name}
                </button>
              );
            })}

            {/* Divider */}
            <div className="h-6 w-px bg-[#E2E8F0] shrink-0 mx-1" />

            {/* Study Level pills */}
            <button
              onClick={() => handleLevelChange('')}
              className={cn(
                'shrink-0 h-10 px-4 rounded-xl text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap',
                !selectedLevel
                  ? 'bg-[#0057B8] text-white'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#0057B8] hover:text-[#0057B8]',
              )}
            >
              All Levels
            </button>
            {STUDY_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={cn(
                  'shrink-0 h-10 px-4 rounded-xl text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap',
                  selectedLevel === level
                    ? 'bg-[#0057B8] text-white'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#0057B8] hover:text-[#0057B8]',
                )}
              >
                {level}
              </button>
            ))}

            {/* Divider */}
            <div className="h-6 w-px bg-[#E2E8F0] shrink-0 mx-1" />

            {/* Sort dropdown */}
            <div className="shrink-0">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="h-10 w-[160px] rounded-xl border-[#E2E8F0] text-sm bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Results Count ── */}
          <div className="mt-6 mb-4">
            {initialLoad ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <p className="text-sm text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">{total}</span>{' '}
                universit{total === 1 ? 'y' : 'ies'} found
                {selectedCountry && (
                  <>
                    {' '}
                    <span className="text-[#94A3B8]">in</span>{' '}
                    <span className="font-medium text-[#0F172A]">
                      {COUNTRY_MAP[selectedCountry] || selectedCountry}
                    </span>
                  </>
                )}
                {searchQuery && (
                  <>
                    {' '}
                    <span className="text-[#94A3B8]">for</span>{' '}
                    <span className="font-medium text-[#0F172A]">&ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* ── Loading State ── */}
          {loading && initialLoad && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <UniversityCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* ── Loading More State (non-initial) ── */}
          {loading && !initialLoad && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-[#0057B8] animate-spin" />
              <span className="ml-3 text-sm text-[#64748B]">Loading universities...</span>
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && !initialLoad && processedUniversities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-5">
                <Building2 className="h-10 w-10 text-[#94A3B8]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0F172A]">No universities found</h3>
              <p className="mt-2 text-sm text-[#64748B] max-w-md">
                Try adjusting your search terms or filters to discover more universities worldwide.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('');
                  setSelectedLevel('');
                  setSortBy('best-match');
                }}
                className="mt-5 h-12 px-6 rounded-xl font-semibold text-sm min-h-[48px]"
                style={{ backgroundColor: '#0057B8', color: '#FFFFFF' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#004494')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0057B8')}
              >
                <Search className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}

          {/* ── Results Grid ── */}
          {!loading && processedUniversities.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedUniversities.map((uni) => (
                  <UniversityCard
                    key={uni.slug}
                    university={uni}
                    onExplore={handleExplore}
                  />
                ))}
              </div>

              {/* ── Pagination ── */}
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </main>

      {/* ── Subtle Footer ── */}
      <footer className="mt-auto border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <ShieldCheck className="h-4 w-4 text-[#0057B8]" />
              <span>Verified university data from official sources</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {total} universities
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {countries.reduce((sum, c) => sum + c.universities, 0)} across {countries.length} countries
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
