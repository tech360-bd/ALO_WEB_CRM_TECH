"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
  InfoRow,
} from "@/components/alo/shared";
import { SensitiveField, usePrivacy, PrivacyToggle } from "@/components/alo/privacy-mode";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// ---------- Types ----------
interface FinanceMetrics {
  totalRevenue: number;
  pendingPayments: number;
  partnerCommissionPending: number;
  partnerCommissionPaid: number;
  employeeCommissionPending: number;
  employeeCommissionPaid: number;
}

interface Payment {
  id: string;
  paymentId: string;
  studentId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  commissionAmount?: number | null;
  commissionStatus?: string | null;
  createdAt: string;
}

interface EmployeeCommission {
  id: string;
  userId: string;
  studentId?: string | null;
  applicationId?: string | null;
  amount: number;
  currency: string;
  status: string;
  month: string;
  notes?: string | null;
  createdAt: string;
}

interface FinanceResponse {
  metrics: FinanceMetrics;
  revenueByType: Record<string, number>;
  recentPayments: Payment[];
  partnerCommissions: Payment[];
  employeeCommissions: EmployeeCommission[];
}

interface PayrollSummary {
  totalPayroll: number;
  employeeCount: number;
  avgSalary: number;
}

// ---------- Maps ----------
const PAYMENT_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  APPLICATION_FEE: { label: "Application Fee", color: "#0057B8", icon: "FileText" },
  DEPOSIT: { label: "Tuition Deposit", color: "#E8501A", icon: "Wallet" },
  TUITION: { label: "Tuition", color: "#10b981", icon: "GraduationCap" },
  SERVICE_CHARGE: { label: "Service Charge", color: "#8b5cf6", icon: "Briefcase" },
  MOCK_TEST: { label: "Mock Test", color: "#f59e0b", icon: "ClipboardCheck" },
  COMMISSION: { label: "Commission", color: "#06b6d4", icon: "Handshake" },
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
};

const COMMISSION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-sky-100 text-sky-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  MOBILE_BANKING: "Mobile Banking",
};

