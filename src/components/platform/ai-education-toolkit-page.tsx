'use client';

import { useState, useMemo } from 'react';
import {
  GraduationCap, Brain, Sparkles, BookOpen, Target, TrendingUp,
  CheckCircle2, Clock, Star, Zap, Users, FileText, Layers,
  Play, Pause, RotateCcw, ChevronRight, Plus, Settings,
  Search, Filter, Award, BarChart3, PieChart, Activity,
  MessageSquare, Lightbulb, Globe, Shield, Cpu, GitBranch,
  ArrowRight, Edit3, Copy, Download, Upload, Eye,
  Database, Code2, Mic, PenTool, Calculator, Languages,
  Science, Palette, Music, Dumbbell, Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  StatCard, SectionCard, PageHeader, StatusBadge, CompletionRing,
} from '@/components/alo/shared';

// ─── Types ───────────────────────────────────────────────────────────

interface AIEducationToolkitPageProps {
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
}

// ─── Course Builder Data ─────────────────────────────────────────────

interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'live';
  status: 'draft' | 'review' | 'published';
  aiGenerated: boolean;
}

const COURSE_MODULES: CourseModule[] = [
  { id: 'm1', title: 'Introduction to UK Universities', description: 'Overview of the UK higher education system and top institutions', duration: '45 min', type: 'video', status: 'published', aiGenerated: false },
  { id: 'm2', title: 'Application Requirements Deep Dive', description: 'UCAS process, personal statements, and reference letters', duration: '60 min', type: 'reading', status: 'published', aiGenerated: true },
  { id: 'm3', title: 'Funding & Scholarships Guide', description: 'Complete guide to tuition fees, living costs, and financial aid', duration: '30 min', type: 'video', status: 'review', aiGenerated: true },
  { id: 'm4', title: 'Visa Application Masterclass', description: 'Step-by-step Tier 4 visa application walkthrough', duration: '90 min', type: 'live', status: 'draft', aiGenerated: false },
  { id: 'm5', title: 'Pre-Departure Orientation', description: 'What to prepare before traveling to the UK', duration: '40 min', type: 'reading', status: 'draft', aiGenerated: true },
  { id: 'm6', title: 'Knowledge Check: UK System', description: 'Test your understanding of the UK education system', duration: '20 min', type: 'quiz', status: 'published', aiGenerated: true },
  { id: 'm7', title: 'Personal Statement Workshop', description: 'AI-assisted personal statement writing and review', duration: '120 min', type: 'assignment', status: 'review', aiGenerated: true },
  { id: 'm8', title: 'Interview Preparation', description: 'Common university interview questions and mock interviews', duration: '60 min', type: 'live', status: 'draft', aiGenerated: false },
];

const MODULE_TYPE_ICONS: Record<string, string> = {
  video: 'Play', reading: 'BookOpen', quiz: 'Target', assignment: 'PenTool', live: 'Users',
};

const MODULE_TYPE_COLORS: Record<string, string> = {
  video: 'bg-rose-50 text-rose-700', reading: 'bg-blue-50 text-blue-700', quiz: 'bg-amber-50 text-amber-700', assignment: 'bg-violet-50 text-violet-700', live: 'bg-emerald-50 text-emerald-700',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', review: 'bg-amber-100 text-amber-700', published: 'bg-emerald-100 text-emerald-700',
};

// ─── Assessment Data ─────────────────────────────────────────────────

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'test' | 'assignment' | 'mock-exam';
  questions: number;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  avgScore: number;
  completions: number;
  aiGenerated: boolean;
  subject: string;
}

const ASSESSMENTS: Assessment[] = [
  { id: 'a1', title: 'UK Education System Basics', type: 'quiz', questions: 15, duration: '20 min', difficulty: 'easy', avgScore: 82, completions: 234, aiGenerated: true, subject: 'UK Education' },
  { id: 'a2', title: 'UCAS Application Process', type: 'quiz', questions: 20, duration: '30 min', difficulty: 'medium', avgScore: 75, completions: 189, aiGenerated: true, subject: 'Applications' },
  { id: 'a3', title: 'Visa Requirements Test', type: 'test', questions: 30, duration: '45 min', difficulty: 'hard', avgScore: 68, completions: 156, aiGenerated: true, subject: 'Visa' },
  { id: 'a4', title: 'Personal Statement Assessment', type: 'assignment', questions: 5, duration: '60 min', difficulty: 'medium', avgScore: 79, completions: 312, aiGenerated: true, subject: 'Writing' },
  { id: 'a5', title: 'IELTS Preparation Mock', type: 'mock-exam', questions: 40, duration: '120 min', difficulty: 'hard', avgScore: 65, completions: 98, aiGenerated: false, subject: 'English' },
  { id: 'a6', title: 'Scholarship Eligibility Quiz', type: 'quiz', questions: 12, duration: '15 min', difficulty: 'easy', avgScore: 88, completions: 445, aiGenerated: true, subject: 'Funding' },
  { id: 'a7', title: 'Country Comparison Test', type: 'test', questions: 25, duration: '35 min', difficulty: 'medium', avgScore: 73, completions: 167, aiGenerated: true, subject: 'Destinations' },
  { id: 'a8', title: 'Interview Skills Assessment', type: 'assignment', questions: 8, duration: '90 min', difficulty: 'hard', avgScore: 71, completions: 89, aiGenerated: true, subject: 'Interview' },
];

