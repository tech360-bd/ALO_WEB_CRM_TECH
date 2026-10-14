'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, MessageSquare, Send } from 'lucide-react';

/**
 * ENQUIRY FORM — one fixed structure for every context (spec 3.2):
 *   • course enquiry      → type="course"
 *   • university enquiry  → type="university"
 *   • scholarship enquiry → type="scholarship"
 *
 * The brief asks for "Type of Form with stitcher fixed for every where", so the
 * fields, validation, submit path and success state live here once and every
 * page mounts the same component with a different context object. Nothing about
 * the layout changes between contexts — only the prefilled subject/institution.
 *
 * Submission goes to the shared lead endpoint, which already:
 *   • de-duplicates phone/email within 30 days,
 *   • round-robins the lead to an active counselor (CRM integration),
 *   • notifies the assigned counselor in the portal,
 *   • emails the student a confirmation and the counseling inbox a notification.
 */

export type EnquiryType = 'course' | 'university' | 'scholarship';

export interface EnquiryContext {
  type: EnquiryType;
  /** Course title, university name or scholarship name. */
  subject: string;
  /** University name for a course enquiry, or the awarding body. */
  institution?: string;
  /** Destination country, when known. */
  country?: string;
  /** Slug or id of the record the enquiry is about. */
  reference?: string;
}

const DESTINATIONS = ['United Kingdom', 'Australia', 'Canada', 'Ireland', 'New Zealand', 'USA', 'Dubai', 'Other'];
const STUDY_LEVELS = ['Foundation', 'Undergraduate', 'Postgraduate', 'MRes', 'PhD'];

const COPY: Record<EnquiryType, { heading: string; blurb: string; subjectLabel: string; cta: string }> = {
  course: {
    heading: 'Course enquiry',
    blurb: 'Ask about entry requirements, tuition, deadlines or your chances for this course.',
    subjectLabel: 'Course',
    cta: 'Send course enquiry',
  },
  university: {
    heading: 'University enquiry',
    blurb: 'Ask about this university — available courses, scholarships, campus or admission steps.',
    subjectLabel: 'University',
    cta: 'Send university enquiry',
  },
  scholarship: {
    heading: 'Scholarship enquiry',
    blurb: 'Ask whether you qualify, what documents are needed and when to apply for this scholarship.',
    subjectLabel: 'Scholarship',
    cta: 'Send scholarship enquiry',
  },
};

export default function EnquiryForm({
  context,
  className = '',
  compact = false,
}: {
  context: EnquiryContext;
  className?: string;
  compact?: boolean;
}) {
  const copy = COPY[context.type];
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    destination: context.country || '',
    level: '',
    intake: '',
    message: '',
    whatsappOptIn: true,
  });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please add your name, email and phone number so the counselor can reply.');
      setState('error');
      return;
    }
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/website/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          preferredCountry: form.destination,
          preferredLevel: form.level,
          preferredSubject: context.subject,
          intake: form.intake,
          message: form.message,
          contactChannel: form.whatsappOptIn ? 'whatsapp' : 'phone',
          source: `${context.type}_enquiry`,
          sourceSection: `${context.type}-enquiry — ${context.subject}${context.reference ? ` (${context.reference})` : ''}`,
          leadType: `${context.type}_enquiry`,
          service: context.subject,
          status: 'new',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.error || 'Your enquiry could not be sent. Please try again.');
      setState('sent');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your enquiry could not be sent.');
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <section className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-6 ${className}`} aria-live="polite">
        <h3 className="flex items-center gap-2 text-base font-bold text-emerald-900">
          <CheckCircle2 className="h-5 w-5" /> {copy.heading} sent
        </h3>
        <p className="mt-2 text-sm text-emerald-900">
          Thank you, {form.name}. A confirmation email is on its way to {form.email}, and a counselor will reply within
          24 hours{form.whatsappOptIn ? ' — first on WhatsApp' : ''}.
        </p>
        <p className="mt-3 text-xs text-emerald-800">
          Want to move faster?{' '}
          <Link href="/book-consultation" className="font-semibold underline underline-offset-2">Book a free counseling session</Link>{' '}
          or{' '}
          <Link href="/register" className="font-semibold underline underline-offset-2">create your student account</Link>{' '}
          to start an application.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className={`rounded-2xl border border-alo-brand-border bg-white p-6 ${className}`}>
      <h3 className="flex items-center gap-2 text-base font-bold text-alo-text-heading">
        <MessageSquare className="h-4 w-4 text-alo-cta" /> {copy.heading}
      </h3>
      <p className="mt-1 text-sm text-alo-text-muted">{copy.blurb}</p>
      <p className="mt-3 rounded-lg border border-alo-brand-border bg-alo-brand-light px-3 py-2 text-xs text-alo-text-body">
        <span className="font-semibold">{copy.subjectLabel}:</span> {context.subject}
        {context.institution ? ` · ${context.institution}` : ''}
      </p>

      <div className={`mt-4 grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        <label className="text-xs font-semibold text-alo-text-heading">
          Full name *
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-alo-text-heading">
          Email *
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-alo-text-heading">
          Phone / WhatsApp *
          <input
            required
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="+8801XXXXXXXXX"
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-alo-text-heading">
          Preferred destination
          <select
            value={form.destination}
            onChange={(event) => setForm({ ...form, destination: event.target.value })}
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          >
            <option value="">Select</option>
            {[context.country, ...DESTINATIONS].filter((value, index, all) => value && all.indexOf(value) === index).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-alo-text-heading">
          Course level
          <select
            value={form.level}
            onChange={(event) => setForm({ ...form, level: event.target.value })}
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          >
            <option value="">Select</option>
            {STUDY_LEVELS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-alo-text-heading">
          Intended intake
          <input
            value={form.intake}
            onChange={(event) => setForm({ ...form, intake: event.target.value })}
            placeholder="e.g. September 2027"
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          />
        </label>
        <label className={`text-xs font-semibold text-alo-text-heading ${compact ? '' : 'sm:col-span-2'}`}>
          Your question
          <textarea
            rows={3}
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Tell us what you would like to know — the more detail, the better the answer."
            className="mt-1 w-full rounded-lg border border-alo-brand-border px-3 py-2 text-sm font-normal"
          />
        </label>
      </div>

      <label className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
        <input
          type="checkbox"
          checked={form.whatsappOptIn}
          onChange={(event) => setForm({ ...form, whatsappOptIn: event.target.checked })}
          className="mt-0.5 h-4 w-4"
        />
        <span><span className="font-semibold">Reply on WhatsApp</span> — quickest channel for international students.</span>
      </label>

      {state === 'error' && (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-alo-cta px-5 py-3 text-sm font-bold text-black transition hover:brightness-95 disabled:opacity-60"
      >
        {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {copy.cta}
      </button>
      <p className="mt-2 text-center text-[11px] text-alo-text-muted">
        We reply within 24 hours. Your details go to a counselor, not to a mailing list.
      </p>
    </form>
  );
}
