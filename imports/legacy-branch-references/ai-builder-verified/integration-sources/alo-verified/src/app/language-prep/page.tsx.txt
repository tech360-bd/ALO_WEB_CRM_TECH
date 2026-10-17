import Link from 'next/link'
import PublicSiteLayout from '@/components/alo/layout/PublicSiteLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, BookOpen, GraduationCap, Award, FileText, Languages,
  ClipboardCheck, BarChart3, Brain, Sparkles, Globe, HelpCircle, Info,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'English Language Preparation — ALO Education',
  description:
    'English Language Preparation support from ALO Education: IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo English Test, OIETC/ELLT, Oxford ELLT, LanguageCert, OET, GRE, GMAT, SAT, ACT, MOI Guidance, English Test Comparison, Free English Placement Test. Preparation support — not guaranteed scores.',
  keywords: ['IELTS preparation', 'PTE preparation', 'TOEFL preparation', 'Duolingo English Test', 'ALO Education'],
  openGraph: {
    title: 'English Language Preparation — ALO Education',
    description: 'Preparation support for IELTS, PTE, TOEFL, Duolingo, GRE, GMAT, SAT, ACT and more.',
    type: 'website',
  },
}

interface TestCard {
  name: string
  shortDescription: string
  /** Coming-soon flag — when true, the Learn More button shows "Coming Soon" honestly. */
  comingSoon?: boolean
}

const TESTS: TestCard[] = [
  { name: 'IELTS Academic', shortDescription: 'International English Language Testing System — accepted by most universities worldwide.' },
  { name: 'IELTS UKVI', shortDescription: 'UKVI-approved IELTS for UK visa and immigration purposes (foundation / pre-sessional courses).' },
  { name: 'PTE Academic', shortDescription: 'Pearson Test of English — computer-based, results in ~5 days, accepted by many UK / Australian universities.' },
  { name: 'TOEFL iBT', shortDescription: 'Test of English as a Foreign Language (internet-based) — commonly required by US universities.' },
  { name: 'Duolingo English Test', shortDescription: 'Online test in ~1 hour. Accepted by many universities for admission but NOT usually for visa decisions.' },
  { name: 'OIETC / ELLT', shortDescription: 'Oxford International English Test Centre / English Language Level Test — accepted by some pathway providers.' },
  { name: 'Oxford ELLT', shortDescription: 'Oxford English Language Level Test — accepted by a subset of UK universities.' },
  { name: 'LanguageCert', shortDescription: 'LanguageCert International ESOL — accepted by some UK and EU universities.' },
  { name: 'OET (Occupational English Test)', shortDescription: 'English test for healthcare professionals — accepted by medical / nursing regulators.' },
  { name: 'GRE', shortDescription: 'Graduate Record Examinations — required for many US postgraduate programs.' },
  { name: 'GMAT', shortDescription: 'Graduate Management Admission Test — required for many MBA / business postgraduate programs.' },
  { name: 'SAT', shortDescription: 'Standardized test widely used for US undergraduate admissions.' },
  { name: 'ACT', shortDescription: 'US college admissions test — alternative to the SAT for undergraduate entry.' },
  { name: 'MOI Guidance', shortDescription: 'Medium of Instruction guidance — for students whose previous education was in English and who may qualify for an MOI waiver.' },
  { name: 'English Test Comparison', shortDescription: 'A side-by-side comparison of all major tests (cost, validity, acceptance, format) so you can choose the right one.' },
  { name: 'Free English Placement Test', shortDescription: 'A free placement test to estimate your current English level before committing to a test or course.' },
]

interface SupportCard {
  icon: LucideIcon
  title: string
  desc: string
  color: string
}

const SUPPORT_CARDS: SupportCard[] = [
  {
    icon: HelpCircle,
    title: 'Test Selection',
    desc: 'We help you choose the right test for your destination, university, and visa — so you don\'t waste money on the wrong one.',
    color: '#0057B8',
  },
  {
    icon: ClipboardCheck,
    title: 'Free Assessment',
    desc: 'Take a free English placement test and get a starting-level estimate before committing to any preparation program.',
    color: '#10B981',
  },
  {
    icon: BarChart3,
    title: 'Score Planning',
    desc: 'Build a score plan: target band → weekly study hours → test date. Realistic, not promised.',
    color: '#E8501A',
  },
  {
    icon: BookOpen,
    title: 'Study Materials',
    desc: 'Practice sets, official past papers (where available), and structured study plans per test.',
    color: '#7c3aed',
  },
  {
    icon: FileText,
    title: 'Mock Tests',
    desc: 'Mock speaking sessions, writing sample reviews, and full-length mock tests with feedback.',
    color: '#0891b2',
  },
  {
    icon: Brain,
    title: 'Expert Support',
    desc: 'Connect with certified trainers for group or one-to-one coaching (where available).',
    color: '#dc2626',
  },
]

