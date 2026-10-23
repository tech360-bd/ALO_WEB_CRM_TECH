"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Icon, SectionCard, EmptyState, LoadingGrid, InfoRow } from "@/components/alo/shared";
import { Breadcrumb, SourceVerification, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicCourseProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface CourseCountry {
  name: string;
  shortName: string;
  flag: string;
  slug: string;
}

interface CourseUniversity {
  name: string;
  slug: string;
  city: string;
  overview?: string;
  sourceUrl?: string | null;
}

interface SimilarCourse {
  slug: string;
  name: string;
  level: string;
  university: { name: string; slug: string };
  country: { flag: string; shortName: string };
}

interface CourseDetail {
  slug: string;
  name: string;
  universitySlug: string;
  countrySlug: string;
  city: string;
  level: string;
  subject: string;
  duration: string;
  intake: string;
  tuition: string;
  scholarship?: string | null;
  englishRequirement: string;
  academicRequirement: string;
  overview: string;
  modules: string;
  careerOutcomes: string;
  documents: string;
  faqs: string;
  deadline?: string | null;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  verificationStatus?: string;
  university: CourseUniversity;
  country: CourseCountry;
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

const APPLY_FLOW = [
  { step: 1, title: "Submit the form", detail: "Fill in your details below. A lead is created in the ALO CRM instantly.", icon: "Send" },
  { step: 2, title: "Student portal access", detail: "Receive login to your private ALO Student Portal within 24 hours.", icon: "LayoutDashboard" },
  { step: 3, title: "Personalised document checklist", detail: "AI + counselor generate the exact list of documents you need for this course.", icon: "ClipboardCheck" },
  { step: 4, title: "Counselor assigned", detail: "A dedicated counselor handles university submission, follow-up, and your visa pathway.", icon: "UserCheck" },
];

export function PublicCourse({ slug, onNavigate }: PublicCourseProps) {
  const effectiveSlug = slug || "msc-computer-science-university-of-manchester";
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [course, setCourse] = React.useState<CourseDetail | null>(null);
  const [similar, setSimilar] = React.useState<SimilarCourse[]>([]);
  const [notFound, setNotFound] = React.useState(false);

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
    setCourse(null);
    setSimilar([]);
    (async () => {
      try {
        const res = await fetch(`/api/courses/${encodeURIComponent(effectiveSlug)}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.error || !data.course) {
          setNotFound(true);
        } else {
          setCourse(data.course);
          setSimilar(Array.isArray(data.similar) ? data.similar : []);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [effectiveSlug]);

  const modules = safeParse<string[]>(course?.modules, []);
  const careerOutcomes = safeParse<string[]>(course?.careerOutcomes, []);
  const documents = safeParse<{ category: string; name: string; required: boolean; explanation: string }[]>(course?.documents, []);
  const faqs = safeParse<{ q: string; a: string }[]>(course?.faqs, []);

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
          preferredSubject: course?.subject || "",
          preferredLevel: course?.level || "",
          preferredIntake: course?.intake || "",
          preferredCountry: course?.country?.name || "",
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

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6"><LoadingGrid count={4} /></div>
        <div className="mt-6"><LoadingGrid count={3} /></div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
        <Breadcrumb
          items={[
            { label: "Home", onClick: () => onNavigate("public-home") },
            { label: "Courses", onClick: () => onNavigate("public-courses") },
            { label: "Not found" },
          ]}
        />
        <div className="mt-6">
          <EmptyState
            icon="BookOpen"
            title="Course page not available"
            description="This course page may have been moved or is being updated. Browse all courses to find a verified programme."
            action={
              <div className="flex gap-2">
                <Button className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90 h-11" onClick={() => onNavigate("public-courses")}>
                  <Icon name="BookOpen" className="size-4" /> All courses
                </Button>
                <Button variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-11" onClick={() => onNavigate("public-universities")}>
                  <Icon name="Building2" className="size-4" /> All universities
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
          { label: "Courses", onClick: () => onNavigate("public-courses") },
          { label: course.country.name, onClick: () => onNavigate("public-country", course.country.slug) },
          { label: course.university.name, onClick: () => onNavigate("public-university", course.university.slug) },
          { label: course.name },
        ]}
      />

      {/* 2. Hero */}
      <section className="mt-5 overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-gradient-to-br from-[var(--alo-brand-light)]/60 via-white to-white">
        <div className="p-5 lg:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">{course.level}</Badge>
            <Badge variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)]">{course.subject}</Badge>
            {course.scholarship && (
              <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] hover:bg-[var(--alo-cta-soft)]">
                <Icon name="Award" className="mr-1 size-3" /> Scholarship
              </Badge>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Icon name="ShieldCheck" className="size-3" />
              Verified {course.lastVerifiedAt ? fmtDate(course.lastVerifiedAt) : "recently"}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-black text-[var(--alo-brand)] sm:text-3xl lg:text-4xl">{course.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => onNavigate("public-university", course.university.slug)}
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--alo-brand)] hover:underline"
            >
              <Icon name="Building2" className="size-4" />
              {course.university.name}
            </button>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="MapPin" className="size-4 text-[var(--alo-cta)]" />{course.city}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 text-base leading-none">{course.country.flag} {course.country.name}</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90 h-12" onClick={() => scrollToId("apply")}>
              <Icon name="Send" className="size-4" /> Apply Now
            </Button>
            <Button
              variant="outline"
              className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-12"
              onClick={() => onNavigate("public-university", course.university.slug)}
            >
              <Icon name="Building2" className="size-4" /> View University
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-foreground hover:bg-[var(--alo-brand-light)]"
              onClick={() => toast({ title: "Course saved", description: `${course.name} added to your shortlist. Sign in to your portal to view it.` })}
            >
              <Icon name="Bookmark" className="size-4" /> Save
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-foreground hover:bg-[var(--alo-brand-light)]"
              onClick={() => toast({ title: "Compare opened", description: "Compare view is coming soon. For now, browse similar courses below." })}
            >
              <Icon name="GitCompare" className="size-4" /> Compare
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Quick Facts */}
      <SectionCard title="Quick Facts" icon="ListChecks" className="mt-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Course" value={course.name} />
          <InfoRow label="University" value={course.university.name} />
          <InfoRow label="Country" value={`${course.country.flag} ${course.country.name}`} />
          <InfoRow label="City" value={course.city} />
          <InfoRow label="Level" value={course.level} />
          <InfoRow label="Subject" value={course.subject} />
          <InfoRow label="Duration" value={course.duration} />
          <InfoRow label="Intake" value={course.intake} />
          <InfoRow label="Tuition" value={<span className="font-bold text-[var(--alo-brand)]">{course.tuition}</span>} />
          <InfoRow label="Scholarship" value={course.scholarship || "Ask counselor"} />
          <InfoRow label="Deadline" value={course.deadline || "Rolling"} />
          <InfoRow label="Last verified" value={course.lastVerifiedAt ? fmtDate(course.lastVerifiedAt) : "Recently"} />
        </div>
      </SectionCard>

      {/* 4. Course Overview */}
      <SectionCard title="Course Overview" icon="BookOpen" className="mt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{course.overview}</p>
      </SectionCard>

      {/* 5. Entry Requirements */}
      <SectionCard title="Entry Requirements" icon="ListChecks" className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
              <Icon name="GraduationCap" className="size-3.5" /> Academic requirement
            </p>
            <p className="mt-2 text-sm text-foreground">{course.academicRequirement || "Confirm with counselor"}</p>
          </div>
          <div className="rounded-xl border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
              <Icon name="Languages" className="size-3.5" /> English requirement
            </p>
            <p className="mt-2 text-sm text-foreground">{course.englishRequirement || "IELTS / PTE / TOEFL accepted"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-[var(--alo-cta)]/15 bg-[var(--alo-cta-soft)]/30 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--alo-cta)]">
              <Icon name="Sparkles" className="size-4" /> Not sure if you qualify?
            </p>
            <p className="mt-1 text-xs text-foreground/80">Run the AI Eligibility Checker — it assesses your profile against this course's requirements.</p>
          </div>
          <Button
            className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90 h-11"
            onClick={() => scrollToId("eligibility")}
          >
            <Icon name="Sparkles" className="size-4" /> Check my eligibility
          </Button>
        </div>
      </SectionCard>

      {/* 6. English Requirements */}
      <SectionCard title="English Requirements" icon="Languages" className="mt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{course.englishRequirement}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-11"
            onClick={() => onNavigate("public-exams")}
          >
            <Icon name="GraduationCap" className="size-4" /> Take Free English Test
          </Button>
          <Button
            variant="outline"
            className="border-[var(--alo-cta)]/40 text-[var(--alo-cta)] hover:bg-[var(--alo-cta-soft)]/40 h-11"
            onClick={() => onNavigate("public-exam", "ielts")}
          >
            <Icon name="PenLine" className="size-4" /> Start IELTS Mock
          </Button>
        </div>
        <div className="mt-4">
          <Disclaimer text="English requirements can vary by programme version and intake. Some universities accept Medium of Instruction (MOI) certificates — ask your counselor." />
        </div>
      </SectionCard>

      {/* 7. Tuition and Scholarship */}
      <SectionCard title="Tuition & Scholarship" icon="Wallet" className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tuition</p>
            <p className="mt-1 text-2xl font-black text-[var(--alo-brand)]">{course.tuition}</p>
            <p className="mt-1 text-xs text-muted-foreground">For {course.duration} · {course.level}</p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--alo-cta)]/15 bg-[var(--alo-cta-soft)]/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-cta)]">Scholarship</p>
            <p className="mt-1 text-base font-bold text-foreground">{course.scholarship || "Merit awards available — ask counselor"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Scholarships are typically merit-based and require early application.</p>
          </div>
        </div>
        <div className="mt-4">
          <Disclaimer text="Tuition, scholarships, and deadlines can change without notice. Confirm the latest figures with your ALO counselor before applying." />
        </div>
      </SectionCard>

      {/* 8. Modules */}
      <SectionCard
        title="Modules / Subject Areas"
        icon="Layers"
        description={modules.length > 0 ? `${modules.length} modules typically covered in this programme` : "Module list will appear here"}
        className="mt-6"
      >
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Detailed module list is being prepared. Your counselor can share the official syllabus on request.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-[var(--alo-brand)]/10 p-3 transition-colors hover:border-[var(--alo-brand)]/30 hover:bg-[var(--alo-brand-light)]/20">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-xs font-bold text-[var(--alo-brand)]">
                  {i + 1}
                </div>
                <p className="text-sm font-medium text-foreground">{m}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 9. Career Outcomes */}
      <SectionCard
        title="Career Outcomes"
        icon="Briefcase"
        description="Typical career paths for graduates of this course"
        className="mt-6"
      >
        {careerOutcomes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Career outcomes will be published soon.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {careerOutcomes.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--alo-brand-light)] px-3 py-1.5 text-xs font-semibold text-[var(--alo-brand)]">
                  <Icon name="Briefcase" className="size-3" />
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[var(--alo-page)] p-3 text-xs text-muted-foreground">
              <Icon name="Sparkles" className="mt-0.5 size-4 shrink-0 text-[var(--alo-cta)]" />
              <p>ALO's career team helps you build a CV, portfolio, and LinkedIn profile aligned with these roles. You also get access to mock interviews and ALO's employer network.</p>
            </div>
          </>
        )}
      </SectionCard>

      {/* 10. Required Documents */}
      <SectionCard
        title="Required Documents"
        icon="FolderLock"
        description="Documents are uploaded privately via the ALO Student Portal — RBAC-protected and audit-logged."
        className="mt-6"
        action={
          <Button
            variant="outline"
            size="sm"
            className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-9"
            onClick={() => onNavigate("student-dashboard")}
          >
            <Icon name="Upload" className="size-4" /> Upload in Portal
          </Button>
        }
      >
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No document checklist published. Your counselor will share a tailored list.</p>
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

      {/* 11. Similar Courses */}
      <SectionCard
        title="Similar Courses"
        icon="GitCompare"
        description={similar.length > 0 ? `${similar.length} courses in the same subject area` : "No similar courses found"}
        className="mt-6"
      >
        {similar.length === 0 ? (
          <p className="text-sm text-muted-foreground">No similar courses in the same subject area. Try browsing all courses.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <button
                key={s.slug}
                onClick={() => onNavigate("public-course", s.slug)}
                className="group flex h-full flex-col items-start gap-2 rounded-2xl border-2 border-[var(--alo-brand)]/10 p-4 text-left transition-all hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]/30"
              >
                <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">{s.level}</Badge>
                <p className="text-sm font-bold text-[var(--alo-brand)] line-clamp-2">{s.name}</p>
                <p className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="Building2" className="size-3" />
                  <span className="line-clamp-1">{s.university.name}</span>
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="text-sm">{s.country.flag}</span>
                  {s.country.shortName}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--alo-cta)]">
                  View course <Icon name="ArrowRight" className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 12. Similar Universities */}
      <SectionCard
        title="Similar Universities"
        icon="Building2"
        description="Explore the university offering this course — or browse other universities in the same country."
        className="mt-6"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => onNavigate("public-university", course.university.slug)}
            className="group flex items-start gap-3 rounded-2xl border-2 border-[var(--alo-brand)]/15 p-4 text-left transition-all hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]/30"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-alo-gradient text-white alo-shadow">
              <Icon name="Building2" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--alo-brand)]">{course.university.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Icon name="MapPin" className="size-3" /> {course.city} · {course.country.flag} {course.country.name}
              </p>
              {course.university.overview && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{course.university.overview}</p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--alo-cta)]">
                View university <Icon name="ArrowRight" className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigate("public-universities")}
            className="group flex items-start gap-3 rounded-2xl border-2 border-dashed border-[var(--alo-brand)]/15 p-4 text-left transition-all hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]/30"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
              <Icon name="Globe" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--alo-brand)]">More universities in {course.country.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Compare {course.country.flag} {course.country.name} universities — tuition, scholarships, intakes, and entry requirements side by side.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--alo-cta)]">
                Browse all universities <Icon name="ArrowRight" className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>
        </div>
      </SectionCard>

      {/* 13. AI Eligibility Checker */}
      <SectionCard
        title="AI Eligibility Checker"
        icon="Sparkles"
        description={`Get an AI-powered assessment of your fit for ${course.name}.`}
        className="mt-6 scroll-mt-20"
      >
        <div id="eligibility" className="-mt-12 pt-12" />
        <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
            className="mt-3 h-11 bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
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
              {eligResult.recommendedDocuments && eligResult.recommendedDocuments.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[var(--alo-brand)]">Recommended documents</p>
                  <ul className="mt-1 space-y-1">{eligResult.recommendedDocuments.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-foreground"><Icon name="FileText" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />{s}</li>)}</ul>
                </div>
              )}
              {eligResult.recommendedNextSteps && eligResult.recommendedNextSteps.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[var(--alo-brand)]">Recommended next steps</p>
                  <ol className="mt-1 space-y-1">{eligResult.recommendedNextSteps.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-foreground"><span className="font-bold text-[var(--alo-brand)]">{i + 1}.</span><span>{s}</span></li>)}</ol>
                </div>
              )}
              {eligResult.englishTestAdvice && (
                <p className="mt-3 rounded-lg bg-[var(--alo-brand-light)]/60 px-3 py-2 text-xs text-[var(--alo-brand)]"><span className="font-semibold">English test advice:</span> {eligResult.englishTestAdvice}</p>
              )}
              {eligResult.visaRiskNote && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><span className="font-semibold">Visa risk note:</span> {eligResult.visaRiskNote}</p>
              )}
              <Button
                variant="outline"
                className="mt-4 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-10"
                onClick={() => scrollToId("apply")}
              >
                <Icon name="Send" className="size-4" /> Talk to a counselor
              </Button>
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Icon name="Info" className="mr-1 inline size-3" />
          AI assessments are indicative only and not a guarantee of admission. Always confirm with your ALO counselor.
        </p>
      </SectionCard>

      {/* 14. Apply Now Flow */}
      <section id="apply" className="mt-6 scroll-mt-20">
        <SectionCard
          title="Apply Now — What Happens Next?"
          icon="Workflow"
          description="Four simple steps from form submission to a counselor handling your application."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {APPLY_FLOW.map((s) => (
              <div key={s.step} className="relative rounded-2xl border-2 border-[var(--alo-brand)]/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gradient text-white alo-shadow">
                    <Icon name={s.icon} className="size-5" />
                  </div>
                  <span className="text-2xl font-black text-[var(--alo-brand)]/15">{s.step}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--alo-brand)]">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <PublicLeadForm
              sourceTag={`${course.name} course page`}
              preferredCountry={course.country.name}
              preferredCourse={course.name}
              title={`Apply for ${course.name}`}
              subtitle="One form — counselor assigned within 24 hours."
            />
          </div>
        </SectionCard>
      </section>

      {/* 15. FAQ */}
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

      {/* 16. Final CTA */}
      <section className="mt-8">
        <div className="overflow-hidden rounded-2xl border-2 border-[var(--alo-cta)]/30 bg-gradient-to-br from-[var(--alo-cta-soft)]/60 via-white to-white p-5 lg:p-7">
          <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-[var(--alo-brand)] sm:text-2xl">
                Ready to apply for {course.name}?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Take the next step — submit your details and an ALO counselor will reach out within 24 hours.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90 h-12"
                onClick={() => scrollToId("apply")}
              >
                <Icon name="Send" className="size-4" /> Apply Now
              </Button>
              <Button
                variant="outline"
                className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] h-12"
                onClick={() => onNavigate("public-courses")}
              >
                <Icon name="BookOpen" className="size-4" /> Browse more courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 17. Source Verification */}
      <div className="mt-6">
        <SourceVerification
          sourceUrl={course.sourceUrl || course.university.sourceUrl}
          lastVerifiedAt={course.lastVerifiedAt}
          verificationStatus={course.verificationStatus}
        />
      </div>
    </div>
  );
}
export default PublicCourse;
