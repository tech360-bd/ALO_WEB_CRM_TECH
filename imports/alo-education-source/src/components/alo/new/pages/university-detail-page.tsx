'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  MapPin,
  Globe,
  CalendarDays,
  DollarSign,
  Award,
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Home,
  Heart,
  Briefcase,
  Headphones,
  Shield,
  Star,
  FileText,
  CreditCard,
  Banknote,
  Clock,
  Mail,
  Phone,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Zap,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UniversityDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface UniversityData {
  name: string;
  slug: string;
  city: string;
  state?: string;
  address?: string;
  ranking?: string;
  rankingSource?: string;
  tuitionRange?: string;
  popularSubjects?: string;
  overview?: string;
  scholarshipAvailable?: boolean;
  logo?: string;
  campusImage?: string;
  studentsCount?: string;
  accommodation?: string;
  internationalInfo?: string;
  whyChoose?: string;
  studentSupport?: string;
  studentLife?: string;
  careerInfo?: string;
  applicationProcess?: string;
  strengths?: string;
  quickFacts?: string;
  tuition?: string;
  applicationFee?: string;
  depositInfo?: string;
  requiredDocuments?: string;
  importantDeadlines?: string;
  officialWebsite?: string;
  internationalUrl?: string;
  applicationUrl?: string;
  scholarshipUrl?: string;
  contactEmail?: string;
  courses: {
    slug: string;
    name: string;
    level?: string;
    subject?: string;
    duration?: string;
    tuition?: number;
    tuitionCurrency?: string;
    intake?: string;
    scholarshipAvailable?: boolean;
    deliveryMode?: string;
    degreeType?: string;
  }[];
  country?: {
    name: string;
    shortName?: string;
    flag?: string;
    slug: string;
    capital?: string;
    currency?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeParseJson<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-alo-blue/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-alo-blue" />
        </div>
        <h2 className="text-2xl font-bold text-alo-black">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-sm text-alo-gray mt-1 ml-12">{subtitle}</p>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  iconColor = 'text-alo-blue',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className={cn('h-4.5 w-4.5 mt-0.5 shrink-0', iconColor)} />
      <div className="min-w-0">
        <p className="text-xs text-alo-gray mb-0.5">{label}</p>
        <p className="text-sm font-medium text-alo-black whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
}

function hasAnyContent(...values: (string | undefined | null | boolean)[]): boolean {
  return values.some(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== '' &&
      v !== '[]' &&
      v !== '{}' &&
      v !== false,
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function UniversitySkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-48 mb-8" />
      <Skeleton className="h-10 w-96 mb-2" />
      <Skeleton className="h-5 w-64 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-4 w-5/6 mb-12" />
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-16 w-16 rounded-full bg-alo-orange/10 flex items-center justify-center mb-4">
        <Building2 className="h-8 w-8 text-alo-orange" />
      </div>
      <h3 className="text-xl font-semibold text-alo-black mb-2">Failed to Load University</h3>
      <p className="text-alo-gray mb-6 max-w-md">Something went wrong while fetching the university data. Please try again.</p>
      <Button
        onClick={onRetry}
        className={cn(
          'bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl',
          'transition-all duration-200',
        )}
      >
        Try Again
      </Button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UniversityDetailPage({ slug, onBack, onNavigate, onLeadOpen }: UniversityDetailPageProps) {
  const [data, setData] = useState<UniversityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUniversity = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/universities/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json.university);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversity();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // ── Parsed data ─────────────────────────────────────────────────────────────

  const subjects: string[] = useMemo(
    () =>
      data?.popularSubjects
        ? typeof data.popularSubjects === 'string'
          ? safeParseJson<string[]>(data.popularSubjects, []).length > 0
            ? safeParseJson<string[]>(data.popularSubjects, [])
            : data.popularSubjects.split(',').map((s) => s.trim())
          : Array.isArray(data.popularSubjects)
            ? data.popularSubjects
            : []
        : [],
    [data?.popularSubjects],
  );

  const strengths: string[] = useMemo(
    () => safeParseJson<string[]>(data?.strengths, []),
    [data?.strengths],
  );

  const quickFacts: Record<string, string> = useMemo(
    () => safeParseJson<Record<string, string>>(data?.quickFacts, {}),
    [data?.quickFacts],
  );

  const tuitionBreakdown: Record<string, string> = useMemo(
    () => safeParseJson<Record<string, string>>(data?.tuition, {}),
    [data?.tuition],
  );

  const requiredDocs: string[] = useMemo(
    () => safeParseJson<string[]>(data?.requiredDocuments, []),
    [data?.requiredDocuments],
  );

  const deadlines: string[] = useMemo(
    () => safeParseJson<string[]>(data?.importantDeadlines, []),
    [data?.importantDeadlines],
  );

  // ── Section visibility flags ────────────────────────────────────────────────

  const showRankings = hasAnyContent(data?.ranking, data?.rankingSource);
  const showWhyChoose = hasAnyContent(data?.whyChoose, data?.strengths, data?.quickFacts);
  const showCampus = hasAnyContent(data?.campusImage, data?.accommodation, data?.studentLife);
  const showStudentInfo = hasAnyContent(
    data?.studentsCount,
    data?.internationalInfo,
    data?.studentSupport,
    data?.careerInfo,
  );
  const showFees = hasAnyContent(
    data?.tuition,
    data?.tuitionRange,
    data?.scholarshipAvailable,
    data?.scholarshipUrl,
  );
  const showEntryRequirements = hasAnyContent(
    data?.requiredDocuments,
    data?.applicationFee,
    data?.depositInfo,
  );
  const showDeadlines = hasAnyContent(data?.importantDeadlines, data?.applicationProcess);
  const showApplicationInfo = hasAnyContent(
    data?.applicationUrl,
    data?.contactEmail,
    data?.officialWebsite,
    data?.internationalUrl,
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />

      <main className="flex-1 py-8 md:py-12">
        {loading && <UniversitySkeleton />}

        {error && <ErrorState onRetry={fetchUniversity} />}

        {!loading && !error && data && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <button
              onClick={onBack}
              className="text-alo-gray hover:text-alo-blue flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>

            <nav className="flex items-center gap-2 text-sm text-alo-gray mb-6 -mt-4">
              <button onClick={onBack} className="hover:text-alo-blue transition-colors">Home</button>
              <span>/</span>
              <button onClick={onBack} className="hover:text-alo-blue transition-colors">Universities</button>
              <span>/</span>
              <span className="text-alo-black font-medium">{data.name}</span>
            </nav>

            {/* ─── Hero Section ─── */}
            <div className="mb-10">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {data.ranking && (
                  <Badge className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1 rounded-full border-0">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    QS Ranking: {data.ranking}
                  </Badge>
                )}
                {data.scholarshipAvailable && (
                  <Badge className="bg-alo-orange/10 text-alo-orange text-xs font-medium px-3 py-1 rounded-full border-0">
                    <Award className="h-3 w-3 mr-1" />
                    Scholarships Available
                  </Badge>
                )}
                {data.studentsCount && (
                  <Badge className="bg-alo-sunshine/15 text-alo-black text-xs font-medium px-3 py-1 rounded-full border-0">
                    <Users className="h-3 w-3 mr-1" />
                    {data.studentsCount} Students
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-3">
                {data.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-alo-gray">
                {data.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-alo-blue" />
                    {data.city}{data.state ? `, ${data.state}` : ''}, {data.country?.name ?? ''}
                  </span>
                )}
                {data.address && (
                  <span className="hidden sm:flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-alo-gray" />
                    {data.address}
                  </span>
                )}
              </div>
            </div>

            {/* ─── Key Info Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift">
                <DollarSign className="h-5 w-5 text-alo-blue mb-2" />
                <p className="text-xs text-alo-gray mb-1">Tuition Range</p>
                <p className="text-sm font-semibold text-alo-black">
                  {data.tuitionRange || 'Contact ALO'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift">
                <CalendarDays className="h-5 w-5 text-alo-blue mb-2" />
                <p className="text-xs text-alo-gray mb-1">Intakes</p>
                <p className="text-sm font-semibold text-alo-black">
                  {data.courses?.[0]?.intake || 'Multiple'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift">
                <Award className="h-5 w-5 text-alo-blue mb-2" />
                <p className="text-xs text-alo-gray mb-1">Scholarship</p>
                <p className="text-sm font-semibold text-alo-black">
                  {data.scholarshipAvailable ? 'Available' : 'Contact for info'}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift">
                <BookOpen className="h-5 w-5 text-alo-blue mb-2" />
                <p className="text-xs text-alo-gray mb-1">Courses</p>
                <p className="text-sm font-semibold text-alo-black">
                  {data.courses?.length ?? 0} Programmes
                </p>
              </div>
            </div>

            {/* ─── Popular Subjects ─── */}
            {subjects.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-alo-black mb-4">Popular Subjects</h2>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <Badge
                      key={subject}
                      className="bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1.5 rounded-full border-0 hover:bg-alo-blue/20 transition-colors cursor-pointer"
                      onClick={() => onNavigate('course-finder')}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                RANKINGS SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showRankings && (
              <section className="bg-alo-blue-light rounded-2xl p-6 md:p-8 mb-12">
                <SectionHeading
                  icon={Trophy}
                  title="Rankings & Reputation"
                />
                {data.ranking && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-alo-blue flex items-center justify-center shrink-0">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-alo-gray mb-0.5">World Ranking</p>
                      <p className="text-2xl font-bold text-alo-blue">#{data.ranking}</p>
                    </div>
                  </div>
                )}
                {data.rankingSource && (
                  <p className="text-sm text-alo-gray">
                    <span className="font-medium text-alo-black">Source:</span> {data.rankingSource}
                  </p>
                )}
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                WHY CHOOSE SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showWhyChoose && (
              <section className="mb-12">
                <SectionHeading
                  icon={Lightbulb}
                  title="Why Choose This University"
                />

                {/* Quick Facts Grid */}
                {Object.keys(quickFacts).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {Object.entries(quickFacts).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-alo-gray-light rounded-xl p-4"
                      >
                        <p className="text-xs text-alo-gray mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-sm font-semibold text-alo-black">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Why Choose Description */}
                {data.whyChoose && (
                  <div className="bg-alo-orange-light/50 rounded-2xl p-6 md:p-8 mb-6">
                    <div className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-alo-orange mt-0.5 shrink-0" />
                      <p className="text-alo-gray leading-relaxed whitespace-pre-line">
                        {data.whyChoose}
                      </p>
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {strengths.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {strengths.map((strength) => (
                      <div
                        key={strength}
                        className="flex items-start gap-3 bg-white rounded-xl border border-alo-gray-medium/50 p-4"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5 text-alo-blue mt-0.5 shrink-0" />
                        <p className="text-sm text-alo-black">{strength}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                CAMPUS & STUDENT LIFE SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showCampus && (
              <section className="mb-12">
                <SectionHeading
                  icon={Building2}
                  title="Campus & Student Life"
                  subtitle="Discover the campus experience and living environment"
                />

                {/* Campus Image */}
                {data.campusImage && (
                  <div className="rounded-2xl overflow-hidden mb-6 border border-alo-gray-medium/30">
                    <img
                      src={data.campusImage}
                      alt={`${data.name} campus`}
                      className="w-full h-48 sm:h-64 md:h-80 object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accommodation */}
                  {data.accommodation && (
                    <div className="bg-alo-gray-light rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Home className="h-5 w-5 text-alo-blue" />
                        <h3 className="text-base font-semibold text-alo-black">Accommodation</h3>
                      </div>
                      <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">
                        {data.accommodation}
                      </p>
                    </div>
                  )}

                  {/* Student Life */}
                  {data.studentLife && (
                    <div className="bg-alo-gray-light rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="h-5 w-5 text-alo-orange" />
                        <h3 className="text-base font-semibold text-alo-black">Student Life</h3>
                      </div>
                      <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">
                        {data.studentLife}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STUDENT INFO SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showStudentInfo && (
              <section className="mb-12">
                <SectionHeading
                  icon={Users}
                  title="Student Information"
                />
                <div className="bg-alo-gray-light rounded-2xl p-6 md:p-8">
                  {data.studentsCount && (
                    <InfoRow
                      icon={Users}
                      label="Total Students"
                      value={data.studentsCount}
                    />
                  )}
                  {data.internationalInfo && (
                    <InfoRow
                      icon={Globe}
                      label="International Students"
                      value={data.internationalInfo}
                      iconColor="text-alo-orange"
                    />
                  )}
                  {data.careerInfo && (
                    <InfoRow
                      icon={Briefcase}
                      label="Career & Employment"
                      value={data.careerInfo}
                      iconColor="text-alo-blue"
                    />
                  )}
                  {data.studentSupport && (
                    <InfoRow
                      icon={Headphones}
                      label="Student Support Services"
                      value={data.studentSupport}
                      iconColor="text-alo-orange"
                    />
                  )}
                </div>
              </section>
            )}

            {/* ─── Courses Section ─── */}
            {data.courses && data.courses.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-alo-black">Available Programmes</h2>
                  <span className="text-sm text-alo-gray">{data.courses.length} courses</span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}>
                  {data.courses.map((course) => (
                    <button
                      key={course.slug}
                      onClick={() => onNavigate('course', course.slug)}
                      className={cn(
                        'w-full text-left bg-white rounded-xl border border-alo-gray-medium/50 p-4 md:p-5',
                        'card-lift group transition-all duration-200',
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors truncate">
                            {course.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-alo-gray">
                            {course.level && <span>{course.level}</span>}
                            {course.duration && <span>{course.duration}</span>}
                            {course.tuition && (
                              <span>
                                {course.tuitionCurrency || '£'}{course.tuition.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.scholarshipAvailable && (
                            <Badge className="bg-alo-orange/10 text-alo-orange text-[10px] font-medium px-2 py-0.5 rounded-full border-0">
                              Scholarship
                            </Badge>
                          )}
                          <ExternalLink className="h-4 w-4 text-alo-gray group-hover:text-alo-blue transition-colors shrink-0" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                FEES & SCHOLARSHIPS SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showFees && (
              <section className="mb-12">
                <SectionHeading
                  icon={DollarSign}
                  title="Fees & Scholarships"
                />

                {/* Tuition Breakdown */}
                {Object.keys(tuitionBreakdown).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {Object.entries(tuitionBreakdown).map(([level, amount]) => (
                      <div
                        key={level}
                        className="bg-alo-blue-light rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs text-alo-gray mb-0.5 capitalize">{level.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm font-semibold text-alo-black">{amount}</p>
                        </div>
                        <Banknote className="h-5 w-5 text-alo-blue/40" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tuition Range */}
                {data.tuitionRange && (
                  <div className="bg-alo-gray-light rounded-xl p-5 mb-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-alo-blue/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-alo-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-alo-gray mb-0.5">Overall Tuition Range</p>
                      <p className="text-base font-semibold text-alo-black">{data.tuitionRange}</p>
                    </div>
                  </div>
                )}

                {/* Scholarship Info */}
                <div className={cn(
                  'rounded-xl p-5 border',
                  data.scholarshipAvailable
                    ? 'bg-alo-orange-light/50 border-alo-orange/20'
                    : 'bg-alo-gray-light border-alo-gray-medium/30',
                )}>
                  <div className="flex items-center gap-3 mb-2">
                    <Award className={cn(
                      'h-5 w-5',
                      data.scholarshipAvailable ? 'text-alo-orange' : 'text-alo-gray',
                    )} />
                    <h3 className="text-base font-semibold text-alo-black">Scholarships</h3>
                    {data.scholarshipAvailable && (
                      <Badge className="bg-alo-orange text-white text-[10px] font-medium px-2 py-0.5 rounded-full border-0">
                        Available
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-alo-gray">
                    {data.scholarshipAvailable
                      ? 'This university offers scholarships for international students. Contact ALO Education for details on eligibility and application process.'
                      : 'Contact ALO Education to learn about potential scholarship opportunities at this university.'}
                  </p>
                  {data.scholarshipUrl && (
                    <a
                      href={data.scholarshipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-alo-blue hover:text-alo-blue-dark mt-3 transition-colors"
                    >
                      View Scholarship Details
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ENTRY REQUIREMENTS SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showEntryRequirements && (
              <section className="mb-12">
                <SectionHeading
                  icon={Shield}
                  title="Entry Requirements"
                />

                {/* Required Documents */}
                {requiredDocs.length > 0 && (
                  <div className="bg-alo-gray-light rounded-2xl p-6 md:p-8 mb-6">
                    <h3 className="text-base font-semibold text-alo-black mb-4 flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-alo-blue" />
                      Required Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {requiredDocs.map((doc) => (
                        <div key={doc} className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-alo-blue shrink-0" />
                          <span className="text-sm text-alo-black">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Fee & Deposit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.applicationFee && (
                    <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4.5 w-4.5 text-alo-blue" />
                        <h3 className="text-sm font-semibold text-alo-black">Application Fee</h3>
                      </div>
                      <p className="text-sm text-alo-gray">{data.applicationFee}</p>
                    </div>
                  )}
                  {data.depositInfo && (
                    <div className="bg-white rounded-xl border border-alo-gray-medium/50 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Banknote className="h-4.5 w-4.5 text-alo-orange" />
                        <h3 className="text-sm font-semibold text-alo-black">Deposit Information</h3>
                      </div>
                      <p className="text-sm text-alo-gray">{data.depositInfo}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                INTAKES & DEADLINES SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showDeadlines && (
              <section className="mb-12">
                <SectionHeading
                  icon={Clock}
                  title="Intakes & Deadlines"
                />

                {/* Important Deadlines */}
                {deadlines.length > 0 && (
                  <div className="bg-alo-gray-light rounded-2xl p-6 md:p-8 mb-6">
                    <h3 className="text-base font-semibold text-alo-black mb-4 flex items-center gap-2">
                      <CalendarDays className="h-4.5 w-4.5 text-alo-blue" />
                      Important Deadlines
                    </h3>
                    <div className="space-y-3">
                      {deadlines.map((deadline) => (
                        <div
                          key={deadline}
                          className="flex items-center gap-3 bg-white rounded-lg border border-alo-gray-medium/50 p-3.5"
                        >
                          <div className="h-8 w-8 rounded-lg bg-alo-orange/10 flex items-center justify-center shrink-0">
                            <CalendarDays className="h-4 w-4 text-alo-orange" />
                          </div>
                          <p className="text-sm text-alo-black">{deadline}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Process */}
                {data.applicationProcess && (
                  <div className="bg-alo-blue-light rounded-2xl p-6 md:p-8">
                    <h3 className="text-base font-semibold text-alo-black mb-3 flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-alo-blue" />
                      Application Process
                    </h3>
                    <p className="text-sm text-alo-gray leading-relaxed whitespace-pre-line">
                      {data.applicationProcess}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                APPLICATION INFO SECTION
               ═══════════════════════════════════════════════════════════════════ */}
            {showApplicationInfo && (
              <section className="mb-12">
                <SectionHeading
                  icon={Phone}
                  title="How to Apply"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.applicationUrl && (
                    <a
                      href={data.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift group block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="h-4.5 w-4.5 text-alo-blue" />
                        <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                          Online Application
                        </h3>
                      </div>
                      <p className="text-xs text-alo-gray truncate">{data.applicationUrl}</p>
                    </a>
                  )}
                  {data.officialWebsite && (
                    <a
                      href={data.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift group block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4.5 w-4.5 text-alo-blue" />
                        <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                          Official Website
                        </h3>
                      </div>
                      <p className="text-xs text-alo-gray truncate">{data.officialWebsite}</p>
                    </a>
                  )}
                  {data.internationalUrl && (
                    <a
                      href={data.internationalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-xl border border-alo-gray-medium/50 p-5 card-lift group block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4.5 w-4.5 text-alo-orange" />
                        <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                          International Admissions
                        </h3>
                      </div>
                      <p className="text-xs text-alo-gray truncate">{data.internationalUrl}</p>
                    </a>
                  )}
                  {data.contactEmail && (
                    <div className="bg-alo-blue-light rounded-xl p-5 flex items-center gap-3 sm:col-span-2 lg:col-span-3">
                      <div className="h-10 w-10 rounded-lg bg-alo-blue/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-alo-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-alo-gray mb-0.5">Contact Email</p>
                        <a
                          href={`mailto:${data.contactEmail}`}
                          className="text-sm font-medium text-alo-blue hover:text-alo-blue-dark transition-colors truncate block"
                        >
                          {data.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-xl p-5 text-center">
                  <p className="text-sm text-white/90 mb-3">
                    Get free expert guidance on your application to {data.name}
                  </p>
                  <Button
                    onClick={onLeadOpen}
                    className={cn(
                      'h-10 px-6 rounded-lg font-semibold text-sm text-white',
                      'bg-alo-orange hover:bg-alo-orange-dark',
                      'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                      'transition-all duration-200',
                    )}
                  >
                    Get Free Counselling
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </section>
            )}

            {/* ─── About Section ─── */}
            {data.overview && (
              <section className="bg-alo-gray-light rounded-2xl p-6 md:p-8 mb-12">
                <SectionHeading
                  icon={BookOpen}
                  title={`About ${data.name}`}
                />
                <p className="text-alo-gray leading-relaxed whitespace-pre-line">
                  {data.overview}
                </p>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                FAQ SECTION (Placeholder)
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="mb-12">
              <SectionHeading
                icon={HelpCircle}
                title="Frequently Asked Questions"
              />
              <div className="bg-alo-gray-light rounded-2xl p-6 md:p-8">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="q1" className="border-alo-gray-medium/30">
                    <AccordionTrigger className="text-sm font-medium text-alo-black hover:text-alo-blue hover:no-underline">
                      What are the admission requirements for {data.name}?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-alo-gray leading-relaxed">
                      Admission requirements vary by programme. Generally, you will need academic transcripts, proof of English language proficiency (IELTS/TOEFL), a personal statement, and letters of recommendation. Contact ALO Education for programme-specific requirements.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q2" className="border-alo-gray-medium/30">
                    <AccordionTrigger className="text-sm font-medium text-alo-black hover:text-alo-blue hover:no-underline">
                      Are scholarships available for international students?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-alo-gray leading-relaxed">
                      {data.scholarshipAvailable
                        ? `Yes, ${data.name} offers scholarships for eligible international students. Scholarship criteria and amounts vary. Reach out to ALO Education for guidance on scholarship applications.`
                        : `Contact ALO Education to learn about potential funding options and scholarship opportunities that may be available for your application to ${data.name}.`}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q3" className="border-alo-gray-medium/30">
                    <AccordionTrigger className="text-sm font-medium text-alo-black hover:text-alo-blue hover:no-underline">
                      How can ALO Education help with my application?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-alo-gray leading-relaxed">
                      ALO Education provides end-to-end support including university selection, application preparation, document review, scholarship guidance, visa counselling, and pre-departure briefings. Our services are completely free for students.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q4" className="border-alo-gray-medium/30">
                    <AccordionTrigger className="text-sm font-medium text-alo-black hover:text-alo-blue hover:no-underline">
                      What is the student visa process for studying here?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-alo-gray leading-relaxed">
                      Once you receive an offer letter from {data.name}, ALO Education will guide you through the complete visa application process, including documentation preparation, financial evidence, and interview preparation.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </section>

            {/* ─── CTA Section ─── */}
            <section className="bg-gradient-to-r from-alo-blue-dark to-alo-blue rounded-2xl p-8 md:p-10 text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Interested in {data.name}?
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Get free expert guidance on admissions, scholarships, and visas. Our counsellors have helped hundreds of Bangladeshi students apply successfully.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={onLeadOpen}
                  className={cn(
                    'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                    'bg-alo-orange hover:bg-alo-orange-dark',
                    'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                    'transition-all duration-200',
                  )}
                >
                  Apply to this University
                </Button>
                <Button
                  onClick={() => onNavigate('course-finder')}
                  className={cn(
                    'h-12 px-8 rounded-xl font-semibold text-sm',
                    'bg-white text-alo-blue hover:bg-white/90',
                    'transition-all duration-200',
                  )}
                >
                  Find Courses
                </Button>
              </div>
            </section>

            {/* ─── Related Content ─── */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-alo-black mb-6">Explore More</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => onNavigate('country', data.country?.slug)}
                  className="bg-white rounded-xl border border-alo-gray-medium/50 p-6 card-lift text-left group"
                >
                  <Globe className="h-8 w-8 text-alo-blue mb-3" />
                  <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                    Study in {data.country?.name}
                  </h3>
                  <p className="text-xs text-alo-gray mt-1">Explore universities, courses, and scholarships</p>
                </button>
                <button
                  onClick={() => onNavigate('course-finder')}
                  className="bg-white rounded-xl border border-alo-gray-medium/50 p-6 card-lift text-left group"
                >
                  <GraduationCap className="h-8 w-8 text-alo-orange mb-3" />
                  <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                    Course Finder
                  </h3>
                  <p className="text-xs text-alo-gray mt-1">AI-powered course matching for your profile</p>
                </button>
                <button
                  onClick={() => onNavigate('resources', 'scholarships')}
                  className="bg-white rounded-xl border border-alo-gray-medium/50 p-6 card-lift text-left group"
                >
                  <Award className="h-8 w-8 text-alo-sunshine mb-3" />
                  <h3 className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">
                    Scholarships
                  </h3>
                  <p className="text-xs text-alo-gray mt-1">Find funding opportunities for your studies</p>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
