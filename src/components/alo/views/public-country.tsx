"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  LoadingGrid,
  EmptyState,
  InfoRow,
  SectionCard,
  MiniBar,
} from "@/components/alo/shared";
import { Breadcrumb, SourceVerification, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicCountryProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

// ── Types ──
interface CountryFull {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  capital: string;
  currency: string;
  intro: string;
  quickFacts: string;
  whyStudy: string;
  pathway: string;
  popularCourses: string;
  entryRequirements: string;
  documents: string;
  visaProcess: string;
  interviewTypes: string;
  workRights: string;
  scholarships: string;
  cities: string;
  faqs: string;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | Date | null;
  verificationStatus?: string;
  universities: UniversityItem[];
}

interface UniversityItem {
  slug: string;
  name: string;
  city: string;
  quickFacts: string;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | Date | null;
}

// ── Safe JSON parse helper ──
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ── Eligibility result shape from /api/ai/eligibility ──
interface EligibilityResult {
  status?: string;
  summary?: string;
  strengths?: string[];
  concerns?: string[];
  recommendedDocuments?: string[];
  recommendedNextSteps?: string[];
  recommendedCourses?: string[];
  englishTestAdvice?: string;
  visaRiskNote?: string;
}

// ── Static option lists for forms ──
const STUDY_LEVELS = ["Foundation", "Bachelor", "Top-up", "Pre-Masters", "Masters", "MBA", "PhD"];
const ENGLISH_TESTS_LIST = ["IELTS", "IELTS UKVI", "PTE", "TOEFL", "Duolingo", "OIETC/ELLT", "GRE", "GMAT", "MOI", "Not yet"];
const ENTRY_LEVELS = ["foundation", "bachelor", "topup", "masters", "mba", "phd"];
const ENTRY_LABELS: Record<string, string> = {
  foundation: "Foundation",
  bachelor: "Bachelor",
  topup: "Top-up",
  masters: "Masters",
  mba: "MBA",
  phd: "PhD",
};

// ── Status colors for AI results ──
const STATUS_COLORS: Record<string, string> = {
  ELIGIBLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  POSSIBLY_ELIGIBLE: "bg-sky-100 text-sky-700 border-sky-200",
  NEEDS_COUNSELOR_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  NOT_READY_YET: "bg-rose-100 text-rose-700 border-rose-200",
};

const ALO_SUPPORT_STEPS = [
  { icon: "MessageCircle", label: "Free counselling" },
  { icon: "Bot", label: "AI course matching" },
  { icon: "ListChecks", label: "University shortlisting" },
  { icon: "ClipboardList", label: "Application support" },
  { icon: "FileText", label: "SOP & CV support" },
  { icon: "FolderCheck", label: "Document checking" },
  { icon: "GraduationCap", label: "English test prep" },
  { icon: "ClipboardCheck", label: "Mock test" },
  { icon: "Mic", label: "AI interview practice" },
  { icon: "Plane", label: "Visa checklist" },
  { icon: "UserCheck", label: "Visa officer review" },
  { icon: "LayoutDashboard", label: "Student portal tracking" },
  { icon: "Whatsapp", label: "WhatsApp support" },
];

const INTERVIEW_QUESTIONS = [
  "Why this country?",
  "Why this university?",
  "Why this course?",
  "What is your career plan?",
  "Who is your sponsor?",
  "How will you fund your studies?",
  "Can you explain your study gap?",
  "Why not study in Bangladesh?",
  "What will you do after graduation?",
];

export function PublicCountry({ slug, onNavigate }: PublicCountryProps) {
  const finalSlug = slug || "uk";
  const { toast } = useToast();

  const [country, setCountry] = React.useState<CountryFull | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setCountry(null);
    (async () => {
      try {
        const res = await fetch(`/api/countries/${encodeURIComponent(finalSlug)}`);
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.country) {
          setCountry(data.country as CountryFull);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [finalSlug]);

  // ── Scroll helper for anchor links ──
  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleWhatsApp() {
    toast({
      title: "Opening WhatsApp",
      description: country ? `Talk to a counselor about studying in ${country.shortName}.` : "Our counselor will respond within working hours.",
    });
  }

  // ──────────────────────────────
  // Loading / not found states
  // ──────────────────────────────
  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
          <div className="h-4 w-48 animate-pulse rounded bg-[var(--alo-brand-light)]" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-[var(--alo-brand-light)]" />
          <div className="mt-6"><LoadingGrid count={4} /></div>
          <div className="mt-8"><LoadingGrid count={3} /></div>
        </div>
      </div>
    );
  }

  if (notFound || !country) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-20 lg:px-6">
          <EmptyState
            icon="Globe"
            title="Country page not found"
            description="The destination you're looking for may not be published yet."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => onNavigate("public-destinations")} className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90">
                  <Icon name="Globe" className="mr-2 size-4" />
                  All Destinations
                </Button>
                <Button onClick={() => onNavigate("public-home")} variant="outline" className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                  <Icon name="Home" className="mr-2 size-4" />
                  Home
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // ── Parse all JSON fields safely ──
  const facts = safeParse<any>(country.quickFacts, {});
  const whyStudy = safeParse<any[]>(country.whyStudy, []);
  const pathway = safeParse<any>(country.pathway, {});
  const popularCourses = safeParse<any[]>(country.popularCourses, []);
  const entryRequirements = safeParse<any>(country.entryRequirements, {});
  const documents = safeParse<any[]>(country.documents, []);
  const visaProcess = safeParse<any[]>(country.visaProcess, []);
  const interviewTypes = safeParse<any[]>(country.interviewTypes, []);
  const workRights = safeParse<any>(country.workRights, {});
  const scholarships = safeParse<any[]>(country.scholarships, []);
  const cities = safeParse<any[]>(country.cities, []);
  const faqs = safeParse<any[]>(country.faqs, []);

  const citiesList: string[] = Array.isArray(facts.cities) ? facts.cities : [];
  const intakesList: string[] = Array.isArray(facts.intakes) ? facts.intakes : [];
  const studyLevelsList: string[] = Array.isArray(facts.studyLevels) ? facts.studyLevels : [];
  const englishTestsList: string[] = Array.isArray(facts.englishTests) ? facts.englishTests : [];
  const tuitionRange = facts.tuitionRange || {};
  const duration = facts.duration || {};

  // ──────────────────────────────
  // RENDER
  // ──────────────────────────────
  return (
    <div className="bg-white">
      {/* 1. Breadcrumb */}
      <div className="border-b border-[var(--alo-brand)]/10 bg-[var(--alo-page)]">
        <div className="mx-auto max-w-[1280px] px-4 py-3 lg:px-6">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Destinations", onClick: () => onNavigate("public-destinations") },
              { label: `Study in ${country.shortName}` },
            ]}
          />
        </div>
      </div>

      {/* 2. Hero */}
      <section className="bg-alo-hero">
        <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6 lg:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <span className="text-6xl md:text-7xl">{country.flag}</span>
                <div>
                  <Badge variant="outline" className="mb-2 border-[var(--alo-brand)]/30 bg-white/70 text-[var(--alo-brand)]">
                    <Icon name="Globe" className="mr-1.5 size-3.5" />
                    Study destination
                  </Badge>
                  <h1 className="text-3xl font-black text-[var(--alo-brand)] md:text-5xl">
                    Study in {country.name} from Bangladesh
                  </h1>
                  <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
                    {country.intro}
                  </p>
                </div>
              </div>

              {/* Hero CTA buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => onNavigate("public-course-finder")}
                  className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 h-12"
                >
                  <Icon name="Search" className="mr-2 size-4" />
                  Find Courses
                </Button>
                <Button
                  onClick={() => scrollToId("eligibility")}
                  variant="outline"
                  className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-12"
                >
                  <Icon name="ClipboardCheck" className="mr-2 size-4" />
                  Check Eligibility
                </Button>
                <Button
                  onClick={() => scrollToId("lead-form")}
                  variant="outline"
                  className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-12"
                >
                  <Icon name="CalendarCheck" className="mr-2 size-4" />
                  Book Free Consultation
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 h-12"
                >
                  <Icon name="Whatsapp" className="mr-2 size-4" />
                  WhatsApp Counselor
                </Button>
              </div>

              {/* Quick badges */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { icon: "Flame", label: "Popular destination" },
                  { icon: "CalendarDays", label: `${intakesList.length || "Multiple"} intakes` },
                  { icon: "Award", label: scholarships.length ? "Scholarships available" : "Scholarships" },
                  { icon: "Bot", label: "AI course matcher" },
                ].map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--alo-brand)]/20 bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--alo-brand)]">
                    <Icon name={b.icon} className="size-3.5" />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick facts mini-card */}
            <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-white alo-shadow">
              <CardContent className="p-5">
                <p className="text-sm font-bold text-[var(--alo-brand)]">At a glance</p>
                <div className="mt-3">
                  <InfoRow label="Capital" value={country.capital} />
                  <InfoRow label="Currency" value={country.currency} />
                  <InfoRow label="Intakes" value={intakesList.join(", ") || "—"} />
                  <InfoRow label="Visa type" value={facts.visaType || "—"} />
                  <InfoRow label="English tests" value={`${englishTestsList.length} accepted`} />
                  <InfoRow
                    label="Last verified"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Icon name="ShieldCheck" className="size-3 text-emerald-600" />
                        {fmtDate(country.lastVerifiedAt)}
                      </span>
                    }
                  />
                </div>
                <Button
                  onClick={() => onNavigate("public-course-finder")}
                  className="mt-4 w-full bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                >
                  <Icon name="Search" className="mr-2 size-4" />
                  Find Courses in {country.shortName}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
        <div className="space-y-12">

          {/* 3. Country Quick Facts */}
          <section>
            <SectionCard
              title="Country Quick Facts"
              description="Verified at-a-glance overview of studying in this destination."
              icon="Info"
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <FactTile icon="Globe" label="Country" value={country.name} />
                <FactTile icon="MapPin" label="Capital" value={country.capital} />
                <FactTile icon="Coins" label="Currency" value={country.currency} />
                <FactTile icon="Building" label="Popular cities" value={citiesList.slice(0, 4).join(", ") || "—"} />
                <FactTile icon="CalendarDays" label="Popular intakes" value={intakesList.join(", ") || "—"} />
                <FactTile icon="GraduationCap" label="Study levels" value={`${studyLevelsList.length} options`} />
                <FactTile icon="Clock" label="UG duration" value={duration.bachelor || "—"} />
                <FactTile icon="Clock" label="PG duration" value={duration.masters || "—"} />
                <FactTile icon="Coins" label="UG tuition" value={typeof tuitionRange === "string" ? tuitionRange : (tuitionRange.ug || "—")} />
                <FactTile icon="Coins" label="PG tuition" value={typeof tuitionRange === "string" ? "—" : (tuitionRange.pg || "—")} />
                <FactTile icon="Wallet" label="Living cost" value={facts.livingCost || "—"} />
                <FactTile icon="Briefcase" label="Work rights" value={facts.workRights || "—"} />
                <FactTile icon="Plane" label="Post-study route" value={facts.postStudyRoute || "—"} />
                <FactTile icon="Languages" label="English tests" value={`${englishTestsList.length} accepted`} />
                <FactTile icon="FileText" label="Visa type" value={facts.visaType || "—"} />
                <FactTile
                  icon="ShieldCheck"
                  label="Last verified"
                  value={fmtDate(country.lastVerifiedAt)}
                  accent="emerald"
                />
              </div>
            </SectionCard>
          </section>

          {/* 4. Why Study */}
          {whyStudy.length > 0 && (
            <section>
              <SectionCard
                title={`Why Study in ${country.shortName}?`}
                description="What makes this destination a strong choice for Bangladeshi students."
                icon="Sparkles"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {whyStudy.map((w, i) => (
                    <div key={i} className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                        <Icon name={w.icon || "Check"} className="size-5" />
                      </div>
                      <p className="mt-3 font-bold text-[var(--alo-brand)]">{w.heading}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.explanation}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </section>
          )}

          {/* 5. Education Pathway */}
          <section>
            <SectionCard
              title="Education Pathway"
              description="How your Bangladeshi qualifications map to this destination's levels."
              icon="GitBranch"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pathway.ssc && <PathwayTile from="SSC / O Level" to={pathway.ssc} />}
                {pathway.hsc && <PathwayTile from="HSC / A Level" to={pathway.hsc} />}
                {pathway.diploma && <PathwayTile from="Diploma / HND" to={pathway.diploma} />}
                {pathway.bachelor && <PathwayTile from="Bachelor" to={pathway.bachelor} />}
                {pathway.masters && <PathwayTile from="Masters" to={pathway.masters} />}
              </div>
              {pathway.note && (
                <div className="mt-4">
                  <Disclaimer text={pathway.note} />
                </div>
              )}
            </SectionCard>
          </section>

          {/* 6. Popular Courses */}
          {popularCourses.length > 0 && (
            <section>
              <SectionCard
                title="Popular Courses"
                description="Subjects Bangladeshi students frequently choose in this destination."
                icon="BookOpen"
                action={
                  <Button onClick={() => onNavigate("public-courses")} variant="outline" size="sm" className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                    All Courses <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {popularCourses.map((c, i) => (
                    <div key={i} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                      <p className="font-bold text-[var(--alo-brand)]">{c.name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--alo-cta)]">{c.level}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Career:</span> {c.career}
                      </p>
                      <button
                        onClick={() => onNavigate("public-courses")}
                        className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-[var(--alo-cta)] hover:gap-2 transition-all"
                      >
                        View Courses <Icon name="ArrowRight" className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </section>
          )}

          {/* 7. Popular Universities */}
          <section>
            <SectionCard
              title="Popular Universities"
              description="Verified ALO partner universities in this destination."
              icon="Building2"
              action={
                <Button onClick={() => onNavigate("public-universities")} variant="outline" size="sm" className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                  All Universities <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                </Button>
              }
            >
              {country.universities.length === 0 ? (
                <EmptyState
                  icon="Building2"
                  title="Universities coming soon"
                  description="We're adding verified university pages for this destination."
                  action={
                    <Button onClick={() => onNavigate("public-course-finder")} className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90">
                      <Icon name="Search" className="mr-2 size-4" />
                      Use Course Finder
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {country.universities.map((u) => {
                    const uFacts = safeParse<any>(u.quickFacts, {});
                    const uTuition = uFacts.tuitionRange;
                    const uTuitionLine = uTuition
                      ? (typeof uTuition === "string" ? uTuition : (uTuition.ug || uTuition.pg || "Varies"))
                      : "Varies";
                    const uIntakes: string[] = Array.isArray(uFacts.intakes) ? uFacts.intakes : [];
                    return (
                      <div key={u.slug} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold leading-tight text-[var(--alo-brand)]">{u.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              <Icon name="MapPin" className="mr-1 inline size-3" />
                              {u.city}
                            </p>
                          </div>
                          {uFacts.scholarship && (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] text-amber-700">
                              <Icon name="Award" className="mr-1 size-3" />
                              Scholarship
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs">
                          <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">Tuition:</span> {uTuitionLine}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">Intakes:</span> {uIntakes.join(", ") || "—"}
                          </p>
                        </div>
                        <div className="mt-auto flex flex-col gap-2 pt-4">
                          <Button
                            onClick={() => onNavigate("public-university", u.slug)}
                            variant="outline"
                            size="sm"
                            className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                          >
                            <Icon name="BookOpen" className="mr-1.5 size-3.5" />
                            View Courses
                          </Button>
                          <Button
                            onClick={() => toast({ title: "Application started", description: `ALO counselor will reach out about ${u.name}.` })}
                            size="sm"
                            className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                          >
                            <Icon name="Send" className="mr-1.5 size-3.5" />
                            Apply through ALO
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </section>

          {/* 8. Tuition Fees and Budget */}
          <section>
            <SectionCard
              title="Tuition Fees and Budget"
              description="Plan your first-year cost with our budget calculator."
              icon="Calculator"
            >
              <BudgetCalculator
                tuitionRange={tuitionRange}
                livingCost={facts.livingCost as string}
                currency={country.currency}
              />
            </SectionCard>
          </section>

          {/* 9. Entry Requirements */}
          <section id="eligibility">
            <SectionCard
              title="Entry Requirements"
              description="General requirements by study level — university-specific rules may vary."
              icon="ClipboardCheck"
            >
              {Object.keys(entryRequirements).length > 0 ? (
                <Tabs defaultValue={ENTRY_LEVELS.find((l) => entryRequirements[l]) || "bachelor"} className="w-full">
                  <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-[var(--alo-brand-light)]/60">
                    {ENTRY_LEVELS.filter((l) => entryRequirements[l]).map((l) => (
                      <TabsTrigger key={l} value={l} className="data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)]">
                        {ENTRY_LABELS[l]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {ENTRY_LEVELS.filter((l) => entryRequirements[l]).map((l) => {
                    const req = entryRequirements[l];
                    return (
                      <TabsContent key={l} value={l} className="mt-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-cta)]">Academic</p>
                            <p className="mt-1.5 text-sm text-foreground">{req.academic || "—"}</p>
                          </div>
                          <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-cta)]">English</p>
                            <p className="mt-1.5 text-sm text-foreground">{req.english || "—"}</p>
                          </div>
                          <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-cta)]">Documents</p>
                            <p className="mt-1.5 text-sm text-foreground">{req.documents || "—"}</p>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <p className="text-sm text-muted-foreground">Entry requirement details coming soon.</p>
              )}

              {/* AI Eligibility Checker */}
              <div className="mt-6 rounded-2xl border-2 border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)]/40 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--alo-cta)] text-white">
                    <Icon name="Bot" className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--alo-brand)]">AI Eligibility Checker</p>
                    <p className="text-xs text-muted-foreground">Tell us about your profile — get an instant AI assessment.</p>
                  </div>
                </div>
                <EligibilityChecker countryName={country.shortName} />
              </div>
            </SectionCard>
          </section>

          {/* 10. English Test Requirements */}
          <section>
            <SectionCard
              title="English Test Requirements"
              description="Accepted English tests for university admission in this destination."
              icon="Languages"
            >
              {englishTestsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {englishTestsList.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)] px-3 py-1.5 text-sm font-semibold text-[var(--alo-brand)]">
                      <Icon name="Check" className="size-3.5" />
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">English test data coming soon.</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  onClick={() => { onNavigate("public-exams"); toast({ title: "Opening English placement", description: "Quick free test to find your level." }); }}
                  variant="outline"
                  size="sm"
                  className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                >
                  <Icon name="GraduationCap" className="mr-1.5 size-3.5" />
                  Take Free English Placement Test
                </Button>
                <Button onClick={() => onNavigate("public-exam", "ielts")} size="sm" className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90">
                  <Icon name="Play" className="mr-1.5 size-3.5" />
                  Start IELTS Mock
                </Button>
                <Button onClick={() => onNavigate("public-exam", "pte")} size="sm" className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90">
                  <Icon name="Play" className="mr-1.5 size-3.5" />
                  Start PTE Mock
                </Button>
                <Button
                  onClick={() => onNavigate("ai-interview")}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                >
                  <Icon name="Mic" className="mr-1.5 size-3.5" />
                  Practice AI Speaking
                </Button>
              </div>
            </SectionCard>
          </section>

          {/* 11. Required Documents */}
          <section id="documents">
            <SectionCard
              title="Required Documents"
              description="General document checklist — your counselor will personalise this for you."
              icon="FolderCheck"
            >
              {documents.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-[var(--alo-brand)]/10">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--alo-brand-light)]/60 text-[var(--alo-brand)]">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Document</th>
                        <th className="hidden px-3 py-2 text-left text-xs font-bold uppercase tracking-wide md:table-cell">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Required</th>
                        <th className="hidden px-3 py-2 text-left text-xs font-bold uppercase tracking-wide lg:table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--alo-brand)]/10">
                      {documents.map((d, i) => (
                        <tr key={i} className="hover:bg-[var(--alo-page)]">
                          <td className="px-3 py-2.5 font-medium text-foreground">{d.name}</td>
                          <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">{d.category}</td>
                          <td className="px-3 py-2.5">
                            {d.required ? (
                              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Required</Badge>
                            ) : (
                              <Badge variant="outline" className="border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-body)]">Optional</Badge>
                            )}
                          </td>
                          <td className="hidden px-3 py-2.5 text-muted-foreground lg:table-cell">{d.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Document checklist coming soon.</p>
              )}
              <div className="mt-4">
                <Disclaimer text="After login, you can upload these in the Student Portal Document Hub. Your documents are private, RBAC-protected, and audit-logged." />
              </div>
            </SectionCard>
          </section>

          {/* 12. Visa Process */}
          <section id="visa">
            <SectionCard
              title="Visa Process"
              description="Step-by-step visa journey — from course selection to pre-departure."
              icon="Plane"
            >
              {visaProcess.length > 0 ? (
                <ol className="relative space-y-4 border-l-2 border-[var(--alo-brand)]/15 pl-6">
                  {visaProcess.map((s, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[31px] flex size-7 items-center justify-center rounded-full bg-alo-gradient text-xs font-bold text-white alo-shadow">
                        {s.step || i + 1}
                      </span>
                      <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
                        <p className="font-bold text-[var(--alo-brand)]">{s.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Visa process steps coming soon.</p>
              )}

              {/* AI Visa Readiness Checker */}
              <div className="mt-6 rounded-2xl border-2 border-[var(--alo-brand)]/25 bg-[var(--alo-brand-light)]/40 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--alo-brand)] text-white">
                    <Icon name="ShieldCheck" className="size-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--alo-brand)]">AI Visa Readiness Checker</p>
                    <p className="text-xs text-muted-foreground">Answer a few questions — AI estimates your visa readiness.</p>
                  </div>
                </div>
                <VisaReadinessChecker countryName={country.shortName} />
              </div>
            </SectionCard>
          </section>

          {/* 13. AI Interview Practice */}
          <section id="interview">
            <SectionCard
              title="AI Interview Practice"
              description="Practice the interviews you'll face — credibility, pre-CAS, and visa."
              icon="Mic"
            >
              {interviewTypes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {interviewTypes.map((t, i) => (
                    <div key={i} className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                        <Icon name="Mic" className="size-5" />
                      </div>
                      <p className="mt-3 font-bold text-[var(--alo-brand)]">{t.type}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Interview types coming soon.</p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => onNavigate("ai-interview")}
                  className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                >
                  <Icon name="Mic" className="mr-2 size-4" />
                  Start AI Interview Practice
                </Button>
              </div>

              <div className="mt-5 rounded-xl border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">Questions our AI interviewer asks</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {INTERVIEW_QUESTIONS.map((q) => (
                    <span key={q} className="inline-flex items-center gap-1 rounded-full border border-[var(--alo-brand)]/15 bg-white px-2.5 py-1 text-xs text-foreground">
                      <Icon name="HelpCircle" className="size-3 text-[var(--alo-cta)]" />
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </SectionCard>
          </section>

          {/* 14. Work Rights and Post-Study Options */}
          <section>
            <SectionCard
              title="Work Rights and Post-Study Options"
              description="Verified summary — always confirm with your counselor before applying."
              icon="Briefcase"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-cta)]">Term-time work</p>
                  <p className="mt-1.5 text-sm text-foreground">{workRights.termTimeWork || "—"}</p>
                </div>
                <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-cta)]">Vacation work</p>
                  <p className="mt-1.5 text-sm text-foreground">{workRights.vacationWork || "—"}</p>
                </div>
                <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-cta)]">Post-study route</p>
                  <p className="mt-1.5 text-sm text-foreground">{workRights.postStudyRoute || "—"}</p>
                </div>
              </div>
              <div className="mt-4">
                <Disclaimer text="Rules may change. Final visa/work conditions depend on official visa conditions and government rules." />
              </div>
              {workRights.sourceUrl && (
                <a href={workRights.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--alo-brand)] hover:underline">
                  <Icon name="ExternalLink" className="size-3.5" />
                  Official work-rights source
                </a>
              )}
            </SectionCard>
          </section>

          {/* 15. Scholarship Section */}
          <section id="scholarships">
            <SectionCard
              title="Scholarships"
              description="Merit, country-specific, and early-bird awards you may qualify for."
              icon="Award"
            >
              {scholarships.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {scholarships.map((s, i) => (
                    <div key={i} className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[var(--alo-brand)]">{s.name}</p>
                        <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">{s.amount}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Eligibility:</span> {s.eligibility}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Deadline:</span> {s.deadline}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Scholarship data coming soon.</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  onClick={() => onNavigate("public-course-finder")}
                  variant="outline"
                  size="sm"
                  className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                >
                  <Icon name="Search" className="mr-1.5 size-3.5" />
                  Find Scholarships
                </Button>
                <Button
                  onClick={() => scrollToId("lead-form")}
                  size="sm"
                  className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                >
                  <Icon name="ClipboardCheck" className="mr-1.5 size-3.5" />
                  Check Scholarship Eligibility
                </Button>
              </div>
            </SectionCard>
          </section>

          {/* 16. City and Lifestyle Section */}
          <section>
            <SectionCard
              title="Cities and Lifestyle"
              description="Choose the city that fits your budget, vibe, and career goals."
              icon="MapPin"
            >
              {cities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {cities.map((city, i) => (
                    <div key={i} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[var(--alo-brand)]">{city.name}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px]",
                            city.costLevel === "High" && "border-rose-200 bg-rose-50 text-rose-700",
                            city.costLevel === "Medium" && "border-amber-200 bg-amber-50 text-amber-700",
                            (city.costLevel === "Low" || city.costLevel === "Low-Medium") && "border-emerald-200 bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {city.costLevel} cost
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{city.vibe}</p>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <p><span className="font-semibold text-foreground">Universities:</span> {city.universities}</p>
                        <p><span className="font-semibold text-foreground">Transport:</span> {city.transport}</p>
                        <p><span className="font-semibold text-foreground">Jobs:</span> {city.jobs}</p>
                        <p><span className="font-semibold text-foreground">Living:</span> {city.livingCost}</p>
                      </div>
                      <button
                        onClick={() => toast({ title: `Courses in ${city.name}`, description: "Use Course Finder to filter by city." })}
                        className="mt-4 inline-flex items-center gap-1 self-start text-sm font-semibold text-[var(--alo-cta)] hover:gap-2 transition-all"
                      >
                        Find courses in this city <Icon name="ArrowRight" className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">City data coming soon.</p>
              )}
            </SectionCard>
          </section>

          {/* 17. ALO Education Support */}
          <section>
            <SectionCard
              title="ALO Education Support"
              description="What you get when you start your journey with us."
              icon="LifeBuoy"
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {ALO_SUPPORT_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border-2 border-[var(--alo-brand)]/15 p-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                      <Icon name={s.icon} className="size-4" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => scrollToId("lead-form")} className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90">
                  <Icon name="Send" className="mr-2 size-4" />
                  Start Your Application
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50">
                  <Icon name="Whatsapp" className="mr-2 size-4" />
                  Talk to Counselor
                </Button>
                <Button onClick={() => onNavigate("student-dashboard")} variant="outline" className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                  <Icon name="FolderLock" className="mr-2 size-4" />
                  Upload Documents
                </Button>
              </div>
            </SectionCard>
          </section>

          {/* 18. FAQ Section */}
          <section>
            <SectionCard
              title="Frequently Asked Questions"
              description="Real questions Bangladeshi students ask about studying here."
              icon="HelpCircle"
            >
              {faqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-b border-[var(--alo-brand)]/10">
                      <AccordionTrigger className="text-left text-sm font-semibold text-[var(--alo-brand)] hover:no-underline">
                        {f.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">FAQs coming soon.</p>
              )}
            </SectionCard>
          </section>
        </div>
      </div>

      {/* 19. Final CTA + Lead Form */}
      <section id="lead-form" className="bg-alo-hero">
        <div className="mx-auto max-w-[1280px] px-4 py-14 lg:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--alo-cta)]">Ready when you are</p>
              <h2 className="mt-1 text-3xl font-black text-[var(--alo-brand)] md:text-4xl">
                Ready to start your {country.shortName} study journey?
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Book a free consultation with a senior ALO counselor. We'll review your background, recommend universities, and walk you through every step — from documents to visa.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => scrollToId("eligibility")} variant="outline" className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                  <Icon name="ClipboardCheck" className="mr-2 size-4" />
                  Check Eligibility
                </Button>
                <Button onClick={() => onNavigate("public-course-finder")} variant="outline" className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                  <Icon name="Search" className="mr-2 size-4" />
                  Find Courses
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" className="border-emerald-500 text-emerald-700 hover:bg-emerald-50">
                  <Icon name="Whatsapp" className="mr-2 size-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
            <div>
              <PublicLeadForm
                sourceTag={`${country.shortName} country page`}
                preferredCountry={country.name}
                title={`Book your ${country.shortName} consultation`}
                subtitle="Fill this and a counselor will call you within 24 hours."
              />
            </div>
          </div>
        </div>
      </section>

      {/* 20. Source Verification */}
      <section className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
        <SourceVerification
          sourceUrl={country.sourceUrl}
          lastVerifiedAt={country.lastVerifiedAt}
          verificationStatus={country.verificationStatus}
        />
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function FactTile({
  icon,
  label,
  value,
  accent = "blue",
}: {
  icon: string;
  label: string;
  value?: React.ReactNode;
  accent?: "blue" | "emerald";
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            accent === "blue" && "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
            accent === "emerald" && "bg-emerald-50 text-emerald-600",
          )}
        >
          <Icon name={icon} className="size-4" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value || "—"}</p>
    </div>
  );
}

function PathwayTile({ from, to }: { from: string; to: string }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-[var(--alo-brand)]/30 bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">{from}</Badge>
        <Icon name="ArrowRight" className="size-4 text-[var(--alo-cta)]" />
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{to}</p>
    </div>
  );
}

// ── Budget Calculator ──
function BudgetCalculator({
  tuitionRange,
  livingCost,
  currency,
}: {
  tuitionRange: any;
  livingCost?: string;
  currency: string;
}) {
  const [level, setLevel] = React.useState("bachelor");
  const [city, setCity] = React.useState("Medium");
  const [tuitionInput, setTuitionInput] = React.useState<number>(0);
  const [scholarship, setScholarship] = React.useState<number>(0);
  const [months, setMonths] = React.useState<number>(9);
  const [exchangeRate, setExchangeRate] = React.useState<number>(120);

  // Try to suggest a tuition value from the range
  React.useEffect(() => {
    const key = level === "bachelor" ? "ug" : level === "masters" ? "pg" : level === "mba" ? "mba" : "pg";
    const rangeStr = typeof tuitionRange === "string" ? tuitionRange : (tuitionRange?.[key] || "");
    // Extract first number from a range string like "£12,000–£20,000 / year"
    const match = String(rangeStr).replace(/,/g, "").match(/(\d{3,6})/);
    if (match) {
      setTuitionInput(parseInt(match[1], 10));
    }
  }, [level, tuitionRange]);

  // Living cost per month based on city cost level
  const cityMultiplier: Record<string, number> = { Low: 0.8, "Low-Medium": 0.9, Medium: 1.0, High: 1.4 };
  const baseLiving = 1000; // fallback
  const livingPerMonth = baseLiving * (cityMultiplier[city] || 1);

  const totalTuition = Math.max(0, tuitionInput - scholarship);
  const totalLiving = livingPerMonth * Math.max(0, months);
  const totalForeign = totalTuition + totalLiving;
  const totalBDT = Math.round(totalForeign * exchangeRate);

  const lowBudget = totalBDT < 1500000; // 15 lakh BDT threshold

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">Tuition ranges (per year)</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-[var(--alo-brand)]/15 p-3">
            <p className="text-xs text-muted-foreground">Undergraduate</p>
            <p className="font-semibold text-foreground">{typeof tuitionRange === "string" ? tuitionRange : (tuitionRange?.ug || "—")}</p>
          </div>
          <div className="rounded-lg border border-[var(--alo-brand)]/15 p-3">
            <p className="text-xs text-muted-foreground">Postgraduate</p>
            <p className="font-semibold text-foreground">{typeof tuitionRange === "string" ? "—" : (tuitionRange?.pg || "—")}</p>
          </div>
          <div className="rounded-lg border border-[var(--alo-brand)]/15 p-3">
            <p className="text-xs text-muted-foreground">MBA</p>
            <p className="font-semibold text-foreground">{typeof tuitionRange === "string" ? "—" : (tuitionRange?.mba || "—")}</p>
          </div>
          <div className="rounded-lg border border-[var(--alo-brand)]/15 p-3">
            <p className="text-xs text-muted-foreground">Deposit</p>
            <p className="font-semibold text-foreground">{typeof tuitionRange === "string" ? "—" : (tuitionRange?.deposit || "—")}</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-[var(--alo-brand)]/15 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Living cost (typical)</p>
          <p className="font-semibold text-foreground">{livingCost || `~${currency} 1,000 / month`}</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">First-year budget calculator</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold">Study level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["foundation", "bachelor", "topup", "masters", "mba", "phd"].map((l) => (
                  <SelectItem key={l} value={l}>{ENTRY_LABELS[l]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">City cost level</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Low", "Low-Medium", "Medium", "High"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Tuition (foreign / yr)</Label>
            <Input type="number" value={tuitionInput} onChange={(e) => setTuitionInput(Number(e.target.value) || 0)} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Scholarship</Label>
            <Input type="number" value={scholarship} onChange={(e) => setScholarship(Number(e.target.value) || 0)} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Living months</Label>
            <Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value) || 0)} className="mt-1 h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold">FX rate (BDT per unit)</Label>
            <Input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value) || 0)} className="mt-1 h-9" />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[var(--alo-brand-light)] p-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Tuition (net)</p>
              <p className="font-bold text-foreground">{currency} {totalTuition.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Living ({months} mo)</p>
              <p className="font-bold text-foreground">{currency} {totalLiving.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-[var(--alo-brand)]/15 pt-3">
            <p className="text-xs text-muted-foreground">Estimated first-year cost (BDT)</p>
            <p className="text-2xl font-black text-[var(--alo-cta)]">৳ {totalBDT.toLocaleString()}</p>
          </div>
        </div>

        {lowBudget && (
          <div className="mt-3">
            <Disclaimer text="This budget looks tight for a visa application. Most embassies expect to see funds covering full tuition plus living. Talk to an ALO counselor about scholarship options, installment plans, or alternative destinations." />
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Estimates only. Confirm exact fees with your counselor and university before applying.
        </p>
      </div>
    </div>
  );
}

// ── AI Eligibility Checker ──
function EligibilityChecker({ countryName }: { countryName: string }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    academicLevel: "HSC / A Level",
    academicGrade: "",
    englishTest: "IELTS",
    englishScore: "",
    studyGap: "",
    budget: "",
    preferredSubject: "",
    preferredLevel: "Masters",
    preferredIntake: "September",
  });
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<EligibilityResult | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, preferredCountry: countryName }),
      });
      const data = await res.json();
      setResult(data as EligibilityResult);
    } catch {
      toast({ title: "Eligibility check failed", description: "Please try again or contact a counselor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label className="text-xs font-semibold">Academic level</Label>
          <Input value={form.academicLevel} onChange={(e) => setForm({ ...form, academicLevel: e.target.value })} className="mt-1 h-9" placeholder="e.g. HSC, Bachelor" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Grade / CGPA</Label>
          <Input value={form.academicGrade} onChange={(e) => setForm({ ...form, academicGrade: e.target.value })} className="mt-1 h-9" placeholder="e.g. GPA 4.5 / CGPA 3.2" />
        </div>
        <div>
          <Label className="text-xs font-semibold">English test</Label>
          <Select value={form.englishTest} onValueChange={(v) => setForm({ ...form, englishTest: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENGLISH_TESTS_LIST.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">English score</Label>
          <Input value={form.englishScore} onChange={(e) => setForm({ ...form, englishScore: e.target.value })} className="mt-1 h-9" placeholder="e.g. IELTS 6.5" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Study gap</Label>
          <Input value={form.studyGap} onChange={(e) => setForm({ ...form, studyGap: e.target.value })} className="mt-1 h-9" placeholder="e.g. 2 years (work)" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Budget (BDT / year)</Label>
          <Input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="mt-1 h-9" placeholder="e.g. 25 lakh" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Preferred subject</Label>
          <Input value={form.preferredSubject} onChange={(e) => setForm({ ...form, preferredSubject: e.target.value })} className="mt-1 h-9" placeholder="e.g. Computer Science" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Preferred level</Label>
          <Select value={form.preferredLevel} onValueChange={(v) => setForm({ ...form, preferredLevel: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STUDY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Preferred intake</Label>
          <Select value={form.preferredIntake} onValueChange={(v) => setForm({ ...form, preferredIntake: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["January", "May", "September", "October"].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={run} disabled={loading} className="mt-4 bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90">
        {loading ? (
          <><Icon name="Loader2" className="mr-2 size-4 animate-spin" /> AI assessing...</>
        ) : (
          <><Icon name="Sparkles" className="mr-2 size-4" /> Check My Eligibility</>
        )}
      </Button>

      {result && <EligibilityResultCard result={result} />}
    </div>
  );
}

function EligibilityResultCard({ result }: { result: EligibilityResult }) {
  const status = result.status || "NEEDS_COUNSELOR_REVIEW";
  return (
    <div className="mt-5 rounded-2xl border-2 border-[var(--alo-brand)]/15 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", STATUS_COLORS[status] || STATUS_COLORS.NEEDS_COUNSELOR_REVIEW)}>
          <Icon name="ShieldCheck" className="size-3.5" />
          {status.replace(/_/g, " ")}
        </span>
      </div>
      {result.summary && (
        <p className="mt-3 text-sm text-foreground">{result.summary}</p>
      )}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.isArray(result.strengths) && result.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Strengths</p>
            <ul className="mt-2 space-y-1.5">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                  <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(result.concerns) && result.concerns.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Concerns</p>
            <ul className="mt-2 space-y-1.5">
              {result.concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                  <Icon name="AlertTriangle" className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.isArray(result.recommendedDocuments) && result.recommendedDocuments.length > 0 && (
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">Recommended documents</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {result.recommendedDocuments.map((d, i) => <li key={i} className="flex gap-2"><Icon name="FileText" className="size-3.5 text-[var(--alo-brand)]" /> {d}</li>)}
            </ul>
          </div>
        )}
        {Array.isArray(result.recommendedNextSteps) && result.recommendedNextSteps.length > 0 && (
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/15 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">Next steps</p>
            <ol className="mt-2 space-y-1 text-sm text-foreground">
              {result.recommendedNextSteps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-bold text-[var(--alo-cta)]">{i + 1}.</span> {s}</li>)}
            </ol>
          </div>
        )}
      </div>
      {result.englishTestAdvice && (
        <div className="mt-3 rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/50 p-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--alo-brand)]">English test advice</p>
          <p className="mt-1 text-foreground">{result.englishTestAdvice}</p>
        </div>
      )}
      {result.visaRiskNote && (
        <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Visa risk note</p>
          <p className="mt-1">{result.visaRiskNote}</p>
        </div>
      )}
    </div>
  );
}

// ── Visa Readiness Checker ──
function VisaReadinessChecker({ countryName }: { countryName: string }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    casStatus: "Not started",
    bankStatement: "Not ready",
    sponsorRelation: "Parents",
    studyGap: "",
    englishTest: "IELTS",
    refusalHistory: "No",
  });
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<EligibilityResult | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const contextText = `Visa readiness check for ${countryName}. CAS status: ${form.casStatus}. Bank statement: ${form.bankStatement}. Sponsor: ${form.sponsorRelation}. Study gap: ${form.studyGap || "none"}. English test: ${form.englishTest}. Previous visa refusal: ${form.refusalHistory}.`;
      const res = await fetch("/api/ai/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicLevel: "Visa readiness",
          academicGrade: contextText,
          englishTest: form.englishTest,
          englishScore: "",
          studyGap: form.studyGap,
          budget: form.bankStatement,
          preferredSubject: form.sponsorRelation,
          preferredLevel: "Visa",
          preferredIntake: form.casStatus,
          preferredCountry: countryName,
        }),
      });
      const data = await res.json();
      setResult(data as EligibilityResult);
    } catch {
      toast({ title: "Visa check failed", description: "Please try again or contact a counselor.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label className="text-xs font-semibold">CAS / offer status</Label>
          <Select value={form.casStatus} onValueChange={(v) => setForm({ ...form, casStatus: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Not started", "Applied", "Conditional offer", "Unconditional offer", "CAS issued"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Bank statement</Label>
          <Select value={form.bankStatement} onValueChange={(v) => setForm({ ...form, bankStatement: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Not ready", "In progress", "Ready (28 days)", "Ready (>28 days)"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Sponsor relation</Label>
          <Select value={form.sponsorRelation} onValueChange={(v) => setForm({ ...form, sponsorRelation: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Parents", "Sibling", "Self", "Other relative", "Employer"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Study gap (years)</Label>
          <Input value={form.studyGap} onChange={(e) => setForm({ ...form, studyGap: e.target.value })} className="mt-1 h-9" placeholder="e.g. 2" />
        </div>
        <div>
          <Label className="text-xs font-semibold">English test</Label>
          <Select value={form.englishTest} onValueChange={(v) => setForm({ ...form, englishTest: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENGLISH_TESTS_LIST.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Previous visa refusal?</Label>
          <Select value={form.refusalHistory} onValueChange={(v) => setForm({ ...form, refusalHistory: v })}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["No", "Yes — for same country", "Yes — for another country"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={run} disabled={loading} className="mt-4 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90">
        {loading ? (
          <><Icon name="Loader2" className="mr-2 size-4 animate-spin" /> AI assessing...</>
        ) : (
          <><Icon name="ShieldCheck" className="mr-2 size-4" /> Check Visa Readiness</>
        )}
      </Button>

      {result && <EligibilityResultCard result={result} />}
    </div>
  );
}
export default PublicCountry;
