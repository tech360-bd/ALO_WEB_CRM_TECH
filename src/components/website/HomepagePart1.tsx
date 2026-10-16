'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, fadeIn, scaleUp, slideFromLeft, slideFromRight, staggerContainer, staggerItem, staggerItemScale, sectionTitle, sectionSubtitle, viewportOnce, gradients } from './animations';
import {
  Globe, GraduationCap, Users, Award, BookOpen, Target, Eye, Heart,
  Search, ArrowRight, MapPin, Calendar, DollarSign, MessageCircle, Phone,
  CheckCircle, ChevronRight, ChevronDown, Shield, Zap, Send, Sparkles, UserCheck, Download,
} from 'lucide-react';
import { buildStudyGuideText, destinationGuidePath, studyGuideFileName } from '@/lib/alo-study-steps';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnglishExamBanner } from '@/components/website/EnglishExamCta';

const C = { blue: '#0057B8', orange: '#E8501A', text: '#0F172A', textSoft: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };

/* ═══════════════════════════════════════════════════════════════ TYPES ═══ */
interface HeroCountry { id: string; name: string; slug: string; flag: string; accentColor: string; heroImage: string; heroCity?: string; heroIntake?: string; heroSubtitle?: string; }
interface CountryData { id: string; name: string; slug: string; flag: string; accentColor: string; heroImage: string; popularCities: string[]; popularIntakes: string[]; studyLevels: string[]; universityCount?: number; courseCount?: number; scholarshipCount?: number; visaType?: string; tuitionRange?: string; livingCost?: string; workRights?: string; }
interface HomepageData { countries: CountryData[]; heroSlides: HeroCountry[]; englishTests: { id: string; name: string; slug: string }[]; stats: { totalUniversities: number; totalCourses: number; totalScholarships: number; countryCounts: Record<string, number>; metricStatus?: { universities?: string; courses?: string; scholarships?: string } }; }

/* ═══════════════════════════════════════════════════════════════ FALLBACKS ═══ */
// These entries are visual destination choices only. Live availability,
// current intakes and inventory counts come from the database API below.
const FALLBACK_COUNTRIES: HeroCountry[] = [
  { id: '1', name: 'United Kingdom', slug: 'uk', flag: '🇬🇧', accentColor: '#0057B8', heroImage: '/images/hero-banners/UK slide Banner.webp', heroCity: 'London', heroSubtitle: 'World-Class Education in the Heart of Europe' },
  { id: '2', name: 'United States', slug: 'usa', flag: '🇺🇸', accentColor: '#0284C7', heroImage: '/images/hero-banners/USA slide Banner.webp', heroCity: 'New York', heroSubtitle: 'Top Universities & Endless Career Opportunities' },
  { id: '3', name: 'Canada', slug: 'canada', flag: '🇨🇦', accentColor: '#E8501A', heroImage: '/images/hero-banners/Canada slide Banner.webp', heroCity: 'Toronto', heroSubtitle: 'Immigration-Friendly Pathways to Your Future' },
  { id: '4', name: 'Australia', slug: 'australia', flag: '🇦🇺', accentColor: '#10B981', heroImage: '/images/hero-banners/Australia slide Banner.webp', heroCity: 'Sydney', heroSubtitle: 'Quality Education & Post-Study Work Rights' },
  { id: '5', name: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿', accentColor: '#0EA5E9', heroImage: '/images/hero-banners/New Zealand slide Banner.webp', heroCity: 'Auckland', heroSubtitle: 'Safe, Peaceful & Work While You Study' },
  { id: '6', name: 'Ireland', slug: 'ireland', flag: '🇮🇪', accentColor: '#10B981', heroImage: '/images/hero-banners/Europe slide Banner.webp', heroCity: 'Dublin', heroSubtitle: 'Stay Back Visa & Growing Tech Hub' },
  { id: '7', name: 'Dubai / UAE', slug: 'dubai-uae', flag: '🇦🇪', accentColor: '#F59E0B', heroImage: '/images/hero-banners/Europe slide Banner.webp', heroCity: 'Dubai', heroSubtitle: 'Career Growth in the Gulf' },
];

const FALLBACK_DESTINATIONS: CountryData[] = FALLBACK_COUNTRIES.map(c => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  flag: c.flag,
  accentColor: c.accentColor,
  heroImage: c.heroImage,
  popularCities: [],
  popularIntakes: [],
  studyLevels: [],
}));

