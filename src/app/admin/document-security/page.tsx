'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, RefreshCw, Eye } from 'lucide-react';

export default function DocumentSecurityPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents/security');
      const data = await res.json();
      if (data.success) setIncidents(data.incidents || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchIncidents(); }, []);

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-text)] min-h-screen text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Document Security Incidents</h1>
            <p className="text-[var(--alo-text-muted)] text-sm">Private storage • Controlled download/view • Audit every access • Block unauthorized sharing</p>
          </div>
        </div>
        <Button onClick={fetchIncidents} variant="outline" className="border-white/10"><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Security Policy</CardTitle></CardHeader>
        <CardContent className="text-xs text-[var(--alo-placeholder)] space-y-2">
          <p><strong>Allowed Recipients:</strong> student's verified number, approved university/partner contact, official ALO contact, authorized employee, approved application recipient</p>
          <p><strong>Blocked:</strong> external unauthorized, partner-only bypass, non-assigned counselor sharing</p>
          <p><strong>On Incident:</strong> Create document_security_incident, notify Branch Manager + CEO based on severity, audit log, block or warn</p>
          <p><strong>Storage:</strong> Sensitive docs MUST NOT be directly public. No storage path / filesystem path exposed. Controlled endpoints with auth + audit.</p>
        </CardContent>
      </Card>

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Incidents ({incidents.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {incidents.map((inc) => (
            <div key={inc.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold">{inc.documentId} → {inc.recipient} ({inc.recipientType}) • {inc.action}</p>
                <p className="text-[var(--alo-text-muted)]">{inc.reason} • By {inc.attemptedByName} ({inc.attemptedByRole}) • {new Date(inc.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={inc.severity==='critical' ? 'bg-rose-500/20 text-rose-300' : inc.severity==='high' ? 'bg-[var(--alo-cta)]/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'}>{inc.severity}</Badge>
                <Badge className={inc.status==='blocked' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}>{inc.status}</Badge>
                {inc.blocked && <Badge className="bg-rose-500/20 text-rose-300">BLOCKED</Badge>}
              </div>
            </div>
          ))}
          {incidents.length===0 && <p className="text-xs text-[var(--alo-text-muted)]">No incidents — secure</p>}
        </CardContent>
      </Card>
    </div>
  );
}
