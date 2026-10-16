'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  GraduationCap,
  Filter,
  SortAsc,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Eye,
  ArrowRight,
  Building2,
  MapPin,
  GraduationCap as UniIcon,
  UserCircle,
  Upload,
  Download,
  Info,
  Circle,
  CircleCheck,
  CircleDot,
  Loader2,
  Send,
  ShieldCheck,
  Stamp,
  CreditCard,
  Plane,
  FileCheck,
  PartyPopper,
  FileX,
  RotateCcw,
  Clapperboard,
  Search,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES & CONSTANTS                                                  */
/* ================================================================== */

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted to ALO'
  | 'Document Review'
  | 'Submitted to University'
  | 'Application Acknowledged'
  | 'Conditional Offer'
  | 'Unconditional Offer'
  | 'Deposit Pending'
  | 'CAS/I-20/COE Processing'
  | 'Visa File Preparing'
  | 'Visa Submitted'
  | 'Visa Approved'
  | 'Enrolled'
  | 'Rejected'
  | 'Withdrawn';

const STATUS_FLOW: ApplicationStatus[] = [
  'Draft',
  'Submitted to ALO',
  'Document Review',
  'Submitted to University',
  'Application Acknowledged',
  'Conditional Offer',
  'Unconditional Offer',
  'Deposit Pending',
  'CAS/I-20/COE Processing',
  'Visa File Preparing',
  'Visa Submitted',
  'Visa Approved',
  'Enrolled',
];

interface StatusConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: React.ElementType;
  progressValue: number;
}

const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  Draft: {
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    icon: Clapperboard,
    progressValue: 0,
  },
  'Submitted to ALO': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Send,
    progressValue: 8,
  },
  'Document Review': {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: FileText,
    progressValue: 15,
  },
  'Submitted to University': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Send,
    progressValue: 23,
  },
  'Application Acknowledged': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: CheckCircle2,
    progressValue: 31,
  },
  'Conditional Offer': {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: AlertTriangle,
    progressValue: 46,
  },
  'Unconditional Offer': {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: CheckCircle2,
    progressValue: 54,
  },
  'Deposit Pending': {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    icon: CreditCard,
    progressValue: 62,
  },
  'CAS/I-20/COE Processing': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Stamp,
    progressValue: 69,
  },
  'Visa File Preparing': {
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    icon: FileCheck,
    progressValue: 77,
  },
  'Visa Submitted': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: Send,
    progressValue: 85,
  },
  'Visa Approved': {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: ShieldCheck,
    progressValue: 92,
  },
  Enrolled: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    icon: PartyPopper,
    progressValue: 100,
  },
  Rejected: {
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: XCircle,
    progressValue: 0,
  },
  Withdrawn: {
    color: 'bg-gray-100 text-gray-500 border-gray-300',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-500',
    icon: RotateCcw,
    progressValue: 0,
  },
};

interface TimelineEvent {
  date: string;
  description: string;
  actor: string;
  icon: React.ElementType;
}

interface ApplicationDocument {
  name: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Missing';
  type: string;
}

interface ApplicationMessage {
  id: string;
  sender: string;
  role: 'student' | 'counselor' | 'system';
  message: string;
  date: string;
  unread: boolean;
}

interface Application {
  id: string;
  applicationId: string;
  studentId: string;
  university: string;
  universityLogo: string;
  course: string;
  country: string;
  intake: string;
  status: ApplicationStatus;
  nextAction: string;
  deadline: string | null;
  counselorNote: string | null;
  timeline: TimelineEvent[];
  documents: ApplicationDocument[];
  messages: ApplicationMessage[];
  createdAt: string;
}

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */

