'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { ALO_HERO_STATS, ALO_IMPACT_STATS, ALO_UNIVERSITIES, ALO_DESTINATIONS, ALO_COURSES } from '@/lib/alo-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap, Globe, Users, Award, ArrowRight, Search, Star,
  Phone, Clock, Brain, Shield, MessageSquare, Sparkles,
  FileCheck, Handshake, BookOpen, CreditCard, Headphones, Plane,
  ChevronRight, Calendar, TrendingUp, Zap, DollarSign, Target,
} from 'lucide-react'

/* ── Data ──────────────────────────────────────────────── */

// Destination view mapping: country code → app view
const destinationViewMap: Record<string, 'study-uk' | 'study-usa' | 'study-canada' | 'study-australia' | 'study-europe' | 'study-malaysia'> = {
  UK: 'study-uk',
  US: 'study-usa',
  CA: 'study-canada',
  AU: 'study-australia',
  EU: 'study-europe',
  MY: 'study-malaysia',
}

const destinations = ALO_DESTINATIONS.map((d) => ({
  country: d.country,
  code: d.code,
  view: destinationViewMap[d.code] || 'study-uk',
  flag: d.flag,
  students: d.students,
  universities: d.universities,
  desc: d.desc,
  gradient: d.gradient,
  popularFor: d.popularFor,
  intake: d.intake,
  postStudyVisa: d.postStudyVisa,
}))

// Universities — ALO partner universities first, then top global
const universities = ALO_UNIVERSITIES.map((u) => ({
  name: u.name,
  country: u.country,
  countryCode: u.countryCode,
  city: u.city,
  ranking: `#${u.ranking}`,
  rankingNum: u.ranking,
  logo: u.logo,
  courses: u.courses,
  tuitionFrom: u.tuitionFrom,
  applicationFee: u.applicationFee,
  deposit: u.deposit,
  englishRequirement: u.englishRequirement,
  popularFor: u.popularFor,
  description: u.description,
  established: u.established,
  students: u.students,
  partner: u.partner,
}))

// Comprehensive course catalog — featured categories for the homepage grid
const courses = [
  { name: 'Business & Management', icon: <TrendingUp className="h-7 w-7" />, level: 'UG / PG', duration: '1-3 yrs', fee: '$14K-45K/yr', count: ALO_COURSES.filter(c => c.field === 'Business' || c.field === 'Finance').length },
  { name: 'Engineering & Tech', icon: <Zap className="h-7 w-7" />, level: 'UG / PG', duration: '1-4 yrs', fee: '$15K-35K/yr', count: ALO_COURSES.filter(c => c.field === 'Engineering').length },
  { name: 'Medicine & Health', icon: <GraduationCap className="h-7 w-7" />, level: 'UG / PG', duration: '3-6 yrs', fee: '$20K-50K/yr', count: ALO_COURSES.filter(c => c.field === 'Medicine' || c.field === 'Health').length },
  { name: 'IT & Computer Science', icon: <Brain className="h-7 w-7" />, level: 'UG / PG / PhD', duration: '1-4 yrs', fee: '$14K-35K/yr', count: ALO_COURSES.filter(c => c.field === 'Computer Science' || c.field === 'Data Science' || c.field === 'IT').length },
  { name: 'Law & Legal Studies', icon: <Shield className="h-7 w-7" />, level: 'UG / PG', duration: '1-3 yrs', fee: '$15K-32K/yr', count: ALO_COURSES.filter(c => c.field === 'Law').length },
  { name: 'Arts & Design', icon: <Sparkles className="h-7 w-7" />, level: 'UG / PG', duration: '1-3 yrs', fee: '$12K-30K/yr', count: ALO_COURSES.filter(c => c.field === 'Arts' || c.field === 'Architecture').length },
  { name: 'Science & Research', icon: <Globe className="h-7 w-7" />, level: 'PhD / PG', duration: '1-4 yrs', fee: '$18K-40K/yr', count: ALO_COURSES.filter(c => c.level === 'phd').length },
  { name: 'MBA & Executive', icon: <DollarSign className="h-7 w-7" />, level: 'PG', duration: '1-2 yrs', fee: '$25K-60K/yr', count: ALO_COURSES.filter(c => c.name.includes('MBA')).length },
]

