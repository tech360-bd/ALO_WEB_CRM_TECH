'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Clock,
  BookOpen,
  CalendarDays,
  DollarSign,
  Languages,
  Award,
  CheckCircle,
  Heart,
  GitCompareArrows,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Loader2,
  Building2,
  Star,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CourseDetailProps {
  courseSlug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface CourseData {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  campus?: string;
  level: string;
  subject: string;
  discipline?: string;
  studyArea?: string;
  deliveryMode?: string;
  degreeType?: string;
  duration: string;
  intake: string;
  tuition: string;
  tuitionCurrency: string;
  applicationFee?: string;
  deposit?: string;
  scholarship?: string;
  scholarshipAvailable: boolean;
  englishRequirement: string;
  academicRequirement: string;
  gpaRequirement?: string;
  backlogPolicy?: string;
  workExperience?: string;
  portfolioRequired: boolean;
  interviewRequired: boolean;
  moiAccepted: boolean;
  overview: string;
  modules: string;
  careerOutcomes: string;
  internship?: string;
  placement?: string;
  coop?: string;
  requiredDocuments: string;
  visaNotes?: string;
  deadline?: string;
  matchScore: number;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  universitySlug: string;
  university: {
    name: string;
    slug: string;
    city: string;
    logo?: string;
    campusImage?: string;
    ranking?: string;
    countrySlug: string;
    country: {
      name: string;
      shortName: string;
      flag: string;
      slug: string;
    };
  };
}

interface RelatedCourse {
  slug: string;
  name: string;
  level: string;
  subject: string;
  duration: string;
  tuition: string;
  tuitionCurrency: string;
  university: {
    name: string;
    slug: string;
    city: string;
    logo?: string;
    countrySlug: string;
  };
}

const SESSION_KEY = 'alo-session-id';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function CourseDetail({ courseSlug, onBack, onNavigate, onLeadOpen }: CourseDetailProps) {
  const [course, setCourse] = useState<CourseData | null>(null);
  const [related, setRelated] = useState<RelatedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseSlug}`);
      if (!res.ok) throw new Error('Course not found');
      const data = await res.json();
      setCourse(data.course);

      // Fetch related courses from same university
      if (data.course?.universitySlug) {
        const relRes = await fetch(
          `/api/courses?university=${data.course.universitySlug}&limit=4`
        );
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelated(relData.courses.filter((c: RelatedCourse) => c.slug !== courseSlug));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    fetchCourse();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchCourse]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sessionId = getSessionId();
      await fetch('/api/course-finder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'COURSE',
          itemSlug: courseSlug,
          action: isSaved ? 'remove' : 'save',
          sessionId,
        }),
      });
      setIsSaved(!isSaved);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const parseJson = (str: string): unknown[] => {
    try { return JSON.parse(str); } catch { return []; }
  };

  if (loading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-4 pt-32 pb-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-500 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Button onClick={onBack} variant="outline" className="min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course Finder
          </Button>
        </div>
      </div>
    );
  }

  const modules = parseJson(course.modules);
  const careerOutcomes = parseJson(course.careerOutcomes);
  const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$' };
  const currencySymbol = CURRENCY_SYMBOLS[course.tuitionCurrency] || course.tuitionCurrency;

  return (
    <div className="bg-white flex flex-col">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-[#0066CC] to-[#004C99] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Back button */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-6 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Course Finder
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* University logo */}
              {course.university.logo ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={course.university.logo} alt={course.university.name} className="w-full h-full object-contain p-2" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white/60" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <button
                    onClick={() => onNavigate('university', course.university.slug)}
                    className="text-sm text-white/80 hover:text-white hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {course.university.name}
                  </button>
                  <ChevronRight className="h-3 w-3 text-white/40" />
                  <span className="text-sm text-white/60">{course.level}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">
                  {course.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {course.university.country.flag} {course.city}, {course.university.country.shortName}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {course.level}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.duration}
                  </span>
                  {course.deliveryMode && (
                    <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.deliveryMode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content - 2 cols */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick info cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoCard icon={<DollarSign className="h-5 w-5" />} label="Tuition" value={`${currencySymbol}${course.tuition}`} />
                <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Intake" value={course.intake} />
                <InfoCard icon={<BookOpen className="h-5 w-5" />} label="Subject" value={course.subject} />
                <InfoCard icon={<Award className="h-5 w-5" />} label="Degree" value={course.degreeType || course.level} />
              </div>

              {/* Overview */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#0066CC]" /> Overview
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                  {course.overview}
                </div>
              </section>

              <Separator />

              {/* Requirements */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#0066CC]" /> Entry Requirements
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RequirementCard title="English Requirement" content={course.englishRequirement} icon={<Languages className="h-5 w-5" />} />
                  <RequirementCard title="Academic Requirement" content={course.academicRequirement} icon={<GraduationCap className="h-5 w-5" />} />
                  {course.gpaRequirement && (
                    <RequirementCard title="GPA Requirement" content={course.gpaRequirement} icon={<Star className="h-5 w-5" />} />
                  )}
                  {course.workExperience && (
                    <RequirementCard title="Work Experience" content={course.workExperience} icon={<Briefcase className="h-5 w-5" />} />
                  )}
                </div>
                {/* Extra requirements badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {course.portfolioRequired && <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Portfolio Required</Badge>}
                  {course.interviewRequired && <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Interview Required</Badge>}
                  {course.moiAccepted && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Medium of Instruction Accepted</Badge>}
                  {course.scholarshipAvailable && <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Scholarship Available</Badge>}
                </div>
              </section>

              <Separator />

              {/* Scholarship info */}
              {course.scholarship && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#F37021]" /> Scholarship Information
                  </h2>
                  <Card className="border-[#F37021]/20 bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">{course.scholarship}</p>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Modules */}
              {modules.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#0066CC]" /> Modules / Subjects
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(modules as string[]).map((mod, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                          <CheckCircle className="h-4 w-4 text-[#0066CC] mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Career outcomes */}
              {careerOutcomes.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[#0066CC]" /> Career Outcomes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(careerOutcomes as string[]).map((career, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                          <ChevronRight className="h-4 w-4 text-[#F37021] shrink-0" />
                          <span className="text-sm text-gray-700">{career}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Placement / Internship / Co-op */}
              {(course.internship || course.placement || course.coop) && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[#F37021]" /> Work Integrated Learning
                    </h2>
                    <div className="space-y-3">
                      {course.internship && <WorkInfoItem title="Internship" content={course.internship} />}
                      {course.placement && <WorkInfoItem title="Placement" content={course.placement} />}
                      {course.coop && <WorkInfoItem title="Co-op" content={course.coop} />}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Sidebar - 1 col */}
            <div className="space-y-6">
              {/* Action card */}
              <Card className="border-2 border-[#0066CC]/10 sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Tuition Fee</p>
                    <p className="text-3xl font-bold text-[#0066CC]">
                      {currencySymbol}{course.tuition}
                    </p>
                    <p className="text-xs text-gray-400">{course.tuitionCurrency} per year</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Intake</span>
                      <span className="font-medium text-gray-900">{course.intake}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Level</span>
                      <span className="font-medium text-gray-900">{course.level}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">City</span>
                      <span className="font-medium text-gray-900">{course.city}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Action buttons */}
                  <div className="space-y-2.5">
                    <Button
                      onClick={onLeadOpen}
                      className="w-full min-h-[48px] text-base font-semibold rounded-xl"
                      style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
                    >
                      Apply / Enquire Now
                    </Button>

                    <Button
                      onClick={() => setEligibilityOpen(true)}
                      variant="outline"
                      className="w-full min-h-[44px] border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/5 rounded-xl"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Check Eligibility
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleSave}
                        variant="outline"
                        className="min-h-[44px] rounded-xl"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4 mr-1.5", isSaved && "fill-red-500 text-red-500")} />}
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        className="min-h-[44px] rounded-xl"
                        onClick={() => {
                          onNavigate('course-finder');
                          setTimeout(() => {
                            // Trigger compare from course finder
                          }, 100);
                        }}
                      >
                        <GitCompareArrows className="h-4 w-4 mr-1.5" /> Compare
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* University card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('university', course.university.slug)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {course.university.logo ? (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={course.university.logo} alt={course.university.name} className="w-full h-full object-contain p-1" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{course.university.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {course.city}, {course.university.country.shortName}
                      </p>
                    </div>
                  </div>
                  {course.university.ranking && (
                    <p className="text-xs text-gray-500">{course.university.ranking}</p>
                  )}
                  <Button variant="link" className="text-[#0066CC] p-0 h-auto text-sm">
                    View University <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Courses */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#0066CC]" /> Related Courses at {course.university.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((rc) => (
                  <Card key={rc.slug} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onNavigate('course', rc.slug)}>
                    <CardContent className="p-4">
                      <p className="text-xs text-[#F37021] font-semibold mb-1">{rc.level}</p>
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 group-hover:text-[#0066CC] transition-colors line-clamp-2">
                        {rc.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" /> {rc.duration}
                        <span>·</span>
                        <DollarSign className="h-3 w-3" /> {CURRENCY_SYMBOLS[rc.tuitionCurrency] || ''}{rc.tuition}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

      {/* Eligibility Dialog */}
      <Dialog open={eligibilityOpen} onOpenChange={setEligibilityOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#0066CC]" /> Eligibility Check
            </DialogTitle>
            <DialogDescription>Entry requirements for {course.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-[#0066CC] mb-1">English Requirement</p>
              <p className="text-sm text-gray-700">{course.englishRequirement}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-[#0066CC] mb-1">Academic Requirement</p>
              <p className="text-sm text-gray-700">{course.academicRequirement}</p>
            </div>
            {course.gpaRequirement && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-[#0066CC] mb-1">GPA Requirement</p>
                <p className="text-sm text-gray-700">{course.gpaRequirement}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {course.portfolioRequired && <Badge variant="secondary">Portfolio Required</Badge>}
              {course.interviewRequired && <Badge variant="secondary">Interview Required</Badge>}
              {course.moiAccepted && <Badge variant="secondary" className="bg-green-50 text-green-700">MOI Accepted</Badge>}
            </div>
            <Button
              onClick={() => {
                setEligibilityOpen(false);
                onLeadOpen();
              }}
              className="w-full min-h-[48px] font-semibold rounded-xl"
              style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
            >
              Get Expert Guidance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="bg-gray-50 border-gray-100">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function RequirementCard({ title, content, icon }: { title: string; content: string; icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#0066CC] mb-2">
          {icon}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}

function WorkInfoItem({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-[#0066CC] to-[#004C99] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Skeleton className="h-5 w-36 mb-6 bg-white/20" />
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-48 bg-white/20" />
              <Skeleton className="h-8 w-3/4 bg-white/20" />
              <Skeleton className="h-8 w-1/2 bg-white/20" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full bg-white/20" />
                <Skeleton className="h-7 w-20 rounded-full bg-white/20" />
                <Skeleton className="h-7 w-20 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32" />
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
