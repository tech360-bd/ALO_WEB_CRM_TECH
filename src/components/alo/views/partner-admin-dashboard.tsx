"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { SensitiveField, PrivacyToggle } from "@/components/alo/privacy-mode";
import { fmtDate, timeAgo, COUNTRIES, ENGLISH_TESTS, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types — matches the /api/partner-admin/dashboard response shape
// ---------------------------------------------------------------------------

type Partner = {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string | null;
  role: string;
  status?: string;
  partnerCode?: string | null;
  userId?: string | null;
  createdAt?: string;
};

type PartnerUser = {
  id: string;
  partnerId: string;
  role: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  permissions?: string;
  createdAt: string;
};

type StudentRow = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  mobile?: string | null;
  applications?: { id: string; stage: string }[];
  createdAt: string;
};

type LeadRow = {
  id: string;
  leadId?: string;
  fullName: string;
  phone: string;
  preferredCountry?: string | null;
  status: string;
  createdAt: string;
};

type Voucher = {
  id: string;
  voucherCode: string;
  studentId: string;
  partnerId?: string | null;
  testType: string;
  usageLimit: number;
  usedCount: number;
  expiresAt?: string | null;
  status: string;
  createdAt: string;
  student?: { studentId: string; fullName: string; email?: string } | null;
};

type Benefit = {
  id: string;
  studentId: string;
  benefitType: string;
  limitCount: number;
  usedCount: number;
  status: string;
  createdAt: string;
  student?: { studentId: string; fullName: string } | null;
};

type SeatRequest = {
  id: string;
  partnerId: string;
  requestedBy: string;
  currentLimit: number;
  requestedExtraSeats: number;
  reason?: string | null;
  status: string;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  createdAt: string;
};

type SocialAccount = {
  id: string;
  partnerId: string;
  platform: string;
  accountName: string;
  accessTokenMasked?: string | null;
  tokenExpiry?: string | null;
  connectionStatus: string;
  lastSync?: string | null;
  approvedByAlo: boolean;
  status: string;
  createdAt: string;
};

type MarketingRequest = {
  id: string;
  idea: string;
  country?: string | null;
  university?: string | null;
  course?: string | null;
  platform: string;
  approvalStatus: string;
  scheduledAt?: string | null;
  publishedUrl?: string | null;
  createdAt: string;
};

type MarketingQuota = {
  id?: string;
  partnerId: string;
  monthlyImageLimit: number;
  monthlyVideoLimit: number;
  videoDurationLimitSeconds: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
};

type MarketingUsage = {
  id?: string;
  partnerId: string;
  monthYear: string;
  imagesUsed: number;
  videosUsed: number;
  ideasSubmitted: number;
  postsScheduled: number;
  postsPublished: number;
};

type Kpis = {
  totalStudents: number;
  activeApplications: number;
  submittedApplications: number;
  offerReceived: number;
  visaReadyStudents: number;
  pendingDocuments: number;
  availableCounselorSeats: number;
  usedCounselorSeats: number;
  monthlyImageQuotaUsed: number;
  monthlyVideoQuotaUsed: number;
  mockTestVouchersUsed: number;
  interviewPrepUsage: number;
  englishMockVouchersUsed: number;
  pendingAloApprovals: number;
  totalCommission: number;
  pendingCommission: number;
  supportTickets: number;
};

type DashboardData = {
  partner: Partner;
  kpis: Kpis;
  partnerUsers: PartnerUser[];
  students: StudentRow[];
  leads: LeadRow[];
  marketingQuota: MarketingQuota | null;
  marketingUsage: MarketingUsage | null;
  marketingRequests: MarketingRequest[];
  vouchers: Voucher[];
  benefits: Benefit[];
  seatRequests: SeatRequest[];
  socialAccounts: SocialAccount[];
  commission: { total: number; pending: number; items: unknown[] };
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTNER_ROLES = [
  { value: "PARTNER_COUNSELOR", label: "Partner Counselor" },
  { value: "PARTNER_APPLICATION_ASSISTANT", label: "Application Assistant" },
  { value: "PARTNER_MARKETING_ASSISTANT", label: "Marketing Assistant" },
  { value: "PARTNER_DOCUMENT_ASSISTANT", label: "Document Assistant" },
  { value: "PARTNER_VIEWER", label: "Viewer (Read-only)" },
];

const ROLE_LABELS: Record<string, string> = {
  PARTNER_SUPER_ADMIN: "Partner Super Admin",
  PARTNER_COUNSELOR: "Partner Counselor",
  PARTNER_APPLICATION_ASSISTANT: "Application Assistant",
  PARTNER_MARKETING_ASSISTANT: "Marketing Assistant",
  PARTNER_DOCUMENT_ASSISTANT: "Document Assistant",
  PARTNER_VIEWER: "Viewer",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  PARTNER_SUPER_ADMIN: "bg-[#E8501A]/15 text-[#E8501A]",
  PARTNER_COUNSELOR: "bg-[#0057B8]/15 text-[#0057B8]",
  PARTNER_APPLICATION_ASSISTANT: "bg-violet-100 text-violet-700",
  PARTNER_MARKETING_ASSISTANT: "bg-amber-100 text-amber-700",
  PARTNER_DOCUMENT_ASSISTANT: "bg-emerald-100 text-emerald-700",
  PARTNER_VIEWER: "bg-slate-100 text-slate-700",
};

const USER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};

