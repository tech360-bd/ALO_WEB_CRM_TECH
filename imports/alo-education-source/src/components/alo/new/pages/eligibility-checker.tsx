'use client';

import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Languages,
  Award,
  Briefcase,
  FolderOpen,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  FileCheck,
  Lightbulb,
  ShieldCheck,
  Info,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { NewNavbar } from '@/components/alo/new/home/navbar';
import { NewFooter } from '@/components/alo/new/home/footer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EligibilityCheckerProps {
  courseSlug: string;
  onNavigate: (page: string, slug?: string) => void;
  onApply?: () => void;
}

interface StudentProfile {
  academicLevel: string;
  gpa: string;
  ieltsOverall: string;
  ieltsMin: string;
  workExperienceYears: string;
  studyGapMonths: string;
  hasPortfolio: string;
}

interface RequirementCheck {
  name: string;
  label: string;
  passed: boolean;
  icon: string;
  detail: string;
  required: string;
  provided: string;
  weight: number;
}

interface EligibilityResult {
  eligible: boolean;
  status: 'ELIGIBLE' | 'CONDITIONAL' | 'NOT_ELIGIBLE';
  course: {
    name: string;
    slug: string;
    level: string;
    university: string;
    universitySlug: string;
  };
  scores: {
    academic: number;
    english: number;
    overall: number;
  };
  requirements: RequirementCheck[];
  recommendations: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACADEMIC_LEVELS = [
  { value: 'high_school', label: 'High School / SSC' },
  { value: 'higher_secondary', label: 'Higher Secondary / HSC / A-Level' },
  { value: 'diploma', label: 'Diploma / Certificate' },
  { value: 'bachelors', label: 'Bachelor\'s Degree' },
  { value: 'masters', label: 'Master\'s Degree' },
  { value: 'phd', label: 'PhD / Doctorate' },
];

const PORTFOLIO_OPTIONS = [
  { value: 'yes', label: 'Yes, I have a portfolio' },
  { value: 'no', label: 'No, I don\'t have one yet' },
  { value: 'na', label: 'Not applicable' },
];

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  Languages,
  Award,
  Briefcase,
  FolderOpen,
  Clock,
  Target,
  FileCheck,
};

