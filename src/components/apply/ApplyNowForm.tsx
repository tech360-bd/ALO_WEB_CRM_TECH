'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics/client';
import { collectAttributionPayload, rememberEntryAttribution } from '@/lib/analytics/attribution-payload';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Send,
  ShieldCheck,
} from 'lucide-react';

/**
 * FORM A — public Apply Now (spec):
 *   • capture the lead, and create the draft application,
 *   • works for brand-new users (anonymous → register/login → continue here),
 *   • one shared form structure for every course page,
 *   • hands off to FORM B (student portal) for the application itself.
 *
 * Hard rule from the spec: the success state may only ever appear when the
 * server confirms the application was created, and the server refuses to create
 * one while Form B is incomplete (POST /api/applications → 422 FORM_B_INCOMPLETE).
 */

interface CourseSummary {
  courseId: string;
  courseCode: string;
  courseSlug: string;
  courseTitle: string;
  universityId: string;
  universityName: string;
  universitySlug: string;
  studyLevel: string;
  subjectArea: string;
  country: string;
  city: string;
  durationMonths: number;
  tuitionFee: number;
  currency: string;
}

interface IntakeOption {
  label: string;
  deadline: string;
  tuition: number;
  currency: string;
}

interface MissingSection {
  key: string;
  label: string;
  href: string;
}

interface Readiness {
  complete: boolean;
  percent: number;
  missing: MissingSection[];
}

interface StudentIdentity {
  name: string;
  email: string;
  phone: string;
  studentId: string;
}

const DESTINATIONS = ['United Kingdom', 'Australia', 'Canada', 'Ireland', 'New Zealand', 'USA', 'Dubai', 'Other'];
const STUDY_LEVELS = ['Foundation', 'Undergraduate', 'Postgraduate', 'MRes', 'PhD'];

function formatMoney(amount: number, currency: string) {
  if (!amount) return 'Not recorded';
  return `${currency || ''} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`.trim();
}

