"use client";

/**
 * EligibilityCheckerForm — multi-step eligibility checker.
 *
 * 6 steps:
 *  1. Study level
 *  2. Country of interest
 *  3. Academic background
 *  4. English test status
 *  5. Work experience
 *  6. Budget range
 *
 * On completion: POST to `/api/v1/higher-study/eligibility-check`
 * and render matching universities / courses / scholarships returned
 * by the server.
 *
 * Each step has keyboard-accessible inputs (radio groups / selects /
 * sliders). The "Apply Through ALO Education" CTA appears on the
 * result step.
 */
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  GraduationCap,
  Globe2,
  BookOpen,
  Languages,
  Briefcase,
  DollarSign,
  Send,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import { ApplyCta } from "./apply-cta";
import { UniversityCard } from "./university-card";
import { CourseCard } from "./course-card";
import { ScholarshipCard } from "./scholarship-card";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";
import {
  STUDY_LEVEL_GROUPS,
  COUNTRIES_LIST,
  ENGLISH_TESTS,
} from "@/lib/higher-study/constants";
import type {
  University,
  Course,
  Scholarship,
} from "@/lib/higher-study/types";

interface FormState {
  studyLevel: string;
  countrySlug: string;
  qualification: string;
  gpa: string;
  field: string;
  hasEnglishTest: "yes" | "no" | "";
  englishTest: string;
  englishScore: string;
  workExperienceYears: string;
  budgetMin: number;
  budgetMax: number;
}

const INITIAL_STATE: FormState = {
  studyLevel: "",
  countrySlug: "",
  qualification: "",
  gpa: "",
  field: "",
  hasEnglishTest: "",
  englishTest: "",
  englishScore: "",
  workExperienceYears: "0",
  budgetMin: 0,
  budgetMax: 50000,
};

const STEPS = [
  { id: 1, label: "Study Level", icon: GraduationCap },
  { id: 2, label: "Country", icon: Globe2 },
  { id: 3, label: "Academic", icon: BookOpen },
  { id: 4, label: "English", icon: Languages },
  { id: 5, label: "Experience", icon: Briefcase },
  { id: 6, label: "Budget", icon: DollarSign },
] as const;

interface ResultData {
  universities: University[];
  courses: Course[];
  scholarships: Scholarship[];
  summary: string;
}

/**
 * Render the multi-step eligibility checker.
 */
