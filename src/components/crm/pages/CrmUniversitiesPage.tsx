'use client';

import { useEffect, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import UniversityInformation from './UniversityInformation';

interface UniversityRecord {
  id: string; universityId: string; name: string; city: string; country: string;
  overview: string; description: string; verificationStatus: string; publicationStatus: string;
  _count?: { courses: number };
}
export default function CrmUniversitiesPage() {
  const [records, setRecords] = useState<UniversityRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(false); setRecords([]); setTotal(null);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '24', search, country });
        const response = await fetch(`/api/crm/universities?${params}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.data) || !Number.isSafeInteger(body.pagination?.total) || !Number.isSafeInteger(body.pagination?.pages)) throw new Error('Unavailable');
        if (!controller.signal.aborted) { setRecords(body.data); setTotal(body.pagination.total); setPages(body.pagination.pages); }
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, search, country, retry]);
  if (selected) return <UniversityInformation universityId={selected} onBack={() => setSelected(null)} />;
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">All university information</h1><p className="mt-2 text-sm text-[var(--alo-text-muted)]">Browse all stored universities, then open a profile for admissions, courses, campuses, fees, scholarships, rankings and official evidence. This directory is not a claim of worldwide coverage.</p></header>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="mb-2 block text-sm" htmlFor="university-search">Search universities</label><div className="relative"><Search className="absolute left-3 top-4 h-4 w-4" /><Input id="university-search" value={search} maxLength={200} className="pl-10" placeholder="Name, university ID or city" onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></div>
      <div><label className="mb-2 block text-sm" htmlFor="university-country">Country</label><Input id="university-country" value={country} maxLength={100} placeholder="Any country — type to filter" onChange={(event) => { setCountry(event.target.value); setPage(1); }} /></div>
    </div>
    {loading ? <p role="status">Loading university records…</p> : error ? <div role="alert" className="space-y-3"><p>University records could not be loaded. This does not mean the catalogue is empty.</p><Button onClick={() => setRetry((value) => value + 1)}>Retry</Button></div> : <>
      <p role="status" className="text-sm text-[var(--alo-text-muted)]">{total} matching stored universities</p>
      {!records.length && <p>No matching records. Try another search or country.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((record) => <Card key={record.id}><CardContent className="space-y-3 p-5">
        <Building2 className="h-5 w-5 text-[var(--alo-brand)]" /><h2 className="font-semibold">{record.name}</h2>
        <p className="text-sm">{[record.city, record.country].filter(Boolean).join(', ') || 'Location not recorded'}</p>
        <p className="line-clamp-3 text-sm text-[var(--alo-text-muted)]">{record.overview || record.description || 'Overview not recorded'}</p>
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{record.verificationStatus || 'NEEDS_REVIEW'}</Badge><Badge variant="outline">{record.publicationStatus || 'draft'}</Badge></div>
        <p className="text-sm">{record._count?.courses ?? 'Unknown'} stored courses</p>
        <Button variant="outline" onClick={() => setSelected(record.universityId)}>View all university information</Button>
      </CardContent></Card>)}</div>
      <nav aria-label="University pagination" className="flex items-center justify-between gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-sm">Page {page} of {Math.max(1, pages)}</span><Button variant="outline" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button></nav>
    </>}
  </div>;
}
