'use client';

import React, { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Shield,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Plane,
  Mic,
  Banknote,
  FileText,
  CalendarDays,
  Sparkles,
  MessageSquare,
  Download,
  AlertCircle,
  MapPin,
  ArrowRight,
  CalendarCheck,
  Fingerprint,
  ClipboardCheck,
  Stamp,
  PartyPopper,
  BookOpen,
  Luggage,
  Home,
  ShieldCheck,
  Phone,
} from 'lucide-react';

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */

const VISA_READINESS_SCORE = 65;
const COMPLETED_ITEMS = 5;
const TOTAL_ITEMS = 14;

interface VisaChecklistItem {
  id: string;
  name: string;
  completed: boolean;
  status: 'Done' | 'Pending' | 'Action Required';
  dueDate: string | null;
  notes?: string;
}

const VISA_CHECKLIST: VisaChecklistItem[] = [
  { id: 'passport', name: 'Valid passport (expires after course end)', completed: true, status: 'Done', dueDate: null },
  { id: 'cas', name: 'CAS/Confirmation of Acceptance for Studies', completed: true, status: 'Done', dueDate: null },
  { id: 'tb-test', name: 'TB test certificate', completed: false, status: 'Action Required', dueDate: '2025-08-01', notes: 'Schedule appointment at approved clinic' },
  { id: 'bank-statement', name: 'Bank statement (28-day rule)', completed: true, status: 'Done', dueDate: null },
  { id: 'sponsorship', name: 'Financial sponsorship letter (if applicable)', completed: false, status: 'Pending', dueDate: null, notes: 'Not applicable — self-funded' },
  { id: 'academic-certs', name: 'Academic certificates (attested)', completed: true, status: 'Done', dueDate: null },
  { id: 'english-test', name: 'English test certificate (valid)', completed: true, status: 'Done', dueDate: null },
  { id: 'atas', name: 'ATAS certificate (if required)', completed: false, status: 'Action Required', dueDate: '2025-07-25', notes: 'Required for MSc courses — apply 6 weeks early' },
  { id: 'parental-consent', name: 'Parental consent (if under 18)', completed: false, status: 'Pending', dueDate: null, notes: 'Not applicable — over 18' },
  { id: 'visa-form', name: 'Visa application form completed', completed: true, status: 'Done', dueDate: null },
  { id: 'visa-fee', name: 'Visa fee payment receipt', completed: false, status: 'Pending', dueDate: '2025-08-10' },
  { id: 'biometrics', name: 'Biometric appointment booked', completed: false, status: 'Pending', dueDate: '2025-08-15' },
  { id: 'mock-interview', name: 'Mock interview completed', completed: false, status: 'Pending', dueDate: '2025-08-05' },
  { id: 'travel-insurance', name: 'Travel insurance', completed: false, status: 'Pending', dueDate: '2025-09-01' },
];

const VISA_TIMELINE_STEPS = [
  { id: 'docs', label: 'Documents Ready', icon: FileText, completed: true },
  { id: 'tb', label: 'TB Test', icon: ClipboardCheck, completed: false, current: true },
  { id: 'cas', label: 'CAS Received', icon: Stamp, completed: true },
  { id: 'visa-app', label: 'Visa Application', icon: FileText, completed: false },
  { id: 'biometrics', label: 'Biometrics', icon: Fingerprint, completed: false },
  { id: 'interview', label: 'Interview', icon: Mic, completed: false },
  { id: 'decision', label: 'Decision', icon: ClipboardCheck, completed: false },
  { id: 'visa-received', label: 'Visa Received', icon: PartyPopper, completed: false },
];

const INTERVIEW_QUESTIONS = [
  'Why did you choose this university and course in the UK?',
  'How will this degree help your career goals?',
  'How are you funding your studies?',
  'Do you plan to work in the UK after graduation?',
  'Why did you choose to study abroad rather than in your home country?',
];

interface TravelChecklistItem {
  id: string;
  name: string;
  completed: boolean;
  icon: React.ElementType;
}