// ─── Radial Score Ring ───────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: 'blue' | 'orange' | 'green' | 'red' }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor =
    color === 'blue' ? 'stroke-alo-blue' :
    color === 'orange' ? 'stroke-alo-orange' :
    color === 'green' ? 'stroke-trust' : 'stroke-destructive';
  const textColor =
    color === 'blue' ? 'text-alo-blue' :
    color === 'orange' ? 'text-alo-orange' :
    color === 'green' ? 'text-trust' : 'text-destructive';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24 md:w-28 md:h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            className="stroke-alo-gray-medium"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            className={cn(strokeColor, 'transition-all duration-1000 ease-out')}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-2xl md:text-3xl font-bold', textColor)}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-alo-gray uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function EligibilityChecker({ courseSlug, onNavigate, onApply }: EligibilityCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [courseName, setCourseName] = useState('');

  const [profile, setProfile] = useState<StudentProfile>({
    academicLevel: '',
    gpa: '',
    ieltsOverall: '',
    ieltsMin: '',
    workExperienceYears: '0',
    studyGapMonths: '0',
    hasPortfolio: 'no',
  });

  const updateField = useCallback(<K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCheck = useCallback(async () => {
    if (!profile.academicLevel) {
      toast.error('Please select your academic level.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/courses/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug,
          profile: {
            academicLevel: profile.academicLevel,
            gpa: profile.gpa ? parseFloat(profile.gpa) : null,
            ieltsOverall: profile.ieltsOverall ? parseFloat(profile.ieltsOverall) : null,
            ieltsMin: profile.ieltsMin ? parseFloat(profile.ieltsMin) : null,
            workExperienceYears: profile.workExperienceYears ? parseInt(profile.workExperienceYears, 10) : null,
            hasPortfolio: profile.hasPortfolio === 'yes' ? true : profile.hasPortfolio === 'no' ? false : null,
            studyGapMonths: parseInt(profile.studyGapMonths || '0', 10),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to check eligibility');
      }

      const data = await res.json();
      setResult(data);
      setCourseName(data.course?.name || '');

      // Scroll to results
      setTimeout(() => {
        document.getElementById('eligibility-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile, courseSlug]);

  const handleReset = useCallback(() => {
    setResult(null);
    setCourseName('');
    setProfile({
      academicLevel: '',
      gpa: '',
      ieltsOverall: '',
      ieltsMin: '',
      workExperienceYears: '0',
      studyGapMonths: '0',
      hasPortfolio: 'no',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── Status Config ───────────────────────────────────────────────────────
  const statusConfig = result
    ? {
        ELIGIBLE: {
          label: 'ELIGIBLE',
          bg: 'bg-emerald-50 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          ringColor: 'green' as const,
          message: 'Congratulations! You meet all the requirements for this course.',
        },
        CONDITIONAL: {
          label: 'CONDITIONAL',
          bg: 'bg-amber-50 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          ringColor: 'orange' as const,
          message: 'You are close! Meet a few more requirements to become fully eligible.',
        },
        NOT_ELIGIBLE: {
          label: 'NOT ELIGIBLE',
          bg: 'bg-red-50 border-red-200',
          badge: 'bg-red-100 text-red-800 border-red-300',
          icon: XCircle,
          iconColor: 'text-red-600',
          ringColor: 'red' as const,
          message: 'You do not currently meet the requirements. See recommendations below.',
        },
      }[result.status]
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NewNavbar onNavigate={onNavigate} onLeadOpen={() => {}} />

      <main className="flex-1 w-full">
        {/* ─── Header ─── */}
        <section className="relative gradient-blue py-12 md:py-16 px-4">
          <div className="absolute inset-0 dot-grid-blue opacity-30" />
          <div className="relative max-w-4xl mx-auto text-center">
            <button
              onClick={() => onNavigate('course', courseSlug)}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors press-scale"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </button>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <ShieldCheck className="h-4 w-4 text-alo-sunshine" />
              <span className="text-white/90 text-xs font-medium uppercase tracking-wide">Eligibility Checker</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Check Your Eligibility
            </h1>
            <p className="text-white/70 max-w-lg mx-auto text-sm md:text-base">
              Enter your academic profile to find out if you meet the entry requirements for this course.
            </p>
          </div>
        </section>

        {/* ─── Form + Results ─── */}
        <section className="max-w-4xl mx-auto px-4 -mt-6 pb-16 relative z-10">
          <Card className="shadow-xl border-alo-gray-medium/30">
            <CardContent className="p-6 md:p-8">

              {/* ─── Input Form ─── */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-alo-blue/10">
                    <FileCheck className="h-4.5 w-4.5 text-alo-blue" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-alo-black">Your Academic Profile</h2>
                    <p className="text-xs text-alo-gray">Fill in your details to check eligibility</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Academic Level */}
                  <div className="space-y-2">
                    <Label htmlFor="academicLevel" className="text-sm font-medium text-alo-black">
                      Academic Level <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={profile.academicLevel}
                      onValueChange={(v) => updateField('academicLevel', v)}
                    >
                      <SelectTrigger id="academicLevel" className="w-full">
                        <SelectValue placeholder="Select your highest qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACADEMIC_LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* GPA / Percentage */}
                  <div className="space-y-2">
                    <Label htmlFor="gpa" className="text-sm font-medium text-alo-black">
                      GPA / Percentage
                    </Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 3.5 or 75"
                      value={profile.gpa}
                      onChange={(e) => updateField('gpa', e.target.value)}
                      className="w-full"
                    />
                    <p className="text-[11px] text-alo-gray">Enter GPA (0-4 scale) or percentage (0-100)</p>
                  </div>

                  {/* IELTS Overall */}
                  <div className="space-y-2">
                    <Label htmlFor="ieltsOverall" className="text-sm font-medium text-alo-black">
                      IELTS Overall Score
                    </Label>
                    <Input
                      id="ieltsOverall"
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      placeholder="e.g., 6.5"
                      value={profile.ieltsOverall}
                      onChange={(e) => updateField('ieltsOverall', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* IELTS Min Band */}
                  <div className="space-y-2">
                    <Label htmlFor="ieltsMin" className="text-sm font-medium text-alo-black">
                      IELTS Minimum Band
                    </Label>
                    <Input
                      id="ieltsMin"
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      placeholder="e.g., 6.0"
                      value={profile.ieltsMin}
                      onChange={(e) => updateField('ieltsMin', e.target.value)}
                      className="w-full"
                    />
                    <p className="text-[11px] text-alo-gray">Your lowest score in any band</p>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-2">
                    <Label htmlFor="workExp" className="text-sm font-medium text-alo-black">
                      Work Experience (Years)
                    </Label>
                    <Input
                      id="workExp"
                      type="number"
                      min="0"
                      max="30"
                      placeholder="0"
                      value={profile.workExperienceYears}
                      onChange={(e) => updateField('workExperienceYears', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Study Gap */}
                  <div className="space-y-2">
                    <Label htmlFor="studyGap" className="text-sm font-medium text-alo-black">
                      Study Gap (Months)
                    </Label>
                    <Input
                      id="studyGap"
                      type="number"
                      min="0"
                      max="120"
                      placeholder="0"
                      value={profile.studyGapMonths}
                      onChange={(e) => updateField('studyGapMonths', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Portfolio */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="portfolio" className="text-sm font-medium text-alo-black">
                      Do you have a portfolio?
                    </Label>
                    <Select
                      value={profile.hasPortfolio}
                      onValueChange={(v) => updateField('hasPortfolio', v)}
                    >
                      <SelectTrigger id="portfolio" className="w-full md:w-1/2">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {PORTFOLIO_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                  <Button
                    onClick={handleCheck}
                    disabled={loading || !profile.academicLevel}
                    className={cn(
                      'w-full sm:w-auto h-12 px-8 rounded-xl font-semibold text-sm text-white',
                      'bg-alo-orange hover:bg-alo-orange-dark',
                      'shadow-lg shadow-alo-orange/20 hover:shadow-xl hover:shadow-alo-orange/30',
                      'transition-all duration-200 disabled:opacity-50',
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Checking Eligibility...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Check Eligibility
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="w-full sm:w-auto h-12 px-6 rounded-xl font-medium text-sm border-alo-gray-medium hover:bg-alo-gray-light transition-colors"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Check Again
                    </Button>
                  )}
                </div>
              </div>

              {/* ─── Divider ─── */}
              {result && <Separator className="my-8" />}

              {/* ─── Results ─── */}
              {result && statusConfig && (
                <div id="eligibility-results">
                  {/* Status Banner */}
                  <div className={cn('rounded-2xl border p-6 md:p-8 mb-8', statusConfig.bg)}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm shrink-0', statusConfig.iconColor)}>
                        <statusConfig.icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h2 className="text-xl md:text-2xl font-bold text-alo-black">
                            {statusConfig.label}
                          </h2>
                          <Badge variant="outline" className={cn('font-semibold text-xs', statusConfig.badge)}>
                            {result.scores.overall}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-alo-gray mb-1">{statusConfig.message}</p>
                        {result.course && (
                          <p className="text-xs text-alo-gray">
                            <span className="font-medium text-alo-black">{result.course.name}</span>
                            {result.course.university && (
                              <span> — {result.course.university}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Rings */}
                  <Card className="border-alo-gray-medium/30 mb-8">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-semibold text-alo-black mb-5 flex items-center gap-2">
                        <Award className="h-4 w-4 text-alo-blue" />
                        Score Breakdown
                      </h3>
                      <div className="flex items-center justify-center gap-8 md:gap-12">
                        <ScoreRing
                          score={result.scores.academic}
                          label="Academic"
                          color={result.scores.academic >= 70 ? 'blue' : result.scores.academic >= 40 ? 'orange' : 'red'}
                        />
                        <ScoreRing
                          score={result.scores.english}
                          label="English"
                          color={result.scores.english >= 70 ? 'blue' : result.scores.english >= 40 ? 'orange' : 'red'}
                        />
                        <ScoreRing
                          score={result.scores.overall}
                          label="Overall"
                          color={statusConfig.ringColor}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Requirement Checks */}
                  <Card className="border-alo-gray-medium/30 mb-8">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-semibold text-alo-black mb-5 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-alo-blue" />
                        Requirement Checks
                      </h3>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto alo-scrollbar pr-1">
                        {result.requirements.map((req, idx) => {
                          const ReqIcon = ICON_MAP[req.icon] || FileCheck;
                          return (
                            <div
                              key={req.name}
                              className={cn(
                                'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                                req.passed
                                  ? 'bg-emerald-50/50 border-emerald-100'
                                  : 'bg-red-50/50 border-red-100',
                              )}
                            >
                              <div className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5',
                                req.passed ? 'bg-emerald-100' : 'bg-red-100',
                              )}>
                                {req.passed ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                                ) : (
                                  <XCircle className="h-4.5 w-4.5 text-red-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <ReqIcon className={cn('h-4 w-4', req.passed ? 'text-emerald-600' : 'text-red-500')} />
                                  <span className="text-sm font-semibold text-alo-black">{req.label}</span>
                                </div>
                                <p className="text-xs text-alo-gray leading-relaxed mb-2">{req.detail}</p>
                                <div className="flex flex-wrap gap-3 text-[11px]">
                                  <span className="text-alo-gray">
                                    Required: <span className="font-medium text-alo-black">{req.required}</span>
                                  </span>
                                  <span className="text-alo-gray">
                                    Yours: <span className={cn('font-medium', req.passed ? 'text-emerald-700' : 'text-red-600')}>
                                      {req.provided}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <Card className="border-alo-blue/20 bg-alo-blue-light/30 mb-8">
                      <CardContent className="p-6">
                        <h3 className="text-sm font-semibold text-alo-black mb-4 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-alo-orange" />
                          Recommendations for Improvement
                        </h3>
                        <div className="space-y-3">
                          {result.recommendations.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-alo-orange/10 text-alo-orange text-[10px] font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <p className="text-sm text-alo-gray leading-relaxed">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2.5 bg-alo-gray-light rounded-xl p-4 mb-8">
                    <Info className="h-4 w-4 text-alo-blue shrink-0 mt-0.5" />
                    <p className="text-[11px] text-alo-gray leading-relaxed">
                      This eligibility check is an automated assessment based on the data available in our database.
                      Actual admission decisions are made by the university and may consider additional factors.
                      Please consult an ALO counsellor for a comprehensive evaluation.
                    </p>
                  </div>

                  {/* CTA: Apply Now */}
                  {result.eligible && (
                    <div className="gradient-blue rounded-2xl p-8 text-center">
                      <Sparkles className="h-8 w-8 text-alo-sunshine mx-auto mb-3" />
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        You&apos;re Eligible! Ready to Apply?
                      </h3>
                      <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                        Get free expert counselling and start your application to {result.course?.name}.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                          onClick={onApply}
                          className={cn(
                            'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                            'bg-alo-orange hover:bg-alo-orange-dark',
                            'shadow-lg shadow-alo-orange/30 hover:shadow-xl',
                            'transition-all duration-200',
                          )}
                        >
                          Apply Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          onClick={() => onNavigate('course', courseSlug)}
                          variant="outline"
                          className="h-12 px-6 rounded-xl font-medium text-sm bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors"
                        >
                          View Course Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* CTA for Conditional */}
                  {result.status === 'CONDITIONAL' && (
                    <div className="bg-alo-sunshine-light rounded-2xl p-8 text-center border border-alo-sunshine/30">
                      <Lightbulb className="h-8 w-8 text-alo-orange mx-auto mb-3" />
                      <h3 className="text-xl md:text-2xl font-bold text-alo-black mb-2">
                        Almost There! Let Us Help
                      </h3>
                      <p className="text-alo-gray text-sm mb-6 max-w-md mx-auto">
                        Our counsellors can help you bridge the gap and improve your chances of admission.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                          onClick={onApply}
                          className={cn(
                            'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                            'gradient-orange shadow-lg shadow-alo-orange/20 hover:shadow-xl',
                            'transition-all duration-200',
                          )}
                        >
                          Talk to a Counsellor
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          onClick={() => onNavigate('course', courseSlug)}
                          variant="outline"
                          className="h-12 px-6 rounded-xl font-medium text-sm border-alo-gray-medium hover:bg-alo-gray-light transition-colors"
                        >
                          View Course Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* CTA for Not Eligible */}
                  {result.status === 'NOT_ELIGIBLE' && (
                    <div className="bg-alo-gray-light rounded-2xl p-8 text-center border border-alo-gray-medium/50">
                      <h3 className="text-xl md:text-2xl font-bold text-alo-black mb-2">
                        Explore Alternative Options
                      </h3>
                      <p className="text-alo-gray text-sm mb-6 max-w-md mx-auto">
                        Don&apos;t worry — there are many courses that might be a better fit. Let our experts find the right one for you.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                          onClick={() => onNavigate('course-finder')}
                          className={cn(
                            'h-12 px-8 rounded-xl font-semibold text-sm text-white',
                            'gradient-blue shadow-lg shadow-alo-blue/20 hover:shadow-xl',
                            'transition-all duration-200',
                          )}
                        >
                          Find Matching Courses
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          onClick={onApply}
                          variant="outline"
                          className="h-12 px-6 rounded-xl font-medium text-sm border-alo-gray-medium hover:bg-white transition-colors"
                        >
                          Get Free Counselling
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <NewFooter onNavigate={() => {}} />
    </div>
  );
}
