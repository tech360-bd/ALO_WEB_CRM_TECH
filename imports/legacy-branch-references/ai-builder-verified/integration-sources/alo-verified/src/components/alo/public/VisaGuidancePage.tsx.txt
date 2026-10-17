'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  FileText,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Plane,
  ClipboardList,
  Fingerprint,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Star,
} from 'lucide-react'

const countries = [
  {
    id: 'uk', name: 'United Kingdom', flag: '🇬🇧',
    visaType: 'Student Visa (Tier 4 / Student Route)',
    processingTime: '3-6 weeks', fee: '£363', successRate: '98%',
    requirements: [
      'Confirmation of Acceptance for Studies (CAS)',
      'Valid passport with 6+ months validity',
      'Financial evidence (tuition + living costs for 28 days)',
      'Tuberculosis test certificate',
      'ATAS certificate (if applicable)',
      'English language proficiency evidence',
      'Academic transcripts and certificates',
    ],
    tips: [
      'Prepare for the credibility interview with mock sessions',
      'Ensure financial documents show 28-day minimum history',
      'Maintain consistency between your application and interview answers',
      'Apply at least 3 months before your course start date',
    ],
  },
  {
    id: 'usa', name: 'United States', flag: '🇺🇸',
    visaType: 'F-1 Student Visa',
    processingTime: '2-8 weeks', fee: '$185 + SEVIS $350', successRate: '92%',
    requirements: [
      'Form I-20 from university',
      'Valid passport (6+ months validity)',
      'DS-160 application confirmation',
      'SEVIS fee payment receipt',
      'Financial evidence / sponsorship letter',
      'Academic transcripts and test scores',
      'Ties to home country evidence',
    ],
    tips: [
      'Demonstrate strong ties to your home country',
      'Be confident and concise during the visa interview',
      'Show clear study plan and career goals',
      'Prepare for questions about funding sources',
    ],
  },
  {
    id: 'canada', name: 'Canada', flag: '🇨🇦',
    visaType: 'Study Permit',
    processingTime: '4-12 weeks', fee: 'CAD 150', successRate: '95%',
    requirements: [
      'Letter of Acceptance from DLI',
      'Valid passport',
      'Financial proof (GIC or bank statements)',
      'Medical examination report',
      'Police clearance certificate',
      'Statement of purpose',
      'Biometrics appointment completion',
    ],
    tips: [
      'Apply through Student Direct Stream (SDS) for faster processing',
      'GIC deposit shows strong financial preparation',
      'Include a detailed study plan linking to career goals',
      'Ensure medical exam is done by IRCC-approved physician',
    ],
  },
  {
    id: 'australia', name: 'Australia', flag: '🇦🇺',
    visaType: 'Student Visa (Subclass 500)',
    processingTime: '2-6 weeks', fee: 'AUD 650', successRate: '94%',
    requirements: [
      'Confirmation of Enrolment (CoE)',
      'Valid passport',
      'Overseas Student Health Cover (OSHC)',
      'Financial capacity evidence',
      'Genuine Temporary Entrant (GTE) statement',
      'English language test results',
      'Health examination report',
    ],
    tips: [
      'Write a compelling GTE statement showing intent to return',
      'Show sufficient funds for first year tuition + living costs',
      'Complete health checks with panel physicians only',
      'Apply at least 6 weeks before course start date',
    ],
  },
  {
    id: 'europe', name: 'Europe', flag: '🇪🇺',
    visaType: 'National D-Visa (varies by country)',
    processingTime: '4-12 weeks', fee: '€60-€100', successRate: '90%',
    requirements: [
      'University admission letter',
      'Valid passport',
      'Financial proof / blocked account',
      'Health insurance coverage',
      'Language proficiency (German/French/etc.)',
      'Academic transcripts (attested)',
      'Motivation letter / Statement of purpose',
    ],
    tips: [
      'Check country-specific requirements early in the process',
      'Blocked account must show sufficient funds for the year',
      'Prepare for possible embassy interview',
      'Consider tuition-free options in Germany and Norway',
    ],
  },
]

const visaSteps = [
  { icon: <ClipboardList className="h-6 w-6" />, title: 'Apply', desc: 'Submit your application with all required documents' },
  { icon: <FileText className="h-6 w-6" />, title: 'Documents', desc: 'Gather and verify all supporting documents' },
  { icon: <Fingerprint className="h-6 w-6" />, title: 'Biometrics', desc: 'Attend biometrics appointment at visa center' },
  { icon: <MessageSquare className="h-6 w-6" />, title: 'Interview', desc: 'Attend visa interview if required by country' },
  { icon: <ThumbsUp className="h-6 w-6" />, title: 'Decision', desc: 'Receive your visa decision and travel preparation' },
]

const documentChecklist = [
  { category: 'Identity Documents', items: ['Valid Passport', 'National ID Card', 'Birth Certificate', 'Passport-size Photos'] },
  { category: 'Academic Documents', items: ['Transcripts (attested)', 'Degree Certificates', 'IELTS/TOEFL Scores', 'Statement of Purpose'] },
  { category: 'Financial Documents', items: ['Bank Statements (28 days)', 'Sponsor Letter', 'Scholarship Letter', 'Loan Approval Letter'] },
  { category: 'Visa Documents', items: ['CAS/CoE/I-20', 'Visa Application Form', 'Medical Certificate', 'TB Test Certificate'] },
]

