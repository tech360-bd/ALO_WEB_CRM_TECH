'use client';

/**
 * Student payments — /student/payments (standalone route)
 *
 * The portal-view version of this screen lives in StudentPayments.tsx and is
 * driven by the portal store. This route page reuses the same validated data
 * layer (lib/student/payment-history) rather than re-implementing the fetch,
 * so the response contract and currency formatting stay in one place.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge,
} from '@/components/student/portal-section';
import {
  loadPaymentHistory, paymentAmount, type StudentPayment,
} from '@/lib/student/payment-history';

export default function StudentPaymentsPage() {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [payments, setPayments] = useState<StudentPayment[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    loadPaymentHistory(null, page, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setPayments(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'Payment history is unavailable. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, retry]);

  const outstanding = (payments ?? [])
    .filter((payment) => payment.status !== 'paid' && payment.status !== 'cancelled')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Payments"
          description="Service charges and payments recorded against your file."
        />

        {loading && <PortalLoading label="Loading your payments…" />}

        {!loading && error && (
          <PortalError message={error} onRetry={() => setRetry((value) => value + 1)} />
        )}

        {!loading && !error && payments && payments.length === 0 && (
          <PortalCard>
            <PortalEmpty
              title="No payments recorded"
              description="Charges appear here once your counselor raises them. Nothing is due until it is listed on this page."
              action={
                <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                  <Link href="/student/messages">Ask About Fees</Link>
                </Button>
              }
            />
          </PortalCard>
        )}

        {!loading && !error && payments && payments.length > 0 && (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Records</p>
                <p className="mt-1 text-[26px] font-bold leading-none text-[var(--alo-text)]">{total}</p>
              </div>
              <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Outstanding</p>
                <p className="mt-1 text-[26px] font-bold leading-none text-[var(--alo-text)]">
                  {`${payments[0].currency} ${outstanding.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Paid</p>
                <p className="mt-1 text-[26px] font-bold leading-none text-[var(--alo-text)]">
                  {payments.filter((payment) => payment.status === 'paid').length}
                </p>
              </div>
            </div>

            <PortalCard
              title="Payment history"
              description={`Page ${page} of ${Math.max(1, totalPages)}`}
              icon={<Receipt className="mr-2 h-4 w-4 text-[var(--alo-text-muted)]" aria-hidden="true" />}
            >
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--alo-border)] text-left">
                      <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Description</th>
                      <th className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Raised</th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Amount</th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--alo-text-muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--alo-border)]">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-[var(--alo-page)]">
                        <td className="px-5 py-3">
                          <p className="text-[13px] font-medium text-[var(--alo-text)]">{payment.description || 'Payment'}</p>
                          {payment.paidAt && (
                            <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">
                              Paid {new Date(payment.paidAt).toLocaleDateString('en-GB')}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-[var(--alo-body)]">
                          {new Date(payment.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-5 py-3 text-right text-[13px] font-semibold text-[var(--alo-text)]">
                          {paymentAmount(payment)}
                        </td>
                        <td className="px-5 py-3 text-right"><StatusBadge value={payment.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-[var(--alo-border)] sm:hidden">
                {payments.map((payment) => (
                  <li key={payment.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-semibold text-[var(--alo-text)]">{payment.description || 'Payment'}</p>
                      <span className="shrink-0 text-[13px] font-bold text-[var(--alo-text)]">{paymentAmount(payment)}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12px] text-[var(--alo-text-muted)]">
                        {new Date(payment.createdAt).toLocaleDateString('en-GB')}
                      </span>
                      <StatusBadge value={payment.status} />
                    </div>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--alo-border)] px-5 py-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-button border-[var(--alo-border)] px-3 text-[12px] font-semibold"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-[12px] text-[var(--alo-text-muted)]">Page {page} of {totalPages}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-button border-[var(--alo-border)] px-3 text-[12px] font-semibold"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </PortalCard>

            <p className="mt-4 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
              These are the charges recorded on your file, with the currency exactly as recorded. Pay only through the
              method your counselor confirms, and ask for a receipt for anything you pay in person.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
