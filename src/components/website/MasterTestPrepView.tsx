'use client';

import React, { useState } from 'react';
import { TestPrepRecord } from '@/lib/test-prep-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Laptop,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

export default function MasterTestPrepView({ test }: { test: TestPrepRecord }) {
  // CRM Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    targetCountry: 'United Kingdom',
    currentScore: '',
    targetScore: test.expectedScore,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Active Tabs
  const [activeModuleTab, setActiveModuleTab] = useState(0);
  const [activeTimelineTab, setActiveTimelineTab] = useState(0);
  const [activeStudyWeek, setActiveStudyWeek] = useState(0);

  const handleCrmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/crm/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          preferredCountry: leadForm.targetCountry,
          notes: `Test Prep Request for ${test.name}. Current: ${leadForm.currentScore || 'N/A'}, Target: ${leadForm.targetScore}`,
          source: 'TEST_PREP_PAGE',
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <main className="pt-20">
        
        {/* ============================================================ */}
        {/* 1. HERO SECTION */}
        {/* ============================================================ */}
        <section className="bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#002d62] text-white py-16 md:py-20 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* BREADCRUMB */}
            <nav className="flex items-center gap-2 text-xs text-blue-200 mb-6 font-medium">
              <a href="/" className="hover:text-white">Home</a>
              <span>›</span>
              <a href="/language-prep" className="hover:text-white">Test Preparation</a>
              <span>›</span>
              <span className="text-[#FFB347] font-bold">{test.name}</span>
            </nav>

            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-[#F97316] text-white font-bold text-xs px-3 py-1.5 uppercase shadow-md">
                    {test.logoBadge}
                  </Badge>
                  <span className="text-xs text-blue-100 font-medium bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                    Official Score Scale: {test.quickInfo.scoreScale}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  {test.heroTitle}
                </h1>
                <p className="text-base sm:text-lg text-blue-100 font-normal leading-relaxed">
                  {test.heroSubtitle}
                </p>

                {/* EXPECTED SCORE BADGE */}
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-xl">
                  <span className="text-xs text-blue-200 uppercase font-bold tracking-wider">Target Academic Threshold</span>
                  <p className="text-xl sm:text-2xl font-black text-[#FFB347] mt-0.5">{test.expectedScore}</p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <a href="#crm-lead-form">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[#F97316] text-white hover:bg-[#EA580C] font-bold text-sm px-7 py-3.5 shadow-lg rounded-xl">
                      Book Free Counseling
                    </Button>
                  </a>
                  <a href="#crm-lead-form">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold text-sm px-6 py-3.5 rounded-xl">
                      Take Free Assessment
                    </Button>
                  </a>
                </div>

                {/* COUNTRY BADGES */}
                <div className="pt-4 border-t border-white/15">
                  <p className="text-xs text-blue-200 font-semibold mb-2 uppercase">Accepted for Student Visas & Admissions In:</p>
                  <div className="flex flex-wrap gap-2">
                    {test.quickInfo.acceptedCountries.map((c, i) => (
                      <span key={i} className="text-xs bg-white/15 px-3 py-1 rounded-full text-white font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* QUICK FACTS HERO CARD */}
              <div className="lg:col-span-5">
                <Card className="p-7 bg-white text-slate-900 shadow-2xl rounded-3xl border-0">
                  <h3 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2 border-b pb-3">
                    <Zap className="h-5 w-5 text-[#F97316]" /> Quick Exam Snapshot
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    {test.quickFacts.map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 font-semibold">{q.label}</span>
                        <span className="font-bold text-[#2563EB] text-right">{q.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <a href="#crm-lead-form">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold text-xs py-3 rounded-xl">
                        Connect with Score Planner →
                      </Button>
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. TEST OVERVIEW */}
        {/* ============================================================ */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-blue-50 text-[#2563EB] border-blue-200 font-bold text-xs mb-2">SECTION 02</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Comprehensive Test Overview</h2>
              <p className="text-sm text-slate-600 mt-2">Everything you need to know about history, purpose, and global recognition.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-white border-slate-200">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold mb-4">01</div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-2">What is {test.shortName}?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{test.overview.whatIsIt}</p>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center font-bold mb-4">02</div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-2">Who Accepts It?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{test.overview.whoAcceptsIt}</p>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">03</div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-2">Why Universities Require It</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{test.overview.whyUniversitiesRequireIt}</p>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">04</div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-2">Why Visa Offices Require It</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{test.overview.whyVisaOfficesRequireIt}</p>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">05</div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-2">Global Recognition</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{test.overview.globalRecognition}</p>
              </Card>

              <Card className="p-6 bg-white border-slate-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">06</div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-2">Official Owner & History</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{test.officialOwner} — {test.overview.history}</p>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. QUICK INFORMATION CARDS */}
        {/* ============================================================ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-orange-50 text-[#F97316] border-orange-200 font-bold text-xs mb-2">SECTION 03</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Key Test Specifications</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <Clock className="h-6 w-6 text-[#2563EB] mb-2" />
                <span className="text-slate-500 font-medium">Test Duration</span>
                <p className="text-base font-bold text-slate-900 mt-1">{test.quickInfo.duration}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <Calendar className="h-6 w-6 text-[#F97316] mb-2" />
                <span className="text-slate-500 font-medium">Result Turnaround</span>
                <p className="text-base font-bold text-slate-900 mt-1">{test.quickInfo.resultTime}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <DollarSign className="h-6 w-6 text-emerald-600 mb-2" />
                <span className="text-slate-500 font-medium">Exam Fee in Bangladesh</span>
                <p className="text-base font-bold text-slate-900 mt-1">{test.quickInfo.cost}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <ShieldCheck className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-slate-500 font-medium">Score Validity</span>
                <p className="text-base font-bold text-slate-900 mt-1">{test.quickInfo.validity}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. WHY CHOOSE THIS TEST (ADVANTAGES & DISADVANTAGES) */}
        {/* ============================================================ */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-blue-50 text-[#2563EB] border-blue-200 font-bold text-xs mb-2">SECTION 04</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Why Choose {test.name}?</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 bg-white border-l-4 border-l-emerald-600">
                <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Key Advantages
                </h3>
                <div className="space-y-3">
                  {test.whyChoose.advantages.map((adv, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="h-2 w-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                      <span className="font-medium">{adv}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-white border-l-4 border-l-amber-600">
                <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-600" /> Considerations & Limitations
                </h3>
                <div className="space-y-3">
                  {test.whyChoose.disadvantages.map((dis, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="h-2 w-2 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                      <span className="font-medium">{dis}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. COUNTRIES ACCEPTING THIS TEST */}
        {/* ============================================================ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-orange-50 text-[#F97316] border-orange-200 font-bold text-xs mb-2">SECTION 05</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Country Recognition & Visa Compliance</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {test.countriesAccepting.map((c, i) => (
                <Card key={i} className="p-6 bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{c.flag}</span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[11px] font-bold">{c.acceptanceRate} Acceptance</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-[#0F172A] mb-3">{c.country}</h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p><span className="font-semibold text-slate-900">Visa Rule: </span>{c.visaRule}</p>
                    <p><span className="font-semibold text-slate-900">University Rule: </span>{c.universityRule}</p>
                    <p><span className="font-semibold text-slate-900">Professional Reg: </span>{c.profRegRule}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. MINIMUM REQUIRED SCORES TABLE */}
        {/* ============================================================ */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-blue-50 text-[#2563EB] border-blue-200 font-bold text-xs mb-2">SECTION 07</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Minimum & Competitive Score Benchmarks</h2>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#2563EB] text-white">
                    <th className="p-4 font-bold">Country</th>
                    <th className="p-4 font-bold">Sample University</th>
                    <th className="p-4 font-bold">Course Level</th>
                    <th className="p-4 font-bold">Minimum</th>
                    <th className="p-4 font-bold">Competitive</th>
                    <th className="p-4 font-bold">Scholarship Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {test.minimumScoresTable.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{row.country}</td>
                      <td className="p-4 text-slate-700">{row.university}</td>
                      <td className="p-4 text-slate-600">{row.courseLevel}</td>
                      <td className="p-4 font-semibold text-amber-600">{row.minimumScore}</td>
                      <td className="p-4 font-semibold text-[#2563EB]">{row.competitiveScore}</td>
                      <td className="p-4 font-bold text-[#F97316]">{row.scholarshipScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. EXAM PATTERN & MODULES */}
        {/* ============================================================ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-orange-50 text-[#F97316] border-orange-200 font-bold text-xs mb-2">SECTIONS 08 & 09</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Exam Pattern & Module Deep-Dive</h2>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-3">
                {test.moduleDetails.map((mod, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveModuleTab(i)}
                    className={`w-full text-left p-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between border ${
                      activeModuleTab === i
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{mod.moduleName}</span>
                    <span className="text-xs opacity-80">{mod.timeLimit}</span>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-8">
                {test.moduleDetails[activeModuleTab] && (
                  <Card className="p-7 bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-[#0F172A]">{test.moduleDetails[activeModuleTab].moduleName}</h3>
                      <Badge className="bg-[#F97316] text-white text-xs">{test.moduleDetails[activeModuleTab].timeLimit}</Badge>
                    </div>

                    <p className="text-xs text-slate-700 mb-6 leading-relaxed">
                      <span className="font-bold text-slate-900">Module Purpose: </span>
                      {test.moduleDetails[activeModuleTab].purpose}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6 text-xs mb-6">
                      <div>
                        <h4 className="font-bold text-[#2563EB] mb-2">Question Types:</h4>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {test.moduleDetails[activeModuleTab].questionTypes.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-600 mb-2">Expert Pro Tips:</h4>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {test.moduleDetails[activeModuleTab].proTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 11. SCORING SYSTEM & CEFR MAPPING */}
        {/* ============================================================ */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-blue-50 text-[#2563EB] border-blue-200 font-bold text-xs mb-2">SECTION 11</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Scoring System & CEFR Mapping</h2>
            </div>

            <div className="space-y-4">
              {test.scoringSystem.map((row, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-sm shrink-0">
                      {row.scoreBand}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#F97316] uppercase">{row.cefrLevel}</span>
                      <p className="text-sm font-bold text-slate-900">{row.gradeDescription}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 max-w-md">
                    <p><span className="font-semibold text-slate-900">University Level: </span>{row.uniAcceptance}</p>
                    <p><span className="font-semibold text-slate-900">Visa Status: </span>{row.visaAcceptance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 12. TEST FEES BY COUNTRY */}
        {/* ============================================================ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-orange-50 text-[#F97316] border-orange-200 font-bold text-xs mb-2">SECTION 12</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Global Test Fees Comparison</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              {test.countryFees.map((f, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium">{f.country}</span>
                  <p className="text-lg font-black text-[#2563EB] mt-1">{f.currencyFee}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{f.bdtEquivalent}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 13. BOOKING PROCESS (8 STEPS) */}
        {/* ============================================================ */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-blue-50 text-[#2563EB] border-blue-200 font-bold text-xs mb-2">SECTION 13</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Step-by-Step Official Booking Process</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {test.bookingProcess.map((step) => (
                <Card key={step.step} className="p-5 bg-white border-slate-200">
                  <span className="text-2xl font-black text-[#F97316] block mb-2">0{step.step}</span>
                  <h3 className="font-bold text-sm text-[#0F172A] mb-1">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 20 & 28. ALO EDUCATION PREPARATION SUPPORT & CRM INTEGRATION */}
        {/* ============================================================ */}
        <section id="crm-lead-form" className="py-16 bg-gradient-to-br from-[#2563EB] to-[#003d80] text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <Badge className="bg-[#F97316] text-white font-bold text-xs px-3 py-1">ALO CRM SCORE PLANNER</Badge>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Get Free Test Preparation & Score Planning Support
                </h2>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Our certified test prep counselors analyze your current English baseline, create a custom study plan, and match your target score with top university scholarship thresholds.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-xl border border-white/15">
                    <CheckCircle2 className="h-5 w-5 text-[#FFB347]" />
                    <span>Free Baseline Diagnostic Test</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-xl border border-white/15">
                    <CheckCircle2 className="h-5 w-5 text-[#FFB347]" />
                    <span>1-on-1 Certified Coach Sessions</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-xl border border-white/15">
                    <CheckCircle2 className="h-5 w-5 text-[#FFB347]" />
                    <span>University Score Requirement Match</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-xl border border-white/15">
                    <CheckCircle2 className="h-5 w-5 text-[#FFB347]" />
                    <span>Direct Official Test Date Booking</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <Card className="p-7 bg-white text-slate-900 shadow-2xl rounded-3xl border-0">
                  <h3 className="text-xl font-bold text-[#0F172A] mb-1">Book Free Assessment</h3>
                  <p className="text-xs text-slate-500 mb-6">Instantly connected to ALO Education CRM system</p>

                  {submitted ? (
                    <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl text-center text-xs font-semibold">
                      🎉 Request Received! An ALO Test Prep Counselor will contact you within 2 hours.
                    </div>
                  ) : (
                    <form onSubmit={handleCrmSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                        <Input
                          required
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="e.g. Tanvir Ahmed"
                          className="h-10 text-xs"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Email</label>
                          <Input
                            required
                            type="email"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                            placeholder="tanvir@example.com"
                            className="h-10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Phone / WhatsApp</label>
                          <Input
                            required
                            value={leadForm.phone}
                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                            placeholder="+880 1711-000000"
                            className="h-10 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Target Country</label>
                          <select
                            value={leadForm.targetCountry}
                            onChange={(e) => setLeadForm({ ...leadForm, targetCountry: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-slate-200 text-xs bg-white"
                          >
                            <option>United Kingdom</option>
                            <option>Australia</option>
                            <option>Canada</option>
                            <option>United States</option>
                            <option>Germany</option>
                            <option>Ireland</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Current Band / Score</label>
                          <Input
                            value={leadForm.currentScore}
                            onChange={(e) => setLeadForm({ ...leadForm, currentScore: e.target.value })}
                            placeholder="e.g. Band 5.5 or New"
                            className="h-10 text-xs"
                          />
                        </div>
                      </div>

                      <Button
                        disabled={submitting}
                        type="submit"
                        className="w-full bg-[#F97316] text-white hover:bg-[#EA580C] font-bold text-xs py-3 rounded-xl shadow-md mt-2"
                      >
                        {submitting ? 'Connecting to CRM...' : 'Submit Lead & Get Custom Plan →'}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 24. FREQUENTLY ASKED QUESTIONS (FAQS) */}
        {/* ============================================================ */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Badge className="bg-orange-50 text-[#F97316] border-orange-200 font-bold text-xs mb-2">SECTION 24</Badge>
              <h2 className="text-3xl font-extrabold text-[#0F172A]">Frequently Asked Questions</h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-4 text-xs">
              {test.faqs.map((faq, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-sm text-[#0F172A] mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#2563EB] shrink-0" /> {faq.question}
                  </h3>
                  <p className="text-slate-600 leading-relaxed pl-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