export function EligibilityCheckerForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return Boolean(form.studyLevel);
      case 2: return Boolean(form.countrySlug);
      case 3: return Boolean(form.qualification && form.field);
      case 4: return form.hasEnglishTest !== "" &&
        (form.hasEnglishTest === "no" || (Boolean(form.englishTest) && Boolean(form.englishScore)));
      case 5: return true; // work experience is optional (default 0)
      case 6: return form.budgetMax > 0;
      default: return false;
    }
  }, [step, form]);

  const next = useCallback(() => {
    if (!canProceed) return;
    if (step < 6) {
      setStep(step + 1);
    } else {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit is stable via useCallback; including it would re-create next on every form change
  }, [canProceed, step]);

  const back = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/higher-study/eligibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { success: boolean; data?: ResultData; message?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Server error");
      }
      setResult(json.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch matches");
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  const restart = useCallback(() => {
    setForm(INITIAL_STATE);
    setStep(1);
    setResult(null);
    setError(null);
  }, []);

  // ── Result view ─────────────────────────────────────────────────
  if (result) {
    const totalMatches = result.universities.length + result.courses.length + result.scholarships.length;
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-extrabold text-ink-900">
                {totalMatches} match{totalMatches === 1 ? "" : "es"} found
              </h2>
              <p className="mt-1 text-sm text-ink-700">
                {result.summary || "Based on your profile, here are the most relevant opportunities we found."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ApplyCta
                  referralType="eligibility-check"
                  countrySlug={form.countrySlug || undefined}
                  studyLevel={form.studyLevel || undefined}
                  label="Apply Through ALO Education"
                  className="bg-orange-600 text-white shadow-orange hover:bg-orange-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={restart}
                  className="gap-1.5 rounded-xl border-ink-200"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Start over
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {result.universities.length > 0 && (
          <section>
            <h3 className="mb-3 font-display text-base font-extrabold text-ink-900">
              Matching universities ({result.universities.length})
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.universities.slice(0, 6).map((u) => (
                <UniversityCard key={u.id} university={u} />
              ))}
            </div>
          </section>
        )}

        {result.courses.length > 0 && (
          <section>
            <h3 className="mb-3 font-display text-base font-extrabold text-ink-900">
              Matching courses ({result.courses.length})
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.courses.slice(0, 6).map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}

        {result.scholarships.length > 0 && (
          <section>
            <h3 className="mb-3 font-display text-base font-extrabold text-ink-900">
              Matching scholarships ({result.scholarships.length})
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.scholarships.slice(0, 6).map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} />
              ))}
            </div>
          </section>
        )}

        {totalMatches === 0 && (
          <EmptyState
            title="No matches found"
            description="Try widening your criteria — increase your budget range, consider a different country, or check the English test score requirements."
            icon={AlertCircle}
            action={{
              label: "Start over",
              onClick: restart,
            }}
          />
        )}

        <p className="rounded-xl bg-ink-50 p-4 text-xs text-ink-600">
          <strong className="font-semibold text-ink-700">Disclaimer:</strong>{" "}
          These matches are based on the information you provided and our
          database of published university, course and scholarship data. Final
          eligibility is determined by the admitting institution. Always verify
          requirements on the official university or scholarship page before
          applying.
        </p>
      </div>
    );
  }

  // ── Form view ───────────────────────────────────────────────────
  return (
    <Card className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft sm:p-8">
      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap items-center gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-colors",
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-blue"
                    : isDone
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-ink-200 bg-white text-ink-400",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:inline",
                  isActive ? "text-ink-900" : "text-ink-500",
                )}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-6 sm:w-10",
                    isDone ? "bg-emerald-300" : "bg-ink-200",
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="min-h-[260px]">
        {/* Step 1: Study Level */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              What do you want to study?
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Choose the study level you're targeting. You can change this later.
            </p>
            <div className="mt-5 space-y-4">
              {STUDY_LEVEL_GROUPS.map((group) => (
                <div key={group.id}>
                  <div className="eyebrow text-blue-600">{group.label}</div>
                  <p className="mt-0.5 text-xs text-ink-500">{group.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.values.map((v) => {
                      const label =
                        STUDY_LEVEL_GROUPS
                          .flatMap((g) => g.values.includes(v) ? [{ v, g }] : [])
                          .find((x) => x.v === v);
                      void label;
                      const opt = (
                        STUDY_LEVEL_LOOKUP[v] ?? v
                      );
                      const isSelected = form.studyLevel === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => update("studyLevel", v)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white shadow-blue"
                              : "border-ink-200 bg-white text-ink-700 hover:border-blue-200 hover:bg-blue-50",
                          )}
                          aria-pressed={isSelected}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Country */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              Where do you want to study?
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Pick a country to focus your matches. You can leave it broad if unsure.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {COUNTRIES_LIST.map((c) => {
                const isSelected = form.countrySlug === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => update("countrySlug", c.slug)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-blue"
                        : "border-ink-200 bg-white hover:border-blue-200 hover:bg-blue-50/50",
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="text-2xl" aria-hidden="true">{c.flagEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900">{c.name}</p>
                      <p className="text-xs text-ink-500">{c.region}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Academic background */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              Your academic background
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Tell us about your highest qualification so far.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="qualification" className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                  Highest qualification
                </Label>
                <Select
                  value={form.qualification || "__none__"}
                  onValueChange={(v) => update("qualification", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="qualification" className="mt-1.5 h-11 rounded-xl border-ink-200">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select —</SelectItem>
                    <SelectItem value="secondary">Secondary / High School</SelectItem>
                    <SelectItem value="foundation">Foundation / Pathway</SelectItem>
                    <SelectItem value="diploma">Diploma / HND</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="mphil">MPhil / MRes</SelectItem>
                    <SelectItem value="phd">PhD / Doctorate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gpa" className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                    GPA / Grade (optional)
                  </Label>
                  <Input
                    id="gpa"
                    value={form.gpa}
                    onChange={(e) => update("gpa", e.target.value)}
                    placeholder="e.g. 3.6 / 4.0 or 78%"
                    className="mt-1.5 h-11 rounded-xl border-ink-200"
                  />
                </div>
                <div>
                  <Label htmlFor="field" className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                    Field of study
                  </Label>
                  <Input
                    id="field"
                    value={form.field}
                    onChange={(e) => update("field", e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="mt-1.5 h-11 rounded-xl border-ink-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: English test */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              English proficiency
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Most universities require an IELTS, PTE or TOEFL score. Tell us your status.
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => update("hasEnglishTest", v)}
                    className={cn(
                      "flex-1 rounded-xl border p-3 text-sm font-semibold transition-all",
                      form.hasEnglishTest === v
                        ? "border-blue-600 bg-blue-600 text-white shadow-blue"
                        : "border-ink-200 bg-white text-ink-700 hover:border-blue-200",
                    )}
                    aria-pressed={form.hasEnglishTest === v}
                  >
                    {v === "yes" ? "I have a score" : "Not yet"}
                  </button>
                ))}
              </div>
              {form.hasEnglishTest === "yes" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="englishTest" className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                      Test taken
                    </Label>
                    <Select
                      value={form.englishTest || "__none__"}
                      onValueChange={(v) => update("englishTest", v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger id="englishTest" className="mt-1.5 h-11 rounded-xl border-ink-200">
                        <SelectValue placeholder="Select test" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Select —</SelectItem>
                        {ENGLISH_TESTS.map((t) => (
                          <SelectItem key={t.slug} value={t.slug}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="englishScore" className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                      Overall score
                    </Label>
                    <Input
                      id="englishScore"
                      value={form.englishScore}
                      onChange={(e) => update("englishScore", e.target.value)}
                      placeholder="e.g. 7.0"
                      className="mt-1.5 h-11 rounded-xl border-ink-200"
                    />
                  </div>
                </div>
              )}
              {form.hasEnglishTest === "no" && (
                <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                  <p>
                    No problem — we&apos;ll include universities that offer
                    English-language support or pre-sessional English courses.
                    You may also want to check out the{" "}
                    <Link href="https://english.aloeducation.com" className="font-semibold underline">
                      ALO English Learning platform
                    </Link>{" "}
                    to prepare.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Work experience */}
        {step === 5 && (
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              Work experience
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Required for some MBA, Executive and professional programmes.
            </p>
            <div className="mt-5">
              <Label htmlFor="workExperience" className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                Years of relevant work experience
              </Label>
              <Input
                id="workExperience"
                type="number"
                min="0"
                max="40"
                value={form.workExperienceYears}
                onChange={(e) => update("workExperienceYears", e.target.value)}
                className="mt-1.5 h-11 w-32 rounded-xl border-ink-200"
              />
              <p className="mt-2 text-xs text-ink-500">
                Round to the nearest whole year. Internships count.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Budget */}
        {step === 6 && (
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">
              Your annual budget (USD)
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Include tuition + living costs. We&apos;ll match opportunities within reach.
            </p>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-700">
                  ${form.budgetMin.toLocaleString()}
                </span>
                <span className="font-bold text-blue-700">
                  ${form.budgetMin.toLocaleString()} – ${form.budgetMax.toLocaleString()}
                </span>
                <span className="font-semibold text-ink-700">
                  {form.budgetMax >= 100000 ? "$100k+" : `$${form.budgetMax.toLocaleString()}`}
                </span>
              </div>
              <Slider
                value={[form.budgetMin, form.budgetMax]}
                min={0}
                max={100000}
                step={1000}
                onValueChange={(v) => {
                  const [a, b] = v as unknown as number[];
                  update("budgetMin", a);
                  update("budgetMax", b);
                }}
                className="mt-3"
                aria-label="Budget range"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "Under $10k", min: 0, max: 10000 },
                  { label: "$10k – $25k", min: 10000, max: 25000 },
                  { label: "$25k – $50k", min: 25000, max: 50000 },
                  { label: "$50k+", min: 50000, max: 100000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      update("budgetMin", preset.min);
                      update("budgetMax", preset.max);
                    }}
                    className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:border-blue-200 hover:bg-blue-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Couldn&apos;t fetch matches</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink-100 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={back}
          disabled={step === 1}
          className="gap-1.5 rounded-xl text-ink-700"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <Badge variant="outline" className="border-ink-200 bg-ink-50 text-ink-600">
            Step {step} of 6
          </Badge>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={next}
          disabled={!canProceed || submitting}
          className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Matching…
            </>
          ) : step === 6 ? (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              See my matches
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

// ── Helper: study level value → label ──────────────────────────────
const STUDY_LEVEL_LOOKUP: Record<string, string> = Object.fromEntries(
  STUDY_LEVEL_GROUPS.flatMap((g) =>
    g.values.map((v) => [v, v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())]),
  ),
);
