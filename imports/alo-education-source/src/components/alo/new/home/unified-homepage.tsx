"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// lucide-react icons
import {
  Globe,
  Search,
  GraduationCap,
  Award,
  BookOpen,
  Building2,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  ArrowRight,
  Brain,
  FileText,
  CheckCircle2,
  BarChart3,
  DollarSign,
  ShieldCheck,
  Sparkles,
  FileCheck,
  Calculator,
  TrendingUp,
  MapPin,
  Users,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";

// Animation hooks
import { useCountUp } from "@/hooks/use-animations";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UnifiedHomepageProps {
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
  onFinderOpen: () => void;
}

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Study Abroad",
    items: ["United Kingdom", "United States", "Canada", "Australia", "Germany", "Ireland"],
  },
  { label: "Course Finder" },
  { label: "Scholarships" },
  { label: "English Tests" },
  { label: "Resources" },
  { label: "For Partners" },
];

const JOURNEY_STEPS = [
  { icon: Brain, title: "AI Profile Match", desc: "Our AI analyzes your academic background, scores, and preferences to build your unique student profile." },
  { icon: Search, title: "Course Discovery", desc: "Get matched with programs across 331+ universities tailored to your goals." },
  { icon: FileCheck, title: "Document Checklist", desc: "Never miss a document. AI-powered checklist tracks your progress in real time." },
  { icon: FileText, title: "AI SOP Draft", desc: "Generate a compelling Statement of Purpose drafted by AI, refined by experts." },
  { icon: Sparkles, title: "One-Click Apply", desc: "Submit applications to multiple universities with a single streamlined process." },
  { icon: BarChart3, title: "Offer Tracking", desc: "Track your application status across all universities from one dashboard." },
  { icon: ShieldCheck, title: "Visa Success", desc: "AI-verified document packages and expert guidance for 98% visa approval rate." },
];

const AI_FEATURES = [
  { icon: Brain, title: "AI Course Matcher", desc: "Tell us your profile, get matched with perfect programs across 331+ universities in seconds.", gradient: "from-indigo-500 to-purple-600", large: true },
  { icon: FileText, title: "AI SOP Writer", desc: "Generate submission-ready Statements of Purpose tailored to each university.", gradient: "from-teal-500 to-emerald-600" },
  { icon: FileCheck, title: "Document Checker", desc: "Auto-detect missing documents before deadlines. Never miss a requirement.", gradient: "from-orange-500 to-amber-600" },
  { icon: BarChart3, title: "Eligibility Predictor", desc: "Know your admission chances before you apply. Data-driven probability scores.", gradient: "from-rose-500 to-pink-600" },
  { icon: DollarSign, title: "Scholarship Finder", desc: "AI matches you with funding opportunities you're most likely to win.", gradient: "from-blue-500 to-cyan-600" },
  { icon: ShieldCheck, title: "Visa Readiness", desc: "Complete document checklist with AI verification for stress-free visa processing.", gradient: "from-violet-500 to-indigo-600" },
];

const FEATURED_COUNTRIES = [
  { flag: "🇬🇧", name: "United Kingdom", slug: "uk", universities: 85, courses: "Computer Science, Business, Engineering", bg: "from-blue-900/90 to-blue-700/70" },
  { flag: "🇺🇸", name: "United States", slug: "usa", universities: 120, courses: "Data Science, MBA, Liberal Arts", bg: "from-indigo-900/90 to-indigo-700/70" },
  { flag: "🇨🇦", name: "Canada", slug: "canada", universities: 65, courses: "Healthcare, IT, Hospitality", bg: "from-red-900/90 to-red-700/70" },
  { flag: "🇦🇺", name: "Australia", slug: "australia", universities: 45, courses: "Engineering, Nursing, Accounting", bg: "from-emerald-900/90 to-emerald-700/70" },
];

const MORE_COUNTRIES = [
  { flag: "🇩🇪", name: "Germany", slug: "germany" },
  { flag: "🇮🇪", name: "Ireland", slug: "ireland" },
  { flag: "🇲🇾", name: "Malaysia", slug: "malaysia" },
  { flag: "🇳🇿", name: "New Zealand", slug: "new-zealand" },
  { flag: "🇫🇮", name: "Finland", slug: "finland" },
  { flag: "🇸🇪", name: "Sweden", slug: "sweden" },
  { flag: "🇳🇱", name: "Netherlands", slug: "netherlands" },
];