// ─── Learning Path Data ──────────────────────────────────────────────

interface PathStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  progress: number;
  estimatedTime: string;
  resources: number;
}

const LEARNING_PATH: PathStep[] = [
  { id: 'p1', label: 'Foundation', description: 'Education system overview & country selection', status: 'completed', progress: 100, estimatedTime: '2 weeks', resources: 12 },
  { id: 'p2', label: 'Research', description: 'University & course exploration', status: 'completed', progress: 100, estimatedTime: '3 weeks', resources: 18 },
  { id: 'p3', label: 'Preparation', description: 'Documents, tests & English proficiency', status: 'current', progress: 65, estimatedTime: '4 weeks', resources: 24 },
  { id: 'p4', label: 'Application', description: 'UCAS / direct applications & personal statement', status: 'upcoming', progress: 0, estimatedTime: '3 weeks', resources: 15 },
  { id: 'p5', label: 'Offer & Decision', description: 'Evaluate offers & make final choice', status: 'upcoming', progress: 0, estimatedTime: '2 weeks', resources: 8 },
  { id: 'p6', label: 'Visa & Finance', description: 'Visa application & financial planning', status: 'upcoming', progress: 0, estimatedTime: '3 weeks', resources: 14 },
  { id: 'p7', label: 'Pre-Departure', description: 'Accommodation, travel & orientation', status: 'upcoming', progress: 0, estimatedTime: '2 weeks', resources: 10 },
  { id: 'p8', label: 'Arrival', description: 'Settlement & university enrollment', status: 'locked', progress: 0, estimatedTime: '1 week', resources: 6 },
];

// ─── AI Model Data ───────────────────────────────────────────────────

interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  color: string;
  bgColor: string;
  specs: {
    contextWindow: string;
    maxOutput: string;
    trainingData: string;
    multimodal: boolean;
    toolCalling: boolean;
  };
  educationScores: {
    contentGeneration: number;
    quizCreation: number;
    personalStatement: number;
    studentAdvising: number;
    documentAnalysis: number;
    languageSupport: number;
  };
  pricing: {
    input: string;
    output: string;
  };
  strengths: string[];
  weaknesses: string[];
}

const AI_MODELS: AIModel[] = [
  {
    id: 'gpt4', name: 'GPT-4o', provider: 'OpenAI', icon: 'Zap', color: '#10A37F', bgColor: '#ECFDF5',
    specs: { contextWindow: '128K', maxOutput: '16K', trainingData: 'Apr 2024', multimodal: true, toolCalling: true },
    educationScores: { contentGeneration: 92, quizCreation: 88, personalStatement: 90, studentAdvising: 85, documentAnalysis: 87, languageSupport: 84 },
    pricing: { input: '$2.50/1M', output: '$10/1M' },
    strengths: ['Creative writing', 'Complex reasoning', 'Multilingual', 'Code generation'],
    weaknesses: ['Cost for bulk usage', 'Occasional hallucinations'],
  },
  {
    id: 'claude', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: 'Brain', color: '#D97706', bgColor: '#FFFBEB',
    specs: { contextWindow: '200K', maxOutput: '8K', trainingData: 'Apr 2024', multimodal: true, toolCalling: true },
    educationScores: { contentGeneration: 90, quizCreation: 91, personalStatement: 94, studentAdvising: 93, documentAnalysis: 92, languageSupport: 88 },
    pricing: { input: '$3/1M', output: '$15/1M' },
    strengths: ['Long documents', 'Nuanced analysis', 'Safety-first', 'Excellent SOP review'],
    weaknesses: ['Higher output cost', 'Conservative responses'],
  },
  {
    id: 'gemini', name: 'Gemini 1.5 Pro', provider: 'Google', icon: 'Sparkles', color: '#4285F4', bgColor: '#EFF6FF',
    specs: { contextWindow: '1M', maxOutput: '8K', trainingData: 'Jan 2024', multimodal: true, toolCalling: true },
    educationScores: { contentGeneration: 87, quizCreation: 85, personalStatement: 83, studentAdvising: 82, documentAnalysis: 89, languageSupport: 90 },
    pricing: { input: '$1.25/1M', output: '$5/1M' },
    strengths: ['Massive context', 'Multimodal', 'Cost-effective', 'Google ecosystem'],
    weaknesses: ['Less creative', 'API limitations'],
  },
  {
    id: 'glm', name: 'GLM-5', provider: 'Z.ai', icon: 'Cpu', color: '#2563EB', bgColor: '#EFF6FF',
    specs: { contextWindow: '128K', maxOutput: '8K', trainingData: '2024', multimodal: true, toolCalling: true },
    educationScores: { contentGeneration: 88, quizCreation: 86, personalStatement: 85, studentAdvising: 86, documentAnalysis: 84, languageSupport: 92 },
    pricing: { input: '$1/1M', output: '$4/1M' },
    strengths: ['Chinese language', 'Cost-effective', 'Fast inference', 'Good for APAC students'],
    weaknesses: ['Newer model', 'Smaller ecosystem'],
  },
];

