'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  X,
  ChevronDown,
  Star,
  MapPin,
  GraduationCap,
  Users,
  Globe,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Award,
  BookOpen,
  Plane,
  FileText,
  Sparkles,
  CheckCircle2,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ALO_UNIVERSITIES, ALO_DESTINATIONS, ALO_HERO_STATS } from '@/lib/alo-data'

interface AloPublicSiteProps {
  onLogin: () => void
}

const destinations = [
  { name: 'United Kingdom', slug: 'uk', color: '#0057B8', count: '150+ Universities' },
  { name: 'Canada', slug: 'canada', color: '#E8501A', count: '90+ Universities' },
  { name: 'Australia', slug: 'australia', color: '#10B981', count: '40+ Universities' },
  { name: 'Dubai', slug: 'dubai', color: '#F59E0B', count: '30+ Universities' },
  { name: 'Ireland', slug: 'ireland', color: '#8B5CF6', count: '20+ Universities' },
  { name: 'New Zealand', slug: 'new-zealand', color: '#06B6D4', count: '25+ Universities' },
  { name: 'United States', slug: 'usa', color: '#0057B8', count: '200+ Universities' },
]

const services = [
  {
    icon: GraduationCap,
    title: 'Personalized Counseling',
    desc: 'Our experienced counselors provide one-to-one guidance to help you select the course and university that best match your academic background, career goals, and personal strengths.',
  },
  {
    icon: Globe,
    title: 'University Selection',
    desc: 'We assist students in choosing from top-ranked universities across the UK, USA, Australia, Canada, New Zealand, Ireland and Europe with accurate and up-to-date information.',
  },
  {
    icon: FileText,
    title: 'Application Assistance',
    desc: 'Full support from completing forms and writing compelling personal statements to organizing necessary documents—ensuring every application stands out.',
  },
  {
    icon: Plane,
    title: 'Visa Guidance',
    desc: 'Our visa experts guide students through requirements, documentation, and interview preparation to help ensure a smooth and successful visa approval process.',
  },
  {
    icon: BookOpen,
    title: 'Test Preparation',
    desc: 'Support for IELTS, TOEFL, GRE, and GMAT preparation with coaching classes, practice materials, and expert guidance to achieve competitive scores.',
  },
  {
    icon: Award,
    title: 'Financial Planning',
    desc: 'Our advisors help explore scholarships, grants, and funding options to make international education more affordable and manageable for every student.',
  },
  {
    icon: Sparkles,
    title: 'Pre-Departure Orientation',
    desc: 'Orientation sessions covering cultural adaptation, travel arrangements, accommodation, and health insurance, ensuring students are confident and ready.',
  },
  {
    icon: CheckCircle2,
    title: 'Post-Arrival Support',
    desc: 'Our support continues after arrival with assistance in settling in, academic guidance, and connecting with other students to feel at home.',
  },
]

// Real ALO partner universities (Greenwich, Coventry, East London, De Montfort,
// Roehampton, BPP, Ulster, Portsmouth) — sourced from the central alo-data file.
const featuredUniversities = ALO_UNIVERSITIES.filter((u) => u.partner).slice(0, 8)

const testimonials = [
  {
    name: 'Tushar Imran Nahid',
    course: 'BSc Business Management',
    university: 'Ravensbourne University London',
    quote:
      'I have recently received my UK student visa for my BSc in Business Management with International Year at Ravensbourne University London. ALO Education Consultancy gave me full support, courage, and proper guidance throughout the entire journey. They are simply the best!',
  },
  {
    name: 'Ummaye Mayesha Mannan',
    course: 'MRes Leadership and Management',
    university: 'University of Derby',
    quote:
      'I recently received my UK student visa for Master of Research in Leadership and Management at University of Derby. ALO Education Consultancy provided full support, guidance, and encouragement throughout. I highly recommend their services.',
  },
]

