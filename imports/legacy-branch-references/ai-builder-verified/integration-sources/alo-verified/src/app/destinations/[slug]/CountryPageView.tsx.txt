'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Coins,
  Compass,
  DollarSign,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  IdCard,
  Languages,
  Mail,
  MapPin,
  Phone,
  Plane,
  Quote,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Verified,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

/* ============================================================================
 * Types — mirror the server component's projections.
 * ==========================================================================*/

export interface CountryData {
  id: string;
  name: string;
  slug: string;
  flagEmoji: string | null;
  description: string | null;
  whyStudy: string | null;
  costOfLiving: string | null;
  visaInfo: string | null;
  workRights: string | null;
  postStudyWork: string | null;
  popular: boolean;
  universityCount: number;
  avgTuition: string | null;
  language: string | null;
  currency: string | null;
  bannerUrl: string | null;
  status: string;
  updatedAt: string; // ISO string
}

export interface CountryUniversity {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string | null;
  website: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  ranking: number | null;
  type: string | null;
  description: string | null;
  fees: string | null;
  scholarshipAvailable: boolean;
}

export interface CountryCourse {
  id: string;
  name: string;
  slug: string | null;
  level: string | null;
  field: string | null;
  duration: string | null;
  tuitionFee: number | null;
  currency: string;
  entryRequirements: string | null;
  englishRequirement: string | null;
  scholarshipAvailable: boolean;
  description: string | null;
  university: {
    id: string;
    name: string;
    slug: string;
    country: string;
    city: string | null;
  };
}

export interface CountryScholarship {
  id: string;
  name: string;
  description: string | null;
  amount: string | null;
  eligibility: string | null;
  deadline: Date | null;
  type: string | null;
  country: string | null;
  university: {
    id: string;
    name: string;
    slug: string;
    country: string;
    city: string | null;
  } | null;
}

export interface CountryFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export interface CountryPageData {
  country: CountryData;
  universities: CountryUniversity[];
  courses: CountryCourse[];
  scholarships: CountryScholarship[];
  faqs: CountryFaq[];
  counts: {
    universities: number;
    courses: number;
    scholarships: number;
  };
  popularCities: string[];
  studyLevels: string[];
}

/* ============================================================================
 * Brand tokens
 * ==========================================================================*/

const ALO_BLUE = '#0057B8';
const ALO_ORANGE = '#E8501A';
const NAVY = '#0F172A';

const MISSING_MSG =
  'Information not currently verified. Please check with an ALO Education counselor.';

/* ============================================================================
 * Main client component
 * ==========================================================================*/

export default function CountryPageView({ data }: { data: CountryPageData }) {
  const { country } = data;
  const lastVerified = new Date(country.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A]">
      <CountryHeader slug={country.slug} flag={country.flagEmoji} name={country.name} />
      <HeroSection country={country} />
      <QuickFactsSection data={data} lastVerified={lastVerified} />
      <WhyStudySection country={country} />
      <EducationPathwaySection country={country} />
      <PopularCoursesSection courses={data.courses} country={country} />
      <PopularUniversitiesSection universities={data.universities} country={country} />
      <TuitionBudgetSection country={country} courses={data.courses} />
      <EntryRequirementsSection country={country} courses={data.courses} />
      <EnglishTestSection country={country} courses={data.courses} />
      <RequiredDocumentsSection country={country} />
      <VisaProcessSection country={country} />
      <WorkRightsSection country={country} />
      <ScholarshipsSection scholarships={data.scholarships} country={country} />
      <AloSupportSection country={country} />
      <FaqSection faqs={data.faqs} country={country} />
      <FinalCtaSection country={country} />
      <SourcesSection country={country} lastVerified={lastVerified} />
      <CountryFooter country={country} />
    </div>
  );
}

/* ============================================================================
 * Header
 * ==========================================================================*/

