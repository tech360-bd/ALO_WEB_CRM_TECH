'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MapPin, Globe, ExternalLink, Trophy, BookOpen, Award,
  Calendar, GraduationCap, Building2, Star, Clock, DollarSign,
  SearchX, ChevronRight, ShieldCheck, MessageCircle, Sparkles,
  FileText, Users, Home, Briefcase, TrendingUp, CheckCircle2,
  CircleDot, Circle, Loader2, ChevronUp, Languages,
  Handshake, Heart, Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ─── ALO Brand Colors ─────────────────────────────────────────────────────────
const ALO_BLUE = '#0057B8';
const ALO_ORANGE = '#E8501A';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UniversityData {
  id: string;
  name: string;
  slug: string;
  officialName?: string;
  country?: string;
  city?: string;
  state?: string;
  address?: string;
  institutionType?: string;
  establishedYear?: number;
  websiteUrl?: string;
  admissionsUrl?: string;
  internationalUrl?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  description?: string;
  studentCount?: number;
  internationalStudentCount?: number;
  featured: boolean;
  isPartner: boolean;
  rankingProvider?: string;
  rankingName?: string;
  rankingEdition?: string;
  rankingYear?: number;
  rankingValue?: number;
  rankingCategory?: string;
  rankingSourceUrl?: string;
  scholarshipAvailable?: boolean;
  keyIntakes?: string;
  accommodationAvailable?: boolean;
  careerSupport?: boolean;
  employabilityRate?: number;
  lastVerifiedAt?: string;
  verificationStatus?: string;
  sourceUrl?: string;
}

interface CourseData {
  id: string;
  slug: string;
  title: string;
  studyLevel?: string;
  qualification?: string;
  duration?: string;
  durationMonths?: number;
  tuitionFee?: number;
  tuitionCurrency?: string;
  ieltsMin?: number;
  pteMin?: number;
  scholarshipAvailable?: boolean;
  nextIntake?: string;
  intakeMonths?: string;
  officialCourseUrl?: string;
  subjectArea?: string;
}

interface RankingData {
  provider?: string;
  name?: string;
  edition?: string;
  year?: number;
  value: number;
  category?: string;
  sourceUrl?: string;
  publishedAt?: string;
}

interface RelatedUniversity {
  id: string;
  name: string;
  slug: string;
  officialName?: string;
  country?: string;
  city?: string;
  institutionType?: string;
  rankingValue?: number;
  rankingProvider?: string;
  rankingEdition?: string;
  rankingYear?: number;
  featured?: boolean;
  isPartner?: boolean;
  scholarshipAvailable?: boolean;
  keyIntakes?: string;
  logoUrl?: string;
}

interface EligibilityProfile {
  eligible: number;
  likely: number;
  conditional: number;
  notEligible: number;
  lowestTuition?: number;
  earliestIntake?: string;
}

interface ApiUniversityResponse {
  university: UniversityData;
  courses: CourseData[];
  courseCount: number;
  courseLevelCounts?: Record<string, number>;
  rankings: RankingData[];
  relatedUniversities: RelatedUniversity[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getTypeBadgeClasses(type: string | null | undefined): string {
  switch (type?.toUpperCase()) {
    case 'PUBLIC': return 'bg-emerald-100 text-emerald-700';
    case 'PRIVATE': return 'bg-violet-100 text-violet-700';
    case 'SPECIALISED': return 'bg-amber-100 text-amber-700';
    default: return 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]';
  }
}

function getLevelBadgeClasses(level: string | undefined): string {
  switch (level?.toLowerCase()) {
    case 'undergraduate': case 'bachelor':
      return 'bg-[var(--alo-brand)]/10 text-[var(--alo-brand)]';
    case 'postgraduate': case 'master':
      return 'bg-[var(--alo-brand)]/20 text-[var(--alo-brand)]';
    case 'phd': case 'doctorate':
      return 'bg-[var(--alo-brand)]/30 text-[var(--alo-brand)]';
    case 'foundation':
      return 'bg-sky-100 text-sky-800';
    case 'diploma': case 'certificate':
      return 'bg-[var(--alo-brand)]/15 text-[var(--alo-brand)]';
    default:
      return 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]';
  }
}

