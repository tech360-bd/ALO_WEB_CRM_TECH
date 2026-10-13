import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  MapPin, BookOpen, ArrowRight, GraduationCap, CheckCircle2, Info,
  Award, Globe, Clock, PoundSterling, HelpCircle, Briefcase,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadCourse(slug: string) {
  try {
    // Try by slug first; fallback to id (slug may be null for seeded courses)
    return await db.course.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        status: 'active',
      },
      include: {
        university: true,
      },
    })
  } catch (e) {
    console.error('CourseDetail: load error', e)
    return null
  }
}

async function loadRelatedCourses(courseId: string, universityId: string) {
  try {
    return await db.course.findMany({
      where: {
        status: 'active',
        universityId,
        id: { not: courseId },
      },
      take: 4,
      orderBy: { name: 'asc' },
      include: { university: { select: { name: true, slug: true } } },
    })
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const course = await loadCourse(slug)
  if (!course) {
    return { title: 'Course not found — ALO Education' }
  }
  return {
    title: `${course.name} — ALO Education`,
    description:
      course.description ||
      `${course.name} at ${course.university?.name || 'a partner university'}. ${course.level || ''} ${course.field || ''} course.`,
    openGraph: {
      title: `${course.name} — ALO Education`,
      description: course.description || '',
      type: 'website',
    },
  }
}

function MissingInfo({ label }: { label: string }) {
  return (
    <div className="text-sm italic text-[#888] flex items-start gap-2">
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{label} Information not currently verified. Please check with an ALO Education counselor.</span>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="border-b border-gray-50">
        <CardTitle className="flex items-center gap-2 text-lg text-[#1A2332]">
          <Icon className="h-5 w-5" style={{ color: '#0057B8' }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}

function getCountryFlag(country: string): string {
  const map: Record<string, string> = {
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
    Canada: '🇨🇦',
    Australia: '🇦🇺',
    Germany: '🇩🇪',
    Malaysia: '🇲🇾',
    Europe: '🇪🇺',
  }
  return map[country] || '🌍'
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const course = await loadCourse(slug)

  if (!course) {
    notFound()
  }

  const related = await loadRelatedCourses(course.id, course.universityId)

  // Parse careerPaths if present
  let careerPaths: string[] = []
  if (course.careerPaths) {
    try {
      const parsed = JSON.parse(course.careerPaths)
      if (Array.isArray(parsed)) careerPaths = parsed.map(String)
    } catch {
      careerPaths = String(course.careerPaths).split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  return (
    <PublicSiteLayout>
      {/* Header */}
      <section
        className="text-white py-12 lg:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-xs mb-4">
            <Link href="/course-finder" className="text-gray-300 hover:text-white">
              ← Course Finder
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0"
              style={{ background: '#E8501A' }}
            >
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {course.level && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs">
                    <BookOpen className="h-3 w-3" /> {course.level}
                  </span>
                )}
                {course.field && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1 text-xs">
                    <Award className="h-3 w-3" /> {course.field}
                  </span>
                )}
                {course.scholarshipAvailable && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                    style={{ background: 'rgba(232,80,26,0.2)', color: '#FFB347' }}
                  >
                    <Award className="h-3 w-3" /> Scholarship Available
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">{course.name}</h1>
              {course.university && (
                <Link
                  href={`/universities/${course.university.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-gray-200 hover:text-white"
                >
                  <GraduationCap className="h-4 w-4" />
                  {course.university.name}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/book-consultation">
                <Button className="h-12 px-5 text-white font-semibold" style={{ background: '#E8501A' }}>
                  Apply Now <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/book-consultation">
                <Button
                  variant="outline"
                  className="h-12 px-5 border-white/30 text-white hover:bg-white/10"
                >
                  Book Consultation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick facts */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#888]">Country</div>
                    <div className="font-medium text-[#1A2332] flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {course.university?.country ? getCountryFlag(course.university.country) : ''} {course.university?.country || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#888]">Level</div>
                    <div className="font-medium text-[#1A2332]">{course.level || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#888]">Duration</div>
                    <div className="font-medium text-[#1A2332] flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#888]">Tuition / yr</div>
                    <div className="font-medium text-[#1A2332] flex items-center gap-1">
                      <PoundSterling className="h-3.5 w-3.5 text-[#10B981]" />
                      {typeof course.tuitionFee === 'number'
                        ? `${course.currency} ${course.tuitionFee.toLocaleString()}`
                        : '—'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SectionCard title="Course Overview" icon={Info}>
              {course.description ? (
                <p className="text-sm text-[#1A2332] leading-relaxed">{course.description}</p>
              ) : (
                <MissingInfo label="Course overview" />
              )}
            </SectionCard>

            <SectionCard title="Entry Requirements" icon={CheckCircle2}>
              {course.entryRequirements ? (
                <p className="text-sm text-[#1A2332] leading-relaxed whitespace-pre-line">
                  {course.entryRequirements}
                </p>
              ) : (
                <MissingInfo label="Entry requirement" />
              )}
            </SectionCard>

            <SectionCard title="English Language Requirements" icon={Globe}>
              {course.englishRequirement ? (
                <p className="text-sm text-[#1A2332] leading-relaxed whitespace-pre-line">
                  {course.englishRequirement}
                </p>
              ) : (
                <MissingInfo label="English requirement" />
              )}
              <div className="mt-3 text-xs text-[#555555]">
                Need help choosing an English test?{' '}
                <Link href="/language-prep" className="font-semibold" style={{ color: '#0057B8' }}>
                  See our Language Preparation page <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
            </SectionCard>

            <SectionCard title="Career Paths" icon={Briefcase}>
              {careerPaths.length > 0 ? (
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  {careerPaths.map((cp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#0057B8' }} />
                      <span className="text-[#1A2332]">{cp}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <MissingInfo label="Career path" />
              )}
            </SectionCard>

            {/* Related Courses */}
            {related.length > 0 && (
              <SectionCard title="Related Courses" icon={BookOpen}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((rc) => (
                    <Link
                      key={rc.id}
                      href={rc.slug ? `/course/${rc.slug}` : `/universities/${rc.university.slug}`}
                      className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-all block"
                    >
                      <h4 className="text-sm font-semibold text-[#1A2332]">{rc.name}</h4>
                      <div className="text-xs text-[#555555] mt-1">
                        {rc.university.name}
                        {rc.level ? ` · ${rc.level}` : ''}
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* FAQ */}
            <SectionCard title="Frequently Asked Questions" icon={HelpCircle}>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="q1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                    How do I apply for this course?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#555555]">
                    Book a free consultation with ALO Education. We&apos;ll review your profile and
                    handle the application on your behalf using your academic transcripts and
                    English test scores.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                    Is a scholarship available for this course?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#555555]">
                    {course.scholarshipAvailable
                      ? 'Scholarship options may be available. Your ALO Education counselor will confirm current scholarship eligibility and deadlines for this course.'
                      : 'Scholarship availability is not currently verified. Please check with an ALO Education counselor for the most up-to-date scholarship options.'}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                    What are the English test requirements?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#555555]">
                    {course.englishRequirement
                      ? course.englishRequirement
                      : 'English requirements are not currently verified. Most universities accept IELTS, PTE, TOEFL iBT, Duolingo, and LanguageCert — your counselor will confirm the exact score required.'}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card
              className="border-0 shadow-md text-white"
            >
              <CardContent className="p-6" style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)', borderRadius: '0.75rem' }}>
                <h3 className="font-bold text-lg">Interested in this course?</h3>
                <p className="text-sm text-orange-50 mt-1">
                  Book a free consultation and our counselors will check your eligibility and start
                  your application today.
                </p>
                <Link href="/book-consultation">
                  <Button className="mt-4 w-full h-12 bg-white text-[#E8501A] hover:bg-gray-50 font-semibold">
                    Apply Now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/book-consultation">
                  <Button className="mt-2 w-full h-12 bg-[#1A2332]/30 hover:bg-[#1A2332]/40 text-white font-semibold">
                    Book Consultation
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {course.university && (
              <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="text-lg text-[#1A2332]">University</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2 text-sm">
                  <Link
                    href={`/universities/${course.university.slug}`}
                    className="font-semibold text-[#1A2332] hover:text-[#E8501A] transition-colors block"
                  >
                    {course.university.name}
                  </Link>
                  <div className="text-xs text-[#555555] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {course.university.city ? `${course.university.city}, ` : ''}
                    {course.university.country}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-[#1A2332] text-sm">Disclaimer</h3>
                <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                  Course information is provided by ALO Education&apos;s admissions database and
                  may change without notice. Always confirm entry requirements, deadlines, and
                  tuition fees with your counselor before submitting your application.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
