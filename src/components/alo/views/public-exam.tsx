"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb, SourceVerification, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Exam = {
  slug: string;
  name: string;
  fullName: string;
  intro: string;
  whatIs: string;
  modules: string | null;
  mockRules: string | null;
  freeQuota: string | null;
  examExperience: string | null;
  aiScoring: string | null;
  speakingPractice: string | null;
  writingReview: string | null;
  resultReport: string | null;
  pricing: string | null;
  faqs: string | null;
  disclaimer: string;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  verificationStatus: string;
};

type ModuleItem = { name: string; detail: string };
type ExperienceItem = { feature: string; detail: string };
type FaqItem = { q: string; a: string };
type FreeQuota = { aloStudents?: string; guestStudents?: string };
type Pricing = { free?: string; paid?: string };
type SectionObj = { detail?: string; [k: string]: string | undefined };

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Map AI scoring / experience section keys to icons + labels
const SECTION_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
  literacy: "Literacy",
  comprehension: "Comprehension",
  conversation: "Conversation",
  production: "Production",
  verbal: "Verbal Reasoning",
  quantitative: "Quantitative Reasoning",
  analytical: "Analytical Writing",
  english: "English",
  math: "Mathematics",
  science: "Science",
};

const EXPERIENCE_ICONS: Record<string, string> = {
  timer: "Timer",
  countdown: "Timer",
  audio: "Headphones",
  microphone: "Mic",
  navigator: "ListOrdered",
  editor: "PenLine",
  writing: "PenLine",
  autosave: "Save",
  submit: "CheckCheck",
  calculator: "Calculator",
  note: "StickyNote",
  adaptive: "Shuffle",
  online: "Monitor",
  computer: "Monitor",
  test: "FileText",
  short: "Zap",
  instant: "Zap",
};

