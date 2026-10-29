"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Icon, SectionCard, EmptyState, LoadingGrid, InfoRow } from "@/components/alo/shared";
import { Breadcrumb, SourceVerification, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicUniversityProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface Country {
  name: string;
  shortName: string;
  flag: string;
  slug: string;
}

interface CourseSummary {
  slug: string;
  name: string;
  level: string;
  subject: string;
  duration: string;
  intake: string;
  tuition: string;
  scholarship?: string | null;
  englishRequirement: string;
  academicRequirement?: string;
  deadline?: string | null;
}

interface UniversityDetail {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  overview: string;
  strengths: string;
  quickFacts: string;
  entryRequirements: string;
  tuition: string;
  applicationSteps: string;
  documents: string;
  faqs: string;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  verificationStatus?: string;
  country: Country;
  courses: CourseSummary[];
}

interface EligibilityResult {
  status: string;
  summary: string;
  strengths?: string[];
  concerns?: string[];
  recommendedDocuments?: string[];
  recommendedNextSteps?: string[];
  recommendedCourses?: string[];
  englishTestAdvice?: string;
  visaRiskNote?: string;
}

function safeParse<T>(value: unknown, fallback: T): T {
  try {
    if (typeof value !== "string") return fallback;
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

const STATUS_TONE: Record<string, string> = {
  ELIGIBLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  POSSIBLY_ELIGIBLE: "bg-sky-50 text-sky-700 border-sky-200",
  NEEDS_COUNSELOR_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  NOT_READY_YET: "bg-rose-50 text-rose-700 border-rose-200",
};

const LEVEL_LABELS: Record<string, string> = {
  foundation: "Foundation",
  bachelor: "Bachelor",
  topup: "Top-up",
  masters: "Masters",
  mba: "MBA",
  phd: "PhD",
};

export function PublicUniversity({ slug, onNavigate }: PublicUniversityProps) {
  const effectiveSlug = slug || "university-of-manchester";
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [university, setUniversity] = React.useState<UniversityDetail | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  const [courseLevelFilter, setCourseLevelFilter] = React.useState("all");
  const [courseSubjectFilter, setCourseSubjectFilter] = React.useState("all");
  const [selectedCourseSlug, setSelectedCourseSlug] = React.useState<string>("");

  // Eligibility checker
  const [eligOpen, setEligOpen] = React.useState(false);
  const [eligLoading, setEligLoading] = React.useState(false);
  const [eligResult, setEligResult] = React.useState<EligibilityResult | null>(null);
  const [eligForm, setEligForm] = React.useState({
    academicLevel: "",
    academicGrade: "",
    englishScore: "",
    studyGap: "",
    budget: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setUniversity(null);
    (async () => {
      try {
        const res = await fetch(`/api/universities/${encodeURIComponent(effectiveSlug)}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.error || !data.university) {
          setNotFound(true);
        } else {
          setUniversity(data.university);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveSlug]);

  // Parsed fields
  const strengths = safeParse<string[]>(university?.strengths, []);
  const quickFacts = safeParse<{
    intakes?: string[];
    tuitionRange?: string;
    englishTests?: string[];
    scholarship?: string;
    applicationStatus?: string;
  }>(university?.quickFacts, {});
  const entryReqs = safeParse<Record<string, { academic?: string; english?: string; documents?: string }>>(university?.entryRequirements, {});
  const tuition = safeParse<{
    ug?: string;
    pg?: string;
    mba?: string;
    deposit?: string;
    scholarship?: string;
    paymentPlan?: string;
  }>(university?.tuition, {});
  const applicationSteps = safeParse<{ step: number; title: string; detail: string }[]>(university?.applicationSteps, []);
  const documents = safeParse<{ category: string; name: string; required: boolean; explanation: string }[]>(university?.documents, []);
  const faqs = safeParse<{ q: string; a: string }[]>(university?.faqs, []);

  const courseLevels = React.useMemo(() => {
    const set = new Set<string>();
    university?.courses?.forEach((c) => set.add(c.level));
    return Array.from(set);
  }, [university]);
  const courseSubjects = React.useMemo(() => {
    const set = new Set<string>();
    university?.courses?.forEach((c) => set.add(c.subject));
    return Array.from(set).sort();
  }, [university]);
  const filteredCourses = React.useMemo(() => {
    if (!university) return [];
    return university.courses.filter((c) => {
      if (courseLevelFilter !== "all" && c.level !== courseLevelFilter) return false;
      if (courseSubjectFilter !== "all" && c.subject !== courseSubjectFilter) return false;
      return true;
    });
  }, [university, courseLevelFilter, courseSubjectFilter]);

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runEligibility() {
    setEligLoading(true);
    setEligResult(null);
    try {
      const res = await fetch("/api/ai/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicLevel: eligForm.academicLevel,
          academicGrade: eligForm.academicGrade,
          englishScore: eligForm.englishScore,
          studyGap: eligForm.studyGap,
          budget: eligForm.budget,
          preferredSubject: courseSubjects[0] || "",
          preferredLevel: courseLevels[0] || "",
          preferredCountry: university?.country?.name || "",
        }),
      });
      const data = await res.json();
      setEligResult(data as EligibilityResult);
      toast({ title: "Eligibility check complete", description: "AI assessment is ready below." });
    } catch {
      toast({ title: "Eligibility check failed", description: "Please try again or talk to an ALO counselor.", variant: "destructive" });
    } finally {
      setEligLoading(false);
    }
  }

  // Hero quick cards
  const heroCards = university
    ? [
        { label: "Country", value: `${university.country.flag} ${university.country.name}`, icon: "Globe" },
        { label: "City", value: university.city, icon: "MapPin" },
        { label: "Popular intakes", value: quickFacts.intakes?.length ? quickFacts.intakes.join(", ") : "September", icon: "Calendar" },
        { label: "Tuition range", value: quickFacts.tuitionRange || tuition.ug || "Confirm with counselor", icon: "Wallet" },
        { label: "English tests", value: quickFacts.englishTests?.length ? quickFacts.englishTests.join(", ") : "IELTS / PTE / TOEFL", icon: "Languages" },
        { label: "Scholarship", value: quickFacts.scholarship || tuition.scholarship || "Ask counselor", icon: "Award" },
        { label: "Application status", value: quickFacts.applicationStatus || "Open", icon: "CircleCheck" },
        {
          label: "Verification",
          value: university.verificationStatus === "VERIFIED" ? "Verified" : university.verificationStatus === "NEEDS_REVIEW" ? "Needs review" : "Unverified",
          icon: "ShieldCheck",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6"><LoadingGrid count={4} /></div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
        <div className="mt-6"><LoadingGrid count={3} /></div>
      </div>
    );
  }

  if (notFound || !university) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
        <Breadcrumb
          items={[
            { label: "Home", onClick: () => onNavigate("public-home") },
            { label: "Universities", onClick: () => onNavigate("public-universities") },
            { label: "Not found" },
          ]}
        />
        <div className="mt-6">
          <EmptyState
            icon="Building2"
            title="University page not available"
            description="This university page may have been moved or is being updated. Browse all universities to find a partner near you."
            action={
              <div className="flex gap-2">
                <Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 " onClick={() => onNavigate("public-universities")}>
                  <Icon name="Building2" className="size-4" /> All universities
                </Button>
                <Button variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] " onClick={() => onNavigate("public-courses")}>
                  <Icon name="BookOpen" className="size-4" /> Browse courses
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", onClick: () => onNavigate("public-home") },
          { label: "Universities", onClick: () => onNavigate("public-universities") },
          { label: university.country.name, onClick: () => onNavigate("public-country", university.country.slug) },
          { label: university.name },
        ]}
      />

      {/* 2. Hero */}
      <section className="mt-5 overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-gradient-to-br from-[var(--alo-brand-light)]/60 via-white to-white">
        <div className="p-5 lg:p-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--alo-brand)] shadow-sm">
                  <span className="text-base leading-none">{university.country.flag}</span>
                  {university.country.name}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                  <Icon name="MapPin" className="size-3 text-[var(--alo-cta)]" />
                  {university.city}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Icon name="ShieldCheck" className="size-3" />
                  Verified {university.lastVerifiedAt ? fmtDate(university.lastVerifiedAt) : "recently"}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black text-[var(--alo-brand)] sm:text-3xl lg:text-4xl">{university.name}</h1>
              {university.sourceUrl && (
                <a
                  href={university.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--alo-brand)] hover:underline"
                >
                  <Icon name="ExternalLink" className="size-3.5" />
                  Official website
                </a>
              )}
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-3">{university.overview}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 h-12" onClick={() => scrollToId("apply")}>
              <Icon name="Send" className="size-4" /> Apply through ALO
            </Button>
            <Button
              variant="outline"
              className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-12"
              onClick={() => scrollToId("courses")}
            >
              <Icon name="BookOpen" className="size-4" /> View Courses
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-foreground hover:bg-[var(--alo-brand-light)]"
              onClick={() => toast({ title: "Saved to your shortlist", description: `${university.name} added to your saved universities. Sign in to your portal to view it.` })}
            >
              <Icon name="Bookmark" className="size-4" /> Save
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-foreground hover:bg-[var(--alo-brand-light)]"
              onClick={() => toast({ title: "Compare opened", description: "Compare view will open in a future release. For now, browse other universities to compare manually." })}
            >
              <Icon name="GitCompare" className="size-4" /> Compare
            </Button>
          </div>

          {/* Hero cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {heroCards.map((c, i) => (
              <div key={i} className="rounded-xl border border-[var(--alo-brand)]/10 bg-white p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon name={c.icon} className="size-3 text-[var(--alo-brand)]" />
                  <span className="line-clamp-1">{c.label}</span>
                </div>
                <p className="mt-1.5 text-xs font-bold text-foreground line-clamp-2">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. About */}
      <SectionCard title="About University" icon="Info" className="mt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{university.overview}</p>
        {strengths.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-[var(--alo-brand)]">University strengths</h4>
            <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl bg-[var(--alo-brand-light)]/50 p-3">
                  <Icon name="CheckCircle2" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="text-sm text-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* 4. Available Courses */}
      <SectionCard
        title="Available Courses"
        icon="BookOpen"
        description={`${university.courses.length} verified programmes at this university`}
        className="mt-6 scroll-mt-20"
        // forward id via wrapper below
      >
        <div id="courses" className="-mt-12 pt-12" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level</label>
            <Select value={courseLevelFilter} onValueChange={setCourseLevelFilter}>
              <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="All levels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {courseLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</label>
            <Select value={courseSubjectFilter} onValueChange={setCourseSubjectFilter}>
              <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="All subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {courseSubjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(courseLevelFilter !== "all" || courseSubjectFilter !== "all") && (
            <Button
 variant="outline"
 size="sm"
 className=" border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() => { setCourseLevelFilter("all"); setCourseSubjectFilter("all"); }}
            >
              <Icon name="RotateCcw" className="size-3.5" /> Reset
            </Button>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="BookOpen"
              title="No courses match these filters"
              description="Try removing a filter or browse all courses across universities."
              action={
                <Button variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] " onClick={() => onNavigate("public-courses")}>
                  <Icon name="BookOpen" className="size-4" /> All courses
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredCourses.map((c) => (
              <div key={c.slug} className="rounded-2xl border-2 border-[var(--alo-brand)]/10 p-4 transition-colors hover:border-[var(--alo-brand)]/30">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">{c.level}</Badge>
                      <Badge variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)]">{c.subject}</Badge>
                      {c.scholarship && (
                        <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] hover:bg-[var(--alo-cta-soft)]">
                          <Icon name="Award" className="mr-1 size-3" /> Scholarship
                        </Badge>
                      )}
                    </div>
                    <h4 className="mt-2 text-base font-bold text-[var(--alo-brand)]">{c.name}</h4>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                      <p className="flex items-center gap-1.5"><Icon name="Clock" className="size-3.5 text-muted-foreground" /> <span className="font-medium text-foreground">{c.duration}</span></p>
                      <p className="flex items-center gap-1.5"><Icon name="Calendar" className="size-3.5 text-muted-foreground" /> <span className="font-medium text-foreground">{c.intake}</span></p>
                      <p className="flex items-center gap-1.5"><Icon name="Wallet" className="size-3.5 text-muted-foreground" /> <span className="font-medium text-foreground">{c.tuition}</span></p>
                      {c.deadline && <p className="flex items-center gap-1.5"><Icon name="AlarmClock" className="size-3.5 text-muted-foreground" /> <span className="font-medium text-foreground line-clamp-1">{c.deadline}</span></p>}
                    </div>
                    {c.englishRequirement && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Icon name="Languages" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
                        <span><span className="font-semibold">English:</span> <span className="font-medium text-foreground">{c.englishRequirement}</span></span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
 variant="outline"
 size="sm"
 className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] "
 onClick={() => onNavigate("public-course", c.slug)}
                    >
                      <Icon name="FileText" className="size-4" /> View Details
                    </Button>
                    <Button
 size="sm"
 className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 "
 onClick={() => {
                        setSelectedCourseSlug(c.slug);
                        toast({ title: "Course selected", description: `${c.name} pre-filled in the application form below.` });
                        scrollToId("apply");
                      }}
                    >
                      <Icon name="Send" className="size-4" /> Apply Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 5. Entry Requirements */}
      <SectionCard title="Entry Requirements" icon="ListChecks" className="mt-6">
        {Object.keys(entryReqs).length === 0 ? (
          <EmptyState icon="ListChecks" title="No entry requirements published" description="Please ask your ALO counselor for the latest academic and English requirements." />
        ) : (
          <Tabs defaultValue={Object.keys(entryReqs)[0]} className="w-full">
            <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-[var(--alo-brand-light)]/60 h-auto">
              {Object.entries(entryReqs).map(([key]) => (
                <TabsTrigger key={key} value={key} className="data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] text-xs">
                  {LEVEL_LABELS[key] || key}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(entryReqs).map(([key, req]) => (
              <TabsContent key={key} value={key} className="mt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
                      <Icon name="GraduationCap" className="size-3.5" /> Academic
                    </p>
                    <p className="mt-2 text-sm text-foreground">{req.academic || "Confirm with counselor"}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
                      <Icon name="Languages" className="size-3.5" /> English
                    </p>
                    <p className="mt-2 text-sm text-foreground">{req.english || "IELTS / PTE / TOEFL accepted"}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
                      <Icon name="FolderCheck" className="size-3.5" /> Documents
                    </p>
                    <p className="mt-2 text-sm text-foreground">{req.documents || "Standard document checklist"}</p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
        <Disclaimer text="Entry requirements vary by programme and intake. Confirm the latest requirements with your ALO counselor before applying." />
      </SectionCard>

      {/* 6. Tuition, Deposit, Scholarship */}
      <SectionCard title="Tuition, Deposit & Scholarship" icon="Wallet" className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Undergraduate</p>
            <p className="mt-1 text-lg font-bold text-[var(--alo-brand)]">{tuition.ug || "—"}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Postgraduate</p>
            <p className="mt-1 text-lg font-bold text-[var(--alo-brand)]">{tuition.pg || "—"}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MBA</p>
            <p className="mt-1 text-lg font-bold text-[var(--alo-brand)]">{tuition.mba || "—"}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--alo-cta)]/15 bg-[var(--alo-cta-soft)]/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-cta)]">Deposit</p>
            <p className="mt-1 text-lg font-bold text-foreground">{tuition.deposit || "—"}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--alo-cta)]/15 bg-[var(--alo-cta-soft)]/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-cta)]">Scholarship</p>
            <p className="mt-1 text-sm font-bold text-foreground">{tuition.scholarship || quickFacts.scholarship || "—"}</p>
          </div>
          <div className="rounded-xl border-2 border-[var(--alo-brand)]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment plan</p>
            <p className="mt-1 text-sm font-bold text-foreground">{tuition.paymentPlan || "Ask counselor"}</p>
          </div>
        </div>
        <div className="mt-4">
          <Disclaimer text="Fees and scholarships can change. Confirm the latest figures with your ALO counselor before application." />
        </div>
      </SectionCard>

      {/* 7. Application Process */}
      <SectionCard title="Application Process" icon="Workflow" className="mt-6">
        {applicationSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Application steps will appear here once published.</p>
        ) : (
          <ol className="relative space-y-3">
            {applicationSteps.map((s, idx) => (
              <li key={idx} className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-alo-gradient text-sm font-bold text-white alo-shadow">
                  {s.step || idx + 1}
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-[var(--alo-brand)]/10 bg-white p-3">
                  <p className="text-sm font-bold text-[var(--alo-brand)]">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      {/* 8. Required Documents */}
      <SectionCard
        title="Required Documents"
        icon="FolderLock"
        description="All documents are uploaded via the ALO Student Portal — RBAC-protected, audit-logged, and never public."
        className="mt-6"
        action={
          <Button
 variant="outline"
 size="sm"
 className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] "
 onClick={() => onNavigate("student-dashboard")}
          >
            <Icon name="Upload" className="size-4" /> Upload in Portal
          </Button>
        }
      >
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No document checklist published. Your counselor will share a personalised list.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {documents.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-[var(--alo-brand)]/10 p-3">
                <Icon name={d.required ? "CircleCheck" : "CircleDashed"} className={cn("mt-0.5 size-4 shrink-0", d.required ? "text-[var(--alo-cta)]" : "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    <Badge className={cn("text-[11px]", d.required ? "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] hover:bg-[var(--alo-cta-soft)]" : "bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)]")}>
                      {d.required ? "Required" : "Optional"}
                    </Badge>
                    <Badge variant="outline" className="border-[var(--alo-brand)]/20 text-[11px] text-muted-foreground">{d.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d.explanation}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* 9. AI Help */}
      <SectionCard
        title="AI Help for This University"
        icon="Sparkles"
        description="Use ALO's AI tools to prepare a stronger application — from eligibility checks to interview practice."
        className="mt-6"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "ListChecks", title: "Check if I am eligible", desc: "Get an AI eligibility assessment based on your academic and English profile.", action: () => { setEligOpen(true); scrollToId("eligibility"); } },
            { icon: "Sparkles", title: "Match me with courses", desc: "AI suggests the best-fit courses at this university for your goals.", action: () => toast({ title: "Course match", description: "Use the AI Course Finder for a full match across all universities." }) },
            { icon: "FileText", title: "Generate SOP draft", desc: "AI writes a tailored Statement of Purpose based on your profile.", action: () => toast({ title: "SOP draft", description: "SOP Writer is available in your student portal. Apply first to unlock." }) },
            { icon: "Mic", title: "Practice university interview", desc: "Practice credibility & interview questions with the AI interviewer.", action: () => onNavigate("ai-interview") },
            { icon: "ClipboardCheck", title: "Create document checklist", desc: "AI builds a personalised checklist of documents you still need.", action: () => toast({ title: "Checklist", description: "Your counselor will share a tailored checklist once you submit the form." }) },
            { icon: "GitCompare", title: "Compare with another university", desc: "See how this university stacks up against others.", action: () => onNavigate("public-universities") },
          ].map((tool, i) => (
            <button
              key={i}
              onClick={tool.action}
              className="group flex h-full flex-col items-start gap-2 rounded-2xl border-2 border-[var(--alo-brand)]/10 p-4 text-left transition-all hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]/30"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)] transition-colors group-hover:bg-[var(--alo-brand)] group-hover:text-white">
                <Icon name={tool.icon} className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--alo-brand)]">{tool.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{tool.desc}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--alo-cta)]">
                Open <Icon name="ArrowRight" className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>

        {/* Inline AI Eligibility Checker */}
        {eligOpen && (
          <div id="eligibility" className="mt-6 scroll-mt-20 rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-[var(--alo-brand)]">
                  <Icon name="Sparkles" className="size-4" /> AI Eligibility Checker
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">Tell us about your profile — AI will assess your fit for {university.name}.</p>
              </div>
              <button
                onClick={() => { setEligOpen(false); setEligResult(null); }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close eligibility checker"
              >
                <Icon name="X" className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label className="text-xs font-semibold">Highest qualification</Label>
                <Select value={eligForm.academicLevel} onValueChange={(v) => setEligForm({ ...eligForm, academicLevel: v })}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent>
                    {["SSC / O Level", "HSC / A Level", "Diploma", "Bachelor (Pass)", "Bachelor (Honors)", "Masters"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Grade / CGPA</Label>
                <Input value={eligForm.academicGrade} onChange={(e) => setEligForm({ ...eligForm, academicGrade: e.target.value })} className="mt-1 h-10" placeholder="e.g. 3.4 / 5.0" />
              </div>
              <div>
                <Label className="text-xs font-semibold">English score</Label>
                <Input value={eligForm.englishScore} onChange={(e) => setEligForm({ ...eligForm, englishScore: e.target.value })} className="mt-1 h-10" placeholder="e.g. IELTS 6.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Study gap (years)</Label>
                <Input value={eligForm.studyGap} onChange={(e) => setEligForm({ ...eligForm, studyGap: e.target.value })} className="mt-1 h-10" placeholder="0" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Budget (per year)</Label>
                <Input value={eligForm.budget} onChange={(e) => setEligForm({ ...eligForm, budget: e.target.value })} className="mt-1 h-10" placeholder="e.g. £25,000" />
              </div>
            </div>
            <Button
 className="mt-3 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
 disabled={eligLoading || !eligForm.academicLevel}
 onClick={runEligibility}
 >
              {eligLoading ? <><Icon name="Loader2" className="size-4 animate-spin" /> Assessing...</> : <><Icon name="Sparkles" className="size-4" /> Check my eligibility</>}
            </Button>

            {eligResult && (
              <div className="mt-4 rounded-xl border border-[var(--alo-brand)]/15 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", STATUS_TONE[eligResult.status] || STATUS_TONE.NEEDS_COUNSELOR_REVIEW)}>
                    <Icon name="Sparkles" className="size-3" />
                    {eligResult.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <p className="mt-3 text-sm text-foreground">{eligResult.summary}</p>
                {eligResult.strengths && eligResult.strengths.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-emerald-700">Strengths</p>
                    <ul className="mt-1 space-y-1">{eligResult.strengths.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-foreground"><Icon name="CheckCircle2" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />{s}</li>)}</ul>
                  </div>
                )}
                {eligResult.concerns && eligResult.concerns.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-amber-700">Concerns</p>
                    <ul className="mt-1 space-y-1">{eligResult.concerns.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-foreground"><Icon name="AlertTriangle" className="mt-0.5 size-3.5 shrink-0 text-amber-600" />{s}</li>)}</ul>
                  </div>
                )}
                {eligResult.recommendedNextSteps && eligResult.recommendedNextSteps.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-[var(--alo-brand)]">Recommended next steps</p>
                    <ol className="mt-1 space-y-1">{eligResult.recommendedNextSteps.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-foreground"><span className="font-bold text-[var(--alo-brand)]">{i + 1}.</span><span>{s}</span></li>)}</ol>
                  </div>
                )}
                {eligResult.visaRiskNote && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-semibold">Visa risk note:</span> {eligResult.visaRiskNote}</p>
                )}
                <Button
 variant="outline"
 className="mt-4 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] "
 onClick={() => scrollToId("apply")}
                >
                  <Icon name="Send" className="size-4" /> Talk to a counselor
                </Button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* 10. FAQ */}
      <SectionCard title="Frequently Asked Questions" icon="HelpCircle" className="mt-6">
        {faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No FAQs published yet.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-[var(--alo-brand)] hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </SectionCard>

      {/* 11. Final CTA + Lead form */}
      <section id="apply" className="mt-8 scroll-mt-20">
        <SectionCard
          icon="Send"
          title={`Apply to ${university.name}`}
          description="One form — counselor assigned in 24 hours. We handle documents, application, and visa."
          className="border-2 border-[var(--alo-brand)]/15 bg-gradient-to-br from-[var(--alo-brand-light)]/60 to-white"
        >
          <PublicLeadForm
            sourceTag={`${university.name} university page`}
            preferredCountry={university.country.name}
            preferredCourse={selectedCourseSlug ? university.courses.find((c) => c.slug === selectedCourseSlug)?.name : ""}
            title="Start your application"
            subtitle="Tell us about you — we'll handle the rest."
          />
        </SectionCard>
      </section>

      {/* 12. Source Verification */}
      <div className="mt-6">
        <SourceVerification
          sourceUrl={university.sourceUrl}
          lastVerifiedAt={university.lastVerifiedAt}
          verificationStatus={university.verificationStatus}
        />
      </div>
    </div>
  );
}
export default PublicUniversity;
