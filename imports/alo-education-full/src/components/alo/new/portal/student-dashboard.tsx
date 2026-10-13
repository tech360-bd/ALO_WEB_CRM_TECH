'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Headset,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  Sparkles,
  Upload,
  UserCheck,
  Bell,
  ArrowRight,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Building2,
  Globe,
  MapPin,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  StatCard,
  SectionCard,
  PageHeader,
  CompletionRing,
  TimelineStep,
  QuickAction,
  MetricRow,
  TabCounter,
  EmptyState,
  LoadingGrid,
  Icon,
} from '@/components/alo/shared';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentDashboardProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface DashboardStats {
  applications?: number;
  pendingDocuments?: number;
  upcomingDeadlines?: number;
  unreadMessages?: number;
  unreadNotifications?: number;
  profileCompletion?: number;
  [key: string]: unknown;
}

interface Application {
  id: string;
  applicationId?: string;
  university?: string;
  course?: string;
  country?: string;
  intake?: string;
  studyLevel?: string;
  stage?: string;
  priority?: string;
  studentName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Document {
  id: string;
  category?: string;
  name?: string;
  status?: string;
  fileName?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  applicationId?: string;
}

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

interface Message {
  id: string;
  subject?: string;
  content?: string;
  senderName?: string;
  senderRole?: string;
  read?: boolean;
  createdAt?: string;
}

interface Task {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  priority?: string;
}

interface Appointment {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  status?: string;
  type?: string;
}

// ─── Application Pipeline Stages ────────────────────────────────────────────

const PIPELINE_STAGES = [
  'Lead',
  'Counselling',
  'Shortlist',
  'Application',
  'Submitted',
  'Offer',
  'Visa',
  'Pre-departure',
  'Enrolled',
] as const;

const STAGE_LABELS: Record<string, string> = {
  COUNSELING: 'Counselling',
  ELIGIBILITY_CHECKED: 'Eligibility',
  DOCUMENTS_PENDING: 'Documents',
  DOCUMENTS_RECEIVED: 'Docs Received',
  UNIVERSITY_SHORTLISTED: 'Shortlist',
  APPLICATION_PREPARING: 'Preparing',
  APPLICATION_SUBMITTED: 'Submitted',
  CONDITIONAL_OFFER: 'Conditional Offer',
  UNCONDITIONAL_OFFER: 'Offer',
  DEPOSIT_PENDING: 'Deposit',
  CAS_INTERVIEW: 'CAS Interview',
  CAS_PENDING: 'CAS Pending',
  CAS_ISSUED: 'CAS Issued',
  VISA_DOCUMENTS: 'Visa Docs',
  VISA_SUBMITTED: 'Visa Submitted',
  VISA_DECISION_PENDING: 'Visa Pending',
  VISA_APPROVED: 'Visa Approved',
  VISA_REFUSED: 'Visa Refused',
  PRE_DEPARTURE: 'Pre-departure',
  ENROLLED: 'Enrolled',
};

const STAGE_COLORS: Record<string, string> = {
  COUNSELING: 'bg-slate-100 text-slate-700',
  ELIGIBILITY_CHECKED: 'bg-sky-100 text-sky-700',
  DOCUMENTS_PENDING: 'bg-amber-100 text-amber-700',
  DOCUMENTS_RECEIVED: 'bg-sky-100 text-sky-700',
  UNIVERSITY_SHORTLISTED: 'bg-sky-100 text-sky-700',
  APPLICATION_PREPARING: 'bg-alo-blue-light text-alo-blue',
  APPLICATION_SUBMITTED: 'bg-alo-blue-light text-alo-blue',
  CONDITIONAL_OFFER: 'bg-violet-100 text-violet-700',
  UNCONDITIONAL_OFFER: 'bg-violet-100 text-violet-700',
  DEPOSIT_PENDING: 'bg-amber-100 text-amber-700',
  CAS_INTERVIEW: 'bg-alo-orange-light text-alo-orange',
  CAS_PENDING: 'bg-alo-orange-light text-alo-orange',
  CAS_ISSUED: 'bg-teal-100 text-teal-700',
  VISA_DOCUMENTS: 'bg-amber-100 text-amber-700',
  VISA_SUBMITTED: 'bg-alo-blue-light text-alo-blue',
  VISA_DECISION_PENDING: 'bg-alo-blue-light text-alo-blue',
  VISA_APPROVED: 'bg-emerald-100 text-emerald-700',
  VISA_REFUSED: 'bg-red-100 text-red-700',
  PRE_DEPARTURE: 'bg-emerald-100 text-emerald-700',
  ENROLLED: 'bg-emerald-100 text-emerald-700',
};

// Map API stage to pipeline index
function stageToPipelineIndex(stage: string): number {
  const map: Record<string, number> = {
    COUNSELING: 1,
    ELIGIBILITY_CHECKED: 1,
    DOCUMENTS_PENDING: 2,
    DOCUMENTS_RECEIVED: 2,
    UNIVERSITY_SHORTLISTED: 2,
    APPLICATION_PREPARING: 3,
    APPLICATION_SUBMITTED: 4,
    CONDITIONAL_OFFER: 5,
    UNCONDITIONAL_OFFER: 5,
    DEPOSIT_PENDING: 5,
    CAS_INTERVIEW: 5,
    CAS_PENDING: 5,
    CAS_ISSUED: 6,
    VISA_DOCUMENTS: 6,
    VISA_SUBMITTED: 6,
    VISA_DECISION_PENDING: 6,
    VISA_APPROVED: 6,
    PRE_DEPARTURE: 7,
    ENROLLED: 8,
  };
  return map[stage] ?? 1;
}

function stageToProgress(stage: string): number {
  const idx = stageToPipelineIndex(stage);
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
}

// ─── Document Status Colors ─────────────────────────────────────────────────

const DOC_STATUS_CONFIG: Record<string, { cls: string; label: string; icon: typeof FileText }> = {
  REQUIRED: { cls: 'bg-alo-blue-light text-alo-blue border border-alo-blue/20', label: 'Required', icon: FileText },
  UPLOADED: { cls: 'bg-sky-100 text-sky-700 border border-sky-200', label: 'Uploaded', icon: Upload },
  VERIFIED: { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Verified', icon: CheckCircle2 },
  APPROVED: { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Approved', icon: CheckCircle2 },
  REJECTED: { cls: 'bg-red-100 text-red-700 border border-red-200', label: 'Rejected', icon: XCircle },
  MISSING: { cls: 'bg-red-100 text-red-700 border border-red-200', label: 'Missing', icon: AlertTriangle },
  PENDING: { cls: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'Pending', icon: Clock },
  UNDER_REVIEW: { cls: 'bg-alo-orange-light text-alo-orange border border-alo-orange/20', label: 'Under Review', icon: Eye },
};

// ─── DEMO DATA (clearly marked — remove in production) ─────────────────────

// ⚠️ DEMO: This data is for demo/preview purposes only.
// Replace with real API responses in production.
const DEMO_STATS: DashboardStats = {
  applications: 3,
  pendingDocuments: 5,
  upcomingDeadlines: 4,
  unreadMessages: 2,
  unreadNotifications: 7,
  profileCompletion: 72,
};

const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'demo-1',
    applicationId: 'ALO-APP-2024-001',
    university: 'University of Manchester',
    course: 'MSc Data Science',
    country: 'UK',
    intake: 'September 2025',
    studyLevel: 'Masters',
    stage: 'APPLICATION_SUBMITTED',
    priority: 'HIGH',
  },
  {
    id: 'demo-2',
    applicationId: 'ALO-APP-2024-002',
    university: 'University of Toronto',
    course: 'MBA International Business',
    country: 'Canada',
    intake: 'January 2026',
    studyLevel: 'Masters',
    stage: 'UNIVERSITY_SHORTLISTED',
    priority: 'MEDIUM',
  },
  {
    id: 'demo-3',
    applicationId: 'ALO-APP-2024-003',
    university: 'Monash University',
    course: 'Bachelor of Engineering',
    country: 'Australia',
    intake: 'March 2025',
    studyLevel: 'Bachelors',
    stage: 'CAS_ISSUED',
    priority: 'HIGH',
  },
];

const DEMO_DOCUMENTS: Document[] = [
  { id: 'd1', category: 'Academic', name: 'Transcript (Bachelor)', status: 'APPROVED', fileName: 'transcript_bsc.pdf' },
  { id: 'd2', category: 'Academic', name: 'Degree Certificate', status: 'UPLOADED', fileName: 'degree_cert.pdf' },
  { id: 'd3', category: 'Language', name: 'IELTS Score Card', status: 'VERIFIED', fileName: 'ielts_7.5.pdf' },
  { id: 'd4', category: 'Financial', name: 'Bank Statement', status: 'PENDING', fileName: undefined },
  { id: 'd5', category: 'Identity', name: 'Passport Copy', status: 'APPROVED', fileName: 'passport.pdf' },
  { id: 'd6', category: 'Reference', name: 'Academic LOR #1', status: 'MISSING', fileName: undefined },
  { id: 'd7', category: 'Reference', name: 'Academic LOR #2', status: 'REQUIRED', fileName: undefined },
  { id: 'd8', category: 'Statement', name: 'Statement of Purpose', status: 'UNDER_REVIEW', fileName: 'sop_draft.pdf' },
  { id: 'd9', category: 'Financial', name: 'Affidavit of Support', status: 'REJECTED', fileName: 'affidavit_old.pdf' },
  { id: 'd10', category: 'Identity', name: 'Photographs (Passport)', status: 'UPLOADED', fileName: 'photos.zip' },
];

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Document Verified', message: 'Your IELTS score card has been verified.', type: 'SUCCESS', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'n2', title: 'Application Update', message: 'University of Manchester has received your application.', type: 'INFO', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'n3', title: 'Deadline Reminder', message: 'Bank statement upload due in 3 days.', type: 'WARNING', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'n4', title: 'SOP Review Complete', message: 'Your counselor has reviewed your SOP.', type: 'INFO', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'n5', title: 'Appointment Confirmed', message: 'Your visa mock interview is scheduled.', type: 'SUCCESS', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

const DEMO_MESSAGES: Message[] = [
  { id: 'm1', subject: 'University Shortlist Ready', content: 'Hi, I have prepared the shortlist for your profile. Please review...', senderName: 'Farhana Yesmin', senderRole: 'COUNSELOR', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'm2', subject: 'SOP Feedback', content: 'The second paragraph needs more detail about your research interests...', senderName: 'Farhana Yesmin', senderRole: 'COUNSELOR', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 'm3', subject: 'Document Checklist', content: 'Here is the complete document checklist for your UK applications...', senderName: 'Farhana Yesmin', senderRole: 'COUNSELOR', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

const DEMO_TASKS: Task[] = [
  { id: 't1', title: 'Upload Bank Statement', description: 'Latest 3 months', status: 'PENDING', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(), priority: 'HIGH' },
  { id: 't2', title: 'Submit LOR #1', description: 'From Prof. at BSc university', status: 'PENDING', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(), priority: 'MEDIUM' },
  { id: 't3', title: 'Book Visa Mock Interview', description: 'Prepare for CAS interview stage', status: 'PENDING', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 168).toISOString(), priority: 'LOW' },
  { id: 't4', title: 'Review SOP Final Draft', description: 'Incorporate counselor feedback', status: 'PENDING', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), priority: 'HIGH' },
];

const DEMO_SAVED_ITEMS = [
  { id: 's1', name: 'University of Melbourne', type: 'university', country: 'Australia', rating: '4.8' },
  { id: 's2', name: 'MSc Artificial Intelligence', type: 'course', university: 'University of Edinburgh', country: 'UK' },
  { id: 's3', name: 'Technical University of Munich', type: 'university', country: 'Germany', rating: '4.7' },
  { id: 's4', name: 'MBA Finance', type: 'course', university: 'University of Sydney', country: 'Australia' },
  { id: 's5', name: 'University College Dublin', type: 'university', country: 'Ireland', rating: '4.6' },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

function timeAgo(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | Date): number {
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function WelcomeHeader({
  stats,
  onNavigate,
}: {
  stats: DashboardStats;
  onNavigate?: (view: string, slug?: string) => void;
}) {
  const completion = stats.profileCompletion ?? 0;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-alo-blue/5 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-10 right-32 h-32 w-32 rounded-full bg-alo-orange/5 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-alo-sunshine/10 blur-3xl" aria-hidden="true" />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: greeting + avatar */}
          <div className="flex items-start gap-4">
            {/* Avatar placeholder */}
            <div className="gradient-blue flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg shadow-alo-blue/20">
              S
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-alo-orange">Student Portal</p>
              <h1 className="mt-1 text-2xl font-bold text-alo-black sm:text-3xl">
                {getGreeting()}, Student!
              </h1>
              <p className="mt-1 text-sm text-alo-gray">
                Here's an overview of your study abroad journey.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="bg-alo-orange hover:bg-alo-orange-dark text-white h-9"
                  onClick={() => onNavigate?.('student-profile')}
                >
                  <UserCheck className="size-4" />
                  Complete Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-alo-blue/30 text-alo-blue hover:bg-alo-blue-light h-9"
                  onClick={() => onNavigate?.('document-hub')}
                >
                  <Upload className="size-4" />
                  Upload Docs
                </Button>
              </div>
            </div>
          </div>

          {/* Right: completion ring */}
          <div className="flex items-center gap-4 sm:gap-5">
            <CompletionRing value={completion} size={88} label="Profile" />
          </div>
        </div>

        {/* Quick stat pills */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <QuickStatPill
            icon={ClipboardList}
            label="Active Applications"
            value={stats.applications ?? 0}
            color="blue"
          />
          <QuickStatPill
            icon={FileText}
            label="Documents Pending"
            value={stats.pendingDocuments ?? 0}
            color="orange"
          />
          <QuickStatPill
            icon={CalendarClock}
            label="Upcoming Deadlines"
            value={stats.upcomingDeadlines ?? 0}
            color="amber"
          />
          <QuickStatPill
            icon={MessageSquare}
            label="Unread Messages"
            value={stats.unreadMessages ?? 0}
            color="emerald"
          />
        </div>
      </div>
    </div>
  );
}

function QuickStatPill({
  icon: IconComp,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'blue' | 'orange' | 'amber' | 'emerald';
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-alo-blue-light text-alo-blue',
    orange: 'bg-alo-orange-light text-alo-orange',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-alo-gray-light/50 px-3.5 py-2.5 transition-colors hover:bg-alo-gray-light">
      <div className={cn('flex size-8 items-center justify-center rounded-lg', colorMap[color])}>
        <IconComp className="size-4" />
      </div>
      <div>
        <p className="text-lg font-bold tabular-nums text-alo-black">{value}</p>
        <p className="text-[11px] font-medium text-alo-gray">{label}</p>
      </div>
    </div>
  );
}

// ─── Application Progress Timeline ──────────────────────────────────────────

function ApplicationTimeline({
  applications,
  onNavigate,
}: {
  applications: Application[];
  onNavigate?: (view: string, slug?: string) => void;
}) {
  // Use the most advanced application for the pipeline visualization
  const primaryApp = applications.reduce<Application | null>((best, app) => {
    if (!best) return app;
    const bestIdx = stageToPipelineIndex(best.stage || '');
    const currIdx = stageToPipelineIndex(app.stage || '');
    return currIdx > bestIdx ? app : best;
  }, null);

  const currentStageIdx = primaryApp ? stageToPipelineIndex(primaryApp.stage || '') : 0;

  return (
    <SectionCard
      title="Application Progress"
      description={
        primaryApp
          ? `${primaryApp.university} — ${primaryApp.course}`
          : 'Track your journey from enquiry to enrollment'
      }
      icon="Route"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-alo-blue hover:bg-alo-blue-light"
          onClick={() => onNavigate?.('applications')}
        >
          View all
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      <div className="py-2">
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = i === currentStageIdx;
          const isCompleted = i < currentStageIdx;
          const isUpcoming = i > currentStageIdx;
          const status = isCompleted
            ? 'completed' as const
            : isActive
              ? 'current' as const
              : 'upcoming' as const;

          return (
            <TimelineStep
              key={stage}
              step={i + 1}
              label={stage}
              status={status}
              isLast={i === PIPELINE_STAGES.length - 1}
            />
          );
        })}
      </div>

      {primaryApp && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-alo-blue-light/50 px-3.5 py-2.5">
          <Sparkles className="size-4 text-alo-blue" />
          <p className="text-xs font-medium text-alo-blue">
            Currently at <span className="font-bold">{STAGE_LABELS[primaryApp.stage || ''] || primaryApp.stage}</span> — {primaryApp.intake} intake
          </p>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Quick Actions Grid ─────────────────────────────────────────────────────

function QuickActionsGrid({
 onNavigate,
}: {
  onNavigate?: (view: string, slug?: string) => void;
}) {
  const actions = [
    { icon: 'CalendarPlus', label: 'Book Appointment', view: 'counselor-dashboard', variant: 'blue' as const },
    { icon: 'Upload', label: 'Upload Document', view: 'document-hub', variant: 'orange' as const },
    { icon: 'Search', label: 'Check Eligibility', view: 'student-course-finder', variant: 'blue' as const },
    { icon: 'BookOpen', label: 'Browse Courses', view: 'student-course-finder', variant: 'emerald' as const },
    { icon: 'Headset', label: 'Contact Counselor', view: 'counselor-dashboard', variant: 'orange' as const, badge: 1 },
    { icon: 'Award', label: 'View Offers', view: 'applications', variant: 'blue' as const },
  ];

  return (
    <SectionCard title="Quick Actions" description="Jump to what matters most" icon="Zap">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((a) => (
          <QuickAction
            key={a.label}
            icon={a.icon}
            label={a.label}
            variant={a.variant}
            badge={a.badge}
            onClick={() => onNavigate?.(a.view)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

// ─── My Applications Cards ──────────────────────────────────────────────────

function ApplicationsCards({
  applications,
  onNavigate,
}: {
  applications: Application[];
  onNavigate?: (view: string, slug?: string) => void;
}) {
  if (applications.length === 0) {
    return (
      <SectionCard title="My Applications" icon="ClipboardList">
        <EmptyState
          icon="ClipboardList"
          title="No applications yet"
          description="Your counselor will create applications once your profile is complete."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="My Applications"
      description={`${applications.length} ${applications.length === 1 ? 'application' : 'applications'} in progress`}
      icon="ClipboardList"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-alo-blue hover:bg-alo-blue-light"
          onClick={() => onNavigate?.('applications')}
        >
          View all
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {applications.map((app) => {
          const progress = stageToProgress(app.stage || '');
          const stageLabel = STAGE_LABELS[app.stage || ''] || app.stage || 'Unknown';
          const stageColor = STAGE_COLORS[app.stage || ''] || 'bg-slate-100 text-slate-700';

          return (
            <div
              key={app.id}
              className="card-lift group rounded-2xl border border-border bg-white p-4 transition-all hover:border-alo-blue/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-alo-black">{app.university}</p>
                  <p className="mt-0.5 truncate text-xs text-alo-gray">{app.course}</p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize', stageColor)}>
                  {stageLabel}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-alo-gray">
                <Globe className="size-3" />
                <span>{app.country}</span>
                <span className="text-border">·</span>
                <span>{app.studyLevel}</span>
                <span className="text-border">·</span>
                <span>{app.intake}</span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-alo-gray">Progress</span>
                  <span className="font-bold tabular-nums text-alo-blue">{progress}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-alo-gray-light">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-alo-blue to-alo-blue-dark transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full justify-center text-xs text-alo-blue hover:bg-alo-blue-light hover:text-alo-blue-dark"
                onClick={() => onNavigate?.('applications')}
              >
                View Details
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Document Status Center ─────────────────────────────────────────────────

function DocumentStatusCenter({
  documents,
  onNavigate,
}: {
  documents: Document[];
  onNavigate?: (view: string, slug?: string) => void;
}) {
  // Group by status for summary
  const statusCounts: Record<string, number> = {};
  for (const doc of documents) {
    const s = doc.status || 'REQUIRED';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const summaryItems = [
    { key: 'APPROVED', label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    { key: 'UPLOADED', label: 'Uploaded', color: 'bg-sky-100 text-sky-700 border border-sky-200' },
    { key: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    { key: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-700 border border-red-200' },
    { key: 'MISSING', label: 'Missing', color: 'bg-red-100 text-red-700 border border-red-200' },
    { key: 'REQUIRED', label: 'Required', color: 'bg-alo-blue-light text-alo-blue border border-alo-blue/20' },
  ];

  return (
    <SectionCard
      title="Document Status"
      description={`${documents.length} documents tracked`}
      icon="FileText"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-alo-blue hover:bg-alo-blue-light"
          onClick={() => onNavigate?.('document-hub')}
        >
          View all
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {summaryItems.map((item) => {
          const count = statusCounts[item.key] || 0;
          if (count === 0) return null;
          return (
            <span key={item.key} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', item.color)}>
              {count}
              <span className="font-normal">{item.label}</span>
            </span>
          );
        })}
      </div>

      {/* Document grid */}
      <div className="max-h-72 space-y-2 overflow-y-auto alo-scrollbar pr-1">
        {documents.map((doc) => {
          const config = DOC_STATUS_CONFIG[doc.status || 'REQUIRED'] || DOC_STATUS_CONFIG.REQUIRED;
          const StatusIcon = config.icon;
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-2.5 transition-colors hover:bg-alo-gray-light/50"
            >
              <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', config.cls)}>
                <StatusIcon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-alo-black">{doc.name}</p>
                <p className="text-[11px] text-alo-gray">{doc.category} {doc.fileName ? `· ${doc.fileName}` : ''}</p>
              </div>
              <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', config.cls)}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Upcoming Deadlines ─────────────────────────────────────────────────────

function UpcomingDeadlines({
  tasks,
}: {
  tasks: Task[];
}) {
  const sorted = [...tasks]
    .filter((t) => t.dueDate && t.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <SectionCard title="Upcoming Deadlines" icon="CalendarClock">
        <EmptyState
          icon="CalendarClock"
          title="No upcoming deadlines"
          description="All tasks are on track. Enjoy the moment!"
        />
      </SectionCard>
    );
  }

  const priorityColor: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <SectionCard title="Upcoming Deadlines" icon="CalendarClock">
      <div className="space-y-2">
        {sorted.map((task) => {
          const days = daysUntil(task.dueDate!);
          const urgency = days <= 2 ? 'text-red-600' : days <= 5 ? 'text-amber-600' : 'text-alo-gray';
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-3 transition-colors hover:bg-alo-gray-light/50"
            >
              <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-alo-blue-light">
                <span className="text-xs font-bold leading-none text-alo-blue">{days}</span>
                <span className="text-[9px] font-medium text-alo-blue/70">days</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-alo-black">{task.title}</p>
                <p className="text-[11px] text-alo-gray">{formatDate(task.dueDate)} · {task.description}</p>
              </div>
              {task.priority && (
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', priorityColor[task.priority] || 'bg-slate-100 text-slate-700')}>
                  {task.priority.toLowerCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Saved Courses & Universities ───────────────────────────────────────────

function SavedItems({
  onNavigate,
}: {
  onNavigate?: (view: string, slug?: string) => void;
}) {
  return (
    <SectionCard
      title="Saved Courses & Universities"
      description="Your bookmarked picks"
      icon="Bookmark"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-alo-blue hover:bg-alo-blue-light"
          onClick={() => onNavigate?.('student-course-finder')}
        >
          Browse more
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 alo-scrollbar">
        {/* ⚠️ DEMO: Saved items use demo data */}
        {DEMO_SAVED_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              onNavigate?.(
                item.type === 'university' ? 'public-university' : 'public-course',
                item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              )
            }
            className="card-lift group flex w-52 shrink-0 flex-col gap-2 rounded-2xl border border-border bg-white p-4 text-left transition-all hover:border-alo-blue/20"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-alo-blue-light text-alo-blue">
              {item.type === 'university' ? <Building2 className="size-5" /> : <BookOpen className="size-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-alo-black group-hover:text-alo-blue">{item.name}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-alo-gray">
                <MapPin className="size-3" />
                <span>{item.country}</span>
                {'rating' in item && item.rating && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-medium text-alo-sunshine">{'★'} {item.rating}</span>
                  </>
                )}
              </div>
              {'university' in item && item.university && (
                <p className="mt-0.5 truncate text-[10px] text-alo-gray">{item.university}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Recent Messages ────────────────────────────────────────────────────────

function RecentMessages({
  messages,
  onNavigate,
}: {
  messages: Message[];
  onNavigate?: (view: string, slug?: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <SectionCard title="Recent Messages" icon="Mail">
        <EmptyState
          icon="Mail"
          title="No messages yet"
          description="Messages from your counselor will appear here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Recent Messages"
      description={`${messages.filter((m) => !m.read).length} unread`}
      icon="Mail"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="text-alo-blue hover:bg-alo-blue-light"
          onClick={() => onNavigate?.('unified-inbox')}
        >
          View all
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      <div className="max-h-72 space-y-2 overflow-y-auto alo-scrollbar pr-1">
        {messages.slice(0, 5).map((msg) => (
          <button
            key={msg.id}
            onClick={() => onNavigate?.('unified-inbox')}
            className="flex w-full items-start gap-3 rounded-xl border border-border bg-white px-3.5 py-3 text-left transition-colors hover:bg-alo-gray-light/50"
          >
            {/* Avatar */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-alo-blue-light text-xs font-bold text-alo-blue">
              {(msg.senderName || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('truncate text-sm', msg.read ? 'font-medium' : 'font-semibold text-alo-black')}>
                  {msg.senderName}
                </p>
                <span className="shrink-0 text-[10px] text-alo-gray">{timeAgo(msg.createdAt || '')}</span>
              </div>
              <p className={cn('truncate text-xs', msg.read ? 'text-alo-gray' : 'font-medium text-alo-black')}>{msg.subject}</p>
              <p className="mt-0.5 truncate text-[11px] text-alo-gray">{msg.content}</p>
            </div>
            {!msg.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-alo-orange" />}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Notifications Panel ────────────────────────────────────────────────────

function NotificationsPanel({
  notifications,
}: {
  notifications: Notification[];
}) {
  const unread = notifications.filter((n) => !n.read);

  const typeIcon: Record<string, typeof Bell> = {
    SUCCESS: CheckCircle2,
    WARNING: AlertTriangle,
    INFO: Bell,
    ERROR: XCircle,
  };

  const typeColor: Record<string, string> = {
    SUCCESS: 'bg-emerald-100 text-emerald-600',
    WARNING: 'bg-amber-100 text-amber-600',
    INFO: 'bg-alo-blue-light text-alo-blue',
    ERROR: 'bg-red-100 text-red-600',
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title="Notifications"
      description={unread.length > 0 ? `${unread.length} new` : 'All caught up'}
      icon="Bell"
    >
      <div className="max-h-64 space-y-1.5 overflow-y-auto alo-scrollbar pr-1">
        {notifications.slice(0, 6).map((notif) => {
          const NotifIcon = typeIcon[notif.type || 'INFO'] || Bell;
          const color = typeColor[notif.type || 'INFO'] || typeColor.INFO;
          return (
            <div
              key={notif.id}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-alo-gray-light/50',
                !notif.read && 'bg-alo-blue-light/30',
              )}
            >
              <div className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', color)}>
                <NotifIcon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn('truncate text-xs', !notif.read ? 'font-semibold text-alo-black' : 'font-medium text-alo-gray')}>
                    {notif.title}
                  </p>
                  {!notif.read && <span className="size-1.5 shrink-0 rounded-full bg-alo-orange" />}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-alo-gray">{notif.message}</p>
                <p className="mt-0.5 text-[10px] text-alo-gray/60">{timeAgo(notif.createdAt || '')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Notification Bell (floating badge) ─────────────────────────────────────

function NotificationBadge({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count <= 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="glow-pulse relative flex size-10 items-center justify-center rounded-full bg-alo-orange text-white shadow-lg shadow-alo-orange/30 transition-transform hover:scale-105"
        >
          <Bell className="size-5" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-alo-orange shadow-sm">
            {count > 99 ? '99+' : count}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{count} new notification{count !== 1 ? 's' : ''}</TooltipContent>
    </Tooltip>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="size-20 rounded-full" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      <LoadingGrid count={4} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NewStudentDashboard({ onNavigate }: StudentDashboardProps) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS);
  const [applications, setApplications] = useState<Application[]>(DEMO_APPLICATIONS);
  const [documents, setDocuments] = useState<Document[]>(DEMO_DOCUMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const safeFetch = useCallback(async <T,>(url: string, fallback: T): Promise<T> => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return fallback;
      const data = await res.json();
      return data as T;
    } catch {
      return fallback;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      try {
        setLoading(true);

        // Parallel fetch all data
        const [statsData, appsData, docsData, notifsData, msgsData, tasksData] = await Promise.all([
          safeFetch<DashboardStats>('/api/dashboard/stats', DEMO_STATS),
          safeFetch<{ applications?: Application[] }>('/api/applications', { applications: DEMO_APPLICATIONS }),
          safeFetch<{ documents?: Document[] }>('/api/documents/list', { documents: DEMO_DOCUMENTS }),
          safeFetch<{ notifications?: Notification[] }>('/api/notifications', { notifications: DEMO_NOTIFICATIONS }),
          safeFetch<{ messages?: Message[] }>('/api/messages', { messages: DEMO_MESSAGES }),
          safeFetch<{ tasks?: Task[] }>('/api/tasks', { tasks: DEMO_TASKS }),
        ]);

        if (!alive) return;

        // Apply API data (fall back to demo if empty/missing)
        setStats(statsData);
        setApplications(appsData.applications?.length ? appsData.applications : DEMO_APPLICATIONS);
        setDocuments(docsData.documents?.length ? docsData.documents : DEMO_DOCUMENTS);
        setNotifications(notifsData.notifications?.length ? notifsData.notifications : DEMO_NOTIFICATIONS);
        setMessages(msgsData.messages?.length ? msgsData.messages : DEMO_MESSAGES);
        setTasks(tasksData.tasks?.length ? tasksData.tasks : DEMO_TASKS);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, [safeFetch]);

  // ─── Derived State ────────────────────────────────────────────────────────
  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const unreadMsgCount = messages.filter((m) => !m.read).length;
  const pendingDocCount = documents.filter((d) => d.status === 'PENDING' || d.status === 'MISSING' || d.status === 'REJECTED').length;

  // Update stats with computed values
  const enrichedStats: DashboardStats = {
    ...stats,
    pendingDocuments: pendingDocCount,
    unreadMessages: unreadMsgCount,
    unreadNotifications: unreadNotifCount,
    upcomingDeadlines: tasks.filter((t) => t.dueDate && t.status !== 'COMPLETED' && daysUntil(t.dueDate) <= 14).length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon="LayoutDashboard"
        title="Dashboard unavailable"
        description={error}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="relative space-y-6">
        {/* Floating notification badge (mobile) */}
        <div className="fixed bottom-6 right-6 z-50 sm:hidden">
          <NotificationBadge
            count={unreadNotifCount}
            onClick={() => setShowNotifPanel(!showNotifPanel)}
          />
        </div>

        {/* ═══ 1. WELCOME HEADER ═══ */}
        <WelcomeHeader stats={enrichedStats} onNavigate={onNavigate} />

        {/* ═══ STAT CARDS ═══ */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Active Applications"
            value={applications.length}
            icon="ClipboardList"
            accent="blue"
            hint={applications.length === 1 ? '1 in progress' : `${applications.length} in progress`}
          />
          <StatCard
            label="Documents Pending"
            value={pendingDocCount}
            icon="FileWarning"
            accent="orange"
            hint={pendingDocCount === 0 ? 'All clear!' : 'Action needed'}
          />
          <StatCard
            label="Upcoming Deadlines"
            value={enrichedStats.upcomingDeadlines ?? 0}
            icon="CalendarClock"
            accent="amber"
            hint="Within 14 days"
          />
          <StatCard
            label="Notifications"
            value={unreadNotifCount}
            icon="Bell"
            accent="sunshine"
            hint={unreadNotifCount === 0 ? 'All read' : `${unreadNotifCount} new`}
          />
        </div>

        {/* ═══ 2. APPLICATION PROGRESS TIMELINE + 3. QUICK ACTIONS ═══ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ApplicationTimeline applications={applications} onNavigate={onNavigate} />
          </div>
          <div>
            <QuickActionsGrid onNavigate={onNavigate} />
          </div>
        </div>

        {/* ═══ 4. MY APPLICATIONS CARDS ═══ */}
        <ApplicationsCards applications={applications} onNavigate={onNavigate} />

        {/* ═══ 5. DOCUMENT STATUS + 6. DEADLINES + 7. SAVED ═══ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DocumentStatusCenter documents={documents} onNavigate={onNavigate} />
          </div>
          <div className="space-y-6">
            <UpcomingDeadlines tasks={tasks} />
          </div>
        </div>

        {/* ═══ 7. SAVED COURSES & UNIVERSITIES ═══ */}
        <SavedItems onNavigate={onNavigate} />

        {/* ═══ 8. RECENT MESSAGES + 9. NOTIFICATIONS ═══ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentMessages messages={messages} onNavigate={onNavigate} />
          </div>
          <div>
            <NotificationsPanel notifications={notifications} />
          </div>
        </div>

        {/* ═══ Mobile Notification Panel Overlay ═══ */}
        {showNotifPanel && (
          <div className="fixed inset-0 z-50 flex items-end sm:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowNotifPanel(false)}
            />
            <div className="relative w-full max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl alo-scrollbar">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-alo-gray-medium" />
              <h3 className="text-base font-bold text-alo-black">Notifications</h3>
              <div className="mt-3 space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'rounded-xl border border-border px-3.5 py-3',
                      !notif.read && 'bg-alo-blue-light/30',
                    )}
                  >
                    <p className={cn('text-sm', !notif.read ? 'font-semibold text-alo-black' : 'font-medium text-alo-gray')}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-xs text-alo-gray">{notif.message}</p>
                    <p className="mt-1 text-[10px] text-alo-gray/60">{timeAgo(notif.createdAt || '')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default NewStudentDashboard;
