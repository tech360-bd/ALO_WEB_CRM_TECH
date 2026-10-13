'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  DollarSign,
  CalendarDays,
  Award,
  Languages,
  Search,
  Briefcase,
  Clock,
  Globe,
  FlaskConical,
  Home,
  UtensilsCrossed,
  Bus,
  Heart,
  FileCheck,
  FileQuestion,
  Handshake,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  AlertTriangle,
  MapPin,
  Building2,
  Bookmark,
  Star,
  Users,
  TrendingUp,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import type { CountryData } from './country-data';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Default hero images per country ─────────────────────────────────────────

const HERO_IMAGES: Record<string, string> = {
  uk: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
  canada: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1920&q=80',
  australia: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1920&q=80',
  usa: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1920&q=80',
  'new-zealand': 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=80',
  ireland: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80',
  germany: 'https://images.unsplash.com/photo-1557687790-902ede7ab58c?w=1920&q=80',
  malaysia: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&q=80',
};

const DEFAULT_COSTS = {
  tuition: 'Contact for details',
  accommodation: 'Contact for details',
  food: 'Contact for details',
  transport: 'Contact for details',
  insurance: 'Contact for details',
  visa: 'Contact for details',
  application: 'Varies',
  other: 'Varies',
};

// ─── API fetch helper ─────────────────────────────────────────────────────────

async function fetchCountryData(slug: string): Promise<CountryData | null> {
  try {
    const res = await fetch(`/api/countries/${slug}`);
    if (!res.ok) return null;
    const { country } = await res.json();
    // Map API response to CountryData interface
    const whyStudy = typeof country.whyStudy === 'string' ? JSON.parse(country.whyStudy || '[]') : (country.whyStudy || []);
    const cities = typeof country.cities === 'string' ? JSON.parse(country.cities || '[]') : (country.cities || []);
    const faqs = typeof country.faqs === 'string' ? JSON.parse(country.faqs || '[]') : (country.faqs || []);
    return {
      slug: country.slug,
      name: country.name,
      shortName: country.shortName,
      flag: country.flag,
      capital: country.capital,
      currency: country.currency,
      heroImage: HERO_IMAGES[country.slug] || HERO_IMAGES.uk,
      intro: country.intro,
      stats: country.stats || { universities: 0, courses: 0, scholarships: 0, avgTuition: '', popularIntakes: [], englishReq: '' },
      whyStudy,
      universities: (country.universities || []).map((u: Record<string, unknown>) => ({
        slug: u.slug,
        name: u.name,
        city: u.city,
        ranking: u.ranking,
        tuitionRange: u.tuitionRange,
        logo: u.logo,
        campusImage: u.campusImage,
        scholarshipAvailable: u.scholarshipAvailable,
        matchScore: 80,
      })),
      courses: (country.courses || []).map((c: Record<string, unknown>) => ({
        slug: c.slug,
        name: c.name,
        universitySlug: c.universitySlug,
        universityName: c.universityName,
        city: c.city,
        level: c.level,
        subject: c.subject,
        duration: c.duration,
        tuition: c.tuition,
        tuitionCurrency: c.tuitionCurrency,
        englishRequirement: c.englishRequirement,
        scholarship: c.scholarship,
        scholarshipAvailable: c.scholarshipAvailable,
        matchScore: 80,
      })),
      scholarships: (country.scholarships || []).map((s: Record<string, unknown>) => ({
        slug: s.slug,
        name: s.name,
        universityName: s.universityName,
        amount: s.amount,
        currency: s.currency,
        eligibility: s.eligibility,
        deadline: s.deadline,
        fundingType: s.fundingType,
      })),
      cities,
      faqs,
      costs: DEFAULT_COSTS,
    };
  } catch {
    return null;
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface CountryPageProps {
  countrySlug?: string;
  onBack?: () => void;
  onNavigate?: (page: string, slug?: string) => void;
  onLeadOpen?: () => void;
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ReactNode> = {
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Clock: <Clock className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  FlaskConical: <FlaskConical className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  Home: <Home className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  UtensilsCrossed: <UtensilsCrossed className="h-6 w-6" />,
  Bus: <Bus className="h-6 w-6" />,
  Search: <Search className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
};

// ─── Animated Counter Hook ───────────────────────────────────────────────────

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('w-full', className)}>
      {children}
    </section>
  );
}

