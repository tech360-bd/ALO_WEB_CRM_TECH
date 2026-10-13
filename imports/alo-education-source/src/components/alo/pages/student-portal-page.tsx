'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Fingerprint,
  Clock,
  Users,
  FileCheck,
  MessageCircle,
  Sparkles,
  Target,
  FileText,
  GraduationCap,
  BookOpen,
  Award,
  Globe,
  Brain,
  Briefcase,
  Plane,
  Upload,
  CheckCircle2,
  BarChart3,
  Bell,
  UserCheck,
  ChevronRight,
  Star,
  MonitorSmartphone,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

/* ------------------------------------------------------------------ */
/*  Section wrapper with scroll-triggered animation                     */
/* ------------------------------------------------------------------ */

function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  1. HERO SECTION                                                     */
/* ------------------------------------------------------------------ */

function HeroSection({ onLeadOpen }: { onLeadOpen: () => void }) {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-[#003d80] via-[#0066CC] to-[#004a99]">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-[#F37021]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#FFB347]/10 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-[#FFB347]/60" />
        <div className="absolute top-1/3 left-1/3 h-1.5 w-1.5 rounded-full bg-white/40" />
        <div className="absolute bottom-1/3 right-1/3 h-2.5 w-2.5 rounded-full bg-[#F37021]/40" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FFB347]" />
              <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">Student Portal</span>
              <Badge className="bg-[#F37021] text-white text-[10px] px-1.5 py-0 border-0 font-bold">NEW</Badge>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Your Study Abroad
              <span className="block mt-2 bg-gradient-to-r from-[#FFB347] to-[#F37021] bg-clip-text text-transparent">
                Mission Control
              </span>
            </h1>

            <p className="mt-6 text-lg text-blue-100/90 leading-relaxed max-w-lg">
              Track applications, upload documents, practice interviews, and get AI-powered guidance — all in one personalized dashboard built for your success.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2.5 bg-[#F37021] text-white hover:bg-[#e06818] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] rounded-xl font-semibold"
                onClick={onLeadOpen}
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2.5 border-white/25 text-white bg-white/5 hover:bg-white/15 hover:border-white/40 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300"
                onClick={onLeadOpen}
              >
                <MonitorSmartphone className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-blue-200/80">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['bg-orange-300', 'bg-sky-300', 'bg-amber-300', 'bg-emerald-300'].map((bg, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full ${bg} border-2 border-[#0066CC] flex items-center justify-center text-[9px] font-bold text-slate-700`}>
                      {['S', 'R', 'A', 'K'][i]}
                    </div>
                  ))}
                </div>
                <span className="font-medium">2,400+ active students</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Bank-grade security</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FFB347]" />
                <span>24/7 access</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateY: -5 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10">
              <Image
                src="/images/alo/portal/portal-hero.webp"
                alt="Student Portal Dashboard Preview"
                width={1344}
                height={768}
                className="w-full h-auto"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#003d80]/40 via-transparent to-transparent" />
            </div>
            {/* Floating notification card */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl shadow-xl shadow-black/10 p-3 sm:p-4 border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Application Update</p>
                  <p className="text-[11px] text-slate-500">Offer received from Birmingham!</p>
                </div>
              </div>
            </motion.div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, x: -20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute -top-3 -right-3 sm:-top-5 sm:-right-5 bg-white rounded-xl shadow-xl shadow-black/10 p-3 sm:p-4 border border-slate-100"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#0066CC]/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4.5 w-4.5 text-[#0066CC]" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#0066CC] leading-none">94%</p>
                  <p className="text-[10px] text-slate-500 font-medium">Profile Complete</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  2. HOW IT WORKS                                                     */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    step: '01',
    title: 'Create Your Profile',
    desc: 'Sign up in 2 minutes. Enter your academic background, English scores, and study preferences.',
    icon: UserCheck,
    color: 'bg-[#0066CC]/10 text-[#0066CC]',
  },
  {
    step: '02',
    title: 'Get AI-Matched Courses',
    desc: 'Our AI analyzes your profile and recommends the best-fit courses from 500+ universities worldwide.',
    icon: Brain,
    color: 'bg-[#F37021]/10 text-[#F37021]',
  },
  {
    step: '03',
    title: 'Track Applications',
    desc: 'Submit applications and track every stage in real-time — from documents to offer letter.',
    icon: FileCheck,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    step: '04',
    title: 'Fly to Your Dream University',
    desc: 'Get your visa, pre-departure briefing, and arrive ready to succeed with ALO support.',
    icon: Plane,
    color: 'bg-violet-500/10 text-violet-600',
  },
];

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 lg:py-28 bg-white" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-4 font-semibold">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            From Sign-Up to Takeoff in{' '}
            <span className="text-[#0066CC]">4 Simple Steps</span>
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed">
            Your entire study abroad journey, managed in one place. No chaos, no missed deadlines.
          </p>
        </AnimatedSection>

        <div className="relative">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[#0066CC]/20 via-[#F37021]/20 to-emerald-500/20" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                custom={i}
                variants={scaleIn}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                className="relative"
              >
                <div className="text-center group">
                  {/* Step number circle */}
                  <div className="relative inline-flex mb-6">
                    <div className={`h-16 w-16 rounded-2xl ${s.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                      <s.icon className="h-7 w-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border-2 border-[#0066CC] flex items-center justify-center text-[10px] font-bold text-[#0066CC]">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  3. DASHBOARD PREVIEW                                                 */
/* ------------------------------------------------------------------ */

const MOCK_APPS = [
  { uni: 'University of Birmingham', course: 'MSc Data Science', stage: 'Offer Received', stageColor: 'bg-emerald-100 text-emerald-700', progress: 75 },
  { uni: 'Manchester Met', course: 'MBA International', stage: 'Documents Review', stageColor: 'bg-amber-100 text-amber-700', progress: 45 },
  { uni: 'Aston University', course: 'MSc Computer Science', stage: 'Submitted', stageColor: 'bg-blue-100 text-blue-700', progress: 30 },
];

const MOCK_DOCS = [
  { name: 'Passport Scan', status: 'Approved', icon: '✓' },
  { name: 'Transcript', status: 'Approved', icon: '✓' },
  { name: 'SOP Draft', status: 'Under Review', icon: '…' },
  { name: 'IELTS Score', status: 'Pending', icon: '○' },
];

const MOCK_TASKS = [
  'Upload financial documents for visa',
  'Schedule mock interview session',
  'Review SOP draft from AI assistant',
];

function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 lg:py-28 bg-slate-50" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20 mb-4 font-semibold">
            Dashboard Preview
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything at a{' '}
            <span className="text-[#F37021]">Glance</span>
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed">
            Your personalized mission control — see applications, documents, tasks, and progress in one view.
          </p>
        </AnimatedSection>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Dashboard header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0066CC] to-[#003d80] flex items-center justify-center text-white text-xs font-bold">RA</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Rahim Ahmed</p>
                  <p className="text-[11px] text-slate-500">Student ID: ALO-STU-2024-0847</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-700">Counselor Online</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center relative">
                  <Bell className="h-4 w-4 text-slate-500" />
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#F37021] text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">3</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* Applications column */}
              <div className="p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#0066CC]" />
                    My Applications
                  </h3>
                  <Badge variant="secondary" className="text-[10px] font-semibold">{MOCK_APPS.length} Active</Badge>
                </div>
                <div className="space-y-3">
                  {MOCK_APPS.map((app, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                      className="rounded-xl border border-slate-100 p-3.5 hover:border-[#0066CC]/20 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#0066CC] transition-colors">{app.course}</p>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0066CC] shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2.5">{app.uni}</p>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${app.stageColor}`}>{app.stage}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{app.progress}%</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${app.progress}%` } : { width: 0 }}
                          transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#0066CC]/70"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Documents column */}
              <div className="p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#F37021]" />
                    Documents
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">2/4 Done</span>
                </div>
                <div className="space-y-2.5">
                  {MOCK_DOCS.map((doc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.35 }}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-3 hover:border-slate-200 transition-all duration-200 cursor-pointer group"
                    >
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        doc.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                        doc.status === 'Under Review' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {doc.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors truncate">{doc.name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold shrink-0 ${
                        doc.status === 'Approved' ? 'text-emerald-600' :
                        doc.status === 'Under Review' ? 'text-amber-600' :
                        'text-slate-400'
                      }`}>
                        {doc.status}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Profile completion */}
                <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-[#0066CC]/5 to-[#0066CC]/[0.02] border border-[#0066CC]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#0066CC]">Profile Completion</span>
                    <span className="text-sm font-extrabold text-[#0066CC]">72%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0066CC]/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '72%' } : { width: 0 }}
                      transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[#0066CC] to-[#0066CC]/80"
                    />
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">Complete your IELTS score and financial docs</p>
                </div>
              </div>

              {/* Tasks / Timeline column */}
              <div className="p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    Next Steps
                  </h3>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">3 Pending</Badge>
                </div>
                <div className="space-y-2.5">
                  {MOCK_TASKS.map((task, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.35 }}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 px-3.5 py-3 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="h-5 w-5 rounded-md border-2 border-slate-200 group-hover:border-amber-400 shrink-0 mt-0.5 transition-colors flex items-center justify-center">
                        <div className="h-2 w-2 rounded-sm bg-transparent group-hover:bg-amber-400 transition-colors" />
                      </div>
                      <p className="text-xs text-slate-600 group-hover:text-slate-800 leading-relaxed transition-colors">{task}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Counselor card */}
                <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-50/30 border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F37021] to-[#FFB347] flex items-center justify-center text-white text-xs font-bold">SK</div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sarah Khan</p>
                      <p className="text-[10px] text-slate-500">Your Assigned Counselor</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-[#F37021] hover:bg-[#e06818] text-white rounded-lg text-xs font-semibold h-8 transition-all duration-200 hover:shadow-md hover:shadow-orange-200/50"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Message Counselor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  4. FEATURE GRID                                                     */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: FileCheck, title: 'Application Tracking', desc: 'Track every application from submission to enrollment with real-time 11-stage pipeline visibility.', color: 'bg-[#0066CC]', lightColor: 'bg-[#0066CC]/10' },
  { icon: Upload, title: 'Document Hub', desc: 'Upload, organize, and track all required documents. AI detects missing items automatically.', color: 'bg-[#F37021]', lightColor: 'bg-[#F37021]/10' },
  { icon: Brain, title: 'AI CV Builder', desc: 'Generate a professional CV tailored to your target university and program in minutes.', color: 'bg-violet-600', lightColor: 'bg-violet-600/10' },
  { icon: FileText, title: 'SOP Assistant', desc: 'AI drafts your Statement of Purpose, then helps you refine it to perfection.', color: 'bg-emerald-600', lightColor: 'bg-emerald-600/10' },
  { icon: GraduationCap, title: 'Interview Practice', desc: 'Practice with AI-powered mock interviews and get instant feedback on your performance.', color: 'bg-rose-500', lightColor: 'bg-rose-500/10' },
  { icon: Target, title: 'Smart Course Matching', desc: 'Our AI analyzes 500+ universities and 10,000+ courses to find your perfect match.', color: 'bg-amber-500', lightColor: 'bg-amber-500/10' },
  { icon: Award, title: 'Scholarship Finder', desc: 'Auto-discover scholarships you qualify for based on your profile and destination.', color: 'bg-sky-500', lightColor: 'bg-sky-500/10' },
  { icon: Plane, title: 'Visa Tracking', desc: 'Complete visa guidance with document checklist, appointment scheduling, and status tracking.', color: 'bg-teal-600', lightColor: 'bg-teal-600/10' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Never miss a deadline. Get alerts for intake dates, document reminders, and offer updates.', color: 'bg-pink-500', lightColor: 'bg-pink-500/10' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Visual dashboards showing your application health, profile strength, and readiness score.', color: 'bg-indigo-500', lightColor: 'bg-indigo-500/10' },
  { icon: BookOpen, title: 'English Test Prep', desc: 'IELTS, PTE, TOEFL prep resources and mock tests with AI-powered score predictions.', color: 'bg-cyan-600', lightColor: 'bg-cyan-600/10' },
  { icon: Users, title: 'Counselor Chat', desc: 'Direct messaging with your assigned counselor. Share files, ask questions, get answers fast.', color: 'bg-[#F37021]', lightColor: 'bg-[#F37021]/10' },
];

function FeatureGridSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 lg:py-28 bg-white" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20 mb-4 font-semibold">
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            12 Tools Built for{' '}
            <span className="text-[#0066CC]">Your Success</span>
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed">
            Every feature designed to remove friction from your study abroad journey.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:border-[#0066CC]/20 hover:shadow-lg hover:shadow-[#0066CC]/5 hover:-translate-y-1 cursor-pointer"
            >
              <div className={`h-11 w-11 rounded-xl ${f.lightColor} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                <f.icon className={`h-5 w-5 ${f.color.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5 group-hover:text-[#0066CC] transition-colors">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-[#0066CC] to-[#F37021] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  5. STUDENT BENEFITS                                                 */
/* ------------------------------------------------------------------ */

const BENEFITS = [
  {
    icon: Zap,
    title: 'Save 6+ Months',
    desc: 'Our AI automates course matching, document checks, and application prep — cutting your timeline in half.',
    stat: '50%',
    statLabel: 'faster process',
    accent: 'from-[#F37021] to-amber-500',
  },
  {
    icon: Shield,
    title: '98% Visa Success',
    desc: 'Expert visa counselors review every application. Our AI catches missing documents before submission.',
    stat: '98%',
    statLabel: 'visa approval',
    accent: 'from-[#0066CC] to-blue-400',
  },
  {
    icon: Award,
    title: '$2.5M+ Scholarships',
    desc: 'Our AI matches you with eligible scholarships. Students have secured millions in funding through ALO.',
    stat: '$2.5M+',
    statLabel: 'scholarships won',
    accent: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Globe,
    title: '500+ Universities',
    desc: 'Direct partnerships with top universities across UK, USA, Canada, Australia, and 10 more countries.',
    stat: '500+',
    statLabel: 'partner unis',
    accent: 'from-violet-500 to-purple-400',
  },
];

function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 lg:py-28 bg-slate-50" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 mb-4 font-semibold">
            Why Students Love ALO
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Real Results,{' '}
            <span className="text-[#F37021]">Real Success</span>
          </h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="relative rounded-2xl bg-white border border-slate-100 p-6 overflow-hidden group hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
            >
              {/* Top gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${b.accent}`} />
              <b.icon className="h-6 w-6 text-slate-400 mb-4" />
              <h3 className="text-base font-bold text-slate-900 mb-2">{b.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{b.desc}</p>
              <div className="pt-4 border-t border-slate-100">
                <span className={`text-2xl font-extrabold bg-gradient-to-r ${b.accent} bg-clip-text text-transparent`}>{b.stat}</span>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{b.statLabel}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  6. SECURITY & TRUST                                                  */
/* ------------------------------------------------------------------ */

const SECURITY_ITEMS = [
  { icon: Lock, title: 'End-to-End Encryption', desc: 'All your documents and personal data are encrypted at rest and in transit using AES-256.' },
  { icon: Fingerprint, title: 'Secure Authentication', desc: 'Two-factor authentication and session management protect your account from unauthorized access.' },
  { icon: Shield, title: 'GDPR Compliant', desc: 'We follow international data protection standards. Your data is never shared without consent.' },
  { icon: Clock, title: '99.9% Uptime', desc: 'Enterprise-grade infrastructure ensures your portal is available whenever you need it.' },
];

function SecuritySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-b from-[#0A1628] to-[#0d1f3c] text-white" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-4">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Security First</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your Data is{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Always Safe</span>
          </h2>
          <p className="mt-4 text-blue-200/70 leading-relaxed">
            We take security as seriously as your education. Bank-grade protection for every document you upload.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <item.icon className="h-5.5 w-5.5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
              <p className="text-xs text-blue-200/60 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  7. TESTIMONIALS                                                     */
/* ------------------------------------------------------------------ */

const PORTAL_TESTIMONIALS = [
  {
    name: 'Fatima Rahman',
    uni: 'University of Manchester',
    course: 'MSc Data Science',
    text: 'The portal made everything so easy. I could track my application, upload documents, and message my counselor — all from my phone. Got my offer in 3 weeks!',
    avatar: 'FR',
    color: 'bg-rose-400',
    rating: 5,
  },
  {
    name: 'Tanvir Hassan',
    uni: 'University of Birmingham',
    course: 'MBA International Business',
    text: 'AI CV builder was a game-changer. It tailored my CV perfectly for UK universities. The interview practice feature also helped me prepare for the real thing.',
    avatar: 'TH',
    color: 'bg-sky-400',
    rating: 5,
  },
  {
    name: 'Nusrat Jahan',
    uni: 'Aston University',
    course: 'MSc Computer Science',
    text: 'I was worried about missing deadlines, but the smart notifications reminded me of everything. My counselor caught a document error I would have missed!',
    avatar: 'NJ',
    color: 'bg-amber-400',
    rating: 5,
  },
];

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 lg:py-28 bg-white" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="bg-[#FFB347]/20 text-amber-700 border-amber-200 mb-4 font-semibold">
            Student Stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Loved by{' '}
            <span className="text-[#F37021]">2,400+ Students</span>
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {PORTAL_TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#FFB347] text-[#FFB347]" />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{t.avatar}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">{t.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{t.course} — {t.uni}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  8. CTA SECTION                                                      */
/* ------------------------------------------------------------------ */

function CtaSection({ onLeadOpen }: { onLeadOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="relative py-20 lg:py-28 bg-gradient-to-br from-[#0066CC] via-[#0052a3] to-[#003d80] overflow-hidden" ref={ref}>
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#F37021]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-3 w-3 rounded-full bg-[#FFB347]/40" />
        <div className="absolute bottom-1/3 right-1/3 h-2 w-2 rounded-full bg-white/30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Ready to Take Control of Your{' '}
          <span className="bg-gradient-to-r from-[#FFB347] to-[#F37021] bg-clip-text text-transparent">
            Study Abroad Journey?
          </span>
        </h2>
        <p className="mt-5 text-lg text-blue-100/80 leading-relaxed max-w-xl mx-auto">
          Join 2,400+ students who are already managing their applications smarter with the ALO Student Portal.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            className="gap-2.5 bg-[#F37021] text-white hover:bg-[#e06818] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] rounded-xl font-semibold text-base px-8"
            onClick={onLeadOpen}
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2.5 border-white/25 text-white bg-white/5 hover:bg-white/15 hover:border-white/40 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300"
            onClick={onLeadOpen}
          >
            <MessageCircle className="h-4 w-4" />
            Talk to an Expert
          </Button>
        </div>
        <p className="mt-6 text-xs text-blue-200/50">
          Free forever for students. No credit card required.
        </p>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE EXPORT                                                    */
/* ------------------------------------------------------------------ */

interface StudentPortalPageProps {
  onBack: () => void;
  onLeadOpen: () => void;
}

export function StudentPortalPage({ onBack, onLeadOpen }: StudentPortalPageProps) {
  return (
    <>
      <HeroSection onLeadOpen={onLeadOpen} />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <FeatureGridSection />
      <BenefitsSection />
      <SecuritySection />
      <TestimonialsSection />
      <CtaSection onLeadOpen={onLeadOpen} />
    </>
  );
}