export default function LanguagePrepPage() {
  return (
    <PublicSiteLayout>
      {/* Hero */}
      <section
        className="text-white py-14 lg:py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0057B8 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Badge
            className="mb-4 border"
            style={{ background: 'rgba(232,80,26,0.15)', color: '#FFB347', borderColor: 'rgba(232,80,26,0.3)' }}
          >
            English Language Preparation
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
            Prepare for Your <span style={{ color: '#FFB347' }}>English Test</span>
          </h1>
          <p className="mt-3 text-gray-200 max-w-2xl text-base lg:text-lg">
            Preparation support for IELTS, PTE, TOEFL iBT, Duolingo, OIETC / ELLT, Oxford ELLT,
            LanguageCert, OET, GRE, GMAT, SAT, ACT, MOI Guidance, and more. We help you choose,
            plan, and prepare — but we do not guarantee any specific score.
          </p>
        </div>
      </section>

      {/* Tests grid */}
      <section className="bg-[#F7F9FC] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1A2332]">English &amp; Standardized Tests</h2>
            <p className="text-sm text-[#555555] mt-1">
              Each card below summarizes the test and links to more detail. Where a dedicated page
              has not yet been built, we say so honestly — rather than fabricating information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTS.map((t) => (
              <Card
                key={t.name}
                className="border-0 shadow-sm hover:shadow-lg transition-all group flex flex-col overflow-hidden"
              >
                <div className="h-1.5" style={{ background: '#0057B8' }} />
                <CardContent className="p-5 flex flex-col flex-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(0,87,184,0.1)' }}
                  >
                    <Languages className="h-6 w-6" style={{ color: '#0057B8' }} />
                  </div>
                  <h3 className="font-semibold text-[#1A2332] group-hover:text-[#E8501A] transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-sm text-[#555555] mt-2 flex-1">{t.shortDescription}</p>
                  <div className="mt-4 pt-2">
                    {t.comingSoon ? (
                      <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold text-sm group/btn"
                        style={{ color: '#0057B8' }}
                      >
                        Learn More
                        <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ALO support */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge
              className="mb-3"
              style={{ background: 'rgba(232,80,26,0.1)', color: '#E8501A', border: 0 }}
            >
              ALO Preparation Support
            </Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">
              What ALO Provides — <span style={{ color: '#E8501A' }}>Preparation Support</span>, Not Guaranteed Scores
            </h2>
            <p className="text-[#555555] mt-2 max-w-2xl mx-auto">
              We help you choose the right test, plan your score, and prepare with materials and
              mock tests. Your final score depends on your preparation and test-day performance —
              ALO does not guarantee any specific band or score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SUPPORT_CARDS.map((c) => {
              const Icon = c.icon
              return (
                <Card
                  key={c.title}
                  className="border-0 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden"
                >
                  <div className="h-1.5" style={{ background: c.color }} />
                  <CardContent className="p-6 flex flex-col">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${c.color}15` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: c.color }} />
                    </div>
                    <h3 className="font-semibold text-[#1A2332]">{c.title}</h3>
                    <p className="text-sm text-[#555555] mt-2">{c.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* MOI / Duolingo / Duolingo visa note */}
      <section className="bg-[#F7F9FC] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border border-amber-200 bg-amber-50/40 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(232,80,26,0.1)' }}
                >
                  <Info className="h-5 w-5" style={{ color: '#E8501A' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A2332]">
                    Important: English test for admission ≠ visa
                  </h3>
                  <p className="text-sm text-[#555555] mt-1">
                    Some universities accept Duolingo or MOI waivers for admission, but most
                    embassies require a SELT (Secure English Language Test) like IELTS UKVI or PTE
                    for the visa decision. Always confirm both with your counselor before booking a
                    test — taking the wrong test wastes the fee and the time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section
        className="text-white py-14"
        style={{ background: 'linear-gradient(135deg, #E8501A 0%, #FFB347 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold">Not sure which test to take?</h2>
          <p className="text-orange-50 max-w-xl mx-auto">
            Book a free consultation. Our counselors will help you choose the right test for your
            destination, university, and visa — and build a preparation plan that fits your
            timeline.
          </p>
          <Link href="/book-consultation">
            <Button className="h-12 px-8 bg-white text-[#E8501A] hover:bg-gray-50 font-semibold">
              Book Free Consultation <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
