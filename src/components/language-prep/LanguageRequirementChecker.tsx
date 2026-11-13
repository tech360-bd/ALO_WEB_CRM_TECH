'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Requirement = { id: string; testName?: string; universityName?: string; courseName?: string; minimumScore: string; componentRequirements?: string; waiverAvailable?: boolean; sourceUrl?: string; lastVerifiedAt?: string };

export default function LanguageRequirementChecker({ testSlug }: { testSlug?: string }) {
  const [filters, setFilters] = useState({ country: '', university: '', course: '' });
  const [rows, setRows] = useState<Requirement[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function search(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ ...filters, ...(testSlug ? { test: testSlug } : {}) });
      const response = await fetch(`/api/language-prep/requirements?${query}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error('Requirements could not be loaded. Please retry.');
      setRows(data.requirements);
    } catch { setError('Requirements could not be loaded. Please retry.'); }
    finally { setLoading(false); }
  }
  return <div>
    <form onSubmit={search} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">{(['country', 'university', 'course'] as const).map(key => <label key={key} className="text-sm font-semibold capitalize">{key}<Input value={filters[key]} maxLength={120} onChange={event => setFilters({ ...filters, [key]: event.target.value })} required={key === 'university'} className="mt-2 bg-white" /></label>)}</div>
      <Button type="submit" disabled={loading}>{loading ? 'Checking requirements…' : 'Check Requirements'}</Button>
    </form>
    <div className="mt-5 space-y-3" aria-live="polite" aria-busy={loading}>
      {error && <p role="alert" className="text-sm text-crm-danger-text">{error}</p>}
      {rows && rows.length === 0 && !error && <p className="text-sm">No matching requirements are recorded. Check the official university course page or ask ALO to confirm the requirement.</p>}
      {!error && rows?.map(row => <article key={row.id} className="rounded-xl border border-[var(--alo-border)] bg-white p-4 text-sm">
        <h3 className="font-bold">{row.universityName} · {row.courseName}</h3>
        <p className="mt-2">{row.testName} · Recorded minimum: {row.minimumScore || 'Not recorded'}</p>
        {row.componentRequirements && <p className="mt-2 break-words">Components: {row.componentRequirements}</p>}
        <p className="mt-2">Waiver recorded: {row.waiverAvailable ? 'Yes; confirm conditions' : 'No waiver recorded'}</p>
        <p className="mt-2">Last source check: {row.lastVerifiedAt ? row.lastVerifiedAt.slice(0, 10) : 'Not recorded; confirmation required'}</p>
        {row.sourceUrl?.startsWith('https://') && <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[var(--alo-brand)] underline">Official requirement source</a>}
      </article>)}
    </div>
    <p className="mt-4 text-xs text-[var(--alo-body)]">Recorded requirements are guidance, not an admission or visa decision. Confirm the exact exam, current overall score, component minimums and any waiver with the institution.</p>
  </div>;
}
