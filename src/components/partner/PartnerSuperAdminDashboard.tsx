'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Ticket, Plus, Sparkles, AlertTriangle, RefreshCw, Info, Users,
} from 'lucide-react';

// ============================================================
// Types — mirror GET /api/partner-admin/dashboard
// ============================================================

interface PartnerKpis {
  totalStudents: number;
  activeApplications: number;
  submittedApplications: number;
  offerReceived: number;
  visaReadyStudents: number;
  userSeats: {
    limit: number;
    used: number;
    available: number;
    pendingSeatRequests: number;
  };
  marketingQuota: {
    monthlyImageLimit: number;
    imagesUsed: number;
    imagesRemaining: number;
    monthlyVideoLimit: number;
    videosUsed: number;
    videosRemaining: number;
    videoDurationLimitSeconds: number;
  };
  vouchers: { total: number; available: number; used: number };
  activeEntitlementsCount: number;
  supportThreadsCount: number;
}

// StudentMockTestVoucher
interface Voucher {
  id: string;
  voucherCode: string;
  studentId: string;
  testType: string;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  status: string;
  createdAt: string;
}

// PartnerUserSeatRequest
interface SeatRequest {
  id: string;
  requestedBy: string;
  currentLimit: number;
  requestedExtraSeats: number;
  reason: string;
  status: string;
  reviewedBy: string;
  reviewNote: string;
  createdAt: string;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const VOUCHER_STATUS_CLS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  used: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  expired: 'bg-amber-100 text-amber-800',
  revoked: 'bg-red-100 text-red-700',
};