const steps = [
  { num: 1, title: 'Free Consultation', desc: 'Book your free session with our experts', icon: <MessageSquare className="h-7 w-7" /> },
  { num: 2, title: 'University Selection', desc: 'Get matched with perfect universities', icon: <Target className="h-7 w-7" /> },
  { num: 3, title: 'Application Support', desc: 'We handle your entire application', icon: <FileCheck className="h-7 w-7" /> },
  { num: 4, title: 'Visa & Beyond', desc: 'Complete visa guidance & pre-departure', icon: <Plane className="h-7 w-7" /> },
]

const whyFeatures = [
  { icon: <Brain className="h-6 w-6" />, title: 'AI-Powered Matching', desc: 'Smart university recommendations based on your profile' },
  { icon: <Shield className="h-6 w-6" />, title: '98% Visa Success', desc: 'Expert visa guidance with proven track record' },
  { icon: <MessageSquare className="h-6 w-6" />, title: '24/7 WhatsApp Support', desc: 'Always connected, always helping' },
  { icon: <CreditCard className="h-6 w-6" />, title: 'Zero Service Fee', desc: 'Completely free for students' },
  { icon: <Award className="h-6 w-6" />, title: 'Scholarship Expert', desc: 'Find funding opportunities that fit' },
  { icon: <Users className="h-6 w-6" />, title: 'UKVI Interview Prep', desc: 'Ace your interview with expert coaching' },
]

const scholarships = [
  { name: 'Chevening Scholarship', amount: 'Full Tuition + Living', uni: 'UK Universities', deadline: 'Nov 2025' },
  { name: 'Fulbright Program', amount: 'Up to $50,000', uni: 'US Universities', deadline: 'Oct 2025' },
  { name: 'Australia Awards', amount: 'Full Tuition + Stipend', uni: 'Australian Universities', deadline: 'Apr 2025' },
]

const testimonials = [
  { name: 'Rahim Ahmed', uni: 'University of Manchester, UK', quote: 'ALO Education made my dream of studying in the UK a reality. Their guidance was invaluable throughout the entire process.', stars: 5 },
  { name: 'Fatima Begum', uni: 'University of Sydney, Australia', quote: 'The visa guidance was exceptional. I got my approval on the first attempt! Forever grateful to the ALO team.', stars: 5 },
  { name: 'Karim Hassan', uni: 'University of Toronto, Canada', quote: 'From application to arrival, ALO was with me every step. Their scholarship support saved me thousands!', stars: 5 },
]

const blogPosts = [
  { title: 'Top 10 Scholarships for Bangladeshi Students in 2025', cat: 'Scholarships', excerpt: 'Discover the best funding opportunities available for Bangladeshi students looking to study abroad this year.', date: 'Feb 28, 2025' },
  { title: 'UK Student Visa 2025: Complete Guide', cat: 'Visa Guide', excerpt: 'Everything you need to know about the UK student visa process, from documents to interview preparation.', date: 'Feb 20, 2025' },
  { title: 'Why Canada is the Top Choice for Bangladeshi Students', cat: 'Study Guide', excerpt: 'Explore why Canada continues to attract thousands of Bangladeshi students with its world-class education and PR pathways.', date: 'Feb 15, 2025' },
]

const events = [
  { title: 'UK Universities Virtual Fair 2025', date: 'Mar 15, 2025', time: '3:00 PM BST', type: 'Virtual Fair' },
  { title: 'Study in Canada Seminar', date: 'Mar 22, 2025', time: '10:00 AM BST', type: 'Seminar' },
  { title: 'Australia Education Webinar', date: 'Apr 5, 2025', time: '2:00 PM BST', type: 'Webinar' },
]

const searchSuggestions = ['University of Oxford', 'MBA in UK', 'Computer Science Canada', 'Scholarship USA', 'Medicine Australia', 'Engineering Germany']

