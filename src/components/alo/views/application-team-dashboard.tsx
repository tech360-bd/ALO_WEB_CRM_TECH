"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import {
  APP_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  DOC_STATUS_COLORS,
  fmtDate,
  timeAgo,
} from "@/lib/alo-types";

// ---------- Types ----------
interface StudentLite {
  studentId: string;
  fullName: string;
}

interface AppTeamApplication {
  id: string;
  applicationId: string;
  student?: StudentLite | null;
  university: string;
  course: string;
  country: string;
  stage: string;
  priority: string;
  deadline: string | null;
}

interface AppTeamDocument {
  id: string;
  student?: StudentLite | null;
  category: string;
  name: string;
  status: string;
  uploadedAt: string | null;
}

interface PartnerEmailUpdate {
  id: string;
  studentId?: string | null;
  partnerName: string;
  partnerEmail?: string;
  subject: string;
  body: string;
  status: string;
  receivedAt: string;
}

interface AppTeamMetrics {
  totalApplications: number;
  documentsToReview: number;
  pendingPartnerEmails: number;
  submittedToday: number;
}

interface AppTeamResponse {
  metrics: AppTeamMetrics;
  stageCounts: Record<string, number>;
  applications: AppTeamApplication[];
  documentsToReview: AppTeamDocument[];
  partnerEmailUpdates: PartnerEmailUpdate[];
}

