'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageSquare, Lock } from 'lucide-react';

export default function CommentsPage() {
  const token = usePortalStore(s => s.token);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch recent applications then comments — simplified
      const resApps = await fetch('/api/applications?limit=20', { headers:{ Authorization:`Bearer ${token}` } });
      const jsonApps = await resApps.json();
      const apps = jsonApps.applications || jsonApps.data || [];
      let allComments:any[] = [];
      for (const app of apps.slice(0,5)) {
        const res = await fetch(`/api/applications/${app.id}/comments`, { headers:{ Authorization:`Bearer ${token}` } });
        if (res.ok) { const j = await res.json(); allComments = [...allComments, ...(j.comments || j.data || []).map((c:any)=>({...c, applicationCode: app.applicationCode}))]; }
      }
      setComments(allComments);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchComments(); },[fetchComments]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Comments — Channels</h1><p className="text-sm text-[var(--alo-text-muted)]">STUDENT_VISIBLE/PARTNER_VISIBLE/COUNSELOR_VISIBLE/APPLICATION_TEAM_INTERNAL/B2B_CONFIDENTIAL/UNIVERSITY/FINANCE/VISA_HANDOVER — visibility filtered backend</p></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--alo-brand)]" /></div> : (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Recent Comments ({comments.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {comments.length===0 ? <p className="text-sm text-[var(--alo-text-muted)] py-6 text-center">No comments found. Nothing here yet.</p> : comments.map((c:any, i:number)=>(
              <div key={i} className={`border rounded-xl p-3 ${c.isB2bConfidential ? 'bg-rose-50 border-rose-200' : 'bg-[var(--alo-page)] border-[var(--alo-border)]'}`}>
                <div className="flex items-center justify-between"><span className="text-xs font-medium">{c.applicationCode || c.applicationId?.substring(0,8)} — {c.role}</span><Badge className={`${c.isB2bConfidential ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-body)]'} text-[11px]`}>{c.isB2bConfidential && <Lock className="w-2.5 h-2.5 mr-1" />}{c.visibility} • {c.commentType}</Badge></div>
                <p className="text-xs mt-2 text-[var(--alo-text)]">{c.commentText}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">{new Date(c.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
