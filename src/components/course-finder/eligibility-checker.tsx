'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Globe, BookOpen, ClipboardCheck, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, RotateCcw,
  MapPin, DollarSign, Calendar, Award, Building2, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── ALO Brand Colors ─────────────────────────────────────────────────────────
const ALO_BLUE = '#0057B8';
const ALO_ORANGE = '#E8501A';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUALIFICATIONS = ['SSC', 'HSC', 'Bachelor', 'Master', 'Other'] as const;
const ENGLISH_TESTS = ['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'None yet'] as const;
const PREFERRED_COUNTRIES = [
  'UK', 'USA', 'Canada', 'Australia', 'Germany',
  'Netherlands', 'New Zealand', 'Ireland', 'Sweden', 'Denmark', 'Malaysia', 'Other',
] as const;
const STUDY_LEVELS_MAP: Record<string, string> = {
  'high_school': 'Foundation / Undergraduate',
  'bachelors': 'Undergraduate',
  'masters': 'Postgraduate',
  'phd': 'PhD',
  'diploma': 'Diploma / Certificate',
};
const INTAKE_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const COUNTRY_FLAGS: Record<string, string> = {
  UK: '🇬🇧', USA: '🇺🇸', Canada: '🇨🇦', Australia: '🇦🇺',
  Germany: '🇩🇪', Netherlands: '🇳🇱', 'New Zealand': '🇳🇿',
  Ireland: '🇮🇪', Sweden: '🇸🇪', Denmark: '🇩🇰', Malaysia: '🇲🇾', Other: '🌍',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface EligibilityResult {
  courseId: string;
  courseTitle: string;
  universityName: string | null;
  country: string;
  studyLevel: string;
  subjectArea: string;
  tuitionFee: number;
  tuitionCurrency: string;
  matchLevel: 'likely' | 'possible' | 'review';
  matchScore: number;
  reasons: string[];
  slug: string;
}

interface FormData {
  // Step 1: Academic
  highestQualification: string;
  institutionName: string;
  subject: string;
  grade: string;
  graduationYear: string;
  studyGap: string;
  // Step 2: English
  englishTest: string;
  englishScore: string;
  // Step 3: Preferences
  preferredCountry: string;
  preferredLevel: string;
  preferredSubject: string;
  budgetMax: number; // in lakhs BDT
  preferredIntake: string;
}

// ─── Step metadata ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Academic Background', icon: GraduationCap, description: 'Your education details' },
  { id: 2, title: 'English Proficiency', icon: BookOpen, description: 'Test scores' },
  { id: 3, title: 'Preferences', icon: Globe, description: 'Where & what to study' },
  { id: 4, title: 'Results', icon: ClipboardCheck, description: 'Your matching courses' },
] as const;

// ─── Conversion: BDT lakhs to approximate GBP/USD/AUD for API ─────────────────
// This is a rough conversion used to give the API a budget figure.
// The API expects tuitionFee in the course's currency. We'll pass the BDT value
// and let the backend handle conversion, or use 1 lakh ≈ ~£700 / ~$850 as heuristic.
// Actually, the API takes `budget` as tuitionFee max in the course currency.
// Since courses are in GBP/USD/AUD etc., we convert BDT lakhs to a reasonable figure.
// 1 BDT ≈ 0.0059 GBP, so 1 lakh BDT ≈ £590. We'll use a multiplier.
function bdtLakhsToBudgetGbp(lakhs: number): number {
  // Conservative: 1 lakh BDT ≈ £600, rounded up for flexibility
  return Math.round(lakhs * 600);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function EligibilityChecker() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [totalResults, setTotalResults] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    highestQualification: '',
    institutionName: '',
    subject: '',
    grade: '',
    graduationYear: '',
    studyGap: '0',
    englishTest: 'None yet',
    englishScore: '',
    preferredCountry: '',
    preferredLevel: '',
    preferredSubject: '',
    budgetMax: 20,
    preferredIntake: '',
  });

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─── Validation per step ───────────────────────────────────────────────────
  function validateStep(s: number): boolean {
    if (s === 1) {
      if (!formData.highestQualification) { setError('Please select your highest qualification.'); return false; }
      if (!formData.graduationYear || isNaN(Number(formData.graduationYear))) { setError('Please enter a valid graduation year.'); return false; }
      setError(null);
      return true;
    }
    if (s === 2) {
      if (formData.englishTest !== 'None yet' && (!formData.englishScore || isNaN(Number(formData.englishScore)))) {
        setError('Please enter a valid test score.');
        return false;
      }
      setError(null);
      return true;
    }
    if (s === 3) {
      if (!formData.preferredCountry) { setError('Please select a preferred country.'); return false; }
      if (!formData.preferredLevel) { setError('Please select a preferred study level.'); return false; }
      setError(null);
      return true;
    }
    setError(null);
    return true;
  }

  const nextStep = () => {
    if (validateStep(step)) {
      if (step === 3) {
        submitForm();
      } else {
        setStep(s => s + 1);
      }
    }
  };

  const prevStep = () => {
    setError(null);
    if (step > 1) setStep(s => s - 1);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function submitForm() {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        highestQualification: formData.highestQualification.toLowerCase(),
        subject: formData.subject || undefined,
        gpa: formData.grade ? parseFloat(formData.grade) : undefined,
        graduationYear: parseInt(formData.graduationYear, 10),
        studyGap: formData.studyGap,
        englishTest: formData.englishTest === 'None yet' ? null : formData.englishTest.toLowerCase(),
        englishScore: formData.englishTest !== 'None yet' && formData.englishScore ? formData.englishScore : undefined,
        preferredCountry: formData.preferredCountry,
        preferredLevel: formData.preferredLevel,
        preferredSubject: formData.preferredSubject || undefined,
        budget: bdtLakhsToBudgetGbp(formData.budgetMax),
        preferredIntake: formData.preferredIntake || undefined,
        nationality: 'Bangladeshi',
        countryOfResidence: 'Bangladesh',
      };

      const res = await fetch('/api/course-finder/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      setDisclaimer(data.disclaimer || '');
      setStep(4);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Group results ─────────────────────────────────────────────────────────
  const likelyResults = results.filter(r => r.matchLevel === 'likely');
  const possibleResults = results.filter(r => r.matchLevel === 'possible');
  const reviewResults = results.filter(r => r.matchLevel === 'review');

  // ─── Reset ─────────────────────────────────────────────────────────────────
  function handleReset() {
    setStep(1);
    setResults([]);
    setError(null);
    setDisclaimer('');
    setTotalResults(0);
    setFormData({
      highestQualification: '', institutionName: '', subject: '', grade: '',
      graduationYear: '', studyGap: '0', englishTest: 'None yet', englishScore: '',
      preferredCountry: '', preferredLevel: '', preferredSubject: '',
      budgetMax: 20, preferredIntake: '',
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: ALO_BLUE }}>
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--alo-text)]">Eligibility Checker</h1>
            <p className="text-sm text-[var(--alo-text-muted)]">Find courses that match your profile</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* ─── Step Indicator ────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--alo-page)] -z-0">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${((Math.min(step, 4) - 1) / 3) * 100}%`,
                  background: ALO_BLUE,
                }}
              />
            </div>
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                      isActive && 'border-transparent shadow-lg scale-110',
                      isCompleted && 'border-transparent',
                      !isActive && !isCompleted && 'border-[var(--alo-border-strong)] bg-white',
                    )}
                    style={
                      isActive
                        ? { background: ALO_BLUE }
                        : isCompleted
                          ? { background: '#10B981' }
                          : undefined
                    }
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[var(--alo-text-muted)]')} />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium text-center hidden sm:block',
                      isActive ? 'text-[var(--alo-text)]' : isCompleted ? 'text-crm-success-text' : 'text-[var(--alo-text-muted)]',
                    )}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Error Display ──────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-crm-danger-bg border border-crm-danger-border rounded-lg">
            <AlertCircle className="w-5 h-5 text-crm-danger-text shrink-0" />
            <p className="text-sm text-crm-danger-text">{error}</p>
          </div>
        )}

        {/* ─── Step Content ───────────────────────────────────────────────── */}
        <Card className="shadow-sm border-[var(--alo-border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{STEPS[step - 1].title}</CardTitle>
            <CardDescription>{STEPS[step - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* ─── STEP 1: Academic Background ──────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="qualification">Highest Qualification *</Label>
                  <Select
                    value={formData.highestQualification}
                    onValueChange={(v) => updateField('highestQualification', v)}
                  >
                    <SelectTrigger className="w-full" id="qualification">
                      <SelectValue placeholder="Select your qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALIFICATIONS.map(q => (
                        <SelectItem key={q} value={q}>{q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institution Name</Label>
                  <Input
                    id="institution"
                    placeholder="e.g. University of Dhaka"
                    value={formData.institutionName}
                    onChange={(e) => updateField('institutionName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject / Major</Label>
                  <Input
                    id="subject"
                    placeholder="e.g. Computer Science, Business"
                    value={formData.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade / GPA (out of 5.00)</Label>
                    <Input
                      id="grade"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      placeholder="e.g. 3.50"
                      value={formData.grade}
                      onChange={(e) => updateField('grade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradYear">Graduation Year *</Label>
                    <Input
                      id="gradYear"
                      type="number"
                      min="1970"
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g. 2024"
                      value={formData.graduationYear}
                      onChange={(e) => updateField('graduationYear', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyGap">Study Gap (years after graduation)</Label>
                  <Select
                    value={formData.studyGap}
                    onValueChange={(v) => updateField('studyGap', v)}
                  >
                    <SelectTrigger className="w-full" id="studyGap">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(g => (
                        <SelectItem key={g} value={g}>{g === '0' ? 'No gap' : g === '10+' ? '10+ years' : `${g} year${g !== '1' ? 's' : ''}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ─── STEP 2: English Proficiency ───────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-lg bg-[var(--alo-brand-pale)] border border-[var(--alo-border)] p-4 mb-2">
                  <p className="text-sm text-[var(--alo-brand-deep)]">
                    <strong>Don&apos;t have a test score yet?</strong> That&apos;s fine — select &quot;None yet&quot; and we&apos;ll match you based on other criteria.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishTest">English Test Type</Label>
                  <Select
                    value={formData.englishTest}
                    onValueChange={(v) => updateField('englishTest', v)}
                  >
                    <SelectTrigger className="w-full" id="englishTest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENGLISH_TESTS.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.englishTest !== 'None yet' && (
                  <div className="space-y-2">
                    <Label htmlFor="englishScore">
                      {formData.englishTest} Score
                      {formData.englishTest === 'IELTS' && ' (overall band)'}
                      {formData.englishTest === 'PTE' && ' (overall score)'}
                      {formData.englishTest === 'TOEFL' && ' (total score)'}
                      {formData.englishTest === 'Duolingo' && ' (overall score)'}
                    </Label>
                    <Input
                      id="englishScore"
                      type="number"
                      step="0.5"
                      min="0"
                      max={formData.englishTest === 'TOEFL' ? 120 : formData.englishTest === 'Duolingo' ? 160 : formData.englishTest === 'PTE' ? 90 : 9}
                      placeholder={
                        formData.englishTest === 'IELTS' ? 'e.g. 6.5' :
                        formData.englishTest === 'TOEFL' ? 'e.g. 90' :
                        formData.englishTest === 'Duolingo' ? 'e.g. 105' :
                        'e.g. 58'
                      }
                      value={formData.englishScore}
                      onChange={(e) => updateField('englishScore', e.target.value)}
                    />
                    <p className="text-xs text-[var(--alo-text-muted)]">
                      {formData.englishTest === 'IELTS' && 'Typical requirement: 6.0–7.5'}
                      {formData.englishTest === 'PTE' && 'Typical requirement: 50–79'}
                      {formData.englishTest === 'TOEFL' && 'Typical requirement: 72–100'}
                      {formData.englishTest === 'Duolingo' && 'Typical requirement: 95–130'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 3: Preferences ───────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="country">Preferred Country *</Label>
                  <Select
                    value={formData.preferredCountry}
                    onValueChange={(v) => updateField('preferredCountry', v)}
                  >
                    <SelectTrigger className="w-full" id="country">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFERRED_COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {COUNTRY_FLAGS[c] || ''} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Preferred Study Level *</Label>
                    <Select
                      value={formData.preferredLevel}
                      onValueChange={(v) => updateField('preferredLevel', v)}
                    >
                      <SelectTrigger className="w-full" id="level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STUDY_LEVELS_MAP).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intake">Preferred Intake</Label>
                    <Select
                      value={formData.preferredIntake}
                      onValueChange={(v) => updateField('preferredIntake', v)}
                    >
                      <SelectTrigger className="w-full" id="intake">
                        <SelectValue placeholder="Any intake" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any intake</SelectItem>
                        {INTAKE_MONTHS.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefSubject">Preferred Subject Area</Label>
                  <Input
                    id="prefSubject"
                    placeholder="e.g. Computer Science, Business Administration, Data Science"
                    value={formData.preferredSubject}
                    onChange={(e) => updateField('preferredSubject', e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Budget Range (BDT)</Label>
                    <span className="text-sm font-semibold" style={{ color: ALO_BLUE }}>
                      Up to {formData.budgetMax} lakh{formData.budgetMax !== 1 ? 's' : ''}
                      <span className="text-[var(--alo-text-muted)] font-normal ml-1">
                        (~£{Math.round(formData.budgetMax * 0.59).toLocaleString()})
                      </span>
                    </span>
                  </div>
                  <Slider
                    value={[formData.budgetMax]}
                    onValueChange={(v) => updateField('budgetMax', v[0])}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[var(--alo-text-muted)]">
                    <span>0</span>
                    <span>10L</span>
                    <span>20L</span>
                    <span>30L</span>
                    <span>40L</span>
                    <span>50L</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4: Results ───────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Summary bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-[var(--alo-text-muted)]">{totalResults} course{totalResults !== 1 ? 's' : ''} found</span>
                  <Badge className="bg-crm-success-bg text-crm-success-text hover:bg-crm-success-bg border-crm-success-border">
                    {likelyResults.length} Likely Match
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                    {possibleResults.length} Possible
                  </Badge>
                  <Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)] border-[var(--alo-border)]">
                    {reviewResults.length} Needs Review
                  </Badge>
                </div>

                {totalResults === 0 && (
                  <div className="text-center py-12">
                    <HelpCircle className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--alo-body)] mb-2">No matching courses found</h3>
                    <p className="text-sm text-[var(--alo-text-muted)] max-w-md mx-auto">
                      Try adjusting your preferences — different country, study level, or a higher budget — and run the check again.
                    </p>
                  </div>
                )}

                {/* Likely Match */}
                {likelyResults.length > 0 && (
                  <ResultGroup
                    title="Likely Match"
                    description="These courses closely match your academic background and preferences."
                    color="green"
                    results={likelyResults}
                  />
                )}

                {/* Possible Match */}
                {possibleResults.length > 0 && (
                  <ResultGroup
                    title="Possible Match"
                    description="You may qualify, but some criteria need closer review."
                    color="yellow"
                    results={possibleResults}
                  />
                )}

                {/* Needs Review */}
                {reviewResults.length > 0 && (
                  <ResultGroup
                    title="Needs Counsellor Review"
                    description="These may require additional documentation or a counsellor's assessment."
                    color="gray"
                    results={reviewResults}
                  />
                )}

                {/* Disclaimer */}
                {disclaimer && (
                  <div className="rounded-lg bg-crm-warning-bg border border-crm-warning-border p-4">
                    <p className="text-xs text-crm-warning-text leading-relaxed">{disclaimer}</p>
                  </div>
                )}

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Check Again
                  </Button>
                  <Button
                    className="flex-1 text-white"
                    style={{ background: ALO_ORANGE }}
                    onClick={() => router.push('/book-consultation')}
                  >
                    Request Consultation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          {/* ─── Navigation Buttons (steps 1-3) ──────────────────────────── */}
          {step < 4 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-[var(--alo-page)]/50 rounded-b-lg">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={step === 1}
                className="text-[var(--alo-body)]"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)]">
                Step {step} of 3
              </div>
              <Button
                onClick={nextStep}
                disabled={loading}
                style={{ background: ALO_BLUE }}
                className="text-white hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : step === 3 ? (
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                {step === 3 ? 'Check Eligibility' : 'Next'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULT GROUP — Renders a section of results with matching color theme
// ══════════════════════════════════════════════════════════════════════════════
function ResultGroup({
  title,
  description,
  color,
  results,
}: {
  title: string;
  description: string;
  color: 'green' | 'yellow' | 'gray';
  results: EligibilityResult[];
}) {
  const themeMap = {
    green: {
      border: 'border-crm-success-border',
      bg: 'bg-crm-success-bg',
      badge: 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
      icon: <CheckCircle2 className="w-5 h-5 text-crm-success-text" />,
      titleClass: 'text-crm-success-text',
    },
    yellow: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      titleClass: 'text-yellow-800',
    },
    gray: {
      border: 'border-[var(--alo-border)]',
      bg: 'bg-[var(--alo-page)]',
      badge: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
      icon: <HelpCircle className="w-5 h-5 text-[var(--alo-text-muted)]" />,
      titleClass: 'text-[var(--alo-body)]',
    },
  };
  const theme = themeMap[color];

  return (
    <div className={cn('rounded-lg border p-4', theme.border, theme.bg)}>
      <div className="flex items-center gap-2 mb-1">
        {theme.icon}
        <h3 className={cn('font-semibold', theme.titleClass)}>{title}</h3>
        <Badge className={cn('text-xs', theme.badge)}>{results.length}</Badge>
      </div>
      <p className="text-xs text-[var(--alo-text-muted)] mb-4">{description}</p>
      <div className="space-y-3">
        {results.map((r) => (
          <ResultCard key={r.courseId} result={r} />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESULT CARD — Individual course result card
// ══════════════════════════════════════════════════════════════════════════════
function ResultCard({ result }: { result: EligibilityResult }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--alo-border)] p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--alo-text)] text-sm leading-tight mb-1 line-clamp-2">
            {result.courseTitle}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)]">
            {result.universityName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {result.universityName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {result.country}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {result.studyLevel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            {result.tuitionFee ? (
              <div>
                <span className="text-sm font-bold text-[var(--alo-text)]">
                  {result.tuitionCurrency === 'GBP' ? '£' : result.tuitionCurrency === 'USD' ? '$' : result.tuitionCurrency === 'AUD' ? 'A$' : result.tuitionCurrency === 'EUR' ? '€' : result.tuitionCurrency + ' '}
                  {result.tuitionFee?.toLocaleString()}
                </span>
                <span className="text-xs text-[var(--alo-text-muted)] ml-1">/year</span>
              </div>
            ) : (
              <span className="text-xs text-[var(--alo-text-muted)]">Fee not listed</span>
            )}
            <div className="text-xs text-[var(--alo-text-muted)] mt-0.5">
              Score: {result.matchScore}/100
            </div>
          </div>
          {result.slug && (
            <a
              href={`/courses/${result.slug}`}
              className="w-8 h-8 rounded-full bg-[var(--alo-surface-muted)] hover:bg-[var(--alo-page)] flex items-center justify-center transition-colors"
              title="View course details"
            >
              <ExternalLink className="w-4 h-4 text-[var(--alo-text-muted)]" />
            </a>
          )}
        </div>
      </div>

      {/* Match reasons */}
      {result.reasons && result.reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--alo-border)]">
          <ul className="space-y-1">
            {result.reasons.map((reason, i) => (
              <li key={i} className="text-xs text-[var(--alo-text-muted)] flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-crm-success-text mt-0.5 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
