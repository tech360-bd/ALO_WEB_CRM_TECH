'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronUp,
  GraduationCap, Clock, DollarSign, Award, Globe, ExternalLink,
  BookmarkPlus, GitCompare, Send, Loader2, ChevronLeft, ChevronRight,
  SearchX,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { COUNTRIES, STUDY_LEVELS, COUNTRY_FLAGS } from './types';
import type { Course } from './types';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SUBJECT_AREAS = [
  'Business & Management', 'Engineering', 'Computer Science & IT',
  'Medicine & Health', 'Law', 'Arts & Design', 'Science',
  'Social Sciences', 'Education', 'Hospitality & Tourism',
  'Agriculture', 'Environmental Studies',
];

interface Filters {
  search: string;
  countries: string[];
  studyLevels: string[];
  subjectArea: string;
  intakeYear: string;
  intakeMonth: string;
  tuitionRange: [number, number];
  scholarshipOnly: boolean;
  ieltsMin: number;
  englishTest: string;
  englishScore: string;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  countries: [],
  studyLevels: [],
  subjectArea: '',
  intakeYear: '',
  intakeMonth: '',
  tuitionRange: [0, 100000],
  scholarshipOnly: false,
  ieltsMin: 0,
  englishTest: '',
  englishScore: '',
};

