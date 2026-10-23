'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import {
  Search, SlidersHorizontal, X, GraduationCap, Clock, DollarSign, Award,
  Globe, ExternalLink, BookmarkPlus, GitCompare, Send, Loader2,
  ChevronLeft, ChevronRight, SearchX, MessageCircle, Phone, ShieldCheck,
  Star, MapPin, Building2, Trophy, BookOpen, ArrowLeft, ArrowRight, Filter,
  CheckCircle2, AlertCircle, HelpCircle, UserCheck, ChevronDown,
  Briefcase, CalendarDays, Languages, FileText, Target, TrendingUp,
  CircleCheck, CircleAlert, CircleHelp, Eye, Sparkles, Users, Plus,
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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ============================================================
// ALO BRAND COLORS
// ============================================================
const ALO_BLUE = '#0057B8';
const ALO_ORANGE = '#E8501A';

// ============================================================
// ELIGIBILITY CONFIG
// ============================================================
const ELIGIBILITY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ELIGIBLE: { label: 'Eligible', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CircleCheck },
  LIKELY_ELIGIBLE: { label: 'Likely Eligible', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: TrendingUp },
  CONDITIONALLY_ELIGIBLE: { label: 'Conditional', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
  PARTIALLY_MATCHED: { label: 'Partial Match', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: HelpCircle },
  NOT_CURRENTLY_ELIGIBLE: { label: 'Not Eligible', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: CircleAlert },
  INSUFFICIENT_INFO: { label: 'Info Needed', color: 'text-[var(--alo-body)]', bg: 'bg-[var(--alo-page)] border-[var(--alo-border)]', icon: HelpCircle },
  COUNSELLOR_REVIEW_REQUIRED: { label: 'Counsellor Review', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Users },
};

// ============================================================
// CONSTANTS
// ============================================================
const STUDY_LEVELS_FULL = [
  'Foundation', 'International Year One', "Bachelor's", 'Year 2 Entry',
  'Year 3 Entry', 'Top-up', "Pre-Master's", "Master's", "Master's with Placement",
  'MRes', 'MPhil', 'PhD', 'Professional Doctorate',
];

const SORT_OPTIONS = [
  { value: 'bestMatch', label: 'Best Match' },
  { value: 'lowestFee', label: 'Lowest Fee' },
  { value: 'highestFee', label: 'Highest Fee' },
  { value: 'earliestIntake', label: 'Earliest Intake' },
  { value: 'shortestDuration', label: 'Shortest Duration' },
  { value: 'universityName', label: 'University Name' },
  { value: 'courseName', label: 'Course Name' },
  { value: 'recentlyVerified', label: 'Recently Verified' },
];

const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DELIVERY_MODES = ['On-campus', 'Online', 'Blended'];
const GAP_REASONS = [
  'Employment', 'Exam Preparation', 'Health Issues', 'Personal Reasons',
  'Travel', 'Skill Development', 'Other',
];
const COUNTRIES = [
  'United Kingdom', 'USA', 'Canada', 'Australia', 'Ireland',
  'New Zealand', 'Germany', 'Netherlands', 'Sweden', 'Denmark',
  'France', 'Italy', 'Spain', 'Malaysia', 'Singapore', 'Japan',
  'South Korea', 'UAE', 'Finland', 'Norway',
];

// ============================================================
// TYPES
// ============================================================
interface CourseResult {
  id: string; title: string; slug: string; universityId: string;
  universityName: string; country: string; city: string; campus: string;
  studyLevel: string; qualification: string; subjectArea: string;
  duration: string; durationMonths: number; tuitionFee: number;
  tuitionCurrency: string; ieltsMin: number; pteMin: number;
  scholarshipAvailable: boolean; nextIntake: string; intakeMonths: string;
  officialCourseUrl: string; lastVerifiedAt: string;
  applicationDeadline?: string;
}

interface UniversityResult {
  id: string; name: string; slug: string; country: string; city: string;
  institutionType: string; rankingValue: number; rankingProvider: string;
  rankingEdition: string; rankingYear: number; featured: boolean;
  isPartner: boolean; scholarshipAvailable: boolean; keyIntakes: string;
  lastVerifiedAt: string; _count?: { courses: number };
}

interface FilterOptions {
  countries: { name: string; count: number }[];
  cities: string[];
  studyLevels: { name: string; count: number }[];
  subjectAreas: string[];
  qualifications: string[];
  intakeMonths: string[];
  intakeYears: string[];
  deliveryModes: string[];
}

interface Filters {
  keyword: string;
  countries: string[];
  cities: string[];
  studyLevels: string[];
  subjectArea: string;
  qualification: string;
  intakeMonths: string[];
  intakeYear: string;
  tuitionRange: [number, number];
  englishTestType: string;
  englishMinScore: number;
  ieltsMin: number;
  pteMin: number;
  scholarshipOnly: boolean;
  deliveryMode: string;
  eligibilityFilter: string;
  sortBy: string;
}

interface EligibilityResult {
 course: CourseResult & { university?: { name: string; country: string; city: string; rankingValue: number; rankingProvider: string; scholarshipAvailable: boolean } };
  eligibilityCategory: string;
  matchScore: number;
  requirements: Array<{
    name: string; required: string; actual: string; status: string;
    source: string; lastVerifiedAt?: string; improvementTip?: string;
  }>;
  improvements: Array<{
    gap: string; action: string; timeframe: string; alternative?: string;
  }>;
  alternativeRoutes: Array<{ courseTitle: string; universityName: string; reason: string }>;
}

interface AcademicProfile {
  qualificationType: string; gpa: string; percentage: string; grade: string;
  subject: string; institutionCountry: string; graduationYear: string; backlogs: string;
}

interface EnglishTest {
  testType: string; overallScore: string; listening: string;
  reading: string; writing: string; speaking: string;
}

interface WorkExperience { totalMonths: string; field: string; }
interface StudyGap { months: string; reason: string; }

interface StudyPreferences {
  preferredCountry: string; studyLevel: string; preferredSubject: string;
  maxBudget: string; preferredIntake: string;
}

const DEFAULT_FILTERS: Filters = {
  keyword: '', countries: [], cities: [], studyLevels: [],
  subjectArea: '', qualification: '', intakeMonths: [], intakeYear: '',
  tuitionRange: [0, 100000], englishTestType: '', englishMinScore: 0,
  ieltsMin: 0, pteMin: 0,
  scholarshipOnly: false, deliveryMode: '', eligibilityFilter: 'all', sortBy: 'bestMatch',
};

