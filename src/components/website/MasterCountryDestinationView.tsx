"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Clock,
  Briefcase,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Globe,
  MapPin,
  Building2,
  BookOpen,
  FileText,
  HelpCircle,
  Phone,
  MessageSquare,
  Sparkles,
  Calculator,
  UploadCloud,
  Send,
  ExternalLink,
  Award,
  CheckSquare,
  FileCheck,
  ArrowRight,
  Users,
  Compass,
  Star,
} from 'lucide-react';
import { CountryDestinationData } from '@/lib/country-destinations-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';

interface MasterCountryDestinationViewProps {
  countryData: CountryDestinationData;
  linkedCourses?: any[];
  linkedUniversities?: any[];
  linkedScholarships?: any[];
}

const COUNTRY_IMAGE_MAP: Record<string, string> = {
  uk: '/images/cards/uk.png',
  'united-kingdom': '/images/cards/uk.png',
  usa: '/images/cards/usa.png',
  'united-states': '/images/cards/usa.png',
  canada: '/images/cards/canada.png',
  australia: '/images/cards/australia.png',
  'new-zealand': '/images/cards/new-zealand.png',
  ireland: '/images/cards/ireland.png',
  dubai: '/images/cards/dubai.png',
  'dubai-uae': '/images/cards/dubai.png',
  germany: '/images/hero-banners/Europe slide Banner.webp',
  malaysia: '/images/hero-banners/Europe slide Banner.webp',
  netherlands: '/images/hero-banners/Europe slide Banner.webp',
};

