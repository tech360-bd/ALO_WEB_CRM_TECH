"use client";

/**
 * EligibilityQuiz — interactive 10-question English-level assessment
 * quiz. Recommends a course level based on the user's answers.
 *
 * Pure client component — no PII is collected, no API call is made
 * (the recommendation is computed locally).
 */
import { useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { COURSE_LEVEL_MAP } from "@/lib/english-learning/constants";

interface Question {
  id: number;
  skill: "grammar" | "vocab" | "reading" | "listening";
  question: string;
  options: string[];
  correct: string; // letter "A" | "B" | "C" | "D"
  level: "beginner" | "intermediate" | "advanced";
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    skill: "grammar",
    level: "beginner",
    question: "Choose the correct sentence:",
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      "She not like coffee.",
    ],
    correct: "C",
  },
  {
    id: 2,
    skill: "vocab",
    level: "beginner",
    question: "What is the opposite of 'happy'?",
    options: ["Glad", "Sad", "Angry", "Tired"],
    correct: "B",
  },
  {
    id: 3,
    skill: "grammar",
    level: "beginner",
    question: "I _____ to the gym every morning.",
    options: ["go", "goes", "going", "gone"],
    correct: "A",
  },
  {
    id: 4,
    skill: "reading",
    level: "intermediate",
    question:
      "Read: 'Despite the rain, the match continued.' What does 'despite' mean?",
    options: ["Because of", "In spite of", "Instead of", "Due to"],
    correct: "B",
  },
  {
    id: 5,
    skill: "vocab",
    level: "intermediate",
    question: "Choose the synonym for 'meticulous':",
    options: ["Careless", "Careful", "Quick", "Lazy"],
    correct: "B",
  },
  {
    id: 6,
    skill: "grammar",
    level: "intermediate",
    question: "If I _____ rich, I would travel the world.",
    options: ["am", "was", "were", "be"],
    correct: "C",
  },
  {
    id: 7,
    skill: "reading",
    level: "advanced",
    question:
      "Read: 'His argument was tantamount to admitting defeat.' What does 'tantamount' mean?",
    options: ["Different from", "Equivalent to", "Opposed to", "Superior to"],
    correct: "B",
  },
  {
    id: 8,
    skill: "vocab",
    level: "advanced",
    question: "Choose the word that means 'to make less severe':",
    options: ["Exacerbate", "Mitigate", "Aggravate", "Intensify"],
    correct: "B",
  },
  {
    id: 9,
    skill: "grammar",
    level: "advanced",
    question: "Hardly _____ when the phone rang.",
    options: [
      "I had sat down",
      "had I sat down",
      "I sat down",
      "did I sit down",
    ],
    correct: "B",
  },
  {
    id: 10,
    skill: "listening",
    level: "intermediate",
    question:
      "In academic lectures, 'to elaborate on' most commonly means:",
    options: [
      "To skip over",
      "To explain in more detail",
      "To disagree with",
      "To summarise briefly",
    ],
    correct: "B",
  },
];

interface Result {
  level: string;
  reason: string;
}

function recommendLevel(correctByLevel: Record<string, number>): Result {
  const beg = correctByLevel.beginner ?? 0;
  const int = correctByLevel.intermediate ?? 0;
  const adv = correctByLevel.advanced ?? 0;
  const total = beg + int + adv;

  // Determine threshold-based recommendation.
  if (beg < 2) {
    return {
      level: "beginner",
      reason:
        "Your grammar and vocabulary fundamentals need strengthening. Start with our Beginner course to build a solid foundation.",
    };
  }
  if (int < 2) {
    return {
      level: "intermediate",
      reason:
        "You have a good grasp of basics but would benefit from intermediate grammar, vocabulary and academic register practice.",
    };
  }
  if (adv < 2) {
    return {
      level: "advanced",
      reason:
        "Strong intermediate skills. Move to Advanced to refine nuance, idioms and academic writing before test prep.",
    };
  }
  // All levels passed → suggest a test prep course based on overall score.
  if (total >= 9) {
    return {
      level: "ielts",
      reason:
        "Excellent! You're ready for test prep. We recommend IELTS Prep (band 7.0+) — most widely accepted by UK/EU universities.",
    };
  }
  if (total >= 7) {
    return {
      level: "toefl",
      reason:
        "Strong command of English. Consider TOEFL iBT Prep (score 90+) — preferred by US and Canadian universities.",
    };
  }
  return {
    level: "pte",
    reason:
      "Good overall English. PTE Academic offers fast results and is accepted globally — a solid choice for your level.",
  };
}

