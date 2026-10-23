'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Mail, Save, UserPlus } from 'lucide-react';
import {
  APPLICATION_FORM_SECTIONS,
  visibleFields,
  type FormSectionDefinition,
} from '@/lib/forms/application-form-schema';

/**
 * FORM C — manual lead add (counselor)
 * ====================================
 * The same Form B section set, rendered from the shared schema, so a counseling
 * session can be completed at the desk exactly as a student would complete it in
 * the portal. Nothing here invents its own fields: if a field is added to Form B
 * it appears here too (src/lib/forms/application-form-schema.ts is the stitcher).
 *
 * Values are posted to /api/crm/leads/counselling, which stores the lead in the
 * CRM, creates/attaches the student profile and marks the captured sections
 * complete so the Apply Now gate recognises them.
 */

type SectionValues = Record<string, string | boolean>;
/** Extra repeatable rows captured in the same session, per section key. */
type RepeatRows = Record<string, SectionValues[]>;

const SECTION_ORDER: FormSectionDefinition['key'][] = [
  'lead',
  'personal',
  'contact',
  'education',
  'passport',
  'english',
  'work',
  'reference',
  'background',
  'admission',
  'funding',
  'notes',
];

export default function ManualLeadPage() {
  const [activeSection, setActiveSection] = useState<FormSectionDefinition['key']>('lead');
  const [values, setValues] = useState<Record<string, SectionValues>>({});
  const [extraRows, setExtraRows] = useState<RepeatRows>({});
  const [counselorId, setCounselorId] = useState('');
  const [counselingMode, setCounselingMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; leadId?: string; studentId?: string; sections?: string[] } | null>(null);

  const orderedSections = useMemo(
    () => SECTION_ORDER
      .map((key) => APPLICATION_FORM_SECTIONS.find((section) => section.key === key))
      .filter((section): section is FormSectionDefinition => Boolean(section)),
    []
  );

  const section = orderedSections.find((entry) => entry.key === activeSection) || orderedSections[0];
  const sectionValues = values[section.key] || {};

  const setValue = (key: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [section.key]: { ...(prev[section.key] || {}), [key]: value } }));

  const addRow = (key: string) => {
    const current = values[key] || {};
    setExtraRows((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { ...current }],
    }));
    setValues((prev) => ({ ...prev, [key]: {} }));
  };

  const removeRow = (key: string, index: number) =>
    setExtraRows((prev) => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== index) }));

  const filledSections = Object.entries(values)
    .filter(([, payload]) => Object.values(payload).some((value) => String(value).trim() !== ''))
    .map(([key]) => key);

  const save = async () => {
    setSaving(true);
    setResult(null);
    try {
      const sections: Record<string, Record<string, string>> = {};
      for (const [key, payload] of Object.entries(values)) {
        const clean: Record<string, string> = {};
        for (const [field, value] of Object.entries(payload)) {
          const text = String(value ?? '').trim();
          if (text) clean[field] = text;
        }
        if (Object.keys(clean).length > 0) sections[key] = clean;
      }
      // Repeatable sections: attach the stored extra rows so nothing the
      // counselor typed is dropped before the API call.
      for (const [key, rows] of Object.entries(extraRows)) {
        rows.forEach((row, index) => {
          const clean: Record<string, string> = {};
          for (const [field, value] of Object.entries(row)) {
            const text = String(value ?? '').trim();
            if (text) clean[`${field}_${index + 2}`] = text;
          }
          sections[key] = { ...(sections[key] || {}), ...clean };
        });
      }

      const res = await fetch('/api/crm/leads/counselling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sections, counselorId, counselingMode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'The lead could not be created.');
      setResult({
        ok: true,
        message: json.message || 'Lead created.',
        leadId: json.data?.leadId,
        studentId: json.data?.studentId,
        sections: json.data?.sections,
      });
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : 'The lead could not be created.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[var(--alo-brand)]">
          <UserPlus className="size-3.5" /> FORM C — MANUAL LEAD ADD
        </span>
        <h1 className="mt-3 text-2xl font-bold text-[var(--alo-text)]">Add a lead and complete counseling</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--alo-body)]">
          The same sections the student fills in Form B, in the same order — so a phone or walk-in counseling session can
          be captured completely at the desk. Saving creates the CRM lead, attaches the student profile and marks every
          captured section complete, which is what later unlocks Apply Now for that student.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="lg:w-64 shrink-0">
          <div className="space-y-1">
            {orderedSections.map((entry, index) => {
              const isActive = entry.key === section.key;
              const captured = filledSections.includes(entry.key);
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setActiveSection(entry.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    isActive ? 'bg-[var(--alo-brand)] text-white shadow-sm' : 'text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)]'
                  }`}
                >
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : captured ? 'bg-green-100 text-green-700' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]'
                  }`}>
                    {!isActive && captured ? <CheckCircle2 className="size-3.5" /> : index + 1}
                  </span>
                  {entry.label}
                </button>
              );
            })}
          </div>
        </nav>

        <section className="min-w-0 flex-1 rounded-xl border border-[var(--alo-border)] bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--alo-text)]">
                <ClipboardList className="size-4 text-[var(--alo-brand)]" /> {section.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--alo-body)]">{section.description}</p>
              {section.requiredForApplication && (
                <p className="mt-1 text-xs font-semibold text-amber-700">Required before the student can apply.</p>
              )}
            </div>
            {section.repeatable && (
              <button
                type="button"
                onClick={() => addRow(section.key)}
                className="shrink-0 rounded-lg border border-[var(--alo-border)] px-3 py-2 text-xs font-semibold text-[var(--alo-brand)] hover:bg-[var(--alo-page)]"
              >
                + Save row &amp; add another
              </button>
            )}
          </div>

          {(extraRows[section.key] || []).length > 0 && (
            <ul className="mt-4 space-y-1">
              {(extraRows[section.key] || []).map((row, index) => (
                <li key={index} className="flex items-center justify-between rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] px-3 py-2 text-xs">
                  <span className="truncate text-[var(--alo-body)]">
                    Row {index + 2}: {Object.values(row).filter(Boolean).slice(0, 3).join(' · ') || 'empty'}
                  </span>
                  <button type="button" onClick={() => removeRow(section.key, index)} className="font-semibold text-red-600">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {visibleFields(section, sectionValues).map((field) => {
              const value = sectionValues[field.name];
              const label = (
                <span className="text-xs font-semibold text-[var(--alo-text)]">
                  {field.label}{field.required ? ' *' : ''}
                  <span className="ml-1 font-normal text-[11px] text-[var(--alo-text-muted)]">→ {field.crm}</span>
                </span>
              );
              const wide = field.type === 'textarea';
              return (
                <label key={field.name} className={wide ? 'sm:col-span-2' : ''}>
                  {label}
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={String(value || '')}
                      placeholder={field.placeholder}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--alo-border)] px-3 py-2 text-sm"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={String(value || '')}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--alo-border)] px-3 py-2 text-sm"
                    >
                      <option value="">Select</option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <span className="mt-2 flex items-center gap-2 text-sm text-[var(--alo-body)]">
                      <input
                        type="checkbox"
                        checked={value === true || value === 'true'}
                        onChange={(event) => setValue(field.name, event.target.checked)}
                        className="size-4"
                      />
                      Yes
                    </span>
                  ) : field.type === 'radio' ? (
                    <span className="mt-2 flex flex-wrap gap-3">
                      {(field.options || ['Yes', 'No']).map((option) => (
                        <span key={option} className="flex items-center gap-1.5 text-sm text-[var(--alo-body)]">
                          <input
                            type="radio"
                            name={`${section.key}-${field.name}`}
                            checked={String(value || '') === option}
                            onChange={() => setValue(field.name, option)}
                            className="size-4"
                          />
                          {option}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <input
                      type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                      value={String(value || '')}
                      placeholder={field.placeholder}
                      onChange={(event) => setValue(field.name, event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--alo-border)] px-3 py-2 text-sm"
                    />
                  )}
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--alo-border)] pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-xs font-semibold text-[var(--alo-text)]">
                Assign to counselor ID (leave blank to keep it with you)
                <input
                  value={counselorId}
                  onChange={(event) => setCounselorId(event.target.value)}
                  className="mt-1 w-64 rounded-lg border border-[var(--alo-border)] px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--alo-text)]">
                <input
                  type="checkbox"
                  checked={counselingMode}
                  onChange={(event) => setCounselingMode(event.target.checked)}
                  className="size-4"
                />
                This was a counseling session
              </label>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--alo-brand)] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save lead &amp; sections
            </button>
          </div>

          <p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">
            Captured sections so far: {filledSections.length > 0 ? filledSections.join(', ') : 'none yet'}.
            {values.notes?.sendWelcomeEmail === true || values.notes?.sendWelcomeEmail === 'true'
              ? ' A welcome email will be sent on save.'
              : ''}
          </p>

          {result && (
            <div className={`mt-4 rounded-xl border p-4 text-sm ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
              <p className="flex items-start gap-2 font-semibold">
                {result.ok ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertTriangle className="mt-0.5 size-4" />}
                {result.message}
              </p>
              {result.ok && (
                <div className="mt-2 space-y-1 text-xs">
                  {result.studentId && <p>Student profile: <span className="font-mono">{result.studentId}</span></p>}
                  {result.sections && <p>Sections marked complete: {result.sections.join(', ')}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href="/crm/students" className="rounded-lg bg-[var(--alo-brand)] px-3 py-1.5 font-bold text-white">Open student</Link>
                    <Link href="/crm/leads" className="rounded-lg border border-[var(--alo-border)] bg-white px-3 py-1.5 font-bold text-[var(--alo-brand)]">Lead queue</Link>
                  </div>
                </div>
              )}
              {result.ok && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-800">
                  <Mail className="size-3" /> Verification and welcome emails use the address captured in Lead Information.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
