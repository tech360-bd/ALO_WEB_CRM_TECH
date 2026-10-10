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
  const [form, setForm] = useState({ documentType: 'nid', filePath: '', fileName: '', expiryDate: '' });

  const load = () => {
    setLoading(true);
    fetch('/api/hrm/documents').then(r=>r.json()).then(j=> { if(j.success){ setDocs(j.data||[]); setMissing(j.missing||[]);} }).finally(()=> setLoading(false));
  };
  useEffect(()=> { load(); }, []);

  const upload = async () => {
    if (!form.filePath) return toast.error('File path required (use /uploads/... or storage URL)');
    setUploading(true);
    try {
      const hr = await fetch('/api/hrm/profile').then(r=>r.json()).catch(()=>null);
      const employeeId = hr?.data?.employeeId;
      const res = await fetch('/api/hrm/documents', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, employeeId })});
      const j = await res.json();
      if (j.success) { toast.success('Document uploaded — version history saved'); load(); } else toast.error(j.error);
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-900">Document Center</h1><p className="text-xs text-slate-500">22 mandatory documents • No mandatory document can be deleted • Version history & audit log • Soft delete only</p></div>
        <Badge className="bg-white border-slate-200 text-slate-700 text-xs">{docs.length} uploaded • {missing.length} missing</Badge>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Upload Document</CardTitle></CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.documentType} onChange={e=> setForm({...form, documentType:e.target.value})} className="h-9 text-xs border border-slate-200 rounded px-2 bg-white">
            {MANDATORY.map(t=> <option key={t} value={t}>{t}</option>)}
            <option value="other">other</option>
          </select>
          <Input placeholder="File path / URL (storage)" value={form.filePath} onChange={e=> setForm({...form, filePath:e.target.value})} className="h-9 text-xs bg-white border-slate-200" />
          <Input placeholder="File name" value={form.fileName} onChange={e=> setForm({...form, fileName:e.target.value})} className="h-9 text-xs bg-white border-slate-200" />
          <Input type="date" value={form.expiryDate} onChange={e=> setForm({...form, expiryDate:e.target.value})} className="h-9 text-xs bg-white border-slate-200" />
          <Button onClick={upload} disabled={uploading} className="bg-[#F97316] hover:bg-[#D04010] text-white h-9 text-xs md:col-span-4">{uploading? 'Uploading...' : 'Upload — Create Version'}</Button>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold">My Documents — Version History</CardTitle><Button variant="outline" size="sm" onClick={load} className="h-7 text-xs">Refresh</Button></CardHeader>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2 text-left">Type</th><th className="p-2">File</th><th className="p-2">Status</th><th className="p-2">Version</th><th className="p-2">Expiry</th><th className="p-2">History</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="p-6 text-center text-slate-400">Loading...</td></tr> : docs.length ? docs.map((d:any)=> (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="p-2 font-medium capitalize">{d.documentType} {d.isMandatory && <Badge variant="outline" className="ml-1 text-xs bg-amber-50 text-amber-700">mandatory</Badge>}</td>
                  <td className="p-2 truncate max-w-[200px]">{d.fileName||d.filePath}</td>
                  <td className="p-2 text-center"><Badge variant="outline" className="text-xs">{d.status}</Badge></td>
                  <td className="p-2 text-center">v{d.version}</td>
                  <td className="p-2 text-center">{d.expiryDate || '-'}</td>
                  <td className="p-2 text-center text-slate-500">{d.versions?.length||0} versions</td>
                </tr>
              )) : <tr><td colSpan={6} className="p-6 text-center text-slate-400">No documents yet — upload mandatory 22 types</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {missing.length>0 && (
        <Card className="bg-amber-50 border-amber-200"><CardContent className="p-3 text-xs text-amber-800"><p className="font-bold">Missing Mandatory Documents ({missing.length})</p><p className="mt-1 flex flex-wrap gap-1">{missing.map(m=> <Badge key={m} variant="outline" className="bg-white text-amber-700 text-xs">{m}</Badge>)}</p></CardContent></Card>
      )}
    </div>
  );
}
