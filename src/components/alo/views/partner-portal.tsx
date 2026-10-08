"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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
import { SensitiveField, usePrivacy, PrivacyToggle } from "@/components/alo/privacy-mode";
import { fmtDate, timeAgo } from "@/lib/alo-types";
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
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types — matches the /api/partner-portal response shape
// ---------------------------------------------------------------------------

type Partner = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status?: string;
  partnerCode?: string | null;
  createdAt?: string;
};

type StudentRow = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  mobile?: string | null;
  studyDestination?: string | null;
  programTitle?: string | null;
  studyLevel?: string | null;
  applications?: { id: string; stage: string }[];
  createdAt: string;
};

type LeadRow = {
  id: string;
  leadId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  preferredCountry?: string | null;
  preferredCourse?: string | null;
  status: string;
  sourceDetail?: string | null;
  createdAt: string;
};

type CommissionItem = {
  id: string;
  paymentId: string;
  amount: number;
  commissionAmount?: number | null;
  commissionStatus?: string | null;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  student?: { fullName: string; studentId: string } | null;
};

type PartnerData = {
  partner: Partner;
  students: StudentRow[];
  leads: LeadRow[];
  commission: {
    total: number;
    pending: number;
    paid: number;
    items: CommissionItem[];
  };
  metrics: {
    totalReferrals: number;
    activeStudents: number;
    activeApplications: number;
    conversionRate: number;
  };
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-700",
  CONTACTED: "bg-indigo-100 text-indigo-700",
  QUALIFIED: "bg-violet-100 text-violet-700",
  CONVERTED: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
  DUPLICATE: "bg-slate-100 text-slate-600",
};

const COMMISSION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-sky-100 text-sky-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const STUDENT_STAGE_COLORS: Record<string, string> = {
  COUNSELING: "bg-slate-100 text-slate-700",
  APPLICATION_SUBMITTED: "bg-indigo-100 text-indigo-700",
  CONDITIONAL_OFFFER: "bg-violet-100 text-violet-700",
  UNCONDITIONAL_OFFER: "bg-violet-100 text-violet-700",
  CAS_ISSUED: "bg-teal-100 text-teal-700",
  VISA_APPROVED: "bg-emerald-100 text-emerald-700",
  ENROLLED: "bg-emerald-100 text-emerald-700",
};

