'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, SlidersHorizontal, X, Clock, Award, Globe,
  ExternalLink, BookmarkPlus, GitCompare, Send, Loader2,
  ChevronLeft, ChevronRight, SearchX, ShieldCheck, ShieldX,
  FileText, Download, UserCheck, UserX, ChevronDown, ChevronUp,
  ListPlus, FilePlus2, StickyNote, DollarSign,
  Percent, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  COUNTRIES, STUDY_LEVELS, COUNTRY_FLAGS,
} from './types';
import type { Course } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SUBJECT_AREAS = [
  'Business & Management', 'Engineering', 'Computer Science & IT',
  'Medicine & Health', 'Law', 'Arts & Design', 'Science',
  'Social Sciences', 'Education', 'Hospitality & Tourism',
];

const MOCK_STUDENTS = [
  { id: 's1', name: 'Ahmed Khan', ieltsScore: 7.0, pteScore: 65, gpa: 3.4 },
  { id: 's2', name: 'Priya Sharma', ieltsScore: 6.5, pteScore: 58, gpa: 3.1 },
  { id: 's3', name: 'David Chen', ieltsScore: 7.5, pteScore: 72, gpa: 3.8 },
  { id: 's4', name: 'Fatima Al-Rashid', ieltsScore: 6.0, pteScore: 50, gpa: 2.9 },
  { id: 's5', name: 'James Wilson', ieltsScore: 8.0, pteScore: 79, gpa: 3.6 },
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

function EligibilityIndicator({ course, student }: { course: Course; student: typeof MOCK_STUDENTS[0] | null }) {
  if (!student) return null;

  const ieltsOk = !course.ieltsMin || student.ieltsScore >= course.ieltsMin;
  const pteOk = !course.pteMin || student.pteScore >= course.pteMin;

  if (ieltsOk && pteOk) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-medium">
        <UserCheck className="size-3.5" />
        Eligible
      </div>
    );
  }
  const issues: string[] = [];
  if (!ieltsOk) issues.push(`IELTS ${course.ieltsMin} req.`);
  if (!pteOk) issues.push(`PTE ${course.pteMin} req.`);

  return (
    <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-medium">
      <UserX className="size-3.5" />
      {issues.join(', ')}
    </div>
  );
}

function CommissionPanel({ course, canView }: { course: Course; canView: boolean }) {
  if (!canView) return null;

  return (
    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Expected</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">
          {course.commissionExpected != null ? `${course.commissionExpected}%` : '—'}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Increased</p>
        <p className="text-sm font-semibold text-emerald-600 mt-0.5">
          {course.commissionIncreased != null ? `${course.commissionIncreased}%` : '—'}
        </p>
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Partner</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">
          {course.commissionPartner != null ? `${course.commissionPartner}%` : '—'}
        </p>
      </div>
    </div>
  );
}

