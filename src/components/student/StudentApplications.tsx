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
    color: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border-strong)]',
    bgColor: 'bg-[var(--alo-surface-muted)]',
    borderColor: 'border-[var(--alo-border-strong)]',
    textColor: 'text-[var(--alo-body)]',
    icon: Clapperboard,
    progressValue: 0,
  },
  'Submitted to ALO': {
    color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
    borderColor: 'border-[var(--alo-border)]',
    textColor: 'text-[var(--alo-brand)]',
    icon: Send,
    progressValue: 8,
  },
  'Document Review': {
    color: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border',
    bgColor: 'bg-crm-warning-bg',
    borderColor: 'border-crm-warning-border',
    textColor: 'text-crm-warning-text',
    icon: FileText,
    progressValue: 15,
  },
  'Submitted to University': {
    color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
    borderColor: 'border-[var(--alo-border)]',
    textColor: 'text-[var(--alo-brand)]',
    icon: Send,
    progressValue: 23,
  },
  'Application Acknowledged': {
    color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
    borderColor: 'border-[var(--alo-border)]',
    textColor: 'text-[var(--alo-brand)]',
    icon: CheckCircle2,
    progressValue: 31,
  },
  'Conditional Offer': {
    color: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border',
    bgColor: 'bg-crm-warning-bg',
    borderColor: 'border-crm-warning-border',
    textColor: 'text-crm-warning-text',
    icon: AlertTriangle,
    progressValue: 46,
  },
  'Unconditional Offer': {
    color: 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
    bgColor: 'bg-crm-success-bg',
    borderColor: 'border-crm-success-border',
    textColor: 'text-crm-success-text',
    icon: CheckCircle2,
    progressValue: 54,
  },
  'Deposit Pending': {
    color: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border-[var(--alo-cta)]/25',
    bgColor: 'bg-[var(--alo-cta-soft)]',
    borderColor: 'border-[var(--alo-cta)]/25',
    textColor: 'text-[var(--alo-cta-active)]',
    icon: CreditCard,
    progressValue: 62,
  },
  'CAS/I-20/COE Processing': {
    color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
    borderColor: 'border-[var(--alo-border)]',
    textColor: 'text-[var(--alo-brand)]',
    icon: Stamp,
    progressValue: 69,
  },
  'Visa File Preparing': {
    color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
    borderColor: 'border-[var(--alo-border)]',
    textColor: 'text-[var(--alo-brand)]',
    icon: FileCheck,
    progressValue: 77,
  },
  'Visa Submitted': {
    color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
    borderColor: 'border-[var(--alo-border)]',
    textColor: 'text-[var(--alo-brand)]',
    icon: Send,
    progressValue: 85,
  },
  'Visa Approved': {
    color: 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
    bgColor: 'bg-crm-success-bg',
    borderColor: 'border-crm-success-border',
    textColor: 'text-crm-success-text',
    icon: ShieldCheck,
    progressValue: 92,
  },
  Enrolled: {
    color: 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
    bgColor: 'bg-crm-success-bg',
    borderColor: 'border-crm-success-border',
    textColor: 'text-crm-success-text',
    icon: PartyPopper,
    progressValue: 100,
  },
  Rejected: {
    color: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border',
    bgColor: 'bg-crm-danger-bg',
    borderColor: 'border-crm-danger-border',
    textColor: 'text-crm-danger-text',
    icon: XCircle,
    progressValue: 0,
  },
  Withdrawn: {
    color: 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] border-[var(--alo-border-strong)]',
    bgColor: 'bg-[var(--alo-surface-muted)]',
    borderColor: 'border-[var(--alo-border-strong)]',
    textColor: 'text-[var(--alo-text-muted)]',
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

