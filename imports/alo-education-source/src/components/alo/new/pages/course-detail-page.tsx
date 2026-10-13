'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  CalendarDays,
  Languages,
  MapPin,
  Award,
  Building2,
  BookOpen,
  Briefcase,
  FileCheck,
  ArrowRight,
  Heart,
  Share2,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  Image as ImageIcon,
  Mic,
  Globe,
  ClipboardList,
  Target,
  ShieldCheck,
  Loader2,
  Sparkles,
  GitCompare,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CourseDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface CourseData {
  name: string;
  slug: string;
  countrySlug?: string;
  city?: string;
  campus?: string;
  level?: string;
  subject?: string;
  discipline?: string;
  studyArea?: string;
  deliveryMode?: string;
  degreeType?: string;
  duration?: string;
  intake?: string;
  tuition?: string;
  tuitionCurrency?: string;
  applicationFee?: string;
  deposit?: string;
  englishRequirement?: string;
  academicRequirement?: string;
  gpaRequirement?: string;
  backlogPolicy?: string;
  workExperience?: string;
  portfolioRequired?: boolean;
  interviewRequired?: boolean;
  moiAccepted?: boolean;
  scholarshipAvailable?: boolean;
  scholarship?: string;
  overview?: string;
  modules?: string;
  careerOutcomes?: string;
  internship?: string;
  placement?: string;
  coop?: string;
  requiredDocuments?: string;
  visaNotes?: string;
  deadline?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  university?: {
    name: string;
    slug: string;
    city?: string;
    logo?: string;
    ranking?: string;
    countrySlug?: string;
    country?: {
      name: string;
      shortName?: string;
      flag?: string;
      slug: string;
    };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJsonField(field: string | null | undefined): string[] {
  if (!field) return [];
  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return field.split(',').map((s) => s.trim()).filter(Boolean);
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function CourseSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-48 mb-8" />
      <Skeleton className="h-10 w-[500px] mb-2" />
      <Skeleton className="h-5 w-72 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-4 w-5/6 mb-12" />
    </div>
  );
}

// ─── Info Card ───────────────────────────────────────────────────────────────

function InfoCard({
  icon,
  label,
  value,
  subLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift">
      <div className="text-alo-blue mb-2">{icon}</div>
      <p className="text-xs text-alo-gray mb-1">{label}</p>
      <p className="text-sm font-semibold text-alo-black">{value || 'Contact ALO'}</p>
      {subLabel && <p className="text-xs text-alo-gray mt-1">{subLabel}</p>}
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  className,
  variant = 'default',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'blue' | 'orange' | 'gray';
}) {
  const bgClass =
    variant === 'gray'
      ? 'bg-alo-gray-light rounded-2xl p-6 md:p-8'
    : variant === 'orange'
      ? 'bg-alo-orange-light rounded-2xl p-6 md:p-8'
    : variant === 'blue'
      ? 'bg-alo-blue-light rounded-2xl p-6 md:p-8'
      : 'bg-white rounded-xl border border-alo-gray-medium/50 p-6 md:p-8';

  return (
    <section className={cn('mb-10', className)}>
      <div className={bgClass}>
        <h2 className="text-xl md:text-2xl font-bold text-alo-black mb-5 flex items-center gap-2.5">
          {icon}
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CourseDetailPage({ slug, onBack, onNavigate, onLeadOpen }: CourseDetailPageProps) {
  const [data, setData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copying, setCopying] = useState(false);

  // Check localStorage for saved state on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('alo-saved-courses') || '[]');
      setIsSaved(saved.includes(slug));
    } catch {
      // ignore
    }
  }, [slug]);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/courses/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json.course);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCourse();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchCourse]);

  // ── Save / Bookmark ──
  const handleSave = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('alo-saved-courses') || '[]');
      if (saved.includes(slug)) {
        const next = saved.filter((s) => s !== slug);
        localStorage.setItem('alo-saved-courses', JSON.stringify(next));
        setIsSaved(false);
        toast.success('Course removed from saved list');
      } else {
        saved.push(slug);
        localStorage.setItem('alo-saved-courses', JSON.stringify(saved));
        setIsSaved(true);
        toast.success('Course saved to your list!');
      }
    } catch {
      toast.error('Could not save course. Please try again.');
    }
  };

  // ── Share ──
  const handleShare = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast.success('Link copied to clipboard!');
    } finally {
      setCopying(false);
    }
  };

  // ── Parse JSON fields ──
  const modulesList = data ? parseJsonField(data.modules) : [];
  const careerList = data ? parseJsonField(data.careerOutcomes) : [];
  const documentsList = data ? parseJsonField(data.requiredDocuments) : [];

  // ── Currency display ──
  const currency = data?.tuitionCurrency || '£';
  const tuitionDisplay = (() => {
    if (!data?.tuition) return 'Contact ALO';
    const num = Number(data.tuition);
    if (!isNaN(num) && num > 0) {
      return `${currency}${num.toLocaleString()}`;
    }
    return data.tuition;
  })();

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12"><CourseSkeleton /></main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />
        <main className="flex-1 py-8 md:py-12">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-alo-orange/10 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-alo-orange" />
            </div>
            <h3 className="text-xl font-semibold text-alo-black mb-2">Failed to Load Course</h3>
            <p className="text-alo-gray mb-6 max-w-md">Something went wrong while fetching the course data.</p>
            <Button
              onClick={fetchCourse}
              className="bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl transition-all duration-200"
            >
              Try Again
            </Button>
          </div>
        </main>
        <NewFooter onNavigate={onNavigate} />
      </div>
    );
  }

  // ── Determine which sections have content ──
  const hasAdditionalRequirements =
    data.backlogPolicy ||
    data.portfolioRequired ||
    data.interviewRequired ||
    data.moiAccepted;

  const hasCareerInfo =
    careerList.length > 0 ||
    data.internship ||
    data.placement ||
    data.coop;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ═══ Back Navigation ═══ */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="text-alo-gray hover:text-alo-blue flex items-center gap-2 text-sm transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Results</span>
            </button>
            {/* Save + Share actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={copying}
                className="border-alo-gray-medium/50 text-alo-gray hover:text-alo-blue hover:border-alo-blue/30 rounded-xl"
              >
                {copying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Share2 className="h-4 w-4 mr-1.5" />
                )}
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className={cn(
                  'border-alo-gray-medium/50 rounded-xl transition-all duration-200',
                  isSaved
                    ? 'border-alo-orange/40 bg-alo-orange/5 text-alo-orange hover:bg-alo-orange/10'
                    : 'text-alo-gray hover:text-alo-orange hover:border-alo-orange/30',
                )}
              >
                <Heart className={cn('h-4 w-4 mr-1.5', isSaved && 'fill-current')} />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            </div>
          </div>

          {/* ═══ Breadcrumb ═══ */}
          <nav className="flex items-center gap-2 text-sm text-alo-gray mb-6" aria-label="Breadcrumb">
            <button onClick={onBack} className="hover:text-alo-blue transition-colors">Home</button>
            <ChevronRight className="h-3.5 w-3.5" />
            <button onClick={() => onNavigate('course-finder')} className="hover:text-alo-blue transition-colors">Courses</button>
            {data.university && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <button
                  onClick={() => onNavigate('university', data.university!.slug)}
                  className="hover:text-alo-blue transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {data.university.name}
                </button>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-alo-black font-medium truncate max-w-[200px] sm:max-w-none" title={data.name}>
              {data.name}
            </span>
          </nav>

          {/* ═══ University Info Bar ═══ */}
          {data.university && (
            <button
              onClick={() => onNavigate('university', data.university!.slug)}
              className={cn(
                'w-full text-left mb-6 bg-alo-gray-light rounded-xl p-4 border border-alo-gray-medium/30',
                'card-lift group transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white border border-alo-gray-medium/30 flex items-center justify-center shrink-0">
                  {data.university.logo ? (
                    <img
                      src={data.university.logo}
                      alt={data.university.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-alo-gray" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-alo-black group-hover:text-alo-blue transition-colors truncate">
                    {data.university.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-alo-gray">
                    {data.university.city && data.university.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {data.university.city}, {data.university.country.flag || ''} {data.university.country.name}
                      </span>
                    )}
                    {data.university.ranking && (
                      <span className="flex items-center gap-1 text-alo-orange font-medium">
                        <Award className="h-3.5 w-3.5" />
                        QS #{data.university.ranking}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-alo-gray group-hover:text-alo-blue transition-colors shrink-0" />
              </div>
            </button>
          )}

          {/* ═══ Hero Title + Badges ═══ */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              {data.level && (
                <Badge className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1 rounded-full border-0">
                  {data.level}
                </Badge>
              )}
              {data.degreeType && (
                <Badge className="bg-alo-blue/20 text-alo-blue text-xs font-medium px-3 py-1 rounded-full border-0">
                  {data.degreeType}
                </Badge>
              )}
              {data.deliveryMode && (
                <Badge className="bg-alo-gray-light text-alo-gray text-xs font-medium px-3 py-1 rounded-full border-0">
                  <Globe className="h-3 w-3 mr-1" />
                  {data.deliveryMode}
                </Badge>
              )}
              {data.scholarshipAvailable && (
                <Badge className="bg-alo-orange/10 text-alo-orange text-xs font-medium px-3 py-1 rounded-full border-0">
                  <Award className="h-3 w-3 mr-1" />
                  Scholarship Available
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-alo-black mb-3 leading-tight">
              {data.name}
            </h1>
            {/* Subject / Discipline / Study Area breadcrumb chips */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-alo-gray">
              {data.subject && (
                <span className="flex items-center gap-1.5 bg-alo-blue/5 px-3 py-1 rounded-full">
                  <BookOpen className="h-3.5 w-3.5 text-alo-blue" />
                  {data.subject}
                </span>
              )}
              {data.discipline && (
                <span className="flex items-center gap-1.5 bg-alo-blue/5 px-3 py-1 rounded-full">
                  <BookOpen className="h-3.5 w-3.5 text-alo-blue/60" />
                  {data.discipline}
                </span>
              )}
              {data.studyArea && (
                <span className="flex items-center gap-1.5 bg-alo-blue/5 px-3 py-1 rounded-full">
                  <BookOpen className="h-3.5 w-3.5 text-alo-blue/40" />
                  {data.studyArea}
                </span>
              )}
            </div>
          </div>

          {/* ═══ Key Details Grid ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            <InfoCard
              icon={<Clock className="h-5 w-5" />}
              label="Duration"
              value={data.duration || 'Contact ALO'}
            />
            <InfoCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Tuition Fee"
              value={tuitionDisplay}
            />
            <InfoCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Intake"
              value={data.intake || 'Contact ALO'}
            />
            <InfoCard
              icon={<Languages className="h-5 w-5" />}
              label="English Requirement"
              value={data.englishRequirement || 'Contact ALO'}
            />
            <InfoCard
              icon={<MapPin className="h-5 w-5" />}
              label="City"
              value={data.city || data.university?.city || 'N/A'}
            />
            <InfoCard
              icon={<Building2 className="h-5 w-5" />}
              label="Campus"
              value={data.campus || 'Main Campus'}
            />
            <InfoCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Deadline"
              value={data.deadline || 'Contact ALO'}
            />
            <InfoCard
              icon={<Award className="h-5 w-5" />}
              label="Scholarship"
              value={data.scholarshipAvailable ? 'Available' : 'Contact ALO'}
              subLabel={data.scholarship ? 'Details below' : undefined}
            />
          </div>

          {/* ═══ Course Overview ═══ */}
          {data.overview && (
            <SectionCard
              title="Course Overview"
              icon={<Sparkles className="h-5 w-5 text-alo-blue" />}
              variant="gray"
            >
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.overview}</p>
            </SectionCard>
          )}

          {/* ═══ Key Modules ═══ */}
          {modulesList.length > 0 && (
            <SectionCard
              title="Key Modules"
              icon={<BookOpen className="h-5 w-5 text-alo-blue" />}
            >
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {modulesList.map((mod, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-alo-gray">
                    <CheckCircle className="h-4 w-4 text-alo-blue mt-0.5 shrink-0" />
                    <span>{mod}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ═══ Scholarship Detail ═══ */}
          {data.scholarshipAvailable && (
            <SectionCard
              title="Scholarship Information"
              icon={<Award className="h-5 w-5 text-alo-orange" />}
              variant="orange"
            >
              {data.scholarship ? (
                <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.scholarship}</p>
              ) : (
                <p className="text-alo-gray leading-relaxed">
                  Scholarships are available for this course.{' '}
                  <button
                    onClick={onLeadOpen}
                    className="text-alo-blue font-medium hover:underline"
                  >
                    Contact a counsellor for details
                  </button>
                  .
                </p>
              )}
            </SectionCard>
          )}

          {/* ═══ Eligibility & Requirements (Accordion) ═══ */}
          <section className="mb-10">
            <Card className="border border-alo-gray-medium/50 overflow-hidden">
              <CardContent className="p-0">
                <Accordion type="multiple" defaultValue={['eligibility']} className="w-full">

                  {/* Academic Requirements */}
                  {(data.academicRequirement || data.gpaRequirement) && (
                    <AccordionItem value="eligibility" className="px-6">
                      <AccordionTrigger className="text-alo-black hover:no-underline">
                        <span className="flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-alo-blue" />
                          Academic Requirements
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-alo-gray leading-relaxed">
                        {data.academicRequirement && (
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-alo-black mb-1">Academic Requirement</p>
                            <p className="text-sm">{data.academicRequirement}</p>
                          </div>
                        )}
                        {data.gpaRequirement && (
                          <div>
                            <p className="text-sm font-semibold text-alo-black mb-1">GPA Requirement</p>
                            <p className="text-sm">{data.gpaRequirement}</p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* English Requirements */}
                  {data.englishRequirement && (
                    <AccordionItem value="english" className="px-6">
                      <AccordionTrigger className="text-alo-black hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Languages className="h-5 w-5 text-alo-blue" />
                          English Language Requirements
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-alo-gray leading-relaxed">{data.englishRequirement}</p>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Work Experience */}
                  {data.workExperience && (
                    <AccordionItem value="work" className="px-6">
                      <AccordionTrigger className="text-alo-black hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-alo-blue" />
                          Work Experience
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-alo-gray leading-relaxed">{data.workExperience}</p>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Additional Requirements */}
                  {hasAdditionalRequirements && (
                    <AccordionItem value="additional" className="px-6">
                      <AccordionTrigger className="text-alo-black hover:no-underline">
                        <span className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-alo-blue" />
                          Additional Requirements
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {data.backlogPolicy && (
                            <div className="bg-alo-gray-light rounded-lg p-4">
                              <p className="text-sm font-semibold text-alo-black mb-1 flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4 text-alo-orange" />
                                Backlog Policy
                              </p>
                              <p className="text-sm text-alo-gray">{data.backlogPolicy}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {data.portfolioRequired && (
                              <Badge className="bg-alo-blue/10 text-alo-blue text-xs py-1.5 px-3 border-0">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Portfolio Required
                              </Badge>
                            )}
                            {data.interviewRequired && (
                              <Badge className="bg-alo-blue/10 text-alo-blue text-xs py-1.5 px-3 border-0">
                                <Mic className="h-3 w-3 mr-1" />
                                Interview Required
                              </Badge>
                            )}
                            {data.moiAccepted && (
                              <Badge className="bg-alo-blue/10 text-alo-blue text-xs py-1.5 px-3 border-0">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Medium of Instruction Accepted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Required Documents */}
                  {documentsList.length > 0 && (
                    <AccordionItem value="documents" className="px-6">
                      <AccordionTrigger className="text-alo-black hover:no-underline">
                        <span className="flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-alo-blue" />
                          Required Documents
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {documentsList.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-alo-gray">
                              <CheckCircle className="h-4 w-4 text-alo-blue mt-0.5 shrink-0" />
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* ═══ Career Outcomes & Placement ═══ */}
          {hasCareerInfo && (
            <SectionCard
              title="Career Outcomes"
              icon={<Target className="h-5 w-5 text-alo-blue" />}
            >
              {/* Career badges */}
              {(data.internship || data.placement || data.coop) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.internship && (
                    <Badge className="bg-alo-blue/10 text-alo-blue text-xs py-1.5 px-3 border-0">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Internship: {data.internship}
                    </Badge>
                  )}
                  {data.placement && (
                    <Badge className="bg-alo-blue/10 text-alo-blue text-xs py-1.5 px-3 border-0">
                      <Target className="h-3 w-3 mr-1" />
                      Placement: {data.placement}
                    </Badge>
                  )}
                  {data.coop && (
                    <Badge className="bg-alo-blue/10 text-alo-blue text-xs py-1.5 px-3 border-0">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Co-op: {data.coop}
                    </Badge>
                  )}
                </div>
              )}
              {careerList.length > 0 && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {careerList.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-alo-gray">
                      <ChevronRight className="h-4 w-4 text-alo-blue mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {/* ═══ Visa Notes ═══ */}
          {data.visaNotes && (
            <SectionCard
              title="Visa Information"
              icon={<ShieldCheck className="h-5 w-5 text-alo-blue" />}
              variant="blue"
            >
              <p className="text-alo-gray leading-relaxed whitespace-pre-line">{data.visaNotes}</p>
            </SectionCard>
          )}

          {/* ═══ University Card ═══ */}
          {data.university && (
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-alo-black mb-4 flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-alo-blue" />
                University
              </h2>
              <button
                onClick={() => onNavigate('university', data.university!.slug)}
                className={cn(
                  'w-full text-left bg-white rounded-xl border border-alo-gray-medium/50 p-6',
                  'card-lift group transition-all duration-200',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                      {data.university.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-alo-gray">
                      {data.university.city && <span>{data.university.city}</span>}
                      {data.university.country && <span>{data.university.country.name}</span>}
                      {data.university.ranking && <span className="text-alo-orange font-medium">QS: {data.university.ranking}</span>}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-alo-gray group-hover:text-alo-blue transition-colors shrink-0 mt-1" />
                </div>
              </button>
            </section>
          )}

          {/* ═══ Data Provenance ═══ */}
          <div className="mb-6">
            <Separator className="mb-4" />
            <div className="flex flex-wrap gap-4 text-xs text-alo-gray">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5" />
                Source:{' '}
                {data.sourceUrl ? (
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-alo-blue hover:underline truncate max-w-[300px] inline-block"
                  >
                    {data.sourceUrl}
                  </a>
                ) : (
                  'ALO Education database'
                )}
              </span>
              {data.lastVerifiedAt && (
                <span>Verified: {formatDate(data.lastVerifiedAt)}</span>
              )}
            </div>
          </div>

          {/* ═══ CTA ═══ */}
          <section className="bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-2xl p-8 md:p-10 text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Apply for This Course?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Get free expert counselling on this programme and your study abroad journey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                  'bg-alo-orange hover:bg-alo-orange-dark',
                  'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                  'transition-all duration-200',
                )}
              >
                Apply for this Course
              </Button>
              <Button
                onClick={onLeadOpen}
                className={cn(
                  'h-12 px-8 rounded-xl font-semibold text-sm',
                  'bg-white text-alo-blue hover:bg-white/90',
                  'transition-all duration-200',
                )}
              >
                Talk to ALO
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('course-compare', slug)}
                className={cn(
                  'h-12 px-6 rounded-xl font-semibold text-sm text-alo-blue border-alo-blue/30',
                  'hover:bg-alo-blue-light transition-all duration-200',
                )}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('eligibility-checker', slug)}
                className={cn(
                  'h-12 px-6 rounded-xl font-semibold text-sm text-alo-orange border-alo-orange/30',
                  'hover:bg-alo-orange-light transition-all duration-200',
                )}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Check Eligibility
              </Button>
            </div>
          </section>
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
