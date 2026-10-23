'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type UniversityDraftForm = {
  name: string;
  country: string;
  city: string;
  website: string;
  sourceUrl: string;
  ranking: string;
  overview: string;
};

type CreateResult = {
  success?: boolean;
  error?: string;
  message?: string;
  duplicateDetected?: boolean;
  university?: { id: string; universityId: string; name: string; country: string; verificationStatus: string; publicationStatus: string };
  existingUniversity?: { id: string; universityId: string; name: string; country: string };
};

const EMPTY_FORM: UniversityDraftForm = { name: '', country: '', city: '', website: '', sourceUrl: '', ranking: '', overview: '' };
const STEPS = ['University details', 'Sources and facts', 'Review and save'];

export default function AdminCreateUniversityPage() {
  const [form, setForm] = useState<UniversityDraftForm>(EMPTY_FORM);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState('');

  function update<K extends keyof UniversityDraftForm>(key: K, value: UniversityDraftForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setResult(null);
    setFormError('');
  }

  function continueStep() {
    setFormError('');
    if (activeStep === 0 && (!form.name.trim() || !form.country.trim())) {
      setFormError('University name and country are required before continuing.');
      return;
    }
    if (activeStep < STEPS.length - 1) setActiveStep((current) => current + 1);
  }

  async function createDraft() {
    setLoading(true);
    setFormError('');
    try {
      const response = await fetch('/api/admin/universities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ranking: form.ranking.trim() ? Number(form.ranking) : 0, description: form.overview }),
      });
      const payload = await response.json().catch(() => ({}));
      setResult(payload as CreateResult);
      if (!response.ok || !payload.success) setFormError(payload.error || `Could not save this draft (${response.status}).`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'University draft could not be saved.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setResult(null);
    setFormError('');
    setActiveStep(0);
  }

  return (
    <main className="min-h-screen bg-[var(--alo-page)] px-4 pb-16 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-[var(--alo-border)] bg-white p-6 shadow-sm sm:p-8">
          <Badge className="mb-3 border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]">University research workflow</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Add a university</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--alo-body)]">
            Save a sourced research draft for review. The server generates its university ID; this form never publishes or marks facts verified.
          </p>
          <ol className="mt-6 grid gap-2 sm:grid-cols-3" aria-label="University creation steps">
            {STEPS.map((step, index) => (
              <li key={step} aria-current={activeStep === index ? 'step' : undefined} className={`rounded-xl border px-3 py-2 text-sm ${activeStep === index ? 'border-blue-300 bg-[var(--alo-brand-pale)] font-semibold text-[var(--alo-brand-deep)]' : index < activeStep ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-text-muted)]'}`}>
                <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold">{index + 1}</span>{step}
              </li>
            ))}
          </ol>
        </header>

        <Card className="rounded-2xl border-[var(--alo-border)] bg-white p-5 shadow-sm sm:p-7">
          {activeStep === 0 && (
            <section className="space-y-5" aria-labelledby="details-heading">
              <div><h2 id="details-heading" className="text-lg font-semibold text-[var(--alo-text)]">University details</h2><p className="mt-1 text-sm text-[var(--alo-text-muted)]">Provide the entity name and location used for deduplication and the public-page slug.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="university-name">University name <span className="text-red-600">*</span></Label><Input id="university-name" autoComplete="organization" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="University of Example" maxLength={180} required /></div>
                <div className="space-y-2"><Label htmlFor="university-country">Country <span className="text-red-600">*</span></Label><Input id="university-country" autoComplete="country-name" value={form.country} onChange={(event) => update('country', event.target.value)} placeholder="Canada" maxLength={120} required /></div>
                <div className="space-y-2"><Label htmlFor="university-city">City</Label><Input id="university-city" value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Toronto" maxLength={120} /></div>
                <div className="space-y-2"><Label htmlFor="university-website">Official website</Label><Input id="university-website" type="url" inputMode="url" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://www.example.edu" maxLength={500} /></div>
              </div>
            </section>
          )}

          {activeStep === 1 && (
            <section className="space-y-5" aria-labelledby="sources-heading">
              <div><h2 id="sources-heading" className="text-lg font-semibold text-[var(--alo-text)]">Sources and facts</h2><p className="mt-1 text-sm text-[var(--alo-text-muted)]">Facts remain research-required until an authorized reviewer checks the source.</p></div>
              <div className="space-y-2"><Label htmlFor="official-source">Official or authoritative source URL</Label><Input id="official-source" type="url" inputMode="url" value={form.sourceUrl} onChange={(event) => update('sourceUrl', event.target.value)} placeholder="https://www.example.edu/admissions" maxLength={500} /><p className="text-xs text-[var(--alo-text-muted)]">Only HTTPS links are accepted. Do not enter a fact unless its source can be traced.</p></div>
              <div className="space-y-2"><Label htmlFor="university-ranking">Ranking (optional)</Label><Input id="university-ranking" type="number" min="0" step="1" value={form.ranking} onChange={(event) => update('ranking', event.target.value)} placeholder="Leave blank if unknown" /><p className="text-xs text-[var(--alo-text-muted)]">A ranking without a source will still be stored as an unverified draft value.</p></div>
              <div className="space-y-2"><Label htmlFor="university-overview">Research notes / overview</Label><Textarea id="university-overview" value={form.overview} onChange={(event) => update('overview', event.target.value)} placeholder="Add concise notes and cite the source in the URL above." maxLength={5000} rows={6} /><p className="text-right text-xs text-[var(--alo-text-muted)]">{form.overview.length}/5,000</p></div>
            </section>
          )}

          {activeStep === 2 && (
            <section className="space-y-5" aria-labelledby="review-heading">
              <div><h2 id="review-heading" className="text-lg font-semibold text-[var(--alo-text)]">Review before saving</h2><p className="mt-1 text-sm text-[var(--alo-text-muted)]">Saving creates an inactive research record only. Verification and publication require separate approval workflows.</p></div>
              <dl className="grid gap-3 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-4 sm:grid-cols-2">
                <div><dt className="text-xs font-medium uppercase tracking-wide text-[var(--alo-text-muted)]">University</dt><dd className="mt-1 font-medium text-[var(--alo-text)]">{form.name || '—'}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-[var(--alo-text-muted)]">Country / city</dt><dd className="mt-1 text-[var(--alo-text)]">{[form.country, form.city].filter(Boolean).join(' · ') || '—'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-[var(--alo-text-muted)]">Official website</dt><dd className="mt-1 break-all text-[var(--alo-text)]">{form.website || 'Not provided'}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-[var(--alo-text-muted)]">Source</dt><dd className="mt-1 break-all text-[var(--alo-text)]">{form.sourceUrl || 'Not provided — any facts must remain unverified'}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-[var(--alo-text-muted)]">Ranking</dt><dd className="mt-1 text-[var(--alo-text)]">{form.ranking || 'Unknown'}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-[var(--alo-text-muted)]">Initial status</dt><dd className="mt-1 text-[var(--alo-text)]">RESEARCH_REQUIRED · draft · inactive</dd></div>
              </dl>
              {result?.success && result.university && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <p className="font-semibold">Research draft saved</p>
                  <p className="mt-1">Generated university ID: <code className="rounded bg-white px-1.5 py-0.5">{result.university.universityId}</code></p>
                  <p className="mt-1">Status: {result.university.verificationStatus} · {result.university.publicationStatus}</p>
                </div>
              )}
              {result?.duplicateDetected && result.existingUniversity && (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p className="font-semibold">Possible duplicate found</p>
                  <p className="mt-1">{result.existingUniversity.name} · {result.existingUniversity.country} · {result.existingUniversity.universityId}</p>
                  <p className="mt-1">Review the existing university record instead of creating another one.</p>
                </div>
              )}
            </section>
          )}

          {formError && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--alo-border)] pt-5">
            <Link href="/admin/universities" className="text-sm font-medium text-[var(--alo-body)] underline-offset-4 hover:text-[var(--alo-text)] hover:underline">Back to universities</Link>
            <div className="flex gap-2">
              {result?.success ? (
                <Button type="button" variant="outline" onClick={resetForm}>Create another draft</Button>
              ) : (
                <>
                  <Button type="button" variant="outline" disabled={activeStep === 0 || loading} onClick={() => { setFormError(''); setActiveStep((current) => Math.max(0, current - 1)); }}>Back</Button>
                  {activeStep < STEPS.length - 1 ? (
                    <Button type="button" onClick={continueStep}>Continue</Button>
                  ) : (
                    <Button type="button" disabled={loading || !form.name.trim() || !form.country.trim()} onClick={createDraft}>{loading ? 'Saving draft…' : 'Save research draft'}</Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
