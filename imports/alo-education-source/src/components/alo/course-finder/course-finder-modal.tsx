'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Award,
  Brain,
  Check,
  Search,
  Sparkles,
  ExternalLink,
  Globe,
  Calendar,
  Languages,
  PoundSterling,
  Target,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface Selections {
  studyLevel: string | null;
  subjects: string[];
  destination: string | null;
  intake: string | null;
  englishTest: string | null;
  englishScore: string | null;
  noTest: boolean;
  budget: string | null;
  careerGoal: string | null;
}

const TOTAL_STEPS = 8;

const STEPS_LABELS: Record<number, string> = {
  1: 'Study Level',
  2: 'Subject Area',
  3: 'Destination',
  4: 'Intake',
  5: 'English Proficiency',
  6: 'Budget',
  7: 'Career Goal',
  8: 'Your AI Matches',
};

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */

const STUDY_LEVELS = [
  { id: 'foundation', label: 'Foundation', desc: 'Pre-university pathway', icon: GraduationCap },
  { id: 'undergraduate', label: 'Undergraduate', desc: "Bachelor's degree (3-4 years)", icon: BookOpen },
  { id: 'masters', label: 'Masters', desc: 'Postgraduate degree (1-2 years)', icon: Award },
  { id: 'phd', label: 'PhD', desc: 'Research degree (3-4 years)', icon: Brain },
];

const SUBJECTS = [
  'Business & Management',
  'Computer Science & IT',
  'Engineering',
  'Data Science & Analytics',
  'Medicine & Health',
  'Law',
  'Architecture & Design',
  'Finance & Accounting',
  'Marketing & Media',
  'Psychology',
  'Environmental Science',
  'Education',
];

const DESTINATIONS = [
  { id: 'uk', flag: '🇬🇧', name: 'United Kingdom' },
  { id: 'usa', flag: '🇺🇸', name: 'United States' },
  { id: 'canada', flag: '🇨🇦', name: 'Canada' },
  { id: 'australia', flag: '🇦🇺', name: 'Australia' },
  { id: 'newzealand', flag: '🇳🇿', name: 'New Zealand' },
  { id: 'ireland', flag: '🇮🇪', name: 'Ireland' },
  { id: 'germany', flag: '🇩🇪', name: 'Germany' },
];

const INTAKES = [
  { id: 'sep2025', label: 'September 2025', badge: 'Primary intake' },
  { id: 'jan2026', label: 'January 2026', badge: 'Secondary intake' },
  { id: 'sep2026', label: 'September 2026', badge: 'Primary intake' },
];

const IELTS_SCORES = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0+'];

const BUDGETS = [
  { id: 'under15', label: 'Under £15,000/year', icon: '💰' },
  { id: '15to25', label: '£15,000 – £25,000/year', icon: '💰' },
  { id: '25to35', label: '£25,000 – £35,000/year', icon: '💰' },
  { id: '35plus', label: '£35,000+/year (no limit)', icon: '💎' },
];