const team = [
  { name: 'Taslima Akter', role: 'Founder & CEO', desc: 'Visionary leader with a passion for making international education accessible to all students.' },
  { name: 'Sarah Johnson', role: 'Head of Admissions', desc: 'Expert in university applications with 10+ years of experience in international education.' },
  { name: 'Michael Chen', role: 'Visa & Immigration Specialist', desc: 'Dedicated to ensuring smooth visa processes for all students with expertise in global immigration.' },
  { name: 'Emily Rodriguez', role: 'Career Counselor', desc: 'Passionate about guiding students to achieve their career goals through education.' },
]

export default function AloPublicSite({ onLogin }: AloPublicSiteProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginDropdown, setLoginDropdown] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
              >
                ALO
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-slate-900">ALO Education</span>
                <span className="text-[11px] text-slate-500">Study Abroad • CRM • Portals</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">Home</Link>
              <div className="relative group">
                <button className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8] flex items-center gap-1">
                  Destinations <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute top-full left-0 w-64 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2">
                    {destinations.map((d) => (
                      <Link
                        key={d.slug}
                        href="#destinations"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50"
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm font-medium text-slate-700">Study in {d.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Link href="#course-finder" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">Course Finder</Link>
              <Link href="#services" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">Services</Link>
              <Link href="#universities" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">Universities</Link>
              <Link href="#stories" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">Success Stories</Link>
              <Link href="#about" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">About</Link>
              <Link href="#contact" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#0057B8]">Contact</Link>
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative hidden lg:block">
                <button
                  onClick={onLogin}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#0057B8] flex items-center gap-1"
                >
                  Login <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={onLogin}
                className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
              >
                Book Free Consultation
              </Button>
              <button
                className="lg:hidden p-2 text-slate-700"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="#destinations" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Destinations</Link>
            <Link href="#course-finder" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Course Finder</Link>
            <Link href="#services" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Services</Link>
            <Link href="#universities" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Universities</Link>
            <Link href="#stories" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>Success Stories</Link>
            <Link href="#about" className="block px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>About</Link>
            <button onClick={() => { setMenuOpen(false); onLogin() }} className="block w-full text-left px-3 py-2 text-sm font-semibold text-[#0057B8]">Login</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d1b2a] via-[#1A2332] to-[#0057B8]/40">
        {/* Subtle radial dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #E8501A 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Soft glow blobs */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#E8501A]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#0057B8]/30 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 lg:px-6 text-center py-20 lg:py-32">
          {/* Top badge */}
          <Badge className="mb-6 bg-[#E8501A]/20 text-[#FFB347] border-[#E8501A]/30 hover:bg-[#E8501A]/20">
            <Sparkles className="h-3 w-3 mr-1" /> #1 Education Consultancy in Bangladesh
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Your Future Starts Here
            <br />
            Study Abroad in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8501A] to-[#FFB347]">
              Top Global Universities
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg md:text-xl font-semibold text-white/90">
            Empowering Students to Reach Global Heights
          </p>
          <p className="mt-3 text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Expert guidance for studying in UK, USA, Canada, Australia, Ireland, Germany,
            New Zealand, Malaysia &amp; Europe — from application to arrival.
          </p>

          {/* Dual CTA buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onLogin}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            >
              Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLogin}
              className="border-white/40 text-white hover:bg-white/10"
            >
              Find Courses
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12">
            {ALO_HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center"
              >
                <div className="text-2xl md:text-3xl font-extrabold text-white">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust pill row */}
          <div className="mt-12">
            <p className="text-sm text-white/70 mb-4">
              Trusted partnerships with leading UK &amp; global universities
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['British Council', 'UCAS', 'UKVI', 'QS Rankings', 'THE Rankings'].map((pill) => (
                <span
                  key={pill}
                  className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 font-semibold"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section id="destinations" className="py-16 lg:py-24 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-3 bg-[#FFF7ED] text-[#E8501A] hover:bg-[#FFF7ED] border-0">Top Destinations</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              Start your journey with the right destination
            </h2>
            <p className="mt-3 text-slate-600">—and the right advice</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {destinations.map((d) => (
              <Card
                key={d.slug}
                className="p-6 hover:shadow-xl transition-all cursor-pointer group border-0 shadow-sm"
              >
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${d.color}15` }}
                >
                  <MapPin className="h-6 w-6" style={{ color: d.color }} />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{d.name}</h3>
                <p className="text-xs text-slate-500">{d.count}</p>
                <p className="text-xs text-slate-500">10,000+ Students Placed</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-3 bg-[#EFF6FF] text-[#0057B8] hover:bg-[#EFF6FF] border-0">Our Services</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              Welcome to ALO Education
            </h2>
            <p className="mt-3 text-slate-600">
              We are committed to guiding students on their journey to study abroad with
              confidence and success.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.title} className="p-6 hover:shadow-xl transition-all border-0 shadow-sm">
                  <div className="h-12 w-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-[#0057B8]" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 lg:py-24 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-3 bg-[#FFF7ED] text-[#E8501A] hover:bg-[#FFF7ED] border-0">About Us</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Built on trust, transparency, and professionalism
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              In February 2023, ALO Education was founded by Taslima Akter, who envisioned
              creating a platform that would connect ambitious students with world-class
              education opportunities abroad. That same year, our first office opened in
              Dhaka, Bangladesh.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Guided by the founder&apos;s vision of trust, transparency, and
              professionalism, we set a clear strategy to expand our services beyond
              Bangladesh. Today, ALO Education continues to grow with the mission of
              offering global opportunities.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <Card className="p-5 border-0 shadow-sm">
                <h3 className="font-bold text-[#0057B8] mb-2">Our Mission</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Turning student dreams into global opportunities through honest,
                  professional guidance.
                </p>
              </Card>
              <Card className="p-5 border-0 shadow-sm">
                <h3 className="font-bold text-[#E8501A] mb-2">Our Vision</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To become a globally recognized education consultancy that inspires trust
                  and excellence.
                </p>
              </Card>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl">
              <div
                className="h-full w-full flex items-center justify-center text-white p-8"
                style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}
              >
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">2023</div>
                  <div className="text-xl">Founded</div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-3xl font-bold">10k+</div>
                      <div className="text-sm opacity-90">Students</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">150+</div>
                      <div className="text-sm opacity-90">Universities</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Universities */}
      <section id="universities" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-end justify-between mb-12 gap-4">
            <div>
              <Badge className="mb-3 bg-[#EFF6FF] text-[#0057B8] hover:bg-[#EFF6FF] border-0">Featured Universities</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Partner with the best</h2>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Direct ALO partnerships mean faster offers, exclusive scholarships, and dedicated support for Bangladeshi students.
              </p>
            </div>
            <Button variant="outline" className="hidden sm:flex border-[#0057B8] text-[#0057B8]">
              View All Universities <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredUniversities.map((u) => (
              <Card key={u.slug} className="p-6 hover:shadow-xl transition-all border-0 shadow-sm cursor-pointer flex flex-col">
                {/* Top row: emoji logo + partner badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-2xl">
                    {u.logo}
                  </div>
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> ALO PARTNER
                  </Badge>
                </div>

                {/* University name */}
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{u.name}</h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{u.city}, {u.country}</span>
                </div>

                {/* Established + students */}
                <p className="text-xs text-slate-400 mb-3">
                  Established {u.established} · {u.students} students
                </p>

                {/* Badge row: ranking, courses, tuition */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="bg-[#EFF6FF] text-[#0057B8] hover:bg-[#EFF6FF] border-0 text-[11px]">
                    #{u.ranking}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-0 text-[11px]">
                    {u.courses} Courses
                  </Badge>
                  <Badge variant="secondary" className="bg-[#FFF7ED] text-[#E8501A] hover:bg-[#FFF7ED] border-0 text-[11px]">
                    From ${u.tuitionFrom.toLocaleString()}/yr
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
                  {u.description}
                </p>

                {/* Popular for */}
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Popular for</p>
                  <div className="flex flex-wrap gap-1">
                    {u.popularFor.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="stories" className="py-16 lg:py-24 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-3 bg-[#FFF7ED] text-[#E8501A] hover:bg-[#FFF7ED] border-0">Success Stories</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Voices of Our Students</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-8 border-0 shadow-sm">
                <Quote className="h-10 w-10 text-[#0057B8]/20 mb-4" />
                <p className="text-slate-700 leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center text-white font-bold">
                    {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.course}</div>
                    <div className="text-xs text-[#0057B8] font-medium">Now studying at {t.university}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="mb-3 bg-[#EFF6FF] text-[#0057B8] hover:bg-[#EFF6FF] border-0">Our Team</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Meet Our Expert Team</h2>
            <p className="mt-3 text-slate-600">Our dedicated professionals are here to guide you every step of the way</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m) => (
              <Card key={m.name} className="p-6 text-center border-0 shadow-sm hover:shadow-xl transition-all">
                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center text-white text-xl font-bold mb-4">
                  {m.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <h3 className="font-bold text-slate-900">{m.name}</h3>
                <p className="text-sm text-[#0057B8] font-medium mb-2">{m.role}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center text-white">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-lg text-white/90 mb-8">
            Get personalized guidance from our expert counselors. Schedule a free consultation today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" onClick={onLogin} className="bg-white text-[#0057B8] hover:bg-slate-100 border-0">
              Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="tel:+8801805020101" className="flex items-center gap-2 text-white hover:text-white/80">
              <Phone className="h-5 w-5" /> +88 018050-20101-10
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Bangladesh Office</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Barek Mansion-02 (5th Floor)<br />
                58/9 Box Culvert Road, Panthapath<br />
                Dhaka-1205, Bangladesh
              </p>
            </Card>
            <Card className="p-6 border-0 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-[#FFF7ED] flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-[#E8501A]" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Contact</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <a href="tel:+8801805020101" className="hover:text-[#0057B8]">+88 018050-20101-10</a><br />
                <a href="mailto:info@aloeducation.com" className="hover:text-[#0057B8]">info@aloeducation.com</a>
              </p>
            </Card>
            <Card className="p-6 border-0 shadow-sm">
              <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Office Hours</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sat–Thu: 10 AM – 6 PM<br />
                Friday: Closed<br />
                Available 24/7 online
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #0057B8, #E8501A)' }}>
                  ALO
                </div>
                <span className="text-lg font-bold text-white">ALO Education</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empowering students worldwide to achieve their international education dreams
                through personalized guidance and support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#about" className="hover:text-white">About Us</Link></li>
                <li><Link href="#services" className="hover:text-white">Services</Link></li>
                <li><Link href="#universities" className="hover:text-white">Universities</Link></li>
                <li><Link href="#stories" className="hover:text-white">Success Stories</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Destinations</h4>
              <ul className="space-y-2 text-sm">
                {destinations.slice(0, 5).map((d) => (
                  <li key={d.slug}><Link href="#destinations" className="hover:text-white">Study in {d.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Portals</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={onLogin} className="hover:text-white">Student Portal</button></li>
                <li><button onClick={onLogin} className="hover:text-white">Partner Portal</button></li>
                <li><button onClick={onLogin} className="hover:text-white">Employee CRM</button></li>
                <li><Link href="#course-finder" className="hover:text-white">Course Finder</Link></li>
                <li><Link href="#contact" className="hover:text-white">Book Consultation</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-400">
            <p>© 2026 ALO Education. All Rights Reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white">Privacy Policy</Link>
              <Link href="#" className="hover:text-white">Terms of Service</Link>
              <Link href="#" className="hover:text-white">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
