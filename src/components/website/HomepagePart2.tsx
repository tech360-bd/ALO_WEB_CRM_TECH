'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  fadeUp, fadeIn, scaleUp, slideFromLeft, slideFromRight,
  staggerContainer, staggerItem, staggerItemScale,
  sectionTitle, sectionSubtitle, viewportOnce, gradients,
} from './animations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Eye, Brain, GraduationCap, FileText, PenTool,
  ClipboardCheck, MessageSquare, CheckCircle, MonitorSmartphone,
  MessageCircle, Award, Search, Upload, FileCheck, CreditCard,
  Plane, Globe, Briefcase, Rocket, Heart, DollarSign, BookOpen,
  MapPin, ArrowRight, Clock, UserCheck, LucideIcon,
  Building2, Compass, Landmark, Stethoscope, Database,
  BarChart3, Lightbulb, Shield, Handshake, ListChecks,
} from 'lucide-react';

const C = {
  blue: '#0057B8',
  orange: '#E8501A',
  text: '#0F172A',
  textSoft: '#64748B',
  bg: '#F8FAFC',
  border: '#E2E8F0',
};

interface HomeService {
  id: string;
  title: string;
  slug: string;
  icon: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
}

interface ParsedCountry {
  id: string;
  name: string;
  slug: string;
  popularCities: string[];
  popularIntakes: string[];
  studyLevels: string[];
  visaType: string;
  tuitionRange: string;
  livingCost: string;
  workRights: string;
}

interface CourseItem {
  id: string;
  courseTitle: string;
  universityName: string;
  country: string;
  city: string;
  studyLevel: string;
  subjectArea: string;
  durationMonths: number | null;
  tuitionCurrency: string;
  yearlyTuition: number | null;
  intakeMonth: string;
}

interface UniItem {
  universityId: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  website: string;
  courseCount: number;
}

const iconMap: Record<string, LucideIcon> = {
  Users, Eye, Brain, GraduationCap, FileText, PenTool,
  ClipboardCheck, MessageSquare, CheckCircle, MonitorSmartphone,
  MessageCircle, Award, Search, Upload, FileCheck, CreditCard,
  Plane, Globe, Briefcase, Rocket, Heart, DollarSign, BookOpen,
  MapPin, ArrowRight, Clock, UserCheck, Building2, Compass,
  Landmark, Stethoscope, Database, BarChart3, Lightbulb, Shield,
  Handshake, ListChecks,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] || Globe;
}

const WHY_CHOOSE = [
  { Icon: Users, title: 'Expert Counselors', desc: 'Certified advisors with first-hand study abroad experience across 7+ countries.' },
  { Icon: Eye, title: 'Transparent Process', desc: 'Real-time application tracking with full visibility into every step.' },
  { Icon: Brain, title: 'AI Course Matching', desc: 'Smart algorithm matches your profile to the best-fit courses worldwide.' },
  { Icon: GraduationCap, title: 'University Shortlisting', desc: 'Data-driven shortlisting based on your academics, budget, and goals.' },
  { Icon: FileText, title: 'Application Support', desc: 'End-to-end application management from submission to offer letter.' },
  { Icon: PenTool, title: 'SOP/CV Support', desc: 'Professional review and guidance for Statements of Purpose and CVs.' },
  { Icon: ClipboardCheck, title: 'Visa Checklist', desc: 'Country-specific document checklists tailored to your profile.' },
  { Icon: MessageSquare, title: 'Interview Preparation', desc: 'Mock interviews and coaching for visa and university admissions.' },
  { Icon: CheckCircle, title: 'Document Review', desc: 'Thorough verification of all documents before submission.' },
  { Icon: MonitorSmartphone, title: 'Portal Tracking', desc: 'Centralized dashboard to track all your applications in one place.' },
  { Icon: MessageCircle, title: 'WhatsApp Support', desc: 'Instant communication with your counselor via WhatsApp.' },
  { Icon: Award, title: 'Scholarship Guidance', desc: 'Identify and apply for scholarships you are eligible for.' },
];

