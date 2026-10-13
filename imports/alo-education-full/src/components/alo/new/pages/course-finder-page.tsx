'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Globe,
  GraduationCap,
  BookOpen,
  CalendarDays,
  DollarSign,
  Languages,
  MapPin,
  Clock,
  Award,
  Sparkles,
  Loader2,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';
import { COURSE_FINDER_OPTIONS } from '@/components/alo/new/home/homepage-data';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CourseFinderPageProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface FinderForm {
  destination: string;
  studyLevel: string;
  subject: string;
  intake: string;
  englishTest: string;
  budget: string;
}

interface CourseResult {
  slug: string;
  name: string;
  university: string;
  universitySlug?: string;
  country?: string;
  city?: string;
  level?: string;
  duration?: string;
  tuition?: number;
  tuitionCurrency?: string;
  matchScore?: number;
  scholarshipAvailable?: boolean;
  englishRequirement?: string;
  intake?: string;
}

// ─── Option Button ───────────────────────────────────────────────────────────

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200',
        'min-h-[44px]',
        selected
          ? 'bg-alo-blue text-white border-alo-blue shadow-sm shadow-alo-blue/20'
          : 'bg-white text-alo-black border-alo-gray-medium/50 hover:border-alo-blue/50 hover:text-alo-blue',
      )}
    >
      {label}
    </button>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
              i + 1 <= step
                ? 'bg-alo-blue text-white'
                : 'bg-alo-gray-light text-alo-gray',
            )}
          >
            {i + 1 <= step ? (
              <span className="text-xs">✓</span>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div
              className={cn(
                'h-0.5 w-10 sm:w-16 rounded-full transition-all duration-300',
                i + 1 < step ? 'bg-alo-blue' : 'bg-alo-gray-medium/40',
              )}
            />
          )}
        </div>
      ))}
      <span className="text-sm text-alo-gray ml-2">
        Step {step} of {total}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CourseFinderPage({ onBack, onNavigate, onLeadOpen }: CourseFinderPageProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FinderForm>({
    destination: '',
    studyLevel: '',
    subject: '',
    intake: '',
    englishTest: '',
    budget: '',
  });
  const [results, setResults] = useState<CourseResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  const updateForm = (key: keyof FinderForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedStep1 = form.destination && form.studyLevel;
  const canProceedStep2 = true; // All optional in step 2

  const handleSearch = async () => {
    setSearching(true);
    setSearchDone(false);
    try {
      const res = await fetch('/api/ai/course-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const json = await res.json();
        setResults(json.courses || json.results || []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  };

  const handleReset = () => {
    setStep(1);
    setForm({ destination: '', studyLevel: '', subject: '', intake: '', englishTest: '', budget: '' });
    setResults(null);
    setSearchDone(false);
  };

  const filledCount = useMemo(() => {
    return Object.values(form).filter(Boolean).length;
  }, [form]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={onLeadOpen} />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={onBack}
            className="text-alo-gray hover:text-alo-blue flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-alo-blue/10 text-alo-blue text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Course Finder
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-alo-black mb-2">
              Find Your Perfect Course
            </h1>
            <p className="text-alo-gray max-w-lg mx-auto">
              Tell us your preferences and our AI will match you with the best courses from 400+ universities.
            </p>
          </div>

          {/* Progress */}
          <ProgressBar step={results ? 3 : step} total={3} />

          {/* Step 1: Destination + Study Level + Subject */}
          {step === 1 && !results && (
            <div className="space-y-8">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-alo-black mb-3">
                  <Globe className="h-4 w-4 text-alo-blue" />
                  Where do you want to study? <span className="text-alo-orange">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_FINDER_OPTIONS.destinations.map((d) => (
                    <OptionButton
                      key={d}
                      label={d}
                      selected={form.destination === d}
                      onClick={() => updateForm('destination', d)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-alo-black mb-3">
                  <GraduationCap className="h-4 w-4 text-alo-blue" />
                  Study Level <span className="text-alo-orange">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_FINDER_OPTIONS.studyLevels.map((l) => (
                    <OptionButton
                      key={l}
                      label={l}
                      selected={form.studyLevel === l}
                      onClick={() => updateForm('studyLevel', l)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-alo-black mb-3">
                  <BookOpen className="h-4 w-4 text-alo-blue" />
                  Subject Area
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_FINDER_OPTIONS.subjects.map((s) => (
                    <OptionButton
                      key={s}
                      label={s}
                      selected={form.subject === s}
                      onClick={() => updateForm('subject', s)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className={cn(
                    'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                    'bg-alo-blue hover:bg-alo-blue-dark',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    'transition-all duration-200',
                  )}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Intake + English Test + Budget */}
          {step === 2 && !results && (
            <div className="space-y-8">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-alo-black mb-3">
                  <CalendarDays className="h-4 w-4 text-alo-blue" />
                  Preferred Intake
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_FINDER_OPTIONS.intakes.map((i) => (
                    <OptionButton
                      key={i}
                      label={i}
                      selected={form.intake === i}
                      onClick={() => updateForm('intake', i)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-alo-black mb-3">
                  <Languages className="h-4 w-4 text-alo-blue" />
                  English Test
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_FINDER_OPTIONS.englishTests.map((t) => (
                    <OptionButton
                      key={t}
                      label={t}
                      selected={form.englishTest === t}
                      onClick={() => updateForm('englishTest', t)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-alo-black mb-3">
                  <DollarSign className="h-4 w-4 text-alo-blue" />
                  Budget
                </label>
                <div className="flex flex-wrap gap-2">
                  {COURSE_FINDER_OPTIONS.budgets.map((b) => (
                    <OptionButton
                      key={b}
                      label={b}
                      selected={form.budget === b}
                      onClick={() => updateForm('budget', b)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="h-12 px-6 rounded-xl font-semibold text-sm border-alo-gray-medium/50 hover:bg-alo-gray-light transition-all duration-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSearch}
                  disabled={searching}
                  className={cn(
                    'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                    'bg-alo-orange hover:bg-alo-orange-dark',
                    'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                    'transition-all duration-200',
                  )}
                >
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Courses...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Courses ({filledCount} preferences)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {searchDone && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-alo-black">
                    {results && results.length > 0
                      ? `${results.length} Courses Found`
                      : 'No Courses Found'}
                  </h2>
                  <p className="text-sm text-alo-gray mt-1">
                    {form.destination} • {form.studyLevel}{form.subject ? ` • ${form.subject}` : ''}
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="h-10 px-4 rounded-xl text-sm border-alo-gray-medium/50 hover:bg-alo-gray-light transition-all duration-200"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  New Search
                </Button>
              </div>

              {searching && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 text-alo-blue animate-spin mb-4" />
                  <p className="text-alo-gray font-medium">Searching for the best matches...</p>
                </div>
              )}

              {!searching && results && results.length === 0 && (
                <div className="bg-alo-gray-light rounded-2xl p-10 text-center">
                  <Search className="h-12 w-12 text-alo-gray mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-alo-black mb-2">No exact matches found</h3>
                  <p className="text-alo-gray mb-6 max-w-md mx-auto">
                    Try adjusting your preferences or talk to our counsellors for personalised recommendations.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      onClick={handleReset}
                      className="bg-alo-blue hover:bg-alo-blue-dark text-white rounded-xl transition-all duration-200"
                    >
                      Adjust Preferences
                    </Button>
                    <Button
                      onClick={onLeadOpen}
                      className="bg-alo-orange hover:bg-alo-orange-dark text-white rounded-xl transition-all duration-200"
                    >
                      Talk to ALO
                    </Button>
                  </div>
                </div>
              )}

              {!searching && results && results.length > 0 && (
                <div className="space-y-4">
                  {results.map((course, idx) => (
                    <button
                      key={course.slug || idx}
                      onClick={() => onNavigate('course', course.slug)}
                      className={cn(
                        'w-full text-left bg-white rounded-xl border border-alo-gray-medium/50 p-5 md:p-6',
                        'card-lift group transition-all duration-200',
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Match Score */}
                          {course.matchScore && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 text-xs font-medium px-2.5 py-0.5 rounded-full border-0 mb-2">
                              {course.matchScore}% Match
                            </Badge>
                          )}
                          <h3 className="text-base font-semibold text-alo-black group-hover:text-alo-blue transition-colors mb-1">
                            {course.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-alo-gray">
                            {course.university && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {course.university}
                              </span>
                            )}
                            {course.city && course.country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {course.city}, {course.country}
                              </span>
                            )}
                            {course.level && (
                              <Badge className="bg-alo-blue/10 text-alo-blue text-[10px] font-medium px-2 py-0.5 rounded-full border-0">
                                {course.level}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-alo-gray">
                            {course.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{course.duration}
                              </span>
                            )}
                            {course.tuition && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {course.tuitionCurrency || '£'}{course.tuition.toLocaleString()}
                              </span>
                            )}
                            {course.scholarshipAvailable && (
                              <span className="flex items-center gap-1 text-alo-orange font-medium">
                                <Award className="h-3 w-3" />Scholarship
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-alo-gray group-hover:text-alo-blue transition-colors shrink-0 mt-1 hidden md:block" />
                      </div>
                    </button>
                  ))}

                  {/* Bottom CTA */}
                  <div className="bg-alo-blue/5 border border-alo-blue/20 rounded-2xl p-6 md:p-8 text-center mt-6">
                    <h3 className="text-lg font-bold text-alo-black mb-2">
                      Need Help Choosing?
                    </h3>
                    <p className="text-sm text-alo-gray mb-4 max-w-md mx-auto">
                      Our expert counsellors can narrow down these results based on your specific profile and help you apply — for free.
                    </p>
                    <Button
                      onClick={onLeadOpen}
                      className={cn(
                        'h-11 px-6 rounded-xl font-semibold text-sm text-white',
                        'bg-alo-orange hover:bg-alo-orange-dark',
                        'transition-all duration-200',
                      )}
                    >
                      Get Free Counselling
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <NewFooter onNavigate={onNavigate} />
    </div>
  );
}