function formatRankingLabel(r: RankingData): string {
  const provider = r.provider || 'Ranking';
  const year = r.year ? ` ${r.year}` : '';
  return `${provider}${year}: #${r.value}`;
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2">
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-5 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// ─── Not Found ──────────────────────────────────────────────────────────────────
function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-[var(--alo-surface-muted)] flex items-center justify-center mx-auto mb-6">
          <SearchX className="size-10 text-[var(--alo-placeholder)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-2">University Not Found</h2>
        <p className="text-[var(--alo-text-muted)] mb-6">
          The university you&apos;re looking for doesn&apos;t exist or is not yet verified in our directory.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course }: { course: CourseData }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-[var(--alo-border)]">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          {course.studyLevel && (
            <Badge
              variant="secondary"
              className={`text-xs font-medium ${getLevelBadgeClasses(course.studyLevel)}`}
            >
              {course.studyLevel}
            </Badge>
          )}
          {course.scholarshipAvailable && (
            <Badge className="bg-amber-100 text-amber-700 text-xs font-medium">
              <Award className="size-3 mr-1" />
              Scholarship
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-[var(--alo-text)] leading-snug line-clamp-2">
          {course.title}
        </h3>
        {course.qualification && (
          <p className="text-sm text-[var(--alo-text-muted)]">{course.qualification}</p>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {course.duration && (
            <div className="flex items-center gap-1.5 text-[var(--alo-body)]">
              <Clock className="size-3.5 text-[var(--alo-text-muted)]" />
              <span>{course.duration}</span>
            </div>
          )}
          {course.tuitionFee != null && (
            <div className="flex items-center gap-1.5 text-[var(--alo-body)]">
              <DollarSign className="size-3.5 text-[var(--alo-text-muted)]" />
              <span>{course.tuitionCurrency || 'GBP'} {course.tuitionFee.toLocaleString()}</span>
            </div>
          )}
          {course.ieltsMin != null && (
            <div className="flex items-center gap-1.5 text-[var(--alo-body)]">
              <GraduationCap className="size-3.5 text-[var(--alo-text-muted)]" />
              <span>IELTS {course.ieltsMin}</span>
            </div>
          )}
          {course.nextIntake && (
            <div className="flex items-center gap-1.5 text-[var(--alo-body)]">
              <Calendar className="size-3.5 text-[var(--alo-text-muted)]" />
              <span>{course.nextIntake}</span>
            </div>
          )}
        </div>
        {course.officialCourseUrl && (
          <a
            href={course.officialCourseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--alo-brand)] hover:underline mt-1"
          >
            View on Official Website <ExternalLink className="size-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Related University Card ───────────────────────────────────────────────────
function RelatedUniversityCard({
  uni,
  onClick,
}: {
  uni: RelatedUniversity;
  onClick: (slug: string) => void;
}) {
  return (
    <Card
      className="min-w-[260px] max-w-[280px] hover:shadow-md transition-shadow border-[var(--alo-border)] cursor-pointer flex-shrink-0"
      onClick={() => onClick(uni.slug)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ALO_BLUE }}
          >
            <span className="text-white font-bold text-sm">
              {uni.name?.[0] || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-[var(--alo-text)] leading-snug line-clamp-2">
              {uni.officialName || uni.name}
            </h4>
          </div>
        </div>
        {uni.city && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)]">
            <MapPin className="size-3" />
            <span>{uni.city}, {uni.country}</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {uni.rankingValue && uni.rankingValue > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Trophy className="size-3" />
              <span>
                {uni.rankingProvider || 'Ranking'} {uni.rankingYear || ''}: #{uni.rankingValue}
              </span>
            </div>
          )}
          {uni.institutionType && (
            <Badge
              variant="secondary"
              className={`text-[11px] px-1.5 py-0 ${getTypeBadgeClasses(uni.institutionType)}`}
            >
              {uni.institutionType}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Apply Steps ──────────────────────────────────────────────────────────────
const APPLY_STEPS = [
  {
    step: 1,
    title: 'Check Requirements',
    description:
      'Review the entry requirements for your chosen course at this university. Check academic qualifications, English language scores, and any specific subject prerequisites. ALO Education counsellors can help you assess your eligibility.',
    icon: FileText,
  },
  {
    step: 2,
    title: 'Prepare Documents',
    description:
      'Gather all required documents including academic transcripts, English test certificates (IELTS/PTE/TOEFL), passport copy, personal statement, and reference letters. Our document checklist tool helps you track progress.',
    icon: FileText,
  },
  {
    step: 3,
    title: 'Submit through ALO',
    description:
      'Submit your application through ALO Education for priority processing. Our experienced counsellors review every application before submission, ensuring completeness and accuracy. We liaise directly with the university on your behalf.',
    icon: Send,
  },
  {
    step: 4,
    title: 'Track Application',
    description:
      'Monitor your application status in real-time through the ALO student portal. Receive instant notifications about offer letters, CAS issuance, and visa updates. Our dedicated support team is available at every stage.',
    icon: CheckCircle2,
  },
];

function Send(props: React.ComponentProps<typeof FileText>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function UniversityDetailEnhanced({
  slug,
  onBack,
  onNavigateUniversity,
}: {
  slug: string;
  onBack: () => void;
  onNavigateUniversity: (slug: string) => void;
}) {
  const [data, setData] = useState<ApiUniversityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [eligibilityProfile, setEligibilityProfile] = useState<EligibilityProfile | null>(null);

  // Fetch university data
  useEffect(() => {
    let cancelled = false;

    async function fetchUniversity() {
      setLoading(true);
      setNotFound(false);
      setError(null);

      try {
        const res = await fetch(`/api/course-finder/universities/${slug}?slug=${encodeURIComponent(slug)}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error('Failed to load university');

        const json = await res.json();
        if (!json.university) {
          setNotFound(true);
          return;
        }

        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
          toast.error('Failed to load university details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUniversity();
    return () => { cancelled = true; };
  }, [slug]);

  // Load eligibility profile from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('alo-eligibility-result');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEligibilityProfile(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch courses for the courses tab (from the main course-finder API)
  const fetchCourses = useCallback(async () => {
    if (!data?.university?.id) return;
    try {
      const res = await fetch(
        `/api/course-finder?universityId=${data.university.id}&limit=50&tab=courses`
      );
      if (!res.ok) return;
      const json = await res.json();
      return json.courses || [];
    } catch {
      return [];
    }
  }, [data?.university?.id]);

  // Loading state
  if (loading) return <DetailSkeleton />;

  // Not found
  if (notFound) return <NotFoundState onBack={onBack} />;

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <SearchX className="size-10 text-red-300" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-2">Error Loading University</h2>
          <p className="text-[var(--alo-text-muted)] mb-6">{error || 'Unable to load university data.'}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const uni = data.university;
  const courses = data.courses || [];
  const rankings = data.rankings || [];
  const relatedUnis = data.relatedUniversities || [];
  const courseCount = data.courseCount || courses.length;
  const levelCounts = data.courseLevelCounts || {};

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Breadcrumb ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)]">
          <button
            onClick={onBack}
            className="hover:text-[var(--alo-brand)] transition-colors flex items-center gap-1"
          >
            <ChevronUp className="size-3 rotate-[-90deg]" />
            Universities
          </button>
          <ChevronRight className="size-3" />
          <span className="font-medium text-[var(--alo-body)] truncate">{uni.officialName || uni.name}</span>
        </nav>
      </div>

      {/* ═══ Hero Section ═══ */}
      <section
        className="relative bg-gradient-to-br from-[var(--alo-brand)]/5 via-white to-[var(--alo-brand)]/10"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)] transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to University Directory
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Logo */}
            <div
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ backgroundColor: ALO_BLUE }}
            >
              {uni.logoUrl ? (
                <img
                  src={uni.logoUrl}
                  alt={`${uni.name} logo`}
                  className="h-18 w-18 sm:h-20 sm:w-20 rounded-xl object-contain p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span className="text-white font-bold text-3xl" style={uni.logoUrl ? { display: 'none' } : { display: 'flex' }}>
                {uni.name?.[0] || 'U'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {uni.featured && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${ALO_ORANGE}15`, color: ALO_ORANGE }}
                  >
                    <Star className="size-3" />
                    Featured University
                  </div>
                )}
                {uni.isPartner && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: ALO_ORANGE }}
                  >
                    <Handshake className="size-3" />
                    ALO Partner
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--alo-text)] mb-2">
                {uni.officialName || uni.name}
              </h1>

              {/* Location + Type + Established */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--alo-body)]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-[var(--alo-text-muted)]" />
                  <span>
                    {[uni.city, uni.state, uni.country].filter(Boolean).join(', ')}
                  </span>
                </div>
                {uni.institutionType && (
                  <Badge
                    variant="secondary"
                    className={getTypeBadgeClasses(uni.institutionType)}
                  >
                    <Building2 className="size-3 mr-1" />
                    {uni.institutionType}
                  </Badge>
                )}
                {uni.establishedYear && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5 text-[var(--alo-text-muted)]" />
                    Est. {uni.establishedYear}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Quick Stats Bar ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2 relative z-10">
        <div className="bg-white rounded-xl border border-[var(--alo-border)] shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {/* Courses */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <BookOpen className="size-4" style={{ color: ALO_BLUE }} />
                <span className="text-xl sm:text-2xl font-bold text-[var(--alo-text)]">
                  {courseCount}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--alo-text-muted)]">Published Courses</span>
            </div>

            {/* Scholarship */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Award className="size-4" style={{ color: ALO_BLUE }} />
                <span className="text-xl sm:text-2xl font-bold text-[var(--alo-text)]">
                  {uni.scholarshipAvailable ? 'Yes' : '—'}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--alo-text-muted)]">Scholarships</span>
            </div>

            {/* Key Intakes */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Calendar className="size-4" style={{ color: ALO_BLUE }} />
                <span className="text-sm sm:text-lg font-bold text-[var(--alo-text)] truncate max-w-[140px] mx-auto" title={uni.keyIntakes || undefined}>
                  {uni.keyIntakes || 'N/A'}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--alo-text-muted)]">Key Intakes</span>
            </div>

            {/* Ranking */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Trophy className="size-4 text-amber-500" />
                {rankings.length > 0 && rankings[0].value > 0 ? (
                  <span className="text-xl sm:text-2xl font-bold text-[var(--alo-text)]">
                    #{rankings[0].value}
                  </span>
                ) : (
                  <span className="text-sm sm:text-base font-bold text-[var(--alo-text-muted)]">N/A</span>
                )}
              </div>
              <span className="text-xs sm:text-sm text-[var(--alo-text-muted)] truncate">
                {rankings.length > 0
                  ? `${rankings[0].provider || 'Ranking'} ${rankings[0].year || ''}`
                  : 'Ranking unavailable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Eligibility Profile Section ═══ */}
      {eligibilityProfile && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
          <Card className="border-[var(--alo-brand)]/20 bg-[var(--alo-brand)]/5">
            <CardContent className="p-5">
              <h3 className="font-semibold text-[var(--alo-text)] mb-4 flex items-center gap-2">
                <Heart className="size-4" style={{ color: ALO_ORANGE }} />
                Your Profile at {uni.name}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">{eligibilityProfile.eligible}</div>
                  <div className="text-xs text-[var(--alo-text-muted)]">Eligible</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--alo-brand)]">{eligibilityProfile.likely}</div>
                  <div className="text-xs text-[var(--alo-text-muted)]">Likely Match</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{eligibilityProfile.conditional}</div>
                  <div className="text-xs text-[var(--alo-text-muted)]">Conditional</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--alo-text-muted)]">{eligibilityProfile.notEligible}</div>
                  <div className="text-xs text-[var(--alo-text-muted)]">Not Eligible</div>
                </div>
                <div className="col-span-2 sm:col-span-1 text-center">
                  <div className="text-sm font-semibold text-[var(--alo-body)]">
                    From {eligibilityProfile.lowestTuition ? `$${eligibilityProfile.lowestTuition.toLocaleString()}` : 'N/A'}
                  </div>
                  <div className="text-xs text-[var(--alo-text-muted)]">Lowest Tuition</div>
                  {eligibilityProfile.earliestIntake && (
                    <div className="text-xs text-[var(--alo-text-muted)] mt-1">{eligibilityProfile.earliestIntake}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ═══ Tabs Section ═══ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">
              Courses
              <Badge variant="secondary" className="ml-1.5 text-[11px] px-1.5 py-0">{courseCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="apply">How to Apply</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            {uni.description && (
              <div>
                <h2 className="text-lg font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2">
                  <Sparkles className="size-5" style={{ color: ALO_BLUE }} />
                  About {uni.name}
                </h2>
                <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-[var(--alo-body)] whitespace-pre-line">
                  {uni.description}
                </div>
              </div>
            )}

            <Separator />

            {/* Official Links */}
            <div>
              <h3 className="text-base font-semibold text-[var(--alo-text)] mb-3 flex items-center gap-2">
                <Globe className="size-4" style={{ color: ALO_BLUE }} />
                Official Links
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {uni.websiteUrl && (
                  <a
                    href={uni.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-[var(--alo-border)] hover:border-[var(--alo-brand)]/30 hover:bg-[var(--alo-brand)]/5 transition-colors"
                  >
                    <Globe className="size-4 text-[var(--alo-text-muted)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--alo-text)] truncate">Official Website</div>
                      <div className="text-xs text-[var(--alo-text-muted)] truncate">{uni.websiteUrl}</div>
                    </div>
                    <ExternalLink className="size-3.5 text-[var(--alo-text-muted)] flex-shrink-0" />
                  </a>
                )}
                {uni.admissionsUrl && (
                  <a
                    href={uni.admissionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-[var(--alo-border)] hover:border-[var(--alo-brand)]/30 hover:bg-[var(--alo-brand)]/5 transition-colors"
                  >
                    <FileText className="size-4 text-[var(--alo-text-muted)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--alo-text)] truncate">Admissions</div>
                      <div className="text-xs text-[var(--alo-text-muted)] truncate">{uni.admissionsUrl}</div>
                    </div>
                    <ExternalLink className="size-3.5 text-[var(--alo-text-muted)] flex-shrink-0" />
                  </a>
                )}
                {uni.internationalUrl && (
                  <a
                    href={uni.internationalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-[var(--alo-border)] hover:border-[var(--alo-brand)]/30 hover:bg-[var(--alo-brand)]/5 transition-colors"
                  >
                    <Languages className="size-4 text-[var(--alo-text-muted)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--alo-text)] truncate">International Students</div>
                      <div className="text-xs text-[var(--alo-text-muted)] truncate">{uni.internationalUrl}</div>
                    </div>
                    <ExternalLink className="size-3.5 text-[var(--alo-text-muted)] flex-shrink-0" />
                  </a>
                )}
              </div>
            </div>

            <Separator />

            {/* Key Facts */}
            <div>
              <h3 className="text-base font-semibold text-[var(--alo-text)] mb-3 flex items-center gap-2">
                <Building2 className="size-4" style={{ color: ALO_BLUE }} />
                Key Facts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {uni.establishedYear && (
                  <div className="p-3 rounded-lg bg-[var(--alo-page)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-1">
                      <Calendar className="size-3" />
                      Established
                    </div>
                    <div className="text-sm font-semibold text-[var(--alo-text)]">{uni.establishedYear}</div>
                  </div>
                )}
                {uni.studentCount && (
                  <div className="p-3 rounded-lg bg-[var(--alo-page)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-1">
                      <Users className="size-3" />
                      Total Students
                    </div>
                    <div className="text-sm font-semibold text-[var(--alo-text)]">
                      {uni.studentCount.toLocaleString()}
                    </div>
                  </div>
                )}
                {uni.internationalStudentCount && (
                  <div className="p-3 rounded-lg bg-[var(--alo-page)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-1">
                      <Globe className="size-3" />
                      International Students
                    </div>
                    <div className="text-sm font-semibold text-[var(--alo-text)]">
                      {uni.internationalStudentCount.toLocaleString()}
                    </div>
                  </div>
                )}
                {uni.accommodationAvailable && (
                  <div className="p-3 rounded-lg bg-[var(--alo-page)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-1">
                      <Home className="size-3" />
                      Accommodation
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">Available</div>
                  </div>
                )}
                {uni.careerSupport && (
                  <div className="p-3 rounded-lg bg-[var(--alo-page)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-1">
                      <Briefcase className="size-3" />
                      Career Support
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">Available</div>
                  </div>
                )}
                {uni.employabilityRate && (
                  <div className="p-3 rounded-lg bg-[var(--alo-page)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)] mb-1">
                      <TrendingUp className="size-3" />
                      Employability Rate
                    </div>
                    <div className="text-sm font-semibold text-[var(--alo-text)]">
                      {uni.employabilityRate}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Courses Tab ── */}
          <TabsContent value="courses">
            <div className="space-y-4">
              {/* Level filter chips */}
              {Object.keys(levelCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(levelCounts).map(([level, count]) => (
                    <Badge
                      key={level}
                      variant="secondary"
                      className={`${getLevelBadgeClasses(level)} text-xs`}
                    >
                      {level} ({count})
                    </Badge>
                  ))}
                </div>
              )}

              {courses.length === 0 ? (
                <div className="text-center py-12 bg-[var(--alo-page)] rounded-xl">
                  <BookOpen className="size-10 text-[var(--alo-placeholder)] mx-auto mb-3" />
                  <p className="text-[var(--alo-text-muted)] font-medium">No published courses available yet.</p>
                  <p className="text-[var(--alo-text-muted)] text-sm mt-1">
                    We are continuously adding courses. Check back soon or{' '}
                    <button
                      className="text-[var(--alo-brand)] hover:underline"
                      onClick={() => toast.info('Connecting you with a counsellor...')}
                    >
                      speak to a counsellor
                    </button>{' '}
                    for alternatives.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[var(--alo-text-muted)]">
                    Showing <span className="font-semibold text-[var(--alo-body)]">{courses.length}</span>{' '}
                    published {courses.length === 1 ? 'course' : 'courses'} at {uni.name}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Scholarships Tab ── */}
          <TabsContent value="scholarships">
            <div className="space-y-4">
              {uni.scholarshipAvailable ? (
                <>
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Award className="size-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--alo-text)] mb-1">
                            Scholarships Available
                          </h3>
                          <p className="text-sm text-[var(--alo-body)] leading-relaxed">
                            {uni.name} offers scholarship opportunities for international students.
                            Scholarship eligibility varies by programme and student profile. Contact an
                            ALO Education counsellor to explore the scholarship options that match your
                            academic background and financial needs.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scholarship courses */}
                  {courses.filter((c) => c.scholarshipAvailable).length > 0 && (
                    <>
                      <h4 className="font-semibold text-[var(--alo-text)]">
                        Courses with Scholarships ({courses.filter((c) => c.scholarshipAvailable).length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses
                          .filter((c) => c.scholarshipAvailable)
                          .map((course) => (
                            <CourseCard key={course.id} course={course} />
                          ))}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      className="text-white"
                      style={{ backgroundColor: ALO_BLUE }}
                      onClick={() =>
                        toast.success(
                          'An ALO counsellor will contact you about scholarship opportunities at ' + uni.name
                        )
                      }
                    >
                      <Award className="size-4 mr-2" />
                      Enquire About Scholarships
                    </Button>
                    <Button
                      variant="outline"
                      className="text-[var(--alo-cta)] border-[var(--alo-cta)]/30 hover:bg-[var(--alo-cta)]/5"
                      onClick={() => toast.info('Connecting you with a counsellor...')}
                    >
                      <MessageCircle className="size-4 mr-2" />
                      Talk to a Counsellor
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-[var(--alo-page)] rounded-xl">
                  <Award className="size-10 text-[var(--alo-placeholder)] mx-auto mb-3" />
                  <p className="text-[var(--alo-text-muted)] font-medium">No scholarship information available</p>
                  <p className="text-[var(--alo-text-muted)] text-sm mt-1">
                    Scholarship data for this university has not been published yet. Speak to an
                    ALO Education counsellor to explore funding options that may be available.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => toast.info('Connecting you with a counsellor...')}
                  >
                    <MessageCircle className="size-4 mr-2" />
                    Ask a Counsellor
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Rankings Tab ── */}
          <TabsContent value="rankings">
            <div className="space-y-4">
              <p className="text-sm text-[var(--alo-text-muted)]">
                Rankings are sourced from verified ranking publishers. Always refer to the
                official ranking source for the most up-to-date positions.
              </p>

              {rankings.length === 0 ? (
                <div className="text-center py-12 bg-[var(--alo-page)] rounded-xl">
                  <Trophy className="size-10 text-[var(--alo-placeholder)] mx-auto mb-3" />
                  <p className="text-[var(--alo-text-muted)] font-medium">Ranking unavailable</p>
                  <p className="text-[var(--alo-text-muted)] text-sm mt-1">
                    This university is not listed in the current edition of the ranking
                    providers we track, or its ranking data has not yet been verified.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rankings.map((r, idx) => (
                    <Card key={idx} className="border-amber-200/50 bg-amber-50/30">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl font-bold text-amber-700">#{r.value}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[var(--alo-text)] mb-1">
                              {r.provider || 'Ranking'}
                              {r.year ? ` — ${r.year}` : ''}
                            </h4>
                            {r.name && (
                              <p className="text-sm text-[var(--alo-body)] mb-1">{r.name}</p>
                            )}
                            {r.edition && (
                              <p className="text-xs text-[var(--alo-text-muted)]">Edition: {r.edition}</p>
                            )}
                            {r.category && (
                              <Badge
                                variant="secondary"
                                className="mt-2 text-xs bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"
                              >
                                {r.category}
                              </Badge>
                            )}
                            {r.sourceUrl && (
                              <a
                                href={r.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[var(--alo-brand)] hover:underline mt-2"
                              >
                                View Official Source <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── How to Apply Tab ── */}
          <TabsContent value="apply">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--alo-text)] mb-2">
                  Apply to {uni.name} with ALO Education
                </h2>
                <p className="text-sm text-[var(--alo-body)] leading-relaxed">
                  ALO Education provides end-to-end support for your application to this university.
                  From initial assessment to enrolment, our experienced counsellors guide you through
                  every step of the process, ensuring a smooth and successful journey.
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-0">
                {APPLY_STEPS.map((step, idx) => (
                  <div key={step.step} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                        style={{ backgroundColor: ALO_BLUE }}
                      >
                        {step.step}
                      </div>
                      {idx < APPLY_STEPS.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-200 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-8">
                      <h3 className="font-semibold text-[var(--alo-text)] mb-1">{step.title}</h3>
                      <p className="text-sm text-[var(--alo-body)] leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="text-white px-8"
                  style={{ backgroundColor: ALO_BLUE }}
                  onClick={() =>
                    toast.success('Application process started! An ALO counsellor will contact you shortly.')
                  }
                >
                  <GraduationCap className="size-5 mr-2" />
                  Start Your Application
                </Button>
                <Button
                  size="lg"
                  className="text-white px-8"
                  style={{ backgroundColor: ALO_ORANGE }}
                  onClick={() => toast.info('Connecting you with a counsellor...')}
                >
                  <MessageCircle className="size-5 mr-2" />
                  Talk to a Counsellor
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* ═══ Related Universities ═══ */}
      {relatedUnis.length > 0 && (
        <>
          <Separator className="max-w-6xl mx-auto mt-8" />
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--alo-text)] mb-6 flex items-center gap-2">
              <Building2 className="size-5" style={{ color: ALO_BLUE }} />
              Related Universities in {uni.country}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {relatedUnis.map((rUni) => (
                <RelatedUniversityCard
                  key={rUni.id}
                  uni={rUni}
                  onClick={onNavigateUniversity}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ═══ CTA Section ═══ */}
      <div className="bg-gradient-to-r from-[var(--alo-brand)]/5 via-[var(--alo-brand)]/10 to-[var(--alo-brand)]/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--alo-text)] mb-2">
              Ready to Apply to {uni.name}?
            </h2>
            <p className="text-sm text-[var(--alo-body)] max-w-xl mx-auto">
              Let ALO Education handle your application from start to finish. Our expert
              counsellors maximise your chances of receiving an offer.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-white px-8"
              style={{ backgroundColor: ALO_BLUE }}
              onClick={() =>
                toast.success('Application started! A counsellor will be in touch shortly.')
              }
            >
              <GraduationCap className="size-5 mr-2" />
              Apply with ALO Education
            </Button>
            <Button
              size="lg"
              className="text-white px-8"
              style={{ backgroundColor: ALO_ORANGE }}
              onClick={() => toast.info('Connecting you with a counsellor...')}
            >
              <MessageCircle className="size-5 mr-2" />
              Talk to a Counsellor
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Footer: Citations & Provenance ═══ */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-3 text-xs text-[var(--alo-text-muted)]">
          {rankings.length > 0 && rankings[0].value > 0 && (
            <p className="flex items-start gap-1.5">
              <ShieldCheck className="size-3.5 mt-0.5 flex-shrink-0" />
              Ranking source: {rankings[0].provider || 'Ranking'},{' '}
              {rankings[0].edition || 'University Rankings'}. Published{' '}
              {rankings[0].year || 'N/A'}. For the latest ranking, visit the official source.
            </p>
          )}
          <p className="flex items-start gap-1.5">
            <ShieldCheck className="size-3.5 mt-0.5 flex-shrink-0" />
            Last verified: {formatDate(uni.lastVerifiedAt)}. Source:{' '}
            {uni.sourceUrl || 'ALO Education database'}.
          </p>
          <p className="flex items-start gap-1.5">
            <Info className="size-3.5 mt-0.5 flex-shrink-0" />
            University information is sourced from official university websites and verified
            ranking publishers. Always check the official university website for the most
            current information.
          </p>
        </div>
      </footer>
    </div>
  );
}
