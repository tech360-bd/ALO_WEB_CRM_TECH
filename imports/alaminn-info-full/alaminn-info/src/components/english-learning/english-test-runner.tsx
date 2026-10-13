"use client";

/**
 * EnglishTestRunner — interactive practice-test runner.
 *
 * Flow:
 *  1. On mount, fetch `/api/v1/english-learning/practice-tests/[slug]`
 *     to load questions (correctAnswer is null on the client).
 *  2. Render one question at a time with a per-test timer.
 *  3. On submit (or timer expiry), POST answers to
 *     `/api/v1/english-learning/practice-tests/[slug]/submit` and
 *     render the score + per-question correct answers + explanations.
 *
 * The component is intentionally self-contained (no external state) —
 * it generates an anonymous sessionId on first mount if none is passed.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Trophy,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  questionType: string;
  questionText: string;
  options?: string[] | null;
  points: number;
  orderIndex: number;
  skillArea: string;
}

interface TestDetail {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  testType: string;
  durationMinutes?: number | null;
  totalQuestions: number;
  passingScore?: number | null;
  questions: Question[];
}

interface ResultItem {
  questionId: string;
  correct: boolean;
  correctAnswer: string | null;
  explanation: string | null;
  pointsAwarded: number;
}

interface SubmitResponse {
  test: { id: string; slug: string; title: string; passingScore?: number | null };
  scorePercent: number;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean | null;
  results: ResultItem[];
}

type Phase = "loading" | "intro" | "running" | "submitting" | "results" | "error";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "alaminn-el-session";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export interface EnglishTestRunnerProps {
  slug: string;
  className?: string;
}

export function EnglishTestRunner({ slug, className }: EnglishTestRunnerProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [test, setTest] = useState<TestDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [submitTriggered, setSubmitTriggered] = useState(false);
  const sessionIdRef = useRef<string>("");

  // Load the test on mount.
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/english-learning/practice-tests/${encodeURIComponent(slug)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json?.success || !json.data) {
          throw new Error(json?.message ?? "Could not load practice test.");
        }
        const t = json.data as TestDetail;
        if (!t.questions || t.questions.length === 0) {
          throw new Error("This practice test has no questions yet.");
        }
        setTest(t);
        setSecondsLeft((t.durationMinutes ?? 30) * 60);
        setPhase("intro");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Unknown error.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Countdown timer.
  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSubmit is stable via useCallback but adding it would re-trigger the timer every render
  }, [phase, secondsLeft]);

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!test) return;
    setSubmitTriggered(true);
    setPhase("submitting");
    try {
      const res = await fetch(
        `/api/v1/english-learning/practice-tests/${encodeURIComponent(slug)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            answers: Object.entries(answers).map(([questionId, answer]) => ({
              questionId,
              answer,
            })),
          }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.data) {
        throw new Error(json?.message ?? "Submission failed.");
      }
      setSubmitResult(json.data as SubmitResponse);
      setPhase("results");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error.");
      setPhase("error");
    }
  }, [test, slug, answers]);

  const handleRestart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmitResult(null);
    setSubmitTriggered(false);
    if (test) setSecondsLeft((test.durationMinutes ?? 30) * 60);
    setPhase("intro");
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-ink-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Loading test…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
          <h3 className="mt-3 font-display text-lg font-bold text-ink-900">
            Could not load test
          </h3>
          <p className="mt-1 text-sm text-ink-600">{errorMsg}</p>
        </Card>
      </div>
    );
  }

  // Intro screen
  if (phase === "intro" && test) {
    return (
      <Card className={cn("mx-auto max-w-2xl p-6 sm:p-8", className)}>
        <div className="text-center">
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-wider text-purple-700"
          >
            {test.testType}
          </Badge>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-ink-900">
            {test.title}
          </h2>
          {test.description && (
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              {test.description}
            </p>
          )}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat label="Questions" value={String(test.questions.length)} />
          <Stat
            label="Time"
            value={`${test.durationMinutes ?? 30} min`}
          />
          <Stat
            label="Pass"
            value={test.passingScore != null ? `${test.passingScore}%` : "—"}
          />
        </div>
        <ul className="mt-6 space-y-2 text-sm text-ink-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>Each question shows its correct answer + explanation after submission.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>You can navigate back and forth; answers are saved automatically.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>The test auto-submits when the timer reaches zero.</span>
          </li>
        </ul>
        <Button
          type="button"
          onClick={() => setPhase("running")}
          className="mt-6 w-full gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-700"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Start Test
        </Button>
      </Card>
    );
  }

  // Results screen
  if (phase === "results" && submitResult && test) {
    const { scorePercent, earnedPoints, totalPoints, passed, results } =
      submitResult;
    return (
      <div className={cn("mx-auto max-w-3xl space-y-5", className)}>
        <Card
          className={cn(
            "p-6 text-center",
            passed === true && "border-emerald-200 bg-emerald-50",
            passed === false && "border-amber-200 bg-amber-50",
          )}
        >
          <Trophy
            className={cn(
              "mx-auto h-12 w-12",
              passed === true ? "text-emerald-600" : "text-amber-600",
            )}
            aria-hidden="true"
          />
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900">
            {scorePercent}%
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            {earnedPoints} / {totalPoints} points ·{" "}
            {passed === true
              ? "You passed!"
              : passed === false
                ? "Below passing score — keep practising."
                : "Test complete."}
          </p>
          <Button
            type="button"
            onClick={handleRestart}
            variant="outline"
            className="mt-4 gap-1.5 rounded-xl"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retake test
          </Button>
        </Card>

        <div className="space-y-3">
          {test.questions.map((q, idx) => {
            const r = results.find((rr) => rr.questionId === q.id);
            const userAnswer = answers[q.id] ?? "(no answer)";
            return (
              <Card
                key={q.id}
                className={cn(
                  "p-5",
                  r?.correct
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-red-200 bg-red-50/40",
                )}
              >
                <div className="flex items-start gap-3">
                  {r?.correct ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      Q{idx + 1} · {q.skillArea} · {q.points} pt
                    </div>
                    <p className="mt-1 text-sm font-semibold text-ink-900">
                      {q.questionText}
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="text-ink-600">
                        <span className="font-semibold">Your answer:</span>{" "}
                        {userAnswer || "(no answer)"}
                      </div>
                      {!r?.correct && r?.correctAnswer && (
                        <div className="text-emerald-700">
                          <span className="font-semibold">Correct:</span>{" "}
                          {r.correctAnswer}
                        </div>
                      )}
                      {r?.explanation && (
                        <div className="mt-2 rounded-lg border border-ink-200 bg-white p-2 text-ink-700">
                          <span className="font-semibold">Explanation:</span>{" "}
                          {r.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Running — render one question at a time
  if (phase === "running" && test) {
    const q = test.questions[currentIdx];
    const total = test.questions.length;
    const progressPct = ((currentIdx + 1) / total) * 100;
    const answeredCount = Object.keys(answers).length;
    const mm = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const ss = (secondsLeft % 60).toString().padStart(2, "0");
    const options = Array.isArray(q.options) ? (q.options as string[]) : [];
    // True when the test is being submitted (set when handleSubmit fires).
    const isSubmitting = submitTriggered;

    return (
      <div className={cn("mx-auto max-w-3xl space-y-5", className)}>
        {/* Top bar: timer + progress */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Clock
              className={cn(
                "h-5 w-5",
                secondsLeft < 60 ? "text-red-600" : "text-ink-500",
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "font-mono text-lg font-bold tabular-nums",
                secondsLeft < 60 ? "text-red-600" : "text-ink-900",
              )}
            >
              {mm}:{ss}
            </span>
          </div>
          <div className="flex-1 text-right">
            <div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
              Question {currentIdx + 1} of {total}
            </div>
            <div className="text-[11px] text-ink-500">
              {answeredCount} answered
            </div>
          </div>
        </div>

        <Progress value={progressPct} className="h-1.5" />

        {/* Question card */}
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-bold uppercase tracking-wider text-blue-700"
            >
              {q.skillArea}
            </Badge>
            <Badge
              variant="outline"
              className="border-ink-200 bg-ink-50 text-[10px] font-bold uppercase tracking-wider text-ink-600"
            >
              {q.questionType}
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
            >
              {q.points} pt
            </Badge>
          </div>

          <h3 className="mt-3 font-display text-lg font-bold text-ink-900">
            {q.questionText}
          </h3>

          <div className="mt-5">
            {q.questionType === "multiple-choice" && options.length > 0 ? (
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) => handleAnswer(q.id, v)}
                className="space-y-2"
              >
                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={opt}
                      className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 hover:bg-blue-50"
                    >
                      <RadioGroupItem
                        id={`q-${q.id}-${idx}`}
                        value={letter}
                      />
                      <Label
                        htmlFor={`q-${q.id}-${idx}`}
                        className="flex-1 cursor-pointer text-sm font-medium text-ink-800"
                      >
                        <span className="mr-2 font-bold text-blue-700">
                          {letter}.
                        </span>
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            ) : q.questionType === "true-false" ? (
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) => handleAnswer(q.id, v)}
                className="grid grid-cols-2 gap-2"
              >
                {["true", "false"].map((v) => (
                  <div
                    key={v}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 hover:bg-blue-50"
                  >
                    <RadioGroupItem id={`q-${q.id}-${v}`} value={v} />
                    <Label
                      htmlFor={`q-${q.id}-${v}`}
                      className="flex-1 cursor-pointer text-sm font-medium capitalize text-ink-800"
                    >
                      {v}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : q.questionType === "short-answer" ? (
              <Input
                value={answers[q.id] ?? ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                placeholder="Type your answer…"
                className="h-11 rounded-xl border-ink-200"
              />
            ) : q.questionType === "essay" ? (
              <Textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                placeholder="Write your essay response…"
                rows={6}
                className="rounded-xl border-ink-200"
              />
            ) : (
              <Input
                value={answers[q.id] ?? ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                placeholder="Type your answer…"
                className="h-11 rounded-xl border-ink-200"
              />
            )}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="gap-1.5 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>

          {currentIdx === total - 1 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit test
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
              className="gap-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Submitting
  return (
    <div className="flex items-center justify-center py-20 text-ink-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
      Submitting test…
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-bold text-ink-900">
        {value}
      </div>
    </div>
  );
}
