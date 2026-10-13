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
  MapPin, Award, BookOpen, Globe, Building2, ArrowRight, GraduationCap,
  CheckCircle2, Info, ExternalLink, HelpCircle,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function loadUniversity(slug: string) {
  try {
    return await db.university.findUnique({
      where: { slug },
      include: {
        courses: {
          where: { status: 'active' },
          orderBy: { name: 'asc' },
        },
        scholarships: {
          where: { status: 'active' },
          orderBy: { name: 'asc' },
        },
      },
    })
  } catch (e) {
    console.error('UniversityDetail: load error', e)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const uni = await loadUniversity(slug)
  if (!uni) {
    return { title: 'University not found — ALO Education' }
  }
  return {
    title: `${uni.name} — ALO Education`,
    description:
      uni.description ||
      `${uni.name} in ${uni.city || ''} ${uni.country}. Profile, courses, scholarships, and entry requirements from ALO Education.`,
    openGraph: {
      title: `${uni.name} — ALO Education`,
      description: uni.description || `${uni.name}, ${uni.country}`,
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

export default async function UniversityDetailPage({ params }: PageProps) {
  const { slug } = await params
  const uni = await loadUniversity(slug)

  if (!uni) {
    notFound()
  }

  // Parse facilities JSON safely
  let facilities: string[] = []
  if (uni.facilities) {
    try {
      const parsed = JSON.parse(uni.facilities)
      if (Array.isArray(parsed)) {
        facilities = parsed.map(String)
      }
    } catch {
      // not JSON, treat as comma-separated
      facilities = String(uni.facilities).split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  // Static-ish application process (consistent across universities — this is the ALO process, not institution-specific)
  const applicationProcess = [
    { step: 'Book a free consultation with an ALO Education counselor.', icon: '01' },
    { step: 'Shortlist courses based on your profile and budget.', icon: '02' },
    { step: 'Submit academic transcripts, passport, and English test scores.', icon: '03' },
    { step: 'We submit the application to the university on your behalf.', icon: '04' },
    { step: 'Receive a conditional or unconditional offer letter.', icon: '05' },
    { step: 'Pay the deposit and receive a CAS / Confirmation of Acceptance.', icon: '06' },
    { step: 'Apply for the student visa with ALO visa-team support.', icon: '07' },
  ]

  return (
    <PublicSiteLayout>
      {/* Header */}
      <section
        className="text-white py-12 lg:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-xs mb-4">
            <Link href="/universities" className="text-gray-300 hover:text-white">
              ← All Universities
            </Link>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ background: '#E8501A' }}
            >
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">{uni.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {uni.city && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" /> {uni.city}, {uni.country}
                  </span>
                )}
                {!uni.city && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                    <Globe className="h-3.5 w-3.5" /> {uni.country}
                  </span>
                )}
                {typeof uni.ranking === 'number' && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                    <Award className="h-3.5 w-3.5" /> QS Ranking #{uni.ranking}
                  </span>
                )}
                {uni.type && (
                  <span className="inline-flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                    <Building2 className="h-3.5 w-3.5" /> {uni.type}
                  </span>
                )}
                {uni.scholarshipAvailable && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                    style={{ background: 'rgba(232,80,26,0.2)', color: '#FFB347' }}
                  >
                    <Award className="h-3.5 w-3.5" /> Scholarships Available
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/book-consultation">
                <Button className="h-12 px-5 text-white font-semibold" style={{ background: '#E8501A' }}>
                  Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              {uni.website && (
                <a href={uni.website} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="h-12 px-5 border-white/30 text-white hover:bg-white/10"
                  >
                    Visit Website <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — main sections */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="Overview" icon={Info}>
              {uni.description ? (
                <p className="text-sm text-[#1A2332] leading-relaxed">{uni.description}</p>
              ) : (
                <MissingInfo label="Overview" />
              )}
            </SectionCard>

            <SectionCard title="Location" icon={MapPin}>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#888]">Country</div>
                  <div className="font-medium text-[#1A2332]">{uni.country}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#888]">City</div>
                  <div className="font-medium text-[#1A2332]">{uni.city || 'Not specified'}</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Why Choose This University" icon={CheckCircle2}>
              {facilities.length > 0 ? (
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  {facilities.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#10B981' }} />
                      <span className="text-[#1A2332]">{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <MissingInfo label="Why-choose highlights" />
              )}
            </SectionCard>

            {/* Popular Courses */}
            <SectionCard title={`Popular Courses (${uni.courses.length})`} icon={BookOpen}>
              {uni.courses.length === 0 ? (
                <MissingInfo label="Course" />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {uni.courses.map((c) => (
                    <div
                      key={c.id}
                      className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#1A2332]">{c.name}</h4>
                          {c.level && (
                            <Badge variant="outline" className="text-[10px] mt-1">{c.level}</Badge>
                          )}
                        </div>
                        {c.scholarshipAvailable && (
                          <Badge className="text-[10px]" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: 0 }}>
                            <Award className="h-3 w-3 mr-1" />Scholarship
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-[#555555] space-y-0.5">
                        {c.field && <div>Field: {c.field}</div>}
                        {c.duration && <div>Duration: {c.duration}</div>}
                        {typeof c.tuitionFee === 'number' && (
                          <div>
                            Tuition: {c.currency} {c.tuitionFee.toLocaleString()}/yr
                          </div>
                        )}
                      </div>
                      {c.slug ? (
                        <Link href={`/course/${c.slug}`}>
                          <Button variant="ghost" className="h-7 mt-2 px-0 text-xs font-semibold" style={{ color: '#0057B8' }}>
                            View Course <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/book-consultation">
                          <Button variant="ghost" className="h-7 mt-2 px-0 text-xs font-semibold" style={{ color: '#E8501A' }}>
                            Ask About This Course <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Scholarships */}
            <SectionCard title={`Scholarships (${uni.scholarships.length})`} icon={Award}>
              {uni.scholarships.length === 0 ? (
                <MissingInfo label="Scholarship" />
              ) : (
                <ul className="space-y-3">
                  {uni.scholarships.map((s) => (
                    <li key={s.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-[#1A2332]">{s.name}</h4>
                        {s.amount && (
                          <Badge className="text-xs" style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}>
                            {s.amount}
                          </Badge>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-[#555555] mt-1">{s.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#555555]">
                        {s.type && <span>Type: {s.type}</span>}
                        {s.deadline && <span>Deadline: {new Date(s.deadline).toLocaleDateString()}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Entry Requirements */}
            <SectionCard title="Entry Requirements" icon={CheckCircle2}>
              {uni.fees ? (
                <p className="text-sm text-[#1A2332] leading-relaxed">{uni.fees}</p>
              ) : (
                <MissingInfo label="Entry requirement" />
              )}
            </SectionCard>

            {/* Application Process */}
            <SectionCard title="Application Process" icon={BookOpen}>
              <ol className="space-y-3">
                {applicationProcess.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: '#0057B8' }}
                    >
                      {i + 1}
                    </div>
                    <div className="text-sm text-[#1A2332] pt-1">{s.step}</div>
                  </li>
                ))}
              </ol>
            </SectionCard>

            {/* FAQ */}
            <SectionCard title="Frequently Asked Questions" icon={HelpCircle}>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="q1" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                    How do I apply to {uni.name}?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#555555]">
                    Book a free consultation with ALO Education. We handle the application on your
                    behalf using your academic transcripts, passport, and English test scores.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                    What are the English requirements?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#555555]">
                    English requirements vary by course and level. Most programs accept IELTS, PTE
                    Academic, TOEFL iBT, Duolingo, and LanguageCert. Your ALO counselor will
                    confirm the exact score required for your chosen course.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3" className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-[#1A2332]">
                    Are scholarships available for Bangladeshi students?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-[#555555]">
                    {uni.scholarshipAvailable
                      ? 'Yes — this university offers scholarship options. See the Scholarships section above for current listings, or ask your counselor for the latest opportunities.'
                      : 'Scholarship availability is not currently verified. Please check with an ALO Education counselor for the most up-to-date scholarship options.'}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SectionCard>
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-4">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg text-[#1A2332]">At a glance</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888]">Country</span>
                  <span className="font-medium text-[#1A2332]">{uni.country}</span>
                </div>
                {uni.city && (
                  <div className="flex justify-between">
                    <span className="text-[#888]">City</span>
                    <span className="font-medium text-[#1A2332]">{uni.city}</span>
                  </div>
                )}
                {typeof uni.ranking === 'number' && (
                  <div className="flex justify-between">
                    <span className="text-[#888]">QS Ranking</span>
                    <span className="font-medium text-[#1A2332]">#{uni.ranking}</span>
                  </div>
                )}
                {uni.type && (
                  <div className="flex justify-between">
                    <span className="text-[#888]">Type</span>
                    <span className="font-medium text-[#1A2332] capitalize">{uni.type}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#888]">Scholarships</span>
                  <span className="font-medium text-[#1A2332]">
                    {uni.scholarshipAvailable ? 'Available' : 'Check with counselor'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888]">Courses listed</span>
                  <span className="font-medium text-[#1A2332]">{uni.courses.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-0 shadow-md text-white"
            >
              <CardContent className="p-6" style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)', borderRadius: '0.75rem' }}>
                <h3 className="font-bold text-lg">Ready to apply?</h3>
                <p className="text-sm text-orange-50 mt-1">
                  Book a free consultation with an ALO Education counselor and start your
                  application today.
                </p>
                <Link href="/book-consultation">
                  <Button className="mt-4 w-full h-12 bg-white text-[#E8501A] hover:bg-gray-50 font-semibold">
                    Book Consultation <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-[#1A2332] text-sm">Disclaimer</h3>
                <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                  University information is provided by ALO Education&apos;s admissions database and
                  may change without notice. Always confirm entry requirements, deadlines, and
                  tuition fees with an ALO Education counselor before submitting your application.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