function NotesPanel({ course, canView }: { course: Course; canView: boolean }) {
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);

  if (!canView) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="w-full text-xs text-slate-500 hover:text-slate-700 h-7">
          <StickyNote className="size-3.5 mr-1.5" />
          Internal Notes
          {open ? <ChevronUp className="size-3 ml-auto" /> : <ChevronDown className="size-3 ml-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <textarea
          className="w-full mt-1 text-xs border border-slate-200 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[60px]"
          placeholder="Add internal notes about this course..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

function ProCourseCard({
  course,
  selectedStudent,
  role,
  onShortlist,
  onApply,
}: {
  course: Course;
  selectedStudent: typeof MOCK_STUDENTS[0] | null;
  role: string;
  onShortlist: (c: Course) => void;
  onApply: (c: Course) => void;
}) {
  const levelColors: Record<string, string> = {
    Undergraduate: 'bg-emerald-100 text-emerald-800',
    Postgraduate: 'bg-amber-100 text-amber-800',
    Foundation: 'bg-sky-100 text-sky-800',
    Diploma: 'bg-violet-100 text-violet-800',
    PhD: 'bg-rose-100 text-rose-800',
  };

  const canViewCommission = role === 'admin' || role === 'manager';
  const canViewNotes = role === 'admin' || role === 'manager' || role === 'counselor';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Top Row: University + Verified Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-600 truncate">
              {COUNTRY_FLAGS[course.country]} {course.universityName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Verification Badge */}
            {course.sourceVerified ? (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] gap-1 px-1.5">
                <ShieldCheck className="size-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] gap-1 px-1.5">
                <ShieldX className="size-3" />
                Unverified
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={levelColors[course.studyLevel] || 'bg-slate-100 text-slate-700'}
            >
              {course.studyLevel}
            </Badge>
          </div>
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 text-sm min-h-[2.5rem]">
          {course.courseTitle}
        </h3>

        {/* Details Grid */}
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
            <Award className="size-3.5 text-slate-400" />
            <span>Intake: {course.intake}</span>
          </div>
        </div>

        {/* Scholarship */}
        {course.hasScholarship && (
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs w-fit">
            <Award className="size-3" />
            Scholarship Available
          </Badge>
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

        {/* Eligibility Indicator */}
        <EligibilityIndicator course={course} student={selectedStudent} />

        {/* Commission Panel (collapsible) */}
        {canViewCommission && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="w-full text-xs text-slate-500 hover:text-slate-700 h-7 -mt-1">
                <DollarSign className="size-3.5 mr-1.5" />
                Commission Details
                <ChevronDown className="size-3 ml-auto" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CommissionPanel course={course} canView={canViewCommission} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Internal Notes */}
        <NotesPanel course={course} canView={canViewNotes} />

        {/* Pro Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onShortlist(course)}
          >
            <ListPlus className="size-3 mr-1" />
            Shortlist
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onApply(course)}
          >
            <FilePlus2 className="size-3 mr-1" />
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              if (course.sourceUrl) window.open(course.sourceUrl, '_blank');
            }}
            disabled={!course.sourceUrl}
          >
            <ExternalLink className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-6 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CourseFinderPro({ role = 'admin' }: { role?: string }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const pageSize = 12;

  const selectedStudent = MOCK_STUDENTS.find((s) => s.id === selectedStudentId) || null;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('role', role);
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

      const res = await fetch(`/api/course-finder/pro?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCourses(data.courses || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || 0);
    } catch {
      setCourses([]);
      setTotalPages(1);
      setTotalResults(0);
      toast.error('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, role]);

  useEffect(() => { setCurrentPage(1); }, [filters]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handleExport = () => {
    toast.success('Exporting results to CSV...');
  };

  const handleShortlist = (course: Course) => {
    if (!selectedStudentId) {
      toast.error('Please select a student first');
      return;
    }
    toast.success(`"${course.courseTitle}" added to ${selectedStudent?.name}'s shortlist`);
  };

  const handleApply = (course: Course) => {
    if (!selectedStudentId) {
      toast.error('Please select a student first');
      return;
    }
    toast.success(`Application created for "${course.courseTitle}"`);
  };

  const toggleCountry = (country: string) => {
    const updated = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country];
    setFilters({ ...filters, countries: updated });
  };

  const toggleLevel = (level: string) => {
    const updated = filters.studyLevels.includes(level)
      ? filters.studyLevels.filter((l) => l !== level)
      : [...filters.studyLevels, level];
    setFilters({ ...filters, studyLevels: updated });
  };

  const filterSidebar = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-slate-500 h-7">
          Reset
        </Button>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Country</h4>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {COUNTRIES.map((country) => (
            <label key={country} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.countries.includes(country)}
                onCheckedChange={() => toggleCountry(country)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="text-sm text-slate-600">{COUNTRY_FLAGS[country]} {country}</span>
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Study Level</h4>
        <div className="space-y-2">
          {STUDY_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.studyLevels.includes(level)}
                onCheckedChange={() => toggleLevel(level)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span className="text-sm text-slate-600">{level}</span>
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Subject Area</h4>
        <Select value={filters.subjectArea} onValueChange={(v) => setFilters({ ...filters, subjectArea: v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            {SUBJECT_AREAS.map((area) => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Tuition Range</h4>
        <Slider
          min={0} max={100000} step={5000}
          value={filters.tuitionRange}
          onValueChange={(v) => setFilters({ ...filters, tuitionRange: v as [number, number] })}
          className="[&_[data-slot=slider-range]]:bg-emerald-600 [&_[data-slot=slider-thumb]]:border-emerald-600"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>${(filters.tuitionRange[0] / 1000).toFixed(0)}k</span>
          <span>${(filters.tuitionRange[1] / 1000).toFixed(0)}k</span>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Min IELTS</h4>
        <Slider
          min={0} max={9} step={0.5}
          value={[filters.ieltsMin]}
          onValueChange={(v) => setFilters({ ...filters, ieltsMin: v[0] })}
          className="[&_[data-slot=slider-range]]:bg-emerald-600 [&_[data-slot=slider-thumb]]:border-emerald-600"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>0</span>
          <span className="font-medium text-slate-700">{filters.ieltsMin.toFixed(1)}</span>
          <span>9.0</span>
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700">Scholarship Only</h4>
        <Switch
          checked={filters.scholarshipOnly}
          onCheckedChange={(v) => setFilters({ ...filters, scholarshipOnly: v })}
          className="data-[state=checked]:bg-emerald-600"
        />
      </div>
    </div>
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
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 w-8 p-0">
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`e-${idx}`} className="px-2 text-sm text-slate-400">...</span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? 'h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white' : 'h-8 w-8 p-0'}
            >
              {page}
            </Button>
          ),
        )}
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 w-8 p-0">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Pro Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-emerald-600 text-white text-[10px] uppercase tracking-wider">
              CRM Pro
            </Badge>
            <span className="text-xs text-slate-400">Role: {role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Course Finder Pro</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Advanced course search with commission data and student matching
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                placeholder="Search courses..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="pl-10 h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
              />
              {filters.search && (
                <button onClick={() => setFilters((prev) => ({ ...prev, search: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Student Selector */}
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full sm:w-64 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_STUDENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-xs text-slate-400">IELTS {s.ieltsScore}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pro Action Bar */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-8"
              onClick={handleExport}
            >
              <Download className="size-3.5 mr-1.5" />
              Export Results
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              {filterSidebar}
            </div>
          </aside>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="lg:hidden fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white">
                <SlidersHorizontal className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-4">{filterSidebar}</div>
            </SheetContent>
          </Sheet>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                {loading ? <Skeleton className="h-4 w-32" /> : (
                  <>
                    <span className="font-medium text-slate-700">{totalResults}</span> results
                  </>
                )}
              </p>
              {selectedStudent && (
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                  <UserCheck className="size-3 mr-1" />
                  {selectedStudent.name} — IELTS {selectedStudent.ieltsScore}
                </Badge>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
              </div>
            )}

            {!loading && courses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <SearchX className="size-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No courses found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters.</p>
                <Button variant="outline" onClick={handleResetFilters} className="mt-4 text-emerald-600 border-emerald-600 hover:bg-emerald-50">
                  Clear filters
                </Button>
              </div>
            )}

            {!loading && courses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <ProCourseCard
                    key={course.id}
                    course={course}
                    selectedStudent={selectedStudent}
                    role={role}
                    onShortlist={handleShortlist}
                    onApply={handleApply}
                  />
                ))}
              </div>
            )}

            {renderPagination()}
          </main>
        </div>
      </div>
    </div>
  );
}