function stageLabel(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function latestStage(stages: string[]): string {
  if (stages.length === 0) return "COUNSELING";
  return stages[0];
}

function fmtCurrency(amount: number, currency = "BDT"): string {
  if (!Number.isFinite(amount)) return "—";
  const symbol = currency === "BDT" ? "৳" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "";
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${Math.round(amount)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerPortal() {
  const { toast } = useToast();
  const { privacyOn } = usePrivacy();
  const [data, setData] = React.useState<PartnerData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("students");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // No partnerId in query — backend returns first PARTNER user (demo)
      const res = await fetch(`/api/partner-portal`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as PartnerData;
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      toast({
        title: "Couldn’t load partner portal",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const partner = data?.partner;
  const students = data?.students ?? [];
  const leads = data?.leads ?? [];
  const commission = data?.commission;
  const metrics = data?.metrics;

  const handleViewStudent = (s: StudentRow) => {
    toast({
      title: "Opening student record",
      description: `Detailed profile for ${s.fullName} (${s.studentId}) will open in Student 360. Partners have view-only access to referred students.`,
    });
  };

  const handleViewLead = (l: LeadRow) => {
    toast({
      title: "Opening lead record",
      description: `Lead ${l.leadId} — ${l.fullName}. Lead status is managed by your assigned ALO counselor.`,
    });
  };

  const handleExportCommission = () => {
    toast({
      title: "Commission statement queued",
      description: "Your YTD commission statement (PDF) is being generated by the ALO Finance team and will be emailed to you within 24 hours.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Portal"
        icon="Handshake"
        subtitle="Your referrals, applications, and commission — all in one place."
        action={<PrivacyToggle />}
      />

      {/* Partner header card */}
      {loading ? (
        <Card className="rounded-2xl border-2">
          <CardContent className="pt-6">
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      ) : partner ? (
        <Card className="overflow-hidden rounded-2xl border-2 border-[#2563EB]/20 bg-gradient-to-br from-[#e8f0fb]/60 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
                  <span className="text-2xl font-black">{(partner.name || "P").charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#2563EB]">{partner.name}</h2>
                    <Badge className="bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/10">
                      <Icon name="Handshake" className="mr-1 size-3" />
                      Partner
                    </Badge>
                    {partner.status && (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                        <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-500" />
                        {partner.status}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="Mail" className="size-3.5" />
                      {partner.email}
                    </span>
                    {partner.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="Phone" className="size-3.5" />
                        {partner.phone}
                      </span>
                    )}
                    {partner.createdAt && (
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="CalendarDays" className="size-3.5" />
                        Partner since {fmtDate(partner.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-[#2563EB]/15 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total Referrals</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-[#2563EB]">{metrics?.totalReferrals ?? 0}</p>
                </div>
                <div className="rounded-xl border border-[#2563EB]/15 bg-white/80 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Conversion Rate</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-[#2563EB]">{metrics?.conversionRate ?? 0}%</p>
                </div>
                <div className="rounded-xl border border-[#F97316]/20 bg-white/80 px-4 py-3 md:col-span-2 lg:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Active Applications</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-[#F97316]">{metrics?.activeApplications ?? 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats row */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Referrals"
            value={metrics?.totalReferrals ?? 0}
            icon="Users"
            accent="blue"
            hint="All-time referred leads"
          />
          <StatCard
            label="Active Students"
            value={metrics?.activeStudents ?? 0}
            icon="GraduationCap"
            accent="violet"
            hint="Converted to enrollment"
          />
          <StatCard
            label="Active Applications"
            value={metrics?.activeApplications ?? 0}
            icon="ClipboardList"
            accent="orange"
            hint="Across all referred students"
          />
          <StatCard
            label="Conversion Rate"
            value={`${metrics?.conversionRate ?? 0}%`}
            icon="TrendingUp"
            accent="emerald"
            hint="Leads → students"
          />
        </div>
      )}

      {/* Commission card — privacy-protected */}
      {loading ? (
        <Card className="rounded-2xl border-2">
          <CardContent className="pt-6">
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      ) : (
        <SectionCard
          title="Commission Summary"
          description="Private — visible only to you and the ALO Finance team"
          icon="Wallet"
          action={
            <Button variant="outline" size="sm" onClick={handleExportCommission}>
              <Icon name="Download" className="size-4" />
              Export statement
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border-2 border-[#F97316]/20 bg-[#fdece4]/40 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total Commission</p>
              <div className="mt-1">
                <SensitiveField
                  id="comm-total"
                  label="Total"
                  type="currency"
                  value={fmtCurrency(commission?.total ?? 0)}
                />
              </div>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Pending Commission</p>
              <div className="mt-1">
                <SensitiveField
                  id="comm-pending"
                  label="Pending"
                  type="currency"
                  value={fmtCurrency(commission?.pending ?? 0)}
                />
              </div>
            </div>
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Paid Commission</p>
              <div className="mt-1">
                <SensitiveField
                  id="comm-paid"
                  label="Paid"
                  type="currency"
                  value={fmtCurrency(commission?.paid ?? 0)}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#2563EB]/15 bg-[#e8f0fb]/40 px-3 py-2.5 text-xs text-foreground/80">
            <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-[#2563EB]" />
            <p>
              Commission amounts are blurred by default in privacy mode. Click <strong>Reveal</strong> on any field to
              view (PIN required, action is audit-logged). {privacyOn ? "Privacy is currently ON." : "Privacy is OFF."}
            </p>
          </div>
        </SectionCard>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="students" className="gap-1.5">
            <Icon name="GraduationCap" className="size-4" />
            Referred Students
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{students.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5">
            <Icon name="UserPlus" className="size-4" />
            Leads
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{leads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-1.5">
            <Icon name="Receipt" className="size-4" />
            Commission History
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{commission?.items.length ?? 0}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Referred Students tab */}
        <TabsContent value="students" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : students.length === 0 ? (
            <EmptyState
              icon="GraduationCap"
              title="No referred students yet"
              description="Students referred by you will appear here once they convert from leads and complete onboarding."
            />
          ) : (
            <SectionCard
              title="Referred Students"
              description="Students linked to your partner account"
              icon="Users"
              action={
                <Button variant="outline" size="sm" onClick={load}>
                  <Icon name="RefreshCw" className="size-4" />
                  Refresh
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Mobile</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead className="hidden md:table-cell">Program</TableHead>
                      <TableHead className="text-center">Applications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => {
                      const stages = (s.applications || []).map((a) => a.stage);
                      const stage = latestStage(stages);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs font-semibold text-[#2563EB]">{s.studentId}</TableCell>
                          <TableCell className="font-medium">{s.fullName}</TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{s.email}</TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{s.mobile || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#2563EB]/20 text-[#2563EB]">
                              {s.studyDestination || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[200px] truncate text-xs text-muted-foreground md:table-cell">
                            {s.programTitle || s.studyLevel || "—"}
                          </TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">{s.applications?.length ?? 0}</TableCell>
                          <TableCell>
                            <StatusBadge status={stage} colorMap={STUDENT_STAGE_COLORS} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleViewStudent(s)}>
                              <Icon name="Eye" className="size-3.5" />
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* Leads tab */}
        <TabsContent value="leads" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : leads.length === 0 ? (
            <EmptyState
              icon="UserPlus"
              title="No partner-referred leads"
              description="Leads tagged with your partner referral code will appear here. Share your referral link to start capturing leads."
            />
          ) : (
            <SectionCard
              title="Partner-Referred Leads"
              description="Prospects you’ve referred to ALO"
              icon="UserPlus"
            >
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
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs font-semibold text-[#2563EB]">{l.leadId}</TableCell>
                        <TableCell className="font-medium">{l.fullName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {l.preferredCountry ? (
                            <Badge variant="outline" className="border-[#2563EB]/20 text-[#2563EB]">
                              {l.preferredCountry}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={l.status} colorMap={LEAD_STATUS_COLORS} />
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          <span title={fmtDate(l.createdAt)}>{timeAgo(l.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewLead(l)}>
                            <Icon name="Eye" className="size-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* Commission History tab */}
        <TabsContent value="commission" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : !commission || commission.items.length === 0 ? (
            <EmptyState
              icon="Receipt"
              title="No commission payments yet"
              description="Commission is generated when a referred student’s application results in tuition payment. Approved and paid amounts will appear here."
            />
          ) : (
            <SectionCard
              title="Commission Payment History"
              description="All commission transactions linked to your referred students"
              icon="Receipt"
              action={
                <Button variant="outline" size="sm" onClick={handleExportCommission}>
                  <Icon name="Download" className="size-4" />
                  Export
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commission.items.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs font-semibold text-[#2563EB]">{p.paymentId}</TableCell>
                        <TableCell className="font-medium">
                          {p.student?.fullName || "—"}
                          {p.student?.studentId && (
                            <span className="ml-1 font-mono text-[10px] text-muted-foreground">({p.student.studentId})</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {p.type.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {fmtCurrency(p.amount, p.currency)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {privacyOn ? (
                            <span className="select-none rounded bg-muted px-2 py-0.5 font-mono text-muted-foreground/60 blur-sm">
                              {fmtCurrency(p.commissionAmount || 0, p.currency)}
                            </span>
                          ) : (
                            fmtCurrency(p.commissionAmount || 0, p.currency)
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={p.commissionStatus || "PENDING"}
                            colorMap={COMMISSION_STATUS_COLORS}
                          />
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell text-right">
                          {fmtDate(p.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <Icon name="Lock" className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Commission amounts are private and visible only to you and the ALO Finance team. Per-row commission
                  is blurred while privacy mode is ON. Use <strong>Reveal</strong> in the summary card above to unmask
                  totals (PIN required, audit-logged).
                </p>
              </div>
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Partner data note */}
      <Card className="rounded-2xl border-2 border-[#2563EB]/15 bg-[#e8f0fb]/30">
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <Icon name="ShieldCheck" className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[#2563EB]">Data access & privacy</p>
            <p className="mt-1 text-foreground/80">
              Partners can only see their own referred students. Student data is unified — the same profile appears in
              Student Portal, Counselor Portal, and Partner Portal based on permission. Any access to commission
              amounts is audit-logged for compliance. Questions about a payment? Email{" "}
              <span className="font-medium text-[#2563EB]">finance@alo-education.com</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default PartnerPortal;
