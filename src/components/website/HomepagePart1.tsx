'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, fadeIn, scaleUp, slideFromLeft, slideFromRight, staggerContainer, staggerItem, staggerItemScale, sectionTitle, sectionSubtitle, viewportOnce, gradients } from './animations';
import {
  Globe, GraduationCap, Users, Award, BookOpen, Target, Eye, Heart,
  Search, ArrowRight, MapPin, Calendar, DollarSign, MessageCircle, Phone,
  CheckCircle, ChevronRight, ChevronDown, Shield, Zap, Send, Sparkles, UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const C = { blue: '#0057B8', orange: '#E8501A', text: '#0F172A', textSoft: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };

/* ═══════════════════════════════════════════════════════════════ TYPES ═══ */
interface HeroCountry { id: string; name: string; slug: string; flag: string; accentColor: string; heroImage: string; heroCity: string; heroIntake: string; heroSubtitle: string; universityCount?: number; courseCount?: number; scholarshipCount?: number; }
interface CountryData { id: string; name: string; slug: string; flag: string; accentColor: string; heroImage: string; popularCities: string[]; popularIntakes: string[]; studyLevels: string[]; universityCount: number; courseCount: number; scholarshipCount: number; visaType: string; tuitionRange?: string; livingCost?: string; workRights?: string; }
interface HomepageData { countries: CountryData[]; heroSlides: HeroCountry[]; englishTests: { id: string; name: string; slug: string }[]; stats: { totalUniversities: number; totalCourses: number; totalScholarships: number; countryCounts: Record<string, number> }; }

/* ═══════════════════════════════════════════════════════════════ FALLBACKS ═══ */
const FALLBACK_COUNTRIES: HeroCountry[] = [
  { id: '1', name: 'United Kingdom', slug: 'united-kingdom', flag: '🇬🇧', accentColor: '#0057B8', heroImage: '/images/hero-banners/UK slide Banner.webp', heroCity: 'London', heroIntake: 'Sep 2025 / Jan 2026', heroSubtitle: 'World-Class Education in the Heart of Europe', universityCount: 42, courseCount: 1200, scholarshipCount: 35 },
  { id: '2', name: 'United States', slug: 'usa', flag: '🇺🇸', accentColor: '#3B82F6', heroImage: '/images/hero-banners/USA slide Banner.webp', heroCity: 'New York', heroIntake: 'Aug 2025 / Jan 2026', heroSubtitle: 'Top Universities & Endless Career Opportunities', universityCount: 50, courseCount: 1500, scholarshipCount: 40 },
  { id: '3', name: 'Canada', slug: 'canada', flag: '🇨🇦', accentColor: '#E8501A', heroImage: '/images/hero-banners/Canada slide Banner.webp', heroCity: 'Toronto', heroIntake: 'Sep 2025 / Jan 2026 / May 2026', heroSubtitle: 'Immigration-Friendly Pathways to Your Future', universityCount: 35, courseCount: 950, scholarshipCount: 28 },
  { id: '4', name: 'Australia', slug: 'australia', flag: '🇦🇺', accentColor: '#10B981', heroImage: '/images/hero-banners/Australia slide Banner.webp', heroCity: 'Sydney', heroIntake: 'Feb 2026 / Jul 2026', heroSubtitle: 'Quality Education & Post-Study Work Rights', universityCount: 30, courseCount: 800, scholarshipCount: 22 },
  { id: '5', name: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿', accentColor: '#0EA5E9', heroImage: '/images/hero-banners/New Zealand slide Banner.webp', heroCity: 'Auckland', heroIntake: 'Feb 2026 / Jul 2026', heroSubtitle: 'Safe, Peaceful & Work While You Study', universityCount: 15, courseCount: 300, scholarshipCount: 12 },
  { id: '6', name: 'Ireland', slug: 'ireland', flag: '🇮🇪', accentColor: '#10B981', heroImage: '/images/hero-banners/Europe slide Banner.webp', heroCity: 'Dublin', heroIntake: 'Sep 2025 / Jan 2026', heroSubtitle: 'Stay Back Visa & Growing Tech Hub', universityCount: 20, courseCount: 400, scholarshipCount: 15 },
  { id: '7', name: 'Dubai / UAE', slug: 'dubai-uae', flag: '🇦🇪', accentColor: '#F59E0B', heroImage: '/images/hero-banners/Europe slide Banner.webp', heroCity: 'Dubai', heroIntake: 'Sep 2025 / Jan 2026', heroSubtitle: 'Career Growth in the Gulf', universityCount: 18, courseCount: 250, scholarshipCount: 10 },
];

const FALLBACK_DESTINATIONS: CountryData[] = FALLBACK_COUNTRIES.map(c => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  flag: c.flag,
  accentColor: c.accentColor,
  heroImage: c.heroImage,
  popularCities: ['London', 'Manchester', 'Birmingham', 'Edinburgh'],
  popularIntakes: ['Sep 2025', 'Jan 2026'],
  studyLevels: ['Foundation', 'Undergraduate', 'Postgraduate', 'PhD'],
  visaType: 'Student Visa',
  universityCount: c.universityCount ?? 0,
  courseCount: c.courseCount ?? 0,
  scholarshipCount: c.scholarshipCount ?? 0,
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

function AnimatedCounter({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started.current) { started.current = true; const t0 = performance.now(); const step = (now: number) => { const p = Math.min((now - t0) / (duration * 1000), 1); setCount(Math.floor(p * target)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count.toLocaleString()}</span>;
}

/* ═══════════════════════════════════════════════════════════════ HERO ═══ */
function HeroSection() {
  const { data } = useHomepageData();
  const slides = data?.heroSlides?.length ? data.heroSlides : FALLBACK_COUNTRIES;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setInterval>>(null);

  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000);
  }, [slides.length]);

  useEffect(() => { startTimer(); return () => { if (timer.current) clearInterval(timer.current); }; }, [startTimer]);
  useEffect(() => { if (paused && timer.current) clearInterval(timer.current); if (!paused) startTimer(); }, [paused, startTimer]);

  const slide = slides[current];
  const go = (i: number) => setCurrent(i);

  return (
    <section className="relative w-full h-[90vh] min-h-[600px] max-h-[950px] overflow-hidden bg-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence mode="wait">
        <motion.div key={slide.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
          {slide.heroImage && !imgErrors.has(slide.name) ? (
            <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block">
              <Image src={slide.heroImage} alt={slide.name} fill className="object-cover object-center" onError={() => setImgErrors(prev => new Set([...prev, slide.name]))} />
            </div>
          ) : (
            <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${slide.accentColor}15, ${slide.accentColor}08)` }}>
              <div className="text-center">
                <span className="text-8xl block mb-4">{slide.flag}</span>
                <span className="text-3xl font-bold" style={{ color: slide.accentColor }}>{slide.name}</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6 max-w-xl">
              <AnimatePresence mode="wait">
                <motion.div key={slide.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                  <Badge className="bg-white text-sm font-medium px-4 py-1.5 rounded-full shadow-sm border border-[#E2E8F0]" style={{ color: slide.accentColor }}>
                    {slide.flag} {slide.name}
                  </Badge>
                </motion.div>
              </AnimatePresence>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-tight" style={{ color: C.text, fontFamily: 'system-ui, sans-serif' }}>
                Study Abroad in the World
              </motion.h1>
              <AnimatePresence mode="wait">
                <motion.h2 key={slide.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4 }} className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: slide.accentColor }}>
                  Study Abroad in {slide.name} & More
                </motion.h2>
              </AnimatePresence>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base text-[#64748B] leading-relaxed max-w-lg">
                Honest, verified guidance for Bangladeshi students — from course match to visa decision.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3">
                <a href="/book-consultation"><Button className="min-h-[48px] h-12 rounded-xl px-6 font-semibold text-white" style={{ backgroundColor: C.orange }}>Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Button></a>
                <a href={`/course-finder?country=${slide.slug}`}><Button variant="outline" className="min-h-[48px] h-12 rounded-xl px-6 font-semibold border-2" style={{ borderColor: C.blue, color: C.blue }}>Find Courses</Button></a>
                <a href="/eligibility-check"><Button variant="outline" className="min-h-[48px] h-12 rounded-xl px-5 font-semibold" style={{ borderColor: C.border, color: C.text }}>Check Eligibility</Button></a>
                <a href="https://wa.me/8801805020101" target="_blank" rel="noopener noreferrer"><Button variant="outline" className="min-h-[48px] h-12 rounded-xl px-5 font-semibold" style={{ borderColor: '#25D366', color: '#25D366' }}><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</Button></a>
              </motion.div>
            </div>

            <div className="hidden lg:block">
              <AnimatePresence mode="wait">
                <motion.div key={slide.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }} className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slide.accentColor }} />
                      <h3 className="text-lg font-bold" style={{ color: slide.accentColor }}>{slide.heroSubtitle}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: GraduationCap, label: 'Universities', value: slide.universityCount || 42 },
                        { icon: BookOpen, label: 'Courses', value: slide.courseCount || 1200 },
                        { icon: Award, label: 'Scholarships', value: slide.scholarshipCount || 35 },
                      ].map(s => (
                        <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: `${slide.accentColor}08` }}>
                          <s.icon className="h-5 w-5 mx-auto mb-1" style={{ color: slide.accentColor }} />
                          <div className="text-xl font-bold" style={{ color: slide.accentColor }}><AnimatedCounter target={s.value} />+</div>
                          <div className="text-xs text-[#64748B]">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <MapPin className="h-4 w-4" style={{ color: slide.accentColor }} />
                      <span>Popular city: <strong style={{ color: C.text }}>{slide.heroCity}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <Calendar className="h-4 w-4" style={{ color: slide.accentColor }} />
                      <span>Next intake: <strong style={{ color: C.text }}>{slide.heroIntake}</strong></span>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] p-4 flex items-center gap-4">
                    {[
                      { icon: MessageCircle, label: 'Counseling' },
                      { icon: FileTextIcon, label: 'Apply' },
                      { icon: Shield, label: 'Visa' },
                    ].map((s, i) => {
                      const Icon: React.ElementType = s.icon;
                      return (
                      <div key={s.label} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: i === 2 ? `${C.orange}15` : `${C.blue}15` }}>
                          <Icon className="h-4 w-4" style={{ color: i === 2 ? C.orange : C.blue }} />
                        </div>
                        <span className="text-xs font-medium text-[#64748B]">{s.label}</span>
                        {i < 2 && <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />}
                      </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 flex-wrap justify-center px-4">
        {slides.map((s, i) => (
          <button key={s.id} onClick={() => go(i)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ backgroundColor: i === current ? s.accentColor : '#F1F5F9', color: i === current ? '#FFFFFF' : '#64748B' }}>
            <span>{s.flag}</span>
            <span className="hidden sm:inline">{s.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* Quick reference for missing icon */
function FileTextIcon(props: React.ComponentType<React.SVGProps<SVGSVGElement>> & { className?: string } & Record<string, unknown>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
}

/* ═══════════════════════════════════════════════════════════════ COURSE FINDER ═══ */
function CourseFinderSection() {
  const { data } = useHomepageData();
  const tests = data?.englishTests?.length ? data.englishTests : [{ id: '1', name: 'IELTS', slug: 'ielts' }, { id: '2', name: 'PTE', slug: 'pte-academic' }, { id: '3', name: 'TOEFL', slug: 'toefl' }, { id: '4', name: 'Duolingo', slug: 'duolingo' }];
  const countries = data?.countries?.length ? data.countries : FALLBACK_DESTINATIONS;
  const router = useRouter();
  const [form, setForm] = useState({ country: '', level: '', subject: '', intake: '', budget: '', test: '', query: '' });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/course-finder${params.toString() ? `?${params}` : ''}`);
    fetch('/api/website/search-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countryId: form.country, studyLevel: form.level, subject: form.subject, intake: form.intake, budget: form.budget, source: 'homepage_finder' }) }).catch(() => {});
  }, [form, router]);

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={viewportOnce} className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={staggerContainer} className="text-center mb-10">
          <motion.div variants={staggerItem}><Badge className="bg-blue-50 text-[#0057B8] border border-[#0057B8]/20 mb-4">Smart Course Finder</Badge></motion.div>
          <motion.h2 variants={sectionTitle} className="text-3xl sm:text-4xl font-bold" style={{ color: C.text }}>Find Your Perfect Course</motion.h2>
          <motion.p variants={sectionSubtitle} className="text-[#64748B] text-lg mt-3 max-w-2xl mx-auto">Search from thousands of courses across top universities worldwide</motion.p>
        </motion.div>
        <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={form.country} onValueChange={v => update('country', v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c.id} value={c.slug}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.level} onValueChange={v => update('level', v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Study Level" /></SelectTrigger>
              <SelectContent><SelectItem value="foundation">Foundation</SelectItem><SelectItem value="undergraduate">Undergraduate</SelectItem><SelectItem value="postgraduate">Postgraduate</SelectItem><SelectItem value="phd">PhD</SelectItem><SelectItem value="diploma">Diploma</SelectItem></SelectContent>
            </Select>
            <Input placeholder="Subject area" value={form.subject} onChange={e => update('subject', e.target.value)} className="h-12 rounded-xl" />
            <Select value={form.intake} onValueChange={v => update('intake', v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Intake" /></SelectTrigger>
              <SelectContent><SelectItem value="sep2025">Sep 2025</SelectItem><SelectItem value="jan2026">Jan 2026</SelectItem><SelectItem value="feb2026">Feb 2026</SelectItem><SelectItem value="may2026">May 2026</SelectItem><SelectItem value="jul2026">Jul 2026</SelectItem></SelectContent>
            </Select>
            <Select value={form.budget} onValueChange={v => update('budget', v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Budget Range" /></SelectTrigger>
              <SelectContent><SelectItem value="0-10000">Under £10,000</SelectItem><SelectItem value="10000-20000">£10,000-£20,000</SelectItem><SelectItem value="20000-35000">£20,000-£35,000</SelectItem><SelectItem value="35000+">£35,000+</SelectItem></SelectContent>
            </Select>
            <Select value={form.test} onValueChange={v => update('test', v)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="English Test" /></SelectTrigger>
              <SelectContent>{tests.map(t => <SelectItem key={t.id} value={t.slug}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Search courses..." value={form.query} onChange={e => update('query', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="h-12 rounded-xl" />
            <Button onClick={handleSearch} className="h-12 rounded-xl font-semibold text-white" style={{ backgroundColor: C.orange }}><Search className="mr-2 h-4 w-4" /> Find Courses</Button>
          </div>
          <div className="mt-4 flex justify-center">
            <a href="/eligibility-check">
              <Button variant="outline" className="min-h-[48px] h-12 rounded-xl font-semibold border-2 px-8" style={{ borderColor: C.blue, color: C.blue }}>
                <Sparkles className="mr-2 h-4 w-4" /> AI Course Match
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════ DESTINATIONS ═══ */
function DestinationsSection() {
  const { data } = useHomepageData();
  const allCountries = data?.countries?.length ? data.countries : FALLBACK_DESTINATIONS;
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
                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: d.accentColor }} /><span>Intakes: {d.popularIntakes?.slice(0, 2).join(', ') || 'Rolling'}</span></div>
                    <div className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 shrink-0" style={{ color: d.accentColor }} /><span>{d.studyLevels?.slice(0, 3).join(', ') || 'Multiple levels'}</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2E8F0]">
                    {[
                      { v: d.universityCount, l: 'Universities' },
                      { v: d.courseCount, l: 'Courses' },
                      { v: d.scholarshipCount, l: 'Scholarships' },
                    ].map(s => (
                      <div key={s.l} className="text-center">
                        <div className="text-lg font-bold" style={{ color: d.accentColor }}>{s.v}+</div>
                        <div className="text-[10px] text-[#64748B] uppercase tracking-wider">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {d.visaType && <Badge variant="outline" className="text-xs w-fit" style={{ borderColor: d.accentColor, color: d.accentColor }}>{d.visaType}</Badge>}
                  <div className="flex gap-2 pt-1">
                    <a href={`/destinations/${d.slug}`} className="flex-1"><Button variant="outline" size="sm" className="w-full h-10 rounded-xl text-xs font-semibold" style={{ borderColor: d.accentColor, color: d.accentColor }}>View Guide</Button></a>
                    <a href={`/course-finder?country=${d.slug}`} className="flex-1"><Button size="sm" className="w-full h-10 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: C.orange }}>Find Courses</Button></a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        {extra.length > 0 && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setShowMore(!showMore)} className="h-10 rounded-xl text-sm font-medium">
              {showMore ? 'Show Less' : `+${extra.length} More Countries`} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </Button>
            {showMore && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {extra.map(d => (
                  <Card key={d.id} className="rounded-2xl border border-[#E2E8F0] p-5">
                    <div className="h-1.5 w-12 rounded mb-3" style={{ backgroundColor: d.accentColor }} />
                    <div className="flex items-center gap-2 mb-2"><span>{d.flag}</span><h3 className="font-bold" style={{ color: C.text }}>{d.name}</h3></div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div><div className="font-bold" style={{ color: d.accentColor }}>{d.universityCount}+</div><div className="text-[10px] text-[#64748B]">Unis</div></div>
                      <div><div className="font-bold" style={{ color: d.accentColor }}>{d.courseCount}+</div><div className="text-[10px] text-[#64748B]">Courses</div></div>
                      <div><div className="font-bold" style={{ color: d.accentColor }}>{d.scholarshipCount}</div><div className="text-[10px] text-[#64748B]">Scholarships</div></div>
                    </div>
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
  const totalUnis = data?.stats?.totalUniversities;
  const totalCourses = data?.stats?.totalCourses;

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
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Globe, label: '7 Countries', color: C.blue },
                { icon: GraduationCap, label: `${totalUnis ? totalUnis + '+' : '200+'} Universities`, color: C.blue },
                { icon: BookOpen, label: `${totalCourses ? totalCourses.toLocaleString() + '+' : '8,000+'} Courses`, color: C.orange },
                { icon: Heart, label: 'Student-First', color: '#10B981' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: `${b.color}10`, color: b.color }}>
                  <b.icon className="h-4 w-4" /> {b.label}
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
      <DestinationsSection />
      <AboutSection />
      <MissionVisionValues />
    </>
  );
}
