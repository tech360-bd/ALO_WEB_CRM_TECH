'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search, BookOpen, GraduationCap, FileCheck, Languages,
  Award, Plane, FileText, Calendar, Flag, Globe,
  Mic, ShieldCheck, Star, MessageSquare, Calculator,
  ClipboardList, ListChecks, HelpCircle, ArrowRight,
  Compass, MapPin, Building2, FileSignature,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { cn } from '@/lib/utils'

type LucideIcon = typeof BookOpen

interface Resource {
  id: string
  title: string
  description: string
  category: string
  icon: LucideIcon
  href: string
  tag?: string
}

interface ResourceGroup {
  label: string
  resources: Resource[]
}

const RESOURCES: Resource[] = [
  // Getting Started
  { id: 'study-abroad-guide', title: 'Study Abroad Guide', description: 'A complete walkthrough of studying abroad — from choosing a country to settling in.', category: 'Getting Started', icon: Compass, href: '/student/course-finder', tag: 'Popular' },
  { id: 'course-university-research', title: 'Course & University Research', description: 'Tools and tips to shortlist courses, compare universities, and find your best fit.', category: 'Getting Started', icon: BookOpen, href: '/student/course-finder' },
  { id: 'entry-requirements', title: 'Entry Requirements', description: 'Understand academic, English, and visa entry requirements for each destination.', category: 'Getting Started', icon: FileCheck, href: '/student/course-finder' },
  { id: 'english-language-tests', title: 'English Language Tests', description: 'Compare IELTS, PTE, Duolingo, TOEFL — pick the right test for your target university.', category: 'Getting Started', icon: Languages, href: '#', tag: 'Popular' },
  { id: 'scholarship-information', title: 'Scholarship Information', description: 'Browse scholarships, grants, and bursaries available to international students.', category: 'Getting Started', icon: Award, href: '/student/scholarships' },
  { id: 'visa-requirements', title: 'Visa Requirements', description: 'Country-by-country student visa requirements, including financial proof and biometrics.', category: 'Getting Started', icon: Plane, href: '/student/visa' },
  { id: 'sop-document-guidance', title: 'SOP & Document Guidance', description: 'Templates, samples, and AI tools to draft a winning Statement of Purpose.', category: 'Getting Started', icon: FileSignature, href: '/student/ai-sop', tag: 'AI' },
  { id: 'application-timeline', title: 'Application Timeline', description: 'Plan your application from shortlisting to enrollment with this month-by-month timeline.', category: 'Getting Started', icon: Calendar, href: '/student/applications' },

  // Study Destinations
  { id: 'study-uk', title: 'Study in the UK', description: 'UK universities, Tier 4 visa, CAS, credibility interview, and post-study work visa.', category: 'Study Destinations', icon: Flag, href: '/student/course-finder' },
  { id: 'study-australia', title: 'Study in Australia', description: 'Australian universities, GTE / GS requirement, Subclass 500 visa, and PR pathways.', category: 'Study Destinations', icon: Flag, href: '/student/course-finder' },
  { id: 'study-canada', title: 'Study in Canada', description: 'Canadian DLI list, study permit, SDS program, and post-graduation work permit.', category: 'Study Destinations', icon: Flag, href: '/student/course-finder' },
  { id: 'study-usa', title: 'Study in the USA', description: 'US universities, F-1 visa, I-20, SEVIS fee, and OPT / CPT work authorization.', category: 'Study Destinations', icon: Flag, href: '/student/course-finder' },
  { id: 'study-europe', title: 'Study in Europe', description: 'Schengen study visas, affordable tuition in Germany, Ireland, Netherlands, and more.', category: 'Study Destinations', icon: Globe, href: '/student/course-finder' },

  // Test Preparation
  { id: 'ielts-resources', title: 'IELTS Resources', description: 'Free practice tests, band descriptors, and speaking prompts for IELTS Academic & UKVI.', category: 'Test Preparation', icon: BookOpen, href: '#' },
  { id: 'pte-resources', title: 'PTE Resources', description: 'PTE Academic pattern, scoring, mock tests, and section-by-section strategies.', category: 'Test Preparation', icon: BookOpen, href: '#' },
  { id: 'duolingo-test-guide', title: 'Duolingo Test Guide', description: 'Duolingo English Test format, accepted universities, and preparation tips.', category: 'Test Preparation', icon: BookOpen, href: '#' },
  { id: 'toefl-guide', title: 'TOEFL Guide', description: 'TOEFL iBT structure, scoring, and best practices to score above 100.', category: 'Test Preparation', icon: BookOpen, href: '#' },
  { id: 'academic-tests', title: 'Academic Tests: GRE, GMAT, SAT, ACT', description: 'Standardized test guides for graduate and undergraduate admissions.', category: 'Test Preparation', icon: GraduationCap, href: '#' },

  // Visa Success
  { id: 'student-visa-faqs', title: 'Student Visa FAQs', description: 'Answers to the 50 most-asked student visa questions, from financial proof to biometrics.', category: 'Visa Success', icon: HelpCircle, href: '#' },
  { id: 'financial-requirement-guidance', title: 'Financial Requirement Guidance', description: 'Calculate the funds you need to show and how to document them correctly.', category: 'Visa Success', icon: FileText, href: '/student/financial-proof' },
  { id: 'credibility-interview-prep', title: 'Credibility Interview Preparation', description: 'Sample questions, mock interviews, and proven answering frameworks.', category: 'Visa Success', icon: Mic, href: '/student/interview-practice', tag: 'Practice' },
  { id: 'visa-refusal-prevention', title: 'Visa Refusal Prevention', description: 'Common refusal reasons and how to bulletproof your application before submission.', category: 'Visa Success', icon: ShieldCheck, href: '/student/visa-readiness' },
  { id: 'visa-success-stories', title: 'Visa Success Stories', description: 'Real stories from students who secured their visa with ALO Education.', category: 'Visa Success', icon: Star, href: '#' },
  { id: 'student-reviews-testimonials', title: 'Student Reviews & Testimonials', description: 'Verified reviews from students about their universities, courses, and ALO support.', category: 'Visa Success', icon: MessageSquare, href: '#' },

  // Tools & Checklists
  { id: 'study-cost-calculator', title: 'Study Cost Calculator', description: 'Estimate tuition, living, and travel costs for your destination in seconds.', category: 'Tools & Checklists', icon: Calculator, href: '#', tag: 'Tool' },
  { id: 'intake-planning-tool', title: 'Intake Planning Tool', description: 'Plan your intake timeline — Spring, Summer, or Fall — based on your test dates.', category: 'Tools & Checklists', icon: Calendar, href: '#', tag: 'Tool' },
  { id: 'document-checklist', title: 'Document Checklist', description: 'Master checklist of every document you need for application and visa submission.', category: 'Tools & Checklists', icon: ClipboardList, href: '/student/documents' },
  { id: 'english-test-comparison', title: 'English Test Comparison', description: 'Side-by-side comparison of IELTS, PTE, Duolingo, and TOEFL — difficulty, cost, scores.', category: 'Tools & Checklists', icon: ListChecks, href: '#' },
  { id: 'admission-faqs', title: 'Admission FAQs', description: 'Frequently asked questions about admission cycles, offers, deferrals, and deposits.', category: 'Tools & Checklists', icon: HelpCircle, href: '#' },
  { id: 'language-test-faqs', title: 'Language Test FAQs', description: 'FAQs on test booking, rescheduling, score reporting, and validity periods.', category: 'Tools & Checklists', icon: HelpCircle, href: '#' },
  { id: 'visa-faqs', title: 'Visa FAQs', description: 'Visa-specific FAQs on appointment booking, biometrics, processing times, and refusals.', category: 'Tools & Checklists', icon: HelpCircle, href: '/student/visa' },
  { id: 'pre-departure-faqs', title: 'Pre-departure FAQs', description: 'Everything you need to know before you fly — packing, SIM, forex, and arrival.', category: 'Tools & Checklists', icon: HelpCircle, href: '/student/pre-departure' },
]