function CountryHeader({ slug, flag, name }: { slug: string; flag: string | null; name: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/destinations" className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg text-sm font-extrabold text-white"
            style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
          >
            ALO
          </span>
          <span className="hidden text-base font-extrabold tracking-tight text-[#0F172A] sm:inline">
            ALO Education
          </span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/destinations" className="hover:text-[#0057B8]">
            All Destinations
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-[#0F172A]">
            {flag} {name}
          </span>
        </div>
      </div>
    </header>
  );
}

/* ============================================================================
 * 1. Hero
 * ==========================================================================*/

function HeroSection({ country }: { country: CountryData }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      {/* Soft brand-colored decorative blobs (NO dark overlay) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #E8501A 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #0057B8 0%, transparent 70%)' }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20 lg:px-8">
        {/* Left: copy */}
        <div className="flex flex-col items-start justify-center">
          <Badge
            variant="outline"
            className="mb-4 border-[#E8501A]/30 bg-[#FFF7ED] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#E8501A]"
          >
            {country.flagEmoji || '🌍'} Study in {country.name}
          </Badge>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0F172A] sm:text-4xl md:text-5xl">
            Study in {country.name}{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #0057B8, #E8501A)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              from Bangladesh
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            {country.description || MISSING_MSG}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-12 px-6 text-sm font-semibold text-white shadow-sm"
              style={{ background: ALO_BLUE }}
            >
              <Link href="/student/course-finder">
                <Compass className="h-4 w-4" />
                Find Courses
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 border-[#0057B8] px-6 text-sm font-semibold text-[#0057B8] hover:bg-[#EFF6FF] hover:text-[#0057B8]"
            >
              <Link href="/student/eligibility">
                <UserCheck className="h-4 w-4" />
                Check Eligibility
              </Link>
            </Button>
            <Button
              asChild
              className="h-12 px-6 text-sm font-semibold text-white shadow-sm"
              style={{ background: ALO_ORANGE }}
            >
              <Link href="#consultation-form">
                <Calendar className="h-4 w-4" />
                Book Free Consultation
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Last verified on {new Date(country.updatedAt).toLocaleDateString()}.
            Visa &amp; work rules can change.
          </p>
        </div>

        {/* Right: image / flag fallback */}
        <div className="relative">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg"
            style={{
              background: country.bannerUrl
                ? '#0F172A'
                : 'linear-gradient(135deg, #0057B8 0%, #E8501A 100%)',
            }}
          >
            {country.bannerUrl ? (
              <img
                src={country.bannerUrl}
                alt={`${country.name} study destination`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white">
                <span className="text-8xl drop-shadow-lg" style={{ filter: 'saturate(1.1)' }}>
                  {country.flagEmoji || '🌍'}
                </span>
                <span className="mt-4 text-xl font-extrabold tracking-tight">
                  {country.name}
                </span>
                <span className="mt-1 text-xs uppercase tracking-widest opacity-80">
                  Study Destination
                </span>
              </div>
            )}
            {country.popular && (
              <Badge
                variant="outline"
                className="absolute right-4 top-4 border-transparent bg-white px-3 py-1 text-xs font-bold text-[#E8501A] shadow"
              >
                <Star className="h-3 w-3" /> Popular Destination
              </Badge>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 2. Quick Facts
 * ==========================================================================*/

function QuickFactsSection({
  data,
  lastVerified,
}: {
  data: CountryPageData;
  lastVerified: string;
}) {
  const { country, counts, popularCities, studyLevels } = data;

  const facts: Array<{
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    accent?: 'blue' | 'orange';
  }> = [
    {
      label: 'Currency',
      value: country.currency || '—',
      icon: Coins,
      accent: 'blue',
    },
    {
      label: 'Language',
      value: country.language || '—',
      icon: Languages,
      accent: 'orange',
    },
    {
      label: 'Popular Cities',
      value: popularCities.length > 0 ? popularCities.join(', ') : MISSING_MSG,
      icon: MapPin,
      accent: 'blue',
    },
    {
      label: 'Study Levels',
      value: studyLevels.length > 0 ? studyLevels.join(', ') : 'Foundation, Bachelor, Masters (typical)',
      icon: GraduationCap,
      accent: 'orange',
    },
    {
      label: 'Visa Type',
      value: country.visaInfo || '—',
      icon: Shield,
      accent: 'blue',
    },
    {
      label: 'Universities',
      value: `${counts.universities}+ listed`,
      icon: Building2,
      accent: 'orange',
    },
    {
      label: 'Courses',
      value: counts.courses > 0 ? `${counts.courses} listed` : 'Check with counselor',
      icon: FileText,
      accent: 'blue',
    },
    {
      label: 'Scholarships',
      value: counts.scholarships > 0 ? `${counts.scholarships} listed` : 'Check with counselor',
      icon: Target,
      accent: 'orange',
    },
    {
      label: 'Last Verified',
      value: lastVerified,
      icon: Verified,
      accent: 'blue',
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="At a glance"
          title={`Quick Facts about studying in ${country.name}`}
          subtitle="Key information pulled directly from our verified country database."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((f) => (
            <Card key={f.label} className="h-full gap-0 border-slate-200 py-4">
              <CardContent className="flex items-start gap-4 px-5">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white"
                  style={{ background: f.accent === 'blue' ? ALO_BLUE : ALO_ORANGE }}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {f.label}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-[#0F172A]">
                    {f.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * Section header helper
 * ==========================================================================*/

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-bold uppercase tracking-widest text-[#E8501A]">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
    </div>
  );
}

/* ============================================================================
 * 3. Why Study
 * ==========================================================================*/

function WhyStudySection({ country }: { country: CountryData }) {
  // 6 country-agnostic feature cards (these describe ALO's value-adds that
  // apply to every destination, NOT fake statistics). The country-specific
  // reasons come from the `whyStudy` DB field rendered above the cards.
  const features = [
    {
      icon: GraduationCap,
      title: 'Globally Recognized Degrees',
      desc: 'Degrees from accredited institutions in ' + country.name + ' are recognized worldwide, opening global career opportunities.',
    },
    {
      icon: Users,
      title: 'Multicultural Environment',
      desc: 'Study alongside peers from around the world — ' + country.name + ' is home to a large international student community.',
    },
    {
      icon: Briefcase,
      title: 'Work While Studying',
      desc: country.workRights || MISSING_MSG,
    },
    {
      icon: TrendingUp,
      title: 'Post-Study Work Opportunities',
      desc: country.postStudyWork || MISSING_MSG,
    },
    {
      icon: Coins,
      title: 'Transparent Tuition',
      desc: country.avgTuition ? `Average tuition range: ${country.avgTuition}.` : MISSING_MSG,
    },
    {
      icon: Globe,
      title: 'English-Taught Programs',
      desc: country.language
        ? `Primary language of instruction: ${country.language}.`
        : MISSING_MSG,
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={`Why study in ${country.name}`}
          title={`Top reasons to choose ${country.name}`}
          subtitle="Country-specific guidance compiled from our verified database."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Big country-specific reason card */}
          <Card
            className="h-full border-0 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0057B8 0%, #E8501A 100%)' }}
          >
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-white/80">
                Country-specific reasons
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/95">
              {country.whyStudy || MISSING_MSG}
            </CardContent>
          </Card>

          {/* Feature cards */}
          {features.map((f) => (
            <Card key={f.title} className="h-full gap-2 border-slate-200 py-5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
                    style={{ background: ALO_BLUE }}
                  >
                    <f.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    {f.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Local helper icon for the country footer (replaces the {country} placeholder)
// — kept here so the footer file can stay a tiny single-function declaration.

/* ============================================================================
 * 4. Education Pathway
 * ==========================================================================*/

function EducationPathwaySection({ country }: { country: CountryData }) {
  const pathways = [
    {
      from: 'SSC / O-Level',
      step: 'IELTS Prep',
      to: 'Foundation / Pathways',
      final: 'Bachelor',
      color: ALO_BLUE,
      note: '1-year foundation route for students who finished SSC.',
    },
    {
      from: 'HSC / A-Level',
      step: 'IELTS Prep',
      to: 'Bachelor',
      final: 'Work / Masters',
      color: ALO_ORANGE,
      note: 'Direct entry to a Bachelor degree (3-4 years).',
    },
    {
      from: 'Bachelor',
      step: 'IELTS / GRE Prep',
      to: 'Masters',
      final: 'Post-Study Work',
      color: ALO_BLUE,
      note: '1-2 year Masters program (course durations vary).',
    },
    {
      from: 'Masters',
      step: 'Research Proposal',
      to: 'PhD',
      final: 'Academic Career',
      color: ALO_ORANGE,
      note: '3-4 year research program (funded positions vary).',
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Education Pathway"
          title={`Your study pathway in ${country.name}`}
          subtitle="Typical routes from Bangladeshi qualifications to a degree. Exact requirements vary by university — verify on the course page."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {pathways.map((p) => (
            <Card key={p.from} className="h-full border-slate-200 py-5">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white"
                    style={{ background: p.color }}
                  >
                    →
                  </span>
                  From {p.from}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {[p.from, p.step, p.to, p.final].map((label, idx) => (
                    <span
                      key={label}
                      className="rounded-md px-3 py-2 font-semibold"
                      style={{
                        background: idx === 0 ? '#F1F5F9' : idx === 3 ? p.color : '#FFF7ED',
                        color: idx === 3 ? '#FFFFFF' : idx === 1 ? ALO_ORANGE : idx === 2 ? ALO_BLUE : '#0F172A',
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-600">{p.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 5. Popular Courses
 * ==========================================================================*/

function PopularCoursesSection({
  courses,
  country,
}: {
  courses: CountryCourse[];
  country: CountryData;
}) {
  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Popular Courses"
          title={`Popular courses in ${country.name}`}
          subtitle="Real courses loaded from our course database, filtered by destination."
        />

        {courses.length === 0 ? (
          <EmptyState
            title={`No courses for ${country.name} are currently verified`}
            description="Please check with an ALO Education counselor — we add new courses every week."
            cta="Talk to a counselor"
            href="#consultation-form"
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.id} className="flex h-full flex-col gap-3 border-slate-200 py-5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {c.level && (
                      <Badge
                        variant="outline"
                        className="border-[#0057B8]/30 bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0057B8]"
                      >
                        {c.level}
                      </Badge>
                    )}
                    {c.scholarshipAvailable && (
                      <Badge
                        variant="outline"
                        className="border-[#E8501A]/30 bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#E8501A]"
                      >
                        <Target className="h-3 w-3" /> Scholarship
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-base font-bold leading-snug text-[#0F172A]">
                    {c.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                  <div className="text-xs text-slate-500">
                    {c.university.name}
                    {c.university.city ? ` · ${c.university.city}` : ''}
                  </div>
                  {c.description && (
                    <p className="line-clamp-3 text-slate-600">{c.description}</p>
                  )}
                  <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Duration
                      </div>
                      <div className="font-semibold text-[#0F172A]">
                        {c.duration || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">
                        Tuition
                      </div>
                      <div className="font-semibold text-[#0F172A]">
                        {c.tuitionFee
                          ? `${c.currency} ${c.tuitionFee.toLocaleString()}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * 6. Popular Universities
 * ==========================================================================*/

function PopularUniversitiesSection({
  universities,
  country,
}: {
  universities: CountryUniversity[];
  country: CountryData;
}) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Popular Universities"
          title={`Popular universities in ${country.name}`}
          subtitle="Real institutions from our database. Rankings reflect the most recent value on file."
        />

        {universities.length === 0 ? (
          <EmptyState
            title={`No universities for ${country.name} are currently verified`}
            description="Please check with an ALO Education counselor for partner institutions."
            cta="Talk to a counselor"
            href="#consultation-form"
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => (
              <Card key={u.id} className="flex h-full flex-col gap-3 border-slate-200 py-5">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {u.logoUrl ? (
                      <img
                        src={u.logoUrl}
                        alt={`${u.name} logo`}
                        className="h-12 w-12 shrink-0 rounded-md border border-slate-200 object-cover"
                      />
                    ) : (
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-md text-white"
                        style={{ background: ALO_BLUE }}
                      >
                        <Building2 className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base font-bold leading-snug text-[#0F172A]">
                        {u.name}
                      </CardTitle>
                      <div className="mt-1 text-xs text-slate-500">
                        {u.city ? `${u.city}, ` : ''}
                        {u.country}
                        {u.type ? ` · ${u.type}` : ''}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                  {u.description && (
                    <p className="line-clamp-2 text-slate-600">{u.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                      <Star className="h-3.5 w-3.5 text-[#E8501A]" />
                      {u.ranking ? `Rank #${u.ranking}` : 'Unranked'}
                    </span>
                    {u.scholarshipAvailable && (
                      <Badge
                        variant="outline"
                        className="border-[#E8501A]/30 bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#E8501A]"
                      >
                        <Target className="h-3 w-3" /> Scholarships
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * 7. Tuition & Budget
 * ==========================================================================*/

function TuitionBudgetSection({
  country,
  courses,
}: {
  country: CountryData;
  courses: CountryCourse[];
}) {
  // Pick courses with tuitionFee + currency for the estimator dropdown.
  const budgetCourses = useMemo(
    () => courses.filter((c) => c.tuitionFee && c.tuitionFee > 0),
    [courses]
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    budgetCourses[0]?.id || ''
  );
  const [durationYears, setDurationYears] = useState<number>(1);

  const selectedCourse = useMemo(
    () => budgetCourses.find((c) => c.id === selectedCourseId) || null,
    [budgetCourses, selectedCourseId]
  );

  // Try to extract a monthly cost-of-living figure from the costOfLiving
  // string (e.g. "£1,000-£1,500/month" → 1250 avg). Fall back to null.
  const monthlyLivingCost = useMemo(() => {
    if (!country.costOfLiving) return null;
    const matches = country.costOfLiving.match(/[\d,]+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return null;
    const nums = matches.map((m) => parseFloat(m.replace(/,/g, ''))).filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg;
  }, [country.costOfLiving]);

  // Extract a tuition range from avgTuition (e.g. "£10,000-£38,000/year" → [10000, 38000])
  const avgTuitionRange = useMemo(() => {
    if (!country.avgTuition) return null;
    const matches = country.avgTuition.match(/[\d,]+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return null;
    const nums = matches.map((m) => parseFloat(m.replace(/,/g, ''))).filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    return [Math.min(...nums), Math.max(...nums)];
  }, [country.avgTuition]);

  // Calculate estimated budget from selected course (or fall back to avgTuition
  // range midpoint if no course selected).
  const estimate = useMemo(() => {
    let tuition = 0;
    let currency = country.currency || 'USD';
    if (selectedCourse && selectedCourse.tuitionFee) {
      tuition = selectedCourse.tuitionFee * durationYears;
      currency = selectedCourse.currency || currency;
    } else if (avgTuitionRange) {
      const mid = (avgTuitionRange[0] + avgTuitionRange[1]) / 2;
      tuition = mid * durationYears;
    }
    const living = monthlyLivingCost ? monthlyLivingCost * 12 * durationYears : 0;
    const total = tuition + living;
    return { tuition, living, total, currency };
  }, [selectedCourse, durationYears, avgTuitionRange, monthlyLivingCost, country.currency]);

  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Tuition & Budget"
          title={`Tuition and living cost for ${country.name}`}
          subtitle="Honest figures from our verified database. Use the estimator below for a quick planning number."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: avg figures */}
          <Card className="h-full border-slate-200 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
                <Coins className="h-5 w-5" style={{ color: ALO_BLUE }} />
                Average Tuition
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {country.avgTuition || MISSING_MSG}
            </CardContent>
          </Card>

          <Card className="h-full border-slate-200 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
                <Wallet className="h-5 w-5" style={{ color: ALO_ORANGE }} />
                Cost of Living
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {country.costOfLiving || MISSING_MSG}
            </CardContent>
          </Card>

          {/* Right: budget estimator (interactive) */}
          <Card
            className="h-full border-0 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0057B8 0%, #E8501A 100%)' }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
                <Calculator className="h-5 w-5" />
                Budget Estimator
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <Label htmlFor="course-select" className="text-xs font-bold uppercase tracking-wide text-white/80">
                  Course
                </Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger
                    id="course-select"
                    className="h-12 w-full border-white/30 bg-white/10 text-white placeholder:text-white/70"
                  >
                    <SelectValue placeholder="Pick a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetCourses.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No course with tuition data
                      </SelectItem>
                    ) : (
                      budgetCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.currency} {c.tuitionFee?.toLocaleString()})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wide text-white/80">
                  Duration (years)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={6}
                  value={durationYears}
                  onChange={(e) => setDurationYears(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                  className="h-12 border-white/30 bg-white/10 text-white placeholder:text-white/70"
                />
              </div>

              <div className="mt-2 rounded-lg bg-white/15 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Tuition</span>
                  <span className="font-bold">
                    {estimate.currency} {Math.round(estimate.tuition).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-white/80">Living</span>
                  <span className="font-bold">
                    {estimate.living > 0
                      ? `${estimate.currency} ${Math.round(estimate.living).toLocaleString()}`
                      : 'Verify with counselor'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/30 pt-2 text-base">
                  <span className="font-bold text-white">Estimated total</span>
                  <span className="font-extrabold">
                    {estimate.total > 0
                      ? `${estimate.currency} ${Math.round(estimate.total).toLocaleString()}`
                      : 'Verify with counselor'}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-white/70">
                Estimate only. Real tuition depends on the university, course, and intake.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 8. Entry Requirements (Tabs)
 * ==========================================================================*/

function EntryRequirementsSection({
  country,
  courses,
}: {
  country: CountryData;
  courses: CountryCourse[];
}) {
  const byLevel = useMemo(() => {
    const map: Record<string, CountryCourse[]> = {
      foundation: [],
      undergraduate: [],
      postgraduate: [],
      phd: [],
    };
    for (const c of courses) {
      const level = (c.level || '').toLowerCase();
      if (level.includes('foundation')) map.foundation.push(c);
      else if (level.includes('undergrad') || level.includes('bachelor')) map.undergraduate.push(c);
      else if (level.includes('postgrad') || level.includes('master')) map.postgraduate.push(c);
      else if (level.includes('phd') || level.includes('doctor')) map.phd.push(c);
    }
    return map;
  }, [courses]);

  const tabs: Array<{
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    courses: CountryCourse[];
  }> = [
    {
      value: 'foundation',
      label: 'Foundation',
      icon: GraduationCap,
      description: 'Pathway programs for students who finished SSC / O-Level. Typically 1 year.',
      courses: byLevel.foundation,
    },
    {
      value: 'bachelor',
      label: 'Bachelor',
      icon: FileText,
      description: 'Direct undergraduate entry for HSC / A-Level graduates. Typically 3-4 years.',
      courses: byLevel.undergraduate,
    },
    {
      value: 'masters',
      label: 'Masters',
      icon: TrendingUp,
      description: 'Postgraduate degrees. Typically 1-2 years; some include research components.',
      courses: byLevel.postgraduate,
    },
    {
      value: 'phd',
      label: 'PhD',
      icon: Shield,
      description: 'Doctoral research programs. Typically 3-4 years; funded positions vary.',
      courses: byLevel.phd,
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Entry Requirements"
          title={`Entry requirements for ${country.name}`}
          subtitle="Browse by study level. Real entry requirements are shown per course when available — otherwise talk to a counselor."
        />
        <Tabs defaultValue="bachelor" className="mt-8">
          <TabsList className="h-12 bg-slate-200/80">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="h-9 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0057B8]"
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="h-full border-slate-200 py-5 sm:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-[#0F172A]">
                      About {t.label} in {country.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    {t.description}{' '}
                    <span className="text-slate-500">
                      Visa type: {country.visaInfo || '—'}.
                    </span>
                  </CardContent>
                </Card>

                {t.courses.length === 0 ? (
                  <Card className="h-full border-dashed border-slate-300 bg-white py-5 sm:col-span-2 lg:col-span-3">
                    <CardContent className="text-sm text-slate-600">
                      No {t.label.toLowerCase()} courses for {country.name} are
                      currently verified in our database.{' '}
                      <Link href="#consultation-form" className="font-semibold text-[#0057B8] hover:underline">
                        Talk to a counselor
                      </Link>{' '}
                      for the latest course list.
                    </CardContent>
                  </Card>
                ) : (
                  t.courses.map((c) => (
                    <Card key={c.id} className="h-full gap-2 border-slate-200 py-5">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-[#0F172A]">
                          {c.name}
                        </CardTitle>
                        <div className="text-xs text-slate-500">{c.university.name}</div>
                      </CardHeader>
                      <CardContent className="text-xs text-slate-600">
                        <div className="mb-2">
                          <span className="font-semibold text-[#0F172A]">Entry requirements:</span>{' '}
                          {c.entryRequirements || MISSING_MSG}
                        </div>
                        <div>
                          <span className="font-semibold text-[#0F172A]">English requirement:</span>{' '}
                          {c.englishRequirement || 'Verify on course page'}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

/* ============================================================================
 * 9. English Test Requirements
 * ==========================================================================*/

function EnglishTestSection({
  country,
  courses,
}: {
  country: CountryData;
  courses: CountryCourse[];
}) {
  // Aggregate any englishRequirement strings from the courses so we surface
  // real data instead of fabricating scores.
  const englishSamples = useMemo(
    () =>
      courses
        .map((c) => c.englishRequirement)
        .filter((s): s is string => Boolean(s && s.trim().length > 0))
        .slice(0, 3),
    [courses]
  );

  const tests = [
    {
      name: 'IELTS',
      desc:
        englishSamples.length > 0
          ? `Sample from our courses: ${englishSamples[0]}`
          : 'Most universities require IELTS 6.0-7.0 overall. Exact requirement varies — verify on the course page.',
      icon: Languages,
      color: ALO_BLUE,
    },
    {
      name: 'PTE Academic',
      desc:
        'Pearson Test of English is widely accepted. Verify the minimum score required by your university.',
      icon: FileText,
      color: ALO_ORANGE,
    },
    {
      name: 'TOEFL iBT',
      desc:
        'Test of English as a Foreign Language. Check whether your university accepts TOEFL and the minimum score.',
      icon: Globe,
      color: ALO_BLUE,
    },
    {
      name: 'Duolingo English Test',
      desc:
        'Some universities in ' + country.name + ' accept Duolingo. Confirm with the university admissions office.',
      icon: Sparkles,
      color: ALO_ORANGE,
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="English Test Requirements"
          title={`English tests accepted in ${country.name}`}
          subtitle={`Most universities in ${country.name} accept IELTS, PTE, TOEFL, and Duolingo. Always confirm the accepted tests and minimum scores on the specific course page.`}
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tests.map((t) => (
            <Card key={t.name} className="h-full gap-2 border-slate-200 py-5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
                    style={{ background: t.color }}
                  >
                    <t.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    {t.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-600">{t.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 10. Required Documents Checklist
 * ==========================================================================*/

function RequiredDocumentsSection({ country }: { country: CountryData }) {
  const groups: Array<{
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    items: string[];
  }> = [
    {
      title: 'Academic',
      icon: GraduationCap,
      color: ALO_BLUE,
      items: [
        'All academic transcripts (SSC, HSC, Bachelor, etc.)',
        'Original certificates / mark sheets',
        'Certified English translations if originals are in Bengali',
      ],
    },
    {
      title: 'Identity',
      icon: IdCard,
      color: ALO_ORANGE,
      items: [
        'Valid passport (at least 6 months beyond course end)',
        'Recent passport-size photographs (per university specs)',
        'National ID card (optional but recommended)',
      ],
    },
    {
      title: 'English Proficiency',
      icon: Languages,
      color: ALO_BLUE,
      items: [
        'IELTS / PTE / TOEFL / Duolingo test report',
        'Test must be valid on the application date',
        'Some universities accept MOI letters — verify per course',
      ],
    },
    {
      title: 'Application',
      icon: FileText,
      color: ALO_ORANGE,
      items: [
        'Statement of Purpose (SOP) — tailored to the course',
        'CV / Resume (especially for postgraduate)',
        '2 academic or professional references (letterhead + signed)',
        'Portfolio (for design / arts programs)',
      ],
    },
    {
      title: 'Financial',
      icon: Wallet,
      color: ALO_BLUE,
      items: [
        'Bank statement covering tuition + living (28-day rule for some countries)',
        'Sponsorship letter (if sponsored)',
        'Affidavit of support (notarised, if applicable)',
        'Scholarship award letter (if applicable)',
      ],
    },
    {
      title: 'Visa',
      icon: Shield,
      color: ALO_ORANGE,
      items: [
        `Visa: ${country.visaInfo || '—'}`,
        'Tuberculosis (TB) test report (required for some countries)',
        'Police clearance certificate (if requested)',
        'Biometric appointment confirmation',
      ],
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Required Documents"
          title={`Documents you will need for ${country.name}`}
          subtitle="A general checklist for Bangladeshi applicants. Specific requirements vary by university and course — confirm with a counselor."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.title} className="h-full gap-2 border-slate-200 py-5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
                    style={{ background: g.color }}
                  >
                    <g.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    {g.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: g.color }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 11. Visa Process (Country-Specific Timeline)
 * ==========================================================================*/

function VisaProcessSection({ country }: { country: CountryData }) {
  // These steps describe a generic Bangladeshi student visa process. The
  // country-specific info (visa type) comes from country.visaInfo. We never
  // copy one country's rules into another.
  const steps: Array<{ title: string; desc: string }> = [
    {
      title: 'Receive admission offer',
      desc:
        'Your university in ' +
        country.name +
        ' issues an unconditional or conditional offer / CAS / CoE / I-20 (depending on country).',
    },
    {
      title: 'Pay the required deposit',
      desc:
        'Pay the tuition deposit requested by your university to confirm your seat. Keep the payment receipt.',
    },
    {
      title: 'Gather financial documents',
      desc:
        'Prepare bank statements showing sufficient funds for tuition and living expenses for the required number of days (varies by country).',
    },
    {
      title: `Submit ${country.visaInfo || 'student visa'} application`,
      desc:
        'Complete the online application form on the official ' +
        country.name +
        ' government portal. Pay the visa application fee and immigration health surcharge if applicable.',
    },
    {
      title: 'Attend biometrics appointment',
      desc:
        'Book and attend your biometrics appointment at the visa application centre in Bangladesh (Dhaka / Sylhet / Chittagong as available).',
    },
    {
      title: 'Receive visa decision',
      desc:
        'Visa processing time varies. If approved, your passport is returned with the visa vignette. If refused, request a written decision and review with your counselor.',
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Visa Process"
          title={`Student visa process for ${country.name}`}
          subtitle={`Country-specific to ${country.name}. Visa type: ${country.visaInfo || '—'}. Always verify on the official immigration website before applying.`}
        />
        <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <Card className="h-full gap-2 border-slate-200 py-5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white"
                      style={{ background: i % 2 === 0 ? ALO_BLUE : ALO_ORANGE }}
                    >
                      {i + 1}
                    </span>
                    <CardTitle className="text-base font-bold text-[#0F172A]">
                      {s.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-slate-600">{s.desc}</CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============================================================================
 * 12. Work Rights & Post-Study
 * ==========================================================================*/

function WorkRightsSection({ country }: { country: CountryData }) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Work Rights & Post-Study"
          title={`Working in ${country.name} as a student`}
          subtitle="Information pulled from our verified country database. Visa and work rules can change."
        />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="h-full border-slate-200 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
                <Briefcase className="h-5 w-5" style={{ color: ALO_BLUE }} />
                Work Rights During Study
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {country.workRights || MISSING_MSG}
            </CardContent>
          </Card>

          <Card className="h-full border-slate-200 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
                <TrendingUp className="h-5 w-5" style={{ color: ALO_ORANGE }} />
                Post-Study Work Options
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {country.postStudyWork || MISSING_MSG}
            </CardContent>
          </Card>
        </div>

        <div
          className="mt-6 flex items-start gap-3 rounded-lg border border-[#E8501A]/30 bg-[#FFF7ED] p-4 text-sm text-[#0F172A]"
        >
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#E8501A]" />
          <div>
            <span className="font-bold text-[#E8501A]">Disclaimer:</span>{' '}
            Visa and work rules can change at any time. The information above
            was last verified on{' '}
            {new Date(country.updatedAt).toLocaleDateString()}. Always confirm
            with the official immigration authority and an ALO Education
            counselor before applying.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 13. Scholarships
 * ==========================================================================*/

function ScholarshipsSection({
  scholarships,
  country,
}: {
  scholarships: CountryScholarship[];
  country: CountryData;
}) {
  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Scholarships"
          title={`Scholarships for ${country.name}`}
          subtitle="Real scholarships from our database. Eligibility, amount, and deadlines vary — always verify on the official scholarship website."
        />
        {scholarships.length === 0 ? (
          <EmptyState
            title={`No scholarships for ${country.name} are currently verified`}
            description="We continuously add new scholarship opportunities. Talk to a counselor for the latest list."
            cta="Talk to a counselor"
            href="#consultation-form"
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scholarships.map((s) => (
              <Card key={s.id} className="flex h-full flex-col gap-2 border-slate-200 py-5">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    {s.type && (
                      <Badge
                        variant="outline"
                        className="border-[#E8501A]/30 bg-[#FFF7ED] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#E8501A]"
                      >
                        {s.type}
                      </Badge>
                    )}
                    {s.deadline && (
                      <Badge
                        variant="outline"
                        className="border-[#0057B8]/30 bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0057B8]"
                      >
                        <Calendar className="h-3 w-3" />
                        {new Date(s.deadline).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-base font-bold leading-snug text-[#0F172A]">
                    {s.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 text-sm">
                  {s.amount && (
                    <div className="text-xs font-semibold text-[#0F172A]">
                      <DollarSign className="mr-1 inline h-3.5 w-3.5" style={{ color: ALO_ORANGE }} />
                      Amount: {s.amount}
                    </div>
                  )}
                  {s.description && (
                    <p className="line-clamp-3 text-xs text-slate-600">{s.description}</p>
                  )}
                  {s.eligibility && (
                    <p className="line-clamp-2 text-xs text-slate-500">
                      <span className="font-semibold">Eligibility:</span> {s.eligibility}
                    </p>
                  )}
                  {s.university && (
                    <div className="mt-auto border-t border-slate-100 pt-2 text-xs text-slate-500">
                      {s.university.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * 14. ALO Support
 * ==========================================================================*/

function AloSupportSection({ country }: { country: CountryData }) {
  const services: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
  }> = [
    {
      icon: Users,
      title: 'Free Counseling',
      desc: 'One-on-one session with an experienced counselor to evaluate your profile and goals for ' + country.name + '.',
    },
    {
      icon: Compass,
      title: 'Course Matching',
      desc: 'Personalized course and university recommendations based on your academic background, budget, and career goals.',
    },
    {
      icon: FileText,
      title: 'Application Support',
      desc: 'We help complete every form, draft your SOP, review references, and submit your applications to partner universities.',
    },
    {
      icon: Wallet,
      title: 'Financial Planning',
      desc: 'Scholarship search, education loan guidance, and bank statement planning to satisfy visa financial requirements.',
    },
    {
      icon: Plane,
      title: 'Visa Guidance',
      desc: 'End-to-end visa support: document checklist, application form filling, biometrics booking, and interview prep.',
    },
    {
      icon: ClipboardList,
      title: 'Pre-Departure & Post-Arrival',
      desc: 'Airport pickup, accommodation, bank account setup, and ongoing support after you arrive in ' + country.name + '.',
    },
  ];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="ALO Support"
          title={`How ALO Education helps you reach ${country.name}`}
          subtitle={`From your first counseling session to landing in ${country.name}, we walk every step with you.`}
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.title} className="h-full gap-2 border-slate-200 py-5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
                    style={{ background: ALO_BLUE }}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    {s.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-slate-600">{s.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * 15. FAQ
 * ==========================================================================*/

function FaqSection({
  faqs,
  country,
}: {
  faqs: CountryFaq[];
  country: CountryData;
}) {
  return (
    <section className="border-b border-slate-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title={`Frequently asked questions about ${country.name}`}
          subtitle={`Real FAQs from our knowledge base, filtered to those mentioning ${country.name} (with a general fallback).`}
        />

        {faqs.length === 0 ? (
          <EmptyState
            title={`No FAQs for ${country.name} are currently published`}
            description="Please check with an ALO Education counselor for the latest answers."
            cta="Talk to a counselor"
            href="#consultation-form"
          />
        ) : (
          <Accordion type="single" collapsible className="mt-8 w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.id} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-[#0F172A] hover:text-[#0057B8] hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
 * 16. Final CTA + Consultation Form
 * ==========================================================================*/

function FinalCtaSection({ country }: { country: CountryData }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim()) {
      toast.error('Please enter your name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          preferredCountry: country.name,
          source: 'website',
          sourceId: `destinations-${country.slug}`,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || 'Could not submit your request.');
      }
      toast.success(
        'Thank you! An ALO Education counselor will contact you within 24 hours.'
      );
      setForm({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please WhatsApp us.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="consultation-form"
      className="relative overflow-hidden border-b border-slate-200 py-12 sm:py-16"
      style={{ background: 'linear-gradient(135deg, #0057B8 0%, #E8501A 100%)' }}
    >
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left: CTA copy */}
        <div className="flex flex-col items-start justify-center text-white">
          <Badge
            variant="outline"
            className="mb-4 border-white/30 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
          >
            <Sparkles className="h-3.5 w-3.5" /> Free Consultation
          </Badge>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Ready to start your {country.name} study journey?
          </h2>
          <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            Book a free 30-minute counseling session with our expert
            counselors. We will assess your profile, recommend universities and
            courses, and walk you through the entire visa process for{' '}
            {country.name}.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/90">
            {[
              'Personalized course and university shortlist',
              'Scholarship eligibility check',
              'Document checklist + visa timeline',
              'No fee, no obligation',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: consultation form */}
        <Card className="border-0 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Book your free consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    First name *
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Your first name"
                    className="h-12"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Your last name"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phone / WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="h-12"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tell us about your goals
                </Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={`e.g. I want to study a Masters in Computer Science in ${country.name}, starting in the next intake.`}
                  className="min-h-24"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-2 h-12 w-full text-sm font-bold text-white"
                style={{ background: ALO_ORANGE }}
              >
                {submitting ? 'Submitting…' : `Book free consultation for ${country.name}`}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-[10px] text-slate-500">
                By submitting, you agree to be contacted by ALO Education about
                your study-abroad enquiry. We never share your data with third
                parties.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* ============================================================================
 * 17. Sources & Verification
 * ==========================================================================*/

function SourcesSection({
  country,
  lastVerified,
}: {
  country: CountryData;
  lastVerified: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Sources & Verification"
          title="How we keep this information accurate"
          subtitle="We compile data from official government sources, university websites, and our partner network. Visa and work rules can change."
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="h-full border-slate-200 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <Verified className="h-5 w-5" style={{ color: ALO_BLUE }} />
                Last verified
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              This country page was last verified on{' '}
              <span className="font-semibold text-[#0F172A]">{lastVerified}</span>.
              We periodically review and update our content.
            </CardContent>
          </Card>

          <Card className="h-full border-slate-200 py-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                <HelpCircle className="h-5 w-5" style={{ color: ALO_ORANGE }} />
                Missing something?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Where data is missing we tell you clearly. Talk to an ALO
              Education counselor for the latest information tailored to your
              specific profile and intake.
              <div className="mt-3">
                <Button
                  asChild
                  size="sm"
                  className="h-10 px-4 text-xs font-bold text-white"
                  style={{ background: ALO_BLUE }}
                >
                  <Link href="#consultation-form">
                    Talk to a counselor
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Disclaimer: ALO Education provides guidance based on publicly
          available information. We do not issue visas or guarantee visa
          approval. Always confirm current requirements with the official{' '}
          {country.name} immigration authority before applying.
        </p>
      </div>
    </section>
  );
}

/* ============================================================================
 * Footer
 * ==========================================================================*/

function CountryFooter({ country }: { country: CountryData }) {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="grid h-9 w-9 place-items-center rounded-lg text-sm font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
              >
                ALO
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                ALO Education
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Your trusted partner for global education. We help Bangladeshi
              students study in {country.name} and 6 other destinations.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Other Destinations</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/destinations" className="text-slate-600 hover:text-[#0057B8]">
                  Browse all destinations
                </Link>
              </li>
              <li>
                <Link href="/student/course-finder" className="text-slate-600 hover:text-[#0057B8]">
                  Find a course
                </Link>
              </li>
              <li>
                <Link href="/student/scholarships" className="text-slate-600 hover:text-[#0057B8]">
                  Browse scholarships
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0057B8]" />
                <a
                  href="https://wa.me/8801805020100"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#0057B8]"
                >
                  WhatsApp: 01805020100
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#E8501A]" />
                <a href="mailto:hello@aloeducation.com" className="hover:text-[#0057B8]">
                  hello@aloeducation.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} ALO Education. Visa and work
          rules can change — verify with a counselor before applying.
        </div>
      </div>
    </footer>
  );
}

/* ============================================================================
 * Empty state helper
 * ==========================================================================*/

function EmptyState({
  title,
  description,
  cta,
  href,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <Quote className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-4 text-base font-semibold text-[#0F172A]">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-5">
        <Button asChild size="sm" className="h-10 px-5 text-xs font-bold text-white" style={{ background: ALO_BLUE }}>
          <Link href={href}>
            {cta}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
