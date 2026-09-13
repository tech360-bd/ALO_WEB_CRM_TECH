"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Progress,
  MiniBar,
} from "@/components/alo/shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

// ──────────────────────────────────────────────────────────────────────────────
// PROPS & TYPES
// ──────────────────────────────────────────────────────────────────────────────

interface PublicHomeProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface CountryRef {
  name?: string;
  shortName?: string;
  flag?: string;
  capital?: string;
  quickFacts?: string | null;
  lastVerifiedAt?: string | null;
}

interface HeroSlide {
  countrySlug: string;
  headline: string;
  subtitle: string;
  accentColor: string;
  popularCity?: string | null;
  popularIntake?: string | null;
  universityCountLabel?: string | null;
  courseCountLabel?: string | null;
  scholarshipLabel?: string | null;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
  sortOrder: number;
  lastVerifiedAt?: string | null;
  country: CountryRef | null;
}

interface ServiceItem {
  title: string;
  slug: string;
  icon: string;
  description: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  sortOrder: number;
}

interface StoryItem {
  studentName: string;
  homeDistrict?: string | null;
  countrySlug?: string | null;
  universityName?: string | null;
  courseName?: string | null;
  outcome?: string | null;
  testimonial: string;
  consentStatus: string;
}

interface TeamItem {
  name: string;
  role: string;
  specialty?: string | null;
  bio?: string | null;
  photo?: string | null;
}

interface FaqItem {
  question: string;
  answer: string;
  sortOrder: number;
}

interface CountryListItem {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  capital: string;
  quickFacts: string;
  lastVerifiedAt?: string | null;
}

interface CourseListItem {
  slug: string;
  name: string;
  level: string;
  subject: string;
  duration: string;
  intake: string;
  tuition: string;
  scholarship?: string | null;
  englishRequirement: string;
  deadline?: string | null;
  lastVerifiedAt?: string | null;
  university: { name: string; city: string };
  country?: CountryRef | null;
}

interface UniversityListItem {
  slug: string;
  name: string;
  city: string;
  countrySlug: string;
  quickFacts: string;
  overview: string;
  lastVerifiedAt?: string | null;
  country?: CountryRef | null;
}

interface ScholarshipItem {
  name?: string;
  eligibility?: string;
  amount?: string;
  deadline?: string;
  country: string;
  countrySlug?: string;
  flag?: string;
  university?: string;
  lastVerifiedAt?: string | null;
}

interface ExamItem {
  slug: string;
  name: string;
  fullName: string;
  intro: string;
}