const interviewTips = [
  { title: 'Know Your Course', desc: 'Be able to explain why you chose this specific course and university.' },
  { title: 'Show Financial Readiness', desc: 'Clearly demonstrate you can afford tuition and living expenses.' },
  { title: 'Demonstrate Intent to Return', desc: 'Show strong ties to your home country and future career plans.' },
  { title: 'Be Confident & Honest', desc: 'Answer all questions truthfully and confidently. Don\'t memorize scripts.' },
  { title: 'Prepare for English Test', desc: 'Your interview may assess your English proficiency level.' },
  { title: 'Dress Professionally', desc: 'First impressions matter. Wear formal business attire.' },
]

export default function VisaGuidancePage() {
  const { setCurrentView } = useAppStore()
  const [activeTab, setActiveTab] = useState('uk')
  const country = countries.find(c => c.id === activeTab) || countries[0]

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#0066CC] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="bg-[#F37021]/20 text-[#FFB347] border-[#F37021]/30 mb-4">Visa Guidance</Badge>
          <h1 className="text-4xl lg:text-5xl font-bold">
            Complete <span className="text-[#F37021]">Visa Guidance</span>
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg">
            Our UKVI-certified visa consultants provide comprehensive support for student visa applications with a 98% success rate.
          </p>
        </div>
      </section>

      {/* Country Tabs */}
      <section className="bg-white border-b sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 h-auto p-1 flex-wrap">
              {countries.map((c) => (
                <TabsTrigger key={c.id} value={c.id} className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white gap-1.5">
                  <span>{c.flag}</span> {c.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Visa Details */}
      <section className="bg-[#F7F9FC] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Visa Info Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <div className="text-xl">{country.name}</div>
                    <div className="text-sm font-normal text-[#555555]">{country.visaType}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-[#555555]"><Clock className="h-4 w-4 text-[#0066CC]" /> Processing Time</span>
                  <span className="text-sm font-semibold text-[#1A2332]">{country.processingTime}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-[#555555]"><DollarSign className="h-4 w-4 text-[#0066CC]" /> Visa Fee</span>
                  <span className="text-sm font-semibold text-[#1A2332]">{country.fee}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F37021]/5 rounded-lg border border-[#F37021]/20">
                  <span className="flex items-center gap-2 text-sm text-[#F37021]"><Shield className="h-4 w-4" /> ALO Success Rate</span>
                  <span className="text-lg font-bold text-[#F37021]">{country.successRate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Requirements Checklist */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                  <CheckCircle2 className="h-5 w-5 text-[#0066CC]" /> Requirements Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {country.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#F37021] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#555555]">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1A2332]">
                  <Lightbulb className="h-5 w-5 text-[#F37021]" /> Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {country.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-[#0066CC] shrink-0 mt-0.5" />
                      <span className="text-sm text-[#555555]">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Visa Process Steps */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">Visa Process</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">How the Visa Process Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {visaSteps.map((step, i) => (
              <div key={i} className="text-center relative">
                {i < visaSteps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-[#F37021]/20" />
                )}
                <div className="w-16 h-16 bg-[#F37021]/10 rounded-2xl flex items-center justify-center text-[#F37021] mx-auto mb-3 relative z-10">
                  {step.icon}
                </div>
                <div className="w-6 h-6 bg-[#F37021] rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-2">
                  {i + 1}
                </div>
                <h4 className="font-semibold text-[#1A2332] text-sm">{step.title}</h4>
                <p className="text-xs text-[#555555] mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Checklist */}
      <section className="bg-[#F7F9FC] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">Documents</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">Document Checklist</h2>
            <p className="mt-3 text-[#555555]">Ensure you have all required documents before applying.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {documentChecklist.map((cat, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-[#1A2332] mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#F37021]" /> {cat.category}
                  </h3>
                  <ul className="space-y-2">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-[#555555]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* UKVI Interview Preparation */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">Interview Prep</Badge>
            <h2 className="text-3xl font-bold text-[#1A2332]">UKVI Interview Preparation</h2>
            <p className="mt-3 text-[#555555]">Key tips to ace your student visa interview.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviewTips.map((tip, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#F37021]/10 rounded-lg flex items-center justify-center text-[#F37021] shrink-0">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1A2332] text-sm">{tip.title}</h4>
                    <p className="text-xs text-[#555555] mt-1 leading-relaxed">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Tips */}
      <section className="bg-[#F7F9FC] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#1A2332] to-[#0066CC] text-white">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#F37021] rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Our Success Tips</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F37021] shrink-0" /> Apply early — at least 3 months before your course starts</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F37021] shrink-0" /> Double-check every document before submission</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F37021] shrink-0" /> Be honest and consistent in all your answers</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F37021] shrink-0" /> Practice your interview with mock sessions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#e0651a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Get Expert Visa Guidance</h2>
          <p className="text-orange-100 max-w-xl mx-auto">Don&apos;t risk a visa rejection. Our 98% success rate speaks for itself.</p>
          <Button onClick={() => setCurrentView('free-consultation')} className="bg-white text-[#F37021] hover:bg-gray-100 h-12 px-8 font-semibold">
            Book Free Consultation <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  )
}
