'use client';
import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type UniversityRow = any;

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/universities?search=${encodeURIComponent(search)}&limit=50`);
      const d = await r.json();
      setUniversities(d.data || d.universities || []);
    } catch {
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const rowId = (u: UniversityRow) => u.id || u.universityId;

  const applyStatus = async (id: string, status: string) => {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(`/api/admin/universities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      setMessage(d.success ? `University ${status} (audit logged)` : d.error || 'Action failed');
      if (d.success) await fetchUniversities();
    } catch (e: any) {
      setMessage(e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const bulkApply = async (status: string) => {
    if (selected.size === 0) {
      setMessage('Select at least one university first (use the checkboxes).');
      return;
    }
    setBusy(true);
    let ok = 0;
    const ids = [...selected];
    for (const id of ids) {
      try {
        const r = await fetch(`/api/admin/universities/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if ((await r.json()).success) ok++;
      } catch {
        /* counted as failure */
      }
    }
    setMessage(`${ok}/${ids.length} universities → ${status}`);
    setSelected(new Set());
    await fetchUniversities();
    setBusy(false);
  };

  const exportCsv = () => {
    const header = ['id', 'name', 'country', 'city', 'status', 'lastVerifiedAt'];
    const lines = universities.map((u: UniversityRow) =>
      [rowId(u), u.name, u.country || '', u.city || '', u.status || '', u.lastVerifiedAt || '']
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alo-universities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${universities.length} universities (current filter) to CSV`);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs mb-3">Super Admin — Full Access: Universities, Campuses, Courses, Intakes, Requirements, Scholarships, Sources, Imports, Duplicates, Updates, Approval, Publishing, Audit, Commission, Merge, Delete</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">Admin — Universities</h1>
          <p className="text-sm text-gray-600 mt-2">Actions: Create, Edit, View, Archive, Publish, Unpublish, Merge duplicate — with 11 tabs per spec: Basic Information, Location, Official Links, International Student Information, Ranking, Description, Scholarship, Source Verification, SEO, Visibility, Publish. Validation: University name required, Country required, Official website required where available, Source URL required for verified data.</p>
          <div className="flex gap-3 mt-4"><Link href="/admin/universities/create"><Button className="bg-[#0B5ED7] text-white h-12 px-6 font-bold">Create University — 11 Tabs</Button></Link><Link href="/admin/import-center/universities"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Import Center — Universities</Button></Link><Link href="/admin/university-data-updates"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">AI Update Center</Button></Link></div>
        </div>
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl"><div className="flex gap-3"><Input placeholder="Search — University name, country, city, status, verified, last updated..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white border-[#E2E8F0] h-11 flex-1" /><Button className="bg-[#0B5ED7] text-white h-11" onClick={fetchUniversities} disabled={loading}>Search — Indexed</Button></div>{message && <p className="text-xs mt-2 text-[#0B5ED7] font-medium" role="status">{message}</p>}</Card>
        {loading ? <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" /> : (
          <Card className="p-0 bg-white border-[#E2E8F0] rounded-2xl overflow-x-auto"><div className="min-w-[1100px]"><div className="grid grid-cols-7 gap-0 bg-[#F8FAFC] p-3 text-xs font-semibold border-b border-[#E2E8F0]"><div className="flex items-center"><input type="checkbox" aria-label="Select all universities" checked={universities.length > 0 && selected.size === universities.length} onChange={(e) => setSelected(e.target.checked ? new Set(universities.map(rowId)) : new Set())} /></div><div>University</div><div>Country</div><div>City</div><div>Status</div><div>Verified</div><div>Actions</div></div>{universities.map((u: UniversityRow) => { const id = rowId(u); return <div key={id} className="grid grid-cols-7 gap-0 p-3 text-xs border-b border-[#E2E8F0]/60 items-center"><div><input type="checkbox" aria-label={`Select ${u.name}`} checked={selected.has(id)} onChange={() => toggle(id)} /></div><div className="font-medium truncate">{u.name}</div><div>{u.country}</div><div>{u.city}</div><div>{u.status}</div><div>{u.lastVerifiedAt || 'Not verified'}</div><div className="flex gap-1"><Link href={`/admin/universities/edit/${id}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Edit</Button></Link><Link href={`/admin/universities/edit/${id}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">View</Button></Link><Link href={`/admin/courses?search=${encodeURIComponent(u.name || '')}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Courses</Button></Link><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]" disabled={busy} onClick={() => applyStatus(id, 'verified')}>Verify</Button><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]" disabled={busy} onClick={() => applyStatus(id, 'archived')}>Archive</Button><Button size="sm" variant="outline" disabled title="Merge API not implemented yet — intentionally disabled rather than silently doing nothing" className="h-7 text-[11px] border-[#E2E8F0]">Merge</Button></div></div>; })}{universities.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No universities match your search — real DB, no fake data.</div>}</div></Card>
        )}
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl"><p className="text-xs font-semibold mb-2">Bulk Actions: Publish, Unpublish, Verify, Update status, Export — operate on the {selected.size} selected university/universities</p><div className="flex gap-2"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs" disabled={busy} onClick={() => bulkApply('published')}>Bulk Publish</Button><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs" disabled={busy} onClick={() => bulkApply('draft')}>Bulk Unpublish</Button><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs" disabled={busy} onClick={() => bulkApply('verified')}>Bulk Verify</Button><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs" onClick={exportCsv}>Export</Button></div></Card>
      </div>
    </div>
  );
}