function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('text-center mb-10 md:mb-14', className)}>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#000000]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[#555555] text-sm md:text-base max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 01: Hero
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection({
  country,
  onBack,
  onNavigate,
  onLeadOpen,
}: {
  country: CountryData;
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}) {
  return (
    <Section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${country.heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center">
        {/* Back button */}
        <button
          onClick={onBack}
          className={cn(
            'absolute top-6 left-4 sm:left-6 lg:left-8',
            'flex items-center gap-2 px-4 py-2 rounded-full',
            'bg-white/10 backdrop-blur-sm text-white/90',
            'hover:bg-white/20 transition-colors',
            'min-h-[44px] text-sm font-medium z-20',
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="max-w-3xl">
          {/* Flag + Title */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl md:text-6xl">{country.flag}</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              STUDY IN {country.shortName.toUpperCase()}
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-white/80 text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
            {country.intro}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => onNavigate('course-finder')}
              className="h-12 px-8 rounded-xl font-semibold text-base min-w-[200px] press-scale"
              style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#D45A10')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = '#F37021')
              }
            >
              Find My Course
              <Search className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={onLeadOpen}
              variant="outline"
              className="h-12 px-8 rounded-xl font-semibold text-base min-w-[200px] bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white hover:border-white/60 press-scale"
            >
              Talk to an Expert
            </Button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#FFB347]" />
              <strong className="text-white">
                {country.stats.universities}
              </strong>{' '}
              Universities
            </span>
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#FFB347]" />
              <strong className="text-white">
                {country.stats.courses.toLocaleString()}
              </strong>{' '}
              Courses
            </span>
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#FFB347]" />
              <strong className="text-white">
                {country.stats.scholarships}
              </strong>{' '}
              Scholarships
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 02: Quick Country Intelligence
// ═══════════════════════════════════════════════════════════════════════════════

function QuickIntelSection({ country }: { country: CountryData }) {
  const { count: uniCount, ref: uniRef } = useCountUp(country.stats.universities);
  const { count: courseCount, ref: courseRef } = useCountUp(country.stats.courses);
  const { count: scholarCount, ref: scholarRef } = useCountUp(country.stats.scholarships);

  const cards = [
    {
      icon: <GraduationCap className="h-5 w-5" />,
      label: 'Universities',
      value: uniCount.toLocaleString(),
      suffix: '+',
      ref: uniRef,
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Courses',
      value: courseCount.toLocaleString(),
      suffix: '+',
      ref: courseRef,
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: 'Average Tuition',
      value: country.stats.avgTuition,
      suffix: '',
      ref: null,
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      label: 'Popular Intakes',
      value: country.stats.popularIntakes.join(', '),
      suffix: '',
      ref: null,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: 'Scholarships',
      value: scholarCount.toLocaleString(),
      suffix: '+',
      ref: scholarRef,
    },
    {
      icon: <Languages className="h-5 w-5" />,
      label: 'English Requirement',
      value: country.stats.englishReq,
      suffix: '',
      ref: null,
    },
  ];

  return (
    <Section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={`Quick Facts: ${country.name}`}
          subtitle="Key information at a glance to help you start planning."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <div
              key={i}
              ref={card.ref}
              className={cn(
                'card-lift bg-white rounded-xl border border-gray-100 p-6',
                'flex items-start gap-4 transition-all duration-200',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-xl shrink-0',
                )}
                style={{ backgroundColor: '#E6F0FF' }}
              >
                <span style={{ color: '#0066CC' }}>{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#555555] uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p className="text-lg font-bold text-[#000000] leading-snug">
                  {card.value}
                  {card.suffix && (
                    <span className="text-[#0066CC]">{card.suffix}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 03: Why Study
// ═══════════════════════════════════════════════════════════════════════════════

function WhyStudySection({ country }: { country: CountryData }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <Section className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={`Why Study in ${country.name}?`}
          subtitle="Discover what makes this destination a top choice for international students."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {country.whyStudy.map((item, i) => {
            const isOpen = expandedIdx === i;
            return (
              <button
                key={i}
                onClick={() => setExpandedIdx(isOpen ? null : i)}
                className={cn(
                  'card-lift bg-white rounded-xl border border-gray-100 p-6 text-left',
                  'transition-all duration-300 cursor-pointer',
                  'focus:outline-none focus-ring',
                  isOpen && 'border-[#0066CC]/30 shadow-md',
                )}
                aria-expanded={isOpen}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                    style={{ backgroundColor: '#E6F0FF' }}
                  >
                    <span style={{ color: '#0066CC' }}>
                      {ICON_MAP[item.icon] || (
                        <GraduationCap className="h-6 w-6" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#000000]">
                        {item.title}
                      </h3>
                      <span className="shrink-0 text-[#555555]">
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-300',
                        isOpen ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0',
                      )}
                    >
                      <p className="text-sm text-[#555555] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 04: Cost of Living
// ═══════════════════════════════════════════════════════════════════════════════

function CostSection({ country }: { country: CountryData }) {
  const costRows = [
    { label: 'Tuition Fees', value: country.costs.tuition, icon: <GraduationCap className="h-4 w-4" /> },
    { label: 'Accommodation', value: country.costs.accommodation, icon: <Home className="h-4 w-4" /> },
    { label: 'Food & Groceries', value: country.costs.food, icon: <UtensilsCrossed className="h-4 w-4" /> },
    { label: 'Transport', value: country.costs.transport, icon: <Bus className="h-4 w-4" /> },
    { label: 'Health Insurance (IHS)', value: country.costs.insurance, icon: <ShieldCheck className="h-4 w-4" /> },
    { label: 'Visa Fee', value: country.costs.visa, icon: <FileCheck className="h-4 w-4" /> },
    { label: 'Application Fees', value: country.costs.application, icon: <FileQuestion className="h-4 w-4" /> },
    { label: 'Other (Books, etc.)', value: country.costs.other, icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <Section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Cost of Living"
          subtitle="Estimated costs to help you plan your budget."
        />
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr] bg-[#0066CC] text-white px-6 py-4 text-sm font-semibold">
              <span>Category</span>
              <span className="text-right">Estimated Cost</span>
            </div>
            {/* Rows */}
            {costRows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-[1fr_1fr] px-6 py-4 text-sm',
                  'flex items-center',
                  i < costRows.length - 1 && 'border-b border-gray-50',
                  i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]',
                )}
              >
                <span className="flex items-center gap-3 text-[#000000]">
                  <span className="text-[#555555]">{row.icon}</span>
                  {row.label}
                </span>
                <span className="text-right font-semibold text-[#000000]">
                  {row.value}
                </span>
              </div>
            ))}
            {/* Total */}
            <div className="grid grid-cols-[1fr_1fr] px-6 py-5 bg-[#FFF8ED] border-t-2 border-[#FFB347]">
              <span className="font-bold text-[#000000] text-base">
                Estimated Annual Total
              </span>
              <span
                className="text-right font-bold text-xl"
                style={{ color: '#F37021' }}
              >
                £35,000 – £65,000*
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>These are estimates only.</strong> Actual costs vary by city,
              university, lifestyle, and personal choices. Living costs in London
              are significantly higher than in other UK cities. Please check with an
              ALO counsellor for the most current and personalised estimate.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 05: Popular Cities
// ═══════════════════════════════════════════════════════════════════════════════

function CitiesSection({ country }: { country: CountryData }) {
  return (
    <Section className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={`Popular Student Cities in ${country.name}`}
          subtitle="Explore the vibrant cities that host top universities."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {country.cities.map((city, i) => (
            <div
              key={i}
              className={cn(
                'card-lift bg-white rounded-xl border border-gray-100 p-6',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ backgroundColor: '#E6F0FF' }}
                >
                  <MapPin className="h-5 w-5" style={{ color: '#0066CC' }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#000000]">
                    {city.name}
                  </h3>
                  <p className="text-xs text-[#555555]">
                    {city.universities} universities
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#555555] leading-relaxed">
                {city.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 06: Top Universities
// ═══════════════════════════════════════════════════════════════════════════════

function UniversitiesSection({
  country,
  onNavigate,
}: {
  country: CountryData;
  onNavigate: (page: string, slug?: string) => void;
}) {
  return (
    <Section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Top Universities"
          subtitle={`Explore leading institutions in ${country.name} partner with ALO Education.`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {country.universities.slice(0, 6).map((uni, i) => (
            <div
              key={i}
              className={cn(
                'card-lift group bg-white rounded-xl border border-gray-100 overflow-hidden',
                'transition-all duration-200',
              )}
            >
              {/* Campus image */}
              <div
                className="relative h-44 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, #0066CC 0%, #004C99 100%)`,
                }}
              >
                {uni.campusImage && (
                  <img
                    src={uni.campusImage}
                    alt={`${uni.name} campus`}
                    className="img-zoom w-full h-full object-cover opacity-80"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {uni.ranking && (
                    <Badge
                      className="bg-white/90 text-[#000000] text-xs font-semibold backdrop-blur-sm border-0 px-2.5 py-1"
                    >
                      <Star className="h-3 w-3 mr-1" style={{ color: '#FFB347' }} />
                      {uni.ranking}
                    </Badge>
                  )}
                  {uni.scholarshipAvailable && (
                    <Badge
                      className="text-xs font-medium px-2.5 py-1 border-0"
                      style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                    >
                      Scholarship
                    </Badge>
                  )}
                </div>
                {/* University name on image */}
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-white font-semibold text-base leading-tight drop-shadow-sm">
                    {uni.name}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-sm text-[#555555] mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  {uni.city}
                  {uni.tuitionRange && (
                    <>
                      <span className="mx-1">·</span>
                      <DollarSign className="h-3.5 w-3.5" />
                      {uni.tuitionRange}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onNavigate('university', uni.slug)}
                    size="sm"
                    className="flex-1 h-10 rounded-lg text-sm font-medium press-scale"
                    style={{
                      backgroundColor: '#0066CC',
                      color: '#FFFFFF',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = '#004C99')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = '#0066CC')
                    }
                  >
                    View University
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-lg text-sm font-medium border-gray-200 press-scale"
                  >
                    Compare
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Button
            onClick={() => onNavigate('universities')}
            variant="outline"
            className="h-12 px-8 rounded-xl font-semibold text-sm border-[#0066CC] text-[#0066CC] hover:bg-[#E6F0FF] press-scale"
          >
            View All Universities
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 07: Popular Courses
// ═══════════════════════════════════════════════════════════════════════════════

function CoursesSection({
  country,
  onNavigate,
}: {
  country: CountryData;
  onNavigate: (page: string, slug?: string) => void;
}) {
  return (
    <Section className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Popular Courses"
          subtitle="Explore programmes chosen by students from your region."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {country.courses.slice(0, 6).map((course, i) => (
            <div
              key={i}
              className={cn(
                'card-lift bg-white rounded-xl border border-gray-100 p-5',
                'transition-all duration-200',
              )}
            >
              {/* Subject + Level */}
              <div className="flex items-center justify-between mb-3">
                <Badge
                  className="text-xs font-medium px-2.5 py-1 border-0"
                  style={{ backgroundColor: '#E6F0FF', color: '#0066CC' }}
                >
                  {course.level}
                </Badge>
                {course.scholarshipAvailable && (
                  <Badge
                    className="text-xs font-medium px-2 py-1 border-0"
                    style={{ backgroundColor: '#16A34A', color: '#FFFFFF' }}
                  >
                    <Award className="h-3 w-3 mr-1" />
                    Scholarship
                  </Badge>
                )}
              </div>

              {/* Course name */}
              <h3 className="text-base font-semibold text-[#000000] mb-2 leading-snug">
                {course.name}
              </h3>

              {/* University */}
              <p className="text-sm text-[#555555] mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {course.universityName}
              </p>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-[#555555]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {course.city}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 shrink-0" />
                  {course.tuitionCurrency} {course.tuition}
                </div>
                <div className="flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 shrink-0" />
                  {course.englishRequirement.split('(')[0].trim()}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onNavigate('course', course.slug)}
                  size="sm"
                  className="flex-1 h-10 rounded-lg text-sm font-medium press-scale"
                  style={{
                    backgroundColor: '#0066CC',
                    color: '#FFFFFF',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#004C99')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '#0066CC')
                  }
                >
                  View Course
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-lg border-gray-200 p-0 flex items-center justify-center press-scale"
                  aria-label="Save course"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Button
            onClick={() => onNavigate('courses')}
            variant="outline"
            className="h-12 px-8 rounded-xl font-semibold text-sm border-[#0066CC] text-[#0066CC] hover:bg-[#E6F0FF] press-scale"
          >
            View All Courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 08: Scholarships
// ═══════════════════════════════════════════════════════════════════════════════

function ScholarshipsSection({
  country,
  onNavigate,
  onLeadOpen,
}: {
  country: CountryData;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}) {
  return (
    <Section
      className="py-16 md:py-24"
      style={{ backgroundColor: '#FFF5EB' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Scholarships"
          subtitle="Financial support options to help fund your studies."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {country.scholarships.slice(0, 6).map((sch, i) => (
            <div
              key={i}
              className={cn(
                'card-lift bg-white rounded-xl border border-orange-100 p-6',
                'transition-all duration-200',
              )}
            >
              {/* Funding type badge */}
              {sch.fundingType && (
                <Badge
                  className="text-xs font-medium px-2.5 py-1 border-0 mb-4"
                  style={{
                    backgroundColor: '#F37021',
                    color: '#FFFFFF',
                  }}
                >
                  {sch.fundingType}
                </Badge>
              )}

              <h3 className="text-base font-semibold text-[#000000] mb-1 leading-snug">
                {sch.name}
              </h3>
              {sch.universityName && (
                <p className="text-sm text-[#555555] mb-3">{sch.universityName}</p>
              )}

              {/* Amount */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-bold text-[#16A34A]">
                  {sch.amount}
                </span>
              </div>

              {/* Details */}
              {sch.eligibility && (
                <p className="text-xs text-[#555555] leading-relaxed mb-3 line-clamp-3">
                  {sch.eligibility}
                </p>
              )}
              {sch.deadline && (
                <p className="text-xs text-[#F37021] font-medium mb-4">
                  Deadline: {sch.deadline}
                </p>
              )}

              <Button
                onClick={onLeadOpen}
                size="sm"
                className="w-full h-10 rounded-lg text-sm font-semibold press-scale bg-[#F37021] hover:bg-[#D45A10] text-white"
              >
                Check Eligibility
              </Button>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Button
            onClick={() => onNavigate('scholarships')}
            className="h-12 px-8 rounded-xl font-semibold text-sm press-scale"
            style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#D45A10')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#F37021')
            }
          >
            View All Scholarships
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 09: English Requirements
// ═══════════════════════════════════════════════════════════════════════════════

function EnglishSection({
  country,
  onNavigate,
}: {
  country: CountryData;
  onNavigate: (page: string, slug?: string) => void;
}) {
  const tests = [
    {
      name: 'IELTS Academic',
      range: '6.0 – 7.0',
      note: 'Most widely accepted. Usually no band below 5.5–6.0.',
      popular: true,
    },
    {
      name: 'PTE Academic',
      range: '54 – 69',
      note: 'Accepted by most UK universities. Fast results turnaround.',
      popular: true,
    },
    {
      name: 'TOEFL iBT',
      range: '72 – 100',
      note: 'Accepted at many institutions, but not all. Check specific university.',
      popular: false,
    },
  ];

  return (
    <Section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="English Language Requirements"
          subtitle={`Information about English test scores needed for universities in ${country.name}.`}
        />

        <div className="max-w-3xl mx-auto">
          {/* Test cards */}
          <div className="grid gap-4 mb-8">
            {tests.map((test, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border',
                  test.popular
                    ? 'border-[#0066CC]/20 bg-[#F0F7FF]'
                    : 'border-gray-100 bg-white',
                )}
              >
                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg"
                    style={{ backgroundColor: '#E6F0FF' }}
                  >
                    <Languages className="h-5 w-5" style={{ color: '#0066CC' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#000000]">
                      {test.name}
                    </p>
                    {test.popular && (
                      <Badge
                        className="text-[10px] font-medium px-1.5 py-0.5 border-0 mt-0.5"
                        style={{
                          backgroundColor: '#FFB347',
                          color: '#000000',
                        }}
                      >
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-[#0066CC]">{test.range}</p>
                  <p className="text-xs text-[#555555]">{test.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-8">
            <Info className="h-5 w-5 text-[#0066CC] shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              English requirements vary by university and programme. The scores
              above are general ranges and may not reflect the exact requirements
              of every institution. Information not currently verified — please
              check with an ALO Education counsellor for the most accurate,
              up-to-date requirements for your target programme.
            </p>
          </div>

          {/* Language prep card */}
          <button
            onClick={() => onNavigate('language-prep')}
            className={cn(
              'w-full card-lift flex items-center gap-4 p-5 rounded-xl border border-[#0066CC]/20',
              'bg-white hover:bg-[#F0F7FF] transition-colors text-left',
              'press-scale min-h-[64px]',
            )}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
              style={{ backgroundColor: '#E6F0FF' }}
            >
              <BookOpen className="h-6 w-6" style={{ color: '#0066CC' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#000000]">
                English Test Preparation
              </p>
              <p className="text-xs text-[#555555]">
                Get expert guidance for IELTS, PTE, and TOEFL preparation with ALO Education.
              </p>
            </div>
            <ArrowRight
              className="h-5 w-5 text-[#0066CC] shrink-0"
            />
          </button>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: Student Life
// ═══════════════════════════════════════════════════════════════════════════════

function StudentLifeSection({ country }: { country: CountryData }) {
  const lifeCards = [
    {
      title: 'Accommodation',
      icon: <Home className="h-6 w-6" />,
      points: [
        'University halls available for first-year students',
        'Private rentals and shared housing options off-campus',
        'Average rent ranges from £400–£900/month depending on city',
      ],
    },
    {
      title: 'Culture & Lifestyle',
      icon: <Heart className="h-6 w-6" />,
      points: [
        'Rich multicultural environment with students from 200+ countries',
        'Free museums, galleries, and cultural events across the UK',
        'World-famous music, theatre, and sports scene',
      ],
    },
    {
      title: 'Food & Dining',
      icon: <UtensilsCrossed className="h-6 w-6" />,
      points: [
        'Diverse food options from global cuisines on and off campus',
        'Halal, vegetarian, and vegan options widely available',
        'Supermarkets and budget dining options in every city',
      ],
    },
    {
      title: 'Transport',
      icon: <Bus className="h-6 w-6" />,
      points: [
        'Extensive bus and train networks connecting all major cities',
        'Student discounts available with railcards (up to 1/3 off)',
        'Many cities offer discounted student bus passes',
      ],
    },
  ];

  return (
    <Section className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Student Life"
          subtitle={`What to expect when living and studying in ${country.name}.`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {lifeCards.map((card, i) => (
            <div
              key={i}
              className={cn(
                'card-lift bg-white rounded-xl border border-gray-100 p-6',
                'transition-all duration-200',
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-xl"
                  style={{ backgroundColor: '#E6F0FF' }}
                >
                  <span style={{ color: '#0066CC' }}>{card.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-[#000000]">
                  {card.title}
                </h3>
              </div>
              <ul className="space-y-2">
                {card.points.map((point, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-sm text-[#555555]"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{ color: '#0066CC' }}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: Application Process
// ═══════════════════════════════════════════════════════════════════════════════

function ProcessSection({ country }: { country: CountryData }) {
  const steps = [
    {
      num: 1,
      title: 'Research',
      desc: 'Explore universities, courses, and scholarship options that match your profile.',
      icon: <Search className="h-5 w-5" />,
    },
    {
      num: 2,
      title: 'Shortlist',
      desc: 'Select 3–5 programmes based on your academic background, budget, and career goals.',
      icon: <FileQuestion className="h-5 w-5" />,
    },
    {
      num: 3,
      title: 'Apply',
      desc: 'Submit applications through UCAS (undergrad) or directly (postgrad) with required documents.',
      icon: <FileCheck className="h-5 w-5" />,
    },
    {
      num: 4,
      title: 'Receive Offer',
      desc: 'Get your offer letter and confirm your place. Apply for scholarships if eligible.',
      icon: <Award className="h-5 w-5" />,
    },
    {
      num: 5,
      title: 'Visa & Departure',
      desc: 'Apply for your Student Visa, arrange accommodation, and prepare for departure.',
      icon: <Globe className="h-5 w-5" />,
    },
  ];

  return (
    <Section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Application Process"
          subtitle={`A step-by-step guide to studying in ${country.name}.`}
        />
        <div className="max-w-4xl mx-auto">
          {/* Desktop timeline */}
          <div className="hidden md:flex items-start">
            {steps.map((step, i) => (
              <div key={i} className="flex-1 relative flex flex-col items-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 bg-gray-200" />
                )}
                {/* Step circle */}
                <div
                  className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full mb-4"
                  style={{
                    backgroundColor: i < 3 ? '#0066CC' : '#E6F0FF',
                    color: i < 3 ? '#FFFFFF' : '#0066CC',
                  }}
                >
                  {step.icon}
                </div>
                <h3 className="text-sm font-semibold text-[#000000] mb-1">
                  Step {step.num}
                </h3>
                <h4 className="text-base font-bold text-[#0066CC] mb-2">
                  {step.title}
                </h4>
                <p className="text-xs text-[#555555] text-center leading-relaxed max-w-[140px]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Mobile vertical timeline */}
          <div className="md:hidden space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                {/* Line + circle */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                    style={{
                      backgroundColor: '#0066CC',
                      color: '#FFFFFF',
                    }}
                  >
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-2" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6">
                  <p className="text-xs font-medium text-[#555555] mb-0.5">
                    Step {step.num}
                  </p>
                  <h4 className="text-base font-bold text-[#000000] mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-[#555555] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12: FAQ
// ═══════════════════════════════════════════════════════════════════════════════

function FAQSection({ country }: { country: CountryData }) {
  return (
    <Section className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle={`Common questions about studying in ${country.name}.`}
        />
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {country.faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-xl border border-gray-100 px-6 data-[state=open]:border-[#0066CC]/30 data-[state=open]:shadow-sm transition-all duration-200"
              >
                <AccordionTrigger className="text-sm md:text-base font-semibold text-[#000000] hover:no-underline py-5 min-h-[48px] flex items-center">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#555555] leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13: CTA
// ═══════════════════════════════════════════════════════════════════════════════

function CTASection({
  country,
  onNavigate,
  onLeadOpen,
}: {
  country: CountryData;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}) {
  return (
    <section
      className="relative w-full py-16 md:py-24 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #004C99 0%, #0066CC 100%)',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-white/3" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-4xl mb-4 inline-block">{country.flag}</span>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
          Ready to Study in {country.name}?
        </h2>
        <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Book a free consultation with an ALO counsellor and take the first
          step toward your international education journey.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={onLeadOpen}
            className="h-12 px-8 rounded-xl font-semibold text-base min-w-[220px] press-scale"
            style={{ backgroundColor: '#F37021', color: '#FFFFFF' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#D45A10')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#F37021')
            }
          >
            Book Free Consultation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => onNavigate('courses')}
            variant="outline"
            className="h-12 px-8 rounded-xl font-semibold text-base min-w-[200px] bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white hover:border-white/50 press-scale"
          >
            Explore Courses
          </Button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMING SOON: Placeholder Section
// ═══════════════════════════════════════════════════════════════════════════════

function ComingSoonSection({
  title,
  description,
  onNavigate,
  onLeadOpen,
}: {
  title: string;
  description: string;
  onNavigate?: (page: string, slug?: string) => void;
  onLeadOpen?: () => void;
}) {
  return (
    <Section className="bg-[#F8FAFC] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-6"
          style={{ backgroundColor: '#E6F0FF' }}
        >
          <Building2 className="h-8 w-8" style={{ color: '#0066CC' }} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#000000] mb-3">{title}</h2>
        <p className="text-[#555555] text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => onNavigate?.('course-finder')}
            className="h-12 px-8 rounded-xl font-semibold text-sm min-w-[200px] press-scale"
            style={{ backgroundColor: '#0066CC', color: '#FFFFFF' }}
          >
            <Search className="mr-2 h-4 w-4" />
            Use Course Finder
          </Button>
          {onLeadOpen && (
            <Button
              onClick={onLeadOpen}
              variant="outline"
              className="h-12 px-8 rounded-xl font-semibold text-sm border-[#0066CC] text-[#0066CC] hover:bg-[#E6F0FF] press-scale"
            >
              Talk to an Expert
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: CountryPage
// ═══════════════════════════════════════════════════════════════════════════════

export function CountryPage({
  countrySlug,
  onBack,
  onNavigate,
  onLeadOpen,
}: CountryPageProps) {
  const [country, setCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevSlug, setPrevSlug] = useState(countrySlug);

  // Reset when slug changes
  if (countrySlug !== prevSlug) {
    setPrevSlug(countrySlug);
    setCountry(null);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (!countrySlug) return;
    let cancelled = false;
    fetchCountryData(countrySlug).then((data) => {
      if (!cancelled) {
        setCountry(data);
        if (!data) setError('Country not available');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [countrySlug]);

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const handleNavigate = useCallback(
    (page: string, slug?: string) => {
      onNavigate?.(page, slug);
    },
    [onNavigate],
  );

  const handleLeadOpen = useCallback(() => {
    onLeadOpen?.();
  }, [onLeadOpen]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col bg-white">
        <div className="flex-1">
          <div className="min-h-[85vh] bg-gradient-to-b from-gray-800 to-gray-900 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-2xl bg-white/10 mx-auto" />
                <Skeleton className="h-10 w-64 bg-white/15 mx-auto" />
                <Skeleton className="h-5 w-96 max-w-full bg-white/10 mx-auto" />
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
            <div className="grid grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#000000] mb-2">
              Country Not Found
            </h2>
            <p className="text-[#555555] mb-6">
              The country you are looking for is not available.
            </p>
            <Button
              onClick={handleBack}
              className="press-scale"
              style={{ backgroundColor: '#0066CC', color: '#FFFFFF' }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const hasWhyStudy = country.whyStudy && country.whyStudy.length > 0;
  const hasCities = country.cities && country.cities.length > 0;
  const hasUniversities = country.universities && country.universities.length > 0;
  const hasCourses = country.courses && country.courses.length > 0;
  const hasScholarships = country.scholarships && country.scholarships.length > 0;
  const hasFaqs = country.faqs && country.faqs.length > 0;

  return (
    <div className="flex flex-col bg-white">
        {/* 01 — Hero */}
        <HeroSection
          country={country}
          onBack={handleBack}
          onNavigate={handleNavigate}
          onLeadOpen={handleLeadOpen}
        />

        {/* 02 — Quick Country Intelligence */}
        <QuickIntelSection country={country} />

        {/* 03 — Why Study (only if data exists) */}
        {hasWhyStudy && <WhyStudySection country={country} />}

        {/* 04 — Cost of Living */}
        <CostSection country={country} />

        {/* 05 — Popular Cities (only if data exists) */}
        {hasCities && <CitiesSection country={country} />}

        {/* 06 — Top Universities (only if data exists) */}
        {hasUniversities ? (
          <UniversitiesSection
            country={country}
            onNavigate={handleNavigate}
          />
        ) : (
          <ComingSoonSection
            title={`Universities in ${country.name}`}
            description="We are adding more partner universities. Use our Course Finder to explore available options."
            onNavigate={handleNavigate}
          />
        )}

        {/* 07 — Popular Courses (only if data exists) */}
        {hasCourses ? (
          <CoursesSection country={country} onNavigate={handleNavigate} />
        ) : (
          <ComingSoonSection
            title={`Courses in ${country.name}`}
            description="We are curating the best courses for you. Use our Course Finder to explore available options."
            onNavigate={handleNavigate}
          />
        )}

        {/* 08 — Scholarships (only if data exists) */}
        {hasScholarships ? (
          <ScholarshipsSection
            country={country}
            onNavigate={handleNavigate}
            onLeadOpen={handleLeadOpen}
          />
        ) : (
          <ComingSoonSection
            title={`Scholarships for ${country.name}`}
            description="Scholarship information is being updated. Contact us for the latest opportunities."
            onNavigate={handleNavigate}
            onLeadOpen={handleLeadOpen}
          />
        )}

        {/* 09 — English Requirements */}
        <EnglishSection country={country} onNavigate={handleNavigate} />

        {/* 10 — Student Life */}
        <StudentLifeSection country={country} />

        {/* 11 — Application Process */}
        <ProcessSection country={country} />

        {/* 12 — FAQ (only if data exists) */}
        {hasFaqs ? (
          <FAQSection country={country} />
        ) : (
          <ComingSoonSection
            title="Frequently Asked Questions"
            description={`Have questions about studying in ${country.name}? Contact our expert counsellors for personalized guidance.`}
            onNavigate={handleNavigate}
            onLeadOpen={handleLeadOpen}
          />
        )}

        {/* 13 — CTA */}
        <CTASection
          country={country}
          onNavigate={handleNavigate}
          onLeadOpen={handleLeadOpen}
        />
    </div>
  );
}
