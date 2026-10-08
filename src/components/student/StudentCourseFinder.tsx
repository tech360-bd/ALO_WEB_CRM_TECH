'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Bookmark,
  GraduationCap,
  Globe,
  Calendar,
  Award,
  Languages,
  Clock,
  AlertTriangle,
  Star,
  X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface CourseData {
  id: string;
  name: string;
  university: string;
  country: string;
  city: string;
  flag: string;
  intake: string;
  duration: string;
  tuition: string;
  scholarship: string | null;
  matchScore: number;
  ielts: string;
  gpa: string;
  admissionChance: 'High' | 'Medium' | 'Low';
  deposit: string;
  appFee: string;
  deadline: string;
  daysRemaining: number;
  level: string;
  subject: string;
  ranking: number;
  logoColor: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────
const MOCK_COURSES: CourseData[] = [
  {
    id: '1',
    name: 'MSc Data Science',
    university: 'University of Glasgow',
    country: 'UK',
    city: 'Glasgow',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£24,000',
    scholarship: null,
    matchScore: 92,
    ielts: '6.5',
    gpa: '3.2+',
    admissionChance: 'High',
    deposit: '£2,000',
    appFee: 'Free',
    deadline: '15 Jul 2026',
    daysRemaining: 245,
    level: 'Masters',
    subject: 'Computer Science',
    ranking: 76,
    logoColor: 'bg-[#003865]',
  },
  {
    id: '2',
    name: 'MSc International Business',
    university: 'University of Leeds',
    country: 'UK',
    city: 'Leeds',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£21,000',
    scholarship: null,
    matchScore: 88,
    ielts: '6.0',
    gpa: '3.0+',
    admissionChance: 'High',
    deposit: '£1,500',
    appFee: 'Free',
    deadline: '30 Jun 2026',
    daysRemaining: 230,
    level: 'Masters',
    subject: 'Business',
    ranking: 86,
    logoColor: 'bg-[#9B1B30]',
  },
  {
    id: '3',
    name: 'MSc Computer Science',
    university: 'University of Birmingham',
    country: 'UK',
    city: 'Birmingham',
    flag: '🇬🇧',
    intake: 'Jan 2026',
    duration: '1 year',
    tuition: '£28,000',
    scholarship: null,
    matchScore: 85,
    ielts: '6.5',
    gpa: '3.3+',
    admissionChance: 'High',
    deposit: '£2,500',
    appFee: '£50',
    deadline: '15 Nov 2025',
    daysRemaining: 42,
    level: 'Masters',
    subject: 'Computer Science',
    ranking: 84,
    logoColor: 'bg-[#2563EB]',
  },
  {
    id: '4',
    name: 'MBA',
    university: 'University of Aberdeen',
    country: 'UK',
    city: 'Aberdeen',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£18,000',
    scholarship: '£3,000',
    matchScore: 82,
    ielts: '6.5',
    gpa: '3.0+',
    admissionChance: 'High',
    deposit: '£1,000',
    appFee: 'Free',
    deadline: '31 Jul 2026',
    daysRemaining: 261,
    level: 'Masters',
    subject: 'Business',
    ranking: 208,
    logoColor: 'bg-[#8B0000]',
  },
  {
    id: '5',
    name: 'MSc Engineering Management',
    university: 'University of Sheffield',
    country: 'UK',
    city: 'Sheffield',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£26,000',
    scholarship: null,
    matchScore: 80,
    ielts: '6.5',
    gpa: '3.0+',
    admissionChance: 'Medium',
    deposit: '£2,000',
    appFee: '£60',
    deadline: '30 Jun 2026',
    daysRemaining: 230,
    level: 'Masters',
    subject: 'Engineering',
    ranking: 104,
    logoColor: 'bg-[#2D4A7A]',
  },
  {
    id: '6',
    name: 'BSc Nursing',
    university: 'University of Manchester',
    country: 'UK',
    city: 'Manchester',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '3 years',
    tuition: '£22,000/yr',
    scholarship: null,
    matchScore: 75,
    ielts: '7.0',
    gpa: '3.5+',
    admissionChance: 'Medium',
    deposit: '£3,000',
    appFee: 'Free',
    deadline: '15 Jan 2026',
    daysRemaining: 12,
    level: 'Undergraduate',
    subject: 'Medicine',
    ranking: 54,
    logoColor: 'bg-[#660099]',
  },
  {
    id: '7',
    name: 'MSc Finance',
    university: 'University of Edinburgh',
    country: 'UK',
    city: 'Edinburgh',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£32,000',
    scholarship: null,
    matchScore: 70,
    ielts: '7.0',
    gpa: '3.5+',
    admissionChance: 'Medium',
    deposit: '£3,500',
    appFee: '£50',
    deadline: '31 May 2026',
    daysRemaining: 199,
    level: 'Masters',
    subject: 'Business',
    ranking: 22,
    logoColor: 'bg-[#B50127]',
  },
  {
    id: '8',
    name: 'Foundation in Business',
    university: 'INTO London',
    country: 'UK',
    city: 'London',
    flag: '🇬🇧',
    intake: 'Jan 2026',
    duration: '9 months',
    tuition: '£15,000',
    scholarship: null,
    matchScore: 65,
    ielts: '5.5',
    gpa: '2.5+',
    admissionChance: 'High',
    deposit: '£500',
    appFee: 'Free',
    deadline: '01 Dec 2025',
    daysRemaining: 28,
    level: 'Foundation',
    subject: 'Business',
    ranking: 0,
    logoColor: 'bg-[#2563EB]',
  },
  {
    id: '9',
    name: 'MSc Artificial Intelligence',
    university: 'University of Southampton',
    country: 'UK',
    city: 'Southampton',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£29,000',
    scholarship: null,
    matchScore: 90,
    ielts: '6.5',
    gpa: '3.3+',
    admissionChance: 'High',
    deposit: '£2,500',
    appFee: '£50',
    deadline: '31 Jul 2026',
    daysRemaining: 261,
    level: 'Masters',
    subject: 'Computer Science',
    ranking: 80,
    logoColor: 'bg-[#6B2D5B]',
  },
];

// ─── Filter Configs ──────────────────────────────────────────────────
const COUNTRIES = [
  'UK', 'USA', 'Canada', 'Australia', 'Germany',
  'Netherlands', 'Sweden', 'Denmark', 'New Zealand', 'Ireland',
];

const PROGRAM_LEVELS = [
  'Foundation', 'Undergraduate', 'Pre-Master', 'Masters',
  'PhD', 'PGD', 'Certificate', 'Diploma',
];

const SUBJECT_AREAS = [
  'Business', 'Engineering', 'Computer Science', 'Medicine',
  'Law', 'Arts', 'Science', 'Social Science', 'Education',
  'Architecture', 'Media & Communication', 'Health Sciences',
];

const INTAKES = [
  'Jan 2026', 'Feb 2026', 'Mar 2026', 'Sep 2025', 'Sep 2026', 'Jan 2027',
];

const TUITION_RANGES = [
  'Under 10L BDT', '10-15L BDT', '15-20L BDT', '20-30L BDT', '30L+', 'Any',
];

const IELTS_SCORES = ['5.5', '6.0', '6.5', '7.0', '7.5', '8.0+'];

const QUICK_FILTERS = [
  { label: 'No Interview', icon: null },
  { label: 'Low Deposit', icon: null },
  { label: 'Fast Offer', icon: null },
  { label: 'Open Programs', icon: null },
  { label: 'Scholarship Available', icon: null },
  { label: 'High Visa Success', icon: null },
  { label: 'Affordable', icon: null },
  { label: 'High Acceptance Rate', icon: null },
  { label: 'Co-op/Internship', icon: null },
  { label: 'No Deposit', icon: null },
  { label: 'MOI Accepted', icon: null },
  { label: 'Without English Test', icon: null },
];

// ─── Match Score Color ───────────────────────────────────────────────
function matchColor(score: number) {
  if (score >= 90) return 'bg-emerald-500 text-white';
  if (score >= 80) return 'bg-[#2563EB] text-white';
  if (score >= 70) return 'bg-amber-500 text-white';
  return 'bg-slate-400 text-white';
}

function admissionColor(chance: string) {
  switch (chance) {
    case 'High': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low': return 'bg-red-50 text-red-700 border-red-200';
    default: return '';
  }
}

// ─── Filter Sidebar Content ──────────────────────────────────────────
function FilterSidebarContent({
  selectedCountries,
  setSelectedCountries,
  selectedLevels,
  setSelectedLevels,
  selectedSubjects,
  setSelectedSubjects,
  selectedIntakes,
  setSelectedIntakes,
  selectedTuition,
  setSelectedTuition,
  selectedIelts,
  setSelectedIelts,
  scholarshipFilter,
  setScholarshipFilter,
  activeQuickFilters,
  toggleQuickFilter,
}: {
  selectedCountries: string[];
  setSelectedCountries: (v: string[]) => void;
  selectedLevels: string[];
  setSelectedLevels: (v: string[]) => void;
  selectedSubjects: string[];
  setSelectedSubjects: (v: string[]) => void;
  selectedIntakes: string[];
  setSelectedIntakes: (v: string[]) => void;
  selectedTuition: string[];
  setSelectedTuition: (v: string[]) => void;
  selectedIelts: string[];
  setSelectedIelts: (v: string[]) => void;
  scholarshipFilter: string;
  setScholarshipFilter: (v: string) => void;
  activeQuickFilters: string[];
  toggleQuickFilter: (f: string) => void;
}) {
  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  return (
    <div className="space-y-1 pr-2">
      {/* Quick Filters */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Filters</h4>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => toggleQuickFilter(f.label)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border cursor-pointer
                ${activeQuickFilters.includes(f.label)
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Separator className="mb-3" />

      {/* Country */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><Globe className="size-4" /> Country</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {COUNTRIES.map((c) => (
              <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selectedCountries.includes(c)}
                  onCheckedChange={() => toggleItem(selectedCountries, c, setSelectedCountries)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{c}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Program Level */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><GraduationCap className="size-4" /> Program Level</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {PROGRAM_LEVELS.map((l) => (
              <label key={l} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selectedLevels.includes(l)}
                  onCheckedChange={() => toggleItem(selectedLevels, l, setSelectedLevels)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{l}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Subject Area */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><Star className="size-4" /> Subject Area</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {SUBJECT_AREAS.map((s) => (
              <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selectedSubjects.includes(s)}
                  onCheckedChange={() => toggleItem(selectedSubjects, s, setSelectedSubjects)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{s}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Intake */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><Calendar className="size-4" /> Intake</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {INTAKES.map((i) => (
              <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selectedIntakes.includes(i)}
                  onCheckedChange={() => toggleItem(selectedIntakes, i, setSelectedIntakes)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{i}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Tuition Fee */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><Award className="size-4" /> Tuition Fee</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {TUITION_RANGES.map((t) => (
              <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selectedTuition.includes(t)}
                  onCheckedChange={() => toggleItem(selectedTuition, t, setSelectedTuition)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{t}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* IELTS Score */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><Languages className="size-4" /> IELTS Score</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {IELTS_SCORES.map((s) => (
              <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selectedIelts.includes(s)}
                  onCheckedChange={() => toggleItem(selectedIelts, s, setSelectedIelts)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{s}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Scholarship */}
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-semibold text-slate-800 hover:text-[#2563EB] transition-colors cursor-pointer">
          <span className="flex items-center gap-2"><Award className="size-4" /> Scholarship</span>
          <ChevronDown className="size-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 pl-1">
            {['Available', 'Not Available'].map((s) => (
              <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={scholarshipFilter === s}
                  onCheckedChange={() => setScholarshipFilter(scholarshipFilter === s ? '' : s)}
                  className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
                <span className="text-sm text-slate-700 group-hover:text-[#2563EB] transition-colors">{s}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────
function CourseCard({ course, onShortlist, onCompare, isShortlisted, isCompareChecked }: {
  course: CourseData;
  onShortlist: () => void;
  onCompare: (checked: boolean) => void;
  isShortlisted: boolean;
  isCompareChecked: boolean;
}) {
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col gap-3">
      {/* Top Row: Logo + Match + Admission Chance */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 size-10 rounded-lg ${course.logoColor} flex items-center justify-center text-white font-bold text-sm`}>
            {course.university.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-tight">
              {course.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{course.university}</p>
          </div>
        </div>
        <div className={`shrink-0 size-11 rounded-full ${matchColor(course.matchScore)} flex flex-col items-center justify-center text-xs font-bold`}>
          <span>{course.matchScore}%</span>
          <span className="text-[9px] font-medium opacity-80">Match</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <span className="text-base">{course.flag}</span>
        <span>{course.city}</span>
        <span className="text-slate-300">•</span>
        <span>{course.country}</span>
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[11px] px-2 py-0 font-medium border-slate-200 text-slate-600">
          <Calendar className="size-3 mr-1" /> {course.intake}
        </Badge>
        <Badge variant="outline" className="text-[11px] px-2 py-0 font-medium border-slate-200 text-slate-600">
          <Clock className="size-3 mr-1" /> {course.duration}
        </Badge>
        <Badge className={`text-[11px] px-2 py-0 font-medium ${admissionColor(course.admissionChance)}`}>
          {course.admissionChance} Chance
        </Badge>
      </div>

      {/* Tuition */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-900">{course.tuition}</span>
        {course.scholarship && (
          <span className="text-sm font-semibold text-emerald-600">Scholarship {course.scholarship}</span>
        )}
      </div>

      {/* Requirements */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Languages className="size-3" /> IELTS {course.ielts}+</span>
        <span className="flex items-center gap-1"><GraduationCap className="size-3" /> GPA {course.gpa}</span>
      </div>

      {/* Deposit & App Fee */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>Deposit: <span className="font-medium text-slate-700">{course.deposit}</span></span>
        <span>App Fee: <span className="font-medium text-slate-700">{course.appFee}</span></span>
      </div>

      {/* Deadline */}
      <div className={`flex items-center gap-1.5 text-xs ${course.daysRemaining <= 30 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
        <AlertTriangle className="size-3" />
        <span>Deadline: {course.deadline}</span>
        {course.daysRemaining > 0 && (
          <span className="ml-1">({course.daysRemaining} days left)</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="cta" size="sm" className="flex-1 h-8 text-xs">
          Apply
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 text-xs ${isShortlisted ? 'border-amber-400 bg-amber-50 text-amber-700' : ''}`}
          onClick={onShortlist}
        >
          <Bookmark className={`size-3 ${isShortlisted ? 'fill-amber-500 text-amber-500' : ''}`} />
          {isShortlisted ? 'Saved' : 'Shortlist'}
        </Button>
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500 hover:text-[#2563EB] transition-colors whitespace-nowrap">
          <Checkbox
            checked={isCompareChecked}
            onCheckedChange={(checked) => onCompare(checked === true)}
            className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
          />
          Compare
        </label>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function StudentCourseFinder() {
  usePortalStore(); // initialize store

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedIntakes, setSelectedIntakes] = useState<string[]>([]);
  const [selectedTuition, setSelectedTuition] = useState<string[]>([]);
  const [selectedIelts, setSelectedIelts] = useState<string[]>([]);
  const [scholarshipFilter, setScholarshipFilter] = useState('');
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  // State
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const toggleQuickFilter = (f: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(f) ? prev.filter((i) => i !== f) : [...prev, f]
    );
  };

  // Filter + sort courses
  const filteredCourses = useMemo(() => {
    let courses = [...MOCK_COURSES];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.university.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }

    if (selectedCountries.length > 0) {
      courses = courses.filter((c) => selectedCountries.includes(c.country));
    }
    if (selectedLevels.length > 0) {
      courses = courses.filter((c) => selectedLevels.includes(c.level));
    }
    if (selectedSubjects.length > 0) {
      courses = courses.filter((c) => selectedSubjects.includes(c.subject));
    }
    if (selectedIntakes.length > 0) {
      courses = courses.filter((c) => selectedIntakes.includes(c.intake));
    }
    if (scholarshipFilter === 'Available') {
      courses = courses.filter((c) => c.scholarship !== null);
    } else if (scholarshipFilter === 'Not Available') {
      courses = courses.filter((c) => c.scholarship === null);
    }

    switch (sortBy) {
      case 'tuition-low':
        courses.sort((a, b) => parseInt(a.tuition.replace(/[^0-9]/g, '')) - parseInt(b.tuition.replace(/[^0-9]/g, '')));
        break;
      case 'ranking':
        courses.sort((a, b) => a.ranking - b.ranking);
        break;
      case 'match':
        courses.sort((a, b) => b.matchScore - a.matchScore);
        break;
      default:
        courses.sort((a, b) => b.matchScore - a.matchScore);
    }

    return courses;
  }, [searchQuery, selectedCountries, selectedLevels, selectedSubjects, selectedIntakes, selectedTuition, selectedIelts, scholarshipFilter, activeQuickFilters, sortBy]);

  const toggleShortlist = (id: string) => {
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCompare = (id: string, checked: boolean) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size < 5) next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const totalResults = filteredCourses.length;
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filtering and sorting invalidate the current page. Clamp again when a
  // result set shrinks after a deletion or a restrictive filter.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCountries, selectedLevels, selectedSubjects, selectedIntakes, selectedTuition, selectedIelts, scholarshipFilter, activeQuickFilters, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCountries([]);
    setSelectedLevels([]);
    setSelectedSubjects([]);
    setSelectedIntakes([]);
    setSelectedTuition([]);
    setSelectedIelts([]);
    setScholarshipFilter('');
    setActiveQuickFilters([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCountries.length > 0 ||
    selectedLevels.length > 0 ||
    selectedSubjects.length > 0 ||
    selectedIntakes.length > 0 ||
    selectedTuition.length > 0 ||
    selectedIelts.length > 0 ||
    scholarshipFilter !== '' ||
    activeQuickFilters.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Search Bar Hero ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-[#0a1628] to-slate-900 px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Find Your Perfect Course
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Search from thousands of courses across top universities worldwide
          </p>
        </div>
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, universities, or subjects..."
              className="h-12 pl-12 pr-4 text-base rounded-xl bg-white border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </div>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
            variant="brand"
            size="lg"
            className="h-12 px-6 rounded-xl shrink-0"
          >
            <Sparkles className="size-4" />
            AI Match
          </Button>
        </div>

        {/* Filter Chips Row */}
        <div className="max-w-4xl mx-auto mt-4 flex flex-wrap gap-2">
          {[
            { label: 'Country', value: selectedCountries.length },
            { label: 'Level', value: selectedLevels.length },
            { label: 'Subject', value: selectedSubjects.length },
            { label: 'Intake', value: selectedIntakes.length },
            { label: 'Scholarship', value: scholarshipFilter ? 1 : 0 },
            { label: 'IELTS Score', value: selectedIelts.length },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => setFilterSheetOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all cursor-pointer
                ${chip.value > 0
                  ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
                  : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
            >
              {chip.label}
              {chip.value > 0 && (
                <span className="size-4 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center font-bold">
                  {chip.value}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="size-4" /> Filters
                </h2>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600 h-7 px-2" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <FilterSidebarContent
                  selectedCountries={selectedCountries}
                  setSelectedCountries={setSelectedCountries}
                  selectedLevels={selectedLevels}
                  setSelectedLevels={setSelectedLevels}
                  selectedSubjects={selectedSubjects}
                  setSelectedSubjects={setSelectedSubjects}
                  selectedIntakes={selectedIntakes}
                  setSelectedIntakes={setSelectedIntakes}
                  selectedTuition={selectedTuition}
                  setSelectedTuition={setSelectedTuition}
                  selectedIelts={selectedIelts}
                  setSelectedIelts={setSelectedIelts}
                  scholarshipFilter={scholarshipFilter}
                  setScholarshipFilter={setScholarshipFilter}
                  activeQuickFilters={activeQuickFilters}
                  toggleQuickFilter={toggleQuickFilter}
                />
              </ScrollArea>
            </div>
          </aside>

          {/* Main Course Grid */}
          <main className="flex-1 min-w-0">
            {/* Sort + Count Bar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="size-4" />
                      Filters
                      {hasActiveFilters && (
                        <span className="size-4 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center font-bold">
                          {selectedCountries.length + selectedLevels.length + selectedSubjects.length + selectedIntakes.length + selectedIelts.length + (scholarshipFilter ? 1 : 0) + activeQuickFilters.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
                    <SheetHeader className="p-4 pb-2 border-b sticky top-0 bg-white z-10">
                      <SheetTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><SlidersHorizontal className="size-4" /> Filters</span>
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600 h-7" onClick={clearAllFilters}>
                            Clear All
                          </Button>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                      <FilterSidebarContent
                        selectedCountries={selectedCountries}
                        setSelectedCountries={setSelectedCountries}
                        selectedLevels={selectedLevels}
                        setSelectedLevels={setSelectedLevels}
                        selectedSubjects={selectedSubjects}
                        setSelectedSubjects={setSelectedSubjects}
                        selectedIntakes={selectedIntakes}
                        setSelectedIntakes={setSelectedIntakes}
                        selectedTuition={selectedTuition}
                        setSelectedTuition={setSelectedTuition}
                        selectedIelts={selectedIelts}
                        setSelectedIelts={setSelectedIelts}
                        scholarshipFilter={scholarshipFilter}
                        setScholarshipFilter={setScholarshipFilter}
                        activeQuickFilters={activeQuickFilters}
                        toggleQuickFilter={toggleQuickFilter}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-800">{totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalResults)}</span> of {totalResults} courses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 hidden sm:inline">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger size="sm" className="w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="tuition-low">Tuition (Low-High)</SelectItem>
                    <SelectItem value="ranking">Ranking</SelectItem>
                    <SelectItem value="match">Match Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onShortlist={() => toggleShortlist(course.id)}
                  onCompare={(checked) => toggleCompare(course.id, checked)}
                  isShortlisted={shortlistedIds.has(course.id)}
                  isCompareChecked={compareIds.has(course.id)}
                />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <Search className="size-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No courses found</h3>
                <p className="text-sm text-slate-500 mb-4">Try adjusting your filters or search query</p>
                <Button variant="outline" onClick={clearAllFilters}>Clear All Filters</Button>
              </div>
            )}

            {/* Pagination */}
            {totalResults > 0 && totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={`?page=${Math.max(1, currentPage - 1)}`}
                        aria-disabled={currentPage === 1}
                        onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage((p) => p - 1); }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href={`?page=${pageNumber}`}
                          isActive={pageNumber === currentPage}
                          aria-label={`Go to page ${pageNumber}`}
                          onClick={(e) => { e.preventDefault(); setCurrentPage(pageNumber); }}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                        aria-disabled={currentPage === totalPages}
                        onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage((p) => p + 1); }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}