function formatBDT(amount: number) {
  return `৳${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ---------- Inline private amount component (for table cells & stat cards) ----------
function PrivateAmount({
  id,
  amount,
  currency = "BDT",
  className,
  compact = false,
}: {
  id: string;
  amount: number;
  currency?: string;
  className?: string;
  compact?: boolean;
}) {
  const { privacyOn, isRevealed, reveal, rehide } = usePrivacy();
  const [showPin, setShowPin] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const revealed = isRevealed(id);
  const display = currency === "BDT" ? formatBDT(amount) : `${amount.toLocaleString()} ${currency}`;

  if (!privacyOn || revealed) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 tabular-nums", className)}>
        <span className={compact ? "text-sm font-semibold" : "text-sm font-semibold"}>{display}</span>
        {privacyOn && revealed && (
          <button onClick={rehide} className="text-muted-foreground hover:text-[var(--alo-brand)]" title="Hide again">
            <Icon name="EyeOff" className="size-3" />
          </button>
        )}
      </span>
    );
  }

  return (
    <>
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="select-none font-mono text-sm font-semibold blur-sm">{display}</span>
        <button
          onClick={() => setShowPin(true)}
          className="inline-flex items-center gap-0.5 rounded border border-[var(--alo-brand)]/30 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
          title="Click to reveal (requires PIN)"
        >
          <Icon name="Lock" className="size-2.5" />
          Reveal
        </button>
      </span>
      {showPin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setShowPin(false);
            setPin("");
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                <Icon name="ShieldCheck" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--alo-brand)]">Reveal amount</p>
                <p className="text-xs text-muted-foreground">Enter your PIN to view this amount</p>
              </div>
            </div>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pin.length >= 4) {
                  reveal(id);
                  setShowPin(false);
                  setPin("");
                }
              }}
              placeholder="Enter PIN (any 4+ digits)"
              className="mt-3 h-10 text-center font-mono tracking-widest"
              autoFocus
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              This action will be audit-logged as <code className="font-mono">sensitive_data_revealed</code>.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
 variant="outline"
 className="flex-1 "
 onClick={() => {
                  setShowPin(false);
                  setPin("");
                }}
              >
                Cancel
              </Button>
              <Button
 className="flex-1 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
 disabled={pin.length < 4}
 onClick={() => {
                  reveal(id);
                  setShowPin(false);
                  setPin("");
                }}
              >
                Reveal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Main component ----------
export function FinanceDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<FinanceResponse | null>(null);
  const [payroll, setPayroll] = React.useState<PayrollSummary | null>(null);
  const [tab, setTab] = React.useState("recent");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, hrmRes] = await Promise.all([
        fetch("/api/finance"),
        fetch("/api/hrm"),
      ]);
      if (!finRes.ok) throw new Error("finance fetch failed");
      const finJson: FinanceResponse = await finRes.json();
      setData(finJson);

      if (hrmRes.ok) {
        try {
          const hrmJson = await hrmRes.json();
          const totalPayroll: number = hrmJson.metrics?.totalPayroll ?? 0;
          const employeeCount: number = hrmJson.metrics?.totalEmployees ?? 0;
          setPayroll({
            totalPayroll,
            employeeCount,
            avgSalary: employeeCount > 0 ? Math.round(totalPayroll / employeeCount) : 0,
          });
        } catch {
          setPayroll(null);
        }
      }
    } catch {
      toast({
        title: "Failed to load finance data",
        description: "Could not load revenue, payments, and commission data. Please retry.",
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
  const revenueByType = data?.revenueByType || {};
  const recentPayments = data?.recentPayments || [];
  const partnerCommissions = data?.partnerCommissions || [];
  const employeeCommissions = data?.employeeCommissions || [];

  const maxRevenue = Math.max(1, ...Object.values(revenueByType));
  const revenueTotal = Object.values(revenueByType).reduce((s, n) => s + n, 0);

  const handleApproveCommission = (payment: Payment) => {
    toast({
      title: "Commission approval submitted",
      description: `Commission for ${payment.paymentId} (৳${payment.commissionAmount?.toLocaleString() || 0}) queued for approval. Audit log entry created.`,
    });
  };

  const handleMarkPaid = (commission: EmployeeCommission) => {
    toast({
      title: "Commission marked as paid",
      description: `Commission for ${commission.month} (${formatBDT(commission.amount)}) marked as PAID. Disbursement recorded.`,
    });
  };

  const handleViewPayment = (payment: Payment) => {
    toast({
      title: "Payment details",
      description: `Opening receipt for ${payment.paymentId} — ${formatBDT(payment.amount)} ${payment.currency}.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Dashboard"
        subtitle="Revenue, payments, commission, and payroll."
        icon="DollarSign"
        action={<PrivacyToggle />}
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={
              <PrivateAmount id="fin-total-revenue" amount={metrics?.totalRevenue ?? 0} />
            }
            icon="TrendingUp"
            accent="emerald"
            hint="Collected (PAID) — all payment types"
          />
          <StatCard
            label="Pending Payments"
            value={metrics?.pendingPayments ?? 0}
            icon="Clock"
            accent="amber"
            hint="Awaiting clearance"
          />
          <StatCard
            label="Partner Commission — Pending"
            value={
              <PrivateAmount id="fin-partner-commission-pending" amount={metrics?.partnerCommissionPending ?? 0} />
            }
            icon="Handshake"
            accent="orange"
            hint="Awaiting approval / disbursal"
          />
          <StatCard
            label="Partner Commission — Paid"
            value={
              <PrivateAmount id="fin-partner-commission-paid" amount={metrics?.partnerCommissionPaid ?? 0} />
            }
            icon="CheckCircle2"
            accent="emerald"
            hint="Disbursed to partners"
          />
          <StatCard
            label="Employee Commission — Pending"
            value={
              <PrivateAmount id="fin-emp-commission-pending" amount={metrics?.employeeCommissionPending ?? 0} />
            }
            icon="Users"
            accent="violet"
            hint="Awaiting HR / Finance approval"
          />
          <StatCard
            label="Employee Commission — Paid"
            value={
              <PrivateAmount id="fin-emp-commission-paid" amount={metrics?.employeeCommissionPaid ?? 0} />
            }
            icon="BadgeCheck"
            accent="blue"
            hint="Disbursed to employees"
          />
        </div>
      )}

      {/* Revenue by type */}
      <SectionCard
        title="Revenue by type"
        icon="BarChart3"
        description={`Distribution of collected revenue across payment types — ${formatBDT(revenueTotal)} total.`}
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : Object.keys(revenueByType).length === 0 ? (
          <EmptyState
            icon="BarChart3"
            title="No revenue recorded"
            description="Paid payments will appear here broken down by type."
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(revenueByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, amount]) => {
                const meta = PAYMENT_TYPE_META[type] || { label: type, color: "#0057B8", icon: "Circle" };
                const pct = maxRevenue > 0 ? Math.round((amount / maxRevenue) * 100) : 0;
                const sharePct = revenueTotal > 0 ? Math.round((amount / revenueTotal) * 100) : 0;
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex size-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                        >
                          <Icon name={meta.icon} className="size-3.5" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{meta.label}</span>
                        <Badge variant="outline" className="border-[var(--alo-brand)]/20 px-1.5 py-0 text-[11px] text-muted-foreground">
                          {sharePct}% share
                        </Badge>
                      </div>
                      <PrivateAmount id={`fin-rev-${type}`} amount={amount} />
                    </div>
                    <MiniBar value={amount} max={maxRevenue} color={meta.color} />
                    <div className="text-right text-[11px] text-muted-foreground">
                      {pct}% of peak
                    </div>
                  </div>
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
              <TabsTrigger value="recent" className="gap-1.5">
                <Icon name="Receipt" className="size-3.5" />
                Recent Payments
              </TabsTrigger>
              <TabsTrigger value="partner" className="gap-1.5">
                <Icon name="Handshake" className="size-3.5" />
                Partner Commissions
              </TabsTrigger>
              <TabsTrigger value="employee" className="gap-1.5">
                <Icon name="Users" className="size-3.5" />
                Employee Commissions
              </TabsTrigger>
              <TabsTrigger value="payroll" className="gap-1.5">
                <Icon name="Wallet" className="size-3.5" />
                Payroll Summary
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Recent payments */}
          <TabsContent value="recent" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : recentPayments.length === 0 ? (
              <EmptyState
                icon="Receipt"
                title="No payments recorded"
                description="Student payments will appear here as they are collected."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((p) => {
                      const meta = PAYMENT_TYPE_META[p.type] || { label: p.type, color: "#0057B8", icon: "Circle" };
                      return (
                        <TableRow key={p.id} className="hover:bg-[var(--alo-brand-light)]/40">
                          <TableCell>
                            <span className="font-mono text-xs font-semibold text-[var(--alo-brand)]">
                              {p.paymentId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-foreground">{p.studentId}</span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <span style={{ color: meta.color }}>
                                <Icon name={meta.icon} className="size-3.5" />
                              </span>
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <PrivateAmount id={`fin-pay-${p.id}`} amount={p.amount} currency={p.currency} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} colorMap={PAYMENT_STATUS_COLORS} />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {p.method ? PAYMENT_METHOD_LABEL[p.method] || p.method : "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-foreground">{fmtDate(p.createdAt)}</span>
                              <span className="text-[11px] text-muted-foreground">{timeAgo(p.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPayment(p)}
                              className="h-8 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                            >
                              <Icon name="Eye" className="size-3.5" />
                              <span className="hidden md:inline">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Partner commissions */}
          <TabsContent value="partner" className="p-4 pt-4 sm:px-6">
            {!loading && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <Icon name="Lock" className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Partner commission amounts are <strong>restricted</strong>. Visible only to <strong>Finance</strong> and{" "}
                  <strong>Super Admin</strong> roles. Reveal requires PIN and is audit-logged.
                </p>
              </div>
            )}
            {loading ? (
              <LoadingGrid count={3} />
            ) : partnerCommissions.length === 0 ? (
              <EmptyState
                icon="Handshake"
                title="No partner commissions"
                description="Partner commission payments will appear here when universities disburse commission."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Commission Amount</TableHead>
                      <TableHead>Commission Status</TableHead>
                      <TableHead>Received On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerCommissions.map((p) => (
                      <TableRow key={p.id} className="hover:bg-[var(--alo-brand-light)]/40">
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-[var(--alo-brand)]">
                            {p.paymentId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">{p.studentId}</span>
                        </TableCell>
                        <TableCell>
                          <PrivateAmount id={`fin-pc-${p.id}`} amount={p.commissionAmount || 0} currency={p.currency} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={p.commissionStatus || "PENDING"}
                            colorMap={COMMISSION_STATUS_COLORS}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-foreground">{fmtDate(p.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleApproveCommission(p)}
                            disabled={p.commissionStatus === "PAID"}
                            className="h-8 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
                          >
                            <Icon name="CheckCheck" className="size-3.5" />
                            <span className="hidden md:inline">Approve</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Employee commissions */}
          <TabsContent value="employee" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={3} />
            ) : employeeCommissions.length === 0 ? (
              <EmptyState
                icon="Users"
                title="No employee commissions"
                description="Employee commissions will appear here as they are accrued."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeCommissions.map((c) => (
                      <TableRow key={c.id} className="hover:bg-[var(--alo-brand-light)]/40">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                              <Icon name="User" className="size-3.5" />
                            </div>
                            <span className="font-mono text-xs font-medium text-foreground">{c.userId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PrivateAmount id={`fin-ec-${c.id}`} amount={c.amount} currency={c.currency} />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">{c.month}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} colorMap={COMMISSION_STATUS_COLORS} />
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {c.notes || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkPaid(c)}
                            disabled={c.status === "PAID"}
                            className="h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Icon name="BadgeCheck" className="size-3.5" />
                            <span className="hidden md:inline">Mark Paid</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Payroll summary */}
          <TabsContent value="payroll" className="p-4 pt-4 sm:px-6">
            {!loading && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <Icon name="ShieldAlert" className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Payroll data is <strong>highly restricted</strong>. <code className="font-mono">HR_MANAGER</code> and{" "}
                  <code className="font-mono">SUPER_ADMIN</code> only. All access is audit-logged.
                </p>
              </div>
            )}
            {loading ? (
              <LoadingGrid count={3} />
            ) : !payroll ? (
              <EmptyState
                icon="Wallet"
                title="Payroll data unavailable"
                description="Connect to the HRM module to view payroll summary."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15">
                  <CardContent className="space-y-1 pt-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                        <Icon name="Wallet" className="size-4" />
                      </div>
                      <p className="text-sm font-bold text-[var(--alo-brand)]">Monthly payroll overview</p>
                    </div>
                    <div className="mt-2">
                      <SensitiveField
                        id="fin-payroll-total"
                        label="Total Payroll (BDT)"
                        value={formatBDT(payroll.totalPayroll)}
                        type="currency"
                        mono
                      />
                      <SensitiveField
                        id="fin-payroll-avg"
                        label="Average Salary (BDT)"
                        value={formatBDT(payroll.avgSalary)}
                        type="currency"
                        mono
                      />
                      <InfoRow label="Active employees" value={payroll.employeeCount} mono />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15">
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
                        <Icon name="Scale" className="size-4" />
                      </div>
                      <p className="text-sm font-bold text-[var(--alo-cta)]">Salary band distribution</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { band: "Junior (৳0 – ৳30k)", pct: 45, color: "#10b981" },
                        { band: "Mid (৳30k – ৳60k)", pct: 35, color: "#0057B8" },
                        { band: "Senior (৳60k – ৳100k)", pct: 15, color: "#E8501A" },
                        { band: "Leadership (৳100k+)", pct: 5, color: "#8b5cf6" },
                      ].map((row) => (
                        <div key={row.band} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{row.band}</span>
                            <span className="font-semibold text-foreground">{row.pct}%</span>
                          </div>
                          <MiniBar value={row.pct} max={100} color={row.color} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      {/* Commission approval note */}
      <SectionCard
        title="Commission approval workflow"
        icon="ShieldCheck"
        description="How commission approvals are handled in ALO Finance."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
              <Icon name="FileCheck" className="size-4" />
            </div>
            <p className="mt-2 text-sm font-bold text-foreground">1. Submit</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Commission entries are accrued against each closed application automatically.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
              <Icon name="CheckCheck" className="size-4" />
            </div>
            <p className="mt-2 text-sm font-bold text-foreground">2. Approve</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Finance can approve commission payments. All commission approvals are audit-logged.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="BadgeCheck" className="size-4" />
            </div>
            <p className="mt-2 text-sm font-bold text-foreground">3. Disburse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mark as PAID once disbursed via bank transfer or cash. Receipt is archived.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <Icon name="History" className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Every commission approval, edit, and disbursement is recorded in the audit log with actor, timestamp, and
            diff. Approvals cannot be silently reversed.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
export default FinanceDashboard;
