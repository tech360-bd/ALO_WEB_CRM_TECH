'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  GraduationCap, Globe, BookOpen, ClipboardCheck, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, RotateCcw,
  MapPin, DollarSign, Calendar, Award, Building2, ExternalLink, User, Phone,
  Mail, Flag, Briefcase, FileText, Download, Filter, Search, X, Plus, Trash2,
  Printer, TrendingUp, TrendingDown, Minus, Info, AlertTriangle, Eye,
  MessageSquare, ShieldCheck, Clock, Target, BarChart3, CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── ALO Brand Colors ─────────────────────────────────────────────────────────
const ALO_BLUE = '#2563EB';
const ALO_ORANGE = '#F97316';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AcademicQualification {
  qualificationCountry: string;
  qualificationSystem: string;
  qualificationType: string;
  institutionName: string;
  board: string;
  subject: string;
  startYear: string;
  completionYear: string;
  resultType: string;
  gpa: string;
  gpaScale: string;
  percentage: string;
  grade: string;
  classification: string;
  creditsCompleted: string;
  totalCredits: string;
  backlogs: string;
  retakes: string;
  certificateAvailable: boolean;
  transcriptAvailable: boolean;
  mediumOfInstruction: string;
  studyMode: string;
}

interface EnglishTest {
  testType: string;
  overallScore: string;
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
  testDate: string;
  expiryDate: string;
  oneSkillRetake: boolean;
}

interface WorkExperienceItem {
  employer: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  currentEmployment: boolean;
  industry: string;
  responsibilities: string;
  relevantExperience: boolean;
  managementExperience: boolean;
  totalMonths: string;
}

interface StudyGap {
  graduationDate: string;
  currentDate: string;
  totalGap: string;
  gapReason: string;
  employmentDuringGap: boolean;
  trainingDuringGap: boolean;
  explanation: string;
}

interface StudyPreferences {
  preferredCountries: string[];
  preferredCities: string;
  preferredUniversities: string;
  preferredSubject: string;
  preferredSpecialisation: string;
  preferredQualification: string;
  preferredStudyLevel: string;
  preferredIntake: string;
  preferredStartYear: string;
  studyMode: string;
  deliveryMode: string;
  placementPreference: string;
  internshipPreference: string;
  scholarshipPreference: string;
  maxTuitionBudget: string;
  maxTotalYearlyBudget: string;
  currency: string;
  postStudyWorkPreference: string;
  rankingPreference: string;
}

interface Requirement {
  name: string;
  universityRequirement: string | null;
  studentValue: string | null;
  result: string;
  source: string;
  lastVerifiedAt: string | null;
  action: string | null;
}

interface ImprovementPlan {
  currentGap: string;
  requiredAction: string;
  estimatedTimeline: string;
  document: string;
  aloService: string;
  recommendedAlternative: string | null;
}

interface EligibilityResult {
  courseTitle: string;
  universityName: string | null;
  country: string;
  studyLevel: string;
  qualification: string;
  tuitionFee: number | null;
  tuitionCurrency: string;
  eligibilityCategory: string;
  matchScore: number;
  requirements: Requirement[];
  improvementPlan: ImprovementPlan[];
  slug: string;
  alternativeRoutes: { courseTitle: string; universityName: string | null; reason: string; slug: string }[];
}

interface EligibilitySummary {
  eligible: number;
  likelyEligible: number;
  conditionallyEligible: number;
  partiallyMatched: number;
  notCurrentlyEligible: number;
  insufficientInfo: number;
  counsellorReviewRequired: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const QUALIFICATION_TYPES = [
  'SSC', 'HSC', "A-Levels", 'O-Levels', 'IB', 'Diploma', 'HND',
  "Associate Degree", "Bachelor's", "Bachelor's Incomplete", 'Top-up',
  "Master's", 'MPhil', 'Professional', 'Other',
] as const;

const ENGLISH_TEST_TYPES = [
  'IELTS Academic', 'IELTS UKVI', 'PTE Academic', 'TOEFL iBT',
  'Duolingo', 'LanguageCert', 'Cambridge', 'OET', 'MOI', 'None',
] as const;

const RESULT_TYPES = ['GPA', 'Percentage', 'Grade', 'Division', 'Classification'] as const;
const CLASSIFICATIONS = ['First', 'Upper Second', 'Lower Second', 'Third', 'Pass'] as const;

const COUNTRIES_LIST = [
  'Bangladesh', 'India', 'Pakistan', 'Nigeria', 'Ghana', 'Kenya', 'Sri Lanka',
  'Nepal', 'UAE', 'Saudi Arabia', 'Malaysia', 'UK', 'USA', 'Canada', 'Australia',
  'Germany', 'New Zealand', 'Ireland', 'Sweden', 'Denmark', 'Netherlands', 'Other',
];

const PREFERRED_COUNTRIES_LIST = [
  'UK', 'USA', 'Canada', 'Australia', 'Germany', 'Netherlands', 'New Zealand',
  'Ireland', 'Sweden', 'Denmark', 'Malaysia', 'Other',
];

const STUDY_LEVELS_LIST = [
  'Foundation', 'Undergraduate (Bachelor\'s)', 'Postgraduate (Master\'s)',
  'MBA', 'PhD', 'Diploma / Certificate', 'Other',
];

const INTAKE_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'Any / Flexible',
];

const GAP_REASONS = [
  'No gap', 'Employment', 'Training', 'Business', 'Family', 'Medical', 'Other',
] as const;

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Other'];
const STUDY_MODES = ['Full-time', 'Part-time'];
const DELIVERY_MODES = ['Campus', 'Online', 'Hybrid'];

