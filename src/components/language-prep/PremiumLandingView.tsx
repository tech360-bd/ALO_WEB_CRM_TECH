'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award, BookOpen, Calendar, CheckCircle2, ChevronDown, Clock, Compass, Globe, GraduationCap,
  HelpCircle, Layers, MapPin, MessageSquare, Phone, Search, ShieldCheck, Sparkles, Star,
  Target, Users, Zap, ArrowRight, Play, FileText, BarChart3, Lightbulb, Timer, BookMarked,
  Headphones, PenTool, Mic, BookOpenCheck, Trophy, TrendingUp, AlertCircle, Building2,
  Bookmark, ClipboardCheck, MessageCircle, Video, Library, GraduationCap as GradCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { ENGLISH_PREP_TESTS } from '@/lib/language-prep/data';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';
import { submitLanguagePrepLead } from '@/lib/language-prep/submit-lead';
import { PrepVsExamSplit } from '@/components/website/EnglishExamCta';

// Premium Language Prep Landing — White-first, no dark overlay, excellent typography

export default function PremiumLanguagePrepLandingView() {
  const [tests, setTests] = useState<any[]>(ENGLISH_PREP_TESTS);
  const [selectedCountry, setSelectedCountry] = useState('uk');
  const [comparisonTests, setComparisonTests] = useState<string[]>(['ielts', 'pte-academic', 'toefl-ibt', 'duolingo']);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', email: '', test: 'IELTS', targetScore: '7.0', destination: 'UK', currentLevel: 'Intermediate',
  });
  const [discoveryForm, setDiscoveryForm] = useState({
    destination: 'UK', studyLevel: 'Masters', university: '', course: '', intake: 'Sep 2026', currentLevel: 'Intermediate', targetScore: '6.5', format: 'Computer', prepTime: '2-3 months',
  });
  const [recommended, setRecommended] = useState<any>(null);
  const [scoreExplorer, setScoreExplorer] = useState({ country: 'UK', university: '', course: '', level: 'Masters' });
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch real tests from API — DB-driven
    fetch('/api/language-prep/tests')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.tests?.length > 0) setTests(d.tests);
      })
      .catch(() => {});
  }, []);

  const handleDiscovery = () => {
    // Simple recommendation logic based on destination
    let rec: any = null;
    if (discoveryForm.destination === 'UK') {
      if (discoveryForm.studyLevel === 'Foundation') {
        rec = { primary: tests.find(t => t.slug === 'ielts-ukvi'), also: [tests.find(t => t.slug === 'pte-academic'), tests.find(t => t.slug === 'languagecert')], reason: 'For UK Foundation and below-degree, UKVI SELT is required. IELTS for UKVI or PTE Academic UKVI is mandatory.', acceptance: 'UKVI SELT approved — Check university CAS requirements', path: 'Diagnostic → Target 5.5-6.0 → 4-6 weeks prep → Mock → Booking', score: '5.5-6.0 overall', next: 'Check university course page for exact SELT requirement' };
      } else {
        rec = { primary: tests.find(t => t.slug === 'ielts'), also: [tests.find(t => t.slug === 'pte-academic'), tests.find(t => t.slug === 'oxford-ellt')], reason: 'IELTS Academic offers highest acceptance across UK Russell Group and is accepted for degree-level CAS at Student Route sponsors.', acceptance: '100% UK universities — Acceptance varies by university, course and visa route', path: 'Assessment → Target 6.5 → Study Plan → Module Practice → Mock → Feedback → Readiness', score: discoveryForm.targetScore || '6.5 (6.0 each)', next: 'Explore IELTS modules and book free counselling' };
      }
    } else if (discoveryForm.destination === 'Australia') {
      rec = { primary: tests.find(t => t.slug === 'pte-academic'), also: [tests.find(t => t.slug === 'ielts'), tests.find(t => t.slug === 'toefl-ibt')], reason: 'PTE Academic offers fastest 48-hour results and is fully accepted by Australian DHA for Subclass 500 visa and all universities.', acceptance: 'All Australian universities + DHA', path: 'Diagnostic → Target 58-65 → Computer practice → Mock → Booking', score: '58-65 (58 each)', next: 'Check G8 requirements and DHA guidance' };
    } else if (discoveryForm.destination === 'USA') {
      rec = { primary: tests.find(t => t.slug === 'toefl-ibt'), also: [tests.find(t => t.slug === 'duolingo'), tests.find(t => t.slug === 'ielts')], reason: 'TOEFL iBT most popular for USA I-20, Duolingo fast affordable at-home option widely accepted for USA admission.', acceptance: '12,000+ institutions — Acceptance varies', path: 'Assessment → Target 90-100 → Integrated practice → Mock', score: '80-100 iBT', next: 'Find matching courses accepting TOEFL' };
    } else {
      rec = { primary: tests.find(t => t.slug === 'ielts'), also: [tests.find(t => t.slug === 'pte-academic'), tests.find(t => t.slug === 'toefl-ibt')], reason: 'IELTS Academic and PTE Academic offer highest global acceptance across UK, Australia, Canada, USA, Europe.', acceptance: 'Global top 200 universities', path: 'Assessment → Target planning → Study plan → Module training → Mock → Feedback', score: discoveryForm.targetScore || '6.5', next: 'Explore test detail pages' };
    }
    setRecommended(rec);
    toast.success(`Recommended: ${rec?.primary?.name} — ${rec?.reason}`);
  };

  const handleScoreExplorer = async () => {
    if (!scoreExplorer.university && !scoreExplorer.course) {
      setScoreResult({ message: 'Requirement not available in database. Check university course page.', isEmpty: true });
      return;
    }
    try {
      const params = new URLSearchParams(scoreExplorer as any).toString();
      const res = await fetch(`/api/language-prep/requirements?${params}`);
      const data = await res.json();
      if (data.requirements?.length > 0) {
        setScoreResult(data.requirements[0]);
      } else {
        setScoreResult({ message: 'Requirement not available in database. Check university course page.', isEmpty: true, disclaimer: data.disclaimer });
      }
    } catch {
      setScoreResult({ message: 'Requirement not available in database. Check university course page.', isEmpty: true });
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent, sourceSection: string) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error('Please enter name and phone');
      return;
    }
    setSubmitting(true);
    const result = await submitLanguagePrepLead({
      name: leadForm.name,
      phone: leadForm.phone,
      email: leadForm.email,
      countryName: leadForm.destination,
      testName: leadForm.test,
      targetScore: leadForm.targetScore,
      currentLevel: leadForm.currentLevel,
      source: 'language_prep',
      sourceSection,
      notes: `Landing lead — Destination: ${leadForm.destination}, Current: ${leadForm.currentLevel}`,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success('Consultation booked! Our counselor will contact you shortly.');
      setLeadForm({ name: '', phone: '', email: '', test: 'IELTS', targetScore: '7.0', destination: 'UK', currentLevel: 'Intermediate' });
    } else {
      toast.error(result.message);
    }
  };

  const faqs = [
    { q: 'What English test do I need for study abroad?', a: 'The right test depends on your destination, university, course, visa route, timeline and strengths. UK degree-level typically IELTS Academic or PTE Academic; UK Foundation requires UKVI SELT like IELTS for UKVI. Australia accepts IELTS, PTE, TOEFL. USA favours TOEFL iBT and Duolingo. Canada accepts IELTS, PTE, TOEFL. Acceptance varies by university, course and visa route — Check university-specific acceptance.' },
    { q: 'What score do I need for UK universities?', a: 'Typical: Foundation 5.5, Bachelor 6.0-6.5 (no band below 5.5-6.0), Master 6.5-7.0 (no band below 6.0), MBA 6.5-7.0. Competitive may require 7.0-7.5. Check your specific course page for verified requirement. Requirements vary.' },
    { q: 'Which test is suitable for my destination?', a: 'UK: IELTS Academic / IELTS UKVI / PTE Academic / PTE UKVI / Oxford ELLT / LanguageCert SELT. Australia: PTE Academic, IELTS Academic. USA: TOEFL iBT, Duolingo, IELTS. Canada: IELTS, PTE, TOEFL. Ireland: IELTS, Duolingo, PTE. New Zealand: IELTS, PTE. Dubai/UAE: IELTS, TOEFL, PTE. Europe: IELTS, TOEFL, PTE. Acceptance varies by university, course and visa route.' },
    { q: 'How long does preparation take?', a: 'Depends on current level and target: Band 5.0→6.0: 6-8 weeks (10-15 hrs/week), 6.0→6.5: 4-8 weeks, 6.5→7.0: 8-12 weeks, 7.0→7.5: 12+ weeks. PTE similar: 50→58: 4-6 weeks, 58→65: 6-8 weeks. ALO free assessment sets realistic timeline.' },
    { q: 'How does ALO help me prepare?', a: 'ALO provides free initial assessment, target score planning based on course requirement, structured study materials, timed mock tests under exam conditions, writing feedback, speaking practice with certified coaches, score strategy focusing on weakest modules, and university-specific requirement guidance. Book free counselling.' },
    { q: 'Can I practice with mock tests?', a: 'The preparation guides on this site explain each test\u2019s format, timing and scoring. To sit a real English test, use the "Take the English Test" link on this page. It opens the English Test Platform.' },
    { q: 'Can I compare English tests?', a: 'Yes, use our Test Comparison table to compare duration, format, scoring, typical result timeline, acceptance, best for and preparation style. Desktop shows full table, mobile scrollable cards.' },
    { q: 'Can I speak with a counselor?', a: 'Yes, book free counselling via hero CTA, final CTA, or side widgets. Our team helps understand relevant English requirement and preparation route. WhatsApp +880 180 502 0101, Email info@aloeducation.com. Lead stored with source language_prep and source_section.' },
    { q: 'What is IELTS for UKVI?', a: 'IELTS for UKVI is a Secure English Language Test (SELT) approved by UKVI. Content, format and scoring identical to standard IELTS but delivered under UKVI security with video recording and UKVI reference number. Required for certain UK visa routes like Foundation and below-degree. Check UKVI guidance.' },
    { q: 'Is MOI accepted instead of English test?', a: 'MOI (Medium of Instruction) is guidance resource, not an English proficiency test. Acceptance is strictly university and course specific — only where university officially confirms MOI acceptance with written confirmation. For visa, check official immigration guidance separately. Many visa routes require SELT.' },
  ];

  const countries = [
    { slug: 'uk', name: 'UK', flag: '🇬🇧' },
    { slug: 'canada', name: 'Canada', flag: '🇨🇦' },
    { slug: 'australia', name: 'Australia', flag: '🇦🇺' },
    { slug: 'usa', name: 'USA', flag: '🇺🇸' },
    { slug: 'ireland', name: 'Ireland', flag: '🇮🇪' },
    { slug: 'new-zealand', name: 'New Zealand', flag: '🇳🇿' },
    { slug: 'uae', name: 'Dubai/UAE', flag: '🇦🇪' },
    { slug: 'europe', name: 'Europe', flag: '🇪🇺' },
  ];

  const testCards = tests.slice(0, 12); // Show 12 main

  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      {/* SEO — JSON-LD FAQPage + BreadcrumbList — no fake, verified sources */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aloeducation.com/' }, { '@type': 'ListItem', position: 2, name: 'Language Preparation', item: 'https://aloeducation.com/language-prep' }] }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f: any) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }) }} />
      {/* ============ 1. HERO — White-first, premium, no dark overlay ============ */}
      <section className="relative bg-white pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden">
        {/* Subtle soft background shapes — no excessive gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC] to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-50 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left — Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0057B8] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> ALO Language Preparation Hub
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.05] text-[#0F172A]">
                English Language <span className="text-[#0057B8]">Preparation</span>
              </h1>

              <p className="text-lg sm:text-xl font-medium text-slate-700 leading-relaxed max-w-2xl">
                Master English proficiency tests with structured preparation, realistic practice, expert guidance, and destination-focused score planning.
              </p>

              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Choose the right English test, understand your target score, prepare strategically, and move closer to your university admission goal.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="bg-[#E8501A] hover:bg-[#d14315] text-black font-bold text-sm h-12 px-7 rounded-xl shadow-sm"><a href="#book-counselling">
                    Book Free Counselling <ArrowRight className="w-4 h-4 ml-1" />
                  </a></Button>
                <Button asChild variant="outline" className="border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 font-semibold text-sm h-12 px-6 rounded-xl bg-white"><a href="#test-discovery">
                    Find Your English Test
                  </a></Button>
                <Button asChild variant="outline" className="border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 font-semibold text-sm h-12 px-6 rounded-xl bg-white"><a href="#test-discovery">
                    Take Free Assessment
                  </a></Button>
              </div>

              {/* Hero Quick Actions */}
              <div className="flex flex-wrap gap-2.5 pt-4">
                <a href="#test-discovery" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#0057B8] hover:text-[#0057B8] transition shadow-sm">
                  <Target className="w-3.5 h-3.5" /> Find My Test
                </a>
                <a href="#score-explorer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#0057B8] transition shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5" /> Check Required Score
                </a>
                <a href="#test-comparison" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#0057B8] transition shadow-sm">
                  <Layers className="w-3.5 h-3.5" /> Compare Tests
                </a>
                <a href="#book-counselling" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0057B8] text-white text-xs font-semibold hover:bg-[#003F87] transition shadow-sm">
                  <MessageSquare className="w-3.5 h-3.5" /> Book Counselling
                </a>
              </div>
            </div>

            {/* Right — Premium Education Visual — Dashboard */}
            <div className="lg:col-span-5 relative">
              <Card className="p-6 bg-white border border-[#E2E8F0] shadow-xl rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
                    My Preparation Dashboard
                  </h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Live Progress</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Score</p>
                    <p className="text-lg font-extrabold text-[#0057B8] mt-1">7.0 Overall</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">IELTS Academic</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Score</p>
                    <p className="text-lg font-extrabold text-[#0F172A] mt-1">6.0 Estimated</p>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-[#0057B8] rounded-full" style={{ width: '64%' }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Preparation Progress</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-1">64%</p>
                    <p className="text-[11px] text-slate-500">Weakest: Writing</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100">
                    <p className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Practice</p>
                    <p className="text-lg font-extrabold text-[#E8501A] mt-1">Guides</p>
                    <p className="text-[11px] text-orange-700">Choose your test</p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center"><Headphones className="w-3.5 h-3.5" /></div>
                      <span className="text-xs font-semibold text-[#0F172A]">IELTS Listening</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">7.5 ✓</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#E8501A] flex items-center justify-center"><PenTool className="w-3.5 h-3.5" /></div>
                      <span className="text-xs font-semibold text-[#0F172A]">Writing Feedback</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600">6.0 • Review</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Mic className="w-3.5 h-3.5" /></div>
                      <span className="text-xs font-semibold text-[#0F172A]">Speaking Practice</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#0057B8]">Booked</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold">
                  <div className="text-center p-2 rounded-xl bg-blue-50 text-[#0057B8] border border-blue-100">IELTS</div>
                  <div className="text-center p-2 rounded-xl bg-white border border-[#E2E8F0] text-slate-700">PTE</div>
                  <div className="text-center p-2 rounded-xl bg-white border border-[#E2E8F0] text-slate-700">TOEFL</div>
                  <div className="text-center p-2 rounded-xl bg-white border border-[#E2E8F0] text-slate-700">Duolingo</div>
                </div>

                {/* Floating mini cards */}
                <div className="absolute -top-3 -right-3 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-lg text-[11px] font-bold text-[#0F172A]">
                  <Target className="w-3.5 h-3.5 text-[#0057B8]" /> Target: 7.0
                </div>
                <div className="absolute -bottom-3 -left-3 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-emerald-200 shadow-lg text-[11px] font-bold text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" /> Progress 64%
                </div>
              </Card>

              {/* Lead form quick */}
              <Card id="book-counselling" className="mt-6 p-5 bg-white border border-[#E2E8F0] shadow-lg rounded-2xl">
                <h4 className="font-bold text-sm text-[#0F172A] mb-3">Book Free Counselling</h4>
                <form onSubmit={(e) => handleLeadSubmit(e, 'hero')} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input placeholder="Full Name" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="h-11 text-sm rounded-xl border-[#E2E8F0]" />
                    <Input placeholder="Phone" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} className="h-11 text-sm rounded-xl border-[#E2E8F0]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input placeholder="Email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className="h-11 text-sm rounded-xl border-[#E2E8F0]" />
                    <select value={leadForm.test} onChange={e => setLeadForm({ ...leadForm, test: e.target.value })} className="h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                      <option>IELTS</option><option>PTE Academic</option><option>TOEFL iBT</option><option>Duolingo</option><option>OIETC</option><option>MOI Guidance</option>
                    </select>
                  </div>
                  <Button disabled={submitting} type="submit" className="w-full bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-11 rounded-xl text-sm">
                    {submitting ? 'Booking...' : 'Book Free Counselling →'}
                  </Button>
                  <p className="text-[10px] text-slate-500 text-center">We respect your privacy — No spam, only relevant guidance. Source: language_prep hero</p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 1b. PREPARATION vs REAL EXAM — clearly separated ============ */}
      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PrepVsExamSplit
            location="language_prep_hub"
            prepHref="#test-discovery"
            prepTitle="Prepare with ALO Education"
            prepCta="Find the right test"
          />
        </div>
      </section>

      {/* ============ 2. TEST DISCOVERY ============ */}
      <section id="test-discovery" className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge className="bg-white border border-[#E2E8F0] text-[#0057B8] font-bold text-[11px] px-3 py-1 mb-3">TEST DISCOVERY</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">Which English Test Is Right for You?</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">The right test depends on your university, destination, course, visa pathway, timeline, and personal strengths.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-7 p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl">
              <h3 className="font-bold text-base text-[#0F172A] mb-5 flex items-center gap-2"><Compass className="w-4 h-4 text-[#0057B8]" /> Find My Test — Interactive Tool</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Destination</label>
                  <select value={discoveryForm.destination} onChange={e => setDiscoveryForm({ ...discoveryForm, destination: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                    <option value="UK">UK</option><option value="Canada">Canada</option><option value="Australia">Australia</option><option value="USA">USA</option><option value="Ireland">Ireland</option><option value="New Zealand">New Zealand</option><option value="UAE">Dubai/UAE</option><option value="Europe">Europe</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Study Level</label>
                  <select value={discoveryForm.studyLevel} onChange={e => setDiscoveryForm({ ...discoveryForm, studyLevel: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                    <option>Foundation</option><option>Bachelor</option><option>Masters</option><option>PhD</option><option>MBA</option><option>Diploma</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">University (Optional)</label>
                  <Input placeholder="e.g. University of Manchester" value={discoveryForm.university} onChange={e => setDiscoveryForm({ ...discoveryForm, university: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Course (Optional)</label>
                  <Input placeholder="e.g. MSc Computer Science" value={discoveryForm.course} onChange={e => setDiscoveryForm({ ...discoveryForm, course: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Preferred Intake</label>
                  <select value={discoveryForm.intake} onChange={e => setDiscoveryForm({ ...discoveryForm, intake: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                    <option>Sep 2026</option><option>Jan 2027</option><option>May 2026</option><option>Sep 2027</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Current English Level</label>
                  <select value={discoveryForm.currentLevel} onChange={e => setDiscoveryForm({ ...discoveryForm, currentLevel: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                    <option>Beginner</option><option>Intermediate</option><option>Upper-Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Target Score</label>
                  <Input placeholder="e.g. 6.5, 7.0, 65, 100" value={discoveryForm.targetScore} onChange={e => setDiscoveryForm({ ...discoveryForm, targetScore: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Preferred Format</label>
                  <select value={discoveryForm.format} onChange={e => setDiscoveryForm({ ...discoveryForm, format: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                    <option>Computer</option><option>Paper</option><option>Online at home</option><option>Any</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Preparation Time Available</label>
                  <select value={discoveryForm.prepTime} onChange={e => setDiscoveryForm({ ...discoveryForm, prepTime: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                    <option>Less than 1 month</option><option>1-2 months</option><option>2-3 months</option><option>3-6 months</option><option>6+ months</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleDiscovery} className="w-full mt-6 bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-12 rounded-xl">
                Find Recommended Tests <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Card>

            <div className="lg:col-span-5 space-y-4">
              {!recommended ? (
                <Card className="p-8 bg-white border border-dashed border-[#E2E8F0] rounded-3xl text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0057B8] flex items-center justify-center mx-auto mb-4"><Search className="w-6 h-6" /></div>
                  <h4 className="font-bold text-sm text-[#0F172A]">Your recommendation will appear here</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">Fill destination, study level and preferences, then click Find Recommended Tests. We will show why this test is recommended, acceptance info, preparation path, target score and next action.</p>
                </Card>
              ) : (
                <Card className="p-6 bg-white border border-[#0057B8]/20 shadow-lg rounded-3xl">
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold mb-3">RECOMMENDED</Badge>
                  <h3 className="text-xl font-extrabold text-[#0F172A]">{recommended.primary?.name}</h3>
                  <p className="text-xs text-[#0057B8] font-semibold mt-1">{recommended.primary?.provider}</p>
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">{recommended.reason}</p>

                  <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Acceptance:</span><span className="font-semibold text-[#0F172A]">{recommended.acceptance}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Target Score:</span><span className="font-bold text-[#0057B8]">{recommended.score}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Prep Path:</span><span className="font-medium text-slate-700">{recommended.path}</span></div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Also Consider</p>
                    <div className="flex flex-wrap gap-2">
                      {recommended.also?.map((t: any, i: number) => t && (
                        <a key={i} href={`/language-prep/${t.slug}`} className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:border-[#0057B8] hover:text-[#0057B8] transition">
                          {t.name}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button asChild className="w-full bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-11 rounded-xl text-xs"><a href={`/language-prep/${recommended.primary?.slug}`} className="flex-1">Explore {recommended.primary?.name} →</a></Button>
                    <Button asChild variant="outline" className="border-[#E2E8F0] bg-white font-semibold h-11 rounded-xl text-xs"><a href="#book-counselling">Book Counselling</a></Button>
                  </div>

                  <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">Next: {recommended.next} — Acceptance varies by university, course and visa route. Check official provider information.</p>
                </Card>
              )}

              <TestPreparationMiniCard className="mt-2" contextTitle="Prepare for English proficiency tests" recommendedTest="IELTS / PTE / TOEFL" targetScore="6.5+ Overall" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ 3. WHY ENGLISH PROFICIENCY MATTERS ============ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <Badge className="bg-blue-50 text-[#0057B8] border-blue-100 font-bold text-[11px] px-3 py-1 mb-3">WHY IT MATTERS</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">Why English Language Proficiency Matters</h2>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                English proficiency is often an important part of international university admission and, depending on the destination and immigration pathway, may also be relevant to visa or immigration requirements.
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#0057B8]" /> University Requirements</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">Universities set English requirements to ensure you can succeed in academic lectures, reading, writing and discussion. Requirements vary by course level and subject.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[#0057B8]" /> Course-Specific</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">Nursing, law, journalism and education often require higher scores (e.g. 7.0) than general programmes (6.0-6.5). Check course page.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-[#0057B8]" /> Destination-Specific</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">UK, Australia, Canada, USA have different accepted tests and visa rules. Some require SELT like IELTS for UKVI.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#0057B8]" /> Visa Considerations</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">Visa or immigration requirements vary by country and route. Never assume one test covers all visa routes. Check official immigration guidance.</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Requirements vary by country, visa route, university and course. ALO helps you understand test selection, target score, preparation strategy and documentation — always verify via official provider and university course page.</span>
              </p>
            </div>
            <div className="lg:col-span-5">
              <Card className="p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl">
                <h3 className="font-bold text-sm text-[#0F172A] mb-4">ALO helps you understand</h3>
                <div className="space-y-3">
                  {[
                    'University requirements and minimum overall & component scores',
                    'Course-specific requirements and higher thresholds for competitive courses',
                    'Destination-specific accepted tests and SELT rules',
                    'Test selection based on strengths, timeline and format preference',
                    'Target score planning and realistic preparation roadmap',
                    'Preparation strategy, materials and mock test schedule',
                    'Documentation and verification via source URL and last verified date',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 4. WHY TAKE AN ENGLISH TEST — 4 cards ============ */}
      <section className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Why Take an English Test?</h2>
            <p className="text-sm text-slate-600 mt-2">Four key reasons students take English proficiency tests for study abroad.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: ClipboardCheck, title: 'Meet Admission Requirements', desc: 'Most universities require proof of English proficiency for international students. Your test score helps admissions assess readiness for academic study.', color: 'blue' },
              { icon: Trophy, title: 'Strengthen Your Application', desc: 'A strong English score demonstrates commitment and readiness, helping you stand out in competitive programmes and scholarship consideration.', color: 'emerald' },
              { icon: BookMarked, title: 'Prepare for Academic Study', desc: 'Preparation builds academic reading, writing, listening and speaking skills essential for lectures, assignments and campus life.', color: 'orange' },
              { icon: Compass, title: 'Plan Your Study Abroad Journey', desc: 'Understanding required test and target score early helps plan timeline, budget and preparation strategy for admission and visa steps.', color: 'purple' },
            ].map((card, i) => (
              <Card key={i} className="p-6 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#0057B8]/20 transition-all rounded-3xl group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  card.color === 'blue' ? 'bg-blue-50 text-[#0057B8]' :
                  card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  card.color === 'orange' ? 'bg-orange-50 text-[#E8501A]' : 'bg-purple-50 text-purple-600'
                }`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172A] mb-2">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{card.desc}</p>
                <a href="#test-discovery" className="text-xs font-bold text-[#0057B8] group-hover:text-[#E8501A] transition flex items-center gap-1">
                  Learn More <ArrowRight className="w-3 h-3" />
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 5. FIND THE CORRECT TEST — 4-step journey ============ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Find the Correct Test — 4-Step Journey</h2>
            <p className="text-sm text-slate-600 mt-2">Logical steps to choose destination, check requirements, select suitable test and prepare for target score.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line for desktop */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-100 via-orange-100 to-emerald-100" />
            {[
              { step: '01', title: 'Choose Destination', desc: 'Select UK, Canada, Australia, USA, Ireland, New Zealand, Dubai/UAE or Europe. Each has different accepted tests and visa rules.', icon: MapPin },
              { step: '02', title: 'Check University Requirements', desc: 'Check course page for minimum overall and component scores, waiver availability, remarks and source URL.', icon: Building2 },
              { step: '03', title: 'Select Suitable Test', desc: 'Based on acceptance, format preference (Paper/Computer/Online), timeline and strengths, choose IELTS, PTE, TOEFL, Duolingo, OET etc.', icon: Target },
              { step: '04', title: 'Prepare for Target Score', desc: 'Free assessment, target planning, study plan, module practice, mock tests, expert feedback and final readiness check.', icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="relative">
                <Card className="p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl relative z-10 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#0057B8] text-white font-black flex items-center justify-center mb-4 text-sm shadow-md">{s.step}</div>
                  <h3 className="font-bold text-sm text-[#0F172A] mb-2 flex items-center gap-2"><s.icon className="w-4 h-4 text-[#0057B8]" /> {s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. ENGLISH TEST CARDS — Dynamic ============ */}
      <section id="test-cards" className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">English Test Cards — Database Driven</h2>
              <p className="text-sm text-slate-600 mt-2">Explore 15 tests — IELTS, PTE, TOEFL, Duolingo, OET, OIETC, Oxford ELLT, LanguageCert, Kaplan, GRE, GMAT, SAT, ACT, MOI Guidance.</p>
              <p className="text-[11px] text-amber-700 mt-2 p-2 rounded-lg bg-amber-50 border border-amber-100 inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> MOI Guidance is guidance resource, not incorrectly represented as English proficiency test. Do not hardcode price/result time unless verified — Check current provider information.
              </p>
            </div>
            <Button asChild variant="outline" className="bg-white border-[#E2E8F0] font-semibold text-sm h-11 rounded-xl"><a href="/language-prep/comparison">Compare All Tests →</a></Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {testCards.map((t: any) => (
              <Card key={t.id} className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#0057B8]/20 transition-all rounded-3xl flex flex-col justify-between h-full group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge className={`${t.isPopular ? 'bg-[#E8501A] text-black' : 'bg-blue-50 text-[#0057B8] border-blue-100'} font-bold text-[10px] px-2.5 py-1`}>
                      {t.isPopular ? 'Popular' : t.testType === 'moi_guidance' ? 'Guidance' : t.testType === 'academic' ? 'Academic Test' : 'English Test'}
                    </Badge>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">{t.durationDisplay}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#0F172A]">{t.name}</h3>
                  <p className="text-[11px] text-[#0057B8] font-semibold mt-0.5">{t.provider}</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">{t.shortDescription}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Format:</span>
                      <span className="font-semibold text-[#0F172A]">{t.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Scoring:</span>
                      <span className="font-semibold text-[#0F172A]">{t.scoringSystem}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Results:</span>
                      <span className="font-semibold text-emerald-600">{t.resultTimeline}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Cost:</span>
                      <span className="font-semibold text-slate-700">{t.costSummary}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Accepted For</p>
                    <div className="flex flex-wrap gap-1">
                      {(t.acceptanceSummary?.split(',').slice(0,4) || ['UK','Australia','Canada','USA']).map((c: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-slate-700 font-medium">{c.trim()}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Best For</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{t.bestFor}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex gap-2">
                  <Button asChild className="w-full bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-10 rounded-xl text-xs"><a href={`/language-prep/${t.slug}`} className="flex-1">Learn More</a></Button>
                  <Button asChild variant="outline" className="bg-white border-[#E2E8F0] font-semibold h-10 rounded-xl text-xs px-3"><a href={`/language-prep/comparison?tests=${t.slug}`}>Compare</a></Button>
                </div>

                <p className="text-[9px] text-slate-400 mt-2 text-center">Source: {t.sourceName} • Verified: {t.lastVerifiedAt || 'Check official'} • Acceptance varies</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 7. TEST COMPARISON ============ */}
      <section id="test-comparison" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Compare English Tests</h2>
            <p className="text-sm text-slate-600 mt-2">Side-by-side evaluation of test durations, result delivery speed, scoring scales, and delivery formats.</p>
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[#E2E8F0] shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#0F172A] border-b border-[#E2E8F0]">
                  <th className="p-4 font-bold">Test</th>
                  <th className="p-4 font-bold">Duration</th>
                  <th className="p-4 font-bold">Format</th>
                  <th className="p-4 font-bold">Scoring</th>
                  <th className="p-4 font-bold">Typical Result Timeline</th>
                  <th className="p-4 font-bold">Acceptance</th>
                  <th className="p-4 font-bold">Best For</th>
                  <th className="p-4 font-bold">Preparation Style</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {tests.filter(t => comparisonTests.includes(t.slug)).map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-4 font-bold text-[#0057B8]"><a href={`/language-prep/${t.slug}`} className="hover:underline">{t.name}</a></td>
                    <td className="p-4 text-slate-700">{t.durationDisplay}</td>
                    <td className="p-4 text-slate-600">{t.format}</td>
                    <td className="p-4 text-slate-700">{t.scoringSystem}</td>
                    <td className="p-4 font-medium text-emerald-600">{t.resultTimeline}</td>
                    <td className="p-4 text-slate-600">{t.acceptanceSummary?.slice(0,60)}...</td>
                    <td className="p-4 text-slate-700">{t.bestFor?.slice(0,50)}...</td>
                    <td className="p-4 text-slate-600">Module practice + Mock + Feedback</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid gap-4">
            {tests.filter(t => comparisonTests.includes(t.slug)).map((t: any) => (
              <Card key={t.id} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl">
                <h4 className="font-bold text-sm text-[#0057B8]">{t.name}</h4>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                  <div><span className="text-slate-500">Duration:</span><p className="font-semibold text-[#0F172A]">{t.durationDisplay}</p></div>
                  <div><span className="text-slate-500">Format:</span><p className="font-semibold">{t.format}</p></div>
                  <div><span className="text-slate-500">Scoring:</span><p className="font-semibold">{t.scoringSystem}</p></div>
                  <div><span className="text-slate-500">Results:</span><p className="font-semibold text-emerald-600">{t.resultTimeline}</p></div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 font-semibold h-11 rounded-xl shadow-sm"><a href="/language-prep/comparison">View Full Comparison →</a></Button>
          </div>
        </div>
      </section>

      {/* ============ 8. DESTINATION ACCEPTANCE EXPLORER ============ */}
      <section className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Destination Acceptance Explorer</h2>
            <p className="text-sm text-slate-600 mt-2">Select a country to see relevant English tests. Acceptance varies by university, course and visa route.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {countries.map(c => (
              <button
                key={c.slug}
                onClick={() => setSelectedCountry(c.slug)}
                className={`px-4 py-2.5 rounded-full text-sm font-bold border transition-all ${
                  selectedCountry === c.slug ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-md' : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#0057B8] hover:text-[#0057B8]'
                }`}
              >
                <span className="mr-1.5">{c.flag}</span> {c.name}
              </button>
            ))}
          </div>

          <Card className="p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0057B8]" /> {countries.find(c => c.slug === selectedCountry)?.flag} {countries.find(c => c.slug === selectedCountry)?.name} — Relevant Tests
              </h3>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Acceptance varies</Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.filter(t => ['ielts','ielts-ukvi','pte-academic','toefl-ibt','duolingo','oietc','oxford-ellt','languagecert','oet'].includes(t.slug)).slice(0,6).map((t: any) => (
                <a key={t.id} href={`/language-prep/${t.slug}`} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0057B8]/30 hover:bg-white hover:shadow-sm transition group">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0057B8]">{t.name}</h4>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0057B8]" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{t.shortDescription}</p>
                  <p className="text-[10px] text-slate-500 mt-2">Accepted by: {t.acceptanceSummary?.slice(0,50)}... • Check university-specific acceptance</p>
                </a>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 mt-6 p-3 rounded-xl bg-amber-50 border border-amber-100">
              Acceptance varies by university, course and visa route. For UK, check SELT requirements. For Australia/Canada, check DHA/IRCC guidance. Always check the official source for the latest information. MOI is a guidance resource, not an English test.
            </p>
          </Card>
        </div>
      </section>

      {/* ============ 9. SCORE REQUIREMENT EXPLORER ============ */}
      <section id="score-explorer" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Score Requirement Explorer</h2>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">Select country, university, course and study level to retrieve English test, minimum overall, component scores, waiver availability, remarks, source URL and last verified.</p>

              <Card className="mt-6 p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Country</label>
                    <select value={scoreExplorer.country} onChange={e => setScoreExplorer({ ...scoreExplorer, country: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                      <option>UK</option><option>Canada</option><option>Australia</option><option>USA</option><option>Ireland</option><option>New Zealand</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Study Level</label>
                    <select value={scoreExplorer.level} onChange={e => setScoreExplorer({ ...scoreExplorer, level: e.target.value })} className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] text-sm bg-white">
                      <option>Foundation</option><option>Bachelor</option><option>Masters</option><option>PhD</option><option>MBA</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">University</label>
                  <Input placeholder="e.g. University of Manchester" value={scoreExplorer.university} onChange={e => setScoreExplorer({ ...scoreExplorer, university: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">Course</label>
                  <Input placeholder="e.g. MSc Computer Science" value={scoreExplorer.course} onChange={e => setScoreExplorer({ ...scoreExplorer, course: e.target.value })} className="h-11 rounded-xl border-[#E2E8F0]" />
                </div>
                <Button onClick={handleScoreExplorer} className="w-full bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-11 rounded-xl">Check Requirement</Button>
                <p className="text-[10px] text-slate-500">If data unavailable: Requirement not available in database. Check university course page.</p>
              </Card>
            </div>

            <div className="lg:col-span-7">
              {!scoreResult ? (
                <Card className="p-10 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-3xl text-center h-full flex flex-col items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-[#0F172A]">Score requirement will appear here</p>
                  <p className="text-xs text-slate-500 mt-2">Enter country, university, course and study level to retrieve requirement with source verification.</p>
                </Card>
              ) : scoreResult.isEmpty ? (
                <Card className="p-8 bg-amber-50 border border-amber-200 rounded-3xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Requirement not available in database. Check university course page.</p>
                      <p className="text-xs text-amber-800 mt-2">Requirements change often. Check the official course page for the current English test and minimum scores.</p>
                      <p className="text-[11px] text-amber-700 mt-3">Acceptance varies by university, course and visa route. Source verification required.</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-3xl">
                  <h3 className="font-bold text-base text-[#0F172A] mb-4">Requirement Found — Verified</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Test:</span><span className="font-bold text-[#0057B8]">{scoreResult.testName || scoreResult.minimumScore || 'IELTS'}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Minimum Overall:</span><span className="font-bold">{scoreResult.minimumScore || 'Check course page'}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Component:</span><span className="font-medium text-xs">{scoreResult.componentRequirements || 'No band below 6.0 — Check course page'}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"><span className="text-slate-500">Waiver:</span><span className="font-medium">{scoreResult.waiverAvailable ? 'Available — Check conditions' : 'Not available — Check course page'}</span></div>
                    <div className="p-3 rounded-xl bg-white border border-[#E2E8F0]"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks</p><p className="text-xs text-slate-700">{scoreResult.remarks || 'Check university course page for remarks'}</p></div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><span className="text-slate-500 block">Source URL</span><a href={scoreResult.sourceUrl || '#'} target="_blank" className="font-semibold text-[#0057B8] hover:underline break-all">{scoreResult.sourceUrl || 'Check university course page'}</a></div>
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><span className="text-slate-500 block">Last Verified</span><span className="font-semibold text-[#0F172A]">{scoreResult.lastVerifiedAt || 'Information requires verification'}</span></div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="w-full bg-[#0057B8] hover:bg-[#003F87] text-white font-bold h-11 rounded-xl text-xs"><a href="/course-finder" className="flex-1">Find Matching Courses</a></Button>
                    <Button asChild variant="outline" className="bg-white border-[#E2E8F0] h-11 rounded-xl text-xs"><a href="#book-counselling">Book Counselling</a></Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 10. PREPARATION ROADMAP — 8 steps timeline ============ */}
      <section className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-white border border-[#E2E8F0] text-[#0057B8] font-bold text-[11px] px-3 py-1 mb-3">PREPARATION ROADMAP</Badge>
            <h2 className="text-3xl font-extrabold text-[#0F172A]">8-Step Preparation Roadmap</h2>
            <p className="text-sm text-slate-600 mt-2">From free assessment to final test-day readiness with ALO Education.</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-orange-200 to-emerald-200 -translate-x-1/2" />
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
              {[
                { step: '01', title: 'Free Assessment', desc: 'Evaluate current level across Listening, Reading, Writing, Speaking with diagnostic test. Identify baseline score and gap to target.', icon: ClipboardCheck },
                { step: '02', title: 'Target Score', desc: 'Set realistic target based on course requirement, university, destination and visa route. Understand component minimums.', icon: Target },
                { step: '03', title: 'Diagnostic Test', desc: 'Detailed diagnostic review identifying specific weaknesses in writing task response, reading True/False/Not Given, speaking fluency etc.', icon: Search },
                { step: '04', title: 'Study Plan', desc: 'Custom study plan with daily milestones, materials, module priority and suggested mock schedule. Based on available hours/week.', icon: Calendar },
                { step: '05', title: 'Module Practice', desc: 'Intensive drills on exam question types, timing, strategies — Listening note-taking, Reading skimming, Writing structure, Speaking cue cards.', icon: BookOpenCheck },
                { step: '06', title: 'Practice Tests', desc: 'Practise the format and timing before the real exam', icon: Timer },
                { step: '07', title: 'Expert Feedback', desc: 'Detailed writing feedback on Task Achievement, Coherence, Lexical Resource, Grammar. 1-on-1 speaking polish and confidence building.', icon: MessageCircle },
                { step: '08', title: 'Final Readiness', desc: 'Final assessment validating readiness for target score. Exam readiness checklist, booking guidance and university requirement verification.', icon: Trophy },
              ].map((s, i) => (
                <Card key={i} className={`p-6 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition rounded-3xl relative ${i % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8 lg:mt-12'}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0057B8] text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">{s.step}</div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2"><s.icon className="w-4 h-4 text-[#0057B8]" /> {s.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                  {/* Timeline dot for desktop */}
                  <div className={`hidden lg:block absolute top-8 w-3 h-3 rounded-full bg-[#E8501A] border-2 border-white shadow ${i % 2 === 0 ? '-right-[37px]' : '-left-[37px]'}`} />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 11. ALO PREPARATION SUPPORT — Premium cards ============ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">ALO Education Language Preparation Support</h2>
            <p className="text-sm text-slate-600 mt-2">Comprehensive support from test selection to exam readiness.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'Test Selection', desc: 'Understand which test fits your destination and university. Acceptance varies — we help check official requirements.', icon: Compass },
              { title: 'Free Assessment', desc: 'Evaluate your current level with diagnostic test to identify baseline and gap to target score.', icon: ClipboardCheck },
              { title: 'Target Score Planning', desc: 'Set realistic target based on course requirement, component minimums and timeline. No guaranteed score claims.', icon: Target },
              { title: 'Study Materials', desc: 'Structured learning resources covering question types, strategies and academic vocabulary.', icon: Library },
              { title: 'Practice Tests', desc: 'Practise the format and timing before the real exam.', icon: Timer },
              { title: 'Writing Feedback', desc: 'Improve structure, grammar and coherence with detailed feedback on Task Achievement, Cohesion, Lexical, Grammar.', icon: PenTool },
              { title: 'Speaking Practice', desc: 'Build confidence and fluency with certified coaches. No accent penalty — focus on meaning and clarity.', icon: Mic },
              { title: 'Score Strategy', desc: 'Focus on areas that matter most — weakest module priority and component score strategy.', icon: BarChart3 },
              { title: 'University-Specific Guidance', desc: 'Check requirements before booking your test — source URL, last verified, waiver availability, remarks.', icon: Building2 },
            ].map((c, i) => (
              <Card key={i} className="p-6 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#0057B8]/20 transition rounded-3xl">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center mb-4"><c.icon className="w-5 h-5" /></div>
                <h3 className="font-bold text-sm text-[#0F172A]">{c.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 12. PREPARATION RESOURCES — real destinations only ============ */}
      <section className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Preparation Resources</h2>
            <p className="text-sm text-slate-600 mt-2">Study guides for each test, a side-by-side comparison, and counselling for a personal study plan.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'IELTS guide', desc: 'Format, scoring and a preparation plan', href: '/language-prep/ielts', icon: FileText },
              { name: 'PTE Academic guide', desc: 'Computer-based format and scoring', href: '/language-prep/pte-academic', icon: FileText },
              { name: 'TOEFL iBT guide', desc: 'Sections, timing and scoring', href: '/language-prep/toefl-ibt', icon: FileText },
              { name: 'Compare the tests', desc: 'Side-by-side formats and requirements', href: '/language-prep/comparison', icon: ClipboardCheck },
            ].map((item) => (
              <Card key={item.name} className="p-5 bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center mb-3"><item.icon className="w-4 h-4" /></div>
                <h3 className="font-bold text-sm text-[#0F172A]">{item.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                <a href={item.href} className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#0057B8] hover:text-[#E8501A]">Open guide →</a>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="#book-counselling" className="inline-flex min-h-11 items-center rounded-xl bg-[#E8501A] px-6 py-3 text-sm font-bold text-black hover:bg-[#C93D13]">Book free counselling</a>
          </div>
        </div>
      </section>

      {/* ============ 14. FAQ — 10 general ============ */}
      <section className="py-16 bg-[#F8FAFC] border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-600 mt-2">Common questions about English language tests for international students — minimum 15-20 FAQs per test on detail pages.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-start gap-4"
                >
                  <span className="font-bold text-sm text-[#0F172A] leading-relaxed">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#0057B8] shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-[#E2E8F0] bg-[#F8FAFC]/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 15. FINAL CTA ============ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card className="p-8 sm:p-12 bg-gradient-to-br from-[#0057B8] to-[#003F87] text-white border-0 shadow-xl rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Not Sure Which English Test You Need?</h2>
              <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Tell us your destination, university and study plan. Our team can help you understand the relevant English requirement and preparation route.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button asChild className="bg-[#E8501A] hover:bg-[#d14315] text-black font-bold text-sm h-12 px-8 rounded-xl shadow-lg"><a href="#book-counselling">Book Free Counselling →</a></Button>
                <Button asChild variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold text-sm h-12 px-6 rounded-xl"><a href="#test-discovery">Find My Test</a></Button>
                <Button asChild variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold text-sm h-12 px-6 rounded-xl flex items-center gap-2"><a href="https://wa.me/8801805020101" target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-4 h-4" /> Chat with Counselor
                  </a></Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 pt-6 text-xs text-blue-200 border-t border-white/20">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> WhatsApp: +880 180 502 0101</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Email: info@aloeducation.com</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ============ 16. FOOTER NOTE — Source verification ============ */}
      <section className="py-8 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-4xl mx-auto">Test information is taken from official provider sources where available. Acceptance varies by university, course and visa route. Check the official provider for the latest details. MOI is a guidance resource, not an English proficiency test.</p>
        </div>
      </section>
    </div>
  );
}