const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    applicationId: 'ALO-2025-00847',
    studentId: 'STU-2025-0321',
    university: 'University of Aberdeen',
    universityLogo: '',
    course: 'MSc International Business',
    country: 'United Kingdom',
    intake: 'Sep 2026',
    status: 'Conditional Offer',
    nextAction: 'Upload final degree transcript to meet conditional offer requirements',
    deadline: '2025-08-15',
    counselorNote: 'Great news! Conditional offer received. You need to submit your final semester transcript with a minimum CGPA of 3.2. The deadline for meeting conditions is Aug 15.',
    timeline: [
      { date: 'Jul 1, 2025', description: 'Application draft created', actor: 'You', icon: Clapperboard },
      { date: 'Jul 5, 2025', description: 'Documents submitted for review', actor: 'You', icon: Upload },
      { date: 'Jul 8, 2025', description: 'Documents verified and approved by counselor', actor: 'Sarah Mitchell (Counselor)', icon: CheckCircle2 },
      { date: 'Jul 10, 2025', description: 'Application submitted to University of Aberdeen', actor: 'Sarah Mitchell (Counselor)', icon: Send },
      { date: 'Jul 15, 2025', description: 'Application acknowledged by university', actor: 'System', icon: Info },
      { date: 'Jul 22, 2025', description: 'Conditional offer received — Meet CGPA 3.2 requirement', actor: 'University of Aberdeen', icon: AlertTriangle },
    ],
    documents: [
      { name: 'Passport Copy', status: 'Approved', type: 'Identity' },
      { name: 'IELTS Certificate', status: 'Approved', type: 'English Test' },
      { name: 'Bachelor Transcript', status: 'Approved', type: 'Academic' },
      { name: 'Final Semester Transcript', status: 'Missing', type: 'Academic' },
      { name: 'Statement of Purpose', status: 'Approved', type: 'Application' },
      { name: 'CV / Resume', status: 'Approved', type: 'Application' },
      { name: 'Recommendation Letter 1', status: 'Approved', type: 'Application' },
      { name: 'Recommendation Letter 2', status: 'Approved', type: 'Application' },
    ],
    messages: [
      { id: 'm1', sender: 'Sarah Mitchell', role: 'counselor', message: 'I\'ve submitted your application to Aberdeen. They typically respond with an acknowledgment within 5-7 business days.', date: 'Jul 10, 2025', unread: false },
      { id: 'm2', sender: 'System', role: 'system', message: 'Your application has been acknowledged by University of Aberdeen. Reference: ABERD-2025-78432.', date: 'Jul 15, 2025', unread: false },
      { id: 'm3', sender: 'Sarah Mitchell', role: 'counselor', message: 'Excellent news! You\'ve received a conditional offer. The condition is to achieve a minimum CGPA of 3.2 in your final semester. Please upload your final transcript as soon as it\'s available.', date: 'Jul 22, 2025', unread: true },
    ],
    createdAt: '2025-07-01',
  },
  {
    id: 'app-002',
    applicationId: 'ALO-2025-00852',
    studentId: 'STU-2025-0321',
    university: 'University of Leeds',
    universityLogo: '',
    course: 'MSc Data Science',
    country: 'United Kingdom',
    intake: 'Sep 2026',
    status: 'Submitted to University',
    nextAction: 'Awaiting university acknowledgment — typically 5-7 business days',
    deadline: '2025-08-30',
    counselorNote: 'Your application is strong. Leeds Data Science is competitive but your profile matches well. Expected response time is 4-6 weeks.',
    timeline: [
      { date: 'Jul 3, 2025', description: 'Application draft created', actor: 'You', icon: Clapperboard },
      { date: 'Jul 7, 2025', description: 'Documents submitted for review', actor: 'You', icon: Upload },
      { date: 'Jul 9, 2025', description: 'Documents verified and approved by counselor', actor: 'Sarah Mitchell (Counselor)', icon: CheckCircle2 },
      { date: 'Jul 12, 2025', description: 'Application submitted to University of Leeds', actor: 'Sarah Mitchell (Counselor)', icon: Send },
    ],
    documents: [
      { name: 'Passport Copy', status: 'Approved', type: 'Identity' },
      { name: 'PTE Academic Certificate', status: 'Approved', type: 'English Test' },
      { name: 'Bachelor Transcript', status: 'Approved', type: 'Academic' },
      { name: 'Bachelor Certificate', status: 'Approved', type: 'Academic' },
      { name: 'Statement of Purpose', status: 'Approved', type: 'Application' },
      { name: 'CV / Resume', status: 'Approved', type: 'Application' },
      { name: 'Recommendation Letter 1', status: 'Approved', type: 'Application' },
      { name: 'Recommendation Letter 2', status: 'Approved', type: 'Application' },
    ],
    messages: [
      { id: 'm4', sender: 'Sarah Mitchell', role: 'counselor', message: 'Application submitted to Leeds! Their data science program is highly regarded. I\'ll let you know as soon as we hear back.', date: 'Jul 12, 2025', unread: false },
    ],
    createdAt: '2025-07-03',
  },
  {
    id: 'app-003',
    applicationId: 'ALO-2025-00861',
    studentId: 'STU-2025-0321',
    university: 'University of Glasgow',
    universityLogo: '',
    course: 'MSc Computer Science',
    country: 'United Kingdom',
    intake: 'Jan 2027',
    status: 'Document Review',
    nextAction: 'Upload missing documents: HSC Certificate and SOP',
    deadline: null,
    counselorNote: 'We\'re still reviewing your documents. The HSC certificate and SOP need to be uploaded before we can proceed. Let me know if you need help with the SOP.',
    timeline: [
      { date: 'Jul 18, 2025', description: 'Application draft created', actor: 'You', icon: Clapperboard },
      { date: 'Jul 20, 2025', description: 'Initial documents submitted for review', actor: 'You', icon: Upload },
      { date: 'Jul 22, 2025', description: 'Document review in progress — 2 documents missing', actor: 'Sarah Mitchell (Counselor)', icon: FileText },
    ],
    documents: [
      { name: 'Passport Copy', status: 'Approved', type: 'Identity' },
      { name: 'IELTS Certificate', status: 'Approved', type: 'English Test' },
      { name: 'SSC Certificate', status: 'Approved', type: 'Academic' },
      { name: 'SSC Transcript', status: 'Approved', type: 'Academic' },
      { name: 'HSC Certificate', status: 'Missing', type: 'Academic' },
      { name: 'HSC Transcript', status: 'Approved', type: 'Academic' },
      { name: 'Bachelor Transcript', status: 'Approved', type: 'Academic' },
      { name: 'Statement of Purpose', status: 'Missing', type: 'Application' },
      { name: 'CV / Resume', status: 'Pending', type: 'Application' },
    ],
    messages: [
      { id: 'm5', sender: 'Sarah Mitchell', role: 'counselor', message: 'Thanks for submitting the initial documents. I noticed we\'re still missing your HSC Certificate and the Statement of Purpose. The SOP is especially important for Glasgow CS program — they look for specific research interests.', date: 'Jul 22, 2025', unread: true },
    ],
    createdAt: '2025-07-18',
  },
];