const VOUCHER_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  USED: "bg-slate-100 text-slate-700",
  EXPIRED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const SEAT_REQ_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const SOCIAL_PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
};

const SOCIAL_CONNECTION_COLORS: Record<string, string> = {
  CONNECTED: "bg-emerald-100 text-emerald-700",
  DISCONNECTED: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-rose-100 text-rose-700",
};

const BENEFIT_LABELS: Record<string, string> = {
  UKVI_INTERVIEW_PREP: "UKVI Interview Prep",
  UNIVERSITY_INTERVIEW_PREP: "University Interview Prep",
  ENGLISH_MOCK_TEST: "English Mock Test",
  AI_SPEAKING_PRACTICE: "AI Speaking Practice",
  DOCUMENT_CHECKLIST: "Document Checklist",
  APPLICATION_GUIDANCE: "Application Guidance",
};

const MARKETING_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SCHEDULED: "bg-sky-100 text-sky-700",
  PUBLISHED: "bg-[#0057B8]/15 text-[#0057B8]",
};

const FINAL_STAGES = new Set(["VISA_REFUSED", "ENROLLED", "CANCELLED"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(amount: number, currency = "BDT"): string {
  if (!Number.isFinite(amount)) return "—";
  const symbol = currency === "BDT" ? "৳" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "";
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`;
  return `${symbol}${Math.round(amount)}`;
}

function stageLabel(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function maskToken(token?: string | null): string {
  if (!token) return "••••••••ZD";
  const trimmed = String(token).trim();
  if (trimmed.length <= 4) return `••••••••${trimmed.slice(-2).toUpperCase()}`;
  return `••••••••${trimmed.slice(-2).toUpperCase()}`;
}

function hasActiveApplication(student: StudentRow): boolean {
  if (!student.applications || student.applications.length === 0) return false;
  return student.applications.some((a) => !FINAL_STAGES.has(a.stage));
}

// ---------------------------------------------------------------------------
// Create User Dialog
// ---------------------------------------------------------------------------

function CreateUserDialog({
  partnerId,
  open,
  onOpenChange,
  onCreated,
  onRequestSeats,
}: {
  partnerId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  onRequestSeats: () => void;
}) {
  const { toast } = useToast();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("PARTNER_COUNSELOR");
  const [submitting, setSubmitting] = React.useState(false);
  const [seatError, setSeatError] = React.useState<{ message: string; currentLimit: number; used: number } | null>(null);

  function reset() {
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("PARTNER_COUNSELOR");
    setSeatError(null);
  }

  async function submit() {
    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Missing fields", description: "Full name and email are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setSeatError(null);
    try {
      const res = await fetch(`/api/partner-admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          permissions: [],
          createdBy: partnerId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 403 && json.error === "User seat limit reached") {
          setSeatError({ message: json.message, currentLimit: json.currentLimit, used: json.used });
          toast({ title: "Seat limit reached", description: json.message, variant: "destructive" });
        } else {
          toast({ title: "Couldn't create user", description: json.error || json.message || "Please try again.", variant: "destructive" });
        }
        return;
      }
      toast({ title: "User created", description: `${fullName.trim()} added as ${ROLE_LABELS[role] ?? role}.` });
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Couldn't create user", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
            <Icon name="UserPlus" className="size-5" />
            Create Partner User
          </DialogTitle>
          <DialogDescription>
            Add a new team member to your partner workspace. Seats are limited by your plan.
          </DialogDescription>
        </DialogHeader>

        {seatError ? (
          <div className="space-y-3 rounded-xl border-2 border-rose-200 bg-rose-50/60 p-4">
            <div className="flex items-start gap-2.5">
              <Icon name="AlertTriangle" className="mt-0.5 size-5 shrink-0 text-rose-600" />
              <div>
                <p className="text-sm font-bold text-rose-700">User seat limit reached</p>
                <p className="mt-1 text-xs text-rose-700/90">{seatError.message}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Used <strong className="tabular-nums">{seatError.used}</strong> of{" "}
                  <strong className="tabular-nums">{seatError.currentLimit}</strong> seats.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                onClick={() => { onOpenChange(false); onRequestSeats(); }}>
                <Icon name="Armchair" className="size-4" />
                Request Extra Seats
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cu-fullname">Full Name</Label>
              <Input id="cu-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Nadia Rahman" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-email">Email</Label>
              <Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nadia@partner.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-phone">Phone</Label>
              <Input id="cu-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                The Partner Super Admin seat is reserved (you). New users occupy counselor/assistant seats.
              </p>
            </div>
          </div>
        )}

        {!seatError && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={submitting} onClick={submit}>
              {submitting ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon name="Plus" className="size-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Generate Voucher Dialog
// ---------------------------------------------------------------------------

function GenerateVoucherDialog({
  partnerId,
  students,
  open,
  onOpenChange,
  onGenerated,
}: {
  partnerId: string;
  students: StudentRow[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onGenerated: () => void;
}) {
  const { toast } = useToast();
  const eligibleStudents = students.filter(hasActiveApplication);
  const [studentId, setStudentId] = React.useState("");
  const [testType, setTestType] = React.useState("IELTS");
  const [count, setCount] = React.useState("3");
  const [submitting, setSubmitting] = React.useState(false);
  const [createdVouchers, setCreatedVouchers] = React.useState<Voucher[] | null>(null);

  function reset() {
    setStudentId("");
    setTestType("IELTS");
    setCount("3");
    setCreatedVouchers(null);
  }

  async function submit() {
    if (!studentId) {
      toast({ title: "Select a student", description: "Choose a student with an active ALO application.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/partner-admin/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          partnerId,
          testType,
          count: Number(count) || 3,
          createdBy: partnerId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Couldn't generate vouchers", description: json.error || json.message || "Please try again.", variant: "destructive" });
        return;
      }
      setCreatedVouchers(json.vouchers as Voucher[]);
      toast({ title: "Vouchers generated", description: `${(json.vouchers as Voucher[]).length} mock test vouchers + 6 benefit entitlements unlocked.` });
      onGenerated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Couldn't generate vouchers", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
            <Icon name="Ticket" className="size-5" />
            Generate Mock Test Vouchers
          </DialogTitle>
          <DialogDescription>
            Eligible students only — must have an active ALO application. 3 English mock vouchers + 6 benefit entitlements per student.
          </DialogDescription>
        </DialogHeader>

        {createdVouchers ? (
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-start gap-2.5">
                <Icon name="CheckCircle2" className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Vouchers generated successfully</p>
                  <p className="mt-1 text-xs text-emerald-700/90">
                    Share these codes with your student. They unlock English mock tests, interview prep, speaking practice, and document checklist.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {createdVouchers.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2">
                  <code className="font-mono text-sm font-bold text-[#0057B8]">{v.voucherCode}</code>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{v.testType}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard?.writeText(createdVouchers.map((v) => v.voucherCode).join("\n")); toast({ title: "Codes copied", description: `${createdVouchers.length} voucher codes copied to clipboard.` }); }}>
              <Icon name="Copy" className="size-4" />
              Copy all codes
            </Button>
            <DialogFooter>
              <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90" onClick={() => { reset(); onOpenChange(false); }}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {eligibleStudents.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-4 text-center">
                  <Icon name="AlertCircle" className="mx-auto size-6 text-amber-600" />
                  <p className="mt-2 text-sm font-semibold text-amber-800">No eligible students</p>
                  <p className="mt-1 text-xs text-amber-700/90">
                    Vouchers only available for students with an active ALO application. No application, no voucher.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student with active application" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleStudents.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.fullName} ({s.studentId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENGLISH_TESTS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gv-count">Voucher Count</Label>
                  <Input id="gv-count" type="number" min={1} max={10} value={count} onChange={(e) => setCount(e.target.value)} />
                </div>
              </div>
              <div className="rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5 text-xs text-foreground/80">
                <p className="flex items-start gap-2">
                  <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                  <span>
                    Each eligible student gets <strong>3 English mock vouchers</strong> + 1 interview prep + 1 speaking practice + 1 document checklist + 1 application guidance benefit.
                  </span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={submitting || eligibleStudents.length === 0} onClick={submit}>
                {submitting ? (
                  <>
                    <Icon name="Loader2" className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" className="size-4" />
                    Generate Vouchers
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Request Seat Dialog
// ---------------------------------------------------------------------------

function RequestSeatDialog({
  partnerId,
  currentLimit,
  open,
  onOpenChange,
  onSubmitted,
}: {
  partnerId: string;
  currentLimit: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmitted: () => void;
}) {
  const { toast } = useToast();
  const [extraSeats, setExtraSeats] = React.useState("2");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    const n = Number(extraSeats);
    if (!Number.isFinite(n) || n < 1) {
      toast({ title: "Invalid seat count", description: "Request at least 1 extra seat.", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "Tell ALO Super Admin why you need more seats.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/partner-admin/seat-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          requestedBy: partnerId,
          currentLimit,
          requestedExtraSeats: n,
          reason: reason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Couldn't submit request", description: json.error || json.message || "Please try again.", variant: "destructive" });
        return;
      }
      toast({ title: "Request submitted", description: json.message || "ALO Super Admin will review your seat request." });
      setExtraSeats("2");
      setReason("");
      onOpenChange(false);
      onSubmitted();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Couldn't submit request", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
            <Icon name="Armchair" className="size-5" />
            Request Extra Seats
          </DialogTitle>
          <DialogDescription>
            Submit a seat expansion request to ALO Education Super Admin for review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rs-current">Current Limit</Label>
              <Input id="rs-current" value={currentLimit} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-extra">Extra Seats Requested</Label>
              <Input id="rs-extra" type="number" min={1} max={50} value={extraSeats} onChange={(e) => setExtraSeats(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rs-reason">Reason</Label>
            <Textarea
              id="rs-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. We are scaling our counseling team for September intake and need 2 more counselor seats to handle the lead volume."
            />
          </div>
          <div className="rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5 text-xs text-foreground/80">
            <p className="flex items-start gap-2">
              <Icon name="Clock" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
              <span>ALO Super Admin will review and approve/reject your request. New seats become available immediately upon approval.</span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={submitting} onClick={submit}>
            {submitting ? (
              <>
                <Icon name="Loader2" className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Icon name="Send" className="size-4" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PartnerAdminDashboard() {
  const { toast } = useToast();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("users");
  const [createUserOpen, setCreateUserOpen] = React.useState(false);
  const [voucherOpen, setVoucherOpen] = React.useState(false);
  const [seatOpen, setSeatOpen] = React.useState(false);
  const [actingUser, setActingUser] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner-admin/dashboard`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      toast({ title: "Couldn't load dashboard", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  const partner = data?.partner;
  const partnerId = partner?.id ?? "";
  const kpis = data?.kpis;
  const partnerUsers = data?.partnerUsers ?? [];
  const students = data?.students ?? [];
  const leads = data?.leads ?? [];
  const vouchers = data?.vouchers ?? [];
  const benefits = data?.benefits ?? [];
  const seatRequests = data?.seatRequests ?? [];
  const socialAccounts = data?.socialAccounts ?? [];
  const marketingRequests = data?.marketingRequests ?? [];
  const marketingQuota = data?.marketingQuota;
  const marketingUsage = data?.marketingUsage;

  const usedSeats = kpis?.usedCounselorSeats ?? 0;
  const availableSeats = kpis?.availableCounselorSeats ?? 0;
  const maxSeats = usedSeats + availableSeats;
  const seatPct = maxSeats > 0 ? Math.round((usedSeats / maxSeats) * 100) : 0;

  const imageLimit = marketingQuota?.monthlyImageLimit ?? 15;
  const videoLimit = marketingQuota?.monthlyVideoLimit ?? 10;
  const imagesUsed = marketingUsage?.imagesUsed ?? kpis?.monthlyImageQuotaUsed ?? 0;
  const videosUsed = marketingUsage?.videosUsed ?? kpis?.monthlyVideoQuotaUsed ?? 0;

  const voucherSummary = {
    total: vouchers.length,
    available: vouchers.filter((v) => v.status === "AVAILABLE").length,
    used: vouchers.filter((v) => v.status === "USED").length,
    expired: vouchers.filter((v) => v.status === "EXPIRED").length,
  };

  // --- Actions ---
  async function toggleUserStatus(u: PartnerUser) {
    setActingUser(u.id);
    const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/partner-admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: next === "ACTIVE" ? "User activated" : "User suspended",
        description: `${u.fullName} is now ${next.toLowerCase()}.`,
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    } finally {
      setActingUser(null);
    }
  }

  async function redeemVoucher(v: Voucher) {
    try {
      const res = await fetch(`/api/partner-admin/vouchers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: v.voucherCode, usedBy: partnerId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Couldn't use voucher", description: json.error || "Please try again.", variant: "destructive" });
        return;
      }
      toast({ title: "Voucher redeemed", description: json.message || `Voucher ${v.voucherCode} marked as used.` });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Couldn't use voucher", description: msg, variant: "destructive" });
    }
  }

  async function reviewSeatRequest(r: SeatRequest, status: "APPROVED" | "REJECTED") {
    const reviewNote = status === "APPROVED"
      ? "Approved — extra seats now available for user creation."
      : "Rejected — please contact ALO Super Admin for details.";
    try {
      const res = await fetch(`/api/partner-admin/seat-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, status, reviewedBy: partnerId, reviewNote }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Review failed", description: json.error || "Please try again.", variant: "destructive" });
        return;
      }
      toast({ title: `Seat request ${status.toLowerCase()}`, description: json.message });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Review failed", description: msg, variant: "destructive" });
    }
  }

  function openMarketingStudio() {
    window.dispatchEvent(new CustomEvent("alo-navigate", { detail: { view: "partner-marketing-studio" as ViewKey } }));
  }

  function openCreateUser() { setCreateUserOpen(true); }
  function openVoucherDialog() { setVoucherOpen(true); }
  function openSeatDialog() { setSeatOpen(true); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Admin Dashboard"
        icon="Building"
        subtitle="Manage your company users, students, marketing quota, and vouchers."
        action={<PrivacyToggle />}
      />

      {/* KPI grid */}
      {loading ? (
        <LoadingGrid count={8} />
      ) : kpis ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Students" value={kpis.totalStudents} icon="Users" accent="blue" />
          <StatCard label="Active Applications" value={kpis.activeApplications} icon="ClipboardList" accent="orange" />
          <StatCard label="Submitted Apps" value={kpis.submittedApplications} icon="Send" accent="violet" />
          <StatCard label="Offer Received" value={kpis.offerReceived} icon="Trophy" accent="emerald" />
          <StatCard label="Visa-Ready Students" value={kpis.visaReadyStudents} icon="Plane" accent="blue" />
          <StatCard label="Pending Documents" value={kpis.pendingDocuments} icon="FileWarning" accent="amber" />
          <StatCard label="Available Seats" value={kpis.availableCounselorSeats} icon="UserPlus" accent="emerald" hint="Counselor seats open" />
          <StatCard label="Used Seats" value={kpis.usedCounselorSeats} icon="UserCheck" accent="orange" hint="Counselor seats filled" />
          <StatCard label="Image Quota Used" value={`${kpis.monthlyImageQuotaUsed}/${imageLimit}`} icon="Image" accent="violet" hint="This month" />
          <StatCard label="Video Quota Used" value={`${kpis.monthlyVideoQuotaUsed}/${videoLimit}`} icon="Video" accent="rose" hint="This month" />
          <StatCard label="Mock Test Vouchers Used" value={kpis.mockTestVouchersUsed} icon="Ticket" accent="blue" />
          <StatCard label="Interview Prep Usage" value={kpis.interviewPrepUsage} icon="Mic" accent="amber" />
          <StatCard label="English Mock Vouchers" value={kpis.englishMockVouchersUsed} icon="GraduationCap" accent="emerald" />
          <StatCard label="Pending ALO Approvals" value={kpis.pendingAloApprovals} icon="Clock" accent="rose" />
          <Card className="relative overflow-hidden rounded-2xl border-2 border-[#0057B8]/20">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Commission</p>
                  <div className="mt-1.5">
                    <SensitiveField id="kpi-comm-total" label="Total" type="currency" value={fmtCurrency(kpis.totalCommission)} />
                  </div>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon name="DollarSign" className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden rounded-2xl border-2 border-[#0057B8]/20">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending Commission</p>
                  <div className="mt-1.5">
                    <SensitiveField id="kpi-comm-pending" label="Pending" type="currency" value={fmtCurrency(kpis.pendingCommission)} />
                  </div>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Icon name="Wallet" className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <StatCard label="Support Tickets" value={kpis.supportTickets} icon="LifeBuoy" accent="rose" hint="Open with ALO Support" />
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="users" className="gap-1.5">
              <Icon name="Users" className="size-4" />
              Users & Seats
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5">
              <Icon name="GraduationCap" className="size-4" />
              Students & Leads
            </TabsTrigger>
            <TabsTrigger value="marketing" className="gap-1.5">
              <Icon name="Megaphone" className="size-4" />
              Marketing Quota
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="gap-1.5">
              <Icon name="Ticket" className="size-4" />
              Vouchers & Benefits
            </TabsTrigger>
            <TabsTrigger value="seats" className="gap-1.5">
              <Icon name="Armchair" className="size-4" />
              Seat Requests
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5">
              <Icon name="Share2" className="size-4" />
              Social Accounts
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* USERS & SEATS */}
        <TabsContent value="users" className="mt-4 space-y-4">
          {loading ? <LoadingGrid count={4} /> : (
            <>
              <SectionCard
                title="Counselor Seat Usage"
                description="Default limit: 1 Partner Super Admin + 2 Partner Employees = 3"
                icon="Armchair"
                action={
                  <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openCreateUser}>
                    <Icon name="UserPlus" className="size-4" />
                    Create User
                  </Button>
                }>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Available Seats</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{availableSeats}</p>
                  </div>
                  <div className="rounded-xl border-2 border-[#E8501A]/30 bg-[#fdece4]/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Used Seats</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#E8501A]">{usedSeats}</p>
                  </div>
                  <div className="rounded-xl border-2 border-[#0057B8]/20 bg-[#e8f0fb]/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Max Seats</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#0057B8]">{maxSeats}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Seat utilisation</span>
                    <span className="font-semibold text-foreground">{usedSeats}/{maxSeats} ({seatPct}%)</span>
                  </div>
                  <Progress value={seatPct} className="h-2.5" />
                  <p className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                    <span>Default limit: <strong>1 Partner Super Admin + 2 Partner Employees = 3</strong>. Request extra seats if needed.</span>
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                title="Partner Users"
                description={`${partnerUsers.length} user${partnerUsers.length === 1 ? "" : "s"} on your partner workspace`}
                icon="Users"
                action={
                  <Button variant="outline" size="sm" onClick={load}>
                    <Icon name="RefreshCw" className="size-4" />
                    Refresh
                  </Button>
                }>
                {partnerUsers.length === 0 ? (
                  <EmptyState
                    icon="Users"
                    title="No team members yet"
                    description="Add counselors, application assistants, marketing assistants, and document assistants to your workspace."
                    action={
                      <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openCreateUser}>
                        <Icon name="UserPlus" className="size-4" />
                        Create First User
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partnerUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.fullName}</TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{u.email}</TableCell>
                            <TableCell>
                              <Badge className={ROLE_BADGE_COLORS[u.role] ?? "bg-slate-100 text-slate-700"}>
                                {ROLE_LABELS[u.role] ?? u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={USER_STATUS_COLORS[u.status] ?? "bg-slate-100 text-slate-700"}>
                                {u.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{fmtDate(u.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {u.status === "ACTIVE" ? "Active" : "Suspended"}
                                </span>
                                <Switch
                                  checked={u.status === "ACTIVE"}
                                  disabled={actingUser === u.id || u.role === "PARTNER_SUPER_ADMIN"}
                                  onCheckedChange={() => toggleUserStatus(u)}
                                  aria-label={`Toggle ${u.fullName} status`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* STUDENTS & LEADS */}
        <TabsContent value="students" className="mt-4 space-y-4">
          {loading ? <LoadingGrid count={4} /> : (
            <>
              <SectionCard
                title="Referred Students"
                description={`${students.length} student${students.length === 1 ? "" : "s"} linked to your partner account`}
                icon="GraduationCap"
              >
                {students.length === 0 ? (
                  <EmptyState
                    icon="GraduationCap"
                    title="No referred students yet"
                    description="Students referred by you will appear here once they convert from leads and complete onboarding."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead className="hidden lg:table-cell">Mobile</TableHead>
                          <TableHead className="text-center">Apps</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => {
                          const stages = (s.applications || []).map((a) => a.stage);
                          const stage = stages.length > 0 ? stages[0] : "COUNSELING";
                          return (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono text-xs font-semibold text-[#0057B8]">{s.studentId}</TableCell>
                              <TableCell className="font-medium">{s.fullName}</TableCell>
                              <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{s.email}</TableCell>
                              <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{s.mobile || "—"}</TableCell>
                              <TableCell className="text-center font-semibold tabular-nums">{s.applications?.length ?? 0}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                                  {stageLabel(stage)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Partner-Referred Leads"
                description={`${leads.length} lead${leads.length === 1 ? "" : "s"} tagged with your partner referral`}
                icon="UserPlus"
              >
                {leads.length === 0 ? (
                  <EmptyState
                    icon="UserPlus"
                    title="No partner-referred leads"
                    description="Leads tagged with your partner referral code will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="hidden md:table-cell">Preferred Country</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="font-mono text-xs font-semibold text-[#0057B8]">{l.leadId || l.id.slice(-6).toUpperCase()}</TableCell>
                            <TableCell className="font-medium">{l.fullName}</TableCell>
                            <TableCell className="text-xs">{l.phone}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                                {l.preferredCountry || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{l.status.toLowerCase()}</Badge>
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{fmtDate(l.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* MARKETING QUOTA */}
        <TabsContent value="marketing" className="mt-4 space-y-4">
          {loading ? <LoadingGrid count={4} /> : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SectionCard title="Image Generation Quota" icon="Image" description="AI marketing visuals">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Used this month</span>
                      <span className="font-bold tabular-nums text-foreground">{imagesUsed}/{imageLimit}</span>
                    </div>
                    <Progress value={imageLimit > 0 ? (imagesUsed / imageLimit) * 100 : 0} className="h-2.5" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Remaining: <strong className="text-foreground">{Math.max(0, imageLimit - imagesUsed)}</strong></span>
                      <span>{imageLimit > 0 ? Math.round((imagesUsed / imageLimit) * 100) : 0}% used</span>
                    </div>
                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Icon name="Sparkles" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                      <span>Each AI image generation consumes 1 image credit. Quota resets on the 1st of each month.</span>
                    </p>
                  </div>
                </SectionCard>

                <SectionCard title="Video Generation Quota" icon="Video" description="30-second AI videos">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Used this month</span>
                      <span className="font-bold tabular-nums text-foreground">{videosUsed}/{videoLimit}</span>
                    </div>
                    <Progress value={videoLimit > 0 ? (videosUsed / videoLimit) * 100 : 0} className="h-2.5" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Remaining: <strong className="text-foreground">{Math.max(0, videoLimit - videosUsed)}</strong></span>
                      <span>{videoLimit > 0 ? Math.round((videosUsed / videoLimit) * 100) : 0}% used</span>
                    </div>
                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Icon name="Clock" className="mt-0.5 size-3.5 shrink-0 text-[#E8501A]" />
                      <span>Max <strong>30 seconds</strong> per video. Each generation consumes 1 video credit.</span>
                    </p>
                  </div>
                </SectionCard>
              </div>

              <SectionCard title="Publishing & Approval" icon="ShieldCheck" description="Compliance status for this partner">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Auto-Publish</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {marketingQuota?.autoPublishAllowed ? "Allowed" : "Disabled"}
                      </p>
                    </div>
                    <Badge className={marketingQuota?.autoPublishAllowed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {marketingQuota?.autoPublishAllowed ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Requires ALO Approval</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {marketingQuota?.requiresAloApproval ? "Yes — Starter plan" : "No — Self-serve"}
                      </p>
                    </div>
                    <Badge className={marketingQuota?.requiresAloApproval ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                      {marketingQuota?.requiresAloApproval ? "REQUIRED" : "WAIVED"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openMarketingStudio}>
                    <Icon name="Megaphone" className="size-4" />
                    Open Marketing Studio
                  </Button>
                  <Button variant="outline" className="h-12" onClick={load}>
                    <Icon name="RefreshCw" className="size-4" />
                    Refresh Quota
                  </Button>
                </div>
              </SectionCard>

              <SectionCard
                title="Recent Marketing Requests"
                description={`${marketingRequests.length} request${marketingRequests.length === 1 ? "" : "s"} this period`}
                icon="ListChecks"
              >
                {marketingRequests.length === 0 ? (
                  <EmptyState
                    icon="Megaphone"
                    title="No marketing requests yet"
                    description="Open the Marketing Studio to generate AI-powered campaigns for Facebook, Instagram, and LinkedIn."
                    action={
                      <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openMarketingStudio}>
                        <Icon name="Sparkles" className="size-4" />
                        Open Marketing Studio
                      </Button>
                    }
                  />
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-2">
                      {marketingRequests.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-[#0057B8]/15 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{r.idea}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {r.platform} • {timeAgo(r.createdAt)}
                            </p>
                          </div>
                          <Badge className={MARKETING_STATUS_COLORS[r.approvalStatus] ?? "bg-slate-100 text-slate-700"}>
                            {r.approvalStatus.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* VOUCHERS & BENEFITS */}
        <TabsContent value="vouchers" className="mt-4 space-y-4">
          {loading ? <LoadingGrid count={4} /> : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card className="rounded-2xl border-2 border-[#0057B8]/20">
                  <CardContent className="pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Vouchers</p>
                    <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#0057B8]">{voucherSummary.total}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-2 border-emerald-200">
                  <CardContent className="pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available</p>
                    <p className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-700">{voucherSummary.available}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-2 border-slate-200">
                  <CardContent className="pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Used</p>
                    <p className="mt-1.5 text-2xl font-bold tabular-nums text-slate-700">{voucherSummary.used}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-2 border-rose-200">
                  <CardContent className="pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expired</p>
                    <p className="mt-1.5 text-2xl font-bold tabular-nums text-rose-700">{voucherSummary.expired}</p>
                  </CardContent>
                </Card>
              </div>

              <SectionCard
                title="Mock Test Vouchers"
                description="Voucher codes for English mock tests, interview prep, and speaking practice"
                icon="Ticket"
                action={
                  <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openVoucherDialog}>
                    <Icon name="Sparkles" className="size-4" />
                    Generate Vouchers
                  </Button>
                }>
                {vouchers.length === 0 ? (
                  <EmptyState
                    icon="Ticket"
                    title="No vouchers yet"
                    description="Generate mock test vouchers for students with active ALO applications."
                    action={
                      <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openVoucherDialog}>
                        <Icon name="Sparkles" className="size-4" />
                        Generate First Vouchers
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Voucher Code</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Test Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Expires</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vouchers.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>
                              <code className="font-mono text-xs font-bold text-[#0057B8]">{v.voucherCode}</code>
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.student?.fullName || "—"}
                              {v.student?.studentId && (
                                <span className="ml-1 font-mono text-[10px] text-muted-foreground">({v.student.studentId})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">{v.testType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={VOUCHER_STATUS_COLORS[v.status] ?? "bg-slate-100 text-slate-700"}>
                                {v.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{fmtDate(v.expiresAt)}</TableCell>
                            <TableCell className="text-right">
                              {v.status === "AVAILABLE" ? (
                                <Button size="sm" variant="outline" onClick={() => redeemVoucher(v)}>
                                  <Icon name="CheckCircle2" className="size-3.5" />
                                  Use Voucher
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Student Benefit Entitlements"
                description="Per-student benefit limits and usage"
                icon="Gift"
              >
                {benefits.length === 0 ? (
                  <EmptyState
                    icon="Gift"
                    title="No benefits issued"
                    description="Benefit entitlements are auto-created when you generate vouchers for an eligible student."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Benefit Type</TableHead>
                          <TableHead className="text-center">Limit</TableHead>
                          <TableHead className="text-center">Used</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {benefits.slice(0, 20).map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="text-sm">
                              {b.student?.fullName || "—"}
                              {b.student?.studentId && (
                                <span className="ml-1 font-mono text-[10px] text-muted-foreground">({b.student.studentId})</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-violet-200 text-violet-700">
                                {BENEFIT_LABELS[b.benefitType] ?? b.benefitType.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold tabular-nums">{b.limitCount}</TableCell>
                            <TableCell className="text-center tabular-nums">{b.usedCount}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={b.status === "ACTIVE" ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-600"}>
                                {b.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5 text-xs text-foreground/80">
                  <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                  <p>
                    Vouchers only for students with <strong>active ALO application</strong>. No application, no voucher. Each eligible student gets{" "}
                    <strong>3 English mock vouchers</strong> + 1 interview prep + 1 speaking practice + 1 document checklist + 1 application guidance.
                  </p>
                </div>
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* SEAT REQUESTS */}
        <TabsContent value="seats" className="mt-4 space-y-4">
          {loading ? <LoadingGrid count={4} /> : (
            <>
              <SectionCard
                title="Extra Seat Requests"
                description="Submit expansion requests to ALO Education Super Admin"
                icon="Armchair"
                action={
                  <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openSeatDialog}>
                    <Icon name="Send" className="size-4" />
                    Request Extra Seats
                  </Button>
                }>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border-2 border-[#0057B8]/15 bg-[#e8f0fb]/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Current Limit</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-[#0057B8]">{maxSeats}</p>
                  </div>
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pending Requests</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                      {seatRequests.filter((r) => r.status === "PENDING").length}
                    </p>
                  </div>
                  <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Approved Seats Added</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                      {seatRequests.filter((r) => r.status === "APPROVED").reduce((s, r) => s + r.requestedExtraSeats, 0)}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Request History"
                description={`${seatRequests.length} request${seatRequests.length === 1 ? "" : "s"} submitted`}
                icon="History"
              >
                {seatRequests.length === 0 ? (
                  <EmptyState
                    icon="Armchair"
                    title="No seat requests yet"
                    description="When you need more counselor seats beyond your plan limit, request them here."
                    action={
                      <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={openSeatDialog}>
                        <Icon name="Send" className="size-4" />
                        Request Extra Seats
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">Requested</TableHead>
                          <TableHead className="text-center">Current Limit</TableHead>
                          <TableHead className="hidden md:table-cell">Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Review Note</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seatRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-center font-semibold tabular-nums text-[#E8501A]">+{r.requestedExtraSeats}</TableCell>
                            <TableCell className="text-center tabular-nums">{r.currentLimit}</TableCell>
                            <TableCell className="hidden max-w-[260px] truncate text-xs text-muted-foreground md:table-cell">
                              {r.reason || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className={SEAT_REQ_STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-700"}>
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:table-cell">
                              {r.reviewNote || "—"}
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{fmtDate(r.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              {r.status === "PENDING" ? (
                                <div className="flex justify-end gap-1.5">
                                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={() => reviewSeatRequest(r, "APPROVED")}>
                                    <Icon name="Check" className="size-3.5" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => reviewSeatRequest(r, "REJECTED")}>
                                    <Icon name="X" className="size-3.5" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Reviewed</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5 text-xs text-foreground/80">
                  <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                  <p>
                    Approve/Reject actions are available to <strong>ALO Super Admin</strong>. Approved seats become immediately available for new user creation.
                  </p>
                </div>
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* SOCIAL ACCOUNTS */}
        <TabsContent value="social" className="mt-4 space-y-4">
          {loading ? <LoadingGrid count={4} /> : (
            <>
              <SectionCard
                title="Connected Social Accounts"
                description="Manage Facebook, Instagram, and LinkedIn connections"
                icon="Share2"
                action={
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "OAuth flow", description: "Facebook OAuth flow would start here. Redirect to Meta login." })}>
                      <Icon name="Facebook" className="size-4" />
                      Connect Facebook
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "OAuth flow", description: "Instagram OAuth flow would start here. Redirect to Meta login." })}>
                      <Icon name="Instagram" className="size-4" />
                      Connect Instagram
                    </Button>
                  </div>
                }>
                {socialAccounts.length === 0 ? (
                  <EmptyState
                    icon="Share2"
                    title="No social accounts connected"
                    description="Connect Facebook and Instagram to enable direct publishing from the Marketing Studio."
                    action={
                      <Button className="bg-[#E8501A] text-white hover:bg-[#E8501A]/90 h-12" onClick={() => toast({ title: "OAuth flow", description: "Connect Facebook — OAuth flow would start here." })}>
                        <Icon name="Plus" className="size-4" />
                        Connect a Platform
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Platform</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Connection</TableHead>
                          <TableHead className="hidden md:table-cell">Token</TableHead>
                          <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                          <TableHead className="hidden lg:table-cell">Last Sync</TableHead>
                          <TableHead>ALO Approved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {socialAccounts.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                                {SOCIAL_PLATFORM_LABELS[a.platform] ?? a.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{a.accountName}</TableCell>
                            <TableCell>
                              <Badge className={SOCIAL_CONNECTION_COLORS[a.connectionStatus] ?? "bg-slate-100 text-slate-700"}>
                                {a.connectionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <code className="font-mono text-xs text-muted-foreground">{maskToken(a.accessTokenMasked)}</code>
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{a.tokenExpiry ? fmtDate(a.tokenExpiry) : "—"}</TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{a.lastSync ? timeAgo(a.lastSync) : "—"}</TableCell>
                            <TableCell>
                              {a.approvedByAlo ? (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  <Icon name="Check" className="mr-1 size-3" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700">
                                  <Icon name="Clock" className="mr-1 size-3" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-2.5 text-xs text-rose-800/90">
                  <Icon name="Lock" className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
                  <p>
                    <strong>Tokens are encrypted and masked.</strong> Never shown in full. All token views are audit-logged as <code className="font-mono">sensitive_data_revealed</code>.
                  </p>
                </div>
              </SectionCard>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {partnerId && (
        <>
          <CreateUserDialog
            partnerId={partnerId}
            open={createUserOpen}
            onOpenChange={setCreateUserOpen}
            onCreated={load}
            onRequestSeats={() => { setTab("seats"); setTimeout(openSeatDialog, 200); }}
          />
          <GenerateVoucherDialog
            partnerId={partnerId}
            students={students}
            open={voucherOpen}
            onOpenChange={setVoucherOpen}
            onGenerated={load}
          />
          <RequestSeatDialog
            partnerId={partnerId}
            currentLimit={maxSeats}
            open={seatOpen}
            onOpenChange={setSeatOpen}
            onSubmitted={load}
          />
        </>
      )}
    </div>
  );
}
export default PartnerAdminDashboard;