// ============================================================
// HELPERS
// ============================================================
function getLevelBadgeClasses(level: string): string {
  const l = level?.toLowerCase();
  if (l?.includes('bachelor') || l?.includes('undergraduate')) return 'bg-[var(--alo-brand)]/10 text-[var(--alo-brand)]';
  if (l?.includes('master') || l?.includes('postgraduate') || l?.includes('mres') || l?.includes('mphil')) return 'bg-[var(--alo-brand)]/20 text-[var(--alo-brand)]';
  if (l?.includes('phd') || l?.includes('doctorate')) return 'bg-[var(--alo-brand)]/30 text-[var(--alo-brand)]';
  if (l?.includes('foundation') || l?.includes('international year')) return 'bg-sky-100 text-sky-800';
  return 'bg-[var(--alo-brand)]/10 text-[var(--alo-brand)]';
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function getMatchScoreStroke(score: number): string {
  if (score >= 90) return '#059669';
  if (score >= 70) return '#0057B8';
  if (score >= 50) return '#92400E';
  return '#ef4444';
}

function getMatchScoreTextClass(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

// ============================================================
// MATCH SCORE CIRCLE
// ============================================================
function MatchScoreCircle({ score, size = 44 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={getMatchScoreStroke(score)} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <span className={`absolute text-[11px] font-bold ${getMatchScoreTextClass(score)}`}>{score}%</span>
    </div>
  );
}

// ============================================================
// ELIGIBILITY BADGE
// ============================================================
function EligibilityBadge({ category }: { category: string }) {
  const config = ELIGIBILITY_CONFIG[category] || ELIGIBILITY_CONFIG.INSUFFICIENT_INFO;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-[11px] font-semibold border ${config.bg} ${config.color} whitespace-nowrap`}>
      <Icon className="size-3" />{config.label}
    </Badge>
  );
}

// ============================================================
// SKELETONS
// ============================================================
function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden border-[var(--alo-border)]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-28" /><Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /></div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2 pt-2"><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 flex-1" /></div>
      </CardContent>
    </Card>
  );
}

function UniversityCardSkeleton() {
  return (
    <Card className="overflow-hidden border-[var(--alo-border)]">
      <CardContent className="p-5 space-y-4">
        <Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-40" />
        <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="flex gap-2 pt-2"><Skeleton className="h-9 flex-1" /><Skeleton className="h-9 flex-1" /></div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection({
  keyword, onKeywordChange, country, onCountryChange, studyLevel, onStudyLevelChange,
  intake, onIntakeChange, onSearch, onCounsellor, studyLevels,
}: {
  keyword: string; onKeywordChange: (v: string) => void;
  country: string; onCountryChange: (v: string) => void;
  studyLevel: string; onStudyLevelChange: (v: string) => void;
  intake: string; onIntakeChange: (v: string) => void;
  onSearch: () => void; onCounsellor: () => void;
  studyLevels: { name: string; count: number }[];
}) {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: ALO_BLUE }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-white/5" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Find Your Perfect Course with ALO Education
          </h1>
          <p className="mt-4 text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
            Search published course records and see each one's verification status and last-checked date.
            Get matched based on your profile or browse manually.
          </p>
        </div>
        <div className="mt-8 max-w-5xl">
          <div className="bg-white rounded-xl shadow-xl p-2 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--alo-text-muted)]" />
              <Input placeholder="Search courses, subjects, universities..." value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="pl-9 h-11 text-sm border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
            <Select value={country} onValueChange={(v) => onCountryChange(v === '__all__' ? '' : v)}>
              <SelectTrigger className="sm:w-40 h-11 text-sm border-0 shadow-none focus:ring-0">
                <Globe className="size-4 text-[var(--alo-text-muted)] mr-1" /><SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Countries</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={studyLevel} onValueChange={(v) => onStudyLevelChange(v === '__all__' ? '' : v)}>
              <SelectTrigger className="sm:w-40 h-11 text-sm border-0 shadow-none focus:ring-0">
                <GraduationCap className="size-4 text-[var(--alo-text-muted)] mr-1" /><SelectValue placeholder="Study Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Levels</SelectItem>
                {(studyLevels.length > 0 ? studyLevels : STUDY_LEVELS_FULL).map((l) => {
                  const name = typeof l === 'string' ? l : l.name;
                  return <SelectItem key={name} value={name}>{name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Select value={intake} onValueChange={(v) => onIntakeChange(v === '__all__' ? '' : v)}>
              <SelectTrigger className="sm:w-36 h-11 text-sm border-0 shadow-none focus:ring-0">
                <CalendarDays className="size-4 text-[var(--alo-text-muted)] mr-1" /><SelectValue placeholder="Intake" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any Intake</SelectItem>
                {ALL_MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="h-12 px-6 text-sm font-semibold text-white shrink-0" style={{ backgroundColor: ALO_BLUE }} onClick={onSearch}>
              <Search className="size-4 mr-2" />Search
            </Button>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <p className="text-white/60 text-xs">Only records that pass source verification are shown; counts depend on the live catalogue.</p>
            <Button className="h-12 px-4 text-xs font-semibold text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={onCounsellor}>
              <Phone className="size-3.5 mr-1.5" />Talk to a Counsellor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// THREE ENTRY OPTIONS
// ============================================================
function EntryOptions({ onSelect }: { onSelect: (option: 'profile' | 'manual' | 'counsellor') => void }) {
  const options = [
    {
      id: 'profile' as const,
      title: 'Find Courses Matched to My Profile',
      description: 'Enter your academic background, English test scores, and preferences. Our eligibility engine will match you with the best courses and show your chances.',
      icon: GraduationCap, borderColor: ALO_BLUE, bgColor: '#0057B808', iconColor: ALO_BLUE,
      tag: 'Smart Matching', tagBg: '#0057B815', tagColor: ALO_BLUE,
    },
    {
      id: 'manual' as const,
      title: 'Search All Courses Manually',
      description: 'Browse and filter our complete database of courses. Use advanced filters to narrow down by country, subject, fee, eligibility, and more.',
      icon: Search, borderColor: ALO_ORANGE, bgColor: '#E8501A08', iconColor: ALO_ORANGE,
      tag: 'Full Control', tagBg: '#E8501A15', tagColor: ALO_ORANGE,
    },
    {
      id: 'counsellor' as const,
      title: 'Let an ALO Education Counsellor Build My Shortlist',
      description: 'Share your details and our expert counsellors will prepare a personalised shortlist and guide you through every step of the application process.',
      icon: MessageCircle, borderColor: '#0284C7', bgColor: '#0284C708', iconColor: '#0284C7',
      tag: 'Expert Help', tagBg: '#0284C715', tagColor: '#0284C7',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--alo-text)]">How would you like to find courses?</h2>
        <p className="text-[var(--alo-text-muted)] mt-2 text-sm sm:text-base max-w-2xl mx-auto">
          Choose the approach that works best for you. All paths lead to the same verified course database.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <Card key={opt.id} className="cursor-pointer group hover:shadow-xl transition-all duration-300 overflow-hidden"
              style={{ borderWidth: '2px', borderColor: opt.borderColor + '30' }} onClick={() => onSelect(opt.id)}>
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: opt.bgColor }}>
                    <Icon className="size-6" style={{ color: opt.iconColor }} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: opt.tagBg, color: opt.tagColor }}>{opt.tag}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--alo-text)] text-base group-hover:text-[var(--alo-text)] transition-colors">{opt.title}</h3>
                  <p className="text-sm text-[var(--alo-text-muted)] mt-2 leading-relaxed">{opt.description}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold mt-auto pt-2" style={{ color: opt.iconColor }}>
                  {opt.id === 'profile' && 'Start Profile Check'}
                  {opt.id === 'manual' && 'Browse Courses'}
                  {opt.id === 'counsellor' && 'Request Consultation'}
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// PROFILE FORM STEPS
// ============================================================
function ProfileStep1({ profile, onChange }: { profile: AcademicProfile; onChange: (p: AcademicProfile) => void }) {
  const u = (key: keyof AcademicProfile, value: string) => onChange({ ...profile, [key]: value });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Qualification Type *</Label>
          <Select value={profile.qualificationType} onValueChange={(v) => u('qualificationType', v)}>
            <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
            <SelectContent>{['SSC', 'HSC', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Other'].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Subject / Major</Label>
          <Input placeholder="e.g. Computer Science" value={profile.subject} onChange={(e) => u('subject', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">GPA (out of 4.0)</Label>
          <Input type="number" step="0.01" min="0" max="4" placeholder="e.g. 3.5" value={profile.gpa} onChange={(e) => u('gpa', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Percentage (%)</Label>
          <Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 85" value={profile.percentage} onChange={(e) => u('percentage', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Grade / Division</Label>
          <Input placeholder="e.g. First Class" value={profile.grade} onChange={(e) => u('grade', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Institution Country</Label>
          <Select value={profile.institutionCountry} onValueChange={(v) => u('institutionCountry', v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Other / N/A</SelectItem>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              <SelectItem value="Bangladesh">Bangladesh</SelectItem>
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="Pakistan">Pakistan</SelectItem>
              <SelectItem value="Nepal">Nepal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Graduation Year</Label>
          <Select value={profile.graduationYear} onValueChange={(v) => u('graduationYear', v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Not yet graduated</SelectItem>
              {Array.from({ length: 15 }, (_, i) => String(2025 - i)).map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Backlogs (if any)</Label>
          <Input type="number" min="0" max="50" placeholder="0" value={profile.backlogs} onChange={(e) => u('backlogs', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ProfileStep2({ tests, onChange, onAdd, onRemove }: {
  tests: EnglishTest[]; onChange: (i: number, t: EnglishTest) => void; onAdd: () => void; onRemove: (i: number) => void;
}) {
  const upd = (i: number, key: keyof EnglishTest, value: string) => onChange(i, { ...tests[i], [key]: value });
  return (
    <div className="space-y-5">
      {tests.length === 0 && (
        <div className="text-center py-8 bg-[var(--alo-page)] rounded-lg">
          <Languages className="size-8 text-[var(--alo-placeholder)] mx-auto mb-2" />
          <p className="text-sm text-[var(--alo-text-muted)]">No English test added yet.</p>
          <p className="text-xs text-[var(--alo-text-muted)] mt-1">Click below if you have taken an English proficiency test.</p>
        </div>
      )}
      {tests.map((test, i) => (
        <Card key={i} className="p-4 border-[var(--alo-border)]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2"><Languages className="size-4" style={{ color: ALO_BLUE }} /><span className="font-medium text-sm">Test #{i + 1}</span></div>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => onRemove(i)}><X className="size-3 mr-1" />Remove</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Test Type *</Label>
              <Select value={test.testType} onValueChange={(v) => upd(i, 'testType', v)}>
                <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                <SelectContent>{['IELTS', 'PTE', 'TOEFL', 'Duolingo'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Overall Score *</Label><Input placeholder="e.g. 7.0" value={test.overallScore} onChange={(e) => upd(i, 'overallScore', e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Listening</Label><Input placeholder="e.g. 7.5" value={test.listening} onChange={(e) => upd(i, 'listening', e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Reading</Label><Input placeholder="e.g. 7.0" value={test.reading} onChange={(e) => upd(i, 'reading', e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Writing</Label><Input placeholder="e.g. 6.5" value={test.writing} onChange={(e) => upd(i, 'writing', e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Speaking</Label><Input placeholder="e.g. 7.0" value={test.speaking} onChange={(e) => upd(i, 'speaking', e.target.value)} /></div>
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" className="text-xs" onClick={onAdd}><Plus className="size-3.5 mr-1" />Add English Test</Button>
      <p className="text-xs text-[var(--alo-text-muted)]">If you haven't taken any English test yet, you can leave this section empty.</p>
    </div>
  );
}

function ProfileStep3({ work, gap, onWorkChange, onGapChange }: {
  work: WorkExperience; gap: StudyGap; onWorkChange: (w: WorkExperience) => void; onGapChange: (g: StudyGap) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Total Work Experience (months)</Label>
          <Input type="number" min="0" max="600" placeholder="e.g. 24" value={work.totalMonths} onChange={(e) => onWorkChange({ ...work, totalMonths: e.target.value })} />
          <p className="text-xs text-[var(--alo-text-muted)]">0 if no work experience</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Work Field</Label>
          <Input placeholder="e.g. IT, Finance, Engineering" value={work.field} onChange={(e) => onWorkChange({ ...work, field: e.target.value })} />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Study Gap (months)</Label>
          <Input type="number" min="0" max="300" placeholder="e.g. 12" value={gap.months} onChange={(e) => onGapChange({ ...gap, months: e.target.value })} />
          <p className="text-xs text-[var(--alo-text-muted)]">0 if no gap</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Gap Reason</Label>
          <Select value={gap.reason} onValueChange={(v) => onGapChange({ ...gap, reason: v === '__all__' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">No gap / Not applicable</SelectItem>
              {GAP_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function ProfileStep4({ prefs, onChange }: { prefs: StudyPreferences; onChange: (p: StudyPreferences) => void }) {
  const u = (key: keyof StudyPreferences, value: string) => onChange({ ...prefs, [key]: value });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Preferred Country *</Label>
          <Select value={prefs.preferredCountry} onValueChange={(v) => u('preferredCountry', v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent><SelectItem value="__all__">Any Country</SelectItem>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Study Level *</Label>
          <Select value={prefs.studyLevel} onValueChange={(v) => u('studyLevel', v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent><SelectItem value="__all__">Any Level</SelectItem>{STUDY_LEVELS_FULL.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Preferred Subject</Label>
          <Input placeholder="e.g. Business, Computing, Engineering" value={prefs.preferredSubject} onChange={(e) => u('preferredSubject', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Preferred Intake</Label>
          <Select value={prefs.preferredIntake} onValueChange={(v) => u('preferredIntake', v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select intake" /></SelectTrigger>
            <SelectContent><SelectItem value="__all__">Any Intake</SelectItem>{ALL_MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Maximum Budget (BDT/year)</Label>
        <Input type="number" min="0" placeholder="e.g. 2000000" value={prefs.maxBudget} onChange={(e) => u('maxBudget', e.target.value)} />
        <p className="text-xs text-[var(--alo-text-muted)]">Leave empty if no budget constraint</p>
      </div>
    </div>
  );
}

// ============================================================
// FILTER SIDEBAR (enhanced with eligibility filter)
// ============================================================
function FilterSidebar({
  filters, filterOptions, onFiltersChange, onReset, showEligibilityFilter,
}: {
  filters: Filters; filterOptions: FilterOptions; onFiltersChange: (f: Filters) => void; onReset: () => void; showEligibilityFilter?: boolean;
}) {
  const toggleArrayFilter = (key: 'countries' | 'cities' | 'studyLevels' | 'intakeMonths', value: string) => {
    const current = filters[key];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const activeCount = filters.countries.length + filters.cities.length + filters.studyLevels.length
    + filters.intakeMonths.length + (filters.subjectArea ? 1 : 0) + (filters.qualification ? 1 : 0)
    + (filters.intakeYear ? 1 : 0) + (filters.tuitionRange[0] > 0 || filters.tuitionRange[1] < 100000 ? 1 : 0)
    + (filters.englishMinScore > 0 ? 1 : 0) + (filters.scholarshipOnly ? 1 : 0) + (filters.deliveryMode ? 1 : 0)
    + (filters.eligibilityFilter !== 'all' ? 1 : 0);

  const countries = filterOptions.countries?.length > 0 ? filterOptions.countries : [];
  const studyLevels = filterOptions.studyLevels?.length > 0 ? filterOptions.studyLevels : [];
  const cities = filterOptions.cities?.length > 0 ? filterOptions.cities : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-[var(--alo-text)] flex items-center gap-2"><Filter className="size-4" />Filters</h3>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-[var(--alo-text-muted)] h-7">Clear all ({activeCount})</Button>
        )}
      </div>
      <Separator />

      {/* Keyword */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Keyword</h4>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--alo-text-muted)]" />
          <Input placeholder="Search..." value={filters.keyword} onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })} className="pl-8 h-9 text-sm" />
          {filters.keyword && <button onClick={() => onFiltersChange({ ...filters, keyword: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"><X className="size-3" /></button>}
        </div>
      </div>
      <Separator />

      {/* Eligibility Filter */}
      {showEligibilityFilter && (
        <>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--alo-body)]">Eligibility</h4>
            <Select value={filters.eligibilityFilter} onValueChange={(v) => onFiltersChange({ ...filters, eligibilityFilter: v })}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="ELIGIBLE">Eligible</SelectItem>
                <SelectItem value="LIKELY_ELIGIBLE">Likely Eligible</SelectItem>
                <SelectItem value="CONDITIONALLY_ELIGIBLE">Conditional</SelectItem>
                <SelectItem value="NOT_CURRENTLY_ELIGIBLE">Not Eligible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
        </>
      )}

      {/* Country */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Country</h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {countries.length > 0 ? countries.map((c) => (
            <label key={c.name} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox checked={filters.countries.includes(c.name)} onCheckedChange={() => toggleArrayFilter('countries', c.name)} className="data-[state=checked]:bg-[var(--alo-brand)] data-[state=checked]:border-[var(--alo-brand)]" />
              <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)] flex-1">{c.name}</span>
              <span className="text-xs text-[var(--alo-text-muted)]">{c.count}</span>
            </label>
          )) : <p className="text-xs text-[var(--alo-text-muted)]">Loading countries...</p>}
        </div>
      </div>
      <Separator />

      {/* City */}
      {cities.length > 0 && (<>
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[var(--alo-body)]">City</h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {cities.map((city) => (
              <label key={city} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox checked={filters.cities.includes(city)} onCheckedChange={() => toggleArrayFilter('cities', city)} className="data-[state=checked]:bg-[var(--alo-brand)] data-[state=checked]:border-[var(--alo-brand)]" />
                <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)]">{city}</span>
              </label>
            ))}
          </div>
        </div>
        <Separator />
      </>)}

      {/* Study Level (checkboxes) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Study Level</h4>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {studyLevels.length > 0 ? studyLevels.map((l) => (
            <label key={l.name} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox checked={filters.studyLevels.includes(l.name)} onCheckedChange={() => toggleArrayFilter('studyLevels', l.name)} className="data-[state=checked]:bg-[var(--alo-brand)] data-[state=checked]:border-[var(--alo-brand)]" />
              <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)] flex-1">{l.name}</span>
              <span className="text-xs text-[var(--alo-text-muted)]">{l.count}</span>
            </label>
          )) : <p className="text-xs text-[var(--alo-text-muted)]">Loading levels...</p>}
        </div>
      </div>
      <Separator />

      {/* Qualification */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Qualification</h4>
        <Select value={filters.qualification} onValueChange={(v) => onFiltersChange({ ...filters, qualification: v === '__all__' ? '' : v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Any qualification" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any qualification</SelectItem>
            {(filterOptions.qualifications || []).map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Separator />

      {/* Subject Area */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Subject Area</h4>
        <Select value={filters.subjectArea} onValueChange={(v) => onFiltersChange({ ...filters, subjectArea: v === '__all__' ? '' : v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All subjects</SelectItem>
            {(filterOptions.subjectAreas || []).map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Separator />

      {/* Intake Month (checkboxes) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Intake Month</h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {ALL_MONTHS.map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox checked={filters.intakeMonths.includes(m)} onCheckedChange={() => toggleArrayFilter('intakeMonths', m)} className="data-[state=checked]:bg-[var(--alo-brand)] data-[state=checked]:border-[var(--alo-brand)]" />
              <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)]">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Intake Year */}
      <div className="space-y-2 mt-3">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Intake Year</h4>
        <Select value={filters.intakeYear} onValueChange={(v) => onFiltersChange({ ...filters, intakeYear: v === '__all__' ? '' : v })}>
          <SelectTrigger><SelectValue placeholder="Any year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any year</SelectItem>
            {['2025', '2026', '2027', '2028'].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Separator />

      {/* Tuition Fee Range */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Tuition Fee (GBP/yr)</h4>
        <div className="px-1">
          <Slider min={0} max={100000} step={1000} value={filters.tuitionRange} onValueChange={(v) => onFiltersChange({ ...filters, tuitionRange: v as [number, number] })} className="[&_[data-slot=slider-range]]:bg-[var(--alo-brand)] [&_[data-slot=slider-thumb]]:border-[var(--alo-brand)]" />
          <div className="flex justify-between mt-1.5 text-xs text-[var(--alo-text-muted)]">
            <span>£{filters.tuitionRange[0].toLocaleString()}</span>
            <span>£{filters.tuitionRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>
      <Separator />

      {/* English Test */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">English Test</h4>
        <Select value={filters.englishTestType} onValueChange={(v) => onFiltersChange({ ...filters, englishTestType: v === '__all__' ? '' : v })}>
          <SelectTrigger><SelectValue placeholder="Any test" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any test</SelectItem>
            {['IELTS', 'PTE', 'TOEFL', 'Duolingo'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="px-1 mt-2">
          <Label className="text-xs text-[var(--alo-text-muted)]">Min Score: {filters.englishMinScore > 0 ? filters.englishMinScore : 'Any'}</Label>
          <Slider min={0} max={9} step={0.5} value={[filters.englishMinScore]} onValueChange={(v) => onFiltersChange({ ...filters, englishMinScore: v[0] })} className="[&_[data-slot=slider-range]]:bg-[var(--alo-brand)] [&_[data-slot=slider-thumb]]:border-[var(--alo-brand)]" />
        </div>
      </div>
      <Separator />

      {/* Scholarship */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Scholarship Only</h4>
        <Switch checked={filters.scholarshipOnly} onCheckedChange={(v) => onFiltersChange({ ...filters, scholarshipOnly: v })} className="data-[state=checked]:bg-[var(--alo-brand)]" />
      </div>
      <Separator />

      {/* Delivery Mode */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[var(--alo-body)]">Delivery Mode</h4>
        {DELIVERY_MODES.map((mode) => (
          <label key={mode} className="flex items-center gap-2 cursor-pointer group">
            <Checkbox checked={filters.deliveryMode === mode} onCheckedChange={(checked) => onFiltersChange({ ...filters, deliveryMode: checked ? mode : '' })} className="data-[state=checked]:bg-[var(--alo-brand)] data-[state=checked]:border-[var(--alo-brand)]" />
            <span className="text-sm text-[var(--alo-body)] group-hover:text-[var(--alo-text)]">{mode}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ENHANCED COURSE CARD
// ============================================================
function EnhancedCourseCard({
  course, onCompare, onSave, eligibilityCategory, matchScore,
  requirements, improvements, onCheckEligibility,
}: {
  course: CourseResult; onCompare: (c: CourseResult) => void; onSave: (c: CourseResult) => void;
  eligibilityCategory?: string; matchScore?: number;
  requirements?: Array<{ name: string; required: string; actual: string; status: string; improvementTip?: string }>;
  improvements?: Array<{ gap: string; action: string; timeframe: string; alternative?: string }>;
  onCheckEligibility?: (c: CourseResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-[var(--alo-border)] group">
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Top: University + Eligibility Badge + Match Score */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: ALO_BLUE }}>{course.universityName}</p>
            <h3 className="font-semibold text-[var(--alo-text)] leading-snug line-clamp-2 text-sm mt-0.5 min-h-[2.5rem]">{course.title}</h3>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {matchScore !== undefined && <MatchScoreCircle score={matchScore} />}
            {eligibilityCategory && <EligibilityBadge category={eligibilityCategory} />}
          </div>
        </div>

        {/* Country + City */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)]">
          <MapPin className="size-3" /><span>{course.city}{course.city && course.country ? ', ' : ''}{course.country}</span>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-[var(--alo-body)]">
          <div className="flex items-center gap-1.5"><Clock className="size-3.5 text-[var(--alo-text-muted)]" /><span>{course.duration}</span></div>
          <div className="flex items-center gap-1.5"><DollarSign className="size-3.5 text-[var(--alo-text-muted)]" /><span>£{course.tuitionFee?.toLocaleString()}/yr</span></div>
          {course.qualification && <div className="flex items-center gap-1.5"><FileText className="size-3.5 text-[var(--alo-text-muted)]" /><span className="truncate">{course.qualification}</span></div>}
          {course.studyLevel && <Badge variant="secondary" className={`text-[11px] ${getLevelBadgeClasses(course.studyLevel)}`}>{course.studyLevel}</Badge>}
          {course.ieltsMin > 0 && <div className="flex items-center gap-1.5"><GraduationCap className="size-3.5 text-[var(--alo-text-muted)]" /><span>IELTS {course.ieltsMin}</span></div>}
          {course.pteMin > 0 && <div className="flex items-center gap-1.5"><GraduationCap className="size-3.5 text-[var(--alo-text-muted)]" /><span>PTE {course.pteMin}</span></div>}
          {course.nextIntake && <div className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-[var(--alo-text-muted)]" /><span>Intake: {course.nextIntake}</span></div>}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {course.scholarshipAvailable && (
            <Badge className="text-xs font-medium" style={{ backgroundColor: ALO_ORANGE, color: '#fff' }}><Award className="size-3 mr-1" />Scholarship</Badge>
          )}
          {course.lastVerifiedAt && (
            <Badge variant="outline" className="text-[11px] text-[var(--alo-text-muted)] gap-1"><ShieldCheck className="size-3" />Verified {formatDate(course.lastVerifiedAt)}</Badge>
          )}
        </div>

        {/* Why Matched / How to Qualify (expandable for eligibility results) */}
        {requirements && requirements.length > 0 && (
          <div className="border-t border-[var(--alo-border)] pt-2">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs font-medium" style={{ color: ALO_BLUE }}>
              {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              {improvements && improvements.length > 0 ? 'How to Qualify' : 'Why Matched'}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2">
                {requirements.map((req, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${req.status === 'MET' ? 'bg-emerald-50' : req.status === 'CONDITION' ? 'bg-amber-50' : req.status === 'NOT_MET' ? 'bg-red-50' : 'bg-[var(--alo-page)]'}`}>
                    {req.status === 'MET' ? <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      : req.status === 'NOT_MET' ? <CircleAlert className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                      : <HelpCircle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--alo-body)]">{req.name}</p>
                      <p className="text-[var(--alo-text-muted)]">Required: {req.required} | Your: {req.actual || 'Not provided'}</p>
                      {req.improvementTip && <p className="text-[var(--alo-text-muted)] mt-0.5">Tip: {req.improvementTip}</p>}
                    </div>
                  </div>
                ))}
                {improvements && improvements.length > 0 && (
                  <div className="mt-2 p-2 bg-amber-50 rounded">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Improvement Plan</p>
                    {improvements.map((imp, i) => (
                      <div key={i} className="text-xs text-[var(--alo-body)] mb-1">
                        <span className="font-medium">{imp.gap}</span> — {imp.action} ({imp.timeframe})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onCompare(course)}><GitCompare className="size-3 mr-1" />Compare</Button>
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onSave(course)}><BookmarkPlus className="size-3 mr-1" />Save</Button>
            {onCheckEligibility && !eligibilityCategory && (
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" style={{ borderColor: ALO_BLUE, color: ALO_BLUE }} onClick={() => onCheckEligibility(course)}><UserCheck className="size-3 mr-1" />Check</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-12 text-xs font-semibold text-white" style={{ backgroundColor: ALO_BLUE }} onClick={() => toast.success(`Application started for "${course.title}" via ALO Education`)}>Apply with ALO</Button>
            {course.officialCourseUrl ? (
              <Button variant="outline" size="sm" className="flex-1 h-12 text-xs" asChild>
                <a href={course.officialCourseUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3 mr-1" />View Details</a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="flex-1 h-12 text-xs" disabled title="No official course URL on record for this university yet">View Details</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// UNIVERSITY CARD
// ============================================================
function UniversityCard({ university, onViewCourses, onCompare }: {
  university: UniversityResult; onViewCourses: (u: UniversityResult) => void; onCompare: (u: UniversityResult) => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-[var(--alo-border)]">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--alo-text)] text-base leading-snug truncate">{university.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)] mt-1"><MapPin className="size-3" /><span>{university.city}{university.city && university.country ? ', ' : ''}{university.country}</span></div>
          </div>
          {university.featured && <Badge className="shrink-0 text-xs font-medium" style={{ backgroundColor: ALO_ORANGE, color: '#fff' }}><Star className="size-3 mr-0.5" />Featured</Badge>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {university.institutionType && <Badge variant="secondary" className="text-xs bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"><Building2 className="size-3 mr-1" />{university.institutionType}</Badge>}
          {university.scholarshipAvailable && <Badge className="text-xs" style={{ backgroundColor: ALO_ORANGE, color: '#fff' }}><Award className="size-3 mr-1" />Scholarship</Badge>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {university.rankingValue > 0 && (
            <div className="bg-[var(--alo-page)] rounded-lg p-2 text-center">
              <p className="text-lg font-bold" style={{ color: ALO_BLUE }}>#{university.rankingValue}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] leading-tight">{university.rankingProvider}{university.rankingYear ? ` ${university.rankingYear}` : ''}</p>
            </div>
          )}
          <div className="bg-[var(--alo-page)] rounded-lg p-2 text-center">
            <p className="text-lg font-bold" style={{ color: ALO_BLUE }}>{university._count?.courses ?? '—'}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)] leading-tight">Courses</p>
          </div>
          <div className="bg-[var(--alo-page)] rounded-lg p-2 text-center">
            <p className="text-lg font-bold" style={{ color: ALO_BLUE }}>{university.keyIntakes ? university.keyIntakes.split(',').length : '—'}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)] leading-tight">Intakes</p>
          </div>
        </div>
        {university.lastVerifiedAt && <div className="flex items-center gap-1 text-xs text-[var(--alo-text-muted)]"><ShieldCheck className="size-3" /><span>Verified {formatDate(university.lastVerifiedAt)}</span></div>}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 h-12 text-xs font-semibold text-white" style={{ backgroundColor: ALO_BLUE }} onClick={() => onViewCourses(university)}><BookOpen className="size-3 mr-1" />View Courses</Button>
          <Button variant="outline" size="sm" className="h-12 text-xs" onClick={() => onCompare(university)}><GitCompare className="size-3 mr-1" />Compare</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// COUNSELLOR FORM
// ============================================================
function CounsellorForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', preferredCountry: '', preferredCourse: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const u = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Please enter your name.'); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Please enter a valid email.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/website/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); toast.success('Your consultation request has been submitted!'); }
      else { toast.error(data.error || 'Failed to submit. Please try again.'); }
    } catch { toast.error('Failed to submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="size-10 text-emerald-600" /></div>
        <h2 className="text-2xl font-bold text-[var(--alo-text)]">Request Submitted!</h2>
        <p className="mt-3 text-[var(--alo-text-muted)] max-w-md mx-auto">Our counsellor will contact you within 24 hours. Thank you for choosing ALO Education.</p>
        <Button className="mt-6 text-white" style={{ backgroundColor: ALO_BLUE }} onClick={onBack}>Back to Course Finder</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Course Finder
      </button>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl" style={{ color: ALO_BLUE }}>Request a Counsellor Consultation</CardTitle>
          <p className="text-sm text-[var(--alo-text-muted)]">Fill in your details and an ALO Education counsellor will build a personalised shortlist for you.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-sm font-medium">Full Name *</Label><Input placeholder="Your full name" value={form.name} onChange={(e) => u('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-sm font-medium">Email</Label><Input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => u('email', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-sm font-medium">Phone / WhatsApp</Label><Input placeholder="+880 1XXX XXXXXX" value={form.phone} onChange={(e) => u('phone', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Preferred Country</Label>
              <Select value={form.preferredCountry} onValueChange={(v) => u('preferredCountry', v === '__all__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Any country" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__">Any country</SelectItem>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-sm font-medium">Preferred Course / Subject</Label><Input placeholder="e.g. MSc Data Science, MBA" value={form.preferredCourse} onChange={(e) => u('preferredCourse', e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-sm font-medium">Message (optional)</Label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Tell us about your goals..." value={form.message} onChange={(e) => u('message', e.target.value)} />
          </div>
          <Button className="w-full text-white font-semibold" style={{ backgroundColor: ALO_ORANGE }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting...</> : <><Send className="size-4 mr-2" />Submit Request</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// ELIGIBILITY SUMMARY BAR
// ============================================================
function EligibilitySummaryBar({ summary }: { summary: Record<string, number> }) {
  const items = [
    { key: 'eligible', label: 'Eligible', color: 'bg-emerald-500', count: summary.eligible || 0 },
    { key: 'likelyEligible', label: 'Likely', color: 'bg-blue-500', count: summary.likelyEligible || 0 },
    { key: 'conditionallyEligible', label: 'Conditional', color: 'bg-amber-500', count: summary.conditionallyEligible || 0 },
    { key: 'partiallyMatched', label: 'Partial', color: 'bg-orange-500', count: summary.partiallyMatched || 0 },
    { key: 'notCurrentlyEligible', label: 'Not Eligible', color: 'bg-red-500', count: summary.notCurrentlyEligible || 0 },
    { key: 'insufficientInfo', label: 'Info Needed', color: 'bg-slate-400', count: summary.insufficientInfo || 0 },
    { key: 'counsellorReviewRequired', label: 'Counsellor', color: 'bg-purple-500', count: summary.counsellorReviewRequired || 0 },
  ];
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.filter((i) => i.count > 0).map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--alo-page)] border border-[var(--alo-border)]">
            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            <span className="text-xs font-medium text-[var(--alo-body)]">{item.label}</span>
            <span className="text-xs font-bold text-[var(--alo-text)]">{item.count}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        {total > 0 && items.filter((i) => i.count > 0).map((item) => (
          <div key={item.key} className={`h-2 rounded-full ${item.color}`} style={{ width: `${(item.count / total) * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function CourseFinderEnhanced() {
  // --- View state: landing / profile / manual / counsellor / results ---
  const [view, setView] = useState<'landing' | 'profile' | 'manual' | 'counsellor' | 'results'>('landing');

  // --- Hero quick search state ---
  const [heroKeyword, setHeroKeyword] = useState('');
  const [heroCountry, setHeroCountry] = useState('');
  const [heroStudyLevel, setHeroStudyLevel] = useState('');
  const [heroIntake, setHeroIntake] = useState('');

  // --- Manual search state ---
  const [activeTab, setActiveTab] = useState('courses');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [universities, setUniversities] = useState<UniversityResult[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ countries: [], cities: [], studyLevels: [], subjectAreas: [], qualifications: [], intakeMonths: [], intakeYears: [], deliveryModes: [] });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const pageSize = 12;

  // --- Profile form state ---
  const [profileStep, setProfileStep] = useState(1);
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile>({ qualificationType: '', gpa: '', percentage: '', grade: '', subject: '', institutionCountry: '', graduationYear: '', backlogs: '' });
  const [englishTests, setEnglishTests] = useState<EnglishTest[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience>({ totalMonths: '', field: '' });
  const [studyGap, setStudyGap] = useState<StudyGap>({ months: '', reason: '' });
  const [studyPreferences, setStudyPreferences] = useState<StudyPreferences>({ preferredCountry: '', studyLevel: '', preferredSubject: '', maxBudget: '', preferredIntake: '' });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // --- Eligibility results state ---
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [eligibilitySummary, setEligibilitySummary] = useState<Record<string, number>>({});
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityFilter, setEligibilityFilter] = useState('all');

  // ============================================================
  // MANUAL SEARCH FETCH
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tab', activeTab);
      if (filters.keyword) params.set('search', filters.keyword);
      if (filters.countries.length > 0) params.set('countries', filters.countries.join(','));
      if (filters.cities.length > 0) params.set('cities', filters.cities.join(','));
      if (filters.studyLevels.length > 0) params.set('studyLevels', filters.studyLevels.join(','));
      if (filters.subjectArea) params.set('subjectArea', filters.subjectArea);
      if (filters.qualification) params.set('qualification', filters.qualification);
      if (filters.intakeMonths.length > 0) params.set('intakeMonth', filters.intakeMonths.join(','));
      if (filters.intakeYear) params.set('intakeYear', filters.intakeYear);
      if (filters.tuitionRange[0] > 0) params.set('tuitionMin', String(filters.tuitionRange[0]));
      if (filters.tuitionRange[1] < 100000) params.set('tuitionMax', String(filters.tuitionRange[1]));
      if (filters.ieltsMin > 0) params.set('ieltsMin', String(filters.ieltsMin));
      if (filters.pteMin > 0) params.set('pteMin', String(filters.pteMin));
      if (filters.scholarshipOnly) params.set('scholarship', 'true');
      if (filters.deliveryMode) params.set('deliveryMode', filters.deliveryMode);
      const sortMap: Record<string, string> = { bestMatch: 'relevance', lowestFee: 'fee_low', highestFee: 'fee_high', earliestIntake: 'intake_earliest', shortestDuration: 'duration_short', universityName: 'university_name', courseName: 'course_name', recentlyVerified: 'recently_verified' };
      params.set('sort', sortMap[filters.sortBy] || 'relevance');
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      const res = await fetch(`/api/course-finder?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (activeTab === 'courses') setCourses(data.courses || data.results || []);
      else if (activeTab === 'universities') setUniversities(data.universities || data.results || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || data.totalResults || 0);

      // course_search / university_search. The search facets are reported but
      // the raw keyword is NOT: a visitor can type anything into a search box,
      // including their own name, and analytics must never receive personal
      // data. The facets below already answer "what are people searching for".
      trackAnalyticsEvent(
        activeTab === 'universities' ? 'university_search' : 'course_search',
        {
          destination: filters.countries[0] || undefined,
          study_level: filters.studyLevels[0] || undefined,
          intake: filters.intakeYear || undefined,
          items_count: Number(data.total || data.totalResults || 0),
          search_term_category: filters.subjectArea || undefined,
        },
        { source: 'course-finder' },
      );

      if (data.filters) {
        setFilterOptions((prev) => ({
          ...prev,
          countries: (data.filters.countries || []).map((c: string) => ({ name: c, count: 0 })),
          studyLevels: (data.filters.studyLevels || []).map((s: string) => ({ name: s, count: 0 })),
          subjectAreas: data.filters.subjectAreas || [],
        }));
      }
    } catch {
      if (activeTab === 'courses') setCourses([]);
      else setUniversities([]);
      setTotalPages(1); setTotalResults(0);
      toast.error('Failed to load data. Please try again.');
    } finally { setLoading(false); }
  }, [filters, currentPage, activeTab]);

  useEffect(() => { setCurrentPage(1); }, [filters, activeTab]);
  useEffect(() => { if (view === 'manual') fetchData(); }, [fetchData, view]);

  // ============================================================
  // PROFILE SUBMIT
  // ============================================================
  const handleProfileSubmit = async () => {
    if (!academicProfile.qualificationType) { toast.error('Please select your qualification type.'); return; }
    if (!studyPreferences.preferredCountry && !studyPreferences.studyLevel) { toast.error('Please select at least a preferred country or study level.'); return; }
    setProfileSubmitting(true);
    setView('results');
    setEligibilityLoading(true);
    try {
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('alo-session') || `anon-${Date.now()}` : undefined;
      const res = await fetch('/api/course-finder/eligibility-engine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, academicProfile, englishTests,
          workExperience, studyGap, studyPreferences,
        }),
      });
      const data = await res.json();
      if (data.results) {
        setEligibilityResults(data.results);
        setEligibilitySummary(data.summary || {});
      } else {
        toast.error(data.error || 'Failed to evaluate eligibility.');
        setView('profile');
      }
    } catch { toast.error('Failed to evaluate eligibility. Please try again.'); setView('profile'); }
    finally { setProfileSubmitting(false); setEligibilityLoading(false); }
  };

  // ============================================================
  // FILTERED ELIGIBILITY RESULTS
  // ============================================================
  const filteredEligibilityResults = useMemo(() => {
    if (eligibilityFilter === 'all') return eligibilityResults;
    return eligibilityResults.filter((r) => r.eligibilityCategory === eligibilityFilter);
  }, [eligibilityResults, eligibilityFilter]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleResetFilters = () => { setFilters(DEFAULT_FILTERS); setCurrentPage(1); };
  const handleCompareCourse = (course: CourseResult) => toast.success(`"${course.title}" added to comparison`);
  const handleSaveCourse = async (course: CourseResult) => {
 try {
    const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('alo-session') || `anon-${Date.now()}` : undefined;
    await fetch('/api/course-finder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id, sessionId }) });
    toast.success(`"${course.title}" saved to your list`);
  } catch { toast.error('Failed to save course.'); }
  };
  const handleViewCourses = (uni: UniversityResult) => { toast.success(`Viewing courses at ${uni.name}`); };
  const handleCompareUniversity = (uni: UniversityResult) => toast.success(`"${uni.name}" added to comparison`);

  const handleHeroSearch = () => {
    setFilters((p) => ({ ...DEFAULT_FILTERS, keyword: heroKeyword, countries: heroCountry ? [heroCountry] : [], studyLevels: heroStudyLevel ? [heroStudyLevel] : [], intakeMonths: heroIntake ? [heroIntake] : [] }));
    setView('manual');
  };

  const handleEntrySelect = (option: 'profile' | 'manual' | 'counsellor') => {
    if (option === 'manual') {
      setFilters((p) => ({ ...p, keyword: heroKeyword, countries: heroCountry ? [heroCountry] : [], studyLevels: heroStudyLevel ? [heroStudyLevel] : [], intakeMonths: heroIntake ? [heroIntake] : [] }));
    }
    setView(option);
  };

  // --- Filter content ref ---
  const filterContent = useMemo(() => (
    <FilterSidebar filters={filters} filterOptions={filterOptions} onFiltersChange={setFilters} onReset={handleResetFilters} showEligibilityFilter={view === 'results'} />
  ), [filters, filterOptions, view]);

  // ============================================================
  // PAGINATION
  // ============================================================
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8">
        <p className="text-xs text-[var(--alo-text-muted)]">Showing page {currentPage} of {totalPages} ({totalResults} results)</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-8 w-8 p-0"><ChevronLeft className="size-4" /></Button>
          {pages.map((page, idx) => typeof page === 'string'
            ? <span key={`ellipsis-${idx}`} className="px-2 text-sm text-[var(--alo-text-muted)]">...</span>
            : <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className={currentPage === page ? 'h-8 w-8 p-0 text-white' : 'h-8 w-8 p-0'} style={currentPage === page ? { backgroundColor: ALO_BLUE } : undefined}>{page}</Button>
          )}
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 w-8 p-0"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    );
  };

  // ============================================================
  // TABS
  // ============================================================
  const TAB_CONFIG = [
    { value: 'courses', label: 'Courses', icon: BookOpen },
    { value: 'universities', label: 'Universities', icon: Building2 },
    { value: 'scholarships', label: 'Scholarships', icon: Award },
    { value: 'compare', label: 'Compare', icon: GitCompare },
  ];

  const renderTabs = () => (
    <div className="border-b border-[var(--alo-border)] bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-0">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`relative inline-flex items-center gap-2 px-4 sm:px-6 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-white' : 'text-[var(--alo-body)] hover:text-[var(--alo-text)]'}`}>
                <Icon className="size-4" />{tab.label}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: ALO_BLUE }} />}
                {isActive && <span className="absolute inset-0 -z-10" style={{ backgroundColor: ALO_BLUE }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: LANDING VIEW
  // ============================================================
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white">
        <HeroSection keyword={heroKeyword} onKeywordChange={setHeroKeyword} country={heroCountry} onCountryChange={setHeroCountry} studyLevel={heroStudyLevel} onStudyLevelChange={setHeroStudyLevel} intake={heroIntake} onIntakeChange={setHeroIntake} onSearch={handleHeroSearch} onCounsellor={() => setView('counsellor')} studyLevels={filterOptions.studyLevels} />
        <EntryOptions onSelect={handleEntrySelect} />
        <section style={{ backgroundColor: '#F0F6FF' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--alo-text)]">Ready to Study Abroad?</h2>
            <p className="mt-3 text-[var(--alo-body)] text-sm sm:text-base max-w-xl mx-auto">Book a Free Consultation with ALO Education. Our expert counsellors will guide you through every step.</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="px-8 text-sm font-semibold text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setView('counsellor')}>Book a Free Consultation<ArrowRight className="size-4 ml-2" /></Button>
              <Button variant="outline" size="lg" className="px-8 text-sm font-medium" style={{ borderColor: ALO_BLUE, color: ALO_BLUE }} asChild>
                <a href="https://wa.me/8801805020100" target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4 mr-2" />Chat on WhatsApp</a>
              </Button>
            </div>
          </div>
        </section>
        <footer className="border-t border-[var(--alo-border)] bg-[var(--alo-page)] py-6 text-[var(--alo-text-muted)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs">
            © {new Date().getFullYear()} ALO Education. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================
  // RENDER: COUNSELLOR VIEW
  // ============================================================
  if (view === 'counsellor') {
    return (
      <div className="min-h-screen bg-white">
        <HeroSection keyword={heroKeyword} onKeywordChange={setHeroKeyword} country={heroCountry} onCountryChange={setHeroCountry} studyLevel={heroStudyLevel} onStudyLevelChange={setHeroStudyLevel} intake={heroIntake} onIntakeChange={setHeroIntake} onSearch={handleHeroSearch} onCounsellor={() => {}} studyLevels={filterOptions.studyLevels} />
        <CounsellorForm onBack={() => setView('landing')} />
      </div>
    );
  }

  // ============================================================
  // RENDER: PROFILE FORM VIEW
  // ============================================================
  if (view === 'profile') {
    const steps = [
      { title: 'Academic Profile', icon: GraduationCap },
      { title: 'English Test', icon: Languages },
      { title: 'Work & Gap', icon: Briefcase },
      { title: 'Study Preferences', icon: Target },
    ];
    return (
      <div className="min-h-screen bg-white">
        <HeroSection keyword={heroKeyword} onKeywordChange={setHeroKeyword} country={heroCountry} onCountryChange={setHeroCountry} studyLevel={heroStudyLevel} onStudyLevelChange={setHeroStudyLevel} intake={heroIntake} onIntakeChange={setHeroIntake} onSearch={handleHeroSearch} onCounsellor={() => setView('counsellor')} studyLevels={filterOptions.studyLevels} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setView('landing')} className="inline-flex items-center gap-1.5 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />Back to options
          </button>
          <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-2">Profile-Based Eligibility Check</h2>
          <p className="text-sm text-[var(--alo-text-muted)] mb-8">Tell us about your academic background and we will match you with courses you are eligible for.</p>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = profileStep === i + 1;
              const isDone = profileStep > i + 1;
              return (
                <button key={i} onClick={() => setProfileStep(i + 1)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-white' : isDone ? 'text-[var(--alo-body)] bg-[var(--alo-surface-muted)]' : 'text-[var(--alo-text-muted)] bg-[var(--alo-page)]'}`} style={isActive ? { backgroundColor: ALO_BLUE } : undefined}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${isActive ? 'bg-white/20' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-[var(--alo-text-muted)]'}`}>
                    {isDone ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </span>
                  <Icon className="size-3.5" />{step.title}
                </button>
              );
            })}
          </div>

          {/* Step Content */}
          <Card className="p-6">
            {profileStep === 1 && <ProfileStep1 profile={academicProfile} onChange={setAcademicProfile} />}
            {profileStep === 2 && <ProfileStep2 tests={englishTests} onChange={(i, t) => { const updated = [...englishTests]; updated[i] = t; setEnglishTests(updated); }} onAdd={() => setEnglishTests([...englishTests, { testType: '', overallScore: '', listening: '', reading: '', writing: '', speaking: '' }])} onRemove={(i) => setEnglishTests(englishTests.filter((_, idx) => idx !== i))} />}
            {profileStep === 3 && <ProfileStep3 work={workExperience} gap={studyGap} onWorkChange={setWorkExperience} onGapChange={setStudyGap} />}
            {profileStep === 4 && <ProfileStep4 prefs={studyPreferences} onChange={setStudyPreferences} />}
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => profileStep > 1 ? setProfileStep((p) => p - 1) : setView('landing')} className="text-sm">
              <ArrowLeft className="size-4 mr-1" />{profileStep > 1 ? 'Previous' : 'Back'}
            </Button>
            {profileStep < 4 ? (
              <Button className="text-white text-sm" style={{ backgroundColor: ALO_BLUE }} onClick={() => setProfileStep((p) => p + 1)}>Next<ArrowRight className="size-4 ml-1" /></Button>
            ) : (
              <Button className="text-white text-sm font-semibold" style={{ backgroundColor: ALO_ORANGE }} onClick={handleProfileSubmit} disabled={profileSubmitting}>
                {profileSubmitting ? <><Loader2 className="size-4 mr-2 animate-spin" />Evaluating...</> : <><Sparkles className="size-4 mr-2" />Check My Eligibility</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: ELIGIBILITY RESULTS VIEW
  // ============================================================
  if (view === 'results') {
    return (
      <div className="min-h-screen bg-white">
        <HeroSection keyword={heroKeyword} onKeywordChange={setHeroKeyword} country={heroCountry} onCountryChange={setHeroCountry} studyLevel={heroStudyLevel} onStudyLevelChange={setHeroStudyLevel} intake={heroIntake} onIntakeChange={setHeroIntake} onSearch={handleHeroSearch} onCounsellor={() => setView('counsellor')} studyLevels={filterOptions.studyLevels} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button onClick={() => setView('profile')} className="inline-flex items-center gap-1.5 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] mb-2 transition-colors"><ArrowLeft className="h-4 w-4" />Back to profile</button>
              <h2 className="text-xl font-bold text-[var(--alo-text)]">Eligibility Results</h2>
              <p className="text-sm text-[var(--alo-text-muted)]">Courses matched to your profile, sorted by match score.</p>
            </div>
          </div>

          {/* Summary Bar */}
          {Object.keys(eligibilitySummary).length > 0 && <EligibilitySummaryBar summary={eligibilitySummary} />}

          {/* Eligibility Category Filter */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            <span className="text-xs text-[var(--alo-text-muted)] shrink-0">Filter:</span>
            <Button size="sm" variant={eligibilityFilter === 'all' ? 'default' : 'outline'} className={`h-7 text-xs ${eligibilityFilter === 'all' ? 'text-white' : ''}`} style={eligibilityFilter === 'all' ? { backgroundColor: ALO_BLUE } : undefined} onClick={() => setEligibilityFilter('all')}>All ({eligibilityResults.length})</Button>
            {Object.entries(ELIGIBILITY_CONFIG).map(([key, config]) => {
              const count = eligibilityResults.filter((r) => r.eligibilityCategory === key).length;
              if (count === 0) return null;
              return (
                <Button key={key} size="sm" variant={eligibilityFilter === key ? 'default' : 'outline'} className={`h-7 text-xs ${eligibilityFilter === key ? 'text-white' : ''}`} style={eligibilityFilter === key ? { backgroundColor: ALO_BLUE } : undefined} onClick={() => setEligibilityFilter(key)}>{config.label} ({count})</Button>
              );
            })}
          </div>

          {/* Results Grid */}
          {eligibilityLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : filteredEligibilityResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#0057B810' }}><SearchX className="size-10" style={{ color: ALO_BLUE, opacity: 0.5 }} /></div>
              <h3 className="text-lg font-semibold text-[var(--alo-body)]">No results in this category</h3>
              <p className="text-sm text-[var(--alo-text-muted)] mt-1">Try a different eligibility filter or adjust your profile.</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setEligibilityFilter('all')} className="text-xs">Show All</Button>
                <Button className="text-xs text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setView('counsellor')}><Phone className="size-3.5 mr-1.5" />Talk to a Counsellor</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {filteredEligibilityResults.map((result, idx) => {
                const course = result.course as unknown as CourseResult;
                return (
                  <EnhancedCourseCard
                    key={result.course?.id || idx}
                    course={course}
                    onCompare={handleCompareCourse}
                    onSave={handleSaveCourse}
                    eligibilityCategory={result.eligibilityCategory}
                    matchScore={result.matchScore}
                    requirements={result.requirements}
                    improvements={result.improvements}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <p className="text-xs text-[var(--alo-text-muted)] text-center leading-relaxed">
            Eligibility results are preliminary guidance based on the information provided and the latest verified course data available to ALO Education. Final admission decisions are made by the university.
          </p>
        </div>

        <footer className="border-t border-[var(--alo-border)] bg-[var(--alo-page)] py-6 text-[var(--alo-text-muted)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs">© {new Date().getFullYear()} ALO Education. All rights reserved.</div>
        </footer>
      </div>
    );
  }

  // ============================================================
  // RENDER: MANUAL SEARCH VIEW (default when view === 'manual')
  // ============================================================
  const resultLabel = activeTab === 'courses' ? (totalResults === 1 ? 'course' : 'courses') : (totalResults === 1 ? 'university' : 'universities');

  return (
    <div className="min-h-screen bg-white">
      <HeroSection keyword={heroKeyword} onKeywordChange={setHeroKeyword} country={heroCountry} onCountryChange={setHeroCountry} studyLevel={heroStudyLevel} onStudyLevelChange={setHeroStudyLevel} intake={heroIntake} onIntakeChange={setHeroIntake} onSearch={handleHeroSearch} onCounsellor={() => setView('counsellor')} studyLevels={filterOptions.studyLevels} />

      {renderTabs()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 bg-white border border-[var(--alo-border)] rounded-xl p-5 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">{filterContent}</div>
          </aside>

          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="lg:hidden fixed bottom-6 right-6 z-40 h-12 rounded-full shadow-lg text-white border-0" style={{ backgroundColor: ALO_BLUE }}><SlidersHorizontal className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-4">{filterContent}</div>
            </SheetContent>
          </Sheet>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 gap-4">
              <p className="text-sm text-[var(--alo-body)]">
                {loading ? <Skeleton className="h-4 w-36" /> : <><span className="font-semibold text-[var(--alo-text)]">{totalResults}</span> {resultLabel} found</>}
              </p>
              <Select value={filters.sortBy} onValueChange={(v) => setFilters((p) => ({ ...p, sortBy: v }))}>
                <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>{SORT_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <>
                {loading && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}</div>}
                {!loading && courses.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#0057B810' }}><SearchX className="size-10" style={{ color: ALO_BLUE, opacity: 0.5 }} /></div>
                    <h3 className="text-lg font-semibold text-[var(--alo-body)]">No courses match your criteria</h3>
                    <p className="text-sm text-[var(--alo-text-muted)] mt-1 max-w-md">Try adjusting filters or speak with an ALO Education counsellor.</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={handleResetFilters} className="text-xs">Clear all filters</Button>
                      <Button className="text-xs text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setView('counsellor')}><Phone className="size-3.5 mr-1.5" />Talk to a Counsellor</Button>
                    </div>
                  </div>
                )}
                {!loading && courses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {courses.map((course) => (
                      <EnhancedCourseCard key={course.id} course={course} onCompare={handleCompareCourse} onSave={handleSaveCourse} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Universities Tab */}
            {activeTab === 'universities' && (
              <>
                {loading && <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <UniversityCardSkeleton key={i} />)}</div>}
                {!loading && universities.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#0057B810' }}><SearchX className="size-10" style={{ color: ALO_BLUE, opacity: 0.5 }} /></div>
                    <h3 className="text-lg font-semibold text-[var(--alo-body)]">No universities match your criteria</h3>
                    <p className="text-sm text-[var(--alo-text-muted)] mt-1 max-w-md">Try adjusting filters or speak with an ALO Education counsellor.</p>
                  </div>
                )}
                {!loading && universities.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {universities.map((uni) => <UniversityCard key={uni.id} university={uni} onViewCourses={handleViewCourses} onCompare={handleCompareUniversity} />)}
                  </div>
                )}
              </>
            )}

            {/* Scholarships Tab */}
            {activeTab === 'scholarships' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${ALO_ORANGE}15` }}><Trophy className="size-10" style={{ color: ALO_ORANGE, opacity: 0.6 }} /></div>
                <h3 className="text-lg font-semibold text-[var(--alo-body)]">Scholarships Coming Soon</h3>
                <p className="text-sm text-[var(--alo-text-muted)] mt-2 max-w-md">ALO Education is building a comprehensive scholarship database. In the meantime, filter courses with the &quot;Scholarship Available&quot; toggle, or speak with a counsellor.</p>
                <Button className="mt-4 text-xs text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setView('counsellor')}><Phone className="size-3.5 mr-1.5" />Talk to a Counsellor</Button>
              </div>
            )}

            {/* Compare Tab */}
            {activeTab === 'compare' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#0057B810' }}><GitCompare className="size-10" style={{ color: ALO_BLUE, opacity: 0.5 }} /></div>
                <h3 className="text-lg font-semibold text-[var(--alo-body)]">Compare Courses Side by Side</h3>
                <p className="text-sm text-[var(--alo-text-muted)] mt-2 max-w-md">Add courses or universities to compare using the &quot;Compare&quot; buttons on course or university cards. You can compare up to 3 items at once.</p>
              </div>
            )}

            {renderPagination()}
          </main>
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="mt-12" style={{ backgroundColor: '#F0F6FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--alo-text)]">Ready to Study Abroad?</h2>
          <p className="mt-3 text-[var(--alo-body)] text-sm sm:text-base max-w-xl mx-auto">Book a Free Consultation with ALO Education. Our expert counsellors will guide you through every step.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="px-8 text-sm font-semibold text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setView('counsellor')}>Book a Free Consultation<ArrowRight className="size-4 ml-2" /></Button>
            <Button variant="outline" size="lg" className="px-8 text-sm font-medium" style={{ borderColor: ALO_BLUE, color: ALO_BLUE }} onClick={() => setView('profile')}><GraduationCap className="size-4 mr-2" />Check Eligibility</Button>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-xs text-[var(--alo-text-muted)] text-center leading-relaxed">
          Eligibility results are preliminary guidance based on the information provided and the latest verified course data available to ALO Education. Final admission decisions are made by the university.
        </p>
      </div>

      <footer className="border-t border-[var(--alo-border)] bg-[var(--alo-page)] py-6 text-[var(--alo-text-muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs">© {new Date().getFullYear()} ALO Education. All rights reserved.</div>
      </footer>
    </div>
  );
}
