"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon, PageHeader, EmptyState, StatCard } from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  APPLICATION_FEE: "Application Fee",
  DEPOSIT: "Tuition Deposit",
  TUITION: "Tuition",
  SERVICE_CHARGE: "Service Charge",
  MOCK_TEST: "Mock Test Fee",
  COMMISSION: "Commission",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-rose-100 text-rose-700",
};

export function CrmInvoices() {
  const { toast } = useToast();
  const [payments, setPayments] = React.useState<any[]>([]);
  const [commissions, setCommissions] = React.useState<any[]>([]);
  const [metrics, setMetrics] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("ALL");

  React.useEffect(() => {
    fetch("/api/finance")
      .then((r) => r.json())
      .then((d) => {
        setPayments(d.recentPayments || []);
        setCommissions(d.partnerCommissions || []);
        setMetrics(d.metrics || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === "ALL" ? payments : payments.filter((p) => p.status === filter);

  const handleDownload = (id: string, paymentId: string) => {
    toast({
      title: "Invoice download started",
      description: `Invoice ${paymentId} will be downloaded shortly.`,
    });
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Invoice Management"
        subtitle="Track invoices, payments received, and commission payouts"
        icon="ReceiptText"
      />

      {loading ? (
        <div className="text-center text-[#5A7299]">Loading...</div>
      ) : (
        <>
          {metrics && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Revenue"
                value={`${metrics.totalRevenue?.toLocaleString() || 0} BDT`}
                icon="TrendingUp"
                accent="emerald"
              />
              <StatCard
                label="Pending Payments"
                value={metrics.pendingPayments || 0}
                icon="Clock"
                accent="amber"
              />
              <StatCard
                label="Partner Commission (Pending)"
                value={`${metrics.partnerCommissionPending?.toLocaleString() || 0} BDT`}
                icon="Handshake"
                accent="orange"
              />
              <StatCard
                label="Employee Commission (Pending)"
                value={`${metrics.employeeCommissionPending?.toLocaleString() || 0} BDT`}
                icon="Users"
                accent="violet"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "PAID", "REFUNDED"].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className={
                  filter === f
                    ? "bg-[#2563EB] text-white"
                    : "border-[#DCE8F5] text-[#5A7299]"
                }
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="ReceiptText"
              title="No invoices"
              description="Invoices will appear here once payments are added."
            />
          ) : (
            <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F7FAFE] text-left text-[#5A7299]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Invoice #</th>
                        <th className="px-5 py-3 font-medium">Student</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Method</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE8F5]">
                      {filtered.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F7FAFE]">
                          <td className="px-5 py-3 font-mono text-[#0B2447]">
                            {p.paymentId}
                          </td>
                          <td className="px-5 py-3 text-[#0B2447]">
                            {p.studentId?.slice(-6) || "—"}
                          </td>
                          <td className="px-5 py-3 text-[#0B2447]">
                            {TYPE_LABELS[p.type] || p.type}
                          </td>
                          <td className="px-5 py-3 font-semibold text-[#0B2447]">
                            {(p.amount || 0).toLocaleString()} {p.currency || "BDT"}
                          </td>
                          <td className="px-5 py-3 text-[#5A7299]">{p.method || "—"}</td>
                          <td className="px-5 py-3 text-[#5A7299]">
                            {new Date(p.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-5 py-3">
                            <Badge className={STATUS_COLORS[p.status] || "bg-slate-100"}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-[#DCE8F5] text-xs text-[#2563EB] hover:bg-[#EAF3FF]"
                              onClick={() => handleDownload(p.id, p.paymentId)}
                            >
                              <Icon name="Download" className="mr-1 size-3" /> Invoice
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {commissions.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-bold text-[#0B2447]">
                Partner Commission Payouts
              </h3>
              <Card className="rounded-2xl border border-[#DCE8F5] bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F7FAFE] text-left text-[#5A7299]">
                        <tr>
                          <th className="px-5 py-3 font-medium">Invoice #</th>
                          <th className="px-5 py-3 font-medium">Commission Amount</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                          <th className="px-5 py-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE8F5]">
                        {commissions.map((c) => (
                          <tr key={c.id} className="hover:bg-[#F7FAFE]">
                            <td className="px-5 py-3 font-mono text-[#0B2447]">
                              {c.paymentId}
                            </td>
                            <td className="px-5 py-3 font-semibold text-[#F97316]">
                              {(c.commissionAmount || 0).toLocaleString()} {c.currency || "BDT"}
                            </td>
                            <td className="px-5 py-3">
                              <Badge
                                className={
                                  c.commissionStatus === "PAID"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : c.commissionStatus === "APPROVED"
                                    ? "bg-[#EAF3FF] text-[#2563EB]"
                                    : "bg-amber-100 text-amber-700"
                                }
                              >
                                {c.commissionStatus || "PENDING"}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-[#5A7299]">
                              {new Date(c.createdAt).toLocaleDateString("en-GB")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default CrmInvoices;
