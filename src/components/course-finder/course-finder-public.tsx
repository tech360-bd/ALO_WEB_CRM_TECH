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
    (filters.ieltsMin > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900">Filters</h3>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-slate-500 h-7">
            Clear all ({activeCount})
          </Button>
        )}
      </div>

      <Separator />

      {/* Country */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-700">Country</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {COUNTRIES.map((country) => (
            <label key={country} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.countries.includes(country)}
                onCheckedChange={() => toggleCountry(country)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900">
                {COUNTRY_FLAGS[country]} {country}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Study Level */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-700">Study Level</h4>
        <div className="space-y-2">
          {STUDY_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.studyLevels.includes(level)}
                onCheckedChange={() => toggleLevel(level)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900">{level}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Subject Area */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-700">Subject Area</h4>
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
        <h4 className="text-sm font-medium text-slate-700">Intake Year</h4>
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
        <h4 className="text-sm font-medium text-slate-700">Intake Month</h4>
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
        <h4 className="text-sm font-medium text-slate-700">
          Tuition Range
        </h4>
        <div className="px-1">
          <Slider
            min={0}
            max={100000}
            step={5000}
            value={filters.tuitionRange}
            onValueChange={(v) => onFiltersChange({ ...filters, tuitionRange: v as [number, number] })}
            className="[&_[data-slot=slider-range]]:bg-emerald-600 [&_[data-slot=slider-thumb]]:border-emerald-600"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>${(filters.tuitionRange[0] / 1000).toFixed(0)}k</span>
            <span>${(filters.tuitionRange[1] / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Scholarship */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">Scholarship Available</h4>
          <Switch
            checked={filters.scholarshipOnly}
            onCheckedChange={(v) => onFiltersChange({ ...filters, scholarshipOnly: v })}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </div>

      <Separator />

      {/* IELTS Min */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-700">
          Min IELTS Score
        </h4>
        <div className="px-1">
          <Slider
            min={0}
            max={9}
            step={0.5}
            value={[filters.ieltsMin]}
            onValueChange={(v) => onFiltersChange({ ...filters, ieltsMin: v[0] })}
            className="[&_[data-slot=slider-range]]:bg-emerald-600 [&_[data-slot=slider-thumb]]:border-emerald-600"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0</span>
            <span className="font-medium text-slate-700">{filters.ieltsMin.toFixed(1)}</span>
            <span>9.0</span>
          </div>
        </div>
      </div>
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
    Undergraduate: 'bg-emerald-100 text-emerald-800',
    Postgraduate: 'bg-amber-100 text-amber-800',
    Foundation: 'bg-sky-100 text-sky-800',
    Diploma: 'bg-violet-100 text-violet-800',
    PhD: 'bg-rose-100 text-rose-800',
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* University & Country */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-600 truncate">
              {COUNTRY_FLAGS[course.country]} {course.universityName}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={levelColors[course.studyLevel] || 'bg-slate-100 text-slate-700'}
          >
            {course.studyLevel}
          </Badge>
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 text-sm min-h-[2.5rem]">
          {course.courseTitle}
        </h3>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-slate-400" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="size-3.5 text-slate-400" />
            <span>{course.tuitionCurrency} {course.tuitionFee.toLocaleString()}/yr</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="size-3.5 text-slate-400" />
            <span>{course.country}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-slate-400" />
            <span>Intake: {course.intake}</span>
          </div>
        </div>

        {/* Scholarship Badge */}
        {course.hasScholarship && (
          <div className="flex items-center gap-1.5">
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs">
              <Award className="size-3" />
              Scholarship Available
            </Badge>
          </div>
        )}

        {/* Requirements */}
        <div className="flex gap-3 text-xs text-slate-500">
          {course.ieltsMin && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-700">IELTS:</span> {course.ieltsMin}
            </span>
          )}
          {course.pteMin && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-slate-700">PTE:</span> {course.pteMin}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onCompare(course)}
          >
            <GitCompare className="size-3 mr-1" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onSave(course)}
          >
            <BookmarkPlus className="size-3 mr-1" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
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
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
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
            <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400">
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
                  ? 'h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white'
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
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold">Course Finder</h1>
          <p className="text-emerald-100 mt-2 text-sm sm:text-base">
            Discover the perfect course from top universities worldwide
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              placeholder="Search courses, universities, or subjects..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-white text-slate-900 border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
            {filters.search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
            <div className="sticky top-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              {filterContent}
            </div>
          </aside>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="lg:hidden fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
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
              <p className="text-sm text-slate-500">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>
                    <span className="font-medium text-slate-700">{totalResults}</span>{' '}
                    {totalResults === 1 ? 'course' : 'courses'} found
                  </>
                )}
              </p>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
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
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <SearchX className="size-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No courses found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md">
                  Try adjusting your search criteria or filters to find more courses.
                </p>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="mt-4 text-emerald-600 border-emerald-600 hover:bg-emerald-50"
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