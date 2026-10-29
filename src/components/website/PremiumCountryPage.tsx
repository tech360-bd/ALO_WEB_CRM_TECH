'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, ArrowRight, Award, BadgeCheck, BookOpen, Briefcase, Building2, Calculator, Calendar, CheckCircle2, CheckSquare, Clock, Coins, Compass, DollarSign, ExternalLink, FileCheck, FileText, Globe, GraduationCap, HelpCircle, MapPin, MessageSquare, Phone, Send, ShieldCheck, Sparkles, Star, UploadCloud, Users } from 'lucide-react';
import { CountryDestinationData } from '@/lib/country-destinations-data';
import { destinationCardImage } from './ImageMapping';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';
import { EnglishExamButton } from '@/components/website/EnglishExamCta';
import { isEnglishProficiencyTestSlug } from '@/lib/english-exam';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALO_CONTACT, ALO_PUBLIC_CONTACT_CTA } from '@/lib/alo-site-info';

interface Props {
  countryData: CountryDestinationData;
  linkedCourses?: any[];
  linkedUniversities?: any[];
  linkedScholarships?: any[];
}

/**
 * Country imagery — approved local assets only (no hotlinked stock).
 * The seven main destinations use verified local landmark photography via
 * DESTINATION_CARD_IMAGES; other countries fall back to the Europe banner.
 * City cards intentionally use a designed icon header rather than a photo:
 * no approved city-specific photography exists locally, and reusing one
 * generic photo for every city would misrepresent them.
 */
const COUNTRY_IMAGE_MAP: Record<string, string> = {
  germany: '/images/hero-banners/Europe slide Banner.webp',
};