const JOURNEY_STEPS = [
  { label: 'Counseling', desc: 'Free initial consultation to understand your goals' },
  { label: 'Profile Review', desc: 'Academic & professional profile assessment' },
  { label: 'Course Match', desc: 'AI-powered course & university matching' },
  { label: 'Shortlist', desc: 'Curated list of best-fit universities' },
  { label: 'Documents', desc: 'Document preparation & verification' },
  { label: 'Submit', desc: 'Application submission to universities' },
  { label: 'Offer', desc: 'Receive & evaluate offer letters' },
  { label: 'Deposit/CAS', desc: 'Tuition deposit & CAS letter processing' },
  { label: 'Visa Prep', desc: 'Visa application & document preparation' },
  { label: 'Visa Decision', desc: 'Visa approval & travel arrangements' },
  { label: 'Pre-Departure', desc: 'Pre-departure briefing & accommodation setup' },
  { label: 'Enrollment', desc: 'University enrollment & orientation support' },
];

const COUNTRY_TABS = ['UK', 'Canada', 'Australia', 'USA', 'Ireland', 'New Zealand', 'Dubai'];

const COUNTRY_FALLBACK: Record<string, ParsedCountry> = {
  uk: {
    id: 'uk', name: 'United Kingdom', slug: 'uk',
    popularCities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Leeds'],
    popularIntakes: ['September', 'January', 'May'],
    studyLevels: ['Foundation', 'Undergraduate', 'Pre-Masters', 'Masters', 'PhD'],
    visaType: 'Student Visa (Student Route)',
    tuitionRange: '£10,000 – £35,000/year',
    livingCost: '£1,023 – £1,334/month (London: £1,800+)',
    workRights: '20 hrs/week during term, full-time during holidays',
  },
  canada: {
    id: 'ca', name: 'Canada', slug: 'canada',
    popularCities: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary', 'Waterloo'],
    popularIntakes: ['September', 'January', 'May'],
    studyLevels: ['Diploma', 'Advanced Diploma', 'Bachelor', 'Post-Graduate', 'Masters', 'PhD'],
    visaType: 'Study Permit',
    tuitionRange: 'CAD 15,000 – CAD 40,000/year',
    livingCost: 'CAD 1,000 – CAD 1,800/month',
    workRights: '20 hrs/week off-campus, eligible for PGWP after graduation',
  },
  australia: {
    id: 'au', name: 'Australia', slug: 'australia',
    popularCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'],
    popularIntakes: ['February', 'July', 'November'],
    studyLevels: ['Foundation', 'Diploma', 'Bachelor', 'Graduate Certificate', 'Masters', 'PhD'],
    visaType: 'Student Visa (Subclass 500)',
    tuitionRange: 'AUD 20,000 – AUD 50,000/year',
    livingCost: 'AUD 1,500 – AUD 2,500/month',
    workRights: '48 hrs/fortnight during term, unlimited during holidays',
  },
  usa: {
    id: 'us', name: 'United States', slug: 'usa',
    popularCities: ['New York', 'Boston', 'Los Angeles', 'Chicago', 'San Francisco', 'Houston'],
    popularIntakes: ['August', 'January', 'May'],
    studyLevels: ['Associate', 'Bachelor', 'Master', 'PhD', 'OPT'],
    visaType: 'F-1 Student Visa',
    tuitionRange: '$20,000 – $60,000/year',
    livingCost: '$1,500 – $3,000/month',
    workRights: 'On-campus work, CPT/OPT for off-campus (F-1)',
  },
  ireland: {
    id: 'ie', name: 'Ireland', slug: 'ireland',
    popularCities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
    popularIntakes: ['September', 'January'],
    studyLevels: ['Foundation', 'Undergraduate', 'Masters', 'PhD'],
    visaType: 'Study Visa',
    tuitionRange: '€10,000 – €25,000/year',
    livingCost: '€1,000 – €1,800/month',
    workRights: '20 hrs/week during term, 40 hrs/week June–Sept',
  },
  'new-zealand': {
    id: 'nz', name: 'New Zealand', slug: 'new-zealand',
    popularCities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin'],
    popularIntakes: ['February', 'July'],
    studyLevels: ['Certificate', 'Diploma', 'Bachelor', 'Post-Graduate', 'Masters', 'PhD'],
    visaType: 'Student Visa',
    tuitionRange: 'NZD 22,000 – NZD 40,000/year',
    livingCost: 'NZD 1,200 – NZD 2,000/month',
    workRights: '20 hrs/week during term, full-time during holidays',
  },
  dubai: {
    id: 'ae', name: 'Dubai (UAE)', slug: 'dubai',
    popularCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
    popularIntakes: ['September', 'January', 'April'],
    studyLevels: ['Foundation', 'Bachelor', 'Master', 'PhD', 'MBA'],
    visaType: 'Student Visa / Residence Visa',
    tuitionRange: 'AED 40,000 – AED 100,000/year',
    livingCost: 'AED 3,000 – AED 7,000/month',
    workRights: 'Check with counselor',
  },
};