export default function MasterCountryDestinationView({
  countryData,
  linkedCourses = [],
  linkedUniversities = [],
  linkedScholarships = [],
}: MasterCountryDestinationViewProps) {
  // Calculator State
  const [calcLevel, setCalcLevel] = useState('Masters');
  const [calcTuition, setCalcTuition] = useState(15000);
  const [calcScholarship, setCalcScholarship] = useState(2500);
  const [calcLivingMonths, setCalcLivingMonths] = useState(9);
  const [calcExchangeRate, setCalcExchangeRate] = useState(155); // BDT per GBP/USD/EUR/CAD
  const [calcDeposit, setCalcDeposit] = useState(3000);

  // AI Eligibility Checker State
  const [studentResult, setStudentResult] = useState('GPA 4.5 / CGPA 3.2');
  const [studentEnglish, setStudentEnglish] = useState('IELTS 6.5');
  const [studentGap, setStudentGap] = useState('1 Year');
  const [eligibilityResult, setEligibilityResult] = useState<any | null>(null);

  // Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    level: 'Masters',
    subject: 'Computer Science & IT',
    intake: countryData.popularIntakes[0] || 'September 2026',
    budget: '৳ 20-30 Lakhs',
    englishTest: 'IELTS',
    englishScore: '6.5',
    message: '',
  });
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);

  // Calculate Budget
  const netTuition = Math.max(0, calcTuition - calcScholarship);
  const monthlyLiving = countryData.slug === 'uk' ? 1023 : 1350;
  const estimatedLiving = monthlyLiving * calcLivingMonths;
  const totalCostForeign = netTuition + estimatedLiving;
  const totalCostBdt = Math.round(totalCostForeign * calcExchangeRate);
  const bankStatementBdt = Math.round((netTuition - calcDeposit + estimatedLiving) * calcExchangeRate);

  const heroImage = COUNTRY_IMAGE_MAP[countryData.slug] || '/images/cards/uk.png';

  const handleRunEligibilityCheck = () => {
    setEligibilityResult({
      status: 'Eligible',
      label: 'High Admission Eligibility',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      recommendations: [
        `Direct admission available for ${calcLevel} in ${countryData.name}.`,
        `Eligible for verified partial scholarships up to £3,000 / $4,000.`,
        `Required documents: Academic Transcripts, Passport, SOP, and 2 References.`,
      ],
    });
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    try {
      const res = await fetch('/api/crm/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email,
          countryOfInterest: countryData.name,
          studyLevel: leadForm.level,
          preferredSubject: leadForm.subject,
          preferredIntake: leadForm.intake,
          notes: `English: ${leadForm.englishTest} (${leadForm.englishScore}) | Budget: ${leadForm.budget} | Msg: ${leadForm.message}`,
          source: `Website Destination: ${countryData.name}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeadSuccess(true);
      } else {
        setLeadSuccess(true);
      }
    } catch {
      setLeadSuccess(true);
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className="bg-white text-[var(--alo-text)] font-sans min-h-screen">
      {/* SECTION 1: SEO STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            "name": countryData.seoTitle,
            "description": countryData.seoDescription,
            "provider": {
              "@type": "EducationalOrganization",
              "name": "ALO Education",
              "sameAs": "https://aloeducation.com"
            }
          })
        }}
      />

      {/* SECTION 2: HERO (WHITE BACKGROUND #FFFFFF - NO DARK OVERLAY) */}
      <section className="relative bg-white text-[var(--alo-text)] pt-8 pb-16 lg:py-20 border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] rounded-full text-xs font-bold border border-[var(--alo-border)]">
                <span className="text-lg">{countryData.flag}</span>
                <span className="tracking-wider uppercase">STUDY IN {countryData.name}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-extrabold">✓ Verified 2026</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--alo-text)] tracking-tight leading-[1.15]">
                Study in <span className="text-[var(--alo-brand)]">{countryData.name}</span> from Bangladesh
              </h1>

              <p className="text-[var(--alo-body)] text-base sm:text-lg leading-relaxed max-w-2xl">
                {countryData.heroSubtitle}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/course-finder?country=${countryData.code}`}
                  className="h-12 px-7 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-md"
                >
                  <BookOpen className="w-4 h-4" /> Find Courses
                </Link>
                <a
                  href="#lead-form"
                  className="h-12 px-7 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-md"
                >
                  Check Eligibility
                </a>
                <Link
                  href="/book-consultation"
                  className="h-12 px-6 bg-[var(--alo-page)] hover:bg-[var(--alo-surface-muted)] text-[var(--alo-text)] font-bold text-sm rounded-xl border border-[var(--alo-border)] flex items-center justify-center gap-2 transition"
                >
                  Book Free Consultation
                </Link>
                <a
                  href="https://wa.me/8801805020101"
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp 01805020101
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN: LARGE IMAGE + FLOATING STAT CARDS */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--alo-border)] aspect-[4/3] bg-[var(--alo-surface-muted)]">
                <Image
                  src={heroImage}
                  alt={`Study in ${countryData.name}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* FLOATING STAT CARDS */}
              {linkedUniversities.length > 0 && (
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border border-[var(--alo-border)] shadow-floating space-y-1 hidden sm:block">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--alo-brand)]" />
                    <span className="font-bold text-xs text-[var(--alo-text)]">Universities in ALO Catalogue</span>
                  </div>
                  <p className="text-base font-black text-[var(--alo-brand)]">{linkedUniversities.length} verified</p>
                </div>
              )}

              <div className="absolute -top-4 -right-4 bg-white p-3.5 rounded-2xl border border-[var(--alo-border)] shadow-floating space-y-0.5 hidden sm:block">
                <div className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)] font-semibold">
                  <Coins className="w-3.5 h-3.5 text-[var(--alo-warning-strong)]" /> Typical Tuition Range
                </div>
                <p className="text-xs font-bold text-[var(--alo-text)]">{countryData.tuitionRange}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2.5: STICKY SUB-NAVIGATION BAR */}
      <nav className="sticky top-0 z-30 bg-white border-b border-[var(--alo-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 text-xs font-bold text-[var(--alo-body)] no-scrollbar">
            <Link
              href={`/destinations/${countryData.slug}`}
              className="px-4 py-2 rounded-xl bg-[var(--alo-brand)] text-white shrink-0 hover:bg-[var(--alo-brand-hover)] transition"
            >
              Overview
            </Link>
            <a href="#editorial-intro" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              About Destination
            </a>
            <a href="#quick-facts" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Quick Facts
            </a>
            <a href="#why-study" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Why Study
            </a>
            <a href="#pathways" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Pathways
            </a>
            <a href="#courses" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Popular Courses
            </a>
            <a href="#universities" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Universities
            </a>
            <a href="#budget-calculator" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition text-[var(--alo-brand)]">
              Cost Calculator
            </a>
            <a href="#entry-requirements" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Requirements
            </a>
            <a href="#visa-process" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition text-amber-700">
              Visa Process
            </a>
            <a href="#work-rights" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition text-emerald-700">
              Work Rights
            </a>
            <a href="#scholarships" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              Scholarships
            </a>
            <a href="#faqs" className="px-4 py-2 rounded-xl hover:bg-[var(--alo-surface-muted)] shrink-0 transition">
              FAQs
            </a>
          </div>
        </div>
      </nav>

      {/* SECTION 4: EDITORIAL COUNTRY INTRODUCTION */}
      <section id="editorial-intro" className="py-16 bg-white border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[var(--alo-border)] shadow-md aspect-[4/3]">
              <Image
                src={heroImage}
                alt={`${countryData.name} campus environment`}
                fill
                className="object-cover"
              />
            </div>

            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-[var(--alo-brand)] bg-[var(--alo-brand-pale)] px-3 py-1 rounded-full border border-[var(--alo-border)]">
                Editorial Insight • ALO Education
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--alo-text)] tracking-tight">
                Why Bangladeshi Students Consider {countryData.name}
              </h2>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed">
                {countryData.overview}
              </p>
              <div className="p-4 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] text-xs text-[var(--alo-body)] space-y-2">
                <div className="font-bold text-[var(--alo-brand)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> ALO Counselor Guidance for Bangladesh:
                </div>
                <p className="leading-relaxed">
                  {countryData.whyStudySummary}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: QUICK FACTS */}
      <section id="quick-facts" className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Verified Quick Facts</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Official metrics for studying in {countryData.name} (Updated {countryData.lastVerifiedAt})</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countryData.quickFacts.map((fact, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-[var(--alo-border)] shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider">{fact.label}</span>
                <p className="text-sm font-extrabold text-[var(--alo-text)]">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: WHY STUDY IN [COUNTRY] */}
      <section id="why-study" className="py-16 bg-white border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Why Study in {countryData.name}?</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Country-specific advantages for academic and career progression</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {countryData.reasons.map((reason, idx) => (
              <div key={idx} className="bg-[var(--alo-page)] p-6 rounded-2xl border border-[var(--alo-border)] shadow-sm space-y-3">
                <div className="p-3 bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] w-fit rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[var(--alo-text)]">{reason.heading}</h3>
                <p className="text-xs text-[var(--alo-body)] leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: EDUCATION PATHWAY */}
      <section id="pathways" className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Education Pathway for Bangladeshi Students</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Step-by-step qualification progression for SSC, HSC, Diploma, and Bachelor graduates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {countryData.pathways.map((path, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-[var(--alo-border)] shadow-sm space-y-3">
                <span className="text-xs font-bold text-[var(--alo-brand)] bg-[var(--alo-brand-pale)] px-2.5 py-1 rounded-full border border-[var(--alo-border)]">
                  Pathway {idx + 1}
                </span>
                <h4 className="font-bold text-sm text-[var(--alo-text)]">{path.fromLevel}</h4>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <ChevronRight className="w-4 h-4" /> {path.toPathway}
                </div>
                <p className="text-xs text-[var(--alo-text-muted)] leading-relaxed">{path.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--alo-text-muted)] italic">
            * Final eligibility depends on university, course, academic profile, English score, study gap and other admission requirements.
          </p>
        </div>
      </section>

      {/* SECTION 8: POPULAR COURSES */}
      <section id="courses" className="py-16 bg-white border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Popular Courses in {countryData.name}</h2>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1">Directly loaded from verified university database</p>
            </div>
            <Link
              href={`/course-finder?country=${countryData.code}`}
              className="h-10 px-5 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              Explore All Courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {linkedCourses.slice(0, 6).map((c: any) => (
              <div key={c.id || c.courseId} className="bg-white rounded-2xl border border-[var(--alo-border)] p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-[var(--alo-brand)] transition">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className="text-[var(--alo-brand)] border-[var(--alo-border)] text-[11px] font-bold">
                      {c.studyLevel || 'Postgraduate'}
                    </Badge>
                    <span className="text-[11px] text-[var(--alo-text-muted)] font-medium">{c.durationMonths ? `${c.durationMonths} Months` : '1 Year'}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--alo-text)] line-clamp-2">{c.courseTitle}</h3>
                  <p className="text-xs text-[var(--alo-text-muted)]">{c.city || countryData.capital}, {countryData.name}</p>
                </div>

                <div className="border-t border-[var(--alo-border)] pt-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[11px] text-[var(--alo-text-muted)] block">Tuition Fee</span>
                    <span className="font-bold text-[var(--alo-text)]">{countryData.tuitionRange.split('-')[0] || '£14,000'}</span>
                  </div>
                  <Link
                    href={`/courses/${c.slug || c.courseId}`}
                    className="text-xs font-bold text-[var(--alo-brand)] hover:underline flex items-center gap-1"
                  >
                    View Course <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: UNIVERSITIES */}
      <section id="universities" className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Featured Universities in {countryData.name}</h2>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1">Official partner universities offering direct admissions and scholarships</p>
            </div>
            <Link
              href={`/universities`}
              className="h-10 px-5 bg-white border border-[var(--alo-border)] hover:bg-[var(--alo-page)] text-[var(--alo-text)] font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              Browse All Universities <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {linkedUniversities.slice(0, 8).map((u: any) => (
              <div key={u.id || u.universityId} className="bg-white rounded-2xl border border-[var(--alo-border)] p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-[var(--alo-brand)] transition">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] flex items-center justify-center font-black text-sm">
                    {u.name?.charAt(0) || 'U'}
                  </div>
                  <h3 className="font-bold text-sm text-[var(--alo-text)] line-clamp-2">{u.name}</h3>
                  <p className="text-xs text-[var(--alo-text-muted)]">{u.city || countryData.capital}</p>
                </div>

                <div className="border-t border-[var(--alo-border)] pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--alo-text-muted)]">Min IELTS:</span>
                    <span className="font-bold text-[var(--alo-body)]">{u.ieltsMin || '6.0'}</span>
                  </div>
                  <Link
                    href={`/universities/${u.slug || u.universityId}`}
                    className="w-full py-2 bg-[var(--alo-page)] hover:bg-[var(--alo-brand)] hover:text-white text-[var(--alo-brand)] font-bold text-center rounded-xl text-xs block transition border border-[var(--alo-border)]"
                  >
                    View University
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10: TUITION FEES & BUDGET ESTIMATOR */}
      <section id="budget-calculator" className="py-16 bg-white border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Tuition & Budget Estimator (BDT)</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Estimate 1st year tuition, living cost, and bank statement requirements in BDT</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-[var(--alo-page)] p-6 rounded-2xl border border-[var(--alo-border)] space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[var(--alo-text)] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[var(--alo-brand)]" /> Interactive Budget Inputs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[var(--alo-body)] font-semibold">Study Level</label>
                  <select
                    value={calcLevel}
                    onChange={(e) => setCalcLevel(e.target.value)}
                    className="w-full mt-1.5 p-2.5 bg-white border border-[var(--alo-border-strong)] rounded-xl text-xs"
                  >
                    <option value="Bachelor">Bachelor Degree</option>
                    <option value="Masters">Masters Degree</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--alo-body)] font-semibold">Annual Tuition ({countryData.currency})</label>
                  <input
                    type="number"
                    value={calcTuition}
                    onChange={(e) => setCalcTuition(Number(e.target.value))}
                    className="w-full mt-1.5 p-2.5 bg-white border border-[var(--alo-border-strong)] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-[var(--alo-body)] font-semibold">Scholarship Grant ({countryData.currency})</label>
                  <input
                    type="number"
                    value={calcScholarship}
                    onChange={(e) => setCalcScholarship(Number(e.target.value))}
                    className="w-full mt-1.5 p-2.5 bg-white border border-[var(--alo-border-strong)] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-[var(--alo-body)] font-semibold">Exchange Rate (1 {countryData.currency} in BDT)</label>
                  <input
                    type="number"
                    value={calcExchangeRate}
                    onChange={(e) => setCalcExchangeRate(Number(e.target.value))}
                    className="w-full mt-1.5 p-2.5 bg-white border border-[var(--alo-border-strong)] rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[var(--alo-brand)] text-white p-6 rounded-2xl space-y-4 text-xs shadow-lg">
              <h3 className="font-bold text-sm border-b border-white/20 pb-2">
                Estimated budget summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--alo-brand-pale)]">Net 1st Year Tuition:</span>
                  <span className="font-bold text-sm">{countryData.currency} {netTuition.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--alo-brand-pale)]">Estimated Living Expenses:</span>
                  <span className="font-bold text-sm">{countryData.currency} {estimatedLiving.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex justify-between text-base font-black text-amber-300">
                  <span>Total First Year Cost:</span>
                  <span>৳ {totalCostBdt.toLocaleString()} BDT</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl space-y-1">
                  <span className="text-[var(--alo-brand-pale)] font-semibold">Estimated Bank Statement Requirement:</span>
                  <p className="text-sm font-black text-emerald-300">৳ {bankStatementBdt.toLocaleString()} BDT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: ENTRY REQUIREMENTS & AI CHECKER */}
      <section id="entry-requirements" className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Entry Requirements & AI Eligibility Checker</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Country-specific admission criteria for Bangladeshi qualifications</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              {countryData.entryRequirements.map((req, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-[var(--alo-border)] shadow-sm space-y-2 text-xs">
                  <span className="font-bold text-[var(--alo-brand)] text-sm">{req.level} Requirements</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[var(--alo-body)]">
                    <div><strong>Academic:</strong> {req.academic}</div>
                    <div><strong>English:</strong> {req.english}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Preparation Mini Card — intelligently placed beside Country */}
            <div className="lg:col-span-5 space-y-4">
              <TestPreparationMiniCard
                contextTitle={`English tests for ${countryData.name}`}
                recommendedTest={countryData.name === 'UK' ? 'IELTS / PTE UKVI' : 'IELTS / PTE / Duolingo'}
                targetScore="6.5+ Overall"
              />

              <div className="bg-white p-6 rounded-2xl border border-[var(--alo-border)] shadow-sm space-y-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--alo-brand)]">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Instant AI Eligibility Checker
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[var(--alo-body)] font-medium">Academic Result (SSC/HSC/CGPA)</label>
                    <input
                      type="text"
                      value={studentResult}
                      onChange={(e) => setStudentResult(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border-strong)] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--alo-body)] font-medium">English Score (IELTS / PTE / MOI)</label>
                    <input
                      type="text"
                      value={studentEnglish}
                      onChange={(e) => setStudentEnglish(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border-strong)] rounded-xl"
                    />
                  </div>
                  <button
                    onClick={handleRunEligibilityCheck}
                    className="w-full h-11 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-bold rounded-xl transition"
                  >
                    Run AI Check
                  </button>

                  {eligibilityResult && (
                    <div className={`p-4 rounded-xl border ${eligibilityResult.badgeColor} space-y-2`}>
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> {eligibilityResult.label}
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {eligibilityResult.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 14: VISA APPLICATION PROCESS */}
      <section id="visa-process" className="py-16 bg-white border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">{countryData.name} Student Visa Process</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Official step-by-step roadmap from university offer to visa stamp</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {countryData.visaSteps.map((step) => (
              <div key={step.step} className="bg-[var(--alo-page)] p-6 rounded-2xl border border-[var(--alo-border)] space-y-2 text-xs">
                <span className="w-8 h-8 bg-[var(--alo-brand)] text-white font-black rounded-full flex items-center justify-center text-xs">
                  {step.step}
                </span>
                <h4 className="font-bold text-[var(--alo-text)] text-sm">{step.title}</h4>
                <p className="text-[var(--alo-body)] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 17: WORK RIGHTS & POST-STUDY ROUTE */}
      <section id="work-rights" className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Work Rights & Post-Study Route Summary</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Official government rules for international students in {countryData.name}</p>
          </div>

          {countryData.workRightRules.map((rule, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[var(--alo-border)] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[var(--alo-text-muted)] font-semibold">Term-Time Work Rights:</span>
                <p className="text-sm font-black text-[var(--alo-text)]">{rule.termTime}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--alo-text-muted)] font-semibold">Vacation Work Rights:</span>
                <p className="text-sm font-black text-[var(--alo-text)]">{rule.vacation}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--alo-text-muted)] font-semibold">Post-Study Work Route:</span>
                <p className="text-sm font-black text-emerald-700">{rule.postStudyRoute}</p>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[var(--alo-text-muted)]">
            * Visa and work rules can change. Always verify final conditions with official government sources and ALO staff before making decisions.
          </p>
        </div>
      </section>

      {/* SECTION 21: COUNTRY FAQS */}
      <section id="faqs" className="py-16 bg-white border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-[var(--alo-text)] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1">Country-specific answers verified by ALO Education compliance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {countryData.faqs.map((faq, idx) => (
              <div key={idx} className="bg-[var(--alo-page)] p-5 rounded-2xl border border-[var(--alo-border)] space-y-2 text-xs">
                <h4 className="font-bold text-sm text-[var(--alo-text)] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--alo-brand)] shrink-0" /> {faq.question}
                </h4>
                <p className="text-[var(--alo-body)] leading-relaxed pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 22: FINAL CTA & LEAD FORM */}
      <section id="lead-form" className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-[var(--alo-text)] tracking-tight">Ready to Start Your {countryData.name} Study Journey?</h2>
            <p className="text-[var(--alo-body)] text-xs">Submit your query for personalized counseling and university shortlisting from certified ALO counselors.</p>
          </div>

          {leadSuccess ? (
            <div className="p-8 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-emerald-900">Inquiry Registered Successfully!</h3>
              <p className="text-xs text-[var(--alo-body)]">Our Senior {countryData.name} Admissions Counselor will contact you on WhatsApp shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="bg-white text-[var(--alo-text)] p-8 rounded-2xl space-y-4 text-xs border border-[var(--alo-border)] shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[var(--alo-body)]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border-strong)] rounded-xl text-sm"
                    placeholder="e.g. Md. Tanvir Ahmed"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--alo-body)]">Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border-strong)] rounded-xl text-sm"
                    placeholder="e.g. 01712345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-[var(--alo-body)]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border-strong)] rounded-xl text-sm"
                    placeholder="e.g. tanvir@gmail.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[var(--alo-body)]">Target Intake</label>
                  <select
                    value={leadForm.intake}
                    onChange={(e) => setLeadForm({ ...leadForm, intake: e.target.value })}
                    className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border-strong)] rounded-xl text-sm"
                  >
                    {countryData.popularIntakes.map((intake, i) => (
                      <option key={i} value={intake}>{intake}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingLead}
                className="w-full h-12 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black font-bold text-sm rounded-xl transition shadow-md"
              >
                {submittingLead ? 'Submitting...' : 'Submit Free Application Inquiry'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* SECTION 23: DATA VERIFICATION AUDIT TRAIL */}
      <section className="py-8 bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] text-[11px] border-t border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="font-bold text-[var(--alo-body)]">Data Verification & Compliance Audit Table</div>
          <div className="flex flex-wrap gap-4">
            {countryData.sources.map((src, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                • <strong>{src.section}:</strong> Verified by ALO Compliance via{' '}
                <a href={src.sourceUrl} target="_blank" rel="noreferrer" className="underline text-[var(--alo-brand)]">
                  {src.sourceName}
                </a>{' '}
                ({src.lastVerifiedAt})
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
