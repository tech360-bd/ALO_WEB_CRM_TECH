'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  GraduationCap,
  MapPin,
  Clock,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Download,
  Heart,
  ArrowRight,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Building2,
  Users,
  Phone,
  Star,
  ShieldCheck,
  CircleDot,
  FileText,
  Lightbulb,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CourseFinderProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface SearchFacets {
  countries: { slug: string; name: string; count: number }[];
  subjects: { value: string; count: number }[];
  levels: { value: string; count: number }[];
  intakes: { value: string; count: number }[];
  durations: { value: string; count: number }[];
  universities: { slug: string; name: string; count: number }[];
}

interface CourseResult {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  campus?: string;
  level: string;
  subject: string;
  duration: string;
  intake: string;
  tuition?: string | number;
  tuitionCurrency?: string;
  scholarshipAvailable?: boolean;
  englishRequirement?: string;
  academicRequirement?: string;
  gpaRequirement?: string;
  deliveryMode?: string;
  internship?: boolean;
  placement?: boolean;
  verificationStatus?: string;
  universitySlug: string;
  university: {
    name: string;
    slug: string;
    city: string;
    logo?: string;
    countrySlug: string;
    ranking?: string;
  };
}

interface UniversityResult {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  state?: string;
  ranking?: string;
  rankingSource?: string;
  studentsCount?: number;
  logo?: string;
  overview?: string;
  tuitionRange?: string;
  scholarshipAvailable?: boolean;
  popularSubjects?: string;
  _count: {
    courses: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EligibilityResult {
  status: string;
  reasons: string[];
  requirements: {
    english: string;
    academic: string;
    gpa?: string;
    additional?: string;
  };
  matched?: boolean;
  scoreBreakdown?: {
    gpa: boolean | null;
    english: boolean | null;
    academic: boolean | null;
  };
}

interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  requirements?: string;
  documents?: string;
  timeline?: string;
  tips?: string;
  officialLinks?: string;
  image?: string;
}

interface CountryGuide {
  countrySlug: string;
  title: string;
  slug: string;
  shortDescription: string;
  heroImage?: string;
  version?: number;
  steps: GuideStep[];
}

type EligibilityStatus = 'ELIGIBLE' | 'CONDITIONAL' | 'NOT_ELIGIBLE' | 'REQUIRES_REVIEW' | 'DATA_UNAVAILABLE';

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  uk: '🇬🇧',
  usa: '🇺🇸',
  canada: '🇨🇦',
  australia: '🇦🇺',
  germany: '🇩🇪',
  france: '🇫🇷',
  ireland: '🇮🇪',
  netherlands: '🇳🇱',
  new_zealand: '🇳🇿',
  sweden: '🇸🇪',
  denmark: '🇩🇰',
  italy: '🇮🇹',
  spain: '🇪🇸',
  japan: '🇯🇵',
  malaysia: '🇲🇾',
};

// ─── Helper: format tuition ──────────────────────────────────────────────────

function formatTuition(tuition?: string | number, currency?: string): string {
  if (!tuition) return 'TBA';
  const num = typeof tuition === 'string' ? parseFloat(tuition.replace(/[^0-9.]/g, '')) : tuition;
  if (isNaN(num)) return 'TBA';
  const cur = currency || '£';
  return `${cur}${num.toLocaleString()}`;
}

// ─── Helper: eligibility color ───────────────────────────────────────────────

