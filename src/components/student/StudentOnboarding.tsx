'use client';

/**
 * Profile onboarding — /student/profile/onboarding
 *
 * Reads GET /api/student/profile and writes through the matching PATCH, which
 * only ever updates the session's own record. Progress is derived from the
 * stored profileComplete value plus which fields are actually filled in.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleDashed, GraduationCap, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PortalCard, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';
import { cn } from '@/lib/utils';

interface StudentProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  currentCountry: string;
  currentCity: string;
  profileComplete: number;
  journeyStage: string;
  counselorName: string;
  applications?: unknown[];
  visaCases?: unknown[];
}

interface ProfileResponse {
  student: StudentProfile;
}

interface Step {
  id: string;
  label: string;
  href: string;
  description: string;
  done: (profile: StudentProfile) => boolean;
}

const STEPS: Step[] = [
  {
    id: 'contact',
    label: 'Confirm your contact details',
    href: '',
    description: 'Name, email and phone must match the documents you will submit.',
    done: (profile) => Boolean(profile.name?.trim() && profile.email?.trim() && profile.phone?.trim()),
  },
  {
    id: 'location',
    label: 'Add where you live now',
    href: '',
    description: 'Your country and city help us filter courses you are eligible for.',
    done: (profile) => Boolean(profile.currentCountry?.trim() && profile.currentCity?.trim()),
  },
  {
    id: 'courses',
    label: 'Save courses you are interested in',
    href: '/student/saved',
    description: 'Shortlist options and compare them side by side.',
    done: () => false, // Derived from the shortlist, not from the profile record.
  },
  {
    id: 'documents',
    label: 'Upload your documents',
    href: '/student/documents',
    description: 'Transcripts, certificates and your passport page.',
    done: () => false,
  },
  {
    id: 'consultation',
    label: 'Book a consultation',
    href: '/student/appointments',
    description: 'Talk through your options with a counselor.',
    done: () => false,
  },
];

export default function StudentOnboarding() {
  const { data, state, error, reload } = useStudentResource<ProfileResponse>('/api/student/profile');
  const profile = data?.student ?? null;

  const [form, setForm] = useState({ name: '', email: '', phone: '', currentCountry: '', currentCity: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        currentCountry: profile.currentCountry ?? '',
        currentCity: profile.currentCity ?? '',
      });
    }
  }, [profile]);

  const completedCount = useMemo(
    () => (profile ? STEPS.filter((step) => step.done(profile)).length : 0),
    [profile],
  );

  const storedPercent = profile?.profileComplete ?? 0;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Could not save your details');
      await reload();
      setSaved(true);
    } catch (saveError_) {
      setSaveError(saveError_ instanceof Error ? saveError_.message : 'Something went wrong saving your details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Set Up Your Profile"
          description="The details we need before we can start applications for you."
          action={profile ? <StatusBadge value={profile.journeyStage} /> : undefined}
        />

        {state === 'loading' && <PortalLoading label="Loading your profile…" />}
        {state === 'idle' && <PortalLoading label="Loading your profile…" />}

        {state === 'error' && <PortalError message={error ?? 'Your profile could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && profile && (
          <>
            <div className="mb-6 rounded-2xl border border-[var(--alo-border)] bg-white px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-[var(--alo-text)]">
                  {completedCount} of {STEPS.length} profile steps done
                </p>
                <span className="text-[12px] text-[var(--alo-text-muted)]">
                  Recorded progress: {storedPercent}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]">
                <div
                  className="h-full rounded-full bg-alo-blue transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, storedPercent))}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                The bar shows the progress value stored on your record. The checklist below shows what is still missing.
              </p>
            </div>

            <PortalCard
              className="mb-6"
              title="Your details"
              description="These must match your passport and transcripts"
              icon={<User className="mr-2 h-4 w-4 text-alo-blue" aria-hidden="true" />}
            >
              <form className="space-y-3 px-5 py-4" onSubmit={save}>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-name" className="text-[12px] font-semibold text-[var(--alo-body)]">Full name</Label>
                  <Input
                    id="ob-name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Exactly as on your passport"
                    className="h-9 rounded-input"
                    maxLength={191}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-email" className="text-[12px] font-semibold text-[var(--alo-body)]">Email</Label>
                    <Input
                      id="ob-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="you@example.com"
                      className="h-9 rounded-input"
                      maxLength={191}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-phone" className="text-[12px] font-semibold text-[var(--alo-body)]">Phone</Label>
                    <Input
                      id="ob-phone"
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="+8801700000000"
                      className="h-9 rounded-input"
                      inputMode="tel"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-country" className="text-[12px] font-semibold text-[var(--alo-body)]">Current country</Label>
                    <Input
                      id="ob-country"
                      value={form.currentCountry}
                      onChange={(event) => setForm((prev) => ({ ...prev, currentCountry: event.target.value }))}
                      placeholder="Bangladesh"
                      className="h-9 rounded-input"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ob-city" className="text-[12px] font-semibold text-[var(--alo-body)]">Current city</Label>
                    <Input
                      id="ob-city"
                      value={form.currentCity}
                      onChange={(event) => setForm((prev) => ({ ...prev, currentCity: event.target.value }))}
                      placeholder="Dhaka"
                      className="h-9 rounded-input"
                      maxLength={100}
                    />
                  </div>
                </div>

                {saveError && (
                  <p className="rounded-input border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700" role="alert">
                    {saveError}
                  </p>
                )}
                {saved && !saveError && (
                  <p className="rounded-input border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700" role="status">
                    Your details have been saved.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-black hover:bg-orange-500"
                >
                  {saving ? 'Saving…' : 'Save My Details'}
                </Button>
              </form>
            </PortalCard>

            <PortalCard title="What to do next" description="Work through these in any order">
              <ul className="divide-y divide-[var(--alo-border)]">
                {STEPS.map((step, index) => {
                  const done = step.done(profile);
                  const Icon = done ? CheckCircle2 : CircleDashed;
                  return (
                    <li key={step.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                          done ? 'bg-emerald-600 text-white' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[var(--alo-text)]">{step.label}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--alo-body)]">{step.description}</p>
                        {step.href && (
                          <Link
                            href={step.href}
                            className="mt-1.5 inline-block text-[13px] font-semibold text-alo-blue hover:underline"
                          >
                            {step.id === 'courses' ? 'Open My Saved Courses' :
                              step.id === 'documents' ? 'Open Documents' : 'Book an Appointment'}
                          </Link>
                        )}
                      </div>
                      <div className="shrink-0">
                        {done
                          ? <StatusBadge value="complete" />
                          : <StatusBadge value="pending" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="px-5 py-3 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                Steps three to five are tracked on their own pages, so they show as pending here until your counselor
                confirms them.
              </p>
            </PortalCard>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
                <Link href="/student/appointments">
                  <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />
                  Book a Consultation
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold">
                <Link href="/ai/course-match">
                  <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                  Find Matching Courses
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