const UNIVERSITIES = [
  { name: "University of Oxford", city: "Oxford", country: "UK", flag: "🇬🇧", tuition: "£26,000–£38,000/yr", subjects: ["Computer Science", "Engineering", "Medicine"], initials: "UO", color: "bg-indigo-100 text-indigo-700" },
  { name: "MIT", city: "Cambridge", country: "USA", flag: "🇺🇸", tuition: "$55,000–$60,000/yr", subjects: ["AI & ML", "Robotics", "Physics"], initials: "MI", color: "bg-red-100 text-red-700" },
  { name: "University of Toronto", city: "Toronto", country: "Canada", flag: "🇨🇦", tuition: "C$45,000–C$58,000/yr", subjects: ["Business", "Data Science", "Health"], initials: "UT", color: "bg-blue-100 text-blue-700" },
  { name: "University of Melbourne", city: "Melbourne", country: "Australia", flag: "🇦🇺", tuition: "A$40,000–A$52,000/yr", subjects: ["Law", "Arts", "Science"], initials: "UM", color: "bg-teal-100 text-teal-700" },
  { name: "Imperial College London", city: "London", country: "UK", flag: "🇬🇧", tuition: "£32,000–£44,000/yr", subjects: ["Engineering", "Medicine", "Business"], initials: "IC", color: "bg-purple-100 text-purple-700" },
  { name: "Stanford University", city: "Stanford", country: "USA", flag: "🇺🇸", tuition: "$56,000–$62,000/yr", subjects: ["CS", "MBA", "Design"], initials: "SU", color: "bg-amber-100 text-amber-700" },
  { name: "TU Munich", city: "Munich", country: "Germany", flag: "🇩🇪", tuition: "€0–€3,000/yr", subjects: ["Engineering", "Informatics", "Physics"], initials: "TU", color: "bg-emerald-100 text-emerald-700" },
  { name: "University of British Columbia", city: "Vancouver", country: "Canada", flag: "🇨🇦", tuition: "C$40,000–C$55,000/yr", subjects: ["Forestry", "Arts", "Medicine"], initials: "UB", color: "bg-rose-100 text-rose-700" },
];

const FREE_TOOLS = [
  { icon: FileText, title: "SOP Reviewer", desc: "AI-powered review of your Statement of Purpose with instant feedback and scoring.", gradient: "from-indigo-500 to-purple-600" },
  { icon: BarChart3, title: "Admit Predictor", desc: "Input your profile and know your chances of admission at top universities.", gradient: "from-teal-500 to-emerald-600" },
  { icon: Calculator, title: "EMI Calculator", desc: "Plan your education loan with our smart EMI calculator and comparison tool.", gradient: "from-orange-500 to-amber-600" },
  { icon: FileCheck, title: "Document Checklist", desc: "Never miss a document. Get a personalized checklist for every university.", gradient: "from-rose-500 to-pink-600" },
];

const TESTIMONIALS = [
  {
    quote: "ALO Education made my dream of studying at Oxford a reality. The AI matched me with the perfect program and the SOP writer was incredibly helpful. Got my offer in just 3 weeks!",
    name: "Priya Sharma",
    university: "University of Oxford",
    flag: "🇬🇧",
    rating: 5,
  },
  {
    quote: "The document checker saved me from missing critical deadlines. I was able to submit perfect applications to 5 universities simultaneously. Highly recommend!",
    name: "Rahul Patel",
    university: "University of Toronto",
    flag: "🇨🇦",
    rating: 5,
  },
  {
    quote: "From profile matching to visa approval, ALO handled everything. The 98% visa success rate is real — I got mine on the first attempt with zero issues.",
    name: "Ananya Desai",
    university: "MIT",
    flag: "🇺🇸",
    rating: 5,
  },
];