const FILTER_STATUSES: Array<ApplicationStatus | 'All'> = [
  'All',
  'Draft',
  'Submitted to ALO',
  'Document Review',
  'Submitted to University',
  'Application Acknowledged',
  'Conditional Offer',
  'Unconditional Offer',
  'Deposit Pending',
  'CAS/I-20/COE Processing',
  'Visa File Preparing',
  'Visa Submitted',
  'Visa Approved',
  'Enrolled',
  'Rejected',
  'Withdrawn',
];

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */

function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const target = new Date(deadline);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatCountdown(days: number): string {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function getProgressForStatus(status: ApplicationStatus): number {
  const config = STATUS_CONFIG[status];
  if (status === 'Rejected' || status === 'Withdrawn') return config.progressValue;
  return config.progressValue;
}

function getStageIndex(status: ApplicationStatus): number {
  const idx = STATUS_FLOW.indexOf(status);
  return idx >= 0 ? idx : -1;
}

/* ================================================================== */
/*  COMPONENT: Status Badge                                            */
/* ================================================================== */

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold',
        config.color
      )}
    >
      <Icon className="size-3.5" />
      {status}
    </span>
  );
}

/* ================================================================== */
/*  COMPONENT: Countdown Badge                                         */
/* ================================================================== */

function CountdownBadge({ deadline }: { deadline: string | null }) {
  const days = getDaysRemaining(deadline);
  if (days === null) return null;

  const text = formatCountdown(days);
  let colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
  if (days < 0) colorClass = 'bg-red-50 text-red-600 border-red-200';
  else if (days <= 7) colorClass = 'bg-red-50 text-red-600 border-red-200';
  else if (days <= 14) colorClass = 'bg-amber-50 text-amber-600 border-amber-200';
  else colorClass = 'bg-blue-50 text-blue-600 border-blue-200';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        colorClass
      )}
    >
      <Clock className="size-3" />
      {text}
    </span>
  );
}

