'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Plane,
  GraduationCap,
  Home,
  BookOpen,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react';

/**
 * Student Progress Dashboard Widget
 *
 * Inspired by Studytra's Dashboard component:
 * - Welcome banner with personalized greeting
 * - Progress ring showing completion %
 * - Country-specific deadline countdown
 * - Tabbed interface: Overview | Timeline | Documents | Visa
 * - Checklist with toggleable steps
 * - Budget summary integration
 *
 * Inspired by NextStep-Abroad:
 * - Animated stat cards
 * - Table/card view toggle
 * - Responsive design
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimelineStep {
  id: string;
  label: string;
  description: string;
  icon: string;
  estimatedDays: number;
  isCompleted: boolean;
}

interface DocumentItem {
  id: string;
  name: string;
  category: string;
  isRequired: boolean;
  isCompleted: boolean;
  notes?: string;
}

interface VisaStep {
  id: string;
  label: string;
  details: string;
  isCompleted: boolean;
}

interface StudentProgressDashboardProps {
  studentName: string;
  targetCountry: string;
  targetCountryFlag: string;
  targetDegree: string;
  targetCourse: string;
  timelineSteps?: TimelineStep[];
  documents?: DocumentItem[];
  visaSteps?: VisaStep[];
  onToggleStep?: (stepId: string) => void;
  onToggleDoc?: (docId: string) => void;
  onNavigate?: (view: string) => void;
}

// ─── Deadline Helper ─────────────────────────────────────────────────────────

function getDeadlineInfo(country: string): { date: Date; label: string } {
  const today = new Date();
  const year = today.getFullYear();

  const deadlines: Record<string, { month: number; day: number; label: string }> = {
    germany: { month: 6, day: 15, label: 'Winter Semester Deadline' },
    usa: { month: 11, day: 15, label: 'Fall Admission Deadline' },
    canada: { month: 0, day: 15, label: 'Spring Intake Deadline' },
    uk: { month: 7, day: 31, label: 'September Intake Deadline' },
    australia: { month: 10, day: 30, label: 'Semester 1 Deadline' },
  };

  const info = deadlines[country.toLowerCase()] || deadlines.uk;
  let deadlineDate = new Date(year, info.month, info.day);

  if (deadlineDate <= today) {
    deadlineDate = new Date(year + 1, info.month, info.day);
  }

  return { date: deadlineDate, label: info.label };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function StudentProgressDashboard({
  studentName,
  targetCountry,
  targetCountryFlag,
  targetDegree,
  targetCourse,
  timelineSteps = DEFAULT_TIMELINE,
  documents = DEFAULT_DOCUMENTS,
  visaSteps = DEFAULT_VISA,
  onToggleStep,
  onToggleDoc,
  onNavigate,
}: StudentProgressDashboardProps) {
  // Calculate progress
  const completedSteps = timelineSteps.filter(s => s.isCompleted).length;
  const completedDocs = documents.filter(d => d.isCompleted).length;
  const totalTasks = timelineSteps.length + documents.length;
  const progressPct = Math.round(((completedSteps + completedDocs) / totalTasks) * 100);

  // Deadline
  const deadlineInfo = getDeadlineInfo(targetCountry);
  const daysRemaining = Math.ceil((deadlineInfo.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const isUrgent = daysRemaining <= 30;

  return (
    <div className="space-y-4">
      {/* ── Welcome Banner ─────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-alo-blue to-[#004C99] p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200">Welcome back,</p>
            <h2 className="text-xl sm:text-2xl font-bold mt-0.5">Hello, {studentName}!</h2>
            <p className="text-sm text-blue-200 mt-1.5">
              Your personalized roadmap for {targetCountryFlag} {targetCountry}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className="bg-white/20 text-white border-0 text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                {targetDegree}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                {targetCourse}
              </Badge>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="4"
                  strokeDasharray={`${progressPct * 1.76} 176`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {progressPct}%
              </span>
            </div>
            <span className="text-[10px] text-blue-200 mt-1">Complete</span>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat
          icon={CheckCircle2}
          value={`${completedSteps}/${timelineSteps.length}`}
          label="Steps Done"
          accent="emerald"
        />
        <QuickStat
          icon={FileText}
          value={`${completedDocs}/${documents.length}`}
          label="Documents"
          accent="blue"
        />
        <QuickStat
          icon={Clock}
          value={isUrgent ? `${daysRemaining}d` : `${daysRemaining}d`}
          label={deadlineInfo.label}
          accent={isUrgent ? 'rose' : 'amber'}
        />
        <QuickStat
          icon={Plane}
          value={targetCountryFlag}
          label={targetCountry}
          accent="violet"
        />
      </div>

      {/* ── Tabbed Content ─────────────────────────────────────────── */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="timeline" className="text-xs">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">
            <FileText className="h-3.5 w-3.5 mr-1" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="visa" className="text-xs">
            <Plane className="h-3.5 w-3.5 mr-1" />
            Visa
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              {timelineSteps.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                    step.isCompleted
                      ? 'bg-emerald-50/50 hover:bg-emerald-50'
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => onToggleStep?.(step.id)}
                >
                  {/* Step number / check */}
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    step.isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-alo-blue-light text-alo-blue'
                  )}>
                    {step.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      step.isCompleted ? 'text-emerald-800 line-through' : 'text-foreground'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0">{step.estimatedDays}d</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-2">
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Document Progress</span>
                  <span className="text-xs font-bold">{completedDocs}/{documents.length}</span>
                </div>
                <Progress value={(completedDocs / documents.length) * 100} className="h-2" />
              </div>

              {/* Document list grouped by category */}
              {Object.entries(
                documents.reduce<Record<string, DocumentItem[]>>((acc, doc) => {
                  if (!acc[doc.category]) acc[doc.category] = [];
                  acc[doc.category].push(doc);
                  return acc;
                }, {})
              ).map(([category, docs]) => (
                <div key={category} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-2">
                    {category}
                  </p>
                  {docs.map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                        doc.isCompleted ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                      )}
                      onClick={() => onToggleDoc?.(doc.id)}
                    >
                      {doc.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : doc.isRequired ? (
                        <Circle className="h-4 w-4 shrink-0 text-alo-orange" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={cn(
                        'text-sm flex-1',
                        doc.isCompleted ? 'text-emerald-800 line-through' : 'text-foreground'
                      )}>
                        {doc.name}
                      </span>
                      {doc.isRequired && !doc.isCompleted && (
                        <Badge variant="outline" className="text-[9px] border-alo-orange/30 text-alo-orange">Required</Badge>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visa Tab */}
        <TabsContent value="visa" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plane className="h-4 w-4 text-alo-blue" />
                Visa Roadmap for {targetCountryFlag} {targetCountry}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {visaSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg p-3',
                    step.isCompleted ? 'bg-emerald-50/50' : ''
                  )}
                >
                  <div className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    step.isCompleted
                      ? 'bg-emerald-500 text-white'
                      : idx === visaSteps.findIndex(s => !s.isCompleted)
                      ? 'bg-alo-orange text-white'
                      : 'bg-gray-100 text-muted-foreground'
                  )}>
                    {step.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      step.isCompleted ? 'text-emerald-800' : 'text-foreground'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.details}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5 border-alo-gray-medium"
          onClick={() => onNavigate?.('course-finder')}
        >
          <BookOpen className="h-5 w-5 text-alo-blue" />
          <span className="text-xs font-medium">Find Courses</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5 border-alo-gray-medium"
          onClick={() => onNavigate?.('cost-planner')}
        >
          <CreditCard className="h-5 w-5 text-alo-orange" />
          <span className="text-xs font-medium">Cost Planner</span>
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function QuickStat({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  accent: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
}) {
  const accentMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
  };

  return (
    <div className={cn('rounded-xl border p-3', accentMap[accent])}>
      <Icon className="h-4 w-4 mb-1" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] mt-1 opacity-80 line-clamp-2">{label}</p>
    </div>
  );
}

// ─── Default Data ────────────────────────────────────────────────────────────

const DEFAULT_TIMELINE: TimelineStep[] = [
  { id: 'research', label: 'Research Universities', description: 'Shortlist 8-12 universities based on profile', icon: 'Search', estimatedDays: 14, isCompleted: true },
  { id: 'ielts', label: 'English Proficiency Test', description: 'IELTS/TOEFL/PTE — target score per university', icon: 'BookOpen', estimatedDays: 30, isCompleted: true },
  { id: 'sop', label: 'Write SOP & Essays', description: 'Statement of Purpose + university-specific essays', icon: 'FileText', estimatedDays: 21, isCompleted: false },
  { id: 'lor', label: 'Get LORs', description: '2-3 Letters of Recommendation from professors/manager', icon: 'Users', estimatedDays: 14, isCompleted: false },
  { id: 'apply', label: 'Submit Applications', description: 'Online application + documents upload + fee payment', icon: 'Send', estimatedDays: 7, isCompleted: false },
  { id: 'offer', label: 'Receive Offer Letters', description: 'Wait for admission decisions (4-8 weeks)', icon: 'Mail', estimatedDays: 45, isCompleted: false },
];

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { id: 'passport', name: 'Valid Passport', category: 'Identity', isRequired: true, isCompleted: true },
  { id: 'transcript', name: 'Academic Transcripts', category: 'Academic', isRequired: true, isCompleted: true },
  { id: 'degree-cert', name: 'Degree Certificate', category: 'Academic', isRequired: true, isCompleted: false },
  { id: 'ielts-score', name: 'IELTS/TOEFL Score Report', category: 'Academic', isRequired: true, isCompleted: true },
  { id: 'sop-doc', name: 'Statement of Purpose', category: 'Application', isRequired: true, isCompleted: false },
  { id: 'cv-resume', name: 'CV / Resume', category: 'Application', isRequired: true, isCompleted: false },
  { id: 'lor1', name: 'LOR 1 — Academic', category: 'Application', isRequired: true, isCompleted: false },
  { id: 'lor2', name: 'LOR 2 — Professional', category: 'Application', isRequired: false, isCompleted: false },
  { id: 'bank-stmt', name: 'Bank Statements (28 days)', category: 'Financial', isRequired: true, isCompleted: false },
  { id: 'loan-approval', name: 'Education Loan Sanction Letter', category: 'Financial', isRequired: false, isCompleted: false },
];

const DEFAULT_VISA: VisaStep[] = [
  { id: 'cas', label: 'Get CAS/COE Letter', details: 'Confirmation of Acceptance from university', isCompleted: false },
  { id: 'financial', label: 'Show Financial Evidence', details: 'Bank statements + loan letter for 28 days', isCompleted: false },
  { id: 'visa-apply', label: 'Submit Visa Application', details: 'Online form + biometrics appointment', isCompleted: false },
  { id: 'biometrics', label: 'Attend Biometrics', details: 'Fingerprints + photo at visa center', isCompleted: false },
  { id: 'visa-decision', label: 'Receive Visa Decision', details: 'Typically 3-6 weeks processing', isCompleted: false },
  { id: 'travel', label: 'Book Travel & Prepare', details: 'Flights, accommodation, health insurance, packing', isCompleted: false },
];