/* ------------------------------------------------------------------ */
/*  NOTE ON THE REMOVED MOCK DATA                                     */
/* ------------------------------------------------------------------ */
/* A hard-coded MOCK_APPLICATIONS array used to live here and was used as a   */
/* FALLBACK whenever the API returned an empty list or threw, because the     */
/* catch block silently swallowed the error and fell through to the mock.     */
/* A student with no applications, or one whose load failed, was therefore    */
/* shown invented applications to real universities. That is prohibited by    */
/* spec s92 and is misleading about the student own file, so the array was    */
/* deleted and replaced with distinct empty and error states plus a retry.    */

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
  let colorClass = 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]';
  if (days < 0) colorClass = 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border';
  else if (days <= 7) colorClass = 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border';
  else if (days <= 14) colorClass = 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border';
  else colorClass = 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]';

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
                      isCompleted ? 'bg-[var(--alo-success)]' : 'bg-[var(--alo-page)]'
                    )}
                  />
                </div>
              )}
              <div className="flex flex-col items-center min-w-[72px] shrink-0">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 size-8 transition-all',
                    isCompleted && 'bg-[var(--alo-success)] border-crm-success-border',
                    isCurrent && !isCompleted && cn('border-2', config.borderColor, config.bgColor),
                    !isCompleted && !isCurrent && 'border-[var(--alo-border)] bg-[var(--alo-page)]'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-[var(--alo-text)]" />
                  ) : isCurrent ? (
                    <Icon className={cn('size-3.5', config.textColor)} />
                  ) : (
                    <Circle className="size-3 text-[var(--alo-placeholder)]" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] mt-1.5 text-center leading-tight font-medium max-w-[72px] truncate',
                    isCompleted && 'text-crm-success-text',
                    isCurrent && config.textColor,
                    !isCompleted && !isCurrent && 'text-[var(--alo-text-muted)]'
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
            <div className="flex items-center justify-center size-12 rounded-lg bg-[var(--alo-page)]/5 border border-[var(--alo-text)]/10 shrink-0">
              <Building2 className="size-6 text-[var(--alo-text)]/40" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--alo-text)] text-sm leading-tight">
                {application.university}
              </h3>
              <p className="text-sm text-[var(--alo-text)]/60 mt-0.5">{application.course}</p>
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
            <span className="text-xs text-[var(--alo-text)]/50 font-medium">Progress</span>
            <span className="text-xs text-[var(--alo-text)]/60 font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={cn('h-2', progress === 100 && '[&>div]:bg-[var(--alo-success)]')}
          />
        </div>

        {/* Next Action */}
        <div className="flex items-start gap-2 rounded-lg bg-crm-warning-bg/60 border border-crm-warning-border px-3 py-2">
          <AlertTriangle className="size-4 text-crm-warning-text shrink-0 mt-0.5" />
          <p className="text-xs text-crm-warning-text leading-relaxed">
            <span className="font-semibold">Next action: </span>
            {application.nextAction}
          </p>
        </div>

        {/* Counselor Note */}
        {application.counselorNote && (
          <div className="flex items-start gap-2 rounded-lg bg-[var(--alo-brand-pale)]/50 border border-[var(--alo-border)] px-3 py-2">
            <MessageSquare className="size-4 text-[var(--alo-brand)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--alo-brand-deep)] leading-relaxed">
              <span className="font-semibold">Counselor note: </span>
              {application.counselorNote}
            </p>
          </div>
        )}

        {/* Expandable Timeline */}
        <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-[var(--alo-text)]/50 hover:text-[var(--alo-text)]/80 font-medium transition-colors w-full">
            {timelineOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {timelineOpen ? 'Hide' : 'Show'} timeline ({application.timeline.length} events)
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 ml-1.5 space-y-0 border-l-2 border-[var(--alo-text)]/10 pl-4 pb-1">
              {application.timeline.map((event, idx) => {
                const Icon = event.icon;
                return (
                  <div key={idx} className="relative flex gap-3 py-2">
                    <div className="absolute -left-[21px] top-2.5 size-3 rounded-full bg-white border-2 border-[var(--alo-text)]/15" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--alo-text)]/80 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[var(--alo-text)]/40">{event.date}</span>
                        <span className="text-[11px] text-[var(--alo-text)]/30">•</span>
                        <span className="text-[11px] text-[var(--alo-text)]/40">{event.actor}</span>
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
          <div className="flex items-center justify-center size-8 rounded-md bg-[var(--alo-page)]/5 border border-[var(--alo-text)]/10 shrink-0">
            <Building2 className="size-4 text-[var(--alo-text)]/40" />
          </div>
          <div>
            <p className="font-medium text-sm text-[var(--alo-text)]">{application.university}</p>
            <p className="text-xs text-[var(--alo-text)]/50">{application.course}</p>
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
          <span className="text-xs text-[var(--alo-text)]/50">{progress}%</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <CountdownBadge deadline={application.deadline} />
      </TableCell>
      <TableCell>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="gap-1 text-[var(--alo-cta-hover)] hover:text-[var(--alo-cta-hover)] hover:bg-[var(--alo-cta-soft)]">
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
      case 'Approved': return 'text-crm-success-text bg-crm-success-bg border-crm-success-border';
      case 'Pending': return 'text-[var(--alo-brand)] bg-[var(--alo-brand-pale)] border-[var(--alo-border)]';
      case 'Rejected': return 'text-crm-danger-text bg-crm-danger-bg border-crm-danger-border';
      case 'Missing': return 'text-crm-warning-text bg-crm-warning-bg border-crm-warning-border';
      default: return 'text-[var(--alo-body)] bg-[var(--alo-page)] border-[var(--alo-border)]';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold text-[var(--alo-text)]">
                  {application.university}
                </DialogTitle>
                <DialogDescription className="text-sm text-[var(--alo-text)]/60 mt-0.5">
                  {application.course} • {application.intake} • {application.country}
                </DialogDescription>
              </div>
              <StatusBadge status={application.status} />
            </div>
          </DialogHeader>
        </div>

        <Tabs defaultValue="overview" className="px-6 pb-6">
          <TabsList className="w-full justify-start mb-4 bg-[var(--alo-surface-muted)]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {application.messages.some((m) => m.unread) && (
                <span className="ml-1.5 size-2 rounded-full bg-[var(--alo-cta-hover)]" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-5 mt-0">
            {/* IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/60 px-4 py-3">
                <p className="text-xs text-[var(--alo-text)]/40 font-medium uppercase tracking-wider">Application ID</p>
                <p className="text-sm font-mono font-semibold text-[var(--alo-text)] mt-1">{application.applicationId}</p>
              </div>
              <div className="rounded-lg border border-border/60 px-4 py-3">
                <p className="text-xs text-[var(--alo-text)]/40 font-medium uppercase tracking-wider">Student ID</p>
                <p className="text-sm font-mono font-semibold text-[var(--alo-text)] mt-1">{application.studentId}</p>
              </div>
            </div>

            {/* Stage Flow */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--alo-text)] mb-3">Application Stage</h4>
              <StageFlowStepper currentStatus={application.status} />
            </div>

            <Separator />

            {/* Next Actions */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--alo-text)] mb-2">Next Actions</h4>
              <div className="flex items-start gap-2.5 rounded-lg bg-crm-warning-bg/60 border border-crm-warning-border px-4 py-3">
                <AlertTriangle className="size-4 text-crm-warning-text shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-crm-warning-text font-medium">Action Required</p>
                  <p className="text-sm text-crm-warning-text/80 mt-0.5">{application.nextAction}</p>
                </div>
              </div>
            </div>

            {/* Counselor Note */}
            {application.counselorNote && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--alo-text)] mb-2">Counselor Note</h4>
                <div className="flex items-start gap-2.5 rounded-lg bg-[var(--alo-brand-pale)]/50 border border-[var(--alo-border)] px-4 py-3">
                  <MessageSquare className="size-4 text-[var(--alo-brand)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--alo-brand-deep)] leading-relaxed">{application.counselorNote}</p>
                </div>
              </div>
            )}

            {/* Deadline */}
            {application.deadline && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--alo-text)] mb-2">Deadline</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[var(--alo-text)]/40" />
                  <span className="text-sm text-[var(--alo-text)]">{application.deadline}</span>
                  <CountdownBadge deadline={application.deadline} />
                </div>
              </div>
            )}
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline" className="mt-0">
            <div className="space-y-0 border-l-2 border-[var(--alo-text)]/10 ml-1 pl-6">
              {application.timeline.map((event, idx) => {
                const Icon = event.icon;
                const isLast = idx === application.timeline.length - 1;
                return (
                  <div key={idx} className="relative flex gap-4 py-4">
                    <div
                      className={cn(
                        'absolute -left-[31px] top-1 flex items-center justify-center size-7 rounded-full border-2 bg-white',
                        isLast
                          ? 'border-[var(--alo-cta-hover)] text-[var(--alo-cta-hover)]'
                          : 'border-[var(--alo-success)] text-crm-success-text'
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-[var(--alo-text)] font-medium">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-[var(--alo-text)]/40 font-medium">{event.date}</span>
                        <span className="text-xs text-[var(--alo-text)]/20">•</span>
                        <span className="text-xs text-[var(--alo-text)]/40">{event.actor}</span>
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
                          <FileText className="size-4 text-[var(--alo-text)]/40" />
                          <span className="text-sm font-medium text-[var(--alo-text)]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs text-[var(--alo-text)]/50">{doc.type}</span>
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
                    msg.role === 'student' && 'bg-[var(--alo-brand-pale)]/40 border-[var(--alo-border)] ml-8',
                    msg.role === 'counselor' && 'bg-white border-border/60 mr-8',
                    msg.role === 'system' && 'bg-[var(--alo-page)] border-[var(--alo-border)] mx-4',
                    msg.unread && 'ring-1 ring-[var(--alo-cta-hover)]/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--alo-text)]">{msg.sender}</span>
                      {msg.unread && (
                        <span className="size-2 rounded-full bg-[var(--alo-cta-hover)]" />
                      )}
                    </div>
                    <span className="text-xs text-[var(--alo-text)]/40">{msg.date}</span>
                  </div>
                  <p className="text-sm text-[var(--alo-text)]/70 leading-relaxed">{msg.message}</p>
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
    <Card className="border-dashed border-2 border-[var(--alo-text)]/10 bg-[var(--alo-page)]/[0.01]">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex items-center justify-center size-20 rounded-full bg-[var(--alo-cta-soft)] mb-6">
          <GraduationCap className="size-10 text-[var(--alo-cta-hover)]/70" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-2">
          Start your first application
        </h3>
        <p className="text-sm text-[var(--alo-text)]/50 max-w-sm mb-6 leading-relaxed">
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadApplications() {
      setLoading(true);
      setLoadError(null);
      if (!token) {
        // Without a session we cannot know what the student has applied to, so
        // report that instead of showing invented applications (s92).
        if (!cancelled) {
          setApiApps([]);
          setLoading(false);
          setLoadError('You are not signed in, so applications could not be loaded.');
        }
        return;
      }
      try {
        const res = await fetch('/api/student-portal/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setApiApps([]);
          setLoadError(json?.error || `Could not load applications (status ${res.status}).`);
          setLoading(false);
          return;
        }
        const rows = Array.isArray(json.data) ? json.data : [];
        const mapped = rows.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          applicationId: (a.applicationId as string) || (a.id as string).slice(0, 8).toUpperCase(),
          studentId: (a.studentProfileId as string) || '',
          // No invented fallbacks. A missing university, country or intake is
          // shown as unrecorded rather than defaulted to a plausible-looking
          // value the student did not choose.
          university: (a.university as string) || 'University not recorded',
          universityLogo: '',
          course: (a.course as string) || 'Course not recorded',
          country: (a.country as string) || '',
          intake: (a.intake as string) || '',
          status: (a.stage === 'conditional' ? 'Conditional Offer' as const : a.stage === 'submitted' ? 'Submitted to University' as const : a.stage === 'draft' ? 'Draft' as const : a.stage === 'offer' ? 'Unconditional Offer' as const : a.stage === 'rejected' ? 'Rejected' as const : 'Draft' as const),
          nextAction: (a.nextAction as string) || '',
          deadline: (a.deadline as string) || null,
          counselorNote: (a.counselorNote as string) || null,
          timeline: [],
          documents: [],
          messages: [],
          createdAt: (a.createdAt as string) || new Date().toISOString(),
        }));
        // An empty list is a truthful answer and is applied as-is.
        setApiApps(mapped);
      } catch (error: unknown) {
        if (cancelled) return;
        setApiApps([]);
        setLoadError(error instanceof Error ? error.message : 'Could not reach the application service.');
      }
      if (!cancelled) setLoading(false);
    }
    loadApplications();
    return () => { cancelled = true; };
  }, [token, reloadKey]);

  // Real data only. There is deliberately no mock fallback: this screen tells a
  // student the status of their own applications, so fabricated rows would be
  // misinformation about their file rather than placeholder styling (s92).
  const applications = apiApps ?? [];

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
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">My Applications</h1>
          <Badge className="bg-[var(--alo-page)] text-[var(--alo-text)] hover:bg-[var(--alo-page)]/90 text-sm px-2.5">
            {applications.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('card')}
            className={viewMode === 'card' ? 'bg-[var(--alo-page)] hover:bg-[var(--alo-page)]/90 text-[var(--alo-text)]' : 'text-[var(--alo-text)]/50'}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => setViewMode('table')}
            className={viewMode === 'table' ? 'bg-[var(--alo-page)] hover:bg-[var(--alo-page)]/90 text-[var(--alo-text)]' : 'text-[var(--alo-text)]/50'}
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
              <Filter className="size-4 text-[var(--alo-text)]/40 shrink-0" />
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
              <SortAsc className="size-4 text-[var(--alo-text)]/40 shrink-0" />
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
      {loadError ? (
        /* A failed load must not render as "Start your first application" (s91).
           Telling a student they have no applications when the request failed
           could stop them chasing a real deadline. */
        <Card className="border-2 border-crm-warning-border">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex items-center justify-center size-20 rounded-full bg-crm-warning-bg mb-6">
              <AlertTriangle className="size-10 text-crm-warning-text" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--alo-text)] mb-2">
              Applications could not be loaded
            </h3>
            <p className="text-sm text-[var(--alo-text)]/60 max-w-md mb-2">{loadError}</p>
            <p className="text-xs text-[var(--alo-text)]/45 max-w-md mb-6 leading-relaxed">
              This does not mean you have no applications. Retry, and contact your
              counselor if it keeps failing.
            </p>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              <RotateCcw className="size-3.5 mr-1.5" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : applications.length === 0 ? (
        <EmptyState />
      ) : sorted.length === 0 ? (
        <Card className="border-dashed border-2 border-[var(--alo-text)]/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="size-8 text-[var(--alo-text)]/20 mb-3" />
            <h3 className="text-base font-semibold text-[var(--alo-text)] mb-1">No applications match your filters</h3>
            <p className="text-sm text-[var(--alo-text)]/50">Try adjusting the filters above</p>
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