const trustLogos = ['British Council', 'UCAS', 'UKVI', 'QS Rankings', 'THE Rankings']

/* ── Animated Counter Hook ─────────────────────────────── */

function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          setCount(Math.floor(p * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return { count, ref }
}

/* ── Fade-in on Scroll Hook ────────────────────────────── */

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(30px)'
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease'
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        obs.unobserve(el)
      }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ── Section Wrapper ───────────────────────────────────── */

function Section({ children, className = '', dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  const ref = useFadeIn()
  return (
    <section ref={ref} className={`py-16 md:py-24 ${dark ? 'bg-[#1A2332] text-white' : ''} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

/* ── Main Component ────────────────────────────────────── */

export default function HomePage() {
  const { setCurrentView } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const uniScrollRef = useRef<HTMLDivElement>(null)

  const nav = useCallback((view: Parameters<typeof setCurrentView>[0]) => setCurrentView(view), [setCurrentView])

  const filteredSuggestions = searchQuery
    ? searchSuggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchSuggestions

  return (
    <div className="overflow-hidden">

      {/* ── 1. Hero Section ──────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#1A2332] via-[#0d1b2a] to-[#0066CC]/30 overflow-hidden">
        {/* Animated background dots */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #E8501A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Soft orange glow blob behind headline */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-[#E8501A]/20 blur-[120px] pointer-events-none" />

        {/* Floating graduation cap (decorative, right) */}
        <div className="absolute top-24 right-6 md:right-16 opacity-[0.08] pointer-events-none hidden sm:block">
          <GraduationCap className="w-32 h-32 md:w-44 md:h-44 text-[#E8501A]" />
        </div>
        {/* Floating globe (decorative, left) */}
        <div className="absolute bottom-24 left-6 md:left-16 opacity-[0.06] pointer-events-none hidden sm:block">
          <Globe className="w-36 h-36 md:w-52 md:h-52 text-white" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
          {/* Badge */}
          <Badge className="bg-[#E8501A]/15 text-[#FFB347] border-[#E8501A]/30 mb-6 text-sm px-4 py-1.5">
            🎓 #1 Education Consultancy in Bangladesh
          </Badge>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
            Your Future Starts Here
            <br />
            Study Abroad in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8501A] to-[#FFB347]">
              Top Global Universities
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-white font-semibold mb-3">
            Empowering Students to Reach Global Heights
          </p>
          <p className="text-base md:text-lg text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Expert guidance for studying in UK, USA, Canada, Australia, Ireland, Germany, New Zealand, Malaysia &amp; Europe
          </p>

          {/* Dual CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Button onClick={() => nav('free-consultation')} size="lg" className="bg-[#E8501A] hover:bg-[#c8440f] text-white font-semibold text-base px-8 py-6 rounded-xl shadow-lg shadow-[#E8501A]/30 transition-all hover:scale-[1.02]">
              Book Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => nav('courses')} size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6 rounded-xl backdrop-blur-sm">
              Find Courses
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {ALO_HERO_STATS.map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search universities, courses, or countries..."
                className="pl-12 pr-4 py-6 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-base backdrop-blur-sm focus:bg-white/15"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                {filteredSuggestions.map((s, i) => (
                  <button key={i} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-[#E8501A]/10 flex items-center gap-3 transition-colors"
                    onClick={() => { setSearchQuery(s); setShowSuggestions(false); nav('universities') }}>
                    <Search className="h-4 w-4 text-gray-400" />{s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trust pills */}
          <div className="mt-10">
            <p className="text-sm text-gray-400 mb-4">Trusted partnerships with leading UK &amp; global universities</p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {trustLogos.map((logo, i) => (
                <span key={i} className="text-xs md:text-sm text-gray-300 font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Trust Bar ─────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-200 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-4">
          <p className="text-sm text-gray-500 font-medium">Trusted by 5,000+ students &amp; 330+ universities worldwide</p>
        </div>
        <div className="flex gap-12 items-center justify-center animate-marquee whitespace-nowrap">
          {[...trustLogos, ...trustLogos].map((l, i) => (
            <span key={i} className="text-gray-400 font-bold text-lg tracking-wider px-6">{l}</span>
          ))}
        </div>
      </section>

      {/* ── 3. Study Destinations ────────────────────────── */}
      <Section>
        <div className="text-center mb-12">
          <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">🌍 Study Abroad</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">Popular Study Destinations</h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Explore world-class education opportunities across the globe</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map(d => (
            <Card key={d.country} onClick={() => nav(d.view)}
              className="group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl">
              <div className={`relative h-48 bg-gradient-to-br ${d.gradient} p-6 flex flex-col justify-end text-white`}>
                <span className="text-5xl absolute top-4 right-4 opacity-30 group-hover:opacity-50 transition-opacity group-hover:scale-110 transform duration-300">{d.flag}</span>
                <span className="text-3xl font-bold">{d.country}</span>
                <span className="text-white/80 text-sm mt-1">{d.students} students placed</span>
              </div>
              <CardContent className="p-5">
                <p className="text-gray-600 text-sm">{d.desc}</p>
                <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                  <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-[#F37021]" /> <span className="font-semibold text-gray-700">Intake:</span> {d.intake}</p>
                  <p className="flex items-center gap-2"><Plane className="h-3.5 w-3.5 text-[#0066CC]" /> <span className="font-semibold text-gray-700">Post-study:</span> {d.postStudyVisa}</p>
                  <p className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-[#22c55e]" /> <span className="font-semibold text-gray-700">{d.universities} universities</span></p>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {d.popularFor.slice(0, 3).map((p: string) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F37021]/5 text-[#F37021] border border-[#F37021]/10">{p}</span>
                  ))}
                </div>
                <span className="text-[#F37021] text-sm font-semibold mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 4. Popular Universities Carousel ─────────────── */}
      <Section className="bg-gray-50">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">🏛️ Top Universities</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">Featured Universities</h2>
            <p className="mt-2 text-gray-500 text-sm max-w-xl">Direct ALO partnerships mean faster offers, exclusive scholarships, and dedicated support for Bangladeshi students.</p>
          </div>
          <Button variant="ghost" onClick={() => nav('universities')} className="text-[#F37021] font-semibold hidden sm:flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div ref={uniScrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin -mx-4 px-4">
          {universities.map((u, i) => (
            <Card key={i} className="min-w-[280px] sm:min-w-[300px] snap-start border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl flex-shrink-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-5xl">{u.logo}</span>
                  {u.partner && (
                    <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 text-[10px] font-bold">
                      ✓ ALO PARTNER
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-[#1A2332] text-lg leading-snug">{u.name}</h3>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> {u.city}, {u.country}
                </p>
                <p className="text-gray-400 text-xs mt-1">Established {u.established} · {u.students} students</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 text-xs">🏆 {u.ranking}</Badge>
                  <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 text-xs">{u.courses} Courses</Badge>
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">From ${u.tuitionFrom.toLocaleString()}/yr</Badge>
                </div>
                <p className="text-gray-500 text-xs mt-3 line-clamp-2">{u.description}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1.5">Popular for</p>
                  <div className="flex flex-wrap gap-1">
                    {u.popularFor.slice(0, 3).map((p: string) => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F37021]/5 text-[#F37021] border border-[#F37021]/10">{p}</span>
                    ))}
                  </div>
                </div>
                <Button onClick={() => nav('universities')} variant="outline" size="sm" className="mt-4 w-full rounded-lg border-[#F37021]/30 text-[#F37021] hover:bg-[#F37021] hover:text-white">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4 text-center sm:hidden">
          <Button variant="ghost" onClick={() => nav('universities')} className="text-[#F37021] font-semibold">
            View All Universities <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Section>

      {/* ── 5. Popular Courses ───────────────────────────── */}
      <Section>
        <div className="text-center mb-12">
          <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-3">📚 Popular Courses</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">Explore Popular Courses</h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Find the perfect program that matches your career goals</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((c, i) => (
            <Card key={i} onClick={() => nav('courses')}
              className="group cursor-pointer border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-[#F37021]/10 text-[#F37021] flex items-center justify-center group-hover:bg-[#F37021] group-hover:text-white transition-colors duration-300">
                    {c.icon}
                  </div>
                  <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 text-[10px]">{c.count} programs</Badge>
                </div>
                <h3 className="font-bold text-[#1A2332] mb-2">{c.name}</h3>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>📊 Level: {c.level}</p>
                  <p>⏱ Duration: {c.duration}</p>
                  <p>💰 Fee: {c.fee}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => nav('courses')} variant="outline" className="border-[#F37021] text-[#F37021] hover:bg-[#F37021] hover:text-white rounded-xl px-8">
            Explore All Courses <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* ── 6. How It Works ──────────────────────────────── */}
      <Section className="bg-gray-50">
        <div className="text-center mb-14">
          <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">🚀 Simple Process</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">How It Works</h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Your journey to studying abroad in 4 simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#F37021]/30 via-[#F37021]/50 to-[#F37021]/30" />
          {steps.map(s => (
            <div key={s.num} className="text-center relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F37021] to-[#FFB347] text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#F37021]/25 relative z-10">
                {s.icon}
              </div>
              <span className="text-xs font-bold text-[#F37021] mb-2 block">STEP {s.num}</span>
              <h3 className="text-lg font-bold text-[#1A2332] mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button onClick={() => nav('free-consultation')} className="bg-[#F37021] hover:bg-[#e0621a] text-white rounded-xl px-8 py-6 font-semibold">
            Start Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Section>

      {/* ── 7. Why Choose ALO ────────────────────────────── */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-4">💡 Why ALO</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332] mb-6">
              Why Choose <span className="text-[#F37021]">ALO Education</span>?
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              We are the most trusted education consultancy in Bangladesh, dedicated to making your international education dreams a reality — completely free of charge.
            </p>
            <div className="space-y-4">
              {['Completely free service for students', 'Direct partnerships with 330+ universities', 'Expert counselors with 15+ years experience', 'End-to-end support from application to arrival'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => nav('about')} variant="outline" className="mt-8 border-[#F37021] text-[#F37021] hover:bg-[#F37021] hover:text-white rounded-xl px-6">
              Learn More About Us <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whyFeatures.map((f, i) => (
              <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-xl bg-[#F37021]/10 text-[#F37021] flex items-center justify-center mb-3">{f.icon}</div>
                  <h4 className="font-bold text-[#1A2332] mb-1">{f.title}</h4>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 8. Scholarships Highlight ────────────────────── */}
      <Section className="bg-gray-50">
        <div className="text-center mb-12">
          <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-3">🎓 Scholarships</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">Featured Scholarships</h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Access millions in financial aid to fund your international education</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scholarships.map((s, i) => (
            <Card key={i} onClick={() => nav('scholarships')} className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#F37021] to-[#FFB347]" />
              <CardContent className="p-6">
                <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">{s.deadline}</Badge>
                <h3 className="font-bold text-[#1A2332] text-lg mb-2">{s.name}</h3>
                <p className="text-[#22c55e] font-semibold text-lg mb-1">{s.amount}</p>
                <p className="text-gray-500 text-sm">{s.uni}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => nav('scholarships')} variant="outline" className="border-[#F37021] text-[#F37021] hover:bg-[#F37021] hover:text-white rounded-xl px-8">
            View All Scholarships <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* ── 9. Success Stories ───────────────────────────── */}
      <Section>
        <div className="text-center mb-12">
          <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">⭐ Testimonials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">Success Stories</h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Hear from students who achieved their dreams with ALO Education</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#F37021] text-[#F37021]" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F37021] to-[#FFB347] flex items-center justify-center text-white font-bold text-lg">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A2332]">{t.name}</p>
                    <p className="text-gray-500 text-sm">{t.uni}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button onClick={() => nav('success-stories')} variant="outline" className="border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white rounded-xl px-8">
            Read More Stories <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* ── 10. Statistics Counter ────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1A2332] via-[#0d1b2a] to-[#1A2332] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Our Impact in Numbers</h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">Delivering results that speak for themselves</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {ALO_IMPACT_STATS.map(s => <DarkStatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── 11. Latest Blog Posts ────────────────────────── */}
      <Section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-3">📰 Latest Insights</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">From Our Blog</h2>
          </div>
          <Button variant="ghost" onClick={() => nav('blog')} className="text-[#F37021] font-semibold hidden sm:flex items-center gap-1">
            Visit Blog <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.map((p, i) => (
            <Card key={i} onClick={() => nav('blog')} className="group cursor-pointer border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-gray-300 group-hover:text-[#F37021] transition-colors" />
              </div>
              <CardContent className="p-5">
                <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 text-xs mb-3">{p.cat}</Badge>
                <h3 className="font-bold text-[#1A2332] mb-2 leading-snug group-hover:text-[#F37021] transition-colors">{p.title}</h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{p.excerpt}</p>
                <p className="text-gray-400 text-xs">{p.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-6 sm:hidden">
          <Button variant="ghost" onClick={() => nav('blog')} className="text-[#F37021] font-semibold">Visit Blog <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </Section>

      {/* ── 12. Upcoming Events ──────────────────────────── */}
      <Section className="bg-gray-50">
        <div className="text-center mb-12">
          <Badge className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-3">📅 Events</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332]">Upcoming Events</h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Join our free webinars and seminars to learn more about studying abroad</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((e, i) => (
            <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 text-xs mb-4">{e.type}</Badge>
                <h3 className="font-bold text-[#1A2332] text-lg mb-3">{e.title}</h3>
                <div className="space-y-2 text-sm text-gray-500 mb-5">
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{e.date}</p>
                  <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{e.time}</p>
                </div>
                <Button onClick={() => nav('free-consultation')} className="w-full bg-[#F37021] hover:bg-[#e0621a] text-white rounded-xl">
                  Register Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 13. CTA Section ──────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#F37021] to-[#FFB347] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Ready to Start Your International Education Journey?
          </h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Join 5,000+ Bangladeshi students who have achieved their study abroad dreams with ALO Education
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => nav('free-consultation')} size="lg" className="bg-white text-[#F37021] hover:bg-gray-100 font-bold text-base px-8 py-6 rounded-xl shadow-lg">
              Book Free Consultation <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => nav('contact')} size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold text-base px-8 py-6 rounded-xl">
              <Phone className="mr-2 h-5 w-5" /> Call Us Now
            </Button>
          </div>
        </div>
      </section>

      {/* ── 14. Partner With Us ──────────────────────────── */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-4">🤝 Partner Program</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A2332] mb-4">
              Join <span className="text-[#F37021]">200+ Partner Agencies</span> Worldwide
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Become an ALO Education partner and grow your business while helping students achieve their dreams. Our partnership program offers competitive commissions, training, and full support.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: <DollarSign className="h-5 w-5" />, text: 'Competitive Commissions' },
                { icon: <Headphones className="h-5 w-5" />, text: 'Dedicated Support' },
                { icon: <BookOpen className="h-5 w-5" />, text: 'Training Programs' },
                { icon: <Handshake className="h-5 w-5" />, text: 'Marketing Support' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="text-[#F37021]">{b.icon}</span>
                  <span className="text-sm">{b.text}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => nav('partner-with-alo')} className="bg-[#0066CC] hover:bg-[#0055aa] text-white rounded-xl px-8 py-6 font-semibold">
              Become a Partner <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-[#1A2332] to-[#0066CC]/40 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { num: '200+', label: 'Partner Agencies' },
                  { num: '15+', label: 'Countries' },
                  { num: '50K+', label: 'Students Helped' },
                  { num: '98%', label: 'Satisfaction Rate' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-3xl font-extrabold text-[#F37021]">{s.num}</p>
                    <p className="text-white/70 text-sm mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value)
  return (
    <div ref={ref} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
      <p className="text-2xl md:text-3xl font-extrabold text-white">{count}{suffix}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  )
}

function DarkStatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value)
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-extrabold text-[#F37021]">{count}{suffix}</p>
      <p className="text-gray-400 text-sm mt-2">{label}</p>
    </div>
  )
}
