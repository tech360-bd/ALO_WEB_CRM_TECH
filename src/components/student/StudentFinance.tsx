'use client';

/**
 * Student finance — /student/finance (spec §60)
 *
 * Payment status, outstanding balance and payment history from
 * GET /api/student-portal/payments. Amounts shown are the recorded values only —
 * no fee is ever estimated, and nothing is presented as settled until the
 * recorded status says so.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from './portal-section';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentsResponse {
  success: boolean;
  data: Payment[];
  pagination?: { total: number; page: number; limit: number };
}

const STATUSES = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'failed', label: 'Failed' },
];

function formatMoney(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'BDT',
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // An unrecognised currency code must never blank the amount.
    return `${safe.toFixed(2)} ${currency}`;
  }
}

export default function StudentFinance() {
  const [status, setStatus] = useState('');
  const path = status ? `/api/student-portal/payments?status=${status}&limit=100` : '/api/student-portal/payments?limit=100';
  const { data, state, error, reload } = useStudentResource<PaymentsResponse>(path);

  const payments = data?.data ?? [];

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'paid');
    const outstanding = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
    // Group by currency — a balance across currencies is meaningless summed.
    const byCurrency = (list: Payment[]) =>
      list.reduce<Record<string, number>>((accumulator, payment) => {
        const key = payment.currency || 'BDT';
        accumulator[key] = (accumulator[key] ?? 0) + (Number.isFinite(payment.amount) ? payment.amount : 0);
        return accumulator;
      }, {});
    return {
      paid: byCurrency(paid),
      outstanding: byCurrency(outstanding),
      outstandingCount: outstanding.length,
    };
  }, [payments]);

  const exportCsv = () => {
    const header = 'Description,Amount,Currency,Status,Due date,Paid at';
    const rows = payments.map((payment) =>
      [
        `"${(payment.description || '').replace(/"/g, '""')}"`,
        payment.amount,
        payment.currency,
        payment.status,
        payment.dueDate || '',
        payment.paidAt ? new Date(payment.paidAt).toISOString().slice(0, 10) : '',
      ].join(','),
    );
    const url = URL.createObjectURL(new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `alo-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <PortalPageHeader
          title="Finance"
          description="Service fees, deposits and payments recorded against your file."
          action={
            <Button variant="outline" className="h-9 rounded-button border-slate-200 bg-white px-4 text-[13px] font-semibold" onClick={exportCsv} disabled={payments.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Export CSV
            </Button>
          }
        />

        {state === 'loading' && <PortalLoading label="Loading your payments…" />}

        {state === 'error' && <PortalError message={error ?? 'Your payment history could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <BalanceTile label="Outstanding" amounts={totals.outstanding} tone={totals.outstandingCount > 0 ? 'warning' : 'neutral'} note={`${totals.outstandingCount} payment${totals.outstandingCount === 1 ? '' : 's'} outstanding`} />
              <BalanceTile label="Paid to date" amounts={totals.paid} tone="success" note="Recorded as settled" />
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[24px] font-bold leading-none tracking-[-0.02em] text-slate-900">{payments.length}</p>
                <p className="mt-1.5 text-[12px] font-medium text-slate-500">Payments on record</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                  Tuition is paid to your university, not through ALO.
                </p>
              </div>
            </div>

            <PortalCard
              title="Payment history"
              description="Newest first"
              action={
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((option) => (
                    <button
                      key={option.id || 'all'}
                      type="button"
                      onClick={() => setStatus(option.id)}
                      aria-pressed={status === option.id}
                      className={cn(
                        'rounded-button border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                        status === option.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              }
            >
              {payments.length === 0 ? (
                <PortalEmpty
                  title={status ? 'No payments with this status' : 'No payments recorded yet'}
                  description={
                    status
                      ? 'Try a different filter to see your other payments.'
                      : 'When a service fee or deposit is added to your file it will appear here with its due date and status.'
                  }
                  action={
                    <Button asChild variant="outline" className="h-9 rounded-button border-slate-200 px-4 text-[13px] font-semibold">
                      <Link href="/student/messages">Ask About Fees</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Description</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Amount</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Status</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Due</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-5 py-3.5">
                            <span className="flex items-start gap-2 text-[13px] font-medium text-slate-900">
                              <Receipt className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                              {payment.description || 'Payment'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-[13px] font-semibold text-slate-900">
                            {formatMoney(payment.amount, payment.currency)}
                          </td>
                          <td className="px-5 py-3.5"><StatusBadge value={payment.status} /></td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-slate-600">{payment.dueDate || '—'}</td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-slate-600">
                            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-GB') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PortalCard>

            <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
              These are ALO service payments only. University tuition, visa fees, health surcharges and test fees are
              paid directly to the receiving institution or government and are not recorded here. If a payment looks
              wrong, contact your counselor before paying anything further.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function BalanceTile({
  label,
  amounts,
  tone,
  note,
}: {
  label: string;
  amounts: Record<string, number>;
  tone: 'neutral' | 'success' | 'warning';
  note: string;
}) {
  const entries = Object.entries(amounts);
  const toneClass = tone === 'warning' ? 'text-amber-600' : tone === 'success' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      {entries.length === 0 ? (
        <p className={cn('text-[24px] font-bold leading-none tracking-[-0.02em]', 'text-slate-400')}>—</p>
      ) : (
        <div className="space-y-0.5">
          {entries.map(([currency, amount]) => (
            <p key={currency} className={cn('text-[20px] font-bold leading-tight tracking-[-0.02em]', toneClass)}>
              {formatMoney(amount, currency)}
            </p>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}