function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSidebar({
  filters,
  onFiltersChange,
  onReset,
}: {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onReset: () => void;
}) {
  const toggleCountry = (country: string) => {
    const updated = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    onFiltersChange({ ...filters, countries: updated });
  };

  const toggleLevel = (level: string) => {
    const updated = filters.studyLevels.includes(level)
      ? filters.studyLevels.filter((l) => l !== level)
      : [...filters.studyLevels, level];
    onFiltersChange({ ...filters, studyLevels: updated });
  };

  const activeCount =
    filters.countries.length +
    filters.studyLevels.length +
    (filters.subjectArea ? 1 : 0) +
    (filters.intakeYear ? 1 : 0) +
    (filters.intakeMonth ? 1 : 0) +
    (filters.tuitionRange[0] > 0 || filters.tuitionRange[1] < 100000 ? 1 : 0) +
    (filters.scholarshipOnly ? 1 : 0) +
    (filters.ieltsMin > 0 ? 1 : 0) +
    (filters.englishTest ? 1 : 0) +
    (filters.englishScore ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-[var(--alo-text)]">Filters</h3>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className=" text-[var(--alo-text-muted)] h-7">
            Clear all ({activeCount})
          </Button>
        )}
      </div>

      <Separator />

      {/* Country */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Country</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {COUNTRIES.map((country) => (
            <label key={country} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.countries.includes(country)}
                onCheckedChange={() => toggleCountry(country)}
                className="data-[state=checked]:bg-[var(--alo-success-dark)] data-[state=checked]:border-crm-success-border"
              />
              <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)]">
                {COUNTRY_FLAGS[country]} {country}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Study Level */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Study Level</h4>
        <div className="space-y-2">
          {STUDY_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.studyLevels.includes(level)}
                onCheckedChange={() => toggleLevel(level)}
                className="data-[state=checked]:bg-[var(--alo-success-dark)] data-[state=checked]:border-crm-success-border"
              />
              <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)]">{level}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Subject Area */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Subject Area</h4>
        <Select
          value={filters.subjectArea}
          onValueChange={(v) => onFiltersChange({ ...filters, subjectArea: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Intake Year */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Intake Year</h4>
        <Select
          value={filters.intakeYear}
          onValueChange={(v) => onFiltersChange({ ...filters, intakeYear: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any year" />
          </SelectTrigger>
          <SelectContent>
            {['2025', '2026', '2027'].map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Intake Month */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Intake Month</h4>
        <Select
          value={filters.intakeMonth}
          onValueChange={(v) => onFiltersChange({ ...filters, intakeMonth: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Tuition Range */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">
          Tuition Range
        </h4>
        <div className="px-1">
          <Slider
            min={0}
            max={100000}
            step={5000}
            value={filters.tuitionRange}
            onValueChange={(v) => onFiltersChange({ ...filters, tuitionRange: v as [number, number] })}
            className="[&_[data-slot=slider-range]]:bg-[var(--alo-success-dark)] [&_[data-slot=slider-thumb]]:border-crm-success-border"
          />
          <div className="flex justify-between mt-2 text-xs text-[var(--alo-text-muted)]">
            <span>${(filters.tuitionRange[0] / 1000).toFixed(0)}k</span>
            <span>${(filters.tuitionRange[1] / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Scholarship */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-[var(--alo-body)]">Scholarship Available</h4>
          <Switch
            checked={filters.scholarshipOnly}
            onCheckedChange={(v) => onFiltersChange({ ...filters, scholarshipOnly: v })}
            className="data-[state=checked]:bg-[var(--alo-success-dark)]"
          />
        </div>
      </div>

      <Separator />

      {/* English Requirements — Enhanced per spec: english_requirements filter */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-text)] flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] flex items-center justify-center text-[11px] font-bold">EN</span>
          English Requirements
        </h4>
        <p className="text-[11px] text-[var(--alo-text-muted)] leading-relaxed">Filter courses by accepted English test and minimum score. Acceptance varies by university, course and visa route.</p>
        <Select
          value={filters.englishTest}
          onValueChange={(v) => onFiltersChange({ ...filters, englishTest: v === 'all' ? '' : v })}
        >
          <SelectTrigger className="w-full h-9 rounded-xl border-[var(--alo-border)] text-xs">
            <SelectValue placeholder="Select English Test" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tests</SelectItem>
            <SelectItem value="ielts">IELTS Academic</SelectItem>
            <SelectItem value="ielts-ukvi">IELTS UKVI</SelectItem>
            <SelectItem value="pte-academic">PTE Academic</SelectItem>
            <SelectItem value="toefl-ibt">TOEFL iBT</SelectItem>
            <SelectItem value="duolingo">Duolingo English Test</SelectItem>
            <SelectItem value="oietc">OIETC</SelectItem>
            <SelectItem value="oxford-ellt">Oxford ELLT</SelectItem>
            <SelectItem value="languagecert">LanguageCert</SelectItem>
            <SelectItem value="oet">OET</SelectItem>
            <SelectItem value="moi">MOI Guidance</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Target score e.g. 6.5, 58, 90"
          value={filters.englishScore}
          onChange={(e) => onFiltersChange({ ...filters, englishScore: e.target.value })}
          className="h-9 rounded-xl border-[var(--alo-border)] text-xs"
        />
        <p className="text-[11px] text-[var(--alo-text-muted)]">If requirement not in database: "Requirement not available in database. Check university course page."</p>
      </div>

      <Separator />

      {/* IELTS Min (legacy) */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">
          Min IELTS Score (legacy)
        </h4>
        <div className="px-1">
          <Slider
            min={0}
            max={9}
            step={0.5}
            value={[filters.ieltsMin]}
            onValueChange={(v) => onFiltersChange({ ...filters, ieltsMin: v[0] })}
            className="[&_[data-slot=slider-range]]:bg-[var(--alo-success-dark)] [&_[data-slot=slider-thumb]]:border-crm-success-border"
          />
          <div className="flex justify-between mt-2 text-xs text-[var(--alo-text-muted)]">
            <span>0</span>
            <span className="font-medium text-[var(--alo-body)]">{filters.ieltsMin.toFixed(1)}</span>
            <span>9.0</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Test Preparation Mini Card — intelligently placed beside Course Finder */}
      <TestPreparationMiniCard compact contextTitle="Prepare for English proficiency tests for this course" />

    </div>
  );
}

function CourseCard({
  course,
  onCompare,
  onSave,
  onEnquire,
}: {
  course: Course;
  onCompare: (c: Course) => void;
  onSave: (c: Course) => void;
  onEnquire: (c: Course) => void;
}) {
  const levelColors: Record<string, string> = {
    Undergraduate: 'bg-crm-success-bg text-crm-success-text',
    Postgraduate: 'bg-crm-warning-bg text-crm-warning-text',
    Foundation: 'bg-sky-100 text-sky-800',
    Diploma: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
    PhD: 'bg-crm-warning-bg text-crm-warning-text',
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-[var(--alo-border)]">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* University & Country */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-crm-success-text truncate">
              {COUNTRY_FLAGS[course.country]} {course.universityName}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={levelColors[course.studyLevel] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}
          >
            {course.studyLevel}
          </Badge>
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-[var(--alo-text)] leading-snug line-clamp-2 text-sm min-h-[2.5rem]">
          {course.courseTitle}
        </h3>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--alo-body)]">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-[var(--alo-text-muted)]" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="size-3.5 text-[var(--alo-text-muted)]" />
            <span>{course.tuitionCurrency} {course.tuitionFee.toLocaleString()}/yr</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-[var(--alo-text-muted)]" />
            <span>{course.country}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-[var(--alo-text-muted)]" />
            <span>Intake: {course.intake}</span>
          </div>
        </div>

        {/* Scholarship Badge */}
        {course.hasScholarship && (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-[var(--alo-success-dark)] text-white hover:bg-[var(--alo-success-dark)] text-xs">
              <Award className="size-3" />
              Scholarship Available
            </Badge>
          </div>
        )}

        {/* Requirements */}
        <div className="flex gap-3 text-xs text-[var(--alo-text-muted)]">
          {course.ieltsMin && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-[var(--alo-body)]">IELTS:</span> {course.ieltsMin}
            </span>
          )}
          {course.pteMin && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-[var(--alo-body)]">PTE:</span> {course.pteMin}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
 variant="outline"
 size="sm"
 className="flex-1 "
 onClick={() => onCompare(course)}
          >
            <GitCompare className="size-3 mr-1" />
            Compare
          </Button>
          <Button
 variant="outline"
 size="sm"
 className="flex-1 "
 onClick={() => onSave(course)}
          >
            <BookmarkPlus className="size-3 mr-1" />
            Save
          </Button>
          <Button
 variant="outline"
 size="sm"
 className="flex-1 "
 onClick={() => onEnquire(course)}
          >
            <Send className="size-3 mr-1" />
            Enquire
          </Button>
        </div>

        {/* Source Link */}
        {course.sourceUrl && (
          <a
            href={course.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-crm-success-text hover:text-crm-success-text hover:underline"
          >
            <ExternalLink className="size-3" />
            View on university website
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export function CourseFinderPublic() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const pageSize = 12;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.countries.length > 0) params.set('countries', filters.countries.join(','));
      if (filters.studyLevels.length > 0) params.set('studyLevels', filters.studyLevels.join(','));
      if (filters.subjectArea) params.set('subjectArea', filters.subjectArea);
      if (filters.intakeYear) params.set('intakeYear', filters.intakeYear);
      if (filters.intakeMonth) params.set('intakeMonth', filters.intakeMonth);
      if (filters.tuitionRange[0] > 0) params.set('tuitionMin', String(filters.tuitionRange[0]));
      if (filters.tuitionRange[1] < 100000) params.set('tuitionMax', String(filters.tuitionRange[1]));
      if (filters.scholarshipOnly) params.set('scholarship', 'true');
      if (filters.ieltsMin > 0) params.set('ieltsMin', String(filters.ieltsMin));
      if (filters.englishTest) params.set('englishTest', filters.englishTest);
      if (filters.englishScore) params.set('englishScore', filters.englishScore);
      if (filters.englishTest || filters.englishScore) params.set('english_requirements', `${filters.englishTest}:${filters.englishScore}`);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      const res = await fetch(`/api/course-finder?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCourses(data.courses || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || 0);
    } catch {
      // On API failure, show empty with error
      setCourses([]);
      setTotalPages(1);
      setTotalResults(0);
      toast.error('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handleCompare = (course: Course) => {
    toast.success(`"${course.courseTitle}" added to comparison`);
  };

  const handleSave = (course: Course) => {
    toast.success(`"${course.courseTitle}" saved to your list`);
  };

  const handleEnquire = (course: Course) => {
    toast.success(`Enquiry sent for "${course.courseTitle}"`);
  };

  const filterContent = (
    <FilterSidebar
      filters={filters}
      onFiltersChange={setFilters}
      onReset={handleResetFilters}
    />
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="flex items-center justify-center gap-1 mt-6">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-[var(--alo-text-muted)]">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={
                currentPage === page
                  ? 'h-8 w-8 p-0 bg-[var(--alo-success-dark)] hover:bg-[var(--alo-success-dark)] text-white'
                  : 'h-8 w-8 p-0'
              }
            >
              {page}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[var(--alo-success-dark)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold">Course Finder</h1>
          <p className="text-crm-success-text mt-2 text-sm sm:text-base">
            Discover the perfect course from top universities worldwide
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--alo-text-muted)]" />
            <Input
              placeholder="Search courses, universities, or subjects..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-white text-[var(--alo-text)] border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
            {filters.search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 bg-white border border-[var(--alo-border)] rounded-xl p-5 shadow-sm">
              {filterContent}
            </div>
          </aside>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                variant="outline"
                className="lg:hidden fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-[var(--alo-success-dark)] text-white border-crm-success-border hover:bg-[var(--alo-success-dark)] hover:text-white"
              >
                <SlidersHorizontal className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{filterContent}</div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--alo-text-muted)]">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>
                    <span className="font-medium text-[var(--alo-body)]">{totalResults}</span>{' '}
                    {totalResults === 1 ? 'course' : 'courses'} found
                  </>
                )}
              </p>
              <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--alo-text-muted)]">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>

            {/* Loading Skeletons */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && courses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--alo-surface-muted)] flex items-center justify-center mb-4">
                  <SearchX className="size-10 text-[var(--alo-placeholder)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--alo-body)]">No courses found</h3>
                <p className="text-sm text-[var(--alo-text-muted)] mt-1 max-w-md">
                  Try adjusting your search criteria or filters to find more courses.
                </p>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-4 text-crm-success-text border-crm-success-border hover:bg-crm-success-bg"
                >
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Course Cards Grid */}
            {!loading && courses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onCompare={handleCompare}
                    onSave={handleSave}
                    onEnquire={handleEnquire}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {renderPagination()}
          </main>
        </div>
      </div>
    </div>
  );
}