const FAQS = [
  { q: "How does the AI course matching work?", a: "Our AI analyzes your academic background, test scores, budget, and career goals to match you with the most suitable programs. It evaluates over 832 courses across 331+ universities in 11 countries to find your perfect fit." },
  { q: "Is ALO Education free for students?", a: "Yes! Our core services including AI course matching, document checklist, and application tracking are completely free. We earn from university partnerships, so there's no cost to you." },
  { q: "What countries can I study in through ALO?", a: "We currently support 11 countries: United Kingdom, United States, Canada, Australia, Germany, Ireland, Malaysia, New Zealand, Finland, Sweden, and the Netherlands." },
  { q: "How does the AI SOP Writer work?", a: "You provide your academic details, achievements, and goals. Our AI generates a draft SOP tailored to each university's requirements. A human expert then reviews and polishes it before submission." },
  { q: "What is the visa success rate?", a: "Our students have a 98% visa success rate. This is because our AI verifies all your documents before submission and our expert counselors guide you through the entire visa process." },
  { q: "Can I apply to multiple universities at once?", a: "Absolutely! Our one-click apply feature lets you submit applications to multiple universities simultaneously. You can track all your applications from a single dashboard." },
];

const FOOTER_LINKS = {
  quick: ["About Us", "How It Works", "Blog", "Careers", "Contact Us"],
  destinations: ["Study in UK", "Study in USA", "Study in Canada", "Study in Australia", "Study in Germany"],
};

// ─── Stat Counter Component ──────────────────────────────────────────────────

