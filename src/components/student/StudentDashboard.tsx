'use client';

import React, { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Upload,
  Search,
  ArrowRight,
  CalendarDays,
  MessageSquare,
  Phone,
  CircleCheck,
  CircleDot,
  Circle,
  BookOpen,
} from 'lucide-react';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */
const MOCK_PROFILE_COMPLETION = 75;

const MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    university: 'University of Aberdeen',
    course: 'MSc Data Science',
    country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    stage: 'submitted' as const,
    nextAction: 'Awaiting university acknowledgment',
    deadline: '2025-07-15',
    counselorNote:
      'Your SOP looks strong. The university typically responds within 4-6 weeks. I\'ve highlighted your relevant coursework experience.',
  },
  {
    id: 'app-2',
    university: 'University of Leeds',
    course: 'MSc International Business',
    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    stage: 'conditional' as const,
    nextAction: 'Upload final degree transcript',
    deadline: '2025-06-30',
    counselorNote:
      'Conditional offer received! You need to submit your final semester transcript with a minimum CGPA of 3.2.',
  },
  {
    id: 'app-3',
    university: 'University of Birmingham',
    course: 'MSc Computer Science',
    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    stage: 'draft' as const,
    nextAction: 'Complete personal statement section',
    deadline: '2025-08-01',
    counselorNote:
      'We need to finalize your personal statement before submission. The deadline for September 2025 intake is approaching.',
  },
];

const MOCK_DOCUMENTS = [
  { name: 'Passport', status: 'approved' as const, detail: '' },
  {
    name: 'IELTS Certificate',
    status: 'pending_review' as const,
    detail: '',
  },
  {
    name: 'Degree Transcript',
    status: 'rejected' as const,
    detail: 'Please upload clear scan',
  },
  {
    name: 'Bank Statement',
    status: 'pending_upload' as const,
    detail: '',
  },
];

const MOCK_NEXT_ACTIONS = [
  { text: 'Upload passport', urgent: true, subtitle: '' },
  { text: 'Complete IELTS', urgent: false, subtitle: '3 days left' },
  { text: 'Book consultation with counselor', urgent: false, subtitle: '' },
  { text: 'Review SOP draft', urgent: false, subtitle: '' },
  { text: 'Prepare visa documents', urgent: false, subtitle: '' },
];

const MOCK_COUNSELOR = {
  name: 'Sarah Khan',
  designation: 'Senior Admissions Counselor',
  initials: 'SK',
};

const MOCK_VISA_READINESS = 45;
const MOCK_VISA_MISSING = 7;

