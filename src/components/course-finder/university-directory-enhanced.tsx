'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Building2, MapPin, Globe, Trophy, ExternalLink,
  BookOpen, SearchX, SlidersHorizontal, ArrowUpDown, ChevronLeft,
  ChevronRight, MoreHorizontal, GraduationCap, Award, Calendar,
  ShieldCheck, Handshake, Info, X, Check, MessageCircle,
  GitCompareArrows, Star, ChevronDown, Loader2, Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
// usePortalStore no longer needed - public pages use real routes

// ─── ALO Brand Colors ─────────────────────────────────────────────────────────
const ALO_BLUE = '#0057B8';
const ALO_ORANGE = '#E8501A';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UniversityCardData {
  id: string;
  name: string;
  slug: string;
  officialName?: string;
  country: string;
  city?: string;
  institutionType?: string;
  establishedYear?: number;
  rankingValue?: number;
  rankingProvider?: string;
  rankingEdition?: string;
  rankingYear?: number;
  featured: boolean;
  isPartner: boolean;
  scholarshipAvailable?: boolean;
  keyIntakes?: string;
  lastVerifiedAt?: string;
  logoUrl?: string;
  _count?: { courses: number };
}

interface ApiResponse {
  universities: UniversityCardData[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const COUNTRIES_LIST = [
  'UK', 'USA', 'Canada', 'Australia', 'Ireland',
  'Germany', 'New Zealand', 'Denmark', 'Japan', 'Malaysia',
  'South Korea', 'Dubai', 'India',
] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  UK: '\u{1F1EC}\u{1F1E7}',
  USA: '\u{1F1FA}\u{1F1F8}',
  Canada: '\u{1F1E8}\u{1F1E6}',
  Australia: '\u{1F1E6}\u{1F1FA}',
  Ireland: '\u{1F1EE}\u{1F1EA}',
  Germany: '\u{1F1E9}\u{1F1EA}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
  Denmark: '\u{1F1E9}\u{1F1F0}',
  Japan: '\u{1F1EF}\u{1F1F5}',
  Malaysia: '\u{1F1F2}\u{1F1FE}',
  'South Korea': '\u{1F1F0}\u{1F1F7}',
  Dubai: '\u{1F1E6}\u{1F1EA}',
  India: '\u{1F1EE}\u{1F1F3}',
};

const INSTITUTION_TYPES = ['Public', 'Private', 'Specialised'] as const;
const STUDY_LEVELS = ['Foundation', 'Bachelor', 'Master', 'PhD', 'Top-up'] as const;
const INTAKE_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'ranking', label: 'Ranking (Highest)' },
  { value: 'recently_verified', label: 'Recently Verified' },
  { value: 'courses_count', label: 'Most Courses' },
  { value: 'lowest_tuition', label: 'Lowest Tuition' },
] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getTypeBadgeClasses(type: string | null | undefined): string {
  switch (type?.toUpperCase()) {
    case 'PUBLIC': return 'bg-emerald-100 text-emerald-700';
    case 'PRIVATE': return 'bg-violet-100 text-violet-700';
    case 'SPECIALISED': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function formatRanking(u: UniversityCardData): { label: string; show: boolean } {
  if (!u.rankingValue || u.rankingValue <= 0) {
    return { label: 'Ranking unavailable', show: false };
  }
  const provider = u.rankingProvider || 'Ranking';
  const edition = u.rankingEdition || '';
  const year = u.rankingYear || '';
  let label = `${provider}`;
  if (year) label += ` ${year}`;
  label += `: #${u.rankingValue}`;
  if (edition) label += ` (${edition})`;
  return { label, show: true };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────
function HeroSkeleton() {
  return (
    <div className="bg-gradient-to-br from-[#0057B8] to-[#003A7D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Skeleton className="h-8 w-72 mb-4 bg-white/20" />
        <Skeleton className="h-5 w-96 mb-8 bg-white/15" />
        <Skeleton className="h-14 w-full max-w-2xl bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

function UniversityCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-4 w-56" />
        <Separator />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filter Sidebar Content ────────────────────────────────────────────────────
function FilterSidebarContent({
  filters,
  setFilters,
  availableCountries,
  onReset,
  onApply,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableCountries: string[];
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="space-y-6 p-1">
      {/* Country Checkboxes */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">Country</Label>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {COUNTRIES_LIST.map((country) => {
            const flag = COUNTRY_FLAGS[country] || '';
            const isChecked = filters.countries.includes(country);
            return (
              <div key={country} className="flex items-center gap-2">
                <Checkbox
                  id={`country-${country}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    setFilters((prev) => ({
                      ...prev,
                      countries: checked
                        ? [...prev.countries, country]
                        : prev.countries.filter((c) => c !== country),
                    }));
                  }}
                />
                <label
                  htmlFor={`country-${country}`}
                  className="text-sm text-slate-600 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{flag}</span> {country}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* City Input */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-2 block">City</Label>
        <Input
          placeholder="e.g. London, Melbourne..."
          value={filters.city}
          onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
          className="h-9"
        />
      </div>

      <Separator />

      {/* Institution Type */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">Institution Type</Label>
        <div className="space-y-2">
          {INSTITUTION_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.institutionTypes.includes(type)}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({
                    ...prev,
                    institutionTypes: checked
                      ? [...prev.institutionTypes, type]
                      : prev.institutionTypes.filter((t) => t !== type),
                  }));
                }}
              />
              <label htmlFor={`type-${type}`} className="text-sm text-slate-600 cursor-pointer">
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Ranking Range */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">Ranking Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.rankingMin}
            onChange={(e) => setFilters((prev) => ({ ...prev, rankingMin: e.target.value }))}
            className="h-9"
            min={1}
          />
          <span className="text-slate-400 text-sm">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.rankingMax}
            onChange={(e) => setFilters((prev) => ({ ...prev, rankingMax: e.target.value }))}
            className="h-9"
            min={1}
          />
        </div>
      </div>

      <Separator />

      {/* Tuition Range */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">Tuition Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.tuitionMin}
            onChange={(e) => setFilters((prev) => ({ ...prev, tuitionMin: e.target.value }))}
            className="h-9"
            min={0}
          />
          <span className="text-slate-400 text-sm">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.tuitionMax}
            onChange={(e) => setFilters((prev) => ({ ...prev, tuitionMax: e.target.value }))}
            className="h-9"
            min={0}
          />
        </div>
      </div>

      <Separator />

      {/* Scholarship Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-800">Scholarships Available</Label>
        <Switch
          checked={filters.scholarshipOnly}
          onCheckedChange={(checked) =>
            setFilters((prev) => ({ ...prev, scholarshipOnly: !!checked }))
          }
        />
      </div>

      {/* ALO Partner Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-800">ALO Partner Only</Label>
        <Switch
          checked={filters.aloPartnerOnly}
          onCheckedChange={(checked) =>
            setFilters((prev) => ({ ...prev, aloPartnerOnly: !!checked }))
          }
        />
      </div>

      <Separator />

      {/* Study Level Availability */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">Study Level</Label>
        <div className="flex flex-wrap gap-2">
          {STUDY_LEVELS.map((level) => (
            <Badge
              key={level}
              variant={filters.studyLevels.includes(level) ? 'default' : 'outline'}
              className={`cursor-pointer text-xs px-3 py-1 transition-colors ${
                filters.studyLevels.includes(level)
                  ? 'text-white'
                  : 'hover:bg-slate-100'
              }`}
              style={
                filters.studyLevels.includes(level)
                  ? { backgroundColor: ALO_BLUE }
                  : undefined
              }
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  studyLevels: prev.studyLevels.includes(level)
                    ? prev.studyLevels.filter((l) => l !== level)
                    : [...prev.studyLevels, level],
                }));
              }}
            >
              {level}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Intake Period */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">Intake Period</Label>
        <Select
          value={filters.intakePeriod}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, intakePeriod: v }))}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Any intake" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any intake</SelectItem>
            {INTAKE_MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* English Test Flexibility */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block">English Test Flexibility</Label>
        <Select
          value={filters.englishTest}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, englishTest: v }))}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All accepted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accepted</SelectItem>
            <SelectItem value="ielts">IELTS accepted</SelectItem>
            <SelectItem value="pte">PTE accepted</SelectItem>
            <SelectItem value="toefl">TOEFL accepted</SelectItem>
            <SelectItem value="duolingo">Duolingo accepted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Sort By */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-3 block flex items-center gap-1.5">
          <ArrowUpDown className="size-3.5" /> Sort By
        </Label>
        <Select
          value={filters.sortBy}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, sortBy: v }))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
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

      <Separator />

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onReset}
        >
          <X className="size-3.5 mr-1.5" />
          Clear All
        </Button>
        <Button
          size="sm"
          className="flex-1 text-white"
          style={{ backgroundColor: ALO_BLUE }}
          onClick={onApply}
        >
          <Check className="size-3.5 mr-1.5" />
          Apply Filters
        </Button>
      </div>
    </div>
  );
}

// ─── University Card ──────────────────────────────────────────────────────────
function UniversityCard({
  uni,
  onViewUniversity,
  onViewCourses,
  onCompare,
  onAskCounsellor,
}: {
  uni: UniversityCardData;
  onViewUniversity: (slug: string) => void;
  onViewCourses: (slug: string) => void;
  onCompare: (uni: UniversityCardData) => void;
  onAskCounsellor: (name: string) => void;
}) {
  const ranking = formatRanking(uni);
  const courseCount = uni._count?.courses || 0;
  const flag = COUNTRY_FLAGS[uni.country] || '';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200 group">
      <CardContent className="p-5 space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Logo placeholder */}
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: ALO_BLUE }}
            >
              {uni.logoUrl ? (
                <img
                  src={uni.logoUrl}
                  alt={`${uni.name} logo`}
                  className="h-10 w-10 rounded-lg object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span className="text-white font-bold text-lg" style={uni.logoUrl ? { display: 'none' } : { display: 'flex' }}>
                {uni.name?.[0] || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate group-hover:text-[#0057B8] transition-colors">
                {flag} {uni.officialName || uni.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <MapPin className="size-3" />
                <span>{[uni.city, uni.country].filter(Boolean).join(', ')}</span>
              </div>
            </div>
          </div>
          {/* Badges column */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {uni.institutionType && (
              <Badge
                variant="secondary"
                className={`text-[10px] font-medium px-2 py-0.5 ${getTypeBadgeClasses(uni.institutionType)}`}
              >
                {uni.institutionType}
              </Badge>
            )}
            {uni.isPartner && (
              <Badge
                className="text-[10px] font-medium px-2 py-0.5 text-white"
                style={{ backgroundColor: ALO_ORANGE }}
              >
                <Handshake className="size-2.5 mr-0.5" />
                ALO Partner
              </Badge>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          {/* Ranking */}
          <div className="flex items-center gap-1.5">
            <Trophy className="size-3.5 text-amber-500 flex-shrink-0" />
            {ranking.show ? (
              <span className="font-medium text-slate-700 truncate" title={ranking.label}>
                {ranking.label}
              </span>
            ) : (
              <span className="text-slate-400 italic">Ranking unavailable</span>
            )}
          </div>

          {/* Course Count */}
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600">{courseCount} courses</span>
          </div>

          {/* Key Intakes */}
          {uni.keyIntakes && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Calendar className="size-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 truncate">{uni.keyIntakes}</span>
            </div>
          )}

          {/* Last Verified */}
          {uni.lastVerifiedAt && (
            <div className="flex items-center gap-1.5 col-span-2">
              <ShieldCheck className="size-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-500">Verified {formatDate(uni.lastVerifiedAt)}</span>
            </div>
          )}
        </div>

        {/* Scholarship Badge */}
        {uni.scholarshipAvailable && (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs self-start">
            <Award className="size-3 mr-1" />
            Scholarships Available
          </Badge>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="h-8 text-xs text-white col-span-1"
            style={{ backgroundColor: ALO_BLUE }}
            onClick={() => onViewUniversity(uni.slug)}
          >
            View University
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs col-span-1"
            onClick={() => onViewCourses(uni.slug)}
          >
            <BookOpen className="size-3 mr-1" />
            View Courses
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs col-span-1"
            onClick={() => onCompare(uni)}
          >
            <GitCompareArrows className="size-3 mr-1" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs col-span-1 text-[#E8501A] border-[#E8501A]/30 hover:bg-[#E8501A]/5"
            onClick={() => onAskCounsellor(uni.name)}
          >
            <MessageCircle className="size-3 mr-1" />
            Ask Counsellor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filter State Type ──────────────────────────────────────────────────────────
interface FilterState {
  search: string;
  countries: string[];
  city: string;
  institutionTypes: string[];
  rankingMin: string;
  rankingMax: string;
  tuitionMin: string;
  tuitionMax: string;
  scholarshipOnly: boolean;
  aloPartnerOnly: boolean;
  studyLevels: string[];
  intakePeriod: string;
  englishTest: string;
  sortBy: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  countries: [],
  city: '',
  institutionTypes: [],
  rankingMin: '',
  rankingMax: '',
  tuitionMin: '',
  tuitionMax: '',
  scholarshipOnly: false,
  aloPartnerOnly: false,
  studyLevels: [],
  intakePeriod: 'all',
  englishTest: 'all',
  sortBy: 'name',
};

// ─── Main Component ─────────────────────────────────────────────────────────────
export function UniversityDirectoryEnhanced() {
  const router = useRouter();
  const [universities, setUniversities] = useState<UniversityCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Hero search fields
  const [heroSearch, setHeroSearch] = useState('');
  const [heroCountry, setHeroCountry] = useState('');
  const [heroRankingMin, setHeroRankingMin] = useState('');
  const [heroRankingMax, setHeroRankingMax] = useState('');

  // Sidebar filters
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Available countries from API
  const [availableCountries, setAvailableCountries] = useState<string[]>(COUNTRIES_LIST as unknown as string[]);

  const limit = 12;

  // Build query params from all filter sources
  const buildQueryParams = useCallback(
    (overridePage?: number) => {
      const params = new URLSearchParams();
      params.set('tab', 'universities');
      params.set('limit', limit.toString());
      params.set('page', (overridePage ?? page).toString());

      // Hero search
      const search = heroSearch.trim();
      if (search) params.set('search', search);

      // Countries (hero or sidebar)
      const countries = [...(heroCountry ? [heroCountry] : []), ...filters.countries]
        .filter((v, i, a) => a.indexOf(v) === i);
      if (countries.length > 0) params.set('countries', countries.join(','));

      // City
      if (filters.city) params.set('cities', filters.city);

      // Institution types
      if (filters.institutionTypes.length > 0) {
        params.set('institutionType', filters.institutionTypes.join(','));
      }

      // Ranking range (hero or sidebar)
      const rMin = heroRankingMin || filters.rankingMin;
      const rMax = heroRankingMax || filters.rankingMax;
      if (rMin) params.set('rankingMin', rMin);
      if (rMax) params.set('rankingMax', rMax);

      // Tuition range
      if (filters.tuitionMin) params.set('tuitionMin', filters.tuitionMin);
      if (filters.tuitionMax) params.set('tuitionMax', filters.tuitionMax);

      // Scholarship
      if (filters.scholarshipOnly) params.set('scholarship', 'true');

      // ALO Partner
      if (filters.aloPartnerOnly) params.set('isPartner', 'true');

      // Study levels
      if (filters.studyLevels.length > 0) {
        params.set('studyLevels', filters.studyLevels.join(','));
      }

      // Sort
      params.set('sort', filters.sortBy);

      return params.toString();
    },
    [heroSearch, heroCountry, heroRankingMin, heroRankingMax, filters, page, limit]
  );

  // Fetch universities
  const fetchUniversities = useCallback(
    async (overridePage?: number) => {
      setLoading(true);
      try {
        const qs = buildQueryParams(overridePage);
        const res = await fetch(`/api/course-finder?${qs}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: ApiResponse = await res.json();
        setUniversities(data.universities || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (overridePage !== undefined) setPage(overridePage);
      } catch (err) {
        console.error('Error fetching universities:', err);
        setUniversities([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [buildQueryParams]
  );

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchUniversities();
  }, [filters, heroSearch, heroCountry, heroRankingMin, heroRankingMax, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [heroSearch, heroCountry, heroRankingMin, heroRankingMax, filters]);

  // Handle hero search submit
  const handleHeroSearch = useCallback(() => {
    setPage(1);
    fetchUniversities(1);
  }, [fetchUniversities]);

  // Handle sidebar apply
  const handleApplyFilters = useCallback(() => {
    setSheetOpen(false);
    setPage(1);
    fetchUniversities(1);
  }, [fetchUniversities]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setHeroSearch('');
    setHeroCountry('');
    setHeroRankingMin('');
    setHeroRankingMax('');
    setPage(1);
  }, []);

  // Handle view university
  const handleViewUniversity = useCallback((slug: string) => {
    router.push(`/universities/${slug}`);
  }, [router]);

  // Handle view courses
  const handleViewCourses = useCallback((slug: string) => {
    toast.info(`Loading courses for ${slug}...`);
  }, []);

  // Handle compare
  const handleCompare = useCallback((uni: UniversityCardData) => {
    toast.success(`${uni.name} added to comparison`);
  }, []);

  // Handle ask counsellor
  const handleAskCounsellor = useCallback((name: string) => {
    toast.info(`Connecting you with an ALO counsellor about ${name}...`);
  }, []);

  // Pagination page handler
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages]
  );

  // Pagination items
  const paginationItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    if (totalPages <= 1) return items;

    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => handlePageChange(page - 1)}
          className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          href={`?page=${Math.max(1, page - 1)}`}
          onClickCapture={(e) => e.preventDefault()}
        />
      </PaginationItem>
    );

    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="?page=1"
            onClickCapture={(e) => e.preventDefault()}
            onClick={() => handlePageChange(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (start > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href={`?page=${i}`}
            isActive={i === page}
            onClickCapture={(e) => e.preventDefault()}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href={`?page=${totalPages}`}
            onClickCapture={(e) => e.preventDefault()}
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => handlePageChange(page + 1)}
          className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          href={`?page=${Math.min(totalPages, page + 1)}`}
          onClickCapture={(e) => e.preventDefault()}
        />
      </PaginationItem>
    );

    return items;
  }, [page, totalPages, handlePageChange]);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ HERO SECTION ═══ */}
      <div className="bg-gradient-to-br from-[#0057B8] to-[#003A7D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Title */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: ALO_ORANGE }}>
              <GraduationCap className="size-5" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Explore Universities Worldwide with ALO Education
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl">
            Search and compare verified universities across multiple countries. Find the right
            institution for your academic aspirations with transparent rankings and course data.
          </p>

          {/* Hero Search Bar */}
          <div className="mt-8 space-y-3 max-w-4xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <Input
                  placeholder="Search by university name..."
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHeroSearch()}
                  className="pl-10 h-12 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/30"
                />
              </div>
              <div className="flex gap-3">
                <div className="relative w-full sm:w-48">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <Input
                    placeholder="Country"
                    value={heroCountry}
                    onChange={(e) => setHeroCountry(e.target.value)}
                    className="pl-10 h-12 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/30"
                  />
                </div>
                <div className="relative w-full sm:w-32">
                  <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <Input
                    type="number"
                    placeholder="Rank min"
                    value={heroRankingMin}
                    onChange={(e) => setHeroRankingMin(e.target.value)}
                    className="pl-10 h-12 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/30"
                  />
                </div>
                <div className="relative w-full sm:w-32">
                  <Input
                    type="number"
                    placeholder="Rank max"
                    value={heroRankingMax}
                    onChange={(e) => setHeroRankingMax(e.target.value)}
                    className="pl-10 h-12 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white/30"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleHeroSearch}
              className="text-white h-10 w-full sm:w-auto"
              style={{ backgroundColor: ALO_ORANGE }}
            >
              <Search className="size-4 mr-2" />
              Search Universities
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT AREA ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Top Bar: Results count, sort, mobile filter toggle */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                >
                  <Filter className="size-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 sm:w-96 overflow-y-auto p-0">
                <SheetHeader className="p-4 pb-2 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filter Universities
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <FilterSidebarContent
                    filters={filters}
                    setFilters={setFilters}
                    availableCountries={availableCountries}
                    onReset={handleResetFilters}
                    onApply={handleApplyFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <SlidersHorizontal className="size-4 mr-2" />
              {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>

            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{total}</span>{' '}
              {total === 1 ? 'university' : 'universities'} found
            </span>
          </div>

          {/* Desktop sort */}
          <div className="hidden sm:flex items-center gap-2">
            <Label className="text-xs text-slate-500">Sort:</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, sortBy: v }))}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
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

        {/* Main Layout: Sidebar + Grid */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          {sidebarOpen && (
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-4 bg-slate-50 rounded-xl border border-slate-200 p-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                    <SlidersHorizontal className="size-4" />
                    Filters
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-500 hover:text-[#E8501A]"
                    onClick={handleResetFilters}
                  >
                    Clear All
                  </Button>
                </div>
                <FilterSidebarContent
                  filters={filters}
                  setFilters={setFilters}
                  availableCountries={availableCountries}
                  onReset={handleResetFilters}
                  onApply={handleApplyFilters}
                />
              </div>
            </aside>
          )}

          {/* University Grid */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <UniversityCardSkeleton key={i} />
                ))}
              </div>
            ) : universities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <SearchX className="size-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No universities found</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md">
                  Try adjusting your search criteria or filters. We are constantly adding new verified universities to our directory.
                </p>
                <Button variant="outline" onClick={handleResetFilters}>
                  <X className="size-4 mr-2" />
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {universities.map((uni) => (
                    <UniversityCard
                      key={uni.id}
                      uni={uni}
                      onViewUniversity={handleViewUniversity}
                      onViewCourses={handleViewCourses}
                      onCompare={handleCompare}
                      onAskCounsellor={handleAskCounsellor}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        {paginationItems}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* ═══ Disclaimer ═══ */}
        <div className="mt-12 mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                University information is sourced from official university websites and verified ranking
                publishers. Always check the official university website for the most current information.
                Rankings shown are from the latest published edition of each provider and may change between
                publication cycles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