const SCORE_LABELS: Record<string, string> = {
  contentGeneration: 'Content Generation',
  quizCreation: 'Quiz Creation',
  personalStatement: 'Personal Statement',
  studentAdvising: 'Student Advising',
  documentAnalysis: 'Document Analysis',
  languageSupport: 'Language Support',
};

// ─── Component ───────────────────────────────────────────────────────

export function AIEducationToolkitPage({ onBack, onNavigate }: AIEducationToolkitPageProps) {
  const [activeTab, setActiveTab] = useState('course-builder');
  const [courseTopic, setCourseTopic] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [compareModels, setCompareModels] = useState<Set<string>>(new Set(['gpt4', 'claude']));

  const toggleCompare = (id: string) => {
    setCompareModels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <PageHeader
          title="AI Education Toolkit"
          subtitle="AI-powered course creation, assessment generation, and learning paths"
          icon="Brain"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" />Export
              </Button>
              <Button size="sm" className="gap-1.5 bg-[#E8501A] hover:bg-[#D04418]">
                <Sparkles className="size-3.5" />AI Generate
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Courses Created" value="24" icon="BookOpen" accent="blue" trend="+3 this week" />
          <StatCard label="Assessments" value="156" icon="Target" accent="violet" />
          <StatCard label="Active Learners" value="1,247" icon="Users" accent="emerald" trend="+12%" />
          <StatCard label="AI Generated" value="89%" icon="Sparkles" accent="orange" />
        </div>

        {/* Main Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger value="course-builder" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <BookOpen className="size-3.5" />Course Builder
              </TabsTrigger>
              <TabsTrigger value="assessment" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Target className="size-3.5" />Assessments
              </TabsTrigger>
              <TabsTrigger value="learning-path" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <GitBranch className="size-3.5" />Learning Path
              </TabsTrigger>
              <TabsTrigger value="model-comparison" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Cpu className="size-3.5" />Model Comparison
              </TabsTrigger>
            </TabsList>

            {/* Course Builder Tab */}
            <TabsContent value="course-builder" className="mt-4">
              {/* AI Course Generator */}
              <SectionCard
                title="AI Course Generator"
                description="Describe your course topic and let AI create the content structure"
                icon="Sparkles"
              >
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter course topic, e.g., 'UK University Application Process for Indian Students'"
                        value={courseTopic}
                        onChange={e => setCourseTopic(e.target.value)}
                        className="pr-20"
                      />
                      <Button size="sm" className="absolute right-1 top-1 h-7 gap-1 bg-[#E8501A] hover:bg-[#D04418] text-white">
                        <Sparkles className="size-3" />Generate
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['UK Education', 'Visa Process', 'IELTS Prep', 'Scholarship Search', 'SOP Writing', 'University Comparison'].map(s => (
                      <Button key={s} variant="outline" size="sm" className="h-7 text-xs hover:bg-[#EFF6FF] hover:text-[#0052B8] hover:border-[#0052B8]/30"
                        onClick={() => setCourseTopic(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Course Modules */}
              <div className="mt-6">
                <SectionCard
                  title="Course Modules"
                  description={`${COURSE_MODULES.length} modules · ${COURSE_MODULES.filter(m => m.aiGenerated).length} AI-generated`}
                  icon="Layers"
                  action={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="size-3.5" />Add Module
                    </Button>
                  }
                >
                  <div className="space-y-3">
                    {COURSE_MODULES.map(mod => (
                      <div key={mod.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn('flex size-9 items-center justify-center rounded-lg', MODULE_TYPE_COLORS[mod.type])}>
                            {mod.type === 'video' ? <Play className="size-4" /> :
                             mod.type === 'reading' ? <BookOpen className="size-4" /> :
                             mod.type === 'quiz' ? <Target className="size-4" /> :
                             mod.type === 'assignment' ? <PenTool className="size-4" /> :
                             <Users className="size-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900 truncate">{mod.title}</h4>
                              {mod.aiGenerated && (
                                <Badge variant="secondary" className="text-[9px] bg-violet-50 text-violet-600 shrink-0">
                                  <Sparkles className="size-2.5 mr-0.5" />AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{mod.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs text-slate-500">{mod.duration}</span>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[mod.status])}>
                            {mod.status}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit3 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </TabsContent>

            {/* Assessment Generator Tab */}
            <TabsContent value="assessment" className="mt-4">
              <SectionCard
                title="AI Assessment Generator"
                description="Auto-generate quizzes, tests, and assignments from course content"
                icon="Sparkles"
                action={
                  <Button size="sm" className="gap-1.5 bg-[#E8501A] hover:bg-[#D04418] text-white">
                    <Plus className="size-3.5" />New Assessment
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {ASSESSMENTS.map(assess => (
                    <Card key={assess.id} className="rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900">{assess.title}</h4>
                              {assess.aiGenerated && (
                                <Badge variant="secondary" className="text-[9px] bg-violet-50 text-violet-600">
                                  <Sparkles className="size-2.5 mr-0.5" />AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{assess.subject}</p>
                          </div>
                          <Badge className={cn(
                            assess.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            assess.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          )} variant="outline">
                            {assess.difficulty}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><FileText className="size-3" />{assess.questions} Qs</span>
                          <span className="flex items-center gap-1"><Clock className="size-3" />{assess.duration}</span>
                          <span className="flex items-center gap-1"><Users className="size-3" />{assess.completions}</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">Average Score</span>
                            <span className="text-xs font-medium text-slate-700">{assess.avgScore}%</span>
                          </div>
                          <Progress value={assess.avgScore} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            {/* Learning Path Tab */}
            <TabsContent value="learning-path" className="mt-4">
              <SectionCard
                title="Personalized Learning Path"
                description="Your step-by-step journey from inquiry to university enrollment"
                icon="GitBranch"
              >
                <div className="relative">
                  {/* Path visualization */}
                  <div className="space-y-0">
                    {LEARNING_PATH.map((step, i) => {
                      const isLast = i === LEARNING_PATH.length - 1;
                      return (
                        <div key={step.id} className="flex gap-4">
                          {/* Timeline */}
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex size-10 items-center justify-center rounded-full border-2 shrink-0',
                              step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                              step.status === 'current' ? 'bg-[#0052B8] border-[#0052B8] text-white' :
                              step.status === 'locked' ? 'bg-slate-100 border-slate-300 text-slate-400' :
                              'bg-white border-slate-300 text-slate-400'
                            )}>
                              {step.status === 'completed' ? <CheckCircle2 className="size-5" /> :
                               step.status === 'locked' ? <Lock className="size-5" /> :
                               <span className="text-sm font-bold">{i + 1}</span>}
                            </div>
                            {!isLast && (
                              <div className={cn(
                                'w-0.5 h-full min-h-[60px]',
                                step.status === 'completed' ? 'bg-emerald-300' :
                                step.status === 'current' ? 'bg-[#0052B8]/30' :
                                'bg-slate-200'
                              )} />
                            )}
                          </div>

                          {/* Content */}
                          <div className={cn(
                            'flex-1 pb-6 min-w-0',
                            step.status === 'locked' && 'opacity-50'
                          )}>
                            <Card className={cn(
                              'rounded-lg border transition-colors',
                              step.status === 'current' ? 'border-[#0052B8]/30 bg-[#EFF6FF]' :
                              step.status === 'completed' ? 'border-emerald-200 bg-emerald-50/50' :
                              'border-slate-200 bg-white'
                            )}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{step.label}</h4>
                                    <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                                  </div>
                                  {step.status === 'current' && (
                                    <Badge className="bg-[#0052B8] text-white shrink-0">In Progress</Badge>
                                  )}
                                </div>
                                <div className="mt-3 flex items-center gap-4">
                                  <div className="flex-1">
                                    <Progress value={step.progress} className="h-2" />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 shrink-0">{step.progress}%</span>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1"><Clock className="size-3" />{step.estimatedTime}</span>
                                  <span className="flex items-center gap-1"><BookOpen className="size-3" />{step.resources} resources</span>
                                </div>
                                {step.status === 'current' && (
                                  <Button size="sm" className="mt-3 gap-1 bg-[#0052B8] hover:bg-[#0042A0]">
                                    Continue <ArrowRight className="size-3" />
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Model Comparison Tab */}
            <TabsContent value="model-comparison" className="mt-4">
              {/* Model Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {AI_MODELS.map(model => (
                  <Card
                    key={model.id}
                    className={cn(
                      'rounded-xl border transition-all cursor-pointer',
                      compareModels.has(model.id) ? 'border-[#0052B8] ring-2 ring-[#0052B8]/20' : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => toggleCompare(model.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: model.bgColor }}>
                          <Brain className="size-5" style={{ color: model.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{model.name}</h3>
                          <p className="text-xs text-slate-500">{model.provider}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                        <div className="flex justify-between"><span>Context</span><span className="font-medium text-slate-700">{model.specs.contextWindow}</span></div>
                        <div className="flex justify-between"><span>Input Price</span><span className="font-medium text-slate-700">{model.pricing.input}</span></div>
                        <div className="flex justify-between"><span>Output Price</span><span className="font-medium text-slate-700">{model.pricing.output}</span></div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        {model.specs.multimodal && <Badge variant="secondary" className="text-[9px]">Multimodal</Badge>}
                        {model.specs.toolCalling && <Badge variant="secondary" className="text-[9px]">Tool Calling</Badge>}
                      </div>
                      {compareModels.has(model.id) && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[#0052B8]">
                          <CheckCircle2 className="size-3" />Selected for comparison
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Comparison Table */}
              {compareModels.size >= 2 && (
                <div className="mt-6">
                  <SectionCard
                    title="Education Capability Comparison"
                    description="Score out of 100 for each education-specific task"
                    icon="BarChart3"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 pr-4 font-medium text-slate-500 w-48">Capability</th>
                            {AI_MODELS.filter(m => compareModels.has(m.id)).map(model => (
                              <th key={model.id} className="text-center py-3 px-4 font-medium" style={{ color: model.color }}>
                                {model.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(SCORE_LABELS).map(([key, label]) => (
                            <tr key={key} className="border-b border-slate-100">
                              <td className="py-3 pr-4 text-slate-700">{label}</td>
                              {AI_MODELS.filter(m => compareModels.has(m.id)).map(model => {
                                const score = model.educationScores[key as keyof typeof model.educationScores];
                                const maxScore = Math.max(...AI_MODELS.filter(m => compareModels.has(m.id)).map(m => m.educationScores[key as keyof typeof m.educationScores]));
                                const isBest = score === maxScore;
                                return (
                                  <td key={model.id} className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={cn('font-semibold', isBest ? 'text-emerald-600' : 'text-slate-700')}>{score}</span>
                                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: isBest ? '#15803D' : model.color }} />
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          <tr className="border-t-2 border-slate-200">
                            <td className="py-3 pr-4 font-semibold text-slate-900">Average</td>
                            {AI_MODELS.filter(m => compareModels.has(m.id)).map(model => {
                              const avg = Math.round(Object.values(model.educationScores).reduce((a, b) => a + b, 0) / Object.values(model.educationScores).length);
                              return (
                                <td key={model.id} className="py-3 px-4 text-center">
                                  <span className="font-bold text-lg" style={{ color: model.color }}>{avg}</span>
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>

                  {/* Strengths & Weaknesses */}
                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {AI_MODELS.filter(m => compareModels.has(m.id)).map(model => (
                      <Card key={model.id} className="rounded-xl border border-slate-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: model.bgColor }}>
                              <Brain className="size-4" style={{ color: model.color }} />
                            </div>
                            <CardTitle className="text-base">{model.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-emerald-600 mb-1.5">✓ Strengths</p>
                            <div className="flex flex-wrap gap-1.5">
                              {model.strengths.map(s => (
                                <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-amber-600 mb-1.5">⚠ Considerations</p>
                            <div className="flex flex-wrap gap-1.5">
                              {model.weaknesses.map(w => (
                                <span key={w} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">{w}</span>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {compareModels.size < 2 && (
                <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                  <Cpu className="size-10 text-slate-300" />
                  <p className="mt-3 font-medium text-slate-700">Select at least 2 models to compare</p>
                  <p className="text-sm text-slate-500">Click on model cards above to select them</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