/* ================================================================== */
/*  Journey Stages                                                     */
/* ================================================================== */
const JOURNEY_STAGES = [
  { label: 'Profile Created', done: true },
  { label: 'Counselling', done: true },
  { label: 'Documents', done: true },
  { label: 'Shortlisted', done: true },
  { label: 'Application Submitted', current: true },
  { label: 'Offer Received', done: false },
  { label: 'CAS', done: false },
  { label: 'Visa', done: false },
  { label: 'Enrolled', done: false },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function stageBadge(stage: string) {
  switch (stage) {
    case 'submitted':
      return (
        <Badge variant="success" className="text-xs">
          Submitted
        </Badge>
      );
    case 'conditional':
      return (
        <Badge variant="warning" className="text-xs">
          Conditional Offer
        </Badge>
      );
    case 'draft':
      return (
        <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          In Progress
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="text-xs">{stage}</Badge>;
  }
}

function docStatusIcon(status: string) {
  switch (status) {
    case 'approved':
      return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
    case 'pending_review':
      return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-slate-300 shrink-0" />;
  }
}

function docStatusText(status: string, detail?: string) {
  switch (status) {
    case 'approved':
      return <span className="text-green-700 text-sm font-medium">Approved</span>;
    case 'pending_review':
      return <span className="text-amber-700 text-sm font-medium">Pending Review</span>;
    case 'rejected':
      return (
        <span className="text-red-600 text-sm font-medium">
          Rejected — &quot;{detail}&quot;
        </span>
      );
    case 'pending_upload':
      return <span className="text-slate-500 text-sm font-medium">Pending Upload</span>;
    default:
      return null;
  }
}

/* ================================================================== */
/*  Circular Progress Ring (SVG)                                        */
/* ================================================================== */
function ProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-alo-brand"
        style={
          {
            '--circumference': circumference,
            '--offset': offset,
            animation: 'circular-progress 0.8s ease-out forwards',
          } as React.CSSProperties
        }
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/* ================================================================== */
/*  StudentDashboard                                                    */
/* ================================================================== */
export default function StudentDashboard() {
  const { user, setView, token } = usePortalStore();
  const userName = user?.name || 'Rahim Uddin';

  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // API data states (fall back to mock when null)
  const [apiProfile, setApiProfile] = useState<Record<string, unknown> | null>(null);
  const [apiApplications, setApiApplications] = useState<Record<string, unknown>[] | null>(null);
  const [apiDocuments, setApiDocuments] = useState<Record<string, unknown>[] | null>(null);
  const [apiNotifications, setApiNotifications] = useState<Record<string, unknown>[] | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!token) { setLoading(false); return; }
      const headers = { 'Authorization': `Bearer ${token}` };
      const fetches = [
        fetch('/api/student-portal/profile', { headers }).then(r => r.json()).then(j => j.success ? j.data : null).catch(() => null),
        fetch('/api/student-portal/applications', { headers }).then(r => r.json()).then(j => j.success ? j.data : null).catch(() => null),
        fetch('/api/student-portal/documents', { headers }).then(r => r.json()).then(j => j.success ? j.data : null).catch(() => null),
        fetch('/api/student-portal/notifications', { headers }).then(r => r.json()).then(j => j.success ? j.data : null).catch(() => null),
      ];
      const [profile, applications, documents, notifications] = await Promise.all(fetches);
      if (profile) setApiProfile(profile as Record<string, unknown>);
      if (applications) setApiApplications(applications as Record<string, unknown>[]);
      if (documents) setApiDocuments(documents as Record<string, unknown>[]);
      if (notifications) setApiNotifications(notifications as Record<string, unknown>[]);
      setLoading(false);
    }
    loadData();
  }, [token]);

  // Derive values: prefer API data, fall back to mock
  const profileCompletion = apiProfile ? (apiProfile.profileCompletion as number) ?? MOCK_PROFILE_COMPLETION : MOCK_PROFILE_COMPLETION;
  const displayName = apiProfile ? ((apiProfile.fullName as string) || (apiProfile.givenName as string) || userName) : userName;
  const applications = (apiApplications && apiApplications.length > 0) ? apiApplications.map((a: Record<string, unknown>) => ({
    id: a.id as string,
    university: (a.university as string) || 'Unknown University',
    course: (a.course as string) || 'Unknown Course',
    country: a.country ? `🏴󠁧󠁢󠁥󠁮󠁧󠁿` : '',
    stage: (a.stage as string) || 'draft',
    nextAction: (a.nextAction as string) || '',
    deadline: (a.deadline as string) || '',
    counselorNote: (a.counselorNote as string) || '',
  })) : MOCK_APPLICATIONS;
  const documents = (apiDocuments && apiDocuments.length > 0) ? apiDocuments.map((d: Record<string, unknown>) => ({
    name: (d.name as string) || 'Document',
    status: (d.status as string) || 'pending_upload',
    detail: (d.rejectionReason as string) || '',
  })) : MOCK_DOCUMENTS;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/*  WELCOME BANNER                                              */}
      {/* ============================================================ */}
      <section>
        <h1 className="text-xl font-semibold text-alo-text">
          Welcome back, {displayName}!
        </h1>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary" className="font-mono text-xs bg-slate-100 text-slate-600">
            ID: ALO-2024-0847
          </Badge>
          <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            🇬🇧 Target: UK
          </Badge>
          <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            Intake: Sep 2025
          </Badge>
          <Badge variant="brand" className="text-xs">
            Counselor: Sarah Khan
          </Badge>
        </div>

        {/* Profile completion bar */}
        <div className="mt-4 max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-alo-text-secondary">
              Profile Completion
            </span>
            <span className="text-sm font-semibold text-alo-brand">
              {profileCompletion}%
            </span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  KPI CARDS (4)                                               */}
      {/* ============================================================ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1 — Profile Completion */}
        <Card className="p-4 gap-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing value={profileCompletion} size={52} strokeWidth={4} />
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="w-4 h-4 text-alo-brand" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-text">{profileCompletion}%</p>
              <p className="text-xs text-alo-text-muted mt-0.5">completed</p>
            </div>
          </div>
          <p className="text-xs text-alo-text-muted mt-3 font-medium">
            Profile Completion
          </p>
        </Card>

        {/* 2 — Active Applications */}
        <Card className="p-4 gap-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-text">{applications.length}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">+1 this week</p>
            </div>
          </div>
          <p className="text-xs text-alo-text-muted mt-3 font-medium">
            Active Applications
          </p>
        </Card>

        {/* 3 — Missing Documents */}
        <Card className="p-4 gap-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-text">{documents.length}</p>
              <p className="text-xs text-red-600 font-medium mt-0.5">
                2 urgent
              </p>
            </div>
          </div>
          <p className="text-xs text-alo-text-muted mt-3 font-medium">
            Missing Documents
          </p>
        </Card>

        {/* 4 — Next Deadline */}
        <Card className="p-4 gap-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-alo-text">12 days</p>
              <p className="text-xs text-alo-text-muted mt-0.5">
                University of Aberdeen
              </p>
            </div>
          </div>
          <p className="text-xs text-alo-text-muted mt-3 font-medium">
            Next Deadline
          </p>
        </Card>
      </section>

      {/* Embedded Communication Widget for Student */}
      <DashboardCommunicationWidget
        role="STUDENT"
        unreadCount={null}
        onNavigateToInbox={() => setView('student-messages')}
      />

      {/* ============================================================ */}
      {/*  MAIN CONTENT — 2/3 + 1/3 grid                              */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------------------------------------------------------- */}
        {/*  LEFT COLUMN (2/3)                                         */}
        {/* ---------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* ========== a) APPLICATION JOURNEY TIMELINE ========== */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-alo-text">Your Journey</CardTitle>
                <Badge variant="brand" className="text-xs">
                  Stage 5 of 9
                </Badge>
              </div>
              <CardDescription>
                Track your progress from application to enrollment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Horizontal timeline — scrollable on mobile */}
              <div className="overflow-x-auto pb-2 -mx-1">
                <div className="flex items-start min-w-[640px] px-1">
                  {JOURNEY_STAGES.map((stage, idx) => {
                    const isLast = idx === JOURNEY_STAGES.length - 1;
                    return (
                      <div
                        key={stage.label}
                        className="flex items-start flex-1 min-w-0"
                      >
                        {/* Node */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="relative">
                            {stage.done ? (
                              <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : stage.current ? (
                              <div className="w-7 h-7 rounded-full border-[3px] border-alo-brand bg-white flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-alo-brand animate-pulse" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <Circle className="w-3 h-3 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <span
                            className={cn(
                              'text-[10px] mt-1.5 text-center leading-tight max-w-[72px]',
                              stage.done
                                ? 'text-green-700 font-medium'
                                : stage.current
                                  ? 'text-alo-brand font-semibold'
                                  : 'text-alo-text-muted'
                            )}
                          >
                            {stage.label}
                          </span>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                          <div className="flex-1 mt-[13px] mx-1 min-w-[16px]">
                            <div
                              className={cn(
                                'h-[2px] w-full rounded-full',
                                stage.done ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'
                              )}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== b) MY APPLICATIONS ========== */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-alo-text">My Applications</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-alo-brand text-sm"
                  onClick={() => setView('student-applications')}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications.map((app) => (
                <Collapsible
                  key={app.id}
                  open={expandedApp === app.id}
                  onOpenChange={(open) =>
                    setExpandedApp(open ? app.id : null)
                  }
                >
                  <div className="rounded-xl border border-alo-border p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-alo-text text-sm">
                          {app.university}
                        </p>
                        <p className="text-sm text-alo-text-secondary mt-0.5">
                          {app.course} {app.country}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {stageBadge(app.stage)}
                          <span className="text-xs text-alo-text-muted">
                            Deadline: {app.deadline}
                          </span>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 mt-0.5"
                        >
                          <ChevronDown
                            className={cn(
                              'w-4 h-4 text-alo-text-muted transition-transform duration-200',
                              expandedApp === app.id && 'rotate-180'
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <p className="text-xs text-alo-text-muted mt-2">
                      <span className="font-medium text-alo-text-secondary">
                        Next:
                      </span>{' '}
                      {app.nextAction}
                    </p>

                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t border-alo-border bg-alo-page/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-alo-text-secondary mb-1">
                          💬 Counselor Note
                        </p>
                        <p className="text-xs text-alo-text-muted leading-relaxed">
                          {app.counselorNote}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </CardContent>
          </Card>

          {/* ========== c) REQUIRED DOCUMENTS ========== */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-alo-text">
                    Required Documents
                  </CardTitle>
                  <CardDescription className="mt-1">
                    1 approved · 1 pending review · 1 rejected · 1 pending
                    upload
                  </CardDescription>
                </div>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center gap-3 p-3 rounded-lg border border-alo-border hover:bg-alo-page/50 transition"
                  >
                    {docStatusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-alo-text">
                        {doc.name}
                      </p>
                      {doc.detail && (
                        <p className="text-xs text-alo-text-muted mt-0.5">
                          {docStatusText(doc.status, doc.detail)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {doc.status === 'approved'
                        ? docStatusText(doc.status)
                        : doc.status === 'pending_review'
                          ? docStatusText(doc.status)
                          : doc.status === 'rejected'
                            ? docStatusText(doc.status, doc.detail)
                            : docStatusText(doc.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  RIGHT SIDEBAR (1/3)                                       */}
        {/* ---------------------------------------------------------- */}
        <div className="lg:col-span-1 space-y-6">
          {/* ========== d) NEXT ACTIONS ========== */}
          <Card className="bg-alo-brand-light/50 border-alo-brand/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-alo-brand" />
                <CardTitle className="text-alo-text text-base">
                  What to do next
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {MOCK_NEXT_ACTIONS.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-alo-brand/10 text-alo-brand text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-alo-text font-medium">
                        {action.text}
                      </p>
                      {action.urgent && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0 mt-1"
                        >
                          Urgent
                        </Badge>
                      )}
                      {action.subtitle && !action.urgent && (
                        <p className="text-xs text-alo-text-muted mt-0.5">
                          {action.subtitle}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* ========== e) COUNSELOR CARD ========== */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-alo-brand-light text-alo-brand text-sm font-semibold">
                    {MOCK_COUNSELOR.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-alo-text">
                    {MOCK_COUNSELOR.name}
                  </p>
                  <p className="text-xs text-alo-text-muted">
                    {MOCK_COUNSELOR.designation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <Phone className="w-3 h-3" />
                  WhatsApp Verified
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="brand-outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setView('student-appointments')}
                >
                  <CalendarDays className="w-4 h-4 mr-1.5" />
                  Book Appointment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setView('student-messages')}
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ========== f) VISA READINESS ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="text-alo-text text-base">
                Visa Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ProgressRing
                    value={MOCK_VISA_READINESS}
                    size={64}
                    strokeWidth={5}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-alo-text">
                      {MOCK_VISA_READINESS}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-alo-text">
                    {MOCK_VISA_MISSING} items missing
                  </p>
                  <p className="text-xs text-alo-text-muted mt-0.5">
                    Complete checklist to improve score
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-alo-brand justify-center"
                onClick={() => setView('student-visa')}
              >
                Visa Checklist
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* ========== g) AI SUGGESTIONS ========== */}
          <Card className="overflow-hidden">
            {/* Gradient background using ALO brand + subtle purple */}
            <div className="bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 p-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-semibold text-alo-text">
                      AI Study Coach
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        icon: <Search className="w-3.5 h-3.5" />,
                        text: '3 courses match your profile',
                        color: 'text-blue-600 bg-blue-50',
                      },
                      {
                        icon: <Clock className="w-3.5 h-3.5" />,
                        text: 'Scholarship deadline in 5 days',
                        color: 'text-amber-600 bg-amber-50',
                      },
                      {
                        icon: <BookOpen className="w-3.5 h-3.5" />,
                        text: 'Interview practice available',
                        color: 'text-violet-600 bg-violet-50',
                      },
                    ].map((chip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-alo-border hover:bg-slate-100 transition cursor-pointer"
                      >
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                            chip.color
                          )}
                        >
                          {chip.icon}
                        </span>
                        <span className="text-xs font-medium text-alo-text-secondary">
                          {chip.text}
                        </span>
                        <ArrowRight className="w-3 h-3 text-alo-text-muted ml-auto shrink-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}