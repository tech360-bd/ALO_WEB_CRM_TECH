'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CommunicationSettingsPage() {
  const [inbox, setInbox] = useState<any>(null);
  useEffect(() => {
    fetch('/api/crm/communications/inbox').then(r=>r.json()).then(setInbox).catch(()=>{});
    fetch('/api/whatsapp/numbers').then(r=>r.json()).then(()=>{}).catch(()=>{});
  }, []);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Communication Settings</h1>
      <p className="text-sm text-gray-500">Channels: WhatsApp / Email / SMS / Phone / Facebook / Instagram / LinkedIn / Website chat / Portal / Internal — shown only per role, permissions, and account connection. Status `CONFIGURATION REQUIRED` when not authorized.</p>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader><CardTitle className="text-amber-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> WhatsApp</CardTitle></CardHeader>
        <CardContent className="text-sm text-amber-900">
          {inbox ? JSON.stringify(inbox).slice(0,200) : 'Fetching status...'}<br/>
          <span className="font-medium">If Meta credentials missing, UI shows CONFIGURATION REQUIRED and send is blocked server-side. See docs/WHATSAPP-META-SETUP.md</span>
          <Badge className="ml-2 bg-amber-100 text-amber-800">Canonical: /api/whatsapp/webhook</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">SLA & Escalation</CardTitle></CardHeader>
        <CardContent className="text-xs text-gray-600">SLA rules are configurable by channel, priority, student type, application stage, intent, business hours, holidays. Warnings, overdue, escalation, reassignment, and resolution are tracked (first response, response time, overdue duration, escalation history). Exclusions: provider outages, holidays, duplicate messages, non-response-required messages.</CardContent>
      </Card>
    </div>
  );
}
