'use client';

import React, { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { loadPaymentHistory, paymentAmount, type StudentPayment } from '@/lib/student/payment-history';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Building2,
  GraduationCap,
  Plane,
  FileCheck,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Receipt,
} from 'lucide-react';

type PaymentStatus = string;

/* ================================================================== */
/*  STATUS HELPERS                                                     */
/* ================================================================== */
function getStatusIcon(status: PaymentStatus) {
  switch (status) {
    case 'paid': return <CheckCircle2 className="size-4 text-crm-success" />;
    case 'pending': return <Clock className="size-4 text-crm-warning" />;
    case 'overdue': return <AlertCircle className="size-4 text-crm-danger" />;
  }
}

function getStatusBadge(status: PaymentStatus) {
  switch (status) {
    case 'paid': return 'success' as const;
    case 'pending': return 'warning' as const;
    case 'overdue': return 'danger' as const;
  }
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export default function StudentPayments() {
  const { user, token, setView } = usePortalStore();
  const [history, setHistory] = useState<{ payments: StudentPayment[]; total: number; totalPages: number; owner: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const owner = `${user?.id || ''}:${token || ''}:${page}`;
  useEffect(() => {
    const controller = new AbortController();
    setHistory(null); setLoading(true); setError('');
    loadPaymentHistory(token, page, controller.signal).then(data => {
      if (!controller.signal.aborted) setHistory({ payments: data.data, total: data.total, totalPages: data.totalPages, owner });
    }).catch(() => {
      if (!controller.signal.aborted) setError('Payment history is unavailable. Please try again.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, page, retry, owner]);
  const visible = history?.owner === owner ? history : null;
  const payments = visible?.payments || [];

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/*  HEADER                                                       */}
      {/* ============================================================ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-alo-text sm:text-3xl">
          Payments &amp; Deposit Guide
        </h1>
        <p className="mt-1 text-sm text-alo-text-muted">
          Understand your payment obligations and track status
        </p>
      </div>

      {/* ============================================================ */}
      {/*  INFO BANNER                                                  */}
      {/* ============================================================ */}
      <Alert className="border-alo-brand/20 bg-alo-brand-light">
        <Shield className="size-4 text-alo-brand" />
        <AlertDescription className="text-sm text-alo-text-secondary">
          This section shows your payment status and guides. ALO Finance team handles all payments securely.
          Contact your counselor if you have any questions.
        </AlertDescription>
      </Alert>

      {/* ============================================================ */}
      {/*  PAYMENT GUIDE CARDS                                          */}
      {/* ============================================================ */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-alo-text">Payment Guides</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* University Deposit */}
          <GuideCard
            icon={<Building2 className="size-5" />}
            iconBg="bg-alo-brand/10"
            iconColor="text-alo-brand"
            title="University Deposit"
            description="Deposit requirements are set by your university"
            details={[
              'Payment method details provided by your counselor',
              'Deadline varies by university',
              'Contact your counselor for payment details',
            ]}
            status="Guide only"
            statusNote="Confirm your deposit and deadline with your counselor."
          />

          {/* Tuition Fee */}
          <GuideCard
            icon={<GraduationCap className="size-5" />}
            iconBg="bg-alo-cta/10"
            iconColor="text-alo-cta"
            title="Tuition Fee Payment"
            description="Pay directly to university or through ALO"
            details={[
              'Installment options may be available',
              'Payment deadlines set by the university',
              'Scholarships/deductions applied before final amount',
            ]}
            status="Guide only"
            statusNote="Details provided after enrollment confirmation"
          />

          {/* Visa Fee */}
          <GuideCard
            icon={<Plane className="size-5" />}
            iconBg="bg-crm-success/10"
            iconColor="text-crm-success"
            title="Visa Fee"
            description="Required for UK student visa application"
            details={[
              'Check the official visa authority for current fees',
              'Health surcharges depend on visa and duration',
              'Medical test costs must be confirmed with the provider',
            ]}
            status="Guide only"
            statusNote="Confirm current fees and your payment requirements before paying."
          />

          {/* ALO Service Fee */}
          <GuideCard
            icon={<FileCheck className="size-5" />}
            iconBg="bg-purple-100 dark:bg-purple-900/20"
            iconColor="text-purple-700 dark:text-purple-400"
            title="ALO Service Fee"
            description="Service charges for application processing"
            details={[
              'Covers application processing & guidance',
              'Counseling and document review',
              'Visa preparation support',
            ]}
            status="Guide only"
            statusNote="Your agreed service charges must be confirmed with ALO Finance."
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PAYMENT HISTORY                                              */}
      {/* ============================================================ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-alo-text">Payment History</h2>
          <Badge variant="secondary" className="gap-1.5">
            <Receipt className="size-3.5" />
            {visible ? `${visible.total} records` : 'Records unavailable'}
          </Badge>
        </div>

        {loading && <p role="status">Loading payment history…</p>}
        {!loading && error && <Alert variant="destructive"><AlertDescription>{error} <Button variant="outline" onClick={() => setRetry(value => value + 1)}>Retry</Button></AlertDescription></Alert>}
        {!loading && visible && payments.length === 0 && <p role="status">No payment records found.</p>}
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-alo-border/60 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-alo-text-muted">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-text-muted">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-text-muted text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-text-muted">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-text-muted">Reference</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-text-muted text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="border-b-alo-border/40">
                      <TableCell className="text-sm text-alo-text-secondary whitespace-nowrap">
                        {new Date(payment.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span className="text-sm font-medium text-alo-text">{payment.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-alo-text">{paymentAmount(payment)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-alo-text-muted">
                          {payment.id}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs text-alo-text-muted">Not available in this portal</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 md:hidden">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-lg border border-alo-border/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="text-sm font-medium text-alo-text">{payment.description}</p>
                        <p className="mt-0.5 text-xs text-alo-text-muted">
                          {new Date(payment.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-alo-text">{paymentAmount(payment)}</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-alo-text-muted">
                        {payment.id}
                      </code>
                    </div>
                    <span className="text-xs text-alo-text-muted">Receipt download unavailable</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {visible && <nav aria-label="Payment history pages" className="flex items-center gap-3">
        <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
        <span>Page {page} of {Math.max(1, visible.totalPages)}</span>
        <Button variant="outline" disabled={loading || page >= visible.totalPages} onClick={() => setPage(value => value + 1)}>Next</Button>
      </nav>}

      {/* ============================================================ */}
      {/*  UPLOAD PAYMENT RECEIPT                                       */}
      {/* ============================================================ */}
      <section>
        <Card className="border-dashed border-alo-border">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-alo-cta/10">
              <Upload className="size-6 text-alo-cta" />
            </div>
            <h3 className="text-base font-semibold text-alo-text">Upload Payment Receipt</h3>
            <p className="mt-1 max-w-md text-center text-sm text-alo-text-muted">
              Upload proof of payment (bank transfer receipt, payment confirmation, etc.) for the ALO Finance team to verify.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row">
              <Button variant="cta" className="gap-2" disabled aria-describedby="receipt-unavailable">
                <Upload className="size-4" />
                Upload Receipt
              </Button>
              <p id="receipt-unavailable" className="text-xs text-alo-text-muted">Receipt upload is not connected to a verified payment workflow. Contact your counselor.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ============================================================ */}
      {/*  CONTACT FOOTER                                               */}
      {/* ============================================================ */}
      <Card className="bg-alo-brand-light border-alo-brand/20">
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-alo-brand/10">
            <Phone className="size-5 text-alo-brand" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-alo-text">Need help with payments?</p>
            <p className="text-xs text-alo-text-muted">
              Contact your assigned counselor or reach out to the ALO Finance team for any payment-related queries.
            </p>
          </div>
          <Button variant="brand-outline" size="sm" className="gap-1.5" onClick={() => setView('student-messages')}>
            <Phone className="size-3.5" />
            Contact Counselor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  GUIDE CARD SUB-COMPONENT                                          */
/* ================================================================== */
function GuideCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  details,
  status,
  statusNote,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  details: string[];
  status: string;
  statusNote: string;
}) {
  const statusColor = (s: string) => {
    if (s === 'Paid') return 'text-crm-success bg-crm-success-bg border-crm-success/20';
    if (s === 'Pending' || s === 'Partially Paid') return 'text-crm-warning-text bg-crm-warning-bg border-crm-warning/30';
    return 'text-alo-text-muted bg-muted border-alo-border/50';
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex size-10 items-center justify-center rounded-xl', iconBg)}>
              <span className={iconColor}>{icon}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-alo-text">{title}</h3>
              <p className="mt-0.5 text-xs text-alo-text-muted">{description}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <ul className="space-y-2">
          {details.map((detail, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-alo-text-secondary">
              <CheckCircle2 className="mt-0.5 size-3.5 flex-shrink-0 text-alo-brand/60" />
              {detail}
            </li>
          ))}
        </ul>

        <Separator />

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-alo-text-muted">Status:</span>
            <Badge className={cn('text-[11px]', statusColor(status))}>{status}</Badge>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-alo-text-muted">{statusNote}</p>
      </CardContent>
    </Card>
  );
}