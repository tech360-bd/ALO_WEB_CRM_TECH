"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, Search } from "lucide-react";

/**
 * FindYourPath — interactive question-driven discovery experience.
 *
 * Asks 4 questions (study field, destination, budget, intake) and surfaces
 * the existing real-data routes the user should explore based on their answers.
 *
 * CRITICAL: This component does NOT fabricate recommendations. It maps the
 * user's answers to real existing routes (/higher-study/courses?subject=...,
 * /higher-study/scholarships?country=..., etc.) and shows how many real
 * records exist for each. The counts come from the server via props.
 */

type Step = 0 | 1 | 2 | 3 | 4;

type FieldOption = { value: string; label: string; count: number; href: string };
type DestinationOption = { value: string; label: string; count: number; href: string };
type BudgetOption = { value: string; label: string; maxTuition: number };
type IntakeOption = { value: string; label: string; href: string };

type Props = {
  fields: FieldOption[];
  destinations: DestinationOption[];
  budgets: BudgetOption[];
  intakes: IntakeOption[];
};

export function FindYourPath({ fields, destinations, budgets, intakes }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [field, setField] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [intake, setIntake] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep(0);
    setField(null);
    setDestination(null);
    setBudget(null);
    setIntake(null);
  }, []);

  const selectedField = fields.find((f) => f.value === field);
  const selectedDestination = destinations.find((d) => d.value === destination);
  const selectedBudget = budgets.find((b) => b.value === budget);
  const selectedIntake = intakes.find((i) => i.value === intake);

  // Compute recommendation links from real existing routes
  const recommendedRoutes: { label: string; href: string; count?: number }[] = [];
  if (selectedField) {
    recommendedRoutes.push({
      label: `${selectedField.label} courses`,
      href: selectedField.href,
      count: selectedField.count,
    });
  }
  if (selectedDestination) {
    recommendedRoutes.push({
      label: `${selectedDestination.label} universities`,
      href: selectedDestination.href,
      count: selectedDestination.count,
    });
    recommendedRoutes.push({
      label: `${selectedDestination.label} scholarships`,
      href: `/higher-study/scholarships?country=${selectedDestination.value}`,
    });
  }
  if (selectedIntake) {
    recommendedRoutes.push({
      label: `${selectedIntake.label} intake`,
      href: selectedIntake.href,
    });
  }

  return (
    <section
      id="find-your-path"
      aria-label="Find your path"
      className="relative surface-ink py-20 lg:py-32"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="eyebrow-editorial text-white/60 mb-4 justify-center inline-block">
            Find Your Path
          </p>
          <h2 className="type-h2 text-white max-w-3xl mx-auto">
            Four questions.
            <br />
            <span className="italic font-serif" style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
              Your best-fit options.
            </span>
          </h2>
        </div>

        {/* Quiz card */}
        <div className="path-quiz bg-white/[0.04] border-white/10 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="type-meta text-white/50 mb-3">Question 1 of 4</p>
                <h3 className="path-quiz-question text-white">
                  What do you want to study?
                </h3>
                <div className="path-quiz-options">
                  {fields.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => {
                        setField(f.value);
                        setStep(1);
                      }}
                      className="path-quiz-option text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                      aria-pressed={field === f.value}
                    >
                      <span className="flex-1">{f.label}</span>
                      <span className="text-xs opacity-60 tabular">{f.count}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="type-meta text-white/50 mb-3">Question 2 of 4</p>
                <h3 className="path-quiz-question text-white">
                  Where do you want to study?
                </h3>
                <div className="path-quiz-options">
                  {destinations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => {
                        setDestination(d.value);
                        setStep(2);
                      }}
                      className="path-quiz-option text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                      aria-pressed={destination === d.value}
                    >
                      <span className="flex-1">{d.label}</span>
                      <span className="text-xs opacity-60 tabular">{d.count}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="type-meta text-white/50 mb-3">Question 3 of 4</p>
                <h3 className="path-quiz-question text-white">
                  What&apos;s your annual budget?
                </h3>
                <div className="path-quiz-options">
                  {budgets.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => {
                        setBudget(b.value);
                        setStep(3);
                      }}
                      className="path-quiz-option text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                      aria-pressed={budget === b.value}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="type-meta text-white/50 mb-3">Question 4 of 4</p>
                <h3 className="path-quiz-question text-white">
                  When do you want to start?
                </h3>
                <div className="path-quiz-options">
                  {intakes.map((i) => (
                    <button
                      key={i.value}
                      onClick={() => {
                        setIntake(i.value);
                        setStep(4);
                      }}
                      className="path-quiz-option text-white bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                      aria-pressed={intake === i.value}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <p className="type-meta text-white/50 mb-3">Your best-fit options</p>
                <h3 className="type-h3 text-white mb-2">
                  Here&apos;s where to start.
                </h3>
                <p className="text-sm text-white/70 mb-8 max-w-md">
                  Based on your answers, explore these real options from our database.
                  No fabricated recommendations — every link leads to real records.
                </p>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 mb-8 text-xs text-white/60">
                  <div>
                    <p className="type-meta text-white/40 mb-1">Field</p>
                    <p className="text-white/90">{selectedField?.label || "—"}</p>
                  </div>
                  <div>
                    <p className="type-meta text-white/40 mb-1">Destination</p>
                    <p className="text-white/90">{selectedDestination?.label || "—"}</p>
                  </div>
                  <div>
                    <p className="type-meta text-white/40 mb-1">Budget</p>
                    <p className="text-white/90">{selectedBudget?.label || "—"}</p>
                  </div>
                  <div>
                    <p className="type-meta text-white/40 mb-1">Intake</p>
                    <p className="text-white/90">{selectedIntake?.label || "—"}</p>
                  </div>
                </div>

                {/* Recommended routes */}
                <ul className="space-y-2">
                  {recommendedRoutes.map((r, i) => (
                    <li key={i}>
                      <Link
                        href={r.href}
                        className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 hover:border-white/30 transition-all focus-ring-premium"
                      >
                        <span className="text-sm text-white/90">{r.label}</span>
                        <span className="flex items-center gap-2 text-xs text-white/60">
                          {typeof r.count === "number" && (
                            <span className="tabular opacity-70">{r.count} records</span>
                          )}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-3 mt-8">
                  <Link
                    href="/higher-study/course-finder"
                    className="btn-editorial btn-editorial-primary"
                  >
                    <Search className="w-4 h-4" />
                    Open Course Finder
                  </Link>
                  <button
                    onClick={reset}
                    className="btn-editorial btn-editorial-ghost"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Start over
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-white/40" : "w-4 bg-white/15"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
