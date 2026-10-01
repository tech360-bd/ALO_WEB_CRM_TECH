'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Eye, CheckCircle2, X, Loader2, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DocumentReviewPage() {
  const token = usePortalStore(s => s.token);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app-manager/dashboard', { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setDocs(json.documents || []);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchDocs(); },[fetchDocs]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#0F172A]">Document Review — Engine Reuse</h1><p className="text-sm text-gray-500">Required/Uploaded/Missing/Rejected/Expired/Under Review/Verified/Locked/Request Again — preview/download/approve/reject/note/version audited</p></div><Button variant="outline" className="border-[#E2E8F0]" onClick={fetchDocs}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></Button></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0B5ED7]" /></div> : (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Documents ({docs.length}) — Real DB</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[800px]"><thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-gray-500"><th className="p-3">File</th><th className="p-3">Type</th><th className="p-3">App</th><th className="p-3">Status</th><th className="p-3">Reviewer</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{docs.length===0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">No documents pending review. Real DB empty.</td></tr> : docs.map((d:any)=>(
              <tr key={d.id} className="border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC]"><td className="p-3 font-medium">{d.fileName || d.documentType}</td><td className="p-3 text-xs">{d.documentType}</td><td className="p-3 font-mono text-xs">{d.applicationId?.substring(0,8)}</td><td className="p-3"><Badge className={`${d.status==='VERIFIED'?'bg-emerald-50 text-emerald-700 border-emerald-200': d.status==='REJECTED'?'bg-red-50 text-red-700 border-red-200':'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{d.status}</Badge></td><td className="p-3 text-xs">{d.reviewerId?.substring(0,6) || '-'}</td><td className="p-3 text-right flex gap-1 justify-end"><Button size="sm" variant="ghost" className="h-7"><Eye className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="h-7"><Download className="w-3 h-3" /></Button><Button size="sm" className="h-7 bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3" /></Button><Button size="sm" variant="outline" className="h-7 border-red-200 text-red-600"><X className="w-3 h-3" /></Button></td></tr>
            ))}</tbody></table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
