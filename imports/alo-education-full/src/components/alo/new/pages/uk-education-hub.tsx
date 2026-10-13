'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Search, GraduationCap, Building2, Globe, Clock,
  PoundSterling, FileText, Shield, ChevronRight, Star, Users,
  BookOpen, Award, Briefcase, MapPin, ExternalLink, Sparkles,
  CheckCircle2, ArrowRight, Plane, MessageCircle, Phone
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const UK_RED = '#C8102E';
const UK_BLUE = '#012169';
const NAVY = '#1a1a2e';
const CORAL = '#bf4520';
const PAPER = '#f5f5f5';

interface UkEducationHubProps {
  onBack?: () => void;
  onNavigate?: (page: string, slug?: string) => void;
  onLeadOpen?: () => void;
}

// ── UK University Data ─────────────────────────────────────────────────────
const UK_UNIVERSITIES = [
  { name: 'University of Oxford', ranking: 1, type: 'Russell Group', location: 'Oxford', fees: '£26,000-38,000', popular: ['PPE', 'Law', 'Medicine'], logo: '🏫' },
  { name: 'University of Cambridge', ranking: 2, type: 'Russell Group', location: 'Cambridge', fees: '£27,000-39,000', popular: ['Natural Sciences', 'Engineering', 'Mathematics'], logo: '🏛️' },
  { name: 'Imperial College London', ranking: 3, type: 'Russell Group', location: 'London', fees: '£25,000-38,000', popular: ['Engineering', 'Computing', 'Medicine'], logo: '🔬' },
  { name: 'UCL', ranking: 4, type: 'Russell Group', location: 'London', fees: '£24,000-32,000', popular: ['Architecture', 'Law', 'Medicine'], logo: '🎓' },
  { name: 'University of Edinburgh', ranking: 5, type: 'Russell Group', location: 'Edinburgh', fees: '£22,000-30,000', popular: ['Informatics', 'Medicine', 'Law'], logo: '🏰' },
  { name: 'King\'s College London', ranking: 6, type: 'Russell Group', location: 'London', fees: '£21,000-31,000', popular: ['Medicine', 'Law', 'Business'], logo: '⚕️' },
  { name: 'University of Manchester', ranking: 7, type: 'Russell Group', location: 'Manchester', fees: '£20,000-28,000', popular: ['Engineering', 'Business', 'Computer Science'], logo: '🏭' },
  { name: 'University of Birmingham', ranking: 8, type: 'Russell Group', location: 'Birmingham', fees: '£19,000-26,000', popular: ['Business', 'Engineering', 'Medicine'], logo: '🌆' },
];

const UK_VISA_TYPES = [
  { type: 'Student Visa (Tier 4)', code: 'General', duration: 'Duration of course + 4 months', work: 'Up to 20 hrs/week (term-time)', dependents: 'Yes (postgraduate)', icon: '📋' },
  { type: 'Graduate Route', code: 'PSW', duration: '2 years (3 for PhD)', work: 'Full-time permitted', dependents: 'Yes', icon: '🎯' },
  { type: 'Skilled Worker Visa', code: 'Tier 2', duration: '5 years (renewable)', work: 'Full-time sponsored role', dependents: 'Yes', icon: '💼' },
  { type: 'Global Talent Visa', code: 'Exceptional', duration: '5 years (renewable)', work: 'Full-time permitted', dependents: 'Yes', icon: '⭐' },
];

const UK_EXAMS = [
  { name: 'IELTS Academic', min: '6.0', recommended: '6.5-7.0', provider: 'British Council', cost: '~£185', format: 'Paper/Computer' },
  { name: 'PTE Academic', min: '54', recommended: '58-65', provider: 'Pearson', cost: '~£155', format: 'Computer' },
  { name: 'TOEFL iBT', min: '78', recommended: '90-100', provider: 'ETS', cost: '~£165', format: 'Computer' },
  { name: 'Duolingo', min: '95', recommended: '110-120', provider: 'Duolingo', cost: '~£49', format: 'Online' },
];

