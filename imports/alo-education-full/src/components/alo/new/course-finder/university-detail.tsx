'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Trophy,
  GraduationCap,
  Globe2,
  Clock,
  DollarSign,
  Star,
  Heart,
  ChevronRight,
  Loader2,
  AlertCircle,
  Phone,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

interface UniversityDetailProps {
  universitySlug: string;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface UniversityData {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  state?: string;
  address?: string;
  ranking?: string;
  studentsCount?: string;
  accommodation?: string;
  popularSubjects: string;
  logo?: string;
  campusImage?: string;
  overview: string;
  internationalInfo?: string;
  whyChoose?: string;
  studentSupport?: string;
  studentLife?: string;
  careerInfo?: string;
  applicationProcess?: string;
  strengths: string;
  quickFacts: string;
  tuition: string;
  tuitionRange?: string;
  scholarshipAvailable: boolean;
  applicationFee?: string;
  depositInfo?: string;
  requiredDocuments: string;
  importantDeadlines: string;
  officialWebsite?: string;
  internationalUrl?: string;
  applicationUrl?: string;
  scholarshipUrl?: string;
  contactEmail?: string;
  country: {
    name: string;
    shortName: string;
    flag: string;
    slug: string;
    capital: string;
    currency: string;
  };
  courses: UniCourse[];
}

interface UniCourse {
  slug: string;
  name: string;
  level: string;
  subject: string;
  duration: string;
  tuition: string;
  tuitionCurrency: string;
  intake: string;
  scholarshipAvailable: boolean;
  deliveryMode?: string;
  degreeType?: string;
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

export function UniversityDetail({ universitySlug, onBack, onNavigate, onLeadOpen }: UniversityDetailProps) {
  const [uni, setUni] = useState<UniversityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  const fetchUniversity = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/universities/${universitySlug}`);
      if (!res.ok) throw new Error('University not found');
      const data = await res.json();
      setUni(data.university);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load university');
    } finally {
      setLoading(false);
    }
  }, [universitySlug]);

  useEffect(() => {
    fetchUniversity();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchUniversity]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sessionId = getSessionId();
      await fetch('/api/course-finder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'UNIVERSITY',
          itemSlug: universitySlug,
          action: isSaved ? 'remove' : 'save',
          sessionId,
        }),
      });
      setIsSaved(!isSaved);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const parseJson = (str: string): unknown[] => {
    try { return JSON.parse(str); } catch { return []; }
  };

  const parseObj = (str: string): Record<string, string> => {
    try { return JSON.parse(str); } catch { return {}; }
  };

  if (loading) return <UniversityDetailSkeleton />;

  if (error || !uni) {
    return (
      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-4 pt-32 pb-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">University Not Found</h2>
          <p className="text-gray-500 mb-6">The university you're looking for doesn't exist or has been removed.</p>
          <Button onClick={onBack} variant="outline" className="min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course Finder
          </Button>
        </div>
      </div>
    );
  }

  const strengths = parseJson(uni.strengths) as string[];
  const quickFacts = parseObj(uni.quickFacts);
  const popularSubjects = parseJson(uni.popularSubjects) as string[];
  const visibleCourses = showAllCourses ? uni.courses : uni.courses.slice(0, 6);
  const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$' };

  return (
    <div className="bg-white flex flex-col">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#0066CC] to-[#004C99] text-white relative overflow-hidden">
          {uni.campusImage && (
            <div className="absolute inset-0">
              <img src={uni.campusImage} alt={uni.name} className="w-full h-full object-cover opacity-20" />
            </div>
          )}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-6 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Course Finder
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {uni.logo ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={uni.logo} alt={uni.name} className="w-full h-full object-contain p-3" />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-10 w-10 text-white/60" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-white/80">{uni.country.flag} {uni.country.name}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">{uni.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" /> {uni.city}, {uni.country.shortName}
                  </span>
                  {uni.ranking && (
                    <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                      <Trophy className="h-3.5 w-3.5" /> {uni.ranking}
                    </span>
                  )}
                  {uni.studentsCount && (
                    <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                      <Users className="h-3.5 w-3.5" /> {uni.studentsCount} students
                    </span>
                  )}
                  {uni.scholarshipAvailable && (
                    <Badge className="bg-[#F37021] text-white border-0">Scholarships Available</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<MapPin className="h-5 w-5" />} label="Location" value={`${uni.city}, ${uni.country.shortName}`} />
                {uni.ranking && <StatCard icon={<Trophy className="h-5 w-5" />} label="Ranking" value={uni.ranking} />}
                {uni.studentsCount && <StatCard icon={<Users className="h-5 w-5" />} label="Students" value={uni.studentsCount} />}
                <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Courses" value={`${uni.courses.length} available`} />
              </div>

              {/* Overview */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#0066CC]" /> Overview
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">{uni.overview}</div>
              </section>

              <Separator />

              {/* Tuition range */}
              {uni.tuitionRange && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#F37021]" /> Tuition Range
                  </h2>
                  <Card className="border-[#F37021]/20 bg-gradient-to-r from-orange-50 to-amber-50">
                    <CardContent className="p-4">
                      <p className="text-lg font-bold text-[#0066CC]">{uni.tuitionRange}</p>
                      <p className="text-xs text-gray-500 mt-1">Per academic year (varies by course)</p>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Popular subjects */}
              {popularSubjects.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#F37021]" /> Popular Subjects
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {popularSubjects.map((s, i) => (
                        <Badge key={i} variant="secondary" className="bg-[#0066CC]/5 text-[#0066CC] border-[#0066CC]/10 px-3 py-1.5 text-sm font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Strengths */}
              {strengths.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#0066CC]" /> University Strengths
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                          <CheckCircle className="h-4 w-4 text-[#0066CC] mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700">{s}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Quick facts */}
              {Object.keys(quickFacts).length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#F37021]" /> Quick Facts
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(quickFacts).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <span className="text-sm font-medium text-gray-500">{key}</span>
                          <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] truncate">{val}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <Separator />

              {/* Courses list */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-[#0066CC]" /> Available Courses
                    <Badge variant="secondary" className="ml-1">{uni.courses.length}</Badge>
                  </h2>
                </div>

                {uni.courses.length === 0 ? (
                  <p className="text-gray-500 text-sm">No courses available at this time.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {visibleCourses.map((course) => (
                        <Card
                          key={course.slug}
                          className="hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => onNavigate('course', course.slug)}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] text-xs shrink-0">
                                    {course.level}
                                  </Badge>
                                  {course.scholarshipAvailable && (
                                    <Badge variant="secondary" className="bg-[#F37021]/10 text-[#F37021] text-xs shrink-0">
                                      Scholarship
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#0066CC] transition-colors line-clamp-2">
                                  {course.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {CURRENCY_SYMBOLS[course.tuitionCurrency] || ''}{course.tuition}</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {course.intake}</span>
                                  {course.deliveryMode && <span className="flex items-center gap-1"><Globe2 className="h-3 w-3" /> {course.deliveryMode}</span>}
                                </div>
                              </div>
                              <Button variant="ghost" className="shrink-0 text-[#0066CC] hover:bg-[#0066CC]/5 min-h-[44px]">
                                View Course <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {uni.courses.length > 6 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4 min-h-[44px] rounded-xl"
                        onClick={() => setShowAllCourses(!showAllCourses)}
                      >
                        {showAllCourses ? 'Show Less' : `Show All ${uni.courses.length} Courses`}
                      </Button>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action card */}
              <Card className="border-2 border-[#0066CC]/10 sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-[#0066CC] mx-auto mb-2" />
                    <h3 className="font-bold text-gray-900">{uni.name}</h3>
                    <p className="text-sm text-gray-500">{uni.city}, {uni.country.shortName}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2.5">
                    {uni.ranking && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Ranking</span>
                        <span className="font-medium text-gray-900">{uni.ranking}</span>
                      </div>
                    )}
                    {uni.studentsCount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Students</span>
                        <span className="font-medium text-gray-900">{uni.studentsCount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Courses</span>
                      <span className="font-medium text-gray-900">{uni.courses.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Scholarship</span>
                      <span className={cn('font-medium', uni.scholarshipAvailable ? 'text-green-600' : 'text-gray-400')}>
                        {uni.scholarshipAvailable ? 'Available' : 'Not listed'}
                      </span>
                    </div>
                    {uni.tuitionRange && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tuition</span>
                        <span className="font-medium text-[#0066CC] text-right max-w-[60%]">{uni.tuitionRange}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2.5">
                    <Button
                      onClick={onLeadOpen}
                      className="w-full min-h-[48px] text-base font-semibold rounded-xl"
                      style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D45A10')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F37021')}
                    >
                      <Phone className="h-4 w-4 mr-2" /> Contact / Enquire
                    </Button>

                    <Button
                      onClick={handleSave}
                      variant="outline"
                      className="w-full min-h-[44px] rounded-xl"
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn('h-4 w-4 mr-2', isSaved && 'fill-red-500 text-red-500')} />}
                      {isSaved ? 'Saved' : 'Save University'}
                    </Button>

                    {uni.officialWebsite && (
                      <a href={uni.officialWebsite} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full min-h-[44px] rounded-xl">
                          <ExternalLink className="h-4 w-4 mr-2" /> Official Website
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact info */}
              {uni.contactEmail && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Contact</h4>
                    <a
                      href={`mailto:${uni.contactEmail}`}
                      className="text-sm text-[#0066CC] hover:underline flex items-center gap-1.5"
                    >
                      {uni.contactEmail}
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function UniversityDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-[#0066CC] to-[#004C99] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Skeleton className="h-5 w-36 mb-6 bg-white/20" />
          <div className="flex gap-4">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-32 bg-white/20" />
              <Skeleton className="h-8 w-3/4 bg-white/20" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-28 rounded-full bg-white/20" />
                <Skeleton className="h-7 w-24 rounded-full bg-white/20" />
                <Skeleton className="h-7 w-24 rounded-full bg-white/20" />
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
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-32" />
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