function getEligibilityConfig(status: string) {
  switch (status) {
    case 'ELIGIBLE':
      return { label: 'Eligible', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500' };
    case 'CONDITIONAL':
      return { label: 'Conditional', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' };
    case 'NOT_ELIGIBLE':
      return { label: 'Not Eligible', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500' };
    case 'REQUIRES_REVIEW':
      return { label: 'Review Needed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: HelpCircle, iconColor: 'text-blue-500' };
    default:
      return { label: 'Check Eligibility', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: HelpCircle, iconColor: 'text-gray-400' };
  }
}

// ─── Eligibility Dialog ──────────────────────────────────────────────────────

function EligibilityDialog({
  open,
  onOpenChange,
  course,
  result,
  isAuthenticated,
  onLeadOpen,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  course: CourseResult | null;
  result: EligibilityResult | null;
  isAuthenticated: boolean;
  onLeadOpen: () => void;
}) {
  if (!course || !result) return null;
  const config = getEligibilityConfig(result.status);
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#000000]">Eligibility Assessment</DialogTitle>
          <DialogDescription className="text-sm text-[#555555]">
            {course.name} — {course.university?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Status banner */}
        <div className={cn('flex items-center gap-3 p-4 rounded-xl border', config.bg, config.border)}>
          <StatusIcon className={cn('h-8 w-8 shrink-0', config.iconColor)} />
          <div>
            <p className={cn('font-bold text-lg', config.text)}>{config.label}</p>
            <p className="text-xs text-[#555555] mt-0.5">
              {result.status === 'ELIGIBLE'
                ? 'You meet the requirements for this course.'
                : result.status === 'CONDITIONAL'
                  ? 'You may qualify with additional conditions.'
                  : result.status === 'NOT_ELIGIBLE'
                    ? 'This course may not be the right fit.'
                    : result.status === 'DATA_UNAVAILABLE'
                      ? 'Create a profile for personalized assessment.'
                      : 'Some criteria need manual review.'}
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#000000]">Requirement Checklist</h4>

          {result.scoreBreakdown && (
            <>
              <CheckItem
                label="Academic Qualification"
                detail={result.requirements.academic}
                status={result.scoreBreakdown.academic}
              />
              <CheckItem
                label="English Requirement"
                detail={result.requirements.english}
                status={result.scoreBreakdown.english}
              />
              <CheckItem
                label="GPA"
                detail={result.requirements.gpa || 'Not specified'}
                status={result.scoreBreakdown.gpa}
              />
            </>
          )}

          {!result.scoreBreakdown && (
            <>
              <CheckItem label="English Requirement" detail={result.requirements.english} status={null} />
              <CheckItem label="Academic Qualification" detail={result.requirements.academic} status={null} />
              {result.requirements.gpa && <CheckItem label="GPA" detail={result.requirements.gpa} status={null} />}
            </>
          )}

          <CheckItem label="Study Level" detail={course.level} status={null} />
          <CheckItem label="Course Availability" detail="Open for application" status={null} />
        </div>

        {/* Reasons / Issues */}
        {result.reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#000000]">
              {result.status === 'ELIGIBLE' ? 'Summary' : 'Potential Issues'}
            </h4>
            <ul className="space-y-1.5">
              {result.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#555555]">
                  {result.status === 'ELIGIBLE' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-[#0066CC]">Create a student profile for personalized eligibility assessment</p>
            <p className="text-xs text-[#555555] mt-1">
              The above is based on general requirements. Sign in to get a match score tailored to your profile.
            </p>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            onClick={onLeadOpen}
            className="w-full sm:w-auto h-11 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
          >
            <Phone className="h-4 w-4 mr-2" />Talk to a Counselor
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-11 rounded-xl">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckItem({
  label,
  detail,
  status,
}: {
  label: string;
  detail: string;
  status: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {status === true && <CheckCircle className="h-4 w-4 text-emerald-500" />}
        {status === false && <XCircle className="h-4 w-4 text-red-500" />}
        {status === null && <HelpCircle className="h-4 w-4 text-gray-400" />}
        <div>
          <p className="text-sm font-medium text-[#000000]">{label}</p>
          <p className="text-xs text-[#555555]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Country Guide Dialog ────────────────────────────────────────────────────

function CountryGuideDialog({
  open,
  onOpenChange,
  guide,
  onSelectCountry,
  onStartSearch,
  onLeadOpen,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  guide: CountryGuide | null;
  onSelectCountry: (slug: string) => void;
  onStartSearch: () => void;
  onLeadOpen: () => void;
}) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#000000]">Education Guide</DialogTitle>
          <DialogDescription className="text-sm text-[#555555]">
            Your step-by-step guide to studying abroad
          </DialogDescription>
        </DialogHeader>

        {!guide && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-[#555555]">Select a country to view its education guide:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(COUNTRY_FLAGS).map((slug) => (
                <button
                  key={slug}
                  onClick={() => onSelectCountry(slug)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200',
                    'hover:border-[#0066CC] hover:bg-blue-50 transition-colors min-h-[44px]',
                  )}
                >
                  <span className="text-lg">{COUNTRY_FLAGS[slug]}</span>
                  <span className="text-sm font-medium text-[#000000] capitalize">{slug.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {guide && (
          <ScrollArea className="flex-1 -mx-6 px-6">
            {/* Country hero */}
            {guide.heroImage && (
              <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-blue-100 to-blue-200">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${guide.heroImage}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="text-2xl mr-2">{COUNTRY_FLAGS[guide.countrySlug] || '🌍'}</span>
                  <h3 className="text-white font-bold text-lg">{guide.title}</h3>
                </div>
              </div>
            )}
            {!guide.heroImage && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{COUNTRY_FLAGS[guide.countrySlug] || '🌍'}</span>
                <h3 className="text-lg font-bold text-[#000000]">{guide.title}</h3>
              </div>
            )}

            {guide.shortDescription && (
              <p className="text-sm text-[#555555] leading-relaxed mb-6">{guide.shortDescription}</p>
            )}

            {/* Steps timeline */}
            <div className="relative pl-8 space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[#E5E5E5]" />

              {guide.steps.map((step) => {
                const isExpanded = expandedStep === step.stepNumber;
                return (
                  <Collapsible
                    key={step.stepNumber}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedStep(open ? step.stepNumber : null)}
                    className="relative pb-6"
                  >
                    {/* Step number circle */}
                    <div className="absolute -left-8 top-0 w-8 h-8 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-xs font-bold z-10">
                      {step.stepNumber}
                    </div>

                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left group min-h-[44px]">
                      <div className="pr-2">
                        <h4 className="text-sm font-semibold text-[#000000] group-hover:text-[#0066CC] transition-colors">
                          {step.title}
                        </h4>
                        <p className="text-xs text-[#555555] mt-0.5 line-clamp-2">{step.description}</p>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-[#555555] shrink-0 transition-transform duration-200',
                          isExpanded && 'rotate-180',
                        )}
                      />
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-2 space-y-2">
                      {step.requirements && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3" /> Requirements
                          </p>
                          <p className="text-xs text-[#555555] mt-1 whitespace-pre-line">{step.requirements}</p>
                        </div>
                      )}
                      {step.documents && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-[#0066CC] flex items-center gap-1.5">
                            <FileText className="h-3 w-3" /> Documents
                          </p>
                          <p className="text-xs text-[#555555] mt-1 whitespace-pre-line">{step.documents}</p>
                        </div>
                      )}
                      {step.tips && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                            <Lightbulb className="h-3 w-3" /> Tips
                          </p>
                          <p className="text-xs text-[#555555] mt-1 whitespace-pre-line">{step.tips}</p>
                        </div>
                      )}
                      {step.timeline && (
                        <p className="text-xs text-[#555555] flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {step.timeline}
                        </p>
                      )}
                      {step.officialLinks && (
                        <a
                          href={step.officialLinks}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0066CC] hover:underline flex items-center gap-1.5 min-h-[44px]"
                        >
                          <ExternalLink className="h-3 w-3" /> Official Link
                        </a>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row pt-4 border-t border-gray-100">
          <Button
            onClick={() => { onStartSearch(); onOpenChange(false); }}
            className="w-full sm:w-auto h-11 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#0066CC', color: '#FFFFFF' }}
          >
            <Search className="h-4 w-4 mr-2" />Start Course Search
          </Button>
          <Button
            onClick={onLeadOpen}
            variant="outline"
            className="w-full sm:w-auto h-11 rounded-xl font-semibold text-sm"
          >
            <Phone className="h-4 w-4 mr-2" />Talk to a Counselor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Course Card Skeleton ────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}

function UniversityCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── Course Result Card ──────────────────────────────────────────────────────

function CourseResultCard({
  course,
  onCheckEligibility,
  onViewDetails,
  onSave,
  onCompare,
  isSaved,
  isCompared,
}: {
  course: CourseResult;
  onCheckEligibility: (c: CourseResult) => void;
  onViewDetails: (c: CourseResult) => void;
  onSave: (c: CourseResult) => void;
  onCompare: (c: CourseResult) => void;
  isSaved: boolean;
  isCompared: boolean;
}) {
  const flag = COUNTRY_FLAGS[course.countrySlug] || '🌍';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-200 group">
      {/* Header: logo + name */}
      <div className="flex items-start gap-3 md:gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
          {course.university?.logo ? (
            <img src={course.university.logo} alt={course.university.name} className="w-full h-full object-contain p-1" />
          ) : (
            <GraduationCap className="h-7 w-7 text-[#0066CC]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#000000] truncate">{course.university?.name}</p>
              <p className="text-xs text-[#555555] flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />{course.city} <span className="text-base">{flag}</span>
              </p>
            </div>
            <button
              onClick={() => onSave(course)}
              className={cn(
                'shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors min-h-[44px] min-w-[44px]',
                isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50',
              )}
              aria-label={isSaved ? 'Remove from saved' : 'Save course'}
            >
              <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
            </button>
          </div>
          <h3 className="text-sm font-medium text-[#000000] mt-2 leading-snug line-clamp-2">{course.name}</h3>
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-blue-50 text-[#0066CC] text-xs font-medium border-0">
          <BookOpen className="h-3 w-3 mr-1" />{course.level}
        </Badge>
        {course.duration && (
          <Badge variant="secondary" className="bg-gray-100 text-[#555555] text-xs font-medium border-0">
            <Clock className="h-3 w-3 mr-1" />{course.duration}
          </Badge>
        )}
        {course.intake && (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-xs font-medium border-0">
            {course.intake}
          </Badge>
        )}
      </div>

      {/* Info grid */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-[#555555]">Tuition</span>
          <p className="font-medium text-[#000000]">{formatTuition(course.tuition as string | number | undefined, course.tuitionCurrency)}</p>
        </div>
        <div>
          <span className="text-[#555555]">English Req.</span>
          <p className="font-medium text-[#000000] truncate">{course.englishRequirement || 'Contact university'}</p>
        </div>
        <div>
          <span className="text-[#555555]">Academic Req.</span>
          <p className="font-medium text-[#000000] truncate">{course.academicRequirement || 'Contact university'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 min-h-[44px]">
            <Checkbox
              checked={isCompared}
              onCheckedChange={() => onCompare(course)}
              aria-label="Add to compare"
              className="data-[state=checked]:bg-[#0066CC] data-[state=checked]:border-[#0066CC]"
            />
            <span className="text-xs text-[#555555]">Compare</span>
          </div>
        </div>
      </div>

      {/* Verification badge */}
      {course.verificationStatus === 'VERIFIED' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-medium">Verified Information</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onViewDetails(course)}
          className={cn(
            'flex-1 h-10 rounded-lg text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-1.5',
            'border border-[#E5E5E5] text-[#555555] hover:border-[#0066CC] hover:text-[#0066CC]',
          )}
        >
          View Details <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onCheckEligibility(course)}
          className={cn(
            'flex-1 h-10 rounded-lg text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-1.5',
            'text-white',
          )}
          style={{ backgroundColor: '#F37021' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
        >
          Check Eligibility
        </button>
      </div>
    </div>
  );
}

// ─── University Result Card ──────────────────────────────────────────────────

function UniversityResultCard({
  university,
  onView,
}: {
  university: UniversityResult;
  onView: (u: UniversityResult) => void;
}) {
  const flag = COUNTRY_FLAGS[university.countrySlug] || '🌍';
  const subjects = university.popularSubjects
    ? university.popularSubjects.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 transition-all duration-200 hover:shadow-lg hover:border-gray-200 group">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
          {university.logo ? (
            <img src={university.logo} alt={university.name} className="w-full h-full object-contain p-1.5" />
          ) : (
            <Building2 className="h-8 w-8 text-[#0066CC]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#000000] truncate">{university.name}</h3>
          <p className="text-xs text-[#555555] flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />{university.city}{university.state ? `, ${university.state}` : ''} <span className="text-base">{flag}</span>
          </p>
          {university.ranking && (
            <p className="text-xs text-[#555555] flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 text-[#FFB347]" />{university.ranking}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-[#0066CC]">{university._count.courses}</p>
          <p className="text-xs text-[#555555]">Courses</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-[#F37021]">
            {university.studentsCount ? `${(university.studentsCount / 1000).toFixed(0)}K` : '—'}
          </p>
          <p className="text-xs text-[#555555]">Students</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-emerald-600">{university.scholarshipAvailable ? 'Yes' : '—'}</p>
          <p className="text-xs text-[#555555]">Scholarship</p>
        </div>
      </div>

      {/* Popular subjects */}
      {subjects.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-[#555555] mb-1.5">Popular Subjects</p>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <Badge key={s} variant="secondary" className="bg-blue-50 text-[#0066CC] text-xs border-0">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tuition range */}
      {university.tuitionRange && (
        <p className="mt-3 text-xs text-[#555555]">
          <span className="font-medium text-[#000000]">Tuition Range:</span> {university.tuitionRange}
        </p>
      )}

      {/* View button */}
      <button
        onClick={() => onView(university)}
        className={cn(
          'mt-4 w-full h-10 rounded-lg text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-1.5',
          'border-2 border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white',
        )}
      >
        View University <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, pagination.page - 2);
  const end = Math.min(pagination.totalPages, pagination.page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        className={cn(
          'h-10 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
          'border border-gray-200 text-[#555555] hover:bg-gray-50',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        ← Prev
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="h-10 w-10 rounded-lg text-sm font-medium min-h-[44px] hover:bg-gray-50">1</button>
          {start > 2 && <span className="px-1 text-[#555555]">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'h-10 w-10 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
            p === pagination.page
              ? 'bg-[#0066CC] text-white'
              : 'border border-gray-200 text-[#555555] hover:bg-gray-50',
          )}
        >
          {p}
        </button>
      ))}
      {end < pagination.totalPages && (
        <>
          {end < pagination.totalPages - 1 && <span className="px-1 text-[#555555]">…</span>}
          <button onClick={() => onPageChange(pagination.totalPages)} className="h-10 w-10 rounded-lg text-sm font-medium min-h-[44px] hover:bg-gray-50">
            {pagination.totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className={cn(
          'h-10 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
          'border border-gray-200 text-[#555555] hover:bg-gray-50',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        Next →
      </button>
    </div>
  );
}

// ─── Main Course Finder Component ────────────────────────────────────────────

export function CourseFinder({ onBack, onNavigate, onLeadOpen }: CourseFinderProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'courses' | 'universities'>('courses');

  // Facets
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [facetsLoading, setFacetsLoading] = useState(true);

  // Course search filters
  const [courseFilters, setCourseFilters] = useState({
    country: '',
    subject: '',
    level: '',
    duration: '',
    intake: '',
    university: '',
    keyword: '',
  });
  const [uniFilters, setUniFilters] = useState({
    country: '',
    name: '',
    studyLevel: '',
    subject: '',
  });

  // Advanced filters toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search state
  const [searching, setSearching] = useState(false);
  const [courseResults, setCourseResults] = useState<CourseResult[]>([]);
  const [uniResults, setUniResults] = useState<UniversityResult[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Saved / compared
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [comparedCourses, setComparedCourses] = useState<Set<string>>(new Set());
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let sid = localStorage.getItem('alo-cf-session');
    if (!sid) { sid = 'cf_' + Math.random().toString(36).slice(2, 14); localStorage.setItem('alo-cf-session', sid); }
    return sid;
  });

  // Eligibility dialog
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [eligibilityCourse, setEligibilityCourse] = useState<CourseResult | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Country guide dialog
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideCountry, setGuideCountry] = useState('uk');
  const [guideData, setGuideData] = useState<CountryGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  // Mobile filter sheet
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Load facets ──
  useEffect(() => {
    async function loadFacets() {
      try {
        const res = await fetch('/api/course-finder/facets');
        const data = await res.json();
        if (data.success) {
          setFacets({
            countries: data.countries || [],
            subjects: data.subjects || [],
            levels: data.levels || [],
            intakes: data.intakes || [],
            durations: data.durations || [],
            universities: data.universities || [],
          });
        }
      } catch (err) {
        console.error('Failed to load facets', err);
      } finally {
        setFacetsLoading(false);
      }
    }
    loadFacets();
  }, []);

  // ── Load saved items ──
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/course-finder/save?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.items) {
          const slugs = new Set(data.items.map((i: { itemSlug: string }) => i.itemSlug));
          setSavedCourses(slugs);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  // ── Filtered universities by country ──
  const filteredUniversities = facets?.universities.filter(
    (u) => !courseFilters.country || u.countrySlug === courseFilters.country,
  ) || [];

  // ── Search courses ──
  const handleCourseSearch = useCallback(async (page = 1) => {
    if (!courseFilters.country && !courseFilters.subject) {
      setSearchError('Please select at least a Country or Course/Subject to search.');
      return;
    }
    setSearchError('');
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/course-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'courses',
          country: courseFilters.country || undefined,
          subject: courseFilters.subject || undefined,
          level: courseFilters.level || undefined,
          duration: courseFilters.duration || undefined,
          intake: courseFilters.intake || undefined,
          university: courseFilters.university || undefined,
          keyword: courseFilters.keyword || undefined,
          page,
          limit: 12,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCourseResults(data.results || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      } else {
        setSearchError(data.error || 'Search failed. Please try again.');
        setCourseResults([]);
      }
    } catch (err) {
      setSearchError('Network error. Please try again.');
      setCourseResults([]);
    } finally {
      setSearching(false);
      setMobileFiltersOpen(false);
    }
  }, [courseFilters]);

  // ── Search universities ──
  const handleUniSearch = useCallback(async (page = 1) => {
    if (!uniFilters.country) {
      setSearchError('Please select a Country to search universities.');
      return;
    }
    setSearchError('');
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/course-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'universities',
          country: uniFilters.country || undefined,
          keyword: uniFilters.name || undefined,
          level: uniFilters.studyLevel || undefined,
          subject: uniFilters.subject || undefined,
          page,
          limit: 12,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUniResults(data.results || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      } else {
        setSearchError(data.error || 'Search failed.');
        setUniResults([]);
      }
    } catch (err) {
      setSearchError('Network error. Please try again.');
      setUniResults([]);
    } finally {
      setSearching(false);
      setMobileFiltersOpen(false);
    }
  }, [uniFilters]);

  // ── Page change ──
  const handlePageChange = useCallback((page: number) => {
    if (activeTab === 'courses') handleCourseSearch(page);
    else handleUniSearch(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }, [activeTab, handleCourseSearch, handleUniSearch]);

  // ── Check eligibility ──
  const handleCheckEligibility = useCallback(async (course: CourseResult) => {
    setEligibilityCourse(course);
    setEligibilityOpen(true);
    setEligibilityLoading(true);
    setEligibilityResult(null);
    try {
      const res = await fetch('/api/course-finder/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: course.slug }),
      });
      const data = await res.json();
      if (data.success) {
        setEligibilityResult({
          status: data.status,
          reasons: data.reasons || [],
          requirements: data.requirements || { english: 'N/A', academic: 'N/A' },
          matched: data.matched,
          scoreBreakdown: data.scoreBreakdown,
        });
        setIsAuthenticated(data.isAuthenticated);
      }
    } catch (err) {
      setEligibilityResult({
        status: 'DATA_UNAVAILABLE',
        reasons: ['Failed to check eligibility. Please try again.'],
        requirements: { english: 'N/A', academic: 'N/A' },
      });
    } finally {
      setEligibilityLoading(false);
    }
  }, []);

  // ── Country guide ──
  const handleOpenGuide = useCallback(async (countrySlug?: string) => {
    const slug = countrySlug || courseFilters.country || uniFilters.country || 'uk';
    setGuideCountry(slug);
    setGuideOpen(true);
    setGuideData(null);
    setGuideLoading(true);
    try {
      const res = await fetch(`/api/course-finder/guides/${slug}`);
      const data = await res.json();
      if (data.success) {
        setGuideData(data.guide);
      }
    } catch (err) {
      console.error('Failed to load guide', err);
    } finally {
      setGuideLoading(false);
    }
  }, [courseFilters.country, uniFilters.country]);

  const handleGuideSelectCountry = useCallback((slug: string) => {
    setGuideCountry(slug);
    setGuideData(null);
    setGuideLoading(true);
    fetch(`/api/course-finder/guides/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setGuideData(data.guide);
      })
      .catch(console.error)
      .finally(() => setGuideLoading(false));
  }, []);

  // ── Save / Compare (persisted via API) ──
  const handleSave = useCallback(async (course: CourseResult) => {
    const isSaved = savedCourses.has(course.slug);
    try {
      await fetch('/api/course-finder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'COURSE', itemSlug: course.slug, action: isSaved ? 'remove' : 'save', sessionId }),
      });
    } catch { /* silent — save is best-effort */ }
    setSavedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(course.slug)) next.delete(course.slug);
      else next.add(course.slug);
      return next;
    });
  }, [savedCourses, sessionId]);

  const handleCompare = useCallback(async (course: CourseResult) => {
    setComparedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(course.slug)) { next.delete(course.slug); } else { if (next.size >= 4) return prev; next.add(course.slug); }
      return next;
    });
  }, []);

  // ── Render: Hero ──
  const heroGradient = 'linear-gradient(135deg, #004C99 0%, #0066CC 50%, #F37021 100%)';

  return (
    <div className="flex flex-col bg-white">
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden py-12 md:py-16"
          style={{ background: heroGradient }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 min-h-[44px] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />Back to Home
            </button>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  Find Your Perfect Course
                </h1>
                <p className="mt-3 text-white/80 text-base md:text-lg max-w-xl">
                  Search thousands of verified courses at top universities worldwide. Get instant eligibility checks and personalized recommendations.
                </p>
              </div>
              <button
                onClick={() => handleOpenGuide()}
                className={cn(
                  'shrink-0 flex items-center gap-2 h-11 px-5 rounded-xl font-semibold text-sm text-white',
                  'bg-white/15 backdrop-blur-sm border border-white/25 hover:bg-white/25 transition-all min-h-[44px]',
                )}
              >
                <Download className="h-4 w-4" />Download Education Guide
              </button>
            </div>
          </div>
        </section>

        {/* ── Tabs + Search ── */}
        <section className="bg-[#F7F7F7] py-6 md:py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'courses' | 'universities'); setHasSearched(false); setSearchError(''); }}>
              <div className="flex items-center justify-between gap-4 mb-6">
                <TabsList className="bg-white border border-gray-200 rounded-xl p-1 h-auto">
                  <TabsTrigger
                    value="courses"
                    className="rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-[#0066CC] data-[state=active]:text-white min-h-[44px] transition-colors"
                  >
                    COURSES
                  </TabsTrigger>
                  <TabsTrigger
                    value="universities"
                    className="rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-[#0066CC] data-[state=active]:text-white min-h-[44px] transition-colors"
                  >
                    UNIVERSITIES
                  </TabsTrigger>
                </TabsList>

                {/* Mobile filter sheet trigger */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <button className="lg:hidden flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-[#555555] hover:bg-gray-50 transition-colors min-h-[44px]">
                      <Filter className="h-4 w-4" />Filters
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="max-h-[85vh]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      {activeTab === 'courses' ? (
                        <MobileCourseFilters
                          filters={courseFilters}
                          setFilters={setCourseFilters}
                          facets={facets}
                          facetsLoading={facetsLoading}
                          showAdvanced={showAdvanced}
                          setShowAdvanced={setShowAdvanced}
                          filteredUniversities={filteredUniversities}
                        />
                      ) : (
                        <MobileUniFilters
                          filters={uniFilters}
                          setFilters={setUniFilters}
                          facets={facets}
                          facetsLoading={facetsLoading}
                        />
                      )}
                      <Button
                        onClick={() => activeTab === 'courses' ? handleCourseSearch() : handleUniSearch()}
                        className="w-full h-12 rounded-xl font-semibold text-sm"
                        style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                        disabled={searching}
                      >
                        {searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        {activeTab === 'courses' ? 'Search Courses' : 'Search Universities'}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* ── COURSES TAB ── */}
              <TabsContent value="courses" className="mt-0">
                {/* Desktop filter row */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                      {/* Country (required) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#555555]">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select value={courseFilters.country} onValueChange={(v) => setCourseFilters((f) => ({ ...f, country: v }))}>
                          <SelectTrigger className="w-full h-11 rounded-lg">
                            <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Select country'} />
                          </SelectTrigger>
                          <SelectContent>
                            {facets?.countries.map((c) => (
                              <SelectItem key={c.slug} value={c.slug}>
                                {COUNTRY_FLAGS[c.slug] || '🌍'} {c.name} ({c.count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subject (required) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#555555]">
                          Course / Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select value={courseFilters.subject} onValueChange={(v) => setCourseFilters((f) => ({ ...f, subject: v }))}>
                          <SelectTrigger className="w-full h-11 rounded-lg">
                            <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Select subject'} />
                          </SelectTrigger>
                          <SelectContent>
                            {facets?.subjects.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.value} ({s.count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Advanced toggle button (visible on desktop) */}
                      <div className="col-span-2 xl:col-span-1 flex items-end">
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className={cn(
                            'w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]',
                            showAdvanced
                              ? 'bg-[#0066CC] text-white'
                              : 'border border-gray-200 text-[#555555] hover:bg-gray-50',
                          )}
                        >
                          <Filter className="h-3.5 w-3.5" />
                          {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
                          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Search button */}
                      <div className="col-span-2 xl:col-span-1 flex items-end">
                        <Button
                          onClick={() => handleCourseSearch()}
                          className="w-full h-11 rounded-xl font-semibold text-sm"
                          style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
                          disabled={searching}
                        >
                          {searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                          Search Courses
                        </Button>
                      </div>
                    </div>

                    {/* Advanced filters row */}
                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <CollapsibleContent>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                          {/* Study Level */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[#555555]">Study Level</Label>
                            <Select value={courseFilters.level} onValueChange={(v) => setCourseFilters((f) => ({ ...f, level: v }))}>
                              <SelectTrigger className="w-full h-11 rounded-lg">
                                <SelectValue placeholder="Any level" />
                              </SelectTrigger>
                              <SelectContent>
                                {facets?.levels.map((l) => (
                                  <SelectItem key={l.value} value={l.value}>{l.value} ({l.count})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Duration */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[#555555]">Duration</Label>
                            <Select value={courseFilters.duration} onValueChange={(v) => setCourseFilters((f) => ({ ...f, duration: v }))}>
                              <SelectTrigger className="w-full h-11 rounded-lg">
                                <SelectValue placeholder="Any duration" />
                              </SelectTrigger>
                              <SelectContent>
                                {facets?.durations.map((d) => (
                                  <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Intake */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[#555555]">Intake</Label>
                            <Select value={courseFilters.intake} onValueChange={(v) => setCourseFilters((f) => ({ ...f, intake: v }))}>
                              <SelectTrigger className="w-full h-11 rounded-lg">
                                <SelectValue placeholder="Any intake" />
                              </SelectTrigger>
                              <SelectContent>
                                {facets?.intakes.map((i) => (
                                  <SelectItem key={i.value} value={i.value}>{i.value} ({i.count})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* University */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[#555555]">University</Label>
                            <Select value={courseFilters.university} onValueChange={(v) => setCourseFilters((f) => ({ ...f, university: v }))}>
                              <SelectTrigger className="w-full h-11 rounded-lg">
                                <SelectValue placeholder="Any university" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredUniversities.map((u) => (
                                  <SelectItem key={u.slug} value={u.slug}>{u.name} ({u.count})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Keyword */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-[#555555]">Keyword</Label>
                            <Input
                              placeholder="e.g. cybersecurity, MBA..."
                              value={courseFilters.keyword}
                              onChange={(e) => setCourseFilters((f) => ({ ...f, keyword: e.target.value }))}
                              className="h-11 rounded-lg"
                              onKeyDown={(e) => e.key === 'Enter' && handleCourseSearch()}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                {/* Mobile: show short finder (always visible) + search button */}
                <div className="lg:hidden space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={courseFilters.country} onValueChange={(v) => setCourseFilters((f) => ({ ...f, country: v }))}>
                      <SelectTrigger className="h-11 rounded-lg w-full">
                        <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Country *'} />
                      </SelectTrigger>
                      <SelectContent>
                        {facets?.countries.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {COUNTRY_FLAGS[c.slug] || '🌍'} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={courseFilters.subject} onValueChange={(v) => setCourseFilters((f) => ({ ...f, subject: v }))}>
                      <SelectTrigger className="h-11 rounded-lg w-full">
                        <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Subject *'} />
                      </SelectTrigger>
                      <SelectContent>
                        {facets?.subjects.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => handleCourseSearch()}
                    className="w-full h-12 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                    disabled={searching}
                  >
                    {searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Search Courses
                  </Button>
                </div>

                {/* Results */}
                <div className="mt-6">
                  {searchError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{searchError}</p>
                    </div>
                  )}

                  {searching && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <CourseCardSkeleton key={i} />
                      ))}
                    </div>
                  )}

                  {!searching && hasSearched && courseResults.length === 0 && !searchError && (
                    <div className="text-center py-16">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#000000]">No courses found</h3>
                      <p className="text-sm text-[#555555] mt-1">Try adjusting your filters or search for a different subject.</p>
                    </div>
                  )}

                  {!searching && courseResults.length > 0 && (
                    <>
                      <p className="text-sm text-[#555555] mb-4">
                        Showing <span className="font-semibold text-[#000000]">{pagination.total}</span> course{pagination.total !== 1 ? 's' : ''} found
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {courseResults.map((c) => (
                          <CourseResultCard
                            key={c.slug}
                            course={c as unknown as CourseResult}
                            onCheckEligibility={handleCheckEligibility}
                            onViewDetails={(course) => onNavigate('course', course.slug)}
                            onSave={handleSave}
                            onCompare={handleCompare}
                            isSaved={savedCourses.has(c.slug)}
                            isCompared={comparedCourses.has(c.slug)}
                          />
                        ))}
                      </div>
                      <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
                    </>
                  )}

                  {!hasSearched && !searching && (
                    <div className="text-center py-16">
                      <GraduationCap className="h-12 w-12 text-[#0066CC]/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#000000]">Search for courses</h3>
                      <p className="text-sm text-[#555555] mt-1 max-w-md mx-auto">
                        Select a country and subject to discover thousands of verified courses from top universities.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── UNIVERSITIES TAB ── */}
              <TabsContent value="universities" className="mt-0">
                {/* Desktop filter row */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                      {/* Country (required) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#555555]">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <Select value={uniFilters.country} onValueChange={(v) => setUniFilters((f) => ({ ...f, country: v }))}>
                          <SelectTrigger className="w-full h-11 rounded-lg">
                            <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Select country'} />
                          </SelectTrigger>
                          <SelectContent>
                            {facets?.countries.map((c) => (
                              <SelectItem key={c.slug} value={c.slug}>
                                {COUNTRY_FLAGS[c.slug] || '🌍'} {c.name} ({c.count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* University name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#555555]">University Name</Label>
                        <Input
                          placeholder="Search university..."
                          value={uniFilters.name}
                          onChange={(e) => setUniFilters((f) => ({ ...f, name: e.target.value }))}
                          className="h-11 rounded-lg"
                          onKeyDown={(e) => e.key === 'Enter' && handleUniSearch()}
                        />
                      </div>

                      {/* Study Level */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#555555]">Study Level</Label>
                        <Select value={uniFilters.studyLevel} onValueChange={(v) => setUniFilters((f) => ({ ...f, studyLevel: v }))}>
                          <SelectTrigger className="w-full h-11 rounded-lg">
                            <SelectValue placeholder="Any level" />
                          </SelectTrigger>
                          <SelectContent>
                            {facets?.levels.map((l) => (
                              <SelectItem key={l.value} value={l.value}>{l.value} ({l.count})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-[#555555]">Subject / Course</Label>
                        <Select value={uniFilters.subject} onValueChange={(v) => setUniFilters((f) => ({ ...f, subject: v }))}>
                          <SelectTrigger className="w-full h-11 rounded-lg">
                            <SelectValue placeholder="Any subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {facets?.subjects.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.value} ({s.count})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Search button */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-transparent">Action</Label>
                        <Button
                          onClick={() => handleUniSearch()}
                          className="w-full h-11 rounded-xl font-semibold text-sm"
                          style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
                          disabled={searching}
                        >
                          {searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                          Search Universities
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile: university filters */}
                <div className="lg:hidden space-y-3">
                  <Select value={uniFilters.country} onValueChange={(v) => setUniFilters((f) => ({ ...f, country: v }))}>
                    <SelectTrigger className="h-11 rounded-lg w-full">
                      <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Country *'} />
                    </SelectTrigger>
                    <SelectContent>
                      {facets?.countries.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {COUNTRY_FLAGS[c.slug] || '🌍'} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search university name..."
                    value={uniFilters.name}
                    onChange={(e) => setUniFilters((f) => ({ ...f, name: e.target.value }))}
                    className="h-11 rounded-lg"
                  />
                  <Button
                    onClick={() => handleUniSearch()}
                    className="w-full h-12 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                    disabled={searching}
                  >
                    {searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    Search Universities
                  </Button>
                </div>

                {/* Results */}
                <div className="mt-6">
                  {searchError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{searchError}</p>
                    </div>
                  )}

                  {searching && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <UniversityCardSkeleton key={i} />
                      ))}
                    </div>
                  )}

                  {!searching && hasSearched && uniResults.length === 0 && !searchError && (
                    <div className="text-center py-16">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#000000]">No universities found</h3>
                      <p className="text-sm text-[#555555] mt-1">Try adjusting your search or select a different country.</p>
                    </div>
                  )}

                  {!searching && uniResults.length > 0 && (
                    <>
                      <p className="text-sm text-[#555555] mb-4">
                        Showing <span className="font-semibold text-[#000000]">{pagination.total}</span> universit{pagination.total !== 1 ? 'ies' : 'y'} found
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {uniResults.map((u) => (
                          <UniversityResultCard
                            key={u.slug}
                            university={u as unknown as UniversityResult}
                            onView={(uni) => onNavigate('university', uni.slug)}
                          />
                        ))}
                      </div>
                      <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
                    </>
                  )}

                  {!hasSearched && !searching && (
                    <div className="text-center py-16">
                      <Building2 className="h-12 w-12 text-[#0066CC]/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-[#000000]">Search for universities</h3>
                      <p className="text-sm text-[#555555] mt-1 max-w-md mx-auto">
                        Select a country to discover universities with verified course information and scholarship opportunities.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

      {/* ── Dialogs ── */}
      <EligibilityDialog
        open={eligibilityOpen}
        onOpenChange={setEligibilityOpen}
        course={eligibilityCourse}
        result={eligibilityLoading ? null : eligibilityResult}
        isAuthenticated={isAuthenticated}
        onLeadOpen={onLeadOpen}
      />

      <CountryGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        guide={guideLoading ? null : guideData}
        onSelectCountry={handleGuideSelectCountry}
        onStartSearch={() => setActiveTab('courses')}
        onLeadOpen={onLeadOpen}
      />
    </div>
  );
}

// ─── Mobile Filter Components ────────────────────────────────────────────────

function MobileCourseFilters({
  filters,
  setFilters,
  facets,
  facetsLoading,
  showAdvanced,
  setShowAdvanced,
  filteredUniversities,
}: {
  filters: typeof CourseFinder extends (props: infer P) => JSX.Element ? P extends { courseFilters?: infer F } ? F : never : never;
  setFilters: React.Dispatch<React.SetStateAction<{ country: string; subject: string; level: string; duration: string; intake: string; university: string; keyword: string }>>;
  facets: SearchFacets | null;
  facetsLoading: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  filteredUniversities: { slug: string; name: string; count: number }[];
}) {
  const f = filters as any;
  const setF = setFilters as any;

  return (
    <div className="space-y-4">
      {/* Country */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#555555]">Country <span className="text-red-500">*</span></Label>
        <Select value={f.country} onValueChange={(v) => setF((prev: typeof f) => ({ ...prev, country: v }))}>
          <SelectTrigger className="w-full h-11 rounded-lg">
            <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Select country'} />
          </SelectTrigger>
          <SelectContent>
            {facets?.countries.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{COUNTRY_FLAGS[c.slug] || '🌍'} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#555555]">Course / Subject <span className="text-red-500">*</span></Label>
        <Select value={f.subject} onValueChange={(v) => setF((prev: typeof f) => ({ ...prev, subject: v }))}>
          <SelectTrigger className="w-full h-11 rounded-lg">
            <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Select subject'} />
          </SelectTrigger>
          <SelectContent>
            {facets?.subjects.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={cn(
          'w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]',
          showAdvanced ? 'bg-[#0066CC] text-white' : 'border border-gray-200 text-[#555555]',
        )}
      >
        <Filter className="h-3.5 w-3.5" />
        {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#555555]">Study Level</Label>
            <Select value={f.level} onValueChange={(v) => setF((prev: typeof f) => ({ ...prev, level: v }))}>
              <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Any level" /></SelectTrigger>
              <SelectContent>
                {facets?.levels.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#555555]">Duration</Label>
            <Select value={f.duration} onValueChange={(v) => setF((prev: typeof f) => ({ ...prev, duration: v }))}>
              <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Any duration" /></SelectTrigger>
              <SelectContent>
                {facets?.durations.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#555555]">Intake</Label>
            <Select value={f.intake} onValueChange={(v) => setF((prev: typeof f) => ({ ...prev, intake: v }))}>
              <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Any intake" /></SelectTrigger>
              <SelectContent>
                {facets?.intakes.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#555555]">University</Label>
            <Select value={f.university} onValueChange={(v) => setF((prev: typeof f) => ({ ...prev, university: v }))}>
              <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Any university" /></SelectTrigger>
              <SelectContent>
                {filteredUniversities.map((u) => (
                  <SelectItem key={u.slug} value={u.slug}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#555555]">Keyword</Label>
            <Input
              placeholder="e.g. cybersecurity, MBA..."
              value={f.keyword}
              onChange={(e) => setF((prev: typeof f) => ({ ...prev, keyword: e.target.value }))}
              className="h-11 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MobileUniFilters({
  filters,
  setFilters,
  facets,
  facetsLoading,
}: {
  filters: { country: string; name: string; studyLevel: string; subject: string };
  setFilters: React.Dispatch<React.SetStateAction<{ country: string; name: string; studyLevel: string; subject: string }>>;
  facets: SearchFacets | null;
  facetsLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#555555]">Country <span className="text-red-500">*</span></Label>
        <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v }))}>
          <SelectTrigger className="w-full h-11 rounded-lg">
            <SelectValue placeholder={facetsLoading ? 'Loading...' : 'Select country'} />
          </SelectTrigger>
          <SelectContent>
            {facets?.countries.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{COUNTRY_FLAGS[c.slug] || '🌍'} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#555555]">University Name</Label>
        <Input
          placeholder="Search university..."
          value={filters.name}
          onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
          className="h-11 rounded-lg"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#555555]">Study Level</Label>
        <Select value={filters.studyLevel} onValueChange={(v) => setFilters((f) => ({ ...f, studyLevel: v }))}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Any level" /></SelectTrigger>
          <SelectContent>
            {facets?.levels.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#555555]">Subject / Course</Label>
        <Select value={filters.subject} onValueChange={(v) => setFilters((f) => ({ ...f, subject: v }))}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Any subject" /></SelectTrigger>
          <SelectContent>
            {facets?.subjects.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