const UK_SCHOLARSHIPS = [
  { name: 'Chevening Scholarship', amount: 'Full funding', level: 'Masters', deadline: 'November', eligibility: '2+ years work experience', competitive: true },
  { name: 'Commonwealth Scholarship', amount: 'Full funding', level: 'Masters/PhD', deadline: 'December', eligibility: 'Commonwealth citizen', competitive: true },
  { name: 'GREAT Scholarship', amount: '£10,000', level: 'Masters', deadline: 'Varies', eligibility: 'Specific countries', competitive: true },
  { name: 'University-specific Awards', amount: '£2,000-10,000', level: 'All levels', deadline: 'Rolling', eligibility: 'Merit-based', competitive: false },
  { name: 'ORS Awards', amount: 'Fee difference', level: 'PhD', deadline: 'January', eligibility: 'Academic merit', competitive: true },
];

export function UkEducationHub({ onBack, onNavigate, onLeadOpen }: UkEducationHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUni, setSelectedUni] = useState<number | null>(null);

  const filteredUnis = UK_UNIVERSITIES.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.popular.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* UK-themed header */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${UK_BLUE} 0%, ${NAVY} 60%, ${UK_RED} 100%)` }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            {onBack && (
              <button onClick={onBack} className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇬🇧</span>
              <div>
                <h1 className="text-2xl font-bold text-white">UK Education Hub</h1>
                <p className="text-sm text-white/60">Your complete guide to studying in the United Kingdom</p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: <Building2 className="h-5 w-5" />, label: '160+ Universities', sub: 'World-class institutions' },
              { icon: <GraduationCap className="h-5 w-5" />, label: '500K+ Students', sub: 'International students' },
              { icon: <PoundSterling className="h-5 w-5" />, label: '£10K-39K/yr', sub: 'Tuition range' },
              { icon: <Clock className="h-5 w-5" />, label: '2yr PSW Visa', sub: 'Post-study work' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-white/80">{stat.icon}</div>
                  <span className="text-white font-bold text-sm">{stat.label}</span>
                </div>
                <span className="text-white/50 text-xs">{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content tabs */}
      <div className="flex-1">
        <Tabs defaultValue="universities" className="flex flex-col h-full">
          <div className="bg-white border-b border-[#e5e7eb] px-4 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto overflow-x-auto">
              <TabsList className="bg-transparent h-11 gap-0.5 p-0">
                {[
                  { value: 'universities', label: '🎓 Universities', icon: Building2 },
                  { value: 'visa', label: '🛂 Visa Guide', icon: Shield },
                  { value: 'exams', label: '📝 English Tests', icon: BookOpen },
                  { value: 'scholarships', label: '💰 Scholarships', icon: Award },
                  { value: 'process', label: '📋 Application Process', icon: FileText },
                  { value: 'costs', label: '💷 Cost Planner', icon: PoundSterling },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#C8102E] data-[state=active]:text-[#1a1a2e] data-[state=active]:font-semibold text-[#6b7280] h-11 rounded-none px-4 text-sm whitespace-nowrap"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Universities Tab */}
          <TabsContent value="universities" className="m-0 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-[#6b7280]" />
                <Input
                  placeholder="Search universities or courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white border-[#e5e7eb] text-base"
                />
              </div>

              {/* University cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnis.map((uni, i) => (
                  <Card key={i} className="border border-[#e5e7eb] hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedUni(selectedUni === i ? null : i)}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{uni.logo}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#1a1a2e] group-hover:text-[#C8102E] transition-colors">{uni.name}</h3>
                            <Badge variant="outline" className="text-xs shrink-0 border-[#C8102E] text-[#C8102E]">#{uni.ranking}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#6b7280] mb-2">
                            <MapPin className="h-3 w-3" />{uni.location}
                            <Separator orientation="vertical" className="h-3" />
                            <span>{uni.type}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <PoundSterling className="h-3.5 w-3.5 text-[#bf4520]" />
                            <span className="text-sm font-semibold text-[#bf4520]">{uni.fees}/yr</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {uni.popular.map(course => (
                              <Badge key={course} className="text-xs bg-[#eff6ff] text-[#0066CC] border-0" style={{ borderRadius: '4px' }}>
                                {course}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#6b7280] group-hover:text-[#C8102E] transition-colors shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 text-center">
                <div className="bg-white rounded-2xl p-8 border border-[#e5e7eb] shadow-sm">
                  <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Not sure which UK university is right for you?</h3>
                  <p className="text-[#6b7280] mb-4">Our expert counselors can help you find the perfect match based on your profile</p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={onLeadOpen}
                      className="bg-[#bf4520] hover:bg-[#a33a1a] text-white font-semibold px-6"
                      style={{ borderRadius: '8px' }}
                    >
                      Book Free Consultation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onNavigate?.('ai-assistant')}
                      className="border-[#0066CC] text-[#0066CC]"
                      style={{ borderRadius: '8px' }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Course Matcher
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Visa Guide Tab */}
          <TabsContent value="visa" className="m-0 p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Student Visa Process */}
              <Card className="border-[#C8102E]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#1a1a2e]">
                    <Shield className="h-5 w-5 text-[#C8102E]" />
                    UK Student Visa Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {[
                      { step: 1, title: 'Get CAS', desc: 'University Confirmation of Acceptance', icon: '📨' },
                      { step: 2, title: 'Financial Proof', desc: 'Show tuition + living costs', icon: '💰' },
                      { step: 3, title: 'Apply Online', desc: 'Submit visa application', icon: '💻' },
                      { step: 4, title: 'Biometrics', desc: 'Visit VAC for appointment', icon: '🔐' },
                      { step: 5, title: 'Decision', desc: 'Receive visa decision', icon: '✅' },
                    ].map((step, i) => (
                      <div key={i} className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-xl" style={{ background: `linear-gradient(135deg, ${UK_BLUE}20, ${UK_RED}20)` }}>
                          {step.icon}
                        </div>
                        <h4 className="text-sm font-bold text-[#1a1a2e]">{step.title}</h4>
                        <p className="text-xs text-[#6b7280] mt-1">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Visa Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {UK_VISA_TYPES.map((visa, i) => (
                  <Card key={i} className="border border-[#e5e7eb]">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{visa.icon}</span>
                        <div>
                          <h3 className="font-bold text-[#1a1a2e] mb-1">{visa.type}</h3>
                          <Badge variant="outline" className="text-xs mb-2">{visa.code}</Badge>
                          <div className="space-y-1.5 text-sm text-[#4b5563]">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-[#6b7280]" />
                              <span>Duration: {visa.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-[#6b7280]" />
                              <span>Work: {visa.work}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-[#6b7280]" />
                              <span>Dependents: {visa.dependents}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Financial Requirements */}
              <Card className="bg-[#fffbeb] border-[#fde68a]">
                <CardContent className="p-5">
                  <h3 className="font-bold text-[#92400e] mb-3 flex items-center gap-2">
                    <PoundSterling className="h-5 w-5" />
                    Financial Requirements (Student Visa)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="font-semibold text-[#1a1a2e] mb-1">London</p>
                      <p className="text-[#4b5563]">Living costs: <strong>£1,334/month</strong></p>
                      <p className="text-[#4b5563]">9 months = <strong>£12,006</strong></p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="font-semibold text-[#1a1a2e] mb-1">Outside London</p>
                      <p className="text-[#4b5563]">Living costs: <strong>£1,023/month</strong></p>
                      <p className="text-[#4b5563]">9 months = <strong>£9,207</strong></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* English Tests Tab */}
          <TabsContent value="exams" className="m-0 p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {UK_EXAMS.map((exam, i) => (
                  <Card key={i} className="border border-[#e5e7eb] hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-[#1a1a2e] text-lg">{exam.name}</h3>
                        <Badge className="bg-[#eff6ff] text-[#0066CC] border-0">{exam.format}</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">Provider</span>
                          <span className="font-medium text-[#1a1a2e]">{exam.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">Minimum Score</span>
                          <span className="font-medium text-[#bf4520]">{exam.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">Recommended</span>
                          <span className="font-medium text-[#22c55e]">{exam.recommended}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6b7280]">Test Fee</span>
                          <span className="font-medium text-[#1a1a2e]">{exam.cost}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* IELTS Preparation CTA */}
              <Card className="bg-gradient-to-r from-[#012169] to-[#C8102E] text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Need IELTS/PTE Preparation?</h3>
                  <p className="text-white/70 mb-4">ALO Education offers expert test preparation with proven results</p>
                  <Button
                    onClick={onLeadOpen}
                    className="bg-white text-[#012169] hover:bg-white/90 font-semibold px-6"
                    style={{ borderRadius: '8px' }}
                  >
                    Enroll in Prep Course
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scholarships Tab */}
          <TabsContent value="scholarships" className="m-0 p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-4">
              {UK_SCHOLARSHIPS.map((sch, i) => (
                <Card key={i} className="border border-[#e5e7eb] hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#1a1a2e]">{sch.name}</h3>
                          {sch.competitive && (
                            <Badge className="text-xs bg-[#fef2f2] text-[#dc2626] border-0" style={{ borderRadius: '4px' }}>
                              Competitive
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-[#6b7280]">
                          <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {sch.level}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Deadline: {sch.deadline}</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {sch.eligibility}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[#22c55e] text-lg">{sch.amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Application Process Tab */}
          <TabsContent value="process" className="m-0 p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {[
                { step: 1, title: 'Research & Shortlist', desc: 'Explore UK universities, courses, and entry requirements. Use our AI Course Matcher for personalized recommendations.', icon: '🔍', color: '#0066CC' },
                { step: 2, title: 'Prepare Documents', desc: 'Academic transcripts, English test scores (IELTS/PTE), Statement of Purpose, Recommendation Letters, CV.', icon: '📄', color: '#8b5cf6' },
                { step: 3, title: 'Apply via UCAS', desc: 'Submit your application through UCAS (up to 5 choices). Our counselors assist with personal statement and application review.', icon: '✍️', color: '#C8102E' },
                { step: 4, title: 'Receive Offers', desc: 'Conditional or Unconditional offers. We help you understand conditions and choose the best offer.', icon: '📬', color: '#22c55e' },
                { step: 5, title: 'Accept & Pay Deposit', desc: 'Accept your offer and pay the tuition deposit to secure your place and receive CAS number.', icon: '💰', color: '#f59e0b' },
                { step: 6, title: 'Visa Application', desc: 'Apply for Student Visa with CAS, financial proof, and TB test. We guide you through the entire process.', icon: '🛂', color: '#012169' },
                { step: 7, title: 'Pre-departure Prep', desc: 'Accommodation, travel, insurance, and orientation. Attend our pre-departure briefing session.', icon: '✈️', color: '#14b8a6' },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${step.color}15`, border: `2px solid ${step.color}` }}>
                      {step.icon}
                    </div>
                    {i < 6 && <div className="w-0.5 h-full bg-[#e5e7eb] my-1" />}
                  </div>
                  <div className="pb-6">
                    <h3 className="font-bold text-[#1a1a2e] mb-1">Step {step.step}: {step.title}</h3>
                    <p className="text-sm text-[#6b7280]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Cost Planner Tab */}
          <TabsContent value="costs" className="m-0 p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tuition costs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GraduationCap className="h-5 w-5 text-[#0066CC]" />
                      Tuition Fees (Per Year)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { level: 'Foundation', range: '£10,000 - £15,000' },
                      { level: 'Undergraduate', range: '£14,000 - £38,000' },
                      { level: 'Masters (Taught)', range: '£16,000 - £35,000' },
                      { level: 'MBA', range: '£20,000 - £45,000' },
                      { level: 'PhD', range: '£18,000 - £28,000' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-[#f3f4f6] last:border-0">
                        <span className="text-sm font-medium text-[#1a1a2e]">{item.level}</span>
                        <span className="text-sm font-bold text-[#bf4520]">{item.range}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Living costs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="h-5 w-5 text-[#22c55e]" />
                      Living Costs (Per Month)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { city: 'London', rent: '£800-1,200', total: '£1,300-1,800' },
                      { city: 'Manchester', rent: '£500-800', total: '£900-1,200' },
                      { city: 'Birmingham', rent: '£450-750', total: '£850-1,100' },
                      { city: 'Edinburgh', rent: '£500-850', total: '£900-1,200' },
                      { city: 'Leeds', rent: '£400-650', total: '£750-1,000' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-[#f3f4f6] last:border-0">
                        <span className="text-sm font-medium text-[#1a1a2e]">{item.city}</span>
                        <div className="text-right">
                          <span className="text-sm text-[#6b7280]">Rent: {item.rent}</span>
                          <span className="text-xs text-[#9ca3af] ml-2">Total: {item.total}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => onNavigate?.('cost-planner')}
                  className="bg-[#0066CC] hover:bg-[#0052a3] text-white font-semibold px-8"
                  style={{ borderRadius: '8px' }}
                >
                  <PoundSterling className="mr-2 h-4 w-4" />
                  Open Full Cost Planner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