export function EligibilityQuiz() {
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 = intro screen
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const start = () => {
    setAnswers({});
    setShowResult(false);
    setCurrentIdx(0);
  };

  const restart = () => {
    setAnswers({});
    setShowResult(false);
    setCurrentIdx(-1);
  };

  const handleAnswer = (qid: number, letter: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: letter }));
  };

  const next = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowResult(true);
    }
  };

  // Intro screen
  if (currentIdx === -1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card className="p-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
            <ListChecks className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink-900">
            English Level Check
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            10 questions · 5 minutes · instant recommendation. No email or
            signup required.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
              <div className="font-display text-lg font-bold text-ink-900">10</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Questions
              </div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
              <div className="font-display text-lg font-bold text-ink-900">~5</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Minutes
              </div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
              <div className="font-display text-lg font-bold text-ink-900">9</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Levels
              </div>
            </div>
          </div>
          <Button
            type="button"
            onClick={start}
            className="mt-6 w-full gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-700"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Start the check
          </Button>
        </Card>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const correctByLevel: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };
    let correct = 0;
    for (const q of QUESTIONS) {
      if (answers[q.id] === q.correct) {
        correct += 1;
        correctByLevel[q.level] = (correctByLevel[q.level] ?? 0) + 1;
      }
    }
    const result = recommendLevel(correctByLevel);
    const levelInfo = COURSE_LEVEL_MAP[result.level];
    const scorePercent = Math.round((correct / QUESTIONS.length) * 100);

    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Card className="p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900">
            Your level: {levelInfo?.label ?? result.level}
          </h1>
          <p className="mt-1 text-3xl font-extrabold text-purple-600">
            {scorePercent}%
          </p>
          <p className="mt-3 text-sm text-ink-700">{result.reason}</p>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <div className="font-display text-lg font-bold text-emerald-700">
                {correctByLevel.beginner}/3
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Beginner
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <div className="font-display text-lg font-bold text-blue-700">
                {correctByLevel.intermediate}/4
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Intermediate
              </div>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
              <div className="font-display text-lg font-bold text-purple-700">
                {correctByLevel.advanced}/3
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Advanced
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            >
              <Link href={`/english-learning/courses?level=${result.level}`}>
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Browse {levelInfo?.label ?? result.level} courses
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={restart}
              className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retake
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Quiz screen
  const q = QUESTIONS[currentIdx];
  const progress = ((currentIdx + 1) / QUESTIONS.length) * 100;
  const selected = answers[q.id];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Badge
          variant="outline"
          className="border-purple-200 bg-purple-50 text-[11px] font-bold uppercase tracking-wider text-purple-700"
        >
          Question {currentIdx + 1} of {QUESTIONS.length}
        </Badge>
        <Badge
          variant="outline"
          className="border-ink-200 bg-ink-50 text-[11px] font-bold uppercase tracking-wider text-ink-600"
        >
          {q.skill} · {q.level}
        </Badge>
      </div>
      <Progress value={progress} className="mb-6 h-1.5" />

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink-900">
          {q.question}
        </h2>

        <RadioGroup
          value={selected ?? ""}
          onValueChange={(v) => handleAnswer(q.id, v)}
          className="mt-5 space-y-2"
        >
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            return (
              <div
                key={letter}
                className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 hover:bg-purple-50"
              >
                <RadioGroupItem id={`q-${q.id}-${idx}`} value={letter} />
                <Label
                  htmlFor={`q-${q.id}-${idx}`}
                  className="flex-1 cursor-pointer text-sm font-medium text-ink-800"
                >
                  <span className="mr-2 font-bold text-purple-700">
                    {letter}.
                  </span>
                  {opt}
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="gap-1.5 rounded-xl border-ink-200 text-ink-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <Button
            type="button"
            onClick={next}
            disabled={!selected}
            className="gap-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
          >
            {currentIdx === QUESTIONS.length - 1 ? "See my level" : "Next"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
