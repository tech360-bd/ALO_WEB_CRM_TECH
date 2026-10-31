'use client';

import { useEffect, useState } from 'react';
import { Award, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ScholarshipRecord {
  id: string;
  scholarshipName: string;
  universityName: string;
  scholarshipAmount: number;
  scholarshipCurrency: string;
  awardPercentage: number;
  eligibleCountries: string;
  eligibleLevels: string;
  deadline: string;
  verificationStatus: string;
  officialScholarshipUrl: string;
}

function sourceLink(value: string): string | null {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}

export default function CrmScholarshipsPage() {
  const [records, setRecords] = useState<ScholarshipRecord[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setRecords([]); setTotal(null); setPages(0);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '24', search: search.trim() });
        const response = await fetch(`/api/crm/scholarships?${params}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.data) || !Number.isSafeInteger(body.total) || !Number.isSafeInteger(body.totalPages)) throw new Error('Unavailable');
        if (!controller.signal.aborted) { setRecords(body.data); setTotal(body.total); setPages(body.totalPages); }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, reload]);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-[var(--alo-text)]">Scholarship catalogue</h1><p className="mt-2 max-w-3xl text-sm text-[var(--alo-body)]">Actual CRM scholarship records only. Awards are not inferred from tuition fees. Review the recorded verification status and official evidence before advising a student.</p></div>
      <Button variant="outline" onClick={() => setReload((value) => value + 1)} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
    </header>
    <div className="max-w-xl"><label htmlFor="crm-scholarship-search" className="mb-2 block text-sm font-medium">Search scholarship records</label><div className="relative"><Search className="absolute left-3 top-4 h-4 w-4 text-[var(--alo-text-muted)]" /><Input id="crm-scholarship-search" value={search} maxLength={200} placeholder="Scholarship name, university ID or course ID" className="pl-10" onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></div>
    {loading ? <p role="status">Loading scholarship records…</p> : error ? <Card><CardContent className="space-y-3 p-6"><p role="alert">Scholarship records could not be loaded. This is not evidence that no scholarships exist.</p><Button variant="outline" onClick={() => setReload((value) => value + 1)}>Retry</Button></CardContent></Card> : <>
      <p role="status" className="text-sm text-[var(--alo-text-muted)]">{total} matching stored records. Verification is shown per record.</p>
      {!records.length && <Card><CardContent className="p-8 text-center"><Award className="mx-auto mb-3 h-8 w-8 text-[var(--alo-text-muted)]" /><p>No matching scholarship records.</p><p className="mt-2 text-sm text-[var(--alo-text-muted)]">No estimated awards have been added. Missing records do not prove that funding is unavailable.</p></CardContent></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => {
        const source = sourceLink(record.officialScholarshipUrl);
        return <Card key={record.id}><CardContent className="space-y-3 p-5">
          <h2 className="font-semibold">{record.scholarshipName || 'Name not recorded'}</h2>
          <p className="text-sm text-[var(--alo-body)]">{record.universityName}</p>
          <Badge variant="outline">{(record.verificationStatus || 'NEEDS_REVIEW').replace(/_/g, ' ')}</Badge>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-[var(--alo-text-muted)]">Recorded award</dt><dd>{record.scholarshipAmount > 0 ? `${record.scholarshipAmount.toLocaleString()} ${record.scholarshipCurrency || '(currency not recorded)'}` : record.awardPercentage > 0 ? `${record.awardPercentage}%` : 'Not recorded'}</dd></div>
            <div><dt className="text-[var(--alo-text-muted)]">Deadline</dt><dd>{record.deadline || 'Not recorded'}</dd></div>
            <div><dt className="text-[var(--alo-text-muted)]">Eligible countries</dt><dd>{record.eligibleCountries && record.eligibleCountries !== '[]' ? record.eligibleCountries : 'Not recorded'}</dd></div>
            <div><dt className="text-[var(--alo-text-muted)]">Eligible study levels</dt><dd>{record.eligibleLevels && record.eligibleLevels !== '[]' ? record.eligibleLevels : 'Not recorded'}</dd></div>
          </dl>
          {source ? <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--alo-brand)] underline">Recorded official source<ExternalLink className="h-4 w-4" /></a> : <p className="text-sm text-crm-warning-text">Official HTTPS source not recorded.</p>}
        </CardContent></Card>;
      })}</div>
      <nav aria-label="Scholarship pagination" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><p className="text-sm">Page {page} of {Math.max(1, pages)}</p><Button variant="outline" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button></nav>
    </>}
  </div>;
}