const CURRENCIES = ['GBP', 'USD', 'EUR', 'AUD', 'CAD', 'NZD', 'INR', 'BDT', 'PKR', 'Other'];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgClass: string; textClass: string; borderClass: string; icon: React.ReactNode }> = {
  ELIGIBLE: {
    label: 'Eligible',
    color: '#16A34A',
    bgClass: 'bg-green-100 dark:bg-green-950',
    textClass: 'text-green-800 dark:text-green-200',
    borderClass: 'border-green-300 dark:border-green-700',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  LIKELY_ELIGIBLE: {
    label: 'Likely Eligible',
    color: '#2563EB',
    bgClass: 'bg-blue-100 dark:bg-blue-950',
    textClass: 'text-blue-800 dark:text-blue-200',
    borderClass: 'border-blue-300 dark:border-blue-700',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  CONDITIONALLY_ELIGIBLE: {
    label: 'Conditional',
    color: '#CA8A04',
    bgClass: 'bg-yellow-100 dark:bg-yellow-950',
    textClass: 'text-yellow-800 dark:text-yellow-200',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  PARTIALLY_MATCHED: {
    label: 'Partial',
    color: '#F97316',
    bgClass: 'bg-orange-100 dark:bg-orange-950',
    textClass: 'text-orange-800 dark:text-orange-200',
    borderClass: 'border-orange-300 dark:border-orange-700',
    icon: <Minus className="h-4 w-4" />,
  },
  NOT_CURRENTLY_ELIGIBLE: {
    label: 'Not Currently Eligible',
    color: '#DC2626',
    bgClass: 'bg-red-100 dark:bg-red-950',
    textClass: 'text-red-800 dark:text-red-200',
    borderClass: 'border-red-300 dark:border-red-700',
    icon: <X className="h-4 w-4" />,
  },
  INSUFFICIENT_INFO: {
    label: 'Info Needed',
    color: '#6B7280',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    textClass: 'text-gray-700 dark:text-gray-300',
    borderClass: 'border-gray-300 dark:border-gray-600',
    icon: <Info className="h-4 w-4" />,
  },
  COUNSELLOR_REVIEW_REQUIRED: {
    label: 'Counsellor Review',
    color: '#7C3AED',
    bgClass: 'bg-purple-100 dark:bg-purple-950',
    textClass: 'text-purple-800 dark:text-purple-200',
    borderClass: 'border-purple-300 dark:border-purple-700',
    icon: <Eye className="h-4 w-4" />,
  },
};

const REQ_RESULT_STYLES: Record<string, { label: string; bgClass: string; textClass: string }> = {
  MET: { label: 'MET', bgClass: 'bg-green-100 dark:bg-green-900/40', textClass: 'text-green-700 dark:text-green-300' },
  NOT_MET: { label: 'NOT MET', bgClass: 'bg-red-100 dark:bg-red-900/40', textClass: 'text-red-700 dark:text-red-300' },
  CONDITION: { label: 'CONDITION', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40', textClass: 'text-yellow-700 dark:text-yellow-300' },
  MISSING_INFO: { label: 'MISSING', bgClass: 'bg-gray-100 dark:bg-gray-800', textClass: 'text-gray-600 dark:text-gray-400' },
};

// ─── Empty factories ──────────────────────────────────────────────────────────
const emptyQualification = (): AcademicQualification => ({
  qualificationCountry: '', qualificationSystem: '', qualificationType: '', institutionName: '',
  board: '', subject: '', startYear: '', completionYear: '', resultType: 'GPA',
  gpa: '', gpaScale: '4.0', percentage: '', grade: '', classification: '',
  creditsCompleted: '', totalCredits: '', backlogs: '0', retakes: '0',
  certificateAvailable: false, transcriptAvailable: false, mediumOfInstruction: 'English', studyMode: 'Full-time',
});

const emptyEnglishTest = (): EnglishTest => ({
  testType: 'IELTS Academic', overallScore: '', listening: '', reading: '',
  writing: '', speaking: '', testDate: '', expiryDate: '', oneSkillRetake: false,
});

const emptyWorkExperience = (): WorkExperienceItem => ({
  employer: '', jobTitle: '', employmentType: 'Full-time', startDate: '', endDate: '',
  currentEmployment: false, industry: '', responsibilities: '', relevantExperience: false,
  managementExperience: false, totalMonths: '',
});

const emptyStudyGap = (): StudyGap => ({
  graduationDate: '', currentDate: new Date().toISOString().split('T')[0],
  totalGap: '', gapReason: 'No gap', employmentDuringGap: false,
  trainingDuringGap: false, explanation: '',
});

const emptyPreferences = (): StudyPreferences => ({
  preferredCountries: [], preferredCities: '', preferredUniversities: '', preferredSubject: '',
  preferredSpecialisation: '', preferredQualification: '', preferredStudyLevel: '',
  preferredIntake: 'September', preferredStartYear: new Date().getFullYear().toString(),
  studyMode: 'Full-time', deliveryMode: 'Campus', placementPreference: '',
  internshipPreference: '', scholarshipPreference: 'Yes', maxTuitionBudget: '',
  maxTotalYearlyBudget: '', currency: 'GBP', postStudyWorkPreference: '', rankingPreference: '',
});

// ─── Component ────────────────────────────────────────────────────────────────
export function EligibilityCheckerEnhanced() {
  // ── State ──
  const [step, setStep] = useState(0); // 0=hero, 1-4=form steps, 5=gap, 6=results
  const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', nationality: '', countryOfResidence: '' });
  const [qualifications, setQualifications] = useState<AcademicQualification[]>([emptyQualification()]);
  const [englishTests, setEnglishTests] = useState<EnglishTest[]>([emptyEnglishTest()]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceItem[]>([]);
  const [studyGap, setStudyGap] = useState<StudyGap>(emptyStudyGap());
  const [preferences, setPreferences] = useState<StudyPreferences>(emptyPreferences());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [summary, setSummary] = useState<EligibilitySummary | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Study gap auto-calculation ──
  useEffect(() => {
    if (studyGap.graduationDate) {
      const gradDate = new Date(studyGap.graduationDate);
      const now = new Date();
      const diffMs = now.getTime() - gradDate.getTime();
      const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      let gapStr = '';
      if (years > 0) gapStr += `${years} year${years > 1 ? 's' : ''}`;
      if (months > 0) gapStr += `${gapStr ? ' ' : ''}${months} month${months > 1 ? 's' : ''}`;
      if (!gapStr) gapStr = 'Less than 1 month';
      setStudyGap(prev => ({ ...prev, totalGap: gapStr, currentDate: now.toISOString().split('T')[0] }));
    }
  }, [studyGap.graduationDate]);

  // ── Helpers ──
  const updatePersonal = useCallback((field: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateQualification = useCallback((index: number, field: keyof AcademicQualification, value: string | boolean) => {
    setQualifications(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  }, []);

  const addQualification = useCallback(() => setQualifications(prev => [...prev, emptyQualification()]), []);
  const removeQualification = useCallback((index: number) => {
    setQualifications(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const updateEnglishTest = useCallback((index: number, field: keyof EnglishTest, value: string | boolean) => {
    setEnglishTests(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  }, []);

  const addEnglishTest = useCallback(() => setEnglishTests(prev => [...prev, emptyEnglishTest()]), []);
  const removeEnglishTest = useCallback((index: number) => {
    setEnglishTests(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const updateWorkExperience = useCallback((index: number, field: keyof WorkExperienceItem, value: string | boolean) => {
    setWorkExperiences(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  }, []);

  const addWorkExperience = useCallback(() => setWorkExperiences(prev => [...prev, emptyWorkExperience()]), []);
  const removeWorkExperience = useCallback((index: number) => {
    setWorkExperiences(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateGap = useCallback((field: keyof StudyGap, value: string | boolean) => {
    setStudyGap(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleCountry = useCallback((country: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(country)
        ? prev.preferredCountries.filter(c => c !== country)
        : [...prev.preferredCountries, country],
    }));
  }, []);

  const updatePreference = useCallback((field: keyof StudyPreferences, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Navigation ──
  const goNext = useCallback(() => setStep(prev => Math.min(prev + 1, 6)), []);
  const goBack = useCallback(() => setStep(prev => Math.max(prev - 1, 0)), []);

  const toggleExpand = useCallback((slug: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const payload = {
        academicProfile: qualifications.map(q => ({
          qualificationCountry: q.qualificationCountry,
          qualificationSystem: q.qualificationSystem,
          qualificationType: q.qualificationType,
          institutionName: q.institutionName,
          board: q.board,
          subject: q.subject,
          startYear: q.startYear ? parseInt(q.startYear) : null,
          completionYear: q.completionYear ? parseInt(q.completionYear) : null,
          resultType: q.resultType,
          gpa: q.gpa ? parseFloat(q.gpa) : null,
          gpaScale: q.gpaScale ? parseFloat(q.gpaScale) : null,
          percentage: q.percentage ? parseFloat(q.percentage) : null,
          grade: q.grade || null,
          classification: q.classification || null,
          creditsCompleted: q.creditsCompleted ? parseInt(q.creditsCompleted) : null,
          totalCredits: q.totalCredits ? parseInt(q.totalCredits) : null,
          backlogs: q.backlogs ? parseInt(q.backlogs) : 0,
          retakes: q.retakes ? parseInt(q.retakes) : 0,
          certificateAvailable: q.certificateAvailable,
          transcriptAvailable: q.transcriptAvailable,
          mediumOfInstruction: q.mediumOfInstruction,
          studyMode: q.studyMode,
        })),
        englishTests: englishTests.filter(t => t.testType !== 'None').map(t => ({
          testType: t.testType,
          overallScore: t.overallScore ? parseFloat(t.overallScore) : null,
          listening: t.listening ? parseFloat(t.listening) : null,
          reading: t.reading ? parseFloat(t.reading) : null,
          writing: t.writing ? parseFloat(t.writing) : null,
          speaking: t.speaking ? parseFloat(t.speaking) : null,
          testDate: t.testDate || null,
          expiryDate: t.expiryDate || null,
          oneSkillRetake: t.oneSkillRetake,
        })),
        workExperience: workExperiences.map(w => ({
          employer: w.employer,
          jobTitle: w.jobTitle,
          employmentType: w.employmentType,
          startDate: w.startDate || null,
          endDate: w.endDate || null,
          currentEmployment: w.currentEmployment,
          industry: w.industry,
          responsibilities: w.responsibilities,
          relevantExperience: w.relevantExperience,
          managementExperience: w.managementExperience,
          totalMonths: w.totalMonths ? parseInt(w.totalMonths) : null,
        })),
        studyGap: {
          graduationDate: studyGap.graduationDate || null,
          totalGap: studyGap.totalGap || null,
          gapReason: studyGap.gapReason,
          employmentDuringGap: studyGap.employmentDuringGap,
          trainingDuringGap: studyGap.trainingDuringGap,
          explanation: studyGap.explanation || null,
        },
        studyPreferences: {
          preferredCountries: preferences.preferredCountries,
          preferredCities: preferences.preferredCities || null,
          preferredUniversities: preferences.preferredUniversities || null,
          preferredSubject: preferences.preferredSubject || null,
          preferredSpecialisation: preferences.preferredSpecialisation || null,
          preferredQualification: preferences.preferredQualification || null,
          preferredStudyLevel: preferences.preferredStudyLevel || null,
          preferredIntake: preferences.preferredIntake || null,
          preferredStartYear: preferences.preferredStartYear || null,
          studyMode: preferences.studyMode || null,
          deliveryMode: preferences.deliveryMode || null,
          maxTuitionBudget: preferences.maxTuitionBudget ? parseFloat(preferences.maxTuitionBudget) : null,
          maxTotalYearlyBudget: preferences.maxTotalYearlyBudget ? parseFloat(preferences.maxTotalYearlyBudget) : null,
          currency: preferences.currency || null,
        },
      };

      const res = await fetch('/api/course-finder/eligibility-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to evaluate eligibility');
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary || null);

      // Save to sessionStorage
      sessionStorage.setItem('alo-eligibility-results', JSON.stringify(data));

      setStep(6);
      toast.success(`Evaluation complete! ${data.total || 0} courses assessed.`);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      console.error(err);
      toast.error('Failed to evaluate eligibility. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [qualifications, englishTests, workExperiences, studyGap, preferences]);

  // ── Reset ──
  const handleStartOver = useCallback(() => {
    setStep(0);
    setPersonalInfo({ name: '', email: '', phone: '', nationality: '', countryOfResidence: '' });
    setQualifications([emptyQualification()]);
    setEnglishTests([emptyEnglishTest()]);
    setWorkExperiences([]);
    setStudyGap(emptyStudyGap());
    setPreferences(emptyPreferences());
    setResults([]);
    setSummary(null);
    setActiveFilter(null);
    setExpandedResults(new Set());
    sessionStorage.removeItem('alo-eligibility-results');
  }, []);

  // ── Download ──
  const handleDownload = useCallback(() => {
    window.print();
  }, []);

  // ── Filtered results ──
  const filteredResults = useMemo(() => {
    if (!activeFilter) return results;
    return results.filter(r => r.eligibilityCategory === activeFilter);
  }, [results, activeFilter]);

  // ── Step labels ──
  const stepLabels = ['Personal Info', 'Academic Profile', 'Study Gap', 'English & Work', 'Study Preferences'];
  const stepProgress = step === 0 ? 0 : step >= 6 ? 100 : (step / 5) * 100;

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Hero
  // ═══════════════════════════════════════════════════════════════════════════════
  if (step === 0) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${ALO_BLUE} 0%, #073B8C 60%, ${ALO_ORANGE} 100%)` }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-white" />
            <span className="text-white/90 text-sm font-medium">ALO Education Eligibility Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Check Your Eligibility with ALO Education
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Get preliminary guidance on your eligibility for courses worldwide. Our engine evaluates your academic profile, English scores, and preferences against verified course data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={goNext} className="bg-white text-[#2563EB] hover:bg-white/90 font-semibold px-8 py-3 text-base shadow-lg">
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Start Eligibility Check
            </Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 px-8 py-3 text-base">
              <BookOpen className="h-5 w-5 mr-2" />
              How It Works
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { icon: <GraduationCap className="h-6 w-6" />, title: 'Academic Matching', desc: 'Your qualifications compared against entry requirements' },
              { icon: <Target className="h-6 w-6" />, title: 'English Test Evaluation', desc: 'IELTS, PTE, TOEFL & more checked automatically' },
              { icon: <BarChart3 className="h-6 w-6" />, title: 'Detailed Analysis', desc: 'Get match scores, gaps, and improvement plans' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white mb-2">{item.icon}</div>
                <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-white/70 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Results Page
  // ═══════════════════════════════════════════════════════════════════════════════
  if (step === 6) {
    return (
      <div ref={resultsRef} className="max-w-5xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: ALO_BLUE }}>Eligibility Results</h2>
            <p className="text-sm text-muted-foreground mt-1">{results.length} courses evaluated for {personalInfo.name || 'your profile'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="h-4 w-4 mr-1" /> Start Over
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Download Results
            </Button>
          </div>
        </div>

        {/* Summary Bar */}
        {summary && (
          <Card className="mb-6 border-2" style={{ borderColor: ALO_BLUE }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Results Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                  const count = getSummaryCount(summary, key);
                  if (count === 0) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer',
                        cfg.bgClass, cfg.borderClass,
                        activeFilter === key && 'ring-2 ring-offset-2 ring-gray-400'
                      )}
                    >
                      <div className={cn('text-lg font-bold', cfg.textClass)}>{count}</div>
                      <div className={cn('text-[10px] font-medium text-center leading-tight', cfg.textClass)}>{cfg.label}</div>
                    </button>
                  );
                })}
              </div>
              {activeFilter && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Filtered: {CATEGORY_CONFIG[activeFilter]?.label}</Badge>
                  <button onClick={() => setActiveFilter(null)} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear filter
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your preferences or broadening your search criteria.</p>
            <Button variant="outline" onClick={handleStartOver}><RotateCcw className="h-4 w-4 mr-2" />Start Over</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result, idx) => (
              <ResultCard
                key={result.slug || idx}
                result={result}
                expanded={expandedResults.has(result.slug || String(idx))}
                onToggle={() => toggleExpand(result.slug || String(idx))}
              />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <Card className="mt-8 bg-muted/50 border-dashed">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Eligibility results are preliminary guidance based on the information provided and the latest verified course data available to ALO Education. Final admission decisions are made by the university.</p>
                <p>Visa eligibility and visa decisions are determined by the relevant immigration authority.</p>
                <p>Fees, intakes and requirements may change. Check the last verified date and request counsellor confirmation before applying.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Form Steps (1-5)
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={step === 1 ? handleStartOver : goBack} className="text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> {step === 1 ? 'Back to Start' : 'Previous'}
          </Button>
          <span className="text-sm font-medium" style={{ color: ALO_BLUE }}>
            Step {step} of 5 — {stepLabels[step - 1]}
          </span>
          <div className="w-24" />
        </div>
        <Progress value={stepProgress} className="h-2" />
        <div className="flex justify-between mt-2">
          {stepLabels.map((label, i) => (
            <span key={i} className={cn('text-[10px] hidden sm:block', i + 1 === step ? 'font-semibold' : 'text-muted-foreground')} style={i + 1 === step ? { color: ALO_BLUE } : {}}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-2" style={{ borderColor: ALO_BLUE + '40' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl" style={{ color: ALO_BLUE }}>{getStepTitle(step)}</CardTitle>
          <CardDescription>{getStepDescription(step)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && renderPersonalInfo()}
          {step === 2 && renderAcademicProfile()}
          {step === 3 && renderStudyGapSection()}
          {step === 4 && renderEnglishAndWork()}
          {step === 5 && renderStudyPreferences()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={step === 1 ? handleStartOver : goBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {step === 1 ? 'Cancel' : 'Previous'}
        </Button>
        {step < 5 ? (
          <Button onClick={goNext} style={{ background: ALO_BLUE, color: '#fff' }} className="hover:opacity-90">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} style={{ background: ALO_ORANGE, color: '#fff' }} className="hover:opacity-90">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evaluating...</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Check Eligibility</>}
          </Button>
        )}
      </div>
    </div>
  );

  // ─── Step Titles / Descriptions ─────────────────────────────────────────────
  function getStepTitle(s: number) {
    const titles: Record<number, string> = {
      1: 'Personal Information',
      2: 'Academic Profile',
      3: 'Study Gap Information',
      4: 'English Tests & Work Experience',
      5: 'Study Preferences',
    };
    return titles[s] || '';
  }

  function getStepDescription(s: number) {
    const descs: Record<number, string> = {
      1: 'Tell us about yourself so we can personalise your eligibility assessment.',
      2: 'Add all your academic qualifications. You can add multiple entries.',
      3: 'Help us understand any gaps in your education history.',
      4: 'Enter your English language test scores and any work experience.',
      5: 'Tell us what and where you want to study so we can match you with the right courses.',
    };
    return descs[s] || '';
  }

  // ─── Step 1: Personal Info ─────────────────────────────────────────────────
  function renderPersonalInfo() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name" required>
          <Input placeholder="Your full name" value={personalInfo.name} onChange={e => updatePersonal('name', e.target.value)} />
        </FormField>
        <FormField label="Email Address" required>
          <Input type="email" placeholder="you@example.com" value={personalInfo.email} onChange={e => updatePersonal('email', e.target.value)} />
        </FormField>
        <FormField label="Phone Number">
          <Input type="tel" placeholder="+880 1XXX-XXXXXX" value={personalInfo.phone} onChange={e => updatePersonal('phone', e.target.value)} />
        </FormField>
        <FormField label="Nationality" required>
          <Select value={personalInfo.nationality} onValueChange={v => updatePersonal('nationality', v)}>
            <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {COUNTRIES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Country of Residence" required className="sm:col-span-2">
          <Select value={personalInfo.countryOfResidence} onValueChange={v => updatePersonal('countryOfResidence', v)}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {COUNTRIES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    );
  }

  // ─── Step 2: Academic Profile ──────────────────────────────────────────────
  function renderAcademicProfile() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Add all qualifications, starting with your most recent.</p>
          <Button variant="outline" size="sm" onClick={addQualification}>
            <Plus className="h-4 w-4 mr-1" /> Add Qualification
          </Button>
        </div>
        {qualifications.map((qual, idx) => (
          <div key={idx} className="border rounded-xl p-4 space-y-4 relative">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm" style={{ color: ALO_BLUE }}>
                Qualification {idx + 1}{qual.qualificationType ? ` — ${qual.qualificationType}` : ''}
              </h4>
              {qualifications.length > 1 && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeQualification(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Qualification Type" required>
                <Select value={qual.qualificationType} onValueChange={v => updateQualification(idx, 'qualificationType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {QUALIFICATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Qualification Country">
                <Select value={qual.qualificationCountry} onValueChange={v => updateQualification(idx, 'qualificationCountry', v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {COUNTRIES_LIST.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Qualification System">
                <Input placeholder="e.g., SSC, CBSE, Edexcel" value={qual.qualificationSystem} onChange={e => updateQualification(idx, 'qualificationSystem', e.target.value)} />
              </FormField>
              <FormField label="Institution Name">
                <Input placeholder="University / College name" value={qual.institutionName} onChange={e => updateQualification(idx, 'institutionName', e.target.value)} />
              </FormField>
              <FormField label="Board / Awarding Body">
                <Input placeholder="e.g., Dhaka University, Edexcel" value={qual.board} onChange={e => updateQualification(idx, 'board', e.target.value)} />
              </FormField>
              <FormField label="Subject / Major">
                <Input placeholder="e.g., Computer Science" value={qual.subject} onChange={e => updateQualification(idx, 'subject', e.target.value)} />
              </FormField>
              <FormField label="Start Year">
                <Input type="number" placeholder="e.g., 2019" value={qual.startYear} onChange={e => updateQualification(idx, 'startYear', e.target.value)} />
              </FormField>
              <FormField label="Completion Year">
                <Input type="number" placeholder="e.g., 2023" value={qual.completionYear} onChange={e => updateQualification(idx, 'completionYear', e.target.value)} />
              </FormField>
              <FormField label="Result Type">
                <Select value={qual.resultType} onValueChange={v => updateQualification(idx, 'resultType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESULT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              {qual.resultType === 'GPA' && (
                <>
                  <FormField label="GPA Value">
                    <Input type="number" step="0.01" placeholder="e.g., 3.5" value={qual.gpa} onChange={e => updateQualification(idx, 'gpa', e.target.value)} />
                  </FormField>
                  <FormField label="GPA Scale">
                    <Select value={qual.gpaScale} onValueChange={v => updateQualification(idx, 'gpaScale', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['4.0', '5.0', '7.0', '10.0'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </>
              )}
              {qual.resultType === 'Percentage' && (
                <FormField label="Percentage">
                  <Input type="number" step="0.1" placeholder="e.g., 78.5" value={qual.percentage} onChange={e => updateQualification(idx, 'percentage', e.target.value)} />
                </FormField>
              )}
              {qual.resultType === 'Grade' && (
                <FormField label="Grade">
                  <Input placeholder="e.g., A, B+" value={qual.grade} onChange={e => updateQualification(idx, 'grade', e.target.value)} />
                </FormField>
              )}
              {qual.resultType === 'Classification' && (
                <FormField label="Classification">
                  <Select value={qual.classification} onValueChange={v => updateQualification(idx, 'classification', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
              <FormField label="Credits Completed">
                <Input type="number" placeholder="e.g., 120" value={qual.creditsCompleted} onChange={e => updateQualification(idx, 'creditsCompleted', e.target.value)} />
              </FormField>
              <FormField label="Total Credits">
                <Input type="number" placeholder="e.g., 160" value={qual.totalCredits} onChange={e => updateQualification(idx, 'totalCredits', e.target.value)} />
              </FormField>
              <FormField label="Backlogs">
                <Input type="number" placeholder="0" value={qual.backlogs} onChange={e => updateQualification(idx, 'backlogs', e.target.value)} />
              </FormField>
              <FormField label="Retakes">
                <Input type="number" placeholder="0" value={qual.retakes} onChange={e => updateQualification(idx, 'retakes', e.target.value)} />
              </FormField>
              <FormField label="Medium of Instruction">
                <Select value={qual.mediumOfInstruction} onValueChange={v => updateQualification(idx, 'mediumOfInstruction', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['English', 'Bengali', 'Hindi', 'Urdu', 'Arabic', 'Other'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Study Mode">
                <Select value={qual.studyMode} onValueChange={v => updateQualification(idx, 'studyMode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STUDY_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={qual.certificateAvailable} onCheckedChange={v => updateQualification(idx, 'certificateAvailable', v)} />
                <Label className="text-sm">Certificate Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={qual.transcriptAvailable} onCheckedChange={v => updateQualification(idx, 'transcriptAvailable', v)} />
                <Label className="text-sm">Transcript Available</Label>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Step 3: Study Gap ─────────────────────────────────────────────────────
  function renderStudyGapSection() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Most Recent Graduation / Completion Date">
            <Input type="date" value={studyGap.graduationDate} onChange={e => updateGap('graduationDate', e.target.value)} />
          </FormField>
          <FormField label="Current Date" disabled>
            <Input type="date" value={studyGap.currentDate} disabled />
          </FormField>
          <FormField label="Total Study Gap" disabled>
            <Input value={studyGap.totalGap || 'Will auto-calculate'} disabled />
          </FormField>
          <FormField label="Primary Reason for Gap">
            <Select value={studyGap.gapReason} onValueChange={v => updateGap('gapReason', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GAP_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={studyGap.employmentDuringGap} onCheckedChange={v => updateGap('employmentDuringGap', v)} />
            <Label className="text-sm">Employment during gap</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={studyGap.trainingDuringGap} onCheckedChange={v => updateGap('trainingDuringGap', v)} />
            <Label className="text-sm">Training / courses during gap</Label>
          </div>
        </div>
        <FormField label="Gap Explanation (optional)">
          <Textarea
            placeholder="Briefly explain what you did during this period..."
            value={studyGap.explanation}
            onChange={e => updateGap('explanation', e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    );
  }

  // ─── Step 4: English Tests & Work Experience ───────────────────────────────
  function renderEnglishAndWork() {
    return (
      <div className="space-y-8">
        {/* English Tests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: ALO_BLUE }}>English Language Tests</h3>
            <Button variant="outline" size="sm" onClick={addEnglishTest}>
              <Plus className="h-4 w-4 mr-1" /> Add Test
            </Button>
          </div>
          {englishTests.map((test, idx) => (
            <div key={idx} className="border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-muted-foreground">Test {idx + 1}</h4>
                {englishTests.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeEnglishTest(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Test Type" required>
                  <Select value={test.testType} onValueChange={v => updateEnglishTest(idx, 'testType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENGLISH_TEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                {test.testType !== 'None' && test.testType !== 'MOI' && (
                  <>
                    <FormField label="Overall Score">
                      <Input type="number" step="0.5" placeholder="e.g., 6.5" value={test.overallScore} onChange={e => updateEnglishTest(idx, 'overallScore', e.target.value)} />
                    </FormField>
                    <FormField label="Listening">
                      <Input type="number" step="0.5" placeholder="e.g., 6.0" value={test.listening} onChange={e => updateEnglishTest(idx, 'listening', e.target.value)} />
                    </FormField>
                    <FormField label="Reading">
                      <Input type="number" step="0.5" placeholder="e.g., 7.0" value={test.reading} onChange={e => updateEnglishTest(idx, 'reading', e.target.value)} />
                    </FormField>
                    <FormField label="Writing">
                      <Input type="number" step="0.5" placeholder="e.g., 6.0" value={test.writing} onChange={e => updateEnglishTest(idx, 'writing', e.target.value)} />
                    </FormField>
                    <FormField label="Speaking">
                      <Input type="number" step="0.5" placeholder="e.g., 6.5" value={test.speaking} onChange={e => updateEnglishTest(idx, 'speaking', e.target.value)} />
                    </FormField>
                    <FormField label="Test Date">
                      <Input type="date" value={test.testDate} onChange={e => updateEnglishTest(idx, 'testDate', e.target.value)} />
                    </FormField>
                    <FormField label="Expiry Date">
                      <Input type="date" value={test.expiryDate} onChange={e => updateEnglishTest(idx, 'expiryDate', e.target.value)} />
                    </FormField>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch checked={test.oneSkillRetake} onCheckedChange={v => updateEnglishTest(idx, 'oneSkillRetake', v)} />
                      <Label className="text-sm">One-Skill Retake</Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Work Experience */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: ALO_BLUE }}>Work Experience</h3>
            <Button variant="outline" size="sm" onClick={addWorkExperience}>
              <Plus className="h-4 w-4 mr-1" /> Add Experience
            </Button>
          </div>
          {workExperiences.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
              No work experience added yet. Click &ldquo;Add Experience&rdquo; if applicable.
            </p>
          )}
          {workExperiences.map((work, idx) => (
            <div key={idx} className="border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-muted-foreground">Experience {idx + 1}</h4>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeWorkExperience(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Employer">
                  <Input placeholder="Company name" value={work.employer} onChange={e => updateWorkExperience(idx, 'employer', e.target.value)} />
                </FormField>
                <FormField label="Job Title">
                  <Input placeholder="e.g., Software Engineer" value={work.jobTitle} onChange={e => updateWorkExperience(idx, 'jobTitle', e.target.value)} />
                </FormField>
                <FormField label="Employment Type">
                  <Select value={work.employmentType} onValueChange={v => updateWorkExperience(idx, 'employmentType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Start Date">
                  <Input type="month" value={work.startDate} onChange={e => updateWorkExperience(idx, 'startDate', e.target.value)} />
                </FormField>
                <FormField label="End Date">
                  <Input type="month" value={work.endDate} onChange={e => updateWorkExperience(idx, 'endDate', e.target.value)} disabled={work.currentEmployment} />
                </FormField>
                <FormField label="Total Months">
                  <Input type="number" placeholder="e.g., 24" value={work.totalMonths} onChange={e => updateWorkExperience(idx, 'totalMonths', e.target.value)} />
                </FormField>
                <FormField label="Industry">
                  <Input placeholder="e.g., IT, Finance" value={work.industry} onChange={e => updateWorkExperience(idx, 'industry', e.target.value)} />
                </FormField>
              </div>
              <FormField label="Responsibilities">
                <Textarea placeholder="Brief description of your role..." value={work.responsibilities} onChange={e => updateWorkExperience(idx, 'responsibilities', e.target.value)} rows={2} />
              </FormField>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={work.currentEmployment} onCheckedChange={v => updateWorkExperience(idx, 'currentEmployment', v)} />
                  <Label className="text-sm">Currently employed here</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={work.relevantExperience} onCheckedChange={v => updateWorkExperience(idx, 'relevantExperience', v)} />
                  <Label className="text-sm">Relevant to study field</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={work.managementExperience} onCheckedChange={v => updateWorkExperience(idx, 'managementExperience', v)} />
                  <Label className="text-sm">Management experience</Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 5: Study Preferences ─────────────────────────────────────────────
  function renderStudyPreferences() {
    return (
      <div className="space-y-6">
        {/* Preferred Countries (multi-select) */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Preferred Countries <span className="text-red-500">*</span></Label>
          <div className="flex flex-wrap gap-2">
            {PREFERRED_COUNTRIES_LIST.map(country => (
              <button
                key={country}
                onClick={() => toggleCountry(country)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border-2 transition-all',
                  preferences.preferredCountries.includes(country)
                    ? 'text-white shadow-sm'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                )}
                style={preferences.preferredCountries.includes(country) ? { background: ALO_BLUE, borderColor: ALO_BLUE } : {}}
              >
                <Globe className="h-3 w-3 inline mr-1" />{country}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Preferred Cities">
            <Input placeholder="e.g., London, Manchester" value={preferences.preferredCities} onChange={e => updatePreference('preferredCities', e.target.value)} />
          </FormField>
          <FormField label="Preferred Universities">
            <Input placeholder="e.g., University of Manchester" value={preferences.preferredUniversities} onChange={e => updatePreference('preferredUniversities', e.target.value)} />
          </FormField>
          <FormField label="Preferred Subject">
            <Input placeholder="e.g., Computer Science" value={preferences.preferredSubject} onChange={e => updatePreference('preferredSubject', e.target.value)} />
          </FormField>
          <FormField label="Preferred Specialisation">
            <Input placeholder="e.g., Artificial Intelligence" value={preferences.preferredSpecialisation} onChange={e => updatePreference('preferredSpecialisation', e.target.value)} />
          </FormField>
          <FormField label="Preferred Qualification">
            <Input placeholder="e.g., MSc, MBA, BSc" value={preferences.preferredQualification} onChange={e => updatePreference('preferredQualification', e.target.value)} />
          </FormField>
          <FormField label="Preferred Study Level">
            <Select value={preferences.preferredStudyLevel} onValueChange={v => updatePreference('preferredStudyLevel', v)}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                {STUDY_LEVELS_LIST.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Preferred Intake">
            <Select value={preferences.preferredIntake} onValueChange={v => updatePreference('preferredIntake', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTAKE_MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Preferred Start Year">
            <Input type="number" placeholder="e.g., 2025" value={preferences.preferredStartYear} onChange={e => updatePreference('preferredStartYear', e.target.value)} />
          </FormField>
          <FormField label="Study Mode">
            <Select value={preferences.studyMode} onValueChange={v => updatePreference('studyMode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STUDY_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Delivery Mode">
            <Select value={preferences.deliveryMode} onValueChange={v => updatePreference('deliveryMode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DELIVERY_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Placement Preference">
            <Input placeholder="e.g., Yes, No" value={preferences.placementPreference} onChange={e => updatePreference('placementPreference', e.target.value)} />
          </FormField>
          <FormField label="Internship Preference">
            <Input placeholder="e.g., Yes, No" value={preferences.internshipPreference} onChange={e => updatePreference('internshipPreference', e.target.value)} />
          </FormField>
          <FormField label="Scholarship Preference">
            <Select value={preferences.scholarshipPreference} onValueChange={v => updatePreference('scholarshipPreference', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Yes', 'No', 'If available'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Max Tuition Budget">
            <Input type="number" placeholder="e.g., 20000" value={preferences.maxTuitionBudget} onChange={e => updatePreference('maxTuitionBudget', e.target.value)} />
          </FormField>
          <FormField label="Max Total Yearly Budget">
            <Input type="number" placeholder="e.g., 30000" value={preferences.maxTotalYearlyBudget} onChange={e => updatePreference('maxTotalYearlyBudget', e.target.value)} />
          </FormField>
          <FormField label="Currency">
            <Select value={preferences.currency} onValueChange={v => updatePreference('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Post-Study Work Preference">
            <Input placeholder="e.g., PSW in UK" value={preferences.postStudyWorkPreference} onChange={e => updatePreference('postStudyWorkPreference', e.target.value)} />
          </FormField>
          <FormField label="Ranking Preference">
            <Input placeholder="e.g., Top 100, Top 500" value={preferences.rankingPreference} onChange={e => updatePreference('rankingPreference', e.target.value)} />
          </FormField>
        </div>
      </div>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function FormField({ label, required, children, className, disabled }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string; disabled?: boolean;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className={cn('text-sm', disabled && 'text-muted-foreground')}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function getSummaryCount(summary: EligibilitySummary, key: string): number {
  const map: Record<string, number> = {
    ELIGIBLE: summary.eligible,
    LIKELY_ELIGIBLE: summary.likelyEligible,
    CONDITIONALLY_ELIGIBLE: summary.conditionallyEligible,
    PARTIALLY_MATCHED: summary.partiallyMatched,
    NOT_CURRENTLY_ELIGIBLE: summary.notCurrentlyEligible,
    INSUFFICIENT_INFO: summary.insufficientInfo,
    COUNSELLOR_REVIEW_REQUIRED: summary.counsellorReviewRequired,
  };
  return map[key] ?? 0;
}

function MatchScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#16A34A' : score >= 50 ? '#2563EB' : score >= 30 ? '#CA8A04' : '#DC2626';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

function ResultCard({ result, expanded, onToggle }: {
  result: EligibilityResult; expanded: boolean; onToggle: () => void;
}) {
  const cfg = CATEGORY_CONFIG[result.eligibilityCategory] || CATEGORY_CONFIG.INSUFFICIENT_INFO;
  const metReqs = result.requirements.filter(r => r.result === 'MET');
  const isEligibleOrLikely = result.eligibilityCategory === 'ELIGIBLE' || result.eligibilityCategory === 'LIKELY_ELIGIBLE';
  const isConditional = result.eligibilityCategory === 'CONDITIONALLY_ELIGIBLE';
  const isNotEligible = result.eligibilityCategory === 'NOT_CURRENTLY_ELIGIBLE';
  const isInsufficient = result.eligibilityCategory === 'INSUFFICIENT_INFO';
  const isCounsellor = result.eligibilityCategory === 'COUNSELLOR_REVIEW_REQUIRED';

  return (
    <Card className={cn('border-2 transition-all overflow-hidden', cfg.borderClass, expanded && 'shadow-lg')}>
      {/* Header Row (always visible) */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 shrink-0">
          <MatchScoreRing score={result.matchScore} />
          <Badge className={cn('font-semibold gap-1', cfg.bgClass, cfg.textClass)}>
            {cfg.icon} {cfg.label}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base truncate">{result.courseTitle}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            {result.universityName && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{result.universityName}</span>}
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{result.country}</span>
            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{result.studyLevel}</span>
            {result.tuitionFee != null && (
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{result.tuitionCurrency} {result.tuitionFee?.toLocaleString()}</span>
            )}
          </div>
        </div>
        <ChevronRight className={cn('h-5 w-5 text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-90')} />
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-6">
          {/* Requirement Comparison Table */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" style={{ color: ALO_BLUE }} /> Requirement Comparison
            </h4>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>University Requirement</TableHead>
                    <TableHead>Your Profile</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.requirements.map((req, i) => {
                    const rs = REQ_RESULT_STYLES[req.result] || REQ_RESULT_STYLES.MISSING_INFO;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs whitespace-normal min-w-[140px]">{req.name}</TableCell>
                        <TableCell className="text-xs whitespace-normal min-w-[120px]">{req.universityRequirement || '—'}</TableCell>
                        <TableCell className="text-xs whitespace-normal min-w-[100px]">{req.studentValue || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn('text-[10px] font-semibold', rs.bgClass, rs.textClass)}>
                            {rs.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{req.source}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] whitespace-normal">{req.action || '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ELIGIBLE / LIKELY: Why Matched */}
          {isEligibleOrLikely && metReqs.length > 0 && (
            <div className={cn('rounded-lg p-4', cfg.bgClass)}>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: cfg.color }}>
                <CheckCircle2 className="h-4 w-4" /> Why You Matched
              </h4>
              <ul className="space-y-1">
                {metReqs.map((req, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />
                    <span><strong>{req.name}:</strong> {req.studentValue || 'Satisfied'}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="font-semibold" style={{ background: ALO_BLUE, color: '#fff' }}>
                  <ArrowRight className="h-4 w-4 mr-1" /> Apply with ALO Education
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" /> Request Counsellor Review
                </Button>
              </div>
            </div>
          )}

          {/* CONDITIONAL: Improvement Plan */}
          {isConditional && result.improvementPlan && result.improvementPlan.length > 0 && (
            <div className="rounded-lg border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" /> Your Eligibility Improvement Plan
              </h4>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Current Gap</TableHead>
                      <TableHead>Required Action</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>ALO Service</TableHead>
                      <TableHead>Alternative</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.improvementPlan.map((imp, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-normal min-w-[150px]">{imp.currentGap}</TableCell>
                        <TableCell className="text-xs whitespace-normal min-w-[150px]">{imp.requiredAction}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{imp.estimatedTimeline}</TableCell>
                        <TableCell className="text-xs whitespace-normal min-w-[120px]">
                          {imp.document || '—'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-normal min-w-[120px]">
                          {imp.aloService || '—'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-normal min-w-[140px]">
                          {imp.recommendedAlternative || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="border-yellow-500 text-yellow-700">
                  <MessageSquare className="h-4 w-4 mr-1" /> Request Counsellor Review
                </Button>
              </div>
            </div>
          )}

          {/* NOT ELIGIBLE: Explanation + Alternatives */}
          {isNotEligible && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-4 w-4" /> This Is Why
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  Your profile does not currently meet the entry requirements for this course. Below is a breakdown of the gaps and alternative routes you can consider.
                </p>
                {result.requirements.filter(r => r.result === 'NOT_MET').map((req, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    <X className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                    <div>
                      <span className="text-sm font-medium">{req.name}: </span>
                      <span className="text-sm text-muted-foreground">Required: {req.universityRequirement} — Your value: {req.studentValue || 'Not provided'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Difference visualization */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Score Comparison</h4>
                {result.requirements.filter(r => r.result === 'NOT_MET').map((req, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{req.name}</span>
                      <span className="text-muted-foreground">Required: {req.universityRequirement}</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600" style={{ width: '40%' }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Your value: {req.studentValue || 'Not provided'}</p>
                  </div>
                ))}
              </div>

              {/* Alternative Routes */}
              {result.alternativeRoutes && result.alternativeRoutes.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" style={{ color: ALO_BLUE }} /> Alternative Routes
                  </h4>
                  <div className="space-y-2">
                    {result.alternativeRoutes.map((alt, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <CircleDot className="h-4 w-4 mt-0.5 shrink-0" style={{ color: ALO_BLUE }} />
                        <div>
                          <p className="text-sm font-medium">{alt.courseTitle}</p>
                          {alt.universityName && <p className="text-xs text-muted-foreground">{alt.universityName}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{alt.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="text-sm font-semibold mb-2">General Alternative Suggestions</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1" /> Consider a Foundation programme before a Bachelor&apos;s degree</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1" /> Look into Pre-Master&apos;s courses before a Master&apos;s degree</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1" /> Explore similar courses at other universities with lower entry requirements</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1" /> Consider a related subject area where your profile may be a better fit</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1" /> An MSc may have different requirements than an MBA at the same university</li>
                </ul>
              </div>
            </div>
          )}

          {/* INSUFFICIENT INFO */}
          {isInsufficient && (
            <div className="rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30 p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Info className="h-4 w-4" /> Missing Information
              </h4>
              <p className="text-sm text-muted-foreground mb-3">We could not fully evaluate your eligibility because the following information is missing or incomplete:</p>
              <ul className="space-y-1 mb-4">
                {result.requirements.filter(r => r.result === 'MISSING_INFO').map((req, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-gray-500 shrink-0" />
                    <span><strong>{req.name}:</strong> {req.action || 'Please provide this information'}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" onClick={onToggle}>
                <RotateCcw className="h-4 w-4 mr-1" /> Update Profile & Re-Check
              </Button>
            </div>
          )}

          {/* COUNSELLOR REVIEW */}
          {isCounsellor && (
            <div className="rounded-lg border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Eye className="h-4 w-4" /> Counsellor Review Required
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                This course has specific requirements that need human evaluation. Our automated engine cannot fully assess your eligibility for this programme. An ALO Education counsellor will review your profile against the full course requirements, including subject-specific criteria, work experience relevance, and any special conditions.
              </p>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" style={{ background: '#7C3AED', color: '#fff' }}>
                <MessageSquare className="h-4 w-4 mr-1" /> Request Counsellor Review
              </Button>
            </div>
          )}

          {/* Last verified info */}
          {result.requirements.some(r => r.lastVerifiedAt) && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last verified: {result.requirements.find(r => r.lastVerifiedAt)?.lastVerifiedAt ? new Date(result.requirements.find(r => r.lastVerifiedAt)!.lastVerifiedAt!).toLocaleDateString() : 'Unknown'}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export function EligibilityCheckerLoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}
