'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { CourseCard } from '@/components/alo/cards/course-card';
import { UniversityCard } from '@/components/alo/cards/university-card';
import { ScholarshipCard } from '@/components/alo/cards/scholarship-card';
import {
  CourseQuickView,
} from '@/components/alo/drawers/course-quick-view';
import {
  UniversityQuickView,
} from '@/components/alo/drawers/university-quick-view';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  MessageCircle,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  Award,
  Languages,
  Globe,
  Briefcase,
  Clock,
  Users,
  Shield,
  CheckCircle,
  Phone,
  Calculator,
  FileText,
  Plane,
  Stethoscope,
  Heart,
  Building2,
  Bus,
  ShoppingCart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CountryPageConfig } from '@/lib/country-configs';

/* ═══════════════════════════════════════════════════════════════════════════════
   ICON MAP — string name → Lucide component
   ═══════════════════════════════════════════════════════════════════════════════ */

const ICON_MAP = {
  Globe,
  Briefcase,
  Clock,
  Award,
  Users,
  Shield,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  Languages,
  Heart,
  Fingerprint: FileText,
  Stethoscope,
  Building2,
  Bus,
  ShoppingCart,
  FileText,
  Calculator,
} as const;

function getIcon(name: string) {
  return ICON_MAP[name as keyof typeof ICON_MAP] || Globe;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface CountryPageProps {
  config: CountryPageConfig;
  onBack: () => void;
  onLeadOpen?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LOCAL useCountUp HOOK
   ═══════════════════════════════════════════════════════════════════════════════ */

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(!startOnView);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldStart = startOnView ? isInView : true;

  useEffect(() => {
    if (!shouldStart || startedRef.current) return;
    startedRef.current = true;
    let startTime: number | null = null;
    let rafId: number;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOutCubic(progress) * end));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [shouldStart, end, duration]);

  return { count, ref };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ label, title }: { label: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div ref={ref} className="mb-10 text-center sm:mb-12" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp}>
      <span className="inline-block rounded-full bg-alo-blue-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-alo-blue">{label}</span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl">{title}</h2>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════════════════════════ */