function formatTimestamp(value?: string | null): string {
  if (!value) return 'No expiry';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export default function PartnerSuperAdminDashboard() {
  const { setView } = usePortalStore();

  const [kpis, setKpis] = useState<PartnerKpis | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [seatRequests, setSeatRequests] = useState<SeatRequest[]>([]);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const response = await fetch('/api/partner-admin/dashboard');
      if (!response.ok) throw new Error(`Could not load the partner dashboard (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'The partner dashboard returned no data');
      setKpis(payload.kpis);
      setPartnerId(payload.partnerId || null);
      setVouchers(Array.isArray(payload?.recentVouchers) ? payload.recentVouchers : []);
      setSeatRequests(Array.isArray(payload?.recentSeatRequests) ? payload.recentSeatRequests : []);
      setState({ loading: false, error: null });
    } catch (error) {
      setKpis(null);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load the partner dashboard',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const quota = kpis?.marketingQuota;
  const seats = kpis?.userSeats;

  const kpiCards: Array<{ label: string; value: string | number }> = kpis
    ? [
      { label: 'Students', value: kpis.totalStudents },
      { label: 'Active applications', value: kpis.activeApplications },
      { label: 'Submitted applications', value: kpis.submittedApplications },
      { label: 'Offers received', value: kpis.offerReceived },
      { label: 'Visa ready', value: kpis.visaReadyStudents },
      { label: 'Vouchers issued', value: kpis.vouchers.total },
      { label: 'Active entitlements', value: kpis.activeEntitlementsCount },
      { label: 'Support threads', value: kpis.supportThreadsCount },
    ]
    : [];

  return (
    <div className="bg-[var(--alo-page)]/50 min-h-screen space-y-6 p-4 lg:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--alo-border)] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--alo-text)]">Partner Administration</h1>
            <Badge className="border-indigo-200 bg-indigo-100 font-mono text-xs text-indigo-800">
              B2B PARTNER SUPER ADMIN
            </Badge>
            {partnerId ? (
              <span className="font-mono text-xs text-[var(--alo-text-muted)]">{partnerId}</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-[var(--alo-text-muted)]">
            Applications, marketing quota, counsellor seats and student vouchers on record for this
            partner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-8 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
            onClick={() => setView('partner-admin-marketing-studio')}
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Open Marketing Studio
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[var(--alo-border-strong)] text-xs text-[var(--alo-body)]"
            onClick={() => setView('partner-admin-users')}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Request extra seats
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => void load()}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{state.error}</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2"
                onClick={() => void load()}
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {state.loading && !kpis && (
        <Card className="border-[var(--alo-border)] bg-white">
          <CardContent className="py-10 text-center text-sm text-[var(--alo-text-muted)]">
            Loading partner dashboard…
          </CardContent>
        </Card>
      )}

      {!state.loading && !kpis && !state.error && (
        <Card className="border-[var(--alo-border)] bg-white">
          <CardContent className="py-10 text-center text-sm text-[var(--alo-text-muted)]">
            No partner data is available for this account.
          </CardContent>
        </Card>
      )}

      {kpis && (
        <>
          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpiCards.map((card) => (
              <Card key={card.label} className="border-[var(--alo-border)] bg-white shadow-2xs">
                <CardContent className="p-3">
                  <p className="text-[11px] font-medium text-[var(--alo-text-muted)]">{card.label}</p>
                  <p className="mt-0.5 text-xl font-bold text-[var(--alo-text)]">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* ── Marketing quota ── */}
            <div className="space-y-6 lg:col-span-7">
              <Card className="border-indigo-200 bg-white shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between border-b border-indigo-100 bg-indigo-50/30 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-[var(--alo-text)]">
                      Marketing quota this month
                    </CardTitle>
                    <CardDescription className="text-xs text-[var(--alo-text-muted)]">
                      Generated images and short videos against your monthly allowance.
                    </CardDescription>
                  </div>
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--alo-body)]">Images</span>
                      <span className="font-medium text-[var(--alo-text)]">
                        {quota?.imagesUsed ?? 0} of {quota?.monthlyImageLimit ?? 0} used ·{' '}
                        {quota?.imagesRemaining ?? 0} remaining
                      </span>
                    </div>
                    <Progress
                      value={
                        quota && quota.monthlyImageLimit > 0
                          ? (quota.imagesUsed / quota.monthlyImageLimit) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--alo-body)]">
                        Videos ({quota?.videoDurationLimitSeconds ?? 30}s max)
                      </span>
                      <span className="font-medium text-[var(--alo-text)]">
                        {quota?.videosUsed ?? 0} of {quota?.monthlyVideoLimit ?? 0} used ·{' '}
                        {quota?.videosRemaining ?? 0} remaining
                      </span>
                    </div>
                    <Progress
                      value={
                        quota && quota.monthlyVideoLimit > 0
                          ? (quota.videosUsed / quota.monthlyVideoLimit) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="h-8 bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                      onClick={() => setView('partner-admin-marketing-studio')}
                    >
                      Generate campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* ── Seat requests ── */}
              <Card className="border-[var(--alo-border)] bg-white shadow-xs">
                <CardHeader className="border-b border-[var(--alo-border)] pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-[var(--alo-text)]">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Counsellor seats
                  </CardTitle>
                  <CardDescription className="text-xs text-[var(--alo-text-muted)]">
                    {seats ? `${seats.used} of ${seats.limit} seats in use · ${seats.available} available · ${seats.pendingSeatRequests} requests pending` : 'Seat limits unavailable'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {seatRequests.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--alo-text-muted)]">
                      No seat request has been raised yet.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[var(--alo-border)]">
                      {seatRequests.map((request) => (
                        <li key={request.id} className="p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium text-[var(--alo-text)]">
                              +{request.requestedExtraSeats} seat
                              {request.requestedExtraSeats === 1 ? '' : 's'}
                              {request.requestedBy ? ` · ${request.requestedBy}` : ''}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                request.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : request.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {(request.status || 'pending').toUpperCase()}
                            </Badge>
                          </div>
                          {request.reason ? (
                            <p className="mt-1 text-[11px] text-[var(--alo-body)]">{request.reason}</p>
                          ) : null}
                          {request.reviewNote ? (
                            <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">
                              Review note: {request.reviewNote}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-[var(--alo-text-muted)]">
                            Requested {formatTimestamp(request.createdAt)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Vouchers ── */}
            <div className="space-y-6 lg:col-span-5">
              <Card className="border-[var(--alo-border)] bg-white shadow-xs">
                <CardHeader className="border-b border-[var(--alo-border)] pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-[var(--alo-text)]">
                      Student benefit vouchers
                    </CardTitle>
                    <Ticket className="h-4 w-4 text-emerald-600" />
                  </div>
                  <CardDescription className="text-xs text-[var(--alo-text-muted)]">
                    Mock test vouchers issued to students with an active application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {vouchers.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--alo-text-muted)]">
                      No voucher has been issued yet.
                    </p>
                  ) : (
                    vouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="space-y-1 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[var(--alo-text)]">
                            {voucher.voucherCode}
                          </span>
                          <Badge
                            className={`text-[11px] ${VOUCHER_STATUS_CLS[voucher.status] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}
                          >
                            {(voucher.status || 'unknown').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-[var(--alo-body)]">
                          Student {voucher.studentId} · {(voucher.testType || '').replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-[var(--alo-text-muted)]">
                          {voucher.usedCount} of {voucher.usageLimit} used · expires{' '}
                          {voucher.expiresAt ? formatTimestamp(voucher.expiresAt) : 'no expiry set'}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      <Card className="border-[var(--alo-border)] bg-white">
        <CardContent className="flex items-start gap-2 p-4 text-xs text-[var(--alo-text-muted)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Figures are read from this partner&apos;s own records. Seat usage counts active user
            accounts; pending requests and support threads are reported separately. Marketing
            figures use the current quota period and are not estimated.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
