'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, CheckCircle2, AlertTriangle, Users, Database, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OldCrmImportCenterPage() {
  const { token } = usePortalStore();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [rawRows, setRawRows] = useState('');

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/import-center', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBatches(json.batches || []);
      }
    } catch (err) {
      console.error('Failed to load import batches:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleCreateImportPreview = async () => {
    setImporting(true);
    try {
      const rows = JSON.parse(rawRows);
      if (!Array.isArray(rows) || rows.length === 0) {
        toast.error('Paste a JSON array of imported student rows before creating a staging preview.');
        return;
      }

      const res = await fetch('/api/admin/import-center', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceCrmName: 'Old CRM System Export',
          fileName: 'operator_uploaded_rows.json',
          rows,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Import Preview Created: ${json.summary.newCount} New, ${json.summary.matchedCount} Matched, ${json.summary.duplicateCount} Duplicates.`);
        loadBatches();
      } else {
        toast.error(json.error || 'Import failed');
      }
    } catch (err) {
      toast.error('Import failed. Confirm the pasted rows are valid JSON.');
    } finally {
      setImporting(false);
    }
  };

  const handleApproveBatch = async (batchId: string) => {
    try {
      const res = await fetch('/api/admin/import-center', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batchId, action: 'approve' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        loadBatches();
      } else {
        toast.error(json.error || 'Approval failed');
      }
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  return (
    <div className="space-y-6 bg-[var(--alo-page)]/50 min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-[var(--alo-border)] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Old CRM Student Migration Import Center
          </h1>
          <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">
            Import old CRM records into staging, deduplicate, preview risks, and generate AE-YYYY000001 IDs only after Super Admin approval.
          </p>
        </div>

        <Button
 className="bg-indigo-600 hover:bg-indigo-700 text-white "
 onClick={handleCreateImportPreview}
 disabled={importing}
 >

          {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
          Create Staging Preview
        </Button>
      </div>

      <Card className="bg-white border-[var(--alo-border)] shadow-xs">
        <CardHeader className="pb-3 border-b border-[var(--alo-border)]">
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">Paste Normalized Old-CRM Rows</CardTitle>
          <CardDescription className="text-xs text-[var(--alo-text-muted)]">
            This panel no longer ships demo students. Paste validated CSV/Excel output as a JSON array, then create a staging-only preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <textarea
            value={rawRows}
            onChange={(event) => setRawRows(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-[var(--alo-border-strong)] p-3 font-mono text-xs"
            placeholder='[{"oldCrmId":"OLD-001","name":"Student Name","phone":"+880...","email":"student@example.com","passportNumber":"...","countryInterest":"United Kingdom","courseInterest":"MSc ..."}]'
          />
          <p className="text-[11px] text-[var(--alo-text-muted)]">
            Required for new portal activation: student name and email. Rows without email remain in review and will not create synthetic portal-user emails.
          </p>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card className="bg-white border-[var(--alo-border)] shadow-xs">
        <CardHeader className="pb-3 border-b border-[var(--alo-border)]">
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">Import Batches Preview &amp; Staging Queue</CardTitle>
          <CardDescription className="text-xs text-[var(--alo-text-muted)]">Super Admin must review and approve final import/merge before inserting into live DB.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[var(--alo-page)]">
              <TableRow>
                <TableHead className="text-xs font-semibold">Source / File</TableHead>
                <TableHead className="text-xs font-semibold">Total Rows</TableHead>
                <TableHead className="text-xs font-semibold">New Students</TableHead>
                <TableHead className="text-xs font-semibold">Matched</TableHead>
                <TableHead className="text-xs font-semibold">Duplicate Risks</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-[var(--alo-text-muted)]">
                    No import batches found. Paste validated rows above and create a staging preview.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <span className="text-xs font-bold text-[var(--alo-text)] block">{b.sourceCrmName}</span>
                        <span className="text-[11px] text-[var(--alo-text-muted)] font-mono">{b.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[var(--alo-text)]">{b.totalRows}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700">{b.newCount} New</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[11px] bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">{b.matchedCount} Matched</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700">{b.duplicateCount} Risk</Badge></TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {b.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.status === 'pending_review' ? (
                        <Button size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleApproveBatch(b.id)}>
                          Approve Import
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Imported
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