interface HomepageData {
  heroSlides: HeroSlide[];
  services: ServiceItem[];
  stories: StoryItem[];
  team: TeamItem[];
  faqs: FaqItem[];
  countries: CountryListItem[];
  courses: CourseListItem[];
  universities: UniversityListItem[];
  scholarships: ScholarshipItem[];
  exams: ExamItem[];
  stats: {
    totalCountries: number;
    totalUniversities: number;
    totalCourses: number;
    totalExams: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────

const STUDY_LEVELS = ["Foundation", "Bachelor", "Top-up", "Pre-Masters", "Masters", "MBA", "PhD"];
const SUBJECTS = [
  "Business & Management", "Computer Science", "Data Science & AI", "Cyber Security",
  "Engineering", "Accounting & Finance", "Law", "Healthcare & Public Health",
  "Hospitality & Tourism", "Marketing", "Project Management", "Supply Chain & Logistics",
  "Architecture", "Psychology", "Education", "Media & Communications",
];
const INTAKES = ["January", "February", "April", "May", "September", "October"];
const ENGLISH_TEST_OPTIONS = ["IELTS", "IELTS UKVI", "PTE Academic", "TOEFL iBT", "Duolingo", "OIETC/ELLT", "Oxford ELLT", "LanguageCert", "Kaplan", "OET", "MOI"];
const BUDGET_OPTIONS = ["Under ৳10 Lakh", "৳10–15 Lakh", "৳15–25 Lakh", "৳25–40 Lakh", "Above ৳40 Lakh"];

const COURSE_TABS = [
  "Business", "Computer Science", "Data Science", "Cyber Security", "Engineering",
  "Healthcare", "Law", "Hospitality", "AI", "Project Management",
];

// Section 6 — Mission, Vision, Values (8 cards)
const VALUES: { icon: string; heading: string; explanation: string }[] = [
  { icon: "Target", heading: "Mission", explanation: "To empower Bangladeshi students with honest, technology-driven guidance so they can study abroad with confidence and clarity." },
  { icon: "Eye", heading: "Vision", explanation: "To be the most trusted study-abroad platform in Bangladesh — where every student has a clear, verified pathway from inquiry to enrollment." },
  { icon: "Star", heading: "Excellence", explanation: "We hold every counselor, document, and application to a high quality bar — no shortcuts, no copy-paste advice." },
  { icon: "ShieldCheck", heading: "Trust", explanation: "Your data, decisions, and dreams are protected with RBAC access control and full audit logging on every action." },
  { icon: "Sparkles", heading: "Innovation", explanation: "AI tools assist — never replace — our counselors, speeding up course matching, SOP drafts, and interview practice." },
  { icon: "Glasses", heading: "Transparency", explanation: "Every fee, every timeline, every risk is communicated upfront. No hidden charges, no surprise commissions on your back." },
  { icon: "Heart", heading: "Student-first Guidance", explanation: "We recommend the right course for your career — not the highest-paying commission. Your outcome is our scorecard." },
  { icon: "Headset", heading: "Professional Support", explanation: "A dedicated counselor walks with you from first call to pre-departure, supported by application, visa, and English-test specialists." },
];

// Section 7 — Why Choose ALO (12 cards, NO unverified "98% visa success")
const WHY_CHOOSE: { icon: string; title: string; description: string }[] = [
  { icon: "Headset", title: "Expert Counselors", description: "Trained, in-house counselors who understand Bangladesh academic backgrounds and global admission trends." },
  { icon: "Glasses", title: "Transparent Process", description: "Clear timelines, clear fees, clear next steps — visible at every stage inside your student portal." },
  { icon: "Sparkles", title: "AI Course Matching", description: "Smart scoring of courses against your GPA, English score, budget, and career goals — counselor-validated." },
  { icon: "Building2", title: "University Shortlisting", description: "Balanced shortlists mixing ambitious, realistic, and safe options across countries and intakes." },
  { icon: "ClipboardList", title: "Application Support", description: "End-to-end application submission, follow-up, and offer tracking for every university on your list." },
  { icon: "FileText", title: "SOP & CV Support", description: "Original SOP drafting with AI assistance and human editing — never plagiarized, always your voice." },
  { icon: "Plane", title: "Visa-focused Preparation", description: "Visa checklists, document review, and credibility interview practice tailored to each country's officer expectations." },
  { icon: "Mic", title: "Interview Preparation", description: "Mock interviews with scoring on confidence, clarity, and credibility — university, pre-CAS, and visa scenarios." },
  { icon: "FolderCheck", title: "Document Review", description: "Every passport, transcript, and bank statement reviewed twice before submission to reduce refusal risk." },
  { icon: "LayoutDashboard", title: "Student Portal Tracking", description: "Real-time status of profile, documents, applications, and visa inside one dashboard — no phone tag required." },
  { icon: "MessageCircle", title: "WhatsApp Support", description: "Quick questions answered on WhatsApp at 01805020101 during working hours, with audit-logged responses." },
  { icon: "Award", title: "Scholarship Guidance", description: "Identifying country, university, and program-level scholarships — and helping you write a winning application." },
];

// Section 9 — Student Journey Timeline (12 steps)
const JOURNEY_STEPS: { icon: string; title: string; description: string }[] = [
  { icon: "MessageSquare", title: "Free Counseling", description: "A 30-minute call to understand your goals, budget, and study plan." },
  { icon: "UserCheck", title: "Profile Review", description: "Counselor reviews your academic, English, and financial background." },
  { icon: "Sparkles", title: "Course Match", description: "AI scores eligible courses against your profile; counselor shortlists." },
  { icon: "Building2", title: "University Shortlist", description: "Final list of ambitious, realistic, and safe university options." },
  { icon: "Upload", title: "Document Upload", description: "Securely upload transcripts, passport, and English scores to the portal." },
  { icon: "Send", title: "Application Submit", description: "We submit your applications and track acknowledgments." },
  { icon: "Mail", title: "Offer Receive", description: "Conditional or unconditional offer letters arrive in your portal inbox." },
  { icon: "CreditCard", title: "Deposit / CAS", description: "Pay deposit, receive CAS or visa letter, and prepare finances." },
  { icon: "ClipboardCheck", title: "Visa Preparation", description: "Final document checklist and credibility interview practice." },
  { icon: "Plane", title: "Visa Decision", description: "Visa submitted and decision received — we celebrate together." },
  { icon: "Luggage", title: "Pre-Departure", description: "Accommodation, travel, SIM, banking, and packing guidance." },
  { icon: "GraduationCap", title: "Enrollment", description: "You arrive on campus, enroll, and your journey continues with ALO alumni support." },
];

// Section 14 — English Language Tests (11 cards)
const ENGLISH_TESTS: { name: string; fullName: string; bestFor: string; destinations: string; scoreRange: string; icon: string }[] = [
  { name: "IELTS", fullName: "International English Language Testing System", bestFor: "UK, Australia, Canada admissions", destinations: "UK, Australia, Canada, NZ", scoreRange: "0–9 band", icon: "BookOpen" },
  { name: "IELTS UKVI", fullName: "IELTS for UK Visas and Immigration", bestFor: "UK visa and Tier 4 applications", destinations: "United Kingdom", scoreRange: "0–9 band", icon: "ShieldCheck" },
  { name: "PTE Academic", fullName: "Pearson Test of English Academic", bestFor: "Fast results, computer-graded", destinations: "UK, Australia, Canada, USA", scoreRange: "10–90", icon: "Monitor" },
  { name: "TOEFL iBT", fullName: "Test of English as a Foreign Language", bestFor: "USA and Canada admissions", destinations: "USA, Canada, Germany", scoreRange: "0–120", icon: "Globe" },
  { name: "Duolingo", fullName: "Duolingo English Test", bestFor: "Affordable, at-home test", destinations: "USA, UK, Canada (selected unis)", scoreRange: "10–160", icon: "Sparkles" },
  { name: "OIETC / ELLT", fullName: "Oxford International English Test", bestFor: "UK pathway and direct entry", destinations: "United Kingdom", scoreRange: "B2 / C1 levels", icon: "Building2" },
  { name: "Oxford ELLT", fullName: "Oxford English Language Level Test", bestFor: "Pre-sessional and direct entry", destinations: "United Kingdom", scoreRange: "B1 / B2 / C1", icon: "BookMarked" },
  { name: "LanguageCert", fullName: "LanguageCert International ESOL", bestFor: "UK, Greece, Italy admissions", destinations: "UK, EU", scoreRange: "A1–C2", icon: "FileText" },
  { name: "Kaplan", fullName: "Kaplan English Test", bestFor: "Pathway programs and partner universities", destinations: "UK, Australia, USA", scoreRange: "B2 / C1 levels", icon: "GraduationCap" },
  { name: "OET", fullName: "Occupational English Test", bestFor: "Healthcare and nursing professionals", destinations: "UK, Australia, Ireland", scoreRange: "A–E grades", icon: "Stethoscope" },
  { name: "MOI Guidance", fullName: "Medium of Instruction Letter", bestFor: "Waiver-based admission (selected unis)", destinations: "UK, Australia, Germany", scoreRange: "Letter-based", icon: "FileCheck" },
];

// Section 15 — Visa and Compliance Support (6 cards)
const VISA_SUPPORT: { icon: string; title: string; description: string }[] = [
  { icon: "ClipboardList", title: "Visa Checklist", description: "Country-specific document checklist with required, optional, and financial-proof items clearly marked." },
  { icon: "Wallet", title: "Financial Proof Guidance", description: "Bank statement formatting, sponsor letters, and tuition-deposit evidence aligned to embassy expectations." },
  { icon: "Mic", title: "Credibility Interview Practice", description: "Mock interviews simulating real visa officer questions with AI scoring on tone and clarity." },
  { icon: "ShieldAlert", title: "Visa Refusal Prevention", description: "Risk assessment of your profile, previous refusals, and study-gap explanations before submission." },
  { icon: "FolderCheck", title: "Document Review", description: "Two-stage review of every document — by counselor and visa officer — before submission to the embassy." },
  { icon: "Luggage", title: "Pre-Departure Checklist", description: "Travel, medical, accommodation, banking, and SIM-card checklist so you land prepared." },
];

// Section 16 — Student Portal Preview (8 tiles)
const STUDENT_PORTAL_FEATURES: { icon: string; label: string; hint: string; value: string }[] = [
  { icon: "UserCheck", label: "Profile Completion", hint: "11-section A–K profile with live completion %", value: "84%" },
  { icon: "ClipboardList", label: "Active Applications", hint: "Track up to 10 university applications in one view", value: "5" },
  { icon: "FolderLock", label: "Documents", hint: "RBAC-protected upload with status tracking", value: "23" },
  { icon: "MessageSquare", label: "Messages", hint: "Counselor and visa officer conversations", value: "12" },
  { icon: "Plane", label: "Visa Readiness", hint: "AI readiness score with risk assessment", value: "78%" },
  { icon: "CalendarClock", label: "Appointments", hint: "Booking, reminders, and reschedule", value: "3" },
  { icon: "Sparkles", label: "AI Recommendations", hint: "Next-best-action suggestions weekly", value: "Live" },
  { icon: "GitBranch", label: "Timeline", hint: "Every action logged from lead to enrollment", value: "47" },
];

// Section 17 — Partner Portal Preview (8 features)
const PARTNER_PORTAL_FEATURES: { icon: string; title: string; description: string }[] = [
  { icon: "UserPlus", title: "Register Students", description: "Onboard students with verified identity and consent." },
  { icon: "Search", title: "Search Programs", description: "Browse 1000+ courses across all published universities." },
  { icon: "Send", title: "Submit Applications", description: "Submit and track applications on behalf of students." },
  { icon: "Upload", title: "Upload Documents", description: "Secure document upload with audit logging." },
  { icon: "GitBranch", title: "Track Applications", description: "Real-time stage tracking with stage-by-stage history." },
  { icon: "DollarSign", title: "Commission Tracking", description: "Transparent per-application commission ledger." },
  { icon: "BookOpen", title: "Learning Resources", description: "Partner training, country briefings, and compliance modules." },
  { icon: "CalendarClock", title: "Deadlines", description: "Never miss an intake or scholarship deadline." },
];

// Section 18 — AI Support Tools (8 cards)
const AI_TOOLS: { icon: string; title: string; description: string }[] = [
  { icon: "Sparkles", title: "AI Course Match", description: "Scores courses against GPA, English, budget, and goals — counselor-validated." },
  { icon: "FileText", title: "AI SOP Helper", description: "Drafts and refines your statement of purpose in your own voice — never copy-paste." },
  { icon: "FileUser", title: "AI CV Helper", description: "Structures academic and project CVs aligned to your target program." },
  { icon: "Plane", title: "AI Visa Coach", description: "Explains visa rules, flags risks, and prepares your interview script." },
  { icon: "Mic", title: "AI Interview Practice", description: "Mock interviews with scoring on confidence, clarity, and credibility." },
  { icon: "ClipboardList", title: "AI Document Checklist", description: "Personalized checklist based on country, level, and intake." },
  { icon: "Award", title: "AI Scholarship Match", description: "Matches you to country, university, and program-level scholarships." },
  { icon: "Calculator", title: "AI Study Cost Estimate", description: "Estimates tuition, living cost, travel, and visa cost by destination." },
];

// Section 19 — Resources Hub (28 cards)
const RESOURCES: { icon: string; category: string; title: string }[] = [
  { icon: "BookOpen", category: "Blog", title: "UK Student Visa 2025 — Step-by-Step Guide" },
  { icon: "Plane", category: "Visa Guide", title: "Post-Study Work Rights: UK vs Canada vs Australia" },
  { icon: "Award", category: "Scholarship", title: "Chevening Scholarship — Eligibility and Tips" },
  { icon: "Star", category: "Success Story", title: "From Dhaka to Manchester — Tanvir's Journey" },
  { icon: "ClipboardList", category: "Application Tips", title: "Writing an SOP That Stands Out (with Examples)" },
  { icon: "Luggage", category: "Pre-Departure", title: "What to Pack for Your First Month in the UK" },
  { icon: "Home", category: "Accommodation", title: "On-Campus vs Private Housing — Cost Comparison" },
  { icon: "Wallet", category: "Financial", title: "Bank Statement Format for Student Visa (UK, AUS, CAN)" },
  { icon: "HelpCircle", category: "FAQ", title: "Top 20 Questions Asked by Bangladeshi Students" },
  { icon: "Mic", category: "Interview", title: "Credibility Interview — 15 Sample Questions" },
  { icon: "FileText", category: "Documents", title: "Document Checklist for Masters in Germany" },
  { icon: "GraduationCap", category: "English Test", title: "IELTS vs PTE — Which Should You Take?" },
  { icon: "BookOpen", category: "Blog", title: "Why Ireland Is the New Favorite for Bangladeshi Students" },
  { icon: "Plane", category: "Visa Guide", title: "Canada SDS vs Non-SDS — What's the Difference?" },
  { icon: "Award", category: "Scholarship", title: "Commonwealth Master's Scholarship — Apply Now" },
  { icon: "Star", category: "Success Story", title: "Rina's Path to a Full Scholarship in Finland" },
  { icon: "ClipboardList", category: "Application Tips", title: "How to Choose Between Conditional and Unconditional Offers" },
  { icon: "Luggage", category: "Pre-Departure", title: "Opening a Bank Account in the UK as a Student" },
  { icon: "Home", category: "Accommodation", title: "Understanding Tenancy Agreements in Australia" },
  { icon: "Wallet", category: "Financial", title: "Sponsor Documents — Who Can Sponsor Your Studies?" },
  { icon: "HelpCircle", category: "FAQ", title: "Can I Work While Studying in the UK?" },
  { icon: "Mic", category: "Interview", title: "Pre-CAS Interview — What to Expect and How to Prepare" },
  { icon: "FileText", category: "Documents", title: "Transcript Translation and Attestation Guide" },
  { icon: "GraduationCap", category: "English Test", title: "Duolingo English Test — Accepted Universities List" },
  { icon: "BookOpen", category: "Blog", title: "Studying Healthcare in Australia — Pathway to PR" },
  { icon: "Plane", category: "Visa Guide", title: "US F1 Visa — Step-by-Step Process for Bangladeshi Students" },
  { icon: "Award", category: "Scholarship", title: "Erasmus Mundus Joint Masters — Application Guide" },
  { icon: "Star", category: "Success Story", title: "Sadia's MBA in Ireland — Visa to PR in 4 Years" },
];

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function flagFor(countrySlug: string, slides: HeroSlide[]): string {
  const s = slides.find((x) => x.countrySlug === countrySlug);
  return s?.country?.flag || "🌍";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

// ──────────────────────────────────────────────────────────────────────────────
// SECTION HEADER COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  title,
  subtitle,
  align = "center",
}: {
  label: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8501A]">{label}</p>
      <h2 className="mt-2 text-3xl font-black text-[#0057B8] sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

export function PublicHome({ onNavigate }: PublicHomeProps) {
  const { toast } = useToast();
  const [data, setData] = React.useState<HomepageData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Hero auto-rotation
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const prefersReducedMotion = React.useRef(false);

  // Course finder search
  const [searchForm, setSearchForm] = React.useState({
    country: "",
    level: "",
    subject: "",
    intake: "",
    budget: "",
    englishTest: "",
  });

  // Popular courses tab
  const [courseTab, setCourseTab] = React.useState("Business");

  // ─── Fetch homepage data ──────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setData(json as HomepageData);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Check prefers-reduced-motion once ────────────────────────────────
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  const heroSlides = data?.heroSlides || [];

  // ─── Auto-rotate hero every 5s ────────────────────────────────────────
  React.useEffect(() => {
    if (paused || prefersReducedMotion.current || heroSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused, heroSlides.length]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  function handleSearch() {
    toast({
      title: "Opening Course Finder",
      description: "Your filters are pre-loaded — refine and shortlist courses.",
    });
    onNavigate("public-course-finder");
  }

  function handleAIMatch() {
    toast({
      title: "AI Course Match",
      description: "Opening the AI Course Match — tell us your goals and we'll score courses.",
    });
    onNavigate("public-course-finder");
  }

  function handleWhatsApp() {
    toast({
      title: "Opening WhatsApp",
      description: "Our counselor will respond within working hours. Direct line: 01805020101",
    });
  }

  function handleConsult() {
    toast({
      title: "Book Free Consultation",
      description: "Scroll down to the lead form or WhatsApp us at 01805020101.",
    });
    document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleEligibility() {
    toast({
      title: "Check Eligibility",
      description: "Opening eligibility checker — answer 5 questions for an instant score.",
    });
    onNavigate("public-course-finder");
  }

  function handleFindCourses() {
    onNavigate("public-courses");
  }

  function handleViewCountry(slug: string) {
    onNavigate("public-country", slug);
  }

  // ─── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
        <div className="space-y-4">
          <div className="h-64 rounded-2xl bg-[#F8FAFC]" />
          <LoadingGrid count={4} />
          <div className="h-48 rounded-2xl bg-[#F8FAFC]" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || { totalCountries: 0, totalUniversities: 0, totalCourses: 0, totalExams: 0 };
  const safeSlide = heroSlides[currentSlide] || heroSlides[0];
  const safeIndex = heroSlides.length > 0 ? currentSlide : 0;
  const slideCountry = safeSlide?.country;

  // Country quick facts (parsed)
  const quickFacts = safeParse<Record<string, any>>(slideCountry?.quickFacts, {});
  const factEntries = Object.entries(quickFacts).filter(([, v]) => v != null && v !== "").slice(0, 4);

  return (
    <div className="bg-white">
      {/* ════════════════════════════════════════════════════════════════
          SECTION 2 — AUTO-CHANGING COUNTRY HERO
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-white"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Decorative soft background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 size-96 rounded-full bg-[#e8f0fb]/60 blur-3xl" />
          <div className="absolute -right-32 top-20 size-96 rounded-full bg-[#fdece4]/50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            {/* ─── LEFT ─── */}
            <div>
              {/* Badge with animated pulse dot */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8501A]/30 bg-[#fdece4]/60 px-3.5 py-1.5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8501A] opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#E8501A]" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E8501A]">Your Future Starts Here</span>
              </div>

              {/* H1 — dynamic country */}
              <h1 className="mt-5 text-4xl font-black leading-[1.05] text-[#0F172A] sm:text-5xl lg:text-6xl">
                Study Abroad in the{" "}
                <span key={`country-${safeIndex}`} className="inline-block animate-in fade-in slide-in-from-bottom-2 duration-700 text-[#0057B8]">
                  {slideCountry?.name || "World"}
                </span>
              </h1>

              {/* Subtitle */}
              <p key={`sub-${safeIndex}`} className="mt-4 max-w-xl text-base text-muted-foreground animate-in fade-in duration-700 sm:text-lg">
                {safeSlide?.subtitle || "Honest, verified guidance for Bangladeshi students — from course match to visa decision."}
              </p>

              {/* CTA buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={handleConsult}
                  className="h-12 bg-[#E8501A] px-5 text-white hover:bg-[#E8501A]/90"
                >
                  <Icon name="CalendarCheck" className="size-4" />
                  Book Free Consultation
                </Button>
                <Button
                  onClick={handleFindCourses}
                  variant="outline"
                  className="h-12 border-[#0057B8] px-5 text-[#0057B8] hover:bg-[#e8f0fb]"
                >
                  <Icon name="Search" className="size-4" />
                  Find Courses
                </Button>
                <Button
                  onClick={handleEligibility}
                  variant="ghost"
                  className="h-12 px-4 text-[#0057B8] hover:bg-[#e8f0fb]"
                >
                  <Icon name="ClipboardCheck" className="size-4" />
                  Check Eligibility
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="h-12 border-emerald-500 px-4 text-emerald-600 hover:bg-emerald-50"
                >
                  <Icon name="MessageCircle" className="size-4" />
                  WhatsApp 01805020101
                </Button>
              </div>

              {/* Trust badges — 4 stat tiles */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: "Globe", value: stats.totalCountries, label: "Countries" },
                  { icon: "Building2", value: stats.totalUniversities, label: "Universities" },
                  { icon: "BookOpen", value: stats.totalCourses, label: "Courses" },
                  { icon: "GraduationCap", value: stats.totalExams, label: "English Tests" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border-2 border-[#E2E8F0] bg-white p-3.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#0057B8]">
                      <Icon name={s.icon} className="size-4" />
                    </div>
                    <p className="mt-2.5 text-2xl font-black tabular-nums text-[#0F172A]">{s.value}</p>
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Manual country dots */}
              {heroSlides.length > 1 && (
                <div className="mt-6 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Choose destination:</span>
                  <div className="flex items-center gap-1.5">
                    {heroSlides.map((s, i) => (
                      <button
                        key={s.countrySlug}
                        onClick={() => setCurrentSlide(i)}
                        aria-label={`Switch to ${s.country?.name || s.countrySlug}`}
                        className={cn(
                          "h-2.5 rounded-full transition-all",
                          i === safeIndex ? "w-7 bg-[#0057B8]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── RIGHT — Country image card ─── */}
            <div className="relative">
              {safeSlide ? (
                <div
                  key={`card-${safeIndex}`}
                  className="relative animate-in fade-in slide-in-from-bottom-3 duration-700"
                >
                  <Card className="overflow-hidden rounded-3xl border-2 border-[#E2E8F0] bg-white">
                    {/* Top color band */}
                    <div
                      className="h-28 w-full"
                      style={{ background: `linear-gradient(135deg, ${safeSlide.accentColor || "#0057B8"}, #0057B8)` }}
                    />
                    <CardContent className="-mt-14 px-6 pb-6">
                      {/* Flag (large emoji) */}
                      <div className="flex items-end justify-between">
                        <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-white text-6xl shadow-lg">
                          {slideCountry?.flag || "🌍"}
                        </div>
                        <Badge variant="outline" className="mb-1 border-[#0057B8]/20 bg-[#e8f0fb]/60 text-[#0057B8]">
                          <Icon name="ShieldCheck" className="mr-1 size-3" />
                          Last verified: {safeSlide.lastVerifiedAt ? fmtDate(safeSlide.lastVerifiedAt) : "Jan 2025"}
                        </Badge>
                      </div>

                      {/* Name + capital */}
                      <div className="mt-4">
                        <h3 className="text-2xl font-black text-[#0F172A]">{slideCountry?.name || "Your Destination"}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Capital: <span className="font-semibold text-[#0F172A]">{slideCountry?.capital || "—"}</span>
                        </p>
                      </div>

                      {/* Stats grid */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Popular City</p>
                          <p className="mt-1 text-sm font-bold text-[#0057B8]">{safeSlide.popularCity || "—"}</p>
                        </div>
                        <div className="rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Popular Intake</p>
                          <p className="mt-1 text-sm font-bold text-[#0057B8]">{safeSlide.popularIntake || "—"}</p>
                        </div>
                        <div className="rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Universities</p>
                          <p className="mt-1 text-sm font-bold text-[#0057B8]">{safeSlide.universityCountLabel || "—"}</p>
                        </div>
                        <div className="rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Courses</p>
                          <p className="mt-1 text-sm font-bold text-[#0057B8]">{safeSlide.courseCountLabel || "—"}</p>
                        </div>
                      </div>

                      {/* Scholarship label */}
                      {safeSlide.scholarshipLabel && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-[#E8501A]/30 bg-[#fdece4]/40 p-3">
                          <Icon name="Award" className="size-4 text-[#E8501A]" />
                          <p className="text-xs font-semibold text-[#E8501A]">{safeSlide.scholarshipLabel}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Floating quick facts card */}
                  {factEntries.length > 0 && (
                    <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-2xl border-2 border-[#E2E8F0] bg-white p-4 shadow-xl sm:block">
                      <div className="flex items-center gap-2">
                        <Icon name="Sparkles" className="size-4 text-[#E8501A]" />
                        <p className="text-xs font-bold uppercase tracking-wider text-[#E8501A]">Quick Facts</p>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {factEntries.map(([k, v]) => (
                          <li key={k} className="flex items-start justify-between gap-2 text-xs">
                            <span className="font-medium capitalize text-muted-foreground">
                              {k.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="text-right font-semibold text-[#0F172A]">
                              {Array.isArray(v) ? v.slice(0, 2).join(", ") : String(v)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="rounded-3xl border-2 border-[#E2E8F0]">
                  <CardContent className="p-10 text-center">
                    <Icon name="Globe" className="mx-auto size-12 text-[#0057B8]/40" />
                    <p className="mt-3 font-semibold text-muted-foreground">Hero slides will appear here.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3 — SMART COURSE FINDER SEARCH
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Smart Course Finder"
            title="Find your perfect course in 30 seconds"
            subtitle="Tell us your country, level, subject, intake, budget, and English score — we'll match courses from 1000+ published programs."
          />

          <Card className="mt-8 rounded-2xl border-2 border-[#E2E8F0] bg-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label className="text-xs font-semibold">Country</Label>
                  <Select value={searchForm.country} onValueChange={(v) => setSearchForm({ ...searchForm, country: v })}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Choose destination" /></SelectTrigger>
                    <SelectContent>
                      {(data?.countries || []).map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Study Level</Label>
                  <Select value={searchForm.level} onValueChange={(v) => setSearchForm({ ...searchForm, level: v })}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Choose level" /></SelectTrigger>
                    <SelectContent>
                      {STUDY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Subject</Label>
                  <Select value={searchForm.subject} onValueChange={(v) => setSearchForm({ ...searchForm, subject: v })}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Choose subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Intake</Label>
                  <Select value={searchForm.intake} onValueChange={(v) => setSearchForm({ ...searchForm, intake: v })}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Choose intake" /></SelectTrigger>
                    <SelectContent>
                      {INTAKES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Budget</Label>
                  <Select value={searchForm.budget} onValueChange={(v) => setSearchForm({ ...searchForm, budget: v })}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Choose budget" /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">English Test</Label>
                  <Select value={searchForm.englishTest} onValueChange={(v) => setSearchForm({ ...searchForm, englishTest: v })}>
                    <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Choose test" /></SelectTrigger>
                    <SelectContent>
                      {ENGLISH_TEST_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleSearch} className="h-12 flex-1 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
                  <Icon name="Search" className="size-4" />
                  Find Courses
                </Button>
                <Button onClick={handleAIMatch} variant="outline" className="h-12 flex-1 border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]">
                  <Icon name="Sparkles" className="size-4" />
                  AI Course Match
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4 — STUDY DESTINATIONS
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Study Destinations"
            title="7 verified countries, 1000+ programs"
            subtitle="Each country guide is written in ALO's own words with verified tuition, visa, scholarship, and work-right data."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {heroSlides.slice(0, 7).map((slide) => {
              const facts = safeParse<Record<string, any>>(slide.country?.quickFacts, {});
              return (
                <Card key={slide.countrySlug} className="flex h-full flex-col rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{slide.country?.flag || "🌍"}</span>
                        <div>
                          <h3 className="text-lg font-black text-[#0F172A]">{slide.country?.name}</h3>
                          <p className="text-xs text-muted-foreground">Capital: {slide.country?.capital || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-[#F8FAFC] p-2">
                        <p className="font-semibold text-muted-foreground">Popular city</p>
                        <p className="font-bold text-[#0057B8]">{slide.popularCity || "—"}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8FAFC] p-2">
                        <p className="font-semibold text-muted-foreground">Popular intake</p>
                        <p className="font-bold text-[#0057B8]">{slide.popularIntake || "—"}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8FAFC] p-2">
                        <p className="font-semibold text-muted-foreground">Universities</p>
                        <p className="font-bold text-[#0057B8]">{slide.universityCountLabel || "—"}</p>
                      </div>
                      <div className="rounded-lg bg-[#F8FAFC] p-2">
                        <p className="font-semibold text-muted-foreground">Courses</p>
                        <p className="font-bold text-[#0057B8]">{slide.courseCountLabel || "—"}</p>
                      </div>
                    </div>

                    {/* Extra details */}
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      {Array.isArray(facts.studyLevels) && facts.studyLevels.length > 0 && (
                        <p><span className="font-semibold text-[#0F172A]">Levels:</span> {facts.studyLevels.join(", ")}</p>
                      )}
                      {facts.visaType && (
                        <p><span className="font-semibold text-[#0F172A]">Visa:</span> {facts.visaType}</p>
                      )}
                      {slide.scholarshipLabel && (
                        <p className="flex items-center gap-1"><Icon name="Award" className="size-3 text-[#E8501A]" /><span className="font-semibold text-[#E8501A]">{slide.scholarshipLabel}</span></p>
                      )}
                      <p className="text-[10px]">Last verified: {slide.lastVerifiedAt ? fmtDate(slide.lastVerifiedAt) : "—"}</p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-col gap-2 pt-4">
                      <Button
                        onClick={() => handleViewCountry(slide.countrySlug)}
                        variant="outline"
                        className="h-10 w-full border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]"
                      >
                        View Country Guide
                      </Button>
                      <Button
                        onClick={handleFindCourses}
                        className="h-10 w-full bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                      >
                        Find Courses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button onClick={() => onNavigate("public-destinations")} variant="outline" className="h-12 border-[#0057B8] px-6 text-[#0057B8] hover:bg-[#e8f0fb]">
              View All Destinations
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5 — ABOUT ALO EDUCATION
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeader
                label="About ALO Education"
                title="Founded in February 2023 by Taslima Akter"
                subtitle="Started in Dhaka, Bangladesh — built for Bangladeshi students first, expanding to serve South Asia."
                align="left"
              />
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  ALO Education was founded in <span className="font-semibold text-[#0F172A]">February 2023</span> by <span className="font-semibold text-[#0F172A]">Taslima Akter</span> with a single mission — to give Bangladeshi students an honest, technology-driven pathway to study abroad. We started in <span className="font-semibold text-[#0F172A]">Dhaka</span> and remain rooted in the realities of Bangladeshi academic, financial, and family contexts.
                </p>
                <p>
                  Our process is <span className="font-semibold text-[#0F172A]">transparent</span> — clear fees, clear timelines, clear next steps. Every student gets a <span className="font-semibold text-[#0F172A]">student portal</span> to track profile, documents, applications, and visa stages in real time.
                </p>
                <p>
                  Quick questions? Reach us on <span className="font-semibold text-[#0F172A]">WhatsApp at 01805020101</span> during working hours. We answer in Bangla or English — your choice.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={() => onNavigate("public-destinations")} variant="outline" className="h-12 border-[#0057B8] px-5 text-[#0057B8] hover:bg-[#e8f0fb]">
                  <Icon name="Info" className="size-4" />
                  Learn More
                </Button>
                <Button onClick={handleConsult} className="h-12 bg-[#E8501A] px-5 text-white hover:bg-[#E8501A]/90">
                  <Icon name="CalendarCheck" className="size-4" />
                  Book Free Consultation
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "MapPin", title: "Dhaka Roots", text: "Founded and headquartered in Dhaka." },
                { icon: "Users", title: "Bangladesh Focus", text: "Built around SSC/HSC backgrounds, Taka budgets, and family expectations." },
                { icon: "Glasses", title: "Transparent Process", text: "Every fee, every step, every risk — communicated upfront." },
                { icon: "LayoutDashboard", title: "Student Portal", text: "Track your journey from lead to enrollment in real time." },
                { icon: "MessageCircle", title: "WhatsApp Support", text: "Quick replies on 01805020101 during working hours." },
                { icon: "ShieldCheck", title: "Audit-Logged", text: "Every action on your profile is recorded for safety." },
              ].map((c) => (
                <Card key={c.title} className="rounded-2xl border-2 border-[#E2E8F0] bg-white">
                  <CardContent className="p-4">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                      <Icon name={c.icon} className="size-4" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#0F172A]">{c.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 6 — MISSION, VISION, VALUES
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Mission, Vision, Values"
            title="What drives ALO Education"
            subtitle="Eight principles that shape every counseling session, every document review, and every visa application."
          />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <Card key={v.heading} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                    <Icon name={v.icon} className="size-5" />
                  </div>
                  <p className="mt-4 text-base font-bold text-[#0F172A]">{v.heading}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{v.explanation}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 7 — WHY CHOOSE ALO
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Why Choose ALO"
            title="12 reasons students and families trust ALO"
            subtitle="From your first call to pre-departure, every step is handled by an in-house specialist — not a call-center agent."
          />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {WHY_CHOOSE.map((w) => (
              <Card key={w.title} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#fdece4] text-[#E8501A]">
                    <Icon name={w.icon} className="size-5" />
                  </div>
                  <p className="mt-3.5 text-sm font-bold text-[#0F172A]">{w.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{w.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 8 — SERVICES (Dynamic)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Our Services"
            title="End-to-end study-abroad services"
            subtitle="From first counseling call to landing on campus — every service is delivered by an in-house ALO specialist."
          />
          {data?.services && data.services.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.services.slice(0, 15).map((s) => (
                <Card key={s.slug} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                      <Icon name={s.icon || "Sparkles"} className="size-5" />
                    </div>
                    <p className="mt-3.5 text-sm font-bold text-[#0F172A]">{s.title}</p>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                    <Button
                      onClick={() => {
                        toast({ title: s.ctaLabel || "Learn More", description: "A counselor will reach out within 24 hours." });
                      }}
                      variant="ghost"
                      className="mt-3 h-9 justify-start px-0 text-[#0057B8] hover:bg-transparent hover:underline"
                    >
                      {s.ctaLabel || "Learn More"}
                      <Icon name="ArrowRight" className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="Sparkles"
              title="Services unavailable right now"
              description="Our service catalog is being finalized. Talk to a counselor to learn more."
              action={<Button onClick={handleConsult} className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">Book Free Consultation</Button>}
            />
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 9 — STUDENT JOURNEY TIMELINE
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Student Journey"
            title="12 steps from inquiry to enrollment"
            subtitle="Every step is tracked inside your student portal — no phone tag, no missing emails."
          />

          {/* Journey hero image */}
          <div className="mt-8 mb-2 overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90fd10d9d?w=1280&q=80"
              alt="International students walking on university campus — study abroad journey"
              className="h-48 w-full object-cover sm:h-64"
              loading="lazy"
            />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {JOURNEY_STEPS.map((step, i) => (
              <Card key={step.title} className="relative h-full rounded-2xl border-2 border-[#E2E8F0] bg-white">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#0057B8] text-white">
                      <Icon name={step.icon} className="size-5" />
                    </div>
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#fdece4] text-xs font-black text-[#E8501A]">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mt-3.5 text-sm font-bold text-[#0F172A]">{step.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 10 — COUNTRY INTELLIGENCE CARDS
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Country Intelligence"
            title="Verified intelligence for each destination"
            subtitle="Tuition, living cost, work rights, and visa rules — only shown when verified. Otherwise: 'Check with counselor'."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {heroSlides.slice(0, 7).map((slide) => {
              const facts = safeParse<Record<string, any>>(slide.country?.quickFacts, {});
              const cities = Array.isArray(facts.cities) ? facts.cities : [];
              const intakes = Array.isArray(facts.intakes) ? facts.intakes : [];
              const studyLevels = Array.isArray(facts.studyLevels) ? facts.studyLevels : [];
              const tuitionRange = facts.tuitionRange || facts.tuition;
              const livingCost = facts.livingCost;
              const visaType = facts.visaType;
              const postStudyRoute = facts.postStudyRoute || facts.workRights?.postStudyRoute;
              const verified = slide.country?.lastVerifiedAt != null;

              return (
                <Card key={slide.countrySlug} className="rounded-2xl border-2 border-[#E2E8F0] bg-white">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{slide.country?.flag || "🌍"}</span>
                        <div>
                          <h3 className="text-lg font-black text-[#0F172A]">{slide.country?.name}</h3>
                          <p className="text-xs text-muted-foreground">Capital: {slide.country?.capital || "—"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]", verified ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700")}>
                        {verified ? "Verified" : "Needs review"}
                      </Badge>
                    </div>

                    {/* Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <p className="font-semibold text-muted-foreground">Popular cities:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{cities.length > 0 ? cities.slice(0, 3).join(", ") : "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Popular intakes:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{intakes.length > 0 ? intakes.join(", ") : "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Study levels:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{studyLevels.length > 0 ? studyLevels.join(", ") : "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Tuition range:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{tuitionRange ? (typeof tuitionRange === "string" ? tuitionRange : JSON.stringify(tuitionRange)) : "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Living cost:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{livingCost ? (typeof livingCost === "string" ? livingCost : JSON.stringify(livingCost)) : "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Visa type:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{visaType || "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Work / post-study:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{postStudyRoute ? (typeof postStudyRoute === "string" ? postStudyRoute : "Available — verify with counselor") : "Check with counselor"}</p>

                      <p className="font-semibold text-muted-foreground">Last verified:</p>
                      <p className="text-right font-semibold text-[#0F172A]">{slide.country?.lastVerifiedAt ? fmtDate(slide.country.lastVerifiedAt) : "—"}</p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => handleViewCountry(slide.countrySlug)} variant="outline" className="h-10 flex-1 border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]">
                        View Country Guide
                      </Button>
                      <Button onClick={handleConsult} className="h-10 flex-1 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
                        Talk to Counselor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 11 — POPULAR COURSES (Dynamic + Tabs)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Popular Courses"
            title="Programs students are choosing right now"
            subtitle="Verified courses from published universities — with tuition, scholarship, intake, and English requirements."
          />

          {data?.courses && data.courses.length > 0 ? (
            <Tabs value={courseTab} onValueChange={setCourseTab} className="mt-8">
              <div className="overflow-x-auto alo-scroll">
                <TabsList className="flex h-auto w-max gap-1 bg-white p-1">
                  {COURSE_TABS.map((t) => (
                    <TabsTrigger key={t} value={t} className="h-9 px-3 text-xs data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {COURSE_TABS.map((tab) => {
                // Loose match — case-insensitive substring on subject
                const matches = data.courses.filter((c) =>
                  c.subject?.toLowerCase().includes(tab.toLowerCase()) ||
                  c.name?.toLowerCase().includes(tab.toLowerCase())
                );
                const list = (matches.length > 0 ? matches : data.courses).slice(0, 12);
                return (
                  <TabsContent key={tab} value={tab} className="mt-6">
                    {list.length > 0 ? (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {list.map((c) => (
                          <Card key={c.slug} className="flex h-full flex-col rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                            <CardContent className="flex h-full flex-col p-5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#0F172A]">{c.name}</p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">{c.university.name}</p>
                                </div>
                                {c.country?.flag && <span className="text-2xl">{c.country.flag}</span>}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[10px] border-[#0057B8]/20 bg-[#e8f0fb]/60 text-[#0057B8]">{c.level}</Badge>
                                <Badge variant="outline" className="text-[10px]">{c.subject}</Badge>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <p><span className="font-semibold text-muted-foreground">City:</span> <span className="font-semibold text-[#0F172A]">{c.university.city}</span></p>
                                <p><span className="font-semibold text-muted-foreground">Duration:</span> <span className="font-semibold text-[#0F172A]">{c.duration}</span></p>
                                <p><span className="font-semibold text-muted-foreground">Intake:</span> <span className="font-semibold text-[#0F172A]">{c.intake}</span></p>
                                <p><span className="font-semibold text-muted-foreground">Deadline:</span> <span className="font-semibold text-[#0F172A]">{c.deadline || "—"}</span></p>
                              </div>

                              <div className="mt-3 rounded-lg bg-[#F8FAFC] p-2.5">
                                <p className="text-xs font-semibold text-muted-foreground">Tuition</p>
                                <p className="text-base font-black text-[#0057B8]">{c.tuition}</p>
                              </div>

                              {c.scholarship && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs">
                                  <Icon name="Award" className="size-3.5 text-[#E8501A]" />
                                  <span className="font-semibold text-[#E8501A]">{c.scholarship}</span>
                                </div>
                              )}

                              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                                <span className="font-semibold">English:</span> {c.englishRequirement}
                              </p>

                              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                                <Button onClick={() => onNavigate("public-course", c.slug)} variant="outline" className="h-9 flex-1 border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]">
                                  View Details
                                </Button>
                                <Button
                                  onClick={() => toast({ title: "Added to compare", description: `${c.name} added to your compare list.` })}
                                  variant="ghost"
                                  className="h-9 px-2 text-[#0057B8] hover:bg-[#e8f0fb]"
                                  aria-label="Compare"
                                >
                                  <Icon name="GitCompare" className="size-4" />
                                </Button>
                                <Button
                                  onClick={() => toast({ title: "Application started", description: "A counselor will reach out to begin your application." })}
                                  className="h-9 flex-1 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                                >
                                  Apply
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon="BookOpen" title="No courses in this category" description="Try another subject tab or browse all courses." />
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <EmptyState icon="BookOpen" title="Courses unavailable right now" description="Our course catalog is being verified and published." />
          )}

          <div className="mt-8 text-center">
            <Button onClick={() => onNavigate("public-courses")} variant="outline" className="h-12 border-[#0057B8] px-6 text-[#0057B8] hover:bg-[#e8f0fb]">
              Browse All Courses
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 12 — TRUSTED UNIVERSITIES (Dynamic)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Trusted Universities"
            title="400+ universities our students trust"
            subtitle="Every university is verified before publication. Click any card to explore courses, tuition, and requirements."
          />

          {data?.universities && data.universities.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.universities.slice(0, 12).map((u) => {
                const facts = safeParse<Record<string, any>>(u.quickFacts, {});
                const intakes = Array.isArray(facts.intakes) ? facts.intakes : [];
                const englishTests = Array.isArray(facts.englishTests) ? facts.englishTests : [];
                const scholarship = facts.scholarship;
                const ranking = facts.worldRanking || facts.ranking;
                const uniImage = `https://images.unsplash.com/photo-${u.countrySlug === 'uk' ? '1562774053-701939366bbc' : u.countrySlug === 'usa' ? '1541339907198-eef733ef68ce' : u.countrySlug === 'canada' ? '1592280771190-3e2e4d57fb22' : u.countrySlug === 'australia' ? '1571987499613-6e1c8f3a8a8f' : '1562774053-701939366bbc'}?w=800&q=80`;
                return (
                  <Card key={u.slug} className="alo-card-anim group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-[#E2E8F0] bg-white transition-all hover:shadow-lg">
                    {/* University image header */}
                    <div className="relative h-32 overflow-hidden bg-[#F8FAFC]">
                                <img
                        src={uniImage}
                        alt={`${u.name} campus — study abroad`}
                        className="alo-card-img size-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {u.country?.flag && <span className="absolute left-3 top-3 text-2xl drop-shadow-lg">{u.country.flag}</span>}
                      {ranking && (
                        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-[#0066CC]">#{ranking}</span>
                      )}
                    </div>
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0F172A]">{u.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{u.city}{u.country?.name ? `, ${u.country.name}` : ""}</p>
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{u.overview}</p>

                      <div className="mt-3 space-y-1.5 text-xs">
                        {intakes.length > 0 && (
                          <p><span className="font-semibold text-muted-foreground">Intakes:</span> <span className="font-semibold text-[#0F172A]">{intakes.join(", ")}</span></p>
                        )}
                        {englishTests.length > 0 && (
                          <p><span className="font-semibold text-muted-foreground">English:</span> <span className="font-semibold text-[#0F172A]">{englishTests.join(", ")}</span></p>
                        )}
                        {scholarship && (
                          <Badge variant="outline" className="border-[#E8501A]/30 bg-[#fdece4]/40 text-[#E8501A]">
                            <Icon name="Award" className="mr-1 size-3" />
                            {typeof scholarship === "string" ? scholarship : "Scholarship available"}
                          </Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground">Last verified: {u.lastVerifiedAt ? fmtDate(u.lastVerifiedAt) : "—"}</p>
                      </div>

                      <div className="mt-auto flex flex-col gap-2 pt-4">
                        <Button onClick={() => onNavigate("public-university", u.slug)} variant="outline" className="h-10 w-full border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]">
                          View Courses
                        </Button>
                        <Button
                          onClick={() => toast({ title: "Application started", description: `Beginning your application to ${u.name}.` })}
                          className="h-10 w-full bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="Building2" title="Universities unavailable right now" description="Our university catalog is being verified and published." />
          )}

          <div className="mt-8 text-center">
            <Button onClick={() => onNavigate("public-universities")} variant="outline" className="h-12 border-[#0057B8] px-6 text-[#0057B8] hover:bg-[#e8f0fb]">
              View All Universities
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 13 — SCHOLARSHIPS (Dynamic)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Scholarships"
            title="Funding your study-abroad dream"
            subtitle="Country, university, and program-level scholarships — verified before publication."
          />

          {data?.scholarships && data.scholarships.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.scholarships.slice(0, 8).map((s, i) => (
                <Card key={`${s.name}-${i}`} className="flex h-full flex-col rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-[#fdece4] text-[#E8501A]">
                        <Icon name="Award" className="size-5" />
                      </div>
                      {s.flag && <span className="text-2xl">{s.flag}</span>}
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#0F172A]">{s.name || "Scholarship"}</p>
                    <p className="text-xs text-muted-foreground">{s.country}{s.university ? ` · ${s.university}` : ""}</p>

                    <div className="mt-3 space-y-1.5 text-xs">
                      {s.amount && (
                        <p><span className="font-semibold text-muted-foreground">Amount:</span> <span className="font-bold text-[#0057B8]">{s.amount}</span></p>
                      )}
                      {s.eligibility && (
                        <p className="line-clamp-2"><span className="font-semibold text-muted-foreground">Eligibility:</span> {s.eligibility}</p>
                      )}
                      {s.deadline && (
                        <p><span className="font-semibold text-muted-foreground">Deadline:</span> <span className="font-semibold text-[#0F172A]">{s.deadline}</span></p>
                      )}
                    </div>

                    <div className="mt-auto pt-4">
                      <Button
                        onClick={() => {
                          toast({ title: "Checking eligibility", description: "Our counselor will review your profile against this scholarship." });
                          handleConsult();
                        }}
                        className="h-10 w-full bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                      >
                        Check Eligibility
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon="Award" title="Scholarships unavailable right now" description="We're verifying scholarship data before publication." />
          )}

          <div className="mt-8 text-center">
            <Button onClick={() => onNavigate("scholarship-finder")} variant="outline" className="h-12 border-[#0057B8] px-6 text-[#0057B8] hover:bg-[#e8f0fb]">
              Open Scholarship Finder
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 14 — ENGLISH LANGUAGE TESTS
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="English Language Tests"
            title="Choose the right English test"
            subtitle="11 accepted tests — pick the one that fits your destination and timeline. ALO students get 3 free mock tests."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ENGLISH_TESTS.map((t) => (
              <Card key={t.name} className="flex h-full flex-col rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                    <Icon name={t.icon} className="size-5" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#0F172A]">{t.name}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">{t.fullName}</p>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <p><span className="font-semibold text-muted-foreground">Best for:</span> <span className="font-semibold text-[#0F172A]">{t.bestFor}</span></p>
                    <p><span className="font-semibold text-muted-foreground">Accepted in:</span> <span className="font-semibold text-[#0F172A]">{t.destinations}</span></p>
                    <p><span className="font-semibold text-muted-foreground">Score range:</span> <span className="font-semibold text-[#0F172A]">{t.scoreRange}</span></p>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    <Button
                      onClick={() => onNavigate("public-exams")}
                      variant="outline"
                      className="h-10 w-full border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]"
                    >
                      Learn More
                    </Button>
                    <Button
                      onClick={() => {
                        toast({ title: "Mock test starting", description: `Loading a free ${t.name} mock test for you.` });
                        onNavigate("english-test");
                      }}
                      className="h-10 w-full bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                    >
                      Start Mock Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison table */}
          <Card className="mt-10 rounded-2xl border-2 border-[#E2E8F0] bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-bold text-[#0057B8]">Quick Comparison</p>
              <div className="mt-4 overflow-x-auto alo-scroll">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="border-b-2 border-[#E2E8F0] text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Test</th>
                      <th className="py-2 pr-3">Best for</th>
                      <th className="py-2 pr-3">Destinations</th>
                      <th className="py-2 pr-3">Score range</th>
                      <th className="py-2">Mock test</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENGLISH_TESTS.map((t) => (
                      <tr key={t.name} className="border-b border-[#E2E8F0] last:border-0">
                        <td className="py-2.5 pr-3 font-bold text-[#0F172A]">{t.name}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{t.bestFor}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{t.destinations}</td>
                        <td className="py-2.5 pr-3 font-semibold text-[#0057B8]">{t.scoreRange}</td>
                        <td className="py-2.5">
                          <Button
                            onClick={() => onNavigate("english-test")}
                            variant="ghost"
                            className="h-7 px-2 text-[#E8501A] hover:bg-[#fdece4]/40"
                          >
                            Start
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => onNavigate("public-exams")} variant="outline" className="h-12 border-[#0057B8] px-5 text-[#0057B8] hover:bg-[#e8f0fb]">
              <Icon name="BookOpen" className="size-4" />
              View All English Tests
            </Button>
            <Button onClick={() => onNavigate("english-test")} className="h-12 bg-[#E8501A] px-5 text-white hover:bg-[#E8501A]/90">
              <Icon name="Mic" className="size-4" />
              Start Free Mock Test
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 15 — VISA AND COMPLIANCE SUPPORT
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Visa and Compliance"
            title="Visa preparation that reduces refusal risk"
            subtitle="Document checklists, financial proof guidance, credibility interview practice — every step handled by ALO specialists."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VISA_SUPPORT.map((v) => (
              <Card key={v.title} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#fdece4] text-[#E8501A]">
                    <Icon name={v.icon} className="size-5" />
                  </div>
                  <p className="mt-3.5 text-base font-bold text-[#0F172A]">{v.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Disclaimer */}
          <Card className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50/60">
            <CardContent className="flex items-start gap-3 p-5">
              <Icon name="ShieldAlert" className="mt-0.5 size-5 text-amber-600" />
              <p className="text-xs leading-relaxed text-amber-800">
                <span className="font-bold">Disclaimer:</span> Visa and work rules may change. The final checklist must be verified by ALO staff before you submit your application. AI guidance is preparation-only and cannot guarantee a visa decision.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                toast({ title: "Visa Readiness Check", description: "Answer 8 questions to get your readiness score." });
                onNavigate("ai-interview");
              }}
              className="h-12 bg-[#E8501A] px-5 text-white hover:bg-[#E8501A]/90"
            >
              <Icon name="ClipboardCheck" className="size-4" />
              Start Visa Readiness Check
            </Button>
            <Button onClick={handleConsult} variant="outline" className="h-12 border-[#0057B8] px-5 text-[#0057B8] hover:bg-[#e8f0fb]">
              <Icon name="CalendarCheck" className="size-4" />
              Book Visa Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 16 — STUDENT PORTAL PREVIEW
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Student Portal Preview"
            title="Your journey, tracked in one dashboard"
            subtitle="Real-time status of profile, documents, applications, visa, appointments, and AI recommendations."
          />

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STUDENT_PORTAL_FEATURES.map((f) => (
              <Card key={f.label} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                      <Icon name={f.icon} className="size-4" />
                    </div>
                    <span className="text-xl font-black text-[#0F172A]">{f.value}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#0F172A]">{f.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mini progress preview */}
          <Card className="mt-6 rounded-2xl border-2 border-[#E2E8F0] bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-bold text-[#0057B8]">Sample progress for a student</p>
              <div className="mt-4 space-y-4">
                {[
                  { label: "Profile completion", val: 84 },
                  { label: "Document readiness", val: 72 },
                  { label: "Visa readiness", val: 78 },
                  { label: "Application pipeline", val: 45 },
                ].map((p) => (
                  <div key={p.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A]">{p.label}</span>
                      <span className="font-bold text-[#0057B8]">{p.val}%</span>
                    </div>
                    <Progress value={p.val} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => onNavigate("student-dashboard")} variant="outline" className="h-12 border-[#0057B8] px-5 text-[#0057B8] hover:bg-[#e8f0fb]">
              <Icon name="LogIn" className="size-4" />
              Student Login
            </Button>
            <Button
              onClick={() => {
                toast({ title: "Create Student Account", description: "Scroll down to the lead form to get started." });
                document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="h-12 bg-[#E8501A] px-5 text-white hover:bg-[#E8501A]/90"
            >
              <Icon name="UserPlus" className="size-4" />
              Create Student Account
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 17 — PARTNER PORTAL PREVIEW
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Partner Portal Preview"
            title="Tools for agencies and consultants"
            subtitle="Register students, submit applications, track stages, and view transparent commission ledgers."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNER_PORTAL_FEATURES.map((f) => (
              <Card key={f.title} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                    <Icon name={f.icon} className="size-5" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#0F172A]">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => onNavigate("partner-portal")} variant="outline" className="h-12 border-[#0057B8] px-5 text-[#0057B8] hover:bg-[#e8f0fb]">
              <Icon name="LogIn" className="size-4" />
              Partner Login
            </Button>
            <Button
              onClick={() => toast({ title: "Become a Partner", description: "Fill out the partner interest form — we'll reach out within 48 hours." })}
              className="h-12 bg-[#E8501A] px-5 text-white hover:bg-[#E8501A]/90"
            >
              <Icon name="Handshake" className="size-4" />
              Become A Partner
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 18 — AI SUPPORT TOOLS
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="AI Support Tools"
            title="AI that assists — never replaces — your counselor"
            subtitle="8 AI tools to speed up course matching, SOP drafting, and interview practice. Every AI output is reviewed by a human counselor."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AI_TOOLS.map((t) => (
              <Card key={t.title} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Icon name={t.icon} className="size-5" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[#0F172A]">{t.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                  <Button
                    onClick={() => toast({ title: t.title, description: "AI tool is loading — your counselor will validate the output." })}
                    variant="ghost"
                    className="mt-3 h-9 justify-start px-0 text-violet-600 hover:bg-transparent hover:underline"
                  >
                    Try it now
                    <Icon name="ArrowRight" className="size-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Safety text */}
          <Card className="mt-8 rounded-2xl border-2 border-[#E8501A]/30 bg-[#fdece4]/40">
            <CardContent className="flex items-start gap-3 p-5">
              <Icon name="ShieldAlert" className="mt-0.5 size-5 text-[#E8501A]" />
              <p className="text-xs leading-relaxed text-[#0F172A]">
                <span className="font-bold">AI Safety:</span> AI gives preparation guidance only. ALO counselor final review required. AI cannot guarantee admission or visa. Every AI action is logged in your timeline for transparency.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 19 — RESOURCES HUB
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Resources Hub"
            title="Guides, blogs, and tips for every stage"
            subtitle="28 hand-picked resources — written by ALO counselors in plain language."
          />

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {RESOURCES.map((r, i) => (
              <Card
                key={`${r.title}-${i}`}
                className="group h-full cursor-pointer rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md"
                onClick={() => toast({ title: r.title, description: `Opening ${r.category.toLowerCase()} — written by ALO counselors.` })}
              >
                <CardContent className="flex h-full flex-col p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                      <Icon name={r.icon} className="size-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                  </div>
                  <p className="mt-3 flex-1 text-xs font-semibold leading-snug text-[#0F172A] group-hover:text-[#0057B8]">{r.title}</p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#0057B8]">
                    Read article
                    <Icon name="ArrowRight" className="size-3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => toast({ title: "Resources Hub", description: "Opening the full resources library." })}
              className="h-12 bg-[#E8501A] px-6 text-white hover:bg-[#E8501A]/90"
            >
              Open Resources Hub
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 20 — SUCCESS STORIES (Dynamic)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Success Stories"
            title="Real students, real outcomes"
            subtitle="Only published with explicit student consent. No fabricated testimonials."
          />

          {data?.stories && data.stories.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.stories.slice(0, 4).map((s, i) => (
                <Card key={`${s.studentName}-${i}`} className="flex h-full flex-col rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-alo-gradient text-white">
                        <span className="text-base font-black">{initials(s.studentName)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#0F172A]">{s.studentName}</p>
                        {s.homeDistrict && <p className="text-xs text-muted-foreground">From {s.homeDistrict}</p>}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs">
                      {s.countrySlug && (
                        <p><span className="font-semibold text-muted-foreground">Destination:</span> <span className="font-semibold text-[#0F172A]">{flagFor(s.countrySlug, heroSlides)} {s.countrySlug.toUpperCase()}</span></p>
                      )}
                      {s.universityName && (
                        <p><span className="font-semibold text-muted-foreground">University:</span> <span className="font-semibold text-[#0F172A]">{s.universityName}</span></p>
                      )}
                      {s.courseName && (
                        <p><span className="font-semibold text-muted-foreground">Course:</span> <span className="font-semibold text-[#0F172A]">{s.courseName}</span></p>
                      )}
                      {s.outcome && (
                        <p><span className="font-semibold text-muted-foreground">Outcome:</span> <span className="font-semibold text-emerald-600">{s.outcome}</span></p>
                      )}
                    </div>

                    <p className="mt-3 flex-1 text-xs italic leading-relaxed text-muted-foreground">"{s.testimonial}"</p>

                    {s.consentStatus && (
                      <p className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600">
                        <Icon name="ShieldCheck" className="size-3" />
                        Consent: {s.consentStatus}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      <Button
                        onClick={() => toast({ title: "Read full story", description: `${s.studentName}'s full story is loading.` })}
                        variant="outline"
                        className="h-9 w-full border-[#0057B8] text-[#0057B8] hover:bg-[#e8f0fb]"
                      >
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon="Star" title="No published stories yet" description="Student stories are added only with explicit consent." />
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 21 — EXPERT TEAM (Dynamic)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-6">
          <SectionHeader
            label="Expert Team"
            title="The people behind your journey"
            subtitle="In-house counselors, application specialists, visa officers, and English trainers — text-based cards (no third-party photos)."
          />

          {data?.team && data.team.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.team.slice(0, 6).map((m, i) => (
                <Card key={`${m.name}-${i}`} className="h-full rounded-2xl border-2 border-[#E2E8F0] bg-white transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-alo-gradient text-lg font-black text-white">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-[#0F172A]">{m.name}</p>
                        <p className="text-xs font-semibold text-[#0057B8]">{m.role}</p>
                      </div>
                    </div>

                    {m.specialty && (
                      <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-[#e8f0fb] px-2.5 py-1 text-xs font-semibold text-[#0057B8]">
                        <Icon name="Star" className="size-3" />
                        {m.specialty}
                      </div>
                    )}

                    {m.bio && (
                      <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">{m.bio}</p>
                    )}

                    <Button
                      onClick={() => toast({ title: "Meet our team", description: "Book a consultation to talk with our counselors." })}
                      variant="ghost"
                      className="mt-3 h-9 justify-start px-0 text-[#0057B8] hover:bg-transparent hover:underline"
                    >
                      Meet Our Team
                      <Icon name="ArrowRight" className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon="Users" title="Team profiles unavailable right now" description="Our team is being finalized." />
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 22 — FAQ (Dynamic, Accordion)
          ════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1000px] px-4 lg:px-6">
          <SectionHeader
            label="FAQ"
            title="Answers to common questions"
            subtitle="20 of the most-asked questions from Bangladeshi students and families."
          />

          {data?.faqs && data.faqs.length > 0 ? (
            <Card className="mt-10 rounded-2xl border-2 border-[#E2E8F0] bg-white">
              <CardContent className="p-2">
                <Accordion type="single" collapsible className="w-full">
                  {data.faqs.slice(0, 20).map((f, i) => (
                    <AccordionItem key={`faq-${i}`} value={`faq-${i}`} className="border-b border-[#E2E8F0] last:border-0">
                      <AccordionTrigger className="px-4 py-4 text-left text-sm font-bold text-[#0F172A] hover:no-underline">
                        {f.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">
                        {f.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon="HelpCircle" title="FAQs unavailable right now" description="We're compiling the most common questions." />
          )}

          <div className="mt-8 text-center">
            <Button
              onClick={() => toast({ title: "View All FAQs", description: "Opening the full FAQ library." })}
              variant="outline"
              className="h-12 border-[#0057B8] px-6 text-[#0057B8] hover:bg-[#e8f0fb]"
            >
              View All FAQs
              <Icon name="ArrowRight" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 23 — FINAL CTA AND LEAD FORM
          ════════════════════════════════════════════════════════════════ */}
      <section id="final-cta" className="bg-[#F8FAFC] py-16 lg:py-20">
        <div className="mx-auto max-w-[1100px] px-4 lg:px-6">
          <Card className="overflow-hidden rounded-3xl border-2 border-[#E2E8F0] bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left — pitch + buttons */}
              <div className="bg-alo-hero p-8 text-white lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8501A]">Final CTA</p>
                <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                  Ready to Start Your Study Abroad Journey?
                </h2>
                <p className="mt-3 text-sm text-white/90 sm:text-base">
                  Book a free 30-minute consultation with an ALO counselor. We'll review your profile, suggest courses, and outline your next steps — no obligation.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button onClick={handleConsult} className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
                    <Icon name="CalendarCheck" className="size-4" />
                    Book Free Consultation
                  </Button>
                  <Button onClick={handleFindCourses} variant="outline" className="h-12 border-white bg-transparent text-white hover:bg-white/10">
                    <Icon name="Search" className="size-4" />
                    Find Courses
                  </Button>
                  <Button onClick={handleEligibility} variant="outline" className="h-12 border-white bg-transparent text-white hover:bg-white/10">
                    <Icon name="ClipboardCheck" className="size-4" />
                    Check Eligibility
                  </Button>
                  <Button onClick={handleWhatsApp} variant="outline" className="h-12 border-emerald-300 bg-transparent text-emerald-200 hover:bg-emerald-500/10">
                    <Icon name="MessageCircle" className="size-4" />
                    WhatsApp 01805020101
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-black">{stats.totalCountries}+</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/70">Countries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.totalUniversities}+</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/70">Universities</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{stats.totalCourses}+</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/70">Courses</p>
                  </div>
                </div>
              </div>

              {/* Right — lead form */}
              <div className="p-6 lg:p-8">
                <PublicLeadForm sourceTag="Homepage final CTA" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 24 — FOOTER (handled by PublicShell — no separate render)
          ════════════════════════════════════════════════════════════════ */}
    </div>
  );
}
