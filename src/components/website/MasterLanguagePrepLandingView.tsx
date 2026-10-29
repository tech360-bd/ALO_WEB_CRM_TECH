'use client';

import React, { useState } from 'react';
import { MASTER_TEST_PREP_DATA } from '@/lib/test-prep-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  DollarSign,
  Globe,
  GraduationCap,
  HelpCircle,
  Laptop,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserCheck,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MasterLanguagePrepLandingView() {
  const tests = Object.values(MASTER_TEST_PREP_DATA);

  // Interactive Test Discovery State
  const [targetDestination, setTargetDestination] = useState('UK');
  const [studyLevel, setStudyLevel] = useState('Postgraduate');
  const [preferredFormat, setPreferredFormat] = useState('Computer');
  const [recommendedResult, setRecommendedResult] = useState<string | null>(null);

  // Score Explorer State
  const [selectedDestinationForScore, setSelectedDestinationForScore] = useState('UK');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Lead Modal / Quick Contact State
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    test: 'IELTS Academic',
    targetScore: '7.0',
    destination: 'United Kingdom',
  });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleRecommendTest = () => {
    if (targetDestination === 'UK' && studyLevel === 'Foundation') {
      setRecommendedResult('IELTS for UKVI (SELT) is mandatory for below-degree programs.');
    } else if (targetDestination === 'Australia') {
      setRecommendedResult('PTE Academic or IELTS Academic is recommended for Australian universities & DHA visas.');
    } else if (targetDestination === 'USA') {
      setRecommendedResult('TOEFL iBT, Duolingo, or IELTS are widely accepted for US I-20 and admission.');
    } else {
      setRecommendedResult('IELTS Academic and PTE Academic offer the highest acceptance across global top 200 universities.');
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    setSubmittingLead(true);
    try {
      await fetch('/api/crm/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email,
          destination: leadForm.destination,
          notes: `Language Prep Request for ${leadForm.test}. Target Score: ${leadForm.targetScore}`,
          source: 'LANGUAGE_PREP_PAGE',
        }),
      });
      setLeadSubmitted(true);
      toast.success('Consultation request booked! An ALO counselor will contact you shortly.');
    } catch {
      setLeadSubmitted(true);
      toast.success('Consultation request booked!');
    } finally {
      setSubmittingLead(false);
    }
  };

  const FAQS = [
    { q: 'What is the most widely accepted English test for study abroad?', a: 'IELTS Academic and PTE Academic are the most universally accepted tests across the UK, Australia, Canada, USA, and Europe. TOEFL iBT is especially popular in North America, while Duolingo and Oxford ELLT are fast, cost-effective options accepted by hundreds of institutions.' },
    { q: 'Can I apply for a student visa without IELTS?', a: 'Yes! Depending on the destination and university, you may use PTE Academic, TOEFL iBT, Duolingo, Oxford ELLT, or a verified Medium of Instruction (MOI) certificate from an approved university.' },
    { q: 'What is the difference between standard IELTS and IELTS for UKVI?', a: 'Test format, questions, and scoring are 100% identical. IELTS for UKVI is conducted in official Secure English Language Test (SELT) centres with enhanced video monitoring, and results include a UKVI reference number required for UK foundation and below-degree visas.' },
    { q: 'How fast can I get my test results?', a: 'PTE Academic and Duolingo deliver certified scores typically within 48 hours. Computer-delivered IELTS takes 3-5 days, while paper-based IELTS takes 13 days.' },
    { q: 'How long are English test scores valid?', a: 'Standard academic tests (IELTS, PTE, TOEFL, Duolingo, Oxford ELLT) are officially valid for 2 years from the date of the test.' },
    { q: 'Can I retake just one module if I missed my target score in Writing or Speaking?', a: 'Yes! IELTS One Skill Retake (OSR) allows retaking a single module in eligible computer test centres. PTE Academic requires taking the full test again but allows unlimited attempts with results in 48 hours.' },
    { q: 'How does ALO Education help me achieve my target band score?', a: 'ALO Education provides a comprehensive diagnostic placement test, 1-on-1 target score planning, certified instructor coaching, timed computer-based mock exams, and direct university requirement matching.' },
  ];

  return (
    <div className="min-h-screen bg-white text-[var(--alo-text)] font-sans">
      
      {/* ============================================================ */}
      {/* 1. HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-[var(--alo-border)] bg-[var(--alo-brand-pale)] pb-16 pt-20 lg:pb-20 lg:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT HERO TEXT */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-secondary)] ring-1 ring-inset ring-[var(--alo-border)]">
                <span className="size-1.5 rounded-full bg-[var(--alo-brand)]" aria-hidden="true" />
                <span className="text-[var(--alo-brand)]">ALO Language Preparation Centre</span>
              </span>

              <h1 className="font-heading text-[34px] font-extrabold leading-[1.12] tracking-tight text-[var(--alo-text)] sm:text-[42px] lg:text-[52px]">
                English Language Preparation
              </h1>

              <p className="max-w-[62ch] text-[16px] font-medium leading-7 text-[var(--alo-body)] sm:text-lg">
                Master English proficiency tests with structured preparation, realistic practice, expert guidance, and destination-focused score planning.
              </p>

              <p className="max-w-[62ch] text-[14px] leading-7 text-[var(--alo-body)]">
                Choose the right English test, understand your target score, prepare strategically, and move closer to your university admission goal.
              </p>

              {/* QUICK HERO BUTTONS */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Button asChild className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] font-bold text-sm h-12 px-8 rounded-xl shadow-lg flex items-center gap-2"><a href="#book-counseling">
                    Request Counselling <ArrowRight className="h-4 w-4" />
                  </a></Button>
                <Button asChild variant="outline" className="border-[var(--alo-border)] bg-card font-bold text-sm h-12 px-6 rounded-xl text-[var(--alo-text)] hover:border-[var(--alo-brand)] hover:text-[var(--alo-brand)]"><a href="#test-discovery">
                    Find Your English Test
                  </a></Button>
                <Button asChild variant="outline" className="border-[var(--alo-border)] bg-card font-bold text-sm h-12 px-6 rounded-xl text-[var(--alo-text)] hover:border-[var(--alo-brand)] hover:text-[var(--alo-brand)]"><a href="#test-cards">
                    Compare All 15 Tests
                  </a></Button>
              </div>

              {/* FLOATING BENEFIT BADGES */}
              <div className="grid grid-cols-2 gap-3 border-t border-[var(--alo-border)] pt-6 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-[var(--alo-border)] bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-muted)]">Target Score</p>
                  <p className="text-sm font-bold text-[var(--alo-text)]">Band 6.5 - 7.5+</p>
                </div>
                <div className="rounded-xl border border-[var(--alo-border)] bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-muted)]">Fast Results</p>
                  <p className="text-sm font-bold text-[var(--alo-cta-active)]">48h - 5 Days</p>
                </div>
                <div className="rounded-xl border border-[var(--alo-border)] bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-muted)]">Mock Tests</p>
                  <p className="text-sm font-bold text-[var(--alo-text)]">Exam Conditions</p>
                </div>
                <div className="rounded-xl border border-[var(--alo-border)] bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-muted)]">Expert Review</p>
                  <p className="text-sm font-bold text-[var(--alo-text)]">Certified Coaches</p>
                </div>
              </div>

            </div>

            {/* RIGHT HERO INTERACTIVE QUICK CARD */}
            <div className="lg:col-span-5" id="book-counseling">
              <Card className="rounded-[20px] border border-[var(--alo-border)] bg-card p-6 text-[var(--alo-text)] shadow-[var(--alo-shadow-md)] md:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-[var(--alo-cta)]" />
                  <h3 className="text-xl font-bold text-[var(--alo-text)]">Book Test Consultation</h3>
                </div>
                <p className="text-xs text-[var(--alo-body)] mb-6">
                  Get a personalized test recommendation and score plan from ALO certified advisors.
                </p>

                {leadSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-emerald-900 text-base">Request Received!</h4>
                    <p className="text-xs text-emerald-700">
                      Our Senior Test Prep Advisor will contact you within 2 hours with your study plan.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="font-semibold text-[var(--alo-body)] block mb-1">Full Name</label>
                      <Input
                        placeholder="e.g. Arif Rahman"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[var(--alo-body)] block mb-1">Phone Number</label>
                        <Input
                          placeholder="017XXXXXXXX"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--alo-body)] block mb-1">Email Address</label>
                        <Input
                          placeholder="name@email.com"
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[var(--alo-body)] block mb-1">Preferred Test</label>
                        <select
                          className="w-full h-11 border border-[var(--alo-border)] rounded-xl px-3 bg-white text-[var(--alo-text)]"
                          value={leadForm.test}
                          onChange={(e) => setLeadForm({ ...leadForm, test: e.target.value })}
                        >
                          <option value="IELTS Academic">IELTS Academic</option>
                          <option value="IELTS for UKVI">IELTS for UKVI</option>
                          <option value="PTE Academic">PTE Academic</option>
                          <option value="Duolingo (DET)">Duolingo (DET)</option>
                          <option value="TOEFL iBT">TOEFL iBT</option>
                          <option value="Oxford ELLT">Oxford ELLT (OIETC)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-[var(--alo-body)] block mb-1">Target Score</label>
                        <Input
                          placeholder="e.g. Band 7.0 or PTE 65"
                          value={leadForm.targetScore}
                          onChange={(e) => setLeadForm({ ...leadForm, targetScore: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submittingLead}
                      className="w-full bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] font-bold text-sm h-12 rounded-xl mt-2 shadow-md"
                    >
                      {submittingLead ? 'Scheduling Session...' : 'Get Test Score Plan →'}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TEST DISCOVERY SECTION */}
      {/* ============================================================ */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]" id="test-discovery">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] font-bold text-xs px-3 py-1 mb-3 uppercase">
              INTERACTIVE TEST FINDER
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--alo-text)] tracking-tight">
              Which English Test Is Right for You?
            </h2>
            <p className="text-sm text-[var(--alo-body)] mt-2">
              The right test depends on your destination, university entry criteria, visa pathway, timeline, and personal strengths.
            </p>
          </div>

          <Card className="p-8 bg-white border border-[var(--alo-border)] shadow-lg rounded-3xl max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-6 mb-6 text-xs">
              <div>
                <label className="font-bold text-[var(--alo-body)] block mb-2">Target Study Destination</label>
                <select
                  value={targetDestination}
                  onChange={(e) => setTargetDestination(e.target.value)}
                  className="w-full h-12 border border-[var(--alo-border)] rounded-xl px-3 bg-[var(--alo-page)] font-medium"
                >
                  <option value="UK">United Kingdom (UK)</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                  <option value="USA">United States (USA)</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Germany">Germany / Europe</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--alo-body)] block mb-2">Target Study Level</label>
                <select
                  value={studyLevel}
                  onChange={(e) => setStudyLevel(e.target.value)}
                  className="w-full h-12 border border-[var(--alo-border)] rounded-xl px-3 bg-[var(--alo-page)] font-medium"
                >
                  <option value="Postgraduate">Master's / Postgraduate</option>
                  <option value="Undergraduate">Bachelor's / Undergraduate</option>
                  <option value="Foundation">Foundation / Pathway</option>
                  <option value="PhD">PhD / Research</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--alo-body)] block mb-2">Preferred Format</label>
                <select
                  value={preferredFormat}
                  onChange={(e) => setPreferredFormat(e.target.value)}
                  className="w-full h-12 border border-[var(--alo-border)] rounded-xl px-3 bg-[var(--alo-page)] font-medium"
                >
                  <option value="Computer">Computer-delivered (Fast Results)</option>
                  <option value="Paper">Paper-based (Handwritten)</option>
                  <option value="Home">Home Online (Duolingo/DET)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleRecommendTest}
              className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold text-sm h-12 rounded-xl shadow-md"
            >
              Analyze & Recommend Optimal Test →
            </Button>

            {recommendedResult && (
              <div className="mt-6 p-5 bg-[var(--alo-brand-pale)] border border-[var(--alo-border)] rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-[var(--alo-brand)] font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" /> Recommendation Output:
                </div>
                <p className="text-[var(--alo-text)] leading-relaxed font-medium">{recommendedResult}</p>
                <div className="pt-2 flex gap-3">
                  <Button asChild size="sm" className="bg-[var(--alo-brand)] text-white h-12"><a href="/language-prep/ielts">
                      Explore IELTS
                    </a></Button>
                  <Button asChild size="sm" variant="outline" className=" h-12 border-[var(--alo-brand)] text-[var(--alo-brand)]"><a href="/language-prep/pte-academic">
                      Explore PTE
                    </a></Button>
                </div>
              </div>
            )}
          </Card>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. WHY ENGLISH PROFICIENCY MATTERS */}
      {/* ============================================================ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] font-bold text-xs px-3 py-1 uppercase">
                ACADEMIC & IMMIGRATION READINESS
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--alo-text)]">
                Why English Language Proficiency Matters
              </h2>
              <p className="text-[var(--alo-body)] text-sm leading-relaxed">
                English proficiency is an essential part of international university admission and, depending on the destination and study route, may also be required for visa issuance.
              </p>
              <p className="text-[var(--alo-body)] text-sm leading-relaxed">
                ALO Education guides students through university prerequisites, course-specific benchmarks, destination visa compliance, and test selection to ensure you invest your preparation time strategically.
              </p>
              <div className="p-4 bg-[var(--alo-page)] rounded-2xl border border-[var(--alo-border)] text-xs text-[var(--alo-body)] italic">
                * Note: Requirements vary by country, immigration route, university, and specific course level. Always check official prerequisites.
              </div>
            </div>

            <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
              <Card className="p-5 border-[var(--alo-border)] bg-[var(--alo-page)] rounded-2xl">
                <Award className="h-8 w-8 text-[var(--alo-brand)] mb-3" />
                <h4 className="font-bold text-sm text-[var(--alo-text)] mb-1">Meet Admission Criteria</h4>
                <p className="text-xs text-[var(--alo-body)] leading-relaxed">Fulfill direct unconditional entry thresholds without pre-sessional English costs.</p>
              </Card>
              <Card className="p-5 border-[var(--alo-border)] bg-[var(--alo-page)] rounded-2xl">
                <ShieldCheck className="h-8 w-8 text-[var(--alo-cta)] mb-3" />
                <h4 className="font-bold text-sm text-[var(--alo-text)] mb-1">Strengthen Visa Files</h4>
                <p className="text-xs text-[var(--alo-body)] leading-relaxed">Satisfy official immigration credibility checks for UK, Australia, Canada, and USA.</p>
              </Card>
              <Card className="p-5 border-[var(--alo-border)] bg-[var(--alo-page)] rounded-2xl">
                <GraduationCap className="h-8 w-8 text-[var(--alo-brand)] mb-3" />
                <h4 className="font-bold text-sm text-[var(--alo-text)] mb-1">Scholarship Eligibility</h4>
                <p className="text-xs text-[var(--alo-body)] leading-relaxed">High test bands unlock university merit scholarships from £1,000 up to 50% tuition.</p>
              </Card>
              <Card className="p-5 border-[var(--alo-border)] bg-[var(--alo-page)] rounded-2xl">
                <Laptop className="h-8 w-8 text-[var(--alo-cta)] mb-3" />
                <h4 className="font-bold text-sm text-[var(--alo-text)] mb-1">Academic Success</h4>
                <p className="text-xs text-[var(--alo-body)] leading-relaxed">Excel in international lectures, research dissertations, and oral seminar debates.</p>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. ENGLISH TEST CARDS GRID (ALL 15 TESTS) */}
      {/* ============================================================ */}
      <section className="py-16 bg-[var(--alo-page)] border-t border-[var(--alo-border)]" id="test-cards">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] font-bold text-xs px-3 py-1 mb-2 uppercase">
                COMPLETE DIRECTORY
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--alo-text)]">
                Explore Verified English & Admission Tests
              </h2>
              <p className="text-sm text-[var(--alo-body)] mt-1">
                Select any test below for complete module breakdowns, scoring systems, test fee guidelines, and preparation plans.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((t) => (
              <Card
                key={t.id}
                className="p-6 bg-white hover:shadow-xl transition-all border-[var(--alo-border)] hover:border-[var(--alo-brand)] flex flex-col justify-between rounded-3xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] font-bold text-[11px]">
                      {t.logoBadge}
                    </Badge>
                    <span className="text-xs font-semibold text-[var(--alo-text-muted)]">{t.quickInfo.duration}</span>
                  </div>

                  <h3 className="text-xl font-bold text-[var(--alo-text)] mb-1">{t.name}</h3>
                  <p className="text-xs text-[var(--alo-cta)] font-semibold mb-3">{t.officialOwner}</p>
                  <p className="text-xs text-[var(--alo-body)] mb-4 line-clamp-3 leading-relaxed">
                    {t.overview.whatIsIt}
                  </p>

                  <div className="space-y-1.5 mb-4 text-xs">
                    <div className="flex justify-between text-[var(--alo-body)]">
                      <span className="text-[var(--alo-text-muted)] font-medium">Exam Fee in BD:</span>
                      <span className="font-bold text-[var(--alo-text)]">{t.quickInfo.cost}</span>
                    </div>
                    <div className="flex justify-between text-[var(--alo-body)]">
                      <span className="text-[var(--alo-text-muted)] font-medium">Result Timeline:</span>
                      <span className="font-bold text-emerald-600">{t.quickInfo.resultTime}</span>
                    </div>
                    <div className="flex justify-between text-[var(--alo-body)]">
                      <span className="text-[var(--alo-text-muted)] font-medium">Target Score:</span>
                      <span className="font-bold text-[var(--alo-brand)]">{t.expectedScore}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--alo-border)] flex gap-2">
                  <Button asChild className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold h-12 rounded-xl"><a href={`/language-prep/${t.slug}`} className="flex-1">
                      Explore Modules & Plan →
                    </a></Button>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. TEST COMPARISON MODULE */}
      {/* ============================================================ */}
      <section className="py-16 bg-white border-t border-[var(--alo-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-[var(--alo-text)]">Compare English Proficiency Tests</h2>
            <p className="text-xs text-[var(--alo-body)] mt-2">
              Side-by-side evaluation of test durations, result delivery speed, scoring scales, and delivery formats.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--alo-border)] shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--alo-surface-muted)] text-[var(--alo-text)]">
                  <th className="p-3.5 font-bold">Test Name</th>
                  <th className="p-3.5 font-bold">Duration</th>
                  <th className="p-3.5 font-bold">Result Time</th>
                  <th className="p-3.5 font-bold">Score Range</th>
                  <th className="p-3.5 font-bold">Format</th>
                  <th className="p-3.5 font-bold">Best For Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--alo-border)]">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--alo-page)]">
                    <td className="p-3.5 font-bold text-[var(--alo-brand)]">
                      <a href={`/language-prep/${t.slug}`} className="hover:underline">{t.name}</a>
                    </td>
                    <td className="p-3.5 text-[var(--alo-body)]">{t.quickInfo.duration}</td>
                    <td className="p-3.5 font-semibold text-emerald-600">{t.quickInfo.resultTime}</td>
                    <td className="p-3.5 text-[var(--alo-body)]">{t.quickInfo.scoreScale}</td>
                    <td className="p-3.5 text-[var(--alo-body)]">{t.quickInfo.format}</td>
                    <td className="p-3.5 text-[var(--alo-body)]">{t.quickInfo.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. 8-STEP PREPARATION ROADMAP */}
      {/* ============================================================ */}
      <section className="py-16 bg-[var(--alo-page)] border-t border-[var(--alo-border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="bg-[var(--alo-cta)] text-black font-bold text-xs px-3 py-1 mb-3 uppercase">
              STRUCTURED SUCCESS METHOD
            </Badge>
            <h2 className="text-3xl font-extrabold text-[var(--alo-text)]">8-Step English Preparation Roadmap</h2>
            <p className="text-xs text-[var(--alo-body)] mt-2">
              From baseline assessment to final test-day readiness with ALO Education coaches.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { step: '01', title: 'Free Assessment', desc: 'Diagnose current baseline proficiency across core skills.' },
              { step: '02', title: 'Target Score Goal', desc: 'Establish exact band/score required by your university course.' },
              { step: '03', title: 'Diagnostic Review', desc: 'Identify specific weaknesses in writing, reading, or speech.' },
              { step: '04', title: 'Custom Study Plan', desc: 'Receive structured daily study milestones and materials.' },
              { step: '05', title: 'Module Practice', desc: 'Intensive drills on exam question types and timing.' },
              { step: '06', title: 'Timed Mock Tests', desc: 'Simulate full exam conditions with certified test papers.' },
              { step: '07', title: 'Mentor Feedback', desc: 'Detailed essay evaluation and 1-on-1 speaking polish.' },
              { step: '08', title: 'Test Day Confidence', desc: 'Final score validation and university admission submission.' },
            ].map((s, idx) => (
              <Card key={idx} className="p-5 bg-white border-[var(--alo-border)] rounded-2xl relative">
                <span className="text-2xl font-black text-slate-200 absolute top-3 right-4">{s.step}</span>
                <h4 className="font-bold text-sm text-[var(--alo-brand)] mb-1.5">{s.title}</h4>
                <p className="text-[var(--alo-body)] leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FAQ ACCORDION SECTION */}
      {/* ============================================================ */}
      <section className="py-16 bg-white border-t border-[var(--alo-border)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-[var(--alo-text)]">Frequently Asked Questions</h2>
            <p className="text-xs text-[var(--alo-body)] mt-1">Common questions about English language tests for international students</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="border border-[var(--alo-border)] rounded-2xl overflow-hidden bg-[var(--alo-page)]/50 transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-[var(--alo-text)] flex justify-between items-center"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-[var(--alo-brand)] transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <div className="p-4 pt-0 text-xs text-[var(--alo-body)] leading-relaxed border-t border-[var(--alo-border)] bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FINAL CTA BANNER */}
      {/* ============================================================ */}
      <section className="bg-[var(--alo-brand)] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Not Sure Which English Test You Need?
          </h2>
          <p className="text-sm sm:text-base text-[var(--alo-brand-pale)] max-w-2xl mx-auto leading-relaxed">
            Tell us your target destination, university and study intake. Our senior counselors evaluate your background and provide the fastest, most cost-effective preparation pathway.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button asChild className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] font-bold text-sm h-12 px-8 rounded-xl shadow-lg"><a href="#book-counseling">
                Request Test Counselling →
              </a></Button>
            <Button asChild variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold text-sm h-12 px-6 rounded-xl flex items-center gap-2"><a href="https://wa.me/8801805020101" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" /> WhatsApp Advisor (+880 180 502 0101)
              </a></Button>
          </div>
        </div>
      </section>

    </div>
  );
}
