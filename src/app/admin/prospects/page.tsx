'use client';

/**
 * B2B Prospects — human-led Google prospect research queue.
 *
 * Rows arrive ONLY through this import (or manual creation) from research done
 * on official websites. There is no Maps scraper and there never will be one:
 * GOOGLE_MAPS-origin rows are rejected by validation unless they carry only the
 * business's official website. Import never auto-approves a partner — only
 * ADMIN/SUPER_ADMIN may move a record to APPROVED_PARTNER.
 */

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertTriangle, ClipboardCheck, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

const STATUSES = ['ALL', 'DISCOVERED', 'VERIFIED', 'REVIEW_PENDING', 'CONTACTED', 'INTERESTED', 'NEGOTIATION', 'APPROVED_PARTNER', 'REJECTED', 'DO_NOT_CONTACT'] as const;
const NEXT: Record<string, string[]> = {
  DISCOVERED: ['VERIFIED', 'REVIEW_PENDING', 'REJECTED', 'DO_NOT_CONTACT'],
  VERIFIED: ['REVIEW_PENDING', 'CONTACTED', 'REJECTED', 'DO_NOT_CONTACT'],
  REVIEW_PENDING: ['VERIFIED', 'CONTACTED', 'INTERESTED', 'REJECTED', 'DO_NOT_CONTACT'],
  CONTACTED: ['INTERESTED', 'NEGOTIATION', 'REVIEW_PENDING', 'REJECTED', 'DO_NOT_CONTACT'],
  INTERESTED: ['NEGOTIATION', 'APPROVED_PARTNER', 'REJECTED', 'DO_NOT_CONTACT'],
  NEGOTIATION: ['APPROVED_PARTNER', 'REJECTED', 'DO_NOT_CONTACT'],
  APPROVED_PARTNER: ['DO_NOT_CONTACT'],
  REJECTED: ['DISCOVERED', 'DO_NOT_CONTACT'],
  DO_NOT_CONTACT: [],
};

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim()); current = '';
      } else current += ch;
    }
    cells.push(current.trim());
    return cells;
  };
  const headers = split(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
}

const CSV_TEMPLATE = 'organizationName,contactPerson,businessEmail,businessPhone,officialWebsite,country,city,organizationType,sourceType,sourceUrl,researchDate,notes\nExample Education Agency,Amina Rahman,info@exampleagency.com,+8801712345678,https://www.exampleagency.com,Bangladesh,Dhaka,AGENCY,HUMAN_GOOGLE_SEARCH,https://www.exampleagency.com,2026-11-16,Found via official site; verified business listing';

