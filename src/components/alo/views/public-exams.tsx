"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  PageHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExamListItem = {
  slug: string;
  name: string;
  fullName: string;
  intro: string;
  freeQuota: string | null;
  pricing: string | null;
  lastVerifiedAt: string | null;
  verificationStatus: string;
};

type ParsedFreeQuota = {
  aloStudents?: string;
  guestStudents?: string;
  [k: string]: string | undefined;
};

type ParsedPricing = {
  free?: string;
  paid?: string;
  [k: string]: string | undefined;
};

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PublicExamsProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

export function PublicExams({ onNavigate }: PublicExamsProps) {
  const { toast } = useToast();
  const [exams, setExams] = React.useState<ExamListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/exams", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setExams(Array.isArray(data.exams) ? data.exams : []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load exams");
          toast({
            title: "Couldn’t load exams",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Split placement-test into its own highlighted card; keep ordering for the rest
  const placement = exams.find((e) => e.slug === "placement-test");
  const mainExams = exams.filter((e) => e.slug !== "placement-test");

  return (
    <div className="bg-white">
      {/* HERO + Breadcrumb */}
      <div className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-b from-[var(--alo-brand-light)]/60 to-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "English Tests" },
            ]}
          />
          <div className="mt-5">
            <h1 className="text-3xl font-black tracking-tight text-[var(--alo-brand)] sm:text-4xl">
              English Tests &amp; Mock Exams
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Practice IELTS, PTE, TOEFL, Duolingo, GRE, GMAT, SAT, ACT, and more
              with AI-scored mock tests designed to mirror the real exam experience.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
        {/* Free mock policy banner */}
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border-2 border-[var(--alo-cta)]/30 bg-[var(--alo-cta-soft)]/60 p-5 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-cta)] text-white">
            <Icon name="Gift" className="size-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--alo-cta)]">Free mock policy</p>
            <p className="mt-1 text-sm text-foreground/80">
              ALO registered students get <span className="font-semibold">3 free full mocks</span>.
              Guests get <span className="font-semibold">1 free mock</span>. After the free limit,
              payment is required. All mocks are AI-scored with a detailed PDF report.
            </p>
          </div>
          <Button
            onClick={() => onNavigate("public-exam", "placement-test")}
            className="h-11 shrink-0 border-2 border-[var(--alo-cta)] bg-white text-[var(--alo-cta)] hover:bg-[var(--alo-cta-soft)]"
            variant="outline"
          >
            <Icon name="Compass" className="size-4" />
            Take Placement Test
          </Button>
        </div>

        {/* Placement test highlight (only if it exists in dataset) */}
        {placement && (
          <Card className="mb-8 overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-gradient-to-br from-[var(--alo-brand-light)]/80 to-white">
            <CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-7">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]">
                    <Icon name="Sparkles" className="mr-1 size-3" />
                    Not sure where to start?
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last verified {fmtDate(placement.lastVerifiedAt)}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-[var(--alo-brand)] sm:text-2xl">
                  {placement.name}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{placement.fullName}</p>
                <p className="mt-2 max-w-2xl text-sm text-foreground/80">{placement.intro}</p>
                <p className="mt-3 text-sm font-medium text-[var(--alo-cta)]">
                  Free for everyone · 30–40 minutes · Instant CEFR level + test recommendation
                </p>
              </div>
              <Button
                onClick={() => onNavigate("public-exam", placement.slug)}
                className="h-12 w-full bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 md:w-auto"
              >
                <Icon name="Play" className="size-4" />
                Start Placement Test
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exam grid */}
        <h2 className="mb-4 text-lg font-bold text-foreground">
          All English Tests{" "}
          <span className="text-sm font-medium text-muted-foreground">
            ({mainExams.length})
          </span>
        </h2>

        {loading ? (
          <LoadingGrid count={6} />
        ) : error && exams.length === 0 ? (
          <EmptyState
            icon="GraduationCap"
            title="No exams available"
            description="We couldn’t load the exam list. Please try again later."
            action={
              <Button
                onClick={() => onNavigate("public-destinations")}
                className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
              >
                <Icon name="Globe" className="size-4" />
                Browse Destinations
              </Button>
            }
          />
        ) : mainExams.length === 0 ? (
          <EmptyState
            icon="GraduationCap"
            title="No exams published yet"
            description="Check back soon — new mock tests are added regularly."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mainExams.map((exam) => (
              <ExamCard
                key={exam.slug}
                exam={exam}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[var(--alo-brand)]">
              Not sure which test to take?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Talk to an ALO counselor — free 30-minute consultation, no commitment.
            </p>
          </div>
          <PublicLeadForm
            sourceTag="English tests listing page"
            title="Get your free mock & consultation"
            subtitle="Submit your details and an ALO counselor will reach out within 24 hours to recommend the right English test for you."
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exam card
// ---------------------------------------------------------------------------

function ExamCard({
  exam,
  onNavigate,
}: {
  exam: ExamListItem;
  onNavigate: (v: ViewKey, slug?: string) => void;
}) {
  const freeQuota = safeParse<ParsedFreeQuota>(exam.freeQuota, {});
  const pricing = safeParse<ParsedPricing>(exam.pricing, {});

  const freeBadge =
    freeQuota.aloStudents ||
    freeQuota.guestStudents ||
    pricing.free ||
    null;

  return (
    <Card className="group flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 transition-all hover:-translate-y-0.5 hover:border-[var(--alo-brand)]/40 hover:shadow-lg">
      <CardContent className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-[var(--alo-brand)]">{exam.name}</h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {exam.fullName}
            </p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
            <Icon name="GraduationCap" className="size-5" />
          </div>
        </div>

        {/* Intro */}
        <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{exam.intro}</p>

        {/* Free quota badge */}
        {freeBadge && (
          <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--alo-cta-soft)] px-3 py-1 text-xs font-semibold text-[var(--alo-cta)]">
            <Icon name="Gift" className="size-3.5" />
            {freeBadge}
          </div>
        )}

        {/* Pricing */}
        <div className="mt-3 space-y-1.5 text-xs">
          {pricing.free && (
            <div className="flex items-start gap-1.5">
              <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-crm-success-text" />
              <span className="text-foreground/80">
                <span className="font-semibold text-foreground">Free:</span> {pricing.free}
              </span>
            </div>
          )}
          {pricing.paid && (
            <div className="flex items-start gap-1.5">
              <Icon name="CreditCard" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
              <span className="text-foreground/80">
                <span className="font-semibold text-foreground">Paid:</span> {pricing.paid}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Icon name="ShieldCheck" className="size-3" />
            Verified {fmtDate(exam.lastVerifiedAt)}
          </span>
          <Button
            onClick={() => onNavigate("public-exam", exam.slug)}
            className="h-10 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
            size="sm"
          >
            <Icon name="Play" className="size-4" />
            Start Practicing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
export default PublicExams;