const CAREER_GOALS = [
  { id: 'tech', label: 'Tech & Software', icon: '💻' },
  { id: 'business', label: 'Business & Consulting', icon: '📊' },
  { id: 'healthcare', label: 'Healthcare & Medicine', icon: '🏥' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️' },
  { id: 'finance', label: 'Finance & Banking', icon: '🏦' },
  { id: 'creative', label: 'Creative & Design', icon: '🎨' },
];

interface AIResult {
  name: string;
  university: string;
  match: number;
  tuition: string;
  duration?: string;
  city?: string;
  scholarship?: string;
  reason?: string;
}

const DEFAULT_RESULTS: AIResult[] = [
  { name: 'MSc Data Science', university: 'University of Birmingham', match: 94, tuition: '£24,000/year', duration: '1 year', city: 'Birmingham', scholarship: 'Available: £5,000 Global Excellence Scholarship', reason: 'Strong match for your academic profile and career goals' },
  { name: 'MSc Artificial Intelligence', university: 'University of Manchester', match: 91, tuition: '£27,000/year', duration: '1 year', city: 'Manchester', scholarship: 'Available: £4,000 Manchester Global Scholarship', reason: 'Excellent research reputation in your field' },
  { name: 'MSc Business Analytics', university: 'Aston University', match: 88, tuition: '£21,500/year', duration: '1 year', city: 'Birmingham', scholarship: 'Available: £3,000 Aston Global Scholarship', reason: 'Great value with strong industry connections' },
];

/* ================================================================== */
/*  Animation Helpers                                                  */
/* ================================================================== */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const fadeStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeStaggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ================================================================== */
/*  Default Selections                                                 */
/* ================================================================== */

function getDefaultSelections(): Selections {
  return {
    studyLevel: null,
    subjects: [],
    destination: null,
    intake: null,
    englishTest: 'IELTS Academic',
    englishScore: null,
    noTest: false,
    budget: null,
    careerGoal: null,
  };
}

/* ================================================================== */
/*  Main Export — Thin wrapper                                         */
/* ================================================================== */

export function CourseFinderModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[95vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">AI Course Finder</DialogTitle>
        <DialogDescription className="sr-only">Multi-step wizard to find your perfect course</DialogDescription>
        {/* Key forces remount on open so state resets naturally */}
        {open && <Wizard key={String(open)} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  Wizard — All state lives here (mounts fresh each time Dialog opens) */
/* ================================================================== */

function Wizard({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [selections, setSelections] = useState<Selections>(getDefaultSelections);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [aiResults, setAiResults] = useState<AIResult[]>(DEFAULT_RESULTS);
  const [aiError, setAiError] = useState('');

  /* Timer ref for search delay */
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Navigation ────────────────────────────────────────────── */
  const goNext = useCallback(async () => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next === 8) {
        setShowResults(false);
        setIsSearching(true);
        setAiError('');
        try {
          const res = await fetch('/api/ai/course-finder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selections),
          });
          const data = await res.json();
          if (data.success && data.results?.length) {
            setAiResults(data.results);
          } else {
            setAiResults(DEFAULT_RESULTS);
            if (data.error) setAiError(data.error);
          }
        } catch {
          setAiResults(DEFAULT_RESULTS);
          setAiError('Network error — showing recommended courses');
        }
        setIsSearching(false);
        setShowResults(true);
      }
    }
  }, [currentStep, selections]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const startOver = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setDirection(0);
    setCurrentStep(1);
    setSelections(getDefaultSelections());
    setShowResults(false);
    setIsSearching(false);
  }, []);


  /* ── Validation ────────────────────────────────────────────── */
  const isValid = (): boolean => {
    switch (currentStep) {
      case 1: return selections.studyLevel !== null;
      case 2: return selections.subjects.length > 0;
      case 3: return selections.destination !== null;
      case 4: return selections.intake !== null;
      case 5: return selections.noTest || selections.englishScore !== null;
      case 6: return selections.budget !== null;
      case 7: return selections.careerGoal !== null;
      case 8: return true;
      default: return false;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS;
  const isFirstStep = currentStep === 1;
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  /* ── Helper: update selections ────────────────────────────── */
  const update = <K extends keyof Selections>(key: K, value: Selections[K]) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Step content renderer ─────────────────────────────────── */
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepStudyLevel selections={selections} update={update} />;
      case 2: return <StepSubjectArea selections={selections} update={update} />;
      case 3: return <StepDestination selections={selections} update={update} />;
      case 4: return <StepIntake selections={selections} update={update} />;
      case 5: return <StepEnglishProficiency selections={selections} update={update} />;
      case 6: return <StepBudget selections={selections} update={update} />;
      case 7: return <StepCareerGoal selections={selections} update={update} />;
      case 8: return <StepReview selections={selections} isSearching={isSearching} showResults={showResults} />;
      default: return null;
    }
  };

  return (
    <>
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-col border-b border-alo-gray-medium/60">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-alo-blue text-sm font-extrabold text-white">
              A
            </div>
            <h2 className="text-lg font-bold text-alo-black">AI Course Finder</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-alo-gray transition-colors hover:bg-alo-gray-light hover:text-alo-black"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-alo-gray-light">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0066CC, #0088FF)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-6 pb-3 pt-2">
          <p className="text-xs font-medium text-alo-gray">
            Step {currentStep} of {TOTAL_STEPS} · {STEPS_LABELS[currentStep]}
          </p>
        </div>
      </div>

      {/* ── STEP CONTENT ──────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 overflow-y-auto px-6 py-6 alo-scrollbar"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FOOTER / NAVIGATION ───────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-t border-alo-gray-medium/60 px-6 py-4">
        <div>
          {!isFirstStep && !isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              className="gap-2 text-sm font-medium text-alo-gray hover:text-alo-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={startOver}
              className="gap-2 text-sm font-medium text-alo-gray hover:text-alo-black"
            >
              <RefreshCw className="h-4 w-4" />
              Start Over
            </Button>
          )}
        </div>
        <div>
          {!isLastStep && (
            <Button
              type="button"
              disabled={!isValid()}
              onClick={goNext}
              className="gap-2 rounded-xl bg-alo-orange px-6 font-bold text-white shadow-lg shadow-alo-orange/25 transition-all duration-200 hover:bg-alo-orange-dark hover:shadow-xl hover:shadow-alo-orange/35 disabled:opacity-40 disabled:shadow-none"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {isLastStep && showResults && (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="gap-2 rounded-xl bg-alo-orange px-6 font-bold text-white shadow-lg shadow-alo-orange/25 transition-all duration-200 hover:bg-alo-orange-dark hover:shadow-xl hover:shadow-alo-orange/35"
            >
              <Save className="h-4 w-4" />
              Save My Preferences
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/*  STEP 1 — Study Level                                               */
/* ================================================================== */

function StepStudyLevel({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        What do you want to study?
      </h3>
      <p className="mt-2 text-sm text-alo-gray">Select your current or target study level</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STUDY_LEVELS.map((level) => {
          const selected = selections.studyLevel === level.id;
          const Icon = level.icon;
          return (
            <motion.button
              key={level.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => update('studyLevel', level.id)}
              className={`relative flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                selected
                  ? 'border-alo-blue bg-alo-blue-light shadow-md shadow-alo-blue/10'
                  : 'border-alo-gray-medium/60 bg-white hover:border-alo-blue/40 hover:shadow-sm'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  selected ? 'bg-alo-blue text-white' : 'bg-alo-gray-light text-alo-gray'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className={`font-bold ${selected ? 'text-alo-blue' : 'text-alo-black'}`}>
                  {level.label}
                </p>
                <p className="mt-0.5 text-xs text-alo-gray">{level.desc}</p>
              </div>
              {selected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-alo-blue text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 2 — Subject Area                                              */
/* ================================================================== */

function StepSubjectArea({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  const maxSubjects = 3;
  const canAdd = selections.subjects.length < maxSubjects;

  const toggleSubject = (subject: string) => {
    if (selections.subjects.includes(subject)) {
      update('subjects', selections.subjects.filter((s) => s !== subject));
    } else if (canAdd) {
      update('subjects', [...selections.subjects, subject]);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        What subject interests you?
      </h3>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-sm text-alo-gray">Select up to 3 subjects</p>
        {selections.subjects.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-alo-blue-light text-alo-blue text-xs font-semibold"
          >
            {selections.subjects.length} of {maxSubjects} selected
          </Badge>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {SUBJECTS.map((subject) => {
          const selected = selections.subjects.includes(subject);
          return (
            <motion.button
              key={subject}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleSubject(subject)}
              disabled={!selected && !canAdd}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                selected
                  ? 'bg-alo-blue text-white shadow-md shadow-alo-blue/20'
                  : 'border border-alo-gray-medium/60 bg-white text-alo-gray hover:border-alo-blue/40 hover:text-alo-blue disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {selected && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
              {subject}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 3 — Destination                                               */
/* ================================================================== */

function StepDestination({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        Where do you want to study?
      </h3>
      <p className="mt-2 text-sm text-alo-gray">Choose your preferred study destination</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {DESTINATIONS.map((dest) => {
          const selected = selections.destination === dest.id;
          return (
            <motion.button
              key={dest.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => update('destination', dest.id)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                selected
                  ? 'border-alo-blue bg-alo-blue-light shadow-md shadow-alo-blue/10'
                  : 'border-alo-gray-medium/60 bg-white hover:border-alo-blue/40 hover:shadow-sm'
              }`}
            >
              <span className="text-3xl">{dest.flag}</span>
              <span className={`text-xs font-semibold ${selected ? 'text-alo-blue' : 'text-alo-black'}`}>
                {dest.name}
              </span>
              {selected && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-alo-blue text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 4 — Intake                                                    */
/* ================================================================== */

function StepIntake({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        When do you want to start?
      </h3>
      <p className="mt-2 text-sm text-alo-gray">Select your preferred intake period</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {INTAKES.map((intake) => {
          const selected = selections.intake === intake.id;
          const isPrimary = intake.badge === 'Primary intake';
          return (
            <motion.button
              key={intake.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => update('intake', intake.id)}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 ${
                selected
                  ? 'border-alo-blue bg-alo-blue-light shadow-md shadow-alo-blue/10'
                  : 'border-alo-gray-medium/60 bg-white hover:border-alo-blue/40 hover:shadow-sm'
              }`}
            >
              <Calendar className={`h-8 w-8 ${selected ? 'text-alo-blue' : 'text-alo-gray'}`} />
              <span className={`text-base font-bold ${selected ? 'text-alo-blue' : 'text-alo-black'}`}>
                {intake.label}
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold ${
                  isPrimary
                    ? 'bg-green-100 text-green-700'
                    : 'bg-alo-sunshine-light text-alo-orange-dark'
                }`}
              >
                {intake.badge}
              </Badge>
              {selected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-alo-blue text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 5 — English Proficiency                                        */
/* ================================================================== */

function StepEnglishProficiency({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        What&apos;s your English test score?
      </h3>
      <p className="mt-2 text-sm text-alo-gray">Select your test type and score</p>

      <div className="mt-8 space-y-8">
        {/* Test Type */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-alo-black">
            <Languages className="mr-1.5 inline h-4 w-4 text-alo-blue" />
            Test Type
          </label>
          <div className="flex h-11 w-full items-center justify-between rounded-xl border-2 border-alo-gray-medium/60 bg-white px-4 text-sm text-alo-black">
            <span className="font-medium">{selections.englishTest}</span>
            <Search className="h-4 w-4 text-alo-gray" />
          </div>
        </div>

        {/* IELTS Score */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-alo-black">
            IELTS Academic Score
          </label>
          <div className="flex flex-wrap gap-2">
            {IELTS_SCORES.map((score) => {
              const selected = selections.englishScore === score && !selections.noTest;
              return (
                <motion.button
                  key={score}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    update('englishScore', score);
                    update('noTest', false);
                  }}
                  disabled={selections.noTest}
                  className={`flex h-11 min-w-[60px] items-center justify-center rounded-xl border-2 px-4 text-sm font-semibold transition-all duration-200 ${
                    selected
                      ? 'border-alo-blue bg-alo-blue text-white shadow-md shadow-alo-blue/20'
                      : 'border-alo-gray-medium/60 bg-white text-alo-gray hover:border-alo-blue/40 hover:text-alo-blue disabled:opacity-40'
                  }`}
                >
                  {score}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* No test yet */}
        <div
          className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
            selections.noTest
              ? 'border-alo-blue bg-alo-blue-light'
              : 'border-alo-gray-medium/40'
          }`}
        >
          <Checkbox
            checked={selections.noTest}
            onCheckedChange={(checked) => {
              update('noTest', !!checked);
              if (checked) update('englishScore', null);
            }}
            className="data-[state=checked]:bg-alo-blue data-[state=checked]:border-alo-blue"
          />
          <div>
            <p className={`text-sm font-semibold ${selections.noTest ? 'text-alo-blue' : 'text-alo-black'}`}>
              I haven&apos;t taken the test yet
            </p>
            <p className="text-xs text-alo-gray">
              We&apos;ll recommend courses based on your other preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 6 — Budget                                                    */
/* ================================================================== */

function StepBudget({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        What&apos;s your budget for tuition?
      </h3>
      <p className="mt-2 text-sm text-alo-gray">Select your annual tuition budget range</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BUDGETS.map((b) => {
          const selected = selections.budget === b.id;
          return (
            <motion.button
              key={b.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => update('budget', b.id)}
              className={`relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                selected
                  ? 'border-alo-blue bg-alo-blue-light shadow-md shadow-alo-blue/10'
                  : 'border-alo-gray-medium/60 bg-white hover:border-alo-blue/40 hover:shadow-sm'
              }`}
            >
              <span className="text-2xl">{b.icon}</span>
              <div className="min-w-0">
                <p className={`font-bold ${selected ? 'text-alo-blue' : 'text-alo-black'}`}>
                  {b.label}
                </p>
              </div>
              {selected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-alo-blue text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 7 — Career Goal                                               */
/* ================================================================== */

function StepCareerGoal({
  selections,
  update,
}: {
  selections: Selections;
  update: <K extends keyof Selections>(key: K, value: Selections[K]) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        What&apos;s your career goal?
      </h3>
      <p className="mt-2 text-sm text-alo-gray">This helps us recommend courses aligned with your ambitions</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {CAREER_GOALS.map((goal) => {
          const selected = selections.careerGoal === goal.id;
          return (
            <motion.button
              key={goal.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => update('careerGoal', goal.id)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 ${
                selected
                  ? 'border-alo-blue bg-alo-blue-light shadow-md shadow-alo-blue/10'
                  : 'border-alo-gray-medium/60 bg-white hover:border-alo-blue/40 hover:shadow-sm'
              }`}
            >
              <span className="text-3xl">{goal.icon}</span>
              <span className={`text-xs font-bold text-center leading-tight ${selected ? 'text-alo-blue' : 'text-alo-black'}`}>
                {goal.label}
              </span>
              {selected && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-alo-blue text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 8 — Review & Results                                          */
/* ================================================================== */

function StepReview({
  selections,
  isSearching,
  showResults,
}: {
  selections: Selections;
  isSearching: boolean;
  showResults: boolean;
}) {
  const destName = DESTINATIONS.find((d) => d.id === selections.destination)?.name ?? '—';
  const intakeLabel = INTAKES.find((i) => i.id === selections.intake)?.label ?? '—';
  const budgetLabel = BUDGETS.find((b) => b.id === selections.budget)?.label ?? '—';
  const careerLabel = CAREER_GOALS.find((c) => c.id === selections.careerGoal)?.label ?? '—';
  const levelLabel = STUDY_LEVELS.find((l) => l.id === selections.studyLevel)?.label ?? '—';

  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-xl font-bold text-alo-black sm:text-2xl">
        Your AI Course Matches
      </h3>
      <p className="mt-2 text-sm text-alo-gray">Based on your preferences, here are our recommendations</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── LEFT: Summary ──────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-alo-gray-medium/60 bg-alo-gray-light/50 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-alo-gray">
              Your Selections
            </h4>
            <ul className="mt-4 space-y-3">
              <SummaryRow icon={<GraduationCap className="h-4 w-4" />} label="Study Level" value={levelLabel} />
              <SummaryRow icon={<BookOpen className="h-4 w-4" />} label="Subjects" value={selections.subjects.join(', ') || '—'} />
              <SummaryRow icon={<Globe className="h-4 w-4" />} label="Destination" value={destName} />
              <SummaryRow icon={<Calendar className="h-4 w-4" />} label="Intake" value={intakeLabel} />
              <SummaryRow icon={<Languages className="h-4 w-4" />} label="English Score" value={selections.noTest ? 'Not taken yet' : (selections.englishScore ?? '—')} />
              <SummaryRow icon={<PoundSterling className="h-4 w-4" />} label="Budget" value={budgetLabel} />
              <SummaryRow icon={<Target className="h-4 w-4" />} label="Career Goal" value={careerLabel} />
            </ul>
          </div>
        </div>

        {/* ── RIGHT: Results ─────────────────────────────── */}
        <div className="lg:col-span-3">
          {isSearching && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-alo-gray-medium/60 bg-white py-16">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-alo-blue/20 border-t-alo-blue" />
                <Sparkles className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-alo-blue" />
              </div>
              <p className="mt-6 text-sm font-semibold text-alo-black">
                Finding your perfect courses...
              </p>
              <p className="mt-1 text-xs text-alo-gray">
                Analysing 50,000+ courses across 500+ universities
              </p>
            </div>
          )}

          {showResults && (
            <motion.div
              className="space-y-4"
              variants={fadeStaggerContainer}
              initial="hidden"
              animate="visible"
            >
              {aiResults.map((result) => (
                <motion.div
                  key={result.name}
                  variants={fadeStaggerItem}
                  className="rounded-xl border border-alo-gray-medium/60 bg-white p-5 transition-all duration-200 hover:border-alo-blue/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {/* Match circle */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-alo-blue bg-alo-blue-light">
                      <div className="text-center">
                        <span className="text-sm font-extrabold text-alo-blue">{result.match}%</span>
                        <p className="text-[8px] font-semibold uppercase text-alo-blue/70">Match</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-alo-black">{result.name}</h4>
                      <p className="text-xs text-alo-gray">{result.university}</p>
                      <p className="mt-1 text-xs font-semibold text-alo-blue">{result.tuition}</p>
                    {result.city && <p className="text-[10px] text-alo-gray">{result.city}{result.duration ? ` · ${result.duration}` : ''}</p>}
                    </div>
                  </div>

                  {/* AI Reason */}
                  {result.reason && (
                    <p className="mt-2 text-[11px] text-alo-gray leading-relaxed italic">
                      <Sparkles className="mr-1 inline h-3 w-3 text-alo-blue" />
                      {result.reason}
                    </p>
                  )}

                  {/* Scholarship badge */}
                  {result.scholarship && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                      <Award className="h-3 w-3 text-emerald-600" />
                      <span className="text-[10px] font-medium text-emerald-700">{result.scholarship}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 border-t border-alo-gray-medium/40 pt-3">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg border border-alo-blue/30 bg-alo-blue-light px-3 py-1.5 text-xs font-semibold text-alo-blue transition-colors hover:bg-alo-blue hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-lg bg-alo-orange px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-alo-orange-dark"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))}

              {aiError && (
                <p className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700 text-center">
                  ⚠️ {aiError}
                </p>
              )}
              <p className="text-center text-xs text-alo-gray">
                <Sparkles className="mr-1 inline h-3 w-3 text-alo-blue" />
                AI-powered matches ·{' '}
                <span className="font-semibold text-alo-blue cursor-pointer hover:underline">
                  View all matches
                </span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary Row Helper                                                  */
/* ------------------------------------------------------------------ */

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-alo-blue-light text-alo-blue">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-gray">{label}</p>
        <p className="text-xs font-medium text-alo-black leading-tight">{value}</p>
      </div>
    </li>
  );
}