export default function B2bProspectsPage() {
  const [filter, setFilter] = useState<string>('ALL');
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importText, setImportText] = useState('');
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  // Partner approval is an ADMIN/SUPER_ADMIN action (server-enforced). The
  // button is hidden for everyone else; the API rejects them regardless.
  const userType = usePortalStore((s) => s.user?.userType ?? '');
  const isAdmin = userType === 'ADMIN' || userType === 'SUPER_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/prospects${filter !== 'ALL' ? `?relationshipStatus=${filter}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setProspects(data.prospects || []);
      } else {
        toast.error(data.error || 'Could not load prospects.');
      }
    } catch {
      toast.error('Could not load prospects.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const runImport = async (dryRun: boolean) => {
    const rows = parseCsv(importText);
    if (rows.length === 0) {
      toast.error('Paste CSV with a header row first (see the template link).');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dryRun }),
      });
      const data = await res.json();
      if (data.success) {
        if (dryRun) {
          setDryRunResult(data.summary);
          toast.success(`Dry-run: ${data.summary?.valid ?? 0} valid, ${data.summary?.invalid ?? 0} invalid, ${(data.summary?.duplicatesInFile ?? 0) + (data.summary?.duplicatesInDb ?? 0)} duplicates.`);
        } else {
          toast.success(`Created ${data.created ?? 0} prospect record(s).`);
          setImportText('');
          setDryRunResult(null);
          load();
        }
      } else {
        toast.error(data.error || 'Import failed.');
      }
    } catch {
      toast.error('Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const transition = async (id: string, relationshipStatus: string) => {
    try {
      const res = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, relationshipStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated to ${relationshipStatus}.`);
        load();
      } else {
        toast.error(data.error || 'Transition failed.');
      }
    } catch {
      toast.error('Transition failed.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="size-6" /> B2B Prospects — Research Queue</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1 max-w-3xl">
          Human-led discovery of universities, colleges, agencies, consultancies and language providers from their
          official websites. Google Maps/Places data is not imported — rows sourced from Maps carrying business
          contact details are rejected by policy. A prospect never becomes an approved partner automatically;
          partner conversion requires ADMIN/SUPER_ADMIN approval.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Import prospects (CSV)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={CSV_TEMPLATE}
            className="min-h-[120px] font-mono text-xs"
            aria-label="CSV rows to import"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => runImport(true)} disabled={importing}>
              {importing ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Dry-run (validate + dedupe)
            </Button>
            <Button
              variant="cta"
              onClick={() => runImport(false)}
              disabled={importing || !dryRunResult || (dryRunResult?.valid ?? 0) === 0}
              title={!dryRunResult ? 'Run the dry-run first' : undefined}
            >
              Import {dryRunResult ? `${dryRunResult.valid} valid record(s)` : '(dry-run first)'}
            </Button>
            <button className="text-xs underline text-[var(--alo-brand)]" onClick={() => navigator.clipboard?.writeText(CSV_TEMPLATE).then(() => toast.success('Template copied.'))}>Copy CSV template</button>
          </div>
          {dryRunResult && (
            <div className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs">
              <div className="flex flex-wrap gap-3">
                <span>Received: <strong>{dryRunResult.received}</strong></span>
                <span className="text-crm-success-text">Valid: <strong>{dryRunResult.valid}</strong></span>
                <span className="text-crm-danger-text">Invalid: <strong>{dryRunResult.invalid}</strong></span>
                <span className="text-crm-warning-text">Duplicates: <strong>{(dryRunResult.duplicatesInFile ?? 0) + (dryRunResult.duplicatesInDb ?? 0)}</strong></span>
              </div>
              {Array.isArray(dryRunResult.rows) && dryRunResult.rows.some((r: any) => !r.ok) && (
                <ul className="mt-2 list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
                  {dryRunResult.rows.filter((r: any) => !r.ok).slice(0, 25).map((r: any) => (
                    <li key={r.index}>Row {r.index}: {(r.reasons || []).join('; ')}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs border ${filter === s ? 'bg-[var(--alo-brand)] text-white border-[var(--alo-brand)]' : 'border-[var(--alo-border)] text-[var(--alo-body)] hover:bg-[var(--alo-page)]'}`}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--alo-text-muted)]">Loading…</p>
      ) : prospects.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-[var(--alo-text-muted)]"><AlertTriangle className="size-8 mx-auto mb-2" />No prospects in this view. Import a reviewed CSV to start the research queue.</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[var(--alo-border)] rounded-xl">
            <thead className="bg-[var(--alo-page)]">
              <tr>
                {['Organization', 'Type', 'Country', 'Website', 'Status', 'Contact', 'Actions'].map((h) => (
                  <th key={h} className="text-left p-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-t border-[var(--alo-border)] align-top">
                  <td className="p-3 font-medium">{p.organizationName}</td>
                  <td className="p-3">{p.organizationType}</td>
                  <td className="p-3">{p.country}{p.city ? `, ${p.city}` : ''}</td>
                  <td className="p-3 max-w-[220px] truncate"><a href={p.officialWebsite || p.sourceUrl} className="underline text-[var(--alo-brand)]" target="_blank" rel="noreferrer">{p.officialWebsite || p.sourceUrl}</a></td>
                  <td className="p-3"><Badge variant="outline">{p.relationshipStatus}</Badge></td>
                  <td className="p-3 text-xs">{p.businessEmail || '—'}{p.businessPhone ? ` · ${p.businessPhone}` : ''}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(NEXT[p.relationshipStatus] || []).filter((next) => next !== 'APPROVED_PARTNER' || isAdmin).map((next) => (
                        <button
                          key={next}
                          onClick={() => transition(p.id, next)}
                          className="text-[11px] px-2 py-1 rounded border border-[var(--alo-border)] hover:bg-[var(--alo-page)]"
                        >
                          → {next.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--alo-text-muted)] border border-[var(--alo-border)] rounded-xl px-4 py-3 flex items-start gap-2">
        <ShieldCheck className="size-4 mt-0.5 text-crm-success-text" />
        Outreach permission is never implied by import. Before any message, confirm outreachPermission, check
        doNotContact, and use the approved template + opt-out path. Aggregated analytics (Search Console / GA4)
        are never identifiable prospects and are never imported here.
      </p>
    </div>
  );
}
