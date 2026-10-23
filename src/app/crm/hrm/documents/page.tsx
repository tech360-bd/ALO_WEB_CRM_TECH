'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const MANDATORY = ['passport','nid','photo','cv','certificates','experience_letter','appointment_letter','confirmation_letter','increment_letter','promotion_letter','transfer_letter','warning_letter','termination_letter','employment_agreement','nda','confidentiality_agreement','device_agreement','it_policy','data_privacy_agreement','international_agreement','bangladesh_agreement','exit_clearance'];

export default function HrmDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ documentType: 'nid', title: '', expiryDate: '' });

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hrm/documents', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'Documents are unavailable for this account.');
      setDocs(payload.data || []);
      setMissing(payload.missing || []);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Documents could not be loaded.');
      setDocs([]);
      setMissing([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const upload = async () => {
    if (!file) return toast.error('Choose a document file to upload.');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('documentType', form.documentType);
      formData.set('title', form.title);
      formData.set('expiryDate', form.expiryDate);
      const response = await fetch('/api/employee/documents', { method: 'POST', body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'Document upload failed.');
      toast.success('Private document uploaded for review.');
      setFile(null);
      setForm({ documentType: 'nid', title: '', expiryDate: '' });
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Document upload failed.');
    } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[var(--alo-text)]">Document Center</h1><p className="text-xs text-[var(--alo-text-muted)]">Private employee files are uploaded as actual bytes and downloaded through authenticated, audited endpoints. Mandatory documents cannot be deleted.</p></div><Badge className="bg-white border-[var(--alo-border)] text-[var(--alo-body)] text-xs">{docs.length} uploaded · {missing.length} missing from configured checklist</Badge></div>

      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Upload Document</CardTitle></CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })} className="h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white">{MANDATORY.map((type) => <option key={type} value={type}>{type}</option>)}<option value="other">other</option></select>
          <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Document title (optional)" maxLength={191} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Button onClick={() => void upload()} disabled={uploading || !file} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white h-9 text-xs md:col-span-4">{uploading ? 'Uploading…' : 'Upload private file'}</Button>
        </CardContent>
      </Card>

      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold">My Documents — Version History</CardTitle><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="h-7 text-xs">Refresh</Button></CardHeader>
        <CardContent className="p-0 overflow-auto"><table className="w-full text-xs"><thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Type</th><th className="p-2">File</th><th className="p-2">Status</th><th className="p-2">Version</th><th className="p-2">Expiry</th><th className="p-2">History</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={6} className="p-6 text-center text-[var(--alo-text-muted)]">Loading…</td></tr> : docs.length ? docs.map((doc: any) => <tr key={doc.id} className="border-t border-[var(--alo-border)]"><td className="p-2 font-medium capitalize">{doc.documentType} {doc.isMandatory && <Badge variant="outline" className="ml-1 text-xs bg-amber-50 text-amber-700">mandatory</Badge>}</td><td className="p-2 truncate max-w-[200px]">{doc.downloadUrl ? <a href={doc.downloadUrl} className="text-[var(--alo-brand)] underline" rel="noreferrer">{doc.fileName || doc.title || 'Download file'}</a> : (doc.fileName || doc.title || 'No file recorded')}</td><td className="p-2 text-center"><Badge variant="outline" className="text-xs">{doc.status}</Badge></td><td className="p-2 text-center">v{doc.version}</td><td className="p-2 text-center">{doc.expiryDate || 'Not recorded'}</td><td className="p-2 text-center text-[var(--alo-text-muted)]">{doc.versions?.length || 0} versions</td></tr>) : <tr><td colSpan={6} className="p-6 text-center text-[var(--alo-text-muted)]">No documents recorded.</td></tr>}</tbody>
        </table></CardContent>
      </Card>

      {missing.length > 0 && <Card className="bg-amber-50 border-amber-200"><CardContent className="p-3 text-xs text-amber-800"><p className="font-bold">Checklist items with no recorded upload ({missing.length})</p><p className="mt-1 flex flex-wrap gap-1">{missing.map((item) => <Badge key={item} variant="outline" className="bg-white text-amber-700 text-xs">{item}</Badge>)}</p></CardContent></Card>}
    </div>
  );
}
