'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function AdminImportCoursesPage() {
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const handleUpload = async () => {
    if(!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/import/courses', { method: 'POST', body: formData });
      const json = await res.json();
      setPreview(json);
    } catch(e){ setPreview({ error: 'Upload failed' }); } finally{ setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">CSV Import Center — Courses — ONE Unified DB, No Orphan Courses</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Import Center — Courses</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">CSV columns: course_code, university_code, campus_name, country_code, study_level, study_area, discipline, name, slug, description, duration_months, delivery_mode, degree_type, tuition_fee, currency, application_fee, deposit_amount, average_scholarship, min_scholarship, max_scholarship, deadline, career_outcomes, work_placement_available, internship_available, co_op_available, high_demand, fast_offer, high_acceptance, low_deposit, no_interview, moi_accepted, university_own_english_test, application_fee_waiver, open_program, status, visibility, source_url, last_verified_at. Every course must have country_id, university_id, campus_id when applicable, study_level_id, study_area_id, discipline_id — never allow orphan course. Validation: Required columns, Country exists, University exists, Course code uniqueness, Numeric fees, Valid dates, Valid status, Valid relationships, Duplicate detection, Source validation.</p>
        </div>
        <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm mb-3">Upload CSV — Courses</h3>
          <Input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files?.[0]||null)} className="bg-white border-[var(--alo-border)] h-11" />
          <Button onClick={handleUpload} disabled={!file||loading} className="mt-4 bg-[var(--alo-brand)] text-white h-12 px-6 font-bold w-full">{loading ? 'Validating...' : 'Upload, Detect Columns, Validate, Preview'}</Button>
          {preview && <div className="mt-6 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4 text-xs"><p className="font-semibold">Import Preview — Validation Result</p><pre className="mt-2 whitespace-pre-wrap text-[11px] bg-white border border-[var(--alo-border)] rounded-xl p-3 max-h-[400px] overflow-auto">{JSON.stringify(preview, null, 2)}</pre></div>}
        </Card>
      </div>
    </div>
  );
}
