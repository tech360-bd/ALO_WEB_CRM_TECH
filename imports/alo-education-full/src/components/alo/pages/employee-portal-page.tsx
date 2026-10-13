'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Clock,
  Users,
  FileCheck,
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
  BarChart3,
  Bell,
  UserCheck,
  ChevronRight,
  Star,
  Zap,
  CalendarDays,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  PieChart,
  LayoutList,
  Kanban,
  CircleDot,
  CheckCircle2,
  UsersRound,
  Building2,
  ClipboardCheck,
  FolderKanban,
  HeadphonesIcon,
  DollarSign,
  Timer,
  Eye,
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
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#004a99]">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-[500px] w-[500px] rounded-full bg-[#F37021]/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#0066CC]/10 blur-3xl" />
        <div className="absolute top-1/4 right-1/3 h-2 w-2 rounded-full bg-[#FFB347]/50" />
        <div className="absolute top-1/3 left-1/4 h-1.5 w-1.5 rounded-full bg-white/30" />
        <div className="absolute bottom-1/4 right-1/4 h-2.5 w-2.5 rounded-full bg-[#F37021]/30" />
        <div className="absolute top-2/3 left-1/3 h-1 w-1 rounded-full bg-[#FFB347]/40" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
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
              <Briefcase className="h-3.5 w-3.5 text-[#FFB347]" />
              <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">Employee Portal</span>
              <Badge className="bg-[#F37021] text-white text-[10px] px-1.5 py-0 border-0 font-bold">NEW</Badge>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Your Team's
              <span className="block mt-2 bg-gradient-to-r from-[#FFB347] via-[#F37021] to-[#FFB347] bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>

            <p className="mt-6 text-lg text-blue-100/90 leading-relaxed max-w-lg">
              Manage leads, track student applications, automate follow-ups, and close more conversions — all from one powerful dashboard designed for education consultancies.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2.5 bg-[#F37021] text-white hover:bg-[#e06818] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] rounded-xl font-semibold"
                onClick={onLeadOpen}
              >
                Request Demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2.5 border-white/25 text-white bg-white/5 hover:bg-white/15 hover:border-white/40 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300"
                onClick={onLeadOpen}
              >
                <Eye className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-blue-200/80">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['bg-orange-300', 'bg-sky-300', 'bg-amber-300', 'bg-emerald-300'].map((bg, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full ${bg} border-2 border-[#0d2847] flex items-center justify-center text-[9px] font-bold text-slate-700`}>
                      {['C', 'M', 'S', 'R'][i]}
                    </div>
                  ))}
                </div>
                <span className="font-medium">350+ team members</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Enterprise security</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#FFB347]" />
                <span>Real-time sync</span>
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
              <Image
                src="/images/alo/employee-portal/portal-hero.webp"
                alt="Employee Portal Dashboard Preview"
                width={1344}
                height={768}
                className="w-full h-auto"
                priority
              />\n              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/50 via-transparent to-transparent" />
            </div>

            {/* Floating lead card */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl shadow-xl shadow-black/10 p-3 sm:p-4 border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-[#F37021]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Conversion Rate</p>
                  <p className="text-sm font-bold text-emerald-600">+34% this month</p>
                </div>
              </div>
            </motion.div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, x: -20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-xl shadow-xl shadow-black/10 p-3 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#0066CC]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Active Leads</p>
                  <p className="text-sm font-bold text-slate-800">1,247</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  2. HOW IT WORKS SECTION                                             */
/* ------------------------------------------------------------------ */

const ONBOARDING_STEPS = [
  {
    icon: UserCheck,
    title: 'Create Your Profile',
    desc: 'Set up your role, permissions, and communication preferences in under 2 minutes.',
    color: 'bg-blue-500',
  },
  {
    icon: LayoutList,
    title: 'Import Your Pipeline',
    desc: 'Upload existing leads via CSV or connect your existing CRM with one-click integration.',
    color: 'bg-orange-500',
  },
  {
    icon: Kanban,
    title: 'Manage & Track',
    desc: 'Move students through stages, assign tasks, set reminders, and monitor progress in real-time.',
    color: 'bg-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Grow Results',
    desc: 'AI-powered insights help you identify bottlenecks, automate follow-ups, and boost conversions.',
    color: 'bg-amber-500',
  },
];

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#0066CC]/[0.03] blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#F37021]/[0.03] blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 mb-4">
            <Zap className="h-3.5 w-3.5 text-[#0066CC]" />
            <span className="text-xs font-semibold text-[#0066CC] tracking-wide uppercase">Quick Setup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Up and Running in{' '}
            <span className="bg-gradient-to-r from-[#0066CC] to-[#004a99] bg-clip-text text-transparent">4 Simple Steps</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            No complex training needed. Our intuitive interface gets your team productive from day one.
          </p>
        </AnimatedSection>

        <div ref={ref} className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-emerald-200" />

          {ONBOARDING_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              custom={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' }}
              className="relative text-center group"
            >
              <div className="relative z-10 mx-auto mb-5 h-14 w-14 rounded-2xl bg-white shadow-lg shadow-slate-200/80 border border-slate-100 flex items-center justify-center group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className={`h-8 w-8 rounded-xl ${step.color} flex items-center justify-center`}>
                  <step.icon className="h-4.5 w-4.5 text-white" />
                </div>
                {/* Step number */}
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  3. DASHBOARD PREVIEW SECTION                                        */
/* ------------------------------------------------------------------ */

function DashboardPreviewSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50/80 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, #0066CC 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 border border-orange-100 px-4 py-1.5 mb-4">
            <LayoutList className="h-3.5 w-3.5 text-[#F37021]" />
            <span className="text-xs font-semibold text-[#F37021] tracking-wide uppercase">Dashboard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Everything at a{' '}
            <span className="bg-gradient-to-r from-[#F37021] to-[#e06818] bg-clip-text text-transparent">Glance</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            A unified workspace that puts leads, students, tasks, and performance metrics in one intelligent dashboard.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xl shadow-slate-300/30 bg-white">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-md mx-auto h-7 rounded-lg bg-white border border-slate-200 flex items-center px-3 gap-2">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-400">portal.aloeducation.com/employee/dashboard</span>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {/* Stat cards */}
                {[
                  { label: 'Active Leads', value: '1,247', change: '+18%', icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
                  { label: 'This Month Apps', value: '89', change: '+24%', icon: GraduationCap, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
                  { label: 'Conversion Rate', value: '34.2%', change: '+5.1%', icon: Target, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
                  { label: 'Revenue', value: '$284K', change: '+31%', icon: DollarSign, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl ${stat.bg} p-3 sm:p-4 border border-slate-100`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`h-8 w-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className={`text-[10px] font-bold ${stat.text} bg-white/80 rounded-full px-2 py-0.5`}>{stat.change}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-4">
                {/* Leads Pipeline */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 p-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Lead Pipeline</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Last 7 days</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { stage: 'New Inquiry', count: 342, total: 342, color: 'bg-blue-500' },
                      { stage: 'Consultation', count: 218, total: 342, color: 'bg-sky-400' },
                      { stage: 'Application', count: 156, total: 342, color: 'bg-orange-400' },
                      { stage: 'Offer Received', count: 89, total: 342, color: 'bg-emerald-400' },
                      { stage: 'Enrolled', count: 64, total: 342, color: 'bg-emerald-600' },
                    ].map((item) => (
                      <div key={item.stage} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-28 shrink-0 truncate">{item.stage}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(item.count / item.total) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                            className={`h-full ${item.color} rounded-full`}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's Tasks */}
                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Today's Tasks</h3>
                    <Bell className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { task: 'Follow up: Rahim Ahmed', time: '10:00 AM', urgent: true, done: false },
                      { task: 'Review: Fatima SOP', time: '11:30 AM', urgent: false, done: false },
                      { task: 'Call: Karim parents', time: '2:00 PM', urgent: true, done: false },
                      { task: 'Submit: 5 UK apps', time: '4:00 PM', urgent: false, done: true },
                      { task: 'Meeting: weekly sync', time: '5:30 PM', urgent: false, done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                          {item.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.task}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                            {item.urgent && <Badge className="bg-red-50 text-red-600 text-[9px] px-1.5 py-0 border-0 h-4">URGENT</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row: Calendar + Communication */}
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-[#0066CC]" />
                    <h3 className="text-sm font-bold text-slate-800">Upcoming Calendar</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { event: 'University of Birmingham Webinar', date: 'Tomorrow, 3 PM', color: 'border-l-blue-500' },
                      { event: 'Visa Workshop - UK Spring 2025', date: 'Wed, 11 AM', color: 'border-l-orange-500' },
                      { event: 'Monthly Team Review', date: 'Friday, 4 PM', color: 'border-l-emerald-500' },
                    ].map((item, i) => (
                      <div key={i} className={`pl-3 py-2 border-l-2 ${item.color} rounded-r-lg bg-slate-50/50`}>
                        <p className="text-xs font-medium text-slate-700">{item.event}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-[#F37021]" />
                    <h3 className="text-sm font-bold text-slate-800">Communication</h3>
                  </div>
                  <div className="space-y-2">
                    {[
                      { msg: 'Rahim sent IELTS score', from: 'WhatsApp', icon: '💬', time: '2m ago', unread: true },
                      { msg: 'UK visa docs approved', from: 'Email', icon: '📧', time: '15m ago', unread: true },
                      { msg: 'Meeting notes shared', from: 'Slack', icon: '📋', time: '1h ago', unread: false },
                      { msg: 'New lead from Facebook', from: 'Facebook', icon: '📘', time: '2h ago', unread: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{item.msg}</p>
                          <p className="text-[10px] text-slate-400">{item.from} · {item.time}</p>
                        </div>
                        {item.unread && <div className="h-2 w-2 rounded-full bg-[#F37021]" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  4. FEATURE GRID SECTION                                             */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Users, title: 'Lead Management', desc: 'Capture, score, and nurture leads with AI-powered qualification and automated follow-up sequences.', color: 'bg-blue-500' },
  { icon: GraduationCap, title: 'Student 360° View', desc: 'Complete student profiles with documents, applications, communications, and progress history in one place.', color: 'bg-orange-500' },
  { icon: ClipboardCheck, title: 'Application Tracking', desc: '11-stage application pipeline with stage-by-stage tracking, deadlines, and document requirements.', color: 'bg-emerald-500' },
  { icon: FolderKanban, title: 'Document Hub', desc: 'Centralized document management with auto-classification, OCR scanning, and version control.', color: 'bg-purple-500' },
  { icon: Brain, title: 'AI Assistant', desc: 'AI-powered insights for lead scoring, SOP review, eligibility checking, and conversion optimization.', color: 'bg-amber-500' },
  { icon: MessageSquare, title: 'Unified Inbox', desc: 'WhatsApp, Email, Facebook, Phone — all conversations in one inbox with smart routing and templates.', color: 'bg-sky-500' },
  { icon: CalendarDays, title: 'Task & Calendar', desc: 'Smart task management with calendar integration, reminders, and team assignment capabilities.', color: 'bg-rose-500' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Real-time dashboards with conversion funnels, revenue tracking, and custom report generation.', color: 'bg-teal-500' },
  { icon: Phone, title: 'Call Center', desc: 'Built-in VoIP with call recording, call scripts, auto-dialer, and performance analytics.', color: 'bg-indigo-500' },
  { icon: Award, title: 'Scholarship Matching', desc: 'AI-matched scholarship recommendations for each student based on profile and destination.', color: 'bg-pink-500' },
  { icon: Globe, title: 'University Database', desc: '500+ universities with courses, requirements, scholarships, and real-time availability data.', color: 'bg-cyan-500' },
  { icon: HeadphonesIcon, title: 'Counselor Tools', desc: 'Conversation guides, email templates, meeting schedulers, and performance scorecards.', color: 'bg-lime-600' },
];

function FeatureGridSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 lg:py-28 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#0066CC]" />
            <span className="text-xs font-semibold text-[#0066CC] tracking-wide uppercase">Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            12 Tools to{' '}
            <span className="bg-gradient-to-r from-[#0066CC] to-[#004a99] bg-clip-text text-transparent">Supercharge</span>
            {' '}Your Team
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Every tool your counselors, managers, and operations team needs — built for education consultancy workflows.
          </p>
        </AnimatedSection>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Bottom gradient accent on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066CC] to-[#F37021] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className={`h-10 w-10 rounded-xl ${feature.color} flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{feature.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  5. BENEFITS / STATS SECTION                                         */
/* ------------------------------------------------------------------ */

const BENEFITS = [
  { value: '3x', label: 'Faster Lead Response', desc: 'AI auto-responds within 30 seconds', color: 'from-blue-500 to-blue-600', icon: Timer },
  { value: '45%', label: 'Higher Conversion', desc: 'Smart scoring & automated nurture', color: 'from-orange-500 to-orange-600', icon: Target },
  { value: '80%', label: 'Time Saved', desc: 'Automated docs, follow-ups, tasks', color: 'from-emerald-500 to-emerald-600', icon: Clock },
  { value: '99.9%', label: 'Uptime SLA', desc: 'Enterprise-grade infrastructure', color: 'from-amber-500 to-amber-600', icon: Shield },
];

function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-[#F37021]/[0.04] blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Measurable{' '}
            <span className="bg-gradient-to-r from-[#F37021] to-[#e06818] bg-clip-text text-transparent">Impact</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Real numbers from real teams using the ALO Employee Portal daily.
          </p>
        </AnimatedSection>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.label}
              custom={i}
              variants={scaleIn}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="relative rounded-2xl bg-white border border-slate-200 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300"
            >
              {/* Gradient top accent */}
              <div className={`h-1.5 bg-gradient-to-r ${b.color}`} />
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <b.icon className="h-6 w-6 text-slate-700" />
                </div>
                <p className="text-4xl font-extrabold text-slate-900 mb-1">{b.value}</p>
                <p className="text-sm font-bold text-slate-700 mb-1">{b.label}</p>
                <p className="text-xs text-slate-500">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  6. ROLE-BASED SECTION                                               */
/* ------------------------------------------------------------------ */

const ROLES = [
  {
    role: 'Counselor',
    icon: HeadphonesIcon,
    desc: 'Manage your student caseload, track applications, send reminders, and communicate across channels — all from one view.',
    features: ['Student 360° Profile', 'Application Pipeline', 'WhatsApp Integration', 'Task Reminders', 'Performance Scorecard'],
    color: 'bg-blue-500',
    accent: 'border-blue-200 hover:border-blue-400',
    badgeBg: 'bg-blue-50 text-blue-700',
  },
  {
    role: 'Team Lead / Manager',
    icon: UsersRound,
    desc: 'Monitor team performance, allocate leads, review applications, and generate reports to optimize operations.',
    features: ['Team Dashboard', 'Lead Allocation', 'Pipeline Analytics', 'Weekly Reports', 'SLA Monitoring'],
    color: 'bg-orange-500',
    accent: 'border-orange-200 hover:border-orange-400',
    badgeBg: 'bg-orange-50 text-orange-700',
  },
  {
    role: 'Operations',
    icon: Building2,
    desc: 'Handle document processing, visa applications, university communications, and compliance requirements.',
    features: ['Document Hub', 'Visa Tracker', 'University Liaison', 'Compliance Checklist', 'Audit Trail'],
    color: 'bg-emerald-500',
    accent: 'border-emerald-200 hover:border-emerald-400',
    badgeBg: 'bg-emerald-50 text-emerald-700',
  },
  {
    role: 'Marketing',
    icon: PieChart,
    desc: 'Track campaigns, analyze lead sources, manage social media, and optimize marketing spend across channels.',
    features: ['Campaign Analytics', 'Lead Source Tracking', 'Social Dashboard', 'Marketing AI', 'ROI Reports'],
    color: 'bg-purple-500',
    accent: 'border-purple-200 hover:border-purple-400',
    badgeBg: 'bg-purple-50 text-purple-700',
  },
];

function RoleBasedSection() {
  return (
    <section className="py-20 lg:py-28 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 mb-4">
            <UsersRound className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">Role-Based Access</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Tailored for{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">Every Role</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Each team member sees exactly what they need — no more, no less. Granular RBAC keeps data secure.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 gap-5">
          {ROLES.map((item, i) => (
            <AnimatedSection key={item.role} delay={i * 0.1}>
              <div className={`rounded-2xl border-2 ${item.accent} bg-white p-6 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 h-full`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-12 w-12 rounded-xl ${item.color} flex items-center justify-center shrink-0`}> 
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <Badge className={`${item.badgeBg} text-[10px] font-bold px-2 py-0.5 border-0 mb-1`}>{item.role}</Badge>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.features.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 rounded-full px-2.5 py-1 border border-slate-100">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  7. SECURITY & TRUST SECTION                                         */
/* ------------------------------------------------------------------ */

const SECURITY_FEATURES = [
  { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3). Zero-knowledge architecture.', color: 'bg-blue-500' },
  { icon: Shield, title: 'Role-Based Access Control', desc: 'Granular permissions with 8 roles, field-level access, and audit trail for every action.', color: 'bg-emerald-500' },
  { icon: FileCheck, title: 'GDPR & Data Compliance', desc: 'Full GDPR compliance with data portability, right to erasure, and consent management.', color: 'bg-orange-500' },
  { icon: Clock, title: '99.9% Uptime SLA', desc: 'Enterprise infrastructure with auto-failover, daily backups, and 24/7 monitoring.', color: 'bg-amber-500' },
];

function SecuritySection() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[#0A1628] to-[#0d1f3c] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-4">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Enterprise Security</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Bank-Grade{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Security</span>
          </h2>
          <p className="mt-4 text-lg text-blue-200/70 leading-relaxed">
            Your student data is protected by the same security standards used by major financial institutions.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECURITY_FEATURES.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.1}>
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 h-full text-center">
                <div className={`mx-auto mb-4 h-12 w-12 rounded-xl ${item.color} flex items-center justify-center`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-blue-200/60 leading-relaxed">{item.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  8. TESTIMONIALS SECTION                                             */
/* ------------------------------------------------------------------ */

const EMPLOYEE_TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Senior Counselor',
    company: 'ALO Education, Dhaka',
    quote: 'The unified inbox changed everything. I used to check 5 different apps — now WhatsApp, email, and Facebook messages all come to one place. My response time dropped from 2 hours to 5 minutes.',
    stats: '350+ students managed',
    avatar: 'S',
    avatarBg: 'bg-rose-300',
    rating: 5,
  },
  {
    name: 'Ahmed Hassan',
    role: 'Team Lead',
    company: 'ALO Education, Chittagong',
    quote: 'The pipeline analytics alone helped us increase our conversion rate by 40%. We can now see exactly where students drop off and intervene at the right moment.',
    stats: '40% conversion increase',
    avatar: 'A',
    avatarBg: 'bg-sky-300',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Operations Manager',
    company: 'ALO Education',
    quote: 'Document management used to be our biggest headache. Now with OCR and auto-classification, processing time is down 70%. Visa applications never miss a deadline.',
    stats: '70% faster processing',
    avatar: 'P',
    avatarBg: 'bg-amber-300',
    rating: 5,
  },
];

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#0066CC]/[0.03] blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-4 py-1.5 mb-4">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 tracking-wide uppercase">Team Love</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Loved by{' '}
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Our Team</span>
          </h2>
        </AnimatedSection>

        <div ref={ref} className="grid md:grid-cols-3 gap-6">
          {EMPLOYEE_TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className={`h-10 w-10 rounded-full ${t.avatarBg} flex items-center justify-center text-sm font-bold text-slate-700`}>
                  {t.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
                <Badge className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 border-0">{t.stats}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  9. AI INTEGRATION SECTION                                           */
/* ------------------------------------------------------------------ */

const AI_FEATURES = [
  {
    icon: Brain,
    title: 'AI Lead Scoring',
    desc: 'Automatically score and prioritize leads based on engagement, profile completeness, and conversion probability.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: FileText,
    title: 'AI SOP Review',
    desc: 'Instantly review and score Statements of Purpose against university requirements with detailed improvement suggestions.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Target,
    title: 'Smart Matching',
    desc: 'Match students to universities and courses with 94% accuracy using multi-factor AI analysis.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Mail,
    title: 'AI Email Composer',
    desc: 'Generate personalized follow-up emails, offer letters, and communication templates tailored to each student.',
    color: 'from-purple-500 to-purple-600',
  },
];

function AIIntegrationSection() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F37021]/[0.04] blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#0066CC]/[0.04] blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 border border-purple-100 px-4 py-1.5 mb-4">
            <Brain className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600 tracking-wide uppercase">AI-Powered</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Built-In{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Intelligence</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            AI doesn't replace your team — it amplifies them. Automate the routine, focus on the relationship.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 gap-5">
          {AI_FEATURES.map((item, i) => (
            <AnimatedSection key={item.title} delay={i * 0.1}>
              <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}> 
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  10. CTA SECTION                                                     */
/* ------------------------------------------------------------------ */

function CtaSection({ onLeadOpen }: { onLeadOpen: () => void }) {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-[#003d80] via-[#0066CC] to-[#004a99]">
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-[#F37021]/10 blur-2xl" />
        <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-[#FFB347]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-3 w-3 rounded-full bg-white/20" />
        <div className="absolute top-1/3 right-1/3 h-2 w-2 rounded-full bg-[#FFB347]/30" />
        <div className="absolute bottom-1/4 left-1/2 h-2.5 w-2.5 rounded-full bg-white/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#FFB347]" />
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">Get Started Today</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-[#FFB347] to-[#F37021] bg-clip-text text-transparent">Your Operations?</span>
          </h2>

          <p className="mt-6 text-lg text-blue-100/80 leading-relaxed max-w-2xl mx-auto">
            Join 350+ team members already using ALO Employee Portal. Schedule a demo and see the difference in your first week.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="gap-2.5 bg-[#F37021] text-white hover:bg-[#e06818] shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] rounded-xl font-semibold"
              onClick={onLeadOpen}
            >
              Schedule Free Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2.5 border-white/25 text-white bg-white/5 hover:bg-white/15 hover:border-white/40 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300"
              onClick={onLeadOpen}
            >
              <Phone className="h-4 w-4" />
              Talk to Sales
            </Button>
          </div>

          <p className="mt-6 text-sm text-blue-200/50">No credit card required · Free 14-day trial · Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  EXPORT: Employee Portal Page                                       */
/* ================================================================== */

export function EmployeePortalPage({
  onBack,
  onLeadOpen,
}: {
  onBack: () => void;
  onLeadOpen: () => void;
}) {
  return (
    <div>
      {/* Back button */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-3 text-sm font-medium text-slate-600 hover:text-[#0066CC] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-[#0066CC] font-semibold">Employee Portal</span>
          </button>
        </div>
      </div>

      <HeroSection onLeadOpen={onLeadOpen} />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <FeatureGridSection />
      <BenefitsSection />
      <RoleBasedSection />
      <AIIntegrationSection />
      <SecuritySection />
      <TestimonialsSection />
      <CtaSection onLeadOpen={onLeadOpen} />
    </div>
  );
}