const COURSE_TABS = ['All', 'Business', 'Computer Science', 'Data Science', 'Engineering', 'Healthcare', 'Law', 'Arts & Humanities', 'Social Sciences', 'Natural Sciences'];

const SUBJECT_MAP: Record<string, string[]> = {
  Business: ['business', 'management', 'finance', 'accounting', 'marketing', 'mba', 'commerce', 'economics'],
  'Computer Science': ['computer science', 'computer', 'information technology', 'software', 'cybersecurity', 'artificial intelligence'],
  'Data Science': ['data science', 'data analytics', 'big data', 'machine learning', 'statistics'],
  Engineering: ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'aerospace', 'biomedical'],
  Healthcare: ['health', 'medicine', 'nursing', 'pharmacy', 'public health', 'biomedical', 'clinical'],
  Law: ['law', 'legal', 'international law', 'corporate law', 'criminal law'],
  'Arts & Humanities': ['arts', 'humanities', 'design', 'architecture', 'media', 'communication', 'journalism', 'creative'],
  'Social Sciences': ['social science', 'psychology', 'sociology', 'political', 'international relations', 'education'],
  'Natural Sciences': ['biology', 'chemistry', 'physics', 'mathematics', 'environmental', 'earth science', 'geology'],
};

function levelColor(level: string): string {
  const l = (level || '').toLowerCase();
  if (l.includes('phd') || l.includes('doctor')) return 'bg-purple-100 text-purple-700';
  if (l.includes('master') || l.includes('msc') || l.includes('ma ')) return 'bg-blue-100 text-blue-700';
  if (l.includes('bachelor') || l.includes('bsc') || l.includes('ba ')) return 'bg-green-100 text-green-700';
  if (l.includes('foundation') || l.includes('diploma') || l.includes('certificate')) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function SectionLabel({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-4" style={{ background: bg, color }}>
      {text}
    </span>
  );
}

function SectionHeader({ label, labelBg, labelColor, title, titleHighlight, subtitle }: {
  label: string; labelBg: string; labelColor: string; title: string; titleHighlight: string; subtitle: string;
}) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce} className="text-center mb-14">
      <motion.div variants={staggerItem}>
        <SectionLabel text={label} bg={labelBg} color={labelColor} />
      </motion.div>
      <motion.h2 variants={sectionTitle} className="text-3xl sm:text-4xl font-bold" style={{ color: C.text }}>
        {title} <span style={{ color: C.blue }}>{titleHighlight}</span>
      </motion.h2>
      <motion.p variants={sectionSubtitle} className="text-base mt-4 max-w-2xl mx-auto" style={{ color: C.textSoft }}>
        {subtitle}
      </motion.p>
    </motion.div>
  );
}

function WhyChooseSection() {
  return (
    <section className="py-20 md:py-28" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Why Choose Us"
          labelBg="rgba(0,87,184,0.08)" labelColor={C.blue}
          title="Everything You Need for a"
          titleHighlight="Successful Journey"
          subtitle="From first counseling session to landing at your dream university — we handle every detail."
        />
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {WHY_CHOOSE.map((item) => (
            <motion.div key={item.title} variants={staggerItemScale} className="h-full">
              <Card className="h-full border hover:shadow-lg transition-all duration-300" style={{ borderColor: C.border }}>
                <CardContent className="p-6 flex flex-col gap-4 h-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,87,184,0.08)' }}>
                    <item.Icon size={22} style={{ color: C.blue }} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: C.text }}>{item.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSoft }}>{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const FALLBACK_SERVICES: HomeService[] = [
  { id: '1', title: 'University Selection', slug: 'university-selection', icon: 'GraduationCap', description: 'Personalised university shortlisting based on your profile, budget and career goals.', ctaLabel: 'Explore', ctaUrl: '/services/university-selection', sortOrder: 1 },
  { id: '2', title: 'Application Assistance', slug: 'application-assistance', icon: 'FileText', description: 'End-to-end application management from form filling to offer letter.', ctaLabel: 'Explore', ctaUrl: '/services/application-assistance', sortOrder: 2 },
  { id: '3', title: 'Visa Guidance', slug: 'visa-guidance', icon: 'Shield', description: 'Country-specific visa checklists, document review and mock interviews.', ctaLabel: 'Explore', ctaUrl: '/services/visa-guidance', sortOrder: 3 },
  { id: '4', title: 'Scholarship Support', slug: 'scholarship-support', icon: 'Award', description: 'Identify and apply for scholarships you are eligible for.', ctaLabel: 'Explore', ctaUrl: '/services/scholarship-support', sortOrder: 4 },
  { id: '5', title: 'Test Preparation', slug: 'test-preparation', icon: 'BookOpen', description: 'IELTS, TOEFL, PTE, Duolingo — preparation tips and booking help.', ctaLabel: 'Explore', ctaUrl: '/services/test-preparation', sortOrder: 5 },
  { id: '6', title: 'SOP & CV Review', slug: 'sop-review', icon: 'PenTool', description: 'Professional review for Statement of Purpose, CV and recommendation letters.', ctaLabel: 'Explore', ctaUrl: '/services/sop-review', sortOrder: 6 },
  { id: '7', title: 'Pre-Departure Briefing', slug: 'pre-departure', icon: 'Plane', description: 'Accommodation, travel, insurance and cultural orientation.', ctaLabel: 'Explore', ctaUrl: '/services/pre-departure', sortOrder: 7 },
  { id: '8', title: 'Accommodation Support', slug: 'accommodation-support', icon: 'Building2', description: 'Help finding safe, affordable student housing near your campus.', ctaLabel: 'Explore', ctaUrl: '/services/accommodation', sortOrder: 8 },
  { id: '9', title: 'Financial Planning', slug: 'financial-planning', icon: 'DollarSign', description: 'Tuition, living costs, education loans and budgeting guidance.', ctaLabel: 'Explore', ctaUrl: '/services/financial-planning', sortOrder: 9 },
  { id: '10', title: 'Career Counseling', slug: 'career-counseling', icon: 'Briefcase', description: 'Career path mapping and post-study work opportunities advice.', ctaLabel: 'Explore', ctaUrl: '/services/career-counseling', sortOrder: 10 },
  { id: '11', title: 'Eligibility Check', slug: 'eligibility-check', icon: 'ClipboardCheck', description: 'Free profile assessment to check your admission chances.', ctaLabel: 'Check Now', ctaUrl: '/eligibility-check', sortOrder: 11 },
  { id: '12', title: 'Course Matching', slug: 'course-matching', icon: 'Search', description: 'AI-powered course matching across thousands of programmes.', ctaLabel: 'Find Courses', ctaUrl: '/course-finder', sortOrder: 12 },
  { id: '13', title: 'Document Verification', slug: 'document-verification', icon: 'FileCheck', description: 'Thorough verification of transcripts, certificates and more.', ctaLabel: 'Explore', ctaUrl: '/services/document-verification', sortOrder: 13 },
  { id: '14', title: 'Interview Preparation', slug: 'interview-preparation', icon: 'MessageSquare', description: 'Mock interviews for university and visa success.', ctaLabel: 'Explore', ctaUrl: '/services/interview-preparation', sortOrder: 14 },
  { id: '15', title: 'Post-Arrival Support', slug: 'post-arrival', icon: 'Heart', description: 'Ongoing support after you land — enrollment to settlement.', ctaLabel: 'Explore', ctaUrl: '/services/post-arrival', sortOrder: 15 },
];

function ServicesSection({ services }: { services: HomeService[] }) {
  const list = services.length ? services : FALLBACK_SERVICES;
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Our Services"
          labelBg="rgba(232,80,26,0.08)" labelColor={C.orange}
          title="Comprehensive"
          titleHighlight="Support Services"
          subtitle="From application to arrival — every service you need under one roof."
        />
        {list.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {list.slice(0, 16).map((svc) => {
              const Icon = getIcon(svc.icon);
              return (
                <motion.div key={svc.id} variants={staggerItemScale} className="h-full">
                  <Card className="h-full border hover:shadow-lg transition-all duration-300 overflow-hidden" style={{ borderColor: C.border }}>
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.orange})` }} />
                    <CardContent className="p-5 flex flex-col gap-3 h-full">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,87,184,0.08)' }}>
                        <Icon size={20} style={{ color: C.blue }} />
                      </div>
                      <h3 className="font-semibold text-sm" style={{ color: C.text }}>{svc.title}</h3>
                      <p className="text-xs leading-relaxed flex-1" style={{ color: C.textSoft }}>{svc.description}</p>
                      {svc.ctaLabel && (
                        <Link href={svc.ctaUrl || '#'} className="text-xs font-medium flex items-center gap-1 group/link" style={{ color: C.blue }}>
                          {svc.ctaLabel}
                          <ArrowRight size={12} className="transition-transform group-hover/link:translate-x-1" />
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function StudentJourneyTimeline() {
  return (
    <section className="py-20 md:py-28" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Your Journey"
          labelBg="rgba(0,87,184,0.08)" labelColor={C.blue}
          title="From Dream to"
          titleHighlight="Destination"
          subtitle="A clear 12-step pathway from your first consultation to university enrollment."
        />
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2" style={{ background: C.border }} />
          {JOURNEY_STEPS.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={step.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className={`relative flex items-start mb-10 last:mb-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
              >
                <div
                  className="absolute left-5 md:left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: i < 10 ? C.blue : C.orange }}
                >
                  {i + 1}
                </div>
                <div className={`ml-16 md:ml-0 md:w-[calc(50%-2rem)] ${isLeft ? 'md:mr-auto md:pr-0' : 'md:ml-auto md:pl-0'}`}>
                  <Card className="border hover:shadow-md transition-shadow duration-300" style={{ borderColor: C.border }}>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-sm mb-1" style={{ color: C.text }}>{step.label}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: C.textSoft }}>{step.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CountryIntelligenceSection({ countries }: { countries: ParsedCountry[] }) {
  const [active, setActive] = useState('UK');

  const countryMap = new Map<string, ParsedCountry>();
  for (const c of countries) {
    countryMap.set(c.name, c);
    countryMap.set(c.slug, c);
    const nameLower = c.name.toLowerCase();
    if (nameLower.includes('kingdom')) countryMap.set('UK', c);
    if (nameLower.includes('zealand')) countryMap.set('New Zealand', c);
    if (nameLower.includes('ireland')) countryMap.set('Ireland', c);
    if (nameLower.includes('states')) countryMap.set('USA', c);
    if (nameLower.includes('australia')) countryMap.set('Australia', c);
    if (nameLower.includes('canada')) countryMap.set('Canada', c);
    if (nameLower.includes('dubai') || nameLower.includes('uae')) countryMap.set('Dubai', c);
  }

  const getCountry = (tab: string): ParsedCountry => {
    return countryMap.get(tab) || COUNTRY_FALLBACK[tab.toLowerCase().replace(' ', '-')] || COUNTRY_FALLBACK['uk'];
  };

  const data = getCountry(active);

  const rows = [
    { label: 'Popular Cities', value: data.popularCities?.join(', ') || 'Check with counselor' },
    { label: 'Intakes', value: data.popularIntakes?.join(', ') || 'Check with counselor' },
    { label: 'Study Levels', value: data.studyLevels?.join(', ') || 'Check with counselor' },
    { label: 'Tuition Range', value: data.tuitionRange || 'Check with counselor' },
    { label: 'Living Cost', value: data.livingCost || 'Check with counselor' },
    { label: 'Visa Type', value: data.visaType || 'Check with counselor' },
    { label: 'Work Rights', value: data.workRights || 'Check with counselor' },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Country Intelligence"
          labelBg="rgba(0,87,184,0.08)" labelColor={C.blue}
          title="Study Abroad"
          titleHighlight="Country Guide"
          subtitle="Key facts, costs, and visa requirements for the top study destinations."
        />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {COUNTRY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className="rounded-full px-5 h-10 text-sm font-medium transition-colors cursor-pointer"
                style={{
                  background: active === tab ? C.blue : C.bg,
                  color: active === tab ? 'white' : C.textSoft,
                  border: `1px solid ${active === tab ? C.blue : C.border}`,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <Card className="border" style={{ borderColor: C.border }}>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                {rows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.blue }}>{row.label}</span>
                    <span className="text-sm leading-relaxed" style={{ color: C.text }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function PopularCoursesSection({ courses }: { courses: CourseItem[] }) {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? courses
    : courses.filter((c) => {
        const area = (c.subjectArea || '').toLowerCase();
        const keywords = SUBJECT_MAP[activeTab] || [];
        return keywords.some((kw) => area.includes(kw));
      });

  return (
    <section className="py-20 md:py-28" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Popular Courses"
          labelBg="rgba(232,80,26,0.08)" labelColor={C.orange}
          title="Trending"
          titleHighlight="Programs"
          subtitle="Discover popular courses chosen by thousands of students worldwide."
        />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {COURSE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="rounded-full px-5 h-10 text-sm font-medium transition-colors cursor-pointer"
                style={{
                  background: activeTab === tab ? C.blue : 'white',
                  color: activeTab === tab ? 'white' : C.textSoft,
                  border: `1px solid ${activeTab === tab ? C.blue : C.border}`,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: C.textSoft }}>
              <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No courses found in this category.</p>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.slice(0, 12).map((course) => (
                <motion.div key={course.id} variants={staggerItemScale} className="h-full">
                  <Card className="h-full flex flex-col border hover:shadow-lg transition-shadow duration-300" style={{ borderColor: C.border }}>
                    <CardContent className="flex flex-col p-5 gap-3 flex-1">
                      <Badge variant="secondary" className={`text-xs font-medium rounded-full px-3 py-0.5 border-0 w-fit ${levelColor(course.studyLevel)}`}>
                        {course.studyLevel || 'N/A'}
                      </Badge>
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: C.text }}>{course.courseTitle}</h3>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textSoft }}>
                        <GraduationCap size={14} />
                        <span className="truncate">{course.universityName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textSoft }}>
                        <MapPin size={14} />
                        <span>{course.city}{course.city && course.country ? ', ' : ''}{course.country}</span>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 text-xs" style={{ color: C.textSoft }}>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {course.durationMonths ? `${course.durationMonths} months` : 'N/A'}
                        </span>
                        <span className="font-semibold text-sm" style={{ color: C.text }}>
                          {course.yearlyTuition ? `${course.tuitionCurrency || ''}${course.yearlyTuition.toLocaleString()}/yr` : 'Contact us'}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link href={`/course-finder?search=${encodeURIComponent(course.courseTitle || '')}`}>
                        <Button variant="outline" className="flex-1 h-12 text-xs rounded-lg" style={{ borderColor: C.border, color: C.text }}>
                          View Details
                        </Button>
                      </Link>
                        <Link href="/book-consultation">
                        <Button className="flex-1 h-12 text-xs rounded-lg text-white" style={{ background: C.blue }}>
                          Apply
                        </Button>
                      </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
          <div className="text-center mt-10">
            <Link href="/course-finder">
            <Button className="h-12 px-8 rounded-full text-white font-medium" style={{ background: C.blue }}>
              Explore Full Course Finder
              <ArrowRight size={16} className="ml-2" />
            </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustedUniversitiesSection({ universities }: { universities: UniItem[] }) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Trusted Partners"
          labelBg="rgba(0,87,184,0.08)" labelColor={C.blue}
          title="Our"
          titleHighlight="University Network"
          subtitle="Partnered with top-ranked universities across the globe."
        />
        {universities.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {universities.slice(0, 24).map((uni) => {
              const initials = uni.name
                .split(/\s+(?:of|the|and|for|at|in)\s+/i)
                .join(' ')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();
              return (
                <motion.div key={uni.universityId} variants={staggerItemScale}>
                  <Link href={`/universities/${uni.universityId || uni.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                    <Card className="h-24 flex items-center justify-center border hover:shadow-md hover:border-[#0057B8] transition-all duration-300 cursor-pointer" style={{ borderColor: C.border }}>
                      <CardContent className="p-3 flex flex-col items-center justify-center gap-1.5 w-full h-full">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: C.blue }}>
                          {initials}
                        </div>
                        <span className="text-[11px] font-medium text-center leading-tight line-clamp-2" style={{ color: C.text }}>{uni.name}</span>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        <div className="text-center mt-10">
          <Link href="/course-finder">
          <Button variant="outline" className="h-12 px-8 rounded-full font-medium" style={{ borderColor: C.blue, color: C.blue }}>
            View University Directory
            <ArrowRight size={16} className="ml-2" />
          </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomepagePart2() {
  const [services, setServices] = useState<HomeService[]>([]);
  const [countries, setCountries] = useState<ParsedCountry[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [universities, setUniversities] = useState<UniItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/website/homepage');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setServices(json.data.services || []);
            setCountries(json.data.countries || []);
          }
        }
      } catch (_) { console.error('Homepage services/countries fetch failed'); }

      try {
        const res = await fetch('/api/course-finder?limit=50');
        if (res.ok) {
          const json = await res.json();
          if (json.courses) {
            setCourses(
              json.courses.map((c: Record<string, unknown>) => ({
                id: String(c.id || c.courseId || ''),
                courseTitle: String(c.courseTitle || ''),
                universityName: String(c.universityName || ''),
                country: String(c.country || ''),
                city: String(c.city || ''),
                studyLevel: String(c.studyLevel || ''),
                subjectArea: String(c.subjectArea || ''),
                durationMonths: typeof c.durationMonths === 'number' ? c.durationMonths : null,
                tuitionCurrency: String(c.tuitionCurrency || ''),
                yearlyTuition: typeof c.yearlyTuition === 'number' ? c.yearlyTuition : null,
                intakeMonth: String(c.intakeMonth || ''),
              }))
            );
          }
        }
      } catch (_) { console.error('Homepage courses fetch failed'); }

      try {
        const res = await fetch('/api/universities?limit=24&status=active');
        if (res.ok) {
          const json = await res.json();
          if (json.universities) {
            setUniversities(
              json.universities.map((u: Record<string, unknown>) => ({
                universityId: String(u.universityId || ''),
                name: String(u.name || ''),
                country: String(u.country || ''),
                city: String(u.city || ''),
                ranking: typeof u.ranking === 'number' ? u.ranking : 0,
                website: String(u.website || ''),
                courseCount: typeof u.courseCount === 'number' ? u.courseCount : 0,
              }))
            );
          }
        }
      } catch (_) { console.error('Homepage universities fetch failed'); }
    }
    fetchData();
  }, []);

  return (
    <>
      <WhyChooseSection />
      <ServicesSection services={services} />
      <StudentJourneyTimeline />
      <CountryIntelligenceSection countries={countries} />
      <PopularCoursesSection courses={courses} />
      <TrustedUniversitiesSection universities={universities} />
    </>
  );
}
