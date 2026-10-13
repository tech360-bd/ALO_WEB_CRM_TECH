'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Save, User, Search, FileCheck, FileText, Send, Clock, Plane,
  Check, CheckCircle2, Circle, Loader2, Upload, Copy, Download, Star,
  GraduationCap, Globe, Wallet, Target, Briefcase, Sparkles, AlertCircle,
  ChevronRight, X, BookOpen, ShieldCheck, Home, CreditCard, Luggage,
  CalendarCheck, BadgeCheck, HeartPulse, Eye, MessageSquare, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  country: string;
  studyLevel: string;
  gpa: string;
  englishScore: string;
  budget: string;
  careerGoal: string;
}

interface StepConfig {
  id: number;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

interface MockCourse {
  id: string;
  university: string;
  course: string;
  level: string;
  tuition: string;
  matchScore: number;
  country: string;
  shortlisted: boolean;
}

interface DocumentItem {
  id: string;
  name: string;
  category: string;
  uploaded: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { id: 1, label: 'Profile & AI Analysis', shortLabel: 'Profile', icon: <User className="h-4 w-4" /> },
  { id: 2, label: 'Course Discovery', shortLabel: 'Courses', icon: <Search className="h-4 w-4" /> },
  { id: 3, label: 'Document Checklist', shortLabel: 'Docs', icon: <FileCheck className="h-4 w-4" /> },
  { id: 4, label: 'AI SOP Writer', shortLabel: 'SOP', icon: <FileText className="h-4 w-4" /> },
  { id: 5, label: 'One-Click Apply', shortLabel: 'Apply', icon: <Send className="h-4 w-4" /> },
  { id: 6, label: 'Offer Tracking', shortLabel: 'Track', icon: <Clock className="h-4 w-4" /> },
  { id: 7, label: 'Visa & Pre-Departure', shortLabel: 'Visa', icon: <Plane className="h-4 w-4" /> },
];

const COUNTRIES = ['United Kingdom', 'United States', 'Canada', 'Australia'];
const STUDY_LEVELS = ['Bachelors', 'Masters', 'PhD'];
const BUDGET_OPTIONS = ['Under $20,000/yr', '$20,000 - $35,000/yr', '$35,000 - $50,000/yr', 'Over $50,000/yr'];

const MOCK_COURSES: MockCourse[] = [
  { id: 'c1', university: 'University of Oxford', course: 'MSc Computer Science', level: 'Masters', tuition: '$38,200/yr', matchScore: 94, country: 'United Kingdom', shortlisted: false },
  { id: 'c2', university: 'MIT', course: 'MS Data Science', level: 'Masters', tuition: '$55,510/yr', matchScore: 91, country: 'United States', shortlisted: false },
  { id: 'c3', university: 'University of Toronto', course: 'MSc AI & Machine Learning', level: 'Masters', tuition: '$42,000/yr', matchScore: 88, country: 'Canada', shortlisted: false },
  { id: 'c4', university: 'University of Melbourne', course: 'Master of Data Science', level: 'Masters', tuition: '$47,000/yr', matchScore: 85, country: 'Australia', shortlisted: false },
  { id: 'c5', university: 'Imperial College London', course: 'MSc Artificial Intelligence', level: 'Masters', tuition: '$40,500/yr', matchScore: 92, country: 'United Kingdom', shortlisted: false },
  { id: 'c6', university: 'Stanford University', course: 'MS Computer Science', level: 'Masters', tuition: '$58,416/yr', matchScore: 89, country: 'United States', shortlisted: false },
];

const MOCK_DOCUMENTS: DocumentItem[] = [
  { id: 'd1', name: 'Valid Passport', category: 'Identity', uploaded: true },
  { id: 'd2', name: 'Passport-size Photographs', category: 'Identity', uploaded: false },
  { id: 'd3', name: 'Birth Certificate', category: 'Identity', uploaded: true },
  { id: 'd4', name: 'Academic Transcripts', category: 'Academic', uploaded: true },
  { id: 'd5', name: 'Degree Certificate', category: 'Academic', uploaded: false },
  { id: 'd6', name: 'Letters of Recommendation (x2)', category: 'Academic', uploaded: true },
  { id: 'd7', name: 'Statement of Purpose', category: 'Academic', uploaded: false },
  { id: 'd8', name: 'IELTS Score Report', category: 'English', uploaded: true },
  { id: 'd9', name: 'TOEFL Score Report', category: 'English', uploaded: false },
  { id: 'd10', name: 'Bank Statement (6 months)', category: 'Financial', uploaded: false },
  { id: 'd11', name: 'Affidavit of Financial Support', category: 'Financial', uploaded: false },
  { id: 'd12', name: 'Scholarship Letter (if any)', category: 'Financial', uploaded: false },
  { id: 'd13', name: 'Completed Application Form', category: 'Application', uploaded: true },
  { id: 'd14', name: 'Application Fee Receipt', category: 'Application', uploaded: true },
  { id: 'd15', name: 'CV / Resume', category: 'Application', uploaded: false },
];

const MOCK_TIMELINE = [
  { stage: 'Application Submitted', icon: <Send className="h-4 w-4" />, date: 'Jan 15, 2025', desc: 'Your application has been successfully submitted to the university admissions portal.' },
  { stage: 'Under Review', icon: <Eye className="h-4 w-4" />, date: 'Jan 28, 2025', desc: 'The admissions committee has begun reviewing your application materials.' },
  { stage: 'Interview Scheduled', icon: <MessageSquare className="h-4 w-4" />, date: 'Feb 10, 2025', desc: 'You have been shortlisted for an interview with the program director.' },
  { stage: 'Decision Pending', icon: <Clock className="h-4 w-4" />, date: 'Feb 20, 2025', desc: 'The committee is finalizing their decision on your application.' },
  { stage: 'Offer Received', icon: <GraduationCap className="h-4 w-4" />, date: 'Mar 1, 2025', desc: 'Awaiting the official admission decision from the university.' },
  { stage: 'Visa Processing', icon: <ShieldCheck className="h-4 w-4" />, date: 'Mar 15, 2025', desc: 'Begin your student visa application upon receiving the offer letter.' },
  { stage: 'Enrollment Confirmed', icon: <CheckCircle2 className="h-4 w-4" />, date: 'Apr 1, 2025', desc: 'Complete enrollment and prepare for your departure.' },
];

const MOCK_SOP = `Growing up in a family of engineers, I was always fascinated by how technology could solve real-world problems. This curiosity led me to pursue a Bachelor's degree in Computer Science, where I graduated with honors and developed a strong foundation in algorithms, data structures, and software engineering. During my undergraduate studies, I led a team that developed an AI-powered agricultural monitoring system, which won the National Innovation Award. This experience solidified my passion for artificial intelligence and its transformative potential.

The MSc Computer Science program at the University of Oxford stands out to me because of its interdisciplinary approach to AI research and its world-class faculty. I am particularly drawn to Professor Sarah Chen's work on natural language processing and the Oxford Robotics Institute's groundbreaking research in computer vision. The program's emphasis on both theoretical foundations and practical applications aligns perfectly with my goal of becoming a research scientist in AI. Oxford's collaborative research environment and its connections with industry leaders like DeepMind provide an unparalleled opportunity to work on cutting-edge problems.

Upon completing this program, my goal is to pursue a career as an AI research scientist at a leading tech company or research institution. I aim to contribute to the development of ethical AI systems that address pressing global challenges in healthcare and education. The rigorous training and global network I will gain at Oxford will be instrumental in achieving these aspirations and making a meaningful impact in the field of artificial intelligence.`;

const DOCUMENT_CATEGORIES = ['Identity', 'Academic', 'English', 'Financial', 'Application'];

const INITIAL_VISA_CHECKLIST = [
  { id: 'v1', name: 'Valid passport (6+ months validity)', done: true },
  { id: 'v2', name: 'CAS / Offer letter from university', done: true },
  { id: 'v3', name: 'Financial documents (bank statement)', done: false },
  { id: 'v4', name: 'Tuberculosis test certificate', done: false },
  { id: 'v5', name: 'Visa application form completed', done: false },
  { id: 'v6', name: 'Visa fee payment receipt', done: false },
  { id: 'v7', name: 'Biometric appointment booked', done: false },
  { id: 'v8', name: 'ATAS certificate (if required)', done: false },
];

const INITIAL_PRE_DEPARTURE = [
  { id: 'p1', name: 'Book flights', icon: <Plane className="h-4 w-4" />, done: false },
  { id: 'p2', name: 'Arrange accommodation', icon: <Home className="h-4 w-4" />, done: false },
  { id: 'p3', name: 'Get travel & health insurance', icon: <HeartPulse className="h-4 w-4" />, done: false },
  { id: 'p4', name: 'Pack essentials', icon: <Luggage className="h-4 w-4" />, done: false },
  { id: 'p5', name: 'Set up international bank account', icon: <CreditCard className="h-4 w-4" />, done: false },
  { id: 'p6', name: 'Register for orientation', icon: <CalendarCheck className="h-4 w-4" />, done: false },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AIStudentJourney({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', country: '', studyLevel: '', gpa: '', englishScore: '', budget: '', careerGoal: '',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<null | {
    eligibility: number;
    universities: { name: string; match: number }[];
    strengths: string[];
    improvements: string[];
  }>(null);
  const [courses, setCourses] = useState<MockCourse[]>(MOCK_COURSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCountryFilter, setActiveCountryFilter] = useState<string | null>(null);
  const [activeLevelFilter, setActiveLevelFilter] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [sopInputs, setSopInputs] = useState({
    university: '', course: '', achievements: '', whyUni: '', careerGoals: '', specialCircumstances: '',
  });
  const [sopGenerated, setSopGenerated] = useState(false);
  const [sopLoading, setSopLoading] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [visaChecklist, setVisaChecklist] = useState(INITIAL_VISA_CHECKLIST);
  const [preDepartureList, setPreDepartureList] = useState(INITIAL_PRE_DEPARTURE);

  const updateFormField = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goToStep = useCallback((step: number) => setCurrentStep(step), []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  const handleAnalyzeAI = () => {
    if (!formData.name || !formData.gpa) {
      toast.error('Please fill in your name and GPA first.');
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      setAiResults({
        eligibility: 87,
        universities: [
          { name: 'University of Oxford', match: 94 },
          { name: 'Imperial College London', match: 91 },
          { name: 'University of Toronto', match: 88 },
        ],
        strengths: [
          'Strong academic background (3.8 GPA)',
          'Relevant project experience in AI/ML',
          'High English proficiency score (IELTS 7.5)',
          'Leadership experience in tech teams',
        ],
        improvements: [
          'Consider adding research publications to strengthen profile',
          'Gain more internship experience in the target field',
          'Prepare for GRE to increase scholarship chances',
        ],
      });
      setAiLoading(false);
      markStepComplete(1);
      toast.success('AI analysis complete! Your profile looks strong.');
    }, 2000);
  };

  const toggleShortlist = (courseId: string) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, shortlisted: !c.shortlisted } : c)));
    const course = courses.find((c) => c.id === courseId);
    if (course && !course.shortlisted) toast.success('Course shortlisted!');
    else toast.info('Course removed from shortlist.');
  };

  const toggleDocument = (docId: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, uploaded: !d.uploaded } : d)));
  };

  const handleGenerateSOP = () => {
    if (!sopInputs.achievements || !sopInputs.whyUni) {
      toast.error('Please fill in at least your achievements and why you chose the university.');
      return;
    }
    setSopLoading(true);
    setTimeout(() => {
      setSopGenerated(true);
      setSopLoading(false);
      markStepComplete(4);
      toast.success('SOP generated successfully!');
    }, 2000);
  };

  const handleSubmitApplication = () => {
    setApplyLoading(true);
    setTimeout(() => {
      setApplyLoading(false);
      setApplySubmitted(true);
      markStepComplete(5);
      toast.success('Application submitted successfully!');
    }, 2000);
  };

  const handleSave = () => toast.success('Progress saved!');

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.university.toLowerCase().includes(q) || c.course.toLowerCase().includes(q);
    const matchesCountry = !activeCountryFilter || c.country === activeCountryFilter;
    const matchesLevel = !activeLevelFilter || c.level === activeLevelFilter;
    return matchesSearch && matchesCountry && matchesLevel;
  });

  const uploadedCount = documents.filter((d) => d.uploaded).length;
  const totalDocs = documents.length;
  const docProgress = Math.round((uploadedCount / totalDocs) * 100);
  const shortlistedCount = courses.filter((c) => c.shortlisted).length;

  const sopWordCount = MOCK_SOP.trim().split(/\s+/).length;

  // ─── Header ──────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold text-gray-900 lg:text-lg">AI Student Journey</h1>
          <div className="mt-1 flex items-center gap-1.5 lg:hidden">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => goToStep(s.id)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  currentStep === s.id ? 'w-6 bg-[#4F46E5]' : completedSteps.has(s.id) ? 'bg-green-500' : 'bg-gray-300',
                )}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="mr-2 hidden items-center gap-1.5 lg:flex">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => goToStep(s.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                currentStep === s.id ? 'bg-[#4F46E5] text-white' : completedSteps.has(s.id) ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'text-gray-500 hover:bg-gray-100',
              )}
            >
              {completedSteps.has(s.id) && currentStep !== s.id ? <Check className="h-3 w-3" /> : <span className="font-semibold">{s.id}</span>}
              <span className="hidden xl:inline">{s.shortLabel}</span>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>
    </div>
  );

  // ─── Sidebar ─────────────────────────────────────────────────────────────
  const renderSidebar = () => (
    <aside className="hidden w-64 shrink-0 border-r bg-gray-50/80 lg:block">
      <nav className="sticky top-[65px] flex flex-col gap-1 p-4">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = completedSteps.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                isActive && 'bg-[#4F46E5] text-white shadow-md',
                !isActive && isDone && 'bg-green-50 text-green-700 hover:bg-green-100',
                !isActive && !isDone && 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isActive && 'bg-white/20 text-white',
                  !isActive && isDone && 'bg-green-100 text-green-600',
                  !isActive && !isDone && 'bg-gray-200 text-gray-500',
                )}
              >
                {isDone && !isActive ? <Check className="h-3.5 w-3.5" /> : step.id}
              </span>
              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  // ─── Step 1: Profile & AI Analysis ──────────────────────────────────────
  const renderStep1 = () => (
    <motion.div key="step1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Student Profile</h2>
        <p className="mt-1 text-sm text-gray-500">Fill in your details and let AI analyze your study abroad readiness.</p>
      </div>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => updateFormField('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => updateFormField('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Destination Country</Label>
              <Select value={formData.country} onValueChange={(v) => updateFormField('country', v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Study Level</Label>
              <Select value={formData.studyLevel} onValueChange={(v) => updateFormField('studyLevel', v)}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>{STUDY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpa">GPA (out of 4.0)</Label>
              <Input id="gpa" placeholder="3.8" value={formData.gpa} onChange={(e) => updateFormField('gpa', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="englishScore">English Proficiency Score</Label>
              <Input id="englishScore" placeholder="IELTS 7.5 / TOEFL 105" value={formData.englishScore} onChange={(e) => updateFormField('englishScore', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Budget Range</Label>
              <Select value={formData.budget} onValueChange={(v) => updateFormField('budget', v)}>
                <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                <SelectContent>{BUDGET_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex h-10 items-center text-sm text-gray-400">Optional</div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="careerGoal">Career Goal</Label>
              <Textarea id="careerGoal" placeholder="Describe your long-term career aspirations..." rows={3} value={formData.careerGoal} onChange={(e) => updateFormField('careerGoal', e.target.value)} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleAnalyzeAI} disabled={aiLoading} className="gap-2 bg-[#4F46E5] hover:bg-[#4338CA]">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {aiLoading && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
          </CardContent>
        </Card>
      )}

      {aiResults && !aiLoading && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-[#F97316]" /> AI Analysis Results</CardTitle>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Eligibility: {aiResults.eligibility}%</Badge>
              </div>
            </CardHeader>
            <CardContent><Progress value={aiResults.eligibility} className="h-2" /></CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {aiResults.universities.map((uni, idx) => (
              <Card key={idx} className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4F46E5]/10 text-[#4F46E5]"><GraduationCap className="h-5 w-5" /></div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">{uni.match}%</div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">{uni.name}</p>
                  <p className="text-xs text-gray-500">Match Score</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-700"><Star className="h-4 w-4" /> Strengths</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">{aiResults.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{s}</li>
                ))}</ul>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#F97316]"><AlertCircle className="h-4 w-4" /> Improvement Areas</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">{aiResults.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />{s}</li>
                ))}</ul>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => goToStep(2)} className="gap-2 bg-[#4F46E5] hover:bg-[#4338CA]">Discover Courses <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  // ─── Step 2: Course Discovery ───────────────────────────────────────────
  const renderStep2 = () => (
    <motion.div key="step2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Course Discovery</h2>
          <p className="mt-1 text-sm text-gray-500">Find the perfect program matching your profile.</p>
        </div>
        {shortlistedCount > 0 && (
          <Badge className="bg-[#F97316] px-3 py-1 text-sm text-white hover:bg-[#EA580C]">{shortlistedCount} Shortlisted</Badge>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search universities or courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium text-gray-500 self-center mr-1">Country:</span>
        {COUNTRIES.map((c) => (
          <button key={c} onClick={() => setActiveCountryFilter(activeCountryFilter === c ? null : c)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-all', activeCountryFilter === c ? 'bg-[#4F46E5] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{c}</button>
        ))}
        <Separator orientation="vertical" className="mx-2 hidden h-6 sm:block" />
        <span className="text-xs font-medium text-gray-500 self-center mr-1">Level:</span>
        {STUDY_LEVELS.map((l) => (
          <button key={l} onClick={() => setActiveLevelFilter(activeLevelFilter === l ? null : l)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-all', activeLevelFilter === l ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{l}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="group relative overflow-hidden rounded-2xl border-0 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{course.university}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{course.course}</p>
                </div>
                <div className={cn('ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold', course.matchScore >= 90 ? 'bg-green-100 text-green-700' : course.matchScore >= 85 ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'bg-orange-100 text-orange-600')}>{course.matchScore}%</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">{course.level}</Badge>
                <Badge variant="outline" className="text-xs gap-1"><Globe className="h-3 w-3" />{course.country}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{course.tuition}</span>
                <Button
                  size="sm"
                  variant={course.shortlisted ? 'default' : 'outline'}
                  className={cn('gap-1 text-xs', course.shortlisted ? 'bg-green-600 hover:bg-green-700' : 'border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5')}
                  onClick={() => toggleShortlist(course.id)}
                >
                  {course.shortlisted && <Check className="h-3 w-3" />}{course.shortlisted ? 'Shortlisted' : 'Shortlist'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 py-16">
          <Search className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No courses found matching your criteria.</p>
          <Button variant="link" className="mt-1 text-[#4F46E5]" onClick={() => { setSearchQuery(''); setActiveCountryFilter(null); setActiveLevelFilter(null); }}>Clear filters</Button>
        </div>
      )}
      {shortlistedCount > 0 && !completedSteps.has(2) && markStepComplete(2)}
    </motion.div>
  );

  // ─── Step 3: Document Checklist ─────────────────────────────────────────
  const renderStep3 = () => (
    <motion.div key="step3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Document Checklist</h2>
        <p className="mt-1 text-sm text-gray-500">Track and upload all required documents for your application.</p>
      </div>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-[#4F46E5]">{docProgress}%</span>
          </div>
          <Progress value={docProgress} className="h-2.5" />
          <p className="mt-2 text-xs text-gray-500">{uploadedCount} of {totalDocs} documents uploaded</p>
        </CardContent>
      </Card>
      <div className="flex items-start gap-3 rounded-xl bg-[#4F46E5]/5 border border-[#4F46E5]/20 p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#F97316]" />
        <div>
          <p className="text-sm font-semibold text-gray-900">AI Tip</p>
          <p className="mt-0.5 text-xs text-gray-600">Ensure all academic documents are notarized and in English. Financial documents should be no older than 3 months. Most universities accept digital uploads, but keep physical copies for visa processing.</p>
        </div>
      </div>
      <div className="space-y-5">
        {DOCUMENT_CATEGORIES.map((category) => {
          const catDocs = documents.filter((d) => d.category === category);
          const catUploaded = catDocs.filter((d) => d.uploaded).length;
          return (
            <Card key={category} className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900">{category} Documents</CardTitle>
                  <Badge variant="outline" className="text-xs">{catUploaded}/{catDocs.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {catDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', doc.uploaded ? 'bg-green-100' : 'bg-red-100')}>
                        {doc.uploaded ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-red-500" />}
                      </span>
                      <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge className={cn('text-xs', doc.uploaded ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-600 hover:bg-red-100')}>{doc.uploaded ? 'Uploaded' : 'Missing'}</Badge>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => toggleDocument(doc.id)}>
                        <Upload className="h-3 w-3" />{doc.uploaded ? 'Replace' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );

  // ─── Step 4: AI SOP Writer ──────────────────────────────────────────────
  const renderStep4 = () => (
    <motion.div key="step4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI SOP Writer</h2>
        <p className="mt-1 text-sm text-gray-500">Provide your details and let AI craft a compelling Statement of Purpose.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Input Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>University</Label>
                <Select value={sopInputs.university} onValueChange={(v) => setSopInputs((p) => ({ ...p, university: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                  <SelectContent>
                    {aiResults?.universities.map((u) => <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>)}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={sopInputs.course} onValueChange={(v) => setSopInputs((p) => ({ ...p, course: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.filter((c) => c.shortlisted).map((c) => <SelectItem key={c.id} value={c.course}>{c.course}</SelectItem>)}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Key Achievements & Projects</Label>
              <Textarea placeholder="Describe your academic achievements, research projects, awards..." rows={3} value={sopInputs.achievements} onChange={(e) => setSopInputs((p) => ({ ...p, achievements: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Why This University?</Label>
              <Textarea placeholder="What attracts you to this specific university and program?" rows={3} value={sopInputs.whyUni} onChange={(e) => setSopInputs((p) => ({ ...p, whyUni: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Career Goals</Label>
              <Textarea placeholder="Where do you see yourself in 5-10 years?" rows={2} value={sopInputs.careerGoals} onChange={(e) => setSopInputs((p) => ({ ...p, careerGoals: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Special Circumstances (Optional)</Label>
              <Textarea placeholder="Any gaps, unique experiences, or circumstances to highlight..." rows={2} value={sopInputs.specialCircumstances} onChange={(e) => setSopInputs((p) => ({ ...p, specialCircumstances: e.target.value }))} />
            </div>
            <Button onClick={handleGenerateSOP} disabled={sopLoading} className="w-full gap-2 bg-[#4F46E5] hover:bg-[#4338CA]">
              {sopLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {sopLoading ? 'Generating SOP...' : 'Generate SOP'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Generated SOP</CardTitle>
              {sopGenerated && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1"><BadgeCheck className="h-3 w-3" /> 95% Original</Badge>
                  <Badge variant="outline" className="text-xs">{sopWordCount} words</Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sopLoading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-9/12" />
                <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-full" />
              </div>
            )}
            {sopGenerated && !sopLoading && (
              <>
                <div className="max-h-96 overflow-y-auto rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 scrollbar-thin">
                  {MOCK_SOP.split('\n\n').map((para, i) => (
                    <p key={i} className={cn(i > 0 ? 'mt-3' : '')}>{para}</p>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { navigator.clipboard.writeText(MOCK_SOP); toast.success('SOP copied to clipboard!'); }}>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast.success('SOP downloaded!')}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                  <Button size="sm" className="gap-1.5 text-xs bg-[#F97316] hover:bg-[#EA580C] text-white" onClick={() => { toast.success('SOP sent for expert review!'); markStepComplete(4); }}>
                    <Send className="h-3.5 w-3.5" /> Send for Review
                  </Button>
                </div>
              </>
            )}
            {!sopGenerated && !sopLoading && (
              <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-16 text-center">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-500">Your generated SOP will appear here.</p>
                <p className="mt-1 text-xs text-gray-400">Fill in the details and click &quot;Generate SOP&quot; to begin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  // ─── Step 5: One-Click Apply ────────────────────────────────────────────
  const renderStep5 = () => {
    const checks = [
      { label: 'Profile completed', done: !!formData.name && !!formData.gpa },
      { label: 'AI Analysis done', done: !!aiResults },
      { label: `${shortlistedCount} course(s) shortlisted`, done: shortlistedCount > 0 },
      { label: `${uploadedCount}/${totalDocs} documents uploaded`, done: docProgress >= 60 },
      { label: 'SOP generated', done: sopGenerated },
    ];
    const allReady = checks.every((c) => c.done);

    return (
      <motion.div key="step5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">One-Click Apply</h2>
          <p className="mt-1 text-sm text-gray-500">Review your application readiness before submitting.</p>
        </div>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Application Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Applicant</p>
                <p className="text-sm font-semibold text-gray-900">{formData.name || 'Not provided'}</p>
                <p className="text-xs text-gray-500">{formData.email || 'No email'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Destination</p>
                <p className="text-sm font-semibold text-gray-900">{formData.country || 'Not selected'}</p>
                <p className="text-xs text-gray-500">{formData.studyLevel || 'No level'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Academic Profile</p>
                <p className="text-sm font-semibold text-gray-900">GPA: {formData.gpa || 'N/A'}</p>
                <p className="text-xs text-gray-500">English: {formData.englishScore || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase">Budget</p>
                <p className="text-sm font-semibold text-gray-900">{formData.budget || 'Not set'}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase">Readiness Checklist</p>
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', c.done ? 'bg-green-100' : 'bg-red-100')}>
                    {c.done ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-500" />}
                  </span>
                  <span className="text-sm text-gray-700">{c.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button
            onClick={() => setApplyDialogOpen(true)}
            disabled={!allReady || applySubmitted}
            className={cn('gap-2', applySubmitted ? 'bg-green-600 hover:bg-green-700' : 'bg-[#4F46E5] hover:bg-[#4338CA]')}
          >
            {applySubmitted ? <><CheckCircle2 className="h-4 w-4" /> Submitted</> : <><Send className="h-4 w-4" /> Submit Application</>}
          </Button>
        </div>

        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            {applyLoading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-[#4F46E5]" />
                <p className="text-sm font-medium text-gray-600">Submitting your application...</p>
              </div>
            ) : applySubmitted ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </motion.div>
                <DialogHeader className="text-center">
                  <DialogTitle className="text-xl">Application Submitted!</DialogTitle>
                  <DialogDescription>Your application has been successfully submitted. You can track its progress in the next step.</DialogDescription>
                </DialogHeader>
                <Button className="mt-2 gap-2 bg-[#4F46E5] hover:bg-[#4338CA]" onClick={() => { setApplyDialogOpen(false); goToStep(6); }}>
                  Track Application <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm Application Submission</DialogTitle>
                  <DialogDescription>You are about to submit your application to the selected university. This action will send all your documents and SOP for review.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
                  <Button className="gap-2 bg-[#4F46E5] hover:bg-[#4338CA]" onClick={handleSubmitApplication}><Send className="h-4 w-4" /> Confirm Submit</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  };

  // ─── Step 6: Offer Tracking Timeline ────────────────────────────────────
  const renderStep6 = () => (
    <motion.div key="step6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Offer Tracking</h2>
        <p className="mt-1 text-sm text-gray-500">Follow your application progress through each stage.</p>
      </div>
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative space-y-0">
            {MOCK_TIMELINE.map((item, idx) => {
              const isCompleted = idx < 2;
              const isInProgress = idx === 2;
              const isPending = idx > 2;
              const isLast = idx === MOCK_TIMELINE.length - 1;
              return (
                <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <div className={cn('absolute left-[18px] top-10 h-full w-0.5', isCompleted ? 'bg-green-400' : isInProgress ? 'bg-[#4F46E5]/30' : 'bg-gray-200')} />
                  )}
                  <div className={cn(
                    'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2',
                    isCompleted && 'border-green-400 bg-green-50 text-green-600',
                    isInProgress && 'border-[#4F46E5] bg-[#4F46E5]/10 text-[#4F46E5]',
                    isPending && 'border-gray-200 bg-gray-50 text-gray-400',
                  )}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <span className={cn(isInProgress && 'animate-pulse')}>{item.icon}</span>}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn('text-sm font-semibold', isCompleted ? 'text-green-700' : isInProgress ? 'text-[#4F46E5]' : 'text-gray-500')}>{item.stage}</p>
                      {isCompleted && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Completed</Badge>}
                      {isInProgress && <Badge className="bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5]/10 text-xs">In Progress</Badge>}
                      {isPending && <Badge variant="outline" className="text-xs text-gray-400">Pending</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{item.date}</p>
                    <p className={cn('mt-1 text-sm leading-relaxed', isPending ? 'text-gray-400' : 'text-gray-600')}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // ─── Step 7: Visa & Pre-Departure ───────────────────────────────────────
  const renderStep7 = () => {
    const visaDone = visaChecklist.filter((v) => v.done).length;
    const visaTotal = visaChecklist.length;
    const departureDone = preDepartureList.filter((p) => p.done).length;
    const departureTotal = preDepartureList.length;

    return (
      <motion.div key="step7" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Visa & Pre-Departure</h2>
          <p className="mt-1 text-sm text-gray-500">Complete your visa requirements and prepare for departure.</p>
        </div>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-[#4F46E5]" /> Visa Readiness</CardTitle>
              <Badge variant="outline" className="text-xs">{visaDone}/{visaTotal}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(visaDone / visaTotal) * 100} className="h-2 mb-4" />
            <div className="space-y-2">
              {visaChecklist.map((item) => (
                <button key={item.id} onClick={() => setVisaChecklist((prev) => prev.map((v) => (v.id === item.id ? { ...v, done: !v.done } : v)))} className="flex w-full items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100">
                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors', item.done ? 'border-green-400 bg-green-400' : 'border-gray-300')}>
                    {item.done && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <span className={cn('text-sm', item.done ? 'text-gray-500 line-through' : 'text-gray-700')}>{item.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Plane className="h-4 w-4 text-[#F97316]" /> Pre-Departure Checklist</CardTitle>
              <Badge variant="outline" className="text-xs">{departureDone}/{departureTotal}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={(departureDone / departureTotal) * 100} className="h-2 mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {preDepartureList.map((item) => (
                <button key={item.id} onClick={() => setPreDepartureList((prev) => prev.map((p) => (p.id === item.id ? { ...p, done: !p.done } : p)))} className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all', item.done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300')}>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500', item.done && 'bg-green-100 text-green-600')}>{item.icon}</span>
                  <span className={cn('text-sm font-medium', item.done ? 'text-green-700 line-through' : 'text-gray-700')}>{item.name}</span>
                  {item.done && <Check className="ml-auto h-4 w-4 shrink-0 text-green-500" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20"><CalendarCheck className="h-6 w-6 text-white" /></div>
            <div className="flex-1">
              <p className="text-base font-bold text-white">Need help preparing for departure?</p>
              <p className="mt-0.5 text-sm text-white/80">Book a free pre-departure session with our experienced counselors.</p>
            </div>
            <Button className="shrink-0 gap-2 bg-white text-[#4F46E5] hover:bg-white/90 font-semibold" onClick={() => toast.success('Pre-departure session booked! We will contact you shortly.')}>
              <BookOpen className="h-4 w-4" /> Book Session
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // ─── Step Renderer ───────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {renderHeader()}
      <div className="flex flex-1">
        {renderSidebar()}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Step {currentStep} of {STEPS.length}</span>
                <span>•</span>
                <span>{STEPS[currentStep - 1].label}</span>
              </div>
              {currentStep > 1 && (
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-gray-500" onClick={() => goToStep(currentStep - 1)}>
                  <ArrowLeft className="h-3 w-3" /> Previous Step
                </Button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
            {currentStep < 7 && (
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => goToStep(currentStep + 1)}
                  className="gap-2 bg-[#4F46E5] hover:bg-[#4338CA]"
                >
                  Next Step <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}