/* ═══════════════════════════════════════════════════════════════ HOOK ═══ */
function useHomepageData() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/website/homepage')
      .then(r => r.json()).then(d => { if (!d.error) setData(d); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

/* ═══════════════════════════════════════════════════════════════ HERO ═══ */
function HeroSection() {
  const { t } = useI18n();
  const { data } = useHomepageData();
  const slides = data?.heroSlides?.length ? data.heroSlides : FALLBACK_COUNTRIES;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduceMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (reduceMotion) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000);
  }, [slides.length, reduceMotion]);

  useEffect(() => { startTimer(); return () => { if (timer.current) clearInterval(timer.current); }; }, [startTimer]);
  useEffect(() => { if (paused && timer.current) clearInterval(timer.current); if (!paused) startTimer(); }, [paused, startTimer]);

  const slide = slides[current];
  const go = (i: number) => setCurrent(i);

  // Country-specific hero — Master §08 Variant A (editorial split):
  // white background, H1 in main text with the country highlighted in brand
  // blue, supporting copy in body text, ALO Orange primary CTA, and the
  // country landmark photograph in a rounded frame on a pale-blue panel.
  // NO dark overlay on the photograph. Country pills switch the featured
  // country; the auto-advance timer pauses on hover.
  const countryInPhrase =
    slide.name === 'United Kingdom'
      ? 'the United Kingdom'
      : slide.name === 'United States'
        ? 'the United States'
        : slide.name;
  const countrySentence =
    countryInPhrase.charAt(0).toUpperCase() + countryInPhrase.slice(1);

  return (
    <section
      aria-label={`Study in ${slide.name}`}
      className="relative w-full bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
        {/* Left: eyebrow, H1, description, CTAs, country selector */}
        <div className="space-y-6 lg:col-span-6">
          <AnimatePresence mode="wait">
            <motion.div key={`eyebrow-${slide.name}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>
              <Badge variant="brand" className="gap-2 px-3 py-1 text-xs">
                <span aria-hidden="true">{slide.flag}</span>
                {slide.name}
                {slide.heroCity ? ` · ${slide.heroCity}` : ''}
              </Badge>
            </motion.div>
          </AnimatePresence>

          <h1 className="font-heading text-[34px] font-extrabold leading-[1.12] tracking-tight text-[#0F172A] md:text-[52px]" aria-live="polite">
            Unlock a world-class education in{' '}
            <span className="text-[#0057B8]">{countryInPhrase}</span> with expert guidance
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-[#334155]">
            {countrySentence} offers globally recognized education, strong career prospects, and a
            welcoming environment for international students. At ALO Education, we guide you every
            step of the way—from choosing the right course to submitting a strong application.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button asChild size="lg" className="h-12 bg-[#E8501A] px-6 font-heading text-[15px] font-semibold text-white shadow-card hover:bg-[#C93D13]">
              <Link href="/book-consultation">
                Book Free Counselling
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 font-heading text-[15px] font-semibold">
              <Link href={`/course-finder?country=${encodeURIComponent(slide.name)}`}>
                {t('cta.findCourse')} in {slide.name}
              </Link>
            </Button>
          </div>

          {slides.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pt-2" role="tablist" aria-label="Choose a destination to feature">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Show ${s.name}`}
                  onClick={() => go(i)}
                  className={`inline-flex min-h-[48px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 ${
                    i === current
                      ? 'border-[#0057B8] bg-[#EAF3FF] text-[#0057B8]'
                      : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#BFDBFE] hover:bg-[#F4F8FF] hover:text-[#0057B8]'
                  }`}
                >
                  <span aria-hidden="true">{s.flag}</span>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: landmark photograph — rounded frame, pale-blue panel, no overlay */}
        <div className="relative lg:col-span-6">
          <div className="absolute -inset-3 rounded-[24px] bg-[#F4F8FF]" aria-hidden="true" />
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-[#F4F8FF] shadow-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.name}
                initial={reduceMotion ? false as const : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.5 }}
                className="absolute inset-0"
              >
                {slide.heroImage && !imgErrors.has(slide.name) ? (
                  <Image
                    src={slide.heroImage}
                    alt={`${slide.name} landmark — study destination`}
                    fill
                    priority={current === 0}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover object-center"
                    onError={() => setImgErrors(prev => new Set([...prev, slide.name]))}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#EAF3FF]">
                    <span className="text-7xl" aria-hidden="true">{slide.flag}</span>
                    <span className="font-heading text-2xl font-bold text-[#0057B8]">{slide.name}</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating information card — real destination info only */}
          {slide.heroCity && (
            <div className="relative z-10 mx-4 -mt-6 flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-floating sm:mx-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF]">
                <MapPin className="h-5 w-5 text-[#0057B8]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-[#0F172A]">{slide.heroCity}, {slide.name}</p>
                <Link href={`/destinations/${slide.slug}`} className="text-xs font-semibold text-[#0057B8] hover:underline">
                  Explore the {slide.name} destination guide
                </Link>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[#64748B]" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Quick reference for missing icon */
function FileTextIcon(props: React.ComponentType<React.SVGProps<SVGSVGElement>> & { className?: string } & Record<string, unknown>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
}

/* ═══════════════════════════════════════════════════════════════ COURSE FINDER ═══ */
/**
 * SMART COURSE FINDER (homepage, brand brief):
 *   Tabs: COURSES | UNIVERSITIES
 *   COURSES       I'm looking for (subject/course) · I'm planning to study
 *                 (course type) · I want to study in (country)
 *   UNIVERSITIES  I'm looking for (subject) · I want to study in (university)
 *   Action: Search — ALO Orange icon button → /course-finder (results page)
 * Below the box, the selected country's 7-step study guide can be downloaded.
 */
function CourseFinderSection() {
  const { data } = useHomepageData();
  const countries = data?.countries?.length ? data.countries : FALLBACK_DESTINATIONS;
  const router = useRouter();
  const [tab, setTab] = useState<'courses' | 'universities'>('courses');
  const [subject, setSubject] = useState('');
  const [courseType, setCourseType] = useState('');
  const [countryName, setCountryName] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [facets, setFacets] = useState<{ subjects: string[]; universities: { name: string }[] }>({
    subjects: [],
    universities: [],
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/course-finder/facets')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.success) return;
        setFacets({
          subjects: Array.isArray(json.subjects) ? json.subjects : [],
          universities: Array.isArray(json.universities) ? json.universities : [],
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCountry = countries.find((c) => c.name === countryName) ?? countries[0];

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (tab === 'courses') {
      if (subject) params.set('subject', subject);
      if (courseType) params.set('studyLevel', courseType);
      if (countryName) params.set('country', countryName);
    } else {
      params.set('tab', 'universities');
      if (subject) params.set('subject', subject);
      if (universityName) params.set('university', universityName);
    }
    const query = params.toString();
    router.push(`/course-finder${query ? `?${query}` : ''}`);
    fetch('/api/website/search-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryId: countryName, studyLevel: courseType, subject, source: 'homepage_finder' }),
    }).catch(() => {});
  }, [tab, subject, courseType, countryName, universityName, router]);

  /** Download the selected country's 7-step study guide (plain text). */
  const downloadGuide = useCallback(() => {
    if (!selectedCountry) return;
    const text = buildStudyGuideText(selectedCountry.name, selectedCountry.slug);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = studyGuideFileName(selectedCountry.name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [selectedCountry]);

  const inputClass = 'h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20';

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={viewportOnce} className="py-16 lg:py-20 bg-white" aria-labelledby="smart-course-finder-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} className="text-center mb-10">
          <motion.div variants={staggerItem}><Badge className="bg-[#FFF1EA] text-[#E8501A] border border-[#E8501A]/25 mb-4">Smart Course Finder</Badge></motion.div>
          <motion.h2 id="smart-course-finder-heading" variants={sectionTitle} className="text-3xl sm:text-4xl font-bold" style={{ color: C.text }}>Find Your Perfect Course</motion.h2>
          <motion.p variants={sectionSubtitle} className="text-[#64748B] text-lg mt-3 max-w-2xl mx-auto">Search verified courses and universities — tuition fees, intakes, interview requirements and world rankings in one place.</motion.p>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
          {/* Tabs: COURSES | UNIVERSITIES */}
          <div role="tablist" aria-label="Smart Course Finder mode" className="flex gap-1 border-b border-[#E2E8F0] bg-[#F8FAFC] p-1.5">
            {([
              { id: 'courses' as const, label: 'COURSES', Icon: BookOpen },
              { id: 'universities' as const, label: 'UNIVERSITIES', Icon: GraduationCap },
            ]).map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-heading text-[13px] font-extrabold tracking-[0.08em] transition-colors sm:flex-none sm:px-8 ${
                  tab === id ? 'bg-[#E8501A] text-white shadow-sm' : 'bg-white text-[#0F172A] hover:bg-[#FFF1EA] hover:text-[#E8501A]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {tab === 'courses' ? (
              <div role="tabpanel" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="home-cf-subject" className="mb-1.5 block text-xs font-bold text-[#0F172A]">I&apos;m looking for</label>
                  <Input id="home-cf-subject" list="home-cf-subjects" placeholder="Select subject or course" value={subject} onChange={e => setSubject(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="h-12 rounded-xl" />
                  <datalist id="home-cf-subjects">{facets.subjects.map(s => <option key={s} value={s} />)}</datalist>
                </div>
                <div>
                  <label htmlFor="home-cf-type" className="mb-1.5 block text-xs font-bold text-[#0F172A]">I&apos;m planning to study</label>
                  <Select value={courseType} onValueChange={setCourseType}>
                    <SelectTrigger id="home-cf-type" className="h-12 rounded-xl"><SelectValue placeholder="Select course type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Undergraduate">UG — Undergraduate</SelectItem>
                      <SelectItem value="Postgraduate">PG — Postgraduate</SelectItem>
                      <SelectItem value="MRes">MRes — Master of Research</SelectItem>
                      <SelectItem value="PhD">PhD / Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="home-cf-country" className="mb-1.5 block text-xs font-bold text-[#0F172A]">I want to study in</label>
                  <Select value={countryName} onValueChange={setCountryName}>
                    <SelectTrigger id="home-cf-country" className="h-12 rounded-xl"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.name}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="h-12 w-full rounded-xl font-heading font-bold text-white bg-[#E8501A] hover:bg-[#C93D13]"><Search className="mr-2 h-4 w-4" /> Search</Button>
                </div>
              </div>
            ) : (
              <div role="tabpanel" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="home-uf-subject" className="mb-1.5 block text-xs font-bold text-[#0F172A]">I&apos;m looking for</label>
                  <Input id="home-uf-subject" list="home-uf-subjects" placeholder="Select subject or course" value={subject} onChange={e => setSubject(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="h-12 rounded-xl" />
                  <datalist id="home-uf-subjects">{facets.subjects.map(s => <option key={s} value={s} />)}</datalist>
                </div>
                <div>
                  <label htmlFor="home-uf-university" className="mb-1.5 block text-xs font-bold text-[#0F172A]">I want to study in</label>
                  <input id="home-uf-university" list="home-uf-universities" placeholder="University name" value={universityName} onChange={e => setUniversityName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className={inputClass} />
                  <datalist id="home-uf-universities">{facets.universities.map(u => <option key={u.name} value={u.name} />)}</datalist>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="h-12 w-full rounded-xl font-heading font-bold text-white bg-[#E8501A] hover:bg-[#C93D13]"><Search className="mr-2 h-4 w-4" /> Search</Button>
                </div>
              </div>
            )}

            {/* Selected country's 7-step study guide — downloadable */}
            {selectedCountry && (
              <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-[#FFB347]/50 bg-[#FFF1EA] p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-[#0F172A]">
                  <span className="font-heading font-bold">Planning to study in {selectedCountry.name}?</span>{' '}
                  <span className="text-[#555555]">Download the {selectedCountry.name} 7-step study guide — from free counseling to pre-departure.</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={downloadGuide} className="h-12 rounded-xl bg-[#E8501A] px-5 font-heading text-[13px] font-bold text-white hover:bg-[#C93D13]">
                    <Download className="mr-2 h-4 w-4" /> Download 7-Step Guide
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-xl border-[#0057B8] px-5 font-heading text-[13px] font-bold text-[#0057B8] hover:bg-[#EAF3FF]">
                    <Link href={destinationGuidePath(selectedCountry.slug)}>View {selectedCountry.name} Guide</Link>
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline" className="min-h-[48px] h-12 rounded-xl font-semibold border-2 px-8" style={{ borderColor: C.blue, color: C.blue }}>
                <a href="/eligibility-check">
                  <Sparkles className="mr-2 h-4 w-4" /> AI Course Match
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════ DESTINATIONS ═══ */
function DestinationsSection() {
  const { t } = useI18n();
  const { data } = useHomepageData();
  const hasLiveCountryData = Boolean(data?.countries?.length);
  const allCountries = hasLiveCountryData ? data!.countries : FALLBACK_DESTINATIONS;
  const main7 = allCountries.slice(0, 7);
  const extra = allCountries.slice(7);
  const [showMore, setShowMore] = useState(false);

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={viewportOnce} className="py-16 lg:py-20" style={{ backgroundColor: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} className="text-center mb-12">
          <motion.div variants={staggerItem}><Badge className="bg-blue-50 text-[#0057B8] border border-[#0057B8]/20 mb-4">Explore the World</Badge></motion.div>
          <motion.h2 variants={sectionTitle} className="text-3xl sm:text-4xl font-bold" style={{ color: C.text }}>Popular Study Destinations</motion.h2>
          <motion.p variants={sectionSubtitle} className="text-[#64748B] text-lg mt-3 max-w-2xl mx-auto">Discover world-class education opportunities across top study destinations</motion.p>
        </motion.div>
        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {main7.map(d => (
            <motion.div key={d.id} variants={staggerItemScale} whileHover={{ y: -4 }} className="h-full">
              <Card className="h-full rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: d.accentColor }} />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3"><span className="text-2xl">{d.flag}</span><h3 className="text-lg font-bold" style={{ color: C.text }}>{d.name}</h3></div>
                  <div className="space-y-1.5 text-sm text-[#64748B]">
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: d.accentColor }} /><span>{d.popularCities?.slice(0, 3).join(', ') || 'Multiple cities'}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: d.accentColor }} /><span>Intakes: {d.popularIntakes?.slice(0, 2).join(', ') || 'Check course catalog for current dates'}</span></div>
                    <div className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 shrink-0" style={{ color: d.accentColor }} /><span>{d.studyLevels?.slice(0, 3).join(', ') || 'Multiple levels'}</span></div>
                  </div>
                  {hasLiveCountryData && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2E8F0]">
                      {[
                        { v: d.universityCount, l: 'Universities in catalog' },
                        { v: d.courseCount, l: 'Courses in catalog' },
                        { v: d.scholarshipCount, l: 'Scholarships in catalog' },
                      ].filter((item) => typeof item.v === 'number').map((item) => (
                        <div key={item.l} className="text-center">
                          <div className="text-lg font-bold" style={{ color: d.accentColor }}>{item.v}</div>
                          <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{item.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {d.visaType && <Badge variant="outline" className="text-xs w-fit" style={{ borderColor: d.accentColor, color: d.accentColor }}>{d.visaType}</Badge>}
                  <div className="flex gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1 h-12 rounded-xl text-xs font-semibold" style={{ borderColor: d.accentColor, color: d.accentColor }}>
                      <a href={`/destinations/${d.slug}`}>View Guide</a>
                    </Button>
                    <Button asChild size="sm" className="flex-1 h-12 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: C.orange }}>
                      <a href={`/course-finder?country=${d.slug}`}>{t('cta.findCourse')}</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        {extra.length > 0 && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setShowMore(!showMore)} className="h-12 rounded-xl text-sm font-medium">
              {showMore ? 'Show Less' : `+${extra.length} More Countries`} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </Button>
            {showMore && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {extra.map(d => (
                  <Card key={d.id} className="rounded-2xl border border-[#E2E8F0] p-5">
                    <div className="h-1.5 w-12 rounded mb-3" style={{ backgroundColor: d.accentColor }} />
                    <div className="flex items-center gap-2 mb-2"><span>{d.flag}</span><h3 className="font-bold" style={{ color: C.text }}>{d.name}</h3></div>
                    {hasLiveCountryData && (
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        {[
                          { value: d.universityCount, label: 'Unis in catalog' },
                          { value: d.courseCount, label: 'Courses in catalog' },
                          { value: d.scholarshipCount, label: 'Scholarships in catalog' },
                        ].filter((item) => typeof item.value === 'number').map((item) => (
                          <div key={item.label}><div className="font-bold" style={{ color: d.accentColor }}>{item.value}</div><div className="text-[10px] text-[#64748B]">{item.label}</div></div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════ ABOUT ═══ */
function AboutSection() {
  const { data } = useHomepageData();
  const verifiedUnis = data?.stats?.metricStatus?.universities === 'VERIFIED' ? data.stats.totalUniversities : null;
  const verifiedCourses = data?.stats?.metricStatus?.courses === 'VERIFIED' ? data.stats.totalCourses : null;

  const badges = [
    { icon: Globe, label: 'Study Destinations', color: C.blue },
    ...(verifiedUnis ? [{ icon: GraduationCap, label: `${verifiedUnis.toLocaleString()}+ Universities`, color: C.blue }] : []),
    ...(verifiedCourses ? [{ icon: BookOpen, label: `${verifiedCourses.toLocaleString()}+ Courses`, color: C.orange }] : []),
    { icon: Heart, label: 'Student-First', color: '#10B981' },
  ];

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={viewportOnce} className="py-16 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div variants={slideFromLeft} className="space-y-6">
            <Badge className="bg-blue-50 text-[#0057B8] border border-[#0057B8]/20">About ALO Education</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: C.text }}>Who We Are</h2>
            <div className="space-y-4 text-[#64748B] leading-relaxed">
              <p>In February 2023, <strong style={{ color: C.text }}>Taslima Akter</strong> founded ALO Education with a vision to connect ambitious Bangladeshi students with world-class education opportunities abroad. Her personal experience navigating the complexities of international admissions inspired her to create a platform built on trust, transparency, and genuine care for every student&apos;s future.</p>
              <p>That same year, our first office opened in <strong style={{ color: C.text }}>Dhaka, Bangladesh</strong>, with a dedicated focus on helping students secure admissions to leading universities and colleges across the United Kingdom, United States, Australia, Canada, New Zealand, Ireland, and Europe. From the very first day, our approach has been centered on providing personalized, honest, and comprehensive guidance.</p>
              <p>Guided by the founder&apos;s vision of <strong style={{ color: C.text }}>trust, transparency, and professionalism</strong>, ALO Education continues to grow with the mission of offering global opportunities and becoming a trusted partner in international education consultancy. We are not just consultants — we are mentors, guides, and partners in your journey toward a brighter future.</p>
            </div>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                'World-class universities and research excellence',
                'Industry-aligned programmes and employability',
                'International student-friendly policies',
                'Scholarships and funding opportunities',
                'Safe cities and vibrant student life',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-medium" style={{ color: C.text }}>
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#E8501A' }} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: `${badge.color}10`, color: badge.color }}>
                  <badge.icon className="h-4 w-4" /> {badge.label}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={slideFromRight} className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/landing/Copy of pexels-rdne-7092364.webp" alt="ALO Education team" width={600} height={500} className="w-full h-auto object-cover" />
            </div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: gradients.orange }}><Heart className="h-5 w-5 text-white" /></div>
                <div><div className="text-sm font-bold" style={{ color: C.text }}>Student-First</div><div className="text-xs text-[#64748B]">Since 2023</div></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════ MISSION VISION VALUES ═══ */
function MissionVisionValues() {
  const cards = [
    { icon: Target, title: 'Our Mission', color: C.blue, gradient: gradients.blue, paras: ['At ALO Education, our mission is simple yet powerful — turning student dreams into global opportunities. We strive to be a trusted pathway to world-class education, guiding every student with honesty, professionalism, and genuine care.', 'Our commitment goes beyond admissions. We are dedicated to guiding ambitions, shaping brighter futures, and ensuring that students from Bangladesh to the world can access education without boundaries.'] },
    { icon: Eye, title: 'Our Vision', color: C.orange, gradient: gradients.orange, paras: ['The vision of ALO Education is to become a globally recognized education consultancy that inspires trust, integrity, and excellence in everything we do. We aspire to guide students toward courses and institutions that best suit their academic interests and career goals.', 'Our focus is on nurturing holistic development by enhancing knowledge, skills, and confidence so students can thrive in a competitive world. With continuous innovation, we provide seamless, high-quality services.'] },
    { icon: Heart, title: 'Our Core Values', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)', paras: ['Built on honesty and transparency. We provide accurate information and realistic guidance every student can rely on throughout their journey.', 'Leveraging AI tools and modern technology to enhance the student experience, streamline processes, and deliver faster, smarter results.'], values: true },
  ];

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={viewportOnce} className="py-16 lg:py-24" style={{ backgroundColor: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} className="text-center mb-12">
          <motion.div variants={staggerItem}><Badge className="bg-orange-50 text-[#E8501A] border border-[#E8501A]/20 mb-4">Our Purpose</Badge></motion.div>
          <motion.h2 variants={sectionTitle} className="text-3xl sm:text-4xl font-bold" style={{ color: C.text }}>Our Commitment to Your Study-Abroad Dream</motion.h2>
        </motion.div>
        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map(card => (
            <motion.div key={card.title} variants={staggerItemScale} whileHover={{ y: -6 }}>
              <Card className="h-full rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all overflow-hidden">
                <div className="h-2" style={{ background: card.gradient }} />
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: card.gradient }}><card.icon className="w-7 h-7 text-white" /></div>
                  <h3 className="text-xl font-bold" style={{ color: C.text }}>{card.title}</h3>
                  {card.values ? (
                    <div className="space-y-3">
                      {[
                        { icon: Shield, t: 'Trust & Integrity', d: 'Built on honesty and transparency. Accurate information and realistic guidance.' },
                        { icon: Zap, t: 'Innovation', d: 'Leveraging AI tools and modern technology for smarter results.' },
                        { icon: Users, t: 'Student-First', d: 'Every decision prioritizes student success and well-being.' },
                      ].map(v => (
                        <div key={v.t} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-50"><v.icon className="w-4 h-4" style={{ color: C.orange }} /></div>
                          <div><div className="text-sm font-semibold" style={{ color: C.text }}>{v.t}</div><div className="text-xs text-[#64748B]">{v.d}</div></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    card.paras.map((p, i) => <p key={i} className="text-[#64748B] leading-relaxed">{p}</p>)
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════ EXPORT ═══ */
export default function HomepagePart1() {
  return (
    <>
      <HeroSection />
      <CourseFinderSection />
      <EnglishExamBanner location="homepage_banner" />
      <DestinationsSection />
      <AboutSection />
      <MissionVisionValues />
    </>
  );
}