// ---------- Maps ----------
const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-crm-danger-bg text-crm-danger-text" },
  HIGH: { label: "High", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" },
  NORMAL: { label: "Normal", cls: "bg-sky-100 text-sky-700" },
  LOW: { label: "Low", cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" },
};

const COUNTRY_FLAG: Record<string, string> = {
  UK: "GB",
  USA: "US",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  Ireland: "IE",
  Malaysia: "MY",
  "New Zealand": "NZ",
  Finland: "FI",
  Sweden: "SE",
};

const DOC_CATEGORY_LABEL: Record<string, string> = {
  PASSPORT: "Passport",
  NID: "National ID",
  ACADEMIC_CERT: "Academic Certificate",
  TRANSCRIPT: "Transcript",
  CV: "CV / Resume",
  SOP: "Statement of Purpose",
  BANK_STATEMENT: "Bank Statement",
  SPONSOR_DOC: "Sponsor Document",
  VISA_DOC: "Visa Document",
  REFUSAL_LETTER: "Refusal Letter",
  MEDICAL: "Medical",
  IELTS_CERT: "English Test Cert",
  OTHER: "Other",
};

const SUBMISSION_CHANNELS = [
  { key: "DIRECT", label: "Direct Submission", icon: "Send", desc: "Apply to university portal directly via ALO account." },
  { key: "PATHWAY", label: "Pathway Provider", icon: "Route", desc: "Apply via pathway provider (e.g. Foundation, Pre-Master's)." },
  { key: "B2B", label: "B2B Provider", icon: "Handshake", desc: "Apply through B2B partner / provider portal." },
  { key: "PARTNER_PORTAL", label: "Partner Portal Source", icon: "Building2", desc: "Application tracked from partner portal feed." },
  { key: "EMAIL", label: "Partner Email Updates", icon: "Mail", desc: "Email updates from partners regarding applications." },
  { key: "COMMISSION", label: "Commission Expected", icon: "DollarSign", desc: "Expected commission — visible to Finance only." },
];

// ---------- Component ----------
export function ApplicationTeamDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<AppTeamResponse | null>(null);
  const [tab, setTab] = React.useState("applications");

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = React.useState<AppTeamDocument | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectOpen, setRejectOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/application-team");
      if (!res.ok) throw new Error("fetch failed");
      const json: AppTeamResponse = await res.json();
      setData(json);
    } catch {
      toast({
        title: "Failed to load dashboard",
        description: "Could not load application team data. Please retry.",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = data?.metrics;
  const stageCounts = data?.stageCounts || {};
  const applications = data?.applications || [];
  const documents = data?.documentsToReview || [];
  const partnerEmails = data?.partnerEmailUpdates || [];

  const totalStageCount = Object.values(stageCounts).reduce((s, n) => s + n, 0);

  const handleUpdateStage = (app: AppTeamApplication) => {
    toast({
      title: "Update stage",
      description: `Opening stage workflow for ${app.applicationId} — ${app.university}. A timeline event & audit log entry will be created.`,
    });
  };

  const handleViewStudent = (app: AppTeamApplication) => {
    toast({
      title: "View student",
      description: `Opening Student 360 view for ${app.student?.fullName || app.student?.studentId || "this student"}.`,
    });
  };

  const handleReviewDoc = (doc: AppTeamDocument) => {
    toast({
      title: "Opening document review",
      description: `Launching secure viewer for "${doc.name}". You can approve or reject after inspection.`,
    });
  };

  const handleApproveDoc = (doc: AppTeamDocument) => {
    toast({
      title: "Document approved",
      description: `"${doc.name}" for ${doc.student?.fullName || "student"} has been approved. Student & counselor will be notified.`,
    });
  };

  const openReject = (doc: AppTeamDocument) => {
    setRejectTarget(doc);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim() || "Document does not meet requirements.";
    toast({
      title: "Document rejected",
      description: `"${rejectTarget.name}" rejected. Reason: ${reason}`,
    });
    setRejectOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleReviewPartnerEmail = (email: PartnerEmailUpdate) => {
    toast({
      title: "Reviewing partner email",
      description: `Opening full email from ${email.partnerName} — "${email.subject}".`,
    });
  };

  const handleGenerateStudentMessage = (email: PartnerEmailUpdate) => {
    toast({
      title: "AI message generation started",
      description: "AI is generating a clean, student-facing update from this partner email. It will be queued for your review.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Team Dashboard"
        subtitle="Applications, document review, and partner submission workflow."
        icon="ClipboardCheck"
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Applications"
            value={metrics?.totalApplications ?? 0}
            icon="Files"
            accent="blue"
            hint="Across all destinations"
          />
          <StatCard
            label="Documents to Review"
            value={metrics?.documentsToReview ?? 0}
            icon="FileSearch"
            accent="orange"
            hint="Awaiting verification"
          />
          <StatCard
            label="Pending Partner Emails"
            value={metrics?.pendingPartnerEmails ?? 0}
            icon="MailWarning"
            accent="amber"
            hint="Need parsing & matching"
          />
          <StatCard
            label="Submitted Today"
            value={metrics?.submittedToday ?? 0}
            icon="Send"
            accent="emerald"
            hint="University submissions in last 24h"
          />
        </div>
      )}

      {/* Stage distribution */}
      <SectionCard
        title="Stage distribution"
        icon="GitBranch"
        description="Pipeline funnel — applications across the 20-stage journey."
      >
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
        ) : totalStageCount === 0 ? (
          <EmptyState
            icon="GitBranch"
            title="No active applications"
            description="Applications will be distributed across stages as they progress."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {APP_STAGES.map((stage, idx) => {
              const count = stageCounts[stage] || 0;
              const active = count > 0;
              const colorCls = STAGE_COLORS[stage] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]";
              const pct = totalStageCount > 0 ? Math.round((count / totalStageCount) * 100) : 0;
              return (
                <button
                  key={stage}
                  onClick={() => setTab("applications")}
                  title={`${STAGE_LABELS[stage]} — ${count} (${pct}%)`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    active ? colorCls + " border-transparent hover:scale-[1.02]" : "bg-[var(--alo-page)] text-[var(--alo-text-muted)] border-transparent"
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-70">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate max-w-[140px]">{STAGE_LABELS[stage]}</span>
                  <span
                    className={`ml-1 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      active ? "bg-white/70 text-current" : "bg-[var(--alo-page)] text-[var(--alo-text-muted)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Tabs */}
      <SectionCard className="overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="px-4 pt-4 sm:px-6">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1 sm:w-auto">
              <TabsTrigger value="applications" className="gap-1.5">
                <Icon name="ClipboardList" className="size-3.5" />
                Applications
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[11px]">
                  {applications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5">
                <Icon name="FileSearch" className="size-3.5" />
                Documents to Review
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[11px]">
                  {documents.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="partner-emails" className="gap-1.5">
                <Icon name="Mail" className="size-3.5" />
                Partner Email Updates
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[11px]">
                  {partnerEmails.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Applications tab */}
          <TabsContent value="applications" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : applications.length === 0 ? (
              <EmptyState
                icon="ClipboardList"
                title="No applications yet"
                description="Applications submitted by counselors will appear here for tracking."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>App ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => {
                      const priority = PRIORITY_META[app.priority] || PRIORITY_META.NORMAL;
                      const flag = COUNTRY_FLAG[app.country];
                      const deadline = app.deadline ? new Date(app.deadline) : null;
                      const daysLeft = deadline
                        ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        <TableRow key={app.id} className="hover:bg-[var(--alo-brand-light)]/40">
                          <TableCell>
                            <span className="font-mono text-xs font-semibold text-[var(--alo-brand)]">
                              {app.applicationId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {app.student?.fullName || "—"}
                              </span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {app.student?.studentId || ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[180px]">
                            <span className="line-clamp-1 text-sm text-foreground">
                              {app.university}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[160px]">
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {app.course}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-xs font-medium">
                              {flag && (
                                <span className="rounded border border-[var(--alo-brand)]/15 bg-white px-1 py-0.5 text-[11px] font-bold text-[var(--alo-brand)]">
                                  {flag}
                                </span>
                              )}
                              {app.country}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={app.stage} colorMap={STAGE_COLORS} labels={STAGE_LABELS} />
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${priority.cls}`}
                            >
                              {priority.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">
                                {fmtDate(app.deadline)}
                              </span>
                              {daysLeft !== null && daysLeft >= 0 && (
                                <span
                                  className={`text-[11px] font-semibold ${
                                    daysLeft <= 7 ? "text-crm-danger-text" : daysLeft <= 14 ? "text-crm-warning-text" : "text-muted-foreground"
                                  }`}
                                >
                                  {daysLeft}d left
                                </span>
                              )}
                              {daysLeft !== null && daysLeft < 0 && (
                                <span className="text-[11px] font-semibold text-crm-danger-text">Overdue</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewStudent(app)}
                                className="h-8 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                              >
                                <Icon name="User" className="size-3.5" />
                                <span className="hidden sm:inline">View Student</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStage(app)}
                                className="h-8 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
                              >
                                <Icon name="GitCommitHorizontal" className="size-3.5" />
                                <span className="hidden sm:inline">Update Stage</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Documents tab */}
          <TabsContent value="documents" className="p-4 pt-4 sm:px-6">
            {!loading && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/50 px-3 py-2.5 text-xs text-[var(--alo-brand)]">
                <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Application team can <strong>review</strong>, <strong>approve</strong>, and <strong>reject</strong> documents.{" "}
                  Counselors cannot delete documents by default — deletion requires Admin permission and is audit-logged.
                </p>
              </div>
            )}
            {loading ? (
              <LoadingGrid count={4} />
            ) : documents.length === 0 ? (
              <EmptyState
                icon="FileCheck"
                title="No documents awaiting review"
                description="Documents uploaded by students will appear here for verification."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Document name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-[var(--alo-brand-light)]/40">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {doc.student?.fullName || "—"}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {doc.student?.studentId || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon name="FileText" className="size-4 text-[var(--alo-brand)]" />
                            <span className="text-sm font-medium text-foreground">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {DOC_CATEGORY_LABEL[doc.category] || doc.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={doc.status} colorMap={DOC_STATUS_COLORS} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs text-foreground">{fmtDate(doc.uploadedAt)}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {doc.uploadedAt ? timeAgo(doc.uploadedAt) : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewDoc(doc)}
                              className="h-8 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                            >
                              <Icon name="Eye" className="size-3.5" />
                              <span className="hidden md:inline">Review</span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveDoc(doc)}
                              className="h-8 bg-[var(--alo-success-dark)] text-white hover:bg-[var(--alo-success-dark)]/90"
                            >
                              <Icon name="Check" className="size-3.5" />
                              <span className="hidden md:inline">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReject(doc)}
                              className="h-8 border-crm-danger-border text-crm-danger-text hover:bg-crm-danger-bg"
                            >
                              <Icon name="X" className="size-3.5" />
                              <span className="hidden md:inline">Reject</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Partner emails tab */}
          <TabsContent value="partner-emails" className="p-4 pt-4 sm:px-6">
            {!loading && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-crm-warning-border bg-crm-warning-bg px-3 py-2.5 text-xs text-crm-warning-text">
                <Icon name="Lock" className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Application team can see the <strong>submission channel</strong> (direct, partner, provider).{" "}
                  Commission amount is <strong>NOT visible</strong> unless Finance permission exists.
                </p>
              </div>
            )}
            {loading ? (
              <LoadingGrid count={3} />
            ) : partnerEmails.length === 0 ? (
              <EmptyState
                icon="MailOpen"
                title="No pending partner emails"
                description="Partner submission updates will appear here for matching to students."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {partnerEmails.map((email) => (
                  <Card
                    key={email.id}
                    className="rounded-2xl border-2 border-[var(--alo-brand)]/15 transition-colors hover:border-[var(--alo-brand)]/40"
                  >
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                            <Icon name="Handshake" className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{email.partnerName}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {email.partnerEmail || "no-reply@partner.com"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          status={email.status}
                          colorMap={{
                            PENDING: "bg-crm-warning-bg text-crm-warning-text",
                            REVIEWED: "bg-sky-100 text-sky-700",
                            SENT_TO_STUDENT: "bg-crm-success-bg text-crm-success-text",
                            ARCHIVED: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
                          }}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground">{email.subject}</p>
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                          {email.body}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="User" className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Student match:</span>
                          <span className="font-mono font-semibold text-[var(--alo-brand)]">
                            {email.studentId || "Unmatched"}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="Clock" className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{timeAgo(email.receivedAt)}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewPartnerEmail(email)}
                          className="h-8 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                        >
                          <Icon name="Eye" className="size-3.5" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateStudentMessage(email)}
                          className="h-8 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                        >
                          <Icon name="Sparkles" className="size-3.5" />
                          Generate Student-Facing Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      {/* Submission workflow note */}
      <SectionCard
        title="Submission workflow"
        icon="Workflow"
        description="How ALO submits applications and tracks partner involvement."
      >
        <p className="text-sm text-muted-foreground">
          ALO may apply to universities <strong>directly</strong> or through <strong>B2B partners / providers</strong>. The application team tracks the
          following channels for every application:
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {SUBMISSION_CHANNELS.map((ch) => (
            <div
              key={ch.key}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                <Icon name={ch.icon} className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">{ch.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{ch.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-crm-warning-border bg-crm-warning-bg px-3 py-2 text-xs text-crm-warning-text">
          <Icon name="Info" className="mt-0.5 size-3.5 shrink-0" />
          <p>
            <strong>Commission expected</strong> from partner submissions is visible only to users with Finance permission. Application team can see
            whether a commission applies, but not the amount.
          </p>
        </div>
      </SectionCard>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--alo-brand)]">Reject document</DialogTitle>
            <DialogDescription>
              {rejectTarget?.name} — {rejectTarget?.student?.fullName || "student"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Reason for rejection (visible to student)
              </Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Document is blurry, please re-upload a clear scan."
                rows={4}
                className="resize-none border-[var(--alo-brand)]/20"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-crm-warning-border bg-crm-warning-bg px-3 py-2 text-xs text-crm-warning-text">
              <Icon name="History" className="size-3.5 shrink-0" />
              This rejection will be audit-logged and the student will be notified to re-upload.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
 onClick={submitReject}
 className=" bg-[var(--alo-error)] text-white hover:bg-[var(--alo-error)]/90"
 >
              <Icon name="X" className="size-4" />
              Reject document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ApplicationTeamDashboard;