function pickIcon(label: string, fallback = "Sparkles"): string {
  const k = label.toLowerCase();
  for (const key in EXPERIENCE_ICONS) {
    if (k.includes(key)) return EXPERIENCE_ICONS[key];
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PublicExamProps {
  slug?: string;
  onNavigate: (v: ViewKey, slug?: string) => void;
}

export function PublicExam({ slug, onNavigate }: PublicExamProps) {
  const { toast } = useToast();
  const effectiveSlug = slug || "ielts";
  const [exam, setExam] = React.useState<Exam | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);
        setExam(null);
        const res = await fetch(`/api/exams/${encodeURIComponent(effectiveSlug)}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data?.exam) {
          setNotFound(true);
          return;
        }
        setExam(data.exam as Exam);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn’t load exam",
            description: e?.message || "Please try again later.",
            variant: "destructive",
          });
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug, toast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-6">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-12 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-8">
          <LoadingGrid count={3} />
        </div>
      </div>
    );
  }

  if (notFound || !exam) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
        <EmptyState
          icon="FileQuestion"
          title="Exam page not found"
          description="This exam may not be published yet. Browse all available English tests to find what you’re looking for."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => onNavigate("public-exams")}
                className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
              >
                <Icon name="ArrowLeft" className="size-4" />
                All English Tests
              </Button>
              <Button
                onClick={() => onNavigate("public-exam", "placement-test")}
                className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
              >
                <Icon name="Compass" className="size-4" />
                Try Placement Test
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return <ExamDetail exam={exam} onNavigate={onNavigate} toast={toast} />;
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------

function ExamDetail({
  exam,
  onNavigate,
  toast,
}: {
  exam: Exam;
  onNavigate: (v: ViewKey, slug?: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const modules = safeParse<ModuleItem[]>(exam.modules, []);
  const mockRules = safeParse<string[]>(exam.mockRules, []);
  const examExperience = safeParse<ExperienceItem[]>(exam.examExperience, []);
  const resultReport = safeParse<string[]>(exam.resultReport, []);
  const faqs = safeParse<FaqItem[]>(exam.faqs, []);
  const freeQuota = safeParse<FreeQuota>(exam.freeQuota, {});
  const pricing = safeParse<Pricing>(exam.pricing, {});
  const aiScoring = safeParse<SectionObj>(exam.aiScoring, {});
  const speakingPractice = safeParse<SectionObj>(exam.speakingPractice, {});
  const writingReview = safeParse<SectionObj>(exam.writingReview, {});

  const isPlacement = exam.slug === "placement-test";

  const startMock = () => onNavigate("english-test");
  const bookAssessment = () =>
    toast({
      title: "Assessment request received",
      description: "An ALO counselor will call you within 24 hours to book your English assessment.",
    });

  return (
    <div className="bg-white">
      {/* HERO */}
      <div className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-br from-[var(--alo-brand-light)] via-white to-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "English Tests", onClick: () => onNavigate("public-exams") },
              { label: exam.name },
            ]}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]">
                  <Icon name="GraduationCap" className="mr-1 size-3" />
                  English Test
                </Badge>
                {isPlacement && (
                  <Badge className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]">
                    <Icon name="Compass" className="mr-1 size-3" />
                    Diagnostic Tool
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="ShieldCheck" className="size-3 text-crm-success-text" />
                  Last verified {fmtDate(exam.lastVerifiedAt)}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--alo-brand)] sm:text-4xl">
                {exam.name} Mock Test
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {exam.fullName}
              </p>
              <p className="mt-3 max-w-2xl text-sm text-foreground/80">{exam.intro}</p>
            </div>

            {/* Hero actions */}
            <div className="flex flex-col gap-2 lg:w-72">
              <Button
                onClick={startMock}
                className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
              >
                <Icon name="Play" className="size-4" />
                Start Free Mock
              </Button>
              <Button
                onClick={bookAssessment}
                variant="outline"
                className="h-12 border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
              >
                <Icon name="CalendarCheck" className="size-4" />
                Book English Assessment
              </Button>
              {!isPlacement && (
                <Button
                  onClick={() => onNavigate("public-exam", "placement-test")}
                  variant="ghost"
                  className="h-11 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                >
                  <Icon name="Compass" className="size-4" />
                  Take Placement Test First
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-8 lg:px-6 lg:py-10">
        {/* 1. What is */}
        <SectionCard title={`What is ${exam.name}?`} icon="BookOpen">
          <p className="text-sm leading-relaxed text-foreground/80">{exam.whatIs}</p>
        </SectionCard>

        {/* 2. Modules */}
        {modules.length > 0 && (
          <SectionCard
            title="Test Modules"
            description={`${modules.length} section${modules.length > 1 ? "s" : ""} covered in the ALO mock`}
            icon="Layers"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--alo-brand)] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-[var(--alo-brand)]">{m.name}</p>
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">{m.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 3. Mock rules */}
        {mockRules.length > 0 && (
          <SectionCard
            title="ALO Mock Test Rules"
            description="How free mocks, credits, and payments work at ALO"
            icon="ScrollText"
          >
            <ul className="space-y-2.5">
              {mockRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Icon name="CircleCheck" className="mt-0.5 size-4 shrink-0 text-crm-success-text" />
                  <span className="text-foreground/80">{rule}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-[var(--alo-cta)]/30 bg-[var(--alo-cta-soft)]/50 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-[var(--alo-cta)]">
                <Icon name="Gift" className="size-3.5" />
                Free quota highlight
              </p>
              <p className="mt-1 text-foreground/80">
                {freeQuota.aloStudents || "ALO students: 3 free mocks"} ·{" "}
                {freeQuota.guestStudents || "Guests: 1 free mock"}. After the free limit,
                additional mocks are chargeable.
              </p>
            </div>
          </SectionCard>
        )}

        {/* 4. Free quota */}
        <SectionCard
          title="Free Mock Quota"
          description="How many free mocks you get with ALO"
          icon="Gift"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FreeQuotaCard
              icon="GraduationCap"
              accent="blue"
              label="ALO Students"
              value={freeQuota.aloStudents || "3 free full mocks"}
              perks={["AI-scored result + PDF", "Weakness analysis", "Saved to CRM timeline"]}
            />
            <FreeQuotaCard
              icon="UserRound"
              accent="orange"
              label="Guest Students"
              value={freeQuota.guestStudents || "1 free mock"}
              perks={["Same exam interface", "Basic AI scoring", "Upgrade to ALO student for more"]}
            />
          </div>
        </SectionCard>

        {/* 5. Exam-like experience */}
        {examExperience.length > 0 && (
          <SectionCard
            title="Exam-like Experience"
            description="Built to mirror the real test day"
            icon="MonitorPlay"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {examExperience.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--alo-brand)]/15 bg-white p-4"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                    <Icon name={pickIcon(item.feature)} className="size-4" />
                  </div>
                  <p className="mt-3 font-semibold text-[var(--alo-brand)]">{item.feature}</p>
                  <p className="mt-1 text-xs text-foreground/80">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 6. AI scoring */}
        {Object.keys(aiScoring).length > 0 && (
          <SectionCard
            title="AI Scoring"
            description="How each section is evaluated"
            icon="Bot"
          >
            <div className="space-y-2.5">
              {Object.entries(aiScoring).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-start gap-3 rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--alo-brand)]/10 text-[var(--alo-brand)]">
                    <Icon
                      name={String(val).toLowerCase().includes("auto") ? "Cpu" : "Brain"}
                      className="size-4"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--alo-brand)]">
                        {SECTION_LABELS[key] || key.replace(/_/g, " ")}
                      </p>
                      {String(val).toLowerCase().includes("auto") ? (
                        <Badge className="bg-crm-success-bg text-crm-success-text hover:bg-crm-success-bg">
                          Auto-scored
                        </Badge>
                      ) : (
                        <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]">
                          AI-evaluated
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/80">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 7. Speaking practice */}
        {speakingPractice.detail && (
          <SectionCard title="Speaking Practice" icon="Mic">
            <div className="flex items-start gap-4">
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)] sm:flex">
                <Icon name="Mic" className="size-6" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                {speakingPractice.detail}
              </p>
            </div>
          </SectionCard>
        )}

        {/* 8. Writing review */}
        {writingReview.detail && (
          <SectionCard title="Writing Review" icon="PenLine">
            <div className="flex items-start gap-4">
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)] sm:flex">
                <Icon name="PenLine" className="size-6" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">
                {writingReview.detail}
              </p>
            </div>
          </SectionCard>
        )}

        {/* 9. Result report */}
        {resultReport.length > 0 && (
          <SectionCard
            title="Result Report"
            description="What you get after every mock"
            icon="FileBarChart"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {resultReport.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-[var(--alo-brand)]/10 bg-[var(--alo-page)] p-3"
                >
                  <Icon name="CircleCheck" className="mt-0.5 size-4 shrink-0 text-crm-success-text" />
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 10. Pricing */}
        <SectionCard
          title="Pricing"
          description="Transparent pricing — start free, pay only when you need more"
          icon="CreditCard"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-crm-success-border bg-crm-success-bg/60 p-5">
              <div className="flex items-center gap-2">
                <Icon name="Gift" className="size-5 text-crm-success-text" />
                <p className="font-bold text-crm-success-text">Free</p>
              </div>
              <p className="mt-2 text-sm text-foreground/80">
                {pricing.free || `${freeQuota.aloStudents || "3 mocks for ALO students"}, ${freeQuota.guestStudents || "1 for guests"}`}
              </p>
            </div>
            <div className="rounded-xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/40 p-5">
              <div className="flex items-center gap-2">
                <Icon name="CreditCard" className="size-5 text-[var(--alo-brand)]" />
                <p className="font-bold text-[var(--alo-brand)]">Paid (additional mocks)</p>
              </div>
              <p className="mt-2 text-sm text-foreground/80">
                {pricing.paid || "Affordable per-mock or package rates — contact ALO for details."}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 11. Disclaimer */}
        <Disclaimer text={exam.disclaimer} />

        {/* 12. FAQs */}
        {faqs.length > 0 && (
          <SectionCard title="Frequently Asked Questions" icon="CircleHelp">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-[var(--alo-brand)] hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/80">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>
        )}

        {/* 13. Final CTA */}
        <div className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-gradient-to-br from-[var(--alo-brand-light)]/80 to-white p-6 lg:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--alo-brand)] sm:text-3xl">
              Ready to practice {exam.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start your free mock now — no signup required for the first one. ALO students
              get 3 free mocks with full AI scoring and PDF reports.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                onClick={startMock}
                className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
              >
                <Icon name="Play" className="size-4" />
                Start Free Mock
              </Button>
              <Button
                onClick={() => onNavigate("public-exams")}
                variant="outline"
                className="h-12 border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
              >
                <Icon name="GraduationCap" className="size-4" />
                See All English Tests
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <PublicLeadForm
              sourceTag={`${exam.name} exam page`}
              title="Need help preparing?"
              subtitle="An ALO English trainer can design a personalized prep plan around your target score."
            />
          </div>
        </div>

        {/* 14. Source verification */}
        {exam.sourceUrl && (
          <SourceVerification
            sourceUrl={exam.sourceUrl}
            lastVerifiedAt={exam.lastVerifiedAt}
            verificationStatus={exam.verificationStatus}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Free quota card
// ---------------------------------------------------------------------------

function FreeQuotaCard({
  icon,
  accent,
  label,
  value,
  perks,
}: {
  icon: string;
  accent: "blue" | "orange";
  label: string;
  value: string;
  perks: string[];
}) {
  const accentCls =
    accent === "blue"
      ? "border-[var(--alo-brand)]/25 bg-[var(--alo-brand-light)]/50 text-[var(--alo-brand)]"
      : "border-[var(--alo-cta)]/25 bg-[var(--alo-cta-soft)]/50 text-[var(--alo-cta)]";
  return (
    <div className={cn("rounded-xl border-2 p-5", accentCls)}>
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg text-white",
            accent === "blue" ? "bg-[var(--alo-brand)]" : "bg-[var(--alo-cta)]"
          )}
        >
          <Icon name={icon} className="size-5" />
        </div>
        <p className="font-bold">{label}</p>
      </div>
      <p className="mt-3 text-xl font-black text-foreground">{value}</p>
      <ul className="mt-3 space-y-1.5">
        {perks.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
            <Icon name="Check" className="mt-0.5 size-3 shrink-0 text-crm-success-text" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default PublicExam;