export function CountryPage({ config, onBack, onLeadOpen }: CountryPageProps) {
  const [courseDrawerOpen, setCourseDrawerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Parameters<typeof CourseQuickView>[0]['course']>(null);
  const [uniDrawerOpen, setUniDrawerOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<Parameters<typeof UniversityQuickView>[0]['university']>(null);
  const [expandedReason, setExpandedReason] = useState<number | null>(null);

  const handleCourseClick = useCallback((index: number) => {
    setSelectedCourse(config.courses.drawerData[index]);
    setCourseDrawerOpen(true);
  }, [config]);

  const handleUniClick = useCallback((index: number) => {
    setSelectedUni(config.universities.drawerData[index]);
    setUniDrawerOpen(true);
  }, [config]);

  const handleScholarshipClick = useCallback(() => {}, []);

  // Intelligence cards use the hook inside a child component (see IntelligenceCard below)

  return (
    <>
    <div className="min-h-screen-flex">
      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden sm:min-h-[80vh] lg:min-h-[85vh]" aria-labelledby="country-hero-heading">
        <Image src={config.heroImage} alt={`${config.name} study destination`} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        <motion.button type="button" onClick={onBack} className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-ring sm:top-6 sm:left-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </motion.button>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <Badge className="mb-6 border-0 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">{config.hero.badge}</Badge>
          </motion.div>
          <motion.h1 id="country-hero-heading" className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>{config.hero.title}</motion.h1>
          <motion.p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>{config.hero.subtitle}</motion.p>
          <motion.div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <Button size="lg" className="h-12 gap-2 rounded-xl bg-alo-orange px-8 text-base font-bold text-white hover:bg-alo-orange-dark">
              <Search className="h-5 w-5" />{config.hero.ctaPrimary}
            </Button>
            <Button size="lg" variant="outline" className="h-12 gap-2 rounded-xl border-white/40 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white" onClick={onLeadOpen}>
              <MessageCircle className="h-5 w-5" />{config.hero.ctaSecondary}
            </Button>
          </motion.div>
          <motion.div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
            {config.hero.trustIndicators.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs font-medium text-white/70 sm:text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-alo-orange" />{item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <main>
        {/* ═══ QUICK INTELLIGENCE ═══ */}
        <IntelligenceSection config={config} />

        {/* ═══ WHY STUDY ═══ */}
        <WhyStudySection config={config} expandedReason={expandedReason} setExpandedReason={setExpandedReason} />

        {/* ═══ UNIVERSITIES ═══ */}
        <UniversitiesSection config={config} onUniClick={handleUniClick} />

        {/* ═══ COURSES ═══ */}
        <CoursesSection config={config} onCourseClick={handleCourseClick} />

        {/* ═══ SCHOLARSHIPS ═══ */}
        <ScholarshipsSection config={config} onScholarshipClick={handleScholarshipClick} />

        {/* ═══ COST ═══ */}
        <CostSection config={config} />

        {/* ═══ VISA ═══ */}
        <VisaSection config={config} />

        {/* ═══ INTAKES ═══ */}
        <IntakesSection config={config} />

        {/* ═══ FAQ ═══ */}
        <FAQSection config={config} />

        {/* ═══ RELATED COUNTRIES ═══ */}
        <RelatedCountriesSection config={config} />

        {/* ═══ CTA ═══ */}
        <CTASection config={config} onLeadOpen={onLeadOpen} />
      </main>
    </div>
    <CourseQuickView open={courseDrawerOpen} onOpenChange={setCourseDrawerOpen} course={selectedCourse} />
    <UniversityQuickView open={uniDrawerOpen} onOpenChange={setUniDrawerOpen} university={selectedUni} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-SECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════════
   INTELLIGENCE CARD — calls useCountUp at component top level (rules of hooks)
   ═══════════════════════════════════════════════════════════════════════════════ */

function IntelligenceCard({ card, icon: Icon }: { card: CountryPageConfig['intelligence']['cards'][number]; icon: LucideIcon }) {
  const { count, ref } = useCountUp(card.countUp?.end ?? 0, card.countUp?.format ? 2500 : 2000);
  const isCountUp = !!card.countUp;

  return (
    <motion.div variants={cardVariants} className="flex flex-col items-center gap-2.5 rounded-xl border border-alo-gray-medium/60 bg-alo-white p-4 text-center shadow-sm sm:p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-alo-blue-light">
        <Icon className="h-5 w-5 text-alo-blue" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-alo-gray">{card.label}</p>
      {isCountUp ? (
        <span ref={ref} className="text-lg font-extrabold text-alo-black sm:text-xl">
          {card.countUp?.format ? count.toLocaleString() : count}{card.value.replace(/^[\d,]+/, '')}
        </span>
      ) : (
        <span className="text-lg font-extrabold text-alo-black sm:text-xl">{card.value}</span>
      )}
    </motion.div>
  );
}

function IntelligenceSection({ config }: { config: CountryPageConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section ref={sectionRef} className="w-full bg-alo-gray-light py-16 sm:py-20" aria-label="Quick country intelligence">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.intelligence.label} title={config.intelligence.title} />
        <motion.div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.intelligence.cards.map((card) => (
            <IntelligenceCard key={card.label} card={card} icon={getIcon(card.icon)} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function WhyStudySection({ config, expandedReason, setExpandedReason }: { config: CountryPageConfig; expandedReason: number | null; setExpandedReason: (i: number | null) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section ref={sectionRef} className="w-full bg-alo-white py-16 sm:py-20" aria-labelledby="why-study-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.whyStudy.label} title={config.whyStudy.title} />
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.whyStudy.reasons.map((reason, idx) => {
            const isExpanded = expandedReason === idx;
            return (
              <motion.button type="button" key={reason.title} variants={cardVariants} onClick={() => setExpandedReason(isExpanded ? null : idx)} className={`group relative flex flex-col overflow-hidden rounded-xl border bg-alo-white p-5 text-left transition-all duration-300 focus-ring ${isExpanded ? 'border-alo-blue/30 shadow-lg ring-1 ring-alo-blue/10' : 'border-alo-gray-medium/60 shadow-sm hover:shadow-md'}`}>
                <div className="flex items-start gap-3.5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${reason.color === 'blue' ? 'bg-alo-blue-light' : 'bg-alo-orange-light'}`}>
                    {(() => { const Ic = getIcon(reason.icon); return <Ic className={`h-5 w-5 ${reason.color === 'blue' ? 'text-alo-blue' : 'text-alo-orange'}`} />; })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-alo-black sm:text-base">{reason.title}</h3>
                    <p className="mt-1 text-xs text-alo-gray sm:text-sm">{reason.shortDesc}</p>
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <Separator className="my-3" />
                      <ul className="space-y-2">{reason.details.map((d) => (<li key={d} className="flex items-start gap-2 text-xs leading-relaxed text-alo-gray sm:text-sm"><CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alo-blue" />{d}</li>))}</ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function UniversitiesSection({ config, onUniClick }: { config: CountryPageConfig; onUniClick: (index: number) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-gray-light py-16 sm:py-20" aria-labelledby="top-unis-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.universities.label} title={config.universities.title} />
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.universities.data.map((uni, idx) => (
            <motion.div key={uni.name} variants={cardVariants}><UniversityCard university={uni} onQuickView={() => onUniClick(idx)} /></motion.div>
          ))}
        </motion.div>
        <motion.div className="mt-10 text-center" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.5 }}>
          <Button variant="outline" className="gap-2 border-alo-blue text-alo-blue hover:bg-alo-blue-light">{config.universities.button}<ArrowRight className="h-4 w-4" /></Button>
        </motion.div>
      </div>
    </section>
  );
}

function CoursesSection({ config, onCourseClick }: { config: CountryPageConfig; onCourseClick: (index: number) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-white py-16 sm:py-20" aria-labelledby="popular-courses-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.courses.label} title={config.courses.title} />
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.courses.data.map((course, idx) => (
            <motion.div key={course.name} variants={cardVariants}><CourseCard course={course} onQuickView={() => onCourseClick(idx)} onSave={() => {}} onCompare={() => {}} /></motion.div>
          ))}
        </motion.div>
        <motion.div className="mt-10 text-center" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.5 }}>
          <Button variant="outline" className="gap-2 border-alo-blue text-alo-blue hover:bg-alo-blue-light">{config.courses.button}<ArrowRight className="h-4 w-4" /></Button>
        </motion.div>
      </div>
    </section>
  );
}

function ScholarshipsSection({ config, onScholarshipClick }: { config: CountryPageConfig; onScholarshipClick: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-gray-light py-16 sm:py-20" aria-labelledby="scholarships-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.scholarships.label} title={config.scholarships.title} />
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.scholarships.data.map((sch) => (
            <motion.div key={sch.name} variants={cardVariants}><ScholarshipCard scholarship={sch} onCheckEligibility={onScholarshipClick} /></motion.div>
          ))}
        </motion.div>
        <motion.div className="mt-10 text-center" initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.5 }}>
          <Button variant="outline" className="gap-2 border-alo-blue text-alo-blue hover:bg-alo-blue-light">{config.scholarships.button}<ArrowRight className="h-4 w-4" /></Button>
        </motion.div>
      </div>
    </section>
  );
}

function CostSection({ config }: { config: CountryPageConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-white py-16 sm:py-20" aria-labelledby="cost-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.cost.label} title={config.cost.title} />
        <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-3" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={containerVariants}>
          <motion.div className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm lg:col-span-2 sm:p-6" variants={cardVariants}>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-alo-gray">Cost Breakdown</h3>
            <div className="space-y-0">
              {config.cost.items.map((item, idx) => (
                <div key={item.label} className={`flex items-center gap-4 py-3.5 ${idx < config.cost.items.length - 1 ? 'border-b border-alo-gray-medium/40' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-alo-gray-light">{(() => { const Ic = getIcon(item.icon); return <Ic className="h-4.5 w-4.5 text-alo-blue" />; })()}</div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <span className="shrink-0 text-sm font-bold text-alo-black">{item.amount}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div className="flex flex-col items-center justify-center rounded-xl gradient-blue p-6 text-center text-white shadow-lg sm:p-8" variants={cardVariants}>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20"><Calculator className="h-7 w-7" /></div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">Estimated Annual Budget</p>
            <p className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{config.cost.summaryLow} - {config.cost.summaryHigh}</p>
            <p className="mt-2 text-sm text-white/70">Varies by city and lifestyle</p>
            <Button className="mt-6 gap-2 bg-alo-orange px-6 font-bold text-white hover:bg-alo-orange-dark"><Calculator className="h-4 w-4" />Calculate My Budget</Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function VisaSection({ config }: { config: CountryPageConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-gray-light py-16 sm:py-20" aria-labelledby="visa-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.visa.label} title={config.visa.title} />
        <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={containerVariants}>
          <motion.div className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm sm:p-6" variants={cardVariants}>
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-alo-black"><FileText className="h-5 w-5 text-alo-blue" />Visa Requirements</h3>
            <ul className="space-y-3.5">{config.visa.requirements.map((req) => (
              <li key={req} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />{req}</li>
            ))}</ul>
          </motion.div>
          <motion.div className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm sm:p-6" variants={cardVariants}>
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-alo-black"><Plane className="h-5 w-5 text-alo-blue" />Visa Process Timeline</h3>
            <div className="relative space-y-0">{config.visa.steps.map((step, idx) => (
              <div key={step.num} className="relative flex gap-4 pb-5 last:pb-0">
                {idx < config.visa.steps.length - 1 && <div className="absolute top-9 left-[18px] h-[calc(100%-20px)] w-0.5 bg-alo-gray-medium" />}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-alo-blue text-sm font-bold text-white">{step.num}</div>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-alo-black">{step.title}</p>
                  <p className="mt-0.5 text-xs text-alo-gray">{step.desc}</p>
                </div>
              </div>
            ))}</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function IntakesSection({ config }: { config: CountryPageConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-white py-16 sm:py-20" aria-labelledby="intakes-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.intakes.label} title={config.intakes.title} />
        <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.intakes.data.map((intake) => (
            <motion.div key={intake.name} variants={cardVariants} className="rounded-xl border border-alo-gray-medium/60 bg-alo-white p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center gap-2"><h3 className="text-lg font-bold text-alo-black sm:text-xl">{intake.name}</h3></div>
              <Badge className={`mb-4 border-0 text-xs font-semibold ${intake.badgeColor}`}>{intake.type}</Badge>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" /><div><p className="font-medium text-alo-gray">Available Courses</p><p className="font-semibold text-foreground">{intake.courses}</p></div></div>
                <div className="flex items-start gap-2.5"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-alo-orange" /><div><p className="font-medium text-alo-gray">Application Deadline</p><p className="font-semibold text-foreground">{intake.deadline}</p></div></div>
                <div className="flex items-start gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" /><div><p className="font-medium text-alo-gray">Start Preparation By</p><p className="font-semibold text-foreground">{intake.prepStart}</p></div></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection({ config }: { config: CountryPageConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-gray-light py-16 sm:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label={config.faq.label} title={config.faq.title} />
        <motion.div initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={containerVariants}>
          <Accordion type="single" collapsible className="w-full">
            {config.faq.items.map((faq, idx) => (
              <motion.div key={idx} variants={cardVariants}>
                <AccordionItem value={`faq-${idx}`} className="mb-2 rounded-xl border border-alo-gray-medium/60 bg-alo-white px-1 shadow-sm">
                  <AccordionTrigger className="px-4 py-4 text-left text-sm font-semibold text-foreground hover:no-underline sm:px-5 sm:text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm leading-relaxed text-alo-gray sm:px-5">{faq.a}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function RelatedCountriesSection({ config }: { config: CountryPageConfig }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="w-full bg-alo-white py-16 sm:py-20" aria-labelledby="related-countries-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader label="EXPLORE MORE" title="Other Popular Study Destinations" />
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5" variants={containerVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          {config.relatedCountries.map((country) => (
            <motion.article key={country.name} variants={cardVariants} className="group relative cursor-pointer overflow-hidden rounded-xl" whileHover={{ y: -4 }} tabIndex={0} role="link" aria-label={`Study in ${country.name}`}>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image src={country.image} alt={`${country.name} study destination`} fill className="img-zoom object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-colors duration-300 group-hover:from-black/55" />
                <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4">
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">{country.flag}</span>
                  <h3 className="mt-1.5 text-sm font-bold leading-tight text-white sm:text-base">{country.name}</h3>
                  <p className="mt-1 text-xs text-white/75">{country.stat}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection({ config, onLeadOpen }: { config: CountryPageConfig; onLeadOpen?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });
  return (
    <section ref={sectionRef} className="relative overflow-hidden gradient-blue py-16 sm:py-20" aria-labelledby="cta-heading">
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={fadeUp}>
          <h2 id="cta-heading" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">{config.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">{config.cta.subtitle}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 gap-2 rounded-xl bg-alo-orange px-8 text-base font-bold text-white hover:bg-alo-orange-dark"><Search className="h-5 w-5" />{config.cta.ctaPrimary}</Button>
            <Button size="lg" variant="outline" className="h-12 gap-2 rounded-xl border-white/40 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white" onClick={onLeadOpen}><Phone className="h-5 w-5" />{config.cta.ctaSecondary}</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
