'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function AdminImportUniversitiesPage() {
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const handleUpload = async () => {
    if(!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/import/universities', { method: 'POST', body: formData });
      const json = await res.json();
      setPreview(json);
    } catch(e){ setPreview({ error: 'Upload failed' }); } finally{ setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">CSV Import Center — Universities — ONE Unified DB</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Import Center — Universities</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Support CSV, Excel where existing infrastructure supports it. Process: Upload, Detect columns, Validate, Preview, Show errors, Confirm import, Save batch, Import, Report result. CSV columns: university_code, country_code, name, slug, logo, website, ranking, ranking_source_url, city, state, address, overview, public_description, partner_description, international_student_url, application_url, scholarship_url, contact_email, admission_notes, status, source_url, last_verified_at. Validation: Required columns, Country exists, Course code uniqueness, Numeric fees, Valid dates, Valid status, Valid relationships, Duplicate detection, Source validation. Show Total rows, Valid rows, Invalid rows, Duplicate rows, Warnings. Do not import invalid rows automatically. Save errors.</p>
        </div>
        <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm mb-3">Upload CSV — Universities</h3>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files?.[0]||null)} className="bg-white border-[var(--alo-border)] h-11" />
          <Button onClick={handleUpload} disabled={!file||loading} className="mt-4 bg-[var(--alo-brand)] text-white h-12 px-6 font-bold w-full">{loading ? 'Validating...' : 'Upload, Detect Columns, Validate, Preview'}</Button>
          {preview && <div className="mt-6 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4 text-xs"><p className="font-semibold">Import Preview — Validation Result</p><pre className="mt-2 whitespace-pre-wrap text-[11px] bg-white border border-[var(--alo-border)] rounded-xl p-3 max-h-[400px] overflow-auto">{JSON.stringify(preview, null, 2)}</pre><p className="mt-3">Total rows: {preview.totalRows||0} • Valid: {preview.validRows||0} • Invalid: {preview.invalidRows||0} • Duplicates: {preview.duplicateRows||0} • Warnings: {preview.warnings||0}</p></div>}
        </Card>
      </div>
    </div>
  );
}