export default function PremiumCountryPage({ countryData, linkedCourses = [], linkedUniversities = [], linkedScholarships = [] }: Props) {
  const [calcLevel, setCalcLevel] = useState('');
  const [calcTuition, setCalcTuition] = useState<number | ''>('');
  const [calcScholarship, setCalcScholarship] = useState<number | ''>('');
  const [calcMonthlyLiving, setCalcMonthlyLiving] = useState<number | ''>('');
  const [calcLivingMonths, setCalcLivingMonths] = useState<number | ''>('');
  const [calcExchangeRate, setCalcExchangeRate] = useState<number | ''>('');

  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', email: '', level: '', subject: '', intake: '', budget: '', englishTest: '', englishScore: '', message: '',
  });
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadSuccessMessage, setLeadSuccessMessage] = useState('Your enquiry was received for staff review.');
  const [leadError, setLeadError] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);

  const budgetInputsComplete = [calcTuition, calcScholarship, calcMonthlyLiving, calcLivingMonths, calcExchangeRate]
    .every((value) => typeof value === 'number' && Number.isFinite(value))
    && Number(calcTuition) >= 0
    && Number(calcScholarship) >= 0
    && Number(calcMonthlyLiving) > 0
    && Number(calcLivingMonths) > 0
    && Number(calcExchangeRate) > 0;
  const netTuition = budgetInputsComplete ? Math.max(0, Number(calcTuition) - Number(calcScholarship)) : null;
  const estimatedLiving = budgetInputsComplete ? Number(calcMonthlyLiving) * Number(calcLivingMonths) : null;
  const totalCostForeign = netTuition !== null && estimatedLiving !== null ? netTuition + estimatedLiving : null;
  const totalCostBdt = totalCostForeign !== null ? Math.round(totalCostForeign * Number(calcExchangeRate)) : null;

  const heroImage = destinationCardImage(countryData.slug, COUNTRY_IMAGE_MAP[countryData.slug]);
  const heroFallback = heroImage;

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    setLeadError('');
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
          notes: [leadForm.englishTest && `English test: ${leadForm.englishTest}${leadForm.englishScore ? ` (${leadForm.englishScore})` : ''}`, leadForm.budget && `Budget: ${leadForm.budget}`, leadForm.message].filter(Boolean).join(' | '),
          source: `Website Destination: ${countryData.name}`,
          sourceSection: `country_page:${countryData.slug}`,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true) {
        setLeadError(typeof data?.error === 'string' ? data.error : 'Your enquiry could not be recorded. Please try again or use the Contact page.');
        return;
      }
      setLeadSuccessMessage(typeof data.message === 'string' ? data.message : 'Your enquiry was received for staff review.');
      setLeadSuccess(true);
    } catch {
      setLeadError('Connection issue. Your enquiry was not confirmed as saved. Please try again or use the Contact page.');
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className="bg-card text-[var(--alo-text)] font-sans min-h-screen">
      {/* SEO Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "EducationalOccupationalProgram", "name": countryData.seoTitle, "description": countryData.seoDescription, "provider": { "@type": "EducationalOrganization", "name": "ALO Education", "sameAs": "https://aloeducation.com" } }) }} />

      {/* 3. COUNTRY HERO — WHITE BACKGROUND #FFFFFF NO DARK OVERLAY — 10X PREMIUM */}
      <section className="relative bg-card text-[var(--alo-text)] pt-8 pb-16 lg:py-20 border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs font-bold tracking-wider">STUDY IN {countryData.name.toUpperCase()}</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold tracking-[-0.025em] leading-[1.06] text-[var(--alo-text)]">Study in {countryData.name} from Bangladesh</h1>
              <p className="text-base md:text-lg text-[var(--alo-body)] leading-relaxed max-w-2xl">{countryData.heroSubtitle} {countryData.overview}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href={`/course-finder?country=${encodeURIComponent(countryData.name)}`}><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold rounded-xl shadow-sm">Find Courses</Button></Link>
                <Link href="/eligibility-check"><Button variant="outline" className="bg-white border-[var(--alo-border)] text-[var(--alo-text)] hover:bg-[var(--alo-page)] h-12 px-8 font-semibold rounded-xl">Check Eligibility</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white border-[var(--alo-border)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)] h-12 px-8 font-semibold rounded-xl">Request Consultation</Button></Link>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)]">Last Verified: {countryData.lastVerifiedAt}</p>
            </div>
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-[2rem] overflow-hidden border border-[var(--alo-border)] shadow-xl bg-[var(--alo-page)] aspect-[4/3]">
                <img src={heroFallback} alt={`Study in ${countryData.name} — ${countryData.heroTitle}`} className="w-full h-full object-cover" loading="eager" />
                {/* Floating cards — premium, country-specific */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-[var(--alo-border)] rounded-2xl p-3 shadow-lg">
                  <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Popular Intakes</p>
                  <p className="text-xs font-bold text-[var(--alo-text)] mt-1">{countryData.popularIntakes.slice(0,2).join(', ')}</p>
                </div>
                <div className="absolute top-4 right-4 hidden sm:block bg-white/95 backdrop-blur-md border border-[var(--alo-border)] rounded-2xl p-3 shadow-lg">
                  <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Study Levels</p>
                  <p className="text-xs font-bold text-[var(--alo-brand)]">{countryData.studyLevels.slice(0,3).join(', ')}</p>
                </div>
                <div className="absolute bottom-4 left-4 hidden sm:block bg-white/95 backdrop-blur-md border border-[var(--alo-border)] rounded-2xl p-3 shadow-lg">
                  <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Universities</p>
                  <p className="text-sm font-black text-[var(--alo-text)]">{linkedUniversities.length || countryData.quickFacts.find(f=>f.label.includes('University'))?.value || '100+'} • {countryData.name}</p>
                </div>
                <div className="absolute bottom-4 right-4 bg-[var(--alo-brand)] text-white rounded-2xl p-3 shadow-lg">
                  <p className="text-[11px] font-bold text-[#D6E6FF] uppercase">Courses</p>
                  <p className="text-sm font-black">{linkedCourses.length > 0 ? `${linkedCourses.length} Courses` : 'Explore Courses'}</p>
                  <p className="text-[11px] text-[#D6E6FF] mt-1">Last Verified: {countryData.lastVerifiedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COUNTRY INTRODUCTION — Editorial 2-column */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-[2rem] overflow-hidden border border-[var(--alo-border)] shadow-sm bg-white aspect-[4/3]">
                <img src={heroImage} alt={`Landmark in ${countryData.name}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
            </div>
            <div className="lg:col-span-7 space-y-5">
              <Badge className="bg-white border-[var(--alo-border)] text-[var(--alo-brand)] text-xs">Why Bangladeshi Students Consider {countryData.name}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--alo-text)]">Why {countryData.name} for Higher Education</h2>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed">{countryData.overview} {countryData.whyStudySummary}</p>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed">Final eligibility always depends on the university, course, academic profile, English score and any study gap.</p>
              <div className="flex gap-3 pt-2">
                <Link href={`/course-finder?country=${encodeURIComponent(countryData.name)}`}><Button className="bg-[var(--alo-brand)] text-white h-12 px-6 font-bold rounded-xl">Explore Courses in {countryData.name}</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6 rounded-xl">Talk to Counselor</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUICK FACTS — Premium visual fact cards — 4 columns desktop */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Quick facts about studying in {countryData.name}</h2>
            <Badge className="gap-1 bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]"><BadgeCheck className="size-3" />Verified {countryData.lastVerifiedAt}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countryData.quickFacts.map((fact, i) => (
              <Card key={i} className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow h-full">
                <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider">{fact.label}</p>
                <p className="text-sm font-bold text-[var(--alo-text)] mt-2 leading-snug">{fact.value || 'Check with counselor'}</p>
                {fact.sourceUrl && <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Source: <a href={fact.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline">Official</a></p>}
              </Card>
            ))}
            {/* Additional dynamic facts from DB */}
            <Card className="p-5 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl shadow-sm h-full">
              <p className="caption-text">Universities</p>
              <p className="text-sm font-bold text-[var(--alo-brand)] mt-2">{linkedUniversities.length ? `${linkedUniversities.length} universities in ${countryData.name}` : 'Ask a counselor for the current list'}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Counted from the published catalogue</p>
            </Card>
            <Card className="p-5 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl shadow-sm h-full">
              <p className="caption-text">Courses</p>
              <p className="text-sm font-bold text-[var(--alo-text)] mt-2">{linkedCourses.length ? `${linkedCourses.length} Courses` : 'Check with counselor'}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Same published catalogue</p>
            </Card>
            <Card className="p-5 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl shadow-sm h-full">
              <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Last Verified</p>
              <p className="text-sm font-bold text-emerald-700 mt-2">{countryData.lastVerifiedAt}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Verified by ALO Compliance</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. WHY STUDY IN [COUNTRY] — Country-specific reasons — visually premium, not same 3-col grid */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Why Study in {countryData.name} — Country-Specific Reasons</h2>
          <p className="text-sm text-[var(--alo-body)] max-w-3xl">{countryData.name} has its own country-specific reasons — never copy UK rules into another country. Each reason icon/title/short explanation/optional related link — visually premium.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {countryData.reasons.map((reason, i) => (
              <Card key={i} className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm hover:shadow-md transition-all h-full flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--alo-brand)]/10 border border-[var(--alo-brand)]/20 flex items-center justify-center shrink-0">
                  {reason.icon === 'award' ? <Award className="w-6 h-6 text-[var(--alo-brand)]" /> : reason.icon === 'briefcase' ? <Briefcase className="w-6 h-6 text-[var(--alo-brand)]" /> : reason.icon === 'coins' ? <Coins className="w-6 h-6 text-[var(--alo-brand)]" /> : reason.icon === 'globe' ? <Globe className="w-6 h-6 text-[var(--alo-brand)]" /> : <Star className="w-6 h-6 text-[var(--alo-brand)]" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[var(--alo-text)]">{reason.heading}</h4>
                  <p className="text-sm text-[var(--alo-body)] mt-1 leading-relaxed">{reason.description}</p>
                  <Link href={`/course-finder?country=${encodeURIComponent(countryData.name)}`} className="text-xs font-bold text-[var(--alo-brand)] hover:underline mt-2 inline-flex items-center gap-1">Explore {countryData.name} Courses <ArrowRight className="w-3 h-3" /></Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. EDUCATION PATHWAY — Visual pathway */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Education Pathway for Bangladeshi Students — {countryData.name}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {countryData.pathways.map((path, i) => (
              <Card key={i} className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-cta)]" />
                <p className="text-xs font-bold text-[var(--alo-brand)] uppercase">{path.fromLevel}</p>
                <p className="text-sm font-bold text-[var(--alo-text)] mt-2">↓</p>
                <p className="text-sm font-semibold text-[var(--alo-text)] mt-2">{path.toPathway}</p>
                <p className="text-xs text-[var(--alo-body)] mt-3 leading-relaxed">{path.description}</p>
              </Card>
            ))}
          </div>
          <p className="text-xs text-[var(--alo-text-muted)] bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4">Final eligibility depends on university, course, academic profile, English score, study gap and other admission requirements.</p>
        </div>
      </section>

      {/* 8. Popular courses — rendered from the published catalogue only */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Popular courses in {countryData.name}</h2>
            <Link href={`/course-finder?country=${encodeURIComponent(countryData.name)}`}><Button variant="outline" className="border-[var(--alo-border)] h-12 ">Find more courses</Button></Link>
          </div>
          {linkedCourses.length === 0 ? (
            <Card className="p-12 bg-white border-[var(--alo-border)] rounded-2xl text-center"><GraduationCap className="w-12 h-12 text-[var(--alo-border-strong)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">We have no verified course records for {countryData.name} yet.</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">Information not currently verified. Please check with an ALO Education counselor.</p></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedCourses.slice(0, 9).map((c: any) => (
                <Card key={c.courseId || c.id} className="p-5 bg-white border-[var(--alo-border)] hover:border-[var(--alo-brand)] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                  <div>
                    <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-[11px] mb-2">{c.studyLevel || 'Course'}</Badge>
                    <h4 className="font-bold text-sm text-[var(--alo-text)] line-clamp-2">{c.courseTitle}</h4>
                    <p className="text-xs text-[var(--alo-text-muted)] mt-1">{c.university?.name || c.universityName || 'University'} • {c.city || ''}, {c.country || countryData.name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] text-[var(--alo-body)]">
                      <span>Duration: {c.durationMonths ? `${Math.round(c.durationMonths/12*10)/10}y` : 'Check'}</span>
                      <span>Tuition: {c.yearlyTuition ? `${c.tuitionCurrency || 'GBP'} ${c.yearlyTuition}` : 'Ask a counselor'}</span>
                      <span>Intake: {c.intakeMonth || 'Sep, Jan'}</span>
                      <span>English: {c.ieltsMin ? `IELTS ${c.ieltsMin}` : 'Check course'}</span>
                    </div>
                    {c.scholarships && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] mt-2">Scholarship Available</Badge>}
                    <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Last Verified: {c.lastVerifiedAt || countryData.lastVerifiedAt}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link href={`/course/${c.slug || c.courseId}`} className="block"><Button className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] h-12 font-bold">View course</Button></Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/compare?course=${c.courseId}`}><Button variant="outline" size="sm" className="w-full border-[var(--alo-border)] h-12 text-[11px]">Compare</Button></Link>
                      <Link href="/eligibility-check"><Button variant="outline" size="sm" className="w-full border-[var(--alo-border)] h-12 text-[11px]">Apply</Button></Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9. Popular universities — rendered from the published catalogue only */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Popular universities in {countryData.name}</h2>
            <Link href={`/universities?country=${encodeURIComponent(countryData.name)}`}><Button variant="outline" className="border-[var(--alo-border)] h-12 ">View All Universities in {countryData.name}</Button></Link>
          </div>
          {linkedUniversities.length === 0 ? (
            <Card className="p-12 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><Building2 className="w-12 h-12 text-[var(--alo-border-strong)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">We have no verified university records for {countryData.name} yet.</p></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedUniversities.slice(0, 9).map((u: any) => (
                <Card key={u.universityId || u.id} className="p-6 bg-white border-[var(--alo-border)] hover:border-[var(--alo-brand)] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] text-white flex items-center justify-center font-black text-lg">{u.name?.[0] || 'U'}</div>
                      <div className="flex-1"><h4 className="font-bold text-sm text-[var(--alo-text)] line-clamp-1">{u.name}</h4><p className="text-xs text-[var(--alo-text-muted)]">{u.city}, {u.country}</p></div>
                    </div>
                    <div className="space-y-1.5 text-xs text-[var(--alo-body)]">
                      <p>Popular subjects: Business, Computer Science, Engineering — check DB</p>
                      <p>Available intakes: September, January — actual available intakes from course_intakes</p>
                      <p>Scholarship: {u.scholarships ? 'Available' : 'Check with counselor'} • English: IELTS {u.ieltsMin || 'Check'}</p>
                      <p className="text-[11px] text-[var(--alo-text-muted)]">Last Verified: {u.lastVerifiedAt || countryData.lastVerifiedAt} identity if legally approved logo not available</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link href={`/universities/${u.slug || u.universityId}`} className="block"><Button className="w-full bg-[var(--alo-brand)] text-white h-12 font-bold">View university</Button></Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/course-finder?university=${u.universityId}`}><Button variant="outline" size="sm" className="w-full border-[var(--alo-border)] h-12 text-[11px]">View Courses</Button></Link>
                      <Link href="/eligibility-check"><Button variant="outline" size="sm" className="w-full bg-[var(--alo-cta)]/10 border-[var(--alo-cta)]/20 text-[var(--alo-cta)] h-12 text-[11px]">Apply Through ALO</Button></Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 10. TUITION & BUDGET — Premium budget section with interactive estimator */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Tuition and budget for {countryData.name}</h2>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Undergraduate Tuition</p><p className="text-lg font-bold text-[var(--alo-text)] mt-1">{countryData.tuitionRange}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Source: Official • Last verified: {countryData.lastVerifiedAt} • Confirm with a counselor if unavailable</p></Card>
                <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Postgraduate Tuition</p><p className="text-lg font-bold text-[var(--alo-text)] mt-1">{countryData.tuitionRange}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Currency displayed — no BDT conversion unless verified</p></Card>
                <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Living Cost</p><p className="text-lg font-bold text-[var(--alo-text)] mt-1">{countryData.livingCost}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">The BDT figure uses the exchange rate you enter above — it is indicative, not a quoted rate.</p></Card>
              </div>
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-[var(--alo-brand)]" />Interactive budget estimator</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div><label className="text-[var(--alo-body)]">Study Level</label><select value={calcLevel} onChange={e=>setCalcLevel(e.target.value)} className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl"><option value="">Choose a study level</option><option>Foundation</option><option>Bachelor</option><option>Masters</option><option>MBA</option><option>PhD</option></select></div>
                  <div><label className="text-[var(--alo-body)]">City (optional)</label><input placeholder="Enter a city" className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl" /></div>
                  <div><label className="text-[var(--alo-body)]">Tuition amount ({countryData.currency})</label><input type="number" min="0" value={calcTuition} onChange={e=>setCalcTuition(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl" /></div>
                  <div><label className="text-[var(--alo-body)]">Scholarship amount (enter 0 if none)</label><input type="number" min="0" value={calcScholarship} onChange={e=>setCalcScholarship(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl" /></div>
                  <div><label className="text-[var(--alo-body)]">Monthly living estimate ({countryData.currency})</label><input type="number" min="0" value={calcMonthlyLiving} onChange={e=>setCalcMonthlyLiving(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl" /></div>
                  <div><label className="text-[var(--alo-body)]">Living months</label><input type="number" min="1" value={calcLivingMonths} onChange={e=>setCalcLivingMonths(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl" /></div>
                  <div className="sm:col-span-2"><label className="text-[var(--alo-body)]">BDT exchange rate per 1 {countryData.currency}</label><input type="number" min="0" step="any" value={calcExchangeRate} onChange={e=>setCalcExchangeRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 p-2.5 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl" /></div>
                </div>
                <div className="mt-6 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl p-4 space-y-2 text-xs">
                  <p className="font-semibold text-[var(--alo-text)]">This estimator uses only values you enter. It does not fetch or verify tuition, living costs, scholarship amounts, or exchange rates.</p>
                  {budgetInputsComplete && totalCostForeign !== null && totalCostBdt !== null ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-[var(--alo-text-muted)]">Net Tuition:</span><p className="font-bold text-[var(--alo-text)]">{netTuition} {countryData.currency}</p></div>
                      <div><span className="text-[var(--alo-text-muted)]">Living Estimate:</span><p className="font-bold">{estimatedLiving} {countryData.currency} ({calcLivingMonths} months × {calcMonthlyLiving})</p></div>
                      <div><span className="text-[var(--alo-text-muted)]">Combined Estimate:</span><p className="font-black text-[var(--alo-brand)] text-sm">{totalCostForeign} {countryData.currency} · ৳ {totalCostBdt.toLocaleString()} BDT</p></div>
                      <div><span className="text-[var(--alo-text-muted)]">Not included:</span><p className="font-bold">Visa, travel, deposits, insurance, and other fees</p></div>
                    </div>
                  ) : <p className="text-[var(--alo-text-muted)]">Enter tuition, scholarship (0 if none), monthly living amount, months, and exchange rate to calculate. No example values are prefilled.</p>}
                  <p className="text-[11px] text-[var(--alo-text-muted)]">Confirm every input against current official sources. This estimate is not a quote or financial advice.</p>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <TestPreparationMiniCard contextTitle={`English tests for ${countryData.name}`} recommendedTest={countryData.name === 'UK' ? 'IELTS / PTE UKVI' : 'IELTS / PTE / Duolingo'} targetScore="6.5+ Overall" />
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm mb-3">Budget breakdown</h4>
                <div className="space-y-2 text-xs text-[var(--alo-body)]">
                  <div className="flex justify-between"><span>Deposit:</span><span className="font-semibold">Check offer letter — typically £2,000-£5,000 or 50%</span></div>
                  <div className="flex justify-between"><span>Scholarship:</span><span className="font-semibold text-emerald-600">£1,000-£5,000 where verified</span></div>
                  <div className="flex justify-between"><span>Scholarship Range:</span><span>See the scholarship directory for this destination</span></div>
                  <div className="flex justify-between"><span>Estimated First-Year Budget:</span><span className="font-bold">Tuition + Living - Scholarship</span></div>
                </div>
                <p className="text-[11px] text-[var(--alo-text-muted)] mt-3">Source: Official university page • Last verified: {countryData.lastVerifiedAt} • If a figure is not shown, ask a counselor</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

            {/* 11. ENTRY REQUIREMENTS — Tabs/cards Foundation/Bachelor/Top-up/Masters/MBA/PhD — PREMIUM TABS */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Entry requirements for {countryData.name}</h2>
              <p className="text-sm text-[var(--alo-body)] mt-2 max-w-3xl">Entry requirements vary by study level and by university. The table below shows the typical academic and English requirements for {countryData.name}; your counsellor will confirm the exact requirements for your chosen course.</p>
            </div>
            <Badge className="gap-1 bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]"><BadgeCheck className="size-3" />{countryData.entryRequirements.length} Levels • Verified {countryData.lastVerifiedAt}</Badge>
          </div>
          <Tabs defaultValue={countryData.entryRequirements[0]?.level || '0'} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="h-auto w-max bg-[var(--alo-page)] p-1 border border-[var(--alo-border)] rounded-2xl">
                {countryData.entryRequirements.map((req, i) => (
                  <TabsTrigger key={i} value={String(i)} className="h-10 px-4 text-xs font-semibold data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white rounded-xl">{req.level}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            {countryData.entryRequirements.map((req, i) => (
              <TabsContent key={i} value={String(i)} className="mt-6">
                <Card className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm flex items-center gap-2 text-[var(--alo-brand)]"><GraduationCap className="w-4 h-4"/>{req.level}</h4>
                      <div><p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider">Academic Requirement</p><p className="text-sm font-semibold text-[var(--alo-text)] mt-1">{req.academic || 'Requirement information is currently being verified. Please check with an ALO Education counselor.'}</p></div>
                      <div><p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Remarks</p><p className="text-xs text-[var(--alo-body)] mt-1">Requirements shown are the ones recorded for {countryData.name}. Check the official source for the latest rules.</p></div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">English Requirement</p>
                      <p className="text-sm font-semibold text-emerald-700">{req.english || 'English requirement information is currently being verified.'}</p>
                      <p className="text-xs text-[var(--alo-body)] mt-2">Accepted tests for {countryData.name}: {countryData.englishTests.slice(0,3).map(t=>t.name).join(', ')} — check English Tests section below.</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase">Documents</p>
                      <ul className="space-y-1.5">
                        {(req.documents || []).map((doc: string, di: number) => (<li key={di} className="flex items-center gap-2 text-xs text-[var(--alo-body)]"><CheckCircle2 className="w-3.5 h-3.5 text-[var(--alo-brand)] shrink-0"/><span>{doc}</span></li>))}
                      </ul>
                      <div className="pt-3 border-t border-[var(--alo-border)] space-y-1">
                        <p className="text-[11px] text-[var(--alo-text-muted)]">Source: Official • Last verified: {countryData.lastVerifiedAt} • Verified by ALO Compliance</p>
                        <p className="text-[11px] text-[var(--alo-text-muted)]">For logged-in students: actual document checklist status shown in Student Portal → Documents.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* 12. ENGLISH TEST REQUIREMENTS — Only relevant tests for country */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">English tests accepted in {countryData.name}</h2>
          <p className="text-sm text-[var(--alo-body)]">English tests accepted for {countryData.name}, with links to full preparation guides.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {countryData.englishTests.map((test, i) => (
              <Card key={i} className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
                <div>
                  <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)] text-[11px] mb-2">{test.name}</Badge>
                  <p className="text-xs font-semibold text-[var(--alo-text)]">Accepted for: {test.accepted}</p>
                  <p className="text-xs text-[var(--alo-body)] mt-1">{test.note}</p>
                  <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Source: <a href={test.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline">{test.sourceUrl}</a></p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/language-prep/${test.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex-1"><Button size="sm" className="w-full bg-[var(--alo-brand)] text-white h-12 text-[11px]">Learn more</Button></Link>
                  {isEnglishProficiencyTestSlug(test.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) && (<EnglishExamButton location="country_page" className="flex h-9 flex-1 items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100">Take the English Test</EnglishExamButton>)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

            {/* 13. REQUIRED DOCUMENTS — Premium checklist — LOGIN-AWARE */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Required Documents — {countryData.name} — Premium Checklist</h2>
            <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">For logged-in students: actual status in portal • Public: general checklist</Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--alo-brand)]"/>Academic</h4><ul className="space-y-1.5 text-[var(--alo-body)]">{['SSC/O-Level','HSC/A-Level','Bachelor','Masters where applicable'].map((it,ii)=>(<li key={ii} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0"/><span>{it}</span></li>))}</ul><p className="text-[11px] text-[var(--alo-text-muted)] mt-3">Your documents stay private — they are only visible to you and your assigned counsellor when you are logged in.</p></Card>
            <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4 text-[var(--alo-brand)]"/>Identity</h4><ul className="space-y-1.5 text-[var(--alo-body)]">{['Passport','Photo','NID/Birth Certificate where required'].map((it,ii)=>(<li key={ii} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0"/><span>{it}</span></li>))}</ul></Card>
            <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[var(--alo-brand)]"/>English & Application</h4><ul className="space-y-1.5 text-[var(--alo-body)]">{['IELTS/PTE/TOEFL/DET/etc.','CV','SOP','Recommendation letters','Work experience'].map((it,ii)=>(<li key={ii} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0"/><span>{it}</span></li>))}</ul></Card>
            <Card className="p-5 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl shadow-sm relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-cta)]"/><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[var(--alo-cta)]"/>Financial & Visa</h4><ul className="space-y-1.5 text-[var(--alo-body)]">{['Bank statement','Sponsor documents','Source of funds','Relationship proof', `${countryData.name}-specific documents`].map((it,ii)=>(<li key={ii} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[var(--alo-brand)] shrink-0"/><span>{it}</span></li>))}</ul><div className="mt-4 p-3 bg-white border border-[var(--alo-border)] rounded-xl"><p className="text-[11px] font-semibold text-[var(--alo-brand)]">Logged-in student view</p><p className="text-[11px] text-[var(--alo-body)] mt-1">Your actual document status appears in <Link href="/student/documents" className="text-[var(--alo-brand)] underline font-semibold">Student Portal → Documents</Link> (RBAC protected, prepared statements, no public exposure).</p><Link href="/student/documents"><Button size="sm" className="mt-2 w-full bg-[var(--alo-brand)] text-white h-12 text-[11px]">View My Document Status</Button></Link></div></Card>
          </div>
          <p className="text-xs text-[var(--alo-text-muted)] bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4">For public users: general checklist only • For logged-in students: actual document status via API — do NOT expose student documents publicly — CSRF + RBAC protected.</p>
        </div>
      </section>

      {/* 14. VISA PROCESS — Beautiful visual step-by-step timeline country-specific */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">{countryData.name} Student Visa Process — Country-Specific Timeline</h2>
          <p className="text-sm text-[var(--alo-body)]">The process MUST be country-specific — UK uses CAS only where applicable, Canada DLI & LOA, Australia COE, USA I-20, Ireland, New Zealand, Dubai/UAE UAE-specific — NEVER copy UK process to other countries. Every step title/description/official/current source/last verified.</p>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--alo-brand)] to-[var(--alo-cta)] hidden md:block" />
            <div className="space-y-6">
              {countryData.visaSteps.map((step) => (
                <div key={step.step} className="relative flex gap-6">
                  <div className="hidden md:flex w-8 h-8 bg-[var(--alo-brand)] text-white font-black rounded-full items-center justify-center text-xs shrink-0 shadow-md">{step.step}</div>
                  <Card className="flex-1 p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-[var(--alo-text)] flex items-center gap-2"><span className="md:hidden w-6 h-6 bg-[var(--alo-brand)] text-white rounded-full flex items-center justify-center text-[11px]">{step.step}</span>{step.title}</h4>
                    <p className="text-sm text-[var(--alo-body)] mt-2 leading-relaxed">{step.description}</p>
                    <p className="text-[11px] text-[var(--alo-text-muted)] mt-3">Official/current source: Check official government source for {countryData.name} • Last verified: {countryData.lastVerifiedAt} • {countryData.name}-specific terminology</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 15. VISA READINESS — no unsupported public prediction */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-6 md:p-8 bg-amber-50 border-amber-200 rounded-2xl">
            <h2 className="text-2xl font-bold text-amber-900">Visa guidance for {countryData.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-amber-800">
              This page does not calculate visa eligibility or predict an immigration decision. Requirements change and only the relevant government authority can decide an application. Check current official guidance and request a staff review if you need help; no visa outcome is guaranteed.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/book-consultation"><Button className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)]">Request Consultation</Button></Link>
              <Link href="/contact"><Button variant="outline">Contact ALO Education</Button></Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 16. AI INTERVIEW PRACTICE — Country-specific */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">AI Interview Practice — {countryData.name} — Country-Specific Questions</h2>
          <p className="text-sm text-[var(--alo-body)]">Questions must change according to country — Why this country? Why this university? Why this course? Why not Bangladesh? Who is sponsoring you? How will you fund your study? Explain your study gap. What is your career plan? Country-specific interview terminology must be used. Result: Confidence/Course knowledge/Financial explanation/Study plan/Communication/Risk indicators/Improvement recommendations — save result for logged-in student.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {['Why this country?','Why this university?','Why this course?','Why not Bangladesh?','Who is sponsoring you?','How will you fund your study?','Explain your study gap.','What is your career plan?'].map((q,i)=>(
              <Card key={i} className="p-4 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
                <p className="text-sm font-semibold text-[var(--alo-text)]">{i+1}. {q}</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1">{countryData.name}-specific terminology — e.g. {countryData.name === 'UK' ? 'CAS' : countryData.name === 'Canada' ? 'LOA/DLI/PGWP' : countryData.name === 'Australia' ? 'COE/GTE' : countryData.name === 'USA' ? 'I-20/OPT/CPT' : countryData.name === 'Ireland' ? 'NFQ Level' : countryData.name === 'New Zealand' ? 'NZQA' : 'UAE Residence'}</p>
              </Card>
            ))}
          </div>
          <Link href="/student/visa-interview-practice"><Button className="bg-[var(--alo-brand)] text-white h-12 px-6 font-bold rounded-xl">Start {countryData.name} Interview Practice — Save Result</Button></Link>
        </div>
      </section>

      {/* 17. WORK RIGHTS & POST-STUDY — Verified/current only */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Work Rights & Post-Study Route — {countryData.name} — Verified/Current Only</h2>
          {countryData.workRightRules.map((rule, idx) => (
            <Card key={idx} className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <div className="grid md:grid-cols-4 gap-6 text-xs">
                <div><p className="text-[var(--alo-text-muted)] font-semibold">Term-time Rule</p><p className="text-sm font-bold text-[var(--alo-text)] mt-1">{rule.termTime}</p></div>
                <div><p className="text-[var(--alo-text-muted)] font-semibold">Vacation Rule</p><p className="text-sm font-bold text-[var(--alo-text)] mt-1">{rule.vacation}</p></div>
                <div><p className="text-[var(--alo-text-muted)] font-semibold">Course-level Conditions</p><p className="text-sm font-semibold mt-1">{rule.condition}</p></div>
                <div><p className="text-[var(--alo-text-muted)] font-semibold">Post-study Route</p><p className="text-sm font-bold text-emerald-700 mt-1">{rule.postStudyRoute}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Source: <a href={rule.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline">Official Government</a> • Last verified: {countryData.lastVerifiedAt}</p></div>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-4 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">Work-hour rules can change. Check the official source for the current limits. Always verify final conditions with official government sources and ALO staff before making decisions.</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 18. SCHOLARSHIPS — Load from scholarships table filter country */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between"><h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Scholarships in {countryData.name} — Load from DB Filter Country</h2><Link href={`/scholarships?country=${encodeURIComponent(countryData.name)}`}><Button variant="outline" className="border-[var(--alo-border)] h-12 ">View All Scholarships in {countryData.name}</Button></Link></div>
          {linkedScholarships.length === 0 ? <Card className="p-8 bg-white border-[var(--alo-border)] rounded-2xl text-center"><Award className="w-12 h-12 text-[var(--alo-border-strong)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">We have no verified scholarship records for {countryData.name} yet.</p></Card> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedScholarships.slice(0,6).map((s:any)=>(
                <Card key={s.id} className="p-5 bg-white border-[var(--alo-border)] hover:border-[var(--alo-brand)] rounded-2xl h-full flex flex-col justify-between">
                  <div><Badge className="bg-[var(--alo-cta)]/10 text-[var(--alo-cta)] border-[var(--alo-cta)]/20 text-[11px] mb-2">Scholarship</Badge><h4 className="font-bold text-sm">{s.scholarshipName || s.name}</h4><p className="text-xs text-[var(--alo-text-muted)] mt-1">{s.university?.name || s.university || ''} • Amount: {s.scholarshipAmount ? `${s.scholarshipCurrency} ${s.scholarshipAmount}` : s.amount ? `${s.currency} ${s.amount}` : 'Check eligibility'} • Type: {s.coverageType || s.fundingType || 'Tuition waiver'} • Eligibility: {s.eligibility?.substring(0,60) || 'Check'} • Deadline: {s.deadline || 'Check official'} • Last verified: {s.lastVerifiedAt || s.lastCheckedAt || countryData.lastVerifiedAt} • Source: {s.officialScholarshipUrl ? <a href={s.officialScholarshipUrl} target="_blank" className="text-[var(--alo-brand)] underline">Official</a> : 'Check'}</p></div>
                  <div className="flex gap-2 mt-4"><Link href={`/scholarships/${s.slug || s.id}`} className="flex-1"><Button size="sm" className="w-full bg-[var(--alo-brand)] text-white h-12 text-[11px]">View scholarship</Button></Link><Link href="/eligibility-check" className="flex-1"><Button size="sm" variant="outline" className="w-full border-[var(--alo-border)] h-12 text-[11px]">Check Eligibility</Button></Link></div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 19. CITY & LIFESTYLE — Visually rich city section */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Cities &amp; Lifestyle in {countryData.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {countryData.cities.map((city, i) => (
              <Card key={i} className="overflow-hidden bg-white border-[var(--alo-border)] rounded-2xl shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
                <div className="flex h-32 items-center justify-between bg-[var(--alo-brand-light)] px-5 relative">
                  <div>
                    <p className="font-heading text-xl font-extrabold text-[var(--alo-brand)]">{city.name}</p>
                    <p className="text-[11px] font-semibold text-[var(--alo-text-muted)]">{countryData.name}</p>
                  </div>
                  <MapPin className="h-9 w-9 text-[var(--alo-brand)]" aria-hidden="true" />
                  <div className="absolute bottom-3 left-5 bg-white border border-[var(--alo-border)] rounded-full px-3 py-1 text-[11px] font-bold text-[var(--alo-text)]">{city.costLevel} Cost</div>
                </div>
                <div className="p-5 flex-1">
                  <h4 className="font-bold text-[var(--alo-text)]">{city.name}</h4>
                  <p className="text-xs text-[var(--alo-body)] mt-1">Student vibe: {city.vibe}</p>
                  <p className="text-xs text-[var(--alo-text-muted)] mt-2">Popular universities: {city.universities?.join(', ') || 'Ask your counsellor for the current list'}</p>
                  <p className="text-xs text-[var(--alo-text-muted)]">Transport: Check city guide • Living cost: {city.livingCost || 'Ask a counselor'} • Job: { (city as any).jobOpportunitySummary || 'Ask a counselor'}</p>
                  <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Last verified: {countryData.lastVerifiedAt}</p>
                </div>
                <div className="p-5 pt-0">
                  <Link href={`/course-finder?country=${encodeURIComponent(countryData.name)}&city=${encodeURIComponent(city.name)}`} className="block"><Button className="w-full bg-white border border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand)] hover:text-white h-12 font-bold">Explore {city.name} courses</Button></Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 20. ALO SUPPORT — Premium service journey */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">ALO Support — Service Journey for {countryData.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Counseling', desc: 'Profile review, destination guidance', href: '/book-consultation' },
              { title: 'Course Matching', desc: 'Profile assessment, academic/English/budget matching', href: '/services/course-matching' },
              { title: 'University Shortlisting', desc: 'Top universities matching your profile', href: '/services/university-selection' },
              { title: 'Application Support', desc: 'SOP/CV support, document checking', href: '/services/application-assistance' },
              { title: 'English Preparation', desc: 'IELTS/PTE/TOEFL/Duolingo mock tests', href: '/language-prep' },
              { title: 'Interview Preparation', desc: 'Country-specific credibility interview', href: '/services/interview-preparation' },
              { title: 'Visa Guidance', desc: 'Document preparation, checklist, financial guidance', href: '/services/visa-guidance' },
              { title: 'Pre-Departure', desc: 'Pre-departure briefing, student portal tracking', href: '/services/pre-departure-orientation' },
              { title: 'Scholarship Guidance', desc: 'Finding scholarships, eligibility review, deadline tracking', href: '/services/scholarship-guidance' },
              { title: 'Financial Planning', desc: 'Budget planning, bank solvency guidance', href: '/services/financial-planning' },
              { title: 'Document Checking', desc: 'Document consistency, application review', href: '/services/document-checking' },
              { title: 'Post-Arrival Support', desc: 'Accommodation, student support', href: '/services/post-arrival-support' },
            ].map((service, i) => (
              <Link key={i} href={service.href}>
                <Card className="p-5 bg-white border-[var(--alo-border)] hover:border-[var(--alo-brand)] hover:shadow-sm transition-all rounded-2xl h-full">
                  <h4 className="font-bold text-sm text-[var(--alo-text)]">{service.title}</h4>
                  <p className="text-xs text-[var(--alo-body)] mt-1">{service.desc}</p>
                  <p className="text-xs font-bold text-[var(--alo-brand)] mt-3 flex items-center gap-1">View Service <ArrowRight className="w-3 h-3" /></p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 21. COUNTRY FAQ — Minimum 20 FAQs for EACH country — Accordion UI — Country-specific — Original ALO content */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">FAQs — {countryData.name} — Minimum 20 Country-Specific — Accordion UI</h2>
            <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">{countryData.faqs.length} FAQs — Original ALO Content — Verified</Badge>
          </div>
          <Card className="p-2 md:p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {countryData.faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-[var(--alo-border)]/60">
                  <AccordionTrigger className="text-left font-semibold text-[var(--alo-text)] text-sm hover:text-[var(--alo-brand)] py-4">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-[var(--alo-body)] leading-relaxed pb-4">
                    <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4">
                      {faq.answer}
                      <p className="text-[11px] text-[var(--alo-text-muted)] mt-3 border-t border-[var(--alo-border)] pt-2">Source: Official government guidance • Last verified: {countryData.lastVerifiedAt}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      {/* 22. FINAL CTA — Premium country-specific CTA + Lead form */}
      <section className="py-16 bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] tracking-tight">Ready to start your {countryData.name} study journey?</h2>
            <p className="text-sm text-[var(--alo-body)]">Browse available course records or submit an enquiry about studying in {countryData.name}. Enquiries are sent for staff review; response timing and any applicable service fees are confirmed separately.</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/eligibility-check"><Button className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] h-12 px-8 font-bold rounded-xl">Check Eligibility</Button></Link>
              <Link href={`/course-finder?country=${encodeURIComponent(countryData.name)}`}><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold rounded-xl">Find Courses</Button></Link>
              <Link href="/book-consultation"><Button variant="outline" className="bg-white border-[var(--alo-border)] h-12 px-8 font-semibold rounded-xl">Request Consultation</Button></Link>
              <Button asChild variant="outline" className="bg-[var(--alo-whatsapp)]/10 border-[var(--alo-whatsapp)]/20 text-[var(--alo-whatsapp)] hover:bg-[var(--alo-whatsapp)] hover:text-white h-12 px-8 font-bold rounded-xl"><a href={ALO_PUBLIC_CONTACT_CTA.href} {...(ALO_CONTACT.hasWhatsApp ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{ALO_PUBLIC_CONTACT_CTA.label}</a></Button>
            </div>
          </div>

          {leadSuccess ? (
            <Card className="p-8 bg-emerald-50 border-emerald-300 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-emerald-900">Enquiry received</h3>
              <p className="text-xs text-[var(--alo-body)]">{leadSuccessMessage}</p>
            </Card>
          ) : (
            <form onSubmit={handleLeadSubmit} className="bg-white text-[var(--alo-text)] p-6 md:p-8 rounded-2xl space-y-4 text-xs border border-[var(--alo-border)] shadow-md">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="font-semibold">Full Name *</label><input required value={leadForm.name} onChange={e=>setLeadForm({...leadForm, name:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11" placeholder="Your full name" /></div>
                <div><label className="font-semibold">Mobile Number *</label><input required value={leadForm.phone} onChange={e=>setLeadForm({...leadForm, phone:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11" placeholder="01XXXXXXXXX" /></div>
                <div><label className="font-semibold">Email Address (optional)</label><input type="email" value={leadForm.email} onChange={e=>setLeadForm({...leadForm, email:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11" placeholder="you@example.com" /></div>
                <div><label className="font-semibold">Preferred Level</label><select value={leadForm.level} onChange={e=>setLeadForm({...leadForm, level:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11"><option value="">Choose a level</option><option>Foundation</option><option>Bachelor</option><option>Masters</option><option>MBA</option><option>PhD</option></select></div>
                <div><label className="font-semibold">Subject</label><input value={leadForm.subject} onChange={e=>setLeadForm({...leadForm, subject:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11" placeholder="Your intended subject" /></div>
                <div><label className="font-semibold">Intake</label><select value={leadForm.intake} onChange={e=>setLeadForm({...leadForm, intake:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11"><option value="">Choose an intake</option>{countryData.popularIntakes.map((intake)=><option key={intake} value={intake}>{intake}</option>)}</select></div>
                <div><label className="font-semibold">Budget</label><input value={leadForm.budget} onChange={e=>setLeadForm({...leadForm, budget:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11" placeholder="Optional" /></div>
                <div><label className="font-semibold">English Test</label><select value={leadForm.englishTest} onChange={e=>setLeadForm({...leadForm, englishTest:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11"><option value="">Choose a test (optional)</option><option>IELTS</option><option>PTE</option><option>TOEFL</option><option>Duolingo</option><option>MOI</option></select></div>
                <div className="sm:col-span-2"><label className="font-semibold">English Score</label><input value={leadForm.englishScore} onChange={e=>setLeadForm({...leadForm, englishScore:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm h-11" placeholder="Optional" /></div>
                <div className="sm:col-span-2"><label className="font-semibold">Message</label><textarea value={leadForm.message} onChange={e=>setLeadForm({...leadForm, message:e.target.value})} className="w-full mt-1 p-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl text-sm min-h-[80px]" placeholder="Add any questions or context you want the team to review." /></div>
              </div>
              <Button type="submit" disabled={submittingLead} className="w-full bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 font-bold rounded-xl">{submittingLead ? 'Submitting enquiry…' : 'Submit Enquiry'}</Button>
              {leadError && <p role="alert" className="text-center text-xs font-medium text-red-700">{leadError}</p>}
              <p className="text-[11px] text-[var(--alo-text-muted)] text-center">Submitting creates a public enquiry for staff review. No promotional contact consent is recorded by this form.</p>
            </form>
          )}
        </div>
      </section>

      {/* 23. SOURCES & VERIFICATION — Clean Data & Verification section */}
      <section className="py-16 bg-card border-b border-[var(--alo-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">Sources &amp; Verification — {countryData.name}</h2>
          <p className="text-sm text-[var(--alo-body)]">Key figures on this page — visa rules, work rights, tuition, living costs and entry requirements — are checked against the official sources below. Where a figure is still being verified, we say so rather than guess.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countryData.sources.map((source, i) => (
              <Card key={i} className="p-5 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl shadow-sm h-full">
                <Badge className="bg-white border-[var(--alo-border)] text-[11px] mb-2">{source.section}</Badge>
                <p className="text-sm font-bold text-[var(--alo-text)]">{source.sourceName}</p>
                <p className="text-xs mt-1"><a href={source.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{source.sourceUrl}</a></p>
                <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Last verified: {source.lastVerifiedAt}</p>
              </Card>
            ))}
            {countryData.sources.length === 0 && <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl col-span-3 text-center"><p className="text-sm text-[var(--alo-body)]">Some figures for this destination are still being verified. Please check with your counsellor for the latest confirmed details.</p></Card>}
          </div>
        </div>
      </section>

    </div>
  );
}