const GROUP_ORDER = ['Getting Started', 'Study Destinations', 'Test Preparation', 'Visa Success', 'Tools & Checklists']

const GROUP_META: Record<string, { label: string; color: string; bg: string }> = {
  'Getting Started': { label: 'Getting Started', color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]' },
  'Study Destinations': { label: 'Study Destinations', color: 'text-purple-600', bg: 'bg-purple-50' },
  'Test Preparation': { label: 'Test Preparation', color: 'text-[#E8501A]', bg: 'bg-[#FFF7ED]' },
  'Visa Success': { label: 'Visa Success', color: 'text-green-600', bg: 'bg-green-50' },
  'Tools & Checklists': { label: 'Tools & Checklists', color: 'text-amber-600', bg: 'bg-amber-50' },
}

const TAG_META: Record<string, string> = {
  'Popular': 'bg-[#FFF7ED] text-[#E8501A] border-[#FFE0C2]',
  'AI': 'bg-purple-50 text-purple-700 border-purple-200',
  'Practice': 'bg-green-50 text-green-700 border-green-200',
  'Tool': 'bg-[#EFF6FF] text-[#0057B8] border-[#BED9F5]',
}

export default function ResourcesPage() {
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState<string>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return RESOURCES.filter((r) => {
      const matchesQuery = q === '' || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      const matchesGroup = activeGroup === 'All' || r.category === activeGroup
      return matchesQuery && matchesGroup
    })
  }, [query, activeGroup])

  const groupedFiltered = useMemo(() => {
    const map = new Map<string, Resource[]>()
    filtered.forEach((r) => {
      const arr = map.get(r.category) || []
      arr.push(r)
      map.set(r.category, arr)
    })
    return GROUP_ORDER
      .filter((g) => map.has(g))
      .map((g) => ({ category: g, resources: map.get(g)! }))
  }, [filtered])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Resource Hub"
        description="A curated library of guides, tools, and checklists for every step of your study-abroad journey."
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Resources" value={RESOURCES.length} icon={BookOpen} accent="blue" hint="Curated guides" />
        <StatCard label="Categories" value={GROUP_ORDER.length} icon={ListChecks} accent="orange" hint="Topical groups" />
        <StatCard label="Study Destinations" value={5} icon={Globe} accent="purple" hint="UK, AU, CA, US, EU" />
        <StatCard label="Tools & FAQs" value={RESOURCES.filter((r) => r.category === 'Tools & Checklists').length} icon={HelpCircle} accent="green" hint="Interactive" />
      </div>

      {/* Search bar */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search resources by title or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto alo-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setActiveGroup('All')}
              className={cn(
                'px-3 h-10 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                activeGroup === 'All'
                  ? 'bg-[#0057B8] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All ({RESOURCES.length})
            </button>
            {GROUP_ORDER.map((g) => {
              const count = RESOURCES.filter((r) => r.category === g).length
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={cn(
                    'px-3 h-10 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                    activeGroup === g
                      ? 'bg-[#0057B8] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {g} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Resource groups */}
      {groupedFiltered.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm">
          <div className="text-center max-w-md mx-auto">
            <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No resources match your search</h3>
            <p className="text-sm text-slate-500 mb-4">Try a different keyword or browse all resources.</p>
            <Button
              onClick={() => { setQuery(''); setActiveGroup('All') }}
              variant="outline"
              className="h-12"
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedFiltered.map(({ category, resources }) => {
            const meta = GROUP_META[category]
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs font-semibold', meta.color, meta.bg, 'border-transparent')}>
                    {meta.label}
                  </Badge>
                  <span className="text-xs text-slate-400">{resources.length} resource{resources.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {resources.map((r) => {
                    const Icon = r.icon
                    return (
                      <Card
                        key={r.id}
                        className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className={cn('h-11 w-11 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                            <Icon className={cn('h-5 w-5', meta.color)} />
                          </div>
                          {r.tag && (
                            <Badge variant="outline" className={cn('text-[10px]', TAG_META[r.tag] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                              {r.tag}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-1.5">{r.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed flex-1">{r.description}</p>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-10 mt-4 w-full group-hover:bg-[#0057B8] group-hover:text-white group-hover:border-[#0057B8] transition-colors"
                        >
                          <Link href={r.href}>
                            Open Resource <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Help CTA */}
      <Card className="p-6 border-0 shadow-sm bg-[#F8FAFC]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <MessageSquare className="h-6 w-6 text-[#0057B8]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Can&apos;t find what you&apos;re looking for?</p>
            <p className="text-xs text-slate-500 mt-1">Message your counselor for personalized guidance, or browse our full FAQ section.</p>
          </div>
          <Button asChild variant="outline" className="h-12">
            <Link href="/student/messages">Ask Your Counselor <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