const TRAVEL_CHECKLIST: TravelChecklistItem[] = [
  { id: 'flights', name: 'Book flights', completed: false, icon: Plane },
  { id: 'accommodation', name: 'Confirm accommodation', completed: false, icon: Home },
  { id: 'insurance', name: 'Arrange travel & health insurance', completed: false, icon: ShieldCheck },
  { id: 'packing', name: 'Prepare packing list', completed: false, icon: Luggage },
  { id: 'documents-pack', name: 'Pack all original documents', completed: false, icon: FileText },
  { id: 'currency', name: 'Arrange GBP currency/travel card', completed: false, icon: Banknote },
  { id: 'airport-pickup', name: 'Arrange airport pickup', completed: false, icon: MapPin },
  { id: 'sim-card', name: 'Get international SIM card', completed: false, icon: Phone },
];

/* ================================================================== */
/*  CIRCULAR PROGRESS COMPONENT                                         */
/* ================================================================== */

function CircularProgress({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass =
    score > 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const strokeColor =
    score > 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const bgColor =
    score > 80 ? '#D1FAE5' : score >= 50 ? '#FEF3C7' : '#FEE2E2';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={
            {
              '--circumference': circumference,
              '--offset': offset,
              animation: 'circular-progress 1.2s ease-out forwards',
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold', colorClass)}>{score}%</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  VISA TIMELINE COMPONENT                                             */
/* ================================================================== */

function VisaTimeline() {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          Visa Application Timeline
        </CardTitle>
        <CardDescription>Track your visa application progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Desktop horizontal timeline */}
          <div className="hidden md:flex items-start gap-0 overflow-x-auto pb-4 custom-scrollbar">
            {VISA_TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = step.current;
              const isCompleted = step.completed;
              const isLast = idx === VISA_TIMELINE_STEPS.length - 1;

              return (
                <div key={step.id} className="flex items-start flex-shrink-0">
                  {/* Step node */}
                  <div className="flex flex-col items-center w-20">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-white border-slate-300 text-slate-400'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-[10px] mt-1.5 text-center font-medium leading-tight',
                        isCompleted
                          ? 'text-emerald-700'
                          : isCurrent
                            ? 'text-blue-700 font-semibold'
                            : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex items-center h-10 mt-0 -mx-1">
                      <div
                        className={cn(
                          'h-0.5 w-8',
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      />
                      {isCurrent && (
                        <ArrowRight className="w-3 h-3 text-blue-500 -ml-0.5" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile vertical timeline */}
          <div className="md:hidden space-y-0">
            {VISA_TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = step.current;
              const isCompleted = step.completed;
              const isLast = idx === VISA_TIMELINE_STEPS.length - 1;

              return (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-white border-slate-300 text-slate-400'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          'w-0.5 flex-1 min-h-6',
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        )}
                      />
                    )}
                  </div>
                  <div className={cn('pb-4', isLast && 'pb-0')}>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isCompleted
                          ? 'text-emerald-700'
                          : isCurrent
                            ? 'text-blue-700'
                            : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-blue-600 mt-0.5">Current step</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                      */
/* ================================================================== */

export default function StudentVisaCenter() {
  const { setView, token } = usePortalStore();
  const [apiVisa, setApiVisa] = useState<VisaChecklistItem[] | null>(null)
  useEffect(() => { if (!token) return; fetch('/api/student-portal/visa', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(j => { if (j.success && j.data && j.data.length > 0) setApiVisa(j.data); }).catch(() => {}); }, [token]);
  const visaData = (apiVisa && apiVisa.length > 0) ? apiVisa : VISA_CHECKLIST;
  const [checklist, setChecklist] = useState(visaData);
  const [travelChecklist, setTravelChecklist] = useState(TRAVEL_CHECKLIST);
  const [aiOpen, setAiOpen] = useState(false);

  const completedCount = checklist.filter((i) => i.completed).length;
  const pendingActionCount = checklist.filter((i) => i.status === 'Action Required').length;

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              status: !item.completed ? 'Done' : 'Pending',
            }
          : item
      )
    );
  };

  const toggleTravelItem = (id: string) => {
    setTravelChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visa Preparation Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Prepare and track your UK Student Visa application
        </p>
      </div>

      {/* ============ TOP: Readiness Score + Quick Stats ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circular progress */}
        <Card className="border-slate-200 lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CircularProgress score={VISA_READINESS_SCORE} />
            <p className="text-sm font-medium text-slate-900 mt-4">
              Your visa readiness score
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {COMPLETED_ITEMS} of {TOTAL_ITEMS} items completed
            </p>
            {pendingActionCount > 0 && (
              <Badge className="mt-3 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {pendingActionCount} action{pendingActionCount > 1 ? 's' : ''} required
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {checklist.filter((i) => i.status === 'Pending').length}
              </p>
              <p className="text-xs text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{pendingActionCount}</p>
              <p className="text-xs text-slate-500">Action Required</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">UK</p>
              <p className="text-xs text-slate-500">Destination</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============ COUNTRY-SPECIFIC CHECKLIST ============ */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                UK Student Visa Checklist
              </CardTitle>
              <CardDescription>
                Documents required for your UK Tier 4 / Student Visa
              </CardDescription>
            </div>
            <Progress value={(completedCount / TOTAL_ITEMS) * 100} className="w-24 h-2 hidden sm:block" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-[480px] overflow-y-auto custom-scrollbar">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-slate-50',
                  item.completed && 'bg-emerald-50/50'
                )}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        item.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                      )}
                    >
                      {item.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        item.status === 'Done' && 'bg-emerald-100 text-emerald-700',
                        item.status === 'Pending' && 'bg-slate-100 text-slate-600',
                        item.status === 'Action Required' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {item.dueDate && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {item.notes && item.status === 'Action Required' && (
                      <span className="text-xs text-amber-600">{item.notes}</span>
                    )}
                  </div>
                </div>
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : item.status === 'Action Required' ? (
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============ VISA TIMELINE ============ */}
      <VisaTimeline />

      {/* ============ BOTTOM GRID: Interview + Finance + Warning + Travel ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interview Preparation */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-600" />
              Interview Preparation
            </CardTitle>
            <CardDescription>
              Prepare for your credibility interview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                <CalendarCheck className="w-4 h-4 mr-2" />
                Book Mock Interview
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => setView('student-interviews')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Practice with AI
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Common Interview Questions
              </p>
              <div className="space-y-2">
                {INTERVIEW_QUESTIONS.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs text-blue-800 font-medium">
                💡 Tip: Practice answering these questions out loud. The AI mock interview provides
                real-time feedback on your responses.
              </p>
            </div>

            {/* Past interview attempts */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Past Interview Attempts
              </p>
              <div className="text-sm text-slate-400 text-center py-4">
                No mock interviews completed yet. Book your first session to get started.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Evidence Guide */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-blue-600" />
              Financial Evidence Guide
            </CardTitle>
            <CardDescription>
              UK visa financial requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-blue-700">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Maintain minimum balance for 28 consecutive days
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your bank statement must show the required funds for a full 28 days before applying
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-blue-700">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Tuition fee + living costs for the course duration
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Includes first year tuition and living costs at the UKVI rate
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Estimated amount */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">
                Estimated Required Amount
              </p>
              <p className="text-xs text-blue-600 mb-2">
                Based on your MSc International Business at University of Aberdeen
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Tuition (1st year)</span>
                  <span className="text-sm font-semibold text-slate-900">£24,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Living costs (9 months)</span>
                  <span className="text-sm font-semibold text-slate-900">£11,340</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Additional buffer</span>
                  <span className="text-sm font-semibold text-slate-900">£500</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Required</span>
                  <span className="text-lg font-bold text-blue-700">£36,040</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 font-medium flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Your bank statement period ends on <strong>August 5, 2025</strong>. Ensure the balance
                is maintained throughout.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Previous Refusal Warning */}
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Previous Refusal Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-700">
              You have a previous UK visa refusal. This requires careful preparation.
            </p>
            <div className="rounded-lg bg-white border border-red-200 p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Refusal Date</span>
                <span className="text-xs font-medium text-slate-900">March 15, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Visa Type</span>
                <span className="text-xs font-medium text-slate-900">Student Visa (Tier 4)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Refusal Reason</span>
                <span className="text-xs font-medium text-red-700">Insufficient financial evidence</span>
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                📋 Counselor Risk Mitigation Notes
              </p>
              <p className="text-xs text-blue-700">
                Your counselor Sarah Khan has prepared additional documentation to address the
                previous refusal reason. The new bank statements clearly show 28-day maintained
                balance. A cover letter addressing the previous refusal has also been drafted.
                Please review the additional documents section.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              View Refusal Details
            </Button>
          </CardContent>
        </Card>

        {/* Travel Checklist */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600" />
              Travel Checklist
            </CardTitle>
            <CardDescription>
              Pre-departure preparation items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {travelChecklist.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleTravelItem(item.id)}
                    />
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        item.completed ? 'text-slate-400' : 'text-slate-500'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm flex-1',
                        item.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}