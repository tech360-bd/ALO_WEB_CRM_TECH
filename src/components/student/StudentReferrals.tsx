'use client';

/**
 * Student referrals — /student/referrals
 *
 * Reads GET /api/student/referrals and creates entries through the matching
 * POST. The referral code is derived server-side; the reward field is only
 * shown when the backend has actually recorded an offer.
 */

import { useState } from 'react';
import { Copy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  PortalSectionTitle, StatusBadge, useStudentResource,
} from '@/components/student/portal-section';

interface Referral {
  id: string;
  referralCode: string;
  referredName: string | null;
  referredPhone: string | null;
  referredEmail: string | null;
  status: string;
  source: string | null;
  rewardOffered: string | null;
  rewardStatus: string | null;
  qualifiedAt: string | null;
  enrolledAt: string | null;
  createdAt: string;
}

interface ReferralsResponse {
  referrals: Referral[];
  referralCode: string;
}

export default function StudentReferrals() {
  const { data, state, error, reload } = useStudentResource<ReferralsResponse>('/api/student/referrals');
  const [form, setForm] = useState({ referredName: '', referredPhone: '', referredEmail: '', source: 'DIRECT' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const referrals = data?.referrals ?? [];

  async function copyCode() {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the code is still shown on screen.
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!form.referredName.trim()) {
      setSubmitError('Add your friend’s name so we know who to expect.');
      return;
    }
    if (!/^\+?[0-9\s().-]{7,30}$/.test(form.referredPhone.trim())) {
      setSubmitError('Enter a phone number of at least 7 digits, including the country code.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/student/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Could not save that referral');
      setForm({ referredName: '', referredPhone: '', referredEmail: '', source: 'DIRECT' });
      await reload();
    } catch (submitError_) {
      setSubmitError(submitError_ instanceof Error ? submitError_.message : 'Something went wrong saving that referral.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Refer a Friend"
          description="Share your code with someone planning to study abroad and track where they get to."
        />

        {state === 'loading' && <PortalLoading label="Loading your referrals…" />}

        {state === 'error' && <PortalError message={error ?? 'Your referrals could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && (
          <>
            <PortalCard className="mb-6" title="Your referral code">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <code className="rounded-button border border-[var(--alo-border)] bg-[var(--alo-page)] px-4 py-2 font-mono text-[15px] font-bold tracking-[0.08em] text-[var(--alo-text)]">
                  {data?.referralCode ?? '—'}
                </code>
                <Button
 type="button"
 variant="outline"
 className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold"
 onClick={copyCode}
 >
                  <Copy className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  {copied ? 'Copied' : 'Copy Code'}
                </Button>
              </div>
              <p className="px-5 pb-4 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                Share this code directly. Any reward depends on your friend completing an eligible enrolment, and the
                terms shown to them at that point are what apply.
              </p>
            </PortalCard>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <PortalCard>
                <PortalSectionTitle>
                  <Users className="mr-2 h-4 w-4 text-alo-brand" aria-hidden="true" />
                  Your Referrals
                </PortalSectionTitle>

                {referrals.length === 0 ? (
                  <PortalEmpty
                    title="No referrals yet"
                    description="When someone uses your code or you add them below, their progress appears here."
                  />
                ) : (
                  <ul className="divide-y divide-[var(--alo-border)]">
                    {referrals.map((referral) => (
                      <li key={referral.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--alo-text)]">
                              {referral.referredName ?? 'Friend'}
                            </p>
                            <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">
                              {referral.referralCode}
                              {referral.source ? ` · via ${referral.source}` : ''}
                            </p>
                          </div>
                          <StatusBadge value={referral.status} />
                        </div>
                        {referral.referredEmail && (
                          <p className="mt-1 text-[12px] text-[var(--alo-text-muted)]">{referral.referredEmail}</p>
                        )}
                        {referral.rewardOffered && (
                          <p className="mt-1.5 text-[12px] text-[var(--alo-body)]">
                            Reward: {referral.rewardOffered}
                            {referral.rewardStatus ? ` · ${referral.rewardStatus.replace(/_/g, ' ').toLowerCase()}` : ''}
                          </p>
                        )}
                        {referral.enrolledAt && (
                          <p className="mt-1 text-[12px] text-emerald-700">
                            Enrolled {new Date(referral.enrolledAt).toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </PortalCard>

              <PortalCard title="Add Someone" description="If you referred them offline">
                <form className="space-y-3 px-5 py-4" onSubmit={submit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-name" className="text-[12px] font-semibold text-[var(--alo-body)]">Their name</Label>
                    <Input
                      id="ref-name"
                      value={form.referredName}
                      onChange={(event) => setForm((prev) => ({ ...prev, referredName: event.target.value }))}
                      placeholder="Friend's name"
                      className="h-9 rounded-input"
                      maxLength={191}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-phone" className="text-[12px] font-semibold text-[var(--alo-body)]">Phone</Label>
                    <Input
                      id="ref-phone"
                      value={form.referredPhone}
                      onChange={(event) => setForm((prev) => ({ ...prev, referredPhone: event.target.value }))}
                      placeholder="+8801700000000"
                      className="h-9 rounded-input"
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-email" className="text-[12px] font-semibold text-[var(--alo-body)]">Email (optional)</Label>
                    <Input
                      id="ref-email"
                      type="email"
                      value={form.referredEmail}
                      onChange={(event) => setForm((prev) => ({ ...prev, referredEmail: event.target.value }))}
                      placeholder="friend@example.com"
                      className="h-9 rounded-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-semibold text-[var(--alo-body)]">How did you share it?</Label>
                    <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value }))}>
                      <SelectTrigger className="h-9 rounded-input"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="MESSENGER">Messenger</SelectItem>
                        <SelectItem value="LINK">Link</SelectItem>
                        <SelectItem value="DIRECT">In person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {submitError && (
                    <p className="rounded-input border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700" role="alert">
                      {submitError}
                    </p>
                  )}

                  <Button
 type="submit"
 disabled={submitting}
 className=" w-full rounded-button bg-alo-cta text-[13px] font-semibold text-black hover:bg-[var(--alo-cta)]"
 >
                    {submitting ? 'Saving…' : 'Save Referral'}
                  </Button>
                </form>
              </PortalCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
