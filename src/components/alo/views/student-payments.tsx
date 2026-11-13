"use client";

import * as React from "react";
import { useStudentId } from "@/hooks/use-student-id";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";

type Payment = {
  id: string;
  paymentId?: string;
  studentId?: string;
  type?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: string;
  createdAt?: string;
};

const TYPE_LABELS: Record<string, string> = {
  APPLICATION_FEE: "Application Fee",
  DEPOSIT: "Tuition Deposit",
  TUITION: "Tuition",
  SERVICE_CHARGE: "Service Charge",
  MOCK_TEST: "Mock Test",
  COMMISSION: "Commission",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-crm-warning-bg text-crm-warning-text",
  PAID: "bg-crm-success-bg text-crm-success-text",
  REFUNDED: "bg-crm-warning-bg text-crm-warning-text",
};

export function StudentPayments() {
  const { studentId } = useStudentId();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/finance?studentId=${studentId || ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const all: Payment[] = d.recentPayments || [];
        setPayments(all.filter((p) => p.studentId === studentId));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="Payments"
          subtitle="Track invoices, payments, and outstanding balances"
          icon="CreditCard"
        />
        <EmptyState
          icon="LogIn"
          title="Please log in"
          description="Sign in to your student account to view your payment history."
        />
      </div>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalRefunded = payments
    .filter((p) => p.status === "REFUNDED")
    .reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Payments"
        subtitle="Track invoices, payments, and outstanding balances"
        icon="CreditCard"
      />

      {loading ? (
        <div className="text-center text-[var(--alo-text-muted)]">Loading...</div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon="CreditCard"
          title="No payments yet"
          description="Your invoices and payment history will appear here once your counselor adds them."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Paid"
              value={`${totalPaid.toLocaleString()} BDT`}
              icon="CheckCircle2"
              accent="emerald"
            />
            <StatCard
              label="Outstanding"
              value={`${totalPending.toLocaleString()} BDT`}
              icon="Clock"
              accent="amber"
              hint="Pending payments"
            />
            <StatCard
              label="Refunded"
              value={`${totalRefunded.toLocaleString()} BDT`}
              icon="RotateCcw"
              accent="violet"
            />
            <StatCard
              label="Total Transactions"
              value={payments.length}
              icon="ReceiptText"
              accent="blue"
            />
          </div>

          <Card className="rounded-2xl border border-[var(--alo-brand-border)] bg-white">
            <CardContent className="p-0">
              <div className="border-b border-[var(--alo-brand-border)] px-5 py-4">
                <h3 className="font-bold text-[var(--alo-text)]">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--alo-page)] text-left text-[var(--alo-text-muted)]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Invoice ID</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Method</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--alo-brand-border)]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--alo-page)]">
                        <td className="px-5 py-3 font-mono text-[var(--alo-text)]">{p.paymentId}</td>
                        <td className="px-5 py-3 text-[var(--alo-text)]">
                          {p.type ? TYPE_LABELS[p.type] || p.type : "—"}
                        </td>
                        <td className="px-5 py-3 font-semibold text-[var(--alo-text)]">
                          {(p.amount || 0).toLocaleString()} {p.currency || "BDT"}
                        </td>
                        <td className="px-5 py-3 text-[var(--alo-text-muted)]">{p.method || "—"}</td>
                        <td className="px-5 py-3 text-[var(--alo-text-muted)]">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge className={cn(STATUS_COLORS[p.status || ""] || "bg-[var(--alo-surface-muted)]")}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default StudentPayments;