export default function ApplyNowForm({ course, intakes }: { course: CourseSummary; intakes: IntakeOption[] }) {
  const nextPath = `/apply/${encodeURIComponent(course.courseSlug)}`;

  const [authState, setAuthState] = useState<'checking' | 'anonymous' | 'student'>('checking');
  const [student, setStudent] = useState<StudentIdentity | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [readinessError, setReadinessError] = useState('');
  const [selectedIntake, setSelectedIntake] = useState(intakes[0]?.label || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; code?: string; applicationCode?: string; missing?: MissingSection[] } | null>(null);

  // ── Anonymous lead capture (Form A always creates the lead) ────────────────
  const [lead, setLead] = useState({
    name: '',
    email: '',
    phone: '',
    destination: course.country || '',
    intake: intakes[0]?.label || '',
    level: course.studyLevel || '',
    message: '',
  });
  const [leadState, setLeadState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [leadError, setLeadError] = useState('');

  const loginHref = useMemo(
    () => `/login?callbackUrl=${encodeURIComponent(nextPath)}`,
    [nextPath]
  );
  const registerHref = useMemo(
    () => `/register?next=${encodeURIComponent(nextPath)}`,
    [nextPath]
  );

  const loadReadiness = useCallback(async () => {
    try {
      const res = await fetch('/api/student/application-readiness', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Readiness check failed');
      setReadiness({ complete: !!json.complete, percent: json.percent || 0, missing: json.missing || [] });
      setReadinessError('');
    } catch (error) {
      setReadiness(null);
      setReadinessError(error instanceof Error ? error.message : 'Readiness check failed');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/student/auth/me', { credentials: 'include' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success || !json.student) throw new Error('anonymous');
        if (cancelled) return;
        const record = json.student as Record<string, unknown>;
        setStudent({
          name: String(record.name || ''),
          email: String(record.email || ''),
          phone: String(record.phone || ''),
          studentId: String(record.studentId || ''),
        });
        setLead((prev) => ({
          ...prev,
          name: prev.name || String(record.name || ''),
          email: prev.email || String(record.email || ''),
          phone: prev.phone || String(record.phone || ''),
        }));
        setAuthState('student');
      })
      .catch(() => {
        if (!cancelled) setAuthState('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authState === 'student') void loadReadiness();
  }, [authState, loadReadiness]);

  /**
   * Attribution the visitor arrived with, captured once. The apply journey can
   * move them across routes before they submit; the acquiring campaign must not
   * be replaced by wherever they ended up.
   */
  const entryAttribution = useRef(rememberEntryAttribution('alo.attribution.apply.v1'));

  /** Course identity sent with every event — public catalogue data only. */
  const courseParams = useMemo(
    () => ({
      course_id: course.courseId,
      course_slug: course.courseSlug,
      university_id: course.universityId,
      destination: course.country || undefined,
    }),
    [course.courseId, course.courseSlug, course.universityId, course.country],
  );

  // `application_start` — the visitor reached the apply surface for a specific
  // course. Fired once per mount, not per render.
  useEffect(() => {
    trackAnalyticsEvent('application_start', courseParams, { source: 'apply-now-form' });
    // Deliberately mount-only: re-firing on a courseParams identity change
    // would double-count a single visit, so courseParams is read here without
    // being declared as a dependency.
  }, []);

  const submitApplication = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: course.courseId,
          universityId: course.universityId,
          courseName: course.courseTitle,
          universityName: course.universityName,
          intake: selectedIntake,
          notes,
          applicationSource: 'STUDENT_SELF_APPLICATION',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        const applicationCode = json.data?.applicationCode || json.application?.applicationCode || '';
        setResult({
          ok: true,
          message: 'Application draft created. Your counselor has been notified and will review it with you.',
          applicationCode,
        });
        // `application_reference` is ALO's own application code — an opaque
        // internal identifier, not a student name or contact detail.
        trackAnalyticsEvent('application_submit', {
          ...courseParams,
          success: true,
          application_reference: applicationCode,
          intake: selectedIntake,
        }, { source: 'apply-now-form' });
        return;
      }
      if (res.status === 422 && json.code === 'FORM_B_INCOMPLETE') {
        setResult({ ok: false, code: json.code, message: json.error, missing: json.missingSections || [] });
        setReadiness({ complete: false, percent: json.completeness || 0, missing: json.missingSections || [] });
        return;
      }
      setResult({ ok: false, message: json.error || 'Application could not be created. Please try again.' });
      trackAnalyticsEvent('application_submit', {
        ...courseParams,
        success: false,
        error_code: json.code || 'api_error',
      }, { source: 'apply-now-form' });
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : 'Application could not be created.' });
      trackAnalyticsEvent('application_submit', {
        ...courseParams,
        success: false,
        error_code: 'network',
      }, { source: 'apply-now-form' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitLead = async (event: React.FormEvent) => {
    event.preventDefault();
    setLeadState('sending');
    setLeadError('');
    try {
      const res = await fetch('/api/website/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          preferredCountry: lead.destination,
          preferredLevel: lead.level,
          preferredSubject: course.subjectArea || course.courseTitle,
          ...(entryAttribution.current ?? collectAttributionPayload() ?? {}),
          source: 'Apply Now — Form A',
          sourceSection: `apply:${course.courseSlug}`,
          leadType: 'application_intent',
          service: `${course.courseTitle}${course.universityName ? ` — ${course.universityName}` : ''}`,
          message: [lead.message, `Course: ${course.courseTitle}`, `University: ${course.universityName}`, `Intake: ${lead.intake}`]
            .filter(Boolean)
            .join('\n'),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'We could not send your enquiry. Please try again.');
      }
      setLeadState('sent');
      trackAnalyticsEvent('lead_form_submit', {
        ...courseParams,
        form_id: 'apply-now-form-a',
        success: true,
      }, { source: 'apply-now-form' });
      trackAnalyticsEvent('counselor_request', courseParams, { source: 'apply-now-form' });
    } catch (error) {
      setLeadState('error');
      setLeadError(error instanceof Error ? error.message : 'We could not send your enquiry.');
      trackAnalyticsEvent('lead_form_submit', {
        ...courseParams,
        form_id: 'apply-now-form-a',
        success: false,
        error_code: 'network',
      }, { source: 'apply-now-form' });
    }
  };

  const needsProfile = authState === 'student' && readiness !== null && !readiness.complete;

  return (
    <div className="space-y-6">
      {/* Course being applied for */}
      <section className="rounded-2xl border border-alo-brand-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-alo-brand-border bg-alo-brand-light px-3 py-1 text-[11px] font-semibold tracking-wide text-alo-brand">
            FORM A — APPLY NOW
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-alo-brand-border px-3 py-1 text-[11px] font-semibold text-alo-text-muted">
            <Lock className="h-3 w-3" /> Login / Register required
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-alo-text sm:text-3xl">{course.courseTitle}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-alo-text-muted">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-4 w-4 text-alo-cta" />
            {course.universitySlug ? (
              <Link href={`/universities/${course.universitySlug}`} className="font-semibold text-alo-brand hover:text-alo-cta">
                {course.universityName || 'University'}
              </Link>
            ) : (
              course.universityName || 'University'
            )}
          </span>
          {(course.city || course.country) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-alo-cta" /> {[course.city, course.country].filter(Boolean).join(', ')}
            </span>
          )}
          {course.studyLevel && <span>{course.studyLevel}</span>}
          {course.durationMonths > 0 && <span>{course.durationMonths} months</span>}
          <span>Tuition: {formatMoney(course.tuitionFee, course.currency)}</span>
        </p>
      </section>

      {/* Step 1 — identity */}
      {authState === 'checking' && (
        <section className="rounded-2xl border border-alo-brand-border bg-white p-8 text-center text-alo-text-muted">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="mt-3 text-sm">Checking your ALO account…</p>
        </section>
      )}

      {authState === 'anonymous' && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-alo-brand-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-alo-text">Step 1 — Sign in or create your account</h2>
            <p className="mt-2 text-sm text-alo-text-muted">
              Applications live in your ALO student portal, so you need an account before we can open one.
              Registration takes a minute — we email you a 6-digit code to verify your address.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={registerHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-alo-cta px-5 py-3 text-sm font-bold text-white transition hover:brightness-95"
              >
                Register &amp; continue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={loginHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-alo-brand-border px-5 py-3 text-sm font-bold text-alo-brand transition hover:border-alo-cta hover:text-alo-cta"
              >
                I already have an account
              </Link>
            </div>
            <ul className="mt-5 space-y-2 text-[13px] text-alo-text-muted">
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" /> Your email is verified before portal access — no unverified accounts.</li>
              <li className="flex gap-2"><ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-alo-cta" /> Next you complete Form B (your application profile), then this page creates the draft.</li>
            </ul>
          </div>

          <form onSubmit={submitLead} className="rounded-2xl border border-alo-brand-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-alo-text">Not ready to register? Send us your details</h2>
            <p className="mt-2 text-sm text-alo-text-muted">
              We will log your interest for this course and a counselor will call you back.
            </p>
            {leadState === 'sent' ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                Thank you — your details are with the ALO counseling team. Register any time to open the application.
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-alo-text">
                    Full name *
                    <input required value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-alo-text">
                    Email *
                    <input required type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-alo-text">
                    Phone / WhatsApp *
                    <input required value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                      placeholder="+8801XXXXXXXXX"
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-alo-text">
                    Preferred destination
                    <select value={lead.destination} onChange={(e) => setLead({ ...lead, destination: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal">
                      <option value="">Select</option>
                      {[course.country, ...DESTINATIONS].filter((v, i, arr) => v && arr.indexOf(v) === i).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-alo-text">
                    Intended intake
                    <select value={lead.intake} onChange={(e) => setLead({ ...lead, intake: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal">
                      <option value="">Select</option>
                      {intakes.map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-alo-text">
                    Course level
                    <select value={lead.level} onChange={(e) => setLead({ ...lead, level: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal">
                      <option value="">Select</option>
                      {[course.studyLevel, ...STUDY_LEVELS].filter((v, i, arr) => v && arr.indexOf(v) === i).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-alo-text sm:col-span-2">
                    Anything we should know?
                    <textarea rows={3} value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal" />
                  </label>
                </div>
                {leadState === 'error' && (
                  <p className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4" /> {leadError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={leadState === 'sending'}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-alo-cta px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
                >
                  {leadState === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Request a callback
                </button>
              </>
            )}
          </form>
        </section>
      )}

      {authState === 'student' && (
        <section className="rounded-2xl border border-alo-brand-border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-alo-text">Step 2 — Application details</h2>
          <p className="mt-1 text-sm text-alo-text-muted">
            Signed in{student?.name ? ` as ${student.name}` : ''}{student?.studentId ? ` (${student.studentId})` : ''}.
            Everything here travels into your student profile and to your counselor.
          </p>

          {needsProfile && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Your application profile (Form B) is {readiness?.percent ?? 0}% complete. We will not create an application until it is finished — this is the rule for every Apply Now on the site.
              </p>
              <ul className="mt-3 space-y-2">
                {(readiness?.missing || []).map((section) => (
                  <li key={section.key}>
                    <Link href={section.href} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-alo-brand hover:border-alo-cta hover:text-alo-cta">
                      <span>{section.label}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-alo-cta">Complete <ArrowRight className="h-3 w-3" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void loadReadiness()}
                className="mt-3 text-xs font-semibold text-alo-brand underline underline-offset-2"
              >
                I have finished a section — check again
              </button>
            </div>
          )}

          {readinessError && !readiness && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {readinessError} — you can still submit; the server re-checks before creating anything.
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-alo-text">
              Intake you are applying for *
              <select
                value={selectedIntake}
                onChange={(e) => setSelectedIntake(e.target.value)}
                className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
              >
                <option value="">Select an intake</option>
                {intakes.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}{option.deadline ? ` — deadline ${option.deadline}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-alo-text">
              Course
              <input readOnly value={course.courseTitle} className="mt-1 w-full rounded-lg border border-alo-brand-border bg-alo-brand-light px-3 py-2 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold text-alo-text sm:col-span-2">
              Notes for your counselor (optional)
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything your counselor should know before they review this application."
                className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
              />
            </label>
          </div>

          {intakes.length > 0 && (
            <div className="mt-4 rounded-xl border border-alo-brand-border bg-alo-brand-light p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-alo-text-muted">Recorded intakes for this course</p>
              <ul className="mt-2 grid gap-1 text-[13px] text-alo-body sm:grid-cols-2">
                {intakes.map((option) => (
                  <li key={option.label} className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-alo-cta" />
                    <span className="font-semibold">{option.label}</span>
                    {option.deadline && <span className="text-alo-text-muted">· deadline {option.deadline}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={submitApplication}
            disabled={submitting || !selectedIntake || (readiness ? !readiness.complete : false)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-alo-cta px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {needsProfile ? 'Complete Form B to enable Apply Now' : 'Apply Now — create my application draft'}
          </button>
          <p className="mt-2 text-center text-[11px] text-alo-text-muted">
            Applying creates a draft, a document checklist, a timeline entry and a counselor notification. Nothing is sent to the university without your counselor.
          </p>

          {result && (
            <div className={`mt-5 rounded-xl border p-4 text-sm ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {result.ok ? (
                <>
                  <p className="flex items-start gap-2 font-semibold">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {result.message}
                  </p>
                  {result.applicationCode && <p className="mt-2 text-xs">Application reference: <span className="font-mono font-bold">{result.applicationCode}</span></p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/student/applications" className="rounded-lg bg-alo-brand px-4 py-2 text-xs font-bold text-white">View my applications</Link>
                    <Link href="/student/profile" className="rounded-lg border border-alo-brand-border bg-white px-4 py-2 text-xs font-bold text-alo-brand">Open Form B</Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-2 font-semibold">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {result.message}
                  </p>
                  {result.missing && result.missing.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {result.missing.map((section) => (
                        <li key={section.key}>
                          <Link href={section.href} className="text-xs font-semibold underline underline-offset-2">{section.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      <p className="text-center text-xs text-alo-text-muted">
        Prefer to talk it through? <Link href="/book-consultation" className="font-semibold text-alo-brand underline underline-offset-2">Book a counseling session</Link>{' '}
        or <Link href={`/course/${encodeURIComponent(course.courseSlug)}`} className="font-semibold text-alo-brand underline underline-offset-2">read the full course details</Link>.
      </p>
    </div>
  );
}
