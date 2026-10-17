'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Globe, GraduationCap, Brain, FileCheck, Sparkles, ArrowRight, CheckCircle2,
  BookOpen, Plane, Shield, Users, Star, ChevronRight, Search, MapPin,
  MessageCircle, Phone, Mail, ArrowUpRight, Zap, Award, TrendingUp, Clock, ChevronDown,
  Bot, ScanLine, Mic, FileText, Stamp, Briefcase, Heart, Menu, X, Play, Send,
  LogIn, LogOut, User, LayoutDashboard, Bell
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
  onAuthOpen: () => void;
}

/* ───────── animations ───────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ───────── data ───────── */
const countries = [
  { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', slug: 'uk', unis: 150, tuition: '\u00A312,000\u2013\u00A335,000', courses: 'MSc, MBA, BSc', color: '#0066CC' },
  { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', slug: 'usa', unis: 200, tuition: '$20,000\u2013$60,000', courses: 'MS, MBA, BS', color: '#F37021' },
  { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', slug: 'canada', unis: 100, tuition: 'CAD 15,000\u201340,000', courses: 'MSc, PG Diploma', color: '#DC2626' },
  { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', slug: 'australia', unis: 80, tuition: 'AUD 20,000\u201345,000', courses: 'MSc, Masters', color: '#FFB347' },
  { name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', slug: 'germany', unis: 120, tuition: '\u20AC0\u2013\u20AC3,000 (public)', courses: 'MS, PhD', color: '#1a1a2e' },
  { name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', slug: 'new-zealand', unis: 40, tuition: 'NZD 22,000\u201335,000', courses: 'PG Dip, Masters', color: '#0066CC' },
  { name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', slug: 'ireland', unis: 35, tuition: '\u20AC10,000\u2013\u20AC25,000', courses: 'MSc, PG Diploma', color: '#16A34A' },
  { name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', slug: 'netherlands', unis: 45, tuition: '\u20AC8,000\u2013\u20AC20,000', courses: 'MS, BSc', color: '#FF6600' },
];

const aiFeatures = [
  { Icon: Brain, title: 'AI Course Matcher', desc: 'Analyzes your profile, scores, and preferences to find the perfect course match with 95% accuracy.', badge: 'Most Popular' },
  { Icon: FileText, title: 'AI SOP Writer', desc: "Generates compelling Statements of Purpose tailored to each university's requirements in minutes.", badge: 'AI Powered' },
  { Icon: ScanLine, title: 'AI Document Scanner', desc: 'Automatically verifies transcripts, passports, and financial documents for completeness and accuracy.', badge: 'AI Powered' },
  { Icon: CheckCircle2, title: 'AI Eligibility Check', desc: 'Instantly checks your eligibility against 500+ universities and 10,000+ courses worldwide.', badge: 'AI Powered' },
  { Icon: Mic, title: 'AI Interview Coach', desc: 'Practice university admission interviews with our AI coach that adapts to your target program.', badge: 'New' },
  { Icon: Stamp, title: 'AI Visa Guide', desc: 'Step-by-step visa application guidance with document checklist and common rejection reasons.', badge: 'AI Powered' },
];

const services = [
  { Icon: Search, title: 'Course Matching', desc: 'AI-powered algorithm matches you with the best-fit programs from 500+ universities.' },
  { Icon: FileCheck, title: 'Application Processing', desc: 'End-to-end application management with real-time tracking and status updates.' },
  { Icon: FileText, title: 'SOP & Essay Writing', desc: 'Professional SOPs, essays, and personal statements crafted with AI assistance.' },
  { Icon: Shield, title: 'Visa Processing', desc: 'Complete visa guidance with document verification and interview preparation.' },
  { Icon: Briefcase, title: 'Education Loan', desc: 'Partnership with leading financial institutions for hassle-free education loans.' },
  { Icon: Plane, title: 'Pre-Departure', desc: 'Comprehensive pre-departure orientation including accommodation and travel setup.' },
];

const testimonials = [
  { name: 'Rahim Uddin', loc: 'Dhaka', uni: 'University of Manchester', course: 'MSc Data Science', flag: '\u{1F1EC}\u{1F1E7}', text: 'ALO Education made my dream of studying in the UK a reality. The AI course matcher found me the perfect program. I got my offer in just 3 weeks!' },
  { name: 'Fatima Akter', loc: 'Chittagong', uni: 'University of Toronto', course: 'MBA', flag: '\u{1F1E8}\u{1F1E6}', text: 'The AI SOP writer helped me craft a compelling statement. I received offers from 3 top Canadian universities. Truly life-changing!' },
  { name: 'Arif Hossain', loc: 'Sylhet', uni: 'TU Munich', course: 'MS Computer Science', flag: '\u{1F1E9}\u{1F1EA}', text: 'AI document scanner caught errors I would have missed. Got my German visa on the first attempt. Amazing experience!' },
  { name: 'Nusrat Jahan', loc: 'Rajshahi', uni: 'Monash University', course: 'Master of Nursing', flag: '\u{1F1E6}\u{1F1FA}', text: 'From course selection to visa approval, ALO handled everything. The one-click approval system made the process incredibly smooth.' },
];

const faqs = [
  { q: 'How does the AI course matching work?', a: "Our AI analyzes your academic profile, test scores, budget, preferred study destination, and career goals. It then matches you against 10,000+ courses from 500+ partner universities, ranking them by fit score, acceptance probability, and career outcomes." },
  { q: 'What is the 70% AI + 30% Human approach?', a: 'AI handles repetitive, data-heavy tasks: document scanning, eligibility checking, course matching, form pre-filling, and SOP drafting. Experienced counselors handle strategic decisions: university selection refinement, interview preparation, and final application review with one-click approval.' },
  { q: 'How much does ALO Education charge?', a: "Our core services are FREE for students \u2014 we are funded by our partner universities. Premium services like express processing and premium SOP writing have transparent, affordable fees." },
  { q: 'Which countries do you support?', a: "We support UK, USA, Canada, Australia, Germany, New Zealand, Ireland, Netherlands, and more. We're constantly expanding." },
  { q: 'How long does the application process take?', a: 'With AI automation: Course matching (instant), Documents (1-2 weeks), Submission (1 week), Offer (2-6 weeks), Visa (4-8 weeks). AI reduces total time by up to 60%.' },
  { q: 'Do you help with education loans?', a: 'Yes! We partner with leading financial institutions for education loans with competitive interest rates. AI helps estimate loan eligibility and repayment options.' },
];

const scholarships = [
  { name: 'Chevening Scholarship', country: '\u{1F1EC}\u{1F1E7} UK', amount: 'Full Tuition + Living', deadline: 'Nov 2025' },
  { name: 'Vanier Canada Graduate', country: '\u{1F1E8}\u{1F1E6} Canada', amount: 'CAD 50,000/year', deadline: 'Nov 2025' },
  { name: 'DAAD Scholarship', country: '\u{1F1E9}\u{1F1EA} Germany', amount: '\u20AC934\u20131,200/month', deadline: 'Oct 2025' },
  { name: 'Australia Awards', country: '\u{1F1E6}\u{1F1FA} Australia', amount: 'Full Tuition + Travel', deadline: 'May 2026' },
];

const uniNames = [
  'University of Oxford', 'University of Cambridge', 'Imperial College London', 'UCL', 'University of Manchester',
  'University of Toronto', 'UBC', 'McGill University', 'University of Melbourne', 'Monash University',
  'TU Munich', 'TU Berlin', 'TU Dublin', 'University of Amsterdam', 'Auckland University',
];

const howSteps = [
  { num: '01', Icon: Brain, title: 'AI Profile Analysis', desc: 'Upload your documents and let our AI analyze your academic profile, scores, and preferences.' },
  { num: '02', Icon: Sparkles, title: 'Smart Matching', desc: 'AI matches you with the best-fit courses from 500+ universities ranked by fit score.' },
  { num: '03', Icon: ScanLine, title: 'Document Processing', desc: 'AI scans, verifies, and pre-fills all required documents automatically.' },
  { num: '04', Icon: Stamp, title: 'One-Click Apply', desc: 'Counselor reviews and approves with one click. Application submitted instantly.' },
];

/* ───────── helper components ───────── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section id={id} ref={ref} initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.section>
  );
}

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      <motion.div variants={fadeUp} custom={0}>
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-1.5 text-sm font-medium mb-4">{badge}</Badge>
      </motion.div>
      <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{title}</motion.h2>
      <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-500 max-w-2xl mx-auto">{subtitle}</motion.p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export function LandingPage({ onNavigate, onLeadOpen, onAuthOpen }: LandingPageProps) {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleDashboardNav = () => {
    if (session?.user) {
      const role = (session.user as any).role;
      if (role === 'STUDENT') {
        onNavigate('student-dashboard');
      } else {
        onNavigate('crm-dashboard');
      }
    }
  };

  const roleBadgeLabel = (role?: string) => {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ───── NAVBAR ───── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>ALO <span className="text-orange-500">Education</span></span>
          </button>
          <div className="hidden lg:flex items-center gap-8">
            {[{ label: 'Courses', action: () => onNavigate('course-finder') },
              { label: 'Destinations', action: () => document.getElementById('destinations')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Services', action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Scholarships', action: () => document.getElementById('scholarships')?.scrollIntoView({ behavior: 'smooth' }) },
              { label: 'AI Tools', action: () => document.getElementById('ai-features')?.scrollIntoView({ behavior: 'smooth' }) },
            ].map(item => (
              <button key={item.label} onClick={item.action} className={`text-sm font-medium transition-colors hover:text-orange-500 ${scrolled ? 'text-gray-700' : 'text-white/90'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {status === 'authenticated' && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-orange-300" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground leading-none mt-1">{session.user.email}</p>
                      <Badge className="mt-1.5 bg-orange-100 text-orange-700 border-orange-200 text-[10px] w-fit px-1.5 py-0">{roleBadgeLabel((session.user as any).role)}</Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboardNav} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onAuthOpen} className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className={`font-medium flex items-center gap-1.5 ${scrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-white hover:bg-white/10'}`}
                onClick={onAuthOpen}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
            <Button variant="ghost" className={`font-medium ${scrolled ? 'text-gray-700' : 'text-white hover:text-white hover:bg-white/10'}`} onClick={() => onNavigate('student-dashboard')}>Student Portal</Button>
            <Button variant="ghost" className={`font-medium ${scrolled ? 'text-gray-700' : 'text-white hover:text-white hover:bg-white/10'}`} onClick={() => onNavigate('crm-dashboard')}>CRM</Button>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-200" onClick={onLeadOpen}>Book Free Consultation</Button>
          </div>
          <button className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} /> : <Menu className={`w-6 h-6 ${scrolled ? 'text-gray-900' : 'text-white'}`} />}
          </button>
        </nav>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white border-t shadow-lg">
              <div className="px-4 py-4 space-y-3">
                {[{ l: 'Home', a: 'home' }, { l: 'Courses', a: 'course-finder' }, { l: 'Destinations', a: 'destinations' }, { l: 'Services', a: 'services' }, { l: 'Scholarships', a: 'scholarships' }, { l: 'AI Tools', a: 'ai-features' }, { l: 'Student Portal', a: 'student-dashboard' }, { l: 'CRM Dashboard', a: 'crm-dashboard' }].map(item => (
                  <button key={item.l} onClick={() => { setMobileMenu(false); if (['course-finder', 'student-dashboard', 'crm-dashboard'].includes(item.a)) onNavigate(item.a); else document.getElementById(item.a)?.scrollIntoView({ behavior: 'smooth' }); }} className="block w-full text-left py-2 px-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg font-medium">{item.l}</button>
                ))}
                {status === 'authenticated' && session?.user ? (
                  <div className="pt-3 border-t mt-3 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-orange-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"><User className="w-5 h-5 text-orange-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        <Badge className="mt-0.5 bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0">{roleBadgeLabel((session.user as any).role)}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => { setMobileMenu(false); handleDashboardNav(); }}>Dashboard</Button>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { setMobileMenu(false); onLeadOpen(); }}>Book Free Consultation</Button>
                    <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setMobileMenu(false); handleLogout(); }}>Sign Out</Button>
                  </div>
                ) : (
                  <>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-2 flex items-center justify-center gap-2" onClick={() => { setMobileMenu(false); onAuthOpen(); }}><LogIn className="w-4 h-4" /> Login / Register</Button>
                    <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 mt-2" onClick={() => { setMobileMenu(false); onLeadOpen(); }}>Book Free Consultation</Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ───── HERO ───── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#101828] to-[#1a1a3e]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(243,112,33,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,102,204,0.12) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <Badge className="bg-white/10 text-orange-300 border-white/10 backdrop-blur-sm px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" /> AI-Powered \u2014 70% Automated + 30% Human Expertise
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Your Global Education{' '}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">Journey Starts Here</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            ALO Education combines cutting-edge AI with expert human counselors to simplify your study abroad journey. From course matching to visa approval \u2014 all in one platform.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg shadow-xl shadow-orange-500/25 group" onClick={() => onNavigate('course-finder')}>
              <Search className="w-5 h-5 mr-2" /> Find Your Course <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg" onClick={onLeadOpen}>
              <MessageCircle className="w-5 h-5 mr-2" /> Talk to a Counselor
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[{ v: '500+', l: 'Partner Universities', I: GraduationCap }, { v: '15+', l: 'Study Destinations', I: Globe }, { v: '10K+', l: 'Students Placed', I: Users }, { v: '98%', l: 'Visa Success Rate', I: CheckCircle2 }].map((s, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all">
                <s.I className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-white">{s.v}</div>
                <div className="text-xs text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ───── TRUSTED BY ───── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <p className="text-center text-sm text-gray-400 font-medium mb-6 uppercase tracking-wider">Trusted by students placed at top universities worldwide</p>
        <div className="relative overflow-hidden">
          <div className="flex gap-8 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
            {[...uniNames, ...uniNames].map((u, i) => (
              <span key={i} className="text-gray-300 font-semibold text-sm px-4 py-2 border border-gray-100 rounded-lg bg-white">{u}</span>
            ))}
          </div>
        </div>
        <style>{'@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}'}</style>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <Section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="How It Works" title="From Dream to Offer in 4 Steps" subtitle="Our AI handles 70% of the work. Expert counselors handle the critical 30%." />
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200" />
            {howSteps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="relative text-center">
                <div className="relative z-10 w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <step.Icon className="w-7 h-7" />
                </div>
                <Badge className="bg-orange-100 text-orange-600 text-xs mb-3">Step {step.num}</Badge>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── AI FEATURES ───── */}
      <Section id="ai-features" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="AI-Powered Tools" title="Intelligence Meets Opportunity" subtitle="Six AI tools that do in minutes what used to take weeks." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="group h-full border-gray-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 cursor-pointer bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center group-hover:from-orange-500 group-hover:to-orange-600 transition-all duration-300">
                        <f.Icon className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                      </div>
                      <Badge variant={f.badge === 'Most Popular' ? 'default' : 'secondary'} className={f.badge === 'Most Popular' ? 'bg-orange-500 text-white' : f.badge === 'New' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{f.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                    <button className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1">
                      Try it free <ArrowRight className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── DESTINATIONS ───── */}
      <Section id="destinations" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Popular Destinations" title="Study in the World's Best Countries" subtitle="Explore opportunities across 15+ countries with 500+ partner universities." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {countries.map((c, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="group h-full border-gray-200 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => onNavigate('country', c.slug)}>
                  <div className="h-2" style={{ background: `linear-gradient(90deg, ${c.color}, ${c.color}88)` }} />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{c.flag}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{c.name}</h3>
                        <p className="text-xs text-gray-400">{c.unis} universities</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600"><BookOpen className="w-4 h-4 text-orange-500" />{c.courses}</div>
                      <div className="flex items-center gap-2 text-gray-600"><TrendingUp className="w-4 h-4 text-orange-500" />{c.tuition}</div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-orange-600 group-hover:text-orange-700">
                      Explore <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── COURSE FINDER PREVIEW ───── */}
      <Section className="py-20 md:py-28 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} custom={0}>
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-4 py-1.5 mb-4">Smart Search</Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Find Your Perfect Course</motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-gray-400 text-lg mb-10">Search from 10,000+ courses across 500+ universities in 15+ countries.</motion.p>
          <motion.div variants={fadeUp} custom={3} className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search courses, universities, or subjects..."
              className="pl-12 pr-32 py-6 bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-lg rounded-2xl focus:ring-orange-500 focus:border-orange-500 h-auto"
              onKeyDown={e => { if (e.key === 'Enter') onNavigate('course-finder'); }}
            />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6" onClick={() => onNavigate('course-finder')}>Search</Button>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="text-sm text-gray-400">Popular:</span>
            {['MSc Data Science', 'MBA', 'Computer Science', 'Nursing', 'Engineering', 'Business Analytics'].map(t => (
              <Badge key={t} variant="outline" className="border-white/20 text-gray-300 hover:bg-orange-500/20 hover:text-orange-300 hover:border-orange-500/30 cursor-pointer transition-all" onClick={() => { setSearchQuery(t); onNavigate('course-finder'); }}>{t}</Badge>
            ))}
          </motion.div>
          <motion.div variants={fadeUp} custom={5} className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {['Undergraduate', 'Postgraduate', 'PhD'].map(l => (
              <Card key={l} className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer transition-all" onClick={() => onNavigate('course-finder')}>
                <CardContent className="p-4 text-center">
                  <GraduationCap className="w-5 h-5 text-orange-400 mx-auto mb-2" />
                  <span className="text-sm font-medium">{l}</span>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ───── SERVICES ───── */}
      <Section id="services" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Our Services" title="Complete Study Abroad Support" subtitle="From first consultation to landing at your dream university \u2014 we've got you covered." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="group h-full border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors duration-300">
                      <s.Icon className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── SCHOLARSHIPS ───── */}
      <Section id="scholarships" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Scholarships" title="Fund Your Dreams" subtitle="Explore scholarships that can cover your tuition, living expenses, and more." />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {scholarships.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="h-full border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-5">
                    <Badge className="bg-green-100 text-green-700 text-xs mb-3">{s.country}</Badge>
                    <h3 className="font-bold text-gray-900 mb-2">{s.name}</h3>
                    <p className="text-orange-600 font-semibold text-lg mb-1">{s.amount}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Clock className="w-4 h-4" />Deadline: {s.deadline}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── TESTIMONIALS ───── */}
      <Section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="Success Stories" title="Hear From Our Students" subtitle="Real stories from real students who achieved their study abroad dreams." />
          <div className="relative max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }}>
                <Card className="border-gray-200 bg-gradient-to-br from-orange-50/50 to-white">
                  <CardContent className="p-8 md:p-10">
                    <div className="flex items-center gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}</div>
                    <p className="text-lg text-gray-700 leading-relaxed mb-6 italic">&ldquo;{testimonials[activeTestimonial].text}&rdquo;</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                        {testimonials[activeTestimonial].name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</p>
                        <p className="text-sm text-gray-500">{testimonials[activeTestimonial].loc} \u2022 {testimonials[activeTestimonial].uni} \u2022 {testimonials[activeTestimonial].course}</p>
                      </div>
                      <span className="ml-auto text-3xl">{testimonials[activeTestimonial].flag}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-orange-500 w-8' : 'bg-gray-300 hover:bg-gray-400'}`} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ───── WHY ALO / STATS ───── */}
      <Section className="py-20 md:py-28 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Why Students Choose ALO Education</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-orange-100 text-lg max-w-2xl mx-auto">The numbers speak for themselves. We deliver results.</motion.p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ v: '98%', l: 'Visa Success Rate', d: 'Industry-leading approval rate' }, { v: '500+', l: 'Partner Universities', d: 'Across 15+ countries' }, { v: '72hrs', l: 'Average Response Time', d: 'AI + counselor combined' }, { v: '60%', l: 'Faster Processing', d: 'Compared to traditional agencies' }].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
                <div className="text-4xl md:text-5xl font-extrabold mb-2">{s.v}</div>
                <div className="text-lg font-semibold mb-1">{s.l}</div>
                <div className="text-sm text-orange-100">{s.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── FAQ ───── */}
      <Section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader badge="FAQ" title="Frequently Asked Questions" subtitle="Got questions? We have answers." />
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <AccordionItem value={`faq-${i}`} className="border-gray-200">
                  <AccordionTrigger className="text-left text-base font-medium hover:text-orange-600 hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-gray-500 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ───── CTA ───── */}
      <Section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} custom={0} className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 lg:p-16 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '30px 30px' }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">Book a free consultation with our expert counselors. Get personalized guidance and start your application today.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg shadow-xl shadow-orange-500/25" onClick={onLeadOpen}>
                  <MessageCircle className="w-5 h-5 mr-2" /> Book Free Consultation <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg">
                  <Phone className="w-5 h-5 mr-2" /> +880 1XXX-XXXXXX
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">ALO <span className="text-orange-500">Education</span></span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">Your trusted partner for global education. AI-powered platform with expert human guidance.</p>
              <div className="flex gap-3">
                {[MessageCircle, Mail, Phone].map((I, i) => (
                  <div key={i} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-orange-500 transition-colors cursor-pointer"><I className="w-4 h-4" /></div>
                ))}
              </div>
            </div>
            {[{ title: 'Study Destinations', links: ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'New Zealand'] },
              { title: 'Services', links: ['Course Matching', 'Application Processing', 'Visa Assistance', 'SOP Writing', 'Education Loan', 'Pre-Departure'] },
              { title: 'Company', links: ['About Us', 'Our Team', 'Blog', 'Contact', 'Privacy Policy', 'Terms of Service', 'Student Portal', 'CRM Dashboard'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><button onClick={() => { if (l === 'Student Portal') onNavigate('student-dashboard'); else if (l === 'CRM Dashboard') onNavigate('crm-dashboard'); else onNavigate('home'); }} className="text-gray-400 hover:text-orange-400 text-sm transition-colors">{l}</button></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 ALO Education. All rights reserved.</p>
            <p className="text-gray-500 text-sm">70% AI Automation + 30% Human Expertise</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
