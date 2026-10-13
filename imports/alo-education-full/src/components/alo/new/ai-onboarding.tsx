'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Circle,
  Loader2,
  BookOpen,
  GraduationCap,
  Globe,
  DollarSign,
  Calendar,
  Target,
  MapPin,
  Star,
  Clock,
  Heart,
  ArrowLeftRight,
  Zap,
  Search,
  Brain,
  BadgeCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────

interface ALOnboardingProps {
  onBack: () => void;
  onNavigate: (page: string, slug?: string) => void;
  onLeadOpen: () => void;
}

interface ProfileStep {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface StudentProfile {
  subject: string;
  qualification: string;
  cgpa: string;
  englishTest: string;
  englishScore: string;
  countries: string[];
  budget: string;
  intake: string;
}

interface MatchResult {
  slug: string;
  name: string;
  universitySlug: string;
  universityName: string;
  countrySlug: string;
  city: string;
  level: string;
  subject: string;
  tuition: string;
  tuitionCurrency: string;
  duration: string;
  intake: string;
  englishRequirement: string;
  matchScore: number;
  academicMatch: string;
  englishMatch: string;
  budgetMatch: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SUBJECTS = [
  'Computer Science', 'Business & Management', 'Engineering',
  'Data Science & AI', 'Medicine & Health', 'Law',
  'Finance & Accounting', 'Architecture', 'Psychology',
  'Marketing', 'Mechanical Engineering', 'Civil Engineering',
  'Electrical Engineering', 'Pharmacy', 'Nursing',
  'Education', 'Biomedical Science', 'Environmental Science',
  'Journalism & Media', 'International Relations',
];

const QUALIFICATIONS = [
  'HSC (Higher Secondary Certificate)',
  'Bachelor\'s Degree (3 years)',
  'Bachelor\'s Degree (4 years)',
  'Master\'s Degree',
  'Other',
];

const ENGLISH_TESTS = [
  'IELTS', 'PTE Academic', 'TOEFL iBT', 'Duolingo English Test', 'Not taken yet',
];

const COUNTRIES = [
  { slug: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { slug: 'usa', name: 'United States', flag: '🇺🇸' },
  { slug: 'canada', name: 'Canada', flag: '🇨🇦' },
  { slug: 'australia', name: 'Australia', flag: '🇦🇺' },
  { slug: 'ireland', name: 'Ireland', flag: '🇮🇪' },
  { slug: 'germany', name: 'Germany', flag: '🇩🇪' },
  { slug: 'malaysia', name: 'Malaysia', flag: '🇲🇾' },
  { slug: 'new-zealand', name: 'New Zealand', flag: '🇳🇿' },
  { slug: 'malta', name: 'Malta', flag: '🇲🇹' },
  { slug: 'cyprus', name: 'Cyprus', flag: '🇨🇾' },
  { slug: 'south-korea', name: 'South Korea', flag: '🇰🇷' },
];

const BUDGETS = [
  'Under £10,000', '£10,000–£15,000', '£15,000–£20,000',
  '£20,000–£25,000', '£25,000–£35,000', '£35,000+', 'Flexible',
];

const INTAKES = [
  'September 2025', 'January 2026', 'March 2026',
  'September 2026', 'January 2027', 'September 2027',
];

const STEPS: ProfileStep[] = [
  { id: 'subject', label: 'Subject', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'qualification', label: 'Qualification', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'cgpa', label: 'CGPA', icon: <Star className="h-4 w-4" /> },
  { id: 'english', label: 'English Test', icon: <Globe className="h-4 w-4" /> },
  { id: 'countries', label: 'Countries', icon: <MapPin className="h-4 w-4" /> },
  { id: 'budget', label: 'Budget', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'intake', label: 'Intake', icon: <Calendar className="h-4 w-4" /> },
];

// ─── Step Components ──────────────────────────────────────────────────────

function SubjectStep({ value, onChange, onNext }: { value: string; onChange: (v: string) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">What do you want to study?</h2>
      <p className="mt-2 text-[#64748B]">Select your preferred subject area</p>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 flex-1 overflow-y-auto max-h-[400px]">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => { onChange(s); setTimeout(onNext, 200); }}
            className={cn(
              'px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 border',
              value === s
                ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8]'
                : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#0057B8]/30 hover:bg-[#F8FAFC]',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function QualificationStep({ value, onChange, onNext, onBack }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">What is your highest qualification?</h2>
      <p className="mt-2 text-[#64748B]">This helps us match you to the right study level</p>
      <div className="mt-6 flex flex-col gap-2">
        {QUALIFICATIONS.map((q) => (
          <button
            key={q}
            onClick={() => { onChange(q); setTimeout(onNext, 200); }}
            className={cn(
              'px-5 py-3.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border',
              value === q
                ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8]'
                : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#0057B8]/30',
            )}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function CgpaStep({ value, onChange, onNext, onBack }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">What is your CGPA?</h2>
      <p className="mt-2 text-[#64748B]">Enter your cumulative grade point average (out of 4.0 or 5.0)</p>
      <div className="mt-6">
        <Input
          type="number"
          step="0.01"
          min="0"
          max="5"
          placeholder="e.g. 3.50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 text-xl rounded-xl border-[#E2E8F0]"
          onKeyDown={(e) => e.key === 'Enter' && onNext()}
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          {[{ label: '3.0+', value: '3.0' }, { label: '3.5+', value: '3.5' }, { label: '3.8+', value: '3.8' }, { label: 'Out of 5.0', value: '4.0/5' }].map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange(preset.value)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-[#F8FAFC] text-[#64748B] hover:bg-[#0057B8]/10 hover:text-[#0057B8] transition-all border border-[#E2E8F0]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!value} className="h-12 px-8 rounded-xl font-semibold" style={{ backgroundColor: '#0057B8', color: '#fff' }}>
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function EnglishStep({ profile, onUpdate, onNext, onBack }: { profile: StudentProfile; onUpdate: (key: string, value: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Your English test?</h2>
      <p className="mt-2 text-[#64748B]">Select the test you have taken or plan to take</p>
      <div className="mt-6 flex flex-col gap-2">
        {ENGLISH_TESTS.map((t) => (
          <button
            key={t}
            onClick={() => onUpdate('englishTest', t)}
            className={cn(
              'px-5 py-3.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border',
              profile.englishTest === t
                ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8]'
                : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#0057B8]/30',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {profile.englishTest && profile.englishTest !== 'Not taken yet' && (
        <div className="mt-6">
          <label className="text-sm font-medium text-[#64748B] mb-2 block">
            Your {profile.englishTest} Score
          </label>
          <Input
            type="text"
            placeholder={profile.englishTest === 'IELTS' ? 'e.g. 6.5' : 'e.g. 85'}
            value={profile.englishScore}
            onChange={(e) => onUpdate('englishScore', e.target.value)}
            className="h-12 rounded-xl border-[#E2E8F0] max-w-xs"
            onKeyDown={(e) => e.key === 'Enter' && onNext()}
            autoFocus
          />
        </div>
      )}
      <div className="mt-8 flex justify-between">
        <Button onClick={onBack} variant="ghost" className="h-12 px-6 rounded-xl font-medium text-[#64748B]">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} className="h-12 px-8 rounded-xl font-semibold" style={{ backgroundColor: '#0057B8', color: '#fff' }}>
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function CountriesStep({ value, onChange, onNext, onBack }: { value: string[]; onChange: (v: string[]) => void; onNext: () => void; onBack: () => void }) {
  const toggle = (slug: string) => {
    if (value.includes(slug)) {
      onChange(value.filter((c) => c !== slug));
    } else if (value.length < 5) {
      onChange([...value, slug]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Preferred Countries?</h2>
      <p className="mt-2 text-[#64748B]">Select up to 5 countries you would like to study in</p>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2">
        {COUNTRIES.map((c) => {
          const selected = value.includes(c.slug);
          return (
            <button
              key={c.slug}
              onClick={() => toggle(c.slug)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-200 border',
                selected
                  ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8]'
                  : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#0057B8]/30',
              )}
            >
              <span className="text-xl">{c.flag}</span>
              <span>{c.name}</span>
              {selected && <CheckCircle className="h-4 w-4 ml-auto" />}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-between">
        <Button onClick={onBack} variant="ghost" className="h-12 px-6 rounded-xl font-medium text-[#64748B]">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} disabled={value.length === 0} className="h-12 px-8 rounded-xl font-semibold" style={{ backgroundColor: '#0057B8', color: '#fff' }}>
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function BudgetStep({ value, onChange, onNext, onBack }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Your Budget?</h2>
      <p className="mt-2 text-[#64748B]">Annual tuition budget (in GBP or equivalent)</p>
      <div className="mt-6 flex flex-col gap-2">
        {BUDGETS.map((b) => (
          <button
            key={b}
            onClick={() => { onChange(b); setTimeout(onNext, 200); }}
            className={cn(
              'px-5 py-3.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border',
              value === b
                ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8]'
                : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#0057B8]/30',
            )}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function IntakeStep({ value, onChange, onNext, onBack }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">When do you want to start?</h2>
      <p className="mt-2 text-[#64748B]">Select your preferred intake</p>
      <div className="mt-6 flex flex-col gap-2">
        {INTAKES.map((i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cn(
              'px-5 py-3.5 rounded-xl text-sm font-medium text-left transition-all duration-200 border',
              value === i
                ? 'bg-[#0057B8]/10 border-[#0057B8] text-[#0057B8]'
                : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#0057B8]/30',
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <Button onClick={onBack} variant="ghost" className="h-12 px-6 rounded-xl font-medium text-[#64748B]">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} disabled={!value} className="h-12 px-8 rounded-xl font-semibold" style={{ backgroundColor: '#0057B8', color: '#fff' }}>
          <Sparkles className="h-4 w-4 mr-2" /> Find My Matches
        </Button>
      </div>
    </div>
  );
}

// ─── Analysis Animation ───────────────────────────────────────────────────

function AnalyzingAnimation({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState<string[]>([]);

  const allChecks = [
    'Academic background',
    'English requirements',
    'Budget match',
    'Country preferences',
    'Course compatibility',
    'Admission requirements',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 20, 100);
        return next;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeouts = allChecks.map((check, i) =>
      setTimeout(() => {
        setChecks((prev) => [...prev, check]);
      }, (i + 1) * 600),
    );
    const doneTimeout = setTimeout(onDone, (allChecks.length + 1) * 600 + 500);
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(doneTimeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24">
      <div className="w-20 h-20 rounded-full bg-[#0057B8]/10 flex items-center justify-center mb-8">
        <Brain className="h-10 w-10 text-[#0057B8] animate-pulse" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] text-center">Analyzing your profile...</h2>
      <p className="mt-2 text-[#64748B] text-center">Matching you with the best courses</p>
      <div className="w-full max-w-md mt-8">
        <Progress value={progress} className="h-2 rounded-full" />
      </div>
      <div className="mt-8 space-y-3">
        {allChecks.map((check) => {
          const done = checks.includes(check);
          return (
            <div key={check} className="flex items-center gap-3">
              {done ? (
                <CheckCircle className="h-5 w-5 text-[#10B981]" />
              ) : (
                <Circle className="h-5 w-5 text-[#E2E8F0]" />
              )}
              <span className={cn('text-sm', done ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]')}>{check}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Match Score Badge ────────────────────────────────────────────────────

function MatchScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#10B981' : score >= 70 ? '#0057B8' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div
      className="flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-lg text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {score}%
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────

function MatchResults({ results, profile, onNavigate }: { results: MatchResult[]; profile: StudentProfile; onNavigate: (page: string, slug?: string) => void }) {
  const countryFlags: Record<string, string> = {
    uk: '🇬🇧', usa: '🇺🇸', canada: '🇨🇦', australia: '🇦🇺',
    ireland: '🇮🇪', germany: '🇩🇪', malaysia: '🇲🇾', 'new-zealand': '🇳🇿',
    malta: '🇲🇹', cyprus: '🇨🇾', 'south-korea': '🇰🇷',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="h-6 w-6 text-[#0057B8]" />
        <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Your ALO Study Matches</h2>
      </div>
      <p className="text-[#64748B] mb-8">
        We found <strong className="text-[#0F172A]">{results.length} courses</strong> matching your profile
      </p>

      {results.length === 0 ? (
        <div className="text-center py-16 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
          <Search className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#0F172A]">No exact matches found</h3>
          <p className="text-[#64748B] mt-2 max-w-md mx-auto">
            Try adjusting your budget, study level, or country preferences to see more results.
          </p>
          <Button
            onClick={() => onNavigate('course-finder')}
            className="mt-6 rounded-xl font-semibold"
            style={{ backgroundColor: '#0057B8', color: '#fff' }}
          >
            Browse All Courses
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {results.slice(0, 10).map((r) => (
            <div
              key={r.slug}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-lg hover:border-[#0057B8]/20 transition-all duration-300"
            >
              <div className="flex gap-4">
                <MatchScoreBadge score={r.matchScore} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs bg-[#0057B8]/10 text-[#0057B8] border-0 rounded-lg px-2 py-0.5">{r.level}</Badge>
                    <Badge variant="secondary" className="text-xs bg-[#F8FAFC] text-[#64748B] border-0 rounded-lg px-2 py-0.5">{r.subject}</Badge>
                  </div>
                  <h3 className="font-semibold text-[#0F172A] text-base md:text-lg">{r.name}</h3>
                  <p className="text-sm text-[#64748B] mt-0.5">{r.universityName} · {countryFlags[r.countrySlug] || ''} {r.city}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium text-[#0F172A]">{r.tuition}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{r.duration}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{r.intake}</span>
                    <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />IELTS {r.englishRequirement}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-lg',
                      r.academicMatch === 'Excellent' ? 'bg-[#10B981]/10 text-[#10B981]' : r.academicMatch === 'Good' ? 'bg-[#0057B8]/10 text-[#0057B8]' : 'bg-[#F59E0B]/10 text-[#F59E0B]',
                    )}>
                      Academic: {r.academicMatch}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-lg',
                      r.englishMatch === 'Excellent' ? 'bg-[#10B981]/10 text-[#10B981]' : r.englishMatch === 'Good' ? 'bg-[#0057B8]/10 text-[#0057B8]' : 'bg-[#F59E0B]/10 text-[#F59E0B]',
                    )}>
                      English: {r.englishMatch}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-lg',
                      r.budgetMatch === 'Excellent' ? 'bg-[#10B981]/10 text-[#10B981]' : r.budgetMatch === 'Good' ? 'bg-[#0057B8]/10 text-[#0057B8]' : r.budgetMatch === 'Moderate' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#EF4444]/10 text-[#EF4444]',
                    )}>
                      Budget: {r.budgetMatch}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col gap-2 shrink-0">
                  <Button
                    onClick={() => onNavigate('course', r.slug)}
                    className="h-9 px-4 rounded-xl text-xs font-semibold"
                    style={{ backgroundColor: '#0057B8', color: '#fff' }}
                  >
                    View Course
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onNavigate('compare')}
                    className="h-9 px-4 rounded-xl text-xs font-medium border-[#E2E8F0]"
                  >
                    Compare
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ALOnboarding({ onBack, onNavigate, onLeadOpen }: ALOnboardingProps) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'input' | 'analyzing' | 'results'>('input');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({
    subject: '', qualification: '', cgpa: '', englishTest: '',
    englishScore: '', countries: [], budget: '', intake: '',
  });

  const updateProfile = (key: string, value: string | string[]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const startAnalysis = () => {
    setPhase('analyzing');
  };

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams();
      if (profile.subject) params.set('subject', profile.subject);
      if (profile.qualification) params.set('level', profile.qualification.includes('Master') || profile.qualification.includes('Bachelor') ? 'Postgraduate' : 'Undergraduate');
      if (profile.countries.length > 0) params.set('countries', profile.countries.join(','));

      const res = await fetch(`/api/courses?${params.toString()}&limit=20`);
      const data = await res.json();
      const courses = data.courses || [];

      const matchResults: MatchResult[] = courses.map((c: any) => {
        let score = 60;
        let academicMatch = 'Good';
        let englishMatch = 'Good';
        let budgetMatch = 'Moderate';

        // Score based on various factors
        if (profile.subject && c.subject?.toLowerCase().includes(profile.subject.toLowerCase().split(' ')[0])) score += 15;
        if (profile.countries.includes(c.countrySlug)) score += 10;
        if (profile.englishScore && c.englishRequirement) {
          const reqScore = parseFloat(c.englishRequirement.replace(/[^0-9.]/g, '')) || 6.5;
          const userScore = parseFloat(profile.englishScore) || 0;
          if (userScore >= reqScore) { score += 10; englishMatch = 'Excellent'; }
          else if (userScore >= reqScore - 0.5) { score += 5; englishMatch = 'Good'; }
          else { englishMatch = 'Needs Improvement'; }
        }
        if (profile.cgpa) {
          const cgpa = parseFloat(profile.cgpa) || 0;
          if (cgpa >= 3.5) { score += 5; academicMatch = 'Excellent'; }
          else if (cgpa >= 3.0) { academicMatch = 'Good'; }
          else { academicMatch = 'Fair'; }
        }

        score = Math.min(score, 98);

        return {
          slug: c.slug,
          name: c.name,
          universitySlug: c.universitySlug,
          universityName: c.universityName || '',
          countrySlug: c.countrySlug,
          city: c.city || '',
          level: c.level || '',
          subject: c.subject || '',
          tuition: c.tuition || '',
          tuitionCurrency: c.tuitionCurrency || 'GBP',
          duration: c.duration || '',
          intake: c.intake || '',
          englishRequirement: c.englishRequirement || '',
          matchScore: score,
          academicMatch,
          englishMatch,
          budgetMatch,
        };
      });

      matchResults.sort((a, b) => b.matchScore - a.matchScore);
      setResults(matchResults);
      setPhase('results');
    } catch {
      setPhase('results');
    }
  };

  const handleAnalysisDone = () => {
    fetchResults();
  };

  const currentStepId = STEPS[step]?.id;

  const renderStep = () => {
    if (phase === 'analyzing') {
      return <AnalyzingAnimation onDone={handleAnalysisDone} />;
    }
    if (phase === 'results') {
      return <MatchResults results={results} profile={profile} onNavigate={onNavigate} />;
    }

    switch (currentStepId) {
      case 'subject':
        return <SubjectStep value={profile.subject} onChange={(v) => updateProfile('subject', v)} onNext={nextStep} />;
      case 'qualification':
        return <QualificationStep value={profile.qualification} onChange={(v) => updateProfile('qualification', v)} onNext={nextStep} onBack={prevStep} />;
      case 'cgpa':
        return <CgpaStep value={profile.cgpa} onChange={(v) => updateProfile('cgpa', v)} onNext={nextStep} onBack={prevStep} />;
      case 'english':
        return <EnglishStep profile={profile} onUpdate={updateProfile} onNext={step === STEPS.length - 1 ? startAnalysis : nextStep} onBack={prevStep} />;
      case 'countries':
        return <CountriesStep value={profile.countries} onChange={(v) => updateProfile('countries', v)} onNext={nextStep} onBack={prevStep} />;
      case 'budget':
        return <BudgetStep value={profile.budget} onChange={(v) => updateProfile('budget', v)} onNext={nextStep} onBack={prevStep} />;
      case 'intake':
        return <IntakeStep value={profile.intake} onChange={(v) => updateProfile('intake', v)} onNext={startAnalysis} onBack={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={phase === 'input' ? onBack : () => { setPhase('input'); setStep(0); }} className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors min-h-[48px]">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #0057B8, #003D82)' }}>A</div>
            <span className="font-semibold text-[#0F172A] text-sm hidden sm:inline">ALO Study Plan</span>
          </div>
          {phase === 'input' && (
            <span className="text-sm text-[#64748B]">Step {step + 1} of {STEPS.length}</span>
          )}
          {phase === 'results' && (
            <Button onClick={onLeadOpen} className="h-9 px-4 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#E8501A', color: '#fff' }}>
              Get Counselor Help
            </Button>
          )}
          {phase === 'analyzing' && <span className="text-sm text-[#64748B]">Analyzing...</span>}
        </div>
        {phase === 'input' && (
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-3">
            <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5 rounded-full" />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {renderStep()}
      </div>
    </div>
  );
}