/* ================================================================== */
/*  COMPONENT: Stage Flow Stepper (Detail Dialog)                      */
/* ================================================================== */

function StageFlowStepper({ currentStatus }: { currentStatus: ApplicationStatus }) {
  const currentIdx = getStageIndex(currentStatus);
  const isTerminal = currentStatus === 'Rejected' || currentStatus === 'Withdrawn';
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);

  const stages = isTerminal
    ? [...STATUS_FLOW, currentStatus]
    : STATUS_FLOW;

  const activeIdx = isTerminal ? stages.length - 1 : currentIdx;

  return (
    <div className="w-full">
      <div
        ref={setScrollRef}
        className="flex items-start gap-0 overflow-x-auto pb-4 custom-scrollbar"
      >
        {stages.map((stage, idx) => {
          const isCompleted = !isTerminal && idx < currentIdx;
          const isCurrent = idx === activeIdx;
          const config = STATUS_CONFIG[stage];
          const Icon = config.icon;

          return (
            <React.Fragment key={stage}>
              {idx > 0 && (
                <div className="flex items-center pt-4 min-w-[24px] shrink-0">
                  <div
                    className={cn(
                      'h-0.5 w-6',
                      isCompleted ? 'bg-emerald-400' : 'bg-gray-200'
                    )}
                  />
                </div>
              )}
              <div className="flex flex-col items-center min-w-[72px] shrink-0">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 size-8 transition-all',
                    isCompleted && 'bg-emerald-500 border-emerald-500',
                    isCurrent && !isCompleted && cn('border-2', config.borderColor, config.bgColor),
                    !isCompleted && !isCurrent && 'border-gray-200 bg-gray-50'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-white" />
                  ) : isCurrent ? (
                    <Icon className={cn('size-3.5', config.textColor)} />
                  ) : (
                    <Circle className="size-3 text-gray-300" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-1.5 text-center leading-tight font-medium max-w-[72px] truncate',
                    isCompleted && 'text-emerald-600',
                    isCurrent && config.textColor,
                    !isCompleted && !isCurrent && 'text-gray-400'
                  )}
                >
                  {stage}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPONENT: Application Card                                        */
/* ================================================================== */

function ApplicationCard({
  application,
  onViewDetails,
}: {
  application: Application;
  onViewDetails: (app: Application) => void;
}) {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const config = STATUS_CONFIG[application.status];
  const progress = getProgressForStatus(application.status);

  return (
    <Card className="border-border/60 hover:border-border hover:shadow-md transition-all duration-200 py-0 gap-0">
      <CardContent className="p-5 gap-4">
        {/* University & Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Logo placeholder */}
            <div className="flex items-center justify-center size-12 rounded-lg bg-[#0F172A]/5 border border-[#0F172A]/10 shrink-0">
              <Building2 className="size-6 text-[#0F172A]/40" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm leading-tight">
                {application.university}
              </h3>
              <p className="text-sm text-[#0F172A]/60 mt-0.5">{application.course}</p>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        {/* Country + Intake Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs font-normal gap-1">
            <MapPin className="size-3" />
            {application.country}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal gap-1">
            <Calendar className="size-3" />
            {application.intake}
          </Badge>
          {application.deadline && <CountdownBadge deadline={application.deadline} />}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#0F172A]/50 font-medium">Progress</span>
            <span className="text-xs text-[#0F172A]/60 font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={cn('h-2', progress === 100 && '[&>div]:bg-emerald-500')}
          />
        </div>

        {/* Next Action */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2">
          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Next action: </span>
            {application.nextAction}
          </p>
        </div>

        {/* Counselor Note */}
        {application.counselorNote && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50/50 border border-blue-100 px-3 py-2">
            <MessageSquare className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-semibold">Counselor note: </span>
              {application.counselorNote}
            </p>
          </div>
        )}

        {/* Expandable Timeline */}
        <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-[#0F172A]/50 hover:text-[#0F172A]/80 font-medium transition-colors w-full">
            {timelineOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {timelineOpen ? 'Hide' : 'Show'} timeline ({application.timeline.length} events)
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 ml-1.5 space-y-0 border-l-2 border-[#0F172A]/10 pl-4 pb-1">
              {application.timeline.map((event, idx) => {
                const Icon = event.icon;
                return (
                  <div key={idx} className="relative flex gap-3 py-2">
                    <div className="absolute -left-[21px] top-2.5 size-3 rounded-full bg-white border-2 border-[#0F172A]/15" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#0F172A]/80 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#0F172A]/40">{event.date}</span>
                        <span className="text-[11px] text-[#0F172A]/30">•</span>
                        <span className="text-[11px] text-[#0F172A]/40">{event.actor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* View Details Button */}
        <div className="flex justify-end pt-1">
          <Button
            variant="cta"
            size="sm"
            onClick={() => onViewDetails(application)}
            className="gap-1.5"
          >
            <Eye className="size-3.5" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  COMPONENT: Application Table Row                                   */
/* ================================================================== */

function ApplicationTableRow({
  application,
  onViewDetails,
}: {
  application: Application;
  onViewDetails: (app: Application) => void;
}) {
  const config = STATUS_CONFIG[application.status];
  const progress = getProgressForStatus(application.status);

  return (
    <TableRow className="cursor-pointer" onClick={() => onViewDetails(application)}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-8 rounded-md bg-[#0F172A]/5 border border-[#0F172A]/10 shrink-0">
            <Building2 className="size-4 text-[#0F172A]/40" />
          </div>
          <div>
            <p className="font-medium text-sm text-[#0F172A]">{application.university}</p>
            <p className="text-xs text-[#0F172A]/50">{application.course}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="outline" className="text-xs font-normal">
          {application.country}
        </Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="outline" className="text-xs font-normal">
          {application.intake}
        </Badge>
      </TableCell>
      <TableCell>
        <StatusBadge status={application.status} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5 w-20" />
          <span className="text-xs text-[#0F172A]/50">{progress}%</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <CountdownBadge deadline={application.deadline} />
      </TableCell>
      <TableCell>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="gap-1 text-[#C93D13] hover:text-[#C93D13] hover:bg-orange-50">
          <Eye className="size-3.5" />
          <span className="sr-only sm:not-sr-only">View</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

/* ================================================================== */
/*  COMPONENT: Detail Dialog                                           */
/* ================================================================== */

function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
}: {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!application) return null;

  const config = STATUS_CONFIG[application.status];

  const docStatusColor = (s: string) => {
    switch (s) {
      case 'Approved': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'Missing': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold text-[#0F172A]">
                  {application.university}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#0F172A]/60 mt-0.5">
                  {application.course} • {application.intake} • {application.country}
                </DialogDescription>
              </div>
              <StatusBadge status={application.status} />
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="overview" className="px-6 pb-6">
          <TabsList className="w-full justify-start mb-4 bg-gray-100">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {application.messages.some((m) => m.unread) && (
                <span className="ml-1.5 size-2 rounded-full bg-[#C93D13]" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-5 mt-0">
            {/* IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/60 px-4 py-3">
                <p className="text-xs text-[#0F172A]/40 font-medium uppercase tracking-wider">Application ID</p>
                <p className="text-sm font-mono font-semibold text-[#0F172A] mt-1">{application.applicationId}</p>
              </div>
              <div className="rounded-lg border border-border/60 px-4 py-3">
                <p className="text-xs text-[#0F172A]/40 font-medium uppercase tracking-wider">Student ID</p>
                <p className="text-sm font-mono font-semibold text-[#0F172A] mt-1">{application.studentId}</p>
              </div>
            </div>

            {/* Stage Flow */}
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Application Stage</h4>
              <StageFlowStepper currentStatus={application.status} />
            </div>

            <Separator />

            {/* Next Actions */}
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Next Actions</h4>
              <div className="flex items-start gap-2.5 rounded-lg bg-amber-50/60 border border-amber-100 px-4 py-3">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Action Required</p>
                  <p className="text-sm text-amber-700/80 mt-0.5">{application.nextAction}</p>
                </div>
              </div>
            </div>

            {/* Counselor Note */}
            {application.counselorNote && (
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Counselor Note</h4>
                <div className="flex items-start gap-2.5 rounded-lg bg-blue-50/50 border border-blue-100 px-4 py-3">
                  <MessageSquare className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 leading-relaxed">{application.counselorNote}</p>
                </div>
              </div>
            )}

            {/* Deadline */}
            {application.deadline && (
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Deadline</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[#0F172A]/40" />
                  <span className="text-sm text-[#0F172A]">{application.deadline}</span>
                  <CountdownBadge deadline={application.deadline} />
                </div>
              </div>
            )}
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline" className="mt-0">
            <div className="space-y-0 border-l-2 border-[#0F172A]/10 ml-1 pl-6">
              {application.timeline.map((event, idx) => {
                const Icon = event.icon;
                const isLast = idx === application.timeline.length - 1;
                return (
                  <div key={idx} className="relative flex gap-4 py-4">
                    <div
                      className={cn(
                        'absolute -left-[31px] top-1 flex items-center justify-center size-7 rounded-full border-2 bg-white',
                        isLast
                          ? 'border-[#C93D13] text-[#C93D13]'
                          : 'border-emerald-400 text-emerald-500'
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-[#0F172A] font-medium">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-[#0F172A]/40 font-medium">{event.date}</span>
                        <span className="text-xs text-[#0F172A]/20">•</span>
                        <span className="text-xs text-[#0F172A]/40">{event.actor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="mt-0">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {application.documents.map((doc, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-[#0F172A]/40" />
                          <span className="text-sm font-medium text-[#0F172A]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs text-[#0F172A]/50">{doc.type}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                            docStatusColor(doc.status)
                          )}
                        >
                          {doc.status === 'Missing' && <AlertTriangle className="size-3 mr-1" />}
                          {doc.status === 'Approved' && <CheckCircle2 className="size-3 mr-1" />}
                          {doc.status === 'Pending' && <Clock className="size-3 mr-1" />}
                          {doc.status === 'Rejected' && <XCircle className="size-3 mr-1" />}
                          {doc.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages" className="mt-0">
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {application.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-lg border px-4 py-3',
                    msg.role === 'student' && 'bg-blue-50/40 border-blue-100 ml-8',
                    msg.role === 'counselor' && 'bg-white border-border/60 mr-8',
                    msg.role === 'system' && 'bg-gray-50 border-gray-100 mx-4',
                    msg.unread && 'ring-1 ring-[#C93D13]/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0F172A]">{msg.sender}</span>
                      {msg.unread && (
                        <span className="size-2 rounded-full bg-[#C93D13]" />
                      )}
                    </div>
                    <span className="text-xs text-[#0F172A]/40">{msg.date}</span>
                  </div>
                  <p className="text-sm text-[#0F172A]/70 leading-relaxed">{msg.message}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  COMPONENT: Empty State                                             */
/* ================================================================== */

function EmptyState() {
  const setView = usePortalStore((s) => s.setView);

  return (
    <Card className="border-dashed border-2 border-[#0F172A]/10 bg-[#0F172A]/[0.01]">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex items-center justify-center size-20 rounded-full bg-orange-50 mb-6">
          <GraduationCap className="size-10 text-[#C93D13]/70" />
        </div>
        <h3 className="text-xl font-semibold text-[#0F172A] mb-2">
          Start your first application
        </h3>
        <p className="text-sm text-[#0F172A]/50 max-w-sm mb-6 leading-relaxed">
          Browse our course finder to find your perfect program and begin your study abroad journey.
        </p>
        <Button variant="cta" size="lg" onClick={() => setView('student-course-finder')} className="gap-2">
          <Search className="size-4" />
          Find Courses
        </Button>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function StudentApplications() {
  const { token } = usePortalStore();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [intakeFilter, setIntakeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiApps, setApiApps] = useState<Application[] | null>(null);

  useEffect(() => {
    async function loadApplications() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch('/api/student-portal/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          const mapped = json.data.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            applicationId: (a.applicationId as string) || (a.id as string).slice(0, 8).toUpperCase(),
            studentId: (a.studentProfileId as string) || '',
            university: (a.university as string) || 'Unknown University',
            universityLogo: '',
            course: (a.course as string) || 'Unknown Course',
            country: (a.country as string) || 'United Kingdom',
            intake: (a.intake as string) || 'Sep 2025',
            status: (a.stage === 'conditional' ? 'Conditional Offer' as const : a.stage === 'submitted' ? 'Submitted to University' as const : a.stage === 'draft' ? 'Draft' as const : a.stage === 'offer' ? 'Unconditional Offer' as const : a.stage === 'rejected' ? 'Rejected' as const : 'Draft' as const),
            nextAction: (a.nextAction as string) || '',
            deadline: (a.deadline as string) || null,
            counselorNote: (a.counselorNote as string) || null,
            timeline: [],
            documents: [],
            messages: [],
            createdAt: (a.createdAt as string) || new Date().toISOString(),
          }));
          setApiApps(mapped);
        }
      } catch { /* fallback to mock */ }
      setLoading(false);
    }
    loadApplications();
  }, [token]);

  const applications = (apiApps && apiApps.length > 0) ? apiApps : MOCK_APPLICATIONS;

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app);
    setDialogOpen(true);
  };

  const handleSubmitApplication = async (appData: { university: string; course: string; country: string; intake: string }) => {
    if (!token) return;
    try {
      const res = await fetch('/api/student-portal/applications', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newApp: Application = {
          id: json.data.id as string,
          applicationId: (json.data.applicationId as string) || (json.data.id as string).slice(0, 8).toUpperCase(),
          studentId: '',
          university: appData.university,
          universityLogo: '',
          course: appData.course,
          country: appData.country,
          intake: appData.intake,
          status: 'Draft',
          nextAction: 'Complete your profile and submit required documents',
          deadline: null,
          counselorNote: null,
          timeline: [],
          documents: [],
          messages: [],
          createdAt: (json.data.createdAt as string) || new Date().toISOString(),
        };
        setApiApps((prev) => [...(prev || []), newApp]);
      }
    } catch { /* fallback – application not saved */ }
  };

  // Compute unique intakes and countries from data
  const intakes = useMemo(() => {
    const set = new Set(applications.map((a) => a.intake));
    return Array.from(set).sort();
  }, [applications]);

  const countries = useMemo(() => {
    const set = new Set(applications.map((a) => a.country));
    return Array.from(set).sort();
  }, [applications]);

  // Filter
  const filtered = useMemo(() => {
    let result = [...applications];
    if (statusFilter !== 'All') {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (intakeFilter !== 'all') {
      result = result.filter((a) => a.intake === intakeFilter);
    }
    if (countryFilter !== 'all') {
      result = result.filter((a) => a.country === countryFilter);
    }
    return result;
  }, [statusFilter, intakeFilter, countryFilter, applications]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'newest') {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      arr.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      });
    }
    return arr;
  }, [filtered, sortBy]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#0F172A]">My Applications</h1>
          <Badge className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90 text-sm px-2.5">
            {applications.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('card')}
            className={viewMode === 'card' ? 'bg-[#0F172A] hover:bg-[#0F172A]/90 text-white' : 'text-[#0F172A]/50'}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-[#0F172A] hover:bg-[#0F172A]/90 text-white' : 'text-[#0F172A]/50'}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-[#0F172A]/40 shrink-0" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | 'All')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={intakeFilter} onValueChange={setIntakeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Intake" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intakes</SelectItem>
                {intakes.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="sm:ml-auto flex items-center gap-2">
              <SortAsc className="size-4 text-[#0F172A]/40 shrink-0" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'deadline')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="deadline">Deadline soonest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application List */}
      {applications.length === 0 ? (
        <EmptyState />
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-[#0F172A]/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="size-8 text-[#0F172A]/20 mb-3" />
            <h3 className="text-base font-semibold text-[#0F172A] mb-1">No applications match your filters</h3>
            <p className="text-sm text-[#0F172A]/50">Try adjusting the filters above</p>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((app) => (
            <ApplicationCard key={app.id} application={app} onViewDetails={handleViewDetails} />
          ))}
        </div>
      ) : (
        <Card className="py-0 gap-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>University / Course</TableHead>
                <TableHead className="hidden md:table-cell">Country</TableHead>
                <TableHead className="hidden sm:table-cell">Intake</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Progress</TableHead>
                <TableHead className="hidden md:table-cell">Deadline</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((app) => (
                <ApplicationTableRow key={app.id} application={app} onViewDetails={handleViewDetails} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Dialog */}
      <ApplicationDetailDialog
        application={selectedApp}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}