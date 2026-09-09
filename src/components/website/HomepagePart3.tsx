'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getDestinationImage } from './ImageMapping';
import { motion } from 'framer-motion';
import {
  fadeUp, fadeIn, scaleUp, slideFromLeft, slideFromRight,
  staggerContainer, staggerItem, staggerItemScale,
  sectionTitle, sectionSubtitle, viewportOnce, gradients,
} from './animations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  ClipboardCheck, DollarSign, MessageSquare, ShieldCheck, FileCheck,
  Plane, User, FileText, FolderOpen, Mail, Calendar, Clock, Sparkles,
  Search, Upload, Eye, BookOpen, Bell, PenTool, Calculator, Award,
  ArrowRight, AlertTriangle, Zap,
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   BRAND COLORS
   ═══════════════════════════════════════════════════════════════ */
const C = {
  blue: '#0057B8',
  orange: '#E8501A',
  text: '#0F172A',
  textSoft: '#64748B',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface EnglishTest {
  id?: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  bestFor?: string;
  acceptedDest?: string;
  resultTime?: string;
  scoreRange?: string;
  format?: string;
  isAdmissionsTest?: boolean;
}

interface Scholarship {
  id?: string;
  name?: string;
  country?: string;
  amount?: string;
  deadline?: string;
  description?: string;
}

/* ═══════════════════════════════════════════════════════════════
   HARDCODED FALLBACK DATA
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_SCHOLARSHIPS = [
  {
    name: 'Chevening Scholarship',
    country: 'UK',
    flag: '🇬🇧',
    amount: 'Full tuition + living stipend',
    deadline: 'November annually',
    description: 'Fully funded scholarship for outstanding professionals to study a one-year master\'s degree in the UK.',
  },
  {
    name: 'GREAT Scholarships',
    country: 'UK',
    flag: '🇬🇧',
    amount: '£10,000 minimum',
    deadline: 'Varies',
    description: 'Jointly funded by the British Council and participating UK universities for postgraduate study.',
  },
  {
    name: 'Vanier Canada Graduate Scholarship',
    country: 'Canada',
    flag: '🇨🇦',
    amount: 'CAD 50,000/year',
    deadline: 'November annually',
    description: 'Canadian government scholarship for world-class doctoral students pursuing research at Canadian universities.',
  },
  {
    name: 'Australia Awards',
    country: 'Australia',
    flag: '🇦🇺',
    amount: 'Full tuition + travel + stipend',
    deadline: 'April/May annually',
    description: 'Government-funded scholarships for students from developing countries to study in Australia.',
  },
  {
    name: 'University of Derby International Scholarship',
    country: 'UK',
    flag: '🇬🇧',
    amount: 'Up to £5,000',
    deadline: 'Rolling',
    description: 'Automatic scholarship for eligible international students applying to the University of Derby.',
  },
  {
    name: 'Ravensbourne University Scholarship',
    country: 'UK',
    flag: '🇬🇧',
    amount: '£2,000–£5,000',
    deadline: 'Rolling',
    description: 'International student scholarship available for selected programmes at Ravensbourne University London.',
  },
];

const DEFAULT_ENGLISH_TESTS: EnglishTest[] = [
  { name: 'IELTS', bestFor: 'Most popular', acceptedDest: 'UK, Australia, Canada, USA, NZ', resultTime: '3–5 days (computer)', scoreRange: '0–9.0', format: 'Computer / Paper' },
  { name: 'IELTS UKVI', bestFor: 'UK Visa required', acceptedDest: 'UK', resultTime: '3–5 days', scoreRange: '0–9.0', format: 'Computer / Paper' },
  { name: 'PTE Academic', bestFor: 'Fast results', acceptedDest: 'UK, Australia, USA, Canada, NZ', resultTime: '1–2 days', scoreRange: '10–90', format: 'Computer' },
  { name: 'TOEFL iBT', bestFor: 'US universities', acceptedDest: 'USA, UK, Canada, Australia', resultTime: '4–8 days', scoreRange: '0–120', format: 'Computer / Home' },
  { name: 'Duolingo', bestFor: 'Budget-friendly', acceptedDest: 'USA, UK, Canada, Australia (growing)', resultTime: '48 hours', scoreRange: '10–160', format: 'Online (anywhere)' },
  { name: 'OIETC/ELLT', bestFor: 'UK pre-sessional', acceptedDest: 'UK (partner unis)', resultTime: '5–7 days', scoreRange: 'CEFR A2–C2', format: 'Online' },
  { name: 'Oxford ELLT', bestFor: 'Oxford partner unis', acceptedDest: 'UK (select)', resultTime: '3–5 days', scoreRange: 'CEFR B1–C2', format: 'Online' },
  { name: 'LanguageCert', bestFor: 'Flexible scheduling', acceptedDest: 'UK, International', resultTime: '10 business days', scoreRange: 'CEFR A1–C2', format: 'Computer / Paper' },
  { name: 'Kaplan', bestFor: 'Pre-sessional', acceptedDest: 'UK (pathway)', resultTime: 'Varies', scoreRange: 'CEFR levels', format: 'Online / In-person' },
  { name: 'OET', bestFor: 'Healthcare professionals', acceptedDest: 'UK, Australia, NZ, Ireland', resultTime: '15 business days', scoreRange: 'A–E per sub-test', format: 'Computer / Paper' },
  { name: 'MOI Guidance', bestFor: 'English-taught degree', acceptedDest: 'UK (select unis)', resultTime: 'N/A', scoreRange: 'Medium of Instruction', format: 'Document-based' },
  { name: 'GRE', bestFor: 'Graduate admissions', acceptedDest: 'USA, Global', resultTime: '10–15 days', scoreRange: '130–170 (V&Q), 0–6 (AW)', format: 'Computer / Paper', isAdmissionsTest: true },
  { name: 'GMAT', bestFor: 'Business school', acceptedDest: 'USA, UK, Global', resultTime: '7 business days', scoreRange: '200–800', format: 'Computer', isAdmissionsTest: true },
  { name: 'SAT', bestFor: 'Undergraduate US', acceptedDest: 'USA', resultTime: '2–4 weeks', scoreRange: '400–1600', format: 'Paper / Digital', isAdmissionsTest: true },
];

/* ═══════════════════════════════════════════════════════════════
   SECTION 13 — SCHOLARSHIPS & FUNDING
   ═══════════════════════════════════════════════════════════════ */
function ScholarshipsSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Scholarships & Funding
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Explore funding opportunities to make your study abroad dream affordable
          </motion.p>
        </motion.div>

        {/* Scholarship Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {DEFAULT_SCHOLARSHIPS.map((sch, i) => (
            <motion.div key={i} variants={staggerItemScale}>
              <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col bg-white" style={{ borderColor: C.border }}>
                {/* Scholarship Card Top Image */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100 shrink-0">
                  <Image
                    src={getDestinationImage(sch.country)}
                    alt={`${sch.name} Scholarship`}
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-5 flex flex-col flex-grow">
                  {/* Country badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F0F7FF] text-[#0057B8]">
                      <span className="text-base">{sch.flag}</span>
                      {sch.country}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>
                      {sch.deadline}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold mb-2" style={{ color: C.text }}>
                    {sch.name}
                  </h3>

                  {/* Amount */}
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 shrink-0" style={{ color: C.success }} />
                    <span className="text-sm font-semibold" style={{ color: C.success }}>
                      {sch.amount}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm leading-relaxed mb-5 flex-grow" style={{ color: C.textSoft }}>
                    {sch.description}
                  </p>

                  {/* Button */}
                  <Button
                    className="w-full h-12 rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: C.orange, color: '#FFFFFF' }}
                    asChild
                  >
                    <Link href="/scholarships">
                      Check Eligibility
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <Button
            className="h-12 rounded-xl text-sm font-semibold px-8 shadow-md hover:shadow-lg transition-shadow"
            style={{ backgroundColor: C.blue, color: '#FFFFFF' }}
            asChild
          >
            <Link href="/scholarships">
              Find Scholarships
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function getEnglishTestImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('ielts')) return '/images/landing/Copy of pexels-jaksonmartins-3101504.webp';
  if (n.includes('pte')) return '/images/landing/Copy of 2148431342.webp';
  if (n.includes('toefl')) return '/images/landing/Copy of marvin-meyer-SYTO3xs06fU-unsplash.webp';
  if (n.includes('duolingo')) return '/images/landing/Copy of brooke-cagle-g1Kr4Ozfoac-unsplash.webp';
  if (n.includes('gre') || n.includes('gmat') || n.includes('sat')) return '/images/landing/Copy of pexels-rdne-7683897.webp';
  return '/images/landing/Copy of 20250902_1557_Smiling Study Partners_remix_01k44xnmncf91b70zs3ewff8kg.webp';
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 14 — ENGLISH LANGUAGE TESTS
   ═══════════════════════════════════════════════════════════════ */
function EnglishTestsSection() {
  const [tests, setTests] = useState<EnglishTest[]>(DEFAULT_ENGLISH_TESTS);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/website/homepage');
        if (res.ok) {
          const data = await res.json();
          if (data.englishTests && data.englishTests.length > 0) {
            setTests(data.englishTests);
          }
        }
      } catch (err) {
        console.error('Homepage English tests fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const displayedTests = showAll ? tests : tests.slice(0, 10);

  return (
    <section className="py-16 md:py-20" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            English Language Tests
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Choose the right English proficiency test for your study abroad journey
          </motion.p>
        </motion.div>

        {/* Test Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <motion.div key={`skeleton-${i}`} variants={staggerItem}>
                  <div className="h-64 rounded-2xl bg-white/60 animate-pulse" />
                </motion.div>
              ))
            : displayedTests.map((test, i) => (
                <motion.div key={test.name + i} variants={staggerItemScale}>
                  <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col bg-white" style={{ borderColor: C.border }}>
                    {/* Test Card Top Image */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-100 shrink-0">
                      <Image
                        src={getEnglishTestImage(test.name)}
                        alt={`${test.name} English Test`}
                        fill
                        sizes="(max-width: 768px) 100vw, 20vw"
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-5 flex flex-col flex-grow">
                      {/* Test name + Best for badge */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-bold" style={{ color: C.text }}>
                          {test.name}
                        </h3>
                        {test.bestFor && (
                          <Badge className="text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2" style={{ backgroundColor: '#EFF6FF', color: C.blue }}>
                            {test.bestFor}
                          </Badge>
                        )}
                      </div>

                      {/* Accepted destinations */}
                      {test.acceptedDest && (
                        <div className="flex items-start gap-1.5 mb-2">
                          <span className="text-xs font-medium mt-0.5 shrink-0" style={{ color: C.textSoft }}>
                            Destinations:
                          </span>
                          <span className="text-xs" style={{ color: C.textSoft }}>
                            {test.acceptedDest}
                          </span>
                        </div>
                      )}

                      {/* Result time */}
                      {test.resultTime && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: C.textSoft }} />
                          <span className="text-xs" style={{ color: C.textSoft }}>
                            {test.resultTime}
                          </span>
                        </div>
                      )}

                      {/* Score range badge */}
                      {test.scoreRange && (
                        <div className="inline-flex self-start px-2.5 py-1 rounded-md text-xs font-medium mb-4" style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}>
                          {test.scoreRange}
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-grow" />

                      {/* Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 rounded-lg text-xs font-medium border-[#E2E8F0]"
                          style={{ color: C.blue }}
                          asChild
                        >
                          <Link href={`/language-prep/${test.slug || test.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                            Learn More
                          </Link>
                        </Button>
                        <Button
                          className="flex-1 h-10 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: C.orange }}
                          asChild
                        >
                          <Link href={`/language-prep/${test.slug || 'ielts'}`}>
                            Start Mock Test
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </motion.div>

        {/* Show More / Less toggle */}
        {tests.length > 10 && (
          <motion.div
            className="text-center mb-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <Button
              variant="outline"
              className="h-10 rounded-lg text-sm font-medium"
              style={{ borderColor: C.border, color: C.blue }}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show Less' : `Show All ${tests.length} Tests`}
            </Button>
          </motion.div>
        )}

        {/* ── Comparison Table ── */}
        <motion.div
          className="mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="text-xl md:text-2xl font-bold" style={{ color: C.text }}>
              English Test Comparison
            </h3>
            <Link href="/language-prep/comparison">
              <Button variant="outline" className="h-10 text-xs font-semibold rounded-lg border-[#0057B8] text-[#0057B8]">
                Full Comparison Matrix <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="rounded-2xl border shadow-sm overflow-hidden bg-white" style={{ borderColor: C.border }}>
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: C.blue }}>
                  <TableHead className="text-white font-semibold text-xs uppercase">Test</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase">Accepted Destinations</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase hidden md:table-cell">Format</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase hidden lg:table-cell">Score Range</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase hidden lg:table-cell">Result Time</TableHead>
                  <TableHead className="text-white font-semibold text-xs uppercase hidden xl:table-cell">Best Use Case</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test, i) => (
                  <TableRow key={test.name + i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <TableCell className="font-semibold" style={{ color: C.text }}>
                      <Link href={`/language-prep/${test.slug || test.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="hover:underline">
                        {test.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" style={{ color: C.textSoft }}>{test.acceptedDest || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs" style={{ color: C.textSoft }}>{test.format || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs" style={{ color: C.textSoft }}>{test.scoreRange || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs" style={{ color: C.textSoft }}>{test.resultTime || '—'}</TableCell>
                    <TableCell className="hidden xl:table-cell text-xs" style={{ color: C.textSoft }}>{test.bestFor || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* CTAs Row */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {[
            { label: 'Take Free English Placement Test', variant: 'primary' as const, href: '/language-prep/placement-test' },
            { label: 'Start IELTS Mock', variant: 'secondary' as const, href: '/language-prep/ielts' },
            { label: 'Start PTE Mock', variant: 'secondary' as const, href: '/language-prep/pte-academic' },
            { label: 'English Test Comparison', variant: 'secondary' as const, href: '/language-prep/comparison' },
          ].map((cta, i) => (
            <motion.div key={i} variants={staggerItem}>
              <Button
                className="h-12 min-h-[48px] rounded-xl text-sm font-semibold px-6"
                style={cta.variant === 'primary'
                  ? { backgroundColor: C.orange, color: '#FFFFFF' }
                  : { backgroundColor: '#FFFFFF', borderColor: C.border, color: C.text }}
                variant={cta.variant === 'primary' ? 'default' : 'outline'}
                asChild
              >
                <Link href={cta.href || '#'}>
                  {cta.label}
                  {cta.variant === 'primary' && <ArrowRight className="ml-2 h-4 w-4" />}
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 15 — VISA & COMPLIANCE SUPPORT
   ═══════════════════════════════════════════════════════════════ */
const VISA_FEATURES = [
  {
    icon: ClipboardCheck,
    title: 'Visa Checklist',
    description: 'Comprehensive document checklist tailored to your destination country and visa type.',
    color: C.blue,
  },
  {
    icon: DollarSign,
    title: 'Financial Proof Guidance',
    description: 'Help with bank statements, sponsorship letters, and financial documentation requirements.',
    color: C.success,
  },
  {
    icon: MessageSquare,
    title: 'Credibility Interview Practice',
    description: 'Mock interviews with feedback to prepare you for the real credibility interview.',
    color: C.warning,
  },
  {
    icon: ShieldCheck,
    title: 'Visa Refusal Prevention',
    description: 'Understand common refusal reasons and how to avoid them in your application.',
    color: C.danger,
  },
  {
    icon: FileCheck,
    title: 'Document Review',
    description: 'Thorough checking of all supporting documents before submission to ensure accuracy.',
    color: '#8B5CF6',
  },
  {
    icon: Plane,
    title: 'Pre-Departure Checklist',
    description: 'Everything you need to arrange before you fly — accommodation, insurance, packing, and more.',
    color: C.blue,
  },
];

function VisaSupportSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Visa & Compliance Support
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Comprehensive guidance to help you navigate visa requirements
          </motion.p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {VISA_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={staggerItemScale}>
                <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-300 group" style={{ borderColor: C.border }}>
                  <CardContent className="p-6">
                    {/* Icon circle */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${feat.color}10`, color: feat.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>
                      {feat.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed" style={{ color: C.textSoft }}>
                      {feat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Disclaimer Banner */}
        <motion.div
          className="mt-10 rounded-xl p-4 md:p-5 flex items-start gap-3"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeIn}
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: C.warning }} />
          <p className="text-sm leading-relaxed" style={{ color: '#92400E' }}>
            Visa and work rules may change. Final checklist must be verified by ALO staff using official/current sources before submission.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <Button
              className="h-12 rounded-xl text-sm font-semibold px-8 shadow-md hover:shadow-lg transition-shadow"
              style={{ backgroundColor: C.orange, color: '#FFFFFF' }}
              asChild
            >
              <Link href="/visa/readiness">
                Start Visa Readiness Check
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Button
              className="h-12 rounded-xl text-sm font-semibold px-8"
              style={{ backgroundColor: C.blue, color: '#FFFFFF' }}
              asChild
            >
              <Link href="/contact">
                Book Visa Consultation
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 16 — STUDENT PORTAL PREVIEW
   ═══════════════════════════════════════════════════════════════ */
const STUDENT_PORTAL_CARDS = [
  { icon: User, title: 'Profile Completion', description: 'Complete your student profile to unlock all features', value: 75, type: 'progress' as const },
  { icon: FileText, title: 'Active Applications', description: 'Track your university applications in real-time', value: 3, type: 'count' as const },
  { icon: FolderOpen, title: 'Documents', description: 'Upload and manage your application documents', value: 12, type: 'count' as const },
  { icon: Mail, title: 'Messages', description: 'Communicate with your assigned counselor', value: 5, type: 'count' as const },
  { icon: ShieldCheck, title: 'Visa Readiness', description: 'Monitor your visa preparation progress', value: 60, type: 'progress' as const },
  { icon: Calendar, title: 'Upcoming Appointments', description: 'View your scheduled meetings and deadlines', value: 2, type: 'count' as const },
  { icon: Sparkles, title: 'AI Recommendations', description: 'Get AI-powered course and university suggestions', value: 8, type: 'count' as const },
  { icon: Clock, title: 'Application Timeline', description: 'Visual stage-by-stage application tracking', value: 4, type: 'count' as const, label: 'of 6 stages' },
];

function StudentPortalPreview() {
  return (
    <section className="py-16 md:py-20" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Your Student Portal
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Track your entire study abroad journey from one dashboard
          </motion.p>
        </motion.div>

        {/* Preview Dashboard Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {STUDENT_PORTAL_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={i} variants={staggerItemScale}>
                <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-300 group" style={{ borderColor: C.border }}>
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${C.blue}10`, color: C.blue }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: C.text }}>
                        {card.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed mb-4 flex-grow" style={{ color: C.textSoft }}>
                      {card.description}
                    </p>

                    {/* Visual Indicator */}
                    {card.type === 'progress' ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium" style={{ color: C.textSoft }}>Progress</span>
                          <span className="text-xs font-bold" style={{ color: C.blue }}>
                            {card.value}%
                          </span>
                        </div>
                        <Progress value={card.value} className="h-2" />
                      </div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold" style={{ color: C.blue }}>
                          {card.value}
                        </span>
                        {card.label ? (
                          <span className="text-xs mb-1" style={{ color: C.textSoft }}>
                            {card.label}
                          </span>
                        ) : (
                          <span className="text-xs mb-1" style={{ color: C.textSoft }}>
                            {card.title === 'Active Applications' ? 'applications' :
                             card.title === 'Documents' ? 'documents' :
                             card.title === 'Messages' ? 'unread' :
                             card.title === 'Upcoming Appointments' ? 'upcoming' :
                             'items'}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Disclaimer - example values */}
        <p className="text-xs text-center mb-6" style={{ color: C.textSoft }}>
          * Dashboard values shown are example previews. Actual data depends on your profile.
        </p>

        {/* Student Portal CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <Button
              className="h-12 rounded-xl text-sm font-semibold px-8 shadow-md hover:shadow-lg transition-shadow"
              style={{ backgroundColor: C.orange, color: '#FFFFFF' }}
              asChild
            >
              <Link href="/student/login">
                Student Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Button
              className="h-12 rounded-xl text-sm font-semibold px-8"
              style={{ backgroundColor: C.blue, color: '#FFFFFF' }}
              asChild
            >
              <Link href="/student/register">
                Create Student Account
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 17 — PARTNER PORTAL PREVIEW
   ═══════════════════════════════════════════════════════════════ */
const PARTNER_FEATURES = [
  { icon: User, title: 'Register Students', description: 'Quickly register new students and manage their profiles in your pipeline.' },
  { icon: Search, title: 'Search Programs', description: 'Find the best programmes for your students using our advanced search tools.' },
  { icon: FileText, title: 'Submit Applications', description: 'Submit and manage student applications directly through the portal.' },
  { icon: Upload, title: 'Upload Documents', description: 'Securely upload and organize student documents for applications.' },
  { icon: Eye, title: 'Track Applications', description: 'Monitor application status in real-time from submission to decision.' },
  { icon: DollarSign, title: 'Commission Tracking', description: 'View your earnings, pending commissions, and payment history.' },
  { icon: BookOpen, title: 'Learning Resources', description: 'Access training materials, webinars, and guides to grow your business.' },
  { icon: Bell, title: 'Deadlines & Updates', description: 'Stay informed about intake deadlines, policy changes, and announcements.' },
];

function PartnerPortalPreview() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            Partner Portal
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Manage your student recruitment business efficiently
          </motion.p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {PARTNER_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={staggerItemScale}>
                <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-300 group" style={{ borderColor: C.border }}>
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${C.blue}10`, color: C.blue }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: C.text }}>
                        {feat.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed flex-grow" style={{ color: C.textSoft }}>
                      {feat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <Button
              className="h-12 rounded-xl text-sm font-semibold px-8 shadow-md hover:shadow-lg transition-shadow"
              style={{ backgroundColor: C.orange, color: '#FFFFFF' }}
              asChild
            >
              <Link href="/partner/login">
                Partner Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={staggerItem}>
            <Button
              className="h-12 rounded-xl text-sm font-semibold px-8"
              style={{ backgroundColor: C.blue, color: '#FFFFFF' }}
              asChild
            >
              <Link href="/partner/register">
                Become A Partner
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 18 — AI SUPPORT TOOLS
   ═══════════════════════════════════════════════════════════════ */
const AI_TOOLS = [
  { icon: Sparkles, title: 'AI Course Match', description: 'Describe your profile and preferences, get matched with the best courses and universities.', href: '/ai/course-match' },
  { icon: PenTool, title: 'AI SOP Helper', description: 'Generate polished, university-specific Statements of Purpose in minutes.', href: '/ai/sop-helper' },
  { icon: FileText, title: 'AI CV Helper', description: 'Build a professional CV tailored to your target programme and country.', href: '/ai/cv-helper' },
  { icon: ShieldCheck, title: 'AI Visa Coach', description: 'Prepare for your visa interview with AI-powered practice and feedback.', href: '/ai/visa-coach' },
  { icon: MessageSquare, title: 'AI Interview Practice', description: 'Practice university admissions interviews with realistic AI conversations.', href: '/ai/interview' },
  { icon: ClipboardCheck, title: 'AI Document Checklist', description: 'Get smart, personalised document checklists based on your destination.', href: '/ai/checklist' },
  { icon: Award, title: 'AI Scholarship Match', description: 'Find scholarships that match your profile, grades, and destination country.', href: '/ai/scholarship' },
  { icon: Calculator, title: 'AI Study Cost Estimate', description: 'Get estimated costs for tuition, living expenses, and more based on your profile.', href: '/ai/cost-estimate' },
];

function AiSupportTools() {
  return (
    <section className="py-16 md:py-20" style={{ background: C.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: C.text }}
            variants={sectionTitle}
          >
            AI-Powered Support Tools
          </motion.h2>
          <motion.p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: C.textSoft }}
            variants={sectionSubtitle}
          >
            Get instant assistance with our intelligent AI tools
          </motion.p>
        </motion.div>

        {/* AI Tool Cards Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {AI_TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.div key={i} variants={staggerItemScale}>
                <Card className="h-full rounded-2xl border shadow-sm hover:shadow-lg transition-shadow duration-300 group relative overflow-hidden" style={{ borderColor: C.border }}>
                  {/* Sparkle accent */}
                  <div
                    className="absolute top-0 right-0 w-20 h-20 opacity-20 rounded-bl-full"
                    style={{ background: gradients.orange }}
                  />

                  <CardContent className="p-5 flex flex-col h-full relative">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${C.orange}10`, color: C.orange }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: C.text }}>
                        {tool.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed flex-grow mb-4" style={{ color: C.textSoft }}>
                      {tool.description}
                    </p>

                    {/* Try Now button */}
                    <Button
                      className="w-full h-10 rounded-lg text-xs font-semibold text-white self-end"
                      style={{ backgroundColor: C.orange }}
                      asChild
                    >
                      <Link href={tool.href}>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Try Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Safety Disclaimer */}
        <motion.div
          className="rounded-xl p-4 md:p-5 flex items-start gap-3 mb-8"
          style={{ backgroundColor: '#EFF6FF', border: `1px solid ${C.blue}20` }}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeIn}
        >
          <Zap className="h-5 w-5 shrink-0 mt-0.5" style={{ color: C.blue }} />
          <p className="text-sm leading-relaxed" style={{ color: '#1E40AF' }}>
            AI gives preparation guidance only. ALO counselor or visa officer final review is required. AI cannot guarantee admission or visa.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function HomepagePart3() {
  return (
    <>
      <ScholarshipsSection />
      <EnglishTestsSection />
      <VisaSupportSection />
      <StudentPortalPreview />
      <PartnerPortalPreview />
      <AiSupportTools />
    </>
  );
}
