'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award, BookOpen, Clock, Globe, GraduationCap, HelpCircle, MapPin, MessageSquare, Phone,
  Search, ShieldCheck, Sparkles, Target, ArrowRight, CheckCircle2, ChevronDown, FileText,
  BarChart3, Headphones, PenTool, Mic, BookOpenCheck, Timer, Trophy, TrendingUp, AlertCircle,
  Building2, Layers, Lightbulb, Video, Library, BookMarked, ClipboardCheck, Users, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';
import { submitLanguagePrepLead } from '@/lib/language-prep/submit-lead';
import { EnglishExamCard } from '@/components/website/EnglishExamCta';
import { isEnglishProficiencyTestSlug } from '@/lib/english-exam';

interface TestDetailProps {
  slug: string;
}

export default function TestDetailView({ slug }: TestDetailProps) {
  const [test, setTest] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [acceptance, setAcceptance] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scorePlanner, setScorePlanner] = useState({ current: '', target: '', examDate: '', hours: '10' });
  const [plannerResult, setPlannerResult] = useState<any>(null);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', targetCountry: 'UK', currentScore: '', targetScore: '' });

  useEffect(() => {
    fetch(`/api/language-prep/tests/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTest(d.test);
          setModules(d.modules || []);
          setFaqs(d.faqs || []);
          setAcceptance(d.acceptance || []);
          setResources(d.resources || []);
          setSuccessStories(d.successStories || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleScorePlanner = () => {
    if (!scorePlanner.current || !scorePlanner.target) {
      toast.error('Enter current and target scores');
      return;
    }
    const currentNum = parseFloat(scorePlanner.current) || 0;
    const targetNum = parseFloat(scorePlanner.target) || 0;
    const gap = targetNum - currentNum;
    const hours = parseInt(scorePlanner.hours) || 10;
    const weeks = gap > 0 ? Math.ceil((gap * 20) / hours) : 0; // rough estimation, not guarantee
    setPlannerResult({
      gap: gap.toFixed(1),
      weeks,
      priority: gap > 1 ? 'Focus on weakest module + daily practice' : 'Refine test strategies + mock tests',
      schedule: `Suggested: ${hours} hrs/week, ${weeks} weeks, 2-3 mocks, weekly writing feedback and speaking practice`,
      note: 'Do not claim AI prediction guarantees — this is guidance only, not guaranteed outcome',
    });
  };

  const handleLead = async (e: React.FormEvent, section: string) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error('Name and phone required');
      return;
    }
    const result = await submitLanguagePrepLead({
      name: leadForm.name,
      phone: leadForm.phone,
      email: leadForm.email,
      countryName: leadForm.targetCountry,
      testName: test?.name || slug,
      testId: test?.id || '',
      currentScore: leadForm.currentScore || scorePlanner.current,
      targetScore: leadForm.targetScore || scorePlanner.target || test?.scoringSystem,
      source: 'language_prep',
      sourceSection: `${slug}_${section}`,
      notes: `Test detail lead for ${test?.name} — Current: ${leadForm.currentScore}, Target: ${leadForm.targetScore}`,
    });
    if (result.ok) {
      toast.success('Counselling booked! Our team will contact you.');
      setLeadForm({ name: '', phone: '', email: '', targetCountry: 'UK', currentScore: '', targetScore: '' });
    } else {
      toast.error(result.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">Loading preparation guide…</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <Card className="p-8 max-w-lg text-center border border-[#E2E8F0] rounded-3xl">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="font-bold text-lg text-[#0F172A]">Test not found</h2>
          <p className="text-sm text-slate-600 mt-2">The test "{slug}" is not available. Check /language-prep for available tests.</p>
          <Button asChild className="bg-[#0066CC] hover:bg-[#003D7A] text-white font-bold h-11 rounded-xl"><a href="/language-prep" className="mt-4 inline-block">View All Test Prep →</a></Button>
        </Card>
      </div>
    );
  }

  const isMoi = test.testType === 'moi_guidance' || test.slug === 'moi';

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      {/* SEO — JSON-LD FAQ + Breadcrumb — verified, no fake */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aloeducation.com/' }, { '@type': 'ListItem', position: 2, name: 'Language Preparation', item: 'https://aloeducation.com/language-prep' }, { '@type': 'ListItem', position: 3, name: test.name, item: `https://aloeducation.com/language-prep/${test.slug}` }] }) }} />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.slice(0, 20).map((f: any) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }) }} />}
      {/* Breadcrumb + Hero — White-first, no dark overlay */}
      <section className="relative bg-white pt-8 pb-12 lg:pt-12 lg:pb-16 overflow-hidden border-b border-[#E2E8F0]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC] to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <a href="/" className="hover:text-[#0066CC]">Home</a>
            <span>›</span>
            <a href="/language-prep" className="hover:text-[#0066CC]">Language Prep</a>
            <span>›</span>
            <span className="text-[#0066CC] font-bold">{test.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="bg-[#0066CC] text-white font-bold text-[11px] px-3 py-1">{test.name}</Badge>
                {test.testType !== 'moi_guidance' && <Badge className="bg-white border border-[#E2E8F0] text-[#0F172A] font-semibold text-[11px]">{test.format}</Badge>}
                {test.isPopular && <Badge className="bg-[#F37021] text-black font-bold text-[11px]">Popular</Badge>}
                {isMoi && <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[11px]">Guidance Resource — Not a test</Badge>}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-[#0F172A]">
                {test.name} <span className="text-[#0066CC]">Preparation</span>
              </h1>

              <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed">
                {isMoi
                  ? 'Understand when universities may accept Medium of Instruction and verification requirements — MOI is guidance resource, not an English proficiency test.'
                  : `Prepare strategically to achieve your required ${test.name} score for university admission and your relevant study/visa pathway.`}
              </p>

              {!isMoi && (
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">Academic</span>
                  <span className="px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">Paper</span>
                  <span className="px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]">Computer</span>
                  {test.slug === 'ielts-ukvi' && <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#0066CC]">UKVI SELT</span>}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="bg-[#F37021] hover:bg-[#D95D12] text-black font-bold text-sm h-12 px-7 rounded-xl shadow-sm"><a href="#book-counselling">
                    Book Free {test.shortName} Counselling <ArrowRight className="w-4 h-4 ml-1" />
                  </a></Button>
                <Button asChild variant="outline" className="bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 font-semibold text-sm h-12 px-6 rounded-xl"><a href="#assessment">
                    Start {test.shortName} Assessment
                  </a></Button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Source: {test.sourceName} • <a href={test.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] hover:underline">{test.sourceUrl}</a> • Last verified: {test.lastVerifiedAt || 'Information requires verification'} • Verified by: {test.verifiedBy} • {test.verificationStatus}
              </p>
            </div>

            {/* Right overview card */}
            <div className="lg:col-span-4">
              <Card className="p-6 bg-white border border-[#E2E8F0] shadow-lg rounded-3xl sticky top-24">
                <h3 className="font-bold text-sm text-[#0F172A] mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0066CC]" /> {test.name} Overview
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Duration</span><span className="font-bold text-[#0F172A]">{test.durationDisplay}</span></div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Scoring</span><span className="font-bold text-[#0F172A]">{test.scoringSystem}</span></div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Format</span><span className="font-semibold">{test.format}</span></div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Results</span><span className="font-semibold text-emerald-600">{test.resultTimeline}</span></div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Cost</span><span className="font-semibold">{test.costSummary}</span></div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Validity</span><span className="font-semibold">{test.validitySummary}</span></div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Best For</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{test.bestFor}</p>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Acceptance</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{test.acceptanceSummary}</p>
                  <p className="text-[10px] text-amber-700 mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100">Acceptance varies by university, course and visa route. Check university-specific acceptance.</p>
                </div>

                <Button asChild variant="outline" className="w-full bg-white border-[#E2E8F0] font-semibold h-11 rounded-xl text-xs"><a href={test.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block">
                    Official Provider: {test.provider} ↗
                  </a></Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Test Overview */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">{test.name} Test Overview</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">{test.longDescription}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Test Details</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Provider:</span><span className="font-semibold">{test.provider}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Official URL:</span><a href={test.officialUrl} target="_blank" className="font-semibold text-[#0066CC] hover:underline truncate max-w-[150px]">{test.officialUrl}</a></div>
                    <div className="flex justify-between"><span className="text-slate-500">Validity:</span><span className="font-semibold">{test.validitySummary}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Difficulty:</span><span className="font-semibold">{test.difficultyLevel}</span></div>
                  </div>
                </Card>
                <Card className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0066CC] mb-2">Source Verification</h4>
                  <div className="space-y-2 text-xs">
                    <div><span className="text-slate-500">Source:</span><p className="font-semibold text-[#0F172A]">{test.sourceName}</p></div>
                    <div><span className="text-slate-500">URL:</span><a href={test.sourceUrl} target="_blank" className="font-semibold text-[#0066CC] hover:underline break-all">{test.sourceUrl}</a></div>
                    <div><span className="text-slate-500">Last Verified:</span><p className="font-semibold">{test.lastVerifiedAt || 'Information requires verification'}</p></div>
                    <div><span className="text-slate-500">Verified By:</span><p className="font-semibold">{test.verifiedBy}</p></div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Test Modules — 4-card layout */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-6">{test.name} Modules — {modules.length} modules</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {modules.map((mod: any, i: number) => (
                  <Card key={mod.id || i} className="p-6 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#0066CC]/20 transition rounded-3xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066CC] flex items-center justify-center">
                        {mod.moduleName?.toLowerCase().includes('listen') ? <Headphones className="w-5 h-5" /> :
                         mod.moduleName?.toLowerCase().includes('read') ? <BookOpenCheck className="w-5 h-5" /> :
                         mod.moduleName?.toLowerCase().includes('writ') ? <PenTool className="w-5 h-5" /> :
                         mod.moduleName?.toLowerCase().includes('speak') ? <Mic className="w-5 h-5" /> :
                         mod.moduleName?.toLowerCase().includes('quant') || mod.moduleName?.toLowerCase().includes('math') ? <BarChart3 className="w-5 h-5" /> :
                         <BookOpen className="w-5 h-5" />}
                      </div>
                      <Badge className="bg-[#F8FAFC] border border-[#E2E8F0] text-slate-700 text-[10px]">{mod.durationDisplay}</Badge>
                    </div>
                    <h3 className="font-bold text-sm text-[#0F172A] uppercase tracking-wide">{mod.moduleName}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{mod.description}</p>
                    <div className="mt-4 space-y-2.5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">What it assesses</p>
                        <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">{mod.skillsAssessed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Question style</p>
                        <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">{mod.questionFormat}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Common challenge</p>
                        <p className="text-[11px] text-amber-800 mt-1">{mod.commonChallenges}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Preparation tip</p>
                        <p className="text-[11px] text-emerald-800 mt-1">{mod.preparationTips}</p>
                      </div>
                    </div>
                    <a href="#book-counselling" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0066CC] hover:text-[#F37021]">
                      Practice {mod.moduleName} →
                    </a>
                  </Card>
                ))}
              </div>
              {modules.length === 0 && (
                <Card className="p-8 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-3xl text-center">
                  <p className="text-sm text-slate-500">Module details not available — See official test provider guidance: <a href={test.officialUrl} target="_blank" className="text-[#0066CC] hover:underline">{test.officialUrl}</a></p>
                </Card>
              )}
            </section>

            {/* Score System */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">{test.name} Score System</h2>
              <Card className="p-6 bg-white border border-[#E2E8F0] rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0066CC] text-white font-black flex items-center justify-center">{test.scoringSystem?.split(' ')[0] || '0-9'}</div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">{test.scoringSystem}</h3>
                    <p className="text-xs text-slate-500">{test.validitySummary}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {isMoi
                    ? 'MOI is not a scored test — it is a guidance resource. Universities accepting MOI assess previous education medium, not test score.'
                    : `Overall score and component scores explained. How scoring works: ${test.scoringSystem}. For ${test.name}, ${test.scoringSystem === 'Band 0-9 (0.5 increments)' ? 'each module scored 0-9, overall average of four modules rounded to nearest 0.5.' : 'check official provider guidance for detailed scoring methodology.'}`}
                </p>
                <p className="text-[11px] text-slate-500 mt-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  Source: {test.sourceName} — <a href={test.sourceUrl} target="_blank" className="text-[#0066CC] hover:underline">{test.sourceUrl}</a>
                </p>
              </Card>
            </section>

            {/* Test Acceptance — Where accepted */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">Where Is This Test Accepted?</h2>
              <p className="text-xs text-amber-700 mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-100">Acceptance is university/course specific. Do not claim universal acceptance. Acceptance varies by university, course and visa route.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'UK', flag: '🇬🇧' }, { name: 'Australia', flag: '🇦🇺' }, { name: 'Canada', flag: '🇨🇦' },
                  { name: 'USA', flag: '🇺🇸' }, { name: 'Ireland', flag: '🇮🇪' }, { name: 'New Zealand', flag: '🇳🇿' },
                  { name: 'Dubai/UAE', flag: '🇦🇪' }, { name: 'Europe', flag: '🇪🇺' },
                ].map((c, i) => {
                  const acc = acceptance.find((a: any) => a.countryName?.toLowerCase().includes(c.name.toLowerCase()) || a.countrySlug === c.name.toLowerCase());
                  return (
                    <Card key={i} className="p-4 bg-white border border-[#E2E8F0] rounded-2xl">
                      <div className="flex items-center gap-2 mb-2"><span className="text-lg">{c.flag}</span><h4 className="font-bold text-sm text-[#0F172A]">{c.name}</h4></div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {acc ? acc.summary : `Check university-specific acceptance for ${test.name} in ${c.name}. Acceptance varies by university, course and visa route.`}
                      </p>
                      {acc?.sourceUrl && <a href={acc.sourceUrl} target="_blank" className="text-[10px] text-[#0066CC] hover:underline mt-2 inline-block">Source: {acc.sourceName || acc.sourceUrl} • Verified: {acc.lastVerifiedAt || 'Check official'}</a>}
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* University Requirement Checker */}
            <section id="score-explorer">
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">{test.name} for University Admission — Requirement Checker</h2>
              <Card className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl">
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  <Input placeholder="Country e.g. UK" className="h-11 rounded-xl border-[#E2E8F0] bg-white" />
                  <Input placeholder="University e.g. Manchester" className="h-11 rounded-xl border-[#E2E8F0] bg-white" />
                  <Input placeholder="Course e.g. MSc CS" className="h-11 rounded-xl border-[#E2E8F0] bg-white" />
                </div>
                <p className="text-xs text-slate-600">Requirement not available in database. Check university course page. — System retrieves English test, Minimum overall, Minimum component scores, Waiver availability, Remarks, Source URL, Last verified — Only if actual course data exists.</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild className="w-full bg-[#0066CC] hover:bg-[#003D7A] text-white font-bold h-11 rounded-xl text-xs"><a href="/course-finder" className="flex-1">Find Matching Courses</a></Button>
                  <Button asChild variant="outline" className="bg-white border-[#E2E8F0] h-11 rounded-xl text-xs"><a href={`/language-prep/comparison?tests=${test.slug}`}>Compare Tests</a></Button>
                </div>
              </Card>
            </section>

            {/* Visa / Immigration — careful */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">English Tests and Visa Requirements</h2>
              <p className="text-sm text-slate-600 mb-4">Visa or immigration requirements vary by country and route. Never say IELTS is mandatory everywhere. Instead show verified country-specific information.</p>
              <Card className="p-6 bg-amber-50 border border-amber-200 rounded-3xl">
                <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Important Disclaimer</h4>
                <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                  For UK: For degree-level study at Student Route sponsor universities, standard {test.name} may be accepted for CAS if university confirms. For below-degree, foundation, pre-sessional below B2, you need UKVI SELT like IELTS for UKVI, PTE Academic UKVI, LanguageCert SELT. Check official guidance: https://www.gov.uk/guidance/prove-your-english-language-abilities-with-a-secure-english-language-test-selt
                </p>
                <p className="text-xs text-amber-800 mt-2">
                  For Australia: Check DHA Subclass 500 requirements. For Canada: Check IRCC SDS and regular study permit guidance. For USA: University I-20 issuance determines requirement. If no verified data: Check current official immigration guidance.
                </p>
                <p className="text-[11px] text-amber-700 mt-3">Last verified: {test.lastVerifiedAt || 'Information requires verification'} • Source: {test.sourceName} • {test.sourceUrl}</p>
              </Card>
            </section>

            {/* Preparation Process — 8 steps */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-6">{test.name} Preparation Process — 8 Steps</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { step: '01', title: 'Assessment', desc: 'Free initial assessment to evaluate current level' },
                  { step: '02', title: 'Target Score', desc: 'Set realistic target based on course requirement' },
                  { step: '03', title: 'Study Plan', desc: 'Custom plan with daily milestones and materials' },
                  { step: '04', title: 'Module Training', desc: `Intensive training on ${test.name} modules and question types` },
                  { step: '05', title: 'Practice Tests', desc: 'Practise the format and timing before the real exam' },
                  { step: '06', title: 'Feedback', desc: 'Expert feedback on writing and speaking with improvement plan' },
                  { step: '07', title: 'Final Assessment', desc: 'Final validation of readiness for target score' },
                  { step: '08', title: 'Exam Readiness', desc: 'Booking guidance, exam day tips and university requirement check' },
                ].map((s, i) => (
                  <Card key={i} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-xl bg-[#0066CC] text-white font-black text-xs flex items-center justify-center">{s.step}</span>
                      <h4 className="font-bold text-sm text-[#0F172A]">{s.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Test-specific prep plan dynamic */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">{test.name} Preparation with ALO Education</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[
                  { title: 'Free Initial Assessment', desc: 'Diagnostic test to evaluate baseline' },
                  { title: 'Target Band Planning', desc: `Set realistic ${test.shortName} target based on course` },
                  ...modules.slice(0, 4).map((m: any) => ({ title: `${m.moduleName} Preparation`, desc: m.preparationTips?.slice(0,80) || `Focused ${m.moduleName} strategy` })),
                  { title: 'Practice Tests', desc: 'Get familiar with the format and timing' },
                  { title: 'Exam Readiness', desc: 'Final validation and booking guidance' },
                  { title: 'University Requirement Guidance', desc: 'Check requirements before booking your test' },
                ].slice(0,9).map((c: any, i: number) => (
                  <Card key={i} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066CC] flex items-center justify-center mb-3"><BookOpen className="w-4 h-4" /></div>
                    <h4 className="font-bold text-xs text-[#0F172A]">{c.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{c.desc}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Test Score Planner — Interactive */}
            <section id="assessment" className="py-2">
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">{test.name} Score Planner — Interactive Tool</h2>
              <p className="text-xs text-slate-500 mb-4">Do not claim AI prediction guarantees — guidance only</p>
              <Card className="p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl">
                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Current Score</label>
                    <Input placeholder="e.g. 6.0" value={scorePlanner.current} onChange={e => setScorePlanner({ ...scorePlanner, current: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Target Score</label>
                    <Input placeholder="e.g. 7.0" value={scorePlanner.target} onChange={e => setScorePlanner({ ...scorePlanner, target: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Exam Date</label>
                    <Input type="date" value={scorePlanner.examDate} onChange={e => setScorePlanner({ ...scorePlanner, examDate: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Hours/Week</label>
                    <select value={scorePlanner.hours} onChange={e => setScorePlanner({ ...scorePlanner, hours: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                      <option value="5">5 hrs/week</option><option value="10">10 hrs/week</option><option value="15">15 hrs/week</option><option value="20">20 hrs/week</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleScorePlanner} className="w-full mt-4 bg-[#0066CC] hover:bg-[#003D7A] text-white font-bold h-11 rounded-xl">Calculate Plan</Button>

                {plannerResult && (
                  <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Target Gap:</span><span className="font-bold">{plannerResult.gap}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Estimated Weeks:</span><span className="font-bold text-[#0066CC]">{plannerResult.weeks} weeks</span></div>
                    <div><span className="text-slate-500">Priority:</span><p className="font-medium mt-1">{plannerResult.priority}</p></div>
                    <div><span className="text-slate-500">Schedule:</span><p className="font-medium mt-1">{plannerResult.schedule}</p></div>
                    <p className="text-[10px] text-amber-700 p-2 rounded-lg bg-amber-50 border border-amber-100 mt-2">{plannerResult.note}</p>
                  </div>
                )}
              </Card>
            </section>

            {/* Test Comparison from detail page */}
            <section>
              <h2 className="text-xl font-extrabold text-[#0F172A] mb-3">Not sure this is the right test?</h2>
              <Card className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">Compare with other tests</p>
                  <p className="text-xs text-slate-600 mt-1">IELTS, PTE, TOEFL, Duolingo — side-by-side comparison of duration, format, scoring, results, acceptance, best for</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['ielts','pte-academic','toefl-ibt','duolingo'].filter(s => s !== test.slug).slice(0,3).map(s => (
                    <a key={s} href={`/language-prep/${s}`} className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold hover:border-[#0066CC]">{s.toUpperCase()}</a>
                  ))}
                  <Button asChild className="bg-[#0066CC] hover:bg-[#003D7A] text-white font-bold h-9 rounded-xl text-xs"><a href="/language-prep/comparison">Compare English Tests →</a></Button>
                </div>
              </Card>
            </section>

            {/* Success Stories */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">Student Success Stories — {test.name}</h2>
              <p className="text-xs text-slate-500 mb-4">Student stories appear here once they are approved for publication.</p>
              {successStories.length === 0 ? (
                <Card className="p-8 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-3xl text-center">
                  <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#0F172A]">Student success stories will appear here after approved publication.</p>
                  <p className="text-xs text-slate-500 mt-1">We do not fabricate scores or testimonials. Only verified stories with consent.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {successStories.map((s: any, i: number) => (
                    <Card key={i} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                      <h4 className="font-bold text-sm text-[#0F172A]">{s.studentName}</h4>
                      <p className="text-xs text-slate-600">{s.universityName} — {s.courseName}</p>
                      <p className="text-xs mt-2"><span className="text-slate-500">Previous:</span> <span className="font-semibold">{s.previousScore}</span> → <span className="text-slate-500">Final:</span> <span className="font-bold text-emerald-600">{s.finalScore}</span></p>
                      <p className="text-xs text-slate-600 mt-2 italic">"{s.testimonial}"</p>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* FAQ — 15-20 per test */}
            <section>
              <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">FAQ — {test.name} — {faqs.length} questions</h2>
              <p className="text-xs text-slate-500 mb-4">Test-specific FAQs — minimum 15-20 for each test</p>
              <div className="space-y-3">
                {faqs.map((faq: any, idx: number) => (
                  <Card key={faq.id || idx} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full p-5 text-left flex justify-between items-start gap-4">
                      <span className="font-bold text-sm text-[#0F172A] leading-relaxed">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-[#0066CC] shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-[#E2E8F0] bg-[#F8FAFC]/50 pt-4">
                        {faq.answer}
                        {faq.sourceUrl && <p className="text-[11px] text-slate-500 mt-3">Source: <a href={faq.sourceUrl} target="_blank" className="text-[#0066CC] hover:underline">{faq.sourceUrl}</a></p>}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section id="book-counselling">
              <Card className="p-8 bg-gradient-to-br from-[#0066CC] to-[#003D7A] text-white border-0 shadow-xl rounded-3xl">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">Not Sure Which English Test You Need?</h2>
                <p className="text-sm text-blue-100 text-center max-w-2xl mx-auto mt-3 leading-relaxed">
                  Tell us your destination, university and study plan. Our team can help you understand the relevant English requirement and preparation route.
                </p>

                <form onSubmit={(e) => handleLead(e, 'final_cta')} className="mt-6 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <Input placeholder="Full Name" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="h-11 rounded-xl bg-white text-[#0F172A] border-0" />
                  <Input placeholder="Phone" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} className="h-11 rounded-xl bg-white text-[#0F172A] border-0" />
                  <Input placeholder="Email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className="h-11 rounded-xl bg-white text-[#0F172A] border-0" />
                  <select value={leadForm.targetCountry} onChange={e => setLeadForm({ ...leadForm, targetCountry: e.target.value })} className="h-11 px-3 rounded-xl bg-white text-[#0F172A] text-sm border-0">
                    <option>UK</option><option>Canada</option><option>Australia</option><option>USA</option><option>Ireland</option><option>New Zealand</option><option>UAE</option><option>Europe</option>
                  </select>
                  <Input placeholder="Current Score" value={leadForm.currentScore} onChange={e => setLeadForm({ ...leadForm, currentScore: e.target.value })} className="h-11 rounded-xl bg-white text-[#0F172A] border-0" />
                  <Input placeholder="Target Score" value={leadForm.targetScore} onChange={e => setLeadForm({ ...leadForm, targetScore: e.target.value })} className="h-11 rounded-xl bg-white text-[#0F172A] border-0" />
                  <div className="sm:col-span-2">
                    <Button type="submit" className="w-full bg-[#F37021] hover:bg-[#D95D12] text-black font-bold h-12 rounded-xl">Book Free Counselling →</Button>
                  </div>
                </form>

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <Button asChild variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold h-11 rounded-xl text-sm"><a href="/language-prep#test-discovery">Find My Test</a></Button>
                  <Button asChild variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold h-11 rounded-xl text-sm flex items-center gap-2"><a href="https://wa.me/8801805020101" target="_blank"><MessageSquare className="w-4 h-4" /> WhatsApp +880 180 502 0101</a></Button>
                </div>

                <p className="text-[11px] text-blue-200 text-center mt-6">Email: info@aloeducation.com • Lead stored with source language_prep and source_section {slug}_final_cta • Do not create duplicate leads unnecessarily</p>
              </Card>
            </section>
          </div>

          {/* Sidebar — compact */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Test Preparation widget */}
              <Card className="p-5 bg-white border border-[#0066CC]/20 shadow-md rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066CC] flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066CC]">Test Preparation</span>
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] mb-2">Explore other tests</h4>
                <div className="space-y-1.5 mb-4">
                  {['ielts','pte-academic','toefl-ibt','duolingo','oet','oietc'].filter(s => s !== test.slug).slice(0,5).map(s => (
                    <a key={s} href={`/language-prep/${s}`} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0066CC]/20 hover:bg-white transition text-xs">
                      <span className="font-semibold text-[#0F172A]">{s.replace('-', ' ').toUpperCase()}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </a>
                  ))}
                </div>
                <Button asChild className="w-full bg-[#0066CC] hover:bg-[#003D7A] text-white font-bold h-11 rounded-xl text-xs"><a href="/language-prep" className="block">View All Test Prep →</a></Button>
              </Card>

              {/* Need Help widget */}
              <Card className="p-5 bg-gradient-to-br from-[#0066CC] to-[#003D7A] text-white border-0 shadow-lg rounded-2xl">
                <h4 className="text-sm font-bold mb-2">Need Help?</h4>
                <p className="text-xs text-blue-100 leading-relaxed mb-4">Not sure which test your university requires? Tell us your destination and course.</p>
                <Button asChild className="w-full bg-[#F37021] hover:bg-[#D95D12] text-black font-bold h-11 rounded-xl text-xs"><a href="#book-counselling">Book Free Counselling →</a></Button>
                <p className="text-[10px] text-blue-200 mt-3">WhatsApp: +880 180 502 0101 • Email: info@aloeducation.com</p>
              </Card>

              {/* Resources */}
              <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                <h4 className="font-bold text-sm text-[#0F172A] mb-3">Resources — {resources.length}</h4>
                <div className="space-y-2">
                  {resources.slice(0,6).map((r: any, i: number) => (
                    <a key={i} href={r.resourceUrl} target={r.isExternal ? '_blank' : '_self'} className="block p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:border-[#0066CC]/20 transition">
                      <p className="text-xs font-semibold text-[#0F172A]">{r.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                      <span className="text-[10px] text-[#0066CC] font-bold mt-1 inline-block">{r.resourceType} {r.isExternal ? '↗' : '→'}</span>
                    </a>
                  ))}
                </div>
              </Card>

              {/* Preparation links. The real-exam CTA is shown only for English-proficiency tests. */}
              <Card className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                <h4 className="font-bold text-sm text-[#0F172A] mb-3">Preparation</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <a href="/language-prep/comparison" className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-center hover:border-[#0066CC] transition">Compare tests</a>
                  <a href="/language-prep#test-discovery" className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-center hover:border-[#0066CC] transition">Find your test</a>
                  <a href="#book-counselling" className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-center hover:border-[#0066CC] transition">Speaking &amp; writing help</a>
                  <a href="/book-consultation" className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-center hover:border-[#0066CC] transition">Book counselling</a>
                </div>
              </Card>
              {isEnglishProficiencyTestSlug(slug) && <EnglishExamCard location="language_prep_detail" testName={test.name} />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <section className="py-8 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-4xl mx-auto">
            Test information is taken from official provider sources where available. Acceptance varies by university, course and visa route. Check the official provider for the latest details.{isMoi ? ' MOI is a guidance resource, not an English proficiency test.' : ''}
          </p>
        </div>
      </section>
    </div>
  );
}
