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
  CreditCard,
  Shield,
  Building2,
  GraduationCap,
  Plane,
  FileCheck,
  Upload,
  Download,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Phone,
  Receipt,
  PoundSterling,
  Stethoscope,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                               */
/* ================================================================== */
type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

interface PaymentRecord {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: PaymentStatus;
  reference: string;
  hasReceipt: boolean;
}

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */
const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    date: '2025-07-10',
    description: 'University Deposit — University of Aberdeen',
    amount: '£2,000',
    status: 'Pending',
    reference: 'DEP-ABN-2025-001',
    hasReceipt: false,
  },
  {
    id: 'pay-2',
    date: '2025-07-02',
    description: 'UK Student Visa Fee',
    amount: '£490',
    status: 'Paid',
    reference: 'VISA-UK-2025-042',
    hasReceipt: true,
  },
];

/* ================================================================== */
/*  STATUS HELPERS                                                     */
/* ================================================================== */
function getStatusIcon(status: PaymentStatus) {
  switch (status) {
    case 'Paid': return <CheckCircle2 className="size-4 text-crm-success" />;
    case 'Pending': return <Clock className="size-4 text-crm-warning" />;
    case 'Overdue': return <AlertCircle className="size-4 text-crm-danger" />;
  }
}

function getStatusBadge(status: PaymentStatus) {
  switch (status) {
    case 'Paid': return 'success' as const;
    case 'Pending': return 'warning' as const;
    case 'Overdue': return 'danger' as const;
  }
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export default function StudentPayments() {
  const { user, token } = usePortalStore();
  const [apiPay, setApiPay] = useState<PaymentRecord[] | null>(null)
  useEffect(() => { if (!token) return; fetch('/api/student-portal/payments', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(j => { if (j.success && j.data && j.data.length > 0) setApiPay(j.data); }).catch(() => {}); }, [token]);
  const payments = (apiPay && apiPay.length > 0) ? apiPay : MOCK_PAYMENTS;

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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
            description="Typically £1,000 – £5,000 required to secure your offer"
            details={[
              'Payment method details provided by your counselor',
              'Deadline varies by university',
              'Contact your counselor for payment details',
            ]}
            status="Pending"
            statusNote="University of Aberdeen — £2,000"
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
            status="Not Required"
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
              'UK student visa fee: approximately £490',
              'IHS (Immigration Health Surcharge): ~£776/year',
              'TB test fee: ~৳3,500 (if required)',
            ]}
            status="Partially Paid"
            statusNote="Visa fee paid. IHS payable with visa application."
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
            status="N/A"
            statusNote="Not applicable at this time"
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
            {payments.length} records
          </Badge>
        </div>

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
                        {new Date(payment.date).toLocaleDateString('en-GB', {
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
                        <span className="text-sm font-semibold text-alo-text">{payment.amount}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(payment.status)}>{payment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-alo-text-muted">
                          {payment.reference}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.hasReceipt ? (
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Download className="size-3.5" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-xs text-alo-text-muted">—</span>
                        )}
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
                          {new Date(payment.date).toLocaleDateString('en-GB', {
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
                      <span className="text-base font-bold text-alo-text">{payment.amount}</span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-alo-text-muted">
                        {payment.reference}
                      </code>
                    </div>
                    {payment.hasReceipt && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Download className="size-3.5" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

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
              <Button variant="cta" className="gap-2">
                <Upload className="size-4" />
                Upload Receipt
              </Button>
              <p className="text-xs text-alo-text-muted">PDF, JPG, or PNG up to 10MB</p>
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
          <Button variant="brand-outline" size="sm" className="gap-1.5">
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
            <Badge className={cn('text-[10px]', statusColor(status))}>{status}</Badge>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-alo-text-muted">{statusNote}</p>
      </CardContent>
    </Card>
  );
}