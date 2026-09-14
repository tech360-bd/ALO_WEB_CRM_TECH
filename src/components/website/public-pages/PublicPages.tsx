'use client';

/* eslint-disable @typescript-eslint/no-require-imports */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowLeft, Search, MapPin, GraduationCap, Award, Users, Building2,
  Phone, Mail, Clock, FileText, Shield, Globe, BookOpen, Star,
} from 'lucide-react';

import FloatingActionWidget from '@/components/website/FloatingActionWidget';
import { usePortalStore } from '@/lib/stores/portal-store';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';

// ============================================================
// SHARED PUBLIC SHELL
// ============================================================
function PublicShell({ title, subtitle, badge, children, heroColor = '#0057B8' }: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  heroColor?: string;
}) {
  const setView = usePortalStore((s) => s.setView);
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-8 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setView('website')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0057B8] mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            {badge && (
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ backgroundColor: `${heroColor}15`, color: heroColor }}
              >
                {badge}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] mb-4">{title}</h1>
            {subtitle && <p className="text-lg text-slate-600 max-w-3xl">{subtitle}</p>}
          </motion.div>
          {children}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// PUBLIC COURSE FINDER — Uses /api/course-finder (real DB)
// ============================================================
export function PublicCourseFinderPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', level: '', subject: '', search: '' });

  useEffect(() => {
    const q = new URLSearchParams(filters).toString();
    fetch(`/api/course-finder?${q}&limit=24`)
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || d.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <PublicShell
      title="Course Finder"
      badge="SEARCH COURSES"
      subtitle="Find the perfect course from top universities across the UK, USA, Canada, Australia, Ireland, New Zealand and Europe."
    >
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-[#0057B8]" /> Filters
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Search</Label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Course name..."
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Country</Label>
              <Select value={filters.country} onValueChange={(v) => setFilters({ ...filters, country: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-10"><SelectValue placeholder="All countries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {['United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland', 'New Zealand', 'Germany'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Study Level</Label>
              <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-10"><SelectValue placeholder="All levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {['Foundation', 'Bachelor', 'Master', 'PhD', 'Diploma'].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              No courses found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">{courses.length} courses found</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map((c: any, i) => (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="p-5 hover:shadow-md transition-shadow h-full">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="bg-blue-50 text-[#0057B8]">
                          {c.studyLevel || c.level || 'Course'}
                        </Badge>
                        {c.tuitionFee && (
                          <span className="text-xs font-semibold text-slate-700">
                            ${(c.tuitionFee / 1000).toFixed(0)}k/yr
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#0F172A] mb-1 line-clamp-2">
                        {c.courseTitle || c.name || c.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {c.universityName || c.university || 'University'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.country || '—'}
                        </span>
                        {c.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {c.duration}
                          </span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

// ============================================================
// DESTINATION PAGE — country-specific guide
// ============================================================
const DESTINATION_DATA: Record<string, any> = {
  'united-kingdom': {
    name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP (£)', language: 'English',
    avgTuition: '£10,000 - £38,000', avgLiving: '£12,000 - £15,000', workHours: '20 hrs/week',
    intake: 'September, January', visaType: 'Student Visa (Tier 4)',
    desc: 'The UK is home to 4 of the world\'s top 10 universities and offers world-class education with rich cultural heritage. International students can work part-time during studies and stay for 2 years post-graduation via the Graduate Route visa.',
    topUnis: ['University of Oxford', 'University of Cambridge', 'Imperial College London', 'UCL', 'University of Edinburgh'],
  },
  'usa': {
    name: 'United States', flag: '🇺🇸', currency: 'USD ($)', language: 'English',
    avgTuition: '$25,000 - $55,000', avgLiving: '$10,000 - $18,000', workHours: '20 hrs/week',
    intake: 'August, January', visaType: 'F-1 Student Visa',
    desc: 'The USA hosts the largest number of top-ranked universities globally, with unmatched research opportunities, diverse programs, and OPT work authorization for up to 3 years post-graduation for STEM fields.',
    topUnis: ['MIT', 'Harvard University', 'Stanford University', 'University of California, Berkeley', 'Columbia University'],
  },
  'canada': {
    name: 'Canada', flag: '🇨🇦', currency: 'CAD ($)', language: 'English/French',
    avgTuition: 'CA$15,000 - CA$35,000', avgLiving: 'CA$10,000 - CA$15,000', workHours: '20 hrs/week',
    intake: 'September, January, May', visaType: 'Study Permit',
    desc: 'Canada offers high-quality education at relatively affordable costs, with a clear path to permanent residency through the Post-Graduation Work Permit (PGWP) program. Known for safety, multiculturalism, and welcoming policies.',
    topUnis: ['University of Toronto', 'University of British Columbia', 'McGill University', 'University of Alberta', 'University of Waterloo'],
  },
  'australia': {
    name: 'Australia', flag: '🇦🇺', currency: 'AUD ($)', language: 'English',
    avgTuition: 'A$20,000 - A$45,000', avgLiving: 'A$21,000', workHours: '48 hrs/fortnight',
    intake: 'February, July', visaType: 'Subclass 500 Student Visa',
    desc: 'Australia boasts 7 universities in the global top 100, with strong industry connections and post-study work rights of 2-4 years. Famous for its quality of life, beautiful landscapes, and diverse student community.',
    topUnis: ['University of Melbourne', 'University of Sydney', 'UNSW Sydney', 'University of Queensland', 'Monash University'],
  },
  'ireland': {
    name: 'Ireland', flag: '🇮🇪', currency: 'EUR (€)', language: 'English',
    avgTuition: '€10,000 - €25,000', avgLiving: '€12,000', workHours: '20 hrs/week',
    intake: 'September, January', visaType: 'Long Stay Study Visa',
    desc: 'Ireland is the European headquarters of major tech companies (Google, Facebook, Apple) offering excellent post-study career opportunities. English-speaking, friendly, and home to top-ranked universities.',
    topUnis: ['Trinity College Dublin', 'University College Dublin', 'University of Galway', 'Dublin City University', 'University of Limerick'],
  },
  'new-zealand': {
    name: 'New Zealand', flag: '🇳🇿', currency: 'NZD ($)', language: 'English',
    avgTuition: 'NZ$22,000 - NZ$35,000', avgLiving: 'NZ$15,000', workHours: '20 hrs/week',
    intake: 'February, July', visaType: 'Student Visa',
    desc: 'New Zealand offers a safe, beautiful environment with globally recognized qualifications. Post-study work visa up to 3 years and clear pathway to residency. Famous for outdoor lifestyle and innovation.',
    topUnis: ['University of Auckland', 'University of Otago', 'Victoria University of Wellington', 'University of Canterbury', 'Massey University'],
  },
  'dubai-uae': {
    name: 'Dubai / UAE', flag: '🇦🇪', currency: 'AED (د.إ)', language: 'English/Arabic',
    avgTuition: 'AED 40,000 - AED 90,000', avgLiving: 'AED 40,000', workHours: 'Part-time allowed',
    intake: 'September, January', visaType: 'Student Residence Visa',
    desc: 'Dubai is a global education hub with branch campuses of top UK, US, and Australian universities. Tax-free economy, strategic location, and growing job market make it an attractive destination.',
    topUnis: ['NYU Abu Dhabi', 'Heriot-Watt University Dubai', 'University of Birmingham Dubai', 'Middlesex University Dubai', 'American University of Sharjah'],
  },
  'germany': {
    name: 'Germany', flag: '🇩🇪', currency: 'EUR (€)', language: 'German/English',
    avgTuition: '€0 - €1,500', avgLiving: '€10,000', workHours: '20 hrs/week',
    intake: 'October, April', visaType: 'Student Visa',
    desc: 'Germany offers free or low-cost education at world-class public universities. Strong engineering and technical programs, with 18-month post-study work visa. Hub for automotive, engineering, and tech industries.',
    topUnis: ['Technical University of Munich', 'Heidelberg University', 'LMU Munich', 'RWTH Aachen University', 'Humboldt University of Berlin'],
  },
};

export function PublicDestinationPage({ slug }: { slug: string | null }) {
  const setPublicPage = usePortalStore((s) => s.setPublicPage);
  const data = slug ? DESTINATION_DATA[slug] : null;

  if (!data) {
    return (
      <PublicShell title="Destinations" subtitle="Choose your study destination">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(DESTINATION_DATA).map(([s, d]) => (
            <Card
              key={s}
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setPublicPage('public-destination', s)}
            >
              <div className="text-4xl mb-3">{d.flag}</div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">{d.name}</h3>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{d.desc}</p>
              <div className="text-xs text-[#0057B8] font-semibold">{d.topUnis.length}+ top universities</div>
            </Card>
          ))}
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title={`${data.flag} Study in ${data.name}`}
      badge="DESTINATION GUIDE"
      subtitle={data.desc}
    >
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[#0057B8] mb-2">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Avg Tuition</span>
          </div>
          <p className="text-lg font-bold text-[#0F172A]">{data.avgTuition}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[#0057B8] mb-2">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Living Cost</span>
          </div>
          <p className="text-lg font-bold text-[#0F172A]">{data.avgLiving}/yr</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[#0057B8] mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Work Rights</span>
          </div>
          <p className="text-lg font-bold text-[#0F172A]">{data.workHours}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card className="p-6">
          <h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0057B8]" /> Visa Information
          </h3>
          <p className="text-sm text-slate-600 mb-2">Visa Type:</p>
          <p className="font-semibold text-[#0F172A] mb-3">{data.visaType}</p>
          <p className="text-sm text-slate-600 mb-2">Main Intake:</p>
          <p className="font-semibold text-[#0F172A]">{data.intake}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#0057B8]" /> Country Info
          </h3>
          <p className="text-sm text-slate-600 mb-2">Currency:</p>
          <p className="font-semibold text-[#0F172A] mb-3">{data.currency}</p>
          <p className="text-sm text-slate-600 mb-2">Language:</p>
          <p className="font-semibold text-[#0F172A]">{data.language}</p>
        </Card>
      </div>

      <h3 className="text-2xl font-bold text-[#0F172A] mb-4">Top Universities in {data.name}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {data.topUnis.map((u: string, i: number) => (
          <Card key={u} className="p-5">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: i === 0 ? '#E8501A' : '#0057B8' }}
              >
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] text-sm">{u}</p>
                <p className="text-xs text-slate-500">{data.name}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-2">Ready to study in {data.name}?</h3>
        <p className="text-blue-100 mb-5">Get free expert guidance from our counselors</p>
        <Button
          onClick={() => setPublicPage('public-consultation')}
          className="bg-[#E8501A] text-white hover:brightness-110"
        >
          Book Free Consultation
        </Button>
      </div>
    </PublicShell>
  );
}

// ============================================================
// UNIVERSITIES PAGE — list from DB
// ============================================================
export function PublicUniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/universities?limit=50&status=active${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      .then((r) => r.json())
      .then((d) => setUniversities(d.universities || d.data || []))
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <PublicShell
      title="Universities"
      badge="150+ PARTNER UNIVERSITIES"
      subtitle="Browse our partner universities worldwide. Find the right fit for your academic goals."
    >
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities by name, country, or city..."
            className="pl-10 h-11"
          />
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading universities...</div>
      ) : universities.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          No universities found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {universities.map((u: any, i) => (
            <motion.div key={u.id || u.universityId || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="p-5 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: '#0057B8' }}
                  >
                    {u.name?.[0] || 'U'}
                  </div>
                  {u.worldRanking && (
                    <Badge variant="secondary" className="bg-orange-50 text-[#E8501A]">
                      Rank #{u.worldRanking}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-1 line-clamp-2">{u.name}</h3>
                <p className="text-sm text-slate-600 mb-3 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {u.city}, {u.country}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  {u.founded && <span>Est. {u.founded}</span>}
                  {u.students && <span>{u.students} students</span>}
                </div>
                {u.ieltsMin && (
                  <div className="text-xs">
                    <span className="text-slate-500">IELTS min: </span>
                    <span className="font-semibold text-[#0057B8]">{u.ieltsMin}</span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}

// ============================================================
// SCHOLARSHIPS PAGE — list from DB
// ============================================================
export function PublicScholarshipsPage() {
  const { MASTER_SCHOLARSHIPS_DATA } = require('@/lib/scholarships-data');
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scholarships?limit=30')
      .then((r) => r.json())
      .then((d) => {
        const fetched = d.scholarships || d.data || [];
        setScholarships(fetched.length > 0 ? fetched : MASTER_SCHOLARSHIPS_DATA);
      })
      .catch(() => setScholarships(MASTER_SCHOLARSHIPS_DATA))
      .finally(() => setLoading(false));
  }, []);

  const displayData = scholarships.length > 0 ? scholarships : MASTER_SCHOLARSHIPS_DATA;

  return (
    <PublicShell
      title="Scholarships & Funding Directory"
      badge="100% VERIFIED FUNDING SCHEMES"
      subtitle="Explore fully funded government scholarships, university merit grants, and tuition fee waivers across the UK, USA, Australia, Canada, Germany, Ireland, and New Zealand."
      heroColor="#E8501A"
    >
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium">Loading verified global scholarships...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayData.map((s: any, i: number) => {
            const slug = s.slug || (s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `scholarship-${i}`);
            return (
              <motion.div key={s.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-6 hover:shadow-lg transition-all h-full flex flex-col justify-between border-slate-200 hover:border-[#0057B8]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge className="bg-orange-50 text-[#E8501A] border-orange-200 font-semibold text-[11px]">
                        {s.coverageType || 'Merit Scholarship'}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        {s.flag} {s.country || s.countryCode || 'Global'}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#0F172A] text-lg mb-2 line-clamp-2">{s.title || s.name}</h3>
                    <p className="text-xs text-[#0057B8] font-semibold mb-3">{s.provider || 'University Partner'}</p>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">{s.description || s.eligibility}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-bold text-slate-900 line-clamp-1">
                      Award: {s.awardAmount || s.amount || 'Varies by degree'}
                    </div>
                    <div className="flex gap-2">
                      <a href={`/scholarships/${slug}`} className="w-full">
                        <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-semibold py-2">
                          View Full Details & Apply →
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PublicShell>
  );
}

// ============================================================
// SERVICES PAGE
// ============================================================
const SERVICES = [
  { icon: GraduationCap, title: 'Personalized Counseling', desc: 'Our experienced counselors provide one-to-one guidance to help you select the course and university that best match your academic background, career goals, and personal strengths.' },
  { icon: Building2, title: 'University Selection', desc: 'We assist students in choosing from top-ranked universities across the UK, USA, Australia, Canada, New Zealand, Ireland and Europe with accurate and up-to-date information.' },
  { icon: FileText, title: 'Application Assistance', desc: 'Full support from completing forms and writing compelling personal statements to organizing necessary documents—ensuring every application stands out.' },
  { icon: Shield, title: 'Visa Guidance', desc: 'Our visa experts guide students through requirements, documentation, and interview preparation to help ensure a smooth and successful visa approval process.' },
  { icon: BookOpen, title: 'Test Preparation', desc: 'Support for IELTS, TOEFL, GRE, and GMAT preparation with coaching classes, practice materials, and expert guidance to achieve competitive scores.' },
  { icon: Award, title: 'Financial Planning', desc: 'Our advisors help explore scholarships, grants, and funding options to make international education more affordable and manageable for every student.' },
  { icon: Globe, title: 'Pre-Departure Orientation', desc: 'Orientation sessions covering cultural adaptation, travel arrangements, accommodation, and health insurance, ensuring students are confident and ready.' },
  { icon: Users, title: 'Post-Arrival Support', desc: 'Our support continues after arrival with assistance in settling in, academic guidance, and connecting with other students to feel at home.' },
  { icon: Star, title: 'Career Counseling', desc: 'Guidance on career opportunities, internships, and further studies through our professional network and alumni connections.' },
  { icon: BookOpen, title: 'Ongoing Mentorship', desc: 'Continuous support throughout your entire study abroad journey, from application to graduation and beyond.' },
];

export function PublicServicesPage() {
  const { MASTER_SERVICES_DATA } = require('@/lib/services-data');
  const setPublicPage = usePortalStore((s) => s.setPublicPage);

  return (
    <PublicShell
      title="Our 10 Comprehensive Services"
      badge="END-TO-END STUDY ABROAD ADVISORY"
      subtitle="We are committed to guiding Bangladeshi students on their journey to study abroad with confidence and success. Explore our 10 comprehensive services designed for every stage of your international education."
      heroColor="#0057B8"
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {MASTER_SERVICES_DATA.map((s: any, i: number) => (
          <motion.div key={s.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="bg-white hover:shadow-xl transition-all border-slate-200 hover:border-[#0057B8] flex flex-col justify-between overflow-hidden rounded-2xl h-full">
              <div>
                <div className="h-44 w-full overflow-hidden relative">
                  <img src={s.heroImage} alt={s.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/60 text-white backdrop-blur-md border-0 text-[11px] font-bold">
                      SERVICE 0{i + 1}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">{s.shortDesc}</p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <a href={`/services/${s.slug}`} className="block w-full">
                  <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                    Explore Full Service Details & Process →
                  </Button>
                </a>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-2xl p-8 text-white text-center shadow-lg">
        <h3 className="text-2xl font-bold mb-2">Get Started Today</h3>
        <p className="text-blue-100 mb-5 text-sm">Schedule a free 1-on-1 consultation with our senior education advisors</p>
        <a href="/eligibility-check">
          <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] font-bold text-xs px-6 py-3 rounded-xl shadow-md">
            Book Free Consultation
          </Button>
        </a>
      </div>
    </PublicShell>
  );
}

// ============================================================
// ABOUT PAGE
// ============================================================
export function PublicAboutPage() {
  return (
    <PublicShell
      title="About ALO Education"
      badge="ESTABLISHED 2023"
      subtitle="In February 2023, ALO Education was founded by Taslima Akter, who envisioned creating a platform that would connect ambitious students with world-class education opportunities abroad."
    >
      <div className="prose prose-slate max-w-none mb-12">
        <p className="text-base text-slate-700 leading-relaxed mb-6">
          That same year, our first office opened in Dhaka, Bangladesh, with an initial focus on
          assisting students in Bangladesh to secure admissions into leading universities and colleges
          in the UK, USA, Australia, Canada, New Zealand, Ireland and Europe. Guided by the founder's
          vision of trust, transparency, and professionalism, we set a clear strategy to expand our
          services beyond Bangladesh. Today, ALO Education continues to grow with the mission of offering
          global opportunities and becoming a trusted partner in international education consultancy.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <h3 className="text-xl font-bold text-[#0057B8] mb-3">Our Mission</h3>
          <p className="text-slate-700 leading-relaxed">
            At ALO Education, our mission is simple yet powerful: turning student dreams into global
            opportunities. We strive to be a trusted pathway to world-class education, guiding every
            student with honesty, professionalism, and care. By offering transparent counseling and
            authentic guidance, we help students choose the right programs that match their ambitions
            and potential.
          </p>
        </Card>
        <Card className="p-8 bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <h3 className="text-xl font-bold text-[#E8501A] mb-3">Our Vision</h3>
          <p className="text-slate-700 leading-relaxed">
            The vision of ALO Education is to become a globally recognized education consultancy that
            inspires trust, integrity, and excellence. We aspire to guide students toward courses and
            institutions that best suit their academic interests, career goals, and personal growth.
            Our focus is on nurturing the holistic development of students by enhancing their knowledge,
            skills, and confidence so they can thrive in a competitive world.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { num: '2023', label: 'Established' },
          { num: '7', label: 'Study destinations' },
          { num: '360+', label: 'University partners' },
          { num: '8,800+', label: 'Courses listed' },
        ].map((stat) => (
          <Card key={stat.label} className="p-6 text-center">
            <p className="text-3xl font-bold text-[#0057B8] mb-1">{stat.num}</p>
            <p className="text-xs text-slate-600">{stat.label}</p>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
}

// ============================================================
// SUCCESS STORIES PAGE
// ============================================================
export function PublicSuccessStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/website/success-stories')
      .then((r) => r.json())
      .then((d) => setStories(d.stories || []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  const fallback = [
    {
      name: 'Tushar Imran Nahid',
      course: 'BSc Business Management',
      university: 'Ravensbourne University London',
      quote: 'I have recently received my UK student visa for my BSc in Business Management with International Year at Ravensbourne University London. Due to some technical issues, the process took a little longer than expected and both I and my family were quite stressed. However, ALO Education Consultancy gave me full support, courage, and proper guidance throughout the entire journey. I am extremely satisfied with their service and professionalism. I highly recommend everyone to apply for their visa through ALO Education. They are simply the best!',
    },
    {
      name: 'Ummaye Mayesha Mannan',
      course: 'MRes Leadership and Management',
      university: 'University of Derby',
      quote: 'I recently received my UK student visa for Master of Research in Leadership and Management at University of Derby. ALO Education Consultancy provided full support, guidance, and encouragement throughout. I\'m extremely satisfied with their professionalism and highly recommend their services.',
    },
  ];

  const data = stories.length > 0 ? stories : fallback;

  return (
    <PublicShell
      title="Success Stories"
      badge="VOICES OF OUR STUDENTS"
      subtitle="Real stories from students who achieved their dreams of studying abroad with ALO Education."
      heroColor="#E8501A"
    >
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading stories...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {data.map((s: any, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-7 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#0057B8] to-[#003d80] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {s.name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">{s.name}</h3>
                    <p className="text-sm text-[#0057B8]">{s.course || s.program}</p>
                    <p className="text-xs text-slate-500">Now studying at {s.university}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-[#E8501A] text-[#E8501A]" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">"{s.quote || s.testimonial}"</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}

// ============================================================
// TEAM PAGE
// ============================================================
export function PublicTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/website/team-members')
      .then((r) => r.json())
      .then((d) => setTeam(d.members || []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, []);

  const fallback = [
    { name: 'Taslima Akter', role: 'Founder & CEO', bio: 'Visionary leader with a passion for making international education accessible to all students.' },
    // Other team members are loaded from the database via the TeamMember table.
    // If the database has no team members, only the founder is shown.
  ];

  const data = team.length > 0 ? team : fallback;

  return (
    <PublicShell
      title="Meet Our Expert Team"
      badge="DEDICATED PROFESSIONALS"
      subtitle="Our dedicated professionals are here to guide you every step of the way."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((m: any, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="p-6 text-center hover:shadow-md transition-shadow h-full">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#0057B8] to-[#003d80] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                {m.name?.[0] || 'A'}
              </div>
              <h3 className="font-bold text-[#0F172A]">{m.name}</h3>
              <p className="text-sm text-[#0057B8] mb-3">{m.role || m.position}</p>
              <p className="text-xs text-slate-600">{m.bio || m.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </PublicShell>
  );
}

// ============================================================
// FAQS PAGE
// ============================================================
const FALLBACK_FAQS = [
  { q: 'How do I start my study abroad journey with ALO Education?', a: 'Simply book a free consultation through our website or visit our Dhaka office. Our counselors will assess your academic background, career goals, and preferences to create a personalized plan.' },
  { q: 'Is your service free for students?', a: 'Yes, our core consulting services are free for students. We are commissioned by partner universities, so students don\'t pay for university selection, application guidance, or visa counseling.' },
  { q: 'What English tests do you help with?', a: 'We provide support for IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo English Test, OIETC/ELLT, Oxford ELLT, LanguageCert, Kaplan English Test, OET, GRE, GMAT, SAT, and ACT preparation.' },
  { q: 'Which countries do you help students apply to?', a: 'We assist students applying to universities in the United Kingdom, United States, Canada, Australia, Ireland, New Zealand, Dubai/UAE, and Germany.' },
  { q: 'Do you help with visa applications?', a: 'Yes, our visa experts guide you through the entire visa process including documentation, financial requirements, and interview preparation for all major study destinations.' },
  { q: 'Can you help me find scholarships?', a: 'Absolutely. Our advisors help identify scholarship opportunities based on your academic profile, destination country, and chosen program. We also assist with scholarship application essays.' },
  { q: 'What is the typical application timeline?', a: 'We recommend starting 6-12 months before your intended intake. September intakes usually require applications by January-March, while January intakes need applications by August-October.' },
  { q: 'Do you provide post-arrival support?', a: 'Yes, our support continues after you arrive. We help with settling in, accommodation guidance, academic counseling, and connecting you with other students and alumni.' },
];

export function PublicFaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/website/faqs')
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const data = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  return (
    <PublicShell
      title="Frequently Asked Questions"
      badge="HELP CENTER"
      subtitle="Find answers to common questions about studying abroad with ALO Education."
    >
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading FAQs...</div>
      ) : (
        <Card className="p-6 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {data.map((f: any, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold text-[#0F172A]">
                  {f.question || f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-700 leading-relaxed">
                  {f.answer || f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}
    </PublicShell>
  );
}

// ============================================================
// CONTACT PAGE
// ============================================================
export function PublicContactPage() {
  return (
    <PublicShell
      title="Contact Us"
      badge="GET IN TOUCH"
      subtitle="We're here to help. Reach out to us through any of these channels."
    >
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="p-8">
          <Phone className="h-8 w-8 text-[#0057B8] mb-4" />
          <h3 className="font-bold text-[#0F172A] mb-2">Phone</h3>
          <p className="text-2xl font-bold text-[#0057B8] mb-1">+88 01805020101-10</p>
          <p className="text-sm text-slate-600">Sat-Thu: 10 AM - 6 PM</p>
        </Card>
        <Card className="p-8">
          <Mail className="h-8 w-8 text-[#E8501A] mb-4" />
          <h3 className="font-bold text-[#0F172A] mb-2">Email</h3>
          <p className="text-2xl font-bold text-[#E8501A] mb-1">info@aloeducation.com</p>
          <p className="text-sm text-slate-600">Available 24/7</p>
        </Card>
      </div>

      <Card className="p-8 mb-8">
        <div className="flex items-start gap-4">
          <MapPin className="h-8 w-8 text-[#0057B8] shrink-0" />
          <div>
            <h3 className="font-bold text-[#0F172A] mb-2">Bangladesh Office</h3>
            <p className="text-slate-700 leading-relaxed">
              Barek Mansion-02 (5th Floor)<br />
              58/9 Box Culvert Road, Panthapath<br />
              Dhaka-1205, Bangladesh
            </p>
            <p className="text-sm text-slate-500 mt-3">Hours: Sat-Thu: 10 AM - 6 PM</p>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <Phone className="h-8 w-8 text-[#25D366] shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-green-900 mb-2">WhatsApp</h3>
            <p className="text-sm text-green-800 mb-4">Quick response on WhatsApp</p>
            <a href="https://wa.me/8801805020101" target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#25D366] text-white hover:brightness-110">
                Chat Now
              </Button>
            </a>
          </div>
        </div>
      </Card>
    </PublicShell>
  );
}

// ============================================================
// LEGAL PAGES — Privacy / Terms / Cookies
// ============================================================
export function PublicLegalPage({ type }: { type: 'privacy' | 'terms' | 'cookies' | 'communication' | 'lead-data' | 'user-guide' | 'accessibility' }) {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'Information We Collect', p: 'We collect information you provide directly when you book consultations, register for an account, or contact us. This includes your name, email, phone number, academic background, and study preferences.' },
        { h: 'How We Use Your Information', p: 'Your information is used to provide counseling services, process applications, communicate with universities, and improve our services. We never sell your data to third parties.' },
        { h: 'Data Security', p: 'We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal information from unauthorized access.' },
        { h: 'Your Rights', p: 'You have the right to access, update, or delete your personal data. Contact us at info@aloeducation.com to exercise these rights.' },
        { h: 'Cookies', p: 'We use essential cookies to operate our website and analytical cookies to improve user experience. See our Cookie Policy for details.' },
      ],
    },
    terms: {
      title: 'Terms of Service',
      badge: 'LEGAL',
      sections: [
        { h: 'Service Description', p: 'ALO Education provides educational consulting services including university selection, application assistance, visa guidance, and test preparation support for students seeking to study abroad.' },
        { h: 'User Responsibilities', p: 'Users agree to provide accurate information, comply with application deadlines, and follow university and visa requirements. Students are responsible for their academic performance and visa decisions.' },
        { h: 'Service Availability', p: 'While we strive to provide continuous service availability, we are not liable for temporary outages, technical issues, or third-party service disruptions.' },
        { h: 'Limitation of Liability', p: 'ALO Education is not liable for university admission decisions, visa approvals/denials, or any indirect damages arising from our consulting services.' },
        { h: 'Governing Law', p: 'These terms are governed by the laws of Bangladesh. Any disputes will be resolved in Dhaka, Bangladesh.' },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'What Are Cookies', p: 'Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and analyze website traffic.' },
        { h: 'Types of Cookies We Use', p: 'Essential cookies (required for website function), Analytical cookies (help us understand usage patterns), and Preference cookies (remember your settings).' },
        { h: 'Managing Cookies', p: 'You can control cookies through your browser settings. Disabling essential cookies may affect website functionality.' },
        { h: 'Third-Party Cookies', p: 'We use Google Analytics and similar tools that may set their own cookies. These are governed by their respective privacy policies.' },
        { h: 'Updates', p: 'This policy may be updated periodically. We will notify users of significant changes via email or website notification.' },
      ],
    },
    communication: {
      title: 'Communication Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'Channels', p: 'We contact you only on channels you consented to: WhatsApp (01805020100), SMS, Email, Phone, Portal messages. Facebook/Instagram only if you messaged our page.' },
        { h: 'Consent & Opt-out', p: 'Consent captured at lead creation. Reply STOP on WhatsApp/SMS, Unsubscribe in email, or toggle in portal. Opt-out honored within 24h; transactional CAS/visa messages may still be sent where legally required.' },
        { h: 'SLA & After-hours', p: 'Counselor 30 min → Branch Manager 30m → CEO +20m → Urgent +10m. After-hours 18:00-10:00 Asia/Dhaka queues with one acknowledgement, no duplicate.' },
        { h: 'Templates & AI drafts', p: 'Templates versioned in CommunicationTemplate, require approval if requiresApproval. AI drafts are AI → human approval → send with riskLevel.' },
        { h: 'Recording & B2B', p: 'Calls may be recorded with consent (CallLog). Recordings stored privately outside public_html. Partner isolation server-enforced by partner_id.' },
      ],
    },
    'lead-data': {
      title: 'Lead Data Usage Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'What We Collect', p: 'LeadId AE-YYYY000001 + name, phone, email, preferred country/course, budget, English test, CGPA, source, utm, notes. WhatsApp/Facebook linked to LeadOutreach + Thread.' },
        { h: 'Lawful Basis & Purpose', p: 'Consent + Legitimate interest. Used for contact attempts (3/7/14/21/25/30 day), counseling, shortlisting, visa, analytics. Never sold.' },
        { h: 'Lifecycle & Retention', p: 'New → Contact Attempted → Contacted → Consultation → Qualified → Student Created → Enrolled → Closed (25 stages). Active 24 months, closed 7 years then anonymized.' },
        { h: 'Your Rights', p: 'Access, correction, deletion, export, withdraw. Email info@aloeducation.com with Lead/Student ID. Soft-delete + audit. Response within 30 days.' },
        { h: 'B2B Attribution', p: 'TYPE1 inbound: partner provides student visibility per privacy setting. TYPE2 outbound: ALO submits with attribution. Partner sees only own records.' },
      ],
    },
    'user-guide': {
      title: 'User Guide',
      badge: 'HELP',
      sections: [
        { h: 'Student Portal', p: 'AE-YYYY000001 via OTP → complete profile → shortlist via Course Finder → upload docs privately → track Application→Offer→Deposit→CAS/I-20→Visa→Enrolled in Timeline.' },
        { h: 'Partner Portal', p: 'AEP-YYYY0000 → refer student → track applications & docs → view own commissions → message & support.' },
        { h: 'Employee / Counselor', p: 'ALO-EMP-YYYY0001 activation → dashboard SLA 30/20/10 pipeline → private notes (students never see) → attendance/leave/payroll.' },
        { h: 'Admin / Super Admin', p: 'Executive dashboard → manage users/roles/permissions (57+17) → approve universities/broadcasts → audit/health/cron/backup outside public_html.' },
        { h: 'Tips', p: 'Forgot password → OTP/email reset. Notifications Email+WhatsApp+In-App. Documents allowlist pdf/jpg/png/doc/docx 20MB random names. Health /health public.' },
      ],
    },
    accessibility: {
      title: 'Accessibility Statement',
      badge: 'ACCESSIBILITY',
      sections: [
        { h: 'Commitment', p: 'We aim for WCAG 2.1 AA across https://aloeducation.com — semantic HTML, landmarks, skip links, heading hierarchy.' },
        { h: 'Visual', p: 'Contrast ≥4.5:1 (#0057B8/#E8501A on white), alt text, aria-hidden decorative, zoom 200% without horizontal scroll.' },
        { h: 'Keyboard & Screen Reader', p: 'All interactive elements via Tab/Enter/Space, visible focus ring, associated label + aria-describedby errors, NVDA/JAWS conventions.' },
        { h: 'Limitations', p: 'Third-party embeds (Maps/Facebook) may not be fully AA — we provide text address, WhatsApp 01805020100, phone fallbacks.' },
        { h: 'Feedback', p: 'Email info@aloeducation.com with URL + issue. Acknowledge within 2 working days, fix prioritized, review every 6 months.' },
      ],
    },
  }[type];

  return (
    <PublicShell title={content.title} badge={content.badge} subtitle="Last updated: 2026">
      <Card className="p-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          {content.sections.map((s, i) => (
            <div key={i}>
              <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-blue-50 text-[#0057B8] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {s.h}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed pl-8">{s.p}</p>
            </div>
          ))}
        </div>
      </Card>
    </PublicShell>
  );
}

// ============================================================
// LANGUAGE PREP / ENGLISH TEST PAGE
// ============================================================
export function PublicLanguagePrepPage({ slug }: { slug: string | null }) {
  const { getTestPrepBySlug, MASTER_TEST_PREP_DATA } = require('@/lib/test-prep-data');
  const MasterTestPrepView = require('@/components/website/MasterTestPrepView').default;

  if (slug) {
    const testData = getTestPrepBySlug(slug);
    if (testData) {
      return <MasterTestPrepView test={testData} />;
    }
  }

  const tests = Object.values(MASTER_TEST_PREP_DATA);

  return (
    <PublicShell
      title="Language & Admission Test Preparation"
      badge="ALO STUDY ABROAD LANGUAGE PREPARATION CENTRE"
      subtitle="Prepare for English proficiency and admission tests with ALO Education's certified test coaches, score planners, and direct CRM integration."
      heroColor="#0057B8"
    >
      <div className="flex justify-between items-center mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <div>
          <h3 className="font-bold text-[#0057B8] text-base">Comprehensive Test Preparation Directory</h3>
          <p className="text-xs text-slate-600">Select an exam below to explore all 28 modules, score benchmarks, fee structures, and study timelines.</p>
        </div>
        <a href="/english-test-prep">
          <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm">
            View All Test Prep →
          </Button>
        </a>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((t: any) => (
          <Card key={t.id} className="p-6 bg-white hover:shadow-lg transition-all border-slate-200 hover:border-[#0057B8] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge className="bg-orange-50 text-[#E8501A] font-semibold text-[11px]">
                  {t.logoBadge}
                </Badge>
                <span className="text-xs font-semibold text-slate-500">{t.quickInfo.duration}</span>
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-1">{t.name}</h3>
              <p className="text-xs text-[#0057B8] font-semibold mb-3">{t.officialOwner}</p>
              <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">{t.overview.whatIsIt}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Exam Fee in BD:</span>
                <span className="font-bold text-slate-900">{t.quickInfo.cost}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Target Score:</span>
                <span className="font-bold text-[#0057B8]">{t.expectedScore}</span>
              </div>
              <a href={`/english-test-prep/${t.slug}`} className="block w-full">
                <Button className="w-full bg-[#0057B8] text-white hover:bg-[#003d80] text-xs font-bold py-2.5 rounded-xl">
                  Explore Full Test Prep & Modules →
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
}

// ============================================================
// RESOURCES / VISA READINESS pages
// ============================================================
export function PublicResourcesPage() {
  const RESOURCES = [
    { icon: BookOpen, title: 'Blogs', desc: 'Latest insights on studying abroad, university life, and career tips.' },
    { icon: FileText, title: 'Articles', desc: 'In-depth guides on applications, visas, scholarships, and more.' },
    { icon: Award, title: 'Scholarships by Country', desc: 'Find funding opportunities for your destination.' },
    { icon: Shield, title: 'Visa Guides', desc: 'Step-by-step visa application guides for every destination.' },
    { icon: Star, title: 'Success Stories', desc: 'Read inspiring stories from students who studied abroad.' },
    { icon: FileText, title: 'Application Tips', desc: 'Expert advice on crafting winning applications.' },
    { icon: Globe, title: 'Pre-Departure Guides', desc: 'Everything you need to know before you fly.' },
    { icon: Building2, title: 'Accommodation Support', desc: 'Find safe, affordable housing abroad.' },
    { icon: Award, title: 'Financial Planning', desc: 'Budget, banking, and funding strategies.' },
    { icon: BookOpen, title: 'FAQs', desc: 'Quick answers to common questions.' },
  ];
  return (
    <PublicShell
      title="Resources"
      badge="KNOWLEDGE HUB"
      subtitle="Comprehensive resources to guide your study abroad journey."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {RESOURCES.map((r, i) => {
          const Icon = r.icon;
          return (
            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-[#0057B8]" />
              </div>
              <h3 className="font-bold text-[#0F172A] mb-2">{r.title}</h3>
              <p className="text-sm text-slate-600">{r.desc}</p>
            </Card>
          );
        })}
      </div>
    </PublicShell>
  );
}

export function PublicVisaReadinessPage() {
  return (
    <PublicShell
      title="Visa Readiness"
      badge="VISA PREPARATION"
      subtitle="Comprehensive visa preparation support for all major study destinations."
    >
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {[
          { country: '🇬🇧 UK', visa: 'Student Visa (Tier 4)', processing: '3-15 working days', fee: '£490' },
          { country: '🇺🇸 USA', visa: 'F-1 Student Visa', processing: '3-30 working days', fee: '$350' },
          { country: '🇨🇦 Canada', visa: 'Study Permit', processing: '4-8 weeks', fee: 'CA$150' },
          { country: '🇦🇺 Australia', visa: 'Subclass 500', processing: '2-4 weeks', fee: 'A$710' },
        ].map((v, i) => (
          <Card key={i} className="p-6">
            <h3 className="text-2xl mb-2">{v.country}</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Visa Type: </span><span className="font-semibold">{v.visa}</span></div>
              <div><span className="text-slate-500">Processing Time: </span><span className="font-semibold">{v.processing}</span></div>
              <div><span className="text-slate-500">Application Fee: </span><span className="font-semibold text-[#E8501A]">{v.fee}</span></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-8 bg-gradient-to-r from-[#0057B8] to-[#003d80] text-white text-center">
        <h3 className="text-2xl font-bold mb-2">Need Visa Help?</h3>
        <p className="text-blue-100 mb-5">Our visa experts will guide you through the entire process</p>
        <Button className="bg-[#E8501A] text-white hover:brightness-110">Book Visa Consultation</Button>
      </Card>
    </PublicShell>
  );
}

export function PublicUniversityDetail({ slug }: { slug: string | null }) {
  const [uni, setUni] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeCourseLevel, setActiveCourseLevel] = useState<string>('all');
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    const cleanSlug = decodeURIComponent(slug).toLowerCase().replace(/-/g, ' ');

    fetch(`/api/universities?search=${encodeURIComponent(cleanSlug)}&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        const found = d.universities?.[0];
        if (found) {
          setUni(found);
        } else {
          const { ukUniversitiesPart1 } = require('@/lib/university-data-uk');
          const { ukUniversitiesPart2 } = require('@/lib/university-data-uk2');
          const { allIntlUniversities } = require('@/lib/university-data-intl');
          const allStatic = [...ukUniversitiesPart1, ...ukUniversitiesPart2, ...allIntlUniversities];
          const matched = allStatic.find(
            (u: any) =>
              u.name.toLowerCase() === cleanSlug ||
              u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug.replace(/[^a-z0-9]/g, '')
          ) || allStatic[0];
          setUni(matched);
        }
      })
      .catch(() => {
        const { ukUniversitiesPart1 } = require('@/lib/university-data-uk');
        setUni(ukUniversitiesPart1[0]);
      })
      .finally(() => setLoading(false));

    fetch(`/api/course-finder?search=${encodeURIComponent(cleanSlug)}&limit=1000`)
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || d.data || []))
      .catch(() => setCourses([]));
  }, [slug]);

  if (loading) {
    return (
      <PublicShell title="Loading University Master Profile..." badge="UNIVERSITY DIRECTORY">
        <div className="p-16 text-center text-slate-500 font-medium">Loading official university data...</div>
      </PublicShell>
    );
  }

  const u = uni || {
    name: slug ? slug.replace(/-/g, ' ').toUpperCase() : 'University Profile',
    city: 'Main Campus',
    country: 'United Kingdom',
    worldRanking: 150,
    founded: 1950,
    type: 'Recognized Higher Education Institution',
    ieltsMin: 6.5,
    tuitionRange: '£14,000 - £28,000',
    intlStudents: '8,500+',
    totalStudents: '25,000+',
    scholarships: true,
    website: 'https://www.aloeducation.com',
    subjects: ['Business', 'Computer Science', 'Engineering', 'Medicine', 'Law'],
  };

  const formattedName = u.name || 'University Profile';
  const country = u.country || 'UK';
  const city = u.city || 'Main Campus';
  const websiteUrl = u.website || `https://www.google.com/search?q=${encodeURIComponent(formattedName)}`;

  const faqs = [
    { q: `How can I apply to ${formattedName}?`, a: `You can apply directly through ALO Education. Our expert counselors will verify your academic documents, assist with Statement of Purpose (SOP), and submit your application with priority tracking.` },
    { q: `What courses are available at ${formattedName}?`, a: `${formattedName} offers a wide range of degree programs across Foundation, Bachelor's, Top-up, Taught Master's, MRes, MPhil, and PhD research degrees in fields like Business, Computing, Engineering, and Health Sciences.` },
    { q: `What is the tuition fee range at ${formattedName}?`, a: `Tuition fees generally range from ${u.tuitionRange || '£13,000 to £28,000 per year'} depending on the program level, lab requirements, and study location.` },
    { q: `What intakes are available at ${formattedName}?`, a: `Primary intakes are September/October (Fall) and January/February (Spring). Selected postgraduate programs also offer May/June intakes.` },
    { q: `What English test score is required for ${formattedName}?`, a: `Minimum IELTS Academic score is typically ${u.ieltsMin || '6.0 to 6.5'} (with no band below 5.5 to 6.0). PTE Academic, TOEFL iBT, Duolingo, and MOI letters are also accepted depending on university policy.` },
    { q: `Are scholarships available for international students at ${formattedName}?`, a: `Yes! Merit-based scholarships ranging from £1,000 to £5,000 or up to 50% tuition reduction are available for eligible South Asian and international applicants.` },
    { q: `Can I apply to ${formattedName} with a study gap?`, a: `Yes, study gaps of 2 to 5+ years are accepted provided you submit valid work experience certificates, training documentation, or a detailed study gap explanation.` },
    { q: `Can ALO Education help me write an SOP for ${formattedName}?`, a: `Absolutely. ALO Education provides personalized SOP review and guidance to ensure your Statement of Purpose meets university and visa compliance requirements.` },
    { q: `Can I compare ${formattedName} with another university?`, a: `Yes! Use the ALO Education Compare tool (/compare) to evaluate ${formattedName} side-by-side with up to 3 other universities on fees, IELTS, and post-study work rights.` },
    { q: `How long does an application decision take at ${formattedName}?`, a: `Conditional offer letters are typically issued within 1 to 3 weeks following complete document submission.` },
    { q: `What is the CAS / Deposit requirement for ${formattedName}?`, a: `After receiving an offer, students pay a tuition deposit (usually £2,000 - £5,000 or 50%) to request the CAS letter for UK Student Visa processing.` },
    { q: `What documents are required to apply to ${formattedName}?`, a: `You will need your Passport, High School / Bachelor's Certificates and Transcripts, English Test Score, CV, Statement of Purpose (SOP), and 2 Reference Letters.` },
    { q: `Does ${formattedName} offer placement or internship options?`, a: `Many undergraduate and postgraduate courses include an optional 1-year industrial placement or internship module.` },
    { q: `What post-study work rights are available after graduating from ${formattedName}?`, a: `Graduates are eligible for the 2-Year Graduate Route Post-Study Work Visa in the UK (or equivalent post-study work permits in Canada, Australia, USA).` },
    { q: `How do I book a free consultation for ${formattedName}?`, a: `Click the "Talk to Counselor" button or visit /book-consultation to speak with an ALO Education senior advisor immediately.` },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <a href="/" className="hover:text-[#0057B8]">Home</a>
            <span>›</span>
            <a href="/universities" className="hover:text-[#0057B8]">Universities</a>
            <span>›</span>
            <span className="text-slate-700 font-semibold">{country}</span>
            <span>›</span>
            <span className="text-[#0057B8] font-bold">{formattedName}</span>
          </nav>

          {/* SECTION 1: HERO */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-8 md:p-10 text-white mb-10 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className="bg-[#E8501A] text-white font-bold text-xs px-3 py-1 uppercase tracking-wider">
                  Verified Partner University
                </Badge>
                <span className="text-xs font-semibold bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
                  QS Rank #{u.worldRanking || 'Top 200'}
                </span>
                <span className="text-xs text-blue-200">Last Verified: August 2026</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">{formattedName}</h1>
              <p className="text-lg text-blue-100 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#FFB347]" /> {city}, {country} • Established {u.founded || '1900'}
              </p>

              {/* HERO ACTION BUTTONS */}
              <div className="flex flex-wrap gap-3 mb-8">
                <a href="/eligibility-check">
                  <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] font-bold text-sm px-6 py-3 shadow-lg">
                    Apply Through ALO
                  </Button>
                </a>
                <a href="#available-courses">
                  <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-sm">
                    View Courses ({courses.length > 0 ? courses.length : 'All Levels'})
                  </Button>
                </a>
                <a href="/compare">
                  <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-sm">
                    Compare University
                  </Button>
                </a>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold text-sm flex items-center gap-1.5">
                    <Globe className="h-4 w-4" /> Official Website
                  </Button>
                </a>
              </div>

              {/* HERO CARDS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-6 border-t border-white/15 text-xs">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">Country</p>
                  <p className="font-bold text-white text-sm">{country}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">City</p>
                  <p className="font-bold text-white text-sm line-clamp-1">{city}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">Popular Intakes</p>
                  <p className="font-bold text-[#FFB347] text-sm">Sep / Jan</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">Tuition Range</p>
                  <p className="font-bold text-white text-sm line-clamp-1">{u.tuitionRange || '£14k - £28k'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">English Tests</p>
                  <p className="font-bold text-white text-sm">IELTS, PTE, DET</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">Scholarships</p>
                  <p className="font-bold text-emerald-300 text-sm">Up to £5,000</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">App Status</p>
                  <p className="font-bold text-emerald-300 text-sm">Open 2026/27</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <p className="text-blue-200 text-[10px] uppercase font-semibold">Verification</p>
                  <p className="font-bold text-white text-sm">Source Verified</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ABOUT UNIVERSITY */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-[#0057B8]" /> About {formattedName}
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
              <p>
                {formattedName} is a leading global institution located in {city}, {country}. Recognized for its academic excellence, cutting-edge research facilities, and vibrant international community, the university attracts students from over 120 countries worldwide.
              </p>
              <p>
                <strong>Academic Strengths:</strong> Key faculties include Business & Management, Computer Science & AI, Engineering, Health Sciences, Law, and Social Sciences. Programs are designed in consultation with industry leaders to provide students with practical skills and career readiness.
              </p>
              <p>
                <strong>International Student Support:</strong> ALO Education works directly with {formattedName} to provide Bangladeshi students with full support—including pre-CAS interviews, document verification, SOP review, and scholarship guidance.
              </p>
            </div>
          </Card>

          {/* SECTION 2.5: BRANCH CAMPUSES & LOCATIONS */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200 bg-gradient-to-br from-blue-50/50 to-white">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#E8501A]" /> Official Branch Campuses & Study Locations
            </h2>
            <p className="text-xs text-slate-500 mb-6">Explore all main and international branch campuses for {formattedName}</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <Badge className="bg-[#0057B8] text-white">Main Flagship Campus</Badge>
                <h3 className="font-bold text-sm text-slate-900">{city} Main Campus</h3>
                <p className="text-slate-600 leading-relaxed">Primary research facilities, central student union, libraries, and full degree offerings.</p>
                <div className="text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100">Intakes: September & January</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <Badge className="bg-[#E8501A] text-white">Metropolitan Campus</Badge>
                <h3 className="font-bold text-sm text-slate-900">{country === 'UK' ? 'London Study Center' : 'Metropolitan Branch'}</h3>
                <p className="text-slate-600 leading-relaxed">Specialized business, computing, and professional master's programs in the heart of the financial district.</p>
                <div className="text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100">Intakes: September, January & May</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <Badge className="bg-emerald-700 text-white">International Branch</Badge>
                <h3 className="font-bold text-sm text-slate-900">Dubai / Global International Campus</h3>
                <p className="text-slate-600 leading-relaxed">Transnational education option offering identical degree certificates with lower living costs.</p>
                <div className="text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100">Intakes: January, May & September</div>
              </div>
            </div>
          </Card>

          {/* SECTION 3: AVAILABLE COURSES */}
          <div id="available-courses" className="mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">Available Courses & Programs</h2>
                <p className="text-xs text-slate-500">Explore degree options matched to your academic background</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'Foundation', 'Bachelor', 'Master', 'PhD'].map((lvl) => (
                  <Button
                    key={lvl}
                    size="sm"
                    variant={activeCourseLevel === lvl ? 'default' : 'outline'}
                    onClick={() => setActiveCourseLevel(lvl)}
                    className={activeCourseLevel === lvl ? 'bg-[#0057B8] text-white' : 'text-slate-600'}
                  >
                    {lvl === 'all' ? 'All Levels' : lvl}
                  </Button>
                ))}
              </div>
            </div>

            {/* Course search bar */}
            <div className="mb-5">
              <input
                type="text"
                placeholder="Search courses by name, subject or degree level..."
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/40"
              />
            </div>

            {/* Course count summary */}
            {(() => {
              const uniSubjects = (u.subjects && u.subjects.length > 0)
                ? u.subjects
                : ['Business & Management', 'Computer Science', 'Engineering', 'Health Sciences', 'Law'];

              const { generateCourses } = require('@/lib/university-courses-uk');
              let displayCourses = (courses && courses.length >= 5)
                ? courses
                : generateCourses(u.name || 'University', city, uniSubjects, u.tuitionRange || '£14,500', u.ieltsMin || 6.5);

              let filtered = activeCourseLevel === 'all'
                ? displayCourses
                : displayCourses.filter((c: any) => (c.studyLevel || '').toLowerCase().includes(activeCourseLevel.toLowerCase()));

              if (courseSearchQuery.trim()) {
                const q = courseSearchQuery.toLowerCase();
                filtered = filtered.filter((c: any) =>
                  (c.courseTitle || '').toLowerCase().includes(q) ||
                  (c.studyLevel || '').toLowerCase().includes(q) ||
                  (c.faculty || '').toLowerCase().includes(q) ||
                  (c.department || '').toLowerCase().includes(q)
                );
              }

              return (
                <>
                  <p className="text-xs text-slate-500 mb-4 font-semibold">
                    Showing <span className="text-[#0057B8] font-bold">{filtered.length}</span> of{' '}
                    <span className="text-[#0057B8] font-bold">{displayCourses.length}</span> courses across{' '}
                    <span className="font-bold text-slate-700">{uniSubjects.length} faculties</span>
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((c: any, idx: number) => (
                      <Card key={c.courseCode || c.id || idx} className="p-5 hover:shadow-lg transition-shadow border-slate-200 bg-white flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant="secondary" className={
                              c.studyLevel === 'Foundation' || c.studyLevel === 'International Year One' || c.studyLevel === 'Pre-Masters'
                                ? 'bg-amber-50 text-amber-700 text-[10px] font-bold'
                                : c.studyLevel === 'Bachelor' || c.studyLevel === 'Top-up'
                                  ? 'bg-blue-50 text-[#0057B8] text-[10px] font-bold'
                                  : c.studyLevel === 'Master' || c.studyLevel === 'MBA'
                                    ? 'bg-emerald-50 text-emerald-700 text-[10px] font-bold'
                                    : 'bg-purple-50 text-purple-700 text-[10px] font-bold'
                            }>
                              {c.studyLevel || 'Degree'}
                            </Badge>
                            <span className="text-[10px] font-semibold text-slate-400">{c.courseCode || `ALO-${1000 + idx}`}</span>
                          </div>

                          <h3 className="font-bold text-[#0F172A] text-sm mb-1.5 line-clamp-2">
                            {c.courseTitle || c.name}
                          </h3>

                          {c.faculty && (
                            <p className="text-[10px] text-slate-400 font-medium mb-1.5 line-clamp-1">🏛️ {c.faculty}</p>
                          )}

                          <div className="space-y-0.5 text-[11px] text-slate-600 mb-2">
                            <p>📅 <strong>Duration:</strong> {c.durationMonths ? `${c.durationMonths} months` : c.duration || 'Full-time'}</p>
                            <p>💷 <strong>Tuition:</strong> {c.tuitionFeePerYear || c.tuitionFee || u.tuitionRange || '£14,500/yr'}</p>
                            <p>📋 <strong>Intakes:</strong>{' '}
                              {c.intakes
                                ? (Array.isArray(c.intakes)
                                  ? c.intakes.map((i: any) => i.intakeName || i).join(' • ')
                                  : c.intakes)
                                : 'Sep 2026 • Jan 2027 • May 2027'
                              }
                            </p>
                            <p>⏰ <strong>Deadline:</strong>{' '}
                              {c.intakes && Array.isArray(c.intakes) && c.intakes[0]?.lastApplicationDate
                                ? c.intakes[0].lastApplicationDate
                                : c.deadline || '15 Jul 2026 (Sep) • 15 Nov 2026 (Jan)'
                              }
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-semibold mb-2">
                            <span className="bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-full">
                              IELTS {c.ieltsOverall || c.ielts || u.ieltsMin || 6.0}+
                            </span>
                            <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              PTE {c.pteMin || 59}+
                            </span>
                            {c.studyMode && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.studyMode}</span>
                            )}
                          </div>

                          {c.careerOutcomes && Array.isArray(c.careerOutcomes) && c.careerOutcomes.length > 0 && (
                            <p className="text-[10px] text-slate-500 line-clamp-1">🎯 <strong>Careers:</strong> {c.careerOutcomes.slice(0, 3).join(', ')}</p>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex gap-2">
                          <a href="/eligibility-check" className="flex-1">
                            <Button size="sm" className="w-full bg-[#E8501A] text-white hover:bg-[#d44315] text-[11px] font-bold">
                              Apply Now
                            </Button>
                          </a>
                          {c.officialUrl && (
                            <a href={c.officialUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="text-[11px] font-semibold border-slate-200">
                                View Details
                              </Button>
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* SECTION 4: ENTRY REQUIREMENTS */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#0057B8]" /> Entry Requirements by Academic Level
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <Badge className="bg-[#0057B8] text-white mb-3">Undergraduate / Bachelor's</Badge>
                <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                  <li>HSC / A-Levels: Minimum 60-65% overall score or GPA 3.0/4.0.</li>
                  <li>English: IELTS 6.0 - 6.5 (Min 5.5 per component).</li>
                  <li>PTE Academic (54-62) / Duolingo (105-115) accepted.</li>
                  <li>Valid Passport & Statement of Purpose (SOP).</li>
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <Badge className="bg-[#E8501A] text-white mb-3">Postgraduate / Master's</Badge>
                <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                  <li>4-Year Bachelor's Degree with minimum 55-60% or CGPA 2.75+.</li>
                  <li>English: IELTS 6.5 (Min 6.0 per component).</li>
                  <li>2 Academic / Professional Reference Letters (LOR).</li>
                  <li>CV & Detailed Personal Statement.</li>
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <Badge className="bg-purple-700 text-white mb-3">Research / PhD</Badge>
                <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                  <li>Master's Degree with Merit/Distinction (CGPA 3.25+).</li>
                  <li>English: IELTS 7.0 (Min 6.5 per component).</li>
                  <li>Approved Research Proposal (1,500-2,500 words).</li>
                  <li>Supervisor Acceptance / Interview clearance.</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* SECTION 5: TUITION, DEPOSIT & SCHOLARSHIP */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-[#E8501A]" /> Tuition Fees, Deposit & Scholarships
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100">
                <p className="text-xs font-semibold text-[#0057B8] uppercase mb-1">Average Tuition Fee</p>
                <p className="text-xl font-extrabold text-slate-900">{u.tuitionRange || '£14,000 - £26,000 / year'}</p>
              </div>
              <div className="p-5 rounded-xl bg-orange-50/50 border border-orange-100">
                <p className="text-xs font-semibold text-[#E8501A] uppercase mb-1">CAS Tuition Deposit</p>
                <p className="text-xl font-extrabold text-slate-900">£2,000 - £5,000</p>
              </div>
              <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Scholarship Award</p>
                <p className="text-xl font-extrabold text-slate-900">£1,000 - £5,000</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic bg-slate-100 p-3 rounded-lg">
              * Note: Fees and scholarship availability are subject to change by the university. Confirm official figures with your ALO counselor prior to application submission.
            </p>
          </Card>

          {/* SECTION 6: APPLICATION PROCESS */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Application Process Pipeline</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Check Eligibility', desc: 'Verify GPA, IELTS, and entry criteria with ALO.' },
                { step: '02', title: 'Select Program', desc: 'Choose your desired course and intake.' },
                { step: '03', title: 'Submit Documents', desc: 'Upload transcripts, passport, and SOP.' },
                { step: '04', title: 'Receive Offer', desc: 'Get conditional or unconditional offer letter.' },
                { step: '05', title: 'Pay Deposit', desc: 'Secure deposit to issue CAS / I-20.' },
                { step: '06', title: 'Visa File Prep', desc: 'Prepare bank statement and visa file.' },
                { step: '07', title: 'Visa Submission', desc: 'Submit visa application and biometrics.' },
                { step: '08', title: 'Pre-Departure', desc: 'Book flight, accommodation, and travel.' },
              ].map((s) => (
                <div key={s.step} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xl font-black text-[#0057B8]">{s.step}</span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{s.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 7: REQUIRED DOCUMENTS */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#0057B8]" /> Required Document Checklist
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 text-xs text-slate-700">
              {['Valid Passport (Min 6 months)', 'SSC & HSC / Degree Certificates', 'Official Academic Transcripts', 'IELTS / PTE / Duolingo Scorecard', 'Statement of Purpose (SOP)', '2 Academic Reference Letters', 'Updated CV / Resume', 'Work Experience Letter (if applicable)', 'Bank Solvency & Financial Evidence'].map((doc) => (
                <div key={doc} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4 text-[#0057B8] shrink-0" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
            <a href="/student/documents">
              <Button className="bg-[#0057B8] text-white text-xs">Upload Documents in Student Portal →</Button>
            </a>
          </Card>

          {/* SECTION 8: AI HELP TOOLS */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200 bg-gradient-to-br from-blue-50/40 to-orange-50/40">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4">AI Tools for {formattedName}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <a href="/eligibility-check" className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0057B8] transition-colors block">
                <h4 className="font-bold text-[#0057B8] mb-1">1. Check Admission Eligibility</h4>
                <p className="text-slate-600">Instantly evaluate your GPA & IELTS score.</p>
              </a>
              <a href="/course-finder" className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0057B8] transition-colors block">
                <h4 className="font-bold text-[#0057B8] mb-1">2. Smart Course Matcher</h4>
                <p className="text-slate-600">Find best-matching courses at this university.</p>
              </a>
              <a href="/student/sop" className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0057B8] transition-colors block">
                <h4 className="font-bold text-[#0057B8] mb-1">3. AI SOP Assistant</h4>
                <p className="text-slate-600">Generate structured Statement of Purpose draft.</p>
              </a>
              <a href="/student/mock-tests" className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0057B8] transition-colors block">
                <h4 className="font-bold text-[#0057B8] mb-1">4. Interview Practice Studio</h4>
                <p className="text-slate-600">Practice pre-CAS & credibility interview questions.</p>
              </a>
              <a href="/student/documents" className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0057B8] transition-colors block">
                <h4 className="font-bold text-[#0057B8] mb-1">5. Auto Document Checklist</h4>
                <p className="text-slate-600">Generate personalized application checklist.</p>
              </a>
              <a href="/compare" className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0057B8] transition-colors block">
                <h4 className="font-bold text-[#0057B8] mb-1">6. Compare Universities</h4>
                <p className="text-slate-600">Compare {formattedName} side-by-side.</p>
              </a>
            </div>
          </Card>

          {/* SECTION 9: 15 FAQS */}
          <Card className="p-8 mb-10 shadow-sm border-slate-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-semibold text-slate-900 text-sm">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-slate-600 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          {/* SECTION 10: FINAL CTA */}
          <div className="bg-gradient-to-r from-[#0057B8] to-[#003d80] rounded-3xl p-10 text-white text-center shadow-xl">
            <h2 className="text-3xl font-extrabold mb-3">Apply to {formattedName} Today</h2>
            <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-sm">
              Take the first step toward your international education. Talk to an ALO counselor or submit your application online.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/eligibility-check">
                <Button className="bg-[#E8501A] text-white hover:bg-[#d44315] font-bold text-sm px-8 py-3.5">
                  Check Eligibility
                </Button>
              </a>
              <a href="/book-consultation">
                <Button variant="outline" className="bg-white text-[#0057B8] hover:bg-blue-50 font-bold text-sm px-8 py-3.5">
                  Talk to Counselor
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function PublicCourseDetail({ slug }: { slug: string | null }) {
  return (
    <PublicShell
      title={`Course Details: ${slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Overview'}`}
      badge="COURSE CATALOGUE"
      subtitle="Full entry criteria, IELTS score requirements, tuition fees, and application guidance."
    >
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Program Overview</h3>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              Detailed entry requirements, academic prerequisites, English language waivers, deposit requirements, and post-study career opportunities for international students.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium">Study Level</p>
                <p className="text-sm font-semibold text-slate-900">Undergraduate / Postgraduate Taught</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Duration</p>
                <p className="text-sm font-semibold text-slate-900">1 to 3 Years (Full-Time)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">English Language Requirement</p>
                <p className="text-sm font-semibold text-[#0057B8]">IELTS 6.5 (Min 6.0 components)</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Application Deadline</p>
                <p className="text-sm font-semibold text-[#E8501A]">Open for Upcoming Intake</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Academic Entry Requirements</h3>
            <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
              <li>High School Certificate (HSC) / A-Levels or Bachelor's Degree from a recognized institution.</li>
              <li>Minimum GPA equivalent: 3.0 / 4.0 or 60% overall score.</li>
              <li>Proof of English Proficiency (IELTS Academic, PTE, Duolingo, or MOI letter where accepted).</li>
              <li>Valid Passport & Statement of Purpose (SOP).</li>
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-2 border-[#0057B8]/20 bg-gradient-to-br from-blue-50/30 to-white">
            <h3 className="font-bold text-[#0F172A] mb-2 text-lg">Apply for this Course</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Start your application with ALO Education for full application support and visa counseling.
            </p>
            <div className="space-y-2.5">
              <a href="/eligibility-check" className="block w-full">
                <Button className="w-full bg-[#E8501A] text-white hover:brightness-110 text-xs py-2.5">
                  Check Your Eligibility
                </Button>
              </a>
              <a href="/book-consultation" className="block w-full">
                <Button variant="outline" className="w-full text-xs py-2.5 border-[#0057B8] text-[#0057B8] hover:bg-blue-50">
                  Talk to ALO Counselor
                </Button>
              </a>
            </div>
          </Card>

          <TestPreparationMiniCard
            contextTitle="Need English Preparation for this Course?"
            recommendedTest="IELTS 6.5 / PTE 58+"
            targetScore="Minimum Band 6.0 in each skill"
          />
        </div>
      </div>
    </PublicShell>
  );
}

export function PublicComparePage() {
  return (
    <PublicShell
      title="Course & University Comparison Matrix"
      badge="SHORTLIST COMPARISON"
      subtitle="Compare up to 4 courses side-by-side on tuition, IELTS scores, duration, and post-study work rights."
    >
      <Card className="p-8 space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Side-by-Side Comparison</h3>
        <p className="text-slate-600 text-sm">
          Select courses from the Course Finder to evaluate entry requirements, scholarships, and deposit deadlines.
        </p>
        <div className="pt-4 flex gap-3">
          <a href="/course-finder"><Button className="bg-[#E8501A] text-white text-xs">Add Courses to Compare</Button></a>
        </div>
      </Card>
    </PublicShell>
  );
}

export function PublicFooter() {
  return (
    <footer className="w-full bg-[#0F172A] text-slate-300 pt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-xs">
        
        {/* COL 1: ALO BRAND & SOCIAL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0057B8] text-white flex items-center justify-center font-black text-sm">
              ALO
            </div>
            <span className="text-white font-black text-lg tracking-tight">ALO Education</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            From your ambition to admission, we’re with you all the way.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://facebook.com/aloeducation"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0057B8] hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a
              href="https://instagram.com/aloeducation"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E8501A] hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a
              href="https://linkedin.com/company/aloeducation"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0057B8] hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a
              href="https://youtube.com/@aloeducation"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600 hover:text-white transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>

        {/* COL 2: DESTINATIONS */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Destinations</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="/destinations/uk" className="hover:text-white transition">United Kingdom</a></li>
            <li><a href="/destinations/usa" className="hover:text-white transition">United States</a></li>
            <li><a href="/destinations/australia" className="hover:text-white transition">Australia</a></li>
            <li><a href="/destinations/canada" className="hover:text-white transition">Canada</a></li>
            <li><a href="/destinations/new-zealand" className="hover:text-white transition">New Zealand</a></li>
            <li><a href="/destinations/ireland" className="hover:text-white transition">Europe & Ireland</a></li>
          </ul>
        </div>

        {/* COL 3: QUICK LINKS */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Quick Links</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="/course-finder" className="hover:text-white transition">Course Finder</a></li>
            <li><a href="/services" className="hover:text-white transition">Services</a></li>
            <li><a href="/language-prep" className="hover:text-white transition">English Test Prep</a></li>
            <li><a href="/blog" className="hover:text-white transition">Blogs & Insights</a></li>
            <li><a href="/scholarships" className="hover:text-white transition">Scholarships</a></li>
          </ul>
        </div>

        {/* COL 4: COMPANY */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Company</h4>
          <ul className="space-y-2 text-slate-400">
            <li><a href="/about" className="hover:text-white transition">About Us</a></li>
            <li><a href="/team" className="hover:text-white transition">Expert Team</a></li>
            <li><a href="/contact" className="hover:text-white transition">Find Us</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact Us</a></li>
            <li><a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a></li>
          </ul>
        </div>

      </div>

      {/* GRADUATION CAP ANIMATION STRIP */}
      <div className="w-full overflow-hidden py-6 mt-12 border-t border-slate-800 bg-[#0a101d] relative">
        <div className="flex gap-12 whitespace-nowrap animate-[marquee_25s_linear_infinite] motion-reduce:animate-none">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2 text-[#E8501A] opacity-100 rotate-[-5deg]">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
                Admission Success
              </span>
              <span className="flex items-center gap-2 text-[#0057B8] opacity-70 rotate-[4deg]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
                Scholarship Granted
              </span>
              <span className="flex items-center gap-2 text-slate-400 opacity-40 rotate-[-2deg]">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
                Visa Decision Approved
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM FOOTER BAR (#F5F5F5) */}
      <div className="w-full bg-[#F5F5F5] text-slate-700 py-4 px-4 text-xs border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            © {new Date().getFullYear()} ALO Education. All Rights Reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px] font-semibold text-slate-600">
            <a href="/terms" className="hover:text-slate-900 transition">Terms of Service</a>
            <a href="/privacy-policy" className="hover:text-slate-900 transition">Privacy Policy</a>
            <a href="/cookies" className="hover:text-slate-900 transition">Cookie Policy</a>
          </div>
        </div>
      </div>

      <FloatingActionWidget />
    </footer>
  );
}