function StatCounter({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const { value: count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-orange-400">
        {count}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-slate-400 mt-1">{label}</div>
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      transition={{ duration: 0.5 }}
      className={cn("text-center max-w-2xl mx-auto mb-10 md:mb-14", className)}
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base sm:text-lg text-slate-500">{subtitle}</p>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UnifiedHomepage({ onNavigate, onLeadOpen, onFinderOpen }: UnifiedHomepageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll awareness for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearch = useCallback(() => {
 if (searchQuery.trim()) {
      onFinderOpen();
    }
  }, [searchQuery, onFinderOpen]);

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: GLASSMORPHISM STICKY NAVBAR
         ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        )}
      >
        <nav
          className={cn(
            "mx-2 sm:mx-4 mt-2 rounded-2xl border border-white/20 transition-all duration-300",
            scrolled
              ? "backdrop-blur-xl bg-white/90 shadow-lg shadow-black/5"
              : "backdrop-blur-xl bg-white/70 shadow-sm",
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button
                onClick={() => onNavigate("home")}
                className="flex items-center gap-1 shrink-0"
              >
                <span className="text-xl font-bold text-[#4F46E5]">ALO</span>
                <span className="text-xl font-medium text-slate-500">Education</span>
              </button>

              {/* Desktop Nav Items */}
              <div className="hidden lg:flex items-center gap-1">
                {/* Study Abroad Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#4F46E5] rounded-xl hover:bg-indigo-50/60 transition-colors"
                  >
                    <Globe className="size-4" />
                    Study Abroad
                    <ChevronDown className={cn("size-3.5 transition-transform", countryDropdownOpen && "rotate-180")} />
                  </button>
                  {countryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 mt-1 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 p-2 z-50"
                    >
                      {NAV_ITEMS[0].items.map((country) => (
                        <button
                          key={country}
                          onClick={() => {
                            onNavigate("country", country.toLowerCase().replace(/\s+/g, "-"));
                            setCountryDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:text-[#4F46E5] hover:bg-indigo-50/60 rounded-xl transition-colors"
                        >
                          {country}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={onFinderOpen}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#4F46E5] rounded-xl hover:bg-indigo-50/60 transition-colors"
                >
                  <Search className="size-4" />
                  Course Finder
                </button>

                <button
                  onClick={() => onNavigate("scholarships")}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#4F46E5] rounded-xl hover:bg-indigo-50/60 transition-colors"
                >
                  <Award className="size-4" />
                  Scholarships
                </button>

                <button
                  onClick={() => onNavigate("english-tests")}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#4F46E5] rounded-xl hover:bg-indigo-50/60 transition-colors"
                >
                  <BookOpen className="size-4" />
                  English Tests
                </button>

                <button
                  onClick={() => onNavigate("resources")}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#4F46E5] rounded-xl hover:bg-indigo-50/60 transition-colors"
                >
                  <GraduationCap className="size-4" />
                  Resources
                </button>

                <button
                  onClick={() => onNavigate("partners")}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#4F46E5] rounded-xl hover:bg-indigo-50/60 transition-colors"
                >
                  <Building2 className="size-4" />
                  For Partners
                </button>
              </div>

              {/* Desktop CTA Buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onLeadOpen}
                  className="rounded-full px-5 border-slate-200 text-slate-600 hover:text-[#4F46E5] hover:border-[#4F46E5]/30 hover:bg-indigo-50/40"
                >
                  Login
                </Button>
                <Button
                  onClick={onLeadOpen}
                  className="rounded-full px-5 bg-[#4F46E5] hover:bg-[#3730A3] text-white shadow-md shadow-indigo-500/20"
                >
                  Get Started
                </Button>
              </div>

              {/* Mobile Menu Trigger */}
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Menu className="size-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0 bg-white">
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        {/* Mobile Logo */}
                        <div className="flex items-center gap-1 mb-8">
                          <span className="text-xl font-bold text-[#4F46E5]">ALO</span>
                          <span className="text-xl font-medium text-slate-500">Education</span>
                        </div>

                        {/* Mobile Nav Accordion */}
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="study-abroad" className="border-b border-slate-100">
                            <AccordionTrigger className="text-sm font-medium text-slate-700 py-3 no-underline hover:no-underline">
                              <span className="flex items-center gap-2">
                                <Globe className="size-4 text-[#4F46E5]" />
                                Study Abroad
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-3">
                              <div className="flex flex-col gap-1 pl-6">
                                {NAV_ITEMS[0].items.map((country) => (
                                  <button
                                    key={country}
                                    onClick={() => {
                                      onNavigate("country", country.toLowerCase().replace(/\s+/g, "-"));
                                      setMobileMenuOpen(false);
                                    }}
                                    className="text-left py-2 text-sm text-slate-500 hover:text-[#4F46E5] transition-colors"
                                  >
                                    {country}
                                  </button>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {[
                            { id: "course-finder", label: "Course Finder", icon: Search, action: onFinderOpen },
                            { id: "scholarships", label: "Scholarships", icon: Award, action: () => onNavigate("scholarships") },
                            { id: "english-tests", label: "English Tests", icon: BookOpen, action: () => onNavigate("english-tests") },
                            { id: "resources", label: "Resources", icon: GraduationCap, action: () => onNavigate("resources") },
                            { id: "partners", label: "For Partners", icon: Building2, action: () => onNavigate("partners") },
                          ].map((item) => (
                            <AccordionItem key={item.id} value={item.id} className="border-b border-slate-100">
                              <AccordionTrigger
                                className="text-sm font-medium text-slate-700 py-3 no-underline hover:no-underline"
                                onClick={item.action as never}
                              >
                                <span className="flex items-center gap-2">
                                  <item.icon className="size-4 text-[#4F46E5]" />
                                  {item.label}
                                </span>
                              </AccordionTrigger>
                            </AccordionItem>
                          ))}
                        </Accordion>

                        {/* Mobile CTAs */}
                        <div className="mt-8 flex flex-col gap-3">
                          <Button
                            variant="outline"
                            onClick={() => { onLeadOpen(); setMobileMenuOpen(false); }}
                            className="w-full rounded-full border-slate-200 text-slate-600"
                          >
                            Login
                          </Button>
                          <Button
                            onClick={() => { onLeadOpen(); setMobileMenuOpen(false); }}
                            className="w-full rounded-full bg-[#4F46E5] hover:bg-[#3730A3] text-white"
                          >
                            Get Started
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 2: HERO — AI-POWERED SEARCH
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 pt-32 pb-16 sm:pt-40 sm:pb-24">
          {/* Decorative floating circles */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-400/5 rounded-full blur-3xl" />
          <div className="absolute top-32 right-1/4 w-3 h-3 bg-orange-400/60 rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-teal-400/60 rounded-full" />
          <div className="absolute top-40 left-1/3 w-4 h-4 bg-white/10 rounded-full" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
                <Badge className="mb-6 bg-white/15 text-white border-white/20 hover:bg-white/20 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm">
                  <Sparkles className="size-3.5 mr-1" />
                  AI-Powered Platform
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
              >
                Your AI-Powered Gateway to{" "}
                <span className="text-orange-300">World-Class</span> Education
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-indigo-100 max-w-3xl mx-auto leading-relaxed"
              >
                70% AI Automated + 30% Expert Human Approval. Match with 331+ universities across 11 countries.
              </motion.p>

              {/* AI Search Bar */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 sm:mt-10 max-w-2xl mx-auto"
              >
                <div className="relative bg-white rounded-2xl sm:rounded-full shadow-2xl shadow-black/20 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center flex-1 px-4 gap-3">
                    <Search className="size-5 text-slate-400 shrink-0" />
                    <Input
                      type="text"
                      placeholder="What do you want to study?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base bg-transparent placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="rounded-xl sm:rounded-full bg-[#4F46E5] hover:bg-[#3730A3] text-white px-6 sm:px-8 h-12 text-base font-semibold shadow-lg shadow-indigo-500/30 shrink-0"
                  >
                    Search
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </div>

                {/* Filter Pills */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-indigo-200 mr-1 hidden sm:inline">Popular:</span>
                  {[
                    { label: "United Kingdom", key: "uk" },
                    { label: "Master\'s", key: "masters" },
                    { label: "Under $30K/yr", key: "budget" },
                  ].map((pill) => (
                    <button
                      key={pill.key}
                      onClick={() => {
                        if (pill.key === "uk") setSelectedCountry(pill.key);
                        else if (pill.key === "masters") setSelectedLevel(pill.key);
                        else onFinderOpen();
                      }}
                      className={cn(
                        "px-4 py-2 text-xs sm:text-sm font-medium rounded-full border transition-all",
                        (pill.key === "uk" && selectedCountry === "uk") ||
                        (pill.key === "masters" && selectedLevel === "masters")
                          ? "bg-white text-[#4F46E5] border-white shadow-md"
                          : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white",
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              >
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full px-5 py-2.5 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-white">Google ★ 4.8/5</span>
                </div>
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full px-5 py-2.5 flex items-center gap-2">
                  <Users className="size-4 text-teal-300" />
                  <span className="text-sm font-medium text-white">Trusted by 15,000+ students</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 3: STATS BAR
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-900 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8"
            >
              <motion.div variants={fadeIn} transition={{ duration: 0.5 }}>
                <StatCounter value={331} suffix="+" label="Universities" />
              </motion.div>
              <motion.div variants={fadeIn} transition={{ duration: 0.5 }}>
                <StatCounter value={832} suffix="+" label="Courses" />
              </motion.div>
              <motion.div variants={fadeIn} transition={{ duration: 0.5 }}>
                <StatCounter value={11} label="Countries" />
              </motion.div>
              <motion.div variants={fadeIn} transition={{ duration: 0.5 }}>
                <StatCounter value={98} suffix="%" label="Visa Success" />
              </motion.div>
              <motion.div variants={fadeIn} transition={{ duration: 0.5 }} className="col-span-2 sm:col-span-1">
                <StatCounter value={2} suffix={"."} label="£2.5M+ Scholarships" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 4: HOW IT WORKS — STUDENT JOURNEY
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Your Study Abroad Journey in 7 Simple Steps"
              subtitle="From AI matching to visa success, we've streamlined every step of the process."
            />

            {/* Desktop Horizontal Stepper */}
            <div className="hidden md:block">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="relative"
              >
                {/* Connecting Line */}
                <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200" />

                <div className="grid grid-cols-7 gap-2">
                  {JOURNEY_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={i}
                        variants={fadeInUp}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                        className="flex flex-col items-center text-center relative"
                      >
                        <div className="relative z-10 w-16 h-16 rounded-full bg-white border-2 border-[#4F46E5] flex items-center justify-center shadow-md shadow-indigo-500/10 mb-4 group hover:bg-[#4F46E5] transition-colors duration-300">
                          <Icon className="size-6 text-[#4F46E5] group-hover:text-white transition-colors duration-300" />
                          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#F97316] text-white text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1 leading-tight">{step.title}</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed hidden xl:block max-w-[140px]">{step.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Mobile Vertical Stepper */}
            <div className="md:hidden">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="relative max-w-md mx-auto"
              >
                {/* Vertical Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-indigo-200" />

                <div className="flex flex-col gap-6">
                  {JOURNEY_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={i}
                        variants={fadeInUp}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                        className="flex gap-4 relative"
                      >
                        <div className="relative z-10 w-12 h-12 rounded-full bg-white border-2 border-[#4F46E5] flex items-center justify-center shadow-md shrink-0">
                          <Icon className="size-5 text-[#4F46E5]" />
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                        </div>
                        <div className="pt-1">
                          <h3 className="text-sm font-semibold text-slate-800">{step.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 5: AI FEATURES BENTO GRID
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="AI That Works While You Sleep"
              subtitle="Powerful tools that automate the tedious parts of your study abroad journey."
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {AI_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={i}
                    variants={scaleIn}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={cn(
                      "group cursor-pointer",
                      feature.large && "md:col-span-2",
                    )}
                    onClick={() => toast.info("Coming soon!")}
                  >
                    <Card
                      className={cn(
                        "h-full bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 transition-all duration-300",
                        "hover:shadow-[0_4px_6px_-1px_rgba(79,70,229,0.1)] hover:-translate-y-1 hover:border-indigo-100",
                      )}
                    >
                      <CardContent className="p-0">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
                            feature.gradient,
                          )}
                        >
                          <Icon className="size-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#4F46E5] transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {feature.desc}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#4F46E5] opacity-0 group-hover:opacity-100 transition-opacity">
                          Try Now <ArrowRight className="size-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 6: STUDY DESTINATIONS
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Explore Top Study Destinations"
              subtitle="Discover world-class education in countries that welcome international students."
            />

            {/* Featured Countries */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
            >
              {FEATURED_COUNTRIES.map((country, i) => (
                <motion.div
                  key={country.slug}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <button
                    onClick={() => onNavigate("country", country.slug)}
                    className="w-full group text-left"
                  >
                    <Card className="relative overflow-hidden rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      {/* Gradient Background */}
                      <div className={cn("absolute inset-0 bg-gradient-to-br", country.bg)} />
                      <CardContent className="relative p-6 sm:p-8 text-white">
                        <span className="text-4xl sm:text-5xl mb-3 block">{country.flag}</span>
                        <h3 className="text-xl font-bold mb-1">{country.name}</h3>
                        <p className="text-sm text-white/80 mb-3">{country.universities} Partner Universities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {country.courses.split(", ").slice(0, 3).map((course) => (
                            <Badge
                              key={course}
                              className="bg-white/15 text-white border-white/20 text-[10px] sm:text-xs rounded-full hover:bg-white/25"
                            >
                              {course}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                          Explore <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {/* More Countries Pills */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            >
              {MORE_COUNTRIES.map((country) => (
                <button
                  key={country.slug}
                  onClick={() => onNavigate("country", country.slug)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white rounded-full border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_-1px_rgba(79,70,229,0.1)] hover:border-[#4F46E5]/30 transition-all duration-200 group"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-[#4F46E5] transition-colors">
                    {country.name}
                  </span>
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 7: FEATURED UNIVERSITIES
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Partner Universities Worldwide"
              subtitle="Top-ranked institutions that trust ALO Education to find their next generation of students."
            />

            {/* Horizontal Scrollable Row */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {UNIVERSITIES.map((uni, i) => (
                    <Card
                      key={i}
                      className="min-w-[280px] sm:min-w-[300px] max-w-[300px] snap-start shrink-0 rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_-1px_rgba(79,70,229,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                      onClick={() => toast.info(`Viewing ${uni.name} details — Coming soon!`)}
                    >
                      <CardContent className="p-5 sm:p-6">
                        {/* University Logo Placeholder */}
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mb-4", uni.color)}>
                          {uni.initials}
                        </div>
                        <h3 className="font-bold text-slate-900 text-base group-hover:text-[#4F46E5] transition-colors leading-snug">
                          {uni.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                          <MapPin className="size-3.5" />
                          {uni.city}, {uni.flag} {uni.country}
                        </div>
                        <div className="mt-3 text-sm font-semibold text-[#0D9488]">
                          {uni.tuition}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {uni.subjects.map((subject) => (
                            <Badge
                              key={subject}
                              variant="secondary"
                              className="text-[10px] sm:text-xs rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0"
                            >
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => onNavigate("universities")}
                className="inline-flex items-center gap-2 text-[#4F46E5] font-semibold hover:gap-3 transition-all duration-200"
              >
                View All Universities
                <ArrowRight className="size-4" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 8: FREE TOOLS
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Free Tools to Boost Your Application"
              subtitle="Powerful resources to strengthen your profile and increase your chances of admission."
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {FREE_TOOLS.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="h-full rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_-1px_rgba(79,70,229,0.1)] hover:-translate-y-1 transition-all duration-300 group bg-white">
                      <CardContent className="p-6">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4",
                            tool.gradient,
                          )}
                        >
                          <Icon className="size-6 text-white" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#4F46E5] transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">{tool.desc}</p>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info("Coming soon!");
                          }}
                          className="rounded-full border-[#4F46E5]/20 text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white text-xs sm:text-sm"
                        >
                          Use Free <ArrowRight className="size-3.5 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 9: TESTIMONIALS
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Hear From Our Students"
              subtitle="Real stories from students who achieved their study abroad dreams with ALO Education."
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
            >
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  <Card className="h-full rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_-1px_rgba(79,70,229,0.1)] transition-all duration-300 bg-white">
                    <CardContent className="p-6 sm:p-8">
                      {/* Stars */}
                      <div className="flex gap-0.5 mb-4">
                        {[...Array(t.rating)].map((_, j) => (
                          <Star key={j} className="size-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      {/* Quote */}
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 italic">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500">
                            {t.university} {t.flag}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 10: FAQ SECTION
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 md:py-24 bg-[#F8FAFC]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="Frequently Asked Questions"
              subtitle="Everything you need to know about studying abroad with ALO Education."
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-white rounded-2xl border border-slate-100 px-6 mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                  >
                    <AccordionTrigger className="text-sm sm:text-base font-semibold text-slate-800 py-5 no-underline hover:no-underline hover:text-[#4F46E5] transition-colors">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-500 leading-relaxed pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 11: CTA SECTION
           ═══════════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 py-16 sm:py-20 md:py-24">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
              >
                Ready to Start Your{" "}
                <span className="text-orange-300">Study Abroad</span> Journey?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 sm:mt-6 text-base sm:text-lg text-indigo-100 max-w-2xl mx-auto"
              >
                Join 15,000+ students who found their dream university with ALO Education. Your future starts here.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              >
                <Button
                  onClick={onFinderOpen}
                  size="lg"
                  className="rounded-full bg-white text-[#4F46E5] hover:bg-slate-100 px-8 h-12 sm:h-14 text-base font-semibold shadow-xl shadow-black/10"
                >
                  <Search className="size-5 mr-2" />
                  Find My Course
                </Button>
                <Button
                  onClick={onLeadOpen}
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 text-white hover:bg-white/10 px-8 h-12 sm:h-14 text-base font-semibold backdrop-blur-sm"
                >
                  <GraduationCap className="size-5 mr-2" />
                  Talk to Counselor
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 12: FOOTER
         ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xl font-bold text-white">ALO</span>
                <span className="text-xl font-medium text-slate-500">Education</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                AI-powered platform helping students find and apply to world-class universities across 11 countries. 70% automated, 30% expert-approved.
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: Linkedin, label: "LinkedIn" },
                  { icon: Youtube, label: "YouTube" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    onClick={() => toast.info(`${label} — Coming soon!`)}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#4F46E5] flex items-center justify-center transition-colors"
                  >
                    <Icon className="size-4 text-slate-400 hover:text-white" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.quick.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => onNavigate(link.toLowerCase().replace(/\s+/g, "-"))}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Study Destinations */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Study Destinations</h4>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.destinations.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => onNavigate("country", link.toLowerCase().replace("study in ", ""))}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <Mail className="size-4 text-[#4F46E5] mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">hello@aloeducation.com</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="size-4 text-[#4F46E5] mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">+44 20 7946 0958</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="size-4 text-[#4F46E5] mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-400">
                    London, United Kingdom
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© 2025 ALO Education. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => onNavigate("privacy")}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => onNavigate("